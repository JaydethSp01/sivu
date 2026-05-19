import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CalendarClock,
  ExternalLink,
  Loader2,
  MapPin,
  Trash2,
  User,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { api, extractApiMessage } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { MODALIDAD_ENTREVISTA_LABELS } from "@/lib/enum-labels";
import type { EntrevistaResponse, EstadoPostulacion } from "@/lib/types";
import { EntrevistaFormDialog } from "./entrevista-form-dialog";
import { ResultadoEntrevistaDialog } from "./resultado-entrevista-dialog";

interface Props {
  postulacionId: number;
  postulacionEstado: EstadoPostulacion;
}

const PROGRAMABLES: EstadoPostulacion[] = ["POSTULADA", "EN_REVISION"];

export function EntrevistaPanel({ postulacionId, postulacionEstado }: Props): JSX.Element {
  const qc = useQueryClient();
  const hasRole = useAuthStore((s) => s.hasRole);
  const canManage = hasRole("ADMIN", "COORDINADOR", "EMPRESA");

  const lista = useQuery({
    queryKey: ["/entrevistas", { postulacionId }],
    queryFn: async () => {
      const { data } = await api.get<EntrevistaResponse[]>("/entrevistas", {
        params: { postulacionId },
      });
      return data;
    },
  });

  const cancelar = useMutation({
    mutationFn: async (entrevistaId: number) => {
      await api.delete(`/entrevistas/${entrevistaId}`);
    },
    onSuccess: () => {
      toast.success("Entrevista cancelada");
      qc.invalidateQueries({ queryKey: ["/entrevistas"] });
      qc.invalidateQueries({ queryKey: ["/postulaciones"] });
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  const entrevistas = (lista.data ?? []).slice().sort(
    (a, b) => parseISO(b.fechaProgramada).getTime() - parseISO(a.fechaProgramada).getTime()
  );
  const pendiente = entrevistas.find((e) => e.resultado === "PENDIENTE");
  const puedeProgramar = canManage && PROGRAMABLES.includes(postulacionEstado);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div>
          <CardTitle>Entrevista</CardTitle>
          <CardDescription>
            Entre la revisión inicial y la preselección, la empresa coordina la entrevista.
          </CardDescription>
        </div>
        {puedeProgramar && <EntrevistaFormDialog postulacionId={postulacionId} />}
      </CardHeader>
      <CardContent className="space-y-3">
        {lista.isLoading ? (
          <div className="flex items-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando...
          </div>
        ) : entrevistas.length === 0 ? (
          <EmptyState
            title="Sin entrevistas registradas"
            description={
              puedeProgramar
                ? "Cuando la empresa agende, aparecerá aquí."
                : "Aún no se ha agendado entrevista para esta postulación."
            }
          />
        ) : (
          entrevistas.map((e) => (
            <div
              key={e.id}
              className="rounded-md border p-3 space-y-2 bg-card"
              data-testid={`entrevista-${e.id}`}
            >
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <CalendarClock className="h-4 w-4 text-primary" />
                  {format(parseISO(e.fechaProgramada), "PPpp", { locale: es })}
                  <Badge variant="muted">
                    {MODALIDAD_ENTREVISTA_LABELS[e.modalidad] ?? e.modalidad}
                  </Badge>
                </div>
                <StatusBadge kind="entrevista" value={e.resultado} />
              </div>
              {e.lugar && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" /> {e.lugar}
                </div>
              )}
              {e.enlaceVirtual && (
                <a
                  href={e.enlaceVirtual}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <ExternalLink className="h-3 w-3" /> Enlace virtual
                </a>
              )}
              {(e.entrevistadorNombre || e.entrevistadorCargo) && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <User className="h-3 w-3" />
                  {e.entrevistadorNombre}
                  {e.entrevistadorCargo && <span> — {e.entrevistadorCargo}</span>}
                </div>
              )}
              {e.observaciones && (
                <p className="text-xs whitespace-pre-wrap text-muted-foreground">
                  {e.observaciones}
                </p>
              )}
              {e.fechaResultado && (
                <div className="text-xs text-muted-foreground">
                  Resultado registrado el {format(parseISO(e.fechaResultado), "PPp", { locale: es })}
                </div>
              )}
              {e.resultado === "PENDIENTE" && canManage && (
                <div className="flex gap-2 pt-1">
                  <ResultadoEntrevistaDialog entrevistaId={e.id} />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (confirm("¿Cancelar esta entrevista? La postulación volverá al estado previo.")) {
                        cancelar.mutate(e.id);
                      }
                    }}
                    disabled={cancelar.isPending}
                  >
                    <Trash2 className="h-4 w-4" /> Cancelar
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
        {pendiente && !puedeProgramar && (
          <p className="text-xs text-muted-foreground">
            Entrevista pendiente — contacta a la empresa si tienes dudas sobre el agendamiento.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
