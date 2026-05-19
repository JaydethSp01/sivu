import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Pencil } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/combobox";
import { api, extractApiMessage } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { formatBytes } from "@/lib/utils";
import { TIPO_DOCUMENTO_LABELS } from "@/lib/enum-labels";
import type {
  Documento,
  Estudiante,
  PageResponse,
  Postulacion,
  TipoDocumentoSoporte,
  TipoRequisito,
} from "@/lib/types";

const TIPOS = [
  "HOJA_VIDA",
  "DOCUMENTO_IDENTIDAD",
  "CERTIFICADO_ACADEMICO",
  "EPS",
  "FORMALIZACION",
  "CERTIFICADO",
  "OTRO",
] as const satisfies readonly TipoDocumentoSoporte[];

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPTED_MIME = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const ACCEPT_ATTR = ".pdf,.jpg,.jpeg,.png,.docx";

const uploadSchema = z.object({
  tipoRequisitoId: z.coerce.number().int().positive().nullable().optional(),
  tipo: z.enum(TIPOS),
  estudianteId: z.coerce.number().int().positive().optional().nullable(),
  postulacionId: z.coerce.number().int().positive().optional().nullable(),
});

type UploadValues = z.infer<typeof uploadSchema>;

const editSchema = z.object({
  estudianteId: z.coerce.number().int().positive().optional().nullable(),
  postulacionId: z.coerce.number().int().positive().optional().nullable(),
  tipo: z.enum(TIPOS),
  nombreOriginal: z.string().min(1).max(255),
  rutaAlmacenamiento: z.string().min(1).max(500),
  mimeType: z.string().min(1).max(120),
  tamanoBytes: z.coerce.number().int().min(0),
});

type EditValues = z.infer<typeof editSchema>;

function NuevoDocumentoForm(): JSX.Element {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [sp] = useSearchParams();
  const usuario = useAuthStore((s) => s.usuario);
  const hasRole = useAuthStore((s) => s.hasRole);
  const isStudent = hasRole("ESTUDIANTE") && !hasRole("ADMIN", "COORDINADOR");
  const tipoRequisitoIdParam = Number(sp.get("tipoRequisitoId")) || null;

  const [archivo, setArchivo] = useState<File | null>(null);
  const [archivoError, setArchivoError] = useState<string | null>(null);

  const aplicaA = isStudent ? "ESTUDIANTE" : undefined;
  const tiposReq = useQuery({
    queryKey: ["/tipos-requisito/activos", aplicaA ?? "all-flow"],
    queryFn: async () =>
      (await api.get<TipoRequisito[]>("/tipos-requisito/activos", {
        params: aplicaA ? { aplicaA } : undefined,
      })).data,
  });

  const form = useForm<UploadValues>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      tipoRequisitoId: tipoRequisitoIdParam,
      tipo: "HOJA_VIDA",
      estudianteId: isStudent ? usuario?.estudianteId ?? null : null,
      postulacionId: null,
    },
  });

  useEffect(() => {
    if (tipoRequisitoIdParam && tiposReq.data) {
      const tr = tiposReq.data.find((t) => t.id === tipoRequisitoIdParam);
      if (tr) {
        const candidato = TIPOS.find((t) => t === tr.codigo);
        form.setValue("tipo", candidato ?? "OTRO");
      }
    }
  }, [tipoRequisitoIdParam, tiposReq.data, form]);

  const estudiantes = useQuery({
    queryKey: ["/estudiantes", "for-doc-upload"],
    enabled: !isStudent,
    queryFn: async () =>
      (await api.get<PageResponse<Estudiante>>("/estudiantes", { params: { page: 0, size: 200 } }))
        .data.content,
  });

  const estudianteIdActual = form.watch("estudianteId");
  const postulaciones = useQuery({
    queryKey: ["/postulaciones", "for-doc-upload", estudianteIdActual],
    enabled: !!estudianteIdActual,
    queryFn: async () =>
      (
        await api.get<PageResponse<Postulacion>>("/postulaciones", {
          params: { estudianteId: estudianteIdActual, page: 0, size: 200 },
        })
      ).data.content,
  });

  const validarArchivo = (file: File | null): string | null => {
    if (!file) return "Selecciona un archivo";
    if (file.size > MAX_BYTES) return `El archivo supera 10MB (${formatBytes(file.size)})`;
    if (!ACCEPTED_MIME.includes(file.type)) {
      return "Tipo no permitido. Solo PDF, JPG, PNG o DOCX.";
    }
    return null;
  };

  const onArchivoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setArchivo(file);
    setArchivoError(validarArchivo(file));
  };

  const subir = useMutation({
    mutationFn: async (values: UploadValues) => {
      if (!archivo) throw new Error("Falta el archivo");
      const formData = new FormData();
      formData.append("archivo", archivo);
      const params: Record<string, string | number> = { tipo: values.tipo };
      if (values.tipoRequisitoId) params.tipoRequisitoId = values.tipoRequisitoId;
      if (values.estudianteId) params.estudianteId = values.estudianteId;
      if (values.postulacionId) params.postulacionId = values.postulacionId;
      return api.post<Documento>("/documentos/upload", formData, { params });
    },
    onSuccess: () => {
      toast.success("Documento subido");
      qc.invalidateQueries({ queryKey: ["/documentos"] });
      qc.invalidateQueries({ queryKey: ["/checklist/vacante"] });
      navigate("/documentos");
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  const onSubmit = (values: UploadValues) => {
    const err = validarArchivo(archivo);
    if (err) {
      setArchivoError(err);
      return;
    }
    subir.mutate(values);
  };

  return (
    <Card>
      <CardHeader><CardTitle>Subir documento</CardTitle></CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormItem>
              <FormLabel>Archivo</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  accept={ACCEPT_ATTR}
                  onChange={onArchivoChange}
                  aria-invalid={!!archivoError}
                />
              </FormControl>
              <FormDescription>
                PDF, JPG, PNG o DOCX. Máximo 10MB.
                {archivo && !archivoError && (
                  <> · Seleccionado: {archivo.name} ({formatBytes(archivo.size)})</>
                )}
              </FormDescription>
              {archivoError && (
                <p className="text-sm font-medium text-destructive">{archivoError}</p>
              )}
            </FormItem>

            <FormField
              control={form.control}
              name="tipoRequisitoId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de requisito (catálogo)</FormLabel>
                  <FormControl>
                    <Combobox
                      items={tiposReq.data ?? []}
                      value={field.value ?? null}
                      onChange={(v) => field.onChange(v)}
                      placeholder="Selecciona tipo de requisito"
                      searchPlaceholder="Buscar tipo..."
                      getKey={(t) => t.id}
                      getLabel={(t) => t.nombre}
                      getSecondary={(t) => t.codigo}
                      allowClear
                    />
                  </FormControl>
                  <FormDescription>
                    Recomendado: asocia el documento al tipo de requisito de la modalidad.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tipo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo (clasificación legado)</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {TIPOS.map((t) => (
                        <SelectItem key={t} value={t}>{TIPO_DOCUMENTO_LABELS[t]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="estudianteId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estudiante (opcional)</FormLabel>
                  <FormControl>
                    <Combobox
                      items={estudiantes.data ?? []}
                      value={field.value ?? null}
                      onChange={(v) => {
                        field.onChange(v);
                        form.setValue("postulacionId", null);
                      }}
                      placeholder="Selecciona estudiante"
                      searchPlaceholder="Buscar estudiante..."
                      getKey={(e) => e.id}
                      getLabel={(e) => `${e.nombres} ${e.apellidos}`}
                      getSecondary={(e) => e.numeroDocumento}
                      disabled={isStudent}
                      allowClear={!isStudent}
                    />
                  </FormControl>
                  {isStudent && (
                    <FormDescription>
                      Se asocia automáticamente a tu cuenta.
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="postulacionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Postulación (opcional)</FormLabel>
                  <FormControl>
                    <Combobox
                      items={postulaciones.data ?? []}
                      value={field.value ?? null}
                      onChange={(v) => field.onChange(v)}
                      placeholder={
                        estudianteIdActual
                          ? "Selecciona postulación"
                          : "Primero selecciona un estudiante"
                      }
                      searchPlaceholder="Buscar postulación..."
                      getKey={(p) => p.id}
                      getLabel={(p) => `#${p.id} · ${p.vacanteTitulo}`}
                      getSecondary={(p) => p.empresaRazonSocial}
                      disabled={!estudianteIdActual}
                      allowClear
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancelar</Button>
              <Button type="submit" disabled={subir.isPending || !archivo || !!archivoError}>
                {subir.isPending && <Loader2 className="h-4 w-4 animate-spin" />}Subir documento
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function EditarDocumentoForm({ id }: { id: string }): JSX.Element {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const usuario = useAuthStore((s) => s.usuario);
  const hasRole = useAuthStore((s) => s.hasRole);
  const isStudent = hasRole("ESTUDIANTE") && !hasRole("ADMIN", "COORDINADOR");

  const form = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      estudianteId: isStudent ? usuario?.estudianteId ?? null : null,
      postulacionId: null,
      tipo: "HOJA_VIDA",
      nombreOriginal: "",
      rutaAlmacenamiento: "",
      mimeType: "application/pdf",
      tamanoBytes: 0,
    },
  });

  const estudiantes = useQuery({
    queryKey: ["/estudiantes", "for-doc-edit"],
    enabled: !isStudent,
    queryFn: async () =>
      (await api.get<PageResponse<Estudiante>>("/estudiantes", { params: { page: 0, size: 200 } }))
        .data.content,
  });

  const detail = useQuery({
    queryKey: ["/documentos", id],
    queryFn: async () => (await api.get<Documento>(`/documentos/${id}`)).data,
  });

  useEffect(() => {
    if (detail.data) {
      const d = detail.data;
      form.reset({
        estudianteId: d.estudianteId,
        postulacionId: d.postulacionId,
        tipo: d.tipo,
        nombreOriginal: d.nombreOriginal,
        rutaAlmacenamiento: d.rutaAlmacenamiento,
        mimeType: d.mimeType,
        tamanoBytes: d.tamanoBytes,
      });
    }
  }, [detail.data, form]);

  const save = useMutation({
    mutationFn: async (values: EditValues) => {
      const payload = {
        ...values,
        estudianteId: values.estudianteId || undefined,
        postulacionId: values.postulacionId || undefined,
      };
      return api.put<Documento>(`/documentos/${id}`, payload);
    },
    onSuccess: () => {
      toast.success("Documento actualizado");
      qc.invalidateQueries({ queryKey: ["/documentos"] });
      navigate("/documentos");
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Pencil className="h-4 w-4" />Editar metadata</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => save.mutate(v))} className="space-y-4">
            {!isStudent && (
              <FormField control={form.control} name="estudianteId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Estudiante</FormLabel>
                  <Select
                    value={field.value ? String(field.value) : ""}
                    onValueChange={(v) => field.onChange(v ? Number(v) : null)}
                  >
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecciona estudiante" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {estudiantes.data?.map((e) => (
                        <SelectItem key={e.id} value={String(e.id)}>{e.nombres} {e.apellidos}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            )}
            <FormField control={form.control} name="tipo" render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    {TIPOS.map((t) => (
                      <SelectItem key={t} value={t}>{TIPO_DOCUMENTO_LABELS[t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="nombreOriginal" render={({ field }) => (
              <FormItem><FormLabel>Nombre original</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="rutaAlmacenamiento" render={({ field }) => (
              <FormItem>
                <FormLabel>Ruta de almacenamiento</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormDescription>Ruta interna del archivo en el almacenamiento.</FormDescription>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="mimeType" render={({ field }) => (
                <FormItem><FormLabel>MIME type</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="tamanoBytes" render={({ field }) => (
                <FormItem><FormLabel>Tamaño (bytes)</FormLabel><FormControl><Input type="number" min={0} {...field} /></FormControl><FormMessage /></FormItem>
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
  );
}

export function DocumentoFormPage(): JSX.Element {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Volver">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">{isEdit ? "Editar" : "Subir"} documento</h1>
      </div>
      {isEdit && id ? <EditarDocumentoForm id={id} /> : <NuevoDocumentoForm />}
    </div>
  );
}
