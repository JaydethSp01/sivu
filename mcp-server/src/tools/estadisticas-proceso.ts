/**
 * Tool: estadisticas_proceso
 * Devuelve una tabla markdown con conteos clave: estudiantes/empresas activas,
 * vacantes publicadas y postulaciones por estado.
 */
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  EstadoPostulacion,
  ESTADOS_POSTULACION,
  getApiClient,
  SivuApiError,
} from '../api-client.js';
import { safeHandler, textResult } from './shared.js';

export function register(server: McpServer): void {
  server.registerTool(
    'estadisticas_proceso',
    {
      title: 'Estadísticas del proceso de vinculación',
      description:
        'Devuelve un resumen tabular del estado del proceso: número de estudiantes y empresas activos, vacantes publicadas y postulaciones por cada estado (POSTULADA, EN_REVISION, PRESELECCIONADA, ACEPTADA, RECHAZADA, RETIRADA).',
      inputSchema: {},
    },
    safeHandler<Record<string, unknown>>('estadisticas_proceso', async () => {
      const api = getApiClient();

      // Usamos size=1 para optimizar — solo necesitamos totalElements.
      const [estudiantes, empresas, vacantes] = await Promise.all([
        api.listarEstudiantes({ page: 0, size: 1 }),
        api.listarEmpresas({ page: 0, size: 1 }),
        api.listarVacantes({ estado: 'PUBLICADA', page: 0, size: 1 }),
      ]);

      const postulacionesPorEstado: Record<EstadoPostulacion, number | string> =
        await contarPostulacionesPorEstado();

      const lines: string[] = [];
      lines.push('Resumen del proceso SIVU');
      lines.push('');
      lines.push('| Indicador | Valor |');
      lines.push('|---|---|');
      lines.push(`| Estudiantes registrados (total) | ${estudiantes.totalElements} |`);
      lines.push(`| Empresas registradas (total) | ${empresas.totalElements} |`);
      lines.push(`| Vacantes PUBLICADAs | ${vacantes.totalElements} |`);
      lines.push('');
      lines.push('Postulaciones por estado');
      lines.push('');
      lines.push('| Estado | Cantidad |');
      lines.push('|---|---|');
      for (const estado of ESTADOS_POSTULACION) {
        lines.push(`| ${estado} | ${postulacionesPorEstado[estado]} |`);
      }
      const total = ESTADOS_POSTULACION.map((e) => postulacionesPorEstado[e])
        .filter((v): v is number => typeof v === 'number')
        .reduce((sum, n) => sum + n, 0);
      lines.push(`| **Total (contabilizado)** | **${total}** |`);

      return textResult(lines.join('\n'));
    }),
  );
}

async function contarPostulacionesPorEstado(): Promise<
  Record<EstadoPostulacion, number | string>
> {
  const api = getApiClient();
  const result = {} as Record<EstadoPostulacion, number | string>;
  await Promise.all(
    ESTADOS_POSTULACION.map(async (estado) => {
      try {
        const page = await api.listarPostulaciones({
          estado,
          page: 0,
          size: 1,
        });
        result[estado] = page.totalElements;
      } catch (err) {
        result[estado] =
          err instanceof SivuApiError ? `error (${err.status ?? 'n/a'})` : 'error';
      }
    }),
  );
  return result;
}
