import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
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
import type { Empresa, EstadoEmpresa, PageResponse } from "@/lib/types";

const ESTADOS: (EstadoEmpresa | "ALL")[] = ["ALL", "EN_REVISION", "ACTIVA", "INACTIVA"];

export function EmpresasListPage(): JSX.Element {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const hasRole = useAuthStore((s) => s.hasRole);
  const canCreate = hasRole("ADMIN", "COORDINADOR");
  const canDelete = hasRole("ADMIN");

  const [q, setQ] = useState("");
  const [estado, setEstado] = useState<EstadoEmpresa | "ALL">("ALL");
  const [page, setPage] = useState(0);
  const dq = useDebouncedValue(q, 300);

  const params = {
    q: dq || undefined,
    estado: estado === "ALL" ? undefined : estado,
    page,
    size: 10,
    sort: "razonSocial,asc",
  };

  const { data, isLoading } = useQuery({
    queryKey: ["/empresas", params],
    queryFn: async () => (await api.get<PageResponse<Empresa>>("/empresas", { params })).data,
  });

  const del = useMutation({
    mutationFn: async (id: number) => api.delete(`/empresas/${id}`),
    onSuccess: () => {
      toast.success("Empresa eliminada");
      qc.invalidateQueries({ queryKey: ["/empresas"] });
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  const columns: DataTableColumn<Empresa>[] = [
    { key: "nit", header: "NIT", cell: (r) => r.nit },
    {
      key: "razon",
      header: "Razón social",
      cell: (r) => (
        <div className="flex flex-col">
          <span className="font-medium">{r.razonSocial}</span>
          {r.nombreComercial && <span className="text-xs text-muted-foreground">{r.nombreComercial}</span>}
        </div>
      ),
    },
    { key: "sector", header: "Sector", cell: (r) => r.sector },
    { key: "ciudad", header: "Ciudad", cell: (r) => r.ciudad },
    { key: "contacto", header: "Contacto", cell: (r) => r.contactoNombre },
    {
      key: "propuesta",
      header: "Propuesta por",
      cell: (r) =>
        r.propuestaPorEstudianteId
          ? <span className="text-xs text-muted-foreground">Estudiante #{r.propuestaPorEstudianteId}</span>
          : <span className="text-xs text-muted-foreground">—</span>,
    },
    { key: "estado", header: "Estado", cell: (r) => <StatusBadge kind="empresa" value={r.estado} /> },
    {
      key: "acc",
      header: "",
      className: "text-right w-[140px]",
      cell: (r) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/empresas/${r.id}`)} aria-label="Ver detalle">
            <Eye className="h-4 w-4" />
          </Button>
          {canCreate && (
            <Button variant="ghost" size="icon" onClick={() => navigate(`/empresas/${r.id}/edit`)} aria-label="Editar">
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
                  <AlertDialogTitle>¿Eliminar empresa?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Eliminarás "{r.razonSocial}" permanentemente.
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
        title="Empresas"
        description="Empresas aliadas que abren cupos de práctica para nuestros estudiantes."
        icon={Building2}
        actions={
          canCreate ? (
            <Button variant="gradient" onClick={() => navigate("/empresas/new")}>
              <Plus className="h-4 w-4" /> Nueva empresa
            </Button>
          ) : null
        }
      />
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por razón social, NIT, ciudad..."
            className="pl-9"
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(0); }}
          />
        </div>
        <Select value={estado} onValueChange={(v) => { setEstado(v as EstadoEmpresa | "ALL"); setPage(0); }}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            {ESTADOS.map((e) => (
              <SelectItem key={e} value={e}>{e === "ALL" ? "Todos los estados" : e}</SelectItem>
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
        emptyTitle="No hay empresas"
      />
    </div>
  );
}
