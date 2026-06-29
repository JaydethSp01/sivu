import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarRange,
  Check,
  Clock,
  ExternalLink,
  Loader2,
  MapPin,
  MessageSquare,
  Repeat,
  Video,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { Combobox } from "@/components/combobox";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api, extractApiMessage } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import type {
  Convenio,
  ContraofertaReunionRequest,
  ModalidadAgenda,
  PageResponse,
  ReunionAgenda,
  Tutor,
} from "@/lib/types";
import { fechaLarga, hhmm } from "./agendamiento-utils";

type AccionSimple = "aceptar" | "confirmar";
type AccionObs = "rechazar" | "cancelar";

export function BandejaReunionesPage(): JSX.Element {
  const qc = useQueryClient();
  const hasRole = useAuthStore((s) => s.hasRole);
  const usuario = useAuthStore((s) => s.usuario);
  const isDocente = hasRole("ADMIN", "COORDINADOR");
  const isStudentOnly = hasRole("ESTUDIANTE") && !isDocente;

  const [tutorFiltro, setTutorFiltro] = useState<number | null>(null);

  // Diálogos de acción.
  const [obsDialog, setObsDialog] = useState<{ reunion: ReunionAgenda; accion: AccionObs } | null>(null);
  const [obsTexto, setObsTexto] = useState("");
  const [contraDialog, setContraDialog] = useState<ReunionAgenda | null>(null);
  const [contraForm, setContraForm] = useState<ContraofertaReunionRequest>({
    fechaPropuesta: "",
    horaInicio: "",
    horaFin: "",
    modalidad: "PRESENCIAL",
    enlace: "",
    observaciones: "",
  });

  const tutores = useQuery({
    queryKey: ["/tutores", "agendamiento-bandeja"],
    queryFn: async () =>
      (await api.get<PageResponse<Tutor>>("/tutores", { params: { page: 0, size: 200 } })).data.content,
  });

  const convenios = useQuery({
    queryKey: ["/convenios", "agendamiento-bandeja"],
    queryFn: async () =>
      (await api.get<PageResponse<Convenio>>("/convenios", { params: { page: 0, size: 200 } })).data.content,
  });

  const tutorNombre = useMemo(() => {
    const m = new Map<number, string>();
    tutores.data?.forEach((t) => m.set(t.id, `${t.nombres} ${t.apellidos}`));
    return m;
  }, [tutores.data]);

  const convenioNombre = useMemo(() => {
    const m = new Map<number, string>();
    convenios.data?.forEach((c) => m.set(c.id, c.numeroConvenio));
    return m;
  }, [convenios.data]);

  // El estudiante ve sus reuniones; el docente/coord elige un tutor.
  const filtro = useMemo(() => {
    if (isStudentOnly && usuario?.estudianteId) {
      return { estudianteId: usuario.estudianteId };
    }
    if (tutorFiltro != null) return { tutorId: tutorFiltro };
    return null;
  }, [isStudentOnly, usuario?.estudianteId, tutorFiltro]);

  const reuniones = useQuery({
    queryKey: ["/agendamiento/reuniones", filtro],
    enabled: filtro != null,
    queryFn: async () =>
      (await api.get<ReunionAgenda[]>("/agendamiento/reuniones", { params: filtro as Record<string, number> })).data,
  });

  const ordenadas = useMemo(
    () =>
      (reuniones.data ?? [])
        .slice()
        .sort((a, b) => (b.fechaPropuesta + b.horaInicio).localeCompare(a.fechaPropuesta + a.horaInicio)),
    [reuniones.data]
  );

  function refetchAll(): void {
    qc.invalidateQueries({ queryKey: ["/agendamiento/reuniones"] });
    qc.invalidateQueries({ queryKey: ["/agendamiento/disponibilidades"] });
  }

  const accionSimple = useMutation({
    mutationFn: async ({ id, accion }: { id: number; accion: AccionSimple }) =>
      api.patch(`/agendamiento/reuniones/${id}/${accion}`),
    onSuccess: () => {
      toast.success("Reunión actualizada");
      refetchAll();
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  const accionObs = useMutation({
    mutationFn: async ({ id, accion, observaciones }: { id: number; accion: AccionObs; observaciones: string }) =>
      api.patch(`/agendamiento/reuniones/${id}/${accion}`, { observaciones: observaciones || null }),
    onSuccess: (_d, vars) => {
      toast.success(vars.accion === "rechazar" ? "Propuesta rechazada" : "Reunión cancelada");
      setObsDialog(null);
      setObsTexto("");
      refetchAll();
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  const contraoferta = useMutation({
    mutationFn: async ({ id, body }: { id: number; body: ContraofertaReunionRequest }) =>
      api.patch(`/agendamiento/reuniones/${id}/contraoferta`, body),
    onSuccess: () => {
      toast.success("Contraoferta enviada");
      setContraDialog(null);
      refetchAll();
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  function abrirContra(r: ReunionAgenda): void {
    setContraForm({
      fechaPropuesta: r.fechaPropuesta,
      horaInicio: hhmm(r.horaInicio),
      horaFin: hhmm(r.horaFin),
      modalidad: r.modalidad,
      enlace: r.enlace ?? "",
      observaciones: "",
    });
    setContraDialog(r);
  }

  function enviarContra(): void {
    if (!contraDialog) return;
    if (!contraForm.fechaPropuesta || !contraForm.horaInicio || !contraForm.horaFin) {
      toast.error("Completa fecha y horas");
      return;
    }
    if (contraForm.horaFin <= contraForm.horaInicio) {
      toast.error("La hora de fin debe ser posterior a la de inicio");
      return;
    }
    contraoferta.mutate({
      id: contraDialog.id,
      body: {
        ...contraForm,
        enlace: contraForm.modalidad === "VIRTUAL" ? contraForm.enlace || null : null,
        observaciones: contraForm.observaciones || null,
      },
    });
  }

  const sinFiltro = filtro == null;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Reuniones de acompañamiento"
        description={
          isStudentOnly
            ? "Sigue el estado de las reuniones que has propuesto. Responde las contraofertas de tu tutor y confirma la fecha definitiva."
            : "Revisa las reuniones propuestas por los estudiantes. Acepta, rechaza o propón una nueva fecha (contraoferta)."
        }
        icon={CalendarRange}
      />

      {isDocente && (
        <Card>
          <CardContent className="p-4">
            <Label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Filtrar por docente / tutor
            </Label>
            <div className="sm:max-w-sm">
              <Combobox
                items={tutores.data ?? []}
                value={tutorFiltro}
                onChange={(v) => setTutorFiltro(v)}
                placeholder="Selecciona un docente"
                searchPlaceholder="Buscar docente..."
                getKey={(t) => t.id}
                getLabel={(t) => `${t.nombres} ${t.apellidos}`}
                getSecondary={(t) => t.email}
                allowClear
              />
            </div>
          </CardContent>
        </Card>
      )}

      {sinFiltro ? (
        <EmptyState
          icon={CalendarRange}
          title={isDocente ? "Selecciona un docente" : "No hay reuniones"}
          description={
            isDocente
              ? "Elige un tutor/docente para ver las reuniones agendadas con sus estudiantes."
              : "Aún no tienes reuniones. Propón una desde la sección Proponer reunión."
          }
        />
      ) : reuniones.isLoading ? (
        <div className="flex items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card p-12 text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" /> Cargando reuniones...
        </div>
      ) : ordenadas.length === 0 ? (
        <EmptyState
          title="Sin reuniones"
          description="No hay reuniones agendadas que mostrar para este filtro."
        />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {ordenadas.map((r) => (
            <ReunionCard
              key={r.id}
              reunion={r}
              isDocente={isDocente}
              isStudent={isStudentOnly}
              tutorNombre={tutorNombre.get(r.tutorId)}
              convenioNombre={convenioNombre.get(r.convenioId)}
              pending={accionSimple.isPending || accionObs.isPending}
              onAceptar={() => accionSimple.mutate({ id: r.id, accion: "aceptar" })}
              onConfirmar={() => accionSimple.mutate({ id: r.id, accion: "confirmar" })}
              onRechazar={() => { setObsTexto(""); setObsDialog({ reunion: r, accion: "rechazar" }); }}
              onCancelar={() => { setObsTexto(""); setObsDialog({ reunion: r, accion: "cancelar" }); }}
              onContraoferta={() => abrirContra(r)}
            />
          ))}
        </div>
      )}

      {/* Diálogo observaciones (rechazar / cancelar) */}
      <Dialog open={obsDialog != null} onOpenChange={(o) => !o && setObsDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {obsDialog?.accion === "rechazar" ? "Rechazar propuesta" : "Cancelar reunión"}
            </DialogTitle>
            <DialogDescription>
              Puedes dejar una observación explicando el motivo (opcional).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="obs-accion">Observaciones</Label>
            <Textarea
              id="obs-accion"
              rows={3}
              value={obsTexto}
              onChange={(e) => setObsTexto(e.target.value)}
              placeholder="Motivo..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setObsDialog(null)}>Volver</Button>
            <Button
              variant="destructive"
              disabled={accionObs.isPending}
              onClick={() =>
                obsDialog &&
                accionObs.mutate({ id: obsDialog.reunion.id, accion: obsDialog.accion, observaciones: obsTexto })
              }
            >
              {accionObs.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {obsDialog?.accion === "rechazar" ? "Rechazar" : "Cancelar reunión"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo contraoferta */}
      <Dialog open={contraDialog != null} onOpenChange={(o) => !o && setContraDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Proponer otra fecha (contraoferta)</DialogTitle>
            <DialogDescription>
              Sugiere una nueva fecha y hora. La otra parte deberá aceptarla o responder.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="cf-fecha">Fecha</Label>
              <Input
                id="cf-fecha"
                type="date"
                value={contraForm.fechaPropuesta}
                onChange={(e) => setContraForm((s) => ({ ...s, fechaPropuesta: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="cf-hi">Hora inicio</Label>
                <Input
                  id="cf-hi"
                  type="time"
                  value={contraForm.horaInicio}
                  onChange={(e) => setContraForm((s) => ({ ...s, horaInicio: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cf-hf">Hora fin</Label>
                <Input
                  id="cf-hf"
                  type="time"
                  value={contraForm.horaFin}
                  onChange={(e) => setContraForm((s) => ({ ...s, horaFin: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Modalidad</Label>
              <Select
                value={contraForm.modalidad}
                onValueChange={(v) => setContraForm((s) => ({ ...s, modalidad: v as ModalidadAgenda }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PRESENCIAL">Presencial</SelectItem>
                  <SelectItem value="VIRTUAL">Virtual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {contraForm.modalidad === "VIRTUAL" && (
              <div className="space-y-1.5">
                <Label htmlFor="cf-enlace">Enlace</Label>
                <Input
                  id="cf-enlace"
                  placeholder="https://meet.google.com/..."
                  value={contraForm.enlace ?? ""}
                  onChange={(e) => setContraForm((s) => ({ ...s, enlace: e.target.value }))}
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="cf-obs">Observaciones (opcional)</Label>
              <Textarea
                id="cf-obs"
                rows={2}
                value={contraForm.observaciones ?? ""}
                onChange={(e) => setContraForm((s) => ({ ...s, observaciones: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setContraDialog(null)}>Cancelar</Button>
            <Button onClick={enviarContra} disabled={contraoferta.isPending}>
              {contraoferta.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Enviar contraoferta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface ReunionCardProps {
  reunion: ReunionAgenda;
  isDocente: boolean;
  isStudent: boolean;
  tutorNombre?: string;
  convenioNombre?: string;
  pending: boolean;
  onAceptar: () => void;
  onConfirmar: () => void;
  onRechazar: () => void;
  onCancelar: () => void;
  onContraoferta: () => void;
}

function ReunionCard({
  reunion: r,
  isDocente,
  isStudent,
  tutorNombre,
  convenioNombre,
  pending,
  onAceptar,
  onConfirmar,
  onRechazar,
  onCancelar,
  onContraoferta,
}: ReunionCardProps): JSX.Element {
  // ¿A quién le toca responder según el estado del flujo?
  const docenteResponde = r.estado === "PROPUESTO";
  const estudianteResponde = r.estado === "CONTRAOFERTA";
  const puedeResponder = (isDocente && docenteResponde) || (isStudent && estudianteResponde);
  const puedeConfirmar = r.estado === "ACEPTADO";
  const puedeCancelar = ["PROPUESTO", "ACEPTADO", "CONTRAOFERTA", "CONFIRMADO"].includes(r.estado);
  const terminal = ["RECHAZADO", "CANCELADO"].includes(r.estado);

  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="h-1.5 w-full bg-uni-gradient" aria-hidden />
      <CardContent className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-sm font-semibold capitalize">{fechaLarga(r.fechaPropuesta)}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              {convenioNombre ? `Convenio ${convenioNombre}` : `Convenio #${r.convenioId}`}
              {tutorNombre ? ` · ${tutorNombre}` : ""}
            </div>
          </div>
          <StatusBadge kind="reunion" value={r.estado} />
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Badge variant="muted" className="font-normal">
            <Clock className="h-3 w-3" /> {hhmm(r.horaInicio)}–{hhmm(r.horaFin)}
          </Badge>
          <Badge variant="muted" className="font-normal">
            {r.modalidad === "VIRTUAL" ? <Video className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
            {r.modalidad === "VIRTUAL" ? "Virtual" : "Presencial"}
          </Badge>
        </div>

        {r.modalidad === "VIRTUAL" && r.enlace && (
          <Link
            to={r.enlace}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            <ExternalLink className="h-3 w-3" /> Abrir enlace de la reunión
          </Link>
        )}

        {r.observaciones && (
          <div className="flex items-start gap-2 rounded-lg bg-muted/40 p-2 text-xs text-muted-foreground">
            <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span className="break-words">{r.observaciones}</span>
          </div>
        )}

        {!terminal && (
          <div className="mt-auto flex flex-wrap gap-2 pt-1">
            {puedeResponder && (
              <>
                <Button size="sm" variant="gradient" disabled={pending} onClick={onAceptar}>
                  <Check className="h-4 w-4" /> Aceptar
                </Button>
                <Button size="sm" variant="outline" disabled={pending} onClick={onContraoferta}>
                  <Repeat className="h-4 w-4" /> Contraoferta
                </Button>
                <Button size="sm" variant="outline" disabled={pending} onClick={onRechazar}>
                  <X className="h-4 w-4" /> Rechazar
                </Button>
              </>
            )}
            {puedeConfirmar && (
              <Button size="sm" variant="gradient" disabled={pending} onClick={onConfirmar}>
                <Check className="h-4 w-4" /> Confirmar
              </Button>
            )}
            {puedeCancelar && !puedeResponder && (
              <Button size="sm" variant="outline" disabled={pending} onClick={onCancelar}>
                <X className="h-4 w-4" /> Cancelar
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
