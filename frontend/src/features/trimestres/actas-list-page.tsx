import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Download, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { api, extractApiMessage } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { TIPO_REUNION_LABELS } from "@/lib/enum-labels";
import type { ActaReunionResponse } from "@/lib/types";

function downloadPdf(url: string, filename: string): Promise<void> {
  return api.get(url, { responseType: "blob" }).then((res) => {
    const blob = new Blob([res.data as BlobPart], { type: "application/pdf" });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
  });
}

export function ActasListPage(): JSX.Element {
  const { convenioId, trimestreId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const hasRole = useAuthStore((s) => s.hasRole);
  const canCreate = hasRole("ADMIN", "COORDINADOR", "DOCENTE", "TUTOR");
  const canDelete = hasRole("ADMIN", "COORDINADOR");

  const { data, isLoading } = useQuery({
    queryKey: ["/trimestres/actas", trimestreId],
    queryFn: async () =>
      (await api.get<ActaReunionResponse[]>(`/trimestres/${trimestreId}/actas`)).data,
  });

  const eliminar = useMutation({
    mutationFn: async (id: number) => api.delete(`/actas/${id}`),
    onSuccess: () => {
      toast.success("Acta eliminada");
      qc.invalidateQueries({ queryKey: ["/trimestres/actas", trimestreId] });
      qc.invalidateQueries({ queryKey: ["/convenios/trimestres", Number(convenioId)] });
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  const descargar = useMutation({
    mutationFn: async (id: number) => downloadPdf(`/actas/${id}/pdf`, `acta-${id}.pdf`),
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  const columns: DataTableColumn<ActaReunionResponse>[] = [
    { key: "numero", header: "N°", cell: (a) => <span className="font-mono">AC{a.numero}</span> },
    { key: "fecha", header: "Fecha", cell: (a) => a.fecha },
    { key: "tipo", header: "Tipo", cell: (a) => <Badge variant="outline">{TIPO_REUNION_LABELS[a.tipoReunion]}</Badge> },
    { key: "asunto", header: "Asunto", cell: (a) => a.asunto ?? "—" },
    {
      key: "firmas", header: "Firmas",
      cell: (a) => (
        <div className="flex gap-1">
          <Badge variant={a.firmadoEstudiante ? "success" : "muted"}>E</Badge>
          <Badge variant={a.firmadoTutor ? "success" : "muted"}>T</Badge>
          <Badge variant={a.firmadoProfesor ? "success" : "muted"}>P</Badge>
        </div>
      ),
    },
    {
      key: "acciones", header: "",
      cell: (a) => (
        <div className="flex gap-1 justify-end">
          <Button
            size="icon"
            variant="ghost"
            onClick={(e) => { e.stopPropagation(); descargar.mutate(a.id); }}
            aria-label="Descargar PDF"
          >
            <Download className="h-4 w-4" />
          </Button>
          {canDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="icon" variant="ghost" onClick={(e) => e.stopPropagation()}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Eliminar acta AC{a.numero}</AlertDialogTitle>
                  <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={(e) => { e.preventDefault(); eliminar.mutate(a.id); }}>
                    Eliminar
                  </AlertDialogAction>
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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/convenios/${convenioId}`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Actas de Reunión (GAC-FM-11)</h1>
            <p className="text-sm text-muted-foreground">Trimestre #{trimestreId}</p>
          </div>
        </div>
        {canCreate && (
          <Button asChild>
            <Link to={`/convenios/${convenioId}/trimestres/${trimestreId}/actas/new`}>
              <Plus className="h-4 w-4" /> Nueva acta
            </Link>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Actas del trimestre</CardTitle>
          <CardDescription>Listado ordenado por número de acta.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            rows={data}
            isLoading={isLoading}
            page={0}
            totalPages={1}
            totalElements={data?.length ?? 0}
            onPageChange={() => {}}
            rowKey={(a) => a.id}
            onRowClick={(a) => navigate(`/convenios/${convenioId}/trimestres/${trimestreId}/actas/${a.id}`)}
            emptyTitle="Sin actas registradas"
            emptyDescription="Aún no hay actas para este trimestre."
          />
        </CardContent>
      </Card>
    </div>
  );
}
