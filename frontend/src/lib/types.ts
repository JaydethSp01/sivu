export type Rol = "ADMIN" | "COORDINADOR" | "ESTUDIANTE" | "EMPRESA" | "MCP_AGENT";

export interface UsuarioResumen {
  id: string;
  email: string;
  nombres: string;
  apellidos: string;
  roles: Rol[];
  estudianteId: number | null;
  empresaId: number | null;
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

export type EstadoSolicitudFabrica = "PENDIENTE" | "APROBADA" | "RECHAZADA";

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
  createdAt: string;
  updatedAt: string;
}

export interface SolicitudFabricaRequest {
  motivo: string;
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
  estado: EstadoInformeFinalPm;
  fechaEntrega?: string | null;
  fechaRevision?: string | null;
  revisadoPorNombre?: string | null;
  observacionesRevisor?: string | null;
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
