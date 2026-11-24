CREATE DATABASE IF NOT EXISTS camp_db;
USE camp_db;

CREATE TABLE parents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  parent_name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  emergency_contact VARCHAR(150) NOT NULL,
  emergency_phone VARCHAR(30) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE campers (
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