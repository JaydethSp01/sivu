import { Link } from "react-router-dom";
import { useQueries, useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
  AlertTriangle,
  Bell,
  Briefcase,
  Building2,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  FileText,
  FileUser,
  GraduationCap,
  Info,
  Plus,
  Send,
  Sparkles,
  UserCog,
  Users,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/auth-store";
import { PageHeader } from "@/components/page-header";
import { MiSolicitudFabricaCard } from "@/features/fabrica-soluciones/mi-solicitud-fabrica-card";
import type {
  Convenio,
  Documento,
  Empresa,
  EstadoPostulacion,
  HojaVidaResponse,
  MatchingResponse,
  PageResponse,
  Postulacion,
  TrimestreResponse,
  Vacante,
} from "@/lib/types";

const POST_ESTADOS: EstadoPostulacion[] = [
  "POSTULADA",
  "EN_REVISION",
  "PRESELECCIONADA",
  "ACEPTADA",
  "RECHAZADA",
  "RETIRADA",
];

interface KpiProps {
  label: string;
  value: number | string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "primary" | "secondary" | "accent" | "success" | "warning";
}

const TONE_BG: Record<NonNullable<KpiProps["tone"]>, string> = {
  primary: "bg-primary-soft text-primary",
  secondary: "bg-secondary-soft text-secondary-foreground",
  accent: "bg-accent-soft text-accent",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
};

function Kpi({ label, value, hint, icon: Icon, tone = "primary" }: KpiProps): JSX.Element {
  return (
    <Card className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-uni-gradient opacity-[0.04] blur-2xl"
      />
      <CardContent className="relative p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {label}
            </p>
            <p className="mt-2 font-display text-3xl font-bold tracking-tight">{value}</p>
            {hint && (
              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{hint}</p>
            )}
          </div>
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-xs",
              TONE_BG[tone]
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function useCount(path: string, params: Record<string, unknown> = {}, enabled = true) {
  return useQuery({
    queryKey: [path, params, "count"],
    enabled,
    queryFn: async () => {
      const { data } = await api.get<PageResponse<unknown>>(path, {
        params: { ...params, page: 0, size: 1 },
      });
      return data.totalElements;
    },
  });
}

function CoordinadorBanners(): JSX.Element | null {
  // Convenios activos → revisa cuántos trimestres tienen ET o EP sin firmar por el profesor.
  const convenios = useQuery({
    queryKey: ["/convenios", "for-coord-banners"],
    queryFn: async () =>
      (
        await api.get<PageResponse<Convenio>>("/convenios", {
          params: { estado: "ACTIVO", page: 0, size: 200 },
        })
      ).data.content,
  });

  const trimestresQueries = useQueries({
    queries: (convenios.data ?? []).map((c) => ({
      queryKey: ["/convenios/trimestres", c.id, "coord-banners"],
      queryFn: async () =>
        (await api.get<TrimestreResponse[]>(`/convenios/${c.id}/trimestres`)).data,
    })),
  });

  const allTrimestres = trimestresQueries.flatMap((q) => q.data ?? []);
  // Heurística: ET o EP creada pero sin firmar (no podemos saber sin pegar 1 más por trimestre, así que aproximamos con "creada")
  const pendientes = allTrimestres.filter((t) => t.tieneEvaluacionTutor || t.tieneEvaluacionProfesor).length;

  if (pendientes === 0) return null;
  return (
    <Alert variant="warning">
      <Bell className="h-4 w-4" />
      <AlertTitle>{pendientes} evaluación{pendientes !== 1 ? "es" : ""} por revisar</AlertTitle>
      <AlertDescription>
        Hay evaluaciones (ET o EP) registradas en trimestres activos que aún pueden requerir tu firma.
      </AlertDescription>
    </Alert>
  );
}

function AdminDashboard(): JSX.Element {
  const estudiantes = useCount("/estudiantes");
  const empresas = useCount("/empresas");
  const vacantesPublicadas = useCount("/vacantes", { estado: "PUBLICADA" });
  const convenios = useCount("/convenios");
  const tutoresActivos = useCount("/tutores", { estado: "ACTIVO" });
  const conveniosActivos = useCount("/convenios", { estado: "ACTIVO" });

  const postQueries = useQueries({
    queries: POST_ESTADOS.map((estado) => ({
      queryKey: ["/postulaciones", "count", estado],
      queryFn: async () => {
        const { data } = await api.get<PageResponse<Postulacion>>("/postulaciones", {
          params: { estado, page: 0, size: 1 },
        });
        return { estado, total: data.totalElements };
      },
    })),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Panel de Coformación"
        description="Una mirada rápida a cómo va el programa: estudiantes, empresas, vacantes y prácticas en curso."
        icon={GraduationCap}
      />

      <CoordinadorBanners />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Estudiantes" value={estudiantes.data ?? "—"} icon={Users} tone="primary" />
        <Kpi label="Empresas aliadas" value={empresas.data ?? "—"} icon={Building2} tone="accent" />
        <Kpi label="Vacantes publicadas" value={vacantesPublicadas.data ?? "—"} icon={Briefcase} tone="success" />
        <Kpi label="Prácticas (convenios)" value={convenios.data ?? "—"} icon={GraduationCap} tone="secondary" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
        <Kpi label="Tutores activos" value={tutoresActivos.data ?? "—"} icon={UserCog} tone="accent" />
        <Kpi label="Convenios activos" value={conveniosActivos.data ?? "—"} icon={GraduationCap} hint="Prácticas en curso" tone="primary" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Postulaciones por estado</CardTitle>
          <CardDescription>Distribución actual de las postulaciones del flujo.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {postQueries.map((q, i) => (
            <div
              key={POST_ESTADOS[i]}
              className="flex items-center gap-2 rounded-md border bg-card px-3 py-2"
            >
              <StatusBadge kind="postulacion" value={POST_ESTADOS[i]} />
              <span className="text-lg font-bold">{q.data?.total ?? "—"}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function EstudianteDashboard(): JSX.Element {
  const usuario = useAuthStore((s) => s.usuario);
  const estudianteId = usuario?.estudianteId;

  const misPostulaciones = useQuery({
    queryKey: ["/postulaciones", "mias", estudianteId],
    enabled: !!estudianteId,
    queryFn: async () => {
      const { data } = await api.get<PageResponse<Postulacion>>("/postulaciones", {
        params: { estudianteId, page: 0, size: 50 },
      });
      return data;
    },
  });

  const documentos = useQuery({
    queryKey: ["/documentos", "mios", estudianteId],
    enabled: !!estudianteId,
    queryFn: async () => {
      const { data } = await api.get<PageResponse<Documento>>("/documentos", {
        params: { estudianteId, page: 0, size: 50 },
      });
      return data;
    },
  });

  const vacantes = useQuery({
    queryKey: ["/vacantes", "publicadas-recom", estudianteId],
    enabled: !!estudianteId,
    queryFn: async () => {
      const { data } = await api.get<PageResponse<Vacante>>("/vacantes", {
        params: { estado: "PUBLICADA", page: 0, size: 6 },
      });
      return data.content;
    },
  });

  const matchings = useQueries({
    queries: (vacantes.data ?? []).map((v) => ({
      queryKey: ["matching", estudianteId, v.id],
      enabled: !!estudianteId,
      queryFn: async () => {
        const { data } = await api.get<MatchingResponse>("/automatizacion/matching", {
          params: { estudianteId, vacanteId: v.id },
        });
        return { vacante: v, matching: data };
      },
    })),
  });

  const promMatch = (() => {
    const scores = matchings
      .map((m) => m.data?.matching.score)
      .filter((s): s is number | string => s !== undefined && s !== null)
      .map((s) => Number(s));
    if (scores.length === 0) return null;
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  })();

  const pendientes = documentos.data?.content.filter((d) => d.estado === "RECIBIDO").length ?? 0;

  const hojaVida = useQuery({
    queryKey: ["/hoja-vida", estudianteId, "dashboard"],
    enabled: !!estudianteId,
    retry: (failureCount, error) => {
      if (error instanceof AxiosError && error.response?.status === 404) return false;
      return failureCount < 2;
    },
    queryFn: async () => {
      try {
        const { data } = await api.get<HojaVidaResponse>(`/hoja-vida/${estudianteId}`);
        return data;
      } catch (e) {
        if (e instanceof AxiosError && e.response?.status === 404) return null;
        throw e;
      }
    },
  });

  const hvProgress = (() => {
    const data = hojaVida.data;
    if (!data) return { pct: 0, completa: false, exists: false };
    const checks = [
      Boolean(data.perfilSaber?.trim()),
      Boolean(data.perfilHacer?.trim()),
      Boolean(data.perfilSer?.trim()),
      data.habilidades.length > 0,
      data.idiomas.length > 0,
      data.educacion.length > 0,
      data.experienciaFase.length > 0 || data.experienciaLaboral.length > 0,
    ];
    const done = checks.filter(Boolean).length;
    const pct = Math.round((done / checks.length) * 100);
    return { pct, completa: data.completa, exists: true };
  })();

  const convenioActivo = useQuery({
    queryKey: ["/convenios", "mi-activo", estudianteId],
    enabled: !!estudianteId,
    queryFn: async () => {
      const { data } = await api.get<PageResponse<Convenio>>("/convenios", {
        params: { estudianteId, estado: "ACTIVO", page: 0, size: 1 },
      });
      return data.content[0] ?? null;
    },
  });

  const convenioFuturo = useQuery({
    queryKey: ["/convenios", "mi-firmado", estudianteId],
    enabled: !!estudianteId && !convenioActivo.data,
    queryFn: async () => {
      const { data } = await api.get<PageResponse<Convenio>>("/convenios", {
        params: { estudianteId, estado: "FIRMADO_UNIVERSIDAD", page: 0, size: 1 },
      });
      return data.content[0] ?? null;
    },
  });

  const trimestres = useQuery({
    queryKey: ["/convenios/trimestres", convenioActivo.data?.id, "dashboard"],
    enabled: !!convenioActivo.data?.id,
    queryFn: async () =>
      (await api.get<TrimestreResponse[]>(`/convenios/${convenioActivo.data!.id}/trimestres`)).data,
  });

  const trimestreActivo = (trimestres.data ?? []).find(
    (t) => t.estado === "EN_CURSO" || t.estado === "ABIERTO"
  );

  if (!estudianteId) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Bienvenido</h1>
        <EmptyState
          title="Aún no tienes un perfil de estudiante"
          description="Solicita a Coformación que asocie tu cuenta a un registro de estudiante."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mi panel"
        description="Tus postulaciones, documentos y vacantes recomendadas. Todo lo que necesitas para tu práctica."
        icon={FileUser}
      />

      {convenioFuturo.data && (
        <Alert variant="warning">
          <CalendarClock className="h-4 w-4" />
          <AlertTitle>Tu práctica empieza pronto</AlertTitle>
          <AlertDescription>
            Tu práctica inicia el {format(parseISO(convenioFuturo.data.fechaInicio), "PP", { locale: es })}. Completa tu Hoja de Vida y revisa tus requisitos.
            <div className="mt-2 flex gap-2">
              <Button asChild size="sm" variant="outline">
                <Link to="/mi-hoja-vida">Completar HV</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to={`/convenios/${convenioFuturo.data.id}`}>Ver mi convenio</Link>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {convenioActivo.data && trimestreActivo && (() => {
        // Banner azul si hay PA pendiente de firmar por el estudiante
        const paPendiente = trimestreActivo.tienePlanActividades;
        return (
          <div className="space-y-2">
            {paPendiente && (
              <Alert variant="default" className="border-primary/40 bg-primary/5">
                <Info className="h-4 w-4" />
                <AlertTitle>Trimestre {trimestreActivo.numero} en curso</AlertTitle>
                <AlertDescription>
                  Tu Plan de Actividades del trimestre puede tener pendientes de firmar.
                  <div className="mt-2">
                    <Button asChild size="sm">
                      <Link to={`/convenios/${convenioActivo.data!.id}/trimestres/${trimestreActivo.id}/plan-actividades`}>
                        Ir al Plan de Actividades
                      </Link>
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        );
      })()}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Mis postulaciones" value={misPostulaciones.data?.totalElements ?? "—"} icon={Send} tone="primary" />
        <Kpi
          label="Match promedio"
          value={promMatch !== null ? `${promMatch.toFixed(0)}%` : "—"}
          icon={Sparkles}
          hint="De las vacantes más recientes"
          tone="accent"
        />
        <Kpi label="Documentos pendientes" value={pendientes} icon={FileText} hint="Por validar" tone="warning" />
        <Kpi label="Vacantes recomendadas" value={vacantes.data?.length ?? "—"} icon={Briefcase} tone="success" />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileUser className="h-5 w-5 text-primary" />
                Tu Hoja de Vida
                {hvProgress.completa ? (
                  <Badge variant="success" className="ml-1">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Completa
                  </Badge>
                ) : (
                  <Badge variant="warning" className="ml-1">
                    {hvProgress.exists ? `${hvProgress.pct}% completada` : "Sin crear"}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {hvProgress.completa
                  ? "Tu HV está lista para postularte. Puedes descargar el PDF Uniempresarial cuando quieras."
                  : "Completa tu HV para mejorar tus postulaciones y generar el PDF oficial."}
              </CardDescription>
            </div>
            <Button asChild size="sm" variant={hvProgress.completa ? "outline" : "default"}>
              <Link to="/mi-hoja-vida">
                {hvProgress.completa ? "Editar HV" : "Completar Hoja de Vida"}
              </Link>
            </Button>
          </div>
        </CardHeader>
        {hvProgress.exists && !hvProgress.completa && (
          <CardContent>
            <Progress value={hvProgress.pct} />
          </CardContent>
        )}
      </Card>

      {!convenioActivo.data && <MiSolicitudFabricaCard />}

      {convenioActivo.data && (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle>Mi práctica</CardTitle>
                <CardDescription>
                  Convenio activo {convenioActivo.data.numeroConvenio} ·{" "}
                  {convenioActivo.data.empresa?.razonSocial ?? ""}
                </CardDescription>
              </div>
              {trimestreActivo && (
                <Button asChild size="sm">
                  <Link to={`/convenios/${convenioActivo.data.id}/trimestres/${trimestreActivo.id}/actas/new`}>
                    <Plus className="h-4 w-4" /> Nueva acta
                  </Link>
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-md border p-3">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Tutor académico</div>
                <div className="text-sm font-medium mt-1">
                  {convenioActivo.data.tutorAcademico?.nombreCompleto ?? "Sin asignar"}
                </div>
              </div>
              <div className="rounded-md border p-3">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Tutor empresarial</div>
                <div className="text-sm font-medium mt-1">
                  {convenioActivo.data.tutorEmpresarial?.nombreCompleto ?? "Sin asignar"}
                </div>
              </div>
              <div className="rounded-md border p-3">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Trimestres activos</div>
                <div className="text-2xl font-bold">
                  {(trimestres.data ?? []).filter((t) => t.estado === "EN_CURSO" || t.estado === "ABIERTO").length}
                </div>
              </div>
            </div>
            <div className="mt-3">
              <Button asChild variant="outline" size="sm">
                <Link to={`/convenios/${convenioActivo.data.id}`}>Ver convenio</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <CardTitle>Vacantes recomendadas para ti</CardTitle>
              <CardDescription>
                Calculadas por tu programa, promedio y créditos. Postúlate con un clic.
              </CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/vacantes">Ver todas</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {(vacantes.data ?? []).length === 0 ? (
            <EmptyState
              title="Aún no hay vacantes publicadas"
              description="Vuelve pronto. En cuanto las empresas publiquen, aparecerán aquí."
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {matchings.map((m, i) => {
                const v = vacantes.data?.[i];
                if (!v) return null;
                const score = Number(m.data?.matching.score ?? 0);
                const recomendado = m.data?.matching.recomendado;
                return (
                  <article
                    key={v.id}
                    className="group relative flex flex-col gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-xs hover:shadow-md hover:border-primary/30 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-display text-base font-semibold tracking-tight line-clamp-2">
                          {v.titulo}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 truncate">
                          {v.empresa?.razonSocial ?? "Empresa"}
                        </div>
                      </div>
                      {recomendado && (
                        <Badge variant="success" className="shrink-0">
                          <Sparkles className="h-3 w-3 mr-0.5" /> Recomendado
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="muted" className="font-normal">
                        {v.ciudad}
                      </Badge>
                      <Badge variant="muted" className="font-normal">
                        {v.modalidad?.toLowerCase().replace(/^./, (c) => c.toUpperCase())}
                      </Badge>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-baseline justify-between text-xs">
                        <span className="text-muted-foreground">Compatibilidad</span>
                        <span className="font-bold text-foreground">{score.toFixed(0)}%</span>
                      </div>
                      <Progress value={score} />
                    </div>

                    <div className="flex gap-2 pt-1 mt-auto">
                      <Button
                        asChild
                        size="sm"
                        variant="gradient"
                        className="flex-1"
                      >
                        <Link to={`/postulaciones/new?vacanteId=${v.id}`}>
                          <Send className="h-4 w-4" /> Postularme
                        </Link>
                      </Button>
                      <Button asChild size="sm" variant="outline">
                        <Link to={`/vacantes/${v.id}`}>Detalle</Link>
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function EmpresaDashboard(): JSX.Element {
  const usuario = useAuthStore((s) => s.usuario);
  const empresaId = usuario?.empresaId;

  const empresa = useQuery({
    queryKey: ["/empresas", empresaId, "dashboard"],
    enabled: !!empresaId,
    queryFn: async () => (await api.get<Empresa>(`/empresas/${empresaId}`)).data,
  });

  const misVacantes = useQuery({
    queryKey: ["/vacantes", "mias", empresaId],
    enabled: !!empresaId,
    queryFn: async () => {
      const { data } = await api.get<PageResponse<Vacante>>("/vacantes", {
        params: { empresaId, page: 0, size: 100 },
      });
      return data;
    },
  });

  const activasCount = misVacantes.data?.content.filter((v) => v.estado === "PUBLICADA").length ?? 0;

  const postulacionesQueries = useQueries({
    queries: (misVacantes.data?.content ?? []).map((v) => ({
      queryKey: ["/postulaciones", "porVacante", v.id],
      queryFn: async () => {
        const { data } = await api.get<PageResponse<Postulacion>>("/postulaciones", {
          params: { vacanteId: v.id, page: 0, size: 100 },
        });
        return data.content;
      },
    })),
  });

  const todas = postulacionesQueries.flatMap((q) => q.data ?? []);
  const pendientes = todas.filter((p) => p.estado === "POSTULADA" || p.estado === "EN_REVISION").length;

  const conveniosEmpresa = useQuery({
    queryKey: ["/convenios", "for-empresa-dashboard", empresaId],
    enabled: !!empresaId,
    queryFn: async () =>
      (
        await api.get<PageResponse<Convenio>>("/convenios", {
          params: { empresaId, page: 0, size: 200 },
        })
      ).data.content,
  });

  const evaluacionesPendientes = (conveniosEmpresa.data ?? []).filter(
    (c) => c.estado === "ACTIVO"
  ).length;

  if (!empresaId) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Bienvenido</h1>
        <EmptyState
          title="Tu cuenta aún no está vinculada a una empresa"
          description="Solicita a Coformación que vincule tu cuenta con el registro de tu empresa."
        />
      </div>
    );
  }

  const empresaNoAprobada = empresa.data && empresa.data.estado !== "ACTIVA";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Panel de empresa"
        description="Tus vacantes activas, postulaciones recibidas y prácticas en curso, todo en un solo lugar."
        icon={Building2}
      />
      {empresaNoAprobada && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Tu empresa aún no está aprobada como coformadora</AlertTitle>
          <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Completa tus documentos y espera la validación de Coformación para poder
              publicar vacantes.
            </span>
            <Button asChild size="sm" variant="outline">
              <Link to="/mi-empresa">Ir a Mi empresa</Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Kpi label="Vacantes activas" value={activasCount} icon={Briefcase} hint="Disponibles para postular" tone="success" />
        <Kpi label="Total de postulaciones" value={todas.length} icon={Send} tone="primary" />
        <Kpi label="Pendientes de revisar" value={pendientes} icon={FileText} hint="Esperando tu respuesta" tone="warning" />
      </div>
      <div className="grid gap-4 sm:grid-cols-1">
        <Kpi
          label="Evaluaciones por registrar"
          value={evaluacionesPendientes}
          icon={ClipboardList}
          hint="Prácticas activas sin cierre de evaluación"
          tone="accent"
        />
      </div>
    </div>
  );
}

export function DashboardPage(): JSX.Element {
  const hasRole = useAuthStore((s) => s.hasRole);
  if (hasRole("ADMIN", "COORDINADOR")) return <AdminDashboard />;
  if (hasRole("EMPRESA")) return <EmpresaDashboard />;
  if (hasRole("ESTUDIANTE")) return <EstudianteDashboard />;
  return (
    <EmptyState
      title="Sin rol asignado"
      description="Contacta con un administrador para que te asigne un rol."
    />
  );
}
