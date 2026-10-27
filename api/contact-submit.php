<?php
/**
 * Contact Message Submission Endpoint
 * Endpoint: /api/contact-submit.php
 * Method: POST
 * Portfolio of Ethan McClarence Gacud
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/functions.php';

init_secure_session();

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept, X-Requested-With');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only allow POST
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    header('Allow: POST');
    send_json_response(405, [
        'status'  => 'error',
        'message' => 'Method Not Allowed. Expected POST.'
    ]);
}

$input = get_request_data();

$name    = sanitize_text($input['name'] ?? '', 100);
$email   = sanitize_text($input['email'] ?? '', 100);
$message = trim((string)($input['message'] ?? ''));

$errors = [];

// Name validation
if (empty($name)) {
    $errors['name'] = 'Please enter your name.';
} elseif (mb_strlen($name, 'UTF-8') < 2) {
    $errors['name'] = 'Name must be at least 2 characters long.';
}

// Email validation
if (empty($email)) {
    $errors['email'] = 'Please enter your email address.';
} elseif (!is_valid_email($email)) {
    $errors['email'] = 'Please provide a valid email address.';
}

// Message validation
if (empty($message)) {
    $errors['message'] = 'Please enter a message.';
} elseif (mb_strlen($message, 'UTF-8') < 5) {
    $errors['message'] = 'Message must be at least 5 characters.';
} elseif (mb_strlen($message, 'UTF-8') > 5000) {
    $errors['message'] = 'Message must not exceed 5000 characters.';
}

if (!empty($errors)) {
    send_json_response(422, [
        'status'  => 'error',
        'message' => 'Please correct the errors in the form.',
        'errors'  => $errors,
        'old'     => [
            'name'  => $name,
            'email' => $email,
            'message' => $message
        ]
    ]);
}

// Duplicate submission prevention (check last submission in session within 15 seconds)
$now = time();
$lastSubmitHash = $_SESSION['last_contact_hash'] ?? null;
$lastSubmitTime = $_SESSION['last_contact_time'] ?? 0;
$currentHash = hash('sha256', $name . '|' . $email . '|' . $message);

if ($lastSubmitHash === $currentHash && ($now - $lastSubmitTime) < 15) {
    send_json_response(429, [
        'status'  => 'error',
        'message' => 'Duplicate message detected. Please wait a moment before sending another message.'
    ]);
}

try {
    $pdo = get_db_connection();
    $stmt = $pdo->prepare('
        INSERT INTO contact_messages (name, email, message, date_sent) 
        VALUES (:name, :email, :message, NOW())
    ');

    $stmt->execute([
        ':name'    => $name,
        ':email'   => $email,
        ':message' => $message,
    ]);

    // Update session anti-duplicate trackers
    $_SESSION['last_contact_hash'] = $currentHash;
    $_SESSION['last_contact_time'] = $now;

    send_json_response(200, [
        'status'  => 'success',
        'message' => 'Message saved successfully! Ethan will get back to you soon.',
        'data'    => [
            'name'      => $name,
            'date_sent' => date('Y-m-d H:i:s')
        ]
    ]);
} catch (Throwable $e) {
    error_log('Contact Submission Error: ' . $e->getMessage());
    send_json_response(500, [
        'status'  => 'error',
        'message' => 'An error occurred while saving your message. Please try again shortly.'
    ]);
}
