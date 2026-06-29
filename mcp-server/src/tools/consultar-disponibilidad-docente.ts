/**
 * Tool: consultar_disponibilidad_docente (Proceso de Coformación — BI-17)
 *
 * Lista las franjas de disponibilidad del tutor/docente (RF-C01) que sirven de
 * base para agendar reuniones de acompañamiento. Filtra por `tutorId` y un
 * rango opcional de fechas `desde`/`hasta`.
 */
import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getApiClient, DisponibilidadResponse } from '../api-client.js';
import { safeHandler, textResult } from './shared.js';

const fechaISO = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/u, 'La fecha debe tener formato ISO (YYYY-MM-DD).');

const inputShape = {
  tutorId: z
    .number()
    .int()
    .positive()
    .optional()
    .describe('ID del tutor/docente cuyas franjas de disponibilidad se consultan.'),
  desde: fechaISO
    .optional()
    .describe('Fecha inicial del rango (YYYY-MM-DD), opcional.'),
  hasta: fechaISO
    .optional()
    .describe('Fecha final del rango (YYYY-MM-DD), opcional.'),
} as const;

type Input = { tutorId?: number; desde?: string; hasta?: string };

export function register(server: McpServer): void {
  server.registerTool(
    'consultar_disponibilidad_docente',
    {
      title: 'Consultar disponibilidad del docente (Coformación)',
      description:
        'Proceso de Coformación (BI-17): lista las franjas de disponibilidad del tutor/docente (RF-C01) para agendar reuniones de acompañamiento. Filtra por `tutorId` y opcionalmente por rango de fechas `desde`/`hasta`. Muestra el estado de cada franja (ACTIVA, OCUPADA, etc.).',
      inputSchema: inputShape,
    },
    safeHandler<Input>('consultar_disponibilidad_docente', async (input) => {
      const api = getApiClient();
      const franjas = await api.listarDisponibilidades({
        tutorId: input.tutorId,
        desde: input.desde,
        hasta: input.hasta,
      });

      const filtro = input.tutorId ? `tutor ${input.tutorId}` : 'todos los tutores';
      const rango =
        input.desde || input.hasta
          ? ` (rango ${input.desde ?? 'inicio'} → ${input.hasta ?? 'fin'})`
          : '';

      if (franjas.length === 0) {
        return textResult(
          `No hay franjas de disponibilidad para ${filtro}${rango}.`,
        );
      }

      const ordenadas = [...franjas].sort((a, b) => {
        const fa = `${a.fecha ?? ''}${a.horaInicio ?? ''}`;
        const fb = `${b.fecha ?? ''}${b.horaInicio ?? ''}`;
        return fa.localeCompare(fb);
      });
      const header = `Disponibilidad de ${filtro}${rango} — ${franjas.length} franja(s):`;
      const lines = ordenadas.map(renderFranja);
      return textResult([header, ...lines].join('\n'));
    }),
  );
}

function renderFranja(f: DisponibilidadResponse): string {
  const horario =
    f.horaInicio && f.horaFin ? `${f.horaInicio}–${f.horaFin}` : '—';
  return (
    `• [${f.id}] ${f.fecha ?? '—'} ${horario} | Modalidad: ${f.modalidad ?? '—'} | ` +
    `Estado: ${f.estado} | Tutor: ${f.tutorId ?? '—'}`
  );
}
