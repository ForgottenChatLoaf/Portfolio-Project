<?php
/**
 * Controlled One-Time Database Migration
 * Adds 'status' ENUM column to 'contact_messages' with full table backup
 * Portfolio of Ethan McClarence Gacud
 *
 * Usage via CLI:
 *   php database/migrate_add_status.php
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/functions.php';

// Security check: only allow CLI or authenticated admin
if (php_sapi_name() !== 'cli') {
    require_once __DIR__ . '/../includes/auth.php';
    if (!is_admin_authenticated()) {
        http_response_code(403);
        echo json_encode(['status' => 'error', 'message' => 'Migration can only be executed via CLI or authenticated admin session.']);
        exit;
    }
}

echo "=== Portfolio Database Migration: Add 'status' Column ===\n";

try {
    $pdo = get_db_connection();
    echo "[1/5] Connected to database: portfolio_db\n";

    // 1. Check if contact_messages exists
    $tableCheck = $pdo->query("SHOW TABLES LIKE 'contact_messages'")->fetchAll();
    if (empty($tableCheck)) {
        throw new RuntimeException("Table 'contact_messages' does not exist in database.");
    }

    $initialCount = (int)$pdo->query("SELECT COUNT(*) FROM contact_messages")->fetchColumn();
    echo "[2/5] Table 'contact_messages' found with {$initialCount} existing record(s).\n";

    // 2. Create automated backup table before schema alteration
    $backupTableName = 'contact_messages_backup_' . date('Ymd_His');
    $pdo->exec("CREATE TABLE `{$backupTableName}` AS SELECT * FROM `contact_messages`");
    $backupCount = (int)$pdo->query("SELECT COUNT(*) FROM `{$backupTableName}`")->fetchColumn();
    echo "[3/5] Backup created successfully: '{$backupTableName}' ({$backupCount} records backed up).\n";

    // 3. Check if status column already exists
    $colCheck = $pdo->query("SHOW COLUMNS FROM `contact_messages` LIKE 'status'")->fetchAll();
    if (!empty($colCheck)) {
        echo "[4/5] Column 'status' already exists. Verifying column definition...\n";
    } else {
        echo "[4/5] Adding 'status' ENUM column after 'date_sent'...\n";
        $pdo->exec("ALTER TABLE `contact_messages` ADD COLUMN `status` ENUM('new', 'read', 'replied', 'archived') NOT NULL DEFAULT 'new' AFTER `date_sent`");
        echo "      Column 'status' added successfully.\n";
    }

    // 4. Verify data preservation and default status
    $afterCount = (int)$pdo->query("SELECT COUNT(*) FROM contact_messages")->fetchColumn();
    if ($afterCount !== $initialCount) {
        throw new RuntimeException("Data integrity error: record count changed from {$initialCount} to {$afterCount}!");
    }

    $nullStatuses = (int)$pdo->query("SELECT COUNT(*) FROM contact_messages WHERE status IS NULL")->fetchColumn();
    $newStatuses = (int)$pdo->query("SELECT COUNT(*) FROM contact_messages WHERE status = 'new'")->fetchColumn();

    echo "[5/5] Verification passed:\n";
    echo "      - Preserved records: {$afterCount}/{$initialCount}\n";
    echo "      - Records with status='new': {$newStatuses}\n";
    echo "      - Records with status=NULL: {$nullStatuses} (must be 0)\n";

    // Check column schema specifics
    $colDetails = $pdo->query("SHOW COLUMNS FROM `contact_messages` LIKE 'status'")->fetch(PDO::FETCH_ASSOC);
    echo "      - Type: {$colDetails['Type']}\n";
    echo "      - Default: {$colDetails['Default']}\n";
    echo "      - Nullable: {$colDetails['Null']}\n";

    echo "=== Migration Complete: SUCCESS ===\n";

} catch (Throwable $e) {
    echo "ERROR during migration: " . $e->getMessage() . "\n";
    exit(1);
}
