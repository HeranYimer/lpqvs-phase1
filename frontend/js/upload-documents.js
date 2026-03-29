const messageBox = document.getElementById("messageBox");

let messageTimeout;

// ================= MESSAGE FUNCTION =================
function showMessage(message, type = "success") {
  messageBox.innerText = message;

  messageBox.style.position = "fixed";
  messageBox.style.top = "20px";
  messageBox.style.right = "20px";
  messageBox.style.zIndex = "1000";
  messageBox.style.minWidth = "250px";

  messageBox.style.padding = "10px";
  messageBox.style.borderRadius = "5px";
  messageBox.style.fontWeight = "bold";
  messageBox.style.display = "block";
  messageBox.style.opacity = "1";

  if (type === "error") {
    messageBox.style.color = "#721c24";
    messageBox.style.backgroundColor = "#f8d7da";
  } else {
    messageBox.style.color = "#155724";
    messageBox.style.backgroundColor = "#d4edda";
  }

  // clear previous timer
  if (messageTimeout) {
    clearTimeout(messageTimeout);
  }

  // hide after delay
  messageTimeout = setTimeout(() => {
    messageBox.style.opacity = "0";

    setTimeout(() => {
      messageBox.style.display = "none";
    }, 300);
  }, 7000);
}

// ================= UPLOAD HANDLER =================
document.getElementById("uploadBtn").addEventListener("click", async (e) => {
  e.preventDefault(); // 🔥 IMPORTANT FIX

  const appId = document.getElementById("appId").value;

  if (!appId) {
    showMessage("የማመልከቻ መታወቂያ ያስፈልጋል", "error");
    return;
  }

  const formData = new FormData();

  const sig = document.getElementById("signature").files[0];
  const fayida = document.getElementById("fayida_doc").files[0];
  const kebele = document.getElementById("kebele_doc").files[0];

  if (sig) formData.append("signature", sig);
  if (fayida) formData.append("fayida_doc", fayida);
  if (kebele) formData.append("kebele_doc", kebele);

  try {
    const res = await fetch(
      `http://localhost:5000/api/applications/${appId}/upload`,
      {
        method: "POST",
        body: formData
      }
    );

    const data = await res.json();

    if (res.ok) {
      showMessage("ሰነዶች በተሳካ ሁኔታ ተጭነዋል");
    } else {
      showMessage(data.message || "መጫን አልተሳካም", "error");
    }
  } catch (err) {
    showMessage("Server error", "error");
  }
});