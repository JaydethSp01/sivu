import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Pencil, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import type { Estudiante, ValidacionAcademica } from "@/lib/types";

export function EstudianteDetailPage(): JSX.Element {
  const { id } = useParams();
  const navigate = useNavigate();
  const hasRole = useAuthStore((s) => s.hasRole);

  const { data, isLoading } = useQuery({
    queryKey: ["/estudiantes", id],
    queryFn: async () => (await api.get<Estudiante>(`/estudiantes/${id}`)).data,
    enabled: !!id,
  });

  const validacion = useQuery({
    queryKey: ["/automatizacion/validar-academico", id],
    enabled: !!id && hasRole("ADMIN", "COORDINADOR", "ESTUDIANTE"),
    queryFn: async () =>
      (await api.get<ValidacionAcademica>(`/automatizacion/validar-academico/${id}`)).data,
  });

  if (isLoading) {
    return (
      <div className="flex items-center text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando...
      </div>
    );
  }
  if (!data) return <div>No encontrado</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Volver">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{data.nombres} {data.apellidos}</h1>
            <p className="text-sm text-muted-foreground">
              {data.tipoDocumento} {data.numeroDocumento} · {data.email}
            </p>
          </div>
        </div>
        {hasRole("ADMIN", "COORDINADOR") && (
          <Button onClick={() => navigate(`/estudiantes/${id}/edit`)}>
            <Pencil className="h-4 w-4" /> Editar
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Información académica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Programa</span><span>{data.programaAcademico}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Semestre</span><span>{data.semestre}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Créditos aprobados</span><span>{data.creditosAprobados}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Promedio</span><span>{Number(data.promedioAcumulado).toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Estado</span><StatusBadge kind="estudiante" value={data.estado} /></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" /> Validación académica
            </CardTitle>
            <CardDescription>Mock de la API de la universidad.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {validacion.isLoading && <p>Consultando...</p>}
            {validacion.data && (
              <>
                <div className="flex items-center gap-2">
                  <Badge variant={validacion.data.cumple ? "success" : "destructive"}>
                    {validacion.data.cumple ? "Cumple" : "No cumple"}
                  </Badge>
                </div>
                <p className="text-muted-foreground">{validacion.data.motivo}</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
