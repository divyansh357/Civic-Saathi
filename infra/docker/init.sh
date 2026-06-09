#!/bin/bash
set -euo pipefail

echo "init.sh: running DB initialization as $POSTGRES_USER"

# Create the Civic database if it doesn't exist, then apply schema.sql to it.
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    SELECT 'CREATE DATABASE "Civic"' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'Civic')\gexec
EOSQL

# Apply the schema to the Civic database
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "Civic" -f /docker-entrypoint-initdb.d/02-schema.sql || {
    echo "init.sh: failed to apply schema.sql to Civic; exiting"
    exit 1
}

echo "init.sh: DB initialization complete"
