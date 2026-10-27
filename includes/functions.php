<?php
/**
 * Common Helper Functions & Security Hardening
 * Portfolio of Ethan McClarence Gacud
 */

declare(strict_types=1);

// Prevent direct execution
if (basename(__FILE__) === basename($_SERVER['SCRIPT_FILENAME'] ?? '')) {
    http_response_code(403);
    exit;
}

// In production, suppress direct PHP error display to visitors and log privately
ini_set('display_errors', '0');
ini_set('log_errors', '1');

/**
 * Start session securely with strict cookie flags & inactivity timeout
 */
function init_secure_session(): void {
    if (session_status() === PHP_SESSION_NONE) {
        $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
            || ($_SERVER['SERVER_PORT'] ?? '') == 443
            || (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https');

        ini_set('session.use_strict_mode', '1');
        ini_set('session.use_only_cookies', '1');

        session_set_cookie_params([
            'lifetime' => 0, // Session cookie (until browser closes)
            'path'     => '/',
            'domain'   => '',
            'secure'   => $isHttps,
            'httponly' => true,
            'samesite' => 'Lax'
        ]);

        session_start();
    }

    // Inactivity timeout: 30 minutes (1800 seconds)
    $now = time();
    $timeout = 1800;
    if (isset($_SESSION['last_activity']) && ($now - (int)$_SESSION['last_activity']) > $timeout) {
        // Expired session
        $_SESSION = [];
        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(
                session_name(),
                '',
                time() - 42000,
                $params["path"],
                $params["domain"],
                $params["secure"],
                $params["httponly"]
            );
        }
        session_destroy();
        session_start();
    }
    $_SESSION['last_activity'] = $now;
}

/**
 * Standard Security Headers
 */
function send_security_headers(): void {
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    header("Content-Security-Policy: default-src 'self' 'unsafe-inline' https: data: blob:; img-src 'self' https: data: blob:; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; connect-src 'self' http://localhost https:; frame-ancestors 'none';");
}

/**
 * Standard JSON Response Sender with Security Headers
 */
function send_json_response(int $statusCode, array $payload): void {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=UTF-8');
    send_security_headers();
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
 * Retrieve client IP safely
 */
function get_client_ip(): string {
    $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    if (!filter_var($ip, FILTER_VALIDATE_IP)) {
        return '127.0.0.1';
    }
    return $ip;
}

/**
 * CSRF Token Management
 */
function get_csrf_token(): string {
    init_secure_session();
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return (string)$_SESSION['csrf_token'];
}

function verify_csrf_token(?string $token): bool {
    init_secure_session();
    if (empty($token) || empty($_SESSION['csrf_token'])) {
        return false;
    }
    return hash_equals((string)$_SESSION['csrf_token'], (string)$token);
}

/**
 * Rate Limiter for Contact Submissions (Session + IP based)
 * Max 5 submissions per 10 minutes
 */
function check_contact_rate_limit(int $maxMessages = 5, int $windowSeconds = 600): bool {
    init_secure_session();
    $now = time();

    if (!isset($_SESSION['contact_submission_history']) || !is_array($_SESSION['contact_submission_history'])) {
        $_SESSION['contact_submission_history'] = [];
    }

    // Filter out submissions older than the window
    $_SESSION['contact_submission_history'] = array_filter(
        $_SESSION['contact_submission_history'],
        fn($t) => ($now - (int)$t) < $windowSeconds
    );

    if (count($_SESSION['contact_submission_history']) >= $maxMessages) {
        return false; // Rate limit exceeded
    }

    $_SESSION['contact_submission_history'][] = $now;
    return true;
}

/**
 * Admin Login Brute-Force Tracker
 * Max 5 failed attempts within 15 minutes, with a 15-minute cooldown
 */
function check_login_brute_force(string $ip, int $maxAttempts = 5, int $cooldownSeconds = 900): array {
    init_secure_session();
    $key = 'login_lockout_' . md5($ip);
    $data = $_SESSION[$key] ?? ['attempts' => 0, 'last_attempt' => 0, 'locked_until' => 0];

    $now = time();

    // Check if currently locked
    if ($data['locked_until'] > $now) {
        $remaining = (int)ceil(($data['locked_until'] - $now) / 60);
        return [
            'allowed' => false,
            'message' => "Too many failed login attempts. Please wait {$remaining} minute(s) before trying again."
        ];
    }

    // Reset attempts if cooldown has elapsed
    if (($now - $data['last_attempt']) > $cooldownSeconds) {
        $data['attempts'] = 0;
        $data['locked_until'] = 0;
        $_SESSION[$key] = $data;
    }

    return ['allowed' => true, 'message' => ''];
}

function record_failed_login(string $ip, int $maxAttempts = 5, int $cooldownSeconds = 900): void {
    init_secure_session();
    $key = 'login_lockout_' . md5($ip);
    $data = $_SESSION[$key] ?? ['attempts' => 0, 'last_attempt' => 0, 'locked_until' => 0];

    $data['attempts']++;
    $data['last_attempt'] = time();

    if ($data['attempts'] >= $maxAttempts) {
        $data['locked_until'] = time() + $cooldownSeconds;
    }

    $_SESSION[$key] = $data;
}

function reset_login_attempts(string $ip): void {
    init_secure_session();
    $key = 'login_lockout_' . md5($ip);
    unset($_SESSION[$key]);
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
