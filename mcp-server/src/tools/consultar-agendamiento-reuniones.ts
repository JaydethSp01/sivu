/**
 * Tool: consultar_agendamiento_reuniones (Proceso de Coformación — BI-17)
 *
 * Lista las reuniones de acompañamiento (RF-C02/RF-C03) entre estudiante y
 * docente/tutor y su estado en el flujo colaborativo de agendamiento. Recibe
 * `estudianteId`, `tutorId` o `convenioId` (exactamente uno).
 */
import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getApiClient, AgendamientoResponse } from '../api-client.js';
import { safeHandler, textResult, formatDate } from './shared.js';

const inputShape = {
  estudianteId: z
    .number()
    .int()
    .positive()
    .optional()
    .describe('ID del estudiante: lista sus reuniones de acompañamiento.'),
  tutorId: z
    .number()
    .int()
    .positive()
    .optional()
    .describe('ID del tutor/docente: lista las reuniones que tiene agendadas.'),
  convenioId: z
    .number()
    .int()
    .positive()
    .optional()
    .describe('ID del convenio: lista las reuniones asociadas a ese convenio.'),
} as const;

type Input = { estudianteId?: number; tutorId?: number; convenioId?: number };

export function register(server: McpServer): void {
  server.registerTool(
    'consultar_agendamiento_reuniones',
    {
      title: 'Consultar agendamiento de reuniones (Coformación)',
      description:
        'Proceso de Coformación (BI-17): lista las reuniones de acompañamiento docente y su estado (PROPUESTO, CONFIRMADO, CONTRAOFERTA, RECHAZADO, CANCELADO). Recibe exactamente uno de: `estudianteId`, `tutorId` o `convenioId`.',
      inputSchema: inputShape,
    },
    safeHandler<Input>('consultar_agendamiento_reuniones', async (input) => {
      if (!input.estudianteId && !input.tutorId && !input.convenioId) {
        return textResult(
          'Necesito exactamente uno de `estudianteId`, `tutorId` o `convenioId` para listar las reuniones de acompañamiento.',
          true,
        );
      }
      const api = getApiClient();
      const reuniones = await api.listarReuniones({
        estudianteId: input.estudianteId,
        tutorId: input.tutorId,
        convenioId: input.convenioId,
      });

      const filtro = input.estudianteId
        ? `estudiante ${input.estudianteId}`
        : input.tutorId
        ? `tutor ${input.tutorId}`
        : `convenio ${input.convenioId}`;

      if (reuniones.length === 0) {
        return textResult(
          `No hay reuniones de acompañamiento agendadas para el ${filtro}.`,
        );
      }

      const ordenadas = [...reuniones].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      const header = `Reuniones de acompañamiento del ${filtro} (${reuniones.length}):`;
      const lines = ordenadas.map(renderReunion);
      return textResult([header, ...lines].join('\n\n'));
    }),
  );
}

function renderReunion(r: AgendamientoResponse): string {
  const horario =
    r.horaInicio && r.horaFin ? `${r.horaInicio}–${r.horaFin}` : '—';
  const acta = r.actaReunionId ? ` | Acta: #${r.actaReunionId}` : '';
  return (
    `• Reunión #${r.id} — Estado: ${r.estado}\n` +
    `  Estudiante: ${r.estudianteId ?? '—'} | Tutor: ${r.tutorId ?? '—'} | Convenio: ${r.convenioId ?? '—'}\n` +
    `  Fecha: ${r.fechaPropuesta ?? '—'} ${horario} | Modalidad: ${r.modalidad ?? '—'}${acta}\n` +
    (r.enlace ? `  Enlace: ${r.enlace}\n` : '') +
    (r.observaciones ? `  Observaciones: ${r.observaciones}\n` : '') +
    `  Actualizada: ${formatDate(r.updatedAt)}`
  );
}
