/**
 * Tool: estadisticas_proceso
 * Devuelve una tabla markdown con conteos clave del proceso de Coformación:
 * estudiantes y empresas registrados, convenios por estado y reuniones de
 * acompañamiento agendadas. Solo usa endpoints v2 vigentes.
 */
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getApiClient, SivuApiError } from '../api-client.js';
import { safeHandler, textResult } from './shared.js';

// Estados de convenio relevantes para el tablero de Coformación.
const ESTADOS_CONVENIO = [
  'BORRADOR',
  'PENDIENTE_FIRMA',
  'ACTIVO',
  'FINALIZADO',
  'RECHAZADO',
] as const;

type EstadoConvenio = (typeof ESTADOS_CONVENIO)[number];

export function register(server: McpServer): void {
  server.registerTool(
    'estadisticas_proceso',
    {
      title: 'Estadísticas del proceso de Coformación',
      description:
        'Devuelve un resumen tabular del proceso de Coformación: número de estudiantes y empresas registrados, convenios por estado y total de reuniones de acompañamiento agendadas.',
      inputSchema: {},
    },
    safeHandler<Record<string, unknown>>('estadisticas_proceso', async () => {
      const api = getApiClient();

      // size=1 para optimizar — solo necesitamos totalElements.
      const [estudiantes, empresas, reuniones] = await Promise.all([
        api.listarEstudiantes({ page: 0, size: 1 }),
        api.listarEmpresas({ page: 0, size: 1 }),
        api.listarReuniones({}),
      ]);

      const conveniosPorEstado = await contarConveniosPorEstado();

      const lines: string[] = [];
      lines.push('Resumen del proceso de Coformación SIVU');
      lines.push('');
      lines.push('| Indicador | Valor |');
      lines.push('|---|---|');
      lines.push(`| Estudiantes registrados (total) | ${estudiantes.totalElements} |`);
      lines.push(`| Empresas registradas (total) | ${empresas.totalElements} |`);
      lines.push(`| Reuniones de acompañamiento agendadas | ${reuniones.length} |`);
      lines.push('');
      lines.push('Convenios por estado');
      lines.push('');
      lines.push('| Estado | Cantidad |');
      lines.push('|---|---|');
      for (const estado of ESTADOS_CONVENIO) {
        lines.push(`| ${estado} | ${conveniosPorEstado[estado]} |`);
      }
      const total = ESTADOS_CONVENIO.map((e) => conveniosPorEstado[e])
        .filter((v): v is number => typeof v === 'number')
        .reduce((sum, n) => sum + n, 0);
      lines.push(`| **Total (contabilizado)** | **${total}** |`);

      return textResult(lines.join('\n'));
    }),
  );
}

async function contarConveniosPorEstado(): Promise<
  Record<EstadoConvenio, number | string>
> {
  const api = getApiClient();
  const result = {} as Record<EstadoConvenio, number | string>;
  await Promise.all(
    ESTADOS_CONVENIO.map(async (estado) => {
      try {
        const page = await api.listarConvenios({ estado, page: 0, size: 1 });
        result[estado] = page.totalElements;
      } catch (err) {
        result[estado] =
          err instanceof SivuApiError ? `error (${err.status ?? 'n/a'})` : 'error';
      }
    }),
  );
  return result;
}
