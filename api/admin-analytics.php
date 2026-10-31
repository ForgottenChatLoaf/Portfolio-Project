<?php
/**
 * Admin Analytics API Endpoint
 * Endpoint: /api/admin-analytics.php
 * Method: GET
 * Portfolio of Ethan McClarence Gacud
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/auth.php';

init_secure_session();

if (!is_admin_authenticated()) {
    send_json_response(401, [
        'status'  => 'error',
        'message' => 'Unauthorized. Admin session required.'
    ]);
}

$days = (int)($_GET['days'] ?? 30);
if (!in_array($days, [7, 30, 90], true)) {
    $days = 30;
}

try {
    $pdo = get_db_connection();

    // 1. Summary Metrics
    $totalViews = (int)$pdo->query("SELECT COUNT(*) FROM website_visits")->fetchColumn();
    $totalUniqueEst = (int)$pdo->query("SELECT COUNT(DISTINCT visitor_hash) FROM website_visits")->fetchColumn();

    $viewsToday = (int)$pdo->query("
        SELECT COUNT(*) FROM website_visits 
        WHERE visited_at >= CURDATE()
    ")->fetchColumn();

    $views7d = (int)$pdo->query("
        SELECT COUNT(*) FROM website_visits 
        WHERE visited_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
    ")->fetchColumn();

    $views30d = (int)$pdo->query("
        SELECT COUNT(*) FROM website_visits 
        WHERE visited_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    ")->fetchColumn();

    // 2. Top Visited Pages (within selected range)
    $stmtTop = $pdo->prepare("
        SELECT page_path, 
               COUNT(*) AS views, 
               COUNT(DISTINCT visitor_hash) AS unique_visitors
        FROM website_visits
        WHERE visited_at >= DATE_SUB(NOW(), INTERVAL :days DAY)
        GROUP BY page_path
        ORDER BY views DESC
        LIMIT 6
    ");
    $stmtTop->bindValue(':days', $days, PDO::PARAM_INT);
    $stmtTop->execute();
    $topPages = $stmtTop->fetchAll(PDO::FETCH_ASSOC);

    // 3. Daily Activity Timeline
    $stmtDaily = $pdo->prepare("
        SELECT DATE(visited_at) AS date_label,
               COUNT(*) AS views,
               COUNT(DISTINCT visitor_hash) AS unique_visitors
        FROM website_visits
        WHERE visited_at >= DATE_SUB(CURDATE(), INTERVAL :days DAY)
        GROUP BY DATE(visited_at)
        ORDER BY date_label ASC
    ");
    $stmtDaily->bindValue(':days', $days, PDO::PARAM_INT);
    $stmtDaily->execute();
    $dailyActivity = $stmtDaily->fetchAll(PDO::FETCH_ASSOC);

    send_json_response(200, [
        'status' => 'success',
        'range_days' => $days,
        'summary' => [
            'total_views'         => $totalViews,
            'unique_visitors_est' => $totalUniqueEst,
            'views_today'         => $viewsToday,
            'views_7d'            => $views7d,
            'views_30d'           => $views30d
        ],
        'top_pages'      => $topPages,
        'daily_activity' => $dailyActivity
    ]);
} catch (Throwable $e) {
    error_log('Admin Analytics API error: ' . $e->getMessage());
    send_json_response(500, [
        'status'  => 'error',
        'message' => 'Failed to load visitor analytics data.'
    ]);
}
