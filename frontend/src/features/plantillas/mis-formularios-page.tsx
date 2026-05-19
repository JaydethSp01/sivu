import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { FileText, Inbox, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { api } from "@/lib/api";
import {
  ESTADO_RESPUESTA_LABELS,
  ESTADO_RESPUESTA_VARIANT,
} from "@/lib/enum-labels";
import type { RespuestaFormulario } from "@/lib/types";

export function MisFormulariosPage(): JSX.Element {
  const { data, isLoading } = useQuery({
    queryKey: ["/respuestas-formulario/mias"],
    queryFn: async () =>
      (await api.get<RespuestaFormulario[]>("/respuestas-formulario/mias")).data,
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Mis formularios"
        description="Formularios que Coformación te asignó para llenar."
        icon={Inbox}
      />
      {isLoading ? (
        <div className="flex items-center justify-center rounded-2xl border border-dashed p-12 text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" />
          Cargando...
        </div>
      ) : (data ?? []).length === 0 ? (
        <EmptyState
          title="Sin formularios asignados"
          description="Cuando Coformación te asigne una evaluación, acta o plan, aparecerá aquí."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data!.map((r) => (
            <Card key={r.id} className="flex flex-col">
              <CardContent className="flex flex-col gap-2 p-4 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-display text-sm font-bold tracking-tight">
                    {r.plantillaCodigo}
                  </div>
                  <Badge variant={ESTADO_RESPUESTA_VARIANT[r.estado]}>
                    {ESTADO_RESPUESTA_LABELS[r.estado]}
                  </Badge>
                </div>
                <div className="text-sm font-medium">{r.plantillaNombre}</div>
                {r.estudianteNombre && (
                  <div className="text-xs text-muted-foreground">
                    Estudiante: {r.estudianteNombre}
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  Asignado el {format(parseISO(r.fechaAsignacion), "PP", { locale: es })}
                </div>
                {r.fechaLimite && (
                  <div className="text-xs text-muted-foreground">
                    Fecha límite: <strong>{r.fechaLimite}</strong>
                  </div>
                )}
                <Button asChild size="sm" variant="gradient" className="mt-auto">
                  <Link to={`/mis-formularios/${r.id}`}>
                    <FileText className="h-4 w-4" />
                    {r.estado === "PENDIENTE" ? "Llenar" : "Ver"}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
