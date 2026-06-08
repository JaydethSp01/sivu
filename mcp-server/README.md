# SIVU MCP Server

Servidor [Model Context Protocol](https://modelcontextprotocol.io) que expone el backend de **SIVU** (Sistema de Vinculación Universitaria) como un conjunto de tools consumibles por Claude Desktop, Claude Code u otro cliente MCP. Cubre el **punto 8 del enunciado**: integración del backend con un LLM mediante MCP.

> Stack: Node.js ≥ 20, TypeScript estricto, `@modelcontextprotocol/sdk`, `zod`, `axios`, `dotenv`.

---

## 1. Tools registradas

| # | Tool | Descripción | Input |
|---|------|-------------|-------|
| 1 | `listar_vacantes_activas` | Lista vacantes con estado `PUBLICADA`. | `{ size?: number }` |
| 2 | `listar_estudiantes_pendientes_validacion` | Cruza estudiantes con la verificación académica y devuelve los que NO cumplen. | `{ limit?: number, scanSize?: number }` |
| 3 | `consultar_estado_postulacion` | Estado actual + cronograma de eventos de una postulación. Acepta `postulacionId` o `estudianteId`. | `{ postulacionId?: number, estudianteId?: number }` |
| 4 | `estadisticas_proceso` | Tabla markdown con conteos: estudiantes/empresas/vacantes y postulaciones por estado. | `{}` |
| 5 | `verificar_academico` | Veredicto en lenguaje natural del endpoint `/automatizacion/validar-academico/{id}`. | `{ estudianteId: number }` |
| 6 | `matching_estudiante_vacante` | Score, recomendación y justificación del matching. | `{ estudianteId: number, vacanteId: number }` |
| 7 | `asistente_tecnico` | Recibe una pregunta natural, decide qué tool aplicar y la ejecuta si la intención es clara. | `{ pregunta: string }` |
| 8 | `revisar_logs_pipeline` | Último run de GitHub Actions del repo (o uno específico). Devuelve stub informativo si no hay `GITHUB_TOKEN`/`GITHUB_REPO`. | `{ workflowRunId?: number, limit?: number }` |
| 9 | `revisar_informe_final` | Pide al backend el análisis del Informe Final del PM (secciones vacías, extensión, carátula) para que Claude le sume su revisión cualitativa. Cierra el §6.4 (IA al informe). | `{ informeId: number }` |

Todas las tools devuelven `{ content: [{ type: 'text', text: ... }] }`. Si algo falla (backend caído, 401, etc.) el resultado lleva `isError: true` y un mensaje accionable en español.

---

## 2. Requisitos

- Node.js ≥ 20 (`node --version`)
- npm ≥ 10
- Backend SIVU corriendo y accesible (por defecto `http://localhost:8080/api/v1`)
- Usuario semilla con rol `MCP_AGENT`:
  - Email: `mcp_agent@sivu.uempresarial.edu.co`
  - Password: `Mcp_Agent123*`

---

## 3. Build y ejecución

```bash
cd mcp-server
cp .env.example .env       # ajusta valores si tu backend no está en localhost:8080
npm install
npm run build              # compila a ./dist
npm start                  # corre el server en stdio (espera mensajes MCP por stdin)
```

Para desarrollo con recarga:

```bash
npm run dev                # tsx watch src/index.ts
```

> El server escribe logs estructurados a **stderr** (stdout está reservado al transporte MCP). Si lo invocas a mano por terminal verás un proceso colgado esperando frames JSON-RPC — eso es lo correcto.

### Variables de entorno

| Var | Default | Descripción |
|---|---|---|
| `MCP_BACKEND_BASE_URL` | `http://localhost:8080/api/v1` | URL base del backend. |
| `MCP_SERVICE_USER` | `mcp_agent@sivu.uempresarial.edu.co` | Email del usuario MCP_AGENT. |
| `MCP_SERVICE_PASSWORD` | `Mcp_Agent123*` | Password del usuario MCP_AGENT. |
| `MCP_HTTP_TIMEOUT_MS` | `15000` | Timeout HTTP por request. |
| `MCP_LOG_LEVEL` | `info` | `debug` \| `info` \| `warn` \| `error`. |
| `GITHUB_TOKEN` | — | PAT con scope `actions:read` (opcional, para `revisar_logs_pipeline`). |
| `GITHUB_REPO` | — | `owner/repo` (opcional). |

---

## 4. Conectar a Claude Desktop

Editá el archivo de configuración correspondiente a tu SO:

| SO | Ruta |
|---|---|
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |
| Linux | `~/.config/Claude/claude_desktop_config.json` (instalaciones no oficiales / claude-code) |

Y agregá la entrada `sivu` dentro de `mcpServers`:

```json
{
  "mcpServers": {
    "sivu": {
      "command": "node",
      "args": ["/ruta/absoluta/a/sivu/mcp-server/dist/index.js"],
      "env": {
        "MCP_BACKEND_BASE_URL": "http://localhost:8080/api/v1",
        "MCP_SERVICE_USER": "mcp_agent@sivu.uempresarial.edu.co",
        "MCP_SERVICE_PASSWORD": "Mcp_Agent123*"
      }
    }
  }
}
```

> Reemplazá `/ruta/absoluta/a/sivu/mcp-server/dist/index.js` por la ruta real (por ejemplo `/home/jaydethsp/sivu/mcp-server/dist/index.js`).

Reiniciá Claude Desktop. En la barra inferior debe aparecer el indicador del servidor `sivu` con sus 8 tools.

### Ejemplo de uso

> **Usuario en Claude Desktop:** "¿Cuántas postulaciones están pendientes?"
>
> **Claude:** invoca automáticamente `estadisticas_proceso` y responde con la tabla de postulaciones por estado.

Otros prompts que disparan tools:

- "Lista las vacantes activas que hay ahora mismo." → `listar_vacantes_activas`
- "¿Qué estudiantes están pendientes de validación académica?" → `listar_estudiantes_pendientes_validacion`
- "Dame el cronograma de la postulación 42." → `consultar_estado_postulacion`
- "¿El estudiante 7 cumple los requisitos académicos?" → `verificar_academico`
- "Calcula el matching del estudiante 7 con la vacante 12." → `matching_estudiante_vacante`
- "Revisa cómo va el pipeline." → `revisar_logs_pipeline`

---

## 5. Conectar a Claude Code (CLI)

Si usas `claude-code` con MCP local, registra el server con:

```bash
claude mcp add sivu node /ruta/absoluta/a/sivu/mcp-server/dist/index.js \
  -e MCP_BACKEND_BASE_URL=http://localhost:8080/api/v1 \
  -e MCP_SERVICE_USER=mcp_agent@sivu.uempresarial.edu.co \
  -e MCP_SERVICE_PASSWORD='Mcp_Agent123*'
```

---

## 6. Docker

```bash
docker build -t sivu-mcp-server .
docker run -i --rm \
  -e MCP_BACKEND_BASE_URL=http://host.docker.internal:8080/api/v1 \
  -e MCP_SERVICE_USER=mcp_agent@sivu.uempresarial.edu.co \
  -e MCP_SERVICE_PASSWORD='Mcp_Agent123*' \
  sivu-mcp-server
```

Para usar la imagen desde Claude Desktop:

```json
{
  "mcpServers": {
    "sivu": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-e", "MCP_BACKEND_BASE_URL=http://host.docker.internal:8080/api/v1",
        "-e", "MCP_SERVICE_USER=mcp_agent@sivu.uempresarial.edu.co",
        "-e", "MCP_SERVICE_PASSWORD=Mcp_Agent123*",
        "sivu-mcp-server"
      ]
    }
  }
}
```

---

## 7. Arquitectura

```
src/
├── index.ts              # entry: McpServer + StdioServerTransport
├── config.ts             # carga/valida env con zod, logger a stderr
├── api-client.ts         # axios singleton con auth automática y refresh
└── tools/
    ├── index.ts          # registra las 8 tools
    ├── shared.ts         # helpers: textResult, safeHandler, formatError
    ├── listar-vacantes-activas.ts
    ├── listar-estudiantes-pendientes-validacion.ts
    ├── consultar-estado-postulacion.ts
    ├── estadisticas-proceso.ts
    ├── verificar-academico.ts
    ├── matching-estudiante-vacante.ts
    ├── asistente-tecnico.ts
    └── revisar-logs-pipeline.ts
```

**Decisiones clave:**

- El cliente HTTP guarda el token en memoria y lo refresca por timestamp de `expiresIn`. Si el backend responde 401/403 fuerza un re-login y reintenta una vez.
- Todas las tools están envueltas con `safeHandler`: cualquier excepción se convierte en un `McpToolResult` con `isError: true` y un mensaje legible — el cliente MCP nunca recibe un error JSON-RPC crudo por fallos del backend.
- El logger escribe a **stderr** porque stdout pertenece al transporte stdio.
- Sin `any` en TypeScript; toda respuesta del backend tiene su tipo en `api-client.ts`.

---

## 8. Troubleshooting

| Síntoma | Causa probable | Acción |
|---|---|---|
| `No fue posible contactar al backend ... ECONNREFUSED` | Backend caído o URL mala. | `curl $MCP_BACKEND_BASE_URL/auth/login` para verificar. |
| `Backend respondió 401 en /auth/login` | Credenciales del usuario MCP incorrectas. | Confirma que la seed creó `mcp_agent@sivu.uempresarial.edu.co` con rol `MCP_AGENT`. |
| `Backend respondió 403` en una tool | El usuario MCP no tiene el rol requerido para ese endpoint. | Revisa `@PreAuthorize` en los controllers y agrega `MCP_AGENT` si falta. |
| Claude Desktop no ve las tools | Falta reinicio o ruta absoluta incorrecta en `claude_desktop_config.json`. | Reinicia Claude Desktop y revisa logs en `~/Library/Logs/Claude/`. |
| `revisar_logs_pipeline` devuelve stub | Falta `GITHUB_TOKEN` o `GITHUB_REPO`. | Agrega ambos al `env` del MCP server. |
