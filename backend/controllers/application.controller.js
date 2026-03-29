import db from "../config/db.js";

export const createApplication = (req, res) => {

  const {
    name,
    fayida_id,
    kebele_id,
    address,
    marital_status,
    date_of_birth
  } = req.body;

  const files = req.files;
  // ================= DUPLICATION CHECK =================
  // Step 1: If Fayida ID exists → enforce uniqueness
  if (fayida_id) {

    db.query(
      "SELECT * FROM applicants WHERE fayida_id = ?",
      [fayida_id],
      (err, results) => {

        if (err) return res.status(500).json(err);

        if (results.length > 0) {
          return res.status(400).json({
            message: "ይህ Fayida መለያ ቀድሞ ተመዝግቧል። ማመልከቻው ተከልክሏል።"
          });
        }

        // proceed to kebele check after FIN validation
        checkKebeleAndInsert();
      }
    );

  } else {
    // If no Fayida ID → use fallback uniqueness rule
    checkKebeleAndInsert();
  }

  // ================= KELEBELE + DOB CHECK =================
  function checkKebeleAndInsert() {

    db.query(
      `SELECT * FROM applicants 
       WHERE name = ? 
       AND kebele_id = ? 
       AND date_of_birth = ?`,
      [name, kebele_id, date_of_birth],
      (err, results) => {

        if (err) return res.status(500).json(err);

        if (results.length > 0) {
          return res.status(400).json({
            message: "ተመሳሳይ አመልካች (ስም + የትውልድ ቀን + ቀበሌ መለያ) ቀድሞ ተመዝግቧል። ማመልከቻው ተከልክሏል።"
          });
        }

        // If no duplicates → proceed to insert
        insertApplication();
      }
    );
  }

  // ================= INSERT FLOW =================
  function insertApplication() {

    db.query(
      "INSERT INTO applicants (name,fayida_id,kebele_id,address,marital_status,date_of_birth) VALUES (?,?,?,?,?,?)",
      [name, fayida_id, kebele_id, address, marital_status, date_of_birth],
      (err, result) => {

        if (err) return res.status(500).json(err);

        const applicantId = result.insertId;

        db.query(
          "INSERT INTO applications (applicant_id,status) VALUES (?,?)",
          [applicantId, "Pending"],
          (err, result) => {

            if (err) return res.status(500).json(err);

            const applicationId = result.insertId;

            if (files) {

              const docs = [];

              if (files.signature) {
                docs.push([
                  applicationId,
                  "signature",
                  files.signature[0].filename
                ]);
              }

              if (files.fayida_doc) {
                docs.push([
                  applicationId,
                  "fayida_id",
                  files.fayida_doc[0].filename
                ]);
              }

              if (files.kebele_doc) {
                docs.push([
                  applicationId,
                  "kebele_id",
                  files.kebele_doc[0].filename
                ]);
              }

              if (docs.length > 0) {
                db.query(
                  "INSERT INTO documents (application_id,doc_type,file_path) VALUES ?",
                  [docs]
                );
              }
            }

            res.json({
              message: "ማመልከቻ በተሳካ ሁኔታ ተመዝግቧል።"
            });

          }
        );
      }
    );
  }
};