import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Eye, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
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
import { formatBytes } from "@/lib/utils";
import { TIPO_DOCUMENTO_LABELS, humanize } from "@/lib/enum-labels";
import { useAuthStore } from "@/lib/auth-store";
import type {
  Documento,
  EstadoDocumento,
  PageResponse,
  TipoDocumentoSoporte,
} from "@/lib/types";

const ESTADOS: (EstadoDocumento | "ALL")[] = ["ALL", "RECIBIDO", "VALIDADO", "RECHAZADO"];
const TIPOS: (TipoDocumentoSoporte | "ALL")[] = [
  "ALL",
  "HOJA_VIDA",
  "DOCUMENTO_IDENTIDAD",
  "CERTIFICADO_ACADEMICO",
  "EPS",
  "FORMALIZACION",
  "CERTIFICADO",
  "OTRO",
];

export function DocumentosListPage(): JSX.Element {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const hasRole = useAuthStore((s) => s.hasRole);
  const canValidate = hasRole("ADMIN", "COORDINADOR");

  const [estado, setEstado] = useState<EstadoDocumento | "ALL">("ALL");
  const [tipo, setTipo] = useState<TipoDocumentoSoporte | "ALL">("ALL");
  const [page, setPage] = useState(0);

  const params = {
    estado: estado === "ALL" ? undefined : estado,
    tipo: tipo === "ALL" ? undefined : tipo,
    page,
    size: 10,
    sort: "createdAt,desc",
  };

  const { data, isLoading } = useQuery({
    queryKey: ["/documentos", params],
    queryFn: async () => (await api.get<PageResponse<Documento>>("/documentos", { params })).data,
  });

  const del = useMutation({
    mutationFn: async (id: number) => api.delete(`/documentos/${id}`),
    onSuccess: () => {
      toast.success("Documento eliminado");
      qc.invalidateQueries({ queryKey: ["/documentos"] });
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  const validar = useMutation({
    mutationFn: async ({ id, validar }: { id: number; validar: boolean }) =>
      api.patch(`/documentos/${id}/validar`, { validar, observaciones: validar ? "OK" : "No cumple" }),
    onSuccess: () => {
      toast.success("Documento actualizado");
      qc.invalidateQueries({ queryKey: ["/documentos"] });
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  const columns: DataTableColumn<Documento>[] = [
    { key: "id", header: "#", cell: (r) => r.id },
    {
      key: "nombre",
      header: "Documento",
      cell: (r) => (
        <div className="flex flex-col">
          <span className="font-medium">{r.nombreOriginal}</span>
          <span className="text-xs text-muted-foreground">{r.mimeType} · {formatBytes(r.tamanoBytes)}</span>
        </div>
      ),
    },
    { key: "tipo", header: "Tipo", cell: (r) => humanize(r.tipo, TIPO_DOCUMENTO_LABELS) },
    { key: "estudiante", header: "Estudiante", cell: (r) => r.estudiante?.nombreCompleto ?? "—" },
    { key: "estado", header: "Estado", cell: (r) => <StatusBadge kind="documento" value={r.estado} /> },
    {
      key: "acc",
      header: "",
      className: "text-right w-[180px]",
      cell: (r) => (
        <div className="flex justify-end gap-1">
          {canValidate && r.estado === "RECIBIDO" && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => validar.mutate({ id: r.id, validar: true })}
                aria-label="Validar"
              >
                <Check className="h-4 w-4 text-success" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => validar.mutate({ id: r.id, validar: false })}
                aria-label="Rechazar"
              >
                <X className="h-4 w-4 text-destructive" />
              </Button>
            </>
          )}
          <Button variant="ghost" size="icon" onClick={() => navigate(`/documentos/${r.id}`)} aria-label="Ver detalle">
            <Eye className="h-4 w-4" />
          </Button>
          {canValidate && (
            <Button variant="ghost" size="icon" onClick={() => navigate(`/documentos/${r.id}/edit`)} aria-label="Editar">
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {canValidate && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Eliminar"><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar documento?</AlertDialogTitle>
                  <AlertDialogDescription>{r.nombreOriginal} será eliminado.</AlertDialogDescription>
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
          <h1 className="text-2xl font-bold">Documentos</h1>
          <p className="text-sm text-muted-foreground">Soportes académicos y de formalización.</p>
        </div>
        <Button onClick={() => navigate("/documentos/new")}>
          <Plus className="h-4 w-4" /> Nuevo
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        <Select value={tipo} onValueChange={(v) => { setTipo(v as TipoDocumentoSoporte | "ALL"); setPage(0); }}>
          <SelectTrigger className="w-56"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            {TIPOS.map((t) => (
              <SelectItem key={t} value={t}>
                {t === "ALL" ? "Todos los tipos" : TIPO_DOCUMENTO_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={estado} onValueChange={(v) => { setEstado(v as EstadoDocumento | "ALL"); setPage(0); }}>
          <SelectTrigger className="w-56"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            {ESTADOS.map((e) => <SelectItem key={e} value={e}>{e === "ALL" ? "Todos los estados" : e}</SelectItem>)}
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
        emptyTitle="No hay documentos"
      />
    </div>
  );
}
