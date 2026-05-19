/**
 * Tool: listar_estudiantes_pendientes_validacion
 * Recorre estudiantes y cruza con la verificación académica. Devuelve los que
 * NO cumplen (con motivo). Útil para que coordinación atienda los casos críticos.
 */
import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  getApiClient,
  EstudianteResponse,
  VerificacionAcademica,
} from '../api-client.js';
import { safeHandler, textResult } from './shared.js';

const inputShape = {
  limit: z
    .number()
    .int()
    .positive()
    .max(50)
    .optional()
    .describe('Máximo de estudiantes pendientes a listar (1-50). Por defecto 10.'),
  scanSize: z
    .number()
    .int()
    .positive()
    .max(200)
    .optional()
    .describe('Cuántos estudiantes traer del backend para evaluar (default 50).'),
} as const;

interface PendienteRow {
  estudiante: EstudianteResponse;
  resultado: VerificacionAcademica;
}

export function register(server: McpServer): void {
  server.registerTool(
    'listar_estudiantes_pendientes_validacion',
    {
      title: 'Listar estudiantes pendientes de validación académica',
      description:
        'Cruza los estudiantes registrados con GET /automatizacion/validar-academico y devuelve aquellos que NO cumplen las condiciones académicas (créditos/promedio/estado), junto con el motivo.',
      inputSchema: inputShape,
    },
    safeHandler<{ limit?: number; scanSize?: number }>(
      'listar_estudiantes_pendientes_validacion',
      async (input) => {
        const limit = input.limit ?? 10;
        const scanSize = input.scanSize ?? 50;
        const api = getApiClient();
        const page = await api.listarEstudiantes({ page: 0, size: scanSize });

        const pendientes: PendienteRow[] = [];
        for (const est of page.content) {
          if (pendientes.length >= limit) {
            break;
          }
          try {
            const r = await api.validarAcademico(est.id);
            if (!r.cumple) {
              pendientes.push({ estudiante: est, resultado: r });
            }
          } catch {
            // Si la validación de un estudiante falla, lo tratamos como pendiente
            // con motivo "verificación inaccesible" — más útil que ignorarlo.
            pendientes.push({
              estudiante: est,
              resultado: {
                cumple: false,
                motivo: 'No se pudo ejecutar la verificación académica (timeout o error del backend).',
              },
            });
          }
        }

        if (pendientes.length === 0) {
          return textResult(
            `Revisé los primeros ${page.content.length} estudiantes (de ${page.totalElements}) y todos cumplen la verificación académica.`,
          );
        }

        const header = `Encontré ${pendientes.length} estudiante(s) que NO cumplen la verificación académica ` +
          `(scan: ${page.content.length}/${page.totalElements}):`;
        const lines = pendientes.map(formatRow);
        return textResult([header, ...lines].join('\n'));
      },
    ),
  );
}

function formatRow({ estudiante, resultado }: PendienteRow): string {
  const nombre = `${estudiante.nombres} ${estudiante.apellidos}`.trim();
  return (
    `- [${estudiante.id}] ${nombre} (${estudiante.programaAcademico}, ` +
    `sem ${estudiante.semestre}, créditos ${estudiante.creditosAprobados}, ` +
    `promedio ${estudiante.promedioAcumulado}, estado ${estudiante.estado}) — ` +
    `motivo: ${resultado.motivo}`
  );
}
