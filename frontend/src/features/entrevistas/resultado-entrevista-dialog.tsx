import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCheck, Loader2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api, extractApiMessage } from "@/lib/api";
import type { EntrevistaResponse, ResultadoEntrevista } from "@/lib/types";

interface Props {
  entrevistaId: number;
  trigger?: JSX.Element;
}

export function ResultadoEntrevistaDialog({ entrevistaId, trigger }: Props): JSX.Element {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [resultado, setResultado] = useState<Exclude<ResultadoEntrevista, "PENDIENTE">>("APROBADA");
  const [observaciones, setObservaciones] = useState("");

  const mut = useMutation({
    mutationFn: async () => {
      const { data } = await api.patch<EntrevistaResponse>(
        `/entrevistas/${entrevistaId}/resultado`,
        { resultado, observaciones: observaciones.trim() || null }
      );
      return data;
    },
    onSuccess: () => {
      toast.success(
        resultado === "APROBADA"
          ? "Entrevista aprobada — postulación pasa a PRESELECCIONADA"
          : "Entrevista rechazada — postulación pasa a RECHAZADA"
      );
      qc.invalidateQueries({ queryKey: ["/entrevistas"] });
      qc.invalidateQueries({ queryKey: ["/postulaciones"] });
      setOpen(false);
      setObservaciones("");
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <CheckCheck className="h-4 w-4" /> Registrar resultado
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar resultado de entrevista</DialogTitle>
          <DialogDescription>
            Esta acción es irreversible: la postulación cambiará de estado
            automáticamente según el resultado.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label>Resultado</Label>
            <Select
              value={resultado}
              onValueChange={(v) =>
                setResultado(v as Exclude<ResultadoEntrevista, "PENDIENTE">)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="APROBADA">Aprobada → preseleccionar</SelectItem>
                <SelectItem value="RECHAZADA">Rechazada → cerrar postulación</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="res-obs">Observaciones</Label>
            <Textarea
              id="res-obs"
              rows={4}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Notas sobre el desempeño, próximos pasos, motivo de rechazo..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => mut.mutate()}
            disabled={mut.isPending}
            variant={resultado === "APROBADA" ? "default" : "destructive"}
          >
            {mut.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
