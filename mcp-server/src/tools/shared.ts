/**
 * Utilidades compartidas entre todas las tools del MCP server.
 */
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { SivuApiError } from '../api-client.js';
import { logger } from '../config.js';

export type McpToolResult = CallToolResult;

export function textResult(text: string, isError = false): McpToolResult {
  return {
    content: [{ type: 'text' as const, text }],
    ...(isError ? { isError: true } : {}),
  };
}

/**
 * Envuelve el handler de una tool para que cualquier excepción se convierta en
 * un resultado MCP con `isError: true` y un mensaje amigable. Sin esto el MCP
 * SDK propagaría una excepción cruda al cliente.
 *
 * El SDK invoca el callback con `(args, extra)` cuando hay `inputSchema`, o
 * sólo con `(extra)` cuando no lo hay. Aceptamos cualquier número de args
 * extra para mantener compatibilidad con ambas firmas.
 */
export function safeHandler<Input>(
  toolName: string,
  fn: (input: Input) => Promise<McpToolResult>,
): (input: Input, ...rest: unknown[]) => Promise<McpToolResult> {
  return async (input: Input, ..._rest: unknown[]) => {
    try {
      return await fn(input);
    } catch (err) {
      logger.error(`Error ejecutando tool ${toolName}`, {
        error: err instanceof Error ? err.message : String(err),
      });
      return textResult(formatError(toolName, err), true);
    }
  };
}

export function formatError(toolName: string, err: unknown): string {
  if (err instanceof SivuApiError) {
    const detail =
      err.detail && typeof err.detail === 'object'
        ? JSON.stringify(err.detail)
        : String(err.detail ?? '');
    return [
      `No se pudo completar la tool "${toolName}".`,
      err.message,
      detail ? `Detalle: ${truncate(detail, 500)}` : undefined,
      'Sugerencia: verifica que el backend SIVU esté corriendo y accesible en la URL configurada (MCP_BACKEND_BASE_URL).',
    ]
      .filter(Boolean)
      .join('\n');
  }
  if (err instanceof Error) {
    return `La tool "${toolName}" falló: ${err.message}`;
  }
  return `La tool "${toolName}" falló: ${String(err)}`;
}

export function truncate(s: string, max: number): string {
  if (s.length <= max) {
    return s;
  }
  return `${s.slice(0, max)}… (truncado)`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) {
    return '—';
  }
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) {
      return iso;
    }
    return d.toISOString().replace('T', ' ').slice(0, 16) + 'Z';
  } catch {
    return iso;
  }
}

