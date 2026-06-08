import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  /** Si se entrega, se renderiza en vez del fallback por defecto. */
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Atajo global para que un throw no controlado no tumbe la app entera.
 * Captura errores de render/lifecycle de cualquier hijo y muestra una pantalla
 * amigable con opción a recargar.
 *
 * NOTA: no captura errores async (fetch, promises). Para esos usar React Query
 * onError o el toast pattern habitual.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // En prod aquí iría Sentry/etc. Por ahora basta con consola.
    console.error("[ErrorBoundary] render error:", error, info.componentStack);
  }

  reset = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    if (this.props.fallback) {
      return this.props.fallback(error, this.reset);
    }

    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive-soft flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              Algo se rompió mientras dibujábamos la pantalla
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              No pudimos mostrarte esta vista. Si el problema persiste, intenta
              recargar la página o contacta al equipo de soporte de SIVU.
            </p>
          </div>
          {import.meta.env.DEV && (
            <pre className="text-left text-xs bg-muted/50 p-3 rounded-lg border border-border/60 overflow-auto max-h-40">
              {error.name}: {error.message}
            </pre>
          )}
          <div className="flex items-center justify-center gap-3">
            <Button onClick={() => window.location.reload()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Recargar
            </Button>
            <Button variant="outline" onClick={this.reset}>
              Volver a intentar
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
