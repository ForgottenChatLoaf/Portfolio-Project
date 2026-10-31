<?php
/**
 * Admin Profile Customization Endpoint
 * Allows authenticated administrator to inspect and update display name, avatar, and dashboard accent color.
 * Supports durable filesystem persistence and optional MySQL dual-sync.
 * Endpoint: /api/admin-profile.php
 * Methods: GET, POST
 * Portfolio of Ethan McClarence Gacud
 */

declare(strict_types=1);

require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/profile_store.php';

// Enforce admin authentication guard
require_admin_auth();

// Never cache admin profile data
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$adminUsername = (string)($_SESSION['admin_username'] ?? 'admin');

// Allowed Accent Colors (Curated modern palettes)
$allowedAccents = [
    '#6c63ff', // Violet (Default)
    '#3b82f6', // Ocean Blue
    '#14b8a6', // Teal
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#ec4899', // Rose Pink
    '#8b5cf6', // Indigo Purple
    '#06b6d4'  // Cyan
];

// -------------------------------------------------------------
// GET: Fetch current admin profile
// -------------------------------------------------------------
if ($method === 'GET') {
    $profile = get_stored_admin_profile($adminUsername);

    send_json_response(200, [
        'status'          => 'success',
        'profile'         => [
            'username'     => $adminUsername,
            'display_name' => $profile['display_name'] ?? 'Ethan',
            'avatar_url'   => $profile['avatar_url'] ?: null,
            'accent_color' => $profile['accent_color'] ?: '#6c63ff'
        ],
        'allowed_accents' => $allowedAccents,
        'csrf_token'      => get_csrf_token()
    ]);
}

// -------------------------------------------------------------
// POST: Update profile or reset to defaults
// -------------------------------------------------------------
if ($method === 'POST') {
    // Determine payload source (supports multipart form-data or JSON)
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    if (stripos($contentType, 'application/json') !== false) {
        $raw = file_get_contents('php://input');
        $input = json_decode($raw, true) ?: [];
    } else {
        $input = $_POST;
    }

    // CSRF Protection
    $clientCsrf = $input['csrf_token'] ?? $_SERVER['HTTP_X_CSRF_TOKEN'] ?? null;
    if (empty($clientCsrf) || !verify_csrf_token((string)$clientCsrf)) {
        send_json_response(403, [
            'status'  => 'error',
            'message' => 'Invalid or missing CSRF token. Please refresh the page.'
        ]);
    }

    // Fetch existing profile to get current avatar for cleanup if replaced
    $currentProfile = get_stored_admin_profile($adminUsername);
    $currentAvatar = $currentProfile['avatar_url'] ?? null;

    // ACTION: Reset to Default
    if (($input['action'] ?? '') === 'reset') {
        delete_stored_avatar($currentAvatar);

        $resetData = [
            'username'     => $adminUsername,
            'display_name' => 'Ethan',
            'avatar_url'   => null,
            'accent_color' => '#6c63ff'
        ];
        save_stored_admin_profile($resetData);

        send_json_response(200, [
            'status'  => 'success',
            'message' => 'Profile settings have been reset to default.',
            'profile' => [
                'username'     => $adminUsername,
                'display_name' => 'Ethan',
                'avatar_url'   => null,
                'accent_color' => '#6c63ff'
            ],
            'csrf_token' => get_csrf_token()
        ]);
    }

    // ACTION: Update Settings
    $displayName = trim((string)($input['display_name'] ?? ($currentProfile['display_name'] ?? 'Ethan')));
    $accentColor = strtolower(trim((string)($input['accent_color'] ?? ($currentProfile['accent_color'] ?? '#6c63ff'))));
    $clearAvatar = !empty($input['clear_avatar']) && ($input['clear_avatar'] === true || $input['clear_avatar'] === 'true' || $input['clear_avatar'] === '1');

    // Validation: Display Name
    if (empty($displayName)) {
        $displayName = 'Ethan';
    } elseif (mb_strlen($displayName) > 50) {
        send_json_response(422, [
            'status'  => 'error',
            'message' => 'Display name cannot exceed 50 characters.'
        ]);
    }

    // Validation: Accent Color
    if (!in_array($accentColor, $allowedAccents, true)) {
        send_json_response(422, [
            'status'          => 'error',
            'message'         => 'Selected accent color is not in the allowed preset list.',
            'allowed_accents' => $allowedAccents
        ]);
    }

    $newAvatarUrl = $currentAvatar;

    // Handle File Upload if provided
    if (isset($_FILES['avatar']) && $_FILES['avatar']['error'] !== UPLOAD_ERR_NO_FILE) {
        $file = $_FILES['avatar'];

        if ($file['error'] !== UPLOAD_ERR_OK) {
            send_json_response(400, [
                'status'  => 'error',
                'message' => 'File upload error occurred. Please try again.'
            ]);
        }

        // Limit size to 2MB
        $maxSizeBytes = 2 * 1024 * 1024;
        if ($file['size'] > $maxSizeBytes) {
            send_json_response(422, [
                'status'  => 'error',
                'message' => 'Avatar image must not exceed 2MB.'
            ]);
        }

        // Verify MIME type using fileinfo
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);

        $allowedMimes = [
            'image/jpeg' => 'jpg',
            'image/png'  => 'png',
            'image/webp' => 'webp'
        ];

        if (!array_key_exists($mime, $allowedMimes)) {
            send_json_response(422, [
                'status'  => 'error',
                'message' => 'Only JPEG, PNG, or WebP raster images are allowed. SVG and other files are rejected.'
            ]);
        }

        // Verify it is a legitimate image
        $imageSize = @getimagesize($file['tmp_name']);
        if ($imageSize === false) {
            send_json_response(422, [
                'status'  => 'error',
                'message' => 'Invalid image content detected.'
            ]);
        }

        $ext = $allowedMimes[$mime];
        $filename = 'avatar_' . bin2hex(random_bytes(10)) . '.' . $ext;
        $targetDir = __DIR__ . '/../assets/images/avatars';

        if (!is_dir($targetDir)) {
            @mkdir($targetDir, 0755, true);
        }

        $destPath = $targetDir . '/' . $filename;

        if (!move_uploaded_file($file['tmp_name'], $destPath)) {
            send_json_response(500, [
                'status'  => 'error',
                'message' => 'Failed to store uploaded avatar on server.'
            ]);
        }

        // Clean up previous custom avatar
        delete_stored_avatar($currentAvatar);
        $newAvatarUrl = 'assets/images/avatars/' . $filename;
    } elseif ($clearAvatar) {
        delete_stored_avatar($currentAvatar);
        $newAvatarUrl = null;
    }

    // Persist changes to filesystem store (and MySQL dual-sync)
    $saveData = [
        'username'     => $adminUsername,
        'display_name' => $displayName,
        'avatar_url'   => $newAvatarUrl,
        'accent_color' => $accentColor
    ];
    save_stored_admin_profile($saveData);

    send_json_response(200, [
        'status'  => 'success',
        'message' => 'Admin profile updated successfully.',
        'profile' => [
            'username'     => $adminUsername,
            'display_name' => $displayName,
            'avatar_url'   => $newAvatarUrl,
            'accent_color' => $accentColor
        ],
        'csrf_token' => get_csrf_token()
    ]);
}

send_json_response(405, ['status' => 'error', 'message' => 'Method not allowed.']);
