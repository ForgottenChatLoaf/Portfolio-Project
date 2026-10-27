<?php
/**
 * Admin Messages CSV Export Endpoint (Protected & Hardened)
 * Endpoint: /api/admin-export.php
 * Method: GET
 * Protected: Requires authenticated admin session
 * Portfolio of Ethan McClarence Gacud
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/functions.php';

// Enforce authentication guard
require_admin_auth();

// Verify method
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    header('Allow: GET');
    send_json_response(405, [
        'status'  => 'error',
        'message' => 'Method Not Allowed. Expected GET.'
    ]);
}

try {
    $pdo = get_db_connection();

    // Fetch messages
    $stmt = $pdo->query('
        SELECT id, name, email, COALESCE(status, \'new\') AS status, date_sent, message 
        FROM contact_messages 
        ORDER BY date_sent DESC, id DESC
    ');
    $messages = $stmt->fetchAll();

    // Prepare filename
    $filename = 'contact-messages-' . date('Y-m-d_His') . '.csv';

    // Set download headers
    header('Content-Type: text/csv; charset=UTF-8');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('Pragma: no-cache');

    $output = fopen('php://output', 'w');

    // Write UTF-8 BOM for Microsoft Excel compatibility
    fwrite($output, "\xEF\xBB\xBF");

    // CSV Header Row
    fputcsv($output, [
        'Message ID',
        'Sender Name',
        'Email Address',
        'Status',
        'Date Received',
        'Message Content'
    ]);

    /**
     * Sanitize cell to prevent CSV formula injection (DDE attacks)
     * Prepends single quote if value begins with =, +, -, @, tab, or carriage return
     */
    $sanitizeCell = static function ($value): string {
        $str = (string)$value;
        if ($str === '') {
            return '';
        }
        $firstChar = $str[0];
        if (in_array($firstChar, ['=', '+', '-', '@', "\t", "\r"], true)) {
            return "'" . $str;
        }
        return $str;
    };

    // Stream rows
    foreach ($messages as $msg) {
        fputcsv($output, [
            $msg['id'],
            $sanitizeCell($msg['name']),
            $sanitizeCell($msg['email']),
            strtoupper((string)$msg['status']),
            $msg['date_sent'],
            $sanitizeCell($msg['message'])
        ]);
    }

    fclose($output);
    exit;

} catch (Throwable $e) {
    error_log('CSV Export Error: ' . $e->getMessage());
    send_json_response(500, [
        'status'  => 'error',
        'message' => 'Unable to generate CSV export. Please ensure MySQL is running.'
    ]);
}
