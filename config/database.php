<?php
/**
 * Database Configuration & PDO Connection
 * Portfolio of Ethan McClarence Gacud
 */

declare(strict_types=1);

// Prevent direct script execution from browser if requested directly without include
if (basename(__FILE__) === basename($_SERVER['SCRIPT_FILENAME'] ?? '')) {
    http_response_code(403);
    exit(json_encode(['status' => 'error', 'message' => 'Access denied']));
}

function get_db_connection(): PDO {
    static $pdo = null;

    if ($pdo !== null) {
        return $pdo;
    }

    // Load from environment or fallback to local XAMPP defaults
    $host = getenv('DB_HOST') ?: '127.0.0.1';
    $port = getenv('DB_PORT') ?: '3306';
    $dbname = getenv('DB_NAME') ?: 'portfolio_db';
    $user = getenv('DB_USER') ?: 'root';
    $pass = getenv('DB_PASS') !== false ? getenv('DB_PASS') : '';
    $charset = 'utf8mb4';

    $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset={$charset}";

    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
        PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES {$charset} COLLATE utf8mb4_unicode_ci"
    ];

    try {
        $pdo = new PDO($dsn, $user, $pass, $options);
        return $pdo;
    } catch (PDOException $e) {
        // Log server error securely; do NOT expose credentials or detailed traces to client
        error_log('Database connection error: ' . $e->getMessage());
        throw new RuntimeException('Database connection failed. Please ensure MySQL is running.');
    }
}
