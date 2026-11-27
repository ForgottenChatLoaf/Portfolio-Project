<?php
/**
 * One-Time Administrator Bootstrap Script (CLI Only)
 * Refuses to execute if an administrator is already configured.
 * Usage: php scripts/bootstrap-admin.php
 * Portfolio of Ethan McClarence Gacud
 */

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit("Forbidden: CLI execution only.\n");
}

$rootDir = dirname(__DIR__);
$envPath = $rootDir . '/.env';

// 1. Check if environment already defines an administrator
$existingUser = getenv('ADMIN_USERNAME') ?: '';
$existingHash = getenv('ADMIN_PASSWORD_HASH') ?: '';

if (file_exists($envPath) && is_readable($envPath)) {
    $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [];
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#')) continue;
        if (strpos($line, '=') !== false) {
            [$k, $v] = explode('=', $line, 2);
            $k = trim($k);
            $v = trim($v, " \t\n\r\0\x0B\"'");
            if ($k === 'ADMIN_USERNAME' && $v !== '') $existingUser = $v;
            if ($k === 'ADMIN_PASSWORD_HASH' && $v !== '') $existingHash = $v;
        }
    }
}

if ($existingUser !== '' && $existingHash !== '') {
    fwrite(STDERR, "ABORTED: An administrator ('{$existingUser}') is already provisioned.\n");
    fwrite(STDERR, "To rotate credentials, update ADMIN_PASSWORD_HASH manually as documented in docs/ADMIN_SETUP.md.\n");
    exit(1);
}

// 2. Also check optional admin_users DB table if present
try {
    require_once $rootDir . '/config/database.php';
    $pdo = get_db_connection();
    $tbl = $pdo->query("SHOW TABLES LIKE 'admin_users'")->fetch();
    if (!empty($tbl)) {
        $count = (int)$pdo->query("SELECT COUNT(*) FROM admin_users")->fetchColumn();
        if ($count > 0) {
            fwrite(STDERR, "ABORTED: An administrator record already exists in admin_users.\n");
            exit(1);
        }
    }
} catch (Throwable $e) {
    // Database may not be initialized yet; continue with .env bootstrap
}

// 3. Generate cryptographically secure credentials
$username = $argv[1] ?? 'portfolio_admin';
$alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*-_=+';
$len = strlen($alphabet);
$password = '';
for ($i = 0; $i < 28; $i++) {
    $password .= $alphabet[random_int(0, $len - 1)];
}
$hash = password_hash($password, PASSWORD_DEFAULT);

// 4. Write to .env
$envAppend = "\nADMIN_USERNAME={$username}\nADMIN_PASSWORD_HASH={$hash}\nADMIN_DISPLAY_NAME=Admin\n";
file_put_contents($envPath, $envAppend, FILE_APPEND | LOCK_EX);

// 5. Write to .local-secrets/ADMIN_CREDENTIALS.local.md
$secretsDir = $rootDir . '/.local-secrets';
if (!is_dir($secretsDir)) {
    mkdir($secretsDir, 0700, true);
}
$md = "# Local Administrator Credentials (DO NOT COMMIT)\n\n"
    . "- **Username:** `{$username}`\n"
    . "- **Password:** `{$password}`\n";
file_put_contents($secretsDir . '/ADMIN_CREDENTIALS.local.md', $md);

echo "SUCCESS: Initial administrator '{$username}' provisioned.\n";
echo "Credentials saved to .local-secrets/ADMIN_CREDENTIALS.local.md (gitignored).\n";
