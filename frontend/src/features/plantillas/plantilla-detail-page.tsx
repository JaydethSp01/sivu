import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  FileCog,
  GripVertical,
  Loader2,
  Pencil,
  Plus,
  Save,
  Send,
  Trash2,
} from "lucide-react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/page-header";
import { api, extractApiMessage } from "@/lib/api";
import { TIPO_CAMPO_LABELS, TIPO_PLANTILLA_LABELS } from "@/lib/enum-labels";
import type {
  CriterioPlantilla,
  CriterioRequest,
  PlantillaFormulario,
  SeccionPlantilla,
  SeccionRequest,
  TipoCampo,
} from "@/lib/types";

export function PlantillaDetailPage(): JSX.Element {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["/plantillas", id],
    enabled: !!id,
    queryFn: async () => (await api.get<PlantillaFormulario>(`/plantillas/${id}`)).data,
  });

  const marcarVigente = useMutation({
    mutationFn: async () => api.post(`/plantillas/${id}/vigente`),
    onSuccess: () => {
      toast.success("Plantilla marcada como vigente");
      qc.invalidateQueries({ queryKey: ["/plantillas"] });
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  const agregarSeccion = useMutation({
    mutationFn: async (req: SeccionRequest) =>
      api.post(`/plantillas/${id}/secciones`, req),
    onSuccess: () => {
      toast.success("Sección agregada");
      qc.invalidateQueries({ queryKey: ["/plantillas", id] });
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  const eliminarSeccion = useMutation({
    mutationFn: async (seccionId: number) =>
      api.delete(`/plantillas/secciones/${seccionId}`),
    onSuccess: () => {
      toast.success("Sección eliminada");
      qc.invalidateQueries({ queryKey: ["/plantillas", id] });
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  const agregarCriterio = useMutation({
    mutationFn: async ({ seccionId, req }: { seccionId: number; req: CriterioRequest }) =>
      api.post(`/plantillas/secciones/${seccionId}/criterios`, req),
    onSuccess: () => {
      toast.success("Criterio agregado");
      qc.invalidateQueries({ queryKey: ["/plantillas", id] });
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  const eliminarCriterio = useMutation({
    mutationFn: async (criterioId: number) =>
      api.delete(`/plantillas/criterios/${criterioId}`),
    onSuccess: () => {
      toast.success("Criterio eliminado");
      qc.invalidateQueries({ queryKey: ["/plantillas", id] });
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  const reordenarSecciones = useMutation({
    mutationFn: async (ids: number[]) =>
      api.post(`/plantillas/${id}/secciones/reordenar`, { ids }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/plantillas", id] }),
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  const reordenarCriterios = useMutation({
    mutationFn: async ({ seccionId, ids }: { seccionId: number; ids: number[] }) =>
      api.post(`/plantillas/secciones/${seccionId}/criterios/reordenar`, { ids }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/plantillas", id] }),
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  if (isLoading || !data) {
    return (
      <div className="flex items-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando plantilla...
      </div>
    );
  }

  const onDragEndSecciones = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = data.secciones.findIndex((s) => s.id === active.id);
    const newIndex = data.secciones.findIndex((s) => s.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const nuevos = arrayMove(data.secciones, oldIndex, newIndex);
    reordenarSecciones.mutate(nuevos.map((s) => s.id));
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={`${data.codigo} · v${data.version}`}
        description={`${TIPO_PLANTILLA_LABELS[data.tipo] ?? data.tipo} — ${data.nombre}`}
        icon={FileCog}
        badge={data.vigente ? <Badge variant="success">Vigente</Badge> : null}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate("/plantillas")}>
              <ArrowLeft className="h-4 w-4" /> Volver
            </Button>
            <AsignarDialog plantilla={data} />
            {!data.vigente && (
              <Button onClick={() => marcarVigente.mutate()} variant="gradient">
                <CheckCircle2 className="h-4 w-4" /> Marcar vigente
              </Button>
            )}
          </div>
        }
      />

      {data.vigente && (
        <Card className="border-emerald-500/40 bg-emerald-500/5">
          <CardContent className="pt-5 text-sm flex items-start gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-emerald-700 dark:text-emerald-400">
                Plantilla vigente
              </strong>
              <p className="text-muted-foreground mt-0.5">
                No puedes editar criterios ni pesos ni reordenar. Crea una nueva versión si necesitas cambios.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEndSecciones}>
        <SortableContext
          items={data.secciones.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {data.secciones.map((s) => (
              <SeccionCard
                key={s.id}
                seccion={s}
                editable={!data.vigente}
                onDeleteSeccion={() => eliminarSeccion.mutate(s.id)}
                onAddCriterio={(req) => agregarCriterio.mutate({ seccionId: s.id, req })}
                onDeleteCriterio={(critId) => eliminarCriterio.mutate(critId)}
                onReorderCriterios={(ids) => reordenarCriterios.mutate({ seccionId: s.id, ids })}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {!data.vigente && (
        <AgregarSeccionCard onAdd={(req) => agregarSeccion.mutate(req)} />
      )}

      <Card>
        <CardContent className="pt-5">
          <div className="text-xs text-muted-foreground">
            Creada por <strong>{data.creadoPorNombre ?? "Sistema"}</strong>
            {data.fechaVigencia ? " · Vigencia: " + data.fechaVigencia : ""}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function porcentaje(v: number | string | null | undefined): string {
  if (v == null) return "";
  const n = Number(v);
  return Math.round(n * 100) + "%";
}

interface SeccionCardProps {
  seccion: SeccionPlantilla;
  editable: boolean;
  onDeleteSeccion: () => void;
  onAddCriterio: (req: CriterioRequest) => void;
  onDeleteCriterio: (criterioId: number) => void;
  onReorderCriterios: (ids: number[]) => void;
}

function SeccionCard({
  seccion,
  editable,
  onDeleteSeccion,
  onAddCriterio,
  onDeleteCriterio,
  onReorderCriterios,
}: SeccionCardProps): JSX.Element {
  const sortable = useSortable({ id: seccion.id, disabled: !editable });
  const style = {
    transform: CSS.Transform.toString(sortable.transform),
    transition: sortable.transition,
  };

  const [nuevoDesc, setNuevoDesc] = useState("");
  const [nuevoTipo, setNuevoTipo] = useState<TipoCampo>("NUMBER");
  const [nuevoOpciones, setNuevoOpciones] = useState("");
  const [nuevoPeso, setNuevoPeso] = useState("");

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const onDragEndCriterios = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = seccion.criterios.findIndex((c) => c.id === active.id);
    const newIndex = seccion.criterios.findIndex((c) => c.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const nuevos = arrayMove(seccion.criterios, oldIndex, newIndex);
    onReorderCriterios(nuevos.map((c) => c.id));
  };

  return (
    <Card ref={sortable.setNodeRef} style={style}>
      <CardContent className="pt-5 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex items-start gap-2 min-w-0">
            {editable && (
              <button
                type="button"
                className="mt-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
                {...sortable.attributes}
                {...sortable.listeners}
                aria-label="Arrastrar sección"
              >
                <GripVertical className="h-4 w-4" />
              </button>
            )}
            <div>
              <div className="font-display text-base font-bold tracking-tight">
                {seccion.titulo}
                {seccion.peso != null && (
                  <span className="ml-2 text-sm text-muted-foreground font-normal">
                    ({porcentaje(seccion.peso)})
                  </span>
                )}
              </div>
              {seccion.descripcion && (
                <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
                  {seccion.descripcion}
                </p>
              )}
            </div>
          </div>
          {editable && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="ghost">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar la sección "{seccion.titulo}"?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esto elimina la sección y todos sus criterios.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={onDeleteSeccion}>Eliminar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEndCriterios}>
          <SortableContext
            items={seccion.criterios.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="space-y-1.5">
              {seccion.criterios.length === 0 && (
                <li className="text-xs text-muted-foreground">Sin criterios en esta sección.</li>
              )}
              {seccion.criterios.map((c) => (
                <CriterioItem
                  key={c.id}
                  criterio={c}
                  editable={editable}
                  onDelete={() => onDeleteCriterio(c.id)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>

        {editable && (
          <div className="space-y-2 rounded-md border border-dashed p-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Agregar criterio
            </div>
            <Input
              value={nuevoDesc}
              onChange={(e) => setNuevoDesc(e.target.value)}
              placeholder="Descripción del criterio..."
            />
            <div className="grid gap-2 sm:grid-cols-[1fr_120px_auto]">
              <Select value={nuevoTipo} onValueChange={(v) => setNuevoTipo(v as TipoCampo)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(TIPO_CAMPO_LABELS) as TipoCampo[]).map((t) => (
                    <SelectItem key={t} value={t}>{TIPO_CAMPO_LABELS[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                step="0.01"
                min={0}
                max={1}
                value={nuevoPeso}
                onChange={(e) => setNuevoPeso(e.target.value)}
                placeholder="Peso (0-1)"
              />
              <Button
                size="sm"
                onClick={() => {
                  if (!nuevoDesc.trim()) return;
                  onAddCriterio({
                    descripcion: nuevoDesc.trim(),
                    tipo: nuevoTipo,
                    opciones: nuevoTipo === "SELECT" ? nuevoOpciones.trim() || null : null,
                    peso: nuevoPeso === "" ? null : Number(nuevoPeso),
                  });
                  setNuevoDesc("");
                  setNuevoOpciones("");
                  setNuevoPeso("");
                  setNuevoTipo("NUMBER");
                }}
              >
                <Plus className="h-4 w-4" /> Agregar
              </Button>
            </div>
            {nuevoTipo === "SELECT" && (
              <Input
                value={nuevoOpciones}
                onChange={(e) => setNuevoOpciones(e.target.value)}
                placeholder="Opciones separadas por coma — ej: INICIO, MITAD, CIERRE"
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface CriterioItemProps {
  criterio: CriterioPlantilla;
  editable: boolean;
  onDelete: () => void;
}

function CriterioItem({ criterio: c, editable, onDelete }: CriterioItemProps): JSX.Element {
  const sortable = useSortable({ id: c.id, disabled: !editable });
  const style = {
    transform: CSS.Transform.toString(sortable.transform),
    transition: sortable.transition,
  };
  return (
    <li
      ref={sortable.setNodeRef}
      style={style}
      className="flex items-start justify-between gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm"
    >
      <div className="flex items-start gap-2 min-w-0">
        {editable && (
          <button
            type="button"
            className="mt-0.5 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground shrink-0"
            {...sortable.attributes}
            {...sortable.listeners}
            aria-label="Arrastrar criterio"
          >
            <GripVertical className="h-4 w-4" />
          </button>
        )}
        <div className="min-w-0">
          <div className="font-medium">{c.descripcion}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5 inline-flex flex-wrap items-center gap-1.5">
            <Badge variant="muted" className="text-[10px] font-normal py-0">
              {TIPO_CAMPO_LABELS[c.tipo] ?? c.tipo}
            </Badge>
            {c.peso != null && <span>· {Math.round(Number(c.peso) * 100)}%</span>}
            {c.tipo === "SELECT" && c.opciones && (
              <span>· Opciones: {c.opciones}</span>
            )}
          </div>
        </div>
      </div>
      {editable && (
        <Button
          size="icon"
          variant="ghost"
          onClick={onDelete}
          aria-label="Eliminar criterio"
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      )}
    </li>
  );
}

function AgregarSeccionCard({
  onAdd,
}: {
  onAdd: (req: SeccionRequest) => void;
}): JSX.Element {
  const [titulo, setTitulo] = useState("");
  const [peso, setPeso] = useState("");
  return (
    <Card className="border-dashed">
      <CardContent className="pt-5 space-y-3">
        <div className="flex items-center gap-2">
          <Pencil className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Agregar sección</span>
        </div>
        <div className="grid gap-2 sm:grid-cols-[1fr_140px_auto]">
          <Input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Título de la sección"
          />
          <Input
            type="number"
            step="0.01"
            min={0}
            max={1}
            value={peso}
            onChange={(e) => setPeso(e.target.value)}
            placeholder="Peso (0–1)"
          />
          <Button
            onClick={() => {
              if (!titulo.trim()) return;
              onAdd({
                titulo: titulo.trim(),
                peso: peso === "" ? null : Number(peso),
              });
              setTitulo("");
              setPeso("");
            }}
          >
            <Plus className="h-4 w-4" /> Agregar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AsignarDialog({ plantilla }: { plantilla: PlantillaFormulario }): JSX.Element {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [asignadoNombre, setAsignadoNombre] = useState("");
  const [asignadoRol, setAsignadoRol] = useState("ESTUDIANTE");
  const [fechaLimite, setFechaLimite] = useState("");

  const asignar = useMutation({
    mutationFn: async () =>
      api.post("/respuestas-formulario", {
        plantillaId: plantilla.id,
        asignadoANombre: asignadoNombre || null,
        asignadoARol: asignadoRol,
        fechaLimite: fechaLimite || null,
      }),
    onSuccess: () => {
      toast.success("Formulario asignado");
      qc.invalidateQueries({ queryKey: ["/respuestas-formulario"] });
      setOpen(false);
      setAsignadoNombre("");
      setFechaLimite("");
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={!plantilla.vigente}>
          <Send className="h-4 w-4" /> Asignar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Asignar formulario</DialogTitle>
          <DialogDescription>
            Asigna esta plantilla a alguien para que la llene.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Nombre del asignado</Label>
            <Input
              value={asignadoNombre}
              onChange={(e) => setAsignadoNombre(e.target.value)}
              placeholder="Ej: Omaira Parra"
            />
          </div>
          <div>
            <Label>Rol</Label>
            <Select value={asignadoRol} onValueChange={setAsignadoRol}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ESTUDIANTE">Estudiante</SelectItem>
                <SelectItem value="TUTOR_EMPRESARIAL">Tutor empresarial</SelectItem>
                <SelectItem value="PROFESOR">Profesor acompañante</SelectItem>
                <SelectItem value="EMPRESA">Empresa</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Fecha límite (opcional)</Label>
            <Input
              type="date"
              value={fechaLimite}
              onChange={(e) => setFechaLimite(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => asignar.mutate()}
            disabled={asignar.isPending}
            variant="gradient"
          >
            {asignar.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Asignar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
