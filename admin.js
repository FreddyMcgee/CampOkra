const API_BASE = "http://localhost:3000";

const adminLoginForm = document.getElementById("adminLoginForm");
const adminLoginTitle = document.getElementById("adminLoginTitle");
const adminMessage = document.getElementById("adminMessage");
const dashboard = document.getElementById("dashboard");
const totalRegistrationsEl = document.getElementById("totalRegistrations");
const registrationListEl = document.getElementById("registrationList");
const downloadCsvButton = document.getElementById("downloadCsvButton");

let loadedRegistrations = [];

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

    if (!res.ok || !data.success) {
      adminMessage.textContent = data.error || "Login failed.";
      return;
    }

    adminLoginForm.style.display = "none";
    adminLoginTitle.textContent = "Admin Dashboard";
    dashboard.style.display = "block";

    await loadRegistrations();
  } catch (err) {
    console.error("Login error:", err);
    adminMessage.textContent = "Could not connect to server.";
  }
});

async function loadRegistrations() {
  try {
    const res = await fetch(`${API_BASE}/api/registrations`);
    if (!res.ok) {
      adminMessage.textContent = "Failed to load registrations.";
      return;
    }

    const rows = await res.json();
    loadedRegistrations = rows;
    totalRegistrationsEl.textContent = rows.length;
    registrationListEl.innerHTML = "";

    if (rows.length === 0) {
      registrationListEl.innerHTML = "<p>No registrations yet.</p>";
      return;
    }

    rows.forEach((reg) => {
      const card = document.createElement("div");
      card.className = "registration-card";
      card.innerHTML = `
        <p><strong>Camper:</strong> ${escapeHtml(reg.camper_first_name)} ${escapeHtml(reg.camper_last_name)} (Age ${reg.camper_age})</p>
        <p><strong>Parent:</strong> ${escapeHtml(reg.parent_name)} (${escapeHtml(reg.email)} | ${escapeHtml(reg.phone)})</p>
        <p><strong>Emergency Contact:</strong> ${escapeHtml(reg.emergency_contact)} (${escapeHtml(reg.emergency_phone)})</p>
        <p><strong>Allergies:</strong> ${escapeHtml(reg.allergies || "None")}</p>
        <p><strong>Photo Release:</strong> ${reg.photo_release ? "Yes" : "No"} | <strong>Waiver:</strong> ${reg.waiver_agreed ? "Yes" : "No"}</p>
      `;
      registrationListEl.appendChild(card);
    });
  } catch (err) {
    console.error("Error loading registrations:", err);
    adminMessage.textContent = "Error loading registrations.";
  }
}

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