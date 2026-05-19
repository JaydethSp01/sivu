import type {
  AplicaA,
  AreaPractica,
  CategoriaHabilidad,
  EstadoEmpresa,
  EstadoPlanActividades,
  EstadoPlanMejora,
  EstadoTrimestre,
  EstadoTutor,
  EstadoVacante,
  Modalidad,
  NivelIdioma,
  Recomendacion,
  TipoDocumentoSoporte,
  TipoReunion,
  TipoTutor,
} from "./types";

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

export function humanize(value: string, map: Record<string, string>): string {
  return map[value] ?? value;
}
