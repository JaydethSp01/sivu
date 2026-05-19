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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/combobox";
import { api, extractApiMessage } from "@/lib/api";
import { ESTADO_TUTOR_LABELS, TIPO_TUTOR_LABELS } from "@/lib/enum-labels";
import type { Empresa, EstadoTutor, PageResponse, TipoTutor, Tutor } from "@/lib/types";

const schema = z
  .object({
    tipo: z.enum(["ACADEMICO", "EMPRESARIAL"]),
    nombres: z.string().min(1).max(120),
    apellidos: z.string().min(1).max(120),
    email: z.string().email().max(180),
    telefono: z.string().max(30).optional().or(z.literal("")),
    cargo: z.string().max(120).optional().or(z.literal("")),
    dependencia: z.string().max(160).optional().or(z.literal("")),
    empresaId: z.coerce.number().int().positive().optional().nullable(),
    estado: z.enum(["ACTIVO", "INACTIVO"]).optional(),
  })
  .refine((v) => v.tipo !== "EMPRESARIAL" || (v.empresaId !== undefined && v.empresaId !== null), {
    message: "Selecciona la empresa para tutores empresariales",
    path: ["empresaId"],
  });

type Values = z.infer<typeof schema>;

export function TutorFormPage(): JSX.Element {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const qc = useQueryClient();

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      tipo: "ACADEMICO",
      nombres: "",
      apellidos: "",
      email: "",
      telefono: "",
      cargo: "",
      dependencia: "",
      empresaId: null,
      estado: "ACTIVO",
    },
  });

  const tipo = form.watch("tipo");
  const isEmpresarial = tipo === "EMPRESARIAL";

  const empresas = useQuery({
    queryKey: ["/empresas", "for-tutor-form"],
    queryFn: async () =>
      (await api.get<PageResponse<Empresa>>("/empresas", { params: { page: 0, size: 200 } })).data.content,
  });

  const detail = useQuery({
    queryKey: ["/tutores", id],
    enabled: isEdit,
    queryFn: async () => (await api.get<Tutor>(`/tutores/${id}`)).data,
  });

  useEffect(() => {
    if (detail.data) {
      const d = detail.data;
      form.reset({
        tipo: d.tipo,
        nombres: d.nombres,
        apellidos: d.apellidos,
        email: d.email,
        telefono: d.telefono ?? "",
        cargo: d.cargo ?? "",
        dependencia: d.dependencia ?? "",
        empresaId: d.empresaId,
        estado: d.estado,
      });
    }
  }, [detail.data, form]);

  useEffect(() => {
    if (!isEmpresarial) {
      form.setValue("empresaId", null);
    }
  }, [isEmpresarial, form]);

  const save = useMutation({
    mutationFn: async (values: Values) => {
      const payload = {
        tipo: values.tipo,
        nombres: values.nombres,
        apellidos: values.apellidos,
        email: values.email,
        telefono: values.telefono || undefined,
        cargo: values.cargo || undefined,
        dependencia: values.dependencia || undefined,
        empresaId: values.tipo === "EMPRESARIAL" ? values.empresaId ?? undefined : undefined,
        estado: values.estado,
      };
      if (isEdit) return api.put<Tutor>(`/tutores/${id}`, payload);
      return api.post<Tutor>("/tutores", payload);
    },
    onSuccess: () => {
      toast.success(isEdit ? "Tutor actualizado" : "Tutor creado");
      qc.invalidateQueries({ queryKey: ["/tutores"] });
      navigate("/tutores");
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
          <h1 className="text-2xl font-bold">{isEdit ? "Editar" : "Nuevo"} tutor</h1>
          <p className="text-sm text-muted-foreground">
            Tutores académicos (universidad) o empresariales (empresa) que acompañan al practicante.
          </p>
        </div>
      </div>
      <Card>
        <CardHeader><CardTitle>Datos del tutor</CardTitle></CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((v) => save.mutate(v))} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="tipo" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {(Object.keys(TIPO_TUTOR_LABELS) as TipoTutor[]).map((t) => (
                          <SelectItem key={t} value={t}>{TIPO_TUTOR_LABELS[t]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="estado" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {(Object.keys(ESTADO_TUTOR_LABELS) as EstadoTutor[]).map((e) => (
                          <SelectItem key={e} value={e}>{ESTADO_TUTOR_LABELS[e]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="nombres" render={({ field }) => (
                  <FormItem><FormLabel>Nombres</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="apellidos" render={({ field }) => (
                  <FormItem><FormLabel>Apellidos</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>Correo</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="telefono" render={({ field }) => (
                  <FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="cargo" render={({ field }) => (
                  <FormItem><FormLabel>Cargo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="dependencia" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dependencia</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormDescription>Facultad o área en la universidad (para tutores académicos).</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="empresaId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Empresa {isEmpresarial && <span className="text-destructive">*</span>}</FormLabel>
                  <FormControl>
                    <Combobox
                      items={empresas.data ?? []}
                      value={field.value ?? null}
                      onChange={(v) => field.onChange(v)}
                      placeholder={isEmpresarial ? "Selecciona la empresa" : "No aplica"}
                      searchPlaceholder="Buscar empresa..."
                      getKey={(e) => e.id}
                      getLabel={(e) => e.razonSocial}
                      getSecondary={(e) => `${e.nit} · ${e.ciudad}`}
                      disabled={!isEmpresarial}
                      allowClear={!isEmpresarial}
                    />
                  </FormControl>
                  <FormDescription>
                    Obligatoria si el tipo es <strong>Empresarial</strong>.
                  </FormDescription>
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
