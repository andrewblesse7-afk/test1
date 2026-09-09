const form = document.getElementById("request-form");
const message = document.getElementById("form-message");
const list = document.getElementById("request-list");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  message.textContent = "";

  // the owner is not sent: the server takes it from the token
  const newRequest = {
    roomNumber: form.roomNumber.value,
    category: form.category.value,
    priority: form.priority.value,
    description: form.description.value,
  };

  try {
    const response = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(newRequest),
    });

    if (response.ok) {
      message.textContent = "Request submitted successfully.";
      message.className = "message success";
      form.reset();
      loadRequests(); // show the new request in the list right away
    } else {
      const data = await response.json();
      message.textContent = data.error || "Could not submit the request.";
      message.className = "message error";
    }
  } catch (err) {
    message.textContent = "Network error. Please try again.";
    message.className = "message error";
  }
});

// Build one <li> card for a request. textContent is used so text typed by
// students is shown as plain text and never as HTML.
function renderRequest(request) {
  const item = document.createElement("li");
  item.className = "request";

  const header = document.createElement("div");
  header.className = "request-header";

  const title = document.createElement("h3");
  title.textContent = request.category;

  const badge = document.createElement("span");
  badge.className =
    "badge status-" + request.status.toLowerCase().replace(" ", "-");
  badge.textContent = request.status;

  header.append(title, badge);

  const meta = document.createElement("p");
  meta.className = "request-meta";
  const date = new Date(request.createdAt).toLocaleDateString();
  meta.textContent = `Room ${request.roomNumber} • Priority: ${request.priority} • ${date}`;

  const description = document.createElement("p");
  description.textContent = request.description;

  item.append(header, meta, description);
  return item;
}

// Load all requests from the API and draw them on the page
async function loadRequests() {
  try {
    const response = await fetch("/api/requests", { headers: authHeaders() });

    // the token is missing or has expired, so ask the student to log in again
    if (response.status === 401) {
      clearToken();
      window.location.href = "/login.html";
      return;
    }

    if (!response.ok) {
      list.textContent = "Could not load requests.";
      return;
    }
    const requests = await response.json();

    list.textContent = ""; // clear the list before drawing it again

    if (requests.length === 0) {
      const empty = document.createElement("li");
      empty.textContent = "No requests yet.";
      list.append(empty);
      return;
    }

    requests.forEach((request) => list.append(renderRequest(request)));
  } catch (err) {
    list.textContent = "Could not load requests.";
  }
}

// this page only makes sense for a logged in student
if (!getToken()) {
  window.location.href = "/login.html";
} else {
  loadRequests(); // fill the list when the page opens
}
