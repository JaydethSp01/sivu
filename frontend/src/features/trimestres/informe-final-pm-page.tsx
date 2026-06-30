import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  Award,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Save,
  Send,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { api, extractApiMessage } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import {
  ESTADO_INFORME_FINAL_LABELS,
  ESTADO_INFORME_FINAL_VARIANT,
} from "@/lib/enum-labels";
import type {
  FeedbackInformeIA,
  InformeFinalPmRequest,
  InformeFinalPmResponse,
  InformeFinalSeccionesRequest,
} from "@/lib/types";

// ----- Editor estructurado de las 12 secciones del Informe Final (GTC-FM-16, RF-A04) -----

type SeccionesValues = InformeFinalSeccionesRequest;

const EMPTY_SECCIONES: SeccionesValues = {
  resumenEjecutivo: "",
  contextualizacionEmpresa: "",
  planteamientoProblema: "",
  marcoTeorico: "",
  objetivos: "",
  diagnostico: "",
  metodologia: "",
  justificacion: "",
  factibilidad: "",
  resultados: "",
  conclusiones: "",
  referenciasApa: "",
};

const SECCIONES_12: { key: keyof SeccionesValues; label: string }[] = [
  { key: "resumenEjecutivo", label: "1. Resumen ejecutivo" },
  { key: "contextualizacionEmpresa", label: "2. Contextualización de la empresa" },
  { key: "planteamientoProblema", label: "3. Planteamiento del problema" },
  { key: "marcoTeorico", label: "4. Marco teórico" },
  { key: "objetivos", label: "5. Objetivos" },
  { key: "diagnostico", label: "6. Diagnóstico externo/interno" },
  { key: "metodologia", label: "7. Metodología" },
  { key: "justificacion", label: "8. Justificación" },
  { key: "factibilidad", label: "9. Factibilidad" },
  { key: "resultados", label: "10. Resultados" },
  { key: "conclusiones", label: "11. Conclusiones" },
  { key: "referenciasApa", label: "12. Referencias APA 7" },
];

function toSeccionesForm(i: InformeFinalPmResponse): SeccionesValues {
  return {
    resumenEjecutivo: i.resumenEjecutivo ?? "",
    contextualizacionEmpresa: i.contextualizacionEmpresa ?? "",
    planteamientoProblema: i.planteamientoProblema ?? "",
    marcoTeorico: i.marcoTeorico ?? "",
    objetivos: i.objetivos ?? "",
    diagnostico: i.diagnostico ?? "",
    metodologia: i.metodologia ?? "",
    justificacion: i.justificacion ?? "",
    factibilidad: i.factibilidad ?? "",
    resultados: i.resultados ?? "",
    conclusiones: i.conclusiones ?? "",
    referenciasApa: i.referenciasApa ?? "",
  };
}

interface FormValues {
  resumenEjecutivo: string;
  contextualizacion: string;
  planteamientoProblema: string;
  marcoTeorico: string;
  objetivoGeneral: string;
  objetivosEspecificos: string;
  diagnostico: string;
  metodologia: string;
  propuestaSolucion: string;
  factibilidad: string;
  conclusiones: string;
  anexos: string;
  numeroPaginas: string;
}

const EMPTY: FormValues = {
  resumenEjecutivo: "",
  contextualizacion: "",
  planteamientoProblema: "",
  marcoTeorico: "",
  objetivoGeneral: "",
  objetivosEspecificos: "",
  diagnostico: "",
  metodologia: "",
  propuestaSolucion: "",
  factibilidad: "",
  conclusiones: "",
  anexos: "",
  numeroPaginas: "",
};

// 12 secciones académicas obligatorias del GTC-FM-16 (sin anexos ni numeroPaginas)
const SECCIONES_OBLIGATORIAS: (keyof FormValues)[] = [
  "resumenEjecutivo",
  "contextualizacion",
  "planteamientoProblema",
  "marcoTeorico",
  "objetivoGeneral",
  "objetivosEspecificos",
  "diagnostico",
  "metodologia",
  "propuestaSolucion",
  "factibilidad",
  "conclusiones",
];

const SECTION_META: Record<
  keyof FormValues,
  { label: string; helpText: string; rows?: number }
> = {
  resumenEjecutivo: {
    label: "1. Resumen ejecutivo",
    helpText: "Síntesis del problema, propuesta y resultados esperados.",
  },
  contextualizacion: {
    label: "2. Contextualización",
    helpText: "Empresa, área, contexto institucional y del estudiante.",
  },
  planteamientoProblema: {
    label: "3. Planteamiento del problema",
    helpText: "¿Qué situación se busca mejorar? Antecedentes y delimitación.",
  },
  marcoTeorico: {
    label: "4. Marco teórico",
    helpText: "Conceptos, autores y referencias que sustentan la propuesta.",
  },
  objetivoGeneral: {
    label: "5. Objetivo general",
    helpText: "Resultado global esperado (verbo en infinitivo).",
    rows: 3,
  },
  objetivosEspecificos: {
    label: "6. Objetivos específicos",
    helpText: "Lista de objetivos parciales medibles.",
  },
  diagnostico: {
    label: "7. Diagnóstico",
    helpText: "Análisis de la situación actual (datos, observaciones, métricas).",
  },
  metodologia: {
    label: "8. Metodología",
    helpText: "Cómo se desarrolló el trabajo (fases, herramientas).",
  },
  propuestaSolucion: {
    label: "9. Propuesta de solución",
    helpText: "Detalle de la solución diseñada y su justificación.",
  },
  factibilidad: {
    label: "10. Factibilidad",
    helpText: "Viabilidad técnica, económica, operativa.",
  },
  conclusiones: {
    label: "11. Conclusiones",
    helpText: "Logros, lecciones aprendidas y recomendaciones.",
  },
  anexos: {
    label: "12. Anexos",
    helpText: "Material complementario (referencias a documentos adjuntos).",
  },
  numeroPaginas: {
    label: "Número de páginas",
    helpText: "Máximo 15 según norma institucional.",
  },
};

function toForm(i: InformeFinalPmResponse): FormValues {
  return {
    resumenEjecutivo: i.resumenEjecutivo ?? "",
    contextualizacion: i.contextualizacion ?? "",
    planteamientoProblema: i.planteamientoProblema ?? "",
    marcoTeorico: i.marcoTeorico ?? "",
    objetivoGeneral: i.objetivoGeneral ?? "",
    objetivosEspecificos: i.objetivosEspecificos ?? "",
    diagnostico: i.diagnostico ?? "",
    metodologia: i.metodologia ?? "",
    propuestaSolucion: i.propuestaSolucion ?? "",
    factibilidad: i.factibilidad ?? "",
    conclusiones: i.conclusiones ?? "",
    anexos: i.anexos ?? "",
    numeroPaginas: i.numeroPaginas != null ? String(i.numeroPaginas) : "",
  };
}

function toRequest(v: FormValues): InformeFinalPmRequest {
  const pag = v.numeroPaginas.trim();
  return {
    resumenEjecutivo: v.resumenEjecutivo.trim() || null,
    contextualizacion: v.contextualizacion.trim() || null,
    planteamientoProblema: v.planteamientoProblema.trim() || null,
    marcoTeorico: v.marcoTeorico.trim() || null,
    objetivoGeneral: v.objetivoGeneral.trim() || null,
    objetivosEspecificos: v.objetivosEspecificos.trim() || null,
    diagnostico: v.diagnostico.trim() || null,
    metodologia: v.metodologia.trim() || null,
    propuestaSolucion: v.propuestaSolucion.trim() || null,
    factibilidad: v.factibilidad.trim() || null,
    conclusiones: v.conclusiones.trim() || null,
    anexos: v.anexos.trim() || null,
    numeroPaginas: pag === "" ? null : Number(pag),
  };
}

/** Valida una nota 0-5; devuelve el número o null si es inválida. */
function parseNota(raw: string): number | null {
  if (raw.trim() === "") return null;
  const n = Number(raw);
  if (Number.isNaN(n) || n < 0 || n > 5) return null;
  return n;
}

/** Formatea una nota (number | string | null) a "x.x" o "—". */
function fmtNota(n: number | string | null | undefined): string {
  if (n === null || n === undefined || n === "") return "—";
  const num = typeof n === "string" ? Number(n) : n;
  if (Number.isNaN(num)) return "—";
  return num.toFixed(1);
}

function SeccionTextarea({
  field,
  value,
  onChange,
}: {
  field: keyof FormValues;
  value: string;
  onChange: (v: string) => void;
}): JSX.Element {
  const meta = SECTION_META[field];
  return (
    <div>
      <Label htmlFor={`if-${field}`}>{meta.label}</Label>
      <p className="text-xs text-muted-foreground mb-1">{meta.helpText}</p>
      <Textarea
        id={`if-${field}`}
        rows={meta.rows ?? 6}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function InformeFinalPmPage(): JSX.Element {
  const { convenioId, trimestreId, planMejoraId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const hasRole = useAuthStore((s) => s.hasRole);
  const canRevisar = hasRole("ADMIN", "COORDINADOR");
  // El backend permite nota-tutor a TUTOR/EMPRESA/COORDINADOR/ADMIN; en el
  // frontend solo existen estos roles (no hay rol TUTOR en el catálogo del UI).
  const canNotaTutor = hasRole("ADMIN", "COORDINADOR", "EMPRESA");
  const canNotaProfesor = hasRole("ADMIN", "COORDINADOR");
  const canAltoImpacto = hasRole("ADMIN", "COORDINADOR");
  // El estudiante edita las 12 secciones; Coordinación/Admin pueden ajustar.
  const canEditarSecciones = hasRole("ESTUDIANTE", "COORDINADOR", "ADMIN");

  const [values, setValues] = useState<FormValues>(EMPTY);
  const [secciones, setSecciones] = useState<SeccionesValues>(EMPTY_SECCIONES);
  const [rechazoOpen, setRechazoOpen] = useState(false);
  const [observaciones, setObservaciones] = useState("");
  const [notaTutorInput, setNotaTutorInput] = useState("");
  const [notaProfesorInput, setNotaProfesorInput] = useState("");

  const pmId = Number(planMejoraId);

  const informe = useQuery({
    queryKey: ["/planes-mejora", pmId, "informe-final"],
    enabled: !Number.isNaN(pmId),
    retry: (failureCount, error) => {
      if (error instanceof AxiosError && error.response?.status === 404) return false;
      return failureCount < 2;
    },
    queryFn: async () => {
      try {
        const { data } = await api.get<InformeFinalPmResponse>(
          `/planes-mejora/${pmId}/informe-final`
        );
        return data;
      } catch (e) {
        if (e instanceof AxiosError && e.response?.status === 404) return null;
        throw e;
      }
    },
  });

  useEffect(() => {
    if (informe.data) {
      setValues(toForm(informe.data));
      setSecciones(toSeccionesForm(informe.data));
    }
    if (informe.data === null) {
      setValues(EMPTY);
      setSecciones(EMPTY_SECCIONES);
    }
  }, [informe.data]);

  const set = <K extends keyof FormValues>(field: K, v: FormValues[K]) =>
    setValues((prev) => ({ ...prev, [field]: v }));

  const setSeccion = (field: keyof SeccionesValues, v: string) =>
    setSecciones((prev) => ({ ...prev, [field]: v }));

  const guardarSecciones = useMutation({
    mutationFn: async () => {
      if (!informe.data) throw new Error("Guarda el borrador antes de editar las secciones");
      const { data } = await api.put<InformeFinalPmResponse>(
        `/informes-final-pm/${informe.data.id}/secciones`,
        secciones satisfies InformeFinalSeccionesRequest
      );
      return data;
    },
    onSuccess: (data) => {
      toast.success("Informe guardado");
      qc.setQueryData(["/planes-mejora", pmId, "informe-final"], data);
      qc.invalidateQueries({ queryKey: ["/planes-mejora", pmId, "informe-final"] });
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  const guardar = useMutation({
    mutationFn: async () => {
      const { data } = await api.put<InformeFinalPmResponse>(
        `/planes-mejora/${pmId}/informe-final`,
        toRequest(values)
      );
      return data;
    },
    onSuccess: (data) => {
      toast.success("Borrador guardado");
      qc.setQueryData(["/planes-mejora", pmId, "informe-final"], data);
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  const entregar = useMutation({
    mutationFn: async () => {
      if (!informe.data) throw new Error("Guarda el borrador antes de entregar");
      const { data } = await api.post<InformeFinalPmResponse>(
        `/informes-final-pm/${informe.data.id}/entregar`
      );
      return data;
    },
    onSuccess: (data) => {
      toast.success("Informe entregado — pendiente de revisión");
      qc.setQueryData(["/planes-mejora", pmId, "informe-final"], data);
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  const aprobar = useMutation({
    mutationFn: async () => {
      if (!informe.data) throw new Error("Informe no cargado");
      const { data } = await api.post<InformeFinalPmResponse>(
        `/informes-final-pm/${informe.data.id}/aprobar`
      );
      return data;
    },
    onSuccess: (data) => {
      toast.success("Informe aprobado");
      qc.setQueryData(["/planes-mejora", pmId, "informe-final"], data);
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  const rechazar = useMutation({
    mutationFn: async (obs: string) => {
      if (!informe.data) throw new Error("Informe no cargado");
      const { data } = await api.post<InformeFinalPmResponse>(
        `/informes-final-pm/${informe.data.id}/rechazar`,
        { observaciones: obs }
      );
      return data;
    },
    onSuccess: (data) => {
      toast.success("Informe rechazado");
      qc.setQueryData(["/planes-mejora", pmId, "informe-final"], data);
      setRechazoOpen(false);
      setObservaciones("");
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  const descargarPdf = useMutation({
    mutationFn: async () => {
      if (!informe.data) throw new Error("Guarda el borrador antes de descargar");
      const res = await api.get(`/informes-final-pm/${informe.data.id}/pdf`, {
        responseType: "blob",
      });
      const blob = new Blob([res.data as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `informe-final-pm-${informe.data.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  const [feedbackIAResult, setFeedbackIAResult] = useState<FeedbackInformeIA | null>(null);
  const feedbackIA = useMutation({
    mutationFn: async () => {
      if (!informe.data) throw new Error("Guarda el borrador primero");
      const { data } = await api.post<FeedbackInformeIA>(
        `/ia/informe-final/${informe.data.id}/feedback`,
        {}
      );
      return data;
    },
    onSuccess: (data) => {
      setFeedbackIAResult(data);
      toast.success("Revisión completada");
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  const guardarNotaTutor = useMutation({
    mutationFn: async (nota: number) => {
      if (!informe.data) throw new Error("Informe no cargado");
      const { data } = await api.patch<InformeFinalPmResponse>(
        `/informes-final-pm/${informe.data.id}/nota-tutor`,
        { nota }
      );
      return data;
    },
    onSuccess: (data) => {
      toast.success("Nota del tutor registrada");
      qc.setQueryData(["/planes-mejora", pmId, "informe-final"], data);
      qc.invalidateQueries({ queryKey: ["/planes-mejora", pmId, "informe-final"] });
      setNotaTutorInput("");
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  const guardarNotaProfesor = useMutation({
    mutationFn: async (nota: number) => {
      if (!informe.data) throw new Error("Informe no cargado");
      const { data } = await api.patch<InformeFinalPmResponse>(
        `/informes-final-pm/${informe.data.id}/nota-profesor`,
        { nota }
      );
      return data;
    },
    onSuccess: (data) => {
      toast.success("Nota del profesor registrada");
      qc.setQueryData(["/planes-mejora", pmId, "informe-final"], data);
      qc.invalidateQueries({ queryKey: ["/planes-mejora", pmId, "informe-final"] });
      setNotaProfesorInput("");
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  const toggleAltoImpacto = useMutation({
    mutationFn: async (altoImpacto: boolean) => {
      if (!informe.data) throw new Error("Informe no cargado");
      const { data } = await api.patch<InformeFinalPmResponse>(
        `/informes-final-pm/${informe.data.id}/alto-impacto`,
        { altoImpacto }
      );
      return data;
    },
    onSuccess: (data) => {
      toast.success(
        data.altoImpacto
          ? "Marcado como Proyecto de Alto Impacto"
          : "Se quitó la marca de Alto Impacto"
      );
      qc.setQueryData(["/planes-mejora", pmId, "informe-final"], data);
      qc.invalidateQueries({ queryKey: ["/planes-mejora", pmId, "informe-final"] });
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  const onRegistrarNotaTutor = () => {
    const n = parseNota(notaTutorInput);
    if (n === null) {
      toast.error("La nota del tutor debe estar entre 0 y 5");
      return;
    }
    guardarNotaTutor.mutate(n);
  };

  const onRegistrarNotaProfesor = () => {
    const n = parseNota(notaProfesorInput);
    if (n === null) {
      toast.error("La nota del profesor debe estar entre 0 y 5");
      return;
    }
    guardarNotaProfesor.mutate(n);
  };

  const faltantes = useMemo(
    () =>
      SECCIONES_OBLIGATORIAS.filter((k) => !String(values[k] ?? "").trim()).map(
        (k) => SECTION_META[k].label
      ),
    [values]
  );
  const paginasExcedidas = useMemo(() => {
    const n = Number(values.numeroPaginas);
    return !Number.isNaN(n) && n > 15;
  }, [values.numeroPaginas]);

  const estado = informe.data?.estado;
  const editable = !estado || estado === "BORRADOR" || estado === "RECHAZADO";

  if (informe.isLoading) {
    return (
      <div className="flex items-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando informe...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              navigate(`/convenios/${convenioId}/trimestres/${trimestreId}/planes-mejora`)
            }
            aria-label="Volver"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight flex items-center gap-2 uni-accent">
              <FileText className="h-6 w-6 text-primary" />
              Informe final del plan de mejora
            </h1>
            <p className="text-sm text-muted-foreground">
              Llena cada sección del informe. Hasta 15 páginas. Plan #{pmId}.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {estado && (
            <Badge
              variant={ESTADO_INFORME_FINAL_VARIANT[estado]}
              className="px-3 py-1 text-sm"
            >
              {ESTADO_INFORME_FINAL_LABELS[estado]}
            </Badge>
          )}
          {paginasExcedidas && (
            <Badge variant="destructive">
              <AlertTriangle className="h-4 w-4 mr-1" /> Excede 15 págs
            </Badge>
          )}
          {faltantes.length > 0 && (
            <Badge variant="warning" title={faltantes.join("\n")}>
              Faltan {faltantes.length} secciones
            </Badge>
          )}
          {editable && (
            <Button onClick={() => guardar.mutate()} disabled={guardar.isPending}>
              {guardar.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}{" "}
              Guardar borrador
            </Button>
          )}
          {editable && informe.data && (
            <Button
              variant="secondary"
              onClick={() => entregar.mutate()}
              disabled={
                entregar.isPending || faltantes.length > 0 || paginasExcedidas
              }
              title={
                faltantes.length > 0
                  ? "Completa todas las secciones antes de entregar"
                  : paginasExcedidas
                    ? "Reduce a 15 páginas o menos"
                    : "Entregar para revisión de Coordinación"
              }
            >
              {entregar.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}{" "}
              Entregar
            </Button>
          )}
          {informe.data && (
            <Button
              variant="outline"
              onClick={() => descargarPdf.mutate()}
              disabled={descargarPdf.isPending}
            >
              {descargarPdf.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}{" "}
              PDF
            </Button>
          )}
          {informe.data && (
            <Button
              variant="outline"
              onClick={() => feedbackIA.mutate()}
              disabled={feedbackIA.isPending}
              title="Análisis automatizado de tu informe (secciones vacías, extensión, carátula, etc.)"
            >
              {feedbackIA.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}{" "}
              Revisar con IA
            </Button>
          )}
          {canRevisar && estado === "ENTREGADO" && (
            <>
              <Button onClick={() => aprobar.mutate()} disabled={aprobar.isPending}>
                {aprobar.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ThumbsUp className="h-4 w-4" />
                )}{" "}
                Aprobar
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  setObservaciones("");
                  setRechazoOpen(true);
                }}
              >
                <ThumbsDown className="h-4 w-4" /> Rechazar
              </Button>
            </>
          )}
        </div>
      </div>

      {estado === "RECHAZADO" && informe.data?.observacionesRevisor && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="pt-4">
            <div className="flex items-start gap-2 text-sm">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-destructive">
                  Coordinación rechazó el informe — ajusta y vuelve a entregar
                </div>
                <p className="mt-1 whitespace-pre-line">
                  {informe.data.observacionesRevisor}
                </p>
                {informe.data.revisadoPorNombre && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Revisado por {informe.data.revisadoPorNombre}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {estado === "APROBADO" && (
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="pt-4 flex items-start gap-2 text-sm">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-emerald-700 dark:text-emerald-400">
                Informe aprobado
              </div>
              {informe.data?.revisadoPorNombre && (
                <p className="text-xs text-muted-foreground">
                  Revisado por {informe.data.revisadoPorNombre}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {informe.data && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" /> Calificación final
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-border/60 p-3">
                <div className="text-xs text-muted-foreground">Nota del tutor</div>
                <div className="text-lg font-semibold">
                  {fmtNota(informe.data.notaTutor)}
                </div>
              </div>
              <div className="rounded-lg border border-border/60 p-3">
                <div className="text-xs text-muted-foreground">Nota del profesor</div>
                <div className="text-lg font-semibold">
                  {fmtNota(informe.data.notaProfesor)}
                </div>
              </div>
              <div className="rounded-lg border border-primary/30 bg-primary-soft/30 p-3">
                <div className="text-xs text-muted-foreground">Nota promedio</div>
                <div className="text-lg font-bold">
                  {fmtNota(informe.data.notaPromedio)}{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    / 5.0
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={informe.data.cumpleNotaMinima ? "success" : "destructive"}>
                {informe.data.cumpleNotaMinima ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" /> APROBADO
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-3.5 w-3.5" /> NO APROBADO
                  </>
                )}
              </Badge>
              {informe.data.altoImpacto && (
                <Badge variant="accent">
                  <Sparkles className="h-3.5 w-3.5" /> Alto Impacto
                </Badge>
              )}
              {informe.data.nivel && (
                <Badge variant="muted">Nivel: {informe.data.nivel}</Badge>
              )}
            </div>

            {(canNotaTutor || canNotaProfesor || canAltoImpacto) && (
              <div className="space-y-3 border-t border-border/60 pt-4">
                {canNotaTutor && (
                  <div className="flex flex-wrap items-end gap-2">
                    <div className="w-36">
                      <Label htmlFor="nota-tutor-input">Nota del tutor (0-5)</Label>
                      <Input
                        id="nota-tutor-input"
                        type="number"
                        min={0}
                        max={5}
                        step="0.1"
                        value={notaTutorInput}
                        onChange={(e) => setNotaTutorInput(e.target.value)}
                        placeholder="0.0"
                      />
                    </div>
                    <Button
                      size="sm"
                      onClick={onRegistrarNotaTutor}
                      disabled={guardarNotaTutor.isPending}
                    >
                      {guardarNotaTutor.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}{" "}
                      Registrar nota tutor
                    </Button>
                  </div>
                )}

                {canNotaProfesor && (
                  <div className="flex flex-wrap items-end gap-2">
                    <div className="w-36">
                      <Label htmlFor="nota-profesor-input">Nota del profesor (0-5)</Label>
                      <Input
                        id="nota-profesor-input"
                        type="number"
                        min={0}
                        max={5}
                        step="0.1"
                        value={notaProfesorInput}
                        onChange={(e) => setNotaProfesorInput(e.target.value)}
                        placeholder="0.0"
                      />
                    </div>
                    <Button
                      size="sm"
                      onClick={onRegistrarNotaProfesor}
                      disabled={guardarNotaProfesor.isPending}
                    >
                      {guardarNotaProfesor.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}{" "}
                      Registrar nota profesor
                    </Button>
                  </div>
                )}

                {canAltoImpacto && (
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 p-3">
                    <div>
                      <div className="text-sm font-medium">
                        Proyecto de Alto Impacto
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Marca este informe como proyecto destacado.
                      </p>
                    </div>
                    <Button
                      variant={informe.data.altoImpacto ? "default" : "outline"}
                      size="sm"
                      onClick={() =>
                        toggleAltoImpacto.mutate(!informe.data?.altoImpacto)
                      }
                      disabled={toggleAltoImpacto.isPending}
                    >
                      {toggleAltoImpacto.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : null}
                      {informe.data.altoImpacto ? "Activado" : "Desactivado"}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {feedbackIAResult && (
        <Card className="border-primary/30 bg-primary-soft/30">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4 text-primary" /> Revisión automática del informe
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setFeedbackIAResult(null)}>
                Cerrar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {feedbackIAResult.aviso && (
              <div className="text-xs text-muted-foreground italic">{feedbackIAResult.aviso}</div>
            )}
            <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed bg-background/60 rounded-md p-3 border border-border/60">
              {feedbackIAResult.reporteMarkdown}
            </pre>
            <div className="text-xs text-muted-foreground">
              💡 Para un análisis cualitativo más profundo, conecta tu Claude Desktop /
              Claude Code al MCP server <code>sivu-mcp-server</code> (carpeta{" "}
              <code>mcp-server/</code>) y pídele "revisar informe final {informe.data?.id}".
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" /> Informe (12 secciones)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-muted-foreground">
              El informe completo no debe superar las{" "}
              <span className="font-semibold text-foreground">15 páginas</span> y la{" "}
              <span className="font-semibold text-foreground">nota mínima de aprobación es 3.0</span>{" "}
              (escala 0–5). Completa las 12 secciones siguiendo la norma GTC-FM-16 y la
              estructura APA 7 en las referencias.
            </p>
          </div>

          {informe.data ? (
            <>
              <div className="space-y-4">
                {SECCIONES_12.map(({ key, label }) => (
                  <div key={key}>
                    <Label htmlFor={`sec-${key}`}>{label}</Label>
                    <Textarea
                      id={`sec-${key}`}
                      className="mt-1 resize-y"
                      rows={5}
                      value={secciones[key]}
                      readOnly={!canEditarSecciones}
                      disabled={!canEditarSecciones}
                      onChange={(e) => setSeccion(key, e.target.value)}
                    />
                  </div>
                ))}
              </div>

              {canEditarSecciones && (
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => guardarSecciones.mutate()}
                    disabled={guardarSecciones.isPending}
                  >
                    {guardarSecciones.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}{" "}
                    Guardar borrador
                  </Button>
                  <Button
                    onClick={() => guardarSecciones.mutate()}
                    disabled={guardarSecciones.isPending}
                  >
                    {guardarSecciones.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}{" "}
                    Guardar informe
                  </Button>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Guarda primero el borrador del informe para habilitar la edición de las 12
              secciones.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Secciones</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="resumen">
            <TabsList className="flex-wrap h-auto">
              <TabsTrigger value="resumen">Resumen / Contexto</TabsTrigger>
              <TabsTrigger value="problema">Problema / Marco</TabsTrigger>
              <TabsTrigger value="objetivos">Objetivos</TabsTrigger>
              <TabsTrigger value="dx-metodo">Diagnóstico / Método</TabsTrigger>
              <TabsTrigger value="solucion">Solución / Factibilidad</TabsTrigger>
              <TabsTrigger value="cierre">Conclusiones / Anexos</TabsTrigger>
            </TabsList>

            <TabsContent value="resumen" className="mt-4 space-y-4">
              <SeccionTextarea
                field="resumenEjecutivo"
                value={values.resumenEjecutivo}
                onChange={(v) => set("resumenEjecutivo", v)}
              />
              <SeccionTextarea
                field="contextualizacion"
                value={values.contextualizacion}
                onChange={(v) => set("contextualizacion", v)}
              />
            </TabsContent>
            <TabsContent value="problema" className="mt-4 space-y-4">
              <SeccionTextarea
                field="planteamientoProblema"
                value={values.planteamientoProblema}
                onChange={(v) => set("planteamientoProblema", v)}
              />
              <SeccionTextarea
                field="marcoTeorico"
                value={values.marcoTeorico}
                onChange={(v) => set("marcoTeorico", v)}
              />
            </TabsContent>
            <TabsContent value="objetivos" className="mt-4 space-y-4">
              <SeccionTextarea
                field="objetivoGeneral"
                value={values.objetivoGeneral}
                onChange={(v) => set("objetivoGeneral", v)}
              />
              <SeccionTextarea
                field="objetivosEspecificos"
                value={values.objetivosEspecificos}
                onChange={(v) => set("objetivosEspecificos", v)}
              />
            </TabsContent>
            <TabsContent value="dx-metodo" className="mt-4 space-y-4">
              <SeccionTextarea
                field="diagnostico"
                value={values.diagnostico}
                onChange={(v) => set("diagnostico", v)}
              />
              <SeccionTextarea
                field="metodologia"
                value={values.metodologia}
                onChange={(v) => set("metodologia", v)}
              />
            </TabsContent>
            <TabsContent value="solucion" className="mt-4 space-y-4">
              <SeccionTextarea
                field="propuestaSolucion"
                value={values.propuestaSolucion}
                onChange={(v) => set("propuestaSolucion", v)}
              />
              <SeccionTextarea
                field="factibilidad"
                value={values.factibilidad}
                onChange={(v) => set("factibilidad", v)}
              />
            </TabsContent>
            <TabsContent value="cierre" className="mt-4 space-y-4">
              <SeccionTextarea
                field="conclusiones"
                value={values.conclusiones}
                onChange={(v) => set("conclusiones", v)}
              />
              <SeccionTextarea
                field="anexos"
                value={values.anexos}
                onChange={(v) => set("anexos", v)}
              />
              <div className="max-w-xs">
                <Label htmlFor="if-numeroPaginas">{SECTION_META.numeroPaginas.label}</Label>
                <p className="text-xs text-muted-foreground mb-1">
                  {SECTION_META.numeroPaginas.helpText}
                </p>
                <Input
                  id="if-numeroPaginas"
                  type="number"
                  min={1}
                  max={15}
                  value={values.numeroPaginas}
                  onChange={(e) => set("numeroPaginas", e.target.value)}
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <AlertDialog open={rechazoOpen} onOpenChange={setRechazoOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rechazar Informe Final</AlertDialogTitle>
            <AlertDialogDescription>
              Indica qué debe ajustar el estudiante. Se le notificará por correo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            rows={5}
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Ej: La sección de metodología no detalla las fases y faltan referencias en el marco teórico."
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (!observaciones.trim()) {
                  toast.error("Las observaciones son obligatorias");
                  return;
                }
                rechazar.mutate(observaciones.trim());
              }}
              disabled={rechazar.isPending}
            >
              {rechazar.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Rechazar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
