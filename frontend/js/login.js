import { labels } from "./lang.js";

console.log("Login script loaded");
const messageBox = document.getElementById("messageBox");

function showMessage(message, type = "error") {
  messageBox.innerText = message;

  messageBox.style.position = "fixed";
  messageBox.style.top = "20px";
  messageBox.style.right = "20px";
  messageBox.style.zIndex = "9999";
  messageBox.style.padding = "12px 15px";
  messageBox.style.borderRadius = "6px";
  messageBox.style.fontWeight = "bold";
  messageBox.style.minWidth = "250px";

  if (type === "error") {
    messageBox.style.background = "#f8d7da";
    messageBox.style.color = "#721c24";
    messageBox.style.border = "1px solid #f5c6cb";
  } else {
    messageBox.style.background = "#d4edda";
    messageBox.style.color = "#155724";
    messageBox.style.border = "1px solid #c3e6cb";
  }

  setTimeout(() => {
    messageBox.style.display = "none";
  }, 3000);

  messageBox.style.display = "block";
}
document.getElementById("title").innerText = labels.loginTitle;
document.getElementById("usernameLabel").innerText = labels.username;
document.getElementById("passwordLabel").innerText = labels.password;
document.getElementById("loginBtn").innerText = labels.login;

const form = document.getElementById("loginForm");

form.addEventListener("submit", async (e) => {

  console.log("Login button clicked");

  e.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const res = await fetch("http://localhost:5000/api/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    credentials:"include",
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();
  console.log(data);

  if (res.ok) {

    // ✅ STORE ROLE (FIX)
    localStorage.setItem("role", data.role);

    if (data.role === "Officer") {
      window.location.href = "dashboards/officer-dashboard.html";
    }

    else if (data.role === "Supervisor") {
      window.location.href = "dashboards/supervisor-dashboard.html";
    }

    else if (data.role === "Admin") {
      window.location.href = "dashboards/admin-dashboard.html";
    }

  } else {

    showMessage("የተጠቃሚ ስም ወይም የይለፍ ቃል ትክክል አይደለም።", "error");

  }

});
const toggle = document.getElementById("togglePassword");
const password = document.getElementById("password");

let visible = false;

toggle.addEventListener("click", () => {
  visible = !visible;

  password.type = visible ? "text" : "password";

  toggle.innerHTML = visible
    ? '<i data-lucide="eye-off"></i>'
    : '<i data-lucide="eye"></i>';

  lucide.createIcons();
});
lucide.createIcons();