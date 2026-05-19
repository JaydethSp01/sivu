import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Briefcase,
  Building2,
  Calendar,
  Eye,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Search,
  Send,
  Sparkles,
  Trash2,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { PageHeader } from "@/components/page-header";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { EmptyState } from "@/components/empty-state";
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
  const isStudentOnly = hasRole("ESTUDIANTE") && !hasRole("ADMIN", "COORDINADOR", "EMPRESA");

  const [q, setQ] = useState("");
  const [estado, setEstado] = useState<EstadoVacante | "ALL">(
    isStudentOnly ? "PUBLICADA" : "ALL"
  );
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
    size: isStudentOnly ? 12 : 10,
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
        title={isStudentOnly ? "Vacantes disponibles" : "Vacantes"}
        description={
          isStudentOnly
            ? "Encuentra cupos de práctica abiertos por empresas aliadas. Postúlate con un clic."
            : "Cupos de práctica abiertos en empresas aliadas. Filtra por estado o por empresa."
        }
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
        {!isStudentOnly && (
          <Select value={estado} onValueChange={(v) => { setEstado(v as EstadoVacante | "ALL"); setPage(0); }}>
            <SelectTrigger className="w-full sm:w-56"><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              {ESTADOS.map((e) => (
                <SelectItem key={e} value={e}>
                  {e === "ALL" ? "Todos los estados" : ESTADO_VACANTE_LABELS[e]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {hasRole("ADMIN", "COORDINADOR") && (
          <Select value={empresaId} onValueChange={(v) => { setEmpresaId(v); setPage(0); }}>
            <SelectTrigger className="w-full sm:w-64"><SelectValue placeholder="Empresa" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas las empresas</SelectItem>
              {empresas.data?.map((e) => (
                <SelectItem key={e.id} value={String(e.id)}>{e.razonSocial}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      {isStudentOnly ? (
        <VacantesGridEstudiante
          rows={data?.content}
          isLoading={isLoading}
          totalPages={data?.totalPages ?? 0}
          totalElements={data?.totalElements ?? 0}
          page={page}
          onPageChange={setPage}
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
          emptyTitle="No hay vacantes"
        />
      )}
    </div>
  );
}

interface GridProps {
  rows: Vacante[] | undefined;
  isLoading: boolean;
  totalPages: number;
  totalElements: number;
  page: number;
  onPageChange: (p: number) => void;
}

function VacantesGridEstudiante({
  rows,
  isLoading,
  totalPages,
  totalElements,
  page,
  onPageChange,
}: GridProps): JSX.Element {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card p-12 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" /> Buscando vacantes para ti...
      </div>
    );
  }
  if (!rows || rows.length === 0) {
    return (
      <EmptyState
        title="No hay vacantes que coincidan"
        description="Cambia el término de búsqueda o vuelve más tarde. Las empresas publican nuevas vacantes con frecuencia."
      />
    );
  }
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((v) => (
          <VacanteCard key={v.id} v={v} />
        ))}
      </div>
      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          <span>
            Página <span className="font-semibold text-foreground">{page + 1}</span> de{" "}
            <span className="font-semibold text-foreground">{Math.max(totalPages, 1)}</span> ·{" "}
            <span className="font-semibold text-foreground">{totalElements}</span> vacante
            {totalElements === 1 ? "" : "s"}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 0} onClick={() => onPageChange(page - 1)}>
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => onPageChange(page + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function VacanteCard({ v }: { v: Vacante }): JSX.Element {
  const cierre = v.fechaCierrePostulaciones
    ? format(parseISO(v.fechaCierrePostulaciones), "PP", { locale: es })
    : null;
  const sinCupos = v.cuposDisponibles <= 0;
  return (
    <Card className="group flex flex-col overflow-hidden">
      <div className="h-2 w-full bg-uni-gradient" aria-hidden />
      <CardContent className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <Link
              to={`/vacantes/${v.id}`}
              className="font-display text-base font-semibold leading-tight tracking-tight line-clamp-2 hover:text-primary transition-colors"
            >
              {v.titulo}
            </Link>
            <div className="text-xs text-muted-foreground mt-0.5 truncate">
              {v.empresa?.razonSocial ?? "Empresa aliada"}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Badge variant="muted" className="font-normal">
            <MapPin className="h-3 w-3" /> {v.ciudad}
          </Badge>
          <Badge variant="muted" className="font-normal">
            {humanize(v.modalidad, MODALIDAD_LABELS)}
          </Badge>
          <Badge variant="muted" className="font-normal">
            {humanize(v.areaPractica, AREA_PRACTICA_LABELS)}
          </Badge>
        </div>

        {v.descripcion && (
          <p className="text-sm text-muted-foreground line-clamp-3">{v.descripcion}</p>
        )}

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg bg-muted/40 p-2">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Cupos
            </div>
            <div
              className={
                sinCupos ? "font-bold text-destructive" : "font-bold text-foreground"
              }
            >
              {sinCupos ? "Sin cupos" : `${v.cuposDisponibles} disponible${v.cuposDisponibles === 1 ? "" : "s"}`}
            </div>
          </div>
          <div className="rounded-lg bg-muted/40 p-2">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Duración
            </div>
            <div className="font-bold text-foreground">{v.duracionMeses} meses</div>
          </div>
        </div>

        {cierre && (
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Postúlate antes del <span className="font-semibold text-foreground">{cierre}</span>
          </div>
        )}

        <div className="flex gap-2 pt-2 mt-auto">
          <Button
            asChild
            size="sm"
            variant="gradient"
            disabled={sinCupos || v.estado !== "PUBLICADA"}
            className="flex-1"
          >
            <Link
              to={`/postulaciones/new?vacanteId=${v.id}`}
              aria-disabled={sinCupos || v.estado !== "PUBLICADA"}
            >
              <Send className="h-4 w-4" /> Postularme
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to={`/vacantes/${v.id}`}>
              <Eye className="h-4 w-4" /> Detalle
            </Link>
          </Button>
        </div>

        {v.estado !== "PUBLICADA" && (
          <div className="text-xs text-muted-foreground inline-flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            Esta vacante no está abierta a postulaciones ahora.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
