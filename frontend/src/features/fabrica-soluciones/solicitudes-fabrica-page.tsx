import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
  CheckCircle2,
  Inbox,
  Loader2,
  PackageCheck,
  ThumbsDown,
  ThumbsUp,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { api, extractApiMessage } from "@/lib/api";
import {
  ESTADO_SOLICITUD_FABRICA_LABELS,
  ESTADO_SOLICITUD_FABRICA_VARIANT,
} from "@/lib/enum-labels";
import type {
  EstadoSolicitudFabrica,
  SolicitudFabricaResponse,
  VacanteInternaDisponible,
} from "@/lib/types";

const ESTADOS: EstadoSolicitudFabrica[] = [
  "PENDIENTE",
  "APROBADA",
  "ASIGNADA",
  "RECHAZADA",
];

export function SolicitudesFabricaPage(): JSX.Element {
  const qc = useQueryClient();
  const [estado, setEstado] = useState<EstadoSolicitudFabrica>("PENDIENTE");
  const [rechazoTarget, setRechazoTarget] = useState<SolicitudFabricaResponse | null>(null);
  const [observaciones, setObservaciones] = useState("");
  const [asignarTarget, setAsignarTarget] = useState<SolicitudFabricaResponse | null>(null);
  const [vacanteId, setVacanteId] = useState<string>("");

  const bandeja = useQuery({
    queryKey: ["/solicitudes-fabrica/bandeja", estado],
    queryFn: async () => {
      const { data } = await api.get<SolicitudFabricaResponse[]>(
        "/solicitudes-fabrica/bandeja",
        { params: { estado } }
      );
      return data;
    },
  });

  // Solo se consulta cuando el dialog de asignación está abierto.
  const vacantesInternas = useQuery({
    queryKey: ["/solicitudes-fabrica/vacantes-internas-disponibles"],
    queryFn: async () => {
      const { data } = await api.get<VacanteInternaDisponible[]>(
        "/solicitudes-fabrica/vacantes-internas-disponibles"
      );
      return data;
    },
    enabled: asignarTarget !== null,
  });

  const aprobar = useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.post<SolicitudFabricaResponse>(
        `/solicitudes-fabrica/${id}/aprobar`,
        {}
      );
      return data;
    },
    onSuccess: () => {
      toast.success("Solicitud aprobada");
      qc.invalidateQueries({ queryKey: ["/solicitudes-fabrica/bandeja"] });
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  const rechazar = useMutation({
    mutationFn: async ({ id, obs }: { id: number; obs: string }) => {
      const { data } = await api.post<SolicitudFabricaResponse>(
        `/solicitudes-fabrica/${id}/rechazar`,
        { observaciones: obs }
      );
      return data;
    },
    onSuccess: () => {
      toast.success("Solicitud rechazada");
      qc.invalidateQueries({ queryKey: ["/solicitudes-fabrica/bandeja"] });
      setRechazoTarget(null);
      setObservaciones("");
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  const asignar = useMutation({
    mutationFn: async ({ id, vId }: { id: number; vId: number }) => {
      const { data } = await api.post<SolicitudFabricaResponse>(
        `/solicitudes-fabrica/${id}/asignar-proyecto`,
        { vacanteId: vId }
      );
      return data;
    },
    onSuccess: () => {
      toast.success("Proyecto asignado y postulación creada");
      qc.invalidateQueries({ queryKey: ["/solicitudes-fabrica/bandeja"] });
      qc.invalidateQueries({ queryKey: ["/solicitudes-fabrica/vacantes-internas-disponibles"] });
      setAsignarTarget(null);
      setVacanteId("");
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  const items = bandeja.data ?? [];
  const contador = useMemo(() => items.length, [items]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Solicitudes al programa interno"
        description="Estudiantes que pidieron explícitamente entrar al programa interno. Aprueba, asigna proyecto o devuelve con observaciones."
        icon={Inbox}
        actions={
          <div className="flex items-center gap-2">
            <Select
              value={estado}
              onValueChange={(v) => setEstado(v as EstadoSolicitudFabrica)}
            >
              <SelectTrigger className="w-[230px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ESTADOS.map((e) => (
                  <SelectItem key={e} value={e}>
                    {ESTADO_SOLICITUD_FABRICA_LABELS[e]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge variant="muted">{contador}</Badge>
          </div>
        }
      />

      <Card>
        <CardContent className="pt-4">
          {bandeja.isLoading ? (
            <div className="flex items-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando...
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              title={`Sin solicitudes ${ESTADO_SOLICITUD_FABRICA_LABELS[estado].toLowerCase()}`}
              description={
                estado === "PENDIENTE"
                  ? "Cuando un estudiante envíe una solicitud aparecerá aquí."
                  : "Cambia el filtro para ver solicitudes en otros estados."
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estudiante</TableHead>
                  <TableHead>Programa</TableHead>
                  <TableHead>Enviada</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div className="font-medium">{s.estudianteNombreCompleto}</div>
                      <div className="text-xs text-muted-foreground">{s.estudianteEmail}</div>
                    </TableCell>
                    <TableCell className="text-sm">{s.programaAcademico}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(parseISO(s.fechaSolicitud), "PPp", { locale: es })}
                    </TableCell>
                    <TableCell className="max-w-md">
                      <p className="text-sm line-clamp-3 whitespace-pre-wrap">{s.motivo}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={ESTADO_SOLICITUD_FABRICA_VARIANT[s.estado]}>
                        {ESTADO_SOLICITUD_FABRICA_LABELS[s.estado]}
                      </Badge>
                      {s.estado === "ASIGNADA" && s.vacanteAsignadaTitulo && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          Proyecto: <span className="font-medium">{s.vacanteAsignadaTitulo}</span>
                        </p>
                      )}
                      {s.observacionesCoord && s.estado !== "PENDIENTE" && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {s.observacionesCoord}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {s.estado === "PENDIENTE" ? (
                        <div className="inline-flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => aprobar.mutate(s.id)}
                            disabled={aprobar.isPending}
                          >
                            {aprobar.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <ThumbsUp className="h-4 w-4" />
                            )}
                            Aprobar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setRechazoTarget(s);
                              setObservaciones("");
                            }}
                          >
                            <ThumbsDown className="h-4 w-4" /> Rechazar
                          </Button>
                        </div>
                      ) : s.estado === "APROBADA" ? (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => {
                            setAsignarTarget(s);
                            setVacanteId("");
                          }}
                        >
                          <PackageCheck className="h-4 w-4" /> Asignar proyecto
                        </Button>
                      ) : (
                        <span className="inline-flex items-center text-xs text-muted-foreground">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Cerrada
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de rechazo */}
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
            <AlertDialogTitle>
              Rechazar solicitud de {rechazoTarget?.estudianteNombreCompleto}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Indica al estudiante por qué no se aprobará. Se le notificará por correo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            rows={5}
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Ej: Aún tienes vacantes externas pendientes de respuesta. Espera a esas decisiones antes de solicitar el programa interno."
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
                rechazar.mutate({ id: rechazoTarget.id, obs: observaciones.trim() });
              }}
              disabled={rechazar.isPending}
            >
              {rechazar.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Rechazar solicitud
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo de asignación de proyecto interno */}
      <Dialog
        open={asignarTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setAsignarTarget(null);
            setVacanteId("");
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Asignar proyecto a {asignarTarget?.estudianteNombreCompleto}
            </DialogTitle>
            <DialogDescription>
              Elige una vacante interna PUBLICADA con cupos disponibles. Al confirmar
              se creará la postulación PRESELECCIONADA y la solicitud pasará a
              estado <span className="font-medium">ASIGNADA</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-1">
            {vacantesInternas.isLoading ? (
              <div className="flex items-center text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando vacantes...
              </div>
            ) : (vacantesInternas.data ?? []).length === 0 ? (
              <EmptyState
                title="Sin vacantes internas disponibles"
                description="Crea una vacante con modalidad INTERNA_UNIVERSIDAD y cupos > 0 antes de asignar."
              />
            ) : (
              <Select value={vacanteId} onValueChange={setVacanteId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un proyecto interno" />
                </SelectTrigger>
                <SelectContent>
                  {(vacantesInternas.data ?? []).map((v) => (
                    <SelectItem key={v.id} value={String(v.id)}>
                      <div className="flex flex-col">
                        <span className="font-medium">{v.titulo}</span>
                        <span className="text-xs text-muted-foreground">
                          {v.ciudad ?? "Sin ciudad"} · {v.modalidad ?? "—"} · cupos: {v.cuposDisponibles ?? "—"}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAsignarTarget(null);
                setVacanteId("");
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (!asignarTarget) return;
                if (!vacanteId) {
                  toast.error("Selecciona una vacante");
                  return;
                }
                asignar.mutate({ id: asignarTarget.id, vId: Number(vacanteId) });
              }}
              disabled={asignar.isPending || !vacanteId}
            >
              {asignar.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <PackageCheck className="h-4 w-4 mr-1" />
              )}
              Asignar y crear postulación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
