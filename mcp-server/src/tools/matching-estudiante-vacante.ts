/**
 * Tool: matching_estudiante_vacante
 * Calcula el score de matching entre un estudiante y una vacante usando el
 * endpoint /automatizacion/matching del backend.
 */
import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getApiClient } from '../api-client.js';
import { safeHandler, textResult } from './shared.js';

const inputShape = {
  estudianteId: z.number().int().positive().describe('ID del estudiante.'),
  vacanteId: z.number().int().positive().describe('ID de la vacante.'),
} as const;

type Input = { estudianteId: number; vacanteId: number };

export function register(server: McpServer): void {
  server.registerTool(
    'matching_estudiante_vacante',
    {
      title: 'Score de matching estudiante ↔ vacante',
      description:
        'Calcula el score de matching y la recomendación (apto/no apto) para un par estudiante/vacante, sin crear postulación.',
      inputSchema: inputShape,
    },
    safeHandler<Input>('matching_estudiante_vacante', async (input) => {
      const api = getApiClient();
      const r = await api.matching(input.estudianteId, input.vacanteId);
      const recomendacion = r.recomendado
        ? 'Recomendado: SÍ — el perfil encaja con la vacante.'
        : 'Recomendado: NO — el perfil no encaja lo suficiente con la vacante.';
      return textResult(
        [
          `Matching estudiante #${r.estudianteId} ↔ vacante #${r.vacanteId}`,
          `Score: ${r.score}`,
          recomendacion,
          `Justificación: ${r.justificacion}`,
        ].join('\n'),
      );
    }),
  );
}
