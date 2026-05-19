import type {
  AplicaA,
  AreaPractica,
  CategoriaHabilidad,
  EstadoEmpresa,
  EstadoHojaVida,
  EstadoPlanActividades,
  EstadoPlanMejora,
  EstadoTrimestre,
  EstadoTutor,
  EstadoVacante,
  Modalidad,
  NivelIdioma,
  Recomendacion,
  Rol,
  TipoDocumentoSoporte,
  TipoReunion,
  TipoTutor,
} from "./types";

/**
 * Etiqueta de rol mostrada al usuario final.
 * En el código, en la BD y en el JWT el rol se llama COORDINADOR
 * (lenguaje técnico de cuando se construyó). En la práctica
 * institucional de Uniempresarial el área se llama "Oficina de
 * Coformación", así que en UI mostramos "Coformación".
 */
export const ROL_LABELS: Record<Rol, string> = {
  ADMIN: "Administrador",
  COORDINADOR: "Coformación",
  ESTUDIANTE: "Estudiante",
  EMPRESA: "Empresa",
  MCP_AGENT: "Agente MCP",
};

export const TIPO_DOCUMENTO_LABELS: Record<TipoDocumentoSoporte, string> = {
  HOJA_VIDA: "Hoja de vida",
  DOCUMENTO_IDENTIDAD: "Documento de identidad",
  CERTIFICADO_ACADEMICO: "Certificado académico",
  EPS: "EPS",
  FORMALIZACION: "Formalización",
  CERTIFICADO: "Certificado de práctica",
  OTRO: "Otro",
};

export const AREA_PRACTICA_LABELS: Record<AreaPractica, string> = {
  DESARROLLO_SW: "Desarrollo de software",
  ANALISIS_DATOS: "Análisis de datos",
  MARKETING: "Marketing",
  RRHH: "Recursos Humanos",
  FINANZAS: "Finanzas",
  OPERACIONES: "Operaciones",
  OTRO: "Otro",
};

export const MODALIDAD_LABELS: Record<Modalidad, string> = {
  PRESENCIAL: "Presencial",
  HIBRIDO: "Híbrido",
  REMOTO: "Remoto",
};

export const ESTADO_EMPRESA_LABELS: Record<EstadoEmpresa, string> = {
  EN_REVISION: "En revisión",
  ACTIVA: "Activa",
  INACTIVA: "Inactiva",
};

export const RECOMENDACION_LABELS: Record<Recomendacion, string> = {
  CONTINUAR: "Continuar",
  REFORZAR: "Reforzar",
  SUSPENDER: "Suspender",
  NO_APLICA: "No aplica",
};

export const TIPO_TUTOR_LABELS: Record<TipoTutor, string> = {
  ACADEMICO: "Académico",
  EMPRESARIAL: "Empresarial",
};

export const ESTADO_TUTOR_LABELS: Record<EstadoTutor, string> = {
  ACTIVO: "Activo",
  INACTIVO: "Inactivo",
};

export const ESTADO_VACANTE_LABELS: Record<EstadoVacante, string> = {
  BORRADOR: "Borrador",
  PUBLICADA: "Publicada",
  CERRADA: "Cerrada",
  ASIGNADA: "Asignada",
};

export const APLICA_A_LABELS: Record<AplicaA, string> = {
  ESTUDIANTE: "Estudiante",
  EMPRESA: "Empresa",
  AMBOS: "Ambos",
};

export const CATEGORIA_HABILIDAD_LABELS: Record<CategoriaHabilidad, string> = {
  TECNICA: "Técnica",
  PERSONAL: "Personal",
  HERRAMIENTA: "Herramienta",
  OTRO: "Otra",
};

export const NIVEL_IDIOMA_LABELS: Record<NivelIdioma, string> = {
  A1: "A1 — Básico inicial",
  A2: "A2 — Básico",
  B1: "B1 — Intermedio",
  B2: "B2 — Intermedio alto",
  C1: "C1 — Avanzado",
  C2: "C2 — Dominio",
  NATIVO: "Nativo",
};

export const ESTADO_TRIMESTRE_LABELS: Record<EstadoTrimestre, string> = {
  ABIERTO: "Abierto",
  EN_CURSO: "En curso",
  CERRADO: "Cerrado",
};

export const ESTADO_PA_LABELS: Record<EstadoPlanActividades, string> = {
  BORRADOR: "Borrador",
  ENVIADO_TUTOR: "Enviado al tutor",
  APROBADO_TUTOR: "Aprobado por el tutor",
  APROBADO_PROFESOR: "Aprobado por el profesor",
  RECHAZADO: "Rechazado",
};

export const ESTADO_PM_LABELS: Record<EstadoPlanMejora, string> = {
  BORRADOR: "Borrador",
  EN_DESARROLLO: "En desarrollo",
  SUSTENTADO: "Sustentado",
  APROBADO: "Aprobado",
  RECHAZADO: "Rechazado",
};

export const TIPO_REUNION_LABELS: Record<TipoReunion, string> = {
  INICIAL: "Inicial",
  SEGUIMIENTO: "Seguimiento",
  EVALUACION_PARCIAL: "Evaluación parcial",
  EVALUACION_FINAL: "Evaluación final",
  OTRO: "Otro",
};

export const ESTADO_SOLICITUD_FABRICA_LABELS: Record<string, string> = {
  PENDIENTE: "Pendiente",
  APROBADA: "Aprobada",
  RECHAZADA: "Rechazada",
};

export const ESTADO_SOLICITUD_FABRICA_VARIANT: Record<
  string,
  "muted" | "warning" | "success" | "destructive"
> = {
  PENDIENTE: "warning",
  APROBADA: "success",
  RECHAZADA: "destructive",
};

export const ESTADO_INFORME_FINAL_LABELS: Record<string, string> = {
  BORRADOR: "Borrador",
  ENTREGADO: "Entregado — en revisión",
  APROBADO: "Aprobado",
  RECHAZADO: "Rechazado",
};

export const ESTADO_INFORME_FINAL_VARIANT: Record<
  string,
  "muted" | "warning" | "success" | "destructive"
> = {
  BORRADOR: "muted",
  ENTREGADO: "warning",
  APROBADO: "success",
  RECHAZADO: "destructive",
};

export const MODALIDAD_ENTREVISTA_LABELS: Record<string, string> = {
  PRESENCIAL: "Presencial",
  VIRTUAL: "Virtual",
  HIBRIDA: "Híbrida",
};

export const RESULTADO_ENTREVISTA_LABELS: Record<string, string> = {
  PENDIENTE: "Pendiente",
  APROBADA: "Aprobada",
  RECHAZADA: "Rechazada",
};

export const ESTADO_HOJA_VIDA_LABELS: Record<EstadoHojaVida, string> = {
  BORRADOR: "Borrador",
  ENVIADA: "Enviada a Coformación",
  APROBADA: "Aprobada por Coformación",
  RECHAZADA: "Rechazada — requiere ajustes",
};

export const ESTADO_HOJA_VIDA_VARIANT: Record<
  EstadoHojaVida,
  "muted" | "warning" | "success" | "destructive"
> = {
  BORRADOR: "muted",
  ENVIADA: "warning",
  APROBADA: "success",
  RECHAZADA: "destructive",
};

export function humanize(value: string, map: Record<string, string>): string {
  return map[value] ?? value;
}
