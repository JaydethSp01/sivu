#!/usr/bin/env bash
# run.sh — ejecuta la colección Postman del backend SIVU con Newman y genera un
# reporte HTML extra. Requiere `npm install` previo en este directorio.
#
# Pre-requisitos:
#   - Backend SIVU corriendo en http://localhost:8080 (ver docker-compose).
#   - Datos seed cargados (POST /api/v1/admin/seed) o se cargarán al inicio
#     porque la colección incluye un request de seed idempotente.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}"

mkdir -p reports

npx newman run ../postman/SIVU.postman_collection.json \
    -e ../postman/SIVU.local.postman_environment.json \
    --reporters cli,htmlextra \
    --reporter-htmlextra-export reports/sivu-report.html \
    --reporter-htmlextra-title "SIVU API Tests"
