const form = document.getElementById("request-form");
const message = document.getElementById("form-message");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  message.textContent = "";

  // collect the values the student typed into the form
  const newRequest = {
    resident: form.resident.value,
    roomNumber: form.roomNumber.value,
    category: form.category.value,
    priority: form.priority.value,
    description: form.description.value,
  };

  try {
    const response = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newRequest),
    });

    if (response.ok) {
      message.textContent = "Request submitted successfully.";
      message.className = "message success";
      form.reset();
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
