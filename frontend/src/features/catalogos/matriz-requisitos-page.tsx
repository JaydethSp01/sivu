import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Combobox } from "@/components/combobox";
import { EmptyState } from "@/components/empty-state";
import { api, extractApiMessage } from "@/lib/api";
import { APLICA_A_LABELS } from "@/lib/enum-labels";
import { useAuthStore } from "@/lib/auth-store";
import type {
  ModalidadCatalogo,
  RequisitoModalidad,
  TipoRequisito,
} from "@/lib/types";

const addSchema = z.object({
  tipoRequisitoId: z.coerce.number().int().positive(),
  obligatorio: z.enum(["true", "false"]),
  orden: z.coerce.number().int().min(0),
  instrucciones: z.string().max(1000).optional().or(z.literal("")),
});

type AddValues = z.infer<typeof addSchema>;

export function MatrizRequisitosPage(): JSX.Element {
  const qc = useQueryClient();
  const hasRole = useAuthStore((s) => s.hasRole);
  const canEdit = hasRole("ADMIN", "COORDINADOR");

  const [modalidadId, setModalidadId] = useState<number | null>(null);
  const [openAdd, setOpenAdd] = useState(false);

  const modalidades = useQuery({
    queryKey: ["/modalidades/activas"],
    queryFn: async () => (await api.get<ModalidadCatalogo[]>("/modalidades/activas")).data,
  });

  const tipos = useQuery({
    queryKey: ["/tipos-requisito/activos", "all"],
    queryFn: async () =>
      (await api.get<TipoRequisito[]>("/tipos-requisito/activos")).data,
  });

  const requisitos = useQuery({
    queryKey: ["/requisitos-modalidad/por-modalidad", modalidadId],
    enabled: modalidadId != null,
    queryFn: async () =>
      (await api.get<RequisitoModalidad[]>(`/requisitos-modalidad/por-modalidad/${modalidadId}`)).data,
  });

  const form = useForm<AddValues>({
    resolver: zodResolver(addSchema),
    defaultValues: { tipoRequisitoId: 0, obligatorio: "true", orden: 0, instrucciones: "" },
  });

  const create = useMutation({
    mutationFn: async (values: AddValues) => {
      const payload = {
        modalidadId: modalidadId,
        tipoRequisitoId: values.tipoRequisitoId,
        obligatorio: values.obligatorio === "true",
        orden: values.orden,
        instrucciones: values.instrucciones || undefined,
      };
      return api.post<RequisitoModalidad>("/requisitos-modalidad", payload);
    },
    onSuccess: () => {
      toast.success("Requisito agregado");
      qc.invalidateQueries({ queryKey: ["/requisitos-modalidad/por-modalidad", modalidadId] });
      setOpenAdd(false);
      form.reset({ tipoRequisitoId: 0, obligatorio: "true", orden: 0, instrucciones: "" });
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  const toggleObligatorio = useMutation({
    mutationFn: async (r: RequisitoModalidad) =>
      api.put(`/requisitos-modalidad/${r.id}`, {
        obligatorio: !r.obligatorio,
        orden: r.orden,
        instrucciones: r.instrucciones ?? undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/requisitos-modalidad/por-modalidad", modalidadId] });
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  const del = useMutation({
    mutationFn: async (id: number) => api.delete(`/requisitos-modalidad/${id}`),
    onSuccess: () => {
      toast.success("Requisito eliminado");
      qc.invalidateQueries({ queryKey: ["/requisitos-modalidad/por-modalidad", modalidadId] });
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  const idsExistentes = new Set((requisitos.data ?? []).map((r) => r.tipoRequisitoId));
  const tiposDisponibles = (tipos.data ?? []).filter((t) => !idsExistentes.has(t.id));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Matriz de requisitos</h1>
        <p className="text-sm text-muted-foreground">
          Define qué documentos son exigibles por cada modalidad de vinculación.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Modalidad</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-md">
            <Combobox
              items={modalidades.data ?? []}
              value={modalidadId}
              onChange={(v) => setModalidadId(v)}
              placeholder="Selecciona una modalidad"
              searchPlaceholder="Buscar modalidad..."
              getKey={(m) => m.id}
              getLabel={(m) => m.nombre}
              getSecondary={(m) => m.codigo}
            />
          </div>

          {modalidadId == null ? (
            <EmptyState
              title="Selecciona una modalidad"
              description="Elige una modalidad para ver y configurar sus requisitos documentales."
            />
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-muted-foreground">
                  Requisitos configurados
                </h2>
                {canEdit && (
                  <Button onClick={() => setOpenAdd(true)} size="sm">
                    <Plus className="h-4 w-4" /> Añadir requisito
                  </Button>
                )}
              </div>

              {requisitos.isLoading ? (
                <div className="flex items-center text-muted-foreground p-6">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />Cargando...
                </div>
              ) : (requisitos.data ?? []).length === 0 ? (
                <EmptyState
                  title="Sin requisitos"
                  description="Esta modalidad aún no tiene requisitos. Agrega el primero."
                />
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]">Orden</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Aplica a</TableHead>
                        <TableHead>Obligatorio</TableHead>
                        <TableHead>Instrucciones</TableHead>
                        <TableHead className="w-[80px] text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {requisitos.data?.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-mono text-xs">{r.orden}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{r.tipoRequisitoNombre}</span>
                              <span className="text-xs text-muted-foreground">{r.tipoRequisitoCodigo}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{APLICA_A_LABELS[r.aplicaA]}</Badge>
                          </TableCell>
                          <TableCell>
                            {canEdit ? (
                              <Button
                                variant={r.obligatorio ? "default" : "outline"}
                                size="sm"
                                onClick={() => toggleObligatorio.mutate(r)}
                                disabled={toggleObligatorio.isPending}
                              >
                                {r.obligatorio ? "Obligatorio" : "Opcional"}
                              </Button>
                            ) : r.obligatorio ? (
                              <Badge variant="default">Obligatorio</Badge>
                            ) : (
                              <Badge variant="muted">Opcional</Badge>
                            )}
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <span className="text-xs text-muted-foreground line-clamp-2">
                              {r.instrucciones ?? "—"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            {canEdit && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" aria-label="Eliminar">
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>¿Eliminar requisito?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Se quitará "{r.tipoRequisitoNombre}" de la modalidad.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => del.mutate(r.id)}>
                                      Eliminar
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={openAdd} onOpenChange={setOpenAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Añadir requisito</DialogTitle>
            <DialogDescription>
              Selecciona un tipo de requisito del catálogo y configúralo para esta modalidad.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((v) => create.mutate(v))} className="space-y-4">
              <FormField control={form.control} name="tipoRequisitoId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de requisito</FormLabel>
                  <FormControl>
                    <Combobox
                      items={tiposDisponibles}
                      value={field.value || null}
                      onChange={(v) => field.onChange(v ?? 0)}
                      placeholder="Selecciona tipo"
                      searchPlaceholder="Buscar tipo..."
                      getKey={(t) => t.id}
                      getLabel={(t) => t.nombre}
                      getSecondary={(t) => `${t.codigo} · ${APLICA_A_LABELS[t.aplicaA]}`}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="obligatorio" render={({ field }) => (
                  <FormItem>
                    <FormLabel>¿Obligatorio?</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2 pt-2">
                        <input
                          type="checkbox"
                          id="obligatorio"
                          checked={field.value === "true"}
                          onChange={(e) => field.onChange(e.target.checked ? "true" : "false")}
                          className="h-4 w-4"
                        />
                        <label htmlFor="obligatorio" className="text-sm">
                          Es obligatorio para postular
                        </label>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="orden" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Orden</FormLabel>
                    <FormControl><Input type="number" min={0} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="instrucciones" render={({ field }) => (
                <FormItem>
                  <FormLabel>Instrucciones (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Indicaciones para el estudiante o empresa"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpenAdd(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={create.isPending || !form.watch("tipoRequisitoId")}>
                  {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />}Añadir
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
