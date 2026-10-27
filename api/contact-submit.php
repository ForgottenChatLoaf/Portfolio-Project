<?php
/**
 * Contact Message Submission Endpoint (Secured & Hardened)
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
header('Access-Control-Allow-Headers: Content-Type, Accept, X-Requested-With, X-CSRF-Token');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 1. Verify HTTP Method
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    header('Allow: POST');
    send_json_response(405, [
        'status'  => 'error',
        'message' => 'Method Not Allowed. Expected POST.'
    ]);
}

$input = get_request_data();

// 2. Lightweight Honeypot Bot Detection
// If the hidden website_url field contains anything, reject silently or with friendly notice
$honeypot = trim((string)($input['website_url'] ?? $input['website'] ?? ''));
if (!empty($honeypot)) {
    // Artificial bot response
    send_json_response(200, [
        'status'  => 'success',
        'message' => 'Message received successfully.'
    ]);
}

// 3. Minimum Completion Time Check (server-side, tamper-proof)
$issuedAt = (int)($_SESSION['contact_form_issued_at'] ?? 0);
if ($issuedAt > 0 && (time() - $issuedAt) < 3) {
    send_json_response(422, [
        'status'  => 'error',
        'message' => 'Submission received too quickly. Please take a moment before submitting.'
    ]);
}

// 4. CSRF Token Verification (strictly required)
$clientCsrf = $input['csrf_token'] ?? $_SERVER['HTTP_X_CSRF_TOKEN'] ?? null;
if (empty($clientCsrf) || !verify_csrf_token((string)$clientCsrf)) {
    send_json_response(403, [
        'status'  => 'error',
        'message' => 'Invalid or missing security token (CSRF). Please reload the page and try again.'
    ]);
}

// 5. Server-side Rate Limiting (max 5 submissions per 10 minutes)
if (!check_contact_rate_limit(5, 600)) {
    send_json_response(429, [
        'status'  => 'error',
        'message' => 'Please wait before submitting another message. Rate limit reached.'
    ]);
}

// 6. Input Extraction & Server-side Validation
$name    = sanitize_text($input['name'] ?? '', 100);
$email   = sanitize_text($input['email'] ?? '', 100);
$message = trim((string)($input['message'] ?? ''));

$errors = [];

// Name validation
if (empty($name)) {
    $errors['name'] = 'Please enter your name.';
} elseif (mb_strlen($name, 'UTF-8') < 2) {
    $errors['name'] = 'Name must be at least 2 characters long.';
} elseif (mb_strlen($name, 'UTF-8') > 100) {
    $errors['name'] = 'Name must not exceed 100 characters.';
}

// Email validation
if (empty($email)) {
    $errors['email'] = 'Please enter your email address.';
} elseif (!is_valid_email($email)) {
    $errors['email'] = 'Please provide a valid email address.';
}

// Message validation (sensible limit: 2,000 characters)
if (empty($message)) {
    $errors['message'] = 'Please enter a message.';
} elseif (mb_strlen($message, 'UTF-8') < 5) {
    $errors['message'] = 'Message must be at least 5 characters.';
} elseif (mb_strlen($message, 'UTF-8') > 2000) {
    $errors['message'] = 'Your message is too long (maximum 2,000 characters).';
}

if (!empty($errors)) {
    send_json_response(422, [
        'status'  => 'error',
        'message' => 'Please correct the highlighted fields.',
        'errors'  => $errors,
        'old'     => [
            'name'  => $name,
            'email' => $email,
            'message' => $message
        ]
    ]);
}

// 7. Duplicate Submission Prevention (within 15 seconds)
$now = time();
$lastSubmitHash = $_SESSION['last_contact_hash'] ?? null;
$lastSubmitTime = $_SESSION['last_contact_time'] ?? 0;
$currentHash = hash('sha256', $name . '|' . $email . '|' . $message);

if ($lastSubmitHash === $currentHash && ($now - (int)$lastSubmitTime) < 15) {
    send_json_response(429, [
        'status'  => 'error',
        'message' => 'Duplicate submission detected. Please wait a moment before sending another message.'
    ]);
}

// 8. Prepared Statement Execution
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

    // Update anti-duplicate tracking in session
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
    // Privately log error without exposing SQL/paths to visitor
    error_log('Contact Submission Error: ' . $e->getMessage());
    send_json_response(500, [
        'status'  => 'error',
        'message' => "We couldn't submit your message. Please try again later."
    ]);
}
