import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, ArrowLeft, Loader2 } from "lucide-react";
import { z } from "zod";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, extractApiMessage } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import type { Estudiante, PageResponse, Postulacion, Vacante } from "@/lib/types";

const schema = z.object({
  estudianteId: z.coerce.number().int().positive(),
  vacanteId: z.coerce.number().int().positive(),
  mensajeEstudiante: z.string().max(2000).optional().or(z.literal("")),
});

type Values = z.infer<typeof schema>;

export function NuevaPostulacionPage(): JSX.Element {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [sp] = useSearchParams();
  const usuario = useAuthStore((s) => s.usuario);
  const hasRole = useAuthStore((s) => s.hasRole);
  const isStudent = hasRole("ESTUDIANTE") && !hasRole("ADMIN", "COORDINADOR");

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      estudianteId: isStudent ? usuario?.estudianteId ?? 0 : 0,
      vacanteId: Number(sp.get("vacanteId")) || 0,
      mensajeEstudiante: "",
    },
  });

  const vacantes = useQuery({
    queryKey: ["/vacantes", "PUBLICADA", "for-new-post"],
    queryFn: async () => (await api.get<PageResponse<Vacante>>("/vacantes", { params: { estado: "PUBLICADA", page: 0, size: 200 } })).data.content,
  });

  const estudiantes = useQuery({
    queryKey: ["/estudiantes", "for-new-post"],
    enabled: !isStudent,
    queryFn: async () => (await api.get<PageResponse<Estudiante>>("/estudiantes", { params: { page: 0, size: 200 } })).data.content,
  });

  const estudianteIdActual = form.watch("estudianteId");
  const vacanteIdActual = form.watch("vacanteId");

  const duplicada = useQuery({
    queryKey: ["/postulaciones", "dup-check", estudianteIdActual, vacanteIdActual],
    enabled: !!estudianteIdActual && !!vacanteIdActual,
    queryFn: async () =>
      (
        await api.get<PageResponse<Postulacion>>("/postulaciones", {
          params: {
            estudianteId: estudianteIdActual,
            vacanteId: vacanteIdActual,
            size: 1,
          },
        })
      ).data,
  });

  const yaPostulada = (duplicada.data?.totalElements ?? 0) > 0;
  const postulacionExistente = duplicada.data?.content?.[0];

  const save = useMutation({
    mutationFn: async (values: Values) => {
      const payload = { ...values, mensajeEstudiante: values.mensajeEstudiante || undefined };
      return api.post<Postulacion>("/postulaciones", payload);
    },
    onSuccess: (res) => {
      toast.success("Postulación creada");
      qc.invalidateQueries({ queryKey: ["/postulaciones"] });
      navigate(`/postulaciones/${res.data.id}`);
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /></Button>
        <h1 className="text-2xl font-bold">Nueva postulación</h1>
      </div>
      <Card>
        <CardHeader><CardTitle>Selecciona estudiante y vacante</CardTitle></CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((v) => save.mutate(v))} className="space-y-4">
              {!isStudent && (
                <FormField control={form.control} name="estudianteId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estudiante</FormLabel>
                    <Select value={String(field.value || "")} onValueChange={(v) => field.onChange(Number(v))}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecciona estudiante" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {estudiantes.data?.map((e) => (
                          <SelectItem key={e.id} value={String(e.id)}>{e.nombres} {e.apellidos} · {e.numeroDocumento}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              )}
              <FormField control={form.control} name="vacanteId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Vacante</FormLabel>
                  <Select value={String(field.value || "")} onValueChange={(v) => field.onChange(Number(v))}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecciona vacante" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {vacantes.data?.map((v) => (
                        <SelectItem key={v.id} value={String(v.id)}>{v.titulo} · {v.empresa?.razonSocial}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="mensajeEstudiante" render={({ field }) => (
                <FormItem>
                  <FormLabel>Mensaje (opcional)</FormLabel>
                  <FormControl><Textarea rows={4} placeholder="Cuéntale a la empresa por qué eres el candidato ideal" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              {yaPostulada && (
                <Alert variant="warning">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Ya estás postulado a esta vacante</AlertTitle>
                  <AlertDescription>
                    Estado actual: <strong>{postulacionExistente?.estado.replaceAll("_", " ")}</strong>.
                    No puedes postular dos veces a la misma vacante.
                  </AlertDescription>
                </Alert>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancelar</Button>
                <Button type="submit" disabled={save.isPending || yaPostulada || duplicada.isFetching}>
                  {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}Postularme
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
