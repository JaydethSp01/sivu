import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api, extractApiMessage } from "@/lib/api";
import type { SolicitudFabricaResponse } from "@/lib/types";

interface Props {
  trigger?: JSX.Element;
}

export function SolicitarFabricaDialog({ trigger }: Props): JSX.Element {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [motivo, setMotivo] = useState("");

  const mut = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<SolicitudFabricaResponse>(
        "/solicitudes-fabrica",
        { motivo }
      );
      return data;
    },
    onSuccess: () => {
      toast.success("Tu solicitud fue enviada a Coordinación");
      qc.invalidateQueries({ queryKey: ["/solicitudes-fabrica/mias"] });
      setOpen(false);
      setMotivo("");
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  const tooCorto = motivo.trim().length < 20;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="gradient">
            <Send className="h-4 w-4" /> Solicitar ingreso al programa interno
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Solicitar ingreso al programa interno</DialogTitle>
          <DialogDescription>
            Cuéntale a Coordinación por qué necesitas entrar al programa interno.
            Mientras tanto, sigue postulándote a empresas externas — esto es un
            respaldo, no la primera opción.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="motivo-fabrica">Motivo</Label>
          <Textarea
            id="motivo-fabrica"
            rows={6}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ej: Llevo aplicando a vacantes desde el inicio del semestre, las fechas están corriendo y aún no tengo aceptación. Quiero asegurar mi cupo."
          />
          <p className="text-xs text-muted-foreground">
            Mínimo 20 caracteres. Sé claro: Coordinación usará esto para decidir.
            <span className="ml-1 font-medium">
              {motivo.trim().length}/2000
            </span>
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => mut.mutate()}
            disabled={mut.isPending || tooCorto}
            title={tooCorto ? "El motivo debe tener al menos 20 caracteres" : undefined}
          >
            {mut.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Enviar solicitud
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
