import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarPlus, Loader2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
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
import { MODALIDAD_ENTREVISTA_LABELS } from "@/lib/enum-labels";
import type {
  EntrevistaRequest,
  EntrevistaResponse,
  ModalidadEntrevista,
} from "@/lib/types";

const MODALIDADES: ModalidadEntrevista[] = ["PRESENCIAL", "VIRTUAL", "HIBRIDA"];

interface Props {
  postulacionId: number;
  trigger?: JSX.Element;
  onCreated?: (e: EntrevistaResponse) => void;
}

export function EntrevistaFormDialog({ postulacionId, trigger, onCreated }: Props): JSX.Element {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [fechaProgramada, setFechaProgramada] = useState("");
  const [modalidad, setModalidad] = useState<ModalidadEntrevista>("VIRTUAL");
  const [lugar, setLugar] = useState("");
  const [enlace, setEnlace] = useState("");
  const [entrevistadorNombre, setEntrevistadorNombre] = useState("");
  const [entrevistadorCargo, setEntrevistadorCargo] = useState("");
  const [observaciones, setObservaciones] = useState("");

  const reset = () => {
    setFechaProgramada("");
    setModalidad("VIRTUAL");
    setLugar("");
    setEnlace("");
    setEntrevistadorNombre("");
    setEntrevistadorCargo("");
    setObservaciones("");
  };

  const mut = useMutation({
    mutationFn: async () => {
      if (!fechaProgramada) throw new Error("La fecha y hora son obligatorias");
      const isoUtc = new Date(fechaProgramada).toISOString();
      const payload: EntrevistaRequest = {
        postulacionId,
        fechaProgramada: isoUtc,
        modalidad,
        lugar: lugar.trim() || null,
        enlaceVirtual: enlace.trim() || null,
        entrevistadorNombre: entrevistadorNombre.trim() || null,
        entrevistadorCargo: entrevistadorCargo.trim() || null,
        observaciones: observaciones.trim() || null,
      };
      const { data } = await api.post<EntrevistaResponse>("/entrevistas", payload);
      return data;
    },
    onSuccess: (data) => {
      toast.success("Entrevista programada");
      qc.invalidateQueries({ queryKey: ["/entrevistas"] });
      qc.invalidateQueries({ queryKey: ["/postulaciones"] });
      onCreated?.(data);
      setOpen(false);
      reset();
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline">
            <CalendarPlus className="h-4 w-4" /> Agendar entrevista
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Programar entrevista</DialogTitle>
          <DialogDescription>
            La postulación pasará a <strong>ENTREVISTA_PROGRAMADA</strong> y se notificará al estudiante.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label htmlFor="ent-fecha">Fecha y hora</Label>
            <Input
              id="ent-fecha"
              type="datetime-local"
              value={fechaProgramada}
              onChange={(e) => setFechaProgramada(e.target.value)}
            />
          </div>
          <div>
            <Label>Modalidad</Label>
            <Select
              value={modalidad}
              onValueChange={(v) => setModalidad(v as ModalidadEntrevista)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODALIDADES.map((m) => (
                  <SelectItem key={m} value={m}>
                    {MODALIDAD_ENTREVISTA_LABELS[m]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {(modalidad === "PRESENCIAL" || modalidad === "HIBRIDA") && (
            <div>
              <Label htmlFor="ent-lugar">Lugar / dirección</Label>
              <Input
                id="ent-lugar"
                value={lugar}
                onChange={(e) => setLugar(e.target.value)}
                placeholder="Ej: Sede principal Uniempresarial, sala 305"
              />
            </div>
          )}
          {(modalidad === "VIRTUAL" || modalidad === "HIBRIDA") && (
            <div>
              <Label htmlFor="ent-enlace">Enlace virtual</Label>
              <Input
                id="ent-enlace"
                value={enlace}
                onChange={(e) => setEnlace(e.target.value)}
                placeholder="https://meet..."
              />
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="ent-nombre">Entrevistador</Label>
              <Input
                id="ent-nombre"
                value={entrevistadorNombre}
                onChange={(e) => setEntrevistadorNombre(e.target.value)}
                placeholder="Nombre completo"
              />
            </div>
            <div>
              <Label htmlFor="ent-cargo">Cargo</Label>
              <Input
                id="ent-cargo"
                value={entrevistadorCargo}
                onChange={(e) => setEntrevistadorCargo(e.target.value)}
                placeholder="Ej: Líder técnico"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="ent-obs">Observaciones</Label>
            <Textarea
              id="ent-obs"
              rows={3}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Temas a tratar, instrucciones de acceso..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={() => mut.mutate()} disabled={mut.isPending}>
            {mut.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Programar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
