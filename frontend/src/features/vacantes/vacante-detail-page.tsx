import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock,
  Loader2,
  Pencil,
  Send,
  Upload,
  XCircle,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { StatusBadge } from "@/components/status-badge";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { APLICA_A_LABELS } from "@/lib/enum-labels";
import type { ItemChecklist, ResumenChecklist, Vacante } from "@/lib/types";

function ChecklistIcon({ item }: { item: ItemChecklist }): JSX.Element {
  if (!item.cargado) return <Circle className="h-5 w-5 text-muted-foreground shrink-0" />;
  if (item.estadoDocumento === "VALIDADO")
    return <CheckCircle2 className="h-5 w-5 text-success shrink-0" />;
  if (item.estadoDocumento === "RECHAZADO")
    return <XCircle className="h-5 w-5 text-destructive shrink-0" />;
  return <Clock className="h-5 w-5 text-warning shrink-0" />;
}

export function VacanteDetailPage(): JSX.Element {
  const { id } = useParams();
  const navigate = useNavigate();
  const hasRole = useAuthStore((s) => s.hasRole);
  const usuario = useAuthStore((s) => s.usuario);
  const isStudent = hasRole("ESTUDIANTE") && !hasRole("ADMIN", "COORDINADOR");
  const estudianteId = isStudent ? usuario?.estudianteId ?? null : null;

  const { data, isLoading } = useQuery({
    queryKey: ["/vacantes", id],
    queryFn: async () => (await api.get<Vacante>(`/vacantes/${id}`)).data,
    enabled: !!id,
  });

  const checklist = useQuery({
    queryKey: ["/checklist/vacante", id, estudianteId],
    enabled: !!id,
    queryFn: async () => {
      const params: Record<string, number> = {};
      if (estudianteId) params.estudianteId = estudianteId;
      return (await api.get<ResumenChecklist>(`/checklist/vacante/${id}`, { params })).data;
    },
  });

  if (isLoading)
    return (
      <div className="flex items-center text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />Cargando...
      </div>
    );
  if (!data) return <div>No encontrada</div>;

  const puedePostular = checklist.data?.puedePostular ?? true;
  const faltantes =
    (checklist.data?.totalObligatorios ?? 0) - (checklist.data?.obligatoriosCumplidos ?? 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <h1 className="text-2xl font-bold">{data.titulo}</h1>
            <p className="text-sm text-muted-foreground">
              {data.empresa?.razonSocial} · {data.ciudad} · {data.modalidad}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {hasRole("ESTUDIANTE") && data.estado === "PUBLICADA" && (
            <Button
              onClick={() => navigate(`/postulaciones/new?vacanteId=${data.id}`)}
              disabled={isStudent && !puedePostular}
            >
              <Send className="h-4 w-4" /> Postularme
            </Button>
          )}
          {hasRole("ADMIN", "COORDINADOR", "EMPRESA") && (
            <Button variant="outline" onClick={() => navigate(`/vacantes/${id}/edit`)}>
              <Pencil className="h-4 w-4" /> Editar
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Detalle</CardTitle></CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex gap-2 flex-wrap items-center">
            <StatusBadge kind="vacante" value={data.estado} />
            <Badge variant="outline">{data.areaPractica}</Badge>
            <Badge variant="outline">{data.cuposDisponibles} cupos</Badge>
            <Badge variant="outline">{data.duracionMeses} meses</Badge>
          </div>
          <div className="whitespace-pre-wrap">{data.descripcion}</div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div><span className="text-muted-foreground">Inicio: </span>{format(parseISO(data.fechaInicio), "PP", { locale: es })}</div>
            <div><span className="text-muted-foreground">Cierre postulaciones: </span>{format(parseISO(data.fechaCierrePostulaciones), "PP", { locale: es })}</div>
            <div><span className="text-muted-foreground">Créditos mín.: </span>{data.creditosMinimos}</div>
            <div><span className="text-muted-foreground">Promedio mín.: </span>{Number(data.promedioMinimo).toFixed(1)}</div>
          </div>
          {data.requisitosKeywords && data.requisitosKeywords.length > 0 && (
            <div>
              <div className="text-muted-foreground mb-1">Requisitos:</div>
              <div className="flex gap-1 flex-wrap">
                {data.requisitosKeywords.map((k) => <Badge key={k} variant="secondary">{k}</Badge>)}
              </div>
            </div>
          )}
          {data.programasDirigidos && data.programasDirigidos.length > 0 && (
            <div>
              <div className="text-muted-foreground mb-1">Programas dirigidos:</div>
              <div className="flex gap-1 flex-wrap">
                {data.programasDirigidos.map((p) => <Badge key={p} variant="outline">{p}</Badge>)}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Requisitos para postular</CardTitle>
          {checklist.data?.modalidadNombre && (
            <p className="text-sm text-muted-foreground">
              Modalidad: <strong>{checklist.data.modalidadNombre}</strong>
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {checklist.isLoading ? (
            <div className="flex items-center text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />Cargando requisitos...
            </div>
          ) : !checklist.data ? null : checklist.data.items.length === 0 ? (
            <Alert>
              <AlertTitle>Sin requisitos configurados</AlertTitle>
              <AlertDescription>
                Esta vacante no tiene una matriz de requisitos asociada.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {isStudent && (
                <Alert variant={puedePostular ? "success" : "destructive"}>
                  <AlertTitle>
                    {puedePostular
                      ? "Tienes todos los requisitos obligatorios"
                      : `Te faltan ${faltantes} requisito${faltantes === 1 ? "" : "s"} obligatorio${faltantes === 1 ? "" : "s"}`}
                  </AlertTitle>
                  <AlertDescription>
                    {puedePostular
                      ? "Ya puedes postularte a esta vacante."
                      : "Sube los documentos pendientes para habilitar tu postulación."}
                  </AlertDescription>
                </Alert>
              )}
              <ul className="divide-y rounded-md border">
                {checklist.data.items.map((item) => (
                  <li key={item.tipoRequisitoId} className="flex items-start gap-3 p-3">
                    <ChecklistIcon item={item} />
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{item.tipoNombre}</span>
                        {item.obligatorio ? (
                          <Badge variant="default">Obligatorio</Badge>
                        ) : (
                          <Badge variant="muted">Opcional</Badge>
                        )}
                        <Badge variant="outline">{APLICA_A_LABELS[item.aplicaA]}</Badge>
                        {item.estadoDocumento && (
                          <StatusBadge kind="documento" value={item.estadoDocumento} />
                        )}
                      </div>
                      {item.instrucciones && (
                        <p className="text-xs text-muted-foreground">{item.instrucciones}</p>
                      )}
                      {item.estadoDocumento === "RECHAZADO" && item.observacionValidacion && (
                        <p className="text-xs text-destructive">
                          <strong>Motivo:</strong> {item.observacionValidacion}
                        </p>
                      )}
                    </div>
                    {isStudent &&
                      !item.cargado &&
                      (item.aplicaA === "ESTUDIANTE" || item.aplicaA === "AMBOS") && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            navigate(`/documentos/new?tipoRequisitoId=${item.tipoRequisitoId}`)
                          }
                        >
                          <Upload className="h-4 w-4" /> Subir documento
                        </Button>
                      )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
