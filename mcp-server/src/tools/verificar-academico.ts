/**
 * Tool: verificar_academico
 * Wrapper natural sobre GET /automatizacion/validar-academico/{id}.
 */
import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getApiClient } from '../api-client.js';
import { safeHandler, textResult } from './shared.js';

const inputShape = {
  estudianteId: z
    .number()
    .int()
    .positive()
    .describe('ID del estudiante en SIVU.'),
} as const;

export function register(server: McpServer): void {
  server.registerTool(
    'verificar_academico',
    {
      title: 'Verificar condiciones académicas de un estudiante',
      description:
        'Llama al endpoint de verificación académica (mock universidad) y devuelve en lenguaje natural si el estudiante cumple los requisitos (créditos mínimos, promedio, estado ACTIVO).',
      inputSchema: inputShape,
    },
    safeHandler<{ estudianteId: number }>(
      'verificar_academico',
      async (input) => {
        const api = getApiClient();
        const r = await api.validarAcademico(input.estudianteId);
        const veredicto = r.cumple ? 'CUMPLE' : 'NO CUMPLE';
        return textResult(
          `El estudiante ${input.estudianteId} ${veredicto} las condiciones académicas.\n` +
            `Motivo / detalle: ${r.motivo}`,
        );
      },
    ),
  );
}
