import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Download, Loader2, PenLine, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { api, extractApiMessage } from "@/lib/api";
import type { EvaluacionTutorRequest, EvaluacionTutorResponse, ParteFirmaTrimestre } from "@/lib/types";

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

interface Form {
  capacidades: string;
  actitudes: string;
  aplicacionDesempeno: string;
  aplicacionElaboracionPem: string;
  aplicacionSustentacionPem: string;
  continuidad: "" | "SI" | "NO";
  observaciones: string;
  fechaElaboracion: string;
}

const EMPTY: Form = {
  capacidades: "",
  actitudes: "",
  aplicacionDesempeno: "",
  aplicacionElaboracionPem: "",
  aplicacionSustentacionPem: "",
  continuidad: "",
  observaciones: "",
  fechaElaboracion: "",
};

function calcularNota(f: Form): number {
  const num = (s: string) => (s === "" ? 0 : Number(s));
  return (
    num(f.capacidades) * 0.4 +
    num(f.actitudes) * 0.4 +
    num(f.aplicacionDesempeno) * 0.1 +
    num(f.aplicacionElaboracionPem) * 0.05 +
    num(f.aplicacionSustentacionPem) * 0.05
  );
}

export function EvaluacionTutorPage(): JSX.Element {
  const { convenioId, trimestreId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState<Form>(EMPTY);

  const { data, error } = useQuery({
    queryKey: ["/trimestres/eval-tutor", trimestreId],
    retry: false,
    queryFn: async () =>
      (await api.get<EvaluacionTutorResponse>(`/trimestres/${trimestreId}/evaluacion-tutor`)).data,
  });

  useEffect(() => {
    if (data) {
      setForm({
        capacidades: data.capacidades != null ? String(data.capacidades) : "",
        actitudes: data.actitudes != null ? String(data.actitudes) : "",
        aplicacionDesempeno: data.aplicacionDesempeno != null ? String(data.aplicacionDesempeno) : "",
        aplicacionElaboracionPem: data.aplicacionElaboracionPem != null ? String(data.aplicacionElaboracionPem) : "",
        aplicacionSustentacionPem: data.aplicacionSustentacionPem != null ? String(data.aplicacionSustentacionPem) : "",
        continuidad: data.continuidadConEmpresa == null ? "" : (data.continuidadConEmpresa ? "SI" : "NO"),
        observaciones: data.observaciones ?? "",
        fechaElaboracion: data.fechaElaboracion ?? "",
      });
    } else if (error) {
      setForm(EMPTY);
    }
  }, [data, error]);

  const nota = useMemo(() => calcularNota(form), [form]);

  const guardar = useMutation({
    mutationFn: async () => {
      const num = (s: string) => (s === "" ? null : Number(s));
      const payload: EvaluacionTutorRequest = {
        capacidades: num(form.capacidades),
        actitudes: num(form.actitudes),
        aplicacionDesempeno: num(form.aplicacionDesempeno),
        aplicacionElaboracionPem: num(form.aplicacionElaboracionPem),
        aplicacionSustentacionPem: num(form.aplicacionSustentacionPem),
        continuidadConEmpresa: form.continuidad === "" ? null : form.continuidad === "SI",
        observaciones: form.observaciones || null,
        fechaElaboracion: form.fechaElaboracion || null,
      };
      return api.put<EvaluacionTutorResponse>(
        `/trimestres/${trimestreId}/evaluacion-tutor`,
        payload
      );
    },
    onSuccess: () => {
      toast.success("Evaluación guardada");
      qc.invalidateQueries({ queryKey: ["/trimestres/eval-tutor", trimestreId] });
      qc.invalidateQueries({ queryKey: ["/convenios/trimestres", Number(convenioId)] });
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  const firmar = useMutation({
    mutationFn: async (parte: ParteFirmaTrimestre) =>
      api.patch<EvaluacionTutorResponse>(
        `/trimestres/${trimestreId}/evaluacion-tutor/firmar/${parte}`
      ),
    onSuccess: () => {
      toast.success("Firma registrada");
      qc.invalidateQueries({ queryKey: ["/trimestres/eval-tutor", trimestreId] });
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  const descargar = useMutation({
    mutationFn: async () =>
      downloadPdf(`/trimestres/${trimestreId}/evaluacion-tutor/pdf`, `eval-tutor-t${trimestreId}.pdf`),
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/convenios/${convenioId}`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Evaluación del Tutor (GAC-FM-007)</h1>
            <p className="text-sm text-muted-foreground">
              Pesos: Capacidades 40% · Actitudes 40% · Aplicación 20% (10/5/5)
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {data && (
            <Button variant="outline" onClick={() => descargar.mutate()} disabled={descargar.isPending}>
              {descargar.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Descargar ET (PDF)
            </Button>
          )}
          <Button onClick={() => guardar.mutate()} disabled={guardar.isPending}>
            {guardar.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Criterios de evaluación</CardTitle>
          <CardDescription>Escala 0-5 (Insuficiente 0-2.9 · Aceptable 3-3.9 · Excelente 4-4.5 · Sobresaliente 4.6-5)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Calif label="1. Capacidades y competencias (40%)" value={form.capacidades} onChange={(v) => setForm({ ...form, capacidades: v })} />
          <Calif label="2. Actitudes y comportamiento (40%)" value={form.actitudes} onChange={(v) => setForm({ ...form, actitudes: v })} />
          <div className="rounded-md border p-3 space-y-2">
            <div className="text-sm font-semibold">3. Aplicación de herramientas (20%)</div>
            <Calif label="3.1 Desempeño aplicación herramientas (10%)" value={form.aplicacionDesempeno} onChange={(v) => setForm({ ...form, aplicacionDesempeno: v })} />
            <Calif label="3.2 Calidad académica elaboración PEM (5%)" value={form.aplicacionElaboracionPem} onChange={(v) => setForm({ ...form, aplicacionElaboracionPem: v })} />
            <Calif label="3.3 Sustentación final PEM (5%)" value={form.aplicacionSustentacionPem} onChange={(v) => setForm({ ...form, aplicacionSustentacionPem: v })} />
          </div>
          <div className="rounded-md border bg-muted/50 p-3">
            <Label>NOTA PONDERADA FINAL (auto)</Label>
            <div className="text-3xl font-bold mt-1">{nota.toFixed(2)}</div>
            {data?.notaPonderada != null && (
              <div className="text-xs text-muted-foreground mt-1">
                Persistida: {Number(data.notaPonderada).toFixed(2)}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Continuidad y observaciones</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label>¿El estudiante tiene continuidad con la empresa?</Label>
            <div className="flex gap-3">
              <label className="flex items-center gap-1 text-sm">
                <input type="radio" checked={form.continuidad === "SI"} onChange={() => setForm({ ...form, continuidad: "SI" })} />
                Sí
              </label>
              <label className="flex items-center gap-1 text-sm">
                <input type="radio" checked={form.continuidad === "NO"} onChange={() => setForm({ ...form, continuidad: "NO" })} />
                No
              </label>
              <label className="flex items-center gap-1 text-sm">
                <input type="radio" checked={form.continuidad === ""} onChange={() => setForm({ ...form, continuidad: "" })} />
                Sin definir
              </label>
            </div>
          </div>
          <div className="space-y-1">
            <Label>Fecha de elaboración</Label>
            <Input type="date" value={form.fechaElaboracion} onChange={(e) => setForm({ ...form, fechaElaboracion: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Observaciones del proceso</Label>
            <Textarea rows={4} value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} />
          </div>
        </CardContent>
      </Card>

      {data && (
        <Card>
          <CardHeader><CardTitle>Firmas</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              <FirmaButton firmado={data.firmadoTutor} parte="TUTOR" titulo="Tutor empresarial" disabled={firmar.isPending} onSign={(p) => firmar.mutate(p)} />
              <FirmaButton firmado={data.firmadoEstudiante} parte="ESTUDIANTE" titulo="Estudiante" disabled={firmar.isPending} onSign={(p) => firmar.mutate(p)} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Calif({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="grid gap-2 md:grid-cols-[1fr_120px] items-center">
      <Label>{label}</Label>
      <Input type="number" min={0} max={5} step="0.1" value={value} onChange={(e) => onChange(e.target.value)} />
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
          <AlertDialogDescription>Esta acción es irreversible.</AlertDialogDescription>
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
