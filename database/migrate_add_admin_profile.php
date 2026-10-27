<?php
/**
 * Database Migration: Add Profile Customization Fields to admin_users
 * Adds 'display_name', 'avatar_url', and 'accent_color'
 * Preserves existing admin account and password hashes.
 * Portfolio of Ethan McClarence Gacud
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/functions.php';

if (php_sapi_name() !== 'cli') {
    require_once __DIR__ . '/../includes/auth.php';
    if (!is_admin_authenticated()) {
        http_response_code(403);
        echo json_encode(['status' => 'error', 'message' => 'Migration can only be executed via CLI or authenticated admin session.']);
        exit;
    }
}

echo "=== Portfolio Database Migration: Add Admin Profile Customization Fields ===\n";

try {
    $pdo = get_db_connection();
    echo "[1/5] Connected to database: portfolio_db\n";

    // 1. Check if admin_users exists
    $tableCheck = $pdo->query("SHOW TABLES LIKE 'admin_users'")->fetchAll();
    if (empty($tableCheck)) {
        throw new RuntimeException("Table 'admin_users' does not exist in database.");
    }

    $initialCount = (int)$pdo->query("SELECT COUNT(*) FROM admin_users")->fetchColumn();
    echo "[2/5] Table 'admin_users' found with {$initialCount} existing admin account(s).\n";

    // 2. Backup table
    $backupTableName = 'admin_users_backup_' . date('Ymd_His');
    $pdo->exec("CREATE TABLE `{$backupTableName}` AS SELECT * FROM `admin_users`");
    $backupCount = (int)$pdo->query("SELECT COUNT(*) FROM `{$backupTableName}`")->fetchColumn();
    echo "[3/5] Backup created successfully: '{$backupTableName}' ({$backupCount} records backed up).\n";

    // 3. Add columns if not already present
    $existingCols = [];
    $colsStmt = $pdo->query("SHOW COLUMNS FROM `admin_users`");
    while ($col = $colsStmt->fetch(PDO::FETCH_ASSOC)) {
        $existingCols[] = $col['Field'];
    }

    echo "[4/5] Checking schema for required profile fields...\n";

    if (!in_array('display_name', $existingCols, true)) {
        $pdo->exec("ALTER TABLE `admin_users` ADD COLUMN `display_name` VARCHAR(100) NOT NULL DEFAULT 'Ethan' AFTER `username`");
        echo "      + Column 'display_name' added.\n";
    } else {
        echo "      = Column 'display_name' already exists.\n";
    }

    if (!in_array('avatar_url', $existingCols, true)) {
        $pdo->exec("ALTER TABLE `admin_users` ADD COLUMN `avatar_url` VARCHAR(255) NULL DEFAULT NULL AFTER `display_name`");
        echo "      + Column 'avatar_url' added.\n";
    } else {
        echo "      = Column 'avatar_url' already exists.\n";
    }

    if (!in_array('accent_color', $existingCols, true)) {
        $pdo->exec("ALTER TABLE `admin_users` ADD COLUMN `accent_color` VARCHAR(30) NOT NULL DEFAULT '#6c63ff' AFTER `avatar_url`");
        echo "      + Column 'accent_color' added.\n";
    } else {
        echo "      = Column 'accent_color' already exists.\n";
    }

    // 4. Verification
    $afterCount = (int)$pdo->query("SELECT COUNT(*) FROM `admin_users`")->fetchColumn();
    if ($afterCount !== $initialCount) {
        throw new RuntimeException("Data integrity anomaly: record count changed from {$initialCount} to {$afterCount}!");
    }

    // Verify existing admin user has default values if null/empty
    $pdo->exec("UPDATE `admin_users` SET `display_name` = 'Ethan' WHERE `display_name` IS NULL OR `display_name` = ''");
    $pdo->exec("UPDATE `admin_users` SET `accent_color` = '#6c63ff' WHERE `accent_color` IS NULL OR `accent_color` = ''");

    echo "[5/5] Migration completed successfully. Admin profile fields are now active.\n";
    echo "=========================================================================\n";

} catch (Throwable $e) {
    echo "\n[ERROR] Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
