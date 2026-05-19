# =========================================================================
# SIVU MCP Server — imagen multistage Node 20
# =========================================================================
# Etapa 1: build (instala devDeps + compila TS)
FROM node:20-alpine AS build
WORKDIR /app

# Capa de dependencias cacheable
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Código fuente y compilación
COPY tsconfig.json ./
COPY src ./src
RUN npm run build && npm prune --omit=dev

# Etapa 2: runtime (sólo dist + node_modules de producción)
FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    MCP_LOG_LEVEL=info

# Usuario no-root
RUN addgroup -S mcp && adduser -S mcp -G mcp

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./

USER mcp

# stdio transport: el contenedor habla MCP por stdin/stdout.
# Ejecutar como: docker run -i --rm -e MCP_BACKEND_BASE_URL=... sivu-mcp-server
ENTRYPOINT ["node", "dist/index.js"]
