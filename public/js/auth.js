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
