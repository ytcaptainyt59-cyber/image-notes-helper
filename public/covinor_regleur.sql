-- =============================================
-- COVINOR Régleur - Base de données MySQL
-- Importez ce fichier dans phpMyAdmin
-- =============================================

CREATE DATABASE IF NOT EXISTS covinor_regleur
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE covinor_regleur;

-- Table des fiches de conditionnement
CREATE TABLE IF NOT EXISTS fiches (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  codeProduit VARCHAR(255) DEFAULT '',
  reference VARCHAR(255) DEFAULT '',
  dateApplication VARCHAR(255) DEFAULT '',
  designation VARCHAR(255) DEFAULT '',
  client VARCHAR(255) DEFAULT '',
  marque VARCHAR(255) DEFAULT '',
  gencod VARCHAR(255) DEFAULT '',
  bouteille VARCHAR(255) DEFAULT '',
  bouchon VARCHAR(255) DEFAULT '',
  etiquette VARCHAR(255) DEFAULT '',
  colle VARCHAR(255) DEFAULT '',
  dluo VARCHAR(255) DEFAULT '',
  carton VARCHAR(255) DEFAULT '',
  collerCarton VARCHAR(255) DEFAULT '',
  etiquetteCarton VARCHAR(255) DEFAULT '',
  intercalaire VARCHAR(255) DEFAULT '',
  typePalette VARCHAR(255) DEFAULT '',
  palettisation VARCHAR(255) DEFAULT '',
  uvcParCarton VARCHAR(255) DEFAULT '',
  cartonsParCouche VARCHAR(255) DEFAULT '',
  couchesParPalette VARCHAR(255) DEFAULT '',
  uvcParPalette VARCHAR(255) DEFAULT '',
  filmEtirable VARCHAR(255) DEFAULT '',
  etiquettePalette VARCHAR(255) DEFAULT '',
  imageUrl LONGTEXT,
  notes TEXT DEFAULT NULL,
  createdAt VARCHAR(30) DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des notes de format (avec zones machines en JSON)
CREATE TABLE IF NOT EXISTS format_notes (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  title VARCHAR(255) DEFAULT '',
  content TEXT DEFAULT NULL,
  keywords JSON DEFAULT NULL,
  machines JSON DEFAULT NULL,
  createdAt VARCHAR(30) DEFAULT '',
  updatedAt VARCHAR(30) DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des défauts machines
CREATE TABLE IF NOT EXISTS defauts (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  machine VARCHAR(100) DEFAULT '',
  title VARCHAR(255) DEFAULT '',
  description TEXT DEFAULT NULL,
  solution TEXT DEFAULT NULL,
  severity VARCHAR(20) DEFAULT 'medium',
  createdAt VARCHAR(30) DEFAULT '',
  updatedAt VARCHAR(30) DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des utilisateurs (authentification)
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(64) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Utilisateur par défaut : admin / admin123
-- ⚠️ CHANGEZ CE MOT DE PASSE !
-- Pour générer un hash SHA-256 : echo -n "votreMotDePasse" | sha256sum
INSERT INTO users (id, username, password_hash) VALUES (
  UUID(),
  'admin',
  '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9'
);

-- Table des paramètres (inscription à usage unique, etc.)
CREATE TABLE IF NOT EXISTS app_settings (
  keyname VARCHAR(100) NOT NULL PRIMARY KEY,
  val VARCHAR(255) DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
