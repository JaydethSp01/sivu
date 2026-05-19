import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Download, Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { api, extractApiMessage } from "@/lib/api";
import { formatBytes } from "@/lib/utils";
import { TIPO_DOCUMENTO_LABELS, humanize } from "@/lib/enum-labels";
import type { Documento } from "@/lib/types";

export function DocumentoDetailPage(): JSX.Element {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["/documentos", id],
    queryFn: async () => (await api.get<Documento>(`/documentos/${id}`)).data,
    enabled: !!id,
  });

  const descargar = useMutation({
    mutationFn: async () => {
      if (!data) return;
      const res = await api.get(`/documentos/${id}/descargar`, { responseType: "blob" });
      const blob = new Blob([res.data as BlobPart], { type: data.mimeType });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = data.nombreOriginal;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  if (isLoading) return <div className="flex items-center text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Cargando...</div>;
  if (!data) return <div>No encontrado</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Volver"><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <h1 className="text-2xl font-bold">{data.nombreOriginal}</h1>
            <p className="text-sm text-muted-foreground">
              {humanize(data.tipo, TIPO_DOCUMENTO_LABELS)} · {data.mimeType} · {formatBytes(data.tamanoBytes)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => descargar.mutate()} disabled={descargar.isPending}>
            {descargar.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Descargar
          </Button>
          <Button variant="outline" onClick={() => navigate(`/documentos/${id}/edit`)}>
            <Pencil className="h-4 w-4" /> Editar
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader><CardTitle>Detalle</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Estado</span><StatusBadge kind="documento" value={data.estado} /></div>
          <div className="flex justify-between gap-2"><span className="text-muted-foreground">Estudiante</span><span>{data.estudiante?.nombreCompleto ?? "—"}</span></div>
          <div className="flex justify-between gap-2"><span className="text-muted-foreground">Postulación</span><span>{data.postulacion?.referencia ?? "—"}</span></div>
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground">Ruta</span>
            <code className="rounded bg-muted px-2 py-1 break-all text-xs">{data.rutaAlmacenamiento}</code>
          </div>
          {data.observacionesValidacion && (
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground">Observaciones</span>
              <p>{data.observacionesValidacion}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
