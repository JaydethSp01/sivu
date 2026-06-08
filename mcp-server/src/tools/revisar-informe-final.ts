/**
 * Tool: revisar_informe_final
 *
 * Cierra el §6.4 del doc para Coformación: el estudiante (o la profe Kelly)
 * puede pedirle a Claude — desde Claude Desktop o Claude Code — que revise
 * un borrador del Informe Final del PM antes de entregarlo formalmente.
 *
 * El backend SIVU corre el análisis estructural (secciones vacías, cota de
 * 15 páginas, carátula, etc.) y devuelve un reporte en Markdown. Claude
 * luego usa ese reporte como base para sumar su propia revisión cualitativa
 * en la conversación con el usuario. Todo sin necesidad de API keys: el LLM
 * lo está poniendo Claude Desktop, no el aplicativo.
 */
import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getApiClient } from '../api-client.js';
import { safeHandler, textResult } from './shared.js';

const inputShape = {
  informeId: z
    .number()
    .int()
    .positive()
    .describe('ID del Informe Final del PM (tabla informe_final_pm) a revisar.'),
} as const;

type Input = { informeId: number };

export function register(server: McpServer): void {
  server.registerTool(
    'revisar_informe_final',
    {
      title: 'Revisar Informe Final del PM',
      description:
        'Solicita al backend SIVU un análisis automático del Informe Final del PM (GTC-FM-16). Devuelve hallazgos por sección, recomendaciones y veredicto de entrega. Usar antes de pedir revisión humana o entregar.',
      inputSchema: inputShape,
    },
    safeHandler<Input>('revisar_informe_final', async (input) => {
      const api = getApiClient();
      const feedback = await api.revisarInformeFinal(input.informeId);

      const cabecera = `Revisión automática del informe ${input.informeId} (fuente: ${feedback.fuente}).`;
      const aviso = feedback.aviso ? `\n\n_${feedback.aviso}_` : '';
      const hallazgosLinea =
        feedback.hallazgos.length === 0
          ? ''
          : `\n\n**${feedback.hallazgos.length} hallazgo(s) estructurado(s) disponibles para inspección.**`;
      return textResult(
        `${cabecera}${hallazgosLinea}\n\n${feedback.reporteMarkdown}${aviso}`,
      );
    }),
  );
}
