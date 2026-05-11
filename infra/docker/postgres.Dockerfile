FROM postgis/postgis:16-3.4

COPY infra/docker/init.sql /docker-entrypoint-initdb.d/01-init.sql
COPY db/schema.sql /docker-entrypoint-initdb.d/02-schema.sql
