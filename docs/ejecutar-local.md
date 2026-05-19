# Ejecutar SIVU en local

Guía paso a paso para levantar todo SIVU en una máquina local en menos de 5 minutos.

## Requisitos

| Software | Versión mínima | Cómo verificar |
|---|---|---|
| Docker | 24 | `docker --version` |
| Docker Compose (plugin) | 2.20 | `docker compose version` |
| Make (opcional) | 4 | `make --version` |
| curl | cualquiera | `curl --version` |
| jq (opcional, mejora salida del seed) | 1.6 | `jq --version` |

> **Importante:** No necesitas Java/Node/Maven instalados en el host si solo quieres correr la demo. Esos sólo son necesarios para desarrollo con hot-reload (Opción 2).

---

## Opción 1 — Todo dockerizado (recomendado para demo)

```bash
cd /home/jaydethsp/sivu

# 1. Copiar variables de entorno
cp .env.example .env

# 2. Levantar todo el stack (build + up)
make demo
```

`make demo` ejecuta:
1. `docker compose up -d --build` (postgres, mongo, mailhog, backend, frontend, mcp-server)
2. Espera a que `/actuator/health` del backend responda 200
3. Llama `POST /api/v1/admin/seed` para poblar usuarios, estudiantes, empresas y vacantes demo

Al terminar verás:

```
============================================================
  Frontend:    http://localhost:5173
  Swagger:     http://localhost:8080/swagger-ui.html
  MailHog:     http://localhost:8025
============================================================
```

### Usuarios demo

| Rol | Email | Password |
|---|---|---|
| Admin | admin@uempresarial.edu.co | `Admin123*` |
| Coordinador de prácticas | coord@uempresarial.edu.co | `Coord123*` |
| Estudiante | kelly@est.uempresarial.edu.co | `Estudiante123*` |
| Empresa | rrhh@coally.com | `Empresa123*` |
| MCP Agent | mcp_agent@sivu.uempresarial.edu.co | `Mcp_Agent123*` |

### Apagar

```bash
make down       # detiene contenedores (conserva volúmenes)
make clean      # reset total: detiene y borra volúmenes
```

---

## Opción 2 — Desarrollo con hot-reload

Útil cuando estás modificando el código. Sólo se dockerizan las dependencias externas (Postgres + Mongo + MailHog).

```bash
make dev-deps   # levanta postgres+mongo+mailhog
```

En una terminal:
```bash
make backend-run   # mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

En otra:
```bash
make frontend-install   # npm install (sólo la primera vez)
make frontend-run       # vite dev en http://localhost:5173
```

(Opcional, en otra terminal para el agente MCP):
```bash
make mcp-install
make mcp-run
```

---

## Verificar que todo funciona

### Backend healthy
```bash
curl -s http://localhost:8080/actuator/health | jq
# Esperado: {"status":"UP","components":{...}}
```

### Login y token JWT
```bash
curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@uempresarial.edu.co","password":"Admin123*"}' | jq
```

### Listar estudiantes
```bash
TOKEN=$(curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@uempresarial.edu.co","password":"Admin123*"}' \
  | jq -r .accessToken)

curl -s http://localhost:8080/api/v1/estudiantes \
  -H "Authorization: Bearer $TOKEN" | jq '.content[] | {id,nombres,programaAcademico}'
```

### Calcular score de matching
```bash
curl -s "http://localhost:8080/api/v1/automatizacion/matching?estudianteId=1&vacanteId=1" \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Ver emails enviados
Abre **http://localhost:8025** (MailHog UI). Cada postulación y cambio de estado dispara un email.

### Frontend
Abre **http://localhost:5173** y haz login con un usuario demo. Verás el dashboard del rol correspondiente.

---

## Correr las pruebas

| Tipo | Comando |
|---|---|
| Unit Java | `make backend-test` |
| Cobertura JaCoCo | `make backend-coverage` (reporte en `backend/target/site/jacoco/index.html`) |
| API contract (Newman) | `make test-api` |
| E2E (Cypress headless) | `make test-e2e-ci` |
| E2E (Cypress GUI) | `make test-e2e` |
| Carga (k6) | `make test-load` |

---

## Solución de problemas

### El backend no arranca y dice "Connection refused" a postgres
Espera 10-15 segundos más; los healthchecks tardan. Verifica con `docker compose ps` que `sivu-postgres` esté `(healthy)`.

### "Port 5432/27017/8080 is already in use"
Cambia los puertos en `.env` (`POSTGRES_PORT`, `MONGO_PORT`, `BACKEND_PORT`, etc.) y vuelve a levantar.

### El seed devuelve 200 pero las listas vienen vacías
El seed sólo carga datos si las tablas están vacías. Si quieres recargar: `make clean && make demo`.

### Frontend no se conecta al backend
Verifica que la variable `VITE_API_BASE_URL` en el build del frontend apunte a `http://localhost:8080/api/v1`. En docker-compose se inyecta como build arg.

### Quiero conectar Claude Desktop al MCP server
Ver [`mcp-server/README.md`](../mcp-server/README.md).
