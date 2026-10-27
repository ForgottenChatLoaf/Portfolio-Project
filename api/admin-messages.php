<?php
/**
 * Admin Contact Messages Endpoint (Protected, Hardened & Verified)
 * Endpoint: /api/admin-messages.php
 * Method: GET, DELETE, POST, PATCH
 * Protected: Requires authenticated admin session + CSRF enforcement on state mutations
 * Portfolio of Ethan McClarence Gacud
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/functions.php';

// Enforce authentication guard for ALL admin message requests
require_admin_auth();

// Never cache private admin data
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$input = get_request_data();

// Support method spoofing for DELETE and PATCH via POST
if ($method === 'POST' && isset($input['_method'])) {
    $method = strtoupper((string)$input['_method']);
}

try {
    $pdo = get_db_connection();
} catch (Throwable $e) {
    error_log('Database Connection Error in admin-messages.php: ' . $e->getMessage());
    send_json_response(500, [
        'status'  => 'error',
        'message' => 'Database connection failed. Please ensure MySQL is running.'
    ]);
}

// -------------------------------------------------------------
// GET: Retrieve Inquiries & Summary Statistics
// -------------------------------------------------------------
if ($method === 'GET') {
    try {
        // Retrieve messages ordered by newest first
        $stmt = $pdo->query('
            SELECT id, name, email, message, date_sent, COALESCE(status, \'new\') AS status 
            FROM contact_messages 
            ORDER BY date_sent DESC, id DESC
        ');
        $messages = $stmt->fetchAll();

        // Calculate real-time summary statistics from database
        $statsStmt = $pdo->query('
            SELECT 
                COUNT(*) AS total,
                SUM(CASE WHEN COALESCE(status, \'new\') = \'new\' THEN 1 ELSE 0 END) AS new_count,
                SUM(CASE WHEN status = \'read\' THEN 1 ELSE 0 END) AS read_count,
                SUM(CASE WHEN status = \'replied\' THEN 1 ELSE 0 END) AS replied_count,
                SUM(CASE WHEN status = \'archived\' THEN 1 ELSE 0 END) AS archived_count,
                SUM(CASE WHEN date_sent >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) AS this_week_count
            FROM contact_messages
        ');
        $rawStats = $statsStmt->fetch() ?: [];

        $stats = [
            'total'      => (int)($rawStats['total'] ?? 0),
            'new'        => (int)($rawStats['new_count'] ?? 0),
            'read'       => (int)($rawStats['read_count'] ?? 0),
            'replied'    => (int)($rawStats['replied_count'] ?? 0),
            'archived'   => (int)($rawStats['archived_count'] ?? 0),
            'this_week'  => (int)($rawStats['this_week_count'] ?? 0)
        ];

        send_json_response(200, [
            'status'     => 'success',
            'count'      => count($messages),
            'messages'   => $messages,
            'stats'      => $stats,
            'csrf_token' => get_csrf_token()
        ]);
    } catch (Throwable $e) {
        error_log('Admin Messages Fetch Error: ' . $e->getMessage());
        send_json_response(500, [
            'status'  => 'error',
            'message' => 'Failed to retrieve messages from database.'
        ]);
    }
}

// -------------------------------------------------------------
// STATE-CHANGING OPERATIONS (PATCH, POST, DELETE)
// Strictly enforce CSRF Token Validation
// -------------------------------------------------------------
$clientCsrf = $input['csrf_token'] ?? $_SERVER['HTTP_X_CSRF_TOKEN'] ?? null;
if (empty($clientCsrf) || !verify_csrf_token((string)$clientCsrf)) {
    send_json_response(403, [
        'status'  => 'error',
        'message' => 'Invalid or missing CSRF security token. Please refresh the page.'
    ]);
}

if ($method === 'POST' && ($input['action'] ?? '') === 'mark_all_read') {
    try {
        $stmt = $pdo->prepare("UPDATE contact_messages SET status = 'read' WHERE status = 'new'");
        $stmt->execute();
        $updated = $stmt->rowCount();

        send_json_response(200, [
            'status'        => 'success',
            'message'       => $updated > 0 ? "Marked {$updated} message(s) as read." : "No new messages to mark as read.",
            'updated_count' => $updated
        ]);
    } catch (Throwable $e) {
        error_log('Admin Mark All Read Error: ' . $e->getMessage());
        send_json_response(500, [
            'status'  => 'error',
            'message' => 'Failed to mark messages as read.'
        ]);
    }
}

if ($method === 'PATCH' || ($method === 'POST' && ($input['action'] ?? '') === 'update_status')) {
    $id = filter_var($input['id'] ?? 0, FILTER_VALIDATE_INT);
    $newStatus = trim((string)($input['status'] ?? ''));

    $validStatuses = ['new', 'read', 'replied', 'archived'];
    if (!$id || !in_array($newStatus, $validStatuses, true)) {
        send_json_response(422, [
            'status'  => 'error',
            'message' => 'Invalid message ID or unsupported status. Allowed: new, read, replied, archived.'
        ]);
    }

    try {
        $stmt = $pdo->prepare('UPDATE contact_messages SET status = :status WHERE id = :id');
        $stmt->execute([
            ':status' => $newStatus,
            ':id'     => $id
        ]);

        if ($stmt->rowCount() === 0) {
            // Verify if message exists
            $checkStmt = $pdo->prepare('SELECT id FROM contact_messages WHERE id = :id');
            $checkStmt->execute([':id' => $id]);
            if (!$checkStmt->fetch()) {
                send_json_response(404, [
                    'status'  => 'error',
                    'message' => "Message #{$id} not found."
                ]);
            }
        }

        send_json_response(200, [
            'status'     => 'success',
            'message'    => "Message #{$id} status updated to '{$newStatus}'.",
            'id'         => $id,
            'new_status' => $newStatus
        ]);
    } catch (Throwable $e) {
        error_log('Admin Message Status Update Error: ' . $e->getMessage());
        send_json_response(500, [
            'status'  => 'error',
            'message' => 'Failed to update message status in database.'
        ]);
    }
} elseif ($method === 'DELETE') {
    $id = filter_var($input['id'] ?? 0, FILTER_VALIDATE_INT);

    if (!$id) {
        send_json_response(422, [
            'status'  => 'error',
            'message' => 'Invalid or missing message ID.'
        ]);
    }

    try {
        $stmt = $pdo->prepare('DELETE FROM contact_messages WHERE id = :id');
        $stmt->execute([':id' => $id]);

        if ($stmt->rowCount() === 0) {
            send_json_response(404, [
                'status'  => 'error',
                'message' => "Message #{$id} not found or already deleted."
            ]);
        }

        send_json_response(200, [
            'status'  => 'success',
            'message' => "Message #{$id} deleted successfully."
        ]);
    } catch (Throwable $e) {
        error_log('Admin Message Delete Error: ' . $e->getMessage());
        send_json_response(500, [
            'status'  => 'error',
            'message' => 'Failed to delete message from database.'
        ]);
    }
} else {
    header('Allow: GET, POST, PATCH, DELETE');
    send_json_response(405, [
        'status'  => 'error',
        'message' => 'Method Not Allowed.'
    ]);
}
