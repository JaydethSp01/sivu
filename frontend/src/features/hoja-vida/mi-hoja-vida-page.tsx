import { useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  useFieldArray,
  useForm,
  type Control,
  type UseFormRegister,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  ArrowLeft,
  BookOpen,
  Briefcase,
  CheckCircle2,
  Download,
  FileUser,
  Globe2,
  GraduationCap,
  Languages,
  Loader2,
  Plus,
  Save,
  Trash2,
  UserCircle,
} from "lucide-react";
import { AxiosError } from "axios";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/empty-state";
import { api, extractApiMessage } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import {
  CATEGORIA_HABILIDAD_LABELS,
  NIVEL_IDIOMA_LABELS,
} from "@/lib/enum-labels";
import type {
  CategoriaHabilidad,
  HojaVidaRequest,
  HojaVidaResponse,
  NivelIdioma,
} from "@/lib/types";

const CATEGORIAS: CategoriaHabilidad[] = ["TECNICA", "PERSONAL", "HERRAMIENTA", "OTRO"];
const NIVELES: NivelIdioma[] = ["A1", "A2", "B1", "B2", "C1", "C2", "NATIVO"];

const habilidadSchema = z.object({
  id: z.number().int().positive().optional(),
  categoria: z.enum(["TECNICA", "PERSONAL", "HERRAMIENTA", "OTRO"]),
  descripcion: z.string().min(1, "Requerida").max(160),
  orden: z.coerce.number().int().min(0).optional(),
});

const idiomaSchema = z.object({
  id: z.number().int().positive().optional(),
  idioma: z.string().min(1, "Requerido").max(40),
  nivel: z.enum(["A1", "A2", "B1", "B2", "C1", "C2", "NATIVO"]),
  orden: z.coerce.number().int().min(0).optional(),
});

const educacionSchema = z.object({
  id: z.number().int().positive().optional(),
  programa: z.string().min(1, "Requerido").max(180),
  institucion: z.string().min(1, "Requerido").max(180),
  fechaInicio: z.string().optional().nullable(),
  fechaFin: z.string().optional().nullable(),
  enCurso: z.boolean().optional(),
  observaciones: z.string().max(1000).optional().nullable(),
  orden: z.coerce.number().int().min(0).optional(),
});

const experienciaFaseSchema = z.object({
  id: z.number().int().positive().optional(),
  empresa: z.string().min(1, "Requerida").max(180),
  cargo: z.string().max(160).optional().nullable(),
  fechaInicio: z.string().optional().nullable(),
  fechaFin: z.string().optional().nullable(),
  enCurso: z.boolean().optional(),
  descripcion: z.string().max(2000).optional().nullable(),
  orden: z.coerce.number().int().min(0).optional(),
});

const experienciaLabSchema = z.object({
  id: z.number().int().positive().optional(),
  empresa: z.string().min(1, "Requerida").max(180),
  cargo: z.string().min(1, "Requerido").max(160),
  fechaInicio: z.string().optional().nullable(),
  fechaFin: z.string().optional().nullable(),
  enCurso: z.boolean().optional(),
  descripcion: z.string().max(2000).optional().nullable(),
  orden: z.coerce.number().int().min(0).optional(),
});

const schema = z.object({
  direccion: z.string().max(200).optional().nullable(),
  telefonoContacto: z.string().max(30).optional().nullable(),
  ciudad: z.string().max(80).optional().nullable(),
  fotoPath: z.string().max(500).optional().nullable(),
  perfilSaber: z.string().max(2000).optional().nullable(),
  perfilHacer: z.string().max(2000).optional().nullable(),
  perfilSer: z.string().max(2000).optional().nullable(),
  habilidades: z.array(habilidadSchema),
  idiomas: z.array(idiomaSchema),
  educacion: z.array(educacionSchema),
  experienciaFase: z.array(experienciaFaseSchema),
  experienciaLaboral: z.array(experienciaLabSchema),
});

type FormValues = z.infer<typeof schema>;

const EMPTY_DEFAULTS: FormValues = {
  direccion: "",
  telefonoContacto: "",
  ciudad: "",
  fotoPath: "",
  perfilSaber: "",
  perfilHacer: "",
  perfilSer: "",
  habilidades: [],
  idiomas: [],
  educacion: [],
  experienciaFase: [],
  experienciaLaboral: [],
};

function toForm(hv: HojaVidaResponse): FormValues {
  return {
    direccion: hv.direccion ?? "",
    telefonoContacto: hv.telefonoContacto ?? "",
    ciudad: hv.ciudad ?? "",
    fotoPath: hv.fotoPath ?? "",
    perfilSaber: hv.perfilSaber ?? "",
    perfilHacer: hv.perfilHacer ?? "",
    perfilSer: hv.perfilSer ?? "",
    habilidades: hv.habilidades.map((h) => ({
      id: h.id,
      categoria: h.categoria,
      descripcion: h.descripcion,
      orden: h.orden ?? 0,
    })),
    idiomas: hv.idiomas.map((i) => ({
      id: i.id,
      idioma: i.idioma,
      nivel: i.nivel,
      orden: i.orden ?? 0,
    })),
    educacion: hv.educacion.map((e) => ({
      id: e.id,
      programa: e.programa,
      institucion: e.institucion,
      fechaInicio: e.fechaInicio ?? "",
      fechaFin: e.fechaFin ?? "",
      enCurso: e.enCurso ?? false,
      observaciones: e.observaciones ?? "",
      orden: e.orden ?? 0,
    })),
    experienciaFase: hv.experienciaFase.map((x) => ({
      id: x.id,
      empresa: x.empresa,
      cargo: x.cargo ?? "",
      fechaInicio: x.fechaInicio ?? "",
      fechaFin: x.fechaFin ?? "",
      enCurso: x.enCurso ?? false,
      descripcion: x.descripcion ?? "",
      orden: x.orden ?? 0,
    })),
    experienciaLaboral: hv.experienciaLaboral.map((x) => ({
      id: x.id,
      empresa: x.empresa,
      cargo: x.cargo ?? "",
      fechaInicio: x.fechaInicio ?? "",
      fechaFin: x.fechaFin ?? "",
      enCurso: x.enCurso ?? false,
      descripcion: x.descripcion ?? "",
      orden: x.orden ?? 0,
    })),
  };
}

function emptyToNull(s: string | null | undefined): string | null {
  if (!s) return null;
  const t = s.trim();
  return t.length === 0 ? null : t;
}

function toRequest(values: FormValues): HojaVidaRequest {
  return {
    direccion: emptyToNull(values.direccion),
    telefonoContacto: emptyToNull(values.telefonoContacto),
    ciudad: emptyToNull(values.ciudad),
    fotoPath: emptyToNull(values.fotoPath),
    perfilSaber: emptyToNull(values.perfilSaber),
    perfilHacer: emptyToNull(values.perfilHacer),
    perfilSer: emptyToNull(values.perfilSer),
    habilidades: values.habilidades.map((h, idx) => ({
      categoria: h.categoria,
      descripcion: h.descripcion.trim(),
      orden: h.orden ?? idx,
    })),
    idiomas: values.idiomas.map((i, idx) => ({
      idioma: i.idioma.trim(),
      nivel: i.nivel,
      orden: i.orden ?? idx,
    })),
    educacion: values.educacion.map((e, idx) => ({
      programa: e.programa.trim(),
      institucion: e.institucion.trim(),
      fechaInicio: emptyToNull(e.fechaInicio),
      fechaFin: emptyToNull(e.fechaFin),
      enCurso: e.enCurso ?? false,
      observaciones: emptyToNull(e.observaciones),
      orden: e.orden ?? idx,
    })),
    experienciaFase: values.experienciaFase.map((x, idx) => ({
      empresa: x.empresa.trim(),
      cargo: emptyToNull(x.cargo),
      fechaInicio: emptyToNull(x.fechaInicio),
      fechaFin: emptyToNull(x.fechaFin),
      enCurso: x.enCurso ?? false,
      descripcion: emptyToNull(x.descripcion),
      orden: x.orden ?? idx,
    })),
    experienciaLaboral: values.experienciaLaboral.map((x, idx) => ({
      empresa: x.empresa.trim(),
      cargo: x.cargo.trim(),
      fechaInicio: emptyToNull(x.fechaInicio),
      fechaFin: emptyToNull(x.fechaFin),
      enCurso: x.enCurso ?? false,
      descripcion: emptyToNull(x.descripcion),
      orden: x.orden ?? idx,
    })),
  };
}

function calcularFaltantes(values: FormValues): string[] {
  const f: string[] = [];
  if (!values.perfilSaber?.trim() || !values.perfilHacer?.trim() || !values.perfilSer?.trim()) {
    f.push("perfil (saber/hacer/ser)");
  }
  if (values.habilidades.length === 0) f.push("habilidades");
  if (values.educacion.length === 0) f.push("educación");
  return f;
}

interface HabilidadesTabProps {
  control: Control<FormValues>;
  register: UseFormRegister<FormValues>;
}

function HabilidadesTab({ control, register }: HabilidadesTabProps): JSX.Element {
  const fa = useFieldArray({ control, name: "habilidades" });
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Lista tus competencias técnicas, personales y herramientas que dominas.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            fa.append({ categoria: "TECNICA", descripcion: "", orden: fa.fields.length })
          }
        >
          <Plus className="h-4 w-4" /> Añadir habilidad
        </Button>
      </div>
      {fa.fields.length === 0 ? (
        <EmptyState
          title="Sin habilidades registradas"
          description="Añade al menos una habilidad técnica o personal."
        />
      ) : (
        <div className="space-y-2">
          {fa.fields.map((field, idx) => (
            <div key={field.id} className="grid grid-cols-12 gap-2 items-start rounded-md border p-2">
              <div className="col-span-12 sm:col-span-3">
                <Label className="text-xs">Categoría</Label>
                <Select
                  value={field.categoria}
                  onValueChange={(v) =>
                    fa.update(idx, { ...fa.fields[idx], categoria: v as CategoriaHabilidad })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {CATEGORIA_HABILIDAD_LABELS[c]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-8 sm:col-span-6">
                <Label className="text-xs">Descripción</Label>
                <Input
                  className="mt-1"
                  placeholder="Ej: Spring Boot, liderazgo, Figma..."
                  {...register(`habilidades.${idx}.descripcion`)}
                />
              </div>
              <div className="col-span-3 sm:col-span-2">
                <Label className="text-xs">Orden</Label>
                <Input
                  className="mt-1"
                  type="number"
                  min={0}
                  {...register(`habilidades.${idx}.orden`, { valueAsNumber: true })}
                />
              </div>
              <div className="col-span-1 flex justify-end pt-6">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => fa.remove(idx)}
                  aria-label="Eliminar habilidad"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function IdiomasTab({ control, register }: HabilidadesTabProps): JSX.Element {
  const fa = useFieldArray({ control, name: "idiomas" });
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Registra los idiomas que manejas y tu nivel según el MCER.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fa.append({ idioma: "", nivel: "B1", orden: fa.fields.length })}
        >
          <Plus className="h-4 w-4" /> Añadir idioma
        </Button>
      </div>
      {fa.fields.length === 0 ? (
        <EmptyState title="Sin idiomas" description="¿Hablas otro idioma? Añádelo aquí." />
      ) : (
        <div className="space-y-2">
          {fa.fields.map((field, idx) => (
            <div key={field.id} className="grid grid-cols-12 gap-2 items-start rounded-md border p-2">
              <div className="col-span-12 sm:col-span-5">
                <Label className="text-xs">Idioma</Label>
                <Input
                  className="mt-1"
                  placeholder="Ej: Inglés, Francés..."
                  {...register(`idiomas.${idx}.idioma`)}
                />
              </div>
              <div className="col-span-8 sm:col-span-4">
                <Label className="text-xs">Nivel</Label>
                <Select
                  value={field.nivel}
                  onValueChange={(v) =>
                    fa.update(idx, { ...fa.fields[idx], nivel: v as NivelIdioma })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NIVELES.map((n) => (
                      <SelectItem key={n} value={n}>
                        {NIVEL_IDIOMA_LABELS[n]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-3 sm:col-span-2">
                <Label className="text-xs">Orden</Label>
                <Input
                  className="mt-1"
                  type="number"
                  min={0}
                  {...register(`idiomas.${idx}.orden`, { valueAsNumber: true })}
                />
              </div>
              <div className="col-span-1 flex justify-end pt-6">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => fa.remove(idx)}
                  aria-label="Eliminar idioma"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EducacionTab({ control, register }: HabilidadesTabProps): JSX.Element {
  const fa = useFieldArray({ control, name: "educacion" });
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Tu formación: programas académicos, técnicos, cursos relevantes.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            fa.append({
              programa: "",
              institucion: "",
              fechaInicio: "",
              fechaFin: "",
              enCurso: false,
              observaciones: "",
              orden: fa.fields.length,
            })
          }
        >
          <Plus className="h-4 w-4" /> Añadir educación
        </Button>
      </div>
      {fa.fields.length === 0 ? (
        <EmptyState title="Sin formación registrada" description="Agrega al menos tu programa actual." />
      ) : (
        <div className="space-y-3">
          {fa.fields.map((field, idx) => (
            <Card key={field.id}>
              <CardContent className="pt-4 space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>Programa</Label>
                    <Input
                      className="mt-1"
                      placeholder="Ej: Ingeniería de Software"
                      {...register(`educacion.${idx}.programa`)}
                    />
                  </div>
                  <div>
                    <Label>Institución</Label>
                    <Input
                      className="mt-1"
                      placeholder="Ej: Uniempresarial"
                      {...register(`educacion.${idx}.institucion`)}
                    />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <Label>Fecha inicio</Label>
                    <Input
                      className="mt-1"
                      type="date"
                      {...register(`educacion.${idx}.fechaInicio`)}
                    />
                  </div>
                  <div>
                    <Label>Fecha fin</Label>
                    <Input
                      className="mt-1"
                      type="date"
                      {...register(`educacion.${idx}.fechaFin`)}
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <input
                      id={`educacion-en-curso-${idx}`}
                      type="checkbox"
                      className="h-4 w-4"
                      {...register(`educacion.${idx}.enCurso`)}
                    />
                    <Label htmlFor={`educacion-en-curso-${idx}`} className="cursor-pointer">
                      En curso
                    </Label>
                  </div>
                </div>
                <div>
                  <Label>Observaciones</Label>
                  <Textarea
                    className="mt-1"
                    rows={2}
                    placeholder="Reconocimientos, énfasis, promedio..."
                    {...register(`educacion.${idx}.observaciones`)}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs">Orden</Label>
                    <Input
                      className="w-20"
                      type="number"
                      min={0}
                      {...register(`educacion.${idx}.orden`, { valueAsNumber: true })}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fa.remove(idx)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" /> Eliminar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

interface ExperienciaTabProps extends HabilidadesTabProps {
  name: "experienciaFase" | "experienciaLaboral";
  helpText: string;
  cargoRequired: boolean;
}

function ExperienciaTab({
  control,
  register,
  name,
  helpText,
  cargoRequired,
}: ExperienciaTabProps): JSX.Element {
  const fa = useFieldArray({ control, name });
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">{helpText}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            fa.append({
              empresa: "",
              cargo: "",
              fechaInicio: "",
              fechaFin: "",
              enCurso: false,
              descripcion: "",
              orden: fa.fields.length,
            })
          }
        >
          <Plus className="h-4 w-4" /> Añadir
        </Button>
      </div>
      {fa.fields.length === 0 ? (
        <EmptyState
          title="Sin experiencia registrada"
          description="Aún no has agregado nada en esta sección."
        />
      ) : (
        <div className="space-y-3">
          {fa.fields.map((field, idx) => (
            <Card key={field.id}>
              <CardContent className="pt-4 space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>Empresa</Label>
                    <Input
                      className="mt-1"
                      placeholder="Razón social"
                      {...register(`${name}.${idx}.empresa`)}
                    />
                  </div>
                  <div>
                    <Label>
                      Cargo
                      {cargoRequired && <span className="text-destructive"> *</span>}
                    </Label>
                    <Input
                      className="mt-1"
                      placeholder="Ej: Practicante de desarrollo"
                      {...register(`${name}.${idx}.cargo`)}
                    />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <Label>Fecha inicio</Label>
                    <Input
                      className="mt-1"
                      type="date"
                      {...register(`${name}.${idx}.fechaInicio`)}
                    />
                  </div>
                  <div>
                    <Label>Fecha fin</Label>
                    <Input
                      className="mt-1"
                      type="date"
                      {...register(`${name}.${idx}.fechaFin`)}
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <input
                      id={`${name}-en-curso-${idx}`}
                      type="checkbox"
                      className="h-4 w-4"
                      {...register(`${name}.${idx}.enCurso`)}
                    />
                    <Label htmlFor={`${name}-en-curso-${idx}`} className="cursor-pointer">
                      En curso
                    </Label>
                  </div>
                </div>
                <div>
                  <Label>Descripción</Label>
                  <Textarea
                    className="mt-1"
                    rows={3}
                    placeholder="Logros, responsabilidades, tecnologías usadas..."
                    {...register(`${name}.${idx}.descripcion`)}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs">Orden</Label>
                    <Input
                      className="w-20"
                      type="number"
                      min={0}
                      {...register(`${name}.${idx}.orden`, { valueAsNumber: true })}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fa.remove(idx)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" /> Eliminar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export function MiHojaVidaPage(): JSX.Element {
  const usuario = useAuthStore((s) => s.usuario);
  const hasRole = useAuthStore((s) => s.hasRole);
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  // Determinar a qué estudiante apunta la pantalla
  const targetEstudianteId = id ? Number(id) : usuario?.estudianteId ?? null;
  const esMiHV = !id && hasRole("ESTUDIANTE");

  const enabled = targetEstudianteId !== null && !Number.isNaN(targetEstudianteId);

  const hv = useQuery({
    queryKey: ["/hoja-vida", targetEstudianteId],
    enabled,
    retry: (failureCount, error) => {
      if (error instanceof AxiosError && error.response?.status === 404) return false;
      return failureCount < 2;
    },
    queryFn: async () => {
      try {
        const { data } = await api.get<HojaVidaResponse>(`/hoja-vida/${targetEstudianteId}`);
        return data;
      } catch (e) {
        if (e instanceof AxiosError && e.response?.status === 404) return null;
        throw e;
      }
    },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY_DEFAULTS,
  });

  useEffect(() => {
    if (hv.data) form.reset(toForm(hv.data));
    if (hv.data === null) form.reset(EMPTY_DEFAULTS);
  }, [hv.data, form]);

  const guardar = useMutation({
    mutationFn: async (values: FormValues) => {
      if (!targetEstudianteId) throw new Error("Estudiante no identificado");
      const payload = toRequest(values);
      const { data } = await api.put<HojaVidaResponse>(
        `/hoja-vida/${targetEstudianteId}`,
        payload
      );
      return data;
    },
    onSuccess: (data) => {
      toast.success("Hoja de vida guardada");
      qc.setQueryData(["/hoja-vida", targetEstudianteId], data);
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  const descargarPdf = useMutation({
    mutationFn: async () => {
      if (!targetEstudianteId) throw new Error("Estudiante no identificado");
      const res = await api.get(`/hoja-vida/${targetEstudianteId}/pdf`, {
        responseType: "blob",
      });
      const blob = new Blob([res.data as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `hv-uniempresarial-${targetEstudianteId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  const watched = form.watch();
  const faltantes = useMemo(() => calcularFaltantes(watched), [watched]);
  const completaLocal = faltantes.length === 0;
  const completaBackend = hv.data?.completa ?? false;
  const esCompleta = completaLocal && completaBackend;

  if (!targetEstudianteId) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Mi Hoja de Vida</h1>
        <EmptyState
          title="Tu cuenta no está vinculada a un estudiante"
          description="Pide al coordinador que vincule tu usuario a un registro de estudiante."
        />
      </div>
    );
  }

  if (hv.isLoading) {
    return (
      <div className="flex items-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Cargando hoja de vida...
      </div>
    );
  }

  const titulo = esMiHV
    ? "Mi Hoja de Vida"
    : `Hoja de Vida — ${hv.data?.estudianteNombreCompleto ?? `Estudiante #${targetEstudianteId}`}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {!esMiHV && (
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Volver">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <FileUser className="h-6 w-6 text-primary" />
              {titulo}
            </h1>
            <p className="text-sm text-muted-foreground">
              Completa tu HV y descárgala con el formato oficial Uniempresarial.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {esCompleta ? (
            <Badge variant="success" className="px-3 py-1 text-sm">
              <CheckCircle2 className="h-4 w-4 mr-1" /> HV completa
            </Badge>
          ) : (
            <Badge variant="warning" className="px-3 py-1 text-sm">
              HV incompleta — faltan: {faltantes.join(", ") || "datos básicos"}
            </Badge>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => descargarPdf.mutate()}
            disabled={descargarPdf.isPending || !hv.data}
            title={!hv.data ? "Guarda primero tu HV" : "Descargar PDF Uniempresarial"}
          >
            {descargarPdf.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            PDF Uniempresarial
          </Button>
          <Button
            type="button"
            onClick={form.handleSubmit((v) => guardar.mutate(v))}
            disabled={guardar.isPending}
          >
            {guardar.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Guardar HV
          </Button>
        </div>
      </div>

      {hv.data && (
        <Card>
          <CardContent className="pt-4 grid gap-2 sm:grid-cols-3 text-sm">
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Estudiante</div>
              <div className="font-medium">{hv.data.estudianteNombreCompleto}</div>
              <div className="text-xs text-muted-foreground">{hv.data.estudianteEmail}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Programa</div>
              <div className="font-medium">{hv.data.programaAcademico}</div>
              {hv.data.semestre != null && (
                <div className="text-xs text-muted-foreground">Semestre {hv.data.semestre}</div>
              )}
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Última actualización</div>
              <div className="font-medium">
                {new Date(hv.data.ultimaActualizacion).toLocaleString()}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={form.handleSubmit((v) => guardar.mutate(v))} className="space-y-4">
        <Card>
          <CardContent className="pt-4">
            <Tabs defaultValue="info">
              <TabsList className="flex-wrap h-auto">
                <TabsTrigger value="info">
                  <UserCircle className="h-4 w-4 mr-1" /> Información
                </TabsTrigger>
                <TabsTrigger value="perfil">
                  <GraduationCap className="h-4 w-4 mr-1" /> Perfil
                </TabsTrigger>
                <TabsTrigger value="habilidades">
                  <BookOpen className="h-4 w-4 mr-1" /> Habilidades
                </TabsTrigger>
                <TabsTrigger value="idiomas">
                  <Languages className="h-4 w-4 mr-1" /> Idiomas
                </TabsTrigger>
                <TabsTrigger value="educacion">
                  <Globe2 className="h-4 w-4 mr-1" /> Educación
                </TabsTrigger>
                <TabsTrigger value="fase">
                  <Briefcase className="h-4 w-4 mr-1" /> Experiencia fase
                </TabsTrigger>
                <TabsTrigger value="laboral">
                  <Briefcase className="h-4 w-4 mr-1" /> Experiencia laboral
                </TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="mt-4 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="hv-direccion">Dirección</Label>
                    <Input id="hv-direccion" className="mt-1" {...form.register("direccion")} />
                  </div>
                  <div>
                    <Label htmlFor="hv-telefono">Teléfono de contacto</Label>
                    <Input id="hv-telefono" className="mt-1" {...form.register("telefonoContacto")} />
                  </div>
                  <div>
                    <Label htmlFor="hv-ciudad">Ciudad</Label>
                    <Input id="hv-ciudad" className="mt-1" {...form.register("ciudad")} />
                  </div>
                  <div>
                    <Label htmlFor="hv-foto">Foto (URL/ruta)</Label>
                    <Input
                      id="hv-foto"
                      className="mt-1"
                      placeholder="https://..."
                      {...form.register("fotoPath")}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Por ahora se ingresa la URL o ruta del archivo manualmente.
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="perfil" className="mt-4 space-y-4">
                <div>
                  <Label htmlFor="hv-saber">SABER</Label>
                  <p className="text-xs text-muted-foreground mb-1">
                    Qué sabes / has estudiado: conocimientos teóricos, áreas dominadas, certificaciones.
                  </p>
                  <Textarea
                    id="hv-saber"
                    rows={5}
                    placeholder="Ej: Programación orientada a objetos, bases de datos relacionales, arquitectura hexagonal..."
                    {...form.register("perfilSaber")}
                  />
                </div>
                <div>
                  <Label htmlFor="hv-hacer">HACER</Label>
                  <p className="text-xs text-muted-foreground mb-1">
                    Qué puedes hacer en la práctica: tareas concretas que ejecutas con autonomía.
                  </p>
                  <Textarea
                    id="hv-hacer"
                    rows={5}
                    placeholder="Ej: Construir APIs REST en Spring Boot, desplegar en VPS con Docker, hacer code review..."
                    {...form.register("perfilHacer")}
                  />
                </div>
                <div>
                  <Label htmlFor="hv-ser">SER</Label>
                  <p className="text-xs text-muted-foreground mb-1">
                    Tus actitudes y forma de trabajar: valores, soft-skills, estilo de colaboración.
                  </p>
                  <Textarea
                    id="hv-ser"
                    rows={5}
                    placeholder="Ej: Proactivo, comunicación clara, orientación al detalle, trabajo en equipo..."
                    {...form.register("perfilSer")}
                  />
                </div>
              </TabsContent>

              <TabsContent value="habilidades" className="mt-4">
                <HabilidadesTab control={form.control} register={form.register} />
              </TabsContent>

              <TabsContent value="idiomas" className="mt-4">
                <IdiomasTab control={form.control} register={form.register} />
              </TabsContent>

              <TabsContent value="educacion" className="mt-4">
                <EducacionTab control={form.control} register={form.register} />
              </TabsContent>

              <TabsContent value="fase" className="mt-4">
                <ExperienciaTab
                  control={form.control}
                  register={form.register}
                  name="experienciaFase"
                  helpText="Prácticas, semestres en empresa, monitorías y experiencia académica relacionada."
                  cargoRequired={false}
                />
              </TabsContent>

              <TabsContent value="laboral" className="mt-4">
                <ExperienciaTab
                  control={form.control}
                  register={form.register}
                  name="experienciaLaboral"
                  helpText="Empleos previos formales. El cargo es obligatorio."
                  cargoRequired
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
