import { Badge } from "./ui/badge";
import type { ComponentProps } from "react";

type BadgeVariant = NonNullable<ComponentProps<typeof Badge>["variant"]>;

const ESTUDIANTE_MAP: Record<string, { label: string; variant: BadgeVariant }> = {
  ACTIVO: { label: "Activo", variant: "success" },
  GRADUADO: { label: "Graduado", variant: "secondary" },
  RETIRADO: { label: "Retirado", variant: "destructive" },
};

const EMPRESA_MAP: Record<string, { label: string; variant: BadgeVariant }> = {
  EN_REVISION: { label: "En revisión", variant: "warning" },
  ACTIVA: { label: "Activa", variant: "success" },
  INACTIVA: { label: "Inactiva", variant: "muted" },
};

const VACANTE_MAP: Record<string, { label: string; variant: BadgeVariant }> = {
  BORRADOR: { label: "Borrador", variant: "muted" },
  PUBLICADA: { label: "Publicada", variant: "success" },
  CERRADA: { label: "Cerrada", variant: "secondary" },
  ASIGNADA: { label: "Asignada", variant: "default" },
};

const POSTULACION_MAP: Record<string, { label: string; variant: BadgeVariant }> = {
  POSTULADA: { label: "Postulada", variant: "secondary" },
  EN_REVISION: { label: "En revisión", variant: "warning" },
  ENTREVISTA_PROGRAMADA: { label: "Entrevista programada", variant: "warning" },
  ENTREVISTA_REALIZADA: { label: "Entrevista realizada", variant: "default" },
  PRESELECCIONADA: { label: "Preseleccionada", variant: "default" },
  RECHAZADA: { label: "Rechazada", variant: "destructive" },
  ACEPTADA: { label: "Aceptada", variant: "success" },
  RETIRADA: { label: "Retirada", variant: "muted" },
};

const ENTREVISTA_MAP: Record<string, { label: string; variant: BadgeVariant }> = {
  PENDIENTE: { label: "Pendiente", variant: "warning" },
  APROBADA: { label: "Aprobada", variant: "success" },
  RECHAZADA: { label: "Rechazada", variant: "destructive" },
};

const DOCUMENTO_MAP: Record<string, { label: string; variant: BadgeVariant }> = {
  RECIBIDO: { label: "Recibido", variant: "secondary" },
  VALIDADO: { label: "Validado", variant: "success" },
  RECHAZADO: { label: "Rechazado", variant: "destructive" },
};

const CONVENIO_MAP: Record<string, { label: string; variant: BadgeVariant }> = {
  BORRADOR: { label: "Borrador", variant: "muted" },
  FIRMADO_ESTUDIANTE: { label: "Firmado estudiante", variant: "secondary" },
  FIRMADO_EMPRESA: { label: "Firmado empresa", variant: "secondary" },
  FIRMADO_UNIVERSIDAD: { label: "Firmado universidad", variant: "secondary" },
  ACTIVO: { label: "Activo", variant: "success" },
  FINALIZADO: { label: "Finalizado", variant: "default" },
  CANCELADO: { label: "Cancelado", variant: "destructive" },
};

const TUTOR_MAP: Record<string, { label: string; variant: BadgeVariant }> = {
  ACTIVO: { label: "Activo", variant: "success" },
  INACTIVO: { label: "Inactivo", variant: "muted" },
};

const MAPS = {
  estudiante: ESTUDIANTE_MAP,
  empresa: EMPRESA_MAP,
  vacante: VACANTE_MAP,
  postulacion: POSTULACION_MAP,
  documento: DOCUMENTO_MAP,
  convenio: CONVENIO_MAP,
  tutor: TUTOR_MAP,
  entrevista: ENTREVISTA_MAP,
} as const;

type Kind = keyof typeof MAPS;

interface StatusBadgeProps {
  kind: Kind;
  value: string;
  className?: string;
}

export function StatusBadge({ kind, value, className }: StatusBadgeProps): JSX.Element {
  const map = MAPS[kind];
  const entry = map[value] ?? { label: value, variant: "outline" as BadgeVariant };
  return (
    <Badge variant={entry.variant} className={className}>
      {entry.label}
    </Badge>
  );
}
