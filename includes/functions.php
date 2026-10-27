<?php
/**
 * Common Helper Functions
 * Portfolio of Ethan McClarence Gacud
 */

declare(strict_types=1);

// Prevent direct execution
if (basename(__FILE__) === basename($_SERVER['SCRIPT_FILENAME'] ?? '')) {
    http_response_code(403);
    exit;
}

/**
 * Start session securely if not already active
 */
function init_secure_session(): void {
    if (session_status() === PHP_SESSION_NONE) {
        $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
            || ($_SERVER['SERVER_PORT'] ?? '') == 443
            || (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https');

        session_set_cookie_params([
            'lifetime' => 0, // Until browser closes
            'path'     => '/',
            'domain'   => '',
            'secure'   => $isHttps,
            'httponly' => true,
            'samesite' => 'Lax'
        ]);

        session_start();
    }
}

/**
 * Standard JSON Response Sender
 */
function send_json_response(int $statusCode, array $payload): void {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=UTF-8');
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Parse incoming request data (handles JSON or form-encoded POST)
 */
function get_request_data(): array {
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    if (stripos($contentType, 'application/json') !== false) {
        $raw = file_get_contents('php://input');
        if (empty($raw)) {
            return [];
        }
        $decoded = json_decode($raw, true);
        return is_array($decoded) ? $decoded : [];
    }

    return $_POST;
}

/**
 * Sanitize plain string input
 */
function sanitize_text(?string $input, int $maxLength = 100): string {
    if ($input === null) {
        return '';
    }
    $trimmed = trim($input);
    // Strip control characters except standard whitespace
    $clean = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $trimmed);
    return mb_substr($clean, 0, $maxLength, 'UTF-8');
}

/**
 * Validate email format
 */
function is_valid_email(?string $email): bool {
    if (empty($email)) {
        return false;
    }
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false && mb_strlen($email, 'UTF-8') <= 100;
}

/**
 * Safe HTML escaping
 */
function escape_html(?string $value): string {
    return htmlspecialchars($value ?? '', ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
