<?php
/**
 * Admin Session Verification Endpoint
 * Endpoint: /api/admin-session.php
 * Method: GET
 * Portfolio of Ethan McClarence Gacud
 */

declare(strict_types=1);

require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/profile_store.php';

if (is_admin_authenticated()) {
    $adminUsername = (string)($_SESSION['admin_username'] ?? 'admin');
    $profile = get_stored_admin_profile($adminUsername);

    send_json_response(200, [
        'status'        => 'authenticated',
        'authenticated' => true,
        'user'          => [
            'username'     => $adminUsername,
            'display_name' => $profile['display_name'] ?? 'Ethan',
            'avatar_url'   => $profile['avatar_url'] ?: null,
            'accent_color' => $profile['accent_color'] ?: '#6c63ff'
        ],
        'csrf_token'    => get_csrf_token()
    ]);
} else {
    send_json_response(200, [
        'status'        => 'unauthenticated',
        'authenticated' => false
    ]);
}
