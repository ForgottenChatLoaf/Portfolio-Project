<?php
/**
 * Admin Root Index Route
 */

declare(strict_types=1);

require_once __DIR__ . '/../includes/auth.php';

init_secure_session();

if (is_admin_authenticated()) {
    header('Location: dashboard.php');
} else {
    header('Location: login.html');
}
exit;
