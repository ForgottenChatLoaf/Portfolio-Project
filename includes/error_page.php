<?php
/**
 * Shared HTTP Error Page Renderer (403 & 404)
 * Portfolio of Ethan McClarence Gacud
 */

declare(strict_types=1);

if (basename(__FILE__) === basename($_SERVER['SCRIPT_FILENAME'] ?? '')) {
    http_response_code(403);
    exit;
}

/**
 * Render a minimal, design-consistent HTTP error page.
 */
function render_error_page(
    int $statusCode,
    string $eyebrow,
    string $heading,
    string $description
): void {
    http_response_code($statusCode);
    header('Content-Type: text/html; charset=UTF-8');

    $codeStr = (string)$statusCode;
    $safeEyebrow = htmlspecialchars($eyebrow, ENT_QUOTES, 'UTF-8');
    $safeHeading = htmlspecialchars($heading, ENT_QUOTES, 'UTF-8');
    $safeDescription = htmlspecialchars($description, ENT_QUOTES, 'UTF-8');
    ?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow">
  <title><?php echo $codeStr; ?> &mdash; <?php echo $safeHeading; ?> | Ethan Gacud</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="stylesheet" href="/assets/css/style.css">
</head>
<body class="error-page-body">
  <div class="error-page-glow" aria-hidden="true"></div>

  <main class="error-page-shell">
    <header class="error-page-brand">
      <a href="/" class="nav-logo" aria-label="Ethan Gacud Portfolio Home">ETHAN<span class="logo-dot">.</span></a>
    </header>

    <section class="error-card" aria-labelledby="errorHeading">
      <span class="error-eyebrow"><?php echo $safeEyebrow; ?></span>
      <p class="error-code" aria-label="HTTP status <?php echo $codeStr; ?>"><?php echo $codeStr; ?></p>
      <h1 class="error-heading" id="errorHeading"><?php echo $safeHeading; ?></h1>
      <p class="error-description"><?php echo $safeDescription; ?></p>

      <div class="error-actions">
        <a href="/" class="btn-primary error-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M3 10.5L12 3l9 7.5"></path>
            <path d="M5 9.5V21h14V9.5"></path>
          </svg>
          <span>Back to Home</span>
        </a>
        <button type="button" class="btn-outline error-btn" onclick="if (window.history.length > 1) { window.history.back(); } else { window.location.href = '/'; }">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M19 12H5"></path>
            <path d="M12 19l-7-7 7-7"></path>
          </svg>
          <span>Go Back</span>
        </button>
      </div>
    </section>
  </main>
</body>
</html>
<?php
}
