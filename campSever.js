const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const bcrypt = require("bcrypt");
const crypto = require("crypto");


const app = express();
app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: "127.0.0.1",
  user: "root",
  password: process.env.DB_PASSWORD || "",
  database: "camp_db",
  waitForConnections: true,
  connectionLimit: 10
});
// Change these to your desired admin login credentials


const adminTokens = new Map();

// Verify Administrator access
function requireAdmin(req, res, next) {
  const authorization = req.headers.authorization || "";

  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) 
  : "";

  const expiresAt = adminTokens.get(token);

  if (!expiresAt || expiresAt < Date.now()) {
   adminTokens.delete(token);
    return res.status(401).json({ error: "Unauthorized access. Please log in" });
  }

  next();
}

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
app.post("/api/admin/login", async (req, res) => {
  const { email, password } = req.body;

  if (typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() || !password) {

    return res.status(400).json({
      success: false,
      error: "Email and password are required."
    });
  }

  try {
    const [rows] = await pool.execute(
      "SELECT * FROM admins WHERE email = ?",
      [email.trim()]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password."
      });
    }

    const admin = rows[0];

    const passwordMatch = await bcrypt.compare(
      password,
      admin.password_hash
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password."
      });
    }

    const token = crypto.randomBytes(32).toString("hex");

    adminTokens.set(token, Date.now() + 3600000); // Token valid for 1 hour
    res.json({ success: true, 
      token: token, });

  } catch (error) {
    console.error("Admin login error:", error);

    res.status(500).json({
      success: false,
      error: "Server error during login."
    });
  }
});

// 3. Get all camper + parent registrations for admin dashboard
app.get("/api/registrations", requireAdmin, async (req, res) => {
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

// 4 Update Camper Registration (for admin dashboard)
app.put("/api/registrations/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { camper_first_name,
     camper_last_name, 
     camper_age,
     parent_name, 
     email, 
     phone, 
     emergency_contact, 
     emergency_phone, 
     allergies} = req.body;

  if (!Number.isInteger(camper_age) || camper_age < 1 || camper_age > 17) {
    return res.status(400).json({ error: 
      "Invalid camper age. Please enter a value between 1 and 17." });
  }

  const fields = [
    [camper_first_name, 100],
    [camper_last_name, 100],
    [parent_name, 150],
    [email, 150],
    [phone, 20],
    [emergency_contact, 150],
    [emergency_phone, 20],
  ];

  if (fields.some(([value, max]) => 
    typeof value !== "string" || !value.trim() || value.length().length > max) ||
typeof allergies !== "string") {
  return res.status(400).json({ error: "Invalid registration information." });
}

try {
  const[result] = await pool.execute(`
    UPDATE campers c
    JOIN parents p ON c.parent_id = p.id
    SET
      c.camper_first_name = ?,
      c.camper_last_name = ?,
      c.camper_age = ?,
      c.allergies = ?,
      p.parent_name = ?,
      p.email = ?,
      p.phone = ?,
      p.emergency_contact = ?,
      p.emergency_phone = ?
    WHERE c.id = ?
  `, [
    camper_first_name,
    camper_last_name,
    camper_age,
    allergies,
    parent_name,
    email,
    phone,
    emergency_contact,
    emergency_phone,
    camperId
  ]);

  if (result.affectedRows === 0) {
    return res.status(404).json({ error: "Camper not found." });
  }

  res.json({
    success: true,
    message: "Registration updated successfully."
  });

} catch (error) {
  console.error("Update error:", error);

  res.status(500).json({ error: "Unable to update registration." });
}

});

// 5. Delete Camper Registration (for admin dashboard)
app.delete("/api/registrations/:id", requireAdmin, async (req, res) => {
  const camperId = req.params.id;

  try {
    const [result] = await pool.execute(
      "DELETE FROM campers WHERE id = ?",
      [camperId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Camper not found." });
    }

    res.json({
      success: true,
      message: "Registration deleted successfully."
    });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ error: "Unable to delete registration." });
  }
});

// 6. Admin logout
app.post("/api/admin/logout", requireAdmin, (req, res) => {

const token = req.headers.authorization.slice(7);

  adminTokens.delete(token);
  res.json({ success: true, message: "Logged out successfully." });
});


const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});