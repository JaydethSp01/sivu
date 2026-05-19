import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { Download, FileSignature, Loader2, RefreshCw } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { api, extractApiMessage } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import type { EstadoPostulacion } from "@/lib/types";

interface CartaResumen {
  id: number;
  postulacionId: number;
  firmadaPorCoordNombre: string | null;
  generadaAt: string;
}

interface Props {
  postulacionId: number;
  postulacionEstado: EstadoPostulacion;
}

const ESTADOS_GENERAR: EstadoPostulacion[] = ["PRESELECCIONADA", "ACEPTADA"];

export function CartaPresentacionPanel({ postulacionId, postulacionEstado }: Props): JSX.Element {
  const qc = useQueryClient();
  const hasRole = useAuthStore((s) => s.hasRole);
  const canGenerate =
    hasRole("ADMIN", "COORDINADOR") && ESTADOS_GENERAR.includes(postulacionEstado);

  const carta = useQuery({
    queryKey: ["/postulaciones", postulacionId, "carta-presentacion"],
    queryFn: async () => {
      try {
        const { data } = await api.get<CartaResumen>(
          `/postulaciones/${postulacionId}/carta-presentacion`
        );
        return data;
      } catch (e) {
        if (e instanceof AxiosError && e.response?.status === 404) return null;
        throw e;
      }
    },
    retry: (failureCount, error) => {
      if (error instanceof AxiosError && error.response?.status === 404) return false;
      return failureCount < 2;
    },
  });

  const generar = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<CartaResumen>(
        `/postulaciones/${postulacionId}/carta-presentacion`
      );
      return data;
    },
    onSuccess: (data) => {
      toast.success("Carta de presentación generada");
      qc.setQueryData(
        ["/postulaciones", postulacionId, "carta-presentacion"],
        data
      );
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  const descargar = useMutation({
    mutationFn: async () => {
      const res = await api.get(
        `/postulaciones/${postulacionId}/carta-presentacion/pdf`,
        { responseType: "blob" }
      );
      const blob = new Blob([res.data as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `carta-presentacion-p${postulacionId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <FileSignature className="h-5 w-5 text-primary" />
            Carta de Presentación
          </CardTitle>
          <CardDescription>
            Documento institucional firmado por la Oficina de Coformación. Se genera automáticamente al aceptar la postulación.
          </CardDescription>
        </div>
        {canGenerate && carta.data && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => generar.mutate()}
            disabled={generar.isPending}
            title="Regenerar (sobrescribe la firma con el coordinador actual)"
          >
            {generar.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}{" "}
            Regenerar
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {carta.isLoading ? (
          <div className="flex items-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando...
          </div>
        ) : carta.data ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge variant="success">Generada</Badge>
              <span className="text-muted-foreground">
                {format(parseISO(carta.data.generadaAt), "PPp", { locale: es })}
              </span>
              {carta.data.firmadaPorCoordNombre && (
                <span className="text-xs text-muted-foreground">
                  · Firmada por {carta.data.firmadaPorCoordNombre}
                </span>
              )}
            </div>
            <Button onClick={() => descargar.mutate()} disabled={descargar.isPending}>
              {descargar.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}{" "}
              Descargar PDF
            </Button>
          </div>
        ) : canGenerate ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              No se ha generado la carta para esta postulación. Genera el PDF firmado por
              Coformación para enviarlo a la empresa.
            </p>
            <Button onClick={() => generar.mutate()} disabled={generar.isPending}>
              {generar.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileSignature className="h-4 w-4" />
              )}{" "}
              Generar carta
            </Button>
          </div>
        ) : (
          <EmptyState
            title="Sin carta de presentación"
            description="La carta se genera cuando Coformación preselecciona o acepta la postulación."
          />
        )}
      </CardContent>
    </Card>
  );
}
