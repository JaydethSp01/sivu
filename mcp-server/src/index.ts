#!/usr/bin/env node
/**
 * Entry point del SIVU MCP server.
 *
 * Instancia `McpServer`, registra todas las tools y conecta el transporte stdio.
 * Está pensado para ser invocado por Claude Desktop (u otro cliente MCP) vía:
 *
 *   {
 *     "command": "node",
 *     "args": ["/ruta/absoluta/a/mcp-server/dist/index.js"]
 *   }
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { loadConfig, logger } from './config.js';
import { registerAllTools } from './tools/index.js';

async function main(): Promise<void> {
  // Forzamos validación temprana de configuración para fallar rápido.
  loadConfig();

  const server = new McpServer(
    {
      name: 'sivu-mcp-server',
      version: '0.1.0',
    },
    {
      capabilities: {
        tools: {},
      },
      instructions:
        'Servidor MCP de SIVU (Sistema de Vinculación Universitaria). ' +
        'Expone tools para consultar vacantes, estudiantes, postulaciones, ' +
        'estadísticas, matching y logs de pipeline. Las tools devuelven texto ' +
        'plano o markdown listo para mostrar al usuario.',
    },
  );

  const total = registerAllTools(server);
  logger.info('Tools registradas', { total });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info('SIVU MCP server escuchando en stdio');

  // Cierre limpio para que Claude Desktop no deje procesos colgados.
  const shutdown = async (signal: string): Promise<void> => {
    logger.info('Cerrando MCP server', { signal });
    try {
      await server.close();
    } catch (err) {
      logger.warn('Error cerrando server', {
        error: err instanceof Error ? err.message : String(err),
      });
    }
    process.exit(0);
  };
  process.on('SIGINT', () => {
    void shutdown('SIGINT');
  });
  process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
  });
}

main().catch((err: unknown) => {
  const msg = err instanceof Error ? err.stack ?? err.message : String(err);
  process.stderr.write(`[sivu-mcp-server] fatal: ${msg}\n`);
  process.exit(1);
});
