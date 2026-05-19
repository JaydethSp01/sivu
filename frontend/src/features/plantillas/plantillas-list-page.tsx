import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Eye, FileCog, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { api } from "@/lib/api";
import { TIPO_PLANTILLA_LABELS } from "@/lib/enum-labels";
import type { PlantillaFormulario } from "@/lib/types";

export function PlantillasListPage(): JSX.Element {
  const { data, isLoading } = useQuery({
    queryKey: ["/plantillas"],
    queryFn: async () =>
      (await api.get<PlantillaFormulario[]>("/plantillas")).data,
  });

  // Agrupar por tipo, mostrar vigente arriba
  const porTipo = (data ?? []).reduce<Record<string, PlantillaFormulario[]>>((acc, p) => {
    (acc[p.tipo] ||= []).push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <PageHeader
        title="Plantillas de formularios"
        description="Los 5 formatos institucionales de Uniempresarial. Ajusta criterios y pesos, crea versiones nuevas y márcalas como vigentes."
        icon={FileCog}
      />

      {isLoading ? (
        <div className="flex items-center justify-center rounded-2xl border border-dashed p-12 text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" /> Cargando plantillas...
        </div>
      ) : (data ?? []).length === 0 ? (
        <EmptyState title="Aún no hay plantillas" description="Las plantillas iniciales se siembran con la migración V12." />
      ) : (
        Object.keys(porTipo).map((tipo) => (
          <Card key={tipo}>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-primary" />
                <h2 className="font-display text-base font-bold">
                  {TIPO_PLANTILLA_LABELS[tipo] ?? tipo}
                </h2>
              </div>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {porTipo[tipo].map((p) => (
                  <article
                    key={p.id}
                    className="rounded-xl border border-border/70 bg-card p-4 shadow-xs hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-display text-sm font-bold tracking-tight truncate">
                          {p.codigo} · v{p.version}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {p.nombre}
                        </div>
                      </div>
                      {p.vigente && <Badge variant="success">Vigente</Badge>}
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div>
                        <div className="font-semibold text-foreground">{p.secciones.length}</div>
                        secciones
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">
                          {p.secciones.reduce((n, s) => n + s.criterios.length, 0)}
                        </div>
                        criterios
                      </div>
                    </div>
                    {p.fechaVigencia && (
                      <div className="mt-2 text-[11px] text-muted-foreground">
                        Vigente desde {format(parseISO(p.fechaVigencia), "PP", { locale: es })}
                      </div>
                    )}
                    <Button asChild size="sm" variant="outline" className="mt-3 w-full">
                      <Link to={`/plantillas/${p.id}`}>
                        <Eye className="h-4 w-4" /> Abrir
                      </Link>
                    </Button>
                  </article>
                ))}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
