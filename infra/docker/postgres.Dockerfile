FROM postgis/postgis:16-3.4

# Use a shell init script for robust initialization (creates DB if missing,
# then applies schema to the Civic database). The script will run during
# container first-init via the official image entrypoint.
COPY infra/docker/init.sh /docker-entrypoint-initdb.d/01-init.sh
COPY db/schema.sql /docker-entrypoint-initdb.d/02-schema.sql
RUN chmod +x /docker-entrypoint-initdb.d/01-init.sh
