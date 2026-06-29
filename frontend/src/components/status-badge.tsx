import { Badge } from "./ui/badge";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

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

const DISPONIBILIDAD_MAP: Record<string, { label: string; variant: BadgeVariant }> = {
  ACTIVA: { label: "Activa", variant: "success" },
  OCUPADA: { label: "Ocupada", variant: "warning" },
  CANCELADA: { label: "Cancelada", variant: "muted" },
};

const REUNION_MAP: Record<string, { label: string; variant: BadgeVariant }> = {
  PROPUESTO: { label: "Propuesta enviada", variant: "warning" },
  ACEPTADO: { label: "Aceptada", variant: "default" },
  RECHAZADO: { label: "Rechazada", variant: "destructive" },
  CONTRAOFERTA: { label: "Contraoferta", variant: "accent" },
  CONFIRMADO: { label: "Confirmada", variant: "success" },
  CANCELADO: { label: "Cancelada", variant: "muted" },
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
  disponibilidad: DISPONIBILIDAD_MAP,
  reunion: REUNION_MAP,
} as const;

const DOT_BY_VARIANT: Record<BadgeVariant, string> = {
  default: "bg-primary",
  secondary: "bg-secondary",
  accent: "bg-accent",
  destructive: "bg-destructive",
  success: "bg-success",
  warning: "bg-warning",
  muted: "bg-muted-foreground/50",
  outline: "bg-foreground/40",
};

type Kind = keyof typeof MAPS;

interface StatusBadgeProps {
  kind: Kind;
  value: string;
  className?: string;
  /** Mostrar el punto a la izquierda del label (default true). */
  dot?: boolean;
}

export function StatusBadge({
  kind,
  value,
  className,
  dot = true,
}: StatusBadgeProps): JSX.Element {
  const map = MAPS[kind];
  const entry = map[value] ?? { label: value, variant: "outline" as BadgeVariant };
  return (
    <Badge variant={entry.variant} className={className}>
      {dot && (
        <span
          aria-hidden
          className={cn("h-1.5 w-1.5 rounded-full", DOT_BY_VARIANT[entry.variant])}
        />
      )}
      {entry.label}
    </Badge>
  );
}
