// ==========================
// Logout
// ==========================
function logout(){
  window.location.href="../login.html";
}

// ==========================
// Section Navigation
// ==========================
function showSection(id){
  document.querySelectorAll('.dashboard-section').forEach(sec => sec.style.display='none');
  document.getElementById(id).style.display = 'block';

  if(id === 'audit'){
    loadAuditLogs();
  }
}

// ==========================
// Load Audit Logs
// ==========================
async function loadAuditLogs() {
  try {
    const res = await fetch("http://localhost:5000/api/audit-logs", { credentials: "include" });
    const logs = await res.json();
    
    const tbody = document.querySelector("#auditTable tbody");
    tbody.innerHTML = "";

    if(!logs || logs.length === 0){
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">ሎጎች አልተገኙም</td></tr>`;
      return;
    }

    logs.forEach((log, index) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${index + 1}</td>
        <td>${log.username}</td>
        <td>${log.action}</td>
        <td>${log.status}</td>
        <td>${new Date(log.created_at).toLocaleString('am-ET')}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("Error loading audit logs:", err);
  }
}