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
import { api, extractApiMessage } from "@/lib/api";
import { APLICA_A_LABELS } from "@/lib/enum-labels";
import type { AplicaA, TipoRequisito } from "@/lib/types";

const APLICAS = ["ESTUDIANTE", "EMPRESA", "AMBOS"] as const satisfies readonly AplicaA[];

const schema = z.object({
  codigo: z.string().min(1).max(40),
  nombre: z.string().min(1).max(120),
  descripcion: z.string().max(500).optional().or(z.literal("")),
  aplicaA: z.enum(APLICAS),
  activo: z.enum(["true", "false"]),
});

type Values = z.infer<typeof schema>;

export function TipoRequisitoFormPage(): JSX.Element {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const qc = useQueryClient();

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { codigo: "", nombre: "", descripcion: "", aplicaA: "ESTUDIANTE", activo: "true" },
  });

  const detail = useQuery({
    queryKey: ["/tipos-requisito", id],
    enabled: isEdit,
    queryFn: async () => (await api.get<TipoRequisito>(`/tipos-requisito/${id}`)).data,
  });

  useEffect(() => {
    if (detail.data) {
      const d = detail.data;
      form.reset({
        codigo: d.codigo,
        nombre: d.nombre,
        descripcion: d.descripcion ?? "",
        aplicaA: d.aplicaA,
        activo: d.activo ? "true" : "false",
      });
    }
  }, [detail.data, form]);

  const save = useMutation({
    mutationFn: async (values: Values) => {
      const payload = {
        codigo: values.codigo,
        nombre: values.nombre,
        descripcion: values.descripcion || undefined,
        aplicaA: values.aplicaA,
        activo: values.activo === "true",
      };
      if (isEdit) return api.put<TipoRequisito>(`/tipos-requisito/${id}`, payload);
      return api.post<TipoRequisito>("/tipos-requisito", payload);
    },
    onSuccess: () => {
      toast.success(isEdit ? "Tipo actualizado" : "Tipo creado");
      qc.invalidateQueries({ queryKey: ["/tipos-requisito"] });
      navigate("/catalogos/tipos-requisito");
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Volver">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">{isEdit ? "Editar" : "Nuevo"} tipo de requisito</h1>
      </div>
      <Card>
        <CardHeader><CardTitle>Datos del tipo de requisito</CardTitle></CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((v) => save.mutate(v))} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="codigo" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código</FormLabel>
                    <FormControl><Input placeholder="HOJA_VIDA" {...field} /></FormControl>
                    <FormDescription>Identificador único en mayúsculas.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="nombre" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="descripcion" render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl><Textarea rows={3} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="aplicaA" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Aplica a</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {APLICAS.map((a) => (
                          <SelectItem key={a} value={a}>{APLICA_A_LABELS[a]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="activo" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="true">Activo</SelectItem>
                        <SelectItem value="false">Inactivo</SelectItem>
                      </SelectContent>
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
