<?php
/**
 * Public Portfolio Content Read Endpoint
 * Serves database-backed projects and skills to public frontend pages.
 * Endpoint: /api/portfolio-content.php
 * Method: GET
 * Portfolio of Ethan McClarence Gacud
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/functions.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    header('Allow: GET');
    send_json_response(405, ['status' => 'error', 'message' => 'Method Not Allowed.']);
}

try {
    $pdo = get_db_connection();

    $projects = [];
    $hasProj = !empty($pdo->query("SHOW TABLES LIKE 'portfolio_projects'")->fetch());
    if ($hasProj) {
        $stmtP = $pdo->query('
            SELECT id, slug, title, tag, section_type, description, role, category, timeline,
                   tech_stack, images_json, primary_url, primary_label, secondary_url, secondary_label, display_order
            FROM portfolio_projects
            WHERE is_visible = 1
            ORDER BY section_type ASC, display_order ASC, id ASC
        ');
        $projects = $stmtP->fetchAll();
        foreach ($projects as &$p) {
            $p['images'] = json_decode((string)($p['images_json'] ?? '[]'), true) ?: [];
            unset($p['images_json']);
        }
    }

    $skills = [];
    $hasSkills = !empty($pdo->query("SHOW TABLES LIKE 'portfolio_skills'")->fetch());
    if ($hasSkills) {
        $stmtS = $pdo->query('
            SELECT id, category_key, category_title, name, subtitle, details, icon_url, display_order
            FROM portfolio_skills
            ORDER BY FIELD(category_key, \'fundamentals\', \'frontend\', \'backend\', \'tools\'), display_order ASC, id ASC
        ');
        $skills = $stmtS->fetchAll();
    }

    send_json_response(200, [
        'status'   => 'success',
        'projects' => $projects,
        'skills'   => $skills
    ]);
} catch (Throwable $e) {
    error_log('Public Portfolio Content GET error: ' . $e->getMessage());
    send_json_response(500, ['status' => 'error', 'message' => 'Unable to load portfolio content.']);
}
