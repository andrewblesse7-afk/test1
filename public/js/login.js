const loginForm = document.getElementById("login-form");
const loginMessage = document.getElementById("login-message");

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  loginMessage.textContent = "";

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: loginForm.email.value,
        password: loginForm.password.value,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      loginMessage.textContent = data.error || "Could not log in.";
      loginMessage.className = "message error";
      return;
    }

    // keep the token and open the requests page as a logged in user
    saveToken(data.token);
    window.location.href = "/requests.html";
  } catch (err) {
    loginMessage.textContent = "Network error. Please try again.";
    loginMessage.className = "message error";
  }
});
