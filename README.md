# Ethan McClarence Gacud — Personal Portfolio

A personal web developer portfolio website featuring a responsive, editorial dark-mode frontend built with HTML5, CSS3, and vanilla JavaScript, paired with a secure, reconstructed PHP & MySQL backend.

---

## 1. Architecture Overview

- **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES6+)
  - Main combined homepage: `index.php` (continuous scrolling layout containing `#home` and `#about` sections).
  - Public pages: `skills.html` (with responsive expandable cards and verified Certifications section), `projects.html`, `contact.html`.
  - Reusable partials: `partials/navbar.html` and `partials/footer.html` dynamically initialized via `assets/js/partials.js`.
  - Single centralized stylesheet: `assets/css/style.css` (custom properties, responsive grid, zero framework dependencies).
  - Downloadable CV: Connected to `assets/documents/Ethan_Gacud_CV.pdf` with native browser download.
  - Performance: Hardware-accelerated GPU animations with automatic offscreen canvas pausing to eliminate lag.
- **Backend:** Native PHP (8.0+)
  - RESTful JSON endpoints in `api/`.
  - Two-Step Contact Pipeline: `api/contact-step1.php` (strict name validation rejecting digits, server session registration) and `api/contact-submit.php` (session verification, email & domain validation, CSRF verification, rate-limiting, and prepared statement insert).
  - Secure Admin Authentication: `api/admin-login.php`, `api/admin-session.php`, `api/admin-logout.php`, using bcrypt `password_verify()`, session ID regeneration, and brute-force throttling.
  - Server-Side Route Guards: `admin/dashboard.php` and `admin/messages.php` redirect unauthenticated visitors immediately.
  - Database access via PDO with prepared statements in `config/database.php` (supports `.env` and server environment variables).
- **Database:** MySQL / MariaDB (InnoDB, `utf8mb4_unicode_ci`)
  - Target database: `portfolio_db`
  - Required table: `contact_messages` (`id`, `name`, `email`, `message`, `date_sent`, `status`)
  - Zero Mock Data Policy: Production database starts completely clean with zero demo or sample records.

---

## 2. Directory Structure

```
Portfolio-Project/
├── .env                         # Server environment configuration (DB & admin hash, Git-ignored)
├── .env.example                 # Documented template without secrets
├── .htaccess                    # Security headers, rewrites & sensitive file blocking
├── index.php                    # Consolidated Home + About continuous scroll page
├── skills.html                  # Skills showcase with responsive expandable cards & Certificates
├── projects.html                # Project portfolio with interactive modals
├── contact.html                 # 2-step visitor-first contact workflow
│
├── partials/
│   ├── navbar.html              # Shared navigation partial
│   └── footer.html              # Shared footer partial (with medium-spaced CTA card)
│
├── admin/
│   ├── index.php                # Route dispatcher to dashboard or login
│   ├── login.html               # Admin authentication interface
│   ├── dashboard.php            # Guarded server-side dashboard route
│   ├── dashboard.html           # Admin dashboard frontend
│   ├── messages.php             # Guarded server-side messages route
│   └── messages.html            # Contact messages management with inspector modal
│
├── assets/
│   ├── css/
│   │   └── style.css            # Centralized stylesheet
│   ├── documents/
│   │   └── Ethan_Gacud_CV.pdf   # Finished CV in PDF format
│   ├── js/
│   │   ├── main.js              # Core UI interactions, GPU-accelerated magnetic cursor, stars
│   │   ├── partials.js          # Shared navbar/footer loader & scroll-spy controller
│   │   ├── contact.js           # Two-step contact workflow & CSRF fetch handler
│   │   └── admin.js             # Admin authentication, real-time message table & modal logic
│   └── images/
│       ├── profile/             # Profile photos
│       ├── projects/            # Project showcase screenshots
│       └── certificates/        # Verified certificate preview images
│
├── api/
│   ├── contact-step1.php        # POST: validates name (rejects numbers) and binds to session
│   ├── contact-submit.php       # POST: validates email/domain, message, CSRF & saves to MySQL
│   ├── admin-login.php          # POST: authenticates admin using password_verify()
│   ├── admin-session.php        # GET: verifies active admin session
│   ├── admin-messages.php       # GET/PATCH/DELETE: message management & status updates
│   ├── admin-export.php         # GET: CSV export of contact messages
│   ├── admin-logout.php         # POST: clears session & logs out admin
│   └── csrf-token.php           # GET: issues per-session CSRF token
│
├── config/
│   ├── database.php             # PDO database connection (reads env vars / .env)
│   └── database.example.php     # Example database configuration template
│
├── includes/
│   ├── auth.php                 # Admin credentials verifier, session guard & timeout
│   ├── functions.php            # Strict name/email validators, CSRF handlers & rate-limiting
│   └── analytics.php            # Lightweight first-party analytics tracker
│
└── database/
    └── portfolio_db.sql         # Production schema (InnoDB, utf8mb4, zero mock data)
```

---

## 3. Database Setup & Environment Configuration

### A. Database Setup
1. Open XAMPP Control Panel and start **Apache** and **MySQL**.
2. Open phpMyAdmin (`http://localhost/phpmyadmin/`) or MySQL CLI.
3. Import `database/portfolio_db.sql`:
   ```sql
   CREATE DATABASE IF NOT EXISTS `portfolio_db` 
   CHARACTER SET utf8mb4 
   COLLATE utf8mb4_unicode_ci;

   USE `portfolio_db`;

   CREATE TABLE IF NOT EXISTS `contact_messages` (
       `id` INT AUTO_INCREMENT PRIMARY KEY,
       `name` VARCHAR(100) NOT NULL,
       `email` VARCHAR(100) NOT NULL,
       `message` TEXT NOT NULL,
       `date_sent` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       `status` ENUM('new', 'read', 'replied', 'archived') NOT NULL DEFAULT 'new',
       INDEX `idx_date_sent` (`date_sent`),
       INDEX `idx_status` (`status`)
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
   ```

### B. Environment Configuration (`.env`)
Create a `.env` file in the project root (never committed to version control):
```env
# Database Configuration
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=portfolio_db
DB_USER=root
DB_PASS=

# Administrator Configuration (Hashed via PASSWORD_DEFAULT)
ADMIN_USERNAME=UnliRicePo
ADMIN_PASSWORD_HASH=$2y$10$hj/ik3KTEIiOyqD9Muev4O.L47h6KBmaXuZunkS4rotNDmY2ruFda
ADMIN_DISPLAY_NAME=Ethan Gacud
```

---

## 4. Admin Credentials

- **Username:** `UnliRicePo`
- **Password:** `Myth5Ever_031808`
- **Access Route:** `http://localhost/PortfolioUpdate/Portfolio-Project/admin/login.html`

---

## 5. Security Measures Implemented

1. **Prepared Statements:** 100% of SQL queries binding user input use PDO prepared statements.
2. **Server-Side Validation:** Dual-layer validation on all inputs (frontend for user convenience, backend for security).
3. **Strict Name Validation:** Rejects numeric-only values and names containing digits (`123456`, `Ethan123`). Only legitimate letters, spaces, hyphens, and apostrophes are accepted.
4. **Email Format & Domain Filtering:** Validates RFC format and rejects reserved testing domains (`example.com`, `localhost`, `invalid`, etc.).
5. **CSRF Tokens:** All state-changing forms require session-bound CSRF tokens.
6. **Password Security:** Salted bcrypt hashing using `password_verify()`. No plaintext passwords in code or database.
7. **Brute-Force Throttling:** Failed login attempts are tracked and rate-limited with progressive delays.
8. **Session Hardening:** `HttpOnly`, `SameSite=Lax`, strict mode enabled, session ID regeneration upon login, and 30-minute inactivity timeout.
9. **Output Escaping:** Strict HTML escaping (`htmlspecialchars`) prevents Cross-Site Scripting (XSS).
10. **Hardware-Accelerated UI:** GPU-based `translate3d` animations with offscreen pausing ensure 60–120 FPS performance with zero UI lag.
