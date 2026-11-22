# Professional Website Analytics Dashboard Guide
## Apache ECharts + PHP + MySQL + Vanilla JavaScript

This document details the first-party analytics system implemented in the **Ethan McClarence Gacud Portfolio Project**.

---

## 1. Environment & Dependencies

- **Node.js**: `v24.15.0` (LTS or later)
- **npm**: `11.12.1`
- **Apache ECharts**: `v6.1.0` (Official npm distribution)
- **PHP**: `8.2+` (with PDO MySQL extension)
- **MySQL / MariaDB**: `10.4+`

---

## 2. Installation & Browser Bundle Setup

To update or reinstall the local ECharts browser bundle:

```bash
# 1. Install official Apache ECharts package
npm install echarts --save

# 2. Copy the browser-ready bundle into the website's static vendor directory
# On Windows PowerShell:
New-Item -ItemType Directory -Force "assets\js\vendor"
Copy-Item "node_modules\echarts\dist\echarts.min.js" "assets\js\vendor\echarts.min.js" -Force

# On Linux / macOS:
mkdir -p assets/js/vendor
cp node_modules/echarts/dist/echarts.min.js assets/js/vendor/echarts.min.js
```

> **Zero Node.js in Production**: The website serves `assets/js/vendor/echarts.min.js` directly as a static JavaScript asset. No continuous Node.js server is required for production hosting.

---

## 3. Database Schema

The analytics pipeline writes to `portfolio_db.website_visits`:

```sql
CREATE TABLE IF NOT EXISTS `website_visits` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `visitor_hash` VARCHAR(64) NOT NULL,
    `page_path` VARCHAR(150) NOT NULL,
    `user_agent` VARCHAR(255) NULL,
    `visited_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_visited_at` (`visited_at`),
    INDEX `idx_visitor_hash` (`visitor_hash`),
    INDEX `idx_page_path` (`page_path`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 4. Telemetry & Tracking Behavior

1. **First-Party Visitor Token**:
   - An anonymous 30-day first-party cookie (`_portfolio_vid`) is issued.
   - The token is hashed with `hash('sha256', $rawToken)` before storage to protect visitor privacy.
2. **Bot & Crawler Filtering**:
   - Automated user agents (`googlebot`, `bingbot`, `ahrefs`, `curl`, `wget`, etc.) are filtered out.
3. **Session Debouncing**:
   - Re-visiting the same page within 5 seconds in the same session is throttled.
4. **Admin Activity Exclusion**:
   - Authenticated administrators (`is_admin_authenticated()`) are strictly excluded from visitor telemetry.
5. **90-Day Retention**:
   - Probabilistic cleanup ensures records older than 90 days are safely pruned without background cron overhead.

---

## 5. Metric Definitions

- **Total Visitors**: Count of distinct `visitor_hash` tokens within the selected time window.
- **Total Page Views**: Total count of logged page-view events.
- **Pages / Visit**: `Total Page Views / Distinct Visitors` in the period.
- **Views Today**: Total views where `visited_at >= CURDATE()`.
- **Top Visited Pages**: Pages ranked by view count, with human-readable titles (e.g. `Home (Landing)`, `Featured Projects`, `Skills & Taxonomy`).
- **Device Breakdown**: Parsed `user_agent` categorized into `Desktop`, `Mobile`, and `Tablet`.

---

## 6. How to Reuse Components in Other Websites

The frontend analytics dashboard components are modular:
1. Include `assets/js/vendor/echarts.min.js`.
2. Connect your HTML container IDs (`echartsTrafficChart`, `echartsDeviceChart`, `analyticsTopPagesList`).
3. Point `loadAnalytics(days)` to your backend JSON endpoint providing:
   ```json
   {
     "status": "success",
     "summary": { "total_views": 0, "visitors_range": 0, "pages_per_visit": 0 },
     "daily_activity": [ { "date_label": "YYYY-MM-DD", "views": 0, "unique_visitors": 0 } ],
     "devices": [ { "name": "Desktop", "value": 0 }, { "name": "Mobile", "value": 0 } ],
     "top_pages": [ { "display_name": "Home", "page_path": "index.php", "views": 0, "percentage": 0 } ]
   }
   ```
4. Each website maintains its own independent database and credentials.
