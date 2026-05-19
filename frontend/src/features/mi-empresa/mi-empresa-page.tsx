import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Upload,
  XCircle,
} from "lucide-react";
import { z } from "zod";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/status-badge";
import { api, extractApiMessage } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { ESTADO_EMPRESA_LABELS } from "@/lib/enum-labels";
import { cn, formatBytes } from "@/lib/utils";
import type {
  Documento,
  Empresa,
  EstadoDocumento,
  TipoDocumentoSoporte,
  TipoRequisito,
} from "@/lib/types";

// ============================================================
// Tab 1 — Datos generales
// ============================================================

const generalesSchema = z.object({
  razonSocial: z.string().min(1, "Requerido").max(180),
  nombreComercial: z.string().max(180).optional().or(z.literal("")),
  nit: z.string().min(1).max(20),
  sector: z.string().min(1, "Requerido").max(80),
  ciudad: z.string().min(1, "Requerido").max(80),
  direccion: z.string().max(200).optional().or(z.literal("")),
  emailContacto: z.string().email("Email inválido").max(180),
  telefonoContacto: z.string().max(30).optional().or(z.literal("")),
  contactoNombre: z.string().min(1, "Requerido").max(160),
  contactoCargo: z.string().max(120).optional().or(z.literal("")),
});

type GeneralesValues = z.infer<typeof generalesSchema>;

interface DatosGeneralesTabProps {
  empresa: Empresa;
}

function DatosGeneralesTab({ empresa }: DatosGeneralesTabProps): JSX.Element {
  const qc = useQueryClient();

  const form = useForm<GeneralesValues>({
    resolver: zodResolver(generalesSchema),
    defaultValues: {
      razonSocial: empresa.razonSocial,
      nombreComercial: empresa.nombreComercial ?? "",
      nit: empresa.nit,
      sector: empresa.sector,
      ciudad: empresa.ciudad,
      direccion: empresa.direccion ?? "",
      emailContacto: empresa.emailContacto,
      telefonoContacto: empresa.telefonoContacto ?? "",
      contactoNombre: empresa.contactoNombre,
      contactoCargo: empresa.contactoCargo ?? "",
    },
  });

  // Resetear cuando llega data nueva (p. ej. tras refetch).
  useEffect(() => {
    form.reset({
      razonSocial: empresa.razonSocial,
      nombreComercial: empresa.nombreComercial ?? "",
      nit: empresa.nit,
      sector: empresa.sector,
      ciudad: empresa.ciudad,
      direccion: empresa.direccion ?? "",
      emailContacto: empresa.emailContacto,
      telefonoContacto: empresa.telefonoContacto ?? "",
      contactoNombre: empresa.contactoNombre,
      contactoCargo: empresa.contactoCargo ?? "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresa.id, empresa.updatedAt]);

  const guardar = useMutation({
    mutationFn: async (values: GeneralesValues) => {
      const payload = {
        nit: empresa.nit, // NIT no se cambia desde esta pantalla.
        razonSocial: values.razonSocial,
        nombreComercial: values.nombreComercial || undefined,
        sector: values.sector,
        ciudad: values.ciudad,
        direccion: values.direccion || undefined,
        emailContacto: values.emailContacto,
        telefonoContacto: values.telefonoContacto || undefined,
        contactoNombre: values.contactoNombre,
        contactoCargo: values.contactoCargo || undefined,
        estado: empresa.estado, // No se altera el estado desde aquí.
      };
      return api.put<Empresa>(`/empresas/${empresa.id}`, payload);
    },
    onSuccess: () => {
      toast.success("Datos actualizados");
      qc.invalidateQueries({ queryKey: ["/empresas", empresa.id] });
      qc.invalidateQueries({ queryKey: ["/empresas"] });
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Datos de la empresa</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => guardar.mutate(v))} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="nit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NIT</FormLabel>
                    <FormControl>
                      <Input {...field} disabled />
                    </FormControl>
                    <FormDescription>El NIT solo lo modifica coordinación.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="razonSocial"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Razón social</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="nombreComercial"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre comercial</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sector"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sector</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ciudad"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ciudad</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="direccion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dirección</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="emailContacto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email de contacto</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="telefonoContacto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono de contacto</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contactoNombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Persona de contacto</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contactoCargo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cargo del contacto</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={guardar.isPending}>
                {guardar.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Guardar cambios
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Tab 2 — Documentos legales
// ============================================================

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPT_MIME = ["application/pdf", "image/jpeg", "image/png"];
const ACCEPT_ATTR = ".pdf,.jpg,.jpeg,.png";

/**
 * El backend ahora acepta {@code tipoRequisitoId} en el upload y expone el tipo
 * de requisito en la respuesta. Asociamos cada documento legal a su tipo de
 * requisito por id, sin manipular el nombre del archivo.
 */
function displayName(doc: Documento): string {
  return doc.nombreOriginal;
}

interface DocumentosLegalesTabProps {
  empresaId: number;
  onChecklistChange?: (faltantes: TipoRequisito[]) => void;
}

function DocumentosLegalesTab({
  empresaId,
  onChecklistChange,
}: DocumentosLegalesTabProps): JSX.Element {
  const tipos = useQuery({
    queryKey: ["/tipos-requisito/activos", "EMPRESA"],
    queryFn: async () =>
      (
        await api.get<TipoRequisito[]>("/tipos-requisito/activos", {
          params: { aplicaA: "EMPRESA" },
        })
      ).data,
  });

  const docs = useQuery({
    queryKey: ["/documentos/por-empresa", empresaId],
    queryFn: async () =>
      (await api.get<Documento[]>(`/documentos/por-empresa/${empresaId}`)).data,
  });

  // Notificar al padre cuántos faltan (para el tab 3).
  useEffect(() => {
    if (!onChecklistChange) return;
    if (!tipos.data || !docs.data) return;
    const faltantes = tipos.data.filter((t) => {
      const d = pickDocPorTipo(docs.data ?? [], t.codigo);
      return !d || d.estado !== "VALIDADO";
    });
    onChecklistChange(faltantes);
  }, [tipos.data, docs.data, onChecklistChange]);

  if (tipos.isLoading || docs.isLoading) {
    return (
      <div className="flex items-center text-muted-foreground p-6">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando documentos...
      </div>
    );
  }

  if (!tipos.data || tipos.data.length === 0) {
    return (
      <EmptyState
        title="Sin tipos de documento configurados"
        description="Coordinación aún no ha configurado tipos de documento aplicables a empresas."
      />
    );
  }

  return (
    <div className="space-y-3">
      {tipos.data.map((tipo) => (
        <RequisitoCard
          key={tipo.id}
          empresaId={empresaId}
          tipo={tipo}
          documento={pickDocPorTipo(docs.data ?? [], tipo.codigo)}
        />
      ))}
    </div>
  );
}

function pickDocPorTipo(docs: Documento[], codigo: string): Documento | undefined {
  // Match por código del tipo de requisito asociado al documento.
  const candidatos = docs
    .filter((d) => d.tipoRequisito?.codigo === codigo)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return candidatos[0];
}

interface RequisitoCardProps {
  empresaId: number;
  tipo: TipoRequisito;
  documento: Documento | undefined;
}

function RequisitoCard({ empresaId, tipo, documento }: RequisitoCardProps): JSX.Element {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const subir = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("archivo", file);
      const params: Record<string, string | number> = {
        tipo: "OTRO" satisfies TipoDocumentoSoporte,
        empresaId,
        tipoRequisitoId: tipo.id,
      };
      return api.post<Documento>("/documentos/upload", formData, { params });
    },
    onSuccess: () => {
      toast.success(`${tipo.nombre} subido`);
      qc.invalidateQueries({ queryKey: ["/documentos/por-empresa", empresaId] });
      qc.invalidateQueries({ queryKey: ["/documentos"] });
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  const descargar = useMutation({
    mutationFn: async () => {
      if (!documento) return;
      const res = await api.get(`/documentos/${documento.id}/descargar`, {
        responseType: "blob",
      });
      const blob = new Blob([res.data as BlobPart], { type: documento.mimeType });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = displayName(documento);
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_BYTES) {
      toast.error(`El archivo supera 10MB (${formatBytes(file.size)})`);
      return;
    }
    if (file.type && !ACCEPT_MIME.includes(file.type)) {
      toast.error("Tipo no permitido. Solo PDF, JPG o PNG.");
      return;
    }
    subir.mutate(file);
  };

  const estado: EstadoDocumento | "NO_CARGADO" = documento ? documento.estado : "NO_CARGADO";

  return (
    <Card
      className={cn(
        estado === "VALIDADO" && "border-success/40",
        estado === "RECHAZADO" && "border-destructive/40",
        estado === "RECIBIDO" && "border-warning/40"
      )}
    >
      <CardContent className="p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <EstadoIcon estado={estado} />
              <h3 className="font-medium leading-none">{tipo.nombre}</h3>
              <span className="text-[10px] font-mono uppercase text-muted-foreground">
                {tipo.codigo}
              </span>
            </div>
            {tipo.descripcion && (
              <p className="text-xs text-muted-foreground">{tipo.descripcion}</p>
            )}
            <EstadoDetalle documento={documento} />
          </div>
          <div className="flex shrink-0 flex-wrap gap-2 md:justify-end">
            {documento && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => descargar.mutate()}
                disabled={descargar.isPending}
              >
                {descargar.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Descargar
              </Button>
            )}
            <Button
              size="sm"
              variant={documento ? "outline" : "default"}
              onClick={() => fileInputRef.current?.click()}
              disabled={subir.isPending}
            >
              {subir.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : documento ? (
                <RefreshCw className="h-4 w-4" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {documento ? "Reemplazar" : "Subir"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPT_ATTR}
              className="hidden"
              onChange={onPickFile}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EstadoIcon({
  estado,
}: {
  estado: EstadoDocumento | "NO_CARGADO";
}): JSX.Element {
  if (estado === "VALIDADO") return <CheckCircle2 className="h-4 w-4 text-success" />;
  if (estado === "RECIBIDO") return <Clock className="h-4 w-4 text-warning" />;
  if (estado === "RECHAZADO") return <XCircle className="h-4 w-4 text-destructive" />;
  return <FileText className="h-4 w-4 text-muted-foreground" />;
}

function EstadoDetalle({ documento }: { documento: Documento | undefined }): JSX.Element {
  if (!documento) {
    return (
      <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
        <span>No cargado</span>
      </div>
    );
  }
  const fechaIso = documento.fechaValidacion ?? documento.updatedAt ?? documento.createdAt;
  let fecha = "—";
  try {
    fecha = format(parseISO(fechaIso), "PPp", { locale: es });
  } catch {
    fecha = fechaIso;
  }
  return (
    <div className="space-y-1 pt-1 text-xs">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge kind="documento" value={documento.estado} />
        <span className="text-muted-foreground">·</span>
        <span className="truncate max-w-[260px]" title={displayName(documento)}>
          {displayName(documento)}
        </span>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground">{formatBytes(documento.tamanoBytes)}</span>
      </div>
      <div className="text-muted-foreground">{fecha}</div>
      {documento.estado === "RECHAZADO" && documento.observacionesValidacion && (
        <div className="rounded border border-destructive/30 bg-destructive/5 px-2 py-1 text-destructive">
          <span className="font-medium">Observaciones de coordinación: </span>
          {documento.observacionesValidacion}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Tab 3 — Estado de aprobación
// ============================================================

interface EstadoAprobacionTabProps {
  empresa: Empresa;
  faltantes: TipoRequisito[];
}

function EstadoAprobacionTab({ empresa, faltantes }: EstadoAprobacionTabProps): JSX.Element {
  const fechaAprob = empresa.fechaAprobacion
    ? (() => {
        try {
          return format(parseISO(empresa.fechaAprobacion!), "PP", { locale: es });
        } catch {
          return empresa.fechaAprobacion;
        }
      })()
    : null;

  if (empresa.estado === "ACTIVA") {
    return (
      <Alert variant="success">
        <ShieldCheck className="h-5 w-5" />
        <AlertTitle className="text-base">Tu empresa está APROBADA</AlertTitle>
        <AlertDescription>
          <p>
            Ya puedes publicar vacantes y recibir postulaciones.{" "}
            {fechaAprob && <span>Aprobada el {fechaAprob}.</span>}
          </p>
          <div className="mt-2 flex gap-2">
            <Button asChild size="sm">
              <Link to="/vacantes/new">Publicar vacante</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/postulaciones">Ver postulaciones</Link>
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  if (empresa.estado === "EN_REVISION") {
    return (
      <Alert variant="warning">
        <Clock className="h-5 w-5" />
        <AlertTitle className="text-base">Tu empresa está en revisión por coordinación</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>Para acelerar el proceso, asegúrate de completar lo siguiente:</p>
          {faltantes.length === 0 ? (
            <div className="rounded border border-success/30 bg-success/5 px-3 py-2 text-success text-xs">
              Todos los documentos requeridos están validados. Espera la decisión de coordinación.
            </div>
          ) : (
            <ul className="ml-4 list-disc space-y-1 text-xs">
              {faltantes.map((f) => (
                <li key={f.id}>
                  <span className="font-medium">{f.nombre}</span>
                  {f.descripcion ? ` — ${f.descripcion}` : ""}
                </li>
              ))}
            </ul>
          )}
          <p className="pt-1 text-xs text-muted-foreground">
            Tiempo aprox. de aprobación: 2 a 5 días hábiles.
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  // INACTIVA
  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-5 w-5" />
      <AlertTitle className="text-base">Tu empresa fue rechazada</AlertTitle>
      <AlertDescription className="space-y-2">
        {empresa.motivoRechazo ? (
          <p>
            <span className="font-medium">Motivo: </span>
            {empresa.motivoRechazo}
          </p>
        ) : (
          <p>No se registró un motivo de rechazo.</p>
        )}
        <p>
          Si crees que es un error, contacta a coordinación. Puedes corregir los datos y
          documentos y volver a enviar tu empresa a revisión.
        </p>
      </AlertDescription>
    </Alert>
  );
}

// ============================================================
// Página principal
// ============================================================

export function MiEmpresaPage(): JSX.Element {
  const usuario = useAuthStore((s) => s.usuario);
  const empresaId = usuario?.empresaId ?? null;
  const [faltantes, setFaltantes] = useState<TipoRequisito[]>([]);

  const empresaQuery = useQuery({
    queryKey: ["/empresas", empresaId],
    enabled: empresaId != null,
    queryFn: async () =>
      (await api.get<Empresa>(`/empresas/${empresaId}`)).data,
  });

  const headerEstadoLabel = useMemo(() => {
    if (!empresaQuery.data) return null;
    return ESTADO_EMPRESA_LABELS[empresaQuery.data.estado];
  }, [empresaQuery.data]);

  if (empresaId == null) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Building2 className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Mi empresa</h1>
        </div>
        <EmptyState
          title="Tu cuenta no está vinculada a una empresa"
          description="Solicita al coordinador que vincule tu cuenta con el registro de tu empresa para poder gestionarla aquí."
        />
      </div>
    );
  }

  if (empresaQuery.isLoading) {
    return (
      <div className="flex items-center text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando empresa...
      </div>
    );
  }

  if (empresaQuery.isError || !empresaQuery.data) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Building2 className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Mi empresa</h1>
        </div>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>No se pudo cargar la empresa</AlertTitle>
          <AlertDescription>
            {empresaQuery.error ? extractApiMessage(empresaQuery.error) : "Intenta de nuevo."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const empresa = empresaQuery.data;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Building2 className="h-7 w-7 text-primary mt-1" />
          <div>
            <h1 className="text-2xl font-bold leading-tight">{empresa.razonSocial}</h1>
            <p className="text-sm text-muted-foreground">
              NIT {empresa.nit} · {empresa.ciudad}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge kind="empresa" value={empresa.estado} />
          {headerEstadoLabel && (
            <span className="text-xs text-muted-foreground">{headerEstadoLabel}</span>
          )}
        </div>
      </div>

      <Tabs defaultValue="datos">
        <TabsList>
          <TabsTrigger value="datos">Datos generales</TabsTrigger>
          <TabsTrigger value="documentos">Documentos legales</TabsTrigger>
          <TabsTrigger value="estado">Estado de aprobación</TabsTrigger>
        </TabsList>
        <TabsContent value="datos" className="mt-4">
          <DatosGeneralesTab empresa={empresa} />
        </TabsContent>
        <TabsContent value="documentos" className="mt-4">
          <DocumentosLegalesTab empresaId={empresa.id} onChecklistChange={setFaltantes} />
        </TabsContent>
        <TabsContent value="estado" className="mt-4">
          <EstadoAprobacionTab empresa={empresa} faltantes={faltantes} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
