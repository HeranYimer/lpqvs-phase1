// ✅ MESSAGE FUNCTION (ADDED)
function showMessage(message, type = "success") {
  const messageBox = document.getElementById("messageBox");

  messageBox.innerText = message;

  // ✅ MAKE IT FLOAT (IMPORTANT PART)
  messageBox.style.position = "fixed";
  messageBox.style.top = "20px";
  messageBox.style.right = "20px";
  messageBox.style.zIndex = "1000";
  messageBox.style.minWidth = "250px";

  messageBox.style.padding = "10px";
  messageBox.style.borderRadius = "5px";
  messageBox.style.fontWeight = "bold";

  messageBox.style.display = "block";

  if (type === "error") {
    messageBox.style.color = "#721c24";
    messageBox.style.backgroundColor = "#f8d7da";
    messageBox.style.border = "1px solid #f5c6cb";
  } else if (type === "warning") {
    messageBox.style.color = "#856404";
    messageBox.style.backgroundColor = "#fff3cd";
    messageBox.style.border = "1px solid #ffeeba";
  } else {
    messageBox.style.color = "#155724";
    messageBox.style.backgroundColor = "#d4edda";
    messageBox.style.border = "1px solid #c3e6cb";
  }

  // auto hide
  setTimeout(() => {
    messageBox.style.display = "none";
  }, 3000);
}

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
      showMessage("Please complete all verification fields.", "warning");
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
      showMessage(`Verification saved successfully. Result: ${data.eligibility}`, "success");
      loadVerificationData();
    } else {
      showMessage(data.message || "Failed to save verification.", "error");
    }

  } catch (err) {
    console.error(err);
    showMessage("Unable to connect to server. Please try again.", "error");
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
      showMessage(`Decision recorded: ${data.status}`, "success");
      await loadApplicationDetails();
    }

  } catch (err) {
    console.error(err);
    showMessage("Failed to submit decision. Try again.", "error");
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