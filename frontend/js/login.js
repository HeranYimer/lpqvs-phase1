import { labels } from "./lang.js";

console.log("Login script loaded");

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

    alert("የተጠቃሚ ስም ወይም የይለፍ ቃል ትክክል አይደለም።");

  }

});