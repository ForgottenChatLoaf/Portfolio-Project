-- Portfolio Database Schema for Ethan McClarence Gacud Portfolio
-- Target Database: portfolio_db
-- Compatibility: MySQL 5.7+ / MySQL 8.0+ / MariaDB (XAMPP phpMyAdmin)

CREATE DATABASE IF NOT EXISTS `portfolio_db` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `portfolio_db`;

-- -------------------------------------------------------------
-- Table: contact_messages
-- Stores contact submissions received via the portfolio contact form
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `contact_messages` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(100) NOT NULL,
    `message` TEXT NOT NULL,
    `date_sent` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `status` ENUM('new', 'read', 'replied', 'archived') NOT NULL DEFAULT 'new'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- Table: admin_users
-- Stores authenticated admin credentials with salted password hash
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `admin_users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(50) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- Default Admin Account
-- Username: admin
-- Default Password: AdminPortfolio2026! (change after initial deployment)
-- Password hash generated using password_hash('AdminPortfolio2026!', PASSWORD_DEFAULT)
-- -------------------------------------------------------------
INSERT INTO `admin_users` (`username`, `password_hash`)
VALUES ('admin', '$2y$10$x86SpTKvME7PQBcjmWhvI.qUUym6zaFwWih9qD1ibTjBbuOlyb5fG')
ON DUPLICATE KEY UPDATE `username` = `username`;
