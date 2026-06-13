-- Migration V3: Add department_code to users table
-- Run in Supabase SQL Editor after V2.

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS department_code VARCHAR(50);
