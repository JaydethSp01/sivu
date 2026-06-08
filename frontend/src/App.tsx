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
const VacantesListPage          = lazy(() => import("@/features/vacantes/vacantes-list-page").then(m => ({ default: m.VacantesListPage })));
const VacanteFormPage           = lazy(() => import("@/features/vacantes/vacante-form-page").then(m => ({ default: m.VacanteFormPage })));
const VacanteDetailPage         = lazy(() => import("@/features/vacantes/vacante-detail-page").then(m => ({ default: m.VacanteDetailPage })));
const PostulacionesListPage     = lazy(() => import("@/features/postulaciones/postulaciones-list-page").then(m => ({ default: m.PostulacionesListPage })));
const NuevaPostulacionPage      = lazy(() => import("@/features/postulaciones/nueva-postulacion-page").then(m => ({ default: m.NuevaPostulacionPage })));
const PostulacionDetailPage     = lazy(() => import("@/features/postulaciones/postulacion-detail-page").then(m => ({ default: m.PostulacionDetailPage })));
const DocumentosListPage        = lazy(() => import("@/features/documentos/documentos-list-page").then(m => ({ default: m.DocumentosListPage })));
const DocumentoFormPage         = lazy(() => import("@/features/documentos/documento-form-page").then(m => ({ default: m.DocumentoFormPage })));
const DocumentoDetailPage       = lazy(() => import("@/features/documentos/documento-detail-page").then(m => ({ default: m.DocumentoDetailPage })));
const ConveniosListPage         = lazy(() => import("@/features/convenios/convenios-list-page").then(m => ({ default: m.ConveniosListPage })));
const ConvenioDetailPage        = lazy(() => import("@/features/convenios/convenio-detail-page").then(m => ({ default: m.ConvenioDetailPage })));
const MatchingToolPage          = lazy(() => import("@/features/automatizacion/matching-tool-page").then(m => ({ default: m.MatchingToolPage })));
const MiHojaVidaPage            = lazy(() => import("@/features/hoja-vida/mi-hoja-vida-page").then(m => ({ default: m.MiHojaVidaPage })));
const BandejaHvPage             = lazy(() => import("@/features/hoja-vida/bandeja-hv-page").then(m => ({ default: m.BandejaHvPage })));
const EntrevistasListPage       = lazy(() => import("@/features/entrevistas/entrevistas-list-page").then(m => ({ default: m.EntrevistasListPage })));
const FabricaSolucionesPage     = lazy(() => import("@/features/fabrica-soluciones/fabrica-soluciones-page").then(m => ({ default: m.FabricaSolucionesPage })));
const SolicitudesFabricaPage    = lazy(() => import("@/features/fabrica-soluciones/solicitudes-fabrica-page").then(m => ({ default: m.SolicitudesFabricaPage })));
const PlantillasListPage        = lazy(() => import("@/features/plantillas/plantillas-list-page").then(m => ({ default: m.PlantillasListPage })));
const PlantillaDetailPage       = lazy(() => import("@/features/plantillas/plantilla-detail-page").then(m => ({ default: m.PlantillaDetailPage })));
const MisFormulariosPage        = lazy(() => import("@/features/plantillas/mis-formularios-page").then(m => ({ default: m.MisFormulariosPage })));
const RespuestaLlenarPage       = lazy(() => import("@/features/plantillas/respuesta-llenar-page").then(m => ({ default: m.RespuestaLlenarPage })));
const UsuariosAdminPage         = lazy(() => import("@/features/admin/usuarios-admin-page").then(m => ({ default: m.UsuariosAdminPage })));
const AnalyticsPage             = lazy(() => import("@/features/analytics/analytics-page").then(m => ({ default: m.AnalyticsPage })));
const TutoresListPage           = lazy(() => import("@/features/tutores/tutores-list-page").then(m => ({ default: m.TutoresListPage })));
const TutorFormPage             = lazy(() => import("@/features/tutores/tutor-form-page").then(m => ({ default: m.TutorFormPage })));
const TutorDetailPage           = lazy(() => import("@/features/tutores/tutor-detail-page").then(m => ({ default: m.TutorDetailPage })));
const ModalidadesListPage       = lazy(() => import("@/features/catalogos/modalidades-list-page").then(m => ({ default: m.ModalidadesListPage })));
const ModalidadFormPage         = lazy(() => import("@/features/catalogos/modalidad-form-page").then(m => ({ default: m.ModalidadFormPage })));
const TiposRequisitoListPage    = lazy(() => import("@/features/catalogos/tipos-requisito-list-page").then(m => ({ default: m.TiposRequisitoListPage })));
const TipoRequisitoFormPage     = lazy(() => import("@/features/catalogos/tipo-requisito-form-page").then(m => ({ default: m.TipoRequisitoFormPage })));
const MatrizRequisitosPage      = lazy(() => import("@/features/catalogos/matriz-requisitos-page").then(m => ({ default: m.MatrizRequisitosPage })));
const ProponerEmpresaPage       = lazy(() => import("@/features/empresas/proponer-empresa-page").then(m => ({ default: m.ProponerEmpresaPage })));
const MiEmpresaPage             = lazy(() => import("@/features/mi-empresa/mi-empresa-page").then(m => ({ default: m.MiEmpresaPage })));
const PlanActividadesPage       = lazy(() => import("@/features/trimestres/plan-actividades-page").then(m => ({ default: m.PlanActividadesPage })));
const ActasListPage             = lazy(() => import("@/features/trimestres/actas-list-page").then(m => ({ default: m.ActasListPage })));
const ActaFormPage              = lazy(() => import("@/features/trimestres/acta-form-page").then(m => ({ default: m.ActaFormPage })));
const PlanesMejoraPage          = lazy(() => import("@/features/trimestres/planes-mejora-page").then(m => ({ default: m.PlanesMejoraPage })));
const InformeFinalPmPage        = lazy(() => import("@/features/trimestres/informe-final-pm-page").then(m => ({ default: m.InformeFinalPmPage })));
const EvaluacionTutorPage       = lazy(() => import("@/features/trimestres/evaluacion-tutor-page").then(m => ({ default: m.EvaluacionTutorPage })));
const EvaluacionProfesorPage    = lazy(() => import("@/features/trimestres/evaluacion-profesor-page").then(m => ({ default: m.EvaluacionProfesorPage })));

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

            <Route element={<ProtectedRoute />}>
              <Route element={<AppShell />}>
                <Route index element={<DashboardPage />} />

                <Route element={<RoleGuard allow={["ADMIN", "COORDINADOR", "EMPRESA"]} />}>
                  <Route path="estudiantes" element={<EstudiantesListPage />} />
                  <Route path="estudiantes/:id" element={<EstudianteDetailPage />} />
                </Route>
                <Route element={<RoleGuard allow={["ADMIN", "COORDINADOR"]} />}>
                  <Route path="estudiantes/new" element={<EstudianteFormPage />} />
                  <Route path="estudiantes/:id/edit" element={<EstudianteFormPage />} />
                </Route>

                <Route element={<RoleGuard allow={["ADMIN", "COORDINADOR", "EMPRESA"]} />}>
                  <Route path="empresas" element={<EmpresasListPage />} />
                  <Route path="empresas/:id" element={<EmpresaDetailPage />} />
                  <Route path="empresas/new" element={<EmpresaFormPage />} />
                  <Route path="empresas/:id/edit" element={<EmpresaFormPage />} />
                </Route>

                <Route path="vacantes" element={<VacantesListPage />} />
                <Route path="vacantes/:id" element={<VacanteDetailPage />} />
                <Route element={<RoleGuard allow={["ADMIN", "COORDINADOR", "EMPRESA"]} />}>
                  <Route path="vacantes/new" element={<VacanteFormPage />} />
                  <Route path="vacantes/:id/edit" element={<VacanteFormPage />} />
                </Route>

                <Route path="postulaciones" element={<PostulacionesListPage />} />
                <Route path="postulaciones/new" element={<NuevaPostulacionPage />} />
                <Route path="postulaciones/:id" element={<PostulacionDetailPage />} />

                <Route path="entrevistas" element={<EntrevistasListPage />} />

                <Route path="documentos" element={<DocumentosListPage />} />
                <Route path="documentos/:id" element={<DocumentoDetailPage />} />
                <Route path="documentos/new" element={<DocumentoFormPage />} />
                <Route path="documentos/:id/edit" element={<DocumentoFormPage />} />

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


                <Route element={<RoleGuard allow={["ADMIN", "COORDINADOR", "EMPRESA", "MCP_AGENT"]} />}>
                  <Route path="tutores" element={<TutoresListPage />} />
                  <Route path="tutores/:id" element={<TutorDetailPage />} />
                </Route>
                <Route element={<RoleGuard allow={["ADMIN", "COORDINADOR"]} />}>
                  <Route path="tutores/new" element={<TutorFormPage />} />
                  <Route path="tutores/:id/edit" element={<TutorFormPage />} />
                </Route>

                <Route element={<RoleGuard allow={["ADMIN", "COORDINADOR"]} />}>
                  <Route path="matching" element={<MatchingToolPage />} />
                  <Route path="fabrica-soluciones" element={<FabricaSolucionesPage />} />
                  <Route path="programa-interno/solicitudes" element={<SolicitudesFabricaPage />} />
                  <Route path="plantillas" element={<PlantillasListPage />} />
                  <Route path="plantillas/:id" element={<PlantillaDetailPage />} />
                </Route>

                <Route path="mis-formularios" element={<MisFormulariosPage />} />
                <Route path="mis-formularios/:id" element={<RespuestaLlenarPage />} />

                <Route element={<RoleGuard allow={["ADMIN"]} />}>
                  <Route path="admin/usuarios" element={<UsuariosAdminPage />} />
                </Route>

                <Route element={<RoleGuard allow={["ADMIN", "COORDINADOR"]} />}>
                  <Route path="analytics" element={<AnalyticsPage />} />
                </Route>

                <Route element={<RoleGuard allow={["ADMIN", "COORDINADOR"]} />}>
                  <Route path="catalogos/modalidades" element={<ModalidadesListPage />} />
                  <Route path="catalogos/modalidades/new" element={<ModalidadFormPage />} />
                  <Route path="catalogos/modalidades/:id/edit" element={<ModalidadFormPage />} />
                  <Route path="catalogos/tipos-requisito" element={<TiposRequisitoListPage />} />
                  <Route path="catalogos/tipos-requisito/new" element={<TipoRequisitoFormPage />} />
                  <Route path="catalogos/tipos-requisito/:id/edit" element={<TipoRequisitoFormPage />} />
                  <Route path="catalogos/matriz" element={<MatrizRequisitosPage />} />
                </Route>

                <Route element={<RoleGuard allow={["ADMIN", "COORDINADOR", "ESTUDIANTE"]} />}>
                  <Route path="empresas/proponer" element={<ProponerEmpresaPage />} />
                </Route>

                <Route element={<RoleGuard allow={["EMPRESA", "ADMIN", "COORDINADOR"]} />}>
                  <Route path="mi-empresa" element={<MiEmpresaPage />} />
                </Route>

                <Route element={<RoleGuard allow={["ESTUDIANTE", "ADMIN", "COORDINADOR"]} />}>
                  <Route path="mi-hoja-vida" element={<MiHojaVidaPage />} />
                </Route>
                <Route element={<RoleGuard allow={["ADMIN", "COORDINADOR"]} />}>
                  <Route path="hoja-vida/bandeja" element={<BandejaHvPage />} />
                  <Route path="hoja-vida/:id" element={<MiHojaVidaPage />} />
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
