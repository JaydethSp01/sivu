/**
 * Tool: asistente_tecnico
 * Recibe una pregunta en lenguaje natural y aplica una heurística de
 * clasificación para sugerir o ejecutar la tool apropiada del proceso de
 * Coformación. Si la intención es inequívoca y no requiere parámetros, ejecuta
 * la tool y devuelve su salida; en otro caso explica qué tool conviene y qué
 * parámetros faltan.
 */
import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getApiClient } from '../api-client.js';
import { safeHandler, textResult } from './shared.js';

const inputShape = {
  pregunta: z
    .string()
    .min(3)
    .describe('Pregunta del usuario en lenguaje natural.'),
} as const;

interface PlanEjecucionAuto {
  tipo: 'auto';
  tool: string;
  razon: string;
  ejecutar: () => Promise<string>;
}
interface PlanEjecucionSugerencia {
  tipo: 'sugerencia';
  tool: string;
  razon: string;
  parametrosFaltantes: string[];
}
interface PlanEjecucionDesconocido {
  tipo: 'desconocido';
}
type Plan = PlanEjecucionAuto | PlanEjecucionSugerencia | PlanEjecucionDesconocido;

export function register(server: McpServer): void {
  server.registerTool(
    'asistente_tecnico',
    {
      title: 'Asistente técnico SIVU (router de tools)',
      description:
        'Recibe una pregunta en lenguaje natural sobre el proceso de Coformación de SIVU y devuelve la respuesta apropiada: ejecuta la tool más relevante si la intención es clara, o sugiere qué tool invocar y qué parámetros faltan.',
      inputSchema: inputShape,
    },
    safeHandler<{ pregunta: string }>('asistente_tecnico', async (input) => {
      const plan = planificar(input.pregunta);
      if (plan.tipo === 'auto') {
        try {
          const salida = await plan.ejecutar();
          return textResult(
            `Tool ejecutada: \`${plan.tool}\` (motivo: ${plan.razon})\n\n${salida}`,
          );
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          return textResult(
            `Intenté ejecutar \`${plan.tool}\` pero falló: ${msg}\n` +
              `Puedes invocarla directamente para reintentar.`,
            true,
          );
        }
      }
      if (plan.tipo === 'sugerencia') {
        const faltantes = plan.parametrosFaltantes.length
          ? `\nParámetros faltantes: ${plan.parametrosFaltantes.join(', ')}.`
          : '';
        return textResult(
          `Sugerencia: invoca la tool \`${plan.tool}\`.\nMotivo: ${plan.razon}.${faltantes}`,
        );
      }
      return textResult(
        [
          'No detecté una intención específica. Las tools disponibles son:',
          '- `estadisticas_proceso`',
          '- `consultar_agendamiento_reuniones` (estudianteId, tutorId o convenioId)',
          '- `consultar_disponibilidad_docente` (tutorId, opcional desde/hasta)',
          '- `consultar_auditoria_notificaciones` (opcional destinatario/tipoEvento)',
          '- `consultar_evaluacion_tutor` (requiere trimestreId)',
          '- `consultar_informe_final_notas` (requiere planMejoraId)',
          '- `revisar_informe_final` (requiere informeId)',
          '- `revisar_logs_pipeline` (CI/CD)',
          '',
          'Reformula la pregunta mencionando el dominio (reuniones, disponibilidad, notificaciones, evaluación del tutor, informe final, estadísticas, pipeline) o invoca la tool directamente.',
        ].join('\n'),
      );
    }),
  );
}

function planificar(pregunta: string): Plan {
  const q = normalizar(pregunta);

  if (/(estadistic|resumen|cuanto|cuantas|cuantos|metric|kpi|dashboard|tablero)/u.test(q)) {
    return {
      tipo: 'auto',
      tool: 'estadisticas_proceso',
      razon: 'la pregunta pide cifras agregadas / estadísticas',
      ejecutar: async () => {
        const api = getApiClient();
        const [est, emp, reuniones] = await Promise.all([
          api.listarEstudiantes({ page: 0, size: 1 }),
          api.listarEmpresas({ page: 0, size: 1 }),
          api.listarReuniones({}),
        ]);
        const lines = [
          'Resumen rápido del proceso de Coformación:',
          `- Estudiantes registrados: ${est.totalElements}`,
          `- Empresas registradas: ${emp.totalElements}`,
          `- Reuniones de acompañamiento agendadas: ${reuniones.length}`,
        ];
        return lines.join('\n');
      },
    };
  }

  if (/(pipeline|ci|cd|workflow|github actions|build|despliegue|deploy)/u.test(q)) {
    return {
      tipo: 'sugerencia',
      tool: 'revisar_logs_pipeline',
      razon: 'la pregunta menciona CI/CD o el pipeline',
      parametrosFaltantes: [],
    };
  }

  if (/(reunion|agendamiento|agenda|cita|encuentro|acompanamiento)/u.test(q)) {
    return {
      tipo: 'sugerencia',
      tool: 'consultar_agendamiento_reuniones',
      razon: 'la pregunta es sobre reuniones de acompañamiento',
      parametrosFaltantes: ['estudianteId (o tutorId o convenioId)'],
    };
  }

  if (/(disponibilidad|franja|horario|cuando puede|agenda libre)/u.test(q)) {
    return {
      tipo: 'sugerencia',
      tool: 'consultar_disponibilidad_docente',
      razon: 'la pregunta es sobre la disponibilidad de un docente/tutor',
      parametrosFaltantes: ['tutorId'],
    };
  }

  if (/(notificacion|correo|email|aviso|auditoria)/u.test(q)) {
    return {
      tipo: 'sugerencia',
      tool: 'consultar_auditoria_notificaciones',
      razon: 'la pregunta es sobre el envío/auditoría de notificaciones',
      parametrosFaltantes: [],
    };
  }

  if (/(evaluacion.*tutor|tutor.*evaluacion|nota.*tutor|gac-fm-007)/u.test(q)) {
    return {
      tipo: 'sugerencia',
      tool: 'consultar_evaluacion_tutor',
      razon: 'la pregunta es sobre la evaluación del tutor de un trimestre',
      parametrosFaltantes: ['trimestreId'],
    };
  }

  if (/(informe final|plan de mejora|nota.*informe|gtc-fm-16|pem)/u.test(q)) {
    return {
      tipo: 'sugerencia',
      tool: 'consultar_informe_final_notas',
      razon: 'la pregunta es sobre las notas del informe final del PM',
      parametrosFaltantes: ['planMejoraId'],
    };
  }

  if (/(revisar.*informe|revision.*informe|feedback.*informe|borrador)/u.test(q)) {
    return {
      tipo: 'sugerencia',
      tool: 'revisar_informe_final',
      razon: 'la pregunta pide revisar un borrador del informe final',
      parametrosFaltantes: ['informeId'],
    };
  }

  return { tipo: 'desconocido' };
}

function normalizar(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    // Elimina diacríticos (combining diacritical marks U+0300..U+036F)
    .replace(/[̀-ͯ]/gu, '')
    .replace(/[¿?¡!.,;:()]/gu, ' ')
    .replace(/\s+/gu, ' ')
    .trim();
}
