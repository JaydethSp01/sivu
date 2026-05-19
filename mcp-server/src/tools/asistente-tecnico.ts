/**
 * Tool: asistente_tecnico
 * Recibe una pregunta en lenguaje natural y aplica una heurística de
 * clasificación para sugerir o ejecutar la tool apropiada. Si la intención es
 * inequívoca y no requiere parámetros, ejecuta la tool y devuelve su salida;
 * en otro caso explica qué tool conviene y qué parámetros faltan.
 */
import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  EstadoPostulacion,
  ESTADOS_POSTULACION,
  getApiClient,
} from '../api-client.js';
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
        'Recibe una pregunta en lenguaje natural sobre SIVU y devuelve la respuesta apropiada: ejecuta la tool más relevante si la intención es clara, o sugiere qué tool invocar y qué parámetros faltan.',
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
          '- `listar_vacantes_activas`',
          '- `listar_estudiantes_pendientes_validacion`',
          '- `consultar_estado_postulacion` (requiere postulacionId o estudianteId)',
          '- `estadisticas_proceso`',
          '- `verificar_academico` (requiere estudianteId)',
          '- `matching_estudiante_vacante` (requiere estudianteId y vacanteId)',
          '- `revisar_logs_pipeline` (CI/CD)',
          '',
          'Reformula la pregunta mencionando el dominio (vacantes, postulaciones, estudiantes, matching, pipeline) o invoca la tool directamente.',
        ].join('\n'),
      );
    }),
  );
}

function planificar(pregunta: string): Plan {
  const q = normalizar(pregunta);

  if (
    /(pendient|validacion|validar|verificacion|verificar).*academic|academ.*(pendient|validacion|verificacion)/u.test(
      q,
    ) ||
    /pendient.*estudiant|estudiant.*pendient/u.test(q)
  ) {
    return {
      tipo: 'auto',
      tool: 'listar_estudiantes_pendientes_validacion',
      razon: 'la pregunta menciona estudiantes pendientes / validación académica',
      ejecutar: async () => {
        const api = getApiClient();
        const page = await api.listarEstudiantes({ page: 0, size: 50 });
        const pendientes: string[] = [];
        for (const est of page.content) {
          if (pendientes.length >= 10) {
            break;
          }
          const r = await api.validarAcademico(est.id).catch(() => null);
          if (r && !r.cumple) {
            pendientes.push(
              `- [${est.id}] ${est.nombres} ${est.apellidos} — ${r.motivo}`,
            );
          }
        }
        if (pendientes.length === 0) {
          return 'Todos los estudiantes evaluados cumplen la verificación académica.';
        }
        return `Encontré ${pendientes.length} estudiante(s) pendientes:\n${pendientes.join('\n')}`;
      },
    };
  }

  if (/(vacant|oferta|practica)/u.test(q) && /(activ|publicad|abiert|disponibl)/u.test(q)) {
    return {
      tipo: 'auto',
      tool: 'listar_vacantes_activas',
      razon: 'la pregunta menciona vacantes activas / publicadas',
      ejecutar: async () => {
        const api = getApiClient();
        const page = await api.listarVacantes({ estado: 'PUBLICADA', page: 0, size: 20 });
        if (page.content.length === 0) {
          return 'No hay vacantes con estado PUBLICADA en este momento.';
        }
        return [
          `Hay ${page.totalElements} vacantes activas:`,
          ...page.content.map(
            (v) =>
              `- [${v.id}] ${v.titulo} — ${v.empresa.razonSocial}, ${v.ciudad}, ${v.modalidad}, cupos: ${v.cuposDisponibles}`,
          ),
        ].join('\n');
      },
    };
  }

  if (/(estadistic|resumen|cuanto|cuantas|cuantos|metric|kpi|dashboard)/u.test(q)) {
    return {
      tipo: 'auto',
      tool: 'estadisticas_proceso',
      razon: 'la pregunta pide cifras agregadas / estadísticas',
      ejecutar: async () => {
        const api = getApiClient();
        const [est, emp, vac] = await Promise.all([
          api.listarEstudiantes({ page: 0, size: 1 }),
          api.listarEmpresas({ page: 0, size: 1 }),
          api.listarVacantes({ estado: 'PUBLICADA', page: 0, size: 1 }),
        ]);
        const conteos: Array<[EstadoPostulacion, number]> = await Promise.all(
          ESTADOS_POSTULACION.map(async (estado): Promise<[EstadoPostulacion, number]> => {
            const r = await api.listarPostulaciones({ estado, page: 0, size: 1 });
            return [estado, r.totalElements];
          }),
        );
        const lines = [
          'Resumen rápido:',
          `- Estudiantes registrados: ${est.totalElements}`,
          `- Empresas registradas: ${emp.totalElements}`,
          `- Vacantes PUBLICADAs: ${vac.totalElements}`,
          'Postulaciones por estado:',
          ...conteos.map(([e, n]) => `  - ${e}: ${n}`),
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

  if (/(score|matching|match|encaj|compatibilidad)/u.test(q)) {
    return {
      tipo: 'sugerencia',
      tool: 'matching_estudiante_vacante',
      razon: 'la pregunta pide un score de matching',
      parametrosFaltantes: ['estudianteId', 'vacanteId'],
    };
  }

  if (/(postulacion|aplicacion|aplico|estado.*postul|seguimient)/u.test(q)) {
    return {
      tipo: 'sugerencia',
      tool: 'consultar_estado_postulacion',
      razon: 'la pregunta es sobre una postulación específica',
      parametrosFaltantes: ['postulacionId (o estudianteId)'],
    };
  }

  if (/(academic|credito|promedio|cumple)/u.test(q)) {
    return {
      tipo: 'sugerencia',
      tool: 'verificar_academico',
      razon: 'la pregunta es sobre condiciones académicas de un estudiante',
      parametrosFaltantes: ['estudianteId'],
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
