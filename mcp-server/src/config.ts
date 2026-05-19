/**
 * Carga y valida la configuración del MCP server a partir de variables de entorno.
 *
 * Cuando el server corre dentro de Claude Desktop las variables vienen del bloque
 * `env` en `claude_desktop_config.json`. En desarrollo local se usa `.env`.
 */
import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  MCP_BACKEND_BASE_URL: z
    .string()
    .url()
    .default('http://localhost:8080/api/v1'),
  MCP_SERVICE_USER: z
    .string()
    .min(1, 'MCP_SERVICE_USER es obligatorio')
    .default('mcp_agent@sivu.uempresarial.edu.co'),
  MCP_SERVICE_PASSWORD: z
    .string()
    .min(1, 'MCP_SERVICE_PASSWORD es obligatorio')
    .default('Mcp_Agent123*'),
  MCP_HTTP_TIMEOUT_MS: z.coerce.number().int().positive().default(15_000),
  MCP_LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  GITHUB_TOKEN: z.string().optional(),
  GITHUB_REPO: z
    .string()
    .regex(/^[^/\s]+\/[^/\s]+$/u, 'GITHUB_REPO debe tener formato owner/repo')
    .optional(),
});

export type AppConfig = {
  backendBaseUrl: string;
  serviceUser: string;
  servicePassword: string;
  httpTimeoutMs: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  github: {
    token: string | undefined;
    repo: string | undefined;
  };
};

let cached: AppConfig | undefined;

export function loadConfig(): AppConfig {
  if (cached) {
    return cached;
  }
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const summary = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');
    throw new Error(`Configuración inválida del MCP server:\n${summary}`);
  }
  const env = parsed.data;
  cached = {
    backendBaseUrl: env.MCP_BACKEND_BASE_URL.replace(/\/+$/u, ''),
    serviceUser: env.MCP_SERVICE_USER,
    servicePassword: env.MCP_SERVICE_PASSWORD,
    httpTimeoutMs: env.MCP_HTTP_TIMEOUT_MS,
    logLevel: env.MCP_LOG_LEVEL,
    github: {
      token: env.GITHUB_TOKEN,
      repo: env.GITHUB_REPO,
    },
  };
  return cached;
}

const LEVELS: Record<AppConfig['logLevel'], number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

/**
 * Logger minimalista que escribe a stderr — NO usar stdout porque ese canal
 * pertenece al transporte stdio del MCP SDK.
 */
export const logger = {
  debug(msg: string, meta?: Record<string, unknown>): void {
    emit('debug', msg, meta);
  },
  info(msg: string, meta?: Record<string, unknown>): void {
    emit('info', msg, meta);
  },
  warn(msg: string, meta?: Record<string, unknown>): void {
    emit('warn', msg, meta);
  },
  error(msg: string, meta?: Record<string, unknown>): void {
    emit('error', msg, meta);
  },
};

function emit(
  level: AppConfig['logLevel'],
  msg: string,
  meta?: Record<string, unknown>,
): void {
  const cfg = loadConfig();
  if (LEVELS[level] < LEVELS[cfg.logLevel]) {
    return;
  }
  const payload = {
    ts: new Date().toISOString(),
    level,
    msg,
    ...(meta ?? {}),
  };
  process.stderr.write(`${JSON.stringify(payload)}\n`);
}
