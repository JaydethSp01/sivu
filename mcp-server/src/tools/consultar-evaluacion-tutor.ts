/**
 * Tool: consultar_evaluacion_tutor (Proceso de Coformación — BI-17)
 *
 * Consulta el estado y las notas de la Evaluación del Tutor empresarial
 * (GAC-FM-007) de un trimestre: capacidades, actitudes, aplicación y la nota
 * ponderada autocalculada, además del estado de firmas.
 */
import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getApiClient, EvaluacionTutorResponse } from '../api-client.js';
import { safeHandler, textResult, formatDate } from './shared.js';

const inputShape = {
  trimestreId: z
    .number()
    .int()
    .positive()
    .describe('ID del trimestre cuya Evaluación del Tutor (GAC-FM-007) se consulta.'),
} as const;

type Input = { trimestreId: number };

export function register(server: McpServer): void {
  server.registerTool(
    'consultar_evaluacion_tutor',
    {
      title: 'Consultar Evaluación del Tutor (Coformación)',
      description:
        'Proceso de Coformación (BI-17): consulta el estado y las notas de la Evaluación del Tutor empresarial (GAC-FM-007) por trimestre. Pesos: Capacidades 40%, Actitudes 40%, Aplicación 20%. Devuelve la nota ponderada autocalculada y el estado de firmas (tutor/estudiante).',
      inputSchema: inputShape,
    },
    safeHandler<Input>('consultar_evaluacion_tutor', async (input) => {
      const api = getApiClient();
      const ev = await api.obtenerEvaluacionTutor(input.trimestreId);
      return textResult(renderEvaluacion(ev));
    }),
  );
}

function num(n: number | null): string {
  return n === null || n === undefined ? '—' : String(n);
}

function renderEvaluacion(e: EvaluacionTutorResponse): string {
  const firmas = `Tutor: ${e.firmadoTutor ? 'firmado ✓' : 'pendiente'} | ` +
    `Estudiante: ${e.firmadoEstudiante ? 'firmado ✓' : 'pendiente'}`;
  return [
    `Evaluación del Tutor — Trimestre ${e.trimestreId} (ET #${e.id})`,
    `Nota ponderada: ${num(e.notaPonderada)}`,
    '',
    'Componentes:',
    `  • Capacidades (40%): ${num(e.capacidades)}`,
    `  • Actitudes (40%): ${num(e.actitudes)}`,
    `  • Aplicación — Desempeño: ${num(e.aplicacionDesempeno)}`,
    `  • Aplicación — Elaboración PEM: ${num(e.aplicacionElaboracionPem)}`,
    `  • Aplicación — Sustentación PEM: ${num(e.aplicacionSustentacionPem)}`,
    '',
    `Continuidad con la empresa: ${
      e.continuidadConEmpresa === null
        ? '—'
        : e.continuidadConEmpresa
        ? 'sí'
        : 'no'
    }`,
    e.observaciones ? `Observaciones: ${e.observaciones}` : null,
    `Fecha de elaboración: ${e.fechaElaboracion ?? '—'}`,
    `Firmas: ${firmas}`,
    e.documentoPdfId ? `Documento PDF: #${e.documentoPdfId}` : null,
    `Actualizada: ${formatDate(e.updatedAt)}`,
  ]
    .filter((l): l is string => l !== null)
    .join('\n');
}
