const form = document.getElementById("applicationForm");

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
        alert("ፋይሉ ከ 5MB በላይ መሆን አይችልም");
        input.value = ""; // clear only that file
        return; // stop submission
      }
      if (!allowedTypes.includes(file.type)) {
        alert("Invalid file type. Only JPEG, PNG, PDF allowed");
        input.value = ""; // clear only that file
        return; // stop submission
      }
    }
  }

  // Submit the form if files are valid
  const formData = new FormData(form);

  try {
    const res = await fetch("http://localhost:5000/api/applications", {
      method: "POST",
      body: formData
    });

    let data = {};
    try { data = await res.json(); } catch { data = { message: "Upload error" }; }

    if (res.ok) {
      alert("ማመልከቻ ተመዝግቧል");
      form.reset(); // reset only on success
    } else {
      alert(data.message || "Upload failed");
    }

  } catch (error) {
    console.error(error);
    alert("Server connection error");
  }
});