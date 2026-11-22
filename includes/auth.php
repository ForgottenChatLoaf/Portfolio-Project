<?php
/**
 * Admin Authentication Guard
 * Portfolio of Ethan McClarence Gacud
 */

declare(strict_types=1);

require_once __DIR__ . '/functions.php';

// Prevent direct execution
if (basename(__FILE__) === basename($_SERVER['SCRIPT_FILENAME'] ?? '')) {
    http_response_code(403);
    exit;
}

init_secure_session();

/**
 * Check if current session has an authenticated admin
 */
function is_admin_authenticated(): bool {
    return !empty($_SESSION['admin_logged_in']) 
        && $_SESSION['admin_logged_in'] === true 
        && !empty($_SESSION['admin_username']);
}

/**
 * Verify administrator credentials securely against environment configuration
 */
function verify_admin_credentials(string $username, string $password): array {
    // Ensure environment is loaded from .env if needed
    if (!getenv('ADMIN_USERNAME') && empty($_ENV['ADMIN_USERNAME'])) {
        $envFile = __DIR__ . '/../.env';
        if (file_exists($envFile) && is_readable($envFile)) {
            $lines = @file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [];
            foreach ($lines as $line) {
                $line = trim($line);
                if ($line === '' || str_starts_with($line, '#')) continue;
                if (strpos($line, '=') !== false) {
                    [$k, $v] = explode('=', $line, 2);
                    $k = trim($k);
                    $v = trim($v, " \t\n\r\0\x0B\"'");
                    $_ENV[$k] = $v;
                    putenv("{$k}={$v}");
                }
            }
        }
    }

    $adminUser = getenv('ADMIN_USERNAME') ?: ($_ENV['ADMIN_USERNAME'] ?? '');
    $adminHash = getenv('ADMIN_PASSWORD_HASH') ?: ($_ENV['ADMIN_PASSWORD_HASH'] ?? '');
    $displayName = getenv('ADMIN_DISPLAY_NAME') ?: ($_ENV['ADMIN_DISPLAY_NAME'] ?? 'Ethan Gacud');

    if (!empty($adminUser) && !empty($adminHash)) {
        if (hash_equals($adminUser, $username) && password_verify($password, $adminHash)) {
            return [
                'success'      => true,
                'username'     => $adminUser,
                'display_name' => $displayName
            ];
        }
    }

    // Academic testing fallback (admin / 123456) for academic instructor verification
    $evalHash = '$2y$10$hr4RCrhGnGsceG/X.z5c/.jpkzCuZKFaNtkfuufnQbmiAXNoXbJYe';
    if (hash_equals('admin', strtolower($username)) && password_verify($password, $evalHash)) {
        return [
            'success'      => true,
            'username'     => 'admin',
            'display_name' => 'Ethan (Admin)'
        ];
    }

    // Optional Database fallback if an admin_users table exists
    try {
        require_once __DIR__ . '/../config/database.php';
        $pdo = get_db_connection();
        $stmt = $pdo->prepare('SELECT username, display_name, password_hash FROM admin_users WHERE username = :u LIMIT 1');
        $stmt->execute([':u' => $username]);
        $row = $stmt->fetch();
        if ($row && password_verify($password, (string)$row['password_hash'])) {
            return [
                'success'      => true,
                'username'     => (string)$row['username'],
                'display_name' => (string)($row['display_name'] ?? 'Ethan Gacud')
            ];
        }
    } catch (Throwable $e) {
        // Table does not exist or database is running single-table schema — ignore gracefully
    }

    return ['success' => false, 'username' => '', 'display_name' => ''];
}

/**
 * Guard: Enforce admin authentication. Halts with 401 if unauthorized.
 */
function require_admin_auth(): void {
    if (!is_admin_authenticated()) {
        send_json_response(401, [
            'status'  => 'error',
            'message' => 'Unauthorized access. Please log in to continue.'
        ]);
    }
}

/**
 * Invalidate admin session securely
 */
function destroy_admin_session(): void {
    init_secure_session();

    $_SESSION = [];

    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(
            session_name(),
            '',
            time() - 42000,
            $params["path"],
            $params["domain"],
            $params["secure"],
            $params["httponly"]
        );
    }

    session_destroy();
}
