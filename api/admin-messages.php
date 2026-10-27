<?php
/**
 * Admin Contact Messages Endpoint (Protected & Hardened)
 * Endpoint: /api/admin-messages.php
 * Method: GET, DELETE, POST
 * Protected: Requires authenticated admin session
 * Portfolio of Ethan McClarence Gacud
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/auth.php';

// Enforce authentication guard
require_admin_auth();

// Never cache private admin data
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    try {
        $pdo = get_db_connection();
        $stmt = $pdo->query('
            SELECT id, name, email, message, date_sent 
            FROM contact_messages 
            ORDER BY date_sent DESC, id DESC
        ');
        $messages = $stmt->fetchAll();

        send_json_response(200, [
            'status'   => 'success',
            'count'    => count($messages),
            'messages' => $messages
        ]);
    } catch (Throwable $e) {
        error_log('Admin Messages Fetch Error: ' . $e->getMessage());
        send_json_response(500, [
            'status'  => 'error',
            'message' => 'Failed to retrieve messages from database.'
        ]);
    }
} elseif ($method === 'DELETE' || ($method === 'POST' && (get_request_data()['_method'] ?? '') === 'DELETE')) {
    $input = get_request_data();
    $id = filter_var($input['id'] ?? 0, FILTER_VALIDATE_INT);

    if (!$id) {
        send_json_response(400, [
            'status'  => 'error',
            'message' => 'Invalid or missing message ID.'
        ]);
    }

    try {
        $pdo = get_db_connection();
        $stmt = $pdo->prepare('DELETE FROM contact_messages WHERE id = :id');
        $stmt->execute([':id' => $id]);

        send_json_response(200, [
            'status'  => 'success',
            'message' => "Message #{$id} deleted successfully."
        ]);
    } catch (Throwable $e) {
        error_log('Admin Message Delete Error: ' . $e->getMessage());
        send_json_response(500, [
            'status'  => 'error',
            'message' => 'Failed to delete message.'
        ]);
    }
} else {
    header('Allow: GET, DELETE, POST');
    send_json_response(405, [
        'status'  => 'error',
        'message' => 'Method Not Allowed.'
    ]);
}
