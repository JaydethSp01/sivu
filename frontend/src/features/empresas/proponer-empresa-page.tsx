import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Combobox } from "@/components/combobox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { api, extractApiMessage } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import type { Empresa, Estudiante, PageResponse } from "@/lib/types";

const schema = z.object({
  estudianteId: z.coerce.number().int().positive(),
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
  justificacion: z.string().max(2000).optional().or(z.literal("")),
});

type Values = z.infer<typeof schema>;

export function ProponerEmpresaPage(): JSX.Element {
  const navigate = useNavigate();
  const usuario = useAuthStore((s) => s.usuario);
  const hasRole = useAuthStore((s) => s.hasRole);
  const isStudent = hasRole("ESTUDIANTE") && !hasRole("ADMIN", "COORDINADOR");

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      estudianteId: isStudent ? usuario?.estudianteId ?? 0 : 0,
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
      justificacion: "",
    },
  });

  const estudiantes = useQuery({
    queryKey: ["/estudiantes", "for-proponer-empresa"],
    enabled: !isStudent,
    queryFn: async () =>
      (await api.get<PageResponse<Estudiante>>("/estudiantes", { params: { page: 0, size: 200 } }))
        .data.content,
  });

  const proponer = useMutation({
    mutationFn: async (values: Values) => {
      const payload = {
        ...values,
        nombreComercial: values.nombreComercial || undefined,
        direccion: values.direccion || undefined,
        telefonoContacto: values.telefonoContacto || undefined,
        contactoCargo: values.contactoCargo || undefined,
        justificacion: values.justificacion || undefined,
      };
      return api.post<Empresa>("/empresas/propuesta", payload);
    },
    onSuccess: () => {
      toast.success("Tu propuesta fue enviada a coordinación; recibirás respuesta pronto");
      navigate("/empresas");
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
          <h1 className="text-2xl font-bold">Proponer empresa</h1>
          <p className="text-sm text-muted-foreground">
            Sugiere una empresa para que coordinación la revise y, si la aprueba, quede habilitada.
          </p>
        </div>
      </div>

      <Alert>
        <AlertTitle>¿Cómo funciona?</AlertTitle>
        <AlertDescription>
          Tu propuesta queda en estado <strong>En revisión</strong>. Una vez aprobada por
          coordinación podrás postularte a sus vacantes.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader><CardTitle>Datos de la empresa propuesta</CardTitle></CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((v) => proponer.mutate(v))} className="space-y-4">
              {!isStudent && (
                <FormField control={form.control} name="estudianteId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estudiante que propone</FormLabel>
                    <FormControl>
                      <Combobox
                        items={estudiantes.data ?? []}
                        value={field.value || null}
                        onChange={(v) => field.onChange(v ?? 0)}
                        placeholder="Selecciona estudiante"
                        searchPlaceholder="Buscar estudiante..."
                        getKey={(e) => e.id}
                        getLabel={(e) => `${e.nombres} ${e.apellidos}`}
                        getSecondary={(e) => e.numeroDocumento}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              )}
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
                  <FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="contactoNombre" render={({ field }) => (
                  <FormItem><FormLabel>Persona de contacto</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="contactoCargo" render={({ field }) => (
                  <FormItem><FormLabel>Cargo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="justificacion" render={({ field }) => (
                <FormItem>
                  <FormLabel>Justificación (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={4}
                      placeholder="Cuéntale a coordinación por qué esta empresa es una buena aliada"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Máximo 2000 caracteres.</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancelar</Button>
                <Button type="submit" disabled={proponer.isPending}>
                  {proponer.isPending && <Loader2 className="h-4 w-4 animate-spin" />}Enviar propuesta
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
