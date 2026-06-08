import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  BarChart3,
  Briefcase,
  Building2,
  CheckCircle2,
  FileSignature,
  FileText,
  Loader2,
  Send,
  TrendingUp,
  Users,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import type {
  AnalyticsEmbudo,
  AnalyticsEmpleabilidadResumen,
  AnalyticsResumen,
  EstudianteEnRiesgo,
} from "@/lib/types";

const ESTADO_LABELS: Record<string, string> = {
  POSTULADA: "Postulada",
  EN_REVISION: "En revisión",
  ENTREVISTA_PROGRAMADA: "Entrevista programada",
  ENTREVISTA_REALIZADA: "Entrevista realizada",
  PRESELECCIONADA: "Preseleccionada",
  ACEPTADA: "Aceptada",
  RECHAZADA: "Rechazada",
  RETIRADA: "Retirada",
};

export function AnalyticsPage(): JSX.Element {
  const resumen = useQuery({
    queryKey: ["/analytics/resumen"],
    queryFn: async () => (await api.get<AnalyticsResumen>("/analytics/resumen")).data,
  });
  const embudo = useQuery({
    queryKey: ["/analytics/embudo"],
    queryFn: async () => (await api.get<AnalyticsEmbudo>("/analytics/embudo-postulaciones")).data,
  });
  const empleabilidad = useQuery({
    queryKey: ["/analytics/empleabilidad"],
    queryFn: async () => (await api.get<AnalyticsEmpleabilidadResumen>("/analytics/empleabilidad")).data,
  });
  const riesgo = useQuery({
    queryKey: ["/analytics/estudiantes-en-riesgo"],
    queryFn: async () => (await api.get<EstudianteEnRiesgo[]>("/analytics/estudiantes-en-riesgo")).data,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analítica institucional"
        description="Métricas agregadas de Coformación: empleabilidad, embudo de postulaciones y estudiantes en riesgo."
        icon={BarChart3}
      />

      {/* KPIs */}
      {resumen.isLoading ? (
        <SectionLoader />
      ) : resumen.data ? (
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
          <KpiCard icon={Users} label="Estudiantes activos" value={resumen.data.estudiantesActivos} tone="primary" />
          <KpiCard icon={Building2} label="Empresas activas" value={resumen.data.empresasActivas} tone="accent" />
          <KpiCard icon={Briefcase} label="Vacantes publicadas" value={resumen.data.vacantesPublicadas} />
          <KpiCard icon={FileSignature} label="Convenios activos" value={resumen.data.convenios_ACTIVOS} tone="success" />
          <KpiCard icon={FileText} label="HV en revisión" value={resumen.data.hvEnRevision} tone="warning" />
          <KpiCard
            icon={AlertTriangle}
            label="Plazos urgentes"
            value={resumen.data.alertasPlazoUrgente}
            tone={resumen.data.alertasPlazoUrgente > 0 ? "destructive" : "muted"}
          />
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Empleabilidad */}
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h2 className="font-display text-base font-semibold">Empleabilidad / continuidad</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              ¿Qué porcentaje de practicantes quedan contratados por la empresa al cierre del proceso?
              Calculado sobre las evaluaciones GAC-FM-007 con respuesta a la pregunta de continuidad.
            </p>
            {empleabilidad.isLoading ? (
              <SectionLoader inline />
            ) : !empleabilidad.data || empleabilidad.data.convenios === 0 ? (
              <EmptyState
                title="Aún sin datos"
                description="Cuando se registren evaluaciones del tutor con respuesta de continuidad, aparecerán aquí."
              />
            ) : (
              <div>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <MiniStat label="Convenios evaluados" value={empleabilidad.data.convenios} />
                  <MiniStat label="Continuidad SÍ" value={empleabilidad.data.continuidadSi} tone="success" />
                  <MiniStat
                    label="Tasa global"
                    value={`${empleabilidad.data.tasaContinuidadGlobal}%`}
                    tone="primary"
                  />
                </div>
                <div className="space-y-2">
                  {empleabilidad.data.topEmpresas.map((e) => (
                    <div key={e.empresaId} className="flex items-center gap-3 text-sm">
                      <div className="w-44 truncate font-medium">{e.razonSocial}</div>
                      <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-accent"
                          style={{ width: `${Math.min(100, Number(e.tasaContinuidad))}%` }}
                        />
                      </div>
                      <div className="w-16 text-right text-xs text-muted-foreground">
                        {e.tasaContinuidad}%
                      </div>
                      <div className="w-20 text-right text-[10px] text-muted-foreground">
                        {e.continuidadSi}/{e.continuidadSi + e.continuidadNo}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Embudo postulaciones */}
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 mb-2">
              <Send className="h-4 w-4 text-primary" />
              <h2 className="font-display text-base font-semibold">Embudo de postulaciones</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Cuántas postulaciones hay en cada estado. Sirve para ver dónde se atascan los estudiantes.
            </p>
            {embudo.isLoading ? (
              <SectionLoader inline />
            ) : !embudo.data || embudo.data.total === 0 ? (
              <EmptyState title="Aún sin postulaciones" />
            ) : (
              <div className="space-y-2">
                {Object.entries(embudo.data.conteoPorEstado).map(([estado, n]) => {
                  const pct = embudo.data!.total === 0 ? 0 : (n / embudo.data!.total) * 100;
                  return (
                    <div key={estado} className="flex items-center gap-3 text-sm">
                      <div className="w-44 truncate">{ESTADO_LABELS[estado] ?? estado}</div>
                      <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                        <div className="h-full bg-secondary" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="w-12 text-right text-xs text-muted-foreground">{n}</div>
                    </div>
                  );
                })}
                <div className="pt-2 text-xs text-muted-foreground border-t border-border/60 mt-3">
                  Total postulaciones: <span className="font-semibold text-foreground">{embudo.data.total}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Estudiantes en riesgo */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <h2 className="font-display text-base font-semibold">Estudiantes en riesgo</h2>
            <Badge variant="muted">{riesgo.data?.length ?? 0}</Badge>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Estudiantes ACTIVOS cuya cohorte ya inició y aún no tienen Hoja de Vida aprobada
            o no han iniciado postulaciones. Candidatos a contacto proactivo.
          </p>
          {riesgo.isLoading ? (
            <SectionLoader inline />
          ) : (riesgo.data ?? []).length === 0 ? (
            <div className="flex items-center text-sm text-muted-foreground gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              Sin estudiantes en riesgo en este momento.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase tracking-wide text-muted-foreground border-b border-border/60">
                  <tr>
                    <th className="text-left py-2 px-2">Estudiante</th>
                    <th className="text-left py-2 px-2">Programa</th>
                    <th className="text-left py-2 px-2">Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {(riesgo.data ?? []).map((e) => (
                    <tr key={e.id} className="border-b border-border/30">
                      <td className="py-2 px-2">
                        <div className="font-medium">{e.nombreCompleto}</div>
                        <div className="text-xs text-muted-foreground">{e.email}</div>
                      </td>
                      <td className="py-2 px-2 text-xs text-muted-foreground">{e.programa}</td>
                      <td className="py-2 px-2">
                        <Badge variant="warning">{e.motivo}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface KpiCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  tone?: "primary" | "accent" | "success" | "warning" | "destructive" | "muted";
}

function KpiCard({ icon: Icon, label, value, tone = "muted" }: KpiCardProps): JSX.Element {
  const tones: Record<string, string> = {
    primary: "bg-primary-soft text-primary",
    accent: "bg-accent-soft text-accent",
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning",
    destructive: "bg-destructive-soft text-destructive",
    muted: "bg-muted text-muted-foreground",
  };
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
            <div className="font-display text-2xl font-bold mt-0.5">{value}</div>
          </div>
          <div className={cn("rounded-lg p-2", tones[tone])}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: number | string; tone?: "success" | "primary" }): JSX.Element {
  return (
    <div className="rounded-md border border-border/60 p-2.5">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={cn(
        "font-display text-xl font-bold mt-0.5",
        tone === "success" && "text-success",
        tone === "primary" && "text-primary",
      )}>{value}</div>
    </div>
  );
}

function SectionLoader({ inline = false }: { inline?: boolean }): JSX.Element {
  return (
    <div className={cn("flex items-center text-sm text-muted-foreground", inline ? "" : "min-h-[80px]")}>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando...
    </div>
  );
}
