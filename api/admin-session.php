<?php
/**
 * Admin Session Verification Endpoint
 * Endpoint: /api/admin-session.php
 * Method: GET
 * Portfolio of Ethan McClarence Gacud
 */

declare(strict_types=1);

require_once __DIR__ . '/../includes/auth.php';

if (is_admin_authenticated()) {
    send_json_response(200, [
        'status'        => 'authenticated',
        'authenticated' => true,
        'user'          => [
            'username' => $_SESSION['admin_username']
        ]
    ]);
} else {
    send_json_response(200, [
        'status'        => 'unauthenticated',
        'authenticated' => false
    ]);
}
