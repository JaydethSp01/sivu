import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addMonths } from "date-fns";
import {
  CalendarPlus,
  Clock,
  GraduationCap,
  Loader2,
  MapPin,
  Send,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/combobox";
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
import type {
  Convenio,
  Disponibilidad,
  ModalidadAgenda,
  PageResponse,
  ProponerReunionRequest,
} from "@/lib/types";
import { fechaLarga, hhmm, toIsoDate } from "./agendamiento-utils";

interface TutorOpcion {
  id: number;
  nombre: string;
  rol: string;
}

interface PropuestaState {
  franja: Disponibilidad;
  horaInicio: string;
  horaFin: string;
  modalidad: ModalidadAgenda;
  enlace: string;
  observaciones: string;
}

export function ProponerReunionPage(): JSX.Element {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [convenioId, setConvenioId] = useState<number | null>(null);
  const [tutorId, setTutorId] = useState<number | null>(null);
  const [propuesta, setPropuesta] = useState<PropuestaState | null>(null);

  const convenios = useQuery({
    queryKey: ["/convenios", "agendamiento-proponer"],
    queryFn: async () =>
      (
        await api.get<PageResponse<Convenio>>("/convenios", {
          params: { page: 0, size: 200, sort: "createdAt,desc" },
        })
      ).data.content,
  });

  const convenio = useMemo(
    () => convenios.data?.find((c) => c.id === convenioId) ?? null,
    [convenios.data, convenioId]
  );

  // Tutores asociados al convenio elegido (académico y/o empresarial).
  const tutorOpciones = useMemo<TutorOpcion[]>(() => {
    if (!convenio) return [];
    const opts: TutorOpcion[] = [];
    if (convenio.tutorAcademicoId && convenio.tutorAcademico) {
      opts.push({ id: convenio.tutorAcademicoId, nombre: convenio.tutorAcademico.nombreCompleto, rol: "Tutor académico" });
    }
    if (convenio.tutorEmpresarialId && convenio.tutorEmpresarial) {
      opts.push({ id: convenio.tutorEmpresarialId, nombre: convenio.tutorEmpresarial.nombreCompleto, rol: "Tutor empresarial" });
    }
    return opts;
  }, [convenio]);

  const hoy = toIsoDate(new Date());
  const limite = toIsoDate(addMonths(new Date(), 2));

  const franjas = useQuery({
    queryKey: ["/agendamiento/disponibilidades", "activas", tutorId, hoy, limite],
    enabled: tutorId != null,
    queryFn: async () =>
      (
        await api.get<Disponibilidad[]>("/agendamiento/disponibilidades", {
          params: { tutorId, desde: hoy, hasta: limite },
        })
      ).data,
  });

  const activas = useMemo(
    () =>
      (franjas.data ?? [])
        .filter((f) => f.estado === "ACTIVA")
        .sort((a, b) => (a.fecha + a.horaInicio).localeCompare(b.fecha + b.horaInicio)),
    [franjas.data]
  );

  const proponer = useMutation({
    mutationFn: async (p: PropuestaState) => {
      if (!convenio || !tutorId) throw new Error("Faltan datos del convenio o tutor");
      const payload: ProponerReunionRequest = {
        convenioId: convenio.id,
        estudianteId: convenio.estudianteId,
        tutorId,
        fechaPropuesta: p.franja.fecha,
        horaInicio: p.horaInicio,
        horaFin: p.horaFin,
        modalidad: p.modalidad,
        enlace: p.modalidad === "VIRTUAL" ? p.enlace || null : null,
        observaciones: p.observaciones || null,
      };
      return api.post("/agendamiento/reuniones", payload);
    },
    onSuccess: () => {
      toast.success("Propuesta de reunión enviada");
      qc.invalidateQueries({ queryKey: ["/agendamiento/reuniones"] });
      qc.invalidateQueries({ queryKey: ["/agendamiento/disponibilidades"] });
      setPropuesta(null);
      navigate("/agendamiento/reuniones");
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  function abrirPropuesta(franja: Disponibilidad): void {
    setPropuesta({
      franja,
      horaInicio: hhmm(franja.horaInicio),
      horaFin: hhmm(franja.horaFin),
      modalidad: franja.modalidad,
      enlace: "",
      observaciones: "",
    });
  }

  function enviar(): void {
    if (!propuesta) return;
    if (propuesta.horaFin <= propuesta.horaInicio) {
      toast.error("La hora de fin debe ser posterior a la de inicio");
      return;
    }
    if (propuesta.modalidad === "VIRTUAL" && !propuesta.enlace.trim()) {
      toast.error("Agrega el enlace de la reunión virtual");
      return;
    }
    proponer.mutate(propuesta);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Proponer reunión"
        description="Elige tu convenio de práctica, el tutor con quien deseas reunirte y una de sus franjas disponibles. El tutor podrá aceptar, rechazar o proponer otra fecha."
        icon={CalendarPlus}
      />

      <Card>
        <CardContent className="grid gap-4 p-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Convenio de práctica
            </Label>
            <Combobox
              items={convenios.data ?? []}
              value={convenioId}
              onChange={(v) => {
                setConvenioId(v);
                setTutorId(null);
              }}
              placeholder="Selecciona tu convenio"
              searchPlaceholder="Buscar convenio..."
              getKey={(c) => c.id}
              getLabel={(c) => c.numeroConvenio}
              getSecondary={(c) => c.empresa?.razonSocial ?? c.vacante?.titulo ?? undefined}
              allowClear
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Tutor / docente
            </Label>
            <Select
              value={tutorId != null ? String(tutorId) : ""}
              onValueChange={(v) => setTutorId(Number(v))}
              disabled={!convenio || tutorOpciones.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={convenio ? "Selecciona un tutor" : "Elige un convenio primero"} />
              </SelectTrigger>
              <SelectContent>
                {tutorOpciones.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    {t.nombre} · {t.rol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {convenio && tutorOpciones.length === 0 && (
        <EmptyState
          icon={GraduationCap}
          title="Este convenio aún no tiene tutores asignados"
          description="Coformación debe asignar un tutor académico o empresarial antes de poder agendar reuniones."
        />
      )}

      {tutorId == null ? (
        <EmptyState
          icon={CalendarPlus}
          title="Selecciona convenio y tutor"
          description="Cuando elijas un tutor verás aquí sus franjas de disponibilidad activas para proponer una reunión."
        />
      ) : franjas.isLoading ? (
        <div className="flex items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card p-12 text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" /> Buscando disponibilidad...
        </div>
      ) : activas.length === 0 ? (
        <EmptyState
          title="Sin franjas disponibles"
          description="Este tutor no tiene franjas activas en los próximos dos meses. Vuelve más tarde o consulta con Coformación."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {activas.map((f) => (
            <Card key={f.id} className="flex flex-col">
              <CardContent className="flex flex-1 flex-col gap-3 p-4">
                <div className="text-sm font-semibold capitalize">{fechaLarga(f.fecha)}</div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="muted" className="font-normal">
                    <Clock className="h-3 w-3" /> {hhmm(f.horaInicio)}–{hhmm(f.horaFin)}
                  </Badge>
                  <Badge variant="muted" className="font-normal">
                    {f.modalidad === "VIRTUAL" ? <Video className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                    {f.modalidad === "VIRTUAL" ? "Virtual" : "Presencial"}
                  </Badge>
                </div>
                <Button variant="gradient" size="sm" className="mt-auto" onClick={() => abrirPropuesta(f)}>
                  <Send className="h-4 w-4" /> Proponer
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={propuesta != null} onOpenChange={(o) => !o && setPropuesta(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Proponer reunión</DialogTitle>
            <DialogDescription>
              {propuesta && (
                <span className="capitalize">{fechaLarga(propuesta.franja.fecha)}</span>
              )}
            </DialogDescription>
          </DialogHeader>
          {propuesta && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="pi">Hora inicio</Label>
                  <Input
                    id="pi"
                    type="time"
                    value={propuesta.horaInicio}
                    onChange={(e) => setPropuesta((s) => (s ? { ...s, horaInicio: e.target.value } : s))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pf">Hora fin</Label>
                  <Input
                    id="pf"
                    type="time"
                    value={propuesta.horaFin}
                    onChange={(e) => setPropuesta((s) => (s ? { ...s, horaFin: e.target.value } : s))}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Sugerido por la franja: {hhmm(propuesta.franja.horaInicio)}–{hhmm(propuesta.franja.horaFin)}
              </p>
              <div className="space-y-1.5">
                <Label>Modalidad</Label>
                <Select
                  value={propuesta.modalidad}
                  onValueChange={(v) =>
                    setPropuesta((s) => (s ? { ...s, modalidad: v as ModalidadAgenda } : s))
                  }
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRESENCIAL">Presencial</SelectItem>
                    <SelectItem value="VIRTUAL">Virtual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {propuesta.modalidad === "VIRTUAL" && (
                <div className="space-y-1.5">
                  <Label htmlFor="enlace">Enlace de la reunión</Label>
                  <Input
                    id="enlace"
                    placeholder="https://meet.google.com/..."
                    value={propuesta.enlace}
                    onChange={(e) => setPropuesta((s) => (s ? { ...s, enlace: e.target.value } : s))}
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="obs">Mensaje para el tutor (opcional)</Label>
                <Textarea
                  id="obs"
                  rows={3}
                  placeholder="Ej: quisiera revisar mi plan de actividades."
                  value={propuesta.observaciones}
                  onChange={(e) => setPropuesta((s) => (s ? { ...s, observaciones: e.target.value } : s))}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPropuesta(null)}>Cancelar</Button>
            <Button onClick={enviar} disabled={proponer.isPending}>
              {proponer.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Enviar propuesta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
