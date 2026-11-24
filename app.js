const registrationForm = document.getElementById("registrationForm");

registrationForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const registration = {
    parent_name: document.getElementById("parentName").value,
    email: document.getElementById("email").value,
    phone: document.getElementById("phone").value,
    camper_first_name: document.getElementById("camperFirstName").value,
    camper_last_name: document.getElementById("camperLastName").value,
    camper_age: parseInt(document.getElementById("camperAge").value, 10),
    emergency_contact: document.getElementById("emergencyContact").value,
    emergency_phone: document.getElementById("emergencyPhone").value,
    allergies: document.getElementById("allergies").value,
    photo_release: document.getElementById("photoRelease").checked,
    waiver_agreed: document.getElementById("waiver").checked
  };

  try {
    const response = await fetch("http://localhost:3000/api/registrations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(registration)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(data);
      alert("There was a problem submitting your registration.");
      return;
    }

    alert("Registration submitted successfully!");
    registrationForm.reset();
  } catch (error) {
    console.error("Network error:", error);
    alert("Could not connect to the server.");
  }
});
