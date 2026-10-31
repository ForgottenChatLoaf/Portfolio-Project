<?php
/**
 * Public Analytics Beacon Endpoint
 * Endpoint: /api/track-visit.php
 * Method: GET, POST
 * Portfolio of Ethan McClarence Gacud
 */

declare(strict_types=1);

require_once __DIR__ . '/../includes/analytics.php';

$page = trim((string)($_GET['page'] ?? $_POST['page'] ?? ''));
if (!empty($page)) {
    record_page_visit($page);
}

header('Content-Type: application/json');
header('Cache-Control: no-store');
echo json_encode(['status' => 'ok']);
