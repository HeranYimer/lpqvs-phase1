const table = document.getElementById("applicationsTable");

async function loadApplications() {
  const res = await fetch("http://localhost:5000/api/applications", {
    credentials: "include"
  });

  const data = await res.json();
  table.innerHTML = "";

  data.forEach(app => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${app.id}</td>
      <td>${app.name}</td>
      <td>${app.status}</td>
      <td>
        <a href="view-application.html?id=${app.id}">View</a>
      </td>
      <td>${app.address}</td>
    `;

    table.appendChild(row);
  });
}

loadApplications();

// Back button logic (separate and immediate)
const role = (localStorage.getItem("role") || "").toLowerCase();
const backBtn = document.getElementById("backBtn");

if (backBtn) {
  backBtn.addEventListener("click", (e) => {
    e.preventDefault();

    if (role === "supervisor") {
      window.location.href = "../dashboards/supervisor-dashboard.html";
    } else {
      window.location.href = "../dashboards/officer-dashboard.html";
    }
  });
}