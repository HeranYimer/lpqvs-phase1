// ================= LOAD ADMIN OVERVIEW =================
async function loadOverview() {
  try {
    const res = await fetch("http://localhost:5000/api/admin-overview", {
      credentials: "include"
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Access denied");
      return;
    }

    document.getElementById("total").innerText = data.total || 0;
    document.getElementById("pending").innerText = data.pending || 0;
    document.getElementById("approved").innerText = data.approved || 0;
    document.getElementById("rejected").innerText = data.rejected || 0;

  } catch (err) {
    console.error("Overview error:", err);
  }
}

// ================= LOGOUT =================
function logout(){
  fetch("http://localhost:5000/api/logout", {
    method: "POST",
    credentials: "include"
  }).then(() => {
    window.location.href = "../login.html";
  });
}

// INIT
loadOverview();