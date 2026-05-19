import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Briefcase, Eye, Pencil, Plus, Search, Send, Trash2 } from "lucide-react";
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
import {
  AREA_PRACTICA_LABELS,
  ESTADO_VACANTE_LABELS,
  MODALIDAD_LABELS,
  humanize,
} from "@/lib/enum-labels";
import type { Empresa, EstadoVacante, PageResponse, Vacante } from "@/lib/types";

const ESTADOS: (EstadoVacante | "ALL")[] = ["ALL", "BORRADOR", "PUBLICADA", "CERRADA", "ASIGNADA"];

export function VacantesListPage(): JSX.Element {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const hasRole = useAuthStore((s) => s.hasRole);
  const canCreate = hasRole("ADMIN", "COORDINADOR", "EMPRESA");
  const canDelete = hasRole("ADMIN", "COORDINADOR");

  const [q, setQ] = useState("");
  const [estado, setEstado] = useState<EstadoVacante | "ALL">("ALL");
  const [empresaId, setEmpresaId] = useState<string>("ALL");
  const [page, setPage] = useState(0);
  const dq = useDebouncedValue(q, 300);

  const empresas = useQuery({
    queryKey: ["/empresas", "all", "vacantes-filter"],
    enabled: hasRole("ADMIN", "COORDINADOR"),
    queryFn: async () => {
      const { data } = await api.get<PageResponse<Empresa>>("/empresas", {
        params: { page: 0, size: 200 },
      });
      return data.content;
    },
  });

  const params = {
    q: dq || undefined,
    estado: estado === "ALL" ? undefined : estado,
    empresaId: empresaId === "ALL" ? undefined : Number(empresaId),
    page,
    size: 10,
    sort: "createdAt,desc",
  };

  const { data, isLoading } = useQuery({
    queryKey: ["/vacantes", params],
    queryFn: async () => (await api.get<PageResponse<Vacante>>("/vacantes", { params })).data,
  });

  const del = useMutation({
    mutationFn: async (id: number) => api.delete(`/vacantes/${id}`),
    onSuccess: () => {
      toast.success("Vacante eliminada");
      qc.invalidateQueries({ queryKey: ["/vacantes"] });
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  const columns: DataTableColumn<Vacante>[] = [
    {
      key: "titulo",
      header: "Título",
      cell: (r) => (
        <div className="flex flex-col">
          <span className="font-medium">{r.titulo}</span>
          <span className="text-xs text-muted-foreground">
            {r.empresa?.razonSocial} · {r.ciudad} · {humanize(r.modalidad, MODALIDAD_LABELS)}
          </span>
        </div>
      ),
    },
    { key: "area", header: "Área", cell: (r) => humanize(r.areaPractica, AREA_PRACTICA_LABELS) },
    { key: "cupos", header: "Cupos", cell: (r) => r.cuposDisponibles },
    { key: "creditos", header: "Cred. mín.", cell: (r) => r.creditosMinimos },
    { key: "prom", header: "Prom. mín.", cell: (r) => Number(r.promedioMinimo).toFixed(1) },
    { key: "estado", header: "Estado", cell: (r) => <StatusBadge kind="vacante" value={r.estado} /> },
    {
      key: "acc",
      header: "",
      className: "text-right w-[180px]",
      cell: (r) => (
        <div className="flex justify-end gap-1">
          {hasRole("ESTUDIANTE") && r.estado === "PUBLICADA" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/postulaciones/new?vacanteId=${r.id}`)}
              aria-label="Postularme"
            >
              <Send className="h-4 w-4 text-primary" />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={() => navigate(`/vacantes/${r.id}`)} aria-label="Ver detalle">
            <Eye className="h-4 w-4" />
          </Button>
          {canCreate && (
            <Button variant="ghost" size="icon" onClick={() => navigate(`/vacantes/${r.id}/edit`)} aria-label="Editar">
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {canDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Eliminar"><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar vacante?</AlertDialogTitle>
                  <AlertDialogDescription>Eliminarás "{r.titulo}".</AlertDialogDescription>
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
        title="Vacantes"
        description="Cupos de práctica abiertos en empresas aliadas. Filtra por estado o por empresa."
        icon={Briefcase}
        actions={
          canCreate ? (
            <Button variant="gradient" onClick={() => navigate("/vacantes/new")}>
              <Plus className="h-4 w-4" /> Nueva vacante
            </Button>
          ) : null
        }
      />
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título o descripción..."
            className="pl-9"
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(0); }}
          />
        </div>
        <Select value={estado} onValueChange={(v) => { setEstado(v as EstadoVacante | "ALL"); setPage(0); }}>
          <SelectTrigger className="w-56"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            {ESTADOS.map((e) => (
              <SelectItem key={e} value={e}>
                {e === "ALL" ? "Todos los estados" : ESTADO_VACANTE_LABELS[e]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasRole("ADMIN", "COORDINADOR") && (
          <Select value={empresaId} onValueChange={(v) => { setEmpresaId(v); setPage(0); }}>
            <SelectTrigger className="w-64"><SelectValue placeholder="Empresa" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas las empresas</SelectItem>
              {empresas.data?.map((e) => (
                <SelectItem key={e.id} value={String(e.id)}>{e.razonSocial}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
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
        emptyTitle="No hay vacantes"
      />
    </div>
  );
}
