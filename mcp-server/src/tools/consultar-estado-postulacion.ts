/**
 * Tool: consultar_estado_postulacion
 * Devuelve el estado actual de una postulación + cronograma de eventos.
 * Acepta `postulacionId` (consulta directa) o `estudianteId` (lista todas las
 * postulaciones del estudiante).
 */
import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  getApiClient,
  PostulacionResponse,
  PostulacionEventoResponse,
} from '../api-client.js';
import { safeHandler, textResult, formatDate } from './shared.js';

const inputShape = {
  postulacionId: z
    .number()
    .int()
    .positive()
    .optional()
    .describe('ID de la postulación a consultar.'),
  estudianteId: z
    .number()
    .int()
    .positive()
    .optional()
    .describe('Alternativa: ID del estudiante (devuelve resumen de todas sus postulaciones).'),
} as const;

type Input = { postulacionId?: number; estudianteId?: number };

export function register(server: McpServer): void {
  server.registerTool(
    'consultar_estado_postulacion',
    {
      title: 'Consultar estado de postulación',
      description:
        'Devuelve el estado actual y la línea de tiempo (eventos) de una postulación. Recibe `postulacionId` o `estudianteId`. Si se da `estudianteId` lista todas sus postulaciones.',
      inputSchema: inputShape,
    },
    safeHandler<Input>('consultar_estado_postulacion', async (input) => {
      if (!input.postulacionId && !input.estudianteId) {
        return textResult(
          'Necesito al menos `postulacionId` o `estudianteId` para consultar el estado de una postulación.',
          true,
        );
      }
      const api = getApiClient();

      if (input.postulacionId) {
        const post = await api.obtenerPostulacion(input.postulacionId);
        const historial = await api.historialPostulacion(input.postulacionId);
        return textResult(renderPostulacionConHistorial(post, historial));
      }

      // estudianteId path
      const page = await api.listarPostulaciones({
        estudianteId: input.estudianteId,
        page: 0,
        size: 20,
      });
      if (page.content.length === 0) {
        return textResult(
          `El estudiante ${input.estudianteId} no tiene postulaciones registradas.`,
        );
      }
      const header = `Postulaciones del estudiante ${input.estudianteId} ` +
        `(${page.totalElements} en total, mostrando ${page.content.length}):`;
      const lines = page.content.map(renderResumenPostulacion);
      return textResult([header, ...lines].join('\n\n'));
    }),
  );
}

function renderResumenPostulacion(p: PostulacionResponse): string {
  const score = p.scoreMatching === null ? '—' : p.scoreMatching.toString();
  return (
    `• [${p.id}] ${p.vacanteTitulo} @ ${p.empresaRazonSocial}\n` +
    `  Estado: ${p.estado} | Score: ${score} | Postulada: ${formatDate(p.fechaPostulacion)} | Decisión: ${formatDate(p.fechaDecision)}`
  );
}

function renderPostulacionConHistorial(
  p: PostulacionResponse,
  eventos: PostulacionEventoResponse[],
): string {
  const score = p.scoreMatching === null ? '—' : p.scoreMatching.toString();
  const cabecera = [
    `Postulación #${p.id} — ${p.vacanteTitulo} @ ${p.empresaRazonSocial}`,
    `Estudiante: ${p.estudianteNombreCompleto} (id ${p.estudianteId})`,
    `Estado actual: ${p.estado}`,
    `Score de matching: ${score}`,
    p.justificacionMatching ? `Justificación: ${p.justificacionMatching}` : null,
    `Fecha postulación: ${formatDate(p.fechaPostulacion)}`,
    `Fecha decisión: ${formatDate(p.fechaDecision)}`,
  ]
    .filter((l): l is string => l !== null)
    .join('\n');

  if (eventos.length === 0) {
    return `${cabecera}\n\nCronograma: sin eventos registrados.`;
  }

  const ordenados = [...eventos].sort(
    (a, b) => new Date(a.ocurridoEn).getTime() - new Date(b.ocurridoEn).getTime(),
  );

  const cronograma = ordenados
    .map((e) => {
      const transicion =
        e.estadoAnterior && e.estadoNuevo
          ? ` (${e.estadoAnterior} → ${e.estadoNuevo})`
          : e.estadoNuevo
          ? ` (→ ${e.estadoNuevo})`
          : '';
      return (
        `  ${formatDate(e.ocurridoEn)} — ${e.tipoEvento}${transicion}` +
        (e.detalle ? `\n    ${e.detalle}` : '') +
        `\n    (por ${e.actor})`
      );
    })
    .join('\n');

  return `${cabecera}\n\nCronograma de eventos:\n${cronograma}`;
}
