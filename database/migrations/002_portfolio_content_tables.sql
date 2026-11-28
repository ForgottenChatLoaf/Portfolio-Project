-- =============================================================
-- Migration 002 (UP): Portfolio Projects & Skills CRUD Tables
-- Compatible with MySQL 8+, MariaDB 10.4+, and TiDB Cloud
-- Additive and safe: preserves all existing tables and records.
-- =============================================================

CREATE TABLE IF NOT EXISTS `portfolio_projects` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `slug` VARCHAR(64) NOT NULL UNIQUE,
    `title` VARCHAR(150) NOT NULL,
    `tag` VARCHAR(150) NOT NULL,
    `section_type` ENUM('featured', 'side_quest') NOT NULL DEFAULT 'featured',
    `description` TEXT NOT NULL,
    `role` VARCHAR(150) NULL,
    `category` VARCHAR(150) NULL,
    `timeline` VARCHAR(100) NULL,
    `tech_stack` TEXT NULL,
    `images_json` TEXT NULL,
    `primary_url` VARCHAR(255) NULL,
    `primary_label` VARCHAR(80) NULL,
    `secondary_url` VARCHAR(255) NULL,
    `secondary_label` VARCHAR(80) NULL,
    `display_order` INT NOT NULL DEFAULT 0,
    `is_visible` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_section_order` (`section_type`, `display_order`),
    INDEX `idx_visible` (`is_visible`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `portfolio_skills` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `category_key` VARCHAR(64) NOT NULL,
    `category_title` VARCHAR(120) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `subtitle` VARCHAR(150) NOT NULL,
    `details` TEXT NOT NULL,
    `icon_url` VARCHAR(255) NULL,
    `display_order` INT NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_category_order` (`category_key`, `display_order`),
    UNIQUE KEY `uniq_cat_skill` (`category_key`, `name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed existing real projects from projects.html only if not already present
INSERT IGNORE INTO `portfolio_projects`
(`slug`, `title`, `tag`, `section_type`, `description`, `role`, `category`, `timeline`, `tech_stack`, `images_json`, `primary_url`, `primary_label`, `secondary_url`, `secondary_label`, `display_order`, `is_visible`)
VALUES
(
  'portfolio',
  'Personal Portfolio Website',
  'Personal Project | Full-Stack Web Developer | Active Website',
  'featured',
  'A personal website developed to showcase my background, technical skills, academic and personal projects, and contact information. Built with a responsive dark editorial UI, vanilla JavaScript interactions, custom Apache ECharts analytics telemetry, and a reconstructed PHP/MySQL backend with secure administrative messaging and first-party analytics.',
  'Full-Stack Web Developer | UI Designer',
  'Personal & Academic Showcase | Active Portfolio',
  '2026 | Active Development',
  'PHP 8.2, MySQL / MariaDB, HTML5 Semantic, CSS3 Design Tokens, Vanilla JavaScript (ES6+), Apache ECharts',
  '["assets/images/projects/TheActualPortfolio/HomePage.png","assets/images/projects/TheActualPortfolio/Skills.png","assets/images/projects/TheActualPortfolio/AdminPageDashboard.png"]',
  'https://github.com/ForgottenChatLoaf/Portfolio-Project',
  'View Source Code',
  NULL,
  NULL,
  1,
  1
),
(
  'readora',
  'Readora',
  'Academic Frontend Project | Coursework Showcase',
  'featured',
  'An academic exploration of an interactive bookstore and virtual library frontend. Highlights responsive catalog browsing, UI/UX editorial styling, and client-side cart interactions designed as educational mock workflows.',
  'Frontend Developer | UI/UX Designer',
  'Academic Web Project | Coursework Showcase',
  'Academic Project | Coursework',
  'HTML5 Semantic, CSS3 Custom Properties, Vanilla JavaScript (ES6+), UI/UX Design, Responsive Breakpoints',
  '["assets/images/projects/Readora/Screenshot 2026-05-26 202500.png","assets/images/projects/Readora/Screenshot 2026-05-26 202512.png","assets/images/projects/Readora/Screenshot 2026-05-26 202615.png","assets/images/projects/Readora/Screenshot 2026-05-26 202632.png"]',
  'https://readoraupdate.netlify.app/',
  'View Project',
  NULL,
  NULL,
  2,
  1
),
(
  'icaredonate',
  'iCareDonate',
  'Team Project | In Development | Community Platform',
  'featured',
  'A collaborative community donation management platform connecting verified donation drives with volunteers and donors. Built as a team effort, Ethan served as Project Manager & Team Leader coordinating workflows and technical UI implementation.',
  'Project Manager | Team Leader & Technical Contributor',
  'Team Project | In Development (Community Platform)',
  'Collaborative Team Project',
  'PHP, MySQL / MariaDB, JavaScript, HTML5 / CSS3, Bootstrap, Role-Based Access Control, Vercel Deployment',
  '["assets/images/projects/iCareDonate/HomePage.png","assets/images/projects/iCareDonate/Admin_dashboard.png","assets/images/projects/iCareDonate/Howitworks.png","assets/images/projects/iCareDonate/howitworks1.png","assets/images/projects/iCareDonate/LoginPage.png"]',
  'https://icaredonate.vercel.app/',
  'Visit Live Site',
  'https://github.com/ForgottenChatLoaf',
  'GitHub',
  3,
  1
),
(
  'mock-gallery',
  'Pure CSS Image Gallery',
  'Layout Engineering',
  'side_quest',
  'Zero-JavaScript responsive photo showcase highlighting CSS Grid, Flexbox mechanics, fluid clamps, and accessible hover transitions.',
  'CSS UI Architect | Layout Designer',
  'Pure Frontend | Layout Engineering',
  'Coursework Showcase',
  'HTML5 Semantic, CSS3 Grid, CSS3 Flexbox, CSS Transitions',
  '["assets/images/projects/MockGallery/gallery-1.png","assets/images/projects/MockGallery/gallery-2.png","assets/images/projects/MockGallery/gallery-3.png"]',
  'https://ethan-gacud-mock-gallery.netlify.app/',
  'Demo',
  NULL,
  NULL,
  1,
  1
),
(
  'c-game',
  'C Language Terminal Gaming Suite & Console RPG',
  'Console Software | Algorithm Design',
  'side_quest',
  'A modular, terminal-based gaming suite programmed in C99. Explores algorithmic flow control, pseudo-random number generators, pointer mechanics, robust input validation to prevent buffer overflows, and an intuitive nested menu interface.',
  'System Logic & Algorithm Programmer',
  'Console Software | Algorithm Design',
  'Coursework (FOPR111)',
  'C Language (C99), GCC Compiler, Terminal ANSI, Data Structures & Algorithms',
  '["https://i.ibb.co/gFZKMhqf/Screenshot-2026-03-28-200143.png","https://i.ibb.co/0zbRZz8/Screenshot-2026-03-28-201316.png"]',
  'https://github.com/ForgottenChatLoaf/C-language-Projects',
  'View on GitHub',
  NULL,
  NULL,
  2,
  0
),
(
  'arduino-lab',
  'Microcontroller & Sensor Prototypes',
  'Embedded Systems & IoT Coursework',
  'side_quest',
  'Hands-on hardware programming explorations with microcontrollers and breadboard circuits. Involves sensor integration (ultrasonic distance, ambient light, thermal thresholds), digital and analog I/O pin control, and serial output telemetry for embedded automation experiments.',
  'Hardware Logic & Sensor Prototyping',
  'Embedded Systems & IoT Coursework',
  'Academic Lab Experiments',
  'C / Embedded Logic, Arduino IDE, Microcontrollers & Sensors, Hardware Breadboarding',
  '["https://images.unsplash.com/photo-1553406830-ef2513450d76?auto=format&fit=crop&w=800&q=80"]',
  'https://github.com/ForgottenChatLoaf',
  'Academic Showcase',
  NULL,
  NULL,
  3,
  0
);

-- Seed existing real skills from skills.html only if not already present
INSERT IGNORE INTO `portfolio_skills`
(`category_key`, `category_title`, `name`, `subtitle`, `details`, `icon_url`, `display_order`)
VALUES
('fundamentals', 'Programming Fundamentals', 'C Language', 'Core Fundamentals & Console Games', 'Completed BSIT-5_FOPR111 with distinction (CodeChum verified score 1452/1525). Developed terminal-based interactive games with modular logic, input validation, and memory safety.', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/c/c-original.svg', 1),
('fundamentals', 'Programming Fundamentals', 'Java', 'Coursework / Currently Learning', 'Studying object-oriented programming (OOP), inheritance, encapsulation, interfaces, and modular desktop/console software design.', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg', 2),
('frontend', 'Frontend Development', 'HTML5', 'Semantic & Accessible Structure', 'Semantic page structures, ARIA accessibility landmarks, robust forms with client-side validation, and SEO meta tags across this portfolio and web projects.', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg', 1),
('frontend', 'Frontend Development', 'CSS3', 'Flexbox, Grid, & Responsive UI', 'Built a 3,900+ line custom editorial dark theme from scratch with fluid CSS clamps, custom properties, glassmorphism, responsive grids, and zero framework bloat.', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg', 2),
('frontend', 'Frontend Development', 'JavaScript (ES6+)', 'DOM, Fetch API, & Interactions', 'Asynchronous Fetch API integration, interactive project modals, scroll-spy navigation, magnetic cursor physics, and two-step client state handling.', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg', 3),
('backend', 'Backend & Database', 'PHP', 'Sessions, API Endpoints, & Validation', 'Developed REST JSON endpoints, strict CSRF token validation, bcrypt password hashing, session regeneration, and file-based durable profile persistence.', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/php/php-original.svg', 1),
('backend', 'Backend & Database', 'MySQL', 'PDO Prepared Statements & phpMyAdmin', 'Relational table modeling for contact inquiries and admin accounts, PDO parameter binding to prevent SQL injection, and MariaDB administration via phpMyAdmin.', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg', 2),
('tools', 'Tools & Workflow', 'Git', 'Version Control & Branching', 'Version control discipline with feature branching, semantic git commit conventions, git status verification, and untracked file hygiene.', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg', 1),
('tools', 'Tools & Workflow', 'GitHub', 'Repository Management', 'Managing remote repositories at ForgottenChatLoaf, open-source repositories, project documentation, and CI/CD hosting deployment connections.', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg', 2),
('tools', 'Tools & Workflow', 'VS Code & Antigravity', 'Primary Development Environment', 'Primary coding workflow with debugging consoles, integrated terminals, XAMPP local server testing, and AI-assisted pair programming.', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vscode/vscode-original.svg', 3);
