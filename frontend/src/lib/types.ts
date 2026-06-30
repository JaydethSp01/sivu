export type Rol = "ADMIN" | "COORDINADOR" | "ESTUDIANTE" | "DOCENTE" | "TUTOR" | "MCP_AGENT";

export interface UsuarioResumen {
  id: string;
  email: string;
  nombres: string;
  apellidos: string;
  roles: Rol[];
  estudianteId: number | null;
  empresaId: number | null;
  /** Entidad Tutor vinculada (académico para DOCENTE, empresarial para TUTOR). */
  tutorId: number | null;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  usuario: UsuarioResumen;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface ApiErrorBody {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  errors?: { campo: string; mensaje: string }[];
}

export type TipoDocumento = "CC" | "TI" | "CE" | "PA";
export type EstadoEstudiante = "ACTIVO" | "GRADUADO" | "RETIRADO";

export interface Estudiante {
  id: number;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string | null;
  programaAcademico: string;
  semestre: number;
  creditosAprobados: number;
  promedioAcumulado: number | string;
  estado: EstadoEstudiante;
  createdAt: string;
  updatedAt: string;
}

export type EstadoEmpresa = "EN_REVISION" | "ACTIVA" | "INACTIVA";

export interface Empresa {
  id: number;
  nit: string;
  razonSocial: string;
  nombreComercial: string | null;
  sector: string;
  ciudad: string;
  direccion: string | null;
  emailContacto: string;
  telefonoContacto: string | null;
  contactoNombre: string;
  contactoCargo: string | null;
  estado: EstadoEmpresa;
  propuestaPorEstudianteId?: number | null;
  fechaAprobacion?: string | null;
  motivoRechazo?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProponerEmpresaRequest {
  estudianteId: number;
  nit: string;
  razonSocial: string;
  nombreComercial?: string;
  sector: string;
  ciudad: string;
  direccion?: string;
  emailContacto: string;
  telefonoContacto?: string;
  contactoNombre: string;
  contactoCargo?: string;
  justificacion?: string;
}

export type AreaPractica =
  | "DESARROLLO_SW"
  | "ANALISIS_DATOS"
  | "MARKETING"
  | "RRHH"
  | "FINANZAS"
  | "OPERACIONES"
  | "OTRO";
export type Modalidad = "PRESENCIAL" | "HIBRIDO" | "REMOTO";
export type EstadoVacante = "BORRADOR" | "PUBLICADA" | "CERRADA" | "ASIGNADA";

export interface Vacante {
  id: number;
  empresaId: number;
  empresa: { id: number; razonSocial: string } | null;
  titulo: string;
  descripcion: string;
  areaPractica: AreaPractica;
  modalidad: Modalidad;
  ciudad: string;
  requisitosKeywords: string[] | null;
  creditosMinimos: number;
  promedioMinimo: number | string;
  programasDirigidos: string[] | null;
  duracionMeses: number;
  cuposDisponibles: number;
  fechaInicio: string;
  fechaCierrePostulaciones: string;
  estado: EstadoVacante;
  modalidadVinculacionId?: number | null;
  createdAt: string;
  updatedAt: string;
}

export type AplicaA = "ESTUDIANTE" | "EMPRESA" | "AMBOS";

export interface ModalidadCatalogo {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ModalidadRequest {
  codigo: string;
  nombre: string;
  descripcion?: string;
  activo?: boolean;
}

export interface TipoRequisito {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  aplicaA: AplicaA;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TipoRequisitoRequest {
  codigo: string;
  nombre: string;
  descripcion?: string;
  aplicaA: AplicaA;
  activo?: boolean;
}

export interface RequisitoModalidad {
  id: number;
  modalidadId: number;
  modalidadCodigo: string;
  modalidadNombre: string;
  tipoRequisitoId: number;
  tipoRequisitoCodigo: string;
  tipoRequisitoNombre: string;
  aplicaA: AplicaA;
  obligatorio: boolean;
  orden: number;
  instrucciones: string | null;
}

export interface RequisitoModalidadRequest {
  modalidadId: number;
  tipoRequisitoId: number;
  obligatorio?: boolean;
  orden?: number;
  instrucciones?: string;
}

export interface RequisitoModalidadUpdateRequest {
  obligatorio?: boolean;
  orden?: number;
  instrucciones?: string;
}

export interface ItemChecklist {
  tipoRequisitoId: number;
  tipoCodigo: string;
  tipoNombre: string;
  descripcion: string | null;
  aplicaA: AplicaA;
  obligatorio: boolean;
  orden: number;
  instrucciones: string | null;
  cargado: boolean;
  estadoDocumento: "RECIBIDO" | "VALIDADO" | "RECHAZADO" | null;
  documentoId: number | null;
  observacionValidacion: string | null;
}

export interface ResumenChecklist {
  vacanteId: number;
  modalidadId: number | null;
  modalidadCodigo: string | null;
  modalidadNombre: string | null;
  totalRequisitos: number;
  totalObligatorios: number;
  obligatoriosCumplidos: number;
  totalOpcionales: number;
  opcionalesCumplidos: number;
  puedePostular: boolean;
  items: ItemChecklist[];
}

export type EstadoPostulacion =
  | "POSTULADA"
  | "EN_REVISION"
  | "ENTREVISTA_PROGRAMADA"
  | "ENTREVISTA_REALIZADA"
  | "PRESELECCIONADA"
  | "RECHAZADA"
  | "ACEPTADA"
  | "RETIRADA";

export type ModalidadEntrevista = "PRESENCIAL" | "VIRTUAL" | "HIBRIDA";
export type ResultadoEntrevista = "PENDIENTE" | "APROBADA" | "RECHAZADA";

export interface EntrevistaResponse {
  id: number;
  postulacionId: number;
  estudianteNombre: string;
  empresaRazonSocial: string;
  vacanteCargo: string;
  fechaProgramada: string;
  modalidad: ModalidadEntrevista;
  lugar?: string | null;
  enlaceVirtual?: string | null;
  entrevistadorNombre?: string | null;
  entrevistadorCargo?: string | null;
  observaciones?: string | null;
  resultado: ResultadoEntrevista;
  fechaResultado?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type EstadoInformeFinalPm = "BORRADOR" | "ENTREGADO" | "APROBADO" | "RECHAZADO";

export type EstadoSolicitudFabrica = "PENDIENTE" | "APROBADA" | "ASIGNADA" | "RECHAZADA";

export interface SolicitudFabricaResponse {
  id: number;
  estudianteId: number;
  estudianteNombreCompleto: string;
  estudianteEmail: string;
  programaAcademico: string;
  motivo: string;
  estado: EstadoSolicitudFabrica;
  observacionesCoord?: string | null;
  fechaSolicitud: string;
  fechaResolucion?: string | null;
  resueltoPorNombre?: string | null;
  vacanteAsignadaId?: number | null;
  vacanteAsignadaTitulo?: string | null;
  postulacionCreadaId?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface SolicitudFabricaRequest {
  motivo: string;
}

// ----- Asistencia con IA al Informe Final (§6.4) -----

export interface HallazgoIA {
  severidad: "ALTO" | "MEDIO" | "BAJO" | string;
  seccion: string;
  detalle: string;
}

export interface FeedbackInformeIA {
  /** "local" = análisis local sin LLM externo. */
  fuente: string;
  reporteMarkdown: string;
  hallazgos: HallazgoIA[];
  aviso?: string | null;
}

// ----- Analytics institucional (§6.1 + §6.5) -----

export interface AnalyticsResumen {
  estudiantesActivos: number;
  empresasActivas: number;
  vacantesPublicadas: number;
  convenios_BORRADOR: number;
  convenios_ACTIVOS: number;
  convenios_FINALIZADOS: number;
  hvAprobadas: number;
  hvEnRevision: number;
  postulacionesAbiertas: number;
  entrevistasAgendadas: number;
  solicitudesProgramaInternoPendientes: number;
  alertasPlazoUrgente: number;
}

export interface AnalyticsEmbudo {
  conteoPorEstado: Record<string, number>;
  total: number;
}

export interface AnalyticsEmpleabilidadEmpresa {
  empresaId: number;
  razonSocial: string;
  convenios: number;
  continuidadSi: number;
  continuidadNo: number;
  tasaContinuidad: number;
}

export interface AnalyticsEmpleabilidadResumen {
  convenios: number;
  continuidadSi: number;
  continuidadNo: number;
  tasaContinuidadGlobal: number;
  topEmpresas: AnalyticsEmpleabilidadEmpresa[];
}

export interface EstudianteEnRiesgo {
  id: number;
  nombreCompleto: string;
  email: string;
  programa: string;
  motivo: string;
}

/** Comentario del hilo conversacional asociado a una Hoja de Vida. */
export type HojaVidaAutorRol = "COORDINADOR" | "ADMIN" | "ESTUDIANTE" | "SISTEMA";
export type HojaVidaTipoComentario = "FEEDBACK" | "RESPUESTA" | "SISTEMA";

export interface HojaVidaComentarioResponse {
  id: number;
  hojaVidaId: number;
  autorNombre: string;
  autorRol: HojaVidaAutorRol;
  tipo: HojaVidaTipoComentario;
  mensaje: string;
  createdAt: string;
}

/** Vacante interna disponible para asignar — proyección recortada. */
export interface VacanteInternaDisponible {
  id: number;
  titulo: string;
  areaPractica?: string | null;
  modalidad?: string | null;
  ciudad?: string | null;
  cuposDisponibles?: number | null;
  programasDirigidos?: string | null;
}

export interface InformeFinalPmResponse {
  id: number;
  planMejoraId: number | null;
  resumenEjecutivo?: string | null;
  contextualizacion?: string | null;
  planteamientoProblema?: string | null;
  marcoTeorico?: string | null;
  objetivoGeneral?: string | null;
  objetivosEspecificos?: string | null;
  diagnostico?: string | null;
  metodologia?: string | null;
  propuestaSolucion?: string | null;
  factibilidad?: string | null;
  conclusiones?: string | null;
  anexos?: string | null;
  numeroPaginas?: number | null;
  // 12 secciones estructuradas del Informe Final GTC-FM-16 (RF-A04)
  contextualizacionEmpresa?: string | null;
  objetivos?: string | null;
  justificacion?: string | null;
  resultados?: string | null;
  referenciasApa?: string | null;
  estado: EstadoInformeFinalPm;
  fechaEntrega?: string | null;
  fechaRevision?: string | null;
  revisadoPorNombre?: string | null;
  observacionesRevisor?: string | null;
  // Calificación final (notas nuevas)
  notaTutor?: number | string | null;
  notaProfesor?: number | string | null;
  notaPromedio?: number | string | null;
  altoImpacto?: boolean | null;
  cumpleNotaMinima?: boolean | null;
  nivel?: string | null;
  firmadoEstudiante: boolean;
  firmadoTutorAcad: boolean;
  firmadoTutorEmp: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InformeFinalPmRequest {
  resumenEjecutivo?: string | null;
  contextualizacion?: string | null;
  planteamientoProblema?: string | null;
  marcoTeorico?: string | null;
  objetivoGeneral?: string | null;
  objetivosEspecificos?: string | null;
  diagnostico?: string | null;
  metodologia?: string | null;
  propuestaSolucion?: string | null;
  factibilidad?: string | null;
  conclusiones?: string | null;
  anexos?: string | null;
  numeroPaginas?: number | null;
}

/** Cuerpo del editor estructurado de las 12 secciones del Informe Final (RF-A04). */
export interface InformeFinalSeccionesRequest {
  resumenEjecutivo: string;
  contextualizacionEmpresa: string;
  planteamientoProblema: string;
  marcoTeorico: string;
  objetivos: string;
  diagnostico: string;
  metodologia: string;
  justificacion: string;
  factibilidad: string;
  resultados: string;
  conclusiones: string;
  referenciasApa: string;
}

export interface EntrevistaRequest {
  postulacionId: number;
  fechaProgramada: string;
  modalidad: ModalidadEntrevista;
  lugar?: string | null;
  enlaceVirtual?: string | null;
  entrevistadorNombre?: string | null;
  entrevistadorCargo?: string | null;
  observaciones?: string | null;
}

export interface Postulacion {
  id: number;
  estudianteId: number;
  estudianteNombreCompleto: string;
  vacanteId: number;
  vacanteTitulo: string;
  empresaId: number;
  empresaRazonSocial: string;
  estado: EstadoPostulacion;
  scoreMatching: number | string | null;
  justificacionMatching: string | null;
  mensajeEstudiante: string | null;
  observacionesEmpresa: string | null;
  fechaPostulacion: string;
  fechaDecision: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PostulacionEvento {
  id: number;
  postulacionId: number;
  tipoEvento: string;
  estadoAnterior: EstadoPostulacion | null;
  estadoNuevo: EstadoPostulacion | null;
  detalle: string | null;
  actor: string | null;
  ocurridoEn: string;
}

export type TipoDocumentoSoporte =
  | "HOJA_VIDA"
  | "DOCUMENTO_IDENTIDAD"
  | "CERTIFICADO_ACADEMICO"
  | "EPS"
  | "FORMALIZACION"
  | "CERTIFICADO"
  | "OTRO";

export type ParteFirmaConvenio = "ESTUDIANTE" | "EMPRESA" | "UNIVERSIDAD";

export type EstadoDocumento = "RECIBIDO" | "VALIDADO" | "RECHAZADO";

/** Estado derivado de las fechas de vigencia (cálculo en backend). */
export type EstadoVigencia = "SIN_VIGENCIA" | "ACTIVO" | "POR_VENCER" | "VENCIDO";

export interface Documento {
  id: number;
  estudianteId: number | null;
  estudiante: { id: number; nombreCompleto: string } | null;
  postulacionId: number | null;
  postulacion: { id: number; referencia: string } | null;
  empresaId: number | null;
  empresa: { id: number; razonSocial: string } | null;
  tipo: TipoDocumentoSoporte;
  tipoRequisitoId: number | null;
  tipoRequisito: { id: number; codigo: string; nombre: string; aplicaA: AplicaA } | null;
  nombreOriginal: string;
  rutaAlmacenamiento: string;
  mimeType: string;
  tamanoBytes: number;
  estado: EstadoDocumento;
  observacionesValidacion: string | null;
  fechaValidacion: string | null;
  fechaVigenciaInicio: string | null;
  fechaVigenciaFin: string | null;
  estadoVigencia: EstadoVigencia;
  createdAt: string;
  updatedAt: string;
}

export type EstadoConvenio =
  | "BORRADOR"
  | "FIRMADO_ESTUDIANTE"
  | "FIRMADO_EMPRESA"
  | "FIRMADO_UNIVERSIDAD"
  | "ACTIVO"
  | "FINALIZADO"
  | "CANCELADO";

export interface TutorResumen {
  id: number;
  nombreCompleto: string;
  email: string;
}

export interface Convenio {
  id: number;
  postulacionId: number;
  postulacion: { id: number; referencia: string } | null;
  estudianteId: number;
  estudiante: { id: number; nombreCompleto: string } | null;
  empresaId: number;
  empresa: { id: number; razonSocial: string } | null;
  vacanteId: number;
  vacante: { id: number; titulo: string } | null;
  numeroConvenio: string;
  fechaInicio: string;
  fechaFin: string;
  estado: EstadoConvenio;
  documentoPdfId: number | null;
  documentoPdf: { id: number; nombreOriginal: string } | null;
  tutorAcademicoId: number | null;
  tutorAcademico: TutorResumen | null;
  tutorEmpresarialId: number | null;
  tutorEmpresarial: TutorResumen | null;
  calificacionFinal: number | string | null;
  certificadoPdfId: number | null;
  certificadoPdf: { id: number; nombreOriginal: string } | null;
  createdAt: string;
  updatedAt: string;
}

export type TipoTutor = "ACADEMICO" | "EMPRESARIAL";
export type EstadoTutor = "ACTIVO" | "INACTIVO";

export interface Tutor {
  id: number;
  tipo: TipoTutor;
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string | null;
  cargo: string | null;
  dependencia: string | null;
  empresaId: number | null;
  empresaRazonSocial: string | null;
  estado: EstadoTutor;
  createdAt: string;
  updatedAt: string;
}

export interface TutorRequest {
  tipo: TipoTutor;
  nombres: string;
  apellidos: string;
  email: string;
  telefono?: string;
  cargo?: string;
  dependencia?: string;
  empresaId?: number;
  estado?: EstadoTutor;
}

export type TipoEvaluacion = "INTERMEDIA" | "FINAL";
export type Recomendacion = "CONTINUAR" | "REFORZAR" | "SUSPENDER" | "NO_APLICA";

export interface Evaluacion {
  id: number;
  convenioId: number;
  convenioNumero: string | null;
  tutorId: number;
  tutorNombre: string | null;
  tipo: TipoEvaluacion;
  evaluadorTipo: TipoTutor;
  fechaEvaluacion: string | null;
  calificacion: number | string;
  competenciasTecnicas: number | string;
  competenciasBlandas: number | string;
  recomendacion: Recomendacion;
  observaciones: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EvaluacionRequest {
  convenioId: number;
  tutorId: number;
  tipo: TipoEvaluacion;
  fechaEvaluacion?: string;
  calificacion: number;
  competenciasTecnicas: number;
  competenciasBlandas: number;
  recomendacion: Recomendacion;
  observaciones?: string;
}

export interface ResumenEvaluaciones {
  convenioId: number;
  totalEvaluaciones: number;
  promedioCalificacion: number | string | null;
  promedioCompetenciasTecnicas: number | string | null;
  promedioCompetenciasBlandas: number | string | null;
  tieneEvaluacionFinalAcademica: boolean;
  tieneEvaluacionFinalEmpresarial: boolean;
  calificacionFinalSugerida: number | string | null;
  evaluaciones: Evaluacion[];
}

export interface AsignarTutoresRequest {
  tutorAcademicoId?: number | null;
  tutorEmpresarialId?: number | null;
}

export interface FinalizarConvenioRequest {
  calificacionFinal: number;
}

export type DesgloseCriterioCodigo =
  | "PROGRAMA"
  | "CREDITOS"
  | "PROMEDIO"
  | "KEYWORDS"
  | "CONTINUIDAD";

export interface DesgloseCriterio {
  codigo: DesgloseCriterioCodigo;
  nombre: string;
  pesoMaximo: number;
  obtenido: number | string;
  cumple: boolean;
  detalle: string;
  sugerencia: string | null;
}

export interface MatchingResponse {
  estudianteId: number;
  vacanteId: number;
  score: number | string;
  recomendado: boolean;
  justificacion: string;
  desglose?: DesgloseCriterio[];
}

export type CategoriaHabilidad = "TECNICA" | "PERSONAL" | "HERRAMIENTA" | "OTRO";
export type NivelIdioma = "A1" | "A2" | "B1" | "B2" | "C1" | "C2" | "NATIVO";

export interface HojaVidaHabilidad {
  id?: number;
  categoria: CategoriaHabilidad;
  descripcion: string;
  orden?: number | null;
}

export interface HojaVidaIdioma {
  id?: number;
  idioma: string;
  nivel: NivelIdioma;
  orden?: number | null;
}

export interface HojaVidaEducacion {
  id?: number;
  programa: string;
  institucion: string;
  fechaInicio?: string | null;
  fechaFin?: string | null;
  enCurso?: boolean | null;
  observaciones?: string | null;
  orden?: number | null;
}

export interface HojaVidaExperiencia {
  id?: number;
  empresa: string;
  cargo?: string | null;
  fechaInicio?: string | null;
  fechaFin?: string | null;
  enCurso?: boolean | null;
  descripcion?: string | null;
  orden?: number | null;
}

export type EstadoHojaVida = "BORRADOR" | "ENVIADA" | "APROBADA" | "RECHAZADA";

export interface HojaVidaResponse {
  id: number;
  estudianteId: number;
  estudianteNombreCompleto: string;
  estudianteEmail: string;
  programaAcademico: string;
  semestre: number | null;
  direccion?: string | null;
  telefonoContacto?: string | null;
  ciudad?: string | null;
  fotoPath?: string | null;
  perfilSaber?: string | null;
  perfilHacer?: string | null;
  perfilSer?: string | null;
  completa: boolean;
  estado: EstadoHojaVida;
  observacionesCoformacion?: string | null;
  enviadaAt?: string | null;
  aprobadaAt?: string | null;
  aprobadaPorCoordNombre?: string | null;
  ultimaActualizacion: string;
  createdAt: string;
  updatedAt: string;
  habilidades: HojaVidaHabilidad[];
  idiomas: HojaVidaIdioma[];
  educacion: HojaVidaEducacion[];
  experienciaFase: HojaVidaExperiencia[];
  experienciaLaboral: HojaVidaExperiencia[];
}

export type HojaVidaRequest = Omit<
  HojaVidaResponse,
  | "id"
  | "estudianteId"
  | "estudianteNombreCompleto"
  | "estudianteEmail"
  | "programaAcademico"
  | "semestre"
  | "completa"
  | "estado"
  | "observacionesCoformacion"
  | "enviadaAt"
  | "aprobadaAt"
  | "aprobadaPorCoordNombre"
  | "ultimaActualizacion"
  | "createdAt"
  | "updatedAt"
>;

export interface ValidacionAcademica {
  cumple: boolean;
  motivo: string;
}

export interface FormalizacionResponse {
  convenioId: number;
  numeroConvenio: string;
  estado: string;
  documentoPdfId: number | null;
}

// ===== F3: Trimestres =====

export type EstadoTrimestre = "ABIERTO" | "EN_CURSO" | "CERRADO";

export type EstadoPlanActividades =
  | "BORRADOR"
  | "ENVIADO_TUTOR"
  | "APROBADO_TUTOR"
  | "APROBADO_PROFESOR"
  | "RECHAZADO";

export type EstadoPlanMejora =
  | "BORRADOR"
  | "EN_DESARROLLO"
  | "SUSTENTADO"
  | "APROBADO"
  | "RECHAZADO";

export type TipoReunion =
  | "INICIAL"
  | "SEGUIMIENTO"
  | "EVALUACION_PARCIAL"
  | "EVALUACION_FINAL"
  | "OTRO";

export type ParteFirmaTrimestre = "ESTUDIANTE" | "TUTOR" | "PROFESOR";

export interface TrimestreResponse {
  id: number;
  convenioId: number;
  convenioNumero: string | null;
  numero: number;
  materiaNucleo: string;
  fechaInicio: string | null;
  fechaFin: string | null;
  estado: EstadoTrimestre;
  tienePlanActividades: boolean;
  totalActas: number;
  totalPlanesMejora: number;
  tieneEvaluacionTutor: boolean;
  tieneEvaluacionProfesor: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TrimestreRequest {
  numero: number;
  materiaNucleo: string;
  fechaInicio?: string | null;
  fechaFin?: string | null;
  estado?: EstadoTrimestre;
}

export interface PlanActividadesObjetivo {
  id?: number;
  escenario?: string | null;
  descripcion: string;
  seleccionado: boolean;
  orden?: number | null;
}

export interface PlanActividadesMes {
  id?: number;
  mes: number;
  areaRotacion?: string | null;
  actividades?: string | null;
  tutorNombre?: string | null;
}

export interface PlanActividadesResponse {
  id: number;
  trimestreId: number;
  escenarioCoformacion: string | null;
  pemDescripcionEscenario: string | null;
  pemObjetivoGeneral: string | null;
  estado: EstadoPlanActividades;
  firmadoEstudiante: boolean;
  firmadoTutor: boolean;
  firmadoProfesor: boolean;
  fechaFirmaEstudiante: string | null;
  fechaFirmaTutor: string | null;
  fechaFirmaProfesor: string | null;
  documentoPdfId: number | null;
  objetivos: PlanActividadesObjetivo[];
  meses: PlanActividadesMes[];
  createdAt: string;
  updatedAt: string;
}

export interface PlanActividadesRequest {
  escenarioCoformacion?: string | null;
  pemDescripcionEscenario?: string | null;
  pemObjetivoGeneral?: string | null;
  objetivos: PlanActividadesObjetivo[];
  meses: PlanActividadesMes[];
}

/** Tipo de comentario en el hilo de aprobación del Plan de Actividades. */
export type PlanActividadesTipoComentario =
  | "FEEDBACK"
  | "RESPUESTA_APROBACION"
  | "RESPUESTA_RECHAZO"
  | "SISTEMA";

/** Comentario del flujo de aprobación asociado a un Plan de Actividades. */
export interface PlanActividadesComentario {
  id: number;
  autorNombre: string;
  autorRol: Rol;
  mensaje: string;
  tipo: PlanActividadesTipoComentario;
  createdAt: string;
}

export interface ActaAsistente {
  nombre: string;
  rol?: string | null;
  correo?: string | null;
}

export interface ActaTema {
  id?: number;
  tema: string;
  observaciones?: string | null;
  orden?: number | null;
}

export interface ActaReunionResponse {
  id: number;
  trimestreId: number;
  numero: number;
  fecha: string;
  hora: string | null;
  lugar: string | null;
  asunto: string | null;
  tipoReunion: TipoReunion;
  asistentes: ActaAsistente[];
  observaciones: string | null;
  firmadoEstudiante: boolean;
  firmadoTutor: boolean;
  firmadoProfesor: boolean;
  documentoPdfId: number | null;
  temas: ActaTema[];
  createdAt: string;
  updatedAt: string;
}

export interface ActaReunionRequest {
  numero: number;
  fecha: string;
  hora?: string | null;
  lugar?: string | null;
  asunto?: string | null;
  tipoReunion: TipoReunion;
  asistentes: ActaAsistente[];
  observaciones?: string | null;
  temas: ActaTema[];
}

export interface PlanMejoraResponse {
  id: number;
  trimestreId: number;
  numero: number;
  titulo: string;
  problema: string | null;
  objetivo: string | null;
  actividades: string | null;
  indicadores: string | null;
  estado: EstadoPlanMejora;
  documentoPdfId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface PlanMejoraRequest {
  numero: number;
  titulo: string;
  problema?: string | null;
  objetivo?: string | null;
  actividades?: string | null;
  indicadores?: string | null;
  estado?: EstadoPlanMejora;
}

export interface EvaluacionTutorResponse {
  id: number;
  trimestreId: number;
  capacidades: number | string | null;
  actitudes: number | string | null;
  aplicacionDesempeno: number | string | null;
  aplicacionElaboracionPem: number | string | null;
  aplicacionSustentacionPem: number | string | null;
  notaPonderada: number | string | null;
  continuidadConEmpresa: boolean | null;
  observaciones: string | null;
  fechaElaboracion: string | null;
  firmadoTutor: boolean;
  firmadoEstudiante: boolean;
  documentoPdfId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface EvaluacionTutorRequest {
  capacidades?: number | null;
  actitudes?: number | null;
  aplicacionDesempeno?: number | null;
  aplicacionElaboracionPem?: number | null;
  aplicacionSustentacionPem?: number | null;
  continuidadConEmpresa?: boolean | null;
  observaciones?: string | null;
  fechaElaboracion?: string | null;
}

export interface EvaluacionProfesorResponse {
  id: number;
  trimestreId: number;
  // Corte 1
  capacidades: number | string | null;
  actitudes: number | string | null;
  aplicacionDesempeno: number | string | null;
  aplicacionElaboracionPem: number | string | null;
  aplicacionSustentacionPem: number | string | null;
  notaPonderada: number | string | null;
  observacionesC1: string | null;
  fechaC1: string | null;
  // Corte 2
  capacidadesC2: number | string | null;
  actitudesC2: number | string | null;
  aplicacionDesempenoC2: number | string | null;
  aplicacionElaboracionPemC2: number | string | null;
  aplicacionSustentacionPemC2: number | string | null;
  notaPonderadaC2: number | string | null;
  observacionesC2: string | null;
  fechaC2: string | null;
  // Legacy combined
  observaciones: string | null;
  fechaElaboracion: string | null;
  // Estado
  firmadoProfesor: boolean;
  firmadoEstudiante: boolean;
  documentoPdfId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface EvaluacionProfesorRequest {
  // Corte 1
  capacidades?: number | null;
  actitudes?: number | null;
  aplicacionDesempeno?: number | null;
  aplicacionElaboracionPem?: number | null;
  aplicacionSustentacionPem?: number | null;
  observacionesC1?: string | null;
  fechaC1?: string | null;
  // Corte 2
  capacidadesC2?: number | null;
  actitudesC2?: number | null;
  aplicacionDesempenoC2?: number | null;
  aplicacionElaboracionPemC2?: number | null;
  aplicacionSustentacionPemC2?: number | null;
  observacionesC2?: string | null;
  fechaC2?: string | null;
  // Legacy
  observaciones?: string | null;
  fechaElaboracion?: string | null;
}

// ============================================================
// Módulo Plantillas (#75)
// ============================================================

export type TipoPlantilla =
  | "EVAL_TUTOR"
  | "EVAL_PROFESOR"
  | "ACTA"
  | "PLAN_ACTIVIDADES"
  | "INFORME_FINAL";

export type EstadoRespuestaForm =
  | "PENDIENTE"
  | "EN_PROGRESO"
  | "ENTREGADO"
  | "FIRMADO"
  | "APROBADO"
  | "RECHAZADO";

export type TipoCampo = "NUMBER" | "TEXT" | "BOOL" | "DATE" | "SELECT" | "SIGNATURE";

export interface CriterioPlantilla {
  id: number;
  orden: number;
  codigo?: string | null;
  descripcion: string;
  peso?: number | string | null;
  placeholder?: string | null;
  tipo: TipoCampo;
  opciones?: string | null;
}

export interface SeccionPlantilla {
  id: number;
  orden: number;
  codigo?: string | null;
  titulo: string;
  descripcion?: string | null;
  peso?: number | string | null;
  criterios: CriterioPlantilla[];
}

export interface PlantillaFormulario {
  id: number;
  codigo: string;
  version: string;
  tipo: TipoPlantilla;
  nombre: string;
  descripcion?: string | null;
  vigente: boolean;
  fechaVigencia?: string | null;
  creadoPorNombre?: string | null;
  secciones: SeccionPlantilla[];
  createdAt: string;
  updatedAt: string;
}

export interface PlantillaRequest {
  codigo: string;
  version: string;
  tipo: TipoPlantilla;
  nombre: string;
  descripcion?: string | null;
  fechaVigencia?: string | null;
}

export interface SeccionRequest {
  orden?: number;
  codigo?: string | null;
  titulo: string;
  descripcion?: string | null;
  peso?: number | null;
}

export interface CriterioRequest {
  orden?: number;
  codigo?: string | null;
  descripcion: string;
  peso?: number | null;
  placeholder?: string | null;
  tipo?: TipoCampo;
  opciones?: string | null;
}

export interface ValorCriterio {
  criterioId: number;
  valorNumero?: number | string | null;
  valorTexto?: string | null;
  valorBool?: boolean | null;
}

export interface RespuestaFormulario {
  id: number;
  plantillaId: number;
  plantillaCodigo: string;
  plantillaNombre: string;
  convenioId?: number | null;
  trimestreId?: number | null;
  estudianteId?: number | null;
  estudianteNombre?: string | null;
  asignadoANombre?: string | null;
  asignadoARol?: string | null;
  asignadoPorNombre?: string | null;
  fechaAsignacion: string;
  fechaLimite?: string | null;
  estado: EstadoRespuestaForm;
  notaCalculada?: number | string | null;
  observaciones?: string | null;
  fechaEntrega?: string | null;
  fechaFirma?: string | null;
  firmadoPorNombre?: string | null;
  valores: ValorCriterio[];
  createdAt: string;
  updatedAt: string;
}

export interface AsignarRequest {
  plantillaId: number;
  convenioId?: number | null;
  trimestreId?: number | null;
  estudianteId?: number | null;
  asignadoAMongoId?: string | null;
  asignadoANombre?: string | null;
  asignadoARol?: string | null;
  fechaLimite?: string | null;
}

export interface LlenarRequest {
  valores?: ValorCriterio[];
  observaciones?: string | null;
}

// ============================================================
// Agendamiento colaborativo (RF-C01 / RF-C02 / RF-C03)
// ============================================================

export type ModalidadAgenda = "PRESENCIAL" | "VIRTUAL";
export type EstadoDisponibilidad = "ACTIVA" | "OCUPADA" | "CANCELADA";
export type EstadoAgendamiento =
  | "PROPUESTO"
  | "ACEPTADO"
  | "RECHAZADO"
  | "CONTRAOFERTA"
  | "CONFIRMADO"
  | "CANCELADO";

export interface Disponibilidad {
  id: number;
  tutorId: number;
  fecha: string; // YYYY-MM-DD
  horaInicio: string; // HH:mm[:ss]
  horaFin: string;
  modalidad: ModalidadAgenda;
  estado: EstadoDisponibilidad;
  createdAt: string;
  updatedAt: string;
}

export interface DisponibilidadRequest {
  tutorId: number;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  modalidad: ModalidadAgenda;
}

export interface ReunionAgenda {
  id: number;
  convenioId: number;
  estudianteId: number;
  tutorId: number;
  disponibilidadId: number | null;
  fechaPropuesta: string;
  horaInicio: string;
  horaFin: string;
  modalidad: ModalidadAgenda;
  enlace: string | null;
  estado: EstadoAgendamiento;
  observaciones: string | null;
  actaReunionId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProponerReunionRequest {
  convenioId: number;
  estudianteId: number;
  tutorId: number;
  fechaPropuesta: string;
  horaInicio: string;
  horaFin: string;
  modalidad: ModalidadAgenda;
  enlace?: string | null;
  observaciones?: string | null;
}

export interface ContraofertaReunionRequest {
  fechaPropuesta: string;
  horaInicio: string;
  horaFin: string;
  modalidad?: ModalidadAgenda;
  enlace?: string | null;
  observaciones?: string | null;
}

// ============================================================================
// Expediente Digital Unificado (BI-16 / RF-B01)
// Refleja ExpedienteResponse / ExpedienteResumenCohorte del backend.
// ============================================================================

export type EstadoSeccionExpediente =
  | "NO_INICIADO"
  | "PENDIENTE"
  | "EN_REVISION"
  | "FIRMADO"
  | "PDF_GENERADO";

export interface ExpedienteEstudianteResumen {
  id: number;
  nombres: string;
  apellidos: string;
  numeroDocumento: string;
  email: string;
  programaAcademico: string | null;
  semestre: number | null;
  estado: string | null;
}

export interface ExpedienteConvenioResumen {
  id: number;
  numeroConvenio: string;
  estado: string;
  fechaInicio: string | null;
  fechaFin: string | null;
  semestreAcademico: string | null;
  esContinuidad: boolean | null;
  documentoPdfId: number | null;
  certificadoPdfId: number | null;
}

export interface ExpedienteEmpresaResumen {
  id: number;
  razonSocial: string;
  nit: string | null;
  sector: string | null;
  ciudad: string | null;
}

export interface ExpedienteTutoresResumen {
  tutorAcademico: string | null;
  tutorEmpresarial: string | null;
}

export interface ExpedienteCalificacionResumen {
  notaCorte1: number | null;
  notaCorte2: number | null;
  notaCorte3: number | null;
  notaFinal: number | null;
  completa: boolean;
  bloqueada: boolean;
}

export interface ExpedienteSeccionDocumento {
  nombre: string;
  estado: EstadoSeccionExpediente;
  documentoPdfId: number | null;
  firmadoEstudiante: boolean;
  firmadoTutor: boolean;
  firmadoProfesor: boolean;
}

export interface ExpedienteActaItem {
  id: number;
  numero: number | null;
  fecha: string | null;
  asunto: string | null;
  estado: EstadoSeccionExpediente;
  documentoPdfId: number | null;
}

export interface ExpedienteSeccionActas {
  nombre: string;
  estado: EstadoSeccionExpediente;
  total: number;
  firmadas: number;
  items: ExpedienteActaItem[];
}

export interface ExpedienteSeccionInformeFinal {
  id: number;
  planMejoraId: number | null;
  titulo: string | null;
  estado: string | null;
  estadoSeccion: EstadoSeccionExpediente;
  notaPromedio: number | null;
  documentoPdfId: number | null;
}

export interface ExpedienteTrimestre {
  id: number;
  numero: number | null;
  materiaNucleo: string | null;
  estado: string | null;
  planActividades: ExpedienteSeccionDocumento;
  actas: ExpedienteSeccionActas;
  evaluacionDocente: ExpedienteSeccionDocumento;
  evaluacionTutor: ExpedienteSeccionDocumento;
  informesFinales: ExpedienteSeccionInformeFinal[];
}

export interface ExpedienteDocumento {
  id: number;
  tipo: string;
  nombreOriginal: string;
  estado: string;
  fecha: string | null;
}

export interface ExpedienteResponse {
  estudiante: ExpedienteEstudianteResumen;
  convenio: ExpedienteConvenioResumen | null;
  empresa: ExpedienteEmpresaResumen | null;
  tutores: ExpedienteTutoresResumen | null;
  calificacion: ExpedienteCalificacionResumen | null;
  trimestres: ExpedienteTrimestre[];
  documentos: ExpedienteDocumento[];
  estadoGeneral: string | null;
}

export interface ExpedienteResumenCohorte {
  estudianteId: number;
  nombres: string;
  apellidos: string;
  numeroDocumento: string;
  programaAcademico: string | null;
  convenioId: number | null;
  numeroConvenio: string | null;
  estadoConvenio: string | null;
  notaFinal: number | null;
  estadoGeneral: string | null;
}
