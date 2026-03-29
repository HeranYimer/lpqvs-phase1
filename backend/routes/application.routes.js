import express from "express"; 
import upload from "../config/upload.js";
import { createApplication } from "../controllers/application.controller.js";
import db from "../config/db.js";
import fs from "fs";
import path from "path";
const router = express.Router();
function requireAdmin(req, res, next) {
  const user = req.session.user;

  if (!user || user.role !== "Admin") {
    return res.status(403).json({ message: "አልተፈቀደም" });
  }

  next();
}
// Multer middleware
const uploadMiddleware = upload.fields([
  { name: "signature", maxCount: 1 },
  { name: "fayida_doc", maxCount: 1 },
  { name: "kebele_doc", maxCount: 1 }
]);

// ================= CREATE =================
router.post("/applications", (req, res) => {
  uploadMiddleware(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          message: "ፋይሉ ከ 5MB በላይ መሆን አይችልም"
        });
      }
      return res.status(400).json({ message: err.message || "ፋይል ሰቀላ ስህተት" });
    }

    createApplication(req, res);
  });
});
// ================= UPLOAD MISSING DOCUMENTS =================
router.post("/applications/:id/upload", (req, res) => {
  const appId = req.params.id;

  uploadMiddleware(req, res, (err) => {
    if (err) return res.status(400).json({ message: "Upload error" });

    const files = req.files;
    const docs = [];

    if (files?.signature) {
      docs.push([appId, "signature", files.signature[0].filename]);
    }

    if (files?.fayida_doc) {
      docs.push([appId, "fayida_id", files.fayida_doc[0].filename]);
    }

    if (files?.kebele_doc) {
      docs.push([appId, "kebele_id", files.kebele_doc[0].filename]);
    }

    if (docs.length === 0) {
      return res.status(400).json({ message: "ምንም ፋይሎች አልተመረጡም" });
    }

    db.query(
      "INSERT INTO documents (application_id, doc_type, file_path) VALUES ?",
      [docs],
      (err) => {
        if (err) return res.status(500).json({ message: "የዳታቤዝ ስህተት" });

        res.json({ message: "ሰነዶች በተሳካ ሁኔታ ተሰቅለዋል" });
      }
    );
  });
});
// ================= VERIFY =================
router.post("/applications/:id/verify", (req, res) => {
  
  const applicationId = req.params.id;
  const checks = req.body.checks;

  if (!checks || checks.length !== 4) {
    return res.status(400).json({ message: "All 4 checklist items required" });
  }

  db.query(
    "DELETE FROM verifications WHERE application_id = ?",
    [applicationId],
    (err) => {
      if (err) return res.status(500).json({ message: "Delete error" });

      const values = checks.map(c => [
        applicationId,
        c.item_name,
        c.status === "verified" ? 1 : 0,
        1,
        new Date(),
        c.comment
      ]);

      db.query(
        `INSERT INTO verifications 
        (application_id, check_type, verified, verified_by, verified_at, comments)
        VALUES ?`,
        [values],
        (err) => {
          if (err) return res.status(500).json({ message: "Insert error" });

          const allVerified = checks.every(c => c.status === "verified");
          const eligibility = allVerified ? "Eligible" : "Not Eligible";

          db.query(
            "UPDATE applications SET eligibility = ? WHERE id = ?",
            [eligibility, applicationId],
            (err) => {
              if (err) return res.status(500).json({ message: "የማዘመን ስህተት" });

              res.json({
                message: "ማረጋገጫ ተቀምጧል",
                eligibility
              });
            }
          );
        }
      );
    }
  );
});

// ================= DECISION =================
router.post("/applications/:id/decision", (req, res) => {
  const role = req.session.user?.role;
  const userId = req.session.user?.id;
  const applicationId = req.params.id;
  const { decision, comment } = req.body;

  if (role !== "Supervisor") {
    return res.status(403).json({ message: "አልተፈቀደም" });
  }

  if (!decision || !["Approved", "Rejected"].includes(decision)) {
    return res.status(400).json({ message: "የተሳሳተ ውሳኔ" });
  }

  db.query(
    `UPDATE applications 
     SET status = ?, 
         decision_date = NOW(), 
         notes = ?
     WHERE id = ?`,
    [decision, comment || null, applicationId],
    (err) => {
      if (err) return res.status(500).json({ message: "የዳታቤዝ ስህተት" });

      // ================= AUDIT LOG (NEW) =================
      db.query(
        "INSERT INTO audit_logs (action, user_id) VALUES (?, ?)",
        [`Application ${decision} (ID: ${applicationId})`, userId],
        (logErr) => {
          if (logErr) console.error("የኦዲት ምዝግብ ማስታወሻ ስህተት:", logErr);
        }
      );
      // ==================================================

      res.json({
        message: "ውሳኔ በተሳካ ሁኔታ ተመዝግቧል።",
        status: decision
      });
    }
  );
});

// ================= SINGLE =================
router.get("/applications/:id", (req, res) => {
  const id = req.params.id;

  db.query(
    `SELECT 
      applications.id,
      applications.status,
      applications.eligibility,
      applications.notes,
      applications.decision_date,
      applications.created_at,
      applicants.name,
      applicants.fayida_id,
      applicants.kebele_id,
      applicants.address,
      applicants.marital_status,
applicants.date_of_birth
     FROM applications
     JOIN applicants ON applications.applicant_id = applicants.id
     WHERE applications.id = ?`,
    [id],
    (err, result) => {
      if (err) return res.status(500).json({ message: "የዳታቤዝ ስህተት" });
      res.json(result[0]);
    }
  );
});

// ================= LIST =================
router.get("/applications", (req, res) => {
  db.query(
    `SELECT applications.id, applicants.name, applications.status, applicants.address
     FROM applications
     JOIN applicants ON applications.applicant_id = applicants.id`,
    (err, results) => {
      if (err) return res.status(500).json({ message: "የዳታቤዝ ስህተት" });
      res.json(results);
    }
  );
});

// ================= VERIFICATIONS =================
router.get("/applications/:id/verifications", (req, res) => {
  const appId = req.params.id;

  db.query(
    "SELECT check_type, verified, comments FROM verifications WHERE application_id = ?",
    [appId],
    (err, results) => {
      if (err) return res.status(500).json({ message: "የዳታቤዝ ስህተት" });
      res.json(results);
    }
  );
});

// ================= DOCUMENTS =================
router.get("/applications/:id/documents", (req, res) => {
  const appId = req.params.id;

  db.query(
    "SELECT * FROM documents WHERE application_id = ?",
    [appId],
    (err, results) => {
      if (err) return res.status(500).json({ message: "የዳታቤዝ ስህተት" });
      res.json(results);
    }
  );
});


// =======================================================
// 🔵 REPORTING (NEW - SRS COMPLIANT)
// =======================================================

// AC1: total, pending, approved, rejected
// ================= REPORT SUMMARY =================
router.get("/reports/summary", (req, res) => {

  const summaryQuery = `
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'Approved' THEN 1 ELSE 0 END) as approved,
      SUM(CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END) as rejected
    FROM applications
  `;

  const dailyQuery = `
    SELECT DATE(created_at) as date, COUNT(*) as count
    FROM applications
    WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `;

  db.query(summaryQuery, (err, summaryResult) => {
    if (err) return res.status(500).json({ message: "የዳታቤዝ ስህተት" });

    db.query(dailyQuery, (err, dailyResult) => {
      if (err) return res.status(500).json({ message: "የዳታቤዝ ስህተት" });

      res.json({
        ...summaryResult[0],
        daily: dailyResult
      });
    });
  });

});
// ================= REPORT FILTER =================
router.get("/reports/filter", (req, res) => {
  const { from, to } = req.query;

  if (!from || !to) {
    return res.status(400).json({ message: "ከ እና እስከ ቀናት ያስፈልጋል" });
  }

  const fromDate = from + " 00:00:00";
  const toDate = to + " 23:59:59";

  db.query(
    `SELECT DATE(created_at) as date, COUNT(*) as count
     FROM applications
     WHERE created_at BETWEEN ? AND ?
     GROUP BY DATE(created_at)
     ORDER BY date ASC`,
    [fromDate, toDate],
    (err, results) => {
      if (err) {
        return res.status(500).json({ message: "የዳታቤዝ ስህተት" });
      }

      console.log("FILTER RESULT:", results);

      res.json(results);
    }
  );
});
router.get("/reports/range", (req, res) => {

  const { from, to } = req.query;

  db.query(
    `SELECT DATE(created_at) as date, COUNT(*) as count
     FROM applications
     WHERE DATE(created_at) BETWEEN ? AND ?
     GROUP BY DATE(created_at)
     ORDER BY date ASC`,
    [from, to],
    (err, results) => {
      if (err) return res.status(500).json({ message: "የዳታቤዝ ስህተት" });
      res.json(results);
    }
  );

});
// AC2: last 7 days counts
router.get("/reports/daily", (req, res) => {
  db.query(
    `SELECT 
      DATE(created_at) as date,
      COUNT(*) as count
     FROM applications
     WHERE created_at >= CURDATE() - INTERVAL 7 DAY
     GROUP BY DATE(created_at)
     ORDER BY date ASC`,
    (err, results) => {
      if (err) return res.status(500).json({ message: "የዳታቤዝ ስህተት" });
      res.json(results);
    }
  );
});

// ==========================
// Dashboard stats
// Example
router.get("/dashboard-stats", (req, res) => {

  db.query("SELECT COUNT(*) AS total FROM users", (err1, userResult) => {
    if (err1) {
      console.error(err1);
      return res.status(500).json({ message: "የዳታቤዝ ስህተት (users)" });
    }

    db.query(
      "SELECT COUNT(*) AS today FROM applications WHERE DATE(created_at)=CURDATE()",
      (err2, appResult) => {
        if (err2) {
          console.error(err2);
          return res.status(500).json({ message: "የዳታቤዝ ስህተት (applications)" });
        }

        res.json({
          totalUsers: userResult[0].total,
          todayEntries: appResult[0].today
        });
      }
    );

  });

});

// Storage usage
router.get("/storage-usage", (req, res) => {

  const uploadPath = path.join(process.cwd(), "uploads");

  let totalSize = 0;

  function calculateSize(dir) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);

      if (stats.isDirectory()) {
        calculateSize(filePath);
      } else {
        totalSize += stats.size;
      }
    });
  }

  try {
    calculateSize(uploadPath);

    const sizeMB = (totalSize / (1024 * 1024)).toFixed(2);

    res.json({
      usage: sizeMB + " MB"
    });

  } catch (err) {
    res.json({ usage: "0 MB" });
  }
});
// ================= AUDIT LOGS (ADMIN ONLY) =================
router.get("/audit-logs", requireAdmin, (req, res) => {

  db.query(
    `SELECT 
        audit_logs.id,
        users.username,
        audit_logs.action,
        audit_logs.created_at
     FROM audit_logs
     JOIN users ON audit_logs.user_id = users.id
     ORDER BY audit_logs.created_at DESC`,
    (err, results) => {

      if (err) {
        console.error(err);
        return res.status(500).json({ message: "የዳታቤዝ ስህተት" });
      }

      res.json(results); // ALWAYS ARRAY
    }
  );
});
// ================= ADMIN GENERAL STATUS =================
router.get("/admin-overview", requireAdmin, (req, res) => {

  db.query(`
    SELECT 
      COUNT(*) AS total,
      SUM(status = 'Pending') AS pending,
      SUM(status = 'Approved') AS approved,
      SUM(status = 'Rejected') AS rejected
    FROM applications
  `, (err, result) => {

    if (err) {
      return res.status(500).json({ message: "የዳታቤዝ ስህተት" });
    }

    res.json(result[0]);
  });

});
// ================= DELETE APPLICATION =================
router.delete("/applications/:id", requireAdmin, (req, res) => {

  // ================= DEBUG LOG =================
  const applicationId = req.params.id;
  console.log("DELETE HIT:", applicationId);
  console.log("USER:", req.session.user?.id);

  const userId = req.session.user.id;

  db.query(
    "SELECT applicant_id, created_at FROM applications WHERE id = ?",
    [applicationId],
    (err, result) => {

      // ================= የዳታቤዝ ስህተት DEBUG =================
      if (err) {
        console.error("SELECT የዳታቤዝ ስህተት:", err);
        return res.status(500).json({ message: "የዳታቤዝ ስህተት (select)" });
      }

      if (!result || result.length === 0) {
        return res.status(404).json({
          message: "የማመልከቻ መረጃ አልተገኘም"
        });
      }

      console.log("SELECT RESULT:", result[0]);

      // ================= DATE CHECK =================
      const createdAtValue = result[0].created_at;

      if (!createdAtValue) {
        return res.status(500).json({
          message: "created_at ባዶ ነው"
        });
      }

      const createdAt = new Date(createdAtValue);
      const now = new Date();

      if (isNaN(createdAt.getTime())) {
        return res.status(500).json({
          message: "ልክ ያልሆነ created_at ቅርጸት"
        });
      }

      const diffDays = (now - createdAt) / (1000 * 60 * 60 * 24);

      console.log("Diff Days:", diffDays);

      // 🔥 2 DAYS RULE (ACTIVE)
      // if (diffDays < 2) {
      //   return res.status(403).json({
      //     message: "ይህ ማመልከቻ ከ2 ቀን በታች ስለሆነ ማጥፋት አይቻልም (ሙከራ ህግ)"
      //   });
      // }

      // ================= 10 YEAR RULE (COMMENTED) =================
      
      const diffYears = diffDays / 365;

      if (diffYears < 10) {
        return res.status(403).json({
          message: "ይህ ማመልከቻ ከ10 ዓመት በታች ስለሆነ ማጥፋት አይቻልም"
        });
      }
    

      const applicantId = result[0].applicant_id;

      console.log("Applicant ID:", applicantId);

      // ================= DELETE APPLICATION =================
     db.query(
  "DELETE FROM documents WHERE application_id = ?",
  [applicationId],
  (err) => {
    if (err) console.error("ሰነዶችን የማጥፋት ስህተት:", err);

    db.query(
      "DELETE FROM verifications WHERE application_id = ?",
      [applicationId],
      (err) => {
        if (err) console.error("ማረጋገጫዎችን የማጥፋት ስህተት:", err);

        db.query(
          "DELETE FROM applicants WHERE id = ?",
          [applicantId],
          (err) => {
            if (err) console.error("አመልካቾችን የማጥፋት ስህተት:", err);

            db.query(
              "DELETE FROM applications WHERE id = ?",
              [applicationId],
              (err) => {
                if (err) {
                  console.error("ማመልከቻዎችን የማጥፋት ስህተት:", err);
                  return res.status(500).json({ message: "Delete failed" });
                }

                db.query(
                  "INSERT INTO audit_logs (action, user_id) VALUES (?, ?)",
                  [`Deleted Application ID ${applicationId}`, userId]
                );

                return res.json({ message: "በተሳካ ሁኔታ ተሰርዟል" });
              }
            );
          }
        );
      }
    );
  }
);
    }
  );
});
export default router;