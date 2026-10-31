<?php
/**
 * Filesystem-Based Admin Profile Persistence Store
 * Provides durable, server-side storage for admin profile & appearance settings
 * without requiring additional database tables (compliant with project rubric).
 * Portfolio of Ethan McClarence Gacud
 */

declare(strict_types=1);

require_once __DIR__ . '/functions.php';

function get_profile_store_path(): string {
    return __DIR__ . '/../config/admin_profile.json';
}

/**
 * Retrieve current admin profile settings from server filesystem.
 * Verifies that referenced avatar image file actually exists on disk.
 */
function get_stored_admin_profile(?string $expectedUsername = 'admin'): array {
    $storeFile = get_profile_store_path();
    $profile = [
        'username'     => $expectedUsername ?: 'admin',
        'display_name' => 'Ethan',
        'avatar_url'   => null,
        'accent_color' => '#6c63ff',
        'updated_at'   => 0
    ];

    if (file_exists($storeFile) && is_readable($storeFile)) {
        $raw = @file_get_contents($storeFile);
        if ($raw !== false) {
            $decoded = json_decode($raw, true);
            if (is_array($decoded)) {
                if (!empty($decoded['display_name'])) {
                    $profile['display_name'] = sanitize_text((string)$decoded['display_name'], 50);
                }
                if (!empty($decoded['accent_color'])) {
                    $profile['accent_color'] = strtolower(trim((string)$decoded['accent_color']));
                }
                if (!empty($decoded['avatar_url'])) {
                    $rel = (string)$decoded['avatar_url'];
                    $abs = __DIR__ . '/../' . ltrim(str_replace('\\', '/', $rel), '/');
                    if (file_exists($abs) && is_file($abs)) {
                        $profile['avatar_url'] = $rel;
                    } else {
                        // File was removed from disk; reset reference
                        $profile['avatar_url'] = null;
                    }
                }
                if (!empty($decoded['updated_at'])) {
                    $profile['updated_at'] = (int)$decoded['updated_at'];
                }
                return $profile;
            }
        }
    }

    // Fallback: If JSON store does not exist yet, attempt to read from database if admin_users exists
    try {
        require_once __DIR__ . '/../config/database.php';
        $pdo = get_db_connection();
        $stmt = $pdo->prepare('SELECT display_name, avatar_url, accent_color FROM admin_users WHERE username = :u LIMIT 1');
        $stmt->execute([':u' => $expectedUsername ?: 'admin']);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row) {
            if (!empty($row['display_name'])) $profile['display_name'] = (string)$row['display_name'];
            if (!empty($row['accent_color'])) $profile['accent_color'] = (string)$row['accent_color'];
            if (!empty($row['avatar_url'])) {
                $abs = __DIR__ . '/../' . ltrim(str_replace('\\', '/', (string)$row['avatar_url']), '/');
                if (file_exists($abs) && is_file($abs)) {
                    $profile['avatar_url'] = (string)$row['avatar_url'];
                }
            }
        }
    } catch (Throwable $e) {
        // Silently tolerate if DB is offline or table does not exist
    }

    // Direct write to seed filesystem store (no recursion)
    $configDir = dirname($storeFile);
    if (!is_dir($configDir)) {
        @mkdir($configDir, 0755, true);
    }
    @file_put_contents($storeFile, json_encode($profile, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES), LOCK_EX);

    return $profile;
}

/**
 * Persist admin profile settings to server filesystem JSON store.
 * Also attempts dual-sync to admin_users table in MySQL if available.
 */
function save_stored_admin_profile(array $data): bool {
    $storeFile = get_profile_store_path();

    // Read existing file directly without recursion
    $existing = [];
    if (file_exists($storeFile) && is_readable($storeFile)) {
        $raw = @file_get_contents($storeFile);
        if ($raw !== false) {
            $existing = json_decode($raw, true) ?: [];
        }
    }

    $updated = [
        'username'     => $data['username'] ?? ($existing['username'] ?? 'admin'),
        'display_name' => sanitize_text((string)($data['display_name'] ?? ($existing['display_name'] ?? 'Ethan')), 50) ?: 'Ethan',
        'avatar_url'   => array_key_exists('avatar_url', $data) ? $data['avatar_url'] : ($existing['avatar_url'] ?? null),
        'accent_color' => strtolower(trim((string)($data['accent_color'] ?? ($existing['accent_color'] ?? '#6c63ff')))) ?: '#6c63ff',
        'updated_at'   => time()
    ];

    $configDir = dirname($storeFile);
    if (!is_dir($configDir)) {
        @mkdir($configDir, 0755, true);
    }

    $json = json_encode($updated, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    $saved = @file_put_contents($storeFile, $json, LOCK_EX) !== false;

    // Optional dual-sync with MySQL admin_users table if available
    try {
        require_once __DIR__ . '/../config/database.php';
        $pdo = get_db_connection();
        $stmt = $pdo->prepare('
            UPDATE admin_users 
            SET display_name = :d, avatar_url = :a, accent_color = :c 
            WHERE username = :u
        ');
        $stmt->execute([
            ':d' => $updated['display_name'],
            ':a' => $updated['avatar_url'],
            ':c' => $updated['accent_color'],
            ':u' => $updated['username']
        ]);
    } catch (Throwable $e) {
        // Tolerated: rubric states contact_messages is the only mandatory DB table
    }

    return $saved;
}

/**
 * Safely delete an uploaded avatar file from the avatars directory.
 */
function delete_stored_avatar(?string $relPath): void {
    if (empty($relPath)) return;
    $cleanPath = str_replace(['..', '\\'], ['', '/'], $relPath);
    $cleanPath = ltrim($cleanPath, '/');

    if (str_starts_with($cleanPath, 'assets/images/avatars/')) {
        $absPath = realpath(__DIR__ . '/../' . $cleanPath);
        $avatarsDir = realpath(__DIR__ . '/../assets/images/avatars');
        if ($absPath && $avatarsDir && str_starts_with($absPath, $avatarsDir) && file_exists($absPath) && is_file($absPath)) {
            @unlink($absPath);
        }
    }
}
