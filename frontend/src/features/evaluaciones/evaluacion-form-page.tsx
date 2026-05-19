import { useEffect, useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/combobox";
import { api, extractApiMessage } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { RECOMENDACION_LABELS } from "@/lib/enum-labels";
import type { Recomendacion } from "@/lib/types";
import type {
  Convenio,
  Evaluacion,
  PageResponse,
  Tutor,
} from "@/lib/types";

const schema = z.object({
  convenioId: z.coerce.number().int().positive(),
  tutorId: z.coerce.number().int().positive(),
  tipo: z.enum(["INTERMEDIA", "FINAL"]),
  fechaEvaluacion: z.string().optional().or(z.literal("")),
  calificacion: z.coerce.number().min(0).max(5),
  competenciasTecnicas: z.coerce.number().min(0).max(5),
  competenciasBlandas: z.coerce.number().min(0).max(5),
  recomendacion: z.enum(["CONTINUAR", "REFORZAR", "SUSPENDER", "NO_APLICA"]),
  observaciones: z.string().max(5000).optional().or(z.literal("")),
  tutorTipo: z.enum(["ACADEMICO", "EMPRESARIAL"]),
});

type Values = z.infer<typeof schema>;

export function EvaluacionFormPage(): JSX.Element {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [sp] = useSearchParams();
  const hasRole = useAuthStore((s) => s.hasRole);
  const empresaOnly = hasRole("EMPRESA") && !hasRole("ADMIN", "COORDINADOR");

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      convenioId: Number(sp.get("convenioId")) || 0,
      tutorId: 0,
      tipo: "INTERMEDIA",
      fechaEvaluacion: "",
      calificacion: 0,
      competenciasTecnicas: 0,
      competenciasBlandas: 0,
      recomendacion: "CONTINUAR",
      observaciones: "",
      tutorTipo: empresaOnly ? "EMPRESARIAL" : "ACADEMICO",
    },
  });

  const tutorTipo = form.watch("tutorTipo");

  const convenios = useQuery({
    queryKey: ["/convenios", "for-evaluacion-form"],
    queryFn: async () =>
      (await api.get<PageResponse<Convenio>>("/convenios", { params: { page: 0, size: 200 } })).data.content,
  });

  const tutoresQuery = useQuery({
    queryKey: ["/tutores", "for-evaluacion-form", tutorTipo],
    queryFn: async () =>
      (
        await api.get<PageResponse<Tutor>>("/tutores", {
          params: { tipo: tutorTipo, estado: "ACTIVO", page: 0, size: 200 },
        })
      ).data.content,
  });

  const tutoresFiltrados = useMemo(() => tutoresQuery.data ?? [], [tutoresQuery.data]);

  const detail = useQuery({
    queryKey: ["/evaluaciones", id],
    enabled: isEdit,
    queryFn: async () => (await api.get<Evaluacion>(`/evaluaciones/${id}`)).data,
  });

  useEffect(() => {
    if (detail.data) {
      const d = detail.data;
      form.reset({
        convenioId: d.convenioId,
        tutorId: d.tutorId,
        tipo: d.tipo,
        fechaEvaluacion: d.fechaEvaluacion ?? "",
        calificacion: Number(d.calificacion),
        competenciasTecnicas: Number(d.competenciasTecnicas),
        competenciasBlandas: Number(d.competenciasBlandas),
        recomendacion: d.recomendacion,
        observaciones: d.observaciones ?? "",
        tutorTipo: d.evaluadorTipo,
      });
    }
  }, [detail.data, form]);

  const save = useMutation({
    mutationFn: async (values: Values) => {
      const payload = {
        convenioId: values.convenioId,
        tutorId: values.tutorId,
        tipo: values.tipo,
        fechaEvaluacion: values.fechaEvaluacion || undefined,
        calificacion: values.calificacion,
        competenciasTecnicas: values.competenciasTecnicas,
        competenciasBlandas: values.competenciasBlandas,
        recomendacion: values.recomendacion,
        observaciones: values.observaciones || undefined,
      };
      if (isEdit) return api.put<Evaluacion>(`/evaluaciones/${id}`, payload);
      return api.post<Evaluacion>("/evaluaciones", payload);
    },
    onSuccess: (res) => {
      toast.success(isEdit ? "Evaluación actualizada" : "Evaluación registrada");
      qc.invalidateQueries({ queryKey: ["/evaluaciones"] });
      qc.invalidateQueries({ queryKey: ["/convenios"] });
      navigate(`/convenios/${res.data.convenioId}`);
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Volver">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{isEdit ? "Editar" : "Nueva"} evaluación</h1>
          <p className="text-sm text-muted-foreground">
            Evaluación intermedia o final del practicante por su tutor académico o empresarial.
          </p>
        </div>
      </div>
      <Card>
        <CardHeader><CardTitle>Datos de la evaluación</CardTitle></CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((v) => save.mutate(v))} className="space-y-4">
              <FormField control={form.control} name="convenioId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Convenio</FormLabel>
                  <FormControl>
                    <Combobox
                      items={convenios.data ?? []}
                      value={field.value || null}
                      onChange={(v) => field.onChange(v ?? 0)}
                      placeholder="Selecciona el convenio"
                      searchPlaceholder="Buscar convenio..."
                      getKey={(c) => c.id}
                      getLabel={(c) => c.numeroConvenio}
                      getSecondary={(c) =>
                        `${c.estudiante?.nombreCompleto ?? "—"} · ${c.empresa?.razonSocial ?? "—"}`
                      }
                      disabled={isEdit}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="tutorTipo" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de evaluador</FormLabel>
                    <Select value={field.value} onValueChange={(v) => {
                      field.onChange(v);
                      form.setValue("tutorId", 0);
                    }}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {!empresaOnly && <SelectItem value="ACADEMICO">Tutor académico</SelectItem>}
                        <SelectItem value="EMPRESARIAL">Tutor empresarial</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="tutorId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tutor</FormLabel>
                    <FormControl>
                      <Combobox
                        items={tutoresFiltrados}
                        value={field.value || null}
                        onChange={(v) => field.onChange(v ?? 0)}
                        placeholder={
                          tutorTipo === "ACADEMICO"
                            ? "Selecciona el tutor académico"
                            : "Selecciona el tutor empresarial"
                        }
                        searchPlaceholder="Buscar tutor..."
                        getKey={(t) => t.id}
                        getLabel={(t) => `${t.nombres} ${t.apellidos}`}
                        getSecondary={(t) =>
                          t.tipo === "EMPRESARIAL"
                            ? (t.empresaRazonSocial ?? t.email)
                            : (t.dependencia ?? t.email)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={form.control} name="tipo" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="INTERMEDIA">Intermedia</SelectItem>
                        <SelectItem value="FINAL">Final</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="fechaEvaluacion" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormDescription>Opcional (por defecto hoy).</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="recomendacion" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recomendación</FormLabel>
                    <Select value={field.value} onValueChange={(v) => field.onChange(v as Values["recomendacion"])}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {(Object.keys(RECOMENDACION_LABELS) as Recomendacion[]).map((r) => (
                          <SelectItem key={r} value={r}>{RECOMENDACION_LABELS[r]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={form.control} name="calificacion" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Calificación (0-5)</FormLabel>
                    <FormControl><Input type="number" step="0.1" min={0} max={5} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="competenciasTecnicas" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Competencias técnicas (0-5)</FormLabel>
                    <FormControl><Input type="number" step="0.1" min={0} max={5} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="competenciasBlandas" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Competencias blandas (0-5)</FormLabel>
                    <FormControl><Input type="number" step="0.1" min={0} max={5} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="observaciones" render={({ field }) => (
                <FormItem>
                  <FormLabel>Observaciones</FormLabel>
                  <FormControl><Textarea rows={5} placeholder="Comentarios cualitativos sobre el desempeño..." {...field} /></FormControl>
                  <FormDescription>Opcional.</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancelar</Button>
                <Button type="submit" disabled={save.isPending}>
                  {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}Guardar
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
