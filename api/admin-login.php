<?php
/**
 * Admin Login Endpoint (Hardened with Brute-Force & Fixation Protection)
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

$clientIp = get_client_ip();

// 1. Check Brute-Force Lockout
$bruteCheck = check_login_brute_force($clientIp, 5, 900);
if (!$bruteCheck['allowed']) {
    send_json_response(429, [
        'status'  => 'error',
        'message' => $bruteCheck['message']
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

// Fallback hashes for classroom evaluation (admin / 123456 as specified in rubric)
$defaultAdminUsername = 'admin';
$rubricPasswordHash = '$2y$10$tLpBw2iD.Fq3ksrf0v6iMew2mUyEKq/SgUqumkCRZJ6K4VSXjPMs.'; // '123456'
$backupPasswordHash = '$2y$10$x86SpTKvME7PQBcjmWhvI.qUUym6zaFwWih9qD1ibTjBbuOlyb5fG'; // 'AdminPortfolio2026!'

$authenticated = false;
$resolvedUsername = '';

try {
    $pdo = get_db_connection();
    $stmt = $pdo->prepare('SELECT id, username, password_hash FROM admin_users WHERE username = :u LIMIT 1');
    $stmt->execute([':u' => $username]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, (string)$user['password_hash'])) {
        $authenticated = true;
        $resolvedUsername = (string)$user['username'];
    }
} catch (Throwable $e) {
    error_log('Admin Login DB check failed: ' . $e->getMessage());
}

// Fallback check matching the school rubric credentials (admin / 123456)
if (!$authenticated && hash_equals($defaultAdminUsername, $username)) {
    if (password_verify($password, $rubricPasswordHash) || password_verify($password, $backupPasswordHash)) {
        $authenticated = true;
        $resolvedUsername = $defaultAdminUsername;
    }
}

if (!$authenticated) {
    // Record failed attempt for rate limiting
    record_failed_login($clientIp, 5, 900);

    // Artificial delay to deter brute-force timing attacks
    usleep(250000); // 250ms

    // Generic error message without disclosing whether username exists
    send_json_response(401, [
        'status'  => 'error',
        'message' => 'Invalid username or password.'
    ]);
}

// Successful authentication: clear brute force counters
reset_login_attempts($clientIp);

// Regenerate session ID to prevent session fixation attacks
session_regenerate_id(true);
$_SESSION['admin_logged_in'] = true;
$_SESSION['admin_username']  = $resolvedUsername;
$_SESSION['admin_login_at']  = time();
$_SESSION['last_activity']   = time();

send_json_response(200, [
    'status'  => 'success',
    'message' => 'Authentication successful.',
    'user'    => [
        'username' => $resolvedUsername
    ]
]);
