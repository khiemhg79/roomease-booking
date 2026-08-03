#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"
[ -f .env ] || { echo 'Missing be/.env. Copy .env.example to .env first.' >&2; exit 1; }
set -a
. ./.env
set +a
chmod +x ./mvnw
exec ./mvnw spring-boot:run
