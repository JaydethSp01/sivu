import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CheckCircle2,
  Clock,
  Eye,
  FileUser,
  Inbox,
  Loader2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/empty-state";
import { api, extractApiMessage } from "@/lib/api";
import {
  ESTADO_HOJA_VIDA_LABELS,
  ESTADO_HOJA_VIDA_VARIANT,
} from "@/lib/enum-labels";
import type { EstadoHojaVida, HojaVidaResponse } from "@/lib/types";

const ESTADOS: EstadoHojaVida[] = ["ENVIADA", "APROBADA", "RECHAZADA", "BORRADOR"];

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

export function BandejaHvPage(): JSX.Element {
  const qc = useQueryClient();
  const [estado, setEstado] = useState<EstadoHojaVida>("ENVIADA");
  const [rechazoTarget, setRechazoTarget] = useState<HojaVidaResponse | null>(null);
  const [observaciones, setObservaciones] = useState("");

  const bandeja = useQuery({
    queryKey: ["/hoja-vida/bandeja", estado],
    queryFn: async () => {
      const { data } = await api.get<HojaVidaResponse[]>("/hoja-vida/bandeja", {
        params: { estado },
      });
      return data;
    },
  });

  const aprobar = useMutation({
    mutationFn: async (hvId: number) => {
      const { data } = await api.post<HojaVidaResponse>(`/hoja-vida/${hvId}/aprobar`);
      return data;
    },
    onSuccess: () => {
      toast.success("HV aprobada");
      qc.invalidateQueries({ queryKey: ["/hoja-vida/bandeja"] });
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  const rechazar = useMutation({
    mutationFn: async ({ hvId, obs }: { hvId: number; obs: string }) => {
      const { data } = await api.post<HojaVidaResponse>(`/hoja-vida/${hvId}/rechazar`, {
        observaciones: obs,
      });
      return data;
    },
    onSuccess: () => {
      toast.success("HV rechazada con observaciones");
      qc.invalidateQueries({ queryKey: ["/hoja-vida/bandeja"] });
      setRechazoTarget(null);
      setObservaciones("");
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  const items = bandeja.data ?? [];
  const contador = useMemo(() => items.length, [items]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Inbox className="h-6 w-6 text-primary" />
            Bandeja Hoja de Vida — Coformación
          </h1>
          <p className="text-sm text-muted-foreground">
            Revisa las hojas de vida enviadas por estudiantes, apruébalas para habilitar
            postulación o devuélvelas con observaciones.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Filtrar por estado</span>
          <Select value={estado} onValueChange={(v) => setEstado(v as EstadoHojaVida)}>
            <SelectTrigger className="w-[220px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ESTADOS.map((e) => (
                <SelectItem key={e} value={e}>
                  {ESTADO_HOJA_VIDA_LABELS[e]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge variant="muted">{contador}</Badge>
        </div>
      </div>

      <Card>
        <CardContent className="pt-4">
          {bandeja.isLoading ? (
            <div className="flex items-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando bandeja...
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              title={`Sin HV en estado ${ESTADO_HOJA_VIDA_LABELS[estado]}`}
              description={
                estado === "ENVIADA"
                  ? "No hay hojas de vida pendientes de revisión por Coformación."
                  : "Cambia el filtro para ver HV en otros estados."
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estudiante</TableHead>
                  <TableHead>Programa</TableHead>
                  <TableHead>Enviada</TableHead>
                  <TableHead>Aprobada</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((hv) => (
                  <TableRow key={hv.id}>
                    <TableCell>
                      <div className="font-medium">{hv.estudianteNombreCompleto}</div>
                      <div className="text-xs text-muted-foreground">{hv.estudianteEmail}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{hv.programaAcademico}</div>
                      {hv.semestre != null && (
                        <div className="text-xs text-muted-foreground">
                          Semestre {hv.semestre}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <Clock className="inline h-3 w-3 mr-1" />
                      {formatDateTime(hv.enviadaAt)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {hv.aprobadaAt ? (
                        <>
                          <div>{formatDateTime(hv.aprobadaAt)}</div>
                          {hv.aprobadaPorCoordNombre && (
                            <div>por {hv.aprobadaPorCoordNombre}</div>
                          )}
                        </>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={ESTADO_HOJA_VIDA_VARIANT[hv.estado]}>
                        {ESTADO_HOJA_VIDA_LABELS[hv.estado]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link to={`/hoja-vida/${hv.estudianteId}`}>
                            <Eye className="h-4 w-4" /> Ver
                          </Link>
                        </Button>
                        {hv.estado === "ENVIADA" && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => aprobar.mutate(hv.id)}
                              disabled={aprobar.isPending}
                            >
                              {aprobar.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-4 w-4" />
                              )}{" "}
                              Aprobar
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setRechazoTarget(hv);
                                setObservaciones("");
                              }}
                            >
                              <XCircle className="h-4 w-4" /> Rechazar
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={rechazoTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRechazoTarget(null);
            setObservaciones("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <FileUser className="h-5 w-5" /> Rechazar HV de{" "}
              {rechazoTarget?.estudianteNombreCompleto}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Indica qué debe ajustar el estudiante. El mensaje se le enviará por correo y
              quedará visible en su HV.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            rows={5}
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Ej: Completa la sección de perfil HACER y agrega al menos una experiencia formativa."
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (!rechazoTarget) return;
                if (!observaciones.trim()) {
                  toast.error("Las observaciones son obligatorias al rechazar");
                  return;
                }
                rechazar.mutate({ hvId: rechazoTarget.id, obs: observaciones.trim() });
              }}
              disabled={rechazar.isPending}
            >
              {rechazar.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : null}
              Rechazar HV
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
