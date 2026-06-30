/**
 * Tool: consultar_auditoria_notificaciones (Proceso de Coformación — BI-17)
 *
 * Consulta la auditoría de notificaciones (BI-01 / RF-D01-D02) generadas a lo
 * largo del proceso documental y de agendamiento: qué se notificó, a quién y
 * si el envío fue exitoso. Filtra por `destinatario` y/o `tipoEvento`.
 */
import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  getApiClient,
  NotificacionAuditoriaResponse,
} from '../api-client.js';
import { safeHandler, textResult, formatDate } from './shared.js';

const TIPOS_EVENTO = [
  'PLAN_ENVIADO',
  'CORTE_CALIFICADO',
  'DOCUMENTO_FIRMADO',
  'EXPEDIENTE_COMPLETO',
  'REUNION_PROPUESTA',
  'REUNION_CONFIRMADA',
  'RECORDATORIO_CIERRE',
  'RECORDATORIO_REUNION',
  'REUNION_CANCELADA',
] as const;

const inputShape = {
  destinatario: z
    .string()
    .min(1)
    .optional()
    .describe('Email (o fragmento) del destinatario de las notificaciones.'),
  tipoEvento: z
    .enum(TIPOS_EVENTO)
    .optional()
    .describe('Tipo de evento que disparó la notificación.'),
  page: z
    .number()
    .int()
    .nonnegative()
    .optional()
    .describe('Página (0-based) para paginación. Por defecto 0.'),
  size: z
    .number()
    .int()
    .positive()
    .max(100)
    .optional()
    .describe('Cantidad de registros por página (máx 100). Por defecto 20.'),
} as const;

type Input = {
  destinatario?: string;
  tipoEvento?: (typeof TIPOS_EVENTO)[number];
  page?: number;
  size?: number;
};

export function register(server: McpServer): void {
  server.registerTool(
    'consultar_auditoria_notificaciones',
    {
      title: 'Consultar auditoría de notificaciones (Coformación)',
      description:
        'Proceso de Coformación (BI-17): consulta la auditoría de notificaciones del flujo documental y de agendamiento (BI-01 / RF-D01-D02). Muestra qué se notificó, a quién, el asunto y si el envío fue exitoso. Filtra por `destinatario` y/o `tipoEvento`.',
      inputSchema: inputShape,
    },
    safeHandler<Input>('consultar_auditoria_notificaciones', async (input) => {
      const api = getApiClient();
      const page = await api.listarAuditoriaNotificaciones({
        destinatario: input.destinatario,
        tipoEvento: input.tipoEvento,
        page: input.page ?? 0,
        size: input.size ?? 20,
      });

      if (page.content.length === 0) {
        return textResult(
          'No se encontraron notificaciones auditadas con los filtros indicados.',
        );
      }

      const header =
        `Auditoría de notificaciones (${page.totalElements} en total, ` +
        `mostrando ${page.content.length} — página ${page.page + 1}/${page.totalPages}):`;
      const lines = page.content.map(renderNotificacion);
      return textResult([header, ...lines].join('\n\n'));
    }),
  );
}

function renderNotificacion(n: NotificacionAuditoriaResponse): string {
  const estado = n.enviadoExitoso ? 'ENVIADA ✓' : 'FALLIDA ✗';
  const referencia =
    n.referenciaTipo || n.referenciaId
      ? `\n  Referencia: ${n.referenciaTipo ?? '—'} #${n.referenciaId ?? '—'}`
      : '';
  return (
    `• [${n.id}] ${n.tipoEvento} — ${estado}\n` +
    `  Para: ${n.destinatarioEmail ?? '—'} | ${formatDate(n.createdAt)}\n` +
    `  Asunto: ${n.asunto ?? '—'}` +
    referencia +
    (n.error ? `\n  Error: ${n.error}` : '')
  );
}
