-- Piano for My Kids - MySQL schema
-- Run: mysql -u root -p < db/schema.sql

CREATE DATABASE IF NOT EXISTS piano_for_my_kids
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE piano_for_my_kids;

-- ----------------------------------------------------------------------
-- Users
-- ----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(64) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  selected_piano_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------
-- Pianos (instrument configurations)
-- ----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pianos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(64) NOT NULL UNIQUE,
  brand VARCHAR(64) NOT NULL,
  model VARCHAR(64) NOT NULL,
  num_keys INT NOT NULL,
  lowest_midi INT NOT NULL,
  highest_midi INT NOT NULL,
  description TEXT,
  is_default TINYINT(1) NOT NULL DEFAULT 0
);

-- ----------------------------------------------------------------------
-- Lessons (curriculum modules)
-- ----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lessons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(80) NOT NULL UNIQUE,
  module VARCHAR(64) NOT NULL,
  title VARCHAR(160) NOT NULL,
  description TEXT,
  difficulty INT NOT NULL DEFAULT 1,
  ordering INT NOT NULL DEFAULT 0,
  steps_json JSON NOT NULL
);

-- ----------------------------------------------------------------------
-- User progress per lesson
-- ----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_progress (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  lesson_id INT NOT NULL,
  completed_steps INT NOT NULL DEFAULT 0,
  total_steps INT NOT NULL DEFAULT 0,
  best_score INT NOT NULL DEFAULT 0,
  attempts INT NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  UNIQUE KEY uniq_user_lesson (user_id, lesson_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
);

-- Sessions table is created automatically by express-mysql-session.

-- ----------------------------------------------------------------------
-- Seed: pianos
-- ----------------------------------------------------------------------
INSERT INTO pianos (slug, brand, model, num_keys, lowest_midi, highest_midi, description, is_default)
VALUES
  ('yamaha-p-145', 'Yamaha', 'P-145', 88, 21, 108,
   '88 fully weighted keys (GHC action). Range A0 to C8. USB-to-Host MIDI supported.', 1),
  ('on-screen-61', 'Generic', '61-key keyboard', 61, 36, 96,
   'Compact 61-key range C2 to C7. Useful for younger kids and small screens.', 0),
  ('on-screen-49', 'Generic', '49-key keyboard', 49, 36, 84,
   '49-key range C2 to C6. Great starter range.', 0)
ON DUPLICATE KEY UPDATE
  brand = VALUES(brand),
  model = VALUES(model),
  num_keys = VALUES(num_keys),
  lowest_midi = VALUES(lowest_midi),
  highest_midi = VALUES(highest_midi),
  description = VALUES(description),
  is_default = VALUES(is_default);
