// Admin dashboard: counters, a table of requests and simple filters.
// Only numbers and tables here, no charts.

const adminMessage = document.getElementById("admin-message");
const dashboard = document.getElementById("dashboard");
const stats = document.getElementById("stats");
const filterForm = document.getElementById("filter-form");
const filterStatus = document.getElementById("filter-status");
const filterCategory = document.getElementById("filter-category");
const filterQ = document.getElementById("filter-q");
const resetButton = document.getElementById("reset-filters");
const tableBody = document.querySelector("#requests-table tbody");

function showStat(label, value) {
  const box = document.createElement("div");
  box.className = "stat";

  const number = document.createElement("div");
  number.className = "stat-number";
  number.textContent = value;

  const text = document.createElement("div");
  text.className = "stat-label";
  text.textContent = label;

  box.append(number, text);
  stats.append(box);
}

// Counters are built from all requests and all bookings
async function loadStats() {
  const [requestsResponse, bookingsResponse] = await Promise.all([
    fetch("/api/requests", { headers: authHeaders() }),
    fetch("/api/bookings", { headers: authHeaders() }),
  ]);

  if (!requestsResponse.ok || !bookingsResponse.ok) {
    return;
  }

  const requests = await requestsResponse.json();
  const bookings = await bookingsResponse.json();

  const openStatuses = ["Submitted", "Reviewed", "In Progress"];
  const open = requests.filter((r) => openStatuses.includes(r.status)).length;
  const completed = requests.filter((r) => r.status === "Completed").length;
  const activeBookings = bookings.filter((b) => b.status === "Active").length;

  stats.textContent = "";
  showStat("Open requests", open);
  showStat("Completed requests", completed);
  showStat("Bookings", bookings.length);
  showStat("Active bookings", activeBookings);
}

function addCell(row, text) {
  const cell = document.createElement("td");
  cell.textContent = text;
  row.append(cell);
}

function renderRow(request) {
  const row = document.createElement("tr");

  addCell(row, new Date(request.createdAt).toLocaleDateString());
  addCell(row, request.roomNumber);
  addCell(row, request.category);
  addCell(row, request.priority);

  // the status is shown as a coloured badge
  const statusCell = document.createElement("td");
  const badge = document.createElement("span");
  badge.className =
    "badge status-" + request.status.toLowerCase().replace(" ", "-");
  badge.textContent = request.status;
  statusCell.append(badge);
  row.append(statusCell);

  addCell(row, request.description);
  return row;
}

// Load the requests, using the filters as query parameters in the address
async function loadRequests() {
  const params = new URLSearchParams();
  if (filterStatus.value) params.set("status", filterStatus.value);
  if (filterCategory.value) params.set("category", filterCategory.value);
  if (filterQ.value.trim()) params.set("q", filterQ.value.trim());

  const url = "/api/requests" + (params.toString() ? "?" + params : "");
  const response = await fetch(url, { headers: authHeaders() });

  if (!response.ok) {
    adminMessage.textContent = "Could not load requests.";
    adminMessage.className = "message error";
    return;
  }

  const requests = await response.json();
  tableBody.textContent = "";

  if (requests.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 6;
    cell.textContent = "No requests match these filters.";
    row.append(cell);
    tableBody.append(row);
    return;
  }

  requests.forEach((request) => tableBody.append(renderRow(request)));
}

filterForm.addEventListener("submit", (event) => {
  event.preventDefault();
  loadRequests();
});

resetButton.addEventListener("click", () => {
  filterStatus.value = "";
  filterCategory.value = "";
  filterQ.value = "";
  loadRequests();
});

// Only an administrator may see this page
async function start() {
  const response = await fetch("/api/auth/me", { headers: authHeaders() });

  if (response.status === 401) {
    clearToken();
    window.location.href = "/login.html";
    return;
  }

  const user = await response.json();
  if (user.role !== "admin") {
    adminMessage.textContent = "This page is only for administrators.";
    adminMessage.className = "message error";
    return;
  }

  dashboard.hidden = false;
  loadStats();
  loadRequests();
}

if (!getToken()) {
  window.location.href = "/login.html";
} else {
  start();
}
