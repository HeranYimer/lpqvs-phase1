const table = document.getElementById("auditTable");

async function loadAuditLogs() {
  try {
    const res = await fetch("http://localhost:5000/api/audit-logs", {
      credentials: "include"
    });

    const logs = await res.json();

    if (!res.ok) {
      console.error("Server error:", logs.message);
      return;
    }

    if (!Array.isArray(logs)) {
      console.error("Expected array but got:", logs);
      return;
    }

    table.innerHTML = "";

    logs.forEach((log, index) => {
      const row = document.createElement("tr");

     row.innerHTML = `
  <td data-label="ተ.ቁ">${index + 1}</td>
  <td data-label="ተጠቃሚ">${log.username}</td>
  <td data-label="ሁኔታ">${log.action}</td>
  <td data-label="ቀን">${new Date(log.created_at).toLocaleString()}</td>
`;

      table.appendChild(row);
    });

  } catch (err) {
    console.error(err);
  }
}

async function logout() {
  await fetch("http://localhost:5000/api/logout", {
    method: "POST",
    credentials: "include"
  });

  window.location.href = "../login.html";
}

loadAuditLogs();