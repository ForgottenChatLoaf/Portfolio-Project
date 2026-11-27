<?php
/**
 * Admin Portfolio Projects CRUD Endpoint (Protected & Hardened)
 * Endpoint: /api/admin-projects.php
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

try {
    $pdo = get_db_connection();
} catch (Throwable $e) {
    error_log('DB Error in admin-projects.php: ' . $e->getMessage());
    send_json_response(500, ['status' => 'error', 'message' => 'Database connection failed.']);
}

/**
 * Helper: Validate safe HTTP(S) or relative asset URL (prevents javascript: XSS)
 */
function is_safe_project_url(string $url): bool {
    if ($url === '') return true;
    if (preg_match('/^\s*(javascript|data|vbscript):/i', $url)) return false;
    if (str_starts_with($url, 'assets/') || str_starts_with($url, '/')) return true;
    return filter_var($url, FILTER_VALIDATE_URL) !== false;
}

function slugify_project(string $text): string {
    $slug = strtolower(trim($text));
    $slug = preg_replace('/[^a-z0-9]+/', '-', $slug) ?? '';
    $slug = trim($slug, '-');
    return substr($slug ?: 'project-' . time(), 0, 64);
}

// -------------------------------------------------------------
// GET: List all projects
// -------------------------------------------------------------
if ($method === 'GET') {
    try {
        $stmt = $pdo->query('
            SELECT id, slug, title, tag, section_type, description, role, category, timeline,
                   tech_stack, images_json, primary_url, primary_label, secondary_url, secondary_label,
                   display_order, created_at, updated_at
            FROM portfolio_projects
            ORDER BY section_type ASC, display_order ASC, id ASC
        ');
        $rows = $stmt->fetchAll();
        foreach ($rows as &$r) {
            $r['images'] = json_decode((string)($r['images_json'] ?? '[]'), true) ?: [];
        }
        send_json_response(200, [
            'status'     => 'success',
            'projects'   => $rows,
            'csrf_token' => get_csrf_token()
        ]);
    } catch (Throwable $e) {
        error_log('Admin Projects GET error: ' . $e->getMessage());
        send_json_response(500, ['status' => 'error', 'message' => 'Failed to load projects.']);
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
// POST: Create a new project
// -------------------------------------------------------------
if ($method === 'POST') {
    $title = sanitize_text((string)($input['title'] ?? ''), 150);
    $tag = sanitize_text((string)($input['tag'] ?? ''), 150);
    $sectionType = trim((string)($input['section_type'] ?? 'featured'));
    $description = sanitize_text((string)($input['description'] ?? ''), 3000);
    $role = sanitize_text((string)($input['role'] ?? ''), 150);
    $category = sanitize_text((string)($input['category'] ?? ''), 150);
    $timeline = sanitize_text((string)($input['timeline'] ?? ''), 100);
    $techStack = sanitize_text((string)($input['tech_stack'] ?? ''), 500);
    $primaryUrl = trim((string)($input['primary_url'] ?? ''));
    $primaryLabel = sanitize_text((string)($input['primary_label'] ?? 'View Project'), 80);
    $secondaryUrl = trim((string)($input['secondary_url'] ?? ''));
    $secondaryLabel = sanitize_text((string)($input['secondary_label'] ?? ''), 80);
    $displayOrder = (int)($input['display_order'] ?? 0);

    if ($title === '' || $tag === '' || $description === '') {
        send_json_response(422, ['status' => 'error', 'message' => 'Title, tag, and description are required.']);
    }
    if (!in_array($sectionType, ['featured', 'side_quest'], true)) {
        send_json_response(422, ['status' => 'error', 'message' => 'Invalid section_type.']);
    }
    if (!is_safe_project_url($primaryUrl) || !is_safe_project_url($secondaryUrl)) {
        send_json_response(422, ['status' => 'error', 'message' => 'Invalid or unsafe project URL.']);
    }

    // Parse images (newline/comma separated or array)
    $rawImages = $input['images'] ?? [];
    if (is_string($rawImages)) {
        $rawImages = array_filter(array_map('trim', preg_split('/[\r\n,]+/', $rawImages) ?: []));
    }
    $cleanImages = [];
    if (is_array($rawImages)) {
        foreach ($rawImages as $img) {
            $imgStr = trim((string)$img);
            if ($imgStr !== '' && is_safe_project_url($imgStr)) {
                $cleanImages[] = $imgStr;
            }
        }
    }

    $slug = !empty($input['slug']) ? slugify_project((string)$input['slug']) : slugify_project($title);

    try {
        // Ensure unique slug
        $check = $pdo->prepare('SELECT id FROM portfolio_projects WHERE slug = :s LIMIT 1');
        $check->execute([':s' => $slug]);
        if ($check->fetch()) {
            $slug = substr($slug, 0, 55) . '-' . substr(bin2hex(random_bytes(3)), 0, 6);
        }

        $stmt = $pdo->prepare('
            INSERT INTO portfolio_projects
            (slug, title, tag, section_type, description, role, category, timeline, tech_stack, images_json, primary_url, primary_label, secondary_url, secondary_label, display_order)
            VALUES
            (:slug, :title, :tag, :section_type, :description, :role, :category, :timeline, :tech_stack, :images_json, :primary_url, :primary_label, :secondary_url, :secondary_label, :display_order)
        ');
        $stmt->execute([
            ':slug'            => $slug,
            ':title'           => $title,
            ':tag'             => $tag,
            ':section_type'    => $sectionType,
            ':description'     => $description,
            ':role'            => $role ?: null,
            ':category'        => $category ?: null,
            ':timeline'        => $timeline ?: null,
            ':tech_stack'      => $techStack ?: null,
            ':images_json'     => json_encode($cleanImages, JSON_UNESCAPED_SLASHES),
            ':primary_url'     => $primaryUrl ?: null,
            ':primary_label'   => $primaryLabel ?: null,
            ':secondary_url'   => $secondaryUrl ?: null,
            ':secondary_label' => $secondaryLabel ?: null,
            ':display_order'   => $displayOrder
        ]);

        send_json_response(201, [
            'status'  => 'success',
            'message' => 'Project created successfully.',
            'id'      => (int)$pdo->lastInsertId(),
            'slug'    => $slug
        ]);
    } catch (Throwable $e) {
        error_log('Admin Projects POST error: ' . $e->getMessage());
        send_json_response(500, ['status' => 'error', 'message' => 'Failed to create project.']);
    }
}

// -------------------------------------------------------------
// PATCH: Update an existing project
// -------------------------------------------------------------
if ($method === 'PATCH') {
    $id = filter_var($input['id'] ?? 0, FILTER_VALIDATE_INT);
    if (!$id) {
        send_json_response(422, ['status' => 'error', 'message' => 'Valid project ID is required.']);
    }

    $title = sanitize_text((string)($input['title'] ?? ''), 150);
    $tag = sanitize_text((string)($input['tag'] ?? ''), 150);
    $sectionType = trim((string)($input['section_type'] ?? 'featured'));
    $description = sanitize_text((string)($input['description'] ?? ''), 3000);
    $role = sanitize_text((string)($input['role'] ?? ''), 150);
    $category = sanitize_text((string)($input['category'] ?? ''), 150);
    $timeline = sanitize_text((string)($input['timeline'] ?? ''), 100);
    $techStack = sanitize_text((string)($input['tech_stack'] ?? ''), 500);
    $primaryUrl = trim((string)($input['primary_url'] ?? ''));
    $primaryLabel = sanitize_text((string)($input['primary_label'] ?? 'View Project'), 80);
    $secondaryUrl = trim((string)($input['secondary_url'] ?? ''));
    $secondaryLabel = sanitize_text((string)($input['secondary_label'] ?? ''), 80);
    $displayOrder = (int)($input['display_order'] ?? 0);

    if ($title === '' || $tag === '' || $description === '') {
        send_json_response(422, ['status' => 'error', 'message' => 'Title, tag, and description are required.']);
    }
    if (!in_array($sectionType, ['featured', 'side_quest'], true)) {
        send_json_response(422, ['status' => 'error', 'message' => 'Invalid section_type.']);
    }
    if (!is_safe_project_url($primaryUrl) || !is_safe_project_url($secondaryUrl)) {
        send_json_response(422, ['status' => 'error', 'message' => 'Invalid or unsafe project URL.']);
    }

    $rawImages = $input['images'] ?? [];
    if (is_string($rawImages)) {
        $rawImages = array_filter(array_map('trim', preg_split('/[\r\n,]+/', $rawImages) ?: []));
    }
    $cleanImages = [];
    if (is_array($rawImages)) {
        foreach ($rawImages as $img) {
            $imgStr = trim((string)$img);
            if ($imgStr !== '' && is_safe_project_url($imgStr)) {
                $cleanImages[] = $imgStr;
            }
        }
    }

    try {
        $exists = $pdo->prepare('SELECT id FROM portfolio_projects WHERE id = :id LIMIT 1');
        $exists->execute([':id' => $id]);
        if (!$exists->fetch()) {
            send_json_response(404, ['status' => 'error', 'message' => "Project #{$id} not found."]);
        }

        $stmt = $pdo->prepare('
            UPDATE portfolio_projects SET
                title = :title,
                tag = :tag,
                section_type = :section_type,
                description = :description,
                role = :role,
                category = :category,
                timeline = :timeline,
                tech_stack = :tech_stack,
                images_json = :images_json,
                primary_url = :primary_url,
                primary_label = :primary_label,
                secondary_url = :secondary_url,
                secondary_label = :secondary_label,
                display_order = :display_order
            WHERE id = :id
        ');
        $stmt->execute([
            ':title'           => $title,
            ':tag'             => $tag,
            ':section_type'    => $sectionType,
            ':description'     => $description,
            ':role'            => $role ?: null,
            ':category'        => $category ?: null,
            ':timeline'        => $timeline ?: null,
            ':tech_stack'      => $techStack ?: null,
            ':images_json'     => json_encode($cleanImages, JSON_UNESCAPED_SLASHES),
            ':primary_url'     => $primaryUrl ?: null,
            ':primary_label'   => $primaryLabel ?: null,
            ':secondary_url'   => $secondaryUrl ?: null,
            ':secondary_label' => $secondaryLabel ?: null,
            ':display_order'   => $displayOrder,
            ':id'              => $id
        ]);

        send_json_response(200, ['status' => 'success', 'message' => 'Project updated successfully.']);
    } catch (Throwable $e) {
        error_log('Admin Projects PATCH error: ' . $e->getMessage());
        send_json_response(500, ['status' => 'error', 'message' => 'Failed to update project.']);
    }
}

// -------------------------------------------------------------
// DELETE: Remove a project
// -------------------------------------------------------------
if ($method === 'DELETE') {
    $id = filter_var($input['id'] ?? 0, FILTER_VALIDATE_INT);
    if (!$id) {
        send_json_response(422, ['status' => 'error', 'message' => 'Valid project ID is required.']);
    }

    try {
        $stmt = $pdo->prepare('DELETE FROM portfolio_projects WHERE id = :id');
        $stmt->execute([':id' => $id]);
        if ($stmt->rowCount() === 0) {
            send_json_response(404, ['status' => 'error', 'message' => "Project #{$id} not found."]);
        }
        send_json_response(200, ['status' => 'success', 'message' => 'Project deleted successfully.']);
    } catch (Throwable $e) {
        error_log('Admin Projects DELETE error: ' . $e->getMessage());
        send_json_response(500, ['status' => 'error', 'message' => 'Failed to delete project.']);
    }
}

header('Allow: GET, POST, PATCH, DELETE');
send_json_response(405, ['status' => 'error', 'message' => 'Method Not Allowed.']);
