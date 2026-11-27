<?php
/**
 * Admin Portfolio Skills CRUD Endpoint (Protected & Hardened)
 * Endpoint: /api/admin-skills.php
 * Methods: GET, POST, PATCH, DELETE
 * Portfolio of Ethan McClarence Gacud
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/functions.php';

require_admin_auth();

header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$input = get_request_data();

if ($method === 'POST' && isset($input['_method'])) {
    $method = strtoupper((string)$input['_method']);
}

$categoryMap = [
    'fundamentals' => 'Programming Fundamentals',
    'frontend'     => 'Frontend Development',
    'backend'      => 'Backend & Database',
    'tools'        => 'Tools & Workflow'
];

try {
    $pdo = get_db_connection();
} catch (Throwable $e) {
    error_log('DB Error in admin-skills.php: ' . $e->getMessage());
    send_json_response(500, ['status' => 'error', 'message' => 'Database connection failed.']);
}

function is_safe_icon_url(string $url): bool {
    if ($url === '') return true;
    if (preg_match('/^\s*(javascript|data|vbscript):/i', $url)) return false;
    if (str_starts_with($url, 'assets/') || str_starts_with($url, '/')) return true;
    return filter_var($url, FILTER_VALIDATE_URL) !== false;
}

// -------------------------------------------------------------
// GET: List all skills
// -------------------------------------------------------------
if ($method === 'GET') {
    try {
        $stmt = $pdo->query('
            SELECT id, category_key, category_title, name, subtitle, details, icon_url, display_order, created_at, updated_at
            FROM portfolio_skills
            ORDER BY FIELD(category_key, \'fundamentals\', \'frontend\', \'backend\', \'tools\'), display_order ASC, id ASC
        ');
        $skills = $stmt->fetchAll();

        send_json_response(200, [
            'status'     => 'success',
            'skills'     => $skills,
            'categories' => $categoryMap,
            'csrf_token' => get_csrf_token()
        ]);
    } catch (Throwable $e) {
        error_log('Admin Skills GET error: ' . $e->getMessage());
        send_json_response(500, ['status' => 'error', 'message' => 'Failed to load skills.']);
    }
}

// -------------------------------------------------------------
// CSRF Check for all state-changing operations
// -------------------------------------------------------------
$clientCsrf = $input['csrf_token'] ?? $_SERVER['HTTP_X_CSRF_TOKEN'] ?? null;
if (empty($clientCsrf) || !verify_csrf_token((string)$clientCsrf)) {
    send_json_response(403, ['status' => 'error', 'message' => 'Invalid or missing CSRF token.']);
}

// -------------------------------------------------------------
// POST: Create a new skill
// -------------------------------------------------------------
if ($method === 'POST') {
    $catKey = trim((string)($input['category_key'] ?? ''));
    $name = sanitize_text((string)($input['name'] ?? ''), 100);
    $subtitle = sanitize_text((string)($input['subtitle'] ?? ''), 150);
    $details = sanitize_text((string)($input['details'] ?? ''), 2000);
    $iconUrl = trim((string)($input['icon_url'] ?? ''));
    $displayOrder = (int)($input['display_order'] ?? 0);

    if (!array_key_exists($catKey, $categoryMap)) {
        send_json_response(422, ['status' => 'error', 'message' => 'Invalid skill category.']);
    }
    if ($name === '' || $subtitle === '' || $details === '') {
        send_json_response(422, ['status' => 'error', 'message' => 'Skill name, subtitle, and details are required.']);
    }
    if (!is_safe_icon_url($iconUrl)) {
        send_json_response(422, ['status' => 'error', 'message' => 'Invalid or unsafe icon URL.']);
    }

    try {
        // Prevent duplicate (category_key, name)
        $dup = $pdo->prepare('SELECT id FROM portfolio_skills WHERE category_key = :cat AND name = :name LIMIT 1');
        $dup->execute([':cat' => $catKey, ':name' => $name]);
        if ($dup->fetch()) {
            send_json_response(409, ['status' => 'error', 'message' => "Skill '{$name}' already exists in this category."]);
        }

        $stmt = $pdo->prepare('
            INSERT INTO portfolio_skills (category_key, category_title, name, subtitle, details, icon_url, display_order)
            VALUES (:cat_key, :cat_title, :name, :subtitle, :details, :icon_url, :display_order)
        ');
        $stmt->execute([
            ':cat_key'       => $catKey,
            ':cat_title'     => $categoryMap[$catKey],
            ':name'          => $name,
            ':subtitle'      => $subtitle,
            ':details'       => $details,
            ':icon_url'      => $iconUrl ?: null,
            ':display_order' => $displayOrder
        ]);

        send_json_response(201, [
            'status'  => 'success',
            'message' => 'Skill added successfully.',
            'id'      => (int)$pdo->lastInsertId()
        ]);
    } catch (Throwable $e) {
        error_log('Admin Skills POST error: ' . $e->getMessage());
        send_json_response(500, ['status' => 'error', 'message' => 'Failed to create skill.']);
    }
}

// -------------------------------------------------------------
// PATCH: Update an existing skill
// -------------------------------------------------------------
if ($method === 'PATCH') {
    $id = filter_var($input['id'] ?? 0, FILTER_VALIDATE_INT);
    if (!$id) {
        send_json_response(422, ['status' => 'error', 'message' => 'Valid skill ID is required.']);
    }

    $catKey = trim((string)($input['category_key'] ?? ''));
    $name = sanitize_text((string)($input['name'] ?? ''), 100);
    $subtitle = sanitize_text((string)($input['subtitle'] ?? ''), 150);
    $details = sanitize_text((string)($input['details'] ?? ''), 2000);
    $iconUrl = trim((string)($input['icon_url'] ?? ''));
    $displayOrder = (int)($input['display_order'] ?? 0);

    if (!array_key_exists($catKey, $categoryMap)) {
        send_json_response(422, ['status' => 'error', 'message' => 'Invalid skill category.']);
    }
    if ($name === '' || $subtitle === '' || $details === '') {
        send_json_response(422, ['status' => 'error', 'message' => 'Skill name, subtitle, and details are required.']);
    }
    if (!is_safe_icon_url($iconUrl)) {
        send_json_response(422, ['status' => 'error', 'message' => 'Invalid or unsafe icon URL.']);
    }

    try {
        $exists = $pdo->prepare('SELECT id FROM portfolio_skills WHERE id = :id LIMIT 1');
        $exists->execute([':id' => $id]);
        if (!$exists->fetch()) {
            send_json_response(404, ['status' => 'error', 'message' => "Skill #{$id} not found."]);
        }

        // Prevent duplicate name in same category on another ID
        $dup = $pdo->prepare('SELECT id FROM portfolio_skills WHERE category_key = :cat AND name = :name AND id != :id LIMIT 1');
        $dup->execute([':cat' => $catKey, ':name' => $name, ':id' => $id]);
        if ($dup->fetch()) {
            send_json_response(409, ['status' => 'error', 'message' => "Another skill named '{$name}' already exists in this category."]);
        }

        $stmt = $pdo->prepare('
            UPDATE portfolio_skills SET
                category_key = :cat_key,
                category_title = :cat_title,
                name = :name,
                subtitle = :subtitle,
                details = :details,
                icon_url = :icon_url,
                display_order = :display_order
            WHERE id = :id
        ');
        $stmt->execute([
            ':cat_key'       => $catKey,
            ':cat_title'     => $categoryMap[$catKey],
            ':name'          => $name,
            ':subtitle'      => $subtitle,
            ':details'       => $details,
            ':icon_url'      => $iconUrl ?: null,
            ':display_order' => $displayOrder,
            ':id'            => $id
        ]);

        send_json_response(200, ['status' => 'success', 'message' => 'Skill updated successfully.']);
    } catch (Throwable $e) {
        error_log('Admin Skills PATCH error: ' . $e->getMessage());
        send_json_response(500, ['status' => 'error', 'message' => 'Failed to update skill.']);
    }
}

// -------------------------------------------------------------
// DELETE: Remove a skill
// -------------------------------------------------------------
if ($method === 'DELETE') {
    $id = filter_var($input['id'] ?? 0, FILTER_VALIDATE_INT);
    if (!$id) {
        send_json_response(422, ['status' => 'error', 'message' => 'Valid skill ID is required.']);
    }

    try {
        $stmt = $pdo->prepare('DELETE FROM portfolio_skills WHERE id = :id');
        $stmt->execute([':id' => $id]);
        if ($stmt->rowCount() === 0) {
            send_json_response(404, ['status' => 'error', 'message' => "Skill #{$id} not found."]);
        }
        send_json_response(200, ['status' => 'success', 'message' => 'Skill deleted successfully.']);
    } catch (Throwable $e) {
        error_log('Admin Skills DELETE error: ' . $e->getMessage());
        send_json_response(500, ['status' => 'error', 'message' => 'Failed to delete skill.']);
    }
}

header('Allow: GET, POST, PATCH, DELETE');
send_json_response(405, ['status' => 'error', 'message' => 'Method Not Allowed.']);
