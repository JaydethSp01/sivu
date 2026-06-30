import { Link } from "react-router-dom";
import { useQueries, useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
  Bell,
  Building2,
  CalendarClock,
  ClipboardList,
  FolderArchive,
  GraduationCap,
  Info,
  Plus,
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
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/auth-store";
import { PageHeader } from "@/components/page-header";
import type {
  Convenio,
  Empresa,
  PageResponse,
  TrimestreResponse,
} from "@/lib/types";

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
  // Convenios activos → revisa cuántos trimestres tienen ET o EP registrada.
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
  const pendientes = allTrimestres.filter(
    (t) => t.tieneEvaluacionTutor || t.tieneEvaluacionProfesor
  ).length;

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
  const convenios = useCount("/convenios");
  const tutoresActivos = useCount("/tutores", { estado: "ACTIVO" });
  const conveniosActivos = useCount("/convenios", { estado: "ACTIVO" });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Panel de Coformación"
        description="Una mirada rápida al programa: estudiantes, empresas y prácticas en curso."
        icon={GraduationCap}
        actions={
          <Button asChild>
            <Link to="/convenios/asignar">
              <Plus className="h-4 w-4" /> Asignar práctica
            </Link>
          </Button>
        }
      />

      <CoordinadorBanners />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Estudiantes" value={estudiantes.data ?? "—"} icon={Users} tone="primary" />
        <Kpi label="Empresas aliadas" value={empresas.data ?? "—"} icon={Building2} tone="accent" />
        <Kpi label="Prácticas (convenios)" value={convenios.data ?? "—"} icon={GraduationCap} tone="secondary" />
        <Kpi label="Tutores activos" value={tutoresActivos.data ?? "—"} icon={UserCog} tone="success" />
      </div>

      <div className="grid gap-4 sm:grid-cols-1">
        <Kpi
          label="Convenios activos"
          value={conveniosActivos.data ?? "—"}
          icon={GraduationCap}
          hint="Prácticas en curso"
          tone="primary"
        />
      </div>
    </div>
  );
}

function EstudianteDashboard(): JSX.Element {
  const usuario = useAuthStore((s) => s.usuario);
  const estudianteId = usuario?.estudianteId;

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
        description="El estado de tu práctica y el seguimiento por trimestres."
        icon={GraduationCap}
      />

      {convenioFuturo.data && (
        <Alert variant="warning">
          <CalendarClock className="h-4 w-4" />
          <AlertTitle>Tu práctica empieza pronto</AlertTitle>
          <AlertDescription>
            Tu práctica inicia el {format(parseISO(convenioFuturo.data.fechaInicio), "PP", { locale: es })}.
            <div className="mt-2 flex gap-2">
              <Button asChild size="sm" variant="outline">
                <Link to={`/convenios/${convenioFuturo.data.id}`}>Ver mi convenio</Link>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {convenioActivo.data && trimestreActivo && trimestreActivo.tienePlanActividades && (
        <Alert variant="default" className="border-primary/40 bg-primary/5">
          <Info className="h-4 w-4" />
          <AlertTitle>Trimestre {trimestreActivo.numero} en curso</AlertTitle>
          <AlertDescription>
            Tu Plan de Actividades del trimestre puede tener pendientes de firmar.
            <div className="mt-2">
              <Button asChild size="sm">
                <Link to={`/convenios/${convenioActivo.data.id}/trimestres/${trimestreActivo.id}/plan-actividades`}>
                  Ir al Plan de Actividades
                </Link>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {convenioActivo.data ? (
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
            <div className="mt-3 flex gap-2">
              <Button asChild variant="outline" size="sm">
                <Link to={`/convenios/${convenioActivo.data.id}`}>Ver convenio</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link to="/expedientes">
                  <FolderArchive className="h-4 w-4" /> Mi expediente
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        !convenioFuturo.data && (
          <EmptyState
            title="Aún no tienes una práctica activa"
            description="Cuando Coformación te asigne una práctica, aparecerá aquí."
          />
        )
      )}
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

  const totalConvenios = conveniosEmpresa.data?.length ?? 0;
  const conveniosActivos = (conveniosEmpresa.data ?? []).filter((c) => c.estado === "ACTIVO").length;

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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Panel de empresa"
        description="Tus practicantes vinculados y las prácticas en curso."
        icon={Building2}
      />
      {empresa.data && empresa.data.estado !== "ACTIVA" && (
        <Alert variant="warning">
          <Info className="h-4 w-4" />
          <AlertTitle>Tu empresa aún no está activa</AlertTitle>
          <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span>Espera la validación de Coformación.</span>
            <Button asChild size="sm" variant="outline">
              <Link to="/mi-empresa">Ir a Mi empresa</Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
        <Kpi label="Practicantes (convenios)" value={totalConvenios} icon={Users} tone="primary" />
        <Kpi
          label="Prácticas activas"
          value={conveniosActivos}
          icon={ClipboardList}
          hint="Convenios en curso"
          tone="accent"
        />
      </div>
    </div>
  );
}

export function DashboardPage(): JSX.Element {
  const hasRole = useAuthStore((s) => s.hasRole);
  if (hasRole("ADMIN", "COORDINADOR")) return <AdminDashboard />;
  if (hasRole("TUTOR")) return <EmpresaDashboard />;
  if (hasRole("ESTUDIANTE")) return <EstudianteDashboard />;
  return (
    <EmptyState
      title="Sin rol asignado"
      description="Contacta con un administrador para que te asigne un rol."
    />
  );
}
