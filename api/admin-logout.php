<?php
/**
 * Admin Logout Endpoint
 * Endpoint: /api/admin-logout.php
 * Method: POST, GET
 * Portfolio of Ethan McClarence Gacud
 */

declare(strict_types=1);

require_once __DIR__ . '/../includes/auth.php';

destroy_admin_session();

send_json_response(200, [
    'status'  => 'success',
    'message' => 'Logged out successfully.'
]);
