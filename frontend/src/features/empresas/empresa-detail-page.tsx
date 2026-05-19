import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, ArrowLeft, Check, Loader2, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { StatusBadge } from "@/components/status-badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api, extractApiMessage } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import type { Empresa } from "@/lib/types";

export function EmpresaDetailPage(): JSX.Element {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const hasRole = useAuthStore((s) => s.hasRole);
  const canValidar = hasRole("ADMIN", "COORDINADOR");

  const [openReject, setOpenReject] = useState(false);
  const [motivo, setMotivo] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["/empresas", id],
    queryFn: async () => (await api.get<Empresa>(`/empresas/${id}`)).data,
    enabled: !!id,
  });

  const aprobar = useMutation({
    mutationFn: async () => api.patch<Empresa>(`/empresas/${id}/aprobar`),
    onSuccess: () => {
      toast.success("Empresa aprobada");
      qc.invalidateQueries({ queryKey: ["/empresas"] });
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  const rechazar = useMutation({
    mutationFn: async (motivo: string) =>
      api.patch<Empresa>(`/empresas/${id}/rechazar`, { motivo }),
    onSuccess: () => {
      toast.success("Empresa rechazada");
      setOpenReject(false);
      setMotivo("");
      qc.invalidateQueries({ queryKey: ["/empresas"] });
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  if (isLoading) return <div className="flex items-center text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Cargando...</div>;
  if (!data) return <div>No encontrada</div>;

  const esPropuesta = data.propuestaPorEstudianteId != null;
  const mostrarMotivoRechazo = data.estado === "INACTIVA" && !!data.motivoRechazo;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <h1 className="text-2xl font-bold">{data.razonSocial}</h1>
            <p className="text-sm text-muted-foreground">NIT {data.nit} · {data.ciudad}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {canValidar && data.estado === "EN_REVISION" && (
            <>
              <Button onClick={() => aprobar.mutate()} disabled={aprobar.isPending}>
                {aprobar.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Aprobar
              </Button>
              <Button variant="destructive" onClick={() => setOpenReject(true)}>
                <X className="h-4 w-4" /> Rechazar
              </Button>
            </>
          )}
          {hasRole("ADMIN", "COORDINADOR", "EMPRESA") && (
            <Button variant="outline" onClick={() => navigate(`/empresas/${id}/edit`)}>
              <Pencil className="h-4 w-4" /> Editar
            </Button>
          )}
        </div>
      </div>

      {mostrarMotivoRechazo && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Empresa rechazada</AlertTitle>
          <AlertDescription>{data.motivoRechazo}</AlertDescription>
        </Alert>
      )}

      {esPropuesta && data.estado === "EN_REVISION" && (
        <Alert variant="warning">
          <AlertTitle>Empresa propuesta por un estudiante</AlertTitle>
          <AlertDescription>
            Propuesta por el estudiante #{data.propuestaPorEstudianteId}. Revisa los datos antes de aprobar.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader><CardTitle>Información</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Nombre comercial</span><span>{data.nombreComercial ?? "—"}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Sector</span><span>{data.sector}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Dirección</span><span>{data.direccion ?? "—"}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{data.emailContacto}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Teléfono</span><span>{data.telefonoContacto ?? "—"}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Contacto</span><span>{data.contactoNombre} {data.contactoCargo ? `(${data.contactoCargo})` : ""}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Estado</span><StatusBadge kind="empresa" value={data.estado} /></div>
          {data.fechaAprobacion && (
            <div className="flex justify-between"><span className="text-muted-foreground">Aprobada el</span><span>{data.fechaAprobacion}</span></div>
          )}
        </CardContent>
      </Card>

      <Dialog open={openReject} onOpenChange={setOpenReject}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar empresa</DialogTitle>
            <DialogDescription>
              Indica el motivo del rechazo. El estudiante verá esta razón.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            rows={4}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Motivo del rechazo..."
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenReject(false)}>Cancelar</Button>
            <Button
              variant="destructive"
              disabled={!motivo.trim() || rechazar.isPending}
              onClick={() => rechazar.mutate(motivo.trim())}
            >
              {rechazar.isPending && <Loader2 className="h-4 w-4 animate-spin" />}Rechazar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
