<?php
/**
 * First-Party Visitor Analytics Helper
 * Lightweight, privacy-friendly visitor analytics for portfolio_db
 * Portfolio of Ethan McClarence Gacud
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/auth.php';

/**
 * Record a public page view with anonymous visitor token
 */
function record_page_visit(string $pagePath = ''): void {
    // 1. Exclude authenticated administrators
    if (is_admin_authenticated()) {
        return;
    }

    // 2. Exclude owner if opt-out cookie is set
    if (!empty($_COOKIE['portfolio_optout_analytics'])) {
        return;
    }

    $rawUri = $_SERVER['REQUEST_URI'] ?? '';
    // 3. Exclude API endpoints (unless it's the dedicated analytics track-visit beacon) and static assets
    $isBeacon = (stripos($rawUri, 'track-visit.php') !== false);
    if (!$isBeacon) {
        if (stripos($rawUri, '/api/') !== false ||
            preg_match('/\.(css|js|png|jpg|jpeg|gif|svg|ico|pdf|map|txt|woff2?)$/i', $rawUri)) {
            return;
        }
    }

    $userAgent = trim((string)($_SERVER['HTTP_USER_AGENT'] ?? ''));

    // 4. Basic bot and crawler filtering
    $botPatterns = [
        'bot', 'crawl', 'spider', 'slurp', 'mediapartners', 'googlebot',
        'bingbot', 'yandex', 'baidu', 'duckduckbot', 'ahrefs', 'semrush',
        'petalbot', 'bytespider', 'mj12bot', 'curl', 'wget', 'python-requests'
    ];
    $uaLower = strtolower($userAgent);
    foreach ($botPatterns as $bot) {
        if (str_contains($uaLower, $bot)) {
            return;
        }
    }

    // 5. Clean page path (strip query strings, restrict length)
    if (empty($pagePath)) {
        $parsed = parse_url($rawUri, PHP_URL_PATH) ?: '/';
        $pagePath = basename($parsed) ?: 'index.php';
    }
    $pagePath = substr(trim($pagePath), 0, 150);

    // 6. Anonymous First-Party Visitor Identifier (30-day cookie)
    $cookieName = '_portfolio_vid';
    $rawToken = $_COOKIE[$cookieName] ?? '';

    if (empty($rawToken) || !preg_match('/^[a-f0-9]{32,64}$/i', $rawToken)) {
        $rawToken = bin2hex(random_bytes(16));
        $isSecure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (($_SERVER['SERVER_PORT'] ?? '') === '443');
        $cookieOptions = [
            'expires'  => time() + (86400 * 30), // 30-day lifetime
            'path'     => '/',
            'secure'   => $isSecure,
            'httponly' => true,
            'samesite' => 'Lax'
        ];
        @setcookie($cookieName, $rawToken, $cookieOptions);
        $_COOKIE[$cookieName] = $rawToken;
    }

    // Hash the token so raw identifier is never stored directly
    $visitorHash = hash('sha256', $rawToken);

    // 7. Prevent identical page repeat within 5 seconds in same session
    init_secure_session();
    $lastTrackKey = 'last_view_' . md5($pagePath);
    $lastTrackTime = (int)($_SESSION[$lastTrackKey] ?? 0);
    if ((time() - $lastTrackTime) < 5) {
        return;
    }
    $_SESSION[$lastTrackKey] = time();

    // 8. Insert into website_visits
    try {
        $pdo = get_db_connection();
        $stmt = $pdo->prepare('
            INSERT INTO website_visits (visitor_hash, page_path, user_agent, visited_at)
            VALUES (:hash, :path, :ua, NOW())
        ');
        $stmt->execute([
            ':hash' => $visitorHash,
            ':path' => $pagePath,
            ':ua'   => substr($userAgent, 0, 255)
        ]);

        // 9. Probabilistic pruning for 90-day retention (~1 in 50 requests)
        if (random_int(1, 50) === 1) {
            $pdo->exec("DELETE FROM website_visits WHERE visited_at < NOW() - INTERVAL 90 DAY");
        }
    } catch (Throwable $e) {
        // Silently log; never interrupt visitor experience
        error_log('Analytics record error: ' . $e->getMessage());
    }
}
