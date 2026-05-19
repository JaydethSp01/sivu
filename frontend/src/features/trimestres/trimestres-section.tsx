import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Plus, BookOpen, FileText, NotebookPen, ListChecks, ClipboardCheck, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuthStore } from "@/lib/auth-store";
import { api, extractApiMessage } from "@/lib/api";
import { ESTADO_PA_LABELS, ESTADO_TRIMESTRE_LABELS } from "@/lib/enum-labels";
import type { TrimestreResponse, TrimestreRequest, EstadoTrimestre, PlanActividadesResponse } from "@/lib/types";

interface Props {
  convenioId: number;
}

const NUMEROS: Array<{ value: 1 | 2 | 3; label: string }> = [
  { value: 1, label: "Trimestre 1" },
  { value: 2, label: "Trimestre 2" },
  { value: 3, label: "Trimestre 3" },
];

function NuevoTrimestreDialog({ convenioId, existentes, onCreated }: { convenioId: number; existentes: number[]; onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [numero, setNumero] = useState<1 | 2 | 3>((() => {
    const libre = NUMEROS.find((n) => !existentes.includes(n.value));
    return libre?.value ?? 1;
  })());
  const [materia, setMateria] = useState("");
  const [inicio, setInicio] = useState("");
  const [fin, setFin] = useState("");
  const [estado, setEstado] = useState<EstadoTrimestre>("ABIERTO");

  const mut = useMutation({
    mutationFn: async () => {
      const payload: TrimestreRequest = {
        numero,
        materiaNucleo: materia,
        fechaInicio: inicio || null,
        fechaFin: fin || null,
        estado,
      };
      return api.post<TrimestreResponse>(`/convenios/${convenioId}/trimestres`, payload);
    },
    onSuccess: () => {
      toast.success("Trimestre creado");
      setOpen(false);
      onCreated();
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  const libres = NUMEROS.filter((n) => !existentes.includes(n.value));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" disabled={libres.length === 0}>
          <Plus className="h-4 w-4" /> Crear trimestre
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo trimestre</DialogTitle>
          <DialogDescription>
            Crea un trimestre nuevo para este convenio. Se generará un Plan de Actividades en BORRADOR automáticamente.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Número de trimestre</Label>
            <Select value={String(numero)} onValueChange={(v) => setNumero(Number(v) as 1 | 2 | 3)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {libres.map((n) => (
                  <SelectItem key={n.value} value={String(n.value)}>{n.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Materia núcleo</Label>
            <Input value={materia} onChange={(e) => setMateria(e.target.value)} placeholder="Ej: Gestión de proyectos" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label>Fecha inicio</Label>
              <Input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Fecha fin</Label>
              <Input type="date" value={fin} onChange={(e) => setFin(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Estado</Label>
            <Select value={estado} onValueChange={(v) => setEstado(v as EstadoTrimestre)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(ESTADO_TRIMESTRE_LABELS) as EstadoTrimestre[]).map((k) => (
                  <SelectItem key={k} value={k}>{ESTADO_TRIMESTRE_LABELS[k]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button
            onClick={() => mut.mutate()}
            disabled={mut.isPending || !materia.trim() || libres.length === 0}
          >
            {mut.isPending && <Loader2 className="h-4 w-4 animate-spin" />}Crear
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PaBadge({ trimestreId }: { trimestreId: number }): JSX.Element | null {
  const { data } = useQuery({
    queryKey: ["/trimestres/pa", trimestreId],
    queryFn: async () => (await api.get<PlanActividadesResponse>(`/trimestres/${trimestreId}/plan-actividades`)).data,
    retry: false,
  });
  if (!data) return null;
  return <Badge variant="outline">PA: {ESTADO_PA_LABELS[data.estado]}</Badge>;
}

function TrimestreCard({ t, convenioId }: { t: TrimestreResponse; convenioId: number }): JSX.Element {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="flex flex-wrap items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Trimestre {t.numero} — {t.materiaNucleo}
              <Badge variant="secondary">{ESTADO_TRIMESTRE_LABELS[t.estado]}</Badge>
              {t.tienePlanActividades && <PaBadge trimestreId={t.id} />}
            </CardTitle>
            <CardDescription>
              {t.fechaInicio && t.fechaFin
                ? `${t.fechaInicio} → ${t.fechaFin}`
                : "Fechas pendientes de definir"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <Button variant="outline" asChild size="sm">
            <Link to={`/convenios/${convenioId}/trimestres/${t.id}/plan-actividades`}>
              <FileText className="h-4 w-4" /> Plan act.
            </Link>
          </Button>
          <Button variant="outline" asChild size="sm">
            <Link to={`/convenios/${convenioId}/trimestres/${t.id}/actas`}>
              <NotebookPen className="h-4 w-4" /> Actas ({t.totalActas})
            </Link>
          </Button>
          <Button variant="outline" asChild size="sm">
            <Link to={`/convenios/${convenioId}/trimestres/${t.id}/planes-mejora`}>
              <ListChecks className="h-4 w-4" /> PM ({t.totalPlanesMejora})
            </Link>
          </Button>
          <Button variant="outline" asChild size="sm">
            <Link to={`/convenios/${convenioId}/trimestres/${t.id}/evaluacion-tutor`}>
              <ClipboardCheck className="h-4 w-4" /> Eval. Tutor
              {t.tieneEvaluacionTutor && <span className="text-success ml-1">·</span>}
            </Link>
          </Button>
          <Button variant="outline" asChild size="sm">
            <Link to={`/convenios/${convenioId}/trimestres/${t.id}/evaluacion-profesor`}>
              <GraduationCap className="h-4 w-4" /> Eval. Prof.
              {t.tieneEvaluacionProfesor && <span className="text-success ml-1">·</span>}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function TrimestresSection({ convenioId }: Props): JSX.Element {
  const qc = useQueryClient();
  const hasRole = useAuthStore((s) => s.hasRole);
  const canCreate = hasRole("ADMIN", "COORDINADOR");

  const { data, isLoading } = useQuery({
    queryKey: ["/convenios/trimestres", convenioId],
    queryFn: async () =>
      (await api.get<TrimestreResponse[]>(`/convenios/${convenioId}/trimestres`)).data,
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["/convenios/trimestres", convenioId] });
  const existentes = (data ?? []).map((t) => t.numero);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle>Trimestres del convenio</CardTitle>
            <CardDescription>
              Plan de Actividades, Actas, Planes de Mejora y Evaluaciones del trimestre.
            </CardDescription>
          </div>
          {canCreate && <NuevoTrimestreDialog convenioId={convenioId} existentes={existentes} onCreated={refresh} />}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />Cargando trimestres...
          </div>
        ) : (data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aún no hay trimestres registrados. {canCreate ? "Crea el primer trimestre para comenzar." : ""}
          </p>
        ) : (
          <div className="space-y-3">
            {(data ?? []).map((t) => (
              <TrimestreCard key={t.id} t={t} convenioId={convenioId} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
