import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { queryClient } from "@/lib/query-client";
import { applyTheme, getStoredTheme } from "@/lib/theme";
import { ProtectedRoute } from "@/components/protected-route";
import { RoleGuard } from "@/components/role-guard";
import { AppShell } from "@/components/layout/app-shell";
import { LoginPage } from "@/features/auth/login-page";
import { RegisterPage } from "@/features/auth/register-page";
import { DashboardPage } from "@/features/dashboard/dashboard-page";
import { EstudiantesListPage } from "@/features/estudiantes/estudiantes-list-page";
import { EstudianteFormPage } from "@/features/estudiantes/estudiante-form-page";
import { EstudianteDetailPage } from "@/features/estudiantes/estudiante-detail-page";
import { EmpresasListPage } from "@/features/empresas/empresas-list-page";
import { EmpresaFormPage } from "@/features/empresas/empresa-form-page";
import { EmpresaDetailPage } from "@/features/empresas/empresa-detail-page";
import { VacantesListPage } from "@/features/vacantes/vacantes-list-page";
import { VacanteFormPage } from "@/features/vacantes/vacante-form-page";
import { VacanteDetailPage } from "@/features/vacantes/vacante-detail-page";
import { PostulacionesListPage } from "@/features/postulaciones/postulaciones-list-page";
import { NuevaPostulacionPage } from "@/features/postulaciones/nueva-postulacion-page";
import { PostulacionDetailPage } from "@/features/postulaciones/postulacion-detail-page";
import { DocumentosListPage } from "@/features/documentos/documentos-list-page";
import { DocumentoFormPage } from "@/features/documentos/documento-form-page";
import { DocumentoDetailPage } from "@/features/documentos/documento-detail-page";
import { ConveniosListPage } from "@/features/convenios/convenios-list-page";
import { ConvenioDetailPage } from "@/features/convenios/convenio-detail-page";
import { MatchingToolPage } from "@/features/automatizacion/matching-tool-page";
import { MiHojaVidaPage } from "@/features/hoja-vida/mi-hoja-vida-page";
import { BandejaHvPage } from "@/features/hoja-vida/bandeja-hv-page";
import { EntrevistasListPage } from "@/features/entrevistas/entrevistas-list-page";
import { TutoresListPage } from "@/features/tutores/tutores-list-page";
import { TutorFormPage } from "@/features/tutores/tutor-form-page";
import { TutorDetailPage } from "@/features/tutores/tutor-detail-page";
import { EvaluacionFormPage } from "@/features/evaluaciones/evaluacion-form-page";
import { ModalidadesListPage } from "@/features/catalogos/modalidades-list-page";
import { ModalidadFormPage } from "@/features/catalogos/modalidad-form-page";
import { TiposRequisitoListPage } from "@/features/catalogos/tipos-requisito-list-page";
import { TipoRequisitoFormPage } from "@/features/catalogos/tipo-requisito-form-page";
import { MatrizRequisitosPage } from "@/features/catalogos/matriz-requisitos-page";
import { ProponerEmpresaPage } from "@/features/empresas/proponer-empresa-page";
import { MiEmpresaPage } from "@/features/mi-empresa/mi-empresa-page";
import { PlanActividadesPage } from "@/features/trimestres/plan-actividades-page";
import { ActasListPage } from "@/features/trimestres/actas-list-page";
import { ActaFormPage } from "@/features/trimestres/acta-form-page";
import { PlanesMejoraPage } from "@/features/trimestres/planes-mejora-page";
import { InformeFinalPmPage } from "@/features/trimestres/informe-final-pm-page";
import { EvaluacionTutorPage } from "@/features/trimestres/evaluacion-tutor-page";
import { EvaluacionProfesorPage } from "@/features/trimestres/evaluacion-profesor-page";
import { NotFoundPage } from "@/pages/not-found";
import { ForbiddenPage } from "@/pages/forbidden";

export function App(): JSX.Element {
  useEffect(() => {
    applyTheme(getStoredTheme());
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
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

              <Route element={<RoleGuard allow={["ADMIN", "COORDINADOR", "EMPRESA"]} />}>
                <Route path="evaluaciones/new" element={<EvaluacionFormPage />} />
                <Route path="evaluaciones/:id/edit" element={<EvaluacionFormPage />} />
              </Route>

              <Route element={<RoleGuard allow={["ADMIN", "COORDINADOR"]} />}>
                <Route path="matching" element={<MatchingToolPage />} />
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
      </BrowserRouter>
      <Toaster />
    </QueryClientProvider>
  );
}
