import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { useDebouncedValue } from "@/hooks/use-debounce";
import { api, extractApiMessage } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { APLICA_A_LABELS } from "@/lib/enum-labels";
import type { AplicaA, PageResponse, TipoRequisito } from "@/lib/types";

type ActivoFilter = "ALL" | "ACTIVO" | "INACTIVO";
const APLICAS: (AplicaA | "ALL")[] = ["ALL", "ESTUDIANTE", "EMPRESA", "AMBOS"];

export function TiposRequisitoListPage(): JSX.Element {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const hasRole = useAuthStore((s) => s.hasRole);
  const canEdit = hasRole("ADMIN", "COORDINADOR");
  const canDelete = hasRole("ADMIN");

  const [q, setQ] = useState("");
  const [aplicaA, setAplicaA] = useState<AplicaA | "ALL">("ALL");
  const [activo, setActivo] = useState<ActivoFilter>("ALL");
  const [page, setPage] = useState(0);
  const dq = useDebouncedValue(q, 300);

  const params = {
    q: dq || undefined,
    aplicaA: aplicaA === "ALL" ? undefined : aplicaA,
    activo: activo === "ALL" ? undefined : activo === "ACTIVO",
    page,
    size: 10,
    sort: "nombre,asc",
  };

  const { data, isLoading } = useQuery({
    queryKey: ["/tipos-requisito", params],
    queryFn: async () =>
      (await api.get<PageResponse<TipoRequisito>>("/tipos-requisito", { params })).data,
  });

  const del = useMutation({
    mutationFn: async (id: number) => api.delete(`/tipos-requisito/${id}`),
    onSuccess: () => {
      toast.success("Tipo eliminado");
      qc.invalidateQueries({ queryKey: ["/tipos-requisito"] });
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  const columns: DataTableColumn<TipoRequisito>[] = [
    { key: "codigo", header: "Código", cell: (r) => <span className="font-mono text-xs">{r.codigo}</span> },
    {
      key: "nombre",
      header: "Nombre",
      cell: (r) => (
        <div className="flex flex-col">
          <span className="font-medium">{r.nombre}</span>
          {r.descripcion && <span className="text-xs text-muted-foreground">{r.descripcion}</span>}
        </div>
      ),
    },
    {
      key: "aplica",
      header: "Aplica a",
      cell: (r) => <Badge variant="outline">{APLICA_A_LABELS[r.aplicaA]}</Badge>,
    },
    {
      key: "activo",
      header: "Estado",
      cell: (r) =>
        r.activo ? <Badge variant="success">Activo</Badge> : <Badge variant="muted">Inactivo</Badge>,
    },
    {
      key: "acc",
      header: "",
      className: "text-right w-[140px]",
      cell: (r) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/catalogos/tipos-requisito/${r.id}/edit`)} aria-label="Ver">
            <Eye className="h-4 w-4" />
          </Button>
          {canEdit && (
            <Button variant="ghost" size="icon" onClick={() => navigate(`/catalogos/tipos-requisito/${r.id}/edit`)} aria-label="Editar">
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
                  <AlertDialogTitle>¿Eliminar tipo?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Eliminarás "{r.nombre}" permanentemente.
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tipos de requisito</h1>
          <p className="text-sm text-muted-foreground">
            Catálogo de documentos exigibles (hoja de vida, EPS, ARL, certificación, etc.).
          </p>
        </div>
        {canEdit && (
          <Button onClick={() => navigate("/catalogos/tipos-requisito/new")}>
            <Plus className="h-4 w-4" /> Nuevo
          </Button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código o nombre..."
            className="pl-8"
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(0); }}
          />
        </div>
        <Select value={aplicaA} onValueChange={(v) => { setAplicaA(v as AplicaA | "ALL"); setPage(0); }}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Aplica a" /></SelectTrigger>
          <SelectContent>
            {APLICAS.map((a) => (
              <SelectItem key={a} value={a}>
                {a === "ALL" ? "Aplica a (todos)" : APLICA_A_LABELS[a]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={activo} onValueChange={(v) => { setActivo(v as ActivoFilter); setPage(0); }}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos</SelectItem>
            <SelectItem value="ACTIVO">Activos</SelectItem>
            <SelectItem value="INACTIVO">Inactivos</SelectItem>
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
        emptyTitle="No hay tipos de requisito"
      />
    </div>
  );
}
