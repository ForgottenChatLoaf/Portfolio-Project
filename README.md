# Ethan McClarence Gacud — Personal Portfolio

A personal web developer portfolio website featuring a responsive, editorial dark-mode frontend built with HTML5, CSS3, and vanilla JavaScript, paired with a secure PHP & MySQL backend.

---

## 1. Architecture Overview

- **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES6+)
  - Main combined homepage: `index.php` (continuous scrolling layout containing `#home` and `#about` sections).
  - Public pages: `skills.html` (includes verified Certifications section), `projects.html`, `contact.html`.
  - Reusable partials: `partials/navbar.html` and `partials/footer.html` dynamically initialized via `assets/js/partials.js`.
  - Single centralized stylesheet: `assets/css/style.css`.
  - Admin interface: `admin/login.html`, `admin/dashboard.html`, and `admin/messages.html`.
- **Backend:** PHP (8.0+)
  - RESTful JSON endpoints in `api/`.
  - Session-based authentication and security guards in `includes/auth.php`.
  - Filesystem-backed admin profile persistence store in `includes/profile_store.php` & `config/admin_profile.json`.
  - Database access via PDO with prepared statements in `config/database.php` (supports `.env` and environment variables).
- **Database:** MySQL / MariaDB
  - Database name: `portfolio_db`
  - Required table: `contact_messages` (with `id`, `name`, `email`, `message`, `date_sent`, `status`)
  - Admin table: `admin_users` (stores salted bcrypt password hashes)
  - Managed locally via XAMPP phpMyAdmin or MySQL CLI.

---

## 2. Directory Structure

```
Portfolio-Project/
├── index.php                    # Consolidated Home + About continuous scroll page
├── skills.html                  # Skills showcase + Certifications section
├── projects.html                # Project portfolio (Readora, School Dashboard, etc.)
├── contact.html                 # 2-step visitor-first contact workflow
│
├── partials/
│   ├── navbar.html              # Shared navigation partial
│   └── footer.html              # Shared footer partial
│
├── admin/
│   ├── login.html               # Admin authentication interface
│   ├── dashboard.html           # Admin dashboard with status overview & logout modal
│   └── messages.html            # Contact messages management with inspector modal
│
├── assets/
│   ├── css/
│   │   └── style.css            # Centralized stylesheet
│   ├── js/
│   │   ├── main.js              # Core UI interactions, magnetic cursor, typing effect
│   │   ├── partials.js          # Shared navbar/footer loader & scroll-spy controller
│   │   ├── contact.js           # Two-step contact workflow & CSRF fetch handler
│   │   └── admin.js             # Admin authentication, dashboard & logout modal logic
│   └── images/
│       ├── profile/             # Profile photos
│       ├── projects/            # Project showcase screenshots
│       ├── certificates/        # Verified certificate badges
│       └── payments/            # Coffee QR payment assets
│
├── api/
│   ├── contact-submit.php       # POST: validates & saves contact inquiries to MySQL
│   ├── admin-login.php          # POST: authenticates admin using password_verify()
│   ├── admin-session.php        # GET: verifies active admin session
│   ├── admin-profile.php        # GET/POST: admin customization (avatar, accent, name)
│   ├── admin-messages.php       # GET/PATCH/DELETE: message management & status updates
│   ├── admin-export.php         # GET: CSV export of contact messages
│   └── admin-logout.php         # POST: clears session & logs out admin
│
├── config/
│   ├── database.php             # PDO database connection (reads env vars / .env)
│   ├── database.example.php     # Example database configuration template
│   └── admin_profile.json       # Durable server-side admin customization store
│
├── includes/
│   ├── auth.php                 # Session authentication guard & CSRF verification
│   ├── functions.php            # Sanitization, JSON responders & rate-limiting
│   └── profile_store.php        # Durable filesystem store for admin appearance
│
├── database/
│   └── portfolio_db.sql         # SQL schema & initial seed script
│
├── .env.example                 # Environment variables template
├── .gitignore                   # Excludes .env, credentials, logs, and OS caches
├── .htaccess                    # Directory protection, security headers & 301 redirects
├── favicon.svg
└── README.md
```

---

## 3. Local Development Setup (XAMPP)

### Prerequisites
1. [XAMPP](https://www.apachefriends.org/) with Apache and MySQL services installed.
2. Clone or copy the repository into your XAMPP web root:
   `C:\xampp\htdocs\PortfolioUpdate\Portfolio-Project\`

### Database Setup in phpMyAdmin
1. Start **Apache** and **MySQL** in the XAMPP Control Panel.
2. Open your browser and navigate to `http://localhost/phpmyadmin/`.
3. Click on the **Import** tab in the top navigation.
4. Click **Choose File** and select `database/portfolio_db.sql` from the project directory.
5. Click **Import** at the bottom of the page to execute the schema.
6. The database `portfolio_db` with tables `contact_messages` and `admin_users` will be created automatically.

### Running the Website
Open your browser and navigate to:
```
http://localhost/PortfolioUpdate/Portfolio-Project/
```

> **Note:** Always run the website through a web server URL (`http://localhost/...`) rather than opening files via `file://`. The Fetch API requires HTTP/HTTPS to load partials and communicate with PHP endpoints.

---

## 4. Production Deployment & Environment Variables

When deploying to production hosting (e.g., Render with Docker, Railway, InfinityFree, or a standard LAMP/cPanel host):

1. **Do not commit sensitive passwords to Git.**
2. Set the following environment variables in your hosting dashboard (or create a `.env` file from `.env.example` on your server):
   - `DB_HOST` — database server hostname (e.g., `localhost` or remote DB host)
   - `DB_PORT` — MySQL port (default: `3306`)
   - `DB_NAME` — database name (e.g., `portfolio_db`)
   - `DB_USER` — database username
   - `DB_PASS` — database password
3. Import `database/portfolio_db.sql` into your production MySQL database.
4. Note on static hosts (Vercel / Netlify): Static-only hosts do not support traditional PHP & MySQL execution out of the box. Use a PHP/MySQL-capable environment (LAMP stack, cPanel, Railway, or Render with Docker).

---

## 5. Admin Access & Credentials

The admin interface allows reviewing and managing contact messages. It is kept private and does not appear on public navigation or the footer.

- **Admin Login URL:** `http://localhost/PortfolioUpdate/Portfolio-Project/admin/login.html`
- **Default Username:** `admin`
- **Default Password:** `123456` *(or `AdminPortfolio2026!` depending on your local seed)*

*(Passwords are securely hashed using PHP's native `password_hash()` with `PASSWORD_DEFAULT`).*

---

## 6. Security Features

- **SQL Injection Prevention:** 100% of database queries use PDO prepared statements with bound parameters (`PDO::ATTR_EMULATE_PREPARES => false`).
- **XSS Protection:** All user-supplied content is safely rendered using `textContent` on the client side and escaped with `htmlspecialchars()` where displayed in HTML.
- **CSRF & Rate Limiting:** Form submissions and sensitive actions require valid CSRF tokens; contact submissions are rate-limited to prevent automated spam.
- **Session Security:** Cookies configured with `HttpOnly`, `SameSite=Lax`, and `Secure` when running under HTTPS. `session_regenerate_id(true)` is invoked upon login.
- **Protected Endpoints:** Admin API endpoints enforce server-side authentication guards; unauthorized requests receive an immediate 401 response without leaking database details.
