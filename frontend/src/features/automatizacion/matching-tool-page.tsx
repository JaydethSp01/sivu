import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  GraduationCap,
  History,
  Info,
  Lightbulb,
  Loader2,
  Sparkles,
  Star,
  Tags,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Combobox } from "@/components/combobox";
import { api, extractApiMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import type {
  DesgloseCriterio,
  DesgloseCriterioCodigo,
  Estudiante,
  MatchingResponse,
  PageResponse,
  Vacante,
} from "@/lib/types";

const ICONO_POR_CODIGO: Record<DesgloseCriterioCodigo, LucideIcon> = {
  PROGRAMA: GraduationCap,
  CREDITOS: BookOpen,
  PROMEDIO: Star,
  KEYWORDS: Tags,
  CONTINUIDAD: History,
};

interface ScoreTheme {
  ring: string;
  text: string;
  badgeVariant: "success" | "warning" | "destructive";
  label: string;
}

function temaPorScore(score: number): ScoreTheme {
  if (score >= 70) {
    return { ring: "stroke-emerald-500", text: "text-emerald-500", badgeVariant: "success", label: "Match alto" };
  }
  if (score >= 40) {
    return { ring: "stroke-amber-500", text: "text-amber-500", badgeVariant: "warning", label: "Match medio" };
  }
  return { ring: "stroke-red-500", text: "text-red-500", badgeVariant: "destructive", label: "Match bajo" };
}

interface ScoreRingProps {
  score: number;
  ringClass: string;
  textClass: string;
}

function ScoreRing({ score, ringClass, textClass }: ScoreRingProps): JSX.Element {
  const size = 192;
  const stroke = 16;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const offset = circumference - (clamped / 100) * circumference;
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          className="stroke-muted fill-none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn("fill-none transition-[stroke-dashoffset] duration-500 ease-out", ringClass)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("text-5xl font-bold tabular-nums", textClass)}>
          {clamped.toFixed(0)}
        </span>
        <span className="text-xs uppercase tracking-wider text-muted-foreground">de 100</span>
      </div>
    </div>
  );
}

interface CriterioCardProps {
  criterio: DesgloseCriterio;
}

function CriterioCard({ criterio }: CriterioCardProps): JSX.Element {
  const Icon = ICONO_POR_CODIGO[criterio.codigo] ?? Sparkles;
  const obtenido = Number(criterio.obtenido);
  const pct = criterio.pesoMaximo > 0 ? (obtenido / criterio.pesoMaximo) * 100 : 0;
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            <div
              className={cn(
                "rounded-md p-2",
                criterio.cumple ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">{criterio.nombre}</CardTitle>
              <CardDescription className="font-mono text-xs">
                {obtenido.toFixed(0)} / {criterio.pesoMaximo} pts
              </CardDescription>
            </div>
          </div>
          <Badge variant={criterio.cumple ? "success" : "muted"}>
            {criterio.cumple ? "✓ Cumplido" : "✗ No cumplido"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Progress value={Math.max(0, Math.min(100, pct))} />
        <p className="text-sm text-foreground/90">{criterio.detalle}</p>
        {criterio.sugerencia && (
          <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-2 text-xs text-amber-700 dark:text-amber-400">
            <Lightbulb className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              <strong>Sugerencia:</strong> {criterio.sugerencia}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function MatchingToolPage(): JSX.Element {
  const [estudianteId, setEstudianteId] = useState<number | null>(null);
  const [vacanteId, setVacanteId] = useState<number | null>(null);
  const [result, setResult] = useState<MatchingResponse | null>(null);

  const estudiantes = useQuery({
    queryKey: ["/estudiantes", "all-for-matching"],
    queryFn: async () =>
      (
        await api.get<PageResponse<Estudiante>>("/estudiantes", {
          params: { page: 0, size: 200 },
        })
      ).data.content,
  });

  const vacantes = useQuery({
    queryKey: ["/vacantes", "all-for-matching"],
    queryFn: async () =>
      (
        await api.get<PageResponse<Vacante>>("/vacantes", {
          params: { page: 0, size: 200 },
        })
      ).data.content,
  });

  const calcular = useMutation({
    mutationFn: async () => {
      if (!estudianteId || !vacanteId) throw new Error("Selecciona estudiante y vacante");
      const { data } = await api.get<MatchingResponse>("/automatizacion/matching", {
        params: { estudianteId, vacanteId },
      });
      return data;
    },
    onSuccess: (data) => setResult(data),
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  const score = result ? Number(result.score) : 0;
  const tema = useMemo(() => temaPorScore(score), [score]);
  const desglose = result?.desglose ?? [];
  const sugerencias = desglose
    .map((d) => d.sugerencia)
    .filter((s): s is string => Boolean(s));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Herramienta de matching</h1>
        <p className="text-sm text-muted-foreground">
          Calcula el score de afinidad entre un estudiante y una vacante sin crear la postulación.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Parámetros</CardTitle>
          <CardDescription>Selecciona el estudiante y la vacante a evaluar.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Combobox
              items={estudiantes.data ?? []}
              value={estudianteId}
              onChange={setEstudianteId}
              placeholder="Selecciona un estudiante"
              searchPlaceholder="Buscar estudiante..."
              getKey={(e) => e.id}
              getLabel={(e) => `${e.nombres} ${e.apellidos}`}
              getSecondary={(e) => `${e.programaAcademico} · sem ${e.semestre}`}
            />
            <Combobox
              items={vacantes.data ?? []}
              value={vacanteId}
              onChange={setVacanteId}
              placeholder="Selecciona una vacante"
              searchPlaceholder="Buscar vacante..."
              getKey={(v) => v.id}
              getLabel={(v) => v.titulo}
              getSecondary={(v) => `${v.empresa?.razonSocial ?? ""} · ${v.areaPractica}`}
            />
          </div>
          <Button
            onClick={() => calcular.mutate()}
            disabled={calcular.isPending || !estudianteId || !vacanteId}
          >
            {calcular.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Calcular score
          </Button>
        </CardContent>
      </Card>

      {result && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Resultado del matching</CardTitle>
              <CardDescription>
                Detalle por criterio de evaluación y puntaje total acumulado.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center gap-3 py-2">
                <ScoreRing score={score} ringClass={tema.ring} textClass={tema.text} />
                <Badge variant={result.recomendado ? "success" : "muted"} className="text-sm px-3 py-1">
                  {result.recomendado ? "Recomendado" : "Sin recomendar"}
                </Badge>
                <p className="text-xs text-muted-foreground">{tema.label}</p>
              </div>
            </CardContent>
          </Card>

          {desglose.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {desglose.map((c) => (
                <CriterioCard key={c.codigo} criterio={c} />
              ))}
            </div>
          ) : (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Desglose no disponible</AlertTitle>
              <AlertDescription>
                El backend no devolvió el detalle por criterio. Revisa el bloque de justificación abajo.
              </AlertDescription>
            </Alert>
          )}

          {score < 70 && sugerencias.length > 0 && (
            <Alert variant="warning">
              <Lightbulb className="h-4 w-4" />
              <AlertTitle>Para mejorar tu match, considera:</AlertTitle>
              <AlertDescription>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  {sugerencias.map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardContent className="pt-6">
              <details className="text-sm">
                <summary className="cursor-pointer font-medium text-muted-foreground hover:text-foreground">
                  Ver justificación cruda (debug / transparencia)
                </summary>
                <pre className="mt-3 whitespace-pre-wrap rounded-md bg-muted p-3 text-xs font-mono">
                  {result.justificacion}
                </pre>
              </details>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
