import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { queryClient } from "@/lib/query-client";
import { applyTheme, getStoredTheme } from "@/lib/theme";
import { ProtectedRoute } from "@/components/protected-route";
import { RoleGuard } from "@/components/role-guard";
import { AppShell } from "@/components/layout/app-shell";
// Login / Register / NotFound se cargan eager: son entradas críticas y muy pequeñas.
import { LoginPage } from "@/features/auth/login-page";
import { RegisterPage } from "@/features/auth/register-page";
import { NotFoundPage } from "@/pages/not-found";
import { ForbiddenPage } from "@/pages/forbidden";

// Páginas internas: code-split por ruta. Cada feature queda en su propio chunk
// y se descarga solo cuando el usuario navega a esa ruta.
const DashboardPage             = lazy(() => import("@/features/dashboard/dashboard-page").then(m => ({ default: m.DashboardPage })));
const EstudiantesListPage       = lazy(() => import("@/features/estudiantes/estudiantes-list-page").then(m => ({ default: m.EstudiantesListPage })));
const EstudianteFormPage        = lazy(() => import("@/features/estudiantes/estudiante-form-page").then(m => ({ default: m.EstudianteFormPage })));
const EstudianteDetailPage      = lazy(() => import("@/features/estudiantes/estudiante-detail-page").then(m => ({ default: m.EstudianteDetailPage })));
const EmpresasListPage          = lazy(() => import("@/features/empresas/empresas-list-page").then(m => ({ default: m.EmpresasListPage })));
const EmpresaFormPage           = lazy(() => import("@/features/empresas/empresa-form-page").then(m => ({ default: m.EmpresaFormPage })));
const EmpresaDetailPage         = lazy(() => import("@/features/empresas/empresa-detail-page").then(m => ({ default: m.EmpresaDetailPage })));
const DocumentosListPage        = lazy(() => import("@/features/documentos/documentos-list-page").then(m => ({ default: m.DocumentosListPage })));
const DocumentoFormPage         = lazy(() => import("@/features/documentos/documento-form-page").then(m => ({ default: m.DocumentoFormPage })));
const DocumentoDetailPage       = lazy(() => import("@/features/documentos/documento-detail-page").then(m => ({ default: m.DocumentoDetailPage })));
const ConveniosListPage         = lazy(() => import("@/features/convenios/convenios-list-page").then(m => ({ default: m.ConveniosListPage })));
const ConvenioDetailPage        = lazy(() => import("@/features/convenios/convenio-detail-page").then(m => ({ default: m.ConvenioDetailPage })));
const AsignarPracticaPage       = lazy(() => import("@/features/convenios/asignar-practica-page").then(m => ({ default: m.AsignarPracticaPage })));
const UsuariosAdminPage         = lazy(() => import("@/features/admin/usuarios-admin-page").then(m => ({ default: m.UsuariosAdminPage })));
const TutoresListPage           = lazy(() => import("@/features/tutores/tutores-list-page").then(m => ({ default: m.TutoresListPage })));
const TutorFormPage             = lazy(() => import("@/features/tutores/tutor-form-page").then(m => ({ default: m.TutorFormPage })));
const TutorDetailPage           = lazy(() => import("@/features/tutores/tutor-detail-page").then(m => ({ default: m.TutorDetailPage })));
const MiEmpresaPage             = lazy(() => import("@/features/mi-empresa/mi-empresa-page").then(m => ({ default: m.MiEmpresaPage })));
const PlanActividadesPage       = lazy(() => import("@/features/trimestres/plan-actividades-page").then(m => ({ default: m.PlanActividadesPage })));
const ActasListPage             = lazy(() => import("@/features/trimestres/actas-list-page").then(m => ({ default: m.ActasListPage })));
const ActaFormPage              = lazy(() => import("@/features/trimestres/acta-form-page").then(m => ({ default: m.ActaFormPage })));
const PlanesMejoraPage          = lazy(() => import("@/features/trimestres/planes-mejora-page").then(m => ({ default: m.PlanesMejoraPage })));
const InformeFinalPmPage        = lazy(() => import("@/features/trimestres/informe-final-pm-page").then(m => ({ default: m.InformeFinalPmPage })));
const EvaluacionTutorPage       = lazy(() => import("@/features/trimestres/evaluacion-tutor-page").then(m => ({ default: m.EvaluacionTutorPage })));
const EvaluacionProfesorPage    = lazy(() => import("@/features/trimestres/evaluacion-profesor-page").then(m => ({ default: m.EvaluacionProfesorPage })));
const DisponibilidadPage        = lazy(() => import("@/features/agendamiento/disponibilidad-page").then(m => ({ default: m.DisponibilidadPage })));
const ProponerReunionPage       = lazy(() => import("@/features/agendamiento/proponer-reunion-page").then(m => ({ default: m.ProponerReunionPage })));
const BandejaReunionesPage      = lazy(() => import("@/features/agendamiento/bandeja-reuniones-page").then(m => ({ default: m.BandejaReunionesPage })));
const EvaluacionTutorTokenPage  = lazy(() => import("@/features/evaluacion-externa/evaluacion-tutor-token-page").then(m => ({ default: m.EvaluacionTutorTokenPage })));
const ExpedientesIndexPage      = lazy(() => import("@/features/expedientes/expediente-page").then(m => ({ default: m.ExpedientesIndexPage })));
const ExpedientePage            = lazy(() => import("@/features/expedientes/expediente-page").then(m => ({ default: m.ExpedientePage })));

function RouteFallback(): JSX.Element {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex items-center gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="text-sm">Cargando…</span>
      </div>
    </div>
  );
}

export function App(): JSX.Element {
  useEffect(() => {
    applyTheme(getStoredTheme());
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/403" element={<ForbiddenPage />} />

            {/* Acceso externo del tutor empresarial por token (sin login) */}
            <Route path="/evaluacion-tutor-externo" element={<EvaluacionTutorTokenPage />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<AppShell />}>
                <Route index element={<DashboardPage />} />

                <Route element={<RoleGuard allow={["ADMIN", "COORDINADOR", "DOCENTE", "TUTOR"]} />}>
                  <Route path="estudiantes" element={<EstudiantesListPage />} />
                  <Route path="estudiantes/:id" element={<EstudianteDetailPage />} />
                </Route>
                <Route element={<RoleGuard allow={["ADMIN", "COORDINADOR"]} />}>
                  <Route path="estudiantes/new" element={<EstudianteFormPage />} />
                  <Route path="estudiantes/:id/edit" element={<EstudianteFormPage />} />
                </Route>

                {/* El registro/edición de empresas coformadoras lo gestiona la
                    Oficina de Coformación; el tutor sólo ve su propia empresa (/mi-empresa). */}
                <Route element={<RoleGuard allow={["ADMIN", "COORDINADOR"]} />}>
                  <Route path="empresas" element={<EmpresasListPage />} />
                  <Route path="empresas/:id" element={<EmpresaDetailPage />} />
                  <Route path="empresas/new" element={<EmpresaFormPage />} />
                  <Route path="empresas/:id/edit" element={<EmpresaFormPage />} />
                </Route>

                <Route element={<RoleGuard allow={["TUTOR", "ADMIN", "COORDINADOR"]} />}>
                  <Route path="mi-empresa" element={<MiEmpresaPage />} />
                </Route>

                {/* Documentos de soporte (EPS, certificados…): Oficina/Admin y el estudiante. */}
                <Route element={<RoleGuard allow={["ADMIN", "COORDINADOR", "ESTUDIANTE"]} />}>
                  <Route path="documentos" element={<DocumentosListPage />} />
                  <Route path="documentos/:id" element={<DocumentoDetailPage />} />
                  <Route path="documentos/new" element={<DocumentoFormPage />} />
                  <Route path="documentos/:id/edit" element={<DocumentoFormPage />} />
                </Route>

                {/* Expediente Digital Unificado (BI-16 / RF-B01) */}
                <Route element={<RoleGuard allow={["ADMIN", "COORDINADOR", "ESTUDIANTE", "DOCENTE", "TUTOR"]} />}>
                  <Route path="expedientes" element={<ExpedientesIndexPage />} />
                  <Route path="expedientes/:estudianteId" element={<ExpedientePage />} />
                </Route>

                {/* Prácticas (antes "convenios"): asignación + flujo de Coformación */}
                <Route element={<RoleGuard allow={["ADMIN", "COORDINADOR"]} />}>
                  <Route path="convenios/asignar" element={<AsignarPracticaPage />} />
                </Route>
                <Route path="convenios" element={<ConveniosListPage />} />
                <Route path="convenios/:id" element={<ConvenioDetailPage />} />
                <Route path="convenios/:convenioId/trimestres/:trimestreId/plan-actividades" element={<PlanActividadesPage />} />
                <Route path="convenios/:convenioId/trimestres/:trimestreId/actas" element={<ActasListPage />} />
                <Route path="convenios/:convenioId/trimestres/:trimestreId/actas/new" element={<ActaFormPage />} />
                <Route path="convenios/:convenioId/trimestres/:trimestreId/actas/:id" element={<ActaFormPage />} />
                <Route path="convenios/:convenioId/trimestres/:trimestreId/planes-mejora" element={<PlanesMejoraPage />} />
                <Route path="convenios/:convenioId/trimestres/:trimestreId/planes-mejora/:planMejoraId/informe-final" element={<InformeFinalPmPage />} />
                <Route path="convenios/:convenioId/trimestres/:trimestreId/evaluacion-tutor" element={<EvaluacionTutorPage />} />
                <Route path="convenios/:convenioId/trimestres/:trimestreId/evaluacion-profesor" element={<EvaluacionProfesorPage />} />

                {/* Agendamiento colaborativo (RF-C01/C02/C03) */}
                <Route element={<RoleGuard allow={["ADMIN", "COORDINADOR", "DOCENTE"]} />}>
                  <Route path="agendamiento/disponibilidad" element={<DisponibilidadPage />} />
                </Route>
                {/* El estudiante propone; el docente acompañante responde
                    (aceptar/rechazar/contraofertar) en la bandeja de reuniones. */}
                <Route element={<RoleGuard allow={["ESTUDIANTE", "ADMIN", "COORDINADOR"]} />}>
                  <Route path="agendamiento/proponer" element={<ProponerReunionPage />} />
                </Route>
                <Route element={<RoleGuard allow={["ESTUDIANTE", "DOCENTE", "ADMIN", "COORDINADOR"]} />}>
                  <Route path="agendamiento/reuniones" element={<BandejaReunionesPage />} />
                </Route>

                {/* Listado de tutores: lo administra la Oficina de Coformación, no el tutor. */}
                <Route element={<RoleGuard allow={["ADMIN", "COORDINADOR", "MCP_AGENT"]} />}>
                  <Route path="tutores" element={<TutoresListPage />} />
                  <Route path="tutores/:id" element={<TutorDetailPage />} />
                </Route>
                <Route element={<RoleGuard allow={["ADMIN", "COORDINADOR"]} />}>
                  <Route path="tutores/new" element={<TutorFormPage />} />
                  <Route path="tutores/:id/edit" element={<TutorFormPage />} />
                </Route>

                <Route element={<RoleGuard allow={["ADMIN"]} />}>
                  <Route path="admin/usuarios" element={<UsuariosAdminPage />} />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<NotFoundPage />} />
            <Route path="/404" element={<Navigate to="/not-found" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
      <Toaster />
    </QueryClientProvider>
  );
}
