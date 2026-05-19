import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { FileCog, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, extractApiMessage } from "@/lib/api";
import type { RespuestaFormulario, TipoPlantilla } from "@/lib/types";

interface Props {
  tipo: TipoPlantilla;
  convenioId?: number | null;
  trimestreId?: number | null;
  estudianteId?: number | null;
  label?: string;
  variant?: "default" | "outline" | "gradient" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

/**
 * Botón compartido que abre (o crea) la respuesta del usuario para la
 * plantilla vigente del tipo dado, y navega al formulario dinámico.
 *
 * Lo usan las pantallas viejas (EvalTutorPage, EvalProfesorPage, etc.)
 * para dar acceso al sistema configurable sin romper su flujo.
 */
export function AbrirPlantillaShortcut({
  tipo,
  convenioId,
  trimestreId,
  estudianteId,
  label = "Llenar con plantilla configurable",
  variant = "outline",
  size = "default",
}: Props): JSX.Element {
  const navigate = useNavigate();
  const abrir = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<RespuestaFormulario>(
        "/respuestas-formulario/abrir",
        { tipo, convenioId, trimestreId, estudianteId }
      );
      return data;
    },
    onSuccess: (data) => {
      navigate(`/mis-formularios/${data.id}`);
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  return (
    <Button
      variant={variant}
      size={size}
      onClick={() => abrir.mutate()}
      disabled={abrir.isPending}
    >
      {abrir.isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileCog className="h-4 w-4" />
      )}
      {label}
    </Button>
  );
}
