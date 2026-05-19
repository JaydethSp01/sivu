import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  PenLine,
  Save,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/page-header";
import { api, extractApiMessage } from "@/lib/api";
import {
  ESTADO_RESPUESTA_LABELS,
  ESTADO_RESPUESTA_VARIANT,
} from "@/lib/enum-labels";
import type {
  CriterioPlantilla,
  LlenarRequest,
  PlantillaFormulario,
  RespuestaFormulario,
  ValorCriterio,
} from "@/lib/types";

export function RespuestaLlenarPage(): JSX.Element {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [valores, setValores] = useState<Record<number, ValorCriterio>>({});
  const [observaciones, setObservaciones] = useState("");

  const respuesta = useQuery({
    queryKey: ["/respuestas-formulario", id],
    enabled: !!id,
    queryFn: async () =>
      (await api.get<RespuestaFormulario>(`/respuestas-formulario/${id}`)).data,
  });

  const plantilla = useQuery({
    queryKey: ["/plantillas", respuesta.data?.plantillaId],
    enabled: !!respuesta.data?.plantillaId,
    queryFn: async () =>
      (await api.get<PlantillaFormulario>(`/plantillas/${respuesta.data!.plantillaId}`)).data,
  });

  useEffect(() => {
    if (respuesta.data) {
      const map: Record<number, ValorCriterio> = {};
      for (const v of respuesta.data.valores) {
        map[v.criterioId] = v;
      }
      setValores(map);
      setObservaciones(respuesta.data.observaciones ?? "");
    }
  }, [respuesta.data]);

  const editable =
    respuesta.data &&
    (respuesta.data.estado === "PENDIENTE" ||
      respuesta.data.estado === "EN_PROGRESO" ||
      respuesta.data.estado === "RECHAZADO");

  const guardar = useMutation({
    mutationFn: async () => {
      const payload: LlenarRequest = {
        observaciones: observaciones || null,
        valores: Object.values(valores),
      };
      return api.put<RespuestaFormulario>(`/respuestas-formulario/${id}`, payload);
    },
    onSuccess: () => {
      toast.success("Guardado");
      qc.invalidateQueries({ queryKey: ["/respuestas-formulario", id] });
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  const entregar = useMutation({
    mutationFn: async () => api.post(`/respuestas-formulario/${id}/entregar`),
    onSuccess: () => {
      toast.success("Entregado a Coformación");
      qc.invalidateQueries({ queryKey: ["/respuestas-formulario", id] });
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  const firmar = useMutation({
    mutationFn: async () => api.post(`/respuestas-formulario/${id}/firmar`),
    onSuccess: () => {
      toast.success("Firmado");
      qc.invalidateQueries({ queryKey: ["/respuestas-formulario", id] });
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  const descargar = useMutation({
    mutationFn: async () => {
      const res = await api.get(`/respuestas-formulario/${id}/pdf`, {
        responseType: "blob",
      });
      const blob = new Blob([res.data as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `formulario-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  const notaPreviewMemo = useMemo(() => {
    if (!plantilla.data) return null;
    let total = 0;
    let huboPeso = false;
    for (const s of plantilla.data.secciones) {
      const ps = s.peso == null ? null : Number(s.peso);
      if (ps == null) continue;
      huboPeso = true;
      const conPesoCrit = s.criterios.some((c) => c.peso != null);
      if (conPesoCrit) {
        for (const c of s.criterios) {
          const pc = c.peso == null ? null : Number(c.peso);
          if (pc == null) continue;
          const v = valores[c.id]?.valorNumero;
          const num = v == null || v === "" ? 0 : Number(v);
          total += num * pc;
        }
      } else {
        const nums = s.criterios
          .map((c) => valores[c.id]?.valorNumero)
          .filter((v) => v != null && v !== "")
          .map((v) => Number(v));
        if (nums.length > 0) {
          const prom = nums.reduce((a, b) => a + b, 0) / nums.length;
          total += prom * ps;
        }
      }
    }
    return huboPeso ? total : null;
  }, [plantilla.data, valores]);

  if (!respuesta.data || !plantilla.data) {
    return (
      <div className="flex items-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando formulario...
      </div>
    );
  }

  const setValor = (criterioId: number, patch: Partial<ValorCriterio>) =>
    setValores((prev) => ({
      ...prev,
      [criterioId]: { criterioId, ...prev[criterioId], ...patch },
    }));

  return (
    <div className="space-y-5">
      <PageHeader
        title={plantilla.data.nombre}
        description={`${plantilla.data.codigo} · v${plantilla.data.version}`}
        icon={FileText}
        badge={
          <Badge variant={ESTADO_RESPUESTA_VARIANT[respuesta.data.estado]}>
            {ESTADO_RESPUESTA_LABELS[respuesta.data.estado]}
          </Badge>
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" /> Volver
            </Button>
            <Button
              variant="outline"
              onClick={() => descargar.mutate()}
              disabled={descargar.isPending}
            >
              {descargar.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              PDF
            </Button>
            {editable && (
              <>
                <Button onClick={() => guardar.mutate()} disabled={guardar.isPending}>
                  {guardar.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Guardar
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="gradient">
                      <Send className="h-4 w-4" /> Entregar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Entregar el formulario?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Después de entregar no podrás editarlo hasta que Coformación lo revise.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => entregar.mutate()}>
                        Entregar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
            {respuesta.data.estado === "ENTREGADO" && (
              <Button variant="gradient" onClick={() => firmar.mutate()}>
                <PenLine className="h-4 w-4" /> Firmar
              </Button>
            )}
          </div>
        }
      />

      {respuesta.data.estado === "RECHAZADO" && respuesta.data.observaciones && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="pt-5 flex items-start gap-2 text-sm">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <strong className="text-destructive">Coformación rechazó este formulario</strong>
              <p className="mt-1 whitespace-pre-wrap">{respuesta.data.observaciones}</p>
              <p className="mt-2 text-xs text-muted-foreground">Ajusta y vuelve a entregar.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {respuesta.data.estado === "APROBADO" && (
        <Card className="border-emerald-500/40 bg-emerald-500/5">
          <CardContent className="pt-5 flex items-start gap-2 text-sm">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-emerald-700 dark:text-emerald-400">
                Formulario aprobado
              </strong>
              <p className="text-muted-foreground mt-0.5">
                Cerrado por Coformación.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {plantilla.data.secciones.map((s) => (
        <Card key={s.id}>
          <CardContent className="pt-5 space-y-3">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="font-display text-base font-bold tracking-tight">
                {s.titulo}
              </h2>
              {s.peso != null && (
                <span className="text-xs text-muted-foreground">
                  Peso: {Math.round(Number(s.peso) * 100)}%
                </span>
              )}
            </div>
            {s.descripcion && (
              <p className="text-xs text-muted-foreground">{s.descripcion}</p>
            )}
            <div className="space-y-3">
              {s.criterios.map((c) => (
                <CriterioInput
                  key={c.id}
                  criterio={c}
                  valor={valores[c.id]}
                  editable={!!editable}
                  onChange={(patch) => setValor(c.id, patch)}
                />
              ))}
              {s.criterios.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Esta sección no tiene criterios todavía.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {notaPreviewMemo != null && (
        <Card>
          <CardContent className="pt-5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Nota calculada (preview)
            </Label>
            <div className="text-3xl font-display font-bold mt-1">
              {notaPreviewMemo.toFixed(2)}
            </div>
            {respuesta.data.notaCalculada != null && (
              <div className="text-xs text-muted-foreground mt-1">
                Persistida: {Number(respuesta.data.notaCalculada).toFixed(2)}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-5 space-y-2">
          <Label>Observaciones</Label>
          <Textarea
            rows={4}
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            disabled={!editable}
          />
        </CardContent>
      </Card>
    </div>
  );
}

interface CriterioInputProps {
  criterio: CriterioPlantilla;
  valor: ValorCriterio | undefined;
  editable: boolean;
  onChange: (patch: Partial<ValorCriterio>) => void;
}

function CriterioInput({ criterio: c, valor: v, editable, onChange }: CriterioInputProps): JSX.Element {
  const opciones = (c.opciones ?? "").split(",").map((o) => o.trim()).filter(Boolean);

  return (
    <div className="rounded-md border p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <Label className="text-sm font-medium">{c.descripcion}</Label>
        {c.peso != null && (
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground shrink-0">
            {Math.round(Number(c.peso) * 100)}%
          </span>
        )}
      </div>

      {c.tipo === "NUMBER" && (
        <Input
          type="number"
          min={0}
          max={5}
          step="0.1"
          disabled={!editable}
          value={v?.valorNumero == null ? "" : String(v.valorNumero)}
          onChange={(e) =>
            onChange({
              valorNumero: e.target.value === "" ? null : Number(e.target.value),
            })
          }
          placeholder={c.placeholder ?? "0.0 – 5.0"}
        />
      )}

      {c.tipo === "TEXT" && (
        <Textarea
          rows={3}
          disabled={!editable}
          value={v?.valorTexto ?? ""}
          onChange={(e) => onChange({ valorTexto: e.target.value })}
          placeholder={c.placeholder ?? "Escribe aquí..."}
        />
      )}

      {c.tipo === "BOOL" && (
        <div className="flex items-center gap-4">
          <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="radio"
              checked={v?.valorBool === true}
              onChange={() => onChange({ valorBool: true })}
              disabled={!editable}
            />
            Sí
          </label>
          <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="radio"
              checked={v?.valorBool === false}
              onChange={() => onChange({ valorBool: false })}
              disabled={!editable}
            />
            No
          </label>
        </div>
      )}

      {c.tipo === "DATE" && (
        <Input
          type="date"
          disabled={!editable}
          value={v?.valorTexto ?? ""}
          onChange={(e) => onChange({ valorTexto: e.target.value })}
        />
      )}

      {c.tipo === "SELECT" && (
        <Select
          value={v?.valorTexto ?? ""}
          onValueChange={(value) => onChange({ valorTexto: value })}
          disabled={!editable}
        >
          <SelectTrigger>
            <SelectValue placeholder={c.placeholder ?? "Selecciona una opción"} />
          </SelectTrigger>
          <SelectContent>
            {opciones.map((opt) => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {c.tipo === "SIGNATURE" && (
        <div className="flex flex-wrap items-center gap-3">
          {v?.valorBool ? (
            <div className="inline-flex items-center gap-2 rounded-md border border-success/50 bg-success/10 px-3 py-2 text-sm text-success">
              <CheckCircle2 className="h-4 w-4" />
              Firmado por <strong>{v.valorTexto ?? "—"}</strong>
            </div>
          ) : (
            <>
              <Input
                placeholder="Tu nombre completo"
                disabled={!editable}
                value={v?.valorTexto ?? ""}
                onChange={(e) => onChange({ valorTexto: e.target.value })}
                className="max-w-xs"
              />
              <Button
                size="sm"
                disabled={!editable || !v?.valorTexto?.trim()}
                onClick={() => onChange({ valorBool: true })}
              >
                <PenLine className="h-4 w-4" /> Firmar
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
