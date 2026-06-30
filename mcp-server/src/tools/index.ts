/**
 * Registro centralizado de tools del MCP server SIVU.
 *
 * Cada módulo expone `register(server)`. Esta función se llama una sola vez
 * desde `index.ts` antes de conectar el transporte stdio.
 *
 * El alcance v2 cubre exclusivamente el proceso de Coformación (BI-17):
 * acompañamiento docente (agendamiento, disponibilidad), auditoría de
 * notificaciones, evaluación del tutor y notas del informe final del PM, más
 * utilidades transversales (estadísticas, revisión de informe, router técnico
 * y logs del pipeline).
 */
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { register as registerEstadisticas } from './estadisticas-proceso.js';
import { register as registerAsistente } from './asistente-tecnico.js';
import { register as registerLogsPipeline } from './revisar-logs-pipeline.js';
import { register as registerRevisarInforme } from './revisar-informe-final.js';
import { register as registerAgendamientoReuniones } from './consultar-agendamiento-reuniones.js';
import { register as registerDisponibilidadDocente } from './consultar-disponibilidad-docente.js';
import { register as registerAuditoriaNotificaciones } from './consultar-auditoria-notificaciones.js';
import { register as registerEvaluacionTutor } from './consultar-evaluacion-tutor.js';
import { register as registerInformeFinalNotas } from './consultar-informe-final-notas.js';

export const TOOL_REGISTRARS: ReadonlyArray<(server: McpServer) => void> = [
  registerEstadisticas,
  registerAsistente,
  registerLogsPipeline,
  registerRevisarInforme,
  // Proceso de Coformación (BI-17)
  registerAgendamientoReuniones,
  registerDisponibilidadDocente,
  registerAuditoriaNotificaciones,
  registerEvaluacionTutor,
  registerInformeFinalNotas,
];

export function registerAllTools(server: McpServer): number {
  for (const fn of TOOL_REGISTRARS) {
    fn(server);
  }
  return TOOL_REGISTRARS.length;
}
