# =========================================================================
# SIVU IA Sidecar — Node 20
# Servicio HTTP que usa el plan de Claude Code (claude-agent-sdk +
# CLAUDE_CODE_OAUTH_TOKEN) para feedback del Informe Final, sin API key.
# =========================================================================
FROM node:20-alpine
WORKDIR /app

# Capa de dependencias cacheable
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

COPY server.mjs ./

# Usuario no-root
RUN addgroup -S sivu && adduser -S sivu -G sivu
USER sivu

ENV PORT=8090
EXPOSE 8090
CMD ["node", "server.mjs"]
