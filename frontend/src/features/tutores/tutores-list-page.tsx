import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Pencil, Plus, Search, Trash2, UserCog } from "lucide-react";
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
import { ESTADO_TUTOR_LABELS, TIPO_TUTOR_LABELS } from "@/lib/enum-labels";
import { useAuthStore } from "@/lib/auth-store";
import type {
  EstadoTutor,
  Empresa,
  PageResponse,
  TipoTutor,
  Tutor,
} from "@/lib/types";

const TIPOS: (TipoTutor | "ALL")[] = ["ALL", "ACADEMICO", "EMPRESARIAL"];
const ESTADOS: (EstadoTutor | "ALL")[] = ["ALL", "ACTIVO", "INACTIVO"];

export function TutoresListPage(): JSX.Element {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const hasRole = useAuthStore((s) => s.hasRole);
  const canEdit = hasRole("ADMIN", "COORDINADOR");
  const canDelete = hasRole("ADMIN");
  const canFilterEmpresa = hasRole("ADMIN", "COORDINADOR");

  const [q, setQ] = useState("");
  const [tipo, setTipo] = useState<TipoTutor | "ALL">("ALL");
  const [estado, setEstado] = useState<EstadoTutor | "ALL">("ALL");
  const [empresaId, setEmpresaId] = useState<string>("ALL");
  const [page, setPage] = useState(0);
  const dq = useDebouncedValue(q, 300);

  const empresas = useQuery({
    queryKey: ["/empresas", "for-tutores-filter"],
    enabled: canFilterEmpresa,
    queryFn: async () =>
      (await api.get<PageResponse<Empresa>>("/empresas", { params: { page: 0, size: 200 } })).data.content,
  });

  const params = {
    q: dq || undefined,
    tipo: tipo === "ALL" ? undefined : tipo,
    estado: estado === "ALL" ? undefined : estado,
    empresaId: empresaId === "ALL" ? undefined : Number(empresaId),
    page,
    size: 10,
    sort: "apellidos,asc",
  };

  const { data, isLoading } = useQuery({
    queryKey: ["/tutores", params],
    queryFn: async () => (await api.get<PageResponse<Tutor>>("/tutores", { params })).data,
  });

  const del = useMutation({
    mutationFn: async (id: number) => api.delete(`/tutores/${id}`),
    onSuccess: () => {
      toast.success("Tutor eliminado");
      qc.invalidateQueries({ queryKey: ["/tutores"] });
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  const columns: DataTableColumn<Tutor>[] = [
    {
      key: "nombre",
      header: "Nombre",
      cell: (r) => (
        <div className="flex flex-col">
          <span className="font-medium">{r.nombres} {r.apellidos}</span>
          <span className="text-xs text-muted-foreground">{r.email}</span>
        </div>
      ),
    },
    {
      key: "tipo",
      header: "Tipo",
      cell: (r) => (
        <span className="text-xs font-medium">{TIPO_TUTOR_LABELS[r.tipo]}</span>
      ),
    },
    { key: "cargo", header: "Cargo", cell: (r) => r.cargo ?? "—" },
    {
      key: "ref",
      header: "Empresa / Dependencia",
      cell: (r) =>
        r.tipo === "EMPRESARIAL" ? (r.empresaRazonSocial ?? "—") : (r.dependencia ?? "—"),
    },
    { key: "estado", header: "Estado", cell: (r) => <StatusBadge kind="tutor" value={r.estado} /> },
    {
      key: "acc",
      header: "",
      className: "text-right w-[140px]",
      cell: (r) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/tutores/${r.id}`)} aria-label="Ver">
            <Eye className="h-4 w-4" />
          </Button>
          {canEdit && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/tutores/${r.id}/edit`)}
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
                  <AlertDialogTitle>¿Eliminar tutor?</AlertDialogTitle>
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
        title="Tutores"
        description="Tutores académicos y empresariales que acompañan a los practicantes durante el proceso."
        icon={UserCog}
        actions={
          canEdit ? (
            <Button variant="gradient" onClick={() => navigate("/tutores/new")}>
              <Plus className="h-4 w-4" /> Nuevo tutor
            </Button>
          ) : null
        }
      />
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, email o cargo..."
            className="pl-9"
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(0); }}
          />
        </div>
        <Select value={tipo} onValueChange={(v) => { setTipo(v as TipoTutor | "ALL"); setPage(0); }}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            {TIPOS.map((t) => (
              <SelectItem key={t} value={t}>
                {t === "ALL" ? "Todos los tipos" : TIPO_TUTOR_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={estado} onValueChange={(v) => { setEstado(v as EstadoTutor | "ALL"); setPage(0); }}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            {ESTADOS.map((e) => (
              <SelectItem key={e} value={e}>
                {e === "ALL" ? "Todos los estados" : ESTADO_TUTOR_LABELS[e]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {canFilterEmpresa && (
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
        emptyTitle="No hay tutores"
        emptyDescription="Crea un tutor o ajusta los filtros."
      />
    </div>
  );
}
