import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Eye, FileSignature, Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import type { Convenio, EstadoConvenio, PageResponse } from "@/lib/types";

const ESTADOS: (EstadoConvenio | "ALL")[] = [
  "ALL",
  "BORRADOR",
  "FIRMADO_ESTUDIANTE",
  "FIRMADO_EMPRESA",
  "FIRMADO_UNIVERSIDAD",
  "ACTIVO",
  "FINALIZADO",
  "CANCELADO",
];

const ESTADO_CONVENIO_LABELS: Record<EstadoConvenio, string> = {
  BORRADOR: "Borrador",
  FIRMADO_ESTUDIANTE: "Firmado estudiante",
  FIRMADO_EMPRESA: "Firmado empresa",
  FIRMADO_UNIVERSIDAD: "Firmado universidad",
  ACTIVO: "Activo",
  FINALIZADO: "Finalizado",
  CANCELADO: "Cancelado",
};

export function ConveniosListPage(): JSX.Element {
  const navigate = useNavigate();
  const hasRole = useAuthStore((s) => s.hasRole);
  const esCoordOAdmin = hasRole("ADMIN", "COORDINADOR");
  const isStudentOnly = hasRole("ESTUDIANTE") && !esCoordOAdmin && !hasRole("EMPRESA");
  const isEmpresaOnly = hasRole("EMPRESA") && !esCoordOAdmin;
  const [estado, setEstado] = useState<EstadoConvenio | "ALL">("ALL");
  const [page, setPage] = useState(0);

  const params = {
    estado: estado === "ALL" ? undefined : estado,
    page,
    size: 10,
    sort: "createdAt,desc",
  };

  const { data, isLoading } = useQuery({
    queryKey: ["/convenios", params],
    queryFn: async () => (await api.get<PageResponse<Convenio>>("/convenios", { params })).data,
  });

  const columns: DataTableColumn<Convenio>[] = [
    { key: "numero", header: "N°", cell: (r) => <span className="font-mono">{r.numeroConvenio}</span> },
    { key: "estudiante", header: "Estudiante", cell: (r) => r.estudiante?.nombreCompleto ?? "—" },
    { key: "empresa", header: "Empresa", cell: (r) => r.empresa?.razonSocial ?? "—" },
    { key: "vacante", header: "Vacante", cell: (r) => r.vacante?.titulo ?? "—" },
    {
      key: "fechas",
      header: "Vigencia",
      cell: (r) => (
        <span className="text-xs">
          {format(parseISO(r.fechaInicio), "dd MMM yy", { locale: es })} → {format(parseISO(r.fechaFin), "dd MMM yy", { locale: es })}
        </span>
      ),
    },
    { key: "estado", header: "Estado", cell: (r) => <StatusBadge kind="convenio" value={r.estado} /> },
    {
      key: "acc",
      header: "",
      className: "text-right w-[80px]",
      cell: (r) => (
        <Button variant="ghost" size="icon" onClick={() => navigate(`/convenios/${r.id}`)} aria-label="Ver detalle">
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title={
          isEmpresaOnly
            ? "Convenios"
            : isStudentOnly
              ? "Mi práctica"
              : "Prácticas"
        }
        description={
          isEmpresaOnly
            ? "Convenios firmados con tus practicantes. Aquí ves sus datos, fechas y estado del proceso."
            : isStudentOnly
              ? "Tu convenio de práctica firmado entre tú, la empresa y la universidad."
              : "Convenios de práctica firmados entre estudiante, empresa y universidad."
        }
        icon={FileSignature}
        actions={
          esCoordOAdmin ? (
            <Button onClick={() => navigate("/convenios/asignar")}>
              <Plus className="h-4 w-4" />
              Asignar práctica
            </Button>
          ) : undefined
        }
      />
      <div className="flex flex-wrap gap-2 items-center">
        <Select value={estado} onValueChange={(v) => { setEstado(v as EstadoConvenio | "ALL"); setPage(0); }}>
          <SelectTrigger className="w-72"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            {ESTADOS.map((e) => (
              <SelectItem key={e} value={e}>
                {e === "ALL" ? "Todos los estados" : ESTADO_CONVENIO_LABELS[e]}
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
        emptyTitle={
          isEmpresaOnly
            ? "Aún no tienes practicantes vinculados"
            : isStudentOnly
              ? "Aún no tienes una práctica activa"
              : "Sin convenios aún"
        }
        emptyDescription={
          isEmpresaOnly
            ? "Cuando aceptes a un postulante, su convenio de práctica aparecerá aquí."
            : isStudentOnly
              ? "Cuando una empresa acepte tu postulación, tu convenio aparecerá aquí."
              : "Cuando se formalice una postulación aceptada, se creará un convenio."
        }
      />
    </div>
  );
}
