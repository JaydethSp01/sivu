import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { AlertTriangle, CheckCircle2, Clock, Factory } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import {
  ESTADO_SOLICITUD_FABRICA_LABELS,
  ESTADO_SOLICITUD_FABRICA_VARIANT,
} from "@/lib/enum-labels";
import type { SolicitudFabricaResponse } from "@/lib/types";
import { SolicitarFabricaDialog } from "./solicitar-fabrica-dialog";

/**
 * Card del estudiante. Muestra el estado de su última solicitud al programa
 * interno; si no tiene ninguna activa, ofrece el botón para crear una nueva.
 */
export function MiSolicitudFabricaCard(): JSX.Element {
  const mias = useQuery({
    queryKey: ["/solicitudes-fabrica/mias"],
    queryFn: async () => {
      const { data } = await api.get<SolicitudFabricaResponse[]>(
        "/solicitudes-fabrica/mias"
      );
      return data;
    },
  });

  const ultima = mias.data?.[0] ?? null;
  const tienePendiente = mias.data?.some((s) => s.estado === "PENDIENTE") ?? false;
  const tieneAprobada = mias.data?.some((s) => s.estado === "APROBADA") ?? false;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <Factory className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base">Programa interno (plan B)</CardTitle>
              <CardDescription className="mt-1">
                Si las fechas se te acercan y aún no consigues empresa, puedes
                solicitar entrar al programa interno de la universidad.
              </CardDescription>
            </div>
          </div>
          {!tienePendiente && !tieneAprobada && <SolicitarFabricaDialog />}
        </div>
      </CardHeader>
      {ultima && (
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Badge variant={ESTADO_SOLICITUD_FABRICA_VARIANT[ultima.estado]}>
              {ultima.estado === "PENDIENTE" && <Clock className="h-3 w-3 mr-1" />}
              {ultima.estado === "APROBADA" && <CheckCircle2 className="h-3 w-3 mr-1" />}
              {ultima.estado === "RECHAZADA" && <AlertTriangle className="h-3 w-3 mr-1" />}
              {ESTADO_SOLICITUD_FABRICA_LABELS[ultima.estado]}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Enviada el {format(parseISO(ultima.fechaSolicitud), "PPp", { locale: es })}
            </span>
            {ultima.fechaResolucion && (
              <span className="text-xs text-muted-foreground">
                · Resuelta el {format(parseISO(ultima.fechaResolucion), "PPp", { locale: es })}
              </span>
            )}
          </div>

          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
              Tu motivo
            </div>
            <p className="text-sm whitespace-pre-wrap">{ultima.motivo}</p>
          </div>

          {ultima.estado === "APROBADA" && (
            <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/5 p-3 text-sm">
              <div className="font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" /> Solicitud aprobada
              </div>
              <p className="text-muted-foreground mt-1">
                Cuando haya cupo disponible serás asignado automáticamente. Mientras
                tanto puedes seguir postulándote a empresas externas.
              </p>
              {ultima.resueltoPorNombre && (
                <p className="text-xs text-muted-foreground mt-1">
                  Aprobada por {ultima.resueltoPorNombre}
                </p>
              )}
            </div>
          )}

          {ultima.estado === "RECHAZADA" && ultima.observacionesCoord && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm">
              <div className="font-semibold text-destructive flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" /> Solicitud rechazada
              </div>
              <p className="mt-1 whitespace-pre-wrap">{ultima.observacionesCoord}</p>
              <div className="mt-3">
                <SolicitarFabricaDialog />
              </div>
            </div>
          )}

          {ultima.estado === "PENDIENTE" && (
            <div className="text-xs text-muted-foreground">
              Coordinación está revisando tu solicitud. Te avisaremos por correo en cuanto
              haya respuesta.
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
