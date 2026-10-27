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
