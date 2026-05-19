import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock, ExternalLink, Eye, Loader2, MapPin, MessageSquare } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { api } from "@/lib/api";
import {
  MODALIDAD_ENTREVISTA_LABELS,
  RESULTADO_ENTREVISTA_LABELS,
} from "@/lib/enum-labels";
import type { EntrevistaResponse, ResultadoEntrevista } from "@/lib/types";

const RESULTADOS: (ResultadoEntrevista | "TODAS")[] = [
  "TODAS",
  "PENDIENTE",
  "APROBADA",
  "RECHAZADA",
];

export function EntrevistasListPage(): JSX.Element {
  const [resultado, setResultado] = useState<ResultadoEntrevista | "TODAS">("TODAS");

  const lista = useQuery({
    queryKey: ["/entrevistas", { scope: "all" }],
    queryFn: async () => {
      const { data } = await api.get<EntrevistaResponse[]>("/entrevistas");
      return data;
    },
  });

  const filtradas = useMemo(() => {
    const arr = (lista.data ?? []).slice();
    arr.sort(
      (a, b) =>
        parseISO(b.fechaProgramada).getTime() - parseISO(a.fechaProgramada).getTime()
    );
    if (resultado === "TODAS") return arr;
    return arr.filter((e) => e.resultado === resultado);
  }, [lista.data, resultado]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <CalendarClock className="h-6 w-6 text-primary" />
            Entrevistas
          </h1>
          <p className="text-sm text-muted-foreground">
            Auto-scope por rol: estudiante ve las suyas, empresa las de sus vacantes, coord/admin ve todas.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Resultado</span>
          <Select
            value={resultado}
            onValueChange={(v) => setResultado(v as ResultadoEntrevista | "TODAS")}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RESULTADOS.map((r) => (
                <SelectItem key={r} value={r}>
                  {r === "TODAS" ? "Todas" : RESULTADO_ENTREVISTA_LABELS[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge variant="muted">{filtradas.length}</Badge>
        </div>
      </div>

      <Card>
        <CardContent className="pt-4">
          {lista.isLoading ? (
            <div className="flex items-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando...
            </div>
          ) : filtradas.length === 0 ? (
            <EmptyState
              title="Sin entrevistas"
              description="No hay entrevistas para el filtro seleccionado."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha programada</TableHead>
                  <TableHead>Estudiante → Empresa / Vacante</TableHead>
                  <TableHead>Modalidad</TableHead>
                  <TableHead>Resultado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtradas.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>
                      <div className="text-sm font-medium">
                        {format(parseISO(e.fechaProgramada), "PPp", { locale: es })}
                      </div>
                      {e.fechaResultado && (
                        <div className="text-xs text-muted-foreground">
                          Cerrada {format(parseISO(e.fechaResultado), "PPp", { locale: es })}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{e.estudianteNombre}</div>
                      <div className="text-xs text-muted-foreground">
                        {e.empresaRazonSocial} — {e.vacanteCargo}
                      </div>
                      {e.lugar && (
                        <div className="text-xs text-muted-foreground inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {e.lugar}
                        </div>
                      )}
                      {e.enlaceVirtual && (
                        <a
                          href={e.enlaceVirtual}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" /> Enlace
                        </a>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="muted">
                        {MODALIDAD_ENTREVISTA_LABELS[e.modalidad] ?? e.modalidad}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <StatusBadge kind="entrevista" value={e.resultado} />
                      {e.observaciones && (
                        <MessageSquare
                          className="inline h-3 w-3 ml-1 text-muted-foreground"
                          aria-label="Tiene observaciones"
                        />
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="outline">
                        <Link to={`/postulaciones/${e.postulacionId}`}>
                          <Eye className="h-4 w-4" /> Ver postulación
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
