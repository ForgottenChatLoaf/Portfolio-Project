<?php
/**
 * CSRF Token Generation Endpoint
 * Endpoint: /api/csrf-token.php
 * Method: GET
 * Portfolio of Ethan McClarence Gacud
 */

declare(strict_types=1);

require_once __DIR__ . '/../includes/functions.php';

init_secure_session();

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$token = get_csrf_token();
$_SESSION['contact_form_issued_at'] = time();

send_json_response(200, [
    'status'     => 'success',
    'csrf_token' => $token
]);
