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
  EvaluacionProfesorRequest,
  EvaluacionProfesorResponse,
  ParteFirmaTrimestre,
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

interface CorteForm {
  capacidades: string;
  actitudes: string;
  aplicacionDesempeno: string;
  aplicacionElaboracionPem: string;
  aplicacionSustentacionPem: string;
  observaciones: string;
  fecha: string;
}

const EMPTY_CORTE: CorteForm = {
  capacidades: "",
  actitudes: "",
  aplicacionDesempeno: "",
  aplicacionElaboracionPem: "",
  aplicacionSustentacionPem: "",
  observaciones: "",
  fecha: "",
};

function calcularNotaCorte(f: CorteForm): number {
  const num = (s: string) => (s === "" ? 0 : Number(s));
  return (
    num(f.capacidades) * 0.1 +
    num(f.actitudes) * 0.1 +
    num(f.aplicacionDesempeno) * 0.2 +
    num(f.aplicacionElaboracionPem) * 0.5 +
    num(f.aplicacionSustentacionPem) * 0.1
  );
}

function corteTieneAlgo(f: CorteForm): boolean {
  return Boolean(
    f.capacidades || f.actitudes || f.aplicacionDesempeno ||
    f.aplicacionElaboracionPem || f.aplicacionSustentacionPem ||
    f.observaciones || f.fecha
  );
}

export function EvaluacionProfesorPage(): JSX.Element {
  const { convenioId, trimestreId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [corte1, setCorte1] = useState<CorteForm>(EMPTY_CORTE);
  const [corte2, setCorte2] = useState<CorteForm>(EMPTY_CORTE);

  const { data, error } = useQuery({
    queryKey: ["/trimestres/eval-prof", trimestreId],
    retry: false,
    queryFn: async () =>
      (await api.get<EvaluacionProfesorResponse>(`/trimestres/${trimestreId}/evaluacion-profesor`)).data,
  });

  useEffect(() => {
    if (data) {
      setCorte1({
        capacidades: data.capacidades != null ? String(data.capacidades) : "",
        actitudes: data.actitudes != null ? String(data.actitudes) : "",
        aplicacionDesempeno: data.aplicacionDesempeno != null ? String(data.aplicacionDesempeno) : "",
        aplicacionElaboracionPem: data.aplicacionElaboracionPem != null ? String(data.aplicacionElaboracionPem) : "",
        aplicacionSustentacionPem: data.aplicacionSustentacionPem != null ? String(data.aplicacionSustentacionPem) : "",
        observaciones: data.observacionesC1 ?? "",
        fecha: data.fechaC1 ?? "",
      });
      setCorte2({
        capacidades: data.capacidadesC2 != null ? String(data.capacidadesC2) : "",
        actitudes: data.actitudesC2 != null ? String(data.actitudesC2) : "",
        aplicacionDesempeno: data.aplicacionDesempenoC2 != null ? String(data.aplicacionDesempenoC2) : "",
        aplicacionElaboracionPem: data.aplicacionElaboracionPemC2 != null ? String(data.aplicacionElaboracionPemC2) : "",
        aplicacionSustentacionPem: data.aplicacionSustentacionPemC2 != null ? String(data.aplicacionSustentacionPemC2) : "",
        observaciones: data.observacionesC2 ?? "",
        fecha: data.fechaC2 ?? "",
      });
    } else if (error) {
      setCorte1(EMPTY_CORTE);
      setCorte2(EMPTY_CORTE);
    }
  }, [data, error]);

  const nota1 = useMemo(() => calcularNotaCorte(corte1), [corte1]);
  const nota2 = useMemo(() => calcularNotaCorte(corte2), [corte2]);
  const notaFinal = useMemo(() => {
    const hay1 = corteTieneAlgo(corte1);
    const hay2 = corteTieneAlgo(corte2);
    if (hay1 && hay2) return (nota1 + nota2) / 2;
    if (hay1) return nota1;
    if (hay2) return nota2;
    return 0;
  }, [corte1, corte2, nota1, nota2]);

  const guardar = useMutation({
    mutationFn: async () => {
      const num = (s: string) => (s === "" ? null : Number(s));
      const payload: EvaluacionProfesorRequest = {
        // Corte 1
        capacidades: num(corte1.capacidades),
        actitudes: num(corte1.actitudes),
        aplicacionDesempeno: num(corte1.aplicacionDesempeno),
        aplicacionElaboracionPem: num(corte1.aplicacionElaboracionPem),
        aplicacionSustentacionPem: num(corte1.aplicacionSustentacionPem),
        observacionesC1: corte1.observaciones || null,
        fechaC1: corte1.fecha || null,
        // Corte 2
        capacidadesC2: num(corte2.capacidades),
        actitudesC2: num(corte2.actitudes),
        aplicacionDesempenoC2: num(corte2.aplicacionDesempeno),
        aplicacionElaboracionPemC2: num(corte2.aplicacionElaboracionPem),
        aplicacionSustentacionPemC2: num(corte2.aplicacionSustentacionPem),
        observacionesC2: corte2.observaciones || null,
        fechaC2: corte2.fecha || null,
      };
      return api.put<EvaluacionProfesorResponse>(
        `/trimestres/${trimestreId}/evaluacion-profesor`,
        payload
      );
    },
    onSuccess: () => {
      toast.success("Evaluación guardada");
      qc.invalidateQueries({ queryKey: ["/trimestres/eval-prof", trimestreId] });
      qc.invalidateQueries({ queryKey: ["/convenios/trimestres", Number(convenioId)] });
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  const firmar = useMutation({
    mutationFn: async (parte: ParteFirmaTrimestre) =>
      api.patch<EvaluacionProfesorResponse>(
        `/trimestres/${trimestreId}/evaluacion-profesor/firmar/${parte}`
      ),
    onSuccess: () => {
      toast.success("Firma registrada");
      qc.invalidateQueries({ queryKey: ["/trimestres/eval-prof", trimestreId] });
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  const descargar = useMutation({
    mutationFn: async () =>
      downloadPdf(`/trimestres/${trimestreId}/evaluacion-profesor/pdf`, `eval-profesor-t${trimestreId}.pdf`),
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
            <h1 className="text-2xl font-bold">Evaluación del Profesor (GAC-FM-1)</h1>
            <p className="text-sm text-muted-foreground">
              Dos cortes (25% cada uno). Pesos por corte: Capacidades 10% · Actitudes 10% · Aplicación 80% (20/50/10).
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {data && (
            <Button variant="outline" onClick={() => descargar.mutate()} disabled={descargar.isPending}>
              {descargar.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Descargar EP (PDF)
            </Button>
          )}
          <Button onClick={() => guardar.mutate()} disabled={guardar.isPending}>
            {guardar.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <CorteCard
          numero={1}
          form={corte1}
          onChange={setCorte1}
          nota={nota1}
          notaPersistida={data?.notaPonderada}
        />
        <CorteCard
          numero={2}
          form={corte2}
          onChange={setCorte2}
          nota={nota2}
          notaPersistida={data?.notaPonderadaC2}
        />
      </div>

      <Card>
        <CardContent className="pt-5">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Nota final del proceso (promedio de los dos cortes que tengan datos)
          </Label>
          <div className="text-4xl font-display font-bold mt-1">{notaFinal.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Cada corte aporta 25% del proceso total — esta es la nota promedio que se reportará.
          </p>
        </CardContent>
      </Card>

      {data && (
        <Card>
          <CardHeader><CardTitle>Firmas</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              <FirmaButton firmado={data.firmadoProfesor} parte="PROFESOR" titulo="Profesor" disabled={firmar.isPending} onSign={(p) => firmar.mutate(p)} />
              <FirmaButton firmado={data.firmadoEstudiante} parte="ESTUDIANTE" titulo="Estudiante" disabled={firmar.isPending} onSign={(p) => firmar.mutate(p)} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface CorteCardProps {
  numero: 1 | 2;
  form: CorteForm;
  onChange: (f: CorteForm) => void;
  nota: number;
  notaPersistida: number | string | null | undefined;
}

function CorteCard({ numero, form, onChange, nota, notaPersistida }: CorteCardProps): JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="inline-flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-soft text-primary text-sm font-bold">
              {numero}°
            </span>
            Calificación {numero === 1 ? "(corte 1, 25%)" : "(corte 2, 25%)"}
          </span>
        </CardTitle>
        <CardDescription>Escala 0-5</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Calif label="1. Capacidades y competencias (10%)" value={form.capacidades} onChange={(v) => onChange({ ...form, capacidades: v })} />
        <Calif label="2. Actitudes y comportamiento (10%)" value={form.actitudes} onChange={(v) => onChange({ ...form, actitudes: v })} />
        <div className="rounded-md border p-3 space-y-2">
          <div className="text-sm font-semibold">3. Aplicación de herramientas (80%)</div>
          <Calif label="3.1 Desempeño aplicación (20%)" value={form.aplicacionDesempeno} onChange={(v) => onChange({ ...form, aplicacionDesempeno: v })} />
          <Calif label="3.2 Calidad académica PEM (50%)" value={form.aplicacionElaboracionPem} onChange={(v) => onChange({ ...form, aplicacionElaboracionPem: v })} />
          <Calif label="3.3 Sustentación PEM (10%)" value={form.aplicacionSustentacionPem} onChange={(v) => onChange({ ...form, aplicacionSustentacionPem: v })} />
        </div>
        <div className="rounded-md border bg-muted/50 p-3">
          <Label>Nota ponderada del corte (auto)</Label>
          <div className="text-2xl font-bold mt-1">{nota.toFixed(2)}</div>
          {notaPersistida != null && (
            <div className="text-xs text-muted-foreground mt-1">
              Persistida: {Number(notaPersistida).toFixed(2)}
            </div>
          )}
        </div>
        <div className="space-y-1 pt-1">
          <Label>Fecha del corte</Label>
          <Input type="date" value={form.fecha} onChange={(e) => onChange({ ...form, fecha: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label>Observaciones del {numero}° corte</Label>
          <Textarea rows={3} value={form.observaciones} onChange={(e) => onChange({ ...form, observaciones: e.target.value })} />
        </div>
      </CardContent>
    </Card>
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
