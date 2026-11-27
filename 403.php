<?php
/**
 * Custom HTTP 403 — Forbidden Error Page
 * Portfolio of Ethan McClarence Gacud
 */

declare(strict_types=1);

require_once __DIR__ . '/includes/error_page.php';

render_error_page(
    403,
    'HTTP 403 • Forbidden',
    'Access Restricted.',
    "You don't have permission to access this resource."
);
