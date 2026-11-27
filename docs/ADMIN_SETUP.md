# Administrator Authentication & Deployment Setup Guide

This document explains how administrator authentication is architected, how to provision or rotate credentials safely, and how to configure production deployments across **Render (Docker)**, **Vercel**, and **TiDB Cloud / MySQL**.

> **Security Notice:** Never commit real passwords, `.env` files, or `.local-secrets/` to Git. Production credentials must be injected via environment variables.

---

## 1. How Administrator Authentication Works

- **Password Hashing:** Passwords are never stored in plaintext. Authentication uses PHP's `password_verify()` against a bcrypt hash (`PASSWORD_DEFAULT`) stored in `ADMIN_PASSWORD_HASH`.
- **Timing-Safe Username Check:** Usernames are compared using `hash_equals()`.
- **Session Hardening:**
  - `session_regenerate_id(true)` executes immediately after successful login to prevent session fixation.
  - Cookies enforce `HttpOnly`, `SameSite=Lax`, and `Secure` (automatically enabled over HTTPS / `X-Forwarded-Proto: https`).
  - `session.use_strict_mode = 1` and `session.use_only_cookies = 1` are enforced.
  - 30-minute inactivity timeout (`1800` seconds) automatically expires idle sessions.
- **Brute-Force Protection:** `api/admin-login.php` enforces rate limiting (maximum 5 failed attempts per 15-minute window, followed by a 15-minute lockout and 250ms artificial delay).
- **CSRF Protection:** All state-changing admin API endpoints (`POST`, `PATCH`, `DELETE`) verify a cryptographically random 64-hex CSRF token via `hash_equals()`.
- **Route & API Protection:**
  - Every admin API endpoint (`admin-messages.php`, `admin-analytics.php`, `admin-export.php`, `admin-profile.php`, `admin-projects.php`, `admin-skills.php`) calls `require_admin_auth()` server-side and returns `401 Unauthorized` to unauthenticated callers.
  - Admin HTML views (`dashboard.php`, `messages.php`, `content.php`) enforce server-side session checks before rendering.
  - No public administrator registration endpoint exists.

---

## 2. Required Environment Variables

### Database Connectivity (MySQL / MariaDB / TiDB Cloud)
| Variable | Description | Example |
|---|---|---|
| `DB_HOST` | Database hostname | `gateway01.ap-southeast-1.prod.aws.tidbcloud.com` |
| `DB_PORT` | Database port | `4000` (TiDB) or `3306` (MySQL) |
| `DB_NAME` | Database name | `portfolio_db` |
| `DB_USER` | Database username | `your_db_user` |
| `DB_PASS` | Database password | `(secret)` |
| `DB_SSL_CA` | Path or PEM string for TLS (required for TiDB Cloud / Aiven) | `/etc/ssl/certs/ca-certificates.crt` |

### Administrator Credentials
| Variable | Description |
|---|---|
| `ADMIN_USERNAME` | Administrator login username |
| `ADMIN_PASSWORD_HASH` | Bcrypt hash generated via `password_hash()` |
| `ADMIN_DISPLAY_NAME` | Display name shown in the Admin Topbar |

---

## 3. Initial Provisioning (One-Time Bootstrap)

### Local Development
Local credentials are generated in `.local-secrets/ADMIN_CREDENTIALS.local.md` (gitignored) and hashed in `.env`.

If provisioning a fresh environment from scratch, run the one-time CLI bootstrap script:
```bash
php scripts/bootstrap-admin.php
```
> The bootstrap script **refuses to run** if `ADMIN_USERNAME` and `ADMIN_PASSWORD_HASH` are already configured or if an administrator already exists. It will never silently overwrite or reset an existing admin on restart.

### Production (Render with Docker)
1. Generate a strong password (24+ random characters) offline.
2. Generate its bcrypt hash locally (do not store the plaintext password in code):
   ```bash
   php -r "echo password_hash('YOUR_STRONG_PASSWORD', PASSWORD_DEFAULT) . PHP_EOL;"
   ```
3. In **Render Dashboard** -> your Web Service -> **Environment**:
   - Add `ADMIN_USERNAME`
   - Add `ADMIN_PASSWORD_HASH` (paste the `$2y$10$...` hash)
   - Add `ADMIN_DISPLAY_NAME`
   - Add `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS`, and `DB_SSL_CA` (if using TiDB Cloud).
4. Save changes and trigger a deploy.

---

## 4. Logging In & Verifying Route Protection

1. Navigate to `/admin/login.html`.
2. Sign in with your configured `ADMIN_USERNAME` and password.
3. Verify protected routes reject unauthenticated requests:
   ```bash
   # Should return HTTP 401 JSON error
   curl -i http://localhost/PortfolioUpdate/Portfolio-Project/api/admin-messages.php
   curl -i http://localhost/PortfolioUpdate/Portfolio-Project/api/admin-projects.php
   curl -i http://localhost/PortfolioUpdate/Portfolio-Project/api/admin-skills.php
   ```
   Direct requests to `/admin/dashboard.php`, `/admin/messages.php`, or `/admin/content.php` without an active session must redirect to `login.html`.

---

## 5. Rotating Credentials & Access Recovery

### Rotating the Administrator Password
1. Generate a new 24+ character random password and compute its hash:
   ```bash
   php -r "echo password_hash('NEW_STRONG_PASSWORD', PASSWORD_DEFAULT) . PHP_EOL;"
   ```
2. Update `ADMIN_PASSWORD_HASH` in `.env` (local) or Render Environment Variables (production).
3. Update your local password manager or `.local-secrets/ADMIN_CREDENTIALS.local.md` (never commit).
4. Existing active sessions will remain valid until logout or 30-minute timeout; click **Sign Out** to invalidate immediately.

### Recovering Lost Administrator Access
Because plaintext passwords are never stored or recoverable:
1. Log into your hosting control panel (**Render Dashboard** -> **Environment**).
2. Generate a new bcrypt hash via PHP CLI as shown above.
3. Replace `ADMIN_PASSWORD_HASH` with the new hash and restart/redeploy the service.
