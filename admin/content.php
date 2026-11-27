<?php
/**
 * Protected Admin Portfolio Content Guard
 * Portfolio of Ethan McClarence Gacud
 */

declare(strict_types=1);

require_once __DIR__ . '/../includes/auth.php';

init_secure_session();

if (!is_admin_authenticated()) {
    header('Location: login.html');
    exit;
}

require __DIR__ . '/content.html';
