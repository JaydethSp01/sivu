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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, extractApiMessage } from "@/lib/api";
import { ESTADO_EMPRESA_LABELS } from "@/lib/enum-labels";
import type { Empresa, EstadoEmpresa } from "@/lib/types";

const schema = z.object({
  nit: z.string().min(1).max(20),
  razonSocial: z.string().min(1).max(180),
  nombreComercial: z.string().max(180).optional().or(z.literal("")),
  sector: z.string().min(1).max(80),
  ciudad: z.string().min(1).max(80),
  direccion: z.string().max(200).optional().or(z.literal("")),
  emailContacto: z.string().email().max(180),
  telefonoContacto: z.string().max(30).optional().or(z.literal("")),
  contactoNombre: z.string().min(1).max(160),
  contactoCargo: z.string().max(120).optional().or(z.literal("")),
  estado: z.enum(["EN_REVISION", "ACTIVA", "INACTIVA"]).optional(),
});

type Values = z.infer<typeof schema>;

export function EmpresaFormPage(): JSX.Element {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const qc = useQueryClient();

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      nit: "",
      razonSocial: "",
      nombreComercial: "",
      sector: "",
      ciudad: "",
      direccion: "",
      emailContacto: "",
      telefonoContacto: "",
      contactoNombre: "",
      contactoCargo: "",
      estado: "EN_REVISION",
    },
  });

  const detail = useQuery({
    queryKey: ["/empresas", id],
    enabled: isEdit,
    queryFn: async () => (await api.get<Empresa>(`/empresas/${id}`)).data,
  });

  useEffect(() => {
    if (detail.data) {
      const d = detail.data;
      form.reset({
        nit: d.nit,
        razonSocial: d.razonSocial,
        nombreComercial: d.nombreComercial ?? "",
        sector: d.sector,
        ciudad: d.ciudad,
        direccion: d.direccion ?? "",
        emailContacto: d.emailContacto,
        telefonoContacto: d.telefonoContacto ?? "",
        contactoNombre: d.contactoNombre,
        contactoCargo: d.contactoCargo ?? "",
        estado: d.estado,
      });
    }
  }, [detail.data, form]);

  const save = useMutation({
    mutationFn: async (values: Values) => {
      const payload = {
        ...values,
        nombreComercial: values.nombreComercial || undefined,
        direccion: values.direccion || undefined,
        telefonoContacto: values.telefonoContacto || undefined,
        contactoCargo: values.contactoCargo || undefined,
      };
      if (isEdit) return api.put<Empresa>(`/empresas/${id}`, payload);
      return api.post<Empresa>("/empresas", payload);
    },
    onSuccess: () => {
      toast.success(isEdit ? "Empresa actualizada" : "Empresa creada");
      qc.invalidateQueries({ queryKey: ["/empresas"] });
      navigate("/empresas");
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{isEdit ? "Editar" : "Nueva"} empresa</h1>
        </div>
      </div>
      <Card>
        <CardHeader><CardTitle>Datos de la empresa</CardTitle></CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((v) => save.mutate(v))} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={form.control} name="nit" render={({ field }) => (
                  <FormItem><FormLabel>NIT</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="razonSocial" render={({ field }) => (
                  <FormItem className="md:col-span-2"><FormLabel>Razón social</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="nombreComercial" render={({ field }) => (
                <FormItem><FormLabel>Nombre comercial</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="sector" render={({ field }) => (
                  <FormItem><FormLabel>Sector</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="ciudad" render={({ field }) => (
                  <FormItem><FormLabel>Ciudad</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="direccion" render={({ field }) => (
                <FormItem><FormLabel>Dirección</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="emailContacto" render={({ field }) => (
                  <FormItem><FormLabel>Email de contacto</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="telefonoContacto" render={({ field }) => (
                  <FormItem><FormLabel>Teléfono de contacto</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="contactoNombre" render={({ field }) => (
                  <FormItem><FormLabel>Persona de contacto</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="contactoCargo" render={({ field }) => (
                  <FormItem><FormLabel>Cargo del contacto</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="estado" render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {(["EN_REVISION", "ACTIVA", "INACTIVA"] satisfies EstadoEmpresa[]).map((e) => (
                        <SelectItem key={e} value={e}>{ESTADO_EMPRESA_LABELS[e]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancelar</Button>
                <Button type="submit" disabled={save.isPending}>
                  {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Guardar
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
