import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { api, extractApiMessage } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { ESTADO_PM_LABELS } from "@/lib/enum-labels";
import type { EstadoPlanMejora, PlanMejoraRequest, PlanMejoraResponse } from "@/lib/types";

interface DraftPM {
  id?: number;
  numero: 1 | 2;
  titulo: string;
  problema: string;
  objetivo: string;
  actividades: string;
  indicadores: string;
  estado: EstadoPlanMejora;
}

const EMPTY: DraftPM = {
  numero: 1, titulo: "", problema: "", objetivo: "",
  actividades: "", indicadores: "", estado: "BORRADOR",
};

export function PlanesMejoraPage(): JSX.Element {
  const { convenioId, trimestreId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const hasRole = useAuthStore((s) => s.hasRole);
  const canEdit = hasRole("ESTUDIANTE", "COORDINADOR", "ADMIN");
  const canDelete = hasRole("ADMIN", "COORDINADOR");

  const [draft, setDraft] = useState<DraftPM | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["/trimestres/pm", trimestreId],
    queryFn: async () =>
      (await api.get<PlanMejoraResponse[]>(`/trimestres/${trimestreId}/planes-mejora`)).data,
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["/trimestres/pm", trimestreId] });
    qc.invalidateQueries({ queryKey: ["/convenios/trimestres", Number(convenioId)] });
  };

  const save = useMutation({
    mutationFn: async (d: DraftPM) => {
      const payload: PlanMejoraRequest = {
        numero: d.numero,
        titulo: d.titulo,
        problema: d.problema || null,
        objetivo: d.objetivo || null,
        actividades: d.actividades || null,
        indicadores: d.indicadores || null,
        estado: d.estado,
      };
      if (d.id) return api.put<PlanMejoraResponse>(`/planes-mejora/${d.id}`, payload);
      return api.post<PlanMejoraResponse>(`/trimestres/${trimestreId}/planes-mejora`, payload);
    },
    onSuccess: () => {
      toast.success(draft?.id ? "Plan actualizado" : "Plan creado");
      setDraft(null);
      refresh();
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  const eliminar = useMutation({
    mutationFn: async (id: number) => api.delete(`/planes-mejora/${id}`),
    onSuccess: () => {
      toast.success("Plan eliminado");
      refresh();
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  const startNew = () => {
    const usados = new Set((data ?? []).map((p) => p.numero));
    const libre = ([1, 2] as const).find((n) => !usados.has(n)) ?? 1;
    setDraft({ ...EMPTY, numero: libre });
  };
  const startEdit = (p: PlanMejoraResponse) => {
    setDraft({
      id: p.id,
      numero: p.numero as 1 | 2,
      titulo: p.titulo,
      problema: p.problema ?? "",
      objetivo: p.objetivo ?? "",
      actividades: p.actividades ?? "",
      indicadores: p.indicadores ?? "",
      estado: p.estado,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/convenios/${convenioId}`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Planes de Mejora</h1>
            <p className="text-sm text-muted-foreground">Trimestre #{trimestreId} (máx. 2 planes)</p>
          </div>
        </div>
        {canEdit && draft === null && ((data?.length ?? 0) < 2) && (
          <Button onClick={startNew}><Plus className="h-4 w-4" /> Nuevo plan</Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado</CardTitle>
          <CardDescription>Planes Especiales de Mejora del trimestre.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading ? (
            <div className="flex items-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando...
            </div>
          ) : (data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin planes registrados.</p>
          ) : (
            (data ?? []).map((p) => (
              <div key={p.id} className="rounded-md border p-3 flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="font-medium">PM{p.numero}: {p.titulo}</div>
                  <div className="text-xs text-muted-foreground">
                    <Badge variant="outline">{ESTADO_PM_LABELS[p.estado]}</Badge>
                  </div>
                  {p.objetivo && (
                    <div className="text-sm text-muted-foreground mt-1">{p.objetivo}</div>
                  )}
                </div>
                <div className="flex gap-1">
                  {canEdit && <Button size="sm" variant="outline" onClick={() => startEdit(p)}>Editar</Button>}
                  {canDelete && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="icon" variant="ghost"><Trash2 className="h-4 w-4" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Eliminar PM{p.numero}</AlertDialogTitle>
                          <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={(e) => { e.preventDefault(); eliminar.mutate(p.id); }}>
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {draft && (
        <Card>
          <CardHeader>
            <CardTitle>{draft.id ? "Editar plan" : "Nuevo plan"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1">
                <Label>Número</Label>
                <Select value={String(draft.numero)} onValueChange={(v) => setDraft({ ...draft, numero: Number(v) as 1 | 2 })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">PM1</SelectItem>
                    <SelectItem value="2">PM2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2 space-y-1">
                <Label>Título</Label>
                <Input value={draft.titulo} onChange={(e) => setDraft({ ...draft, titulo: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Problema / contexto</Label>
              <Textarea rows={3} value={draft.problema} onChange={(e) => setDraft({ ...draft, problema: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Objetivo general</Label>
              <Textarea rows={3} value={draft.objetivo} onChange={(e) => setDraft({ ...draft, objetivo: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Actividades</Label>
              <Textarea rows={4} value={draft.actividades} onChange={(e) => setDraft({ ...draft, actividades: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Indicadores</Label>
              <Textarea rows={3} value={draft.indicadores} onChange={(e) => setDraft({ ...draft, indicadores: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Estado</Label>
              <Select value={draft.estado} onValueChange={(v) => setDraft({ ...draft, estado: v as EstadoPlanMejora })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(ESTADO_PM_LABELS) as EstadoPlanMejora[]).map((k) => (
                    <SelectItem key={k} value={k}>{ESTADO_PM_LABELS[k]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDraft(null)}>Cancelar</Button>
              <Button onClick={() => save.mutate(draft)} disabled={save.isPending || !draft.titulo.trim()}>
                {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Guardar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
