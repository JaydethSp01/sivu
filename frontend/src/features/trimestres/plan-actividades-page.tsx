import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, ArrowLeft, Download, Loader2, PenLine, Plus, Save, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { api, extractApiMessage } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { ESTADO_PA_LABELS } from "@/lib/enum-labels";
import type {
  ParteFirmaTrimestre,
  PlanActividadesMes,
  PlanActividadesObjetivo,
  PlanActividadesRequest,
  PlanActividadesResponse,
} from "@/lib/types";

function downloadPdf(url: string, filename: string): Promise<void> {
  return api.get(url, { responseType: "blob" }).then((res) => {
    const blob = new Blob([res.data as BlobPart], { type: "application/pdf" });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
  });
}

const MESES_LABELS: Record<number, string> = {
  1: "Mes 1", 2: "Mes 2", 3: "Mes 3", 4: "Mes 4", 5: "Mes 5", 6: "Mes 6",
};

/**
 * Objetivos de aprendizaje predefinidos por programa académico.
 * Tomados del formato GAC-FM-10 v2.0 — Ingeniería de Software.
 * Si Coformación abre el formato a otros programas, se agregan aquí
 * o se migra a un catálogo configurable en backend.
 */
const OBJETIVOS_PREDEFINIDOS_ING_SW: { escenario: string; descripcion: string }[] = [
  { escenario: "Área de IT", descripcion: "Diseñar una web estática mediante el uso de las herramientas básicas." },
  { escenario: "Área de IT", descripcion: "Aplicar los requerimientos funcionales y no funcionales al diseño de la interfaz de usuario y la interactividad del mismo." },
  { escenario: "Área de IT", descripcion: "Conocer y aplicar los procesos básicos de diseño UI/UX." },
  { escenario: "Área de IT", descripcion: "Conocer las diferencias básicas entre los diferentes sistemas operativos y sus implicaciones de diseño y desarrollo." },
  { escenario: "Área de IT", descripcion: "Desarrollar pruebas de software al interior de su entorno empresarial." },
  { escenario: "Área de IT", descripcion: "Diseñar y desarrollar videojuegos funcionales y escalables aplicando principios de programación, diseño centrado en el usuario y estándares de la industria." },
  { escenario: "Área de IT", descripcion: "Implementar gráficos, modelado y mecánicas innovadoras utilizando herramientas y motores de desarrollo especializados." },
  { escenario: "Área de IT", descripcion: "Gestionar proyectos de videojuegos en equipos interdisciplinarios mediante metodologías ágiles, desde la conceptualización hasta la implementación." },
  { escenario: "Área de IT", descripcion: "Optimizar la experiencia del usuario y el rendimiento técnico mediante pruebas funcionales, retroalimentación iterativa y el uso de inteligencia artificial." },
];

const DISCLAIMER_ACTIVIDADES_NO_PERMITIDAS =
  "Dentro de los objetivos de aprendizaje no se contemplan actividades como mensajería, " +
  "consignaciones, actividades de aseo y servicios generales, favores personales y " +
  "actividades de seguridad del establecimiento de comercio. Por tal razón, le solicitamos " +
  "abstenerse de asignar estas responsabilidades al estudiante.";

export function PlanActividadesPage(): JSX.Element {
  const { trimestreId, convenioId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const hasRole = useAuthStore((s) => s.hasRole);
  const canEdit = hasRole("ESTUDIANTE", "COORDINADOR", "ADMIN");

  const [escenario, setEscenario] = useState("");
  const [pemDesc, setPemDesc] = useState("");
  const [pemObj, setPemObj] = useState("");
  const [objetivos, setObjetivos] = useState<PlanActividadesObjetivo[]>([]);
  const [meses, setMeses] = useState<PlanActividadesMes[]>([]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["/trimestres/pa", trimestreId],
    enabled: !!trimestreId,
    retry: false,
    queryFn: async () =>
      (await api.get<PlanActividadesResponse>(`/trimestres/${trimestreId}/plan-actividades`)).data,
  });

  useEffect(() => {
    if (data) {
      setEscenario(data.escenarioCoformacion ?? "");
      setPemDesc(data.pemDescripcionEscenario ?? "");
      setPemObj(data.pemObjetivoGeneral ?? "");
      setObjetivos(data.objetivos.map((o) => ({ ...o })));
      setMeses(data.meses.map((m) => ({ ...m })));
    } else if (error) {
      // Si no existe el PA aún (por ejemplo trimestre creado sin auto-PA), iniciar en blanco.
      setEscenario("");
      setPemDesc("");
      setPemObj("");
      setObjetivos([]);
      setMeses([]);
    }
  }, [data, error]);

  const guardar = useMutation({
    mutationFn: async () => {
      const payload: PlanActividadesRequest = {
        escenarioCoformacion: escenario || null,
        pemDescripcionEscenario: pemDesc || null,
        pemObjetivoGeneral: pemObj || null,
        objetivos: objetivos.map((o, i) => ({
          ...o,
          orden: o.orden ?? i,
          seleccionado: o.seleccionado ?? true,
        })),
        meses,
      };
      return api.put<PlanActividadesResponse>(
        `/trimestres/${trimestreId}/plan-actividades`,
        payload
      );
    },
    onSuccess: () => {
      toast.success("Plan de Actividades guardado");
      qc.invalidateQueries({ queryKey: ["/trimestres/pa", trimestreId] });
      qc.invalidateQueries({ queryKey: ["/convenios/trimestres", Number(convenioId)] });
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  const firmar = useMutation({
    mutationFn: async (parte: ParteFirmaTrimestre) =>
      api.patch<PlanActividadesResponse>(
        `/trimestres/${trimestreId}/plan-actividades/firmar/${parte}`
      ),
    onSuccess: (_, parte) => {
      toast.success(`Firmado como ${parte.toLowerCase()}`);
      qc.invalidateQueries({ queryKey: ["/trimestres/pa", trimestreId] });
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  const descargar = useMutation({
    mutationFn: async () =>
      downloadPdf(`/trimestres/${trimestreId}/plan-actividades/pdf`, `pa-t${trimestreId}.pdf`),
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  if (isLoading) {
    return (
      <div className="flex items-center text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />Cargando...
      </div>
    );
  }

  const addObjetivo = () => setObjetivos((p) => [...p, { descripcion: "", seleccionado: true, escenario: "" }]);
  const updateObjetivo = (idx: number, patch: Partial<PlanActividadesObjetivo>) =>
    setObjetivos((p) => p.map((o, i) => (i === idx ? { ...o, ...patch } : o)));
  const removeObjetivo = (idx: number) => setObjetivos((p) => p.filter((_, i) => i !== idx));
  const cargarObjetivosPredefinidos = () => {
    // Si ya hay objetivos, los conserva y agrega los predefinidos que no estén
    setObjetivos((prev) => {
      const yaPresentes = new Set(prev.map((o) => o.descripcion.trim().toLowerCase()));
      const nuevos = OBJETIVOS_PREDEFINIDOS_ING_SW.filter(
        (p) => !yaPresentes.has(p.descripcion.trim().toLowerCase())
      ).map((p) => ({ ...p, seleccionado: false }));
      return [...prev, ...nuevos];
    });
  };

  const addMes = () => {
    const usados = new Set(meses.map((m) => m.mes));
    const libre = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].find((m) => !usados.has(m)) ?? 1;
    setMeses((p) => [...p, { mes: libre, areaRotacion: "", actividades: "", tutorNombre: "" }]);
  };
  const updateMes = (idx: number, patch: Partial<PlanActividadesMes>) =>
    setMeses((p) => p.map((m, i) => (i === idx ? { ...m, ...patch } : m)));
  const removeMes = (idx: number) => setMeses((p) => p.filter((_, i) => i !== idx));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/convenios/${convenioId}`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Plan de Actividades (GAC-FM-10)</h1>
            <p className="text-sm text-muted-foreground">
              Trimestre #{trimestreId}
              {data && (
                <> · Estado: <Badge variant="secondary">{ESTADO_PA_LABELS[data.estado]}</Badge></>
              )}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {data && (
            <Button variant="outline" onClick={() => descargar.mutate()} disabled={descargar.isPending}>
              {descargar.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Descargar PA (PDF)
            </Button>
          )}
          {canEdit && (
            <Button onClick={() => guardar.mutate()} disabled={guardar.isPending}>
              {guardar.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Guardar
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Identificación del Plan Especial de Mejora (PEM)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label>Escenario de coformación</Label>
            <Input value={escenario} onChange={(e) => setEscenario(e.target.value)} placeholder="Ej: Área de IT, Efecty" disabled={!canEdit} />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <Label>Descripción del escenario</Label>
              <Textarea rows={4} value={pemDesc} onChange={(e) => setPemDesc(e.target.value)} disabled={!canEdit} />
            </div>
            <div className="space-y-1">
              <Label>Objetivo general del PEM</Label>
              <Textarea rows={4} value={pemObj} onChange={(e) => setPemObj(e.target.value)} disabled={!canEdit} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <CardTitle>Objetivos de aprendizaje fase empresarial</CardTitle>
              <CardDescription>
                Selecciona los objetivos del programa que aplicarán a tu práctica. Puedes agregar otros propios si la empresa lo requiere.
              </CardDescription>
            </div>
            {canEdit && (
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={cargarObjetivosPredefinidos} title="Carga los 9 objetivos del programa Ingeniería de Software del formato GAC-FM-10">
                  <Sparkles className="h-4 w-4" /> Cargar objetivos del programa
                </Button>
                <Button size="sm" onClick={addObjetivo}>
                  <Plus className="h-4 w-4" /> Agregar uno
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {objetivos.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Sin objetivos. Empieza con "Cargar objetivos del programa" para tener el checklist completo y marcar los que aplican.
            </p>
          )}
          {objetivos.map((o, idx) => (
            <div key={idx} className="rounded-md border p-3 space-y-2">
              <div className="grid gap-2 sm:grid-cols-[1fr_3fr_auto]">
                <Input
                  value={o.escenario ?? ""}
                  onChange={(e) => updateObjetivo(idx, { escenario: e.target.value })}
                  placeholder="Escenario"
                  disabled={!canEdit}
                />
                <Input
                  value={o.descripcion}
                  onChange={(e) => updateObjetivo(idx, { descripcion: e.target.value })}
                  placeholder="Descripción del objetivo"
                  disabled={!canEdit}
                />
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1 text-sm">
                    <input
                      type="checkbox"
                      checked={o.seleccionado}
                      onChange={(e) => updateObjetivo(idx, { seleccionado: e.target.checked })}
                      disabled={!canEdit}
                    />
                    Seleccionado
                  </label>
                  {canEdit && (
                    <Button size="icon" variant="ghost" onClick={() => removeObjetivo(idx)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}

          <div className="mt-4 rounded-lg border border-warning/40 bg-warning-soft p-3 text-xs flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
            <div>
              <strong className="text-warning">Información importante:</strong>{" "}
              {DISCLAIMER_ACTIVIDADES_NO_PERMITIDAS}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Plan de actividades mensual</CardTitle>
            {canEdit && (
              <Button size="sm" onClick={addMes}>
                <Plus className="h-4 w-4" /> Agregar mes
              </Button>
            )}
          </div>
          <CardDescription>Una fila por mes con su área de rotación, actividades y tutor.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {meses.length === 0 && (
            <p className="text-sm text-muted-foreground">Sin plan mensual.</p>
          )}
          {meses.map((m, idx) => (
            <div key={idx} className="rounded-md border p-3 space-y-2">
              <div className="grid gap-2 md:grid-cols-[100px_1fr_2fr_1fr_auto]">
                <Input
                  type="number"
                  min={1}
                  max={12}
                  value={m.mes}
                  onChange={(e) => updateMes(idx, { mes: Number(e.target.value) })}
                  disabled={!canEdit}
                />
                <Input
                  value={m.areaRotacion ?? ""}
                  onChange={(e) => updateMes(idx, { areaRotacion: e.target.value })}
                  placeholder="Área de rotación"
                  disabled={!canEdit}
                />
                <Textarea
                  rows={2}
                  value={m.actividades ?? ""}
                  onChange={(e) => updateMes(idx, { actividades: e.target.value })}
                  placeholder="Actividades"
                  disabled={!canEdit}
                />
                <Input
                  value={m.tutorNombre ?? ""}
                  onChange={(e) => updateMes(idx, { tutorNombre: e.target.value })}
                  placeholder="Tutor"
                  disabled={!canEdit}
                />
                {canEdit && (
                  <Button size="icon" variant="ghost" onClick={() => removeMes(idx)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {m.mes >= 1 && m.mes <= 6 ? MESES_LABELS[m.mes] : ""}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {data && (
        <Card>
          <CardHeader>
            <CardTitle>Firmas</CardTitle>
            <CardDescription>
              Cuando las 3 partes firmen, el PA pasa a APROBADO_PROFESOR.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3">
              <FirmaButton firmado={data.firmadoEstudiante} parte="ESTUDIANTE" titulo="Estudiante" disabled={firmar.isPending} onSign={(p) => firmar.mutate(p)} />
              <FirmaButton firmado={data.firmadoTutor} parte="TUTOR" titulo="Tutor empresarial" disabled={firmar.isPending} onSign={(p) => firmar.mutate(p)} />
              <FirmaButton firmado={data.firmadoProfesor} parte="PROFESOR" titulo="Profesor" disabled={firmar.isPending} onSign={(p) => firmar.mutate(p)} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function FirmaButton({ firmado, parte, titulo, disabled, onSign }: {
  firmado: boolean;
  parte: ParteFirmaTrimestre;
  titulo: string;
  disabled: boolean;
  onSign: (p: ParteFirmaTrimestre) => void;
}): JSX.Element {
  if (firmado) {
    return (
      <div className="rounded-md border border-success/50 bg-success/10 px-3 py-3 text-success font-medium text-sm text-center">
        {titulo} · Firmado
      </div>
    );
  }
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button className="w-full" disabled={disabled}>
          <PenLine className="h-4 w-4" /> Firmar como {titulo.toLowerCase()}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Firmar como {titulo.toLowerCase()}</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción es irreversible. Confirma que has revisado el documento.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={(e) => { e.preventDefault(); onSign(parte); }}>
            Confirmar firma
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
