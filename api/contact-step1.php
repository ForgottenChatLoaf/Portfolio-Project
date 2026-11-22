<?php
/**
 * Contact Step 1: Visitor Name Validation & Session Registration
 * Endpoint: /api/contact-step1.php
 * Method: POST
 * Portfolio of Ethan McClarence Gacud
 */

declare(strict_types=1);

require_once __DIR__ . '/../includes/functions.php';

init_secure_session();

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept, X-Requested-With');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    header('Allow: POST');
    send_json_response(405, [
        'status'  => 'error',
        'message' => 'Method Not Allowed. Expected POST.'
    ]);
}

$input = get_request_data();
$rawName = $input['name'] ?? '';

$validation = is_valid_visitor_name((string)$rawName);
if (!$validation['valid']) {
    send_json_response(422, [
        'status'  => 'error',
        'message' => $validation['error']
    ]);
}

$name = $validation['name'];

// Register validated visitor name in server session
$_SESSION['visitor_name'] = $name;
$_SESSION['contact_form_issued_at'] = time();

send_json_response(200, [
    'status'     => 'success',
    'message'    => 'Name accepted.',
    'name'       => $name,
    'csrf_token' => get_csrf_token()
]);
