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
import type { Estudiante } from "@/lib/types";

const schema = z.object({
  tipoDocumento: z.enum(["CC", "TI", "CE", "PA"]),
  numeroDocumento: z.string().min(1).max(30),
  nombres: z.string().min(1).max(120),
  apellidos: z.string().min(1).max(120),
  email: z.string().email().max(180),
  telefono: z.string().max(30).optional().or(z.literal("")),
  programaAcademico: z.string().min(1).max(120),
  semestre: z.coerce.number().int().min(1).max(20),
  creditosAprobados: z.coerce.number().int().min(0),
  promedioAcumulado: z.coerce.number().min(0).max(5),
  estado: z.enum(["ACTIVO", "GRADUADO", "RETIRADO"]).optional(),
});

type Values = z.infer<typeof schema>;

export function EstudianteFormPage(): JSX.Element {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const qc = useQueryClient();

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      tipoDocumento: "CC",
      numeroDocumento: "",
      nombres: "",
      apellidos: "",
      email: "",
      telefono: "",
      programaAcademico: "",
      semestre: 1,
      creditosAprobados: 0,
      promedioAcumulado: 0,
      estado: "ACTIVO",
    },
  });

  const detail = useQuery({
    queryKey: ["/estudiantes", id],
    enabled: isEdit,
    queryFn: async () => {
      const { data } = await api.get<Estudiante>(`/estudiantes/${id}`);
      return data;
    },
  });

  useEffect(() => {
    if (detail.data) {
      form.reset({
        tipoDocumento: detail.data.tipoDocumento,
        numeroDocumento: detail.data.numeroDocumento,
        nombres: detail.data.nombres,
        apellidos: detail.data.apellidos,
        email: detail.data.email,
        telefono: detail.data.telefono ?? "",
        programaAcademico: detail.data.programaAcademico,
        semestre: detail.data.semestre,
        creditosAprobados: detail.data.creditosAprobados,
        promedioAcumulado: Number(detail.data.promedioAcumulado),
        estado: detail.data.estado,
      });
    }
  }, [detail.data, form]);

  const save = useMutation({
    mutationFn: async (values: Values) => {
      const payload = { ...values, telefono: values.telefono || undefined };
      if (isEdit) return api.put<Estudiante>(`/estudiantes/${id}`, payload);
      return api.post<Estudiante>("/estudiantes", payload);
    },
    onSuccess: () => {
      toast.success(isEdit ? "Estudiante actualizado" : "Estudiante creado");
      qc.invalidateQueries({ queryKey: ["/estudiantes"] });
      navigate("/estudiantes");
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
          <h1 className="text-2xl font-bold">{isEdit ? "Editar" : "Nuevo"} estudiante</h1>
          <p className="text-sm text-muted-foreground">Datos académicos y de contacto.</p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Datos del estudiante</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((v) => save.mutate(v))} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="tipoDocumento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo doc.</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {["CC", "TI", "CE", "PA"].map((t) => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="numeroDocumento"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Número de documento</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nombres"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombres</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="apellidos"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apellidos</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo</FormLabel>
                      <FormControl><Input type="email" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="telefono"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="programaAcademico"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Programa académico</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="semestre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Semestre</FormLabel>
                      <FormControl><Input type="number" min={1} max={20} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="creditosAprobados"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Créditos aprobados</FormLabel>
                      <FormControl><Input type="number" min={0} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="promedioAcumulado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Promedio (0–5)</FormLabel>
                      <FormControl><Input type="number" step="0.01" min={0} max={5} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="estado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {["ACTIVO", "GRADUADO", "RETIRADO"].map((e) => (
                          <SelectItem key={e} value={e}>{e}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                  Cancelar
                </Button>
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
