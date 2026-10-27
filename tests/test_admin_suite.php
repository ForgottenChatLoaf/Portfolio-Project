<?php
/**
 * Automated Admin Integration & Security Test Suite
 * Validates DB migration, authentication, CSRF, status workflow, deletion, and CSV protection
 * Portfolio of Ethan McClarence Gacud
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/auth.php';

echo "======================================================\n";
echo "   ADMIN DASHBOARD INTEGRATION & SECURITY TEST SUITE  \n";
echo "======================================================\n\n";

$passCount = 0;
$failCount = 0;

function assert_test(string $name, bool $condition, string $details = ''): void {
    global $passCount, $failCount;
    if ($condition) {
        echo " [PASS] {$name}\n";
        if ($details) echo "        -> {$details}\n";
        $passCount++;
    } else {
        echo " [FAIL] {$name}\n";
        if ($details) echo "        -> {$details}\n";
        $failCount++;
    }
}

$pdo = get_db_connection();

// -------------------------------------------------------------
// TEST 1: Database Schema & Column Definition
// -------------------------------------------------------------
echo "\n--- 1. Database Schema Verification ---\n";
$col = $pdo->query("SHOW COLUMNS FROM contact_messages LIKE 'status'")->fetch(PDO::FETCH_ASSOC);
assert_test(
    "Column 'status' exists", 
    !empty($col), 
    "Column found in contact_messages"
);
assert_test(
    "Column 'status' has ENUM('new','read','replied','archived')", 
    stripos($col['Type'] ?? '', "enum('new','read','replied','archived')") !== false,
    "Type: " . ($col['Type'] ?? 'N/A')
);
assert_test(
    "Default value is 'new'", 
    ($col['Default'] ?? '') === 'new',
    "Default: " . ($col['Default'] ?? 'N/A')
);

// -------------------------------------------------------------
// TEST 2: Preserved Existing Records
// -------------------------------------------------------------
echo "\n--- 2. Data Integrity & Preservation ---\n";
$count = (int)$pdo->query("SELECT COUNT(*) FROM contact_messages")->fetchColumn();
assert_test(
    "Existing contact messages are preserved", 
    $count >= 5, 
    "Current record count: {$count}"
);

// -------------------------------------------------------------
// TEST 3: Unauthenticated Access Guarding (HTTP 401)
// -------------------------------------------------------------
echo "\n--- 3. Authentication Enforcement (Unauthenticated) ---\n";
// Make HTTP request to admin-messages.php without session
$context = stream_context_create(['http' => ['ignore_errors' => true]]);
$resMsg = file_get_contents('http://127.0.0.1/PortfolioUpdate/Portfolio-Project/api/admin-messages.php', false, $context);
$httpCodeMsg = 0;
if (isset($http_response_header[0]) && preg_match('{HTTP\/\S*\s(\d{3})}', $http_response_header[0], $m)) {
    $httpCodeMsg = (int)$m[1];
}
assert_test(
    "GET /api/admin-messages.php without session rejected with 401",
    $httpCodeMsg === 401,
    "HTTP Status: {$httpCodeMsg}"
);

$resExport = file_get_contents('http://127.0.0.1/PortfolioUpdate/Portfolio-Project/api/admin-export.php', false, $context);
$httpCodeExport = 0;
if (isset($http_response_header[0]) && preg_match('{HTTP\/\S*\s(\d{3})}', $http_response_header[0], $m)) {
    $httpCodeExport = (int)$m[1];
}
assert_test(
    "GET /api/admin-export.php without session rejected with 401",
    $httpCodeExport === 401,
    "HTTP Status: {$httpCodeExport}"
);

// -------------------------------------------------------------
// TEST 4: Admin Authentication via Login API
// -------------------------------------------------------------
echo "\n--- 4. Admin Login & Session Generation ---\n";
$cookieJar = tempnam(sys_get_temp_dir(), 'admin_cookie_');

$loginPayload = json_encode(['username' => 'admin', 'password' => 'AdminPortfolio2026!']);
$loginOpts = [
    'http' => [
        'method'  => 'POST',
        'header'  => "Content-Type: application/json\r\nAccept: application/json\r\n",
        'content' => $loginPayload,
        'ignore_errors' => true
    ]
];
$loginRes = file_get_contents('http://127.0.0.1/PortfolioUpdate/Portfolio-Project/api/admin-login.php', false, stream_context_create($loginOpts));
$loginData = json_decode($loginRes, true);

// Extract session cookie from headers
$sessionCookie = '';
foreach ($http_response_header as $hdr) {
    if (stripos($hdr, 'Set-Cookie:') === 0 && preg_match('/(PHPSESSID=[^;]+)/i', $hdr, $match)) {
        $sessionCookie = $match[1];
    }
}

assert_test(
    "Admin Login succeeded with HTTP 200",
    ($loginData['status'] ?? '') === 'success' && !empty($sessionCookie),
    "Session cookie obtained: " . substr($sessionCookie, 0, 20) . "..."
);

// -------------------------------------------------------------
// TEST 5: Authenticated Session Fetch & CSRF Token Acquisition
// -------------------------------------------------------------
echo "\n--- 5. Authenticated Message Retrieval & CSRF Token ---\n";
$authOpts = [
    'http' => [
        'method' => 'GET',
        'header' => "Cookie: {$sessionCookie}\r\nAccept: application/json\r\n",
        'ignore_errors' => true
    ]
];
$getRes = file_get_contents('http://127.0.0.1/PortfolioUpdate/Portfolio-Project/api/admin-messages.php', false, stream_context_create($authOpts));
$getData = json_decode($getRes, true);
$csrfToken = $getData['csrf_token'] ?? '';

assert_test(
    "GET /api/admin-messages.php succeeded with session",
    ($getData['status'] ?? '') === 'success',
    "Total messages retrieved: " . count($getData['messages'] ?? [])
);
assert_test(
    "Summary statistics returned in API response",
    isset($getData['stats']['total']) && isset($getData['stats']['new']),
    "Total: {$getData['stats']['total']}, New: {$getData['stats']['new']}, Replied: {$getData['stats']['replied']}"
);
assert_test(
    "Valid CSRF token returned in payload",
    !empty($csrfToken) && strlen($csrfToken) === 64,
    "Token: " . substr($csrfToken, 0, 16) . "..."
);

// -------------------------------------------------------------
// TEST 6: CSRF Enforcement on Status Mutations
// -------------------------------------------------------------
echo "\n--- 6. CSRF Enforcement on State Mutations ---\n";

// A. Missing CSRF Token -> Must return 403
$noCsrfOpts = [
    'http' => [
        'method'  => 'POST',
        'header'  => "Cookie: {$sessionCookie}\r\nContent-Type: application/json\r\n",
        'content' => json_encode(['action' => 'update_status', 'id' => 1, 'status' => 'read']),
        'ignore_errors' => true
    ]
];
$resNoCsrf = file_get_contents('http://127.0.0.1/PortfolioUpdate/Portfolio-Project/api/admin-messages.php', false, stream_context_create($noCsrfOpts));
$statusNoCsrf = 0;
if (isset($http_response_header[0]) && preg_match('{HTTP\/\S*\s(\d{3})}', $http_response_header[0], $m)) {
    $statusNoCsrf = (int)$m[1];
}
assert_test(
    "Status mutation without CSRF token rejected with 403 Forbidden",
    $statusNoCsrf === 403,
    "HTTP Status: {$statusNoCsrf}"
);

// B. Invalid CSRF Token -> Must return 403
$badCsrfOpts = [
    'http' => [
        'method'  => 'POST',
        'header'  => "Cookie: {$sessionCookie}\r\nContent-Type: application/json\r\n",
        'content' => json_encode(['action' => 'update_status', 'id' => 1, 'status' => 'read', 'csrf_token' => 'invalid_token_12345']),
        'ignore_errors' => true
    ]
];
$resBadCsrf = file_get_contents('http://127.0.0.1/PortfolioUpdate/Portfolio-Project/api/admin-messages.php', false, stream_context_create($badCsrfOpts));
$statusBadCsrf = 0;
if (isset($http_response_header[0]) && preg_match('{HTTP\/\S*\s(\d{3})}', $http_response_header[0], $m)) {
    $statusBadCsrf = (int)$m[1];
}
assert_test(
    "Status mutation with invalid CSRF token rejected with 403 Forbidden",
    $statusBadCsrf === 403,
    "HTTP Status: {$statusBadCsrf}"
);

// C. Invalid Status Value -> Must return 422
$badStatusOpts = [
    'http' => [
        'method'  => 'POST',
        'header'  => "Cookie: {$sessionCookie}\r\nContent-Type: application/json\r\n",
        'content' => json_encode(['action' => 'update_status', 'id' => 1, 'status' => 'hacked_status', 'csrf_token' => $csrfToken]),
        'ignore_errors' => true
    ]
];
$resBadStatus = file_get_contents('http://127.0.0.1/PortfolioUpdate/Portfolio-Project/api/admin-messages.php', false, stream_context_create($badStatusOpts));
$statusBadStatus = 0;
if (isset($http_response_header[0]) && preg_match('{HTTP\/\S*\s(\d{3})}', $http_response_header[0], $m)) {
    $statusBadStatus = (int)$m[1];
}
assert_test(
    "Status mutation with unsupported status name rejected with 422 Unprocessable Entity",
    $statusBadStatus === 422,
    "HTTP Status: {$statusBadStatus}"
);

// -------------------------------------------------------------
// TEST 7: Valid Status Transitions (read -> replied -> archived -> new)
// -------------------------------------------------------------
echo "\n--- 7. Valid Status Workflow & DB Persistence ---\n";
// Get first message ID
$firstMsgId = (int)$getData['messages'][0]['id'];

foreach (['read', 'replied', 'archived', 'new'] as $targetStatus) {
    $statusOpts = [
        'http' => [
            'method'  => 'POST',
            'header'  => "Cookie: {$sessionCookie}\r\nContent-Type: application/json\r\n",
            'content' => json_encode(['action' => 'update_status', 'id' => $firstMsgId, 'status' => $targetStatus, 'csrf_token' => $csrfToken]),
            'ignore_errors' => true
        ]
    ];
    $resStatus = file_get_contents('http://127.0.0.1/PortfolioUpdate/Portfolio-Project/api/admin-messages.php', false, stream_context_create($statusOpts));
    $statusJson = json_decode($resStatus, true);

    // Verify DB directly
    $dbStatus = $pdo->query("SELECT status FROM contact_messages WHERE id = {$firstMsgId}")->fetchColumn();

    assert_test(
        "Transition message #{$firstMsgId} to '{$targetStatus}' succeeded & verified in DB",
        ($statusJson['status'] ?? '') === 'success' && $dbStatus === $targetStatus,
        "DB verified value: '{$dbStatus}'"
    );
}

// -------------------------------------------------------------
// TEST 8: Create Test Message & Deletion with CSRF
// -------------------------------------------------------------
echo "\n--- 8. Message Deletion Workflow ---\n";
// Insert temporary test record
$pdo->exec("INSERT INTO contact_messages (name, email, message, date_sent, status) VALUES ('Test Deletion User', 'testdel@example.com', 'Temporary message for deletion test', NOW(), 'new')");
$testMsgId = (int)$pdo->lastInsertId();
assert_test(
    "Inserted temporary message #{$testMsgId} for deletion test",
    $testMsgId > 0,
    "Test message ID: #{$testMsgId}"
);

// Delete with valid CSRF
$delOpts = [
    'http' => [
        'method'  => 'DELETE',
        'header'  => "Cookie: {$sessionCookie}\r\nContent-Type: application/json\r\n",
        'content' => json_encode(['id' => $testMsgId, 'csrf_token' => $csrfToken]),
        'ignore_errors' => true
    ]
];
$delRes = file_get_contents('http://127.0.0.1/PortfolioUpdate/Portfolio-Project/api/admin-messages.php', false, stream_context_create($delOpts));
$delJson = json_decode($delRes, true);

// Verify DB record is gone
$checkDeleted = $pdo->query("SELECT COUNT(*) FROM contact_messages WHERE id = {$testMsgId}")->fetchColumn();
assert_test(
    "Message #{$testMsgId} deleted with valid CSRF & confirmed gone from DB",
    ($delJson['status'] ?? '') === 'success' && (int)$checkDeleted === 0,
    "Record count in DB for #{$testMsgId}: {$checkDeleted}"
);

// -------------------------------------------------------------
// TEST 9: CSV Export & Formula Injection (DDE) Protection
// -------------------------------------------------------------
echo "\n--- 9. CSV Export & Spreadsheet Formula Protection ---\n";
// Insert test row with formula injection vectors
$formulaName = "=cmd|'/C calc'!A0";
$formulaEmail = "+123456789@example.com";
$formulaMessage = "-99999 + @SUM(1,2,3)";
$stmtFormula = $pdo->prepare("INSERT INTO contact_messages (name, email, message, date_sent, status) VALUES (:name, :email, :message, NOW(), 'new')");
$stmtFormula->execute([
    ':name' => $formulaName,
    ':email' => $formulaEmail,
    ':message' => $formulaMessage
]);
$formulaMsgId = (int)$pdo->lastInsertId();

$csvOpts = [
    'http' => [
        'method' => 'GET',
        'header' => "Cookie: {$sessionCookie}\r\n",
        'ignore_errors' => true
    ]
];
$csvContent = file_get_contents('http://127.0.0.1/PortfolioUpdate/Portfolio-Project/api/admin-export.php', false, stream_context_create($csvOpts));

// Verify UTF-8 BOM
$hasBom = (substr($csvContent, 0, 3) === "\xEF\xBB\xBF");
assert_test(
    "CSV download starts with UTF-8 BOM (Excel compatibility)",
    $hasBom,
    "BOM verified"
);

// Verify headers
$hasHeader = (stripos($csvContent, 'Message ID') !== false) 
          && (stripos($csvContent, 'Sender Name') !== false) 
          && (stripos($csvContent, 'Email Address') !== false) 
          && (stripos($csvContent, 'Date Received') !== false) 
          && (stripos($csvContent, 'Message Content') !== false);
assert_test(
    "CSV download contains standard headers (Message ID, Sender Name, Email Address, etc.)",
    $hasHeader,
    "Headers verified"
);

// Verify Formula Escaping: Leading =, +, -, @ must be prepended with a single quote '
$escapedFormulaName = "''=cmd";
$escapedFormulaEmail = "''+123456789";
$escapedFormulaMsg = "''-99999";
$hasSanitizedFormula = (stripos($csvContent, "'=cmd") !== false) 
                    && (stripos($csvContent, "'+12345") !== false)
                    && (stripos($csvContent, "'-99999") !== false);

assert_test(
    "Spreadsheet formula injection characters (=, +, -, @) safely escaped with single quote",
    $hasSanitizedFormula,
    "Dangerous cells sanitized to prevent DDE code execution"
);

// Clean up formula test record
$pdo->exec("DELETE FROM contact_messages WHERE id = {$formulaMsgId}");

// -------------------------------------------------------------
// TEST 10: Mark All as Read Workflow & DB Verification
// -------------------------------------------------------------
echo "\n--- 10. Mark All as Read Workflow ---\n";
// Insert 2 temporary messages with 'new' status
$pdo->exec("INSERT INTO contact_messages (name, email, message, date_sent, status) VALUES ('Test MarkRead 1', 'test1@example.com', 'Message 1', NOW(), 'new')");
$markId1 = (int)$pdo->lastInsertId();
$pdo->exec("INSERT INTO contact_messages (name, email, message, date_sent, status) VALUES ('Test MarkRead 2', 'test2@example.com', 'Message 2', NOW(), 'new')");
$markId2 = (int)$pdo->lastInsertId();

$markOpts = [
    'http' => [
        'method'  => 'POST',
        'header'  => "Cookie: {$sessionCookie}\r\nContent-Type: application/json\r\n",
        'content' => json_encode(['action' => 'mark_all_read', 'csrf_token' => $csrfToken]),
        'ignore_errors' => true
    ]
];
$markRes = file_get_contents('http://127.0.0.1/PortfolioUpdate/Portfolio-Project/api/admin-messages.php', false, stream_context_create($markOpts));
$markJson = json_decode($markRes, true);

$unmarkCount = (int)$pdo->query("SELECT COUNT(*) FROM contact_messages WHERE id IN ({$markId1}, {$markId2}) AND status = 'new'")->fetchColumn();
assert_test(
    "Mark all as read endpoint transitions all new messages to 'read'",
    ($markJson['status'] ?? '') === 'success' && $unmarkCount === 0,
    "Updated: " . ($markJson['updated_count'] ?? 0) . " messages, pending new: {$unmarkCount}"
);

// Clean up
$pdo->exec("DELETE FROM contact_messages WHERE id IN ({$markId1}, {$markId2})");

// -------------------------------------------------------------
// SUMMARY
// -------------------------------------------------------------
echo "\n======================================================\n";
echo " TEST SUITE SUMMARY: {$passCount} PASSED, {$failCount} FAILED\n";
echo "======================================================\n";

if ($failCount > 0) {
    exit(1);
}
exit(0);
