# Database Management, Backup, Recovery & Hardening Guide

**Project:** Ethan McClarence Gacud Personal Portfolio  
**Database Name:** `portfolio_db`  
**Environment:** XAMPP (Apache + MariaDB/MySQL) / Production Linux Host  

---

## 1. Dedicated MySQL Application User Setup

By default in local development, XAMPP uses the `root` account with an empty password. For security, never use the MySQL `root` superuser account for the production website.

### Creating a Restricted User via phpMyAdmin:
1. Open your browser and navigate to `http://localhost/phpmyadmin/`.
2. Click on the **User accounts** tab in the top navigation bar.
3. Click **Add user account**.
4. Configure the account details:
   - **User name:** `portfolio_app`
   - **Host name:** `localhost`
   - **Password:** Generate a strong, random password (e.g. 24+ characters).
5. Under **Database for user account**, check:
   - `Grant all privileges on database "portfolio_db"`.
6. Under **Global privileges**, ensure **NO global privileges** are selected (keep Check All unchecked).
7. Under Database-specific privileges, grant only the necessary operations:
   - **Data:** `SELECT`, `INSERT`, `UPDATE`, `DELETE`
   - **Structure:** `CREATE`, `ALTER`, `INDEX` (optional, for migrations)
   - Do NOT grant administrative privileges like `DROP DATABASE`, `GRANT`, `FILE`, `SUPER`, or `SHUTDOWN`.
8. Click **Go** to create the user.
9. Update your local credentials in `config/database.php` or environment variables accordingly.

---

## 2. Exporting / Backing Up `portfolio_db` (phpMyAdmin)

Backups must always be stored outside the publicly accessible web root (e.g., in a secure private folder or encrypted cloud storage), never exposed to public URLs or committed to Git with live visitor messages.

### Backup Steps:
1. Navigate to `http://localhost/phpmyadmin/`.
2. In the left sidebar, click on **`portfolio_db`**.
3. Click on the **Export** tab in the top menu.
4. Export method:
   - Choose **Quick - display only the minimal options** (or **Custom** if you wish to gzip compress).
5. Format:
   - Select **SQL**.
6. Click **Export** (or **Go**).
7. Save the downloaded `.sql` file in a secure location outside `htdocs/`.
   - Recommended naming convention: `portfolio_db_backup_YYYY-MM-DD.sql`.

---

## 3. Restoring `portfolio_db` from Backup (Recovery Procedure)

If data is lost or corrupted, you can restore the complete schema and messages in minutes:

### Restore Steps:
1. Open `http://localhost/phpmyadmin/`.
2. If `portfolio_db` does not exist:
   - Click **New** in the left sidebar.
   - Enter `portfolio_db` as the database name.
   - Set Collation to `utf8mb4_unicode_ci`.
   - Click **Create**.
3. Select `portfolio_db` from the left sidebar.
4. Click on the **Import** tab in the top menu.
5. Under **File to import**, click **Choose File** (or Browse) and select your `.sql` backup file.
6. Ensure Character set is set to `utf-8`.
7. Click **Import** (or **Go**) at the bottom.
8. Verify success: Check that `contact_messages` and `admin_users` tables are visible with their data intact.

---

## 4. Production Security Checklist

- [x] **PDO Prepared Statements:** Used in all queries to prevent SQL Injection.
- [x] **Password Hashing:** `password_hash()` and `password_verify()` using `PASSWORD_DEFAULT` (bcrypt/argon2).
- [x] **Rate Limiting & Lockout:** Brute-force protection on admin login (cooldown after repeated failures).
- [x] **Session Security:** `HttpOnly`, `SameSite=Lax`, and `Secure` (when served over HTTPS).
- [x] **Honeypot & Fast-Submission Filter:** Lightweight anti-spam defenses for contact submissions.
- [x] **Content-Security-Policy & Headers:** `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`.
- [x] **Display Errors Disabled:** Errors logged to private logs, never revealed to public visitors.
