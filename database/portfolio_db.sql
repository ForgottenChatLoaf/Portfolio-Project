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
    `display_name` VARCHAR(100) NOT NULL DEFAULT 'Ethan',
    `avatar_url` VARCHAR(255) NULL DEFAULT NULL,
    `accent_color` VARCHAR(30) NOT NULL DEFAULT '#6c63ff',
    `password_hash` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- Table: website_visits
-- Stores privacy-friendly anonymous first-party visitor metrics
-- Detailed records retained for 90 days
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `website_visits` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `visitor_hash` VARCHAR(64) NOT NULL,
    `page_path` VARCHAR(150) NOT NULL,
    `user_agent` VARCHAR(255) NULL,
    `visited_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_visited_at` (`visited_at`),
    INDEX `idx_visitor_hash` (`visitor_hash`),
    INDEX `idx_page_path` (`page_path`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- Administrator Provisioning
-- Admin accounts should be provisioned securely via CLI or secure one-time setup.
-- Example provisioning command:
-- php -r "require 'config/database.php'; \$pdo = get_db_connection(); ..."
-- -------------------------------------------------------------
