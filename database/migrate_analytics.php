<?php
/**
 * Migration: Create website_visits table for lightweight first-party analytics
 * Target Database: portfolio_db
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';

try {
    $pdo = get_db_connection();

    $sql = "
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
    ";

    $pdo->exec($sql);
    echo "SUCCESS: website_visits table created or already exists.\n";
} catch (Throwable $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    exit(1);
}
