import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Loader2, MessageCircle, Send, Info } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { api, extractApiMessage } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { cn } from "@/lib/utils";
import type {
  HojaVidaComentarioResponse,
  HojaVidaAutorRol,
} from "@/lib/types";

interface Props {
  hojaVidaId: number;
  /** Si true, oculta el composer (solo lectura, ej. en bandeja para HVs cerradas). */
  readOnly?: boolean;
  /** Mensaje cuando aún no hay comentarios. */
  emptyLabel?: string;
}

/**
 * Hilo conversacional entre Coformación y el estudiante sobre una HV.
 * Reemplaza la "observación monolítica" anterior con un historial completo.
 */
export function HojaVidaTimeline({ hojaVidaId, readOnly = false, emptyLabel }: Props): JSX.Element {
  const qc = useQueryClient();
  const usuario = useAuthStore((s) => s.usuario);
  const hasRole = useAuthStore((s) => s.hasRole);
  const [mensaje, setMensaje] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["/hoja-vida/comentarios", hojaVidaId],
    queryFn: async () => {
      const { data } = await api.get<HojaVidaComentarioResponse[]>(
        `/hoja-vida/${hojaVidaId}/comentarios`
      );
      return data;
    },
  });

  const agregar = useMutation({
    mutationFn: async (msg: string) => {
      const { data } = await api.post<HojaVidaComentarioResponse>(
        `/hoja-vida/${hojaVidaId}/comentarios`,
        { mensaje: msg }
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/hoja-vida/comentarios", hojaVidaId] });
      setMensaje("");
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  const items = data ?? [];
  const puedeComentar =
    !readOnly && (hasRole("ESTUDIANTE") || hasRole("COORDINADOR") || hasRole("ADMIN"));

  return (
    <div className="space-y-3">
      {isLoading ? (
        <div className="flex items-center text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando hilo...
        </div>
      ) : items.length === 0 ? (
        <div className="text-sm text-muted-foreground italic">
          {emptyLabel ?? "Aún no hay mensajes en este hilo."}
        </div>
      ) : (
        <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
          {items.map((c) => (
            <ComentarioBurbuja
              key={c.id}
              comentario={c}
              propio={
                (c.autorRol === "ESTUDIANTE" && hasRole("ESTUDIANTE")) ||
                ((c.autorRol === "COORDINADOR" || c.autorRol === "ADMIN") &&
                  (hasRole("COORDINADOR") || hasRole("ADMIN")))
              }
              meEmail={usuario?.email}
            />
          ))}
        </div>
      )}

      {puedeComentar && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const msg = mensaje.trim();
            if (!msg) {
              toast.error("Escribe un mensaje");
              return;
            }
            agregar.mutate(msg);
          }}
          className="space-y-2 border-t border-border/60 pt-3"
        >
          <Textarea
            rows={3}
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            placeholder={
              hasRole("ESTUDIANTE")
                ? "Escribe tu respuesta a Coformación..."
                : "Escribe un feedback para el estudiante..."
            }
          />
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={agregar.isPending || !mensaje.trim()}>
              {agregar.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Enviar
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

function ComentarioBurbuja({
  comentario: c,
  propio,
}: {
  comentario: HojaVidaComentarioResponse;
  propio: boolean;
  meEmail?: string;
}): JSX.Element {
  if (c.tipo === "SISTEMA") {
    return (
      <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
        <Info className="h-3 w-3" />
        <span>{c.mensaje}</span>
        <span className="text-muted-foreground/60">
          · {format(parseISO(c.createdAt), "PPp", { locale: es })}
        </span>
      </div>
    );
  }
  return (
    <div className={cn("flex", propio ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-3 py-2 shadow-xs",
          propio
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-muted text-foreground rounded-bl-sm"
        )}
      >
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-semibold mb-1 opacity-80">
          <MessageCircle className="h-3 w-3" />
          <span>{rolLabel(c.autorRol)}</span>
          <span className="opacity-70">· {c.autorNombre}</span>
        </div>
        <p className="text-sm whitespace-pre-wrap">{c.mensaje}</p>
        <div className="mt-1 text-[10px] opacity-70">
          {format(parseISO(c.createdAt), "PPp", { locale: es })}
        </div>
      </div>
    </div>
  );
}

function rolLabel(r: HojaVidaAutorRol): string {
  switch (r) {
    case "COORDINADOR":
    case "ADMIN":
      return "Coformación";
    case "ESTUDIANTE":
      return "Estudiante";
    case "SISTEMA":
      return "Sistema";
  }
}
