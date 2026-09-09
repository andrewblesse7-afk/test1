const registerForm = document.getElementById("register-form");
const registerMessage = document.getElementById("register-message");

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  registerMessage.textContent = "";

  // form.elements is used because a form already has its own "name" property
  const email = registerForm.elements.email.value;
  const password = registerForm.elements.password.value;

  try {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: registerForm.elements.name.value,
        email,
        roomNumber: registerForm.elements.roomNumber.value,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      registerMessage.textContent =
        data.error || "Could not create the account.";
      registerMessage.className = "message error";
      return;
    }

    // log in right away so the password is not typed twice
    const loginResponse = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!loginResponse.ok) {
      // the account was created, so the student can simply log in
      window.location.href = "/login.html";
      return;
    }

    const loginData = await loginResponse.json();
    saveToken(loginData.token);
    window.location.href = "/requests.html";
  } catch (err) {
    registerMessage.textContent = "Network error. Please try again.";
    registerMessage.className = "message error";
  }
});
