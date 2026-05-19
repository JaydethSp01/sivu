import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Factory,
  Info,
  Loader2,
  PlayCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { api, extractApiMessage } from "@/lib/api";

interface ResultadoVinculacion {
  vinculados: string[];
  sinVacante: string[];
}

export function FabricaSolucionesPage(): JSX.Element {
  const [ultimoResultado, setUltimoResultado] = useState<{
    data: ResultadoVinculacion;
    ranAt: Date;
  } | null>(null);

  const ejecutar = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<ResultadoVinculacion>(
        "/fabrica-soluciones/vincular-elegibles"
      );
      return data;
    },
    onSuccess: (data) => {
      setUltimoResultado({ data, ranAt: new Date() });
      const total = data.vinculados.length + data.sinVacante.length;
      if (total === 0) {
        toast.info("No hay estudiantes elegibles en este momento");
      } else {
        toast.success(
          `${data.vinculados.length} vinculados · ${data.sinVacante.length} sin cupo interno`
        );
      }
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Programa interno"
        description="Plan B institucional: cuando llega el inicio del periodo de prácticas y un estudiante elegible aún no tiene cupo en empresa externa, la universidad lo vincula a un proyecto interno."
        icon={Factory}
        actions={
          <Button variant="gradient" onClick={() => ejecutar.mutate()} disabled={ejecutar.isPending}>
            {ejecutar.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <PlayCircle className="h-4 w-4" />
            )}{" "}
            Asignar elegibles ahora
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" /> ¿Cómo funciona?
          </CardTitle>
          <CardDescription>
            La asignación corre cada <strong>lunes a las 9:00 AM</strong>. Toma a los
            estudiantes con hoja de vida aprobada cuyo periodo de práctica ya inició —
            o está por iniciar — y que aún no tienen empresa asignada, y los conecta con
            cupos internos disponibles.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p className="flex items-start gap-2">
            <Clock className="h-4 w-4 mt-0.5 text-primary shrink-0" />
            El sistema sigue buscando empresa externa en paralelo: el programa interno
            es el respaldo, no la primera opción.
          </p>
          <p className="flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 text-primary shrink-0" />
            La ejecución manual permite forzar la asignación sin esperar al lunes, útil
            para cierres de cohorte, sustentaciones o casos urgentes.
          </p>
          <p className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 text-warning shrink-0" />
            Si todos los cupos internos están ocupados, los estudiantes elegibles quedan
            reportados como <strong>"sin cupo"</strong>. Considera abrir más cupos
            internos antes del inicio de prácticas.
          </p>
        </CardContent>
      </Card>

      {ultimoResultado && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resultado de la última ejecución</CardTitle>
            <CardDescription>
              Ejecutada el {ultimoResultado.ranAt.toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="font-semibold">Vinculados</span>
                <Badge variant="success">{ultimoResultado.data.vinculados.length}</Badge>
              </div>
              {ultimoResultado.data.vinculados.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Ningún estudiante fue vinculado en esta corrida.
                </p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {ultimoResultado.data.vinculados.map((email) => (
                    <li
                      key={`v-${email}`}
                      className="rounded-md border bg-emerald-500/5 px-2 py-1"
                    >
                      {email}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span className="font-semibold">Sin cupo interno disponible</span>
                <Badge variant="warning">{ultimoResultado.data.sinVacante.length}</Badge>
              </div>
              {ultimoResultado.data.sinVacante.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Todos los elegibles encontraron cupo.
                </p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {ultimoResultado.data.sinVacante.map((email) => (
                    <li
                      key={`s-${email}`}
                      className="rounded-md border bg-amber-500/5 px-2 py-1"
                    >
                      {email}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
