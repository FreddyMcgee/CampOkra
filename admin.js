const API_BASE = "http://localhost:3000";

const searchInput = document.getElementById("searchInput");
const ageFilter = document.getElementById("ageFilter");
const searchResults = document.getElementById("searchResults");
const editDialog = document.getElementById("editDialog");
const editRegistrationForm = document.getElementById("editRegistrationForm");
const cancelEditButton = document.getElementById("cancelEditButton");
const logoutButton = document.getElementById("logoutButton");
const adminLoginForm = document.getElementById("adminLoginForm");
const adminLoginTitle = document.getElementById("adminLoginTitle");
const adminMessage = document.getElementById("adminMessage");
const dashboard = document.getElementById("dashboard");
const totalRegistrationsEl = document.getElementById("totalRegistrations");
const registrationListEl = document.getElementById("registrationList");
const downloadCsvButton = document.getElementById("downloadCsvButton");

let loadedRegistrations = [];
let adminToken = "";

adminLoginForm.addEventListener("submit", async function (event) {
  event.preventDefault();
  adminMessage.textContent = "";

  const email = document.getElementById("adminEmail").value.trim();
  const password = document.getElementById("adminPassword").value;

  try {
    const res = await fetch(`${API_BASE}/api/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok || !data.success || !data.token) {
      adminMessage.textContent = data.error || "Login failed.";
      return;
    }

    adminToken = data.token;

    adminLoginForm.style.display = "none";
    adminLoginTitle.style.display = "none";
    dashboard.style.display = "block";

    document.querySelector(".admin-card").classList.add("dashboard-expanded");

    await loadRegistrations();

  } catch (err) {
    console.error("Login error:", err);
    adminMessage.textContent = "Could not connect to server.";
  }
});

async function loadRegistrations() {
  try {
    const res = await fetch(`${API_BASE}/api/registrations`, {
      headers: { 
        Authorization: `Bearer ${adminToken}` 
    }
  });

    if (!res.ok) {
      adminMessage.textContent = "Failed to load registrations.";
      return;
    }

    loadedRegistrations = await res.json();

    totalRegistrationsEl.textContent = loadedRegistrations.length;

    populateAgeFilter();
    filterRegistrations();

  } catch (err) {
    console.error("Error loading registrations:", err);
    adminMessage.textContent = "Error loading registrations.";
  }
}

// Display individual camper registration cards
function displayRegistrations(registrations) {
  registrationListEl.innerHTML = "";
  searchResults.textContent = registrations.length;

  if(registrations.length === 0) {
    registrationListEl.textContent = "No matching campers found.";
    return;
  }

  registrations.forEach((reg) => {

    const card = document.createElement("div");
    card.className = "registration-card";

    card.innerHTML = `
    <div class="camper-card-header">

    <div class="camper-avatar">
    ${escapeHtml(reg.camper_first_name.charAt(0))}
    ${escapeHtml(reg.camper_last_name.charAt(0))}
    </div>

    <div>
    <h3>
    ${escapeHtml(reg.camper_first_name)} 
    ${escapeHtml(reg.camper_last_name)}
    </h3>

    <p>Age: ${escapeHtml(reg.camper_age)} | 
    ID #${escapeHtml(reg.camper_id)}</p>
    </div>

    </div>

    <hr>

    <p class="field-label"> Parent/Guardian</p>
    <p>${escapeHtml(reg.parent_name)}</p>

    <p class="field-label">Email</p>
    <p>${escapeHtml(reg.email)}</p>

    <p class="field-label">Phone Number</p>
    <p>${escapeHtml(reg.phone)}</p>

    <p class="field-label">Emergency Contact</p>
    <p>${escapeHtml(reg.emergency_contact)} </p> 
    <p>${escapeHtml(reg.emergency_phone)}</p>

    <p class="field-label">Allergies</p>
    <p>${escapeHtml(reg.allergies || "None")}</p>

    <p class="field-label">Photo Release</p>
    <p>${reg.photo_release ? "Yes" : "No"}</p>

    <p class="field-label">Waiver Agreed</p>
    <p>${reg.waiver_agreed ? "Agreed" : "Not Agreed"}</p>

    <div class="card-actions">

    <button type="button" class="edit-button">
    Edit
    </button>

    <button type="button" class="delete-button">
    Delete
    </button>

    </div>
    `;

    card.querySelector(".edit-button").
    addEventListener("click", () => openEditForm(reg));
    

    card.querySelector(".delete-button").
    addEventListener("click", () => deleteRegistration(reg));

    registrationListEl.appendChild(card);
  });
}


// Populate the age filter
function populateAgeFilter() {

  const previousAge = ageFilter.value;

  const ages = [...new Set(
    loadedRegistrations.map(reg => Number(reg.camper_age))
  )].sort((a, b) => a - b);

  ageFilter.innerHTML = '<option value="all">All Ages</option>';

  ages.forEach(age => {

    const option = document.createElement("option");

    option.value = age;
    option.textContent = `Age ${age}`;

    ageFilter.appendChild(option);
  });

  if (ages.includes(Number(previousAge))) {
    ageFilter.value = previousAge;
  }
}

// Search and filter camper registrations
function filterRegistrations() {

  const search = searchInput.value.toLowerCase().trim();
  const selectedAge = ageFilter.value;

  const filtered = loadedRegistrations.filter(reg => {

    const searchableText = [
      reg.camper_first_name,
      reg.camper_last_name,
      reg.camper_age,
      reg.parent_name,
      reg.email,
      reg.phone,
      reg.emergency_contact,
      reg.emergency_phone
    ].join(" ").toLowerCase();

    const matchesSearch = searchableText.includes(search);

    const matchesAge =
      selectedAge === "all" ||
      Number(reg.camper_age) === Number(selectedAge);

    return matchesSearch && matchesAge;
  });

  displayRegistrations(filtered);
}

// Search automatically while typing
searchInput.addEventListener("input", filterRegistrations);

// Filter when an age is selected
ageFilter.addEventListener("change", filterRegistrations);
    
// Open the edit registration form
function openEditForm(reg) {

  document.getElementById("editCamperId").value =
    reg.camper_id;

  document.getElementById("editFirstName").value =
    reg.camper_first_name;

  document.getElementById("editLastName").value =
    reg.camper_last_name;

  document.getElementById("editAge").value =
    reg.camper_age;

  document.getElementById("editParentName").value =
    reg.parent_name;

  document.getElementById("editEmail").value =
    reg.email;

  document.getElementById("editPhone").value =
    reg.phone;

  document.getElementById("editEmergencyContact").value =
    reg.emergency_contact;

  document.getElementById("editEmergencyPhone").value =
    reg.emergency_phone;

  document.getElementById("editAllergies").value =
    reg.allergies || "";

  editDialog.showModal();
}

// Close the editing form
cancelEditButton.addEventListener("click", () => {
  editDialog.close();
});


// Save updated camper registration
editRegistrationForm.addEventListener("submit", async (event) => {

  event.preventDefault();

  const camperId =
    document.getElementById("editCamperId").value;

  const updatedRegistration = {

    camper_first_name:
      document.getElementById("editFirstName").value,

    camper_last_name:
      document.getElementById("editLastName").value,

    camper_age:
      Number(document.getElementById("editAge").value),

    parent_name:
      document.getElementById("editParentName").value,

    email:
      document.getElementById("editEmail").value,

    phone:
      document.getElementById("editPhone").value,

    emergency_contact:
      document.getElementById("editEmergencyContact").value,

    emergency_phone:
      document.getElementById("editEmergencyPhone").value,

    allergies:
      document.getElementById("editAllergies").value
  };

  try {

    const res = await fetch(
      `${API_BASE}/api/registrations/${camperId}`,
      {
        method: "PUT",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`
        },

        body: JSON.stringify(updatedRegistration)
      }
    );

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Unable to update registration.");
      return;
    }

    alert("Registration updated successfully!");

    editDialog.close();

    await loadRegistrations();

  } catch (error) {

    console.error("Update error:", error);

    alert("Unable to update registration.");
  }
});



// Delete camper registration
async function deleteRegistration(reg) {

  const confirmed = confirm(
    `Are you sure you want to delete ${reg.camper_first_name} ` +
    `${reg.camper_last_name}'s registration?\n\n` +
    "This action cannot be undone."
  );

  if (!confirmed) {
    return;
  }

  try {

    const res = await fetch(
      `${API_BASE}/api/registrations/${reg.camper_id}`,
      {
        method: "DELETE",

        headers: {
          Authorization: `Bearer ${adminToken}`
        }
      }
    );

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Unable to delete registration.");
      return;
    }

    alert("Registration deleted successfully.");

    await loadRegistrations();

  } catch (error) {

    console.error("Delete error:", error);

    alert("Unable to delete registration.");
  }
}



// Administrator logout
logoutButton.addEventListener("click", async () => {

  try {

    const res = await fetch(`${API_BASE}/api/admin/logout`, {
      method: "POST",

      headers: {
        Authorization: `Bearer ${adminToken}`
      }
    });

    if (!res.ok && res.status !== 401) {
      alert("Unable to log out. Please try again.");
      return;
    }

    adminToken = "";
    loadedRegistrations = [];

    window.location.reload();

  } catch (error) {

    console.error("Logout error:", error);

    alert("Unable to log out. Please try again.");
  }
});





downloadCsvButton.addEventListener("click", function () {
  if (!loadedRegistrations.length) {
    alert("No registrations to export.");
    return;
  }

  const headers = [
    "Camper ID",
    "Camper First Name",
    "Camper Last Name",
    "Camper Age",
    "Allergies",
    "Photo Release",
    "Waiver Agreed",
    "Parent Name",
    "Email",
    "Phone",
    "Emergency Contact",
    "Emergency Phone",
    "Created At"
  ];

  const csvRows = [
    headers.join(","),
    ...loadedRegistrations.map((r) =>
      [
        r.camper_id,
        r.camper_first_name,
        r.camper_last_name,
        r.camper_age,
        r.allergies || "",
        r.photo_release ? "Yes" : "No",
        r.waiver_agreed ? "Yes" : "No",
        r.parent_name,
        r.email,
        r.phone,
        r.emergency_contact,
        r.emergency_phone,
        r.created_at
      ]
        .map((val) => `"${String(val ?? "").replace(/"/g, '""')}"`)
        .join(",")
    )
  ];

  const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "camp_okra_registrations.csv";
  link.click();
  URL.revokeObjectURL(url);
});

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}