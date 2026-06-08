# SIVU IA Sidecar

Servicio HTTP mínimo (Node + Express) que da **feedback con IA sobre el Informe
Final del PM** usando el **plan de Claude Code** vía `@anthropic-ai/claude-agent-sdk`
— **sin consumir API key de Anthropic**.

Cumple el §6.4 del documento para Coformación (asistencia con IA al informe), y
es el complemento web del MCP server (`mcp-server/`) que cubre el mismo caso
desde Claude Desktop.

## Cómo funciona

```
Frontend ── "Revisar con IA" ──► Backend Java /ia/informe-final/{id}/feedback
                                      │
                       (si app.ia.sidecar-url está configurado)
                                      ▼
                          IA Sidecar  POST /review
                                      │  claude-agent-sdk
                                      ▼
                          Plan de Claude Code (sin API key)
```

Si el sidecar no está configurado o falla, el backend cae a un **revisor
heurístico local** (secciones vacías, cota de 15 páginas, carátula, etc.), así
que el sistema funciona con o sin IA.

## Variables de entorno

| Var | Obligatoria | Nota |
|-----|-------------|------|
| `CLAUDE_CODE_OAUTH_TOKEN` | en deploy headless | `claude setup-token`. En local no hace falta si ya estás logueado en Claude Code. |
| `PORT` | no | default 8090 |

Y en el backend: `IA_SIDECAR_URL=http://<host-del-sidecar>:8090` (o vacío para usar solo el heurístico).

## Correr local

```bash
cd ia-sidecar
npm install
npm start            # usa tu sesión de Claude Code ya logueada
# en otra terminal, el backend con:  IA_SIDECAR_URL=http://localhost:8090
```

## Endpoints

- `GET /health` → `{ ok, hasToken, model }`
- `POST /review` con el JSON del informe → `{ fuente: "claude-code", reporteMarkdown }`
