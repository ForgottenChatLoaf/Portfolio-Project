<?php
/**
 * Contact Message Submission Endpoint (Secured, Validated & Hardened)
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
$honeypot = trim((string)($input['website_url'] ?? $input['website'] ?? ''));
if (!empty($honeypot)) {
    // Return friendly generic response to bot without inserting
    send_json_response(200, [
        'status'  => 'success',
        'message' => 'Thank you for reaching out.'
    ]);
}

// 3. CSRF Token Verification
$clientCsrf = $input['csrf_token'] ?? $_SERVER['HTTP_X_CSRF_TOKEN'] ?? null;
if (empty($clientCsrf) || !verify_csrf_token((string)$clientCsrf)) {
    send_json_response(403, [
        'status'  => 'error',
        'message' => 'Invalid or expired security token (CSRF). Please reload the page and try again.'
    ]);
}

// 4. Server-side Rate Limiting (max 5 submissions per 10 minutes)
if (!check_contact_rate_limit(5, 600)) {
    send_json_response(429, [
        'status'  => 'error',
        'message' => 'Too many submissions received. Please wait a few minutes before submitting again.'
    ]);
}

// 5. Visitor Name Verification from Session State
$sessionName = $_SESSION['visitor_name'] ?? null;
$submittedName = trim((string)($input['name'] ?? ''));

// Prioritize verified session name, or validate submitted name if present
$finalName = '';
if (!empty($sessionName) && is_string($sessionName)) {
    $nameCheck = is_valid_visitor_name($sessionName);
    if ($nameCheck['valid']) {
        $finalName = $nameCheck['name'];
    }
}

if ($finalName === '' && !empty($submittedName)) {
    $nameCheck = is_valid_visitor_name($submittedName);
    if ($nameCheck['valid']) {
        $finalName = $nameCheck['name'];
        $_SESSION['visitor_name'] = $finalName;
    }
}

$errors = [];

if ($finalName === '') {
    $errors['name'] = 'Please provide your name first in Step 1.';
}

// 6. Email Validation & Reserved Domain Rejection
$submittedEmail = trim((string)($input['email'] ?? ''));
$emailCheck = is_valid_email($submittedEmail);
if (!$emailCheck['valid']) {
    $errors['email'] = $emailCheck['error'];
}
$finalEmail = $emailCheck['valid'] ? $emailCheck['email'] : '';

// 7. Message Validation
$rawMessage = (string)($input['message'] ?? '');
$trimmedMessage = trim($rawMessage);

if ($trimmedMessage === '') {
    $errors['message'] = 'Please enter your message.';
} elseif (mb_strlen($trimmedMessage, 'UTF-8') < 5) {
    $errors['message'] = 'Message must be at least 5 characters long.';
} elseif (mb_strlen($trimmedMessage, 'UTF-8') > 2000) {
    $errors['message'] = 'Your message is too long (maximum 2,000 characters).';
}

if (!empty($errors)) {
    send_json_response(422, [
        'status'  => 'error',
        'message' => 'Please correct the highlighted fields.',
        'errors'  => $errors,
        'old'     => [
            'name'    => $finalName,
            'email'   => $finalEmail,
            'message' => $trimmedMessage
        ]
    ]);
}

// 8. Accidental Duplicate Submission Prevention (within 15 seconds)
$now = time();
$lastSubmitHash = $_SESSION['last_contact_hash'] ?? null;
$lastSubmitTime = $_SESSION['last_contact_time'] ?? 0;
$currentHash = hash('sha256', $finalName . '|' . $finalEmail . '|' . $trimmedMessage);

if ($lastSubmitHash === $currentHash && ($now - (int)$lastSubmitTime) < 15) {
    send_json_response(429, [
        'status'  => 'error',
        'message' => 'Duplicate submission detected. Your message was already recorded.'
    ]);
}

// 9. Prepared Statement Execution into MySQL (portfolio_db.contact_messages)
try {
    $pdo = get_db_connection();
    $stmt = $pdo->prepare('
        INSERT INTO contact_messages (name, email, message, date_sent, status) 
        VALUES (:name, :email, :message, NOW(), :status)
    ');

    $stmt->execute([
        ':name'    => $finalName,
        ':email'   => $finalEmail,
        ':message' => $trimmedMessage,
        ':status'  => 'new'
    ]);

    // Update anti-duplicate tracking in session
    $_SESSION['last_contact_hash'] = $currentHash;
    $_SESSION['last_contact_time'] = $now;

    // Refresh CSRF token for subsequent requests
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));

    send_json_response(200, [
        'status'     => 'success',
        'title'      => 'Message received!',
        'message'    => "Thank you for reaching out, {$finalName}. Your message has been saved successfully. I will review it and reply as soon as possible.",
        'csrf_token' => $_SESSION['csrf_token'],
        'data'       => [
            'name'      => $finalName,
            'date_sent' => date('Y-m-d H:i:s')
        ]
    ]);
} catch (Throwable $e) {
    // Log privately without exposing database credentials or query syntax
    error_log('Contact Submission Database Error: ' . $e->getMessage());
    send_json_response(500, [
        'status'  => 'error',
        'message' => 'A server error occurred while saving your message. Please try again later.'
    ]);
}
