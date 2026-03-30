const form = document.getElementById("applicationForm");

// Message box (must exist in HTML)
const messageBox = document.getElementById("messageBox");

// ================= MESSAGE HANDLER =================
function showMessage(message, type = "success") {
  messageBox.innerText = message;

  // ✅ FLOATING POSITION (same as other page)
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

  // ✅ AUTO DISAPPEAR
  setTimeout(() => {
    messageBox.style.display = "none";
  }, 3000);
}

// ================= FORM SUBMIT =================
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Client-side file validation
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
  const fileInputs = ["signature", "fayida_doc", "kebele_doc"];

  for (let id of fileInputs) {
    const input = document.getElementById(id);

    if (input && input.files.length > 0) {
      const file = input.files[0];

      if (file.size > maxSize) {
        showMessage("ፋይሉ ከ 5MB በላይ መሆን አይችልም", "error");
        input.value = "";
        return;
      }

      if (!allowedTypes.includes(file.type)) {
        showMessage("የፋይሉ አይነት ትክክል አይደለም። JPEG, PNG ወይም PDF ብቻ ይፈቀዳሉ", "error");
        input.value = "";
        return;
      }
    }
  }
// ✅ Fayida ID validation (12 digits only)
const fayidaInput = document.getElementById("fayida_id").value.trim();

if (fayidaInput) {
  const isValid = /^[0-9]{12}$/.test(fayidaInput);

  if (!isValid) {
    showMessage("እባክዎ ትክክለኛ የፋይዳ መታወቂያ ያስገቡ", "error");
    return;
  }
}
  const formData = new FormData(form);

  try {
    const res = await fetch("http://localhost:5000/api/applications", {
      method: "POST",
      body: formData,
      credentials: "include"
    });

    let data = {};
    try {
      data = await res.json();
    } catch {
      data = { message: "የሰርቨር ስህተት ተከስቷል" };
    }

   if (res.ok) {
  showMessage(data.message || "ማመልከቻ በተሳካ ሁኔታ ተመዝግቧል", "success");
  form.reset();
} else {
  showMessage(data.message || "ማመልከቻ መላክ አልተሳካም", "error");

  // ❗ IMPORTANT: prevent any unintended reset
  e.target.reset = function () {};
}

  } catch (error) {
    console.error(error);
    showMessage("ከሰርቨር ጋር መገናኘት አልተቻለም", "error");
  }
});