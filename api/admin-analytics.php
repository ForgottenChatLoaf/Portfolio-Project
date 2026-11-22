<?php
/**
 * Admin Analytics API Endpoint (Enhanced with ECharts telemetry)
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

$rawDays = $_GET['days'] ?? '30';
$days = (int)$rawDays;
if (!in_array($days, [7, 30, 90, 365], true)) {
    $days = 30;
}

try {
    $pdo = get_db_connection();

    // Check if optional website_visits table exists in the schema
    $tableCheck = $pdo->query("SHOW TABLES LIKE 'website_visits'")->fetch();
    $hasVisitsTable = !empty($tableCheck);

    if (!$hasVisitsTable) {
        send_json_response(200, [
            'status'          => 'success',
            'range_days'      => $days,
            'summary'         => [
                'total_views'         => 0,
                'unique_visitors_est' => 0,
                'views_today'         => 0,
                'views_range'         => 0,
                'visitors_range'      => 0,
                'pages_per_visit'     => 0.0
            ],
            'top_pages'       => [],
            'daily_activity'  => [],
            'devices'         => [],
            'recent_activity' => []
        ]);
    }

    // 1. Summary Metrics
    $totalViews = (int)$pdo->query("SELECT COUNT(*) FROM website_visits")->fetchColumn();
    $totalUniqueEst = (int)$pdo->query("SELECT COUNT(DISTINCT visitor_hash) FROM website_visits")->fetchColumn();

    $viewsToday = (int)$pdo->query("
        SELECT COUNT(*) FROM website_visits 
        WHERE visited_at >= CURDATE()
    ")->fetchColumn();

    // Range views & unique visitors
    $stmtRange = $pdo->prepare("
        SELECT COUNT(*) AS range_views,
               COUNT(DISTINCT visitor_hash) AS range_visitors
        FROM website_visits 
        WHERE visited_at >= DATE_SUB(CURDATE(), INTERVAL :days DAY)
    ");
    $stmtRange->bindValue(':days', $days, PDO::PARAM_INT);
    $stmtRange->execute();
    $rangeMetrics = $stmtRange->fetch(PDO::FETCH_ASSOC) ?: ['range_views' => 0, 'range_visitors' => 0];

    $viewsRange = (int)($rangeMetrics['range_views'] ?? 0);
    $visitorsRange = (int)($rangeMetrics['range_visitors'] ?? 0);
    $pagesPerVisit = $visitorsRange > 0 ? round($viewsRange / $visitorsRange, 1) : 0.0;

    // 2. Top Visited Pages (with Human-friendly labels)
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
    $rawTopPages = $stmtTop->fetchAll(PDO::FETCH_ASSOC);

    $pageTitleMap = [
        'index.php'     => 'Home (Landing)',
        '/'             => 'Home (Landing)',
        'skills.html'   => 'Skills & Taxonomy',
        'projects.html' => 'Featured Projects',
        'contact.html'  => 'Contact & Inquiries',
        'login.html'    => 'Admin Access Portal'
    ];

    $topPages = [];
    foreach ($rawTopPages as $row) {
        $cleanPath = trim((string)$row['page_path']);
        $display = $pageTitleMap[$cleanPath] ?? ucfirst(str_replace(['.php', '.html', '-', '_'], ['', '', ' ', ' '], $cleanPath));
        $views = (int)$row['views'];
        $pct = $viewsRange > 0 ? round(($views / $viewsRange) * 100) : 0;
        $topPages[] = [
            'page_path'       => $cleanPath,
            'display_name'    => $display,
            'views'           => $views,
            'unique_visitors' => (int)$row['unique_visitors'],
            'percentage'      => $pct
        ];
    }

    // 3. Continuous Daily Activity Timeline (fill missing days with 0)
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
    $rawDaily = $stmtDaily->fetchAll(PDO::FETCH_ASSOC);

    $dailyByDate = [];
    foreach ($rawDaily as $d) {
        $dailyByDate[$d['date_label']] = [
            'views'           => (int)$d['views'],
            'unique_visitors' => (int)$d['unique_visitors']
        ];
    }

    // Generate continuous date range up to today
    $dailyActivity = [];
    $lookbackDays = min($days, 90); // keep chart ticks reasonable
    for ($i = $lookbackDays; $i >= 0; $i--) {
        $dStr = date('Y-m-d', strtotime("-$i days"));
        $dailyActivity[] = [
            'date_label'      => $dStr,
            'views'           => $dailyByDate[$dStr]['views'] ?? 0,
            'unique_visitors' => $dailyByDate[$dStr]['unique_visitors'] ?? 0
        ];
    }

    // 4. Device Breakdown
    $stmtUa = $pdo->prepare("
        SELECT user_agent
        FROM website_visits
        WHERE visited_at >= DATE_SUB(CURDATE(), INTERVAL :days DAY)
    ");
    $stmtUa->bindValue(':days', $days, PDO::PARAM_INT);
    $stmtUa->execute();
    $uas = $stmtUa->fetchAll(PDO::FETCH_COLUMN);

    $deviceCounts = ['Desktop' => 0, 'Mobile' => 0, 'Tablet' => 0];
    foreach ($uas as $ua) {
        $uaLow = strtolower((string)$ua);
        if (preg_match('/ipad|tablet|(android(?!.*mobile))/i', $uaLow)) {
            $deviceCounts['Tablet']++;
        } elseif (preg_match('/mobile|iphone|ipod|android/i', $uaLow)) {
            $deviceCounts['Mobile']++;
        } else {
            $deviceCounts['Desktop']++;
        }
    }

    $devices = [
        ['name' => 'Desktop', 'value' => $deviceCounts['Desktop']],
        ['name' => 'Mobile',  'value' => $deviceCounts['Mobile']],
        ['name' => 'Tablet',  'value' => $deviceCounts['Tablet']]
    ];

    // 5. Recent Activity Stream
    $stmtRecent = $pdo->prepare("
        SELECT page_path, user_agent, visited_at
        FROM website_visits
        ORDER BY visited_at DESC
        LIMIT 6
    ");
    $stmtRecent->execute();
    $rawRecent = $stmtRecent->fetchAll(PDO::FETCH_ASSOC);

    $recentActivity = [];
    foreach ($rawRecent as $rec) {
        $p = trim((string)$rec['page_path']);
        $pName = $pageTitleMap[$p] ?? ucfirst(str_replace(['.php', '.html'], '', $p));
        $ua = strtolower((string)$rec['user_agent']);
        $dev = 'Desktop';
        if (preg_match('/ipad|tablet/i', $ua)) $dev = 'Tablet';
        elseif (preg_match('/mobile|iphone|android/i', $ua)) $dev = 'Mobile';

        $recentActivity[] = [
            'page_path'   => $p,
            'page_name'   => $pName,
            'device'      => $dev,
            'visited_at'  => $rec['visited_at'],
            'time_ago'    => date('M d, H:i', strtotime((string)$rec['visited_at']))
        ];
    }

    send_json_response(200, [
        'status'     => 'success',
        'range_days' => $days,
        'summary'    => [
            'total_views'         => $totalViews,
            'unique_visitors_est' => $totalUniqueEst,
            'views_today'         => $viewsToday,
            'views_range'         => $viewsRange,
            'visitors_range'      => $visitorsRange,
            'pages_per_visit'     => $pagesPerVisit
        ],
        'top_pages'       => $topPages,
        'daily_activity'  => $dailyActivity,
        'devices'         => $devices,
        'recent_activity' => $recentActivity
    ]);
} catch (Throwable $e) {
    error_log('Admin Analytics API error: ' . $e->getMessage());
    send_json_response(500, [
        'status'  => 'error',
        'message' => 'Failed to load visitor analytics data.'
    ]);
}
