-- =============================================================
-- Migration 002 (DOWN / Rollback): Remove Portfolio Content Tables
-- Only use if explicitly rolling back Migration 002.
-- =============================================================

DROP TABLE IF EXISTS `portfolio_skills`;
DROP TABLE IF EXISTS `portfolio_projects`;
