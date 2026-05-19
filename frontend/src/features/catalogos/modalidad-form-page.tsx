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
import type { ModalidadCatalogo } from "@/lib/types";

const schema = z.object({
  codigo: z.string().min(1).max(40),
  nombre: z.string().min(1).max(120),
  descripcion: z.string().max(500).optional().or(z.literal("")),
  activo: z.enum(["true", "false"]),
});

type Values = z.infer<typeof schema>;

export function ModalidadFormPage(): JSX.Element {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const qc = useQueryClient();

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { codigo: "", nombre: "", descripcion: "", activo: "true" },
  });

  const detail = useQuery({
    queryKey: ["/modalidades", id],
    enabled: isEdit,
    queryFn: async () => (await api.get<ModalidadCatalogo>(`/modalidades/${id}`)).data,
  });

  useEffect(() => {
    if (detail.data) {
      const d = detail.data;
      form.reset({
        codigo: d.codigo,
        nombre: d.nombre,
        descripcion: d.descripcion ?? "",
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
        activo: values.activo === "true",
      };
      if (isEdit) return api.put<ModalidadCatalogo>(`/modalidades/${id}`, payload);
      return api.post<ModalidadCatalogo>("/modalidades", payload);
    },
    onSuccess: () => {
      toast.success(isEdit ? "Modalidad actualizada" : "Modalidad creada");
      qc.invalidateQueries({ queryKey: ["/modalidades"] });
      navigate("/catalogos/modalidades");
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Volver">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">{isEdit ? "Editar" : "Nueva"} modalidad</h1>
      </div>
      <Card>
        <CardHeader><CardTitle>Datos de la modalidad</CardTitle></CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((v) => save.mutate(v))} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="codigo" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código</FormLabel>
                    <FormControl><Input placeholder="PRACTICA_PROFESIONAL" {...field} /></FormControl>
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
              <FormField control={form.control} name="activo" render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="true">Activa</SelectItem>
                      <SelectItem value="false">Inactiva</SelectItem>
                    </SelectContent>
                  </Select>
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
