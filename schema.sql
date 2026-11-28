CREATE DATABASE IF NOT EXISTS camp_db;
USE camp_db;

CREATE TABLE IF NOT EXISTS parents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  parent_name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  emergency_contact VARCHAR(150) NOT NULL,
  emergency_phone VARCHAR(30) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS campers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  parent_id INT NOT NULL,
  camper_first_name VARCHAR(100) NOT NULL,
  camper_last_name VARCHAR(100) NOT NULL,
  camper_age INT NOT NULL,
  allergies TEXT,
  photo_release TINYINT(1) NOT NULL DEFAULT 0,
  waiver_agreed TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_campers_parent
    FOREIGN KEY (parent_id) REFERENCES parents(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(150) UNIQUE NOT NULL, 
  password_hash VARCHAR(255) NOT NULL
  );


  -- Default administrator account
INSERT IGNORE INTO admins (email, password_hash)
VALUES (
    'admin@campokra.com',
    '$2b$10$qbqvJzeTjQfG98OcN3xm8eT.rciOKkpZwm6Q9VJx/bL94j7kRdg5q'
);

-- ==========================================
-- SAMPLE CAMP OKRA REGISTRATIONS
-- ==========================================

START TRANSACTION;

INSERT INTO parents (
    parent_name,
    email,
    phone,
    emergency_contact,
    emergency_phone
)
VALUES
('Michael Smith', 'test.michael@example.com', '912-555-0101', 'Linda Smith', '912-555-0151'),
('Ashley Williams', 'test.ashley@example.com', '912-555-0102', 'Robert Williams', '912-555-0152'),
('Jessica Johnson', 'test.jessica@example.com', '912-555-0103', 'Mary Johnson', '912-555-0153'),
('Christopher Brown', 'test.chris@example.com', '912-555-0104', 'Lisa Brown', '912-555-0154'),
('Amanda Davis', 'test.amanda@example.com', '912-555-0105', 'James Davis', '912-555-0155'),
('David Jackson', 'test.david@example.com', '912-555-0106', 'Patricia Jackson', '912-555-0156'),
('Michelle Thomas', 'test.michelle@example.com', '912-555-0107', 'Kevin Thomas', '912-555-0157'),
('James Wilson', 'test.james@example.com', '912-555-0108', 'Sarah Wilson', '912-555-0158'),
('Nicole Robinson', 'test.nicole@example.com', '912-555-0109', 'Daniel Robinson', '912-555-0159'),
('Anthony Harris', 'test.anthony@example.com', '912-555-0110', 'Angela Harris', '912-555-0160');

-- Insert campers using their parents' IDs

INSERT INTO campers (
    parent_id,
    camper_first_name,
    camper_last_name,
    camper_age,
    allergies,
    photo_release,
    waiver_agreed
)
SELECT id, 'Jordan', 'Smith', 8, 'None', 1, 1
FROM parents WHERE email = 'test.michael@example.com'

UNION ALL

SELECT id, 'Taylor', 'Williams', 10, 'Peanuts', 1, 1
FROM parents WHERE email = 'test.ashley@example.com'

UNION ALL

SELECT id, 'Cameron', 'Johnson', 6, 'None', 1, 1
FROM parents WHERE email = 'test.jessica@example.com'

UNION ALL

SELECT id, 'Morgan', 'Brown', 12, 'Dairy', 0, 1
FROM parents WHERE email = 'test.chris@example.com'

UNION ALL

SELECT id, 'Avery', 'Davis', 9, 'None', 1, 1
FROM parents WHERE email = 'test.amanda@example.com'

UNION ALL

SELECT id, 'Jayden', 'Jackson', 13, 'Tree Nuts', 1, 1
FROM parents WHERE email = 'test.david@example.com'

UNION ALL

SELECT id, 'Amari', 'Thomas', 7, 'None', 0, 1
FROM parents WHERE email = 'test.michelle@example.com'

UNION ALL

SELECT id, 'Zion', 'Wilson', 11, 'None', 1, 1
FROM parents WHERE email = 'test.james@example.com'

UNION ALL

SELECT id, 'Olivia', 'Robinson', 8, 'Gluten', 1, 1
FROM parents WHERE email = 'test.nicole@example.com'

UNION ALL

SELECT id, 'Aaliyah', 'Harris', 6, 'None', 0, 1
FROM parents WHERE email = 'test.anthony@example.com';

COMMIT;