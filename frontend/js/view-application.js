const params = new URLSearchParams(window.location.search);
const applicationId = params.get("id");
const role = (localStorage.getItem("role") || "").toLowerCase();

// hide decision section if not supervisor
if (role !== "supervisor") {
  document.getElementById("decisionSection").style.display = "none";
}

// checklist containers
const checklistForm = document.getElementById("checklistSection");
const checklistView = document.getElementById("checklistView");
const saveBtn = document.getElementById("saveVerification");

// role-based UI
if (role === "supervisor") {
  checklistForm.style.display = "none";
  checklistView.style.display = "block";
} else {
  checklistForm.style.display = "block";
  checklistView.style.display = "none";
}

// =======================
// LOAD APPLICATION DETAILS
// =======================
async function loadApplicationDetails() {
  try {
    const res = await fetch(`http://localhost:5000/api/applications/${applicationId}`);
    const app = await res.json();

    const detailsDiv = document.getElementById("details");

    detailsDiv.innerHTML = `
      <p><strong>ID:</strong> ${app.id}</p>
      <p><strong>ስም:</strong> ${app.name}</p>
      <p><strong>ፋይዳ:</strong> ${app.fayida_id || "-"}</p>
      <p><strong>ቀበሌ:</strong> ${app.kebele_id}</p>
      <p><strong>አድራሻ:</strong> ${app.address}</p>
      <p><strong>የጋብቻ ሁኔታ:</strong> ${app.marital_status}</p>
      <p><strong>ሁኔታ:</strong> ${app.status}</p>
      <p><strong>Eligibility:</strong> ${app.eligibility || "Not evaluated"}</p>
      <p><strong>Decision:</strong> ${app.status || "Pending"}</p>
      <p><strong>Comment:</strong> ${app.notes || "-"}</p>
    `;
  } catch (err) {
    console.error("Error loading application:", err);
  }
}

// =======================
// LOAD DOCUMENTS
// =======================
async function loadDocuments() {
  try {
    const res = await fetch(`http://localhost:5000/api/applications/${applicationId}/documents`);
    const docs = await res.json();

    const container = document.getElementById("docs");
    container.innerHTML = "";

    if (docs.length === 0) {
      container.innerHTML = "<p>No documents uploaded</p>";
      return;
    }

    docs.forEach(doc => {
      const link = document.createElement("a");
      link.href = `http://localhost:5000/uploads/${doc.file_path}`;
      link.target = "_blank";
      link.innerText = doc.doc_type;

      container.appendChild(link);
      container.appendChild(document.createElement("br"));
    });

  } catch (err) {
    console.error("Error loading documents:", err);
  }
}

// =======================
// SAVE VERIFICATION (OFFICER)
// =======================
document.getElementById("saveVerification").addEventListener("click", async () => {

  const checks = [
    {
      item_name: "land",
      status: document.getElementById("land_status").value,
      comment: document.getElementById("land_comment").value
    },
    {
      item_name: "marital",
      status: document.getElementById("marital_status_check").value,
      comment: document.getElementById("marital_comment").value
    },
    {
      item_name: "kebele",
      status: document.getElementById("kebele_status").value,
      comment: document.getElementById("kebele_comment").value
    },
    {
      item_name: "fayida",
      status: document.getElementById("fayida_status").value,
      comment: document.getElementById("fayida_comment").value
    }
  ];

  for (let c of checks) {
    if (!c.status) {
      alert("Please select all checklist items");
      return;
    }
  }

  try {
    const res = await fetch(`http://localhost:5000/api/applications/${applicationId}/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ checks })
    });

    const data = await res.json();

    if (res.ok) {
      alert(`Verification saved. Result: ${data.eligibility}`);
      loadVerificationData(); // refresh view
    } else {
      alert(data.message || "Error saving verification");
    }

  } catch (err) {
    console.error(err);
    alert("Server error");
  }

});

// =======================
// DECISION (SUPERVISOR)
// =======================
async function makeDecision(decision) {
  const comment = document.getElementById("decisionComment").value;

  try {
    const res = await fetch(
      `http://localhost:5000/api/applications/${applicationId}/decision`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({ decision, comment })
      }
    );

    const data = await res.json();

    if (res.ok) {
      alert("Decision: " + data.status);
      await loadApplicationDetails();
    }

  } catch (err) {
    console.error(err);
    alert("Server error");
  }
}

document.getElementById("approveBtn").addEventListener("click", () => {
  makeDecision("Approved");
});

document.getElementById("rejectBtn").addEventListener("click", () => {
  makeDecision("Rejected");
});

// =======================
// LOAD VERIFICATION DATA
// =======================
async function loadVerificationData() {
  try {
    const res = await fetch(`http://localhost:5000/api/applications/${applicationId}/verifications`);
    const data = await res.json();

    if (!data || data.length === 0) return;

    // ✅ SUPERVISOR → CLEAN READ-ONLY VIEW
    if (role === "supervisor") {

      let html = "";

      data.forEach(item => {
        html += `
          <div style="margin-bottom:10px;">
            <strong>${item.check_type.toUpperCase()}</strong><br>
            Status: ${item.verified ? "Verified" : "Not Verified"}<br>
            Comment: ${item.comments || "No comment"}
          </div>
        `;
      });

      checklistView.innerHTML = html;
      return;
    }

    // ✅ OFFICER → FILL FORM
    data.forEach(item => {
      const statusValue = item.verified ? "verified" : "not_verified";

      if (item.check_type === "land") {
        document.getElementById("land_status").value = statusValue;
        document.getElementById("land_comment").value = item.comments || "";
      }

      if (item.check_type === "marital") {
        document.getElementById("marital_status_check").value = statusValue;
        document.getElementById("marital_comment").value = item.comments || "";
      }

      if (item.check_type === "kebele") {
        document.getElementById("kebele_status").value = statusValue;
        document.getElementById("kebele_comment").value = item.comments || "";
      }

      if (item.check_type === "fayida") {
        document.getElementById("fayida_status").value = statusValue;
        document.getElementById("fayida_comment").value = item.comments || "";
      }
    });

  } catch (err) {
    console.error("Error loading verification:", err);
  }
}

// =======================
// INIT
// =======================
loadApplicationDetails();
loadDocuments();
loadVerificationData();