import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addDays, addWeeks } from "date-fns";
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { Combobox } from "@/components/combobox";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { api, extractApiMessage } from "@/lib/api";
import type {
  Disponibilidad,
  DisponibilidadRequest,
  ModalidadAgenda,
  PageResponse,
  Tutor,
} from "@/lib/types";
import {
  etiquetaSemana,
  fechaLarga,
  hhmm,
  inicioSemana,
  rangoSemana,
  toIsoDate,
} from "./agendamiento-utils";

interface FranjaFormState {
  id: number | null;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  modalidad: ModalidadAgenda;
}

const EMPTY_FORM: FranjaFormState = {
  id: null,
  fecha: "",
  horaInicio: "09:00",
  horaFin: "10:00",
  modalidad: "PRESENCIAL",
};

export function DisponibilidadPage(): JSX.Element {
  const qc = useQueryClient();
  const [tutorId, setTutorId] = useState<number | null>(null);
  const [lunes, setLunes] = useState<Date>(() => inicioSemana(new Date()));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FranjaFormState>(EMPTY_FORM);

  const { desde, hasta } = useMemo(() => rangoSemana(lunes), [lunes]);

  const tutores = useQuery({
    queryKey: ["/tutores", "agendamiento"],
    queryFn: async () =>
      (await api.get<PageResponse<Tutor>>("/tutores", { params: { page: 0, size: 200 } })).data.content,
  });

  const franjas = useQuery({
    queryKey: ["/agendamiento/disponibilidades", tutorId, desde, hasta],
    enabled: tutorId != null,
    queryFn: async () =>
      (
        await api.get<Disponibilidad[]>("/agendamiento/disponibilidades", {
          params: { tutorId, desde, hasta },
        })
      ).data,
  });

  const save = useMutation({
    mutationFn: async (values: FranjaFormState) => {
      const payload: DisponibilidadRequest = {
        tutorId: tutorId as number,
        fecha: values.fecha,
        horaInicio: values.horaInicio,
        horaFin: values.horaFin,
        modalidad: values.modalidad,
      };
      if (values.id) return api.put<Disponibilidad>(`/agendamiento/disponibilidades/${values.id}`, payload);
      return api.post<Disponibilidad>("/agendamiento/disponibilidades", payload);
    },
    onSuccess: () => {
      toast.success(form.id ? "Franja actualizada" : "Franja creada");
      qc.invalidateQueries({ queryKey: ["/agendamiento/disponibilidades"] });
      setDialogOpen(false);
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  const del = useMutation({
    mutationFn: async (id: number) => api.delete(`/agendamiento/disponibilidades/${id}`),
    onSuccess: () => {
      toast.success("Franja eliminada");
      qc.invalidateQueries({ queryKey: ["/agendamiento/disponibilidades"] });
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  // Agrupa las franjas por fecha para listar la semana día a día.
  const porDia = useMemo(() => {
    const dias: { fecha: string; items: Disponibilidad[] }[] = [];
    for (let i = 0; i < 7; i++) {
      const fecha = toIsoDate(addDays(lunes, i));
      const items = (franjas.data ?? [])
        .filter((f) => f.fecha === fecha)
        .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
      dias.push({ fecha, items });
    }
    return dias;
  }, [franjas.data, lunes]);

  function abrirCrear(fecha?: string): void {
    setForm({ ...EMPTY_FORM, fecha: fecha ?? desde });
    setDialogOpen(true);
  }

  function abrirEditar(f: Disponibilidad): void {
    setForm({
      id: f.id,
      fecha: f.fecha,
      horaInicio: hhmm(f.horaInicio),
      horaFin: hhmm(f.horaFin),
      modalidad: f.modalidad,
    });
    setDialogOpen(true);
  }

  function submit(): void {
    if (!tutorId) {
      toast.error("Selecciona un docente primero");
      return;
    }
    if (!form.fecha || !form.horaInicio || !form.horaFin) {
      toast.error("Completa fecha y horas");
      return;
    }
    if (form.horaFin <= form.horaInicio) {
      toast.error("La hora de fin debe ser posterior a la de inicio");
      return;
    }
    save.mutate(form);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Disponibilidad de docentes"
        description="Gestiona las franjas horarias en las que cada tutor/docente puede recibir reuniones de acompañamiento. Los estudiantes solo podrán proponer reuniones sobre franjas ACTIVAS."
        icon={CalendarClock}
        actions={
          <Button variant="gradient" disabled={tutorId == null} onClick={() => abrirCrear()}>
            <Plus className="h-4 w-4" /> Nueva franja
          </Button>
        }
      />

      <Card>
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="w-full sm:max-w-sm">
            <Label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Docente / tutor
            </Label>
            <Combobox
              items={tutores.data ?? []}
              value={tutorId}
              onChange={(v) => setTutorId(v)}
              placeholder="Selecciona un docente"
              searchPlaceholder="Buscar docente..."
              getKey={(t) => t.id}
              getLabel={(t) => `${t.nombres} ${t.apellidos}`}
              getSecondary={(t) => t.email}
              allowClear
            />
          </div>
          <div className="flex items-center justify-between gap-2 sm:justify-end">
            <Button variant="outline" size="icon" onClick={() => setLunes((d) => addWeeks(d, -1))} aria-label="Semana anterior">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-[160px] text-center text-sm font-semibold capitalize">
              {etiquetaSemana(lunes)}
            </div>
            <Button variant="outline" size="icon" onClick={() => setLunes((d) => addWeeks(d, 1))} aria-label="Semana siguiente">
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setLunes(inicioSemana(new Date()))}>
              Hoy
            </Button>
          </div>
        </CardContent>
      </Card>

      {tutorId == null ? (
        <EmptyState
          icon={CalendarClock}
          title="Selecciona un docente"
          description="Elige un tutor/docente para ver y gestionar sus franjas de disponibilidad por semana."
        />
      ) : franjas.isLoading ? (
        <div className="flex items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card p-12 text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" /> Cargando franjas...
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {porDia.map((dia) => (
            <Card key={dia.fecha} className="flex flex-col">
              <CardContent className="flex flex-1 flex-col gap-2 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold capitalize">{fechaLarga(dia.fecha)}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => abrirCrear(dia.fecha)}
                    aria-label="Agregar franja a este día"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {dia.items.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border/70 p-3 text-center text-xs text-muted-foreground">
                    Sin franjas
                  </p>
                ) : (
                  <div className="space-y-2">
                    {dia.items.map((f) => (
                      <FranjaItem
                        key={f.id}
                        franja={f}
                        onEdit={() => abrirEditar(f)}
                        onDelete={() => del.mutate(f.id)}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{form.id ? "Editar franja" : "Nueva franja de disponibilidad"}</DialogTitle>
            <DialogDescription>
              Define la fecha, el rango horario y la modalidad de la franja.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="fecha">Fecha</Label>
              <Input
                id="fecha"
                type="date"
                value={form.fecha}
                onChange={(e) => setForm((s) => ({ ...s, fecha: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="horaInicio">Hora inicio</Label>
                <Input
                  id="horaInicio"
                  type="time"
                  value={form.horaInicio}
                  onChange={(e) => setForm((s) => ({ ...s, horaInicio: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="horaFin">Hora fin</Label>
                <Input
                  id="horaFin"
                  type="time"
                  value={form.horaFin}
                  onChange={(e) => setForm((s) => ({ ...s, horaFin: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Modalidad</Label>
              <Select
                value={form.modalidad}
                onValueChange={(v) => setForm((s) => ({ ...s, modalidad: v as ModalidadAgenda }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PRESENCIAL">Presencial</SelectItem>
                  <SelectItem value="VIRTUAL">Virtual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={submit} disabled={save.isPending}>
              {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FranjaItem({
  franja,
  onEdit,
  onDelete,
}: {
  franja: Disponibilidad;
  onEdit: () => void;
  onDelete: () => void;
}): JSX.Element {
  const ocupada = franja.estado === "OCUPADA";
  return (
    <div
      className={
        "rounded-lg border p-2 text-sm " +
        (ocupada ? "border-warning/40 bg-warning/5" : "border-success/40 bg-success/5")
      }
    >
      <div className="flex items-center justify-between gap-1">
        <span className="inline-flex items-center gap-1 font-medium">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          {hhmm(franja.horaInicio)}–{hhmm(franja.horaFin)}
        </span>
        <StatusBadge kind="disponibilidad" value={franja.estado} />
      </div>
      <div className="mt-1 flex items-center justify-between">
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          {franja.modalidad === "VIRTUAL" ? (
            <Video className="h-3 w-3" />
          ) : (
            <MapPin className="h-3 w-3" />
          )}
          {franja.modalidad === "VIRTUAL" ? "Virtual" : "Presencial"}
        </span>
        <div className="flex gap-0.5">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onEdit} aria-label="Editar franja">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                disabled={ocupada}
                aria-label="Eliminar franja"
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar franja?</AlertDialogTitle>
                <AlertDialogDescription>
                  Se eliminará la franja {hhmm(franja.horaInicio)}–{hhmm(franja.horaFin)}.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete}>Eliminar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
