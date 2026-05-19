/**
 * Tool: revisar_logs_pipeline
 * Consulta los últimos workflow runs del repo SIVU vía la API pública de GitHub.
 * Si no hay GITHUB_TOKEN/GITHUB_REPO configurados devuelve una respuesta
 * informativa indicando los workflows típicos del proyecto.
 */
import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import axios from 'axios';
import { loadConfig } from '../config.js';
import { safeHandler, textResult, formatDate, truncate } from './shared.js';

const inputShape = {
  workflowRunId: z
    .number()
    .int()
    .positive()
    .optional()
    .describe('ID de un workflow run específico. Si se omite se traen los últimos 10.'),
  limit: z
    .number()
    .int()
    .positive()
    .max(20)
    .optional()
    .describe('Cuántos runs traer (máx 20) cuando no se da `workflowRunId`. Default 10.'),
} as const;

interface WorkflowRun {
  id: number;
  name: string | null;
  display_title?: string;
  head_branch: string | null;
  event: string;
  status: string;
  conclusion: string | null;
  run_number: number;
  run_attempt: number;
  html_url: string;
  created_at: string;
  updated_at: string;
}

interface ListRunsResponse {
  total_count: number;
  workflow_runs: WorkflowRun[];
}

type Input = { workflowRunId?: number; limit?: number };

export function register(server: McpServer): void {
  server.registerTool(
    'revisar_logs_pipeline',
    {
      title: 'Revisar runs del pipeline (GitHub Actions)',
      description:
        'Devuelve el estado del último (o un) run del pipeline CI/CD de SIVU en GitHub Actions (build, test, sonar, docker). Si no hay GITHUB_TOKEN/GITHUB_REPO configurados, devuelve el listado de workflows que usa el proyecto.',
      inputSchema: inputShape,
    },
    safeHandler<Input>('revisar_logs_pipeline', async (input) => {
      const cfg = loadConfig();
      if (!cfg.github.token || !cfg.github.repo) {
        return textResult(stubSinToken());
      }

      const http = axios.create({
        baseURL: `https://api.github.com/repos/${cfg.github.repo}`,
        timeout: cfg.httpTimeoutMs,
        headers: {
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          Authorization: `Bearer ${cfg.github.token}`,
          'User-Agent': 'sivu-mcp-server',
        },
      });

      if (input.workflowRunId) {
        const res = await http.get<WorkflowRun>(
          `/actions/runs/${input.workflowRunId}`,
        );
        return textResult(renderRun(res.data, cfg.github.repo));
      }

      const limit = input.limit ?? 10;
      const res = await http.get<ListRunsResponse>('/actions/runs', {
        params: { per_page: limit },
      });
      if (res.data.workflow_runs.length === 0) {
        return textResult(
          `No hay workflow runs registrados en ${cfg.github.repo}.`,
        );
      }
      const header =
        `Últimos ${res.data.workflow_runs.length} runs del pipeline de \`${cfg.github.repo}\` ` +
        `(total histórico: ${res.data.total_count}):`;
      return textResult(
        [header, ...res.data.workflow_runs.map((r) => renderRun(r, cfg.github.repo))].join(
          '\n\n',
        ),
      );
    }),
  );
}

function renderRun(run: WorkflowRun, repo: string | undefined): string {
  const repoStr = repo ?? '(repo)';
  const titulo = run.display_title ?? run.name ?? 'workflow';
  const conclusion = run.conclusion ?? 'pendiente';
  const lines = [
    `• [${run.id}] ${truncate(titulo, 100)}`,
    `  Workflow: ${run.name ?? '—'} | Run #${run.run_number} (intento ${run.run_attempt})`,
    `  Rama: ${run.head_branch ?? '—'} | Evento: ${run.event}`,
    `  Status: ${run.status} | Conclusión: ${conclusion}`,
    `  Creado: ${formatDate(run.created_at)} | Actualizado: ${formatDate(run.updated_at)}`,
    `  URL: ${run.html_url}`,
    `  Logs API: GET https://api.github.com/repos/${repoStr}/actions/runs/${run.id}/logs`,
  ];
  return lines.join('\n');
}

function stubSinToken(): string {
  return [
    'No hay credenciales de GitHub configuradas, así que no puedo traer los runs reales.',
    '',
    'Para habilitar esta tool define en el entorno del MCP server:',
    '  GITHUB_TOKEN=<personal access token con scope actions:read>',
    '  GITHUB_REPO=<owner>/<repo>',
    '',
    'El pipeline de SIVU (GitHub Actions) ejecuta los siguientes jobs principales:',
    '  - build: compila el backend Spring Boot con Maven',
    '  - test: corre los tests unitarios e integración (JUnit 5 + Testcontainers)',
    '  - sonar: análisis estático y cobertura con SonarQube/SonarCloud',
    '  - docker: construye y publica la imagen Docker del backend',
    '',
    'Una vez configurado el token, vuelve a invocar `revisar_logs_pipeline` (opcionalmente con `workflowRunId`).',
  ].join('\n');
}
