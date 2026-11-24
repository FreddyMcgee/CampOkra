const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: "127.0.0.1",
  user: "root", 
  password: "", 
  database: "camp_db",
  waitForConnections: true,
  connectionLimit: 10
});

// Change these to your desired admin login credentials
const ADMIN_EMAIL = "admin@campokra.com";
const ADMIN_PASSWORD = "admin123";

// 1. Submit registration (inserts into parents + campers)
app.post("/api/registrations", async (req, res) => {
  console.log("Registration POST received:", req.body);
  const connection = await pool.getConnection();

  try {
    const {
      parent_name,
      email,
      phone,
      camper_first_name,
      camper_last_name,
      camper_age,
      emergency_contact,
      emergency_phone,
      allergies,
      photo_release,
      waiver_agreed
    } = req.body;

    const parsedAge = parseInt(camper_age, 10);
    const cleanAge = Number.isNaN(parsedAge) ? null : parsedAge;
    const photoReleaseVal = photo_release ? 1 : 0;
    const waiverAgreedVal = waiver_agreed ? 1 : 0;

    await connection.beginTransaction();

    const [parentResult] = await connection.execute(
      `
      INSERT INTO parents (
        parent_name,
        email,
        phone,
        emergency_contact,
        emergency_phone
      ) VALUES (?, ?, ?, ?, ?)
      `,
      [parent_name, email, phone, emergency_contact, emergency_phone]
    );

    const parentId = parentResult.insertId;

    await connection.execute(
      `
      INSERT INTO campers (
        parent_id,
        camper_first_name,
        camper_last_name,
        camper_age,
        allergies,
        photo_release,
        waiver_agreed
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        parentId,
        camper_first_name,
        camper_last_name,
        cleanAge,
        allergies,
        photoReleaseVal,
        waiverAgreedVal
      ]
    );

    await connection.commit();

    res.status(201).json({
      message: "Registration submitted successfully!",
      parent_id: parentId
    });
  } catch (error) {
    await connection.rollback();
    console.error("MySQL transaction error:", error);
    res.status(500).json({ error: "Database error submitting registration." });
  } finally {
    connection.release();
  }
});

// 2. Admin login check
app.post("/api/admin/login", (req, res) => {
  const { email, password } = req.body;

  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    return res.json({ success: true });
  }

  return res.status(401).json({ success: false, error: "Invalid email or password." });
});

// 3. Get all camper + parent registrations for admin dashboard
app.get("/api/registrations", async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT
        c.id AS camper_id,
        c.camper_first_name,
        c.camper_last_name,
        c.camper_age,
        c.allergies,
        c.photo_release,
        c.waiver_agreed,
        p.parent_name,
        p.email,
        p.phone,
        p.emergency_contact,
        p.emergency_phone,
        c.created_at
      FROM campers c
      JOIN parents p ON c.parent_id = p.id
      ORDER BY c.created_at DESC
    `);

    res.json(rows);
  } catch (error) {
    console.error("MySQL select error:", error);
    res.status(500).json({ error: "Database error loading registrations." });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});