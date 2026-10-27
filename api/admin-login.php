<?php
/**
 * Admin Login Endpoint
 * Endpoint: /api/admin-login.php
 * Method: POST
 * Portfolio of Ethan McClarence Gacud
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/functions.php';

init_secure_session();

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    header('Allow: POST');
    send_json_response(405, [
        'status'  => 'error',
        'message' => 'Method Not Allowed. Expected POST.'
    ]);
}

$input = get_request_data();
$username = trim((string)($input['username'] ?? ''));
$password = (string)($input['password'] ?? '');

if (empty($username) || empty($password)) {
    send_json_response(400, [
        'status'  => 'error',
        'message' => 'Please provide both username and password.'
    ]);
}

// Fallback hash for default classroom demo / local administration
// Default password: AdminPortfolio2026!
$defaultAdminUsername = 'admin';
$defaultPasswordHash = '$2y$10$x86SpTKvME7PQBcjmWhvI.qUUym6zaFwWih9qD1ibTjBbuOlyb5fG';

$authenticated = false;
$resolvedUsername = '';

try {
    $pdo = get_db_connection();
    $stmt = $pdo->prepare('SELECT id, username, password_hash FROM admin_users WHERE username = :u LIMIT 1');
    $stmt->execute([':u' => $username]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password_hash'])) {
        $authenticated = true;
        $resolvedUsername = (string)$user['username'];
    }
} catch (Throwable $e) {
    error_log('Admin Login DB check failed: ' . $e->getMessage());
}

// If DB check did not succeed or table was unavailable, check fallback configuration
if (!$authenticated && hash_equals($defaultAdminUsername, $username) && password_verify($password, $defaultPasswordHash)) {
    $authenticated = true;
    $resolvedUsername = $defaultAdminUsername;
}

if (!$authenticated) {
    // Artificial delay to deter brute-force attempts
    usleep(250000); // 250ms
    send_json_response(401, [
        'status'  => 'error',
        'message' => 'Invalid username or password.'
    ]);
}

// Successful login: regenerate session ID to prevent session fixation
session_regenerate_id(true);
$_SESSION['admin_logged_in'] = true;
$_SESSION['admin_username']  = $resolvedUsername;
$_SESSION['admin_login_at']  = time();

send_json_response(200, [
    'status'  => 'success',
    'message' => 'Authentication successful.',
    'user'    => [
        'username' => $resolvedUsername
    ]
]);
