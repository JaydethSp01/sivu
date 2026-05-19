import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function NotFoundPage(): JSX.Element {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4 text-center">
      <h1 className="text-7xl font-bold tracking-tight">404</h1>
      <p className="text-muted-foreground">La página que buscas no existe.</p>
      <Button asChild>
        <Link to="/">Ir al inicio</Link>
      </Button>
    </div>
  );
}
