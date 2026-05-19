import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import {
  AREA_PRACTICA_LABELS,
  ESTADO_VACANTE_LABELS,
  MODALIDAD_LABELS,
} from "@/lib/enum-labels";
import type { Empresa, ModalidadCatalogo, PageResponse, Vacante } from "@/lib/types";

const AREAS = ["DESARROLLO_SW", "ANALISIS_DATOS", "MARKETING", "RRHH", "FINANZAS", "OPERACIONES", "OTRO"] as const;
const MODALIDADES = ["PRESENCIAL", "HIBRIDO", "REMOTO"] as const;
const ESTADOS = ["BORRADOR", "PUBLICADA", "CERRADA", "ASIGNADA"] as const;

const schema = z.object({
  empresaId: z.coerce.number().int().positive(),
  titulo: z.string().min(1).max(180),
  descripcion: z.string().min(1),
  areaPractica: z.enum(AREAS),
  modalidad: z.enum(MODALIDADES),
  ciudad: z.string().min(1).max(80),
  requisitosKeywords: z.string().optional(),
  creditosMinimos: z.coerce.number().int().min(0),
  promedioMinimo: z.coerce.number().min(0).max(5),
  programasDirigidos: z.string().optional(),
  duracionMeses: z.coerce.number().int().min(1),
  cuposDisponibles: z.coerce.number().int().min(0),
  fechaInicio: z.string().min(1),
  fechaCierrePostulaciones: z.string().min(1),
  estado: z.enum(ESTADOS).optional(),
  modalidadVinculacionId: z.coerce.number().int().positive().nullable().optional(),
});

type Values = z.infer<typeof schema>;

function splitCsv(s?: string): string[] | undefined {
  if (!s) return undefined;
  const arr = s.split(",").map((x) => x.trim()).filter(Boolean);
  return arr.length > 0 ? arr : undefined;
}

export function VacanteFormPage(): JSX.Element {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const qc = useQueryClient();
  const usuario = useAuthStore((s) => s.usuario);

  const empresas = useQuery({
    queryKey: ["/empresas", "for-vacante"],
    queryFn: async () =>
      (await api.get<PageResponse<Empresa>>("/empresas", { params: { page: 0, size: 200 } })).data.content,
  });

  const modalidadesVinc = useQuery({
    queryKey: ["/modalidades/activas"],
    queryFn: async () => (await api.get<ModalidadCatalogo[]>("/modalidades/activas")).data,
  });

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      empresaId: usuario?.empresaId ?? 0,
      titulo: "",
      descripcion: "",
      areaPractica: "DESARROLLO_SW",
      modalidad: "HIBRIDO",
      ciudad: "",
      requisitosKeywords: "",
      creditosMinimos: 0,
      promedioMinimo: 0,
      programasDirigidos: "",
      duracionMeses: 6,
      cuposDisponibles: 1,
      fechaInicio: "",
      fechaCierrePostulaciones: "",
      estado: "BORRADOR",
      modalidadVinculacionId: null,
    },
  });

  const detail = useQuery({
    queryKey: ["/vacantes", id],
    enabled: isEdit,
    queryFn: async () => (await api.get<Vacante>(`/vacantes/${id}`)).data,
  });

  useEffect(() => {
    if (detail.data) {
      const v = detail.data;
      form.reset({
        empresaId: v.empresaId,
        titulo: v.titulo,
        descripcion: v.descripcion,
        areaPractica: v.areaPractica,
        modalidad: v.modalidad,
        ciudad: v.ciudad,
        requisitosKeywords: v.requisitosKeywords?.join(", ") ?? "",
        creditosMinimos: v.creditosMinimos,
        promedioMinimo: Number(v.promedioMinimo),
        programasDirigidos: v.programasDirigidos?.join(", ") ?? "",
        duracionMeses: v.duracionMeses,
        cuposDisponibles: v.cuposDisponibles,
        fechaInicio: v.fechaInicio,
        fechaCierrePostulaciones: v.fechaCierrePostulaciones,
        estado: v.estado,
        modalidadVinculacionId: v.modalidadVinculacionId ?? null,
      });
    }
  }, [detail.data, form]);

  const save = useMutation({
    mutationFn: async (values: Values) => {
      const payload = {
        ...values,
        requisitosKeywords: splitCsv(values.requisitosKeywords),
        programasDirigidos: splitCsv(values.programasDirigidos),
        modalidadVinculacionId: values.modalidadVinculacionId ?? null,
      };
      if (isEdit) return api.put<Vacante>(`/vacantes/${id}`, payload);
      return api.post<Vacante>("/vacantes", payload);
    },
    onSuccess: () => {
      toast.success(isEdit ? "Vacante actualizada" : "Vacante creada");
      qc.invalidateQueries({ queryKey: ["/vacantes"] });
      navigate("/vacantes");
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /></Button>
        <h1 className="text-2xl font-bold">{isEdit ? "Editar" : "Nueva"} vacante</h1>
      </div>
      <Card>
        <CardHeader><CardTitle>Datos de la vacante</CardTitle></CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((v) => save.mutate(v))} className="space-y-4">
              <FormField control={form.control} name="empresaId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Empresa</FormLabel>
                  <Select value={String(field.value || "")} onValueChange={(v) => field.onChange(Number(v))}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecciona una empresa" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {empresas.data?.map((e) => (
                        <SelectItem key={e.id} value={String(e.id)}>{e.razonSocial}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="modalidadVinculacionId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Modalidad de vinculación</FormLabel>
                  <FormControl>
                    <Combobox
                      items={modalidadesVinc.data ?? []}
                      value={field.value ?? null}
                      onChange={(v) => field.onChange(v)}
                      placeholder="Selecciona una modalidad (opcional)"
                      searchPlaceholder="Buscar modalidad..."
                      getKey={(m) => m.id}
                      getLabel={(m) => m.nombre}
                      getSecondary={(m) => m.codigo}
                      allowClear
                    />
                  </FormControl>
                  <FormDescription>
                    Determina qué documentos serán exigidos para postularse.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="titulo" render={({ field }) => (
                <FormItem><FormLabel>Título</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="descripcion" render={({ field }) => (
                <FormItem><FormLabel>Descripción</FormLabel><FormControl><Textarea rows={4} {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={form.control} name="areaPractica" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Área</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>{AREAS.map((a) => <SelectItem key={a} value={a}>{AREA_PRACTICA_LABELS[a]}</SelectItem>)}</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="modalidad" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modalidad</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>{MODALIDADES.map((m) => <SelectItem key={m} value={m}>{MODALIDAD_LABELS[m]}</SelectItem>)}</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="ciudad" render={({ field }) => (
                  <FormItem><FormLabel>Ciudad</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="requisitosKeywords" render={({ field }) => (
                <FormItem>
                  <FormLabel>Requisitos (keywords)</FormLabel>
                  <FormControl><Input placeholder="java, sql, react" {...field} /></FormControl>
                  <FormDescription>Separados por coma.</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="programasDirigidos" render={({ field }) => (
                <FormItem>
                  <FormLabel>Programas dirigidos</FormLabel>
                  <FormControl><Input placeholder="Ingeniería de Sistemas, Estadística" {...field} /></FormControl>
                  <FormDescription>Separados por coma. Deja vacío para todos.</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <FormField control={form.control} name="creditosMinimos" render={({ field }) => (
                  <FormItem><FormLabel>Créditos mín.</FormLabel><FormControl><Input type="number" min={0} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="promedioMinimo" render={({ field }) => (
                  <FormItem><FormLabel>Promedio mín.</FormLabel><FormControl><Input type="number" step="0.1" min={0} max={5} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="duracionMeses" render={({ field }) => (
                  <FormItem><FormLabel>Duración (meses)</FormLabel><FormControl><Input type="number" min={1} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="cuposDisponibles" render={({ field }) => (
                  <FormItem><FormLabel>Cupos</FormLabel><FormControl><Input type="number" min={0} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={form.control} name="fechaInicio" render={({ field }) => (
                  <FormItem><FormLabel>Fecha inicio</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="fechaCierrePostulaciones" render={({ field }) => (
                  <FormItem><FormLabel>Cierre postulaciones</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="estado" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>{ESTADOS.map((e) => <SelectItem key={e} value={e}>{ESTADO_VACANTE_LABELS[e]}</SelectItem>)}</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
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
