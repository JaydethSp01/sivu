/**
 * Tool: consultar_informe_final_notas (Proceso de Coformación — BI-17)
 *
 * Consulta el estado y las notas del Informe Final del Plan de Mejora
 * (GTC-FM-16): nota del tutor, nota del profesor, nota promedio, marca de
 * alto impacto y si cumple la nota mínima (≥ 3.0). Recibe `planMejoraId`.
 */
import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getApiClient, InformeFinalPmResponse } from '../api-client.js';
import { safeHandler, textResult, formatDate } from './shared.js';

const inputShape = {
  planMejoraId: z
    .number()
    .int()
    .positive()
    .describe('ID del Plan de Mejora cuyo Informe Final (GTC-FM-16) se consulta.'),
} as const;

type Input = { planMejoraId: number };

export function register(server: McpServer): void {
  server.registerTool(
    'consultar_informe_final_notas',
    {
      title: 'Consultar notas del Informe Final del PM (Coformación)',
      description:
        'Proceso de Coformación (BI-17): consulta el estado y las notas del Informe Final del Plan de Mejora (GTC-FM-16) por `planMejoraId`. Devuelve notaTutor, notaProfesor, notaPromedio, marca de alto impacto, si cumple la nota mínima (≥ 3.0) y el estado de firmas.',
      inputSchema: inputShape,
    },
    safeHandler<Input>('consultar_informe_final_notas', async (input) => {
      const api = getApiClient();
      const inf = await api.obtenerInformeFinal(input.planMejoraId);
      return textResult(renderInforme(inf));
    }),
  );
}

function num(n: number | null): string {
  return n === null || n === undefined ? '—' : String(n);
}

function siNoNull(b: boolean | null): string {
  return b === null || b === undefined ? '—' : b ? 'sí' : 'no';
}

function renderInforme(i: InformeFinalPmResponse): string {
  const firmas =
    `Estudiante: ${siNoNull(i.firmadoEstudiante)} | ` +
    `Tutor académico: ${siNoNull(i.firmadoTutorAcad)} | ` +
    `Tutor empresarial: ${siNoNull(i.firmadoTutorEmp)}`;
  return [
    `Informe Final del PM #${i.id} — Plan de Mejora ${i.planMejoraId}`,
    `Título: ${i.tituloInforme ?? '—'}`,
    `Estado: ${i.estado}`,
    `Nivel: ${i.nivel ?? '—'} | Páginas: ${i.numeroPaginas ?? '—'} (máx 15)`,
    '',
    'Notas:',
    `  • Nota tutor (empresarial): ${num(i.notaTutor)}`,
    `  • Nota profesor (docente): ${num(i.notaProfesor)}`,
    `  • Nota promedio: ${num(i.notaPromedio)}`,
    `  • Cumple nota mínima (≥ 3.0): ${siNoNull(i.cumpleNotaMinima)}`,
    `  • Alto impacto: ${siNoNull(i.altoImpacto)}`,
    '',
    `Cargo tutor empresarial: ${i.cargoTutorEmpresarial ?? '—'}`,
    `Entregado: ${formatDate(i.fechaEntrega)} | Revisado: ${formatDate(i.fechaRevision)}`,
    i.revisadoPorNombre ? `Revisado por: ${i.revisadoPorNombre}` : null,
    i.observacionesRevisor ? `Observaciones del revisor: ${i.observacionesRevisor}` : null,
    `Firmas: ${firmas}`,
    `Actualizado: ${formatDate(i.updatedAt)}`,
  ]
    .filter((l): l is string => l !== null)
    .join('\n');
}
