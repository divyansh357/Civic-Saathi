CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS vector;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'pgvector extension is not available in this image; skipping.';
END
$$;

-- Create the Civic database if it doesn't exist
SELECT 'CREATE DATABASE "Civic"'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'Civic')\gexec

-- Connect to the Civic database and enable extensions there too
\c Civic

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS vector;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'pgvector extension is not available in this image; skipping.';
END
$$;
