const bookingForm = document.getElementById("booking-form");
const bookingMessage = document.getElementById("form-message");
const facilitySelect = document.getElementById("facility");
const facilityList = document.getElementById("facility-list");
const bookingList = document.getElementById("booking-list");

// Show a date and time the way the browser language does it
function formatSlot(startAt, endAt) {
  const start = new Date(startAt);
  const end = new Date(endAt);
  const time = { hour: "2-digit", minute: "2-digit" };
  return (
    start.toLocaleDateString() +
    " • " +
    start.toLocaleTimeString([], time) +
    " – " +
    end.toLocaleTimeString([], time)
  );
}

// Load the facilities: one card per facility and one option in the form
async function loadFacilities() {
  const response = await fetch("/api/facilities", { headers: authHeaders() });
  if (!response.ok) {
    facilityList.textContent = "Could not load facilities.";
    return;
  }

  const facilities = await response.json();
  facilityList.textContent = "";
  facilitySelect.textContent = "";

  if (facilities.length === 0) {
    facilityList.textContent = "No facilities yet.";
    return;
  }

  facilities.forEach((facility) => {
    const item = document.createElement("li");
    item.className = "facility";

    const title = document.createElement("h3");
    title.textContent = facility.name;

    const meta = document.createElement("p");
    meta.className = "facility-meta";
    const price =
      facility.pricePerSlot > 0 ? "€" + facility.pricePerSlot : "free";
    meta.textContent = `${facility.location || "—"} • up to ${facility.capacity} • ${facility.slotMinutes} min slot • ${price}`;

    item.append(title, meta);
    if (facility.description) {
      const description = document.createElement("p");
      description.textContent = facility.description;
      item.append(description);
    }
    facilityList.append(item);

    const option = document.createElement("option");
    option.value = facility._id; // the API needs the id, not the name
    option.textContent = facility.name;
    facilitySelect.append(option);
  });
}

// Build one card for a booking, with a Cancel button while it is active
function renderBooking(booking) {
  const item = document.createElement("li");
  item.className = "booking";

  const header = document.createElement("div");
  header.className = "booking-header";

  const title = document.createElement("h3");
  // facilityId was replaced by the facility object with populate()
  title.textContent = booking.facilityId ? booking.facilityId.name : "Facility";

  const badge = document.createElement("span");
  badge.className = "badge status-" + booking.status.toLowerCase();
  badge.textContent = booking.status;

  header.append(title, badge);

  const meta = document.createElement("p");
  meta.className = "booking-meta";
  meta.textContent = formatSlot(booking.startAt, booking.endAt);

  item.append(header, meta);

  if (booking.status === "Active") {
    const cancelButton = document.createElement("button");
    cancelButton.className = "btn btn-secondary";
    cancelButton.textContent = "Cancel booking";
    cancelButton.addEventListener("click", () => cancelBooking(booking._id));
    item.append(cancelButton);
  }

  return item;
}

// Load the bookings of the logged in user
async function loadBookings() {
  const response = await fetch("/api/bookings", { headers: authHeaders() });

  if (response.status === 401) {
    clearToken();
    window.location.href = "/login.html";
    return;
  }
  if (!response.ok) {
    bookingList.textContent = "Could not load bookings.";
    return;
  }

  const bookings = await response.json();
  bookingList.textContent = "";

  if (bookings.length === 0) {
    const empty = document.createElement("li");
    empty.textContent = "No bookings yet.";
    bookingList.append(empty);
    return;
  }

  bookings.forEach((booking) => bookingList.append(renderBooking(booking)));
}

async function cancelBooking(id) {
  const response = await fetch("/api/bookings/" + id, {
    method: "DELETE",
    headers: authHeaders(),
  });

  if (response.ok) {
    loadBookings(); // the slot is free again, so redraw the list
  } else {
    const data = await response.json();
    bookingMessage.textContent = data.error || "Could not cancel the booking.";
    bookingMessage.className = "message error";
  }
}

bookingForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  bookingMessage.textContent = "";

  const date = bookingForm.date.value;

  // the date field and the time field are joined into one real date
  const startAt = new Date(`${date}T${bookingForm.startTime.value}`);
  const endAt = new Date(`${date}T${bookingForm.endTime.value}`);

  try {
    const response = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({
        facilityId: facilitySelect.value,
        // toISOString sends the time in UTC, so the server reads it correctly
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      bookingMessage.textContent = data.error || "Could not book this slot.";
      bookingMessage.className = "message error";
      return;
    }

    bookingMessage.textContent = "Slot booked successfully.";
    bookingMessage.className = "message success";
    bookingForm.reset();
    loadBookings();
  } catch (err) {
    bookingMessage.textContent = "Network error. Please try again.";
    bookingMessage.className = "message error";
  }
});

// this page only makes sense for a logged in student
if (!getToken()) {
  window.location.href = "/login.html";
} else {
  loadFacilities();
  loadBookings();
}
