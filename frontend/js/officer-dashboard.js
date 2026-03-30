function logout(){
window.location.href="../login.html";
}
async function loadOfficerDashboard() {
  try {
    const res = await fetch("http://localhost:5000/api/reports/summary");
    const data = await res.json();

    document.getElementById("pending").innerText = data.pending || 0;
    document.getElementById("total").innerText = data.total || 0;
 document.getElementById("monthly").innerText = data.monthly || 0;
    const todayRes = await fetch("http://localhost:5000/api/dashboard-stats");
    const todayData = await todayRes.json();

    document.getElementById("today").innerText = todayData.todayEntries || 0;

  } catch (err) {
    console.error(err);
  }
}

loadOfficerDashboard();
