import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Plus, Send, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
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
import { api, extractApiMessage } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import type { EstadoPostulacion, PageResponse, Postulacion } from "@/lib/types";

const ESTADOS: (EstadoPostulacion | "ALL")[] = [
  "ALL",
  "POSTULADA",
  "EN_REVISION",
  "PRESELECCIONADA",
  "RECHAZADA",
  "ACEPTADA",
  "RETIRADA",
];

export function PostulacionesListPage(): JSX.Element {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const hasRole = useAuthStore((s) => s.hasRole);
  const usuario = useAuthStore((s) => s.usuario);
  const canDelete = hasRole("ADMIN", "COORDINADOR");

  const [estado, setEstado] = useState<EstadoPostulacion | "ALL">("ALL");
  const [page, setPage] = useState(0);

  const filtroEstudiante = hasRole("ESTUDIANTE") && !hasRole("ADMIN", "COORDINADOR")
    ? usuario?.estudianteId ?? undefined
    : undefined;

  const params = {
    estado: estado === "ALL" ? undefined : estado,
    estudianteId: filtroEstudiante,
    page,
    size: 10,
    sort: "createdAt,desc",
  };

  const { data, isLoading } = useQuery({
    queryKey: ["/postulaciones", params],
    queryFn: async () => (await api.get<PageResponse<Postulacion>>("/postulaciones", { params })).data,
  });

  const del = useMutation({
    mutationFn: async (id: number) => api.delete(`/postulaciones/${id}`),
    onSuccess: () => {
      toast.success("Postulación eliminada");
      qc.invalidateQueries({ queryKey: ["/postulaciones"] });
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  const columns: DataTableColumn<Postulacion>[] = [
    { key: "id", header: "#", cell: (r) => r.id },
    {
      key: "estudiante",
      header: "Estudiante",
      cell: (r) => <div className="font-medium">{r.estudianteNombreCompleto}</div>,
    },
    {
      key: "vacante",
      header: "Vacante",
      cell: (r) => (
        <div className="flex flex-col">
          <span>{r.vacanteTitulo}</span>
          <span className="text-xs text-muted-foreground">{r.empresaRazonSocial}</span>
        </div>
      ),
    },
    {
      key: "score",
      header: "Score",
      cell: (r) => {
        const s = r.scoreMatching !== null ? Number(r.scoreMatching) : null;
        return s === null ? "—" : <span className="font-mono">{s.toFixed(0)}</span>;
      },
    },
    { key: "estado", header: "Estado", cell: (r) => <StatusBadge kind="postulacion" value={r.estado} /> },
    {
      key: "fecha",
      header: "Fecha",
      cell: (r) => (
        <span className="text-xs">{format(parseISO(r.fechaPostulacion), "PPp", { locale: es })}</span>
      ),
    },
    {
      key: "acc",
      header: "",
      className: "text-right w-[120px]",
      cell: (r) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/postulaciones/${r.id}`)} aria-label="Ver detalle">
            <Eye className="h-4 w-4" />
          </Button>
          {canDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Eliminar"><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar postulación?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Se borrará el historial. Esta acción no se puede deshacer.
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
        title="Postulaciones"
        description="Sigue el avance de cada postulación: en revisión, entrevista, preselección y aceptación."
        icon={Send}
        actions={
          hasRole("ESTUDIANTE", "ADMIN", "COORDINADOR") ? (
            <Button variant="gradient" onClick={() => navigate("/postulaciones/new")}>
              <Plus className="h-4 w-4" /> Nueva postulación
            </Button>
          ) : null
        }
      />
      <div className="flex flex-wrap gap-2 items-center">
        <Select value={estado} onValueChange={(v) => { setEstado(v as EstadoPostulacion | "ALL"); setPage(0); }}>
          <SelectTrigger className="w-56"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            {ESTADOS.map((e) => (
              <SelectItem key={e} value={e}>
                {e === "ALL" ? "Todos los estados" : e.replaceAll("_", " ").toLowerCase().replace(/^./, (c) => c.toUpperCase())}
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
        emptyTitle="Sin postulaciones"
      />
    </div>
  );
}
