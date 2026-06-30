import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
  Check,
  Download,
  Eye,
  FileText,
  Image as ImageIcon,
  Loader2,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { api, extractApiMessage } from "@/lib/api";
import { formatBytes } from "@/lib/utils";
import { TIPO_DOCUMENTO_LABELS, humanize } from "@/lib/enum-labels";
import { useAuthStore } from "@/lib/auth-store";
import { cn } from "@/lib/utils";
import type {
  Documento,
  EstadoDocumento,
  EstadoVigencia,
  PageResponse,
  TipoDocumentoSoporte,
} from "@/lib/types";

/**
 * Badge de vigencia para documentos con fecha fin (EPS, certificados, etc).
 * Si el documento no tiene fechas de vigencia, no se renderiza.
 */
function BadgeVigencia({ d }: { d: Documento }): JSX.Element | null {
  if (d.estadoVigencia === "SIN_VIGENCIA") return null;
  const config: Record<Exclude<EstadoVigencia, "SIN_VIGENCIA">, { label: string; cls: string }> = {
    ACTIVO: { label: "Activo", cls: "bg-success-soft text-success" },
    POR_VENCER: { label: "Por vencer", cls: "bg-warning-soft text-warning-foreground" },
    VENCIDO: { label: "Vencido", cls: "bg-destructive-soft text-destructive" },
  };
  const c = config[d.estadoVigencia];
  if (!c) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest",
        c.cls
      )}
      title={d.fechaVigenciaFin ? `Vence el ${d.fechaVigenciaFin}` : undefined}
    >
      {c.label}
    </span>
  );
}

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
  const isStudentOnly = hasRole("ESTUDIANTE") && !hasRole("ADMIN", "COORDINADOR", "TUTOR");
  const isEmpresaOnly = hasRole("TUTOR") && !hasRole("ADMIN", "COORDINADOR");

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
    {
      key: "estado",
      header: "Estado",
      cell: (r) => (
        <div className="flex flex-col items-start gap-1">
          <StatusBadge kind="documento" value={r.estado} />
          <BadgeVigencia d={r} />
        </div>
      ),
    },
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
    <div className="space-y-5">
      <PageHeader
        title={
          isStudentOnly
            ? "Mis documentos"
            : isEmpresaOnly
              ? "Documentos de mi empresa"
              : "Documentos"
        }
        description={
          isStudentOnly
            ? "Tus soportes: hoja de vida, identificación, EPS, certificados. Tu hoja de vida se sube automáticamente cuando la completas."
            : isEmpresaOnly
              ? "Soportes corporativos de tu empresa: RUT, cámara de comercio, certificaciones, convenios firmados."
              : "Soportes académicos y de formalización del proceso de Coformación."
        }
        icon={FileText}
        actions={
          <Button variant="gradient" onClick={() => navigate("/documentos/new")}>
            <Plus className="h-4 w-4" /> Subir documento
          </Button>
        }
      />
      <div className="flex flex-wrap gap-2 items-center">
        <Select value={tipo} onValueChange={(v) => { setTipo(v as TipoDocumentoSoporte | "ALL"); setPage(0); }}>
          <SelectTrigger className="w-full sm:w-56"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            {TIPOS.map((t) => (
              <SelectItem key={t} value={t}>
                {t === "ALL" ? "Todos los tipos" : TIPO_DOCUMENTO_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={estado} onValueChange={(v) => { setEstado(v as EstadoDocumento | "ALL"); setPage(0); }}>
          <SelectTrigger className="w-full sm:w-56"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            {ESTADOS.map((e) => (
              <SelectItem key={e} value={e}>
                {e === "ALL" ? "Todos los estados" : e.toLowerCase().replace(/^./, (c) => c.toUpperCase())}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {isStudentOnly ? (
        <DocumentosGridEstudiante
          rows={data?.content}
          isLoading={isLoading}
        />
      ) : (
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
      )}
    </div>
  );
}

function iconForTipoOrMime(d: Documento): JSX.Element {
  if (d.mimeType?.startsWith("image/")) {
    return <ImageIcon className="h-6 w-6" />;
  }
  return <FileText className="h-6 w-6" />;
}

interface DocumentosGridEstudianteProps {
  rows: Documento[] | undefined;
  isLoading: boolean;
}

const HV_GENERATED_PREFIX = "generated://hv/";

function esHvGenerada(d: Documento): boolean {
  return d.tipo === "HOJA_VIDA" && (d.rutaAlmacenamiento ?? "").startsWith(HV_GENERATED_PREFIX);
}

async function descargarHvGenerada(d: Documento): Promise<void> {
  if (!d.estudianteId) return;
  const res = await api.get(`/hoja-vida/${d.estudianteId}/pdf`, { responseType: "blob" });
  const blob = new Blob([res.data as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = d.nombreOriginal || `hv-${d.estudianteId}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function DocumentosGridEstudiante({
  rows,
  isLoading,
}: DocumentosGridEstudianteProps): JSX.Element {
  const navigate = useNavigate();
  if (isLoading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card p-12 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" /> Cargando tus documentos...
      </div>
    );
  }
  if (!rows || rows.length === 0) {
    return (
      <EmptyState
        title="Aún no has subido documentos"
        description="Sube tu hoja de vida, EPS y demás soportes para postularte a vacantes."
        action={
          <Button variant="gradient" onClick={() => navigate("/documentos/new")}>
            <Plus className="h-4 w-4" /> Subir tu primer documento
          </Button>
        }
      />
    );
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((d) => {
        const generada = esHvGenerada(d);
        return (
        <Card key={d.id} className="group flex flex-col">
          <CardContent className="flex flex-col gap-3 p-4 flex-1">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                {iconForTipoOrMime(d)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium leading-tight truncate" title={d.nombreOriginal}>
                  {d.nombreOriginal}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 inline-flex items-center gap-1">
                  {humanize(d.tipo, TIPO_DOCUMENTO_LABELS)}
                  {generada && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-accent-soft text-accent px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                      <Sparkles className="h-2.5 w-2.5" /> Auto
                    </span>
                  )}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <StatusBadge kind="documento" value={d.estado} />
                <BadgeVigencia d={d} />
              </div>
            </div>

            <div className="text-xs text-muted-foreground space-y-0.5">
              {generada ? (
                <div>Generado por SIVU desde tu Hoja de Vida</div>
              ) : (
                <div>{formatBytes(d.tamanoBytes)} · {d.mimeType}</div>
              )}
              <div>
                {generada ? "Actualizado" : "Subido"} el {format(parseISO(d.updatedAt), "PP", { locale: es })}
              </div>
              {d.fechaVigenciaFin && (
                <div className="font-medium text-foreground/80">
                  Vigencia hasta: {format(parseISO(d.fechaVigenciaFin), "PP", { locale: es })}
                </div>
              )}
            </div>

            {d.estado === "RECHAZADO" && d.observacionesValidacion && (
              <div className="rounded-lg bg-destructive/10 text-destructive text-xs p-2">
                <strong>Coordinación lo rechazó:</strong> {d.observacionesValidacion}
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-2 mt-auto">
              {generada ? (
                <>
                  <Button
                    size="sm"
                    variant="gradient"
                    onClick={() => descargarHvGenerada(d).catch((e) => toast.error(extractApiMessage(e)))}
                    className="flex-1 sm:flex-none"
                  >
                    <Download className="h-4 w-4" /> Descargar PDF
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate("/mi-hoja-vida")}
                  >
                    <Pencil className="h-4 w-4" /> Editar HV
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(`/documentos/${d.id}`)}
                  className="flex-1 sm:flex-none"
                >
                  <Eye className="h-4 w-4" /> Ver
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
        );
      })}
    </div>
  );
}
