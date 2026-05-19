import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Save,
  Send,
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
import type { InformeFinalPmRequest, InformeFinalPmResponse } from "@/lib/types";

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

  const [values, setValues] = useState<FormValues>(EMPTY);
  const [rechazoOpen, setRechazoOpen] = useState(false);
  const [observaciones, setObservaciones] = useState("");

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
    if (informe.data) setValues(toForm(informe.data));
    if (informe.data === null) setValues(EMPTY);
  }, [informe.data]);

  const set = <K extends keyof FormValues>(field: K, v: FormValues[K]) =>
    setValues((prev) => ({ ...prev, [field]: v }));

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
