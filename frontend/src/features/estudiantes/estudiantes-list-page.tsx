import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Pencil, Plus, Search, Trash2, Users } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { useDebouncedValue } from "@/hooks/use-debounce";
import { api, extractApiMessage } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import type { EstadoEstudiante, Estudiante, PageResponse } from "@/lib/types";

const ESTADOS: (EstadoEstudiante | "ALL")[] = ["ALL", "ACTIVO", "GRADUADO", "RETIRADO"];

export function EstudiantesListPage(): JSX.Element {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const hasRole = useAuthStore((s) => s.hasRole);
  const canEdit = hasRole("ADMIN", "COORDINADOR");
  const canDelete = hasRole("ADMIN");
  const isEmpresaOnly = hasRole("TUTOR") && !hasRole("ADMIN", "COORDINADOR");

  const [q, setQ] = useState("");
  const [estado, setEstado] = useState<EstadoEstudiante | "ALL">("ALL");
  const [page, setPage] = useState(0);
  const dq = useDebouncedValue(q, 300);

  const params = {
    q: dq || undefined,
    estado: estado === "ALL" ? undefined : estado,
    page,
    size: 10,
    sort: "apellidos,asc",
  };

  const { data, isLoading } = useQuery({
    queryKey: ["/estudiantes", params],
    queryFn: async () => {
      const res = await api.get<PageResponse<Estudiante>>("/estudiantes", { params });
      return res.data;
    },
  });

  const del = useMutation({
    mutationFn: async (id: number) => api.delete(`/estudiantes/${id}`),
    onSuccess: () => {
      toast.success("Estudiante eliminado");
      qc.invalidateQueries({ queryKey: ["/estudiantes"] });
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  const columns: DataTableColumn<Estudiante>[] = [
    { key: "doc", header: "Documento", cell: (r) => `${r.tipoDocumento} ${r.numeroDocumento}` },
    {
      key: "nombre",
      header: "Nombre",
      cell: (r) => (
        <div className="flex flex-col">
          <span className="font-medium">
            {r.nombres} {r.apellidos}
          </span>
          <span className="text-xs text-muted-foreground">{r.email}</span>
        </div>
      ),
    },
    { key: "programa", header: "Programa", cell: (r) => r.programaAcademico },
    { key: "sem", header: "Sem.", cell: (r) => r.semestre },
    { key: "prom", header: "Promedio", cell: (r) => Number(r.promedioAcumulado).toFixed(2) },
    {
      key: "estado",
      header: "Estado",
      cell: (r) => <StatusBadge kind="estudiante" value={r.estado} />,
    },
    {
      key: "acc",
      header: "",
      className: "text-right w-[140px]",
      cell: (r) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/estudiantes/${r.id}`)} aria-label="Ver">
            <Eye className="h-4 w-4" />
          </Button>
          {canEdit && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/estudiantes/${r.id}/edit`)}
              aria-label="Editar"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {canDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Eliminar">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar estudiante?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción es permanente. Se eliminará a {r.nombres} {r.apellidos}.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => del.mutate(r.id)}>Eliminar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title={isEmpresaOnly ? "Mis practicantes" : "Estudiantes"}
        description={
          isEmpresaOnly
            ? "Estudiantes vinculados a tu empresa o que postularon a tus vacantes."
            : "Gestiona los estudiantes habilitados para iniciar su práctica profesional."
        }
        icon={Users}
        actions={
          canEdit ? (
            <Button variant="gradient" onClick={() => navigate("/estudiantes/new")}>
              <Plus className="h-4 w-4" /> Nuevo estudiante
            </Button>
          ) : null
        }
      />

      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, email o documento..."
            className="pl-9"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(0);
            }}
          />
        </div>
        <Select value={estado} onValueChange={(v) => { setEstado(v as EstadoEstudiante | "ALL"); setPage(0); }}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            {ESTADOS.map((e) => (
              <SelectItem key={e} value={e}>
                {e === "ALL" ? "Todos los estados" : e}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        rows={data?.content}
        isLoading={isLoading}
        page={page}
        totalPages={data?.totalPages ?? 0}
        totalElements={data?.totalElements ?? 0}
        onPageChange={setPage}
        rowKey={(r) => r.id}
        emptyTitle="No hay estudiantes"
        emptyDescription="Crea uno nuevo o ajusta los filtros."
      />
    </div>
  );
}
