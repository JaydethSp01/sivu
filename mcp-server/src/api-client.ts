/**
 * Cliente HTTP del backend SIVU.
 *
 * Se autentica una vez con las credenciales del usuario MCP_AGENT, guarda el
 * access token en memoria y lo refresca automáticamente si el backend responde
 * 401/403. Si el refresh token también es rechazado intenta un re-login completo.
 */
import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { loadConfig, logger } from './config.js';

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  usuario: {
    id: string;
    email: string;
    nombres: string;
    apellidos: string;
    roles: string[];
    estudianteId: number | null;
    empresaId: number | null;
  };
}

export interface VacanteResponse {
  id: number;
  empresaId: number;
  empresa: { id: number; razonSocial: string };
  titulo: string;
  descripcion: string;
  areaPractica: string;
  modalidad: string;
  ciudad: string;
  requisitosKeywords: string[];
  creditosMinimos: number;
  promedioMinimo: number;
  programasDirigidos: string[];
  duracionMeses: number;
  cuposDisponibles: number;
  fechaInicio: string;
  fechaCierrePostulaciones: string;
  estado: string;
  createdAt: string;
  updatedAt: string;
}

export interface EstudianteResponse {
  id: number;
  tipoDocumento: string;
  numeroDocumento: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string | null;
  programaAcademico: string;
  semestre: number;
  creditosAprobados: number;
  promedioAcumulado: number;
  estado: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmpresaResponse {
  id: number;
  nit: string;
  razonSocial: string;
  nombreComercial: string | null;
  sector: string | null;
  ciudad: string | null;
  direccion: string | null;
  emailContacto: string | null;
  telefonoContacto: string | null;
  contactoNombre: string | null;
  contactoCargo: string | null;
  estado: string;
  createdAt: string;
  updatedAt: string;
}

export interface PostulacionResponse {
  id: number;
  estudianteId: number;
  estudianteNombreCompleto: string;
  vacanteId: number;
  vacanteTitulo: string;
  empresaId: number;
  empresaRazonSocial: string;
  estado: string;
  scoreMatching: number | null;
  justificacionMatching: string | null;
  mensajeEstudiante: string | null;
  observacionesEmpresa: string | null;
  fechaPostulacion: string;
  fechaDecision: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PostulacionEventoResponse {
  id: number;
  postulacionId: number;
  tipoEvento: string;
  estadoAnterior: string | null;
  estadoNuevo: string | null;
  detalle: string | null;
  actor: string;
  ocurridoEn: string;
}

export interface VerificacionAcademica {
  cumple: boolean;
  motivo: string;
}

export interface MatchingResponse {
  estudianteId: number;
  vacanteId: number;
  score: number;
  recomendado: boolean;
  justificacion: string;
}

export type EstadoPostulacion =
  | 'POSTULADA'
  | 'EN_REVISION'
  | 'PRESELECCIONADA'
  | 'RECHAZADA'
  | 'ACEPTADA'
  | 'RETIRADA';

export const ESTADOS_POSTULACION: readonly EstadoPostulacion[] = [
  'POSTULADA',
  'EN_REVISION',
  'PRESELECCIONADA',
  'RECHAZADA',
  'ACEPTADA',
  'RETIRADA',
] as const;

/**
 * Error de dominio del cliente — diferente a un AxiosError crudo. Las tools del
 * MCP pueden capturarlo y formatear un mensaje amigable al usuario.
 */
export class SivuApiError extends Error {
  public readonly status: number | undefined;
  public readonly endpoint: string;
  public readonly detail: unknown;

  public constructor(
    message: string,
    options: {
      status?: number;
      endpoint: string;
      detail?: unknown;
      cause?: unknown;
    },
  ) {
    super(message);
    this.name = 'SivuApiError';
    this.status = options.status;
    this.endpoint = options.endpoint;
    this.detail = options.detail;
    if (options.cause !== undefined) {
      (this as { cause?: unknown }).cause = options.cause;
    }
  }
}

interface TokenState {
  accessToken: string;
  refreshToken: string;
  expiresAtMs: number;
}

class SivuApiClient {
  private readonly http: AxiosInstance;
  private tokens: TokenState | undefined;
  private refreshing: Promise<TokenState> | undefined;

  public constructor() {
    const cfg = loadConfig();
    this.http = axios.create({
      baseURL: cfg.backendBaseUrl,
      timeout: cfg.httpTimeoutMs,
      headers: { 'Content-Type': 'application/json' },
    });

    this.http.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const path = config.url ?? '';
        // No anexar token a los endpoints de auth para evitar bucles.
        if (path.startsWith('/auth/')) {
          return config;
        }
        const tokens = await this.ensureTokens();
        config.headers.set('Authorization', `Bearer ${tokens.accessToken}`);
        return config;
      },
    );
  }

  /**
   * Asegura tener un access token vigente. Si caducó hace login otra vez.
   */
  private async ensureTokens(): Promise<TokenState> {
    const now = Date.now();
    if (this.tokens && this.tokens.expiresAtMs - 5_000 > now) {
      return this.tokens;
    }
    if (this.refreshing) {
      return this.refreshing;
    }
    this.refreshing = this.login().finally(() => {
      this.refreshing = undefined;
    });
    return this.refreshing;
  }

  private async login(): Promise<TokenState> {
    const cfg = loadConfig();
    logger.debug('Autenticando MCP agent contra el backend', {
      url: `${cfg.backendBaseUrl}/auth/login`,
      user: cfg.serviceUser,
    });
    try {
      const res = await this.http.post<AuthResponse>('/auth/login', {
        email: cfg.serviceUser,
        password: cfg.servicePassword,
      });
      const data = res.data;
      const expiresAtMs = Date.now() + Math.max(0, data.expiresIn) * 1000;
      this.tokens = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresAtMs,
      };
      logger.info('MCP agent autenticado', {
        user: data.usuario.email,
        roles: data.usuario.roles,
        expiresInSec: data.expiresIn,
      });
      return this.tokens;
    } catch (err) {
      this.tokens = undefined;
      throw this.wrapError(err, '/auth/login');
    }
  }

  /**
   * GET genérico. Re-intenta una vez con re-login si el backend devuelve 401.
   */
  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>('GET', url, config);
  }

  public async post<T>(
    url: string,
    body?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    return this.request<T>('POST', url, { ...config, data: body });
  }

  private async request<T>(
    method: 'GET' | 'POST',
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    try {
      const res: AxiosResponse<T> = await this.http.request<T>({
        method,
        url,
        ...config,
      });
      return res.data;
    } catch (err) {
      if (this.isUnauthorized(err) && !url.startsWith('/auth/')) {
        logger.warn(
          'Backend respondió 401/403; forzando re-login del MCP agent',
          { url },
        );
        this.tokens = undefined;
        try {
          const res: AxiosResponse<T> = await this.http.request<T>({
            method,
            url,
            ...config,
          });
          return res.data;
        } catch (retryErr) {
          throw this.wrapError(retryErr, url);
        }
      }
      throw this.wrapError(err, url);
    }
  }

  private isUnauthorized(err: unknown): boolean {
    if (!axios.isAxiosError(err)) {
      return false;
    }
    const status = err.response?.status;
    return status === 401 || status === 403;
  }

  private wrapError(err: unknown, endpoint: string): SivuApiError {
    if (axios.isAxiosError(err)) {
      const axiosErr = err as AxiosError<unknown>;
      const status = axiosErr.response?.status;
      const detail = axiosErr.response?.data ?? axiosErr.message;
      const baseMsg = status
        ? `Backend respondió ${status} en ${endpoint}`
        : `No fue posible contactar al backend (${endpoint}): ${axiosErr.message}`;
      return new SivuApiError(baseMsg, {
        status,
        endpoint,
        detail,
        cause: err,
      });
    }
    const message = err instanceof Error ? err.message : String(err);
    return new SivuApiError(`Error inesperado llamando ${endpoint}: ${message}`, {
      endpoint,
      cause: err,
    });
  }

  // -------------------------------------------------------------------------
  // Endpoints específicos. Centralizamos URLs para que las tools sean delgadas.
  // -------------------------------------------------------------------------

  public listarVacantes(params: {
    estado?: string;
    page?: number;
    size?: number;
  }): Promise<PageResponse<VacanteResponse>> {
    return this.get<PageResponse<VacanteResponse>>('/vacantes', { params });
  }

  public listarEstudiantes(params: {
    page?: number;
    size?: number;
  }): Promise<PageResponse<EstudianteResponse>> {
    return this.get<PageResponse<EstudianteResponse>>('/estudiantes', { params });
  }

  public listarEmpresas(params: {
    page?: number;
    size?: number;
  }): Promise<PageResponse<EmpresaResponse>> {
    return this.get<PageResponse<EmpresaResponse>>('/empresas', { params });
  }

  public listarPostulaciones(params: {
    estado?: EstadoPostulacion;
    estudianteId?: number;
    vacanteId?: number;
    page?: number;
    size?: number;
  }): Promise<PageResponse<PostulacionResponse>> {
    return this.get<PageResponse<PostulacionResponse>>('/postulaciones', {
      params,
    });
  }

  public obtenerPostulacion(id: number): Promise<PostulacionResponse> {
    return this.get<PostulacionResponse>(`/postulaciones/${id}`);
  }

  public historialPostulacion(
    id: number,
  ): Promise<PostulacionEventoResponse[]> {
    return this.get<PostulacionEventoResponse[]>(
      `/postulaciones/${id}/historial`,
    );
  }

  public validarAcademico(estudianteId: number): Promise<VerificacionAcademica> {
    return this.get<VerificacionAcademica>(
      `/automatizacion/validar-academico/${estudianteId}`,
    );
  }

  public matching(
    estudianteId: number,
    vacanteId: number,
  ): Promise<MatchingResponse> {
    return this.get<MatchingResponse>('/automatizacion/matching', {
      params: { estudianteId, vacanteId },
    });
  }

  public revisarInformeFinal(informeId: number): Promise<FeedbackInformeIA> {
    return this.post<FeedbackInformeIA>(`/ia/informe-final/${informeId}/feedback`, {});
  }

  // -------------------------------------------------------------------------
  // Proceso de Coformación (BI-17). Acompañamiento docente: agendamiento de
  // reuniones, disponibilidad del tutor, auditoría de notificaciones y notas
  // de la evaluación del tutor / informe final del PM.
  // -------------------------------------------------------------------------

  public listarReuniones(params: {
    estudianteId?: number;
    tutorId?: number;
    convenioId?: number;
  }): Promise<AgendamientoResponse[]> {
    return this.get<AgendamientoResponse[]>('/agendamiento/reuniones', {
      params,
    });
  }

  public listarDisponibilidades(params: {
    tutorId?: number;
    desde?: string;
    hasta?: string;
  }): Promise<DisponibilidadResponse[]> {
    return this.get<DisponibilidadResponse[]>('/agendamiento/disponibilidades', {
      params,
    });
  }

  public listarAuditoriaNotificaciones(params: {
    destinatario?: string;
    tipoEvento?: string;
    page?: number;
    size?: number;
  }): Promise<PageResponse<NotificacionAuditoriaResponse>> {
    return this.get<PageResponse<NotificacionAuditoriaResponse>>(
      '/notificaciones/auditoria',
      { params },
    );
  }

  public obtenerEvaluacionTutor(
    trimestreId: number,
  ): Promise<EvaluacionTutorResponse> {
    return this.get<EvaluacionTutorResponse>(
      `/trimestres/${trimestreId}/evaluacion-tutor`,
    );
  }

  public obtenerInformeFinal(
    planMejoraId: number,
  ): Promise<InformeFinalPmResponse> {
    return this.get<InformeFinalPmResponse>(
      `/planes-mejora/${planMejoraId}/informe-final`,
    );
  }
}

export interface AgendamientoResponse {
  id: number;
  convenioId: number | null;
  estudianteId: number | null;
  tutorId: number | null;
  disponibilidadId: number | null;
  fechaPropuesta: string | null;
  horaInicio: string | null;
  horaFin: string | null;
  modalidad: string | null;
  enlace: string | null;
  estado: string;
  observaciones: string | null;
  actaReunionId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface DisponibilidadResponse {
  id: number;
  tutorId: number | null;
  fecha: string | null;
  horaInicio: string | null;
  horaFin: string | null;
  modalidad: string | null;
  estado: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificacionAuditoriaResponse {
  id: number;
  tipoEvento: string;
  destinatarioEmail: string | null;
  asunto: string | null;
  enviadoExitoso: boolean;
  error: string | null;
  referenciaTipo: string | null;
  referenciaId: number | null;
  createdAt: string;
}

export interface EvaluacionTutorResponse {
  id: number;
  trimestreId: number;
  capacidades: number | null;
  actitudes: number | null;
  aplicacionDesempeno: number | null;
  aplicacionElaboracionPem: number | null;
  aplicacionSustentacionPem: number | null;
  notaPonderada: number | null;
  continuidadConEmpresa: boolean | null;
  observaciones: string | null;
  fechaElaboracion: string | null;
  firmadoTutor: boolean;
  firmadoEstudiante: boolean;
  documentoPdfId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface InformeFinalPmResponse {
  id: number;
  planMejoraId: number;
  tituloInforme: string | null;
  nivel: number | null;
  cargoTutorEmpresarial: string | null;
  notaTutor: number | null;
  notaProfesor: number | null;
  notaPromedio: number | null;
  altoImpacto: boolean | null;
  cumpleNotaMinima: boolean | null;
  numeroPaginas: number | null;
  estado: string;
  fechaEntrega: string | null;
  fechaRevision: string | null;
  revisadoPorNombre: string | null;
  observacionesRevisor: string | null;
  firmadoEstudiante: boolean | null;
  firmadoTutorAcad: boolean | null;
  firmadoTutorEmp: boolean | null;
  createdAt: string;
  updatedAt: string;
}

export interface HallazgoIA {
  severidad: string;
  seccion: string;
  detalle: string;
}

export interface FeedbackInformeIA {
  fuente: string;
  reporteMarkdown: string;
  hallazgos: HallazgoIA[];
  aviso: string | null;
}

let cached: SivuApiClient | undefined;

export function getApiClient(): SivuApiClient {
  if (!cached) {
    cached = new SivuApiClient();
  }
  return cached;
}

export type { SivuApiClient };
