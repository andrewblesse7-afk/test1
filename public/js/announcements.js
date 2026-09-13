// Announcements page. Everyone who is logged in can read them,
// only an administrator sees the form and the delete buttons.

const announcementList = document.getElementById("announcement-list");
const adminSection = document.getElementById("admin-section");
const announcementForm = document.getElementById("announcement-form");
const formMessage = document.getElementById("form-message");

let isAdmin = false;

function renderAnnouncement(announcement) {
  const item = document.createElement("li");
  item.className = "announcement";

  const title = document.createElement("h3");
  title.textContent = announcement.title;

  const meta = document.createElement("p");
  meta.className = "meta";
  const author =
    announcement.createdBy && announcement.createdBy.name
      ? announcement.createdBy.name
      : "administration";
  const date = new Date(announcement.createdAt).toLocaleDateString();
  meta.textContent = `${announcement.category} • ${date} • ${author}`;

  const content = document.createElement("p");
  content.textContent = announcement.content;

  item.append(title, meta, content);

  if (isAdmin) {
    const deleteButton = document.createElement("button");
    deleteButton.className = "btn btn-secondary";
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", () =>
      deleteAnnouncement(announcement._id)
    );
    item.append(deleteButton);
  }

  return item;
}

async function loadAnnouncements() {
  const response = await fetch("/api/announcements", {
    headers: authHeaders(),
  });

  if (response.status === 401) {
    clearToken();
    window.location.href = "/login.html";
    return;
  }
  if (!response.ok) {
    announcementList.textContent = "Could not load announcements.";
    return;
  }

  const announcements = await response.json();
  announcementList.textContent = "";

  if (announcements.length === 0) {
    const empty = document.createElement("li");
    empty.textContent = "No announcements yet.";
    announcementList.append(empty);
    return;
  }

  announcements.forEach((announcement) =>
    announcementList.append(renderAnnouncement(announcement))
  );
}

async function deleteAnnouncement(id) {
  const response = await fetch("/api/announcements/" + id, {
    method: "DELETE",
    headers: authHeaders(),
  });

  if (response.ok) {
    loadAnnouncements();
  } else {
    const data = await response.json();
    formMessage.textContent = data.error || "Could not delete the announcement.";
    formMessage.className = "message error";
  }
}

announcementForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  formMessage.textContent = "";

  try {
    const response = await fetch("/api/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({
        title: announcementForm.title.value,
        category: announcementForm.category.value,
        content: announcementForm.content.value,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      formMessage.textContent = data.error || "Could not publish.";
      formMessage.className = "message error";
      return;
    }

    formMessage.textContent = "Announcement published.";
    formMessage.className = "message success";
    announcementForm.reset();
    loadAnnouncements();
  } catch (err) {
    formMessage.textContent = "Network error. Please try again.";
    formMessage.className = "message error";
  }
});

async function start() {
  const response = await fetch("/api/auth/me", { headers: authHeaders() });

  if (response.status === 401) {
    clearToken();
    window.location.href = "/login.html";
    return;
  }

  const user = await response.json();
  isAdmin = user.role === "admin";
  if (isAdmin) {
    adminSection.hidden = false; // the form is only for administrators
  }

  loadAnnouncements();
}

if (!getToken()) {
  window.location.href = "/login.html";
} else {
  start();
}
