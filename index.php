<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Portfolio of Ethan McClarence Gacud, a student web developer from Quezon City, Philippines, focusing on HTML, CSS, JavaScript, PHP, and MySQL.">
  <meta name="author" content="Ethan McClarence Gacud">
  <title>Ethan Gacud | Portfolio</title>
  <link rel="icon" type="image/svg+xml" href="favicon.svg">
  <link rel="stylesheet" href="assets/css/style.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&family=Syne:wght@700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css">
</head>
<body data-page="home">

  <!-- Loading Screen -->
  <div id="loader" class="loader">
    <div class="loader-content">
      <div class="loader-logo">ETHAN<span class="logo-dot">.</span></div>
      <div class="loader-counter"><span id="loaderPercentage">0</span>%</div>
    </div>
  </div>

  <!-- Custom Magnetic Cursor -->
  <div class="custom-cursor" id="customCursor"></div>

  <!-- Shared Navbar -->
  <header class="navbar" id="navbar">
    <a href="index.php#home" class="nav-logo" aria-label="Ethan McClarence Gacud Home">ETHAN<span class="logo-dot">.</span></a>

    <nav id="navMenu" aria-label="Main Navigation">
      <ul class="nav-links">
        <li><a href="index.php#home" class="nav-link active" data-page="home">Home</a></li>
        <li><a href="index.php#about" class="nav-link" data-page="about">About</a></li>
        <li><a href="skills.html" class="nav-link" data-page="skills">Skills</a></li>
        <li><a href="projects.html" class="nav-link" data-page="projects">Projects</a></li>
        <li><a href="contact.html" class="nav-link" data-page="contact">Contact Us</a></li>
      </ul>
    </nav>

    <div class="nav-actions">
      <button class="btn-coffee-nav" id="coffeeNavBtn" aria-label="Support Ethan &mdash; Buy Me a Coffee" title="Buy Me a Coffee">
        <i class="fa-solid fa-mug-hot"></i>
        <span class="coffee-nav-text">Buy Me a Coffee</span>
      </button>
      <button class="hamburger" id="hamburger" aria-label="Toggle navigation menu" aria-expanded="false" aria-controls="navMenu">
        <span></span><span></span><span></span>
      </button>
    </div>
  </header>

  <main>
    <!-- Section 1: Hero / Home Section -->
    <section class="hero-section" id="home">
      <canvas id="shootingStars"></canvas>
      <div class="hero-content">
        <div class="hero-badge reveal-hero" style="--d:0ms">
          <span class="status-dot"></span>
          Available for opportunities
        </div>
        <h1 class="reveal-hero" style="--d:120ms">
          Hi, I'm <span class="accent">Ethan.</span>
        </h1>
        <p class="hero-sub reveal-hero" style="--d:240ms">
          I build fast, interactive web experiences.
        </p>
        <p class="hero-body reveal-hero" style="--d:360ms">
          Student developer focused on <br>
          <span class="typed-text" id="typedText">frontend craft</span><span class="cursor">|</span>
        </p>
        <div class="hero-cta reveal-hero" style="--d:480ms">
          <a href="projects.html" class="btn-primary">View My Work <i class="fa-solid fa-arrow-right"></i></a>
          <a href="contact.html" class="btn-outline">Get in Touch</a>
          <a href="javascript:void(0)" class="btn-outline" id="downloadCvBtn">Download CV <i class="fa-solid fa-download"></i></a>
        </div>
      </div>
    </section>

    <!-- Section 2: About Me Section (Continuous scroll from Hero) -->
    <section class="about-section" id="about">
      <div class="section-inner">
        <span class="section-eyebrow reveal">About Me</span>
        <h2 class="section-heading reveal">Who I Am.</h2>

        <div class="about-container reveal">
          <div class="about-image-wrapper">
            <img src="assets/images/profile/GACUD, ETHAN MCCLARENCE P_.jpg" alt="Ethan McClarence Gacud" class="about-img">
          </div>
          
          <div class="about-content">
            <div class="about-text">
              <p>I'm an IT student who started programming through college coursework and gradually discovered how much I enjoy it. What began as school activities turned into an interest in experimenting with code, solving problems, and building things of my own.</p>
              <p>I enjoy learning by doing, whether that's figuring out a programming challenge, experimenting with game ideas, or working on a web project. I've worked with C, explored game development in Roblox Studio, and built websites using HTML, CSS, and JavaScript. I'm also learning PHP and MySQL as I work on projects that involve backend development.</p>
              <p>I'm still learning and figuring things out along the way, but that's part of what makes programming fun for me. I enjoy seeing an idea come to life, learning from mistakes, and finding ways to make each project a little better.</p>
            </div>

            <div class="about-card">
              <div class="about-item">
                <span class="about-label">Education</span>
                <span class="about-value">Our Lady of Fatima University</span>
              </div>
              <div class="about-item">
                <span class="about-label">Role</span>
                <span class="about-value">Programmer / Web Developer</span>
              </div>
              <div class="about-item">
                <span class="about-label">Location</span>
                <span class="about-value">Quezon City, Philippines</span>
              </div>
              <div class="about-item">
                <span class="about-label">Aspiration</span>
                <span class="about-value">Web &amp; Game Development / Cybersecurity</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  </main>

  <!-- Shared Footer -->
  <footer>
    <div class="footer-inner">
      <div class="footer-simple-grid">
        <!-- Left: Brand & Personal Tagline -->
        <div class="footer-brand-col">
          <a href="index.php#home" class="footer-logo" aria-label="Ethan McClarence Gacud Home">ETHAN<span class="logo-dot">.</span></a>
          <p class="footer-tagline">IT student learning, building, and exploring through code.</p>
        </div>

        <!-- Right: Let's Connect Links -->
        <div class="footer-connect-col">
          <span class="footer-connect-title">Let's connect</span>
          <div class="footer-connect-links">
            <a href="https://github.com/ForgottenChatLoaf" target="_blank" rel="noopener noreferrer" class="footer-connect-link" aria-label="ForgottenChatLoaf (Ethan) on GitHub">
              <i class="fa-brands fa-github" aria-hidden="true"></i>
              <span>GitHub</span>
            </a>
            <a href="mailto:ethangacud@gmail.com" class="footer-connect-link" aria-label="Send email to Ethan">
              <i class="fa-solid fa-envelope" aria-hidden="true"></i>
              <span>Email</span>
            </a>
            <a href="https://facebook.com/takodachi.inya" target="_blank" rel="noopener noreferrer" class="footer-connect-link" aria-label="Ethan on Facebook">
              <i class="fa-brands fa-facebook-f" aria-hidden="true"></i>
              <span>Facebook</span>
            </a>
            <a href="https://www.linkedin.com/in/ethan-mcclarence-panong-gacud-0568733b7/" target="_blank" rel="noopener noreferrer" class="footer-connect-link" aria-label="Ethan on LinkedIn">
              <i class="fa-brands fa-linkedin-in" aria-hidden="true"></i>
              <span>LinkedIn</span>
            </a>
          </div>
        </div>
      </div>

      <!-- Bottom Row: Copyright + Back to Top -->
      <div class="footer-bottom-row">
        <p class="footer-copy">&copy; <span id="currentYear">2026</span> Ethan McClarence Gacud.</p>
        <a href="#navbar" class="back-to-top" id="backToTopBtn" aria-label="Back to top">
          Back to top <i class="fa-solid fa-arrow-up" aria-hidden="true"></i>
        </a>
      </div>
    </div>
  </footer>

  <script src="assets/js/partials.js"></script>
  <script src="assets/js/main.js"></script>
</body>
</html>

