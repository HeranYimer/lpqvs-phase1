const table = document.getElementById("applicationsTable");

// ================= TOAST =================
function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");

  const toast = document.createElement("div");
  toast.classList.add("toast", type);

  toast.innerText = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 5000);
}

// ================= CONFIRM MODAL =================
function showConfirmModal(message, onConfirm) {
  const modal = document.getElementById("confirmModal");
  const msg = document.getElementById("confirmMessage");
  const yesBtn = document.getElementById("confirmYes");
  const noBtn = document.getElementById("confirmNo");

  msg.innerText = message;
  modal.classList.remove("hidden");

  yesBtn.onclick = null;
  noBtn.onclick = null;

  yesBtn.onclick = () => {
    modal.classList.add("hidden");
    onConfirm();
  };

  noBtn.onclick = () => {
    modal.classList.add("hidden");
  };
}

// ================= LOAD APPLICATIONS =================
async function loadApplications() {
  try {
    const res = await fetch("http://localhost:5000/api/applications", {
      credentials: "include"
    });

    const data = await res.json();

    if (!res.ok) {
      showToast(data.message || "Failed to load applications", "error");
      return;
    }

    table.innerHTML = "";

    const role = (localStorage.getItem("role") || "").toLowerCase();

    data.forEach(app => {
      const row = document.createElement("tr");

      let deleteBtn = "";

      // Only admin can delete
      if (role === "admin") {
        deleteBtn = `<button onclick="deleteApplication(${app.id})">🗑 ሰርዝ</button>`;
      }

      row.innerHTML = `
        <td data-label="መለያ">${app.id}</td>
        <td data-label="ስም">${app.name}</td>
        <td data-label="ሁኔታ">${app.status}</td>
        <td data-label="ተግባር">
          <a href="view-application.html?id=${app.id}">ዝርዝር ይመልከቱ</a>
          ${deleteBtn}
        </td>
        <td data-label="አድራሻ">${app.address}</td>
      `;

      table.appendChild(row);
    });

  } catch (err) {
    console.error(err);
    showToast("Server error while loading applications", "error");
  }
}

loadApplications();

// ================= DELETE APPLICATION =================
window.deleteApplication = async function (id) {

  showConfirmModal("እርግጠኛ ነዎት ማመልከቻውን መሰረዝ ይፈልጋሉ?", async () => {

    try {
      const res = await fetch(`http://localhost:5000/api/applications/${id}`, {
        method: "DELETE",
        credentials: "include"
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.message || "Delete failed", "error");
        return;
      }

      showToast("✔ Application deleted successfully", "success");
      loadApplications();

    } catch (err) {
      console.error(err);
      showToast("Server error during deletion", "error");
    }

  });
};

// ================= BACK BUTTON =================
const role = (localStorage.getItem("role") || "").toLowerCase();
const backBtn = document.getElementById("backBtn");

if (backBtn) {
  backBtn.addEventListener("click", (e) => {
    e.preventDefault();

    if (role === "supervisor") {
      window.location.href = "../dashboards/supervisor-dashboard.html";
    } else if (role === "officer") {
      window.location.href = "../dashboards/officer-dashboard.html";
    } else {
      window.location.href = "../dashboards/admin-dashboard.html";
    }
  });
}