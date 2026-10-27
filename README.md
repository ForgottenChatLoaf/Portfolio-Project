# Ethan McClarence Gacud — Personal Portfolio

A personal web developer portfolio website featuring a responsive, editorial dark-mode frontend built with HTML5, CSS3, and vanilla JavaScript, paired with a secure PHP & MySQL backend.

---

## 1. Architecture Overview

- **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES6+)
  - 5 standalone public HTML pages: `index.html`, `about.html`, `skills.html`, `projects.html`, `contact.html`.
  - Reusable partials: `partials/navbar.html` and `partials/footer.html` dynamically loaded via `assets/js/partials.js`.
  - Single centralized stylesheet: `assets/css/style.css`.
  - Admin interface: `admin/login.html` and `admin/dashboard.html`.
- **Backend:** Regular PHP (8.0+)
  - RESTful JSON endpoints in `api/`.
  - Session-based authentication and security guards in `includes/auth.php`.
  - Database access via PDO with prepared statements in `config/database.php`.
- **Database:** MySQL
  - Database name: `portfolio_db`
  - Tables: `contact_messages`, `admin_users`
  - Managed locally via phpMyAdmin or MySQL CLI.

---

## 2. Directory Structure

```
Portfolio-Project/
├── index.html                   # Home page (hero banner, typing effect, Buy Me a Coffee)
├── about.html                   # About page (bio, education, Certifications & Learning)
├── skills.html                  # Skills page (honest 4-card 2-column layout)
├── projects.html                # Projects page (Readora, Pure CSS Gallery, Dashboard, C Game)
├── contact.html                 # Contact page (2-step name-first interaction + form)
│
├── partials/
│   ├── navbar.html              # Reusable navigation partial
│   └── footer.html              # Reusable footer partial (without Admin DB link)
│
├── admin/
│   ├── login.html               # Admin authentication interface
│   └── dashboard.html           # Protected contact messages manager
│
├── assets/
│   ├── css/
│   │   └── style.css            # Primary centralized stylesheet
│   ├── js/
│   │   ├── main.js              # Core UI interactions, cursor, particles, typing
│   │   ├── partials.js          # Shared navbar/footer loader & theme controller
│   │   ├── contact.js           # Two-step contact workflow & API fetch handler
│   │   └── admin.js             # Admin authentication and dashboard controller
│   └── images/
│       ├── profile/             # Profile pictures
│       ├── projects/            # Project preview screenshots
│       └── certificates/        # Certificate and award assets
│
├── api/
│   ├── contact-submit.php       # POST: validates & saves contact inquiries to MySQL
│   ├── admin-login.php          # POST: authenticates admin using password_verify()
│   ├── admin-session.php        # GET: verifies active admin session
│   ├── admin-messages.php       # GET / DELETE: retrieves & deletes contact messages
│   └── admin-logout.php         # POST: clears session & logs out admin
│
├── config/
│   └── database.php             # PDO database connection configuration
│
├── includes/
│   ├── auth.php                 # Reusable session authentication guard
│   └── functions.php            # Utility functions (sanitization, JSON response, session)
│
├── database/
│   └── portfolio_db.sql         # SQL schema & initial admin seed script
│
├── favicon.svg
├── .gitignore
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
5. Click **Go** at the bottom of the page to execute the schema.
6. The database `portfolio_db` with tables `contact_messages` and `admin_users` will be created automatically.

### Running the Website
Open your browser and navigate to:
```
http://localhost/PortfolioUpdate/Portfolio-Project/
```

> **Note:** Always run the website through a web server URL (`http://localhost/...`) rather than opening files via `file://`. The Fetch API requires HTTP/HTTPS to load partials (`navbar.html`, `footer.html`) and communicate with PHP endpoints.

---

## 4. Admin Access & Credentials

The admin interface allows reviewing and managing contact messages. It is kept private and does not appear on public navigation or the footer.

- **Admin Login URL:** `http://localhost/PortfolioUpdate/Portfolio-Project/admin/login.html`
- **Default Username:** `admin`
- **Default Password:** `AdminPortfolio2026!`

*(Passwords are securely hashed using PHP's native `password_hash()` with `PASSWORD_DEFAULT`).*

---

## 5. Security & Readability Features

- **SQL Injection Prevention:** 100% of database queries use PDO prepared statements with bound parameters (`PDO::ATTR_EMULATE_PREPARES => false`).
- **XSS Protection:** All user-supplied content is safely rendered using `textContent` on the client side and escaped with `htmlspecialchars()` where displayed in HTML.
- **Session Security:** Cookies configured with `HttpOnly`, `SameSite=Lax`, and `Secure` when running under HTTPS. `session_regenerate_id(true)` is invoked upon login.
- **Protected Endpoints:** Admin API endpoints enforce server-side authentication guards; unauthorized requests receive an immediate 401 response without leaking database details.
- **Duplicate Prevention:** Session-based throttling prevents accidental double-submissions.
