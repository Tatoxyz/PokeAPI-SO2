#!/bin/bash
# Pruebas de la API con curl: GET, POST, PUT, DELETE
# Uso: bash pruebas.sh [URL_BASE]     (por defecto http://127.0.0.1)
URL="${1:-http://127.0.0.1}"
sep() { echo; echo "==================== $* ===================="; }

sep "GET /api/salud (conexion con la base de datos)"
curl -s "$URL/api/salud"; echo

sep "GET /api/pokemon (listar todos)"
curl -s "$URL/api/pokemon"; echo

sep "GET /api/pokemon/25 (uno)"
curl -s "$URL/api/pokemon/25"; echo

sep "GET /api/pokemon?tipo=Agua (filtro)"
curl -s "$URL/api/pokemon?tipo=Agua"; echo

sep "POST /api/pokemon (crear Mewtwo)"
curl -s -X POST "$URL/api/pokemon" -H "Content-Type: application/json" \
     -d '{"numero":150,"nombre":"Mewtwo","tipo_principal":"Psiquico","region":"Kanto","nivel":70}'; echo

sep "PUT /api/pokemon/150 (capturar a Mewtwo y subir nivel)"
curl -s -X PUT "$URL/api/pokemon/150" -H "Content-Type: application/json" \
     -d '{"capturado":true,"nivel":75}'; echo

sep "DELETE /api/pokemon/150 (liberar a Mewtwo)"
curl -s -X DELETE "$URL/api/pokemon/150"; echo

sep "Errores controlados"
echo "- POST duplicado (numero 25):"
curl -s -X POST "$URL/api/pokemon" -H "Content-Type: application/json" \
     -d '{"numero":25,"nombre":"Pikachu","tipo_principal":"Electrico"}'; echo
echo "- PUT con nivel invalido (150):"
curl -s -X PUT "$URL/api/pokemon/25" -H "Content-Type: application/json" -d '{"nivel":150}'; echo
echo "- GET inexistente (999):"
curl -s -w "  [HTTP %{http_code}]" "$URL/api/pokemon/999"; echo
