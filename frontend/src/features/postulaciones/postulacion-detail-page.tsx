import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, FileSignature, Loader2, RefreshCcw } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/status-badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { api, extractApiMessage } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import type {
  EstadoPostulacion,
  FormalizacionResponse,
  Postulacion,
  PostulacionEvento,
} from "@/lib/types";
import { EntrevistaPanel } from "@/features/entrevistas/entrevista-panel";

const TRANSICIONES: Record<EstadoPostulacion, EstadoPostulacion[]> = {
  POSTULADA: ["EN_REVISION", "RECHAZADA", "RETIRADA"],
  EN_REVISION: ["PRESELECCIONADA", "RECHAZADA", "RETIRADA"],
  ENTREVISTA_PROGRAMADA: [],
  ENTREVISTA_REALIZADA: [],
  PRESELECCIONADA: ["ACEPTADA", "RECHAZADA", "RETIRADA"],
  RECHAZADA: [],
  ACEPTADA: [],
  RETIRADA: [],
};

function transicionesValidas(estado: EstadoPostulacion): EstadoPostulacion[] {
  return TRANSICIONES[estado] ?? [];
}

function Timeline({ events }: { events: PostulacionEvento[] }): JSX.Element {
  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground">Sin eventos registrados.</p>;
  }
  return (
    <ol className="relative border-s ml-3">
      {events.map((e) => (
        <li key={e.id} className="ms-6 pb-6 last:pb-0">
          <span className="absolute -start-1.5 mt-1 flex h-3 w-3 items-center justify-center rounded-full bg-primary ring-4 ring-background" />
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-sm font-semibold">{e.tipoEvento.replaceAll("_", " ")}</span>
            {e.estadoNuevo && <StatusBadge kind="postulacion" value={e.estadoNuevo} />}
          </div>
          <time className="block text-xs text-muted-foreground">
            {format(parseISO(e.ocurridoEn), "PPpp", { locale: es })} · {e.actor ?? "sistema"}
          </time>
          {e.detalle && <p className="mt-1 text-sm">{e.detalle}</p>}
          {e.estadoAnterior && e.estadoNuevo && e.estadoAnterior !== e.estadoNuevo && (
            <p className="mt-1 text-xs text-muted-foreground">
              Cambió de <strong>{e.estadoAnterior}</strong> a <strong>{e.estadoNuevo}</strong>
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}

function CambioEstadoDialog({ postulacion, onChanged }: { postulacion: Postulacion; onChanged: () => void }) {
  const opciones = transicionesValidas(postulacion.estado);
  const [open, setOpen] = useState(false);
  const [nuevoEstado, setNuevoEstado] = useState<EstadoPostulacion>(opciones[0] ?? postulacion.estado);
  const [observaciones, setObservaciones] = useState("");

  const mut = useMutation({
    mutationFn: async () =>
      api.patch(`/postulaciones/${postulacion.id}/estado`, { nuevoEstado, observaciones: observaciones || undefined }),
    onSuccess: () => {
      toast.success("Estado actualizado");
      setOpen(false);
      setObservaciones("");
      onChanged();
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <RefreshCcw className="h-4 w-4" /> Cambiar estado
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cambiar estado</DialogTitle>
          <DialogDescription>El cambio quedará registrado en el historial.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Nuevo estado</Label>
            <Select value={nuevoEstado} onValueChange={(v) => setNuevoEstado(v as EstadoPostulacion)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {opciones.map((e) => <SelectItem key={e} value={e}>{e.replaceAll("_", " ")}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Observaciones</Label>
            <Textarea
              rows={4}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Motivo del cambio..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={() => mut.mutate()} disabled={mut.isPending}>
            {mut.isPending && <Loader2 className="h-4 w-4 animate-spin" />}Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function PostulacionDetailPage(): JSX.Element {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const hasRole = useAuthStore((s) => s.hasRole);
  const canChange = hasRole("ADMIN", "COORDINADOR", "EMPRESA");
  const canFormalize = hasRole("ADMIN", "COORDINADOR");

  const post = useQuery({
    queryKey: ["/postulaciones", id],
    queryFn: async () => (await api.get<Postulacion>(`/postulaciones/${id}`)).data,
    enabled: !!id,
  });

  const historial = useQuery({
    queryKey: ["/postulaciones", id, "historial"],
    queryFn: async () => (await api.get<PostulacionEvento[]>(`/postulaciones/${id}/historial`)).data,
    enabled: !!id,
  });

  const formalizar = useMutation({
    mutationFn: async () => (await api.post<FormalizacionResponse>(`/automatizacion/formalizar/${id}`)).data,
    onSuccess: (data) => {
      toast.success(`Convenio ${data.numeroConvenio} generado`);
      qc.invalidateQueries({ queryKey: ["/convenios"] });
      navigate(`/convenios/${data.convenioId}`);
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  if (post.isLoading) {
    return <div className="flex items-center text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Cargando...</div>;
  }
  if (!post.data) return <div>No encontrada</div>;
  const data = post.data;
  const score = data.scoreMatching !== null ? Number(data.scoreMatching) : null;

  const refresh = () => {
    post.refetch();
    historial.refetch();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <h1 className="text-2xl font-bold">Postulación #{data.id}</h1>
            <p className="text-sm text-muted-foreground">
              {data.estudianteNombreCompleto} → {data.vacanteTitulo} ({data.empresaRazonSocial})
            </p>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          {canChange && transicionesValidas(data.estado).length > 0 && (
            <CambioEstadoDialog postulacion={data} onChanged={refresh} />
          )}
          {canChange && transicionesValidas(data.estado).length === 0 && (
            <Badge variant="muted">Estado final</Badge>
          )}
          {canFormalize && data.estado === "ACEPTADA" && (
            <Button onClick={() => formalizar.mutate()} disabled={formalizar.isPending}>
              {formalizar.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSignature className="h-4 w-4" />}
              Generar convenio
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Resumen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge kind="postulacion" value={data.estado} />
              <span className="text-xs text-muted-foreground">
                Postulada el {format(parseISO(data.fechaPostulacion), "PPp", { locale: es })}
              </span>
            </div>
            {score !== null && (
              <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-muted-foreground">Score de matching</span>
                  <span className="text-4xl font-bold">{score.toFixed(0)}</span>
                </div>
                <Progress value={score} />
                {data.justificacionMatching && (
                  <pre className="text-xs whitespace-pre-wrap font-mono text-muted-foreground mt-2">
                    {data.justificacionMatching}
                  </pre>
                )}
              </div>
            )}
            {data.mensajeEstudiante && (
              <div>
                <Badge variant="secondary" className="mb-1">Mensaje del estudiante</Badge>
                <p className="text-sm whitespace-pre-wrap">{data.mensajeEstudiante}</p>
              </div>
            )}
            {data.observacionesEmpresa && (
              <div>
                <Badge variant="secondary" className="mb-1">Observaciones de la empresa</Badge>
                <p className="text-sm whitespace-pre-wrap">{data.observacionesEmpresa}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Historial</CardTitle>
            <CardDescription>Cronograma vertical de eventos.</CardDescription>
          </CardHeader>
          <CardContent>
            {historial.isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Timeline events={historial.data ?? []} />
            )}
          </CardContent>
        </Card>
      </div>

      <EntrevistaPanel postulacionId={data.id} postulacionEstado={data.estado} />
    </div>
  );
}
