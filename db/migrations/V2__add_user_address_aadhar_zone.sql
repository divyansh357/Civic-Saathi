-- Migration V2: Add address, aadhar_number, and zone_number to users table
-- Run this against your Supabase database in the SQL Editor.

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS address        TEXT,
    ADD COLUMN IF NOT EXISTS aadhar_number  VARCHAR(12),
    ADD COLUMN IF NOT EXISTS zone_number    INT;
