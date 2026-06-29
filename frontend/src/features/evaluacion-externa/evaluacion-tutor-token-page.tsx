import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios, { type AxiosError } from "axios";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, Loader2, Save, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UniempresarialLogo } from "@/components/uniempresarial-logo";

// Acceso externo del tutor (sin cuenta institucional): NO usamos el cliente
// @/lib/api porque inyecta el header Authorization y redirige a /login en 401.
// Hablamos directo con el backend vía axios y autenticamos con el token de la URL.
const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:8080/api/v1";

// ---- Shapes alineados con los DTO del backend ----
// EvaluacionTutorResponse (los campos que consumimos)
interface EvaluacionTutorResponse {
  capacidades: number | null;
  actitudes: number | null;
  aplicacionDesempeno: number | null;
  aplicacionElaboracionPem: number | null;
  aplicacionSustentacionPem: number | null;
  notaPonderada: number | null;
  continuidadConEmpresa: boolean | null;
  observaciones: string | null;
  fechaElaboracion: string | null;
}

// EvaluacionTutorExternoResponse
interface EvaluacionTutorExternoResponse {
  tutorId: number;
  convenioId: number;
  proposito: string;
  evaluacion: EvaluacionTutorResponse | null;
}

// EvaluacionTutorRequest (body del PUT)
interface EvaluacionTutorRequest {
  capacidades: number | null;
  actitudes: number | null;
  aplicacionDesempeno: number | null;
  aplicacionElaboracionPem: number | null;
  aplicacionSustentacionPem: number | null;
  continuidadConEmpresa: boolean | null;
  observaciones: string | null;
  fechaElaboracion: string | null;
}

interface FormState {
  capacidades: string;
  actitudes: string;
  aplicacionDesempeno: string;
  aplicacionElaboracionPem: string;
  aplicacionSustentacionPem: string;
  continuidad: "" | "SI" | "NO";
  observaciones: string;
  fechaElaboracion: string;
}

const EMPTY: FormState = {
  capacidades: "",
  actitudes: "",
  aplicacionDesempeno: "",
  aplicacionElaboracionPem: "",
  aplicacionSustentacionPem: "",
  continuidad: "",
  observaciones: "",
  fechaElaboracion: "",
};

function calcularNota(f: FormState): number {
  const num = (s: string) => (s === "" ? 0 : Number(s));
  return (
    num(f.capacidades) * 0.4 +
    num(f.actitudes) * 0.4 +
    num(f.aplicacionDesempeno) * 0.1 +
    num(f.aplicacionElaboracionPem) * 0.05 +
    num(f.aplicacionSustentacionPem) * 0.05
  );
}

function fromResponse(ev: EvaluacionTutorResponse): FormState {
  return {
    capacidades: ev.capacidades != null ? String(ev.capacidades) : "",
    actitudes: ev.actitudes != null ? String(ev.actitudes) : "",
    aplicacionDesempeno: ev.aplicacionDesempeno != null ? String(ev.aplicacionDesempeno) : "",
    aplicacionElaboracionPem:
      ev.aplicacionElaboracionPem != null ? String(ev.aplicacionElaboracionPem) : "",
    aplicacionSustentacionPem:
      ev.aplicacionSustentacionPem != null ? String(ev.aplicacionSustentacionPem) : "",
    continuidad: ev.continuidadConEmpresa == null ? "" : ev.continuidadConEmpresa ? "SI" : "NO",
    observaciones: ev.observaciones ?? "",
    fechaElaboracion: ev.fechaElaboracion ?? "",
  };
}

function extractMessage(e: unknown, fallback: string): string {
  const err = e as AxiosError<{ message?: string; error?: string }>;
  return err?.response?.data?.message ?? err?.response?.data?.error ?? err?.message ?? fallback;
}

type Status = "loading" | "invalid" | "ready" | "done";

export function EvaluacionTutorTokenPage(): JSX.Element {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const trimestreId = params.get("trimestreId") ?? "";

  const [status, setStatus] = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState<"none" | "draft" | "submit">("none");

  const nota = useMemo(() => calcularNota(form), [form]);

  useEffect(() => {
    let cancelled = false;
    async function validar() {
      if (!token || !trimestreId) {
        setStatus("invalid");
        setErrorMsg("Falta el token o el trimestre en el enlace.");
        return;
      }
      try {
        const { data } = await axios.get<EvaluacionTutorExternoResponse>(
          `${API_BASE}/trimestres/${encodeURIComponent(trimestreId)}/evaluacion-tutor/externo/validar`,
          { params: { token } }
        );
        if (cancelled) return;
        if (data.evaluacion) setForm(fromResponse(data.evaluacion));
        setStatus("ready");
      } catch (e) {
        if (cancelled) return;
        setStatus("invalid");
        setErrorMsg(extractMessage(e, "Enlace inválido o expirado."));
      }
    }
    void validar();
    return () => {
      cancelled = true;
    };
  }, [token, trimestreId]);

  async function enviar(finalizar: boolean): Promise<void> {
    if (finalizar && form.continuidad === "") {
      toast.error("Indica si el estudiante tiene continuidad con la empresa antes de enviar.");
      return;
    }
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
    setSaving(finalizar ? "submit" : "draft");
    try {
      await axios.put<EvaluacionTutorResponse>(
        `${API_BASE}/trimestres/${encodeURIComponent(trimestreId)}/evaluacion-tutor/externo`,
        payload,
        { params: { token, finalizar } }
      );
      if (finalizar) {
        setStatus("done");
      } else {
        toast.success("Borrador guardado. Puedes volver a este enlace para continuar.");
      }
    } catch (e) {
      toast.error(extractMessage(e, "No se pudo guardar la evaluación."));
    } finally {
      setSaving("none");
    }
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4">
          <UniempresarialLogo size={40} />
          <div className="leading-tight">
            <p className="text-sm font-semibold text-foreground">SIVU · Uniempresarial</p>
            <p className="text-xs text-muted-foreground">Evaluación del Tutor Empresarial</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        {status === "loading" && (
          <div className="flex min-h-[40vh] items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm">Validando enlace…</span>
          </div>
        )}

        {status === "invalid" && (
          <Card className="border-destructive/40">
            <CardHeader className="items-center text-center">
              <AlertTriangle className="h-10 w-10 text-destructive" />
              <CardTitle>Enlace inválido o expirado</CardTitle>
              <CardDescription>{errorMsg || "Solicita un nuevo enlace al coordinador."}</CardDescription>
            </CardHeader>
          </Card>
        )}

        {status === "done" && (
          <Card className="border-success/40">
            <CardHeader className="items-center text-center">
              <CheckCircle2 className="h-12 w-12 text-success" />
              <CardTitle>¡Gracias por tu evaluación!</CardTitle>
              <CardDescription>
                Tu evaluación se envió correctamente. Ya puedes cerrar esta ventana.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {status === "ready" && (
          <div className="space-y-4">
            <div>
              <h1 className="text-xl font-bold sm:text-2xl">Evaluación del Tutor (GAC-FM-007)</h1>
              <p className="text-sm text-muted-foreground">
                Califica de 0 a 5. Pesos: Capacidades 40% · Actitudes 40% · Aplicación 20% (10/5/5).
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Criterios de evaluación</CardTitle>
                <CardDescription>
                  Escala 0-5 (Insuficiente 0-2.9 · Aceptable 3-3.9 · Excelente 4-4.5 · Sobresaliente 4.6-5)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Calif
                  label="1. Capacidades y competencias (40%)"
                  value={form.capacidades}
                  onChange={(v) => setForm({ ...form, capacidades: v })}
                />
                <Calif
                  label="2. Actitudes y comportamiento (40%)"
                  value={form.actitudes}
                  onChange={(v) => setForm({ ...form, actitudes: v })}
                />
                <div className="space-y-2 rounded-md border p-3">
                  <div className="text-sm font-semibold">3. Aplicación de herramientas (20%)</div>
                  <Calif
                    label="3.1 Desempeño aplicación herramientas (10%)"
                    value={form.aplicacionDesempeno}
                    onChange={(v) => setForm({ ...form, aplicacionDesempeno: v })}
                  />
                  <Calif
                    label="3.2 Calidad académica elaboración PEM (5%)"
                    value={form.aplicacionElaboracionPem}
                    onChange={(v) => setForm({ ...form, aplicacionElaboracionPem: v })}
                  />
                  <Calif
                    label="3.3 Sustentación final PEM (5%)"
                    value={form.aplicacionSustentacionPem}
                    onChange={(v) => setForm({ ...form, aplicacionSustentacionPem: v })}
                  />
                </div>
                <div className="rounded-md border bg-muted/50 p-3">
                  <Label>Nota ponderada (cálculo automático)</Label>
                  <div className="mt-1 text-3xl font-bold">{nota.toFixed(2)}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Continuidad y observaciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>
                    ¿El estudiante tiene continuidad con la empresa?{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="continuidad"
                        checked={form.continuidad === "SI"}
                        onChange={() => setForm({ ...form, continuidad: "SI" })}
                      />
                      Sí
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="continuidad"
                        checked={form.continuidad === "NO"}
                        onChange={() => setForm({ ...form, continuidad: "NO" })}
                      />
                      No
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Obligatorio para enviar la evaluación final.
                  </p>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="fecha">Fecha de elaboración</Label>
                  <Input
                    id="fecha"
                    type="date"
                    value={form.fechaElaboracion}
                    onChange={(e) => setForm({ ...form, fechaElaboracion: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="obs">Observaciones del proceso / plan de mejora</Label>
                  <Textarea
                    id="obs"
                    rows={4}
                    value={form.observaciones}
                    onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                    placeholder="Comentarios sobre el desempeño del estudiante, recomendaciones, etc."
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col gap-2 pb-8 sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                onClick={() => void enviar(false)}
                disabled={saving !== "none"}
              >
                {saving === "draft" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Guardar borrador
              </Button>
              <Button onClick={() => void enviar(true)} disabled={saving !== "none"}>
                {saving === "submit" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Enviar evaluación
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function Calif({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}): JSX.Element {
  return (
    <div className="grid items-center gap-2 md:grid-cols-[1fr_120px]">
      <Label>{label}</Label>
      <Input
        type="number"
        min={0}
        max={5}
        step="0.1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
