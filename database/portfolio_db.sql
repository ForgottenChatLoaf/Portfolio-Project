-- =============================================================
-- Portfolio Database Schema for Ethan McClarence Gacud Portfolio
-- Database: portfolio_db
-- Engine: InnoDB
-- Character Set: utf8mb4 / utf8mb4_unicode_ci
-- NOTE: Strictly schema only. NO mock data or seed messages.
-- =============================================================

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
    `status` ENUM('new', 'read', 'replied', 'archived') NOT NULL DEFAULT 'new',
    INDEX `idx_date_sent` (`date_sent`),
    INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Table: website_visits  (optional/bonus analytics table)
-- Records anonymous public page views for the admin dashboard.
-- Privacy-friendly: only hashed visitor tokens are stored.
-- ============================================================
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
