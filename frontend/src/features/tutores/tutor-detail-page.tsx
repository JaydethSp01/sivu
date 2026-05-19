import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { api, extractApiMessage } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import type { Tutor } from "@/lib/types";

export function TutorDetailPage(): JSX.Element {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const hasRole = useAuthStore((s) => s.hasRole);
  const canEdit = hasRole("ADMIN", "COORDINADOR");
  const canDelete = hasRole("ADMIN");

  const { data, isLoading } = useQuery({
    queryKey: ["/tutores", id],
    queryFn: async () => (await api.get<Tutor>(`/tutores/${id}`)).data,
    enabled: !!id,
  });

  const del = useMutation({
    mutationFn: async () => api.delete(`/tutores/${id}`),
    onSuccess: () => {
      toast.success("Tutor eliminado");
      qc.invalidateQueries({ queryKey: ["/tutores"] });
      navigate("/tutores");
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  if (isLoading) {
    return (
      <div className="flex items-center text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />Cargando...
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
              Tutor {data.tipo === "ACADEMICO" ? "académico" : "empresarial"} · {data.email}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <Button onClick={() => navigate(`/tutores/${id}/edit`)}>
              <Pencil className="h-4 w-4" /> Editar
            </Button>
          )}
          {canDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="h-4 w-4" /> Eliminar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar tutor?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción es permanente. Se eliminará a {data.nombres} {data.apellidos}.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => del.mutate()}>Eliminar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Información</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Tipo</span><span>{data.tipo === "ACADEMICO" ? "Académico" : "Empresarial"}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Estado</span><StatusBadge kind="tutor" value={data.estado} /></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Correo</span><span>{data.email}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Teléfono</span><span>{data.telefono ?? "—"}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Cargo</span><span>{data.cargo ?? "—"}</span></div>
          {data.tipo === "ACADEMICO" ? (
            <div className="flex justify-between"><span className="text-muted-foreground">Dependencia</span><span>{data.dependencia ?? "—"}</span></div>
          ) : (
            <div className="flex justify-between"><span className="text-muted-foreground">Empresa</span><span>{data.empresaRazonSocial ?? "—"}</span></div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
