// Small helpers for the login token in the browser.
// The token is kept in localStorage so it survives page reloads.

function saveToken(token) {
  localStorage.setItem("token", token);
}

function getToken() {
  return localStorage.getItem("token");
}

function clearToken() {
  localStorage.removeItem("token");
}

// Header that the protected API routes expect
function authHeaders() {
  const token = getToken();
  return token ? { Authorization: "Bearer " + token } : {};
}

// Show the name of the logged in user in the navigation bar
// and replace the Login and Register links with a Logout link.
async function showCurrentUser() {
  const navLinks = document.querySelector(".nav-links");
  if (!navLinks || !getToken()) {
    return; // guest: the navigation stays as it is
  }

  let user;
  try {
    const response = await fetch("/api/auth/me", { headers: authHeaders() });
    if (!response.ok) {
      clearToken(); // the token is no longer valid
      return;
    }
    user = await response.json();
  } catch (err) {
    return; // network problem: leave the navigation alone
  }

  navLinks
    .querySelectorAll('a[href="/login.html"], a[href="/register.html"]')
    .forEach((link) => link.parentElement.remove());

  const userItem = document.createElement("li");
  userItem.className = "nav-user";
  userItem.textContent = user.name;

  const logoutItem = document.createElement("li");
  const logoutLink = document.createElement("a");
  logoutLink.href = "#";
  logoutLink.textContent = "Logout";
  logoutLink.addEventListener("click", (event) => {
    event.preventDefault();
    clearToken();
    window.location.href = "/login.html";
  });
  logoutItem.append(logoutLink);

  navLinks.append(userItem, logoutItem);
}

showCurrentUser();
