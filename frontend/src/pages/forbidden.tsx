import { Link } from "react-router-dom";
import { ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ForbiddenPage(): JSX.Element {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4 text-center">
      <ShieldOff className="h-16 w-16 text-destructive" />
      <h1 className="text-3xl font-bold">Acceso denegado</h1>
      <p className="text-muted-foreground max-w-md">
        No tienes los permisos necesarios para ver esta sección.
      </p>
      <Button asChild>
        <Link to="/">Volver al inicio</Link>
      </Button>
    </div>
  );
}
