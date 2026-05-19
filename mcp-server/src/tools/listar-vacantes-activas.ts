/**
 * Tool: listar_vacantes_activas
 * Lista las vacantes con estado PUBLICADA y devuelve un resumen en texto claro.
 */
import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getApiClient, VacanteResponse } from '../api-client.js';
import { safeHandler, textResult } from './shared.js';

const inputShape = {
  size: z
    .number()
    .int()
    .positive()
    .max(100)
    .optional()
    .describe('Máximo de vacantes a devolver (1-100). Por defecto 20.'),
} as const;

export function register(server: McpServer): void {
  server.registerTool(
    'listar_vacantes_activas',
    {
      title: 'Listar vacantes activas',
      description:
        'Devuelve un resumen en texto de las vacantes con estado PUBLICADA: id, título, empresa, ciudad, modalidad y cupos disponibles.',
      inputSchema: inputShape,
    },
    safeHandler<{ size?: number }>('listar_vacantes_activas', async (input) => {
      const size = input.size ?? 20;
      const api = getApiClient();
      const page = await api.listarVacantes({
        estado: 'PUBLICADA',
        page: 0,
        size,
      });
      if (page.content.length === 0) {
        return textResult('No hay vacantes activas (estado=PUBLICADA) en este momento.');
      }
      const header = `Hay ${page.totalElements} vacantes activas` +
        (page.totalElements > page.content.length
          ? ` (mostrando las primeras ${page.content.length}):`
          : ':');
      const lines = page.content.map(formatVacante);
      return textResult([header, ...lines].join('\n'));
    }),
  );
}

function formatVacante(v: VacanteResponse): string {
  const empresa = v.empresa?.razonSocial ?? `Empresa ${v.empresaId}`;
  return (
    `- [${v.id}] ${v.titulo} — ${empresa}, ${v.ciudad}, ` +
    `${v.modalidad}, cupos: ${v.cuposDisponibles} ` +
    `(área: ${v.areaPractica}, créditos ≥ ${v.creditosMinimos}, ` +
    `promedio ≥ ${v.promedioMinimo})`
  );
}
