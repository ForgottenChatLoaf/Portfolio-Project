<?php
/**
 * Custom HTTP 404 — Not Found Error Page
 * Portfolio of Ethan McClarence Gacud
 */

declare(strict_types=1);

require_once __DIR__ . '/includes/error_page.php';

render_error_page(
    404,
    'HTTP 404 • Not Found',
    'Oops! Page Not Found.',
    "Looks like this page doesn't exist or may have been moved."
);
