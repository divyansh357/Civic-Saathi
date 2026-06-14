-- Migration: Rename department_code to municipal_code in users table
-- Description: Migrates data to the new column automatically created by Hibernate (JPA DDL update) and drops the old column.

-- Step 1: In case the column isn't created by Hibernate yet, create it.
ALTER TABLE IF EXISTS users 
ADD COLUMN IF NOT EXISTS municipal_code TEXT;

-- Step 2: Migrate data from the old column if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'department_code') THEN
    UPDATE users SET municipal_code = department_code WHERE department_code IS NOT NULL;
  END IF;
END $$;

-- Step 3: Drop the old column
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'department_code') THEN
    ALTER TABLE users DROP COLUMN department_code;
  END IF;
END $$;
