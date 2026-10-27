<?php
/**
 * Admin Session Verification Endpoint
 * Endpoint: /api/admin-session.php
 * Method: GET
 * Portfolio of Ethan McClarence Gacud
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/auth.php';

if (is_admin_authenticated()) {
    $displayName = 'Ethan';
    $avatarUrl = null;
    $accentColor = '#6c63ff';

    try {
        $pdo = get_db_connection();
        $stmt = $pdo->prepare('SELECT display_name, avatar_url, accent_color FROM admin_users WHERE username = :u LIMIT 1');
        $stmt->execute([':u' => $_SESSION['admin_username']]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row) {
            $displayName = !empty($row['display_name']) ? (string)$row['display_name'] : 'Ethan';
            $avatarUrl = !empty($row['avatar_url']) ? (string)$row['avatar_url'] : null;
            $accentColor = !empty($row['accent_color']) ? (string)$row['accent_color'] : '#6c63ff';
        }
    } catch (Throwable $e) {
        error_log('Session profile fetch error: ' . $e->getMessage());
    }

    send_json_response(200, [
        'status'        => 'authenticated',
        'authenticated' => true,
        'user'          => [
            'username'     => $_SESSION['admin_username'],
            'display_name' => $displayName,
            'avatar_url'   => $avatarUrl,
            'accent_color' => $accentColor
        ],
        'csrf_token'    => get_csrf_token()
    ]);
} else {
    send_json_response(200, [
        'status'        => 'unauthenticated',
        'authenticated' => false
    ]);
}
