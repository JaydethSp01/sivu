import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Award,
  ArrowLeft,
  Building2,
  Check,
  CheckCircle2,
  Download,
  FilePlus2,
  GraduationCap,
  Loader2,
  PenLine,
  Plus,
  UserCog,
  User as UserIcon,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/status-badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Combobox } from "@/components/combobox";
import { EmptyState } from "@/components/empty-state";
import { TrimestresSection } from "@/features/trimestres/trimestres-section";
import { api, extractApiMessage } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import type {
  Convenio,
  EstadoConvenio,
  PageResponse,
  ParteFirmaConvenio,
  ResumenEvaluaciones,
  Rol,
  Tutor,
} from "@/lib/types";

function downloadPdf(url: string, filename: string): Promise<void> {
  return api.get(url, { responseType: "blob" }).then((res) => {
    const blob = new Blob([res.data as BlobPart], { type: "application/pdf" });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
  });
}

function AsignarTutoresDialog({ convenio, onChanged }: { convenio: Convenio; onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  const [academicoId, setAcademicoId] = useState<number | null>(convenio.tutorAcademicoId);
  const [empresarialId, setEmpresarialId] = useState<number | null>(convenio.tutorEmpresarialId);

  const academicos = useQuery({
    queryKey: ["/tutores", "academicos-activos"],
    enabled: open,
    queryFn: async () =>
      (
        await api.get<PageResponse<Tutor>>("/tutores", {
          params: { tipo: "ACADEMICO", estado: "ACTIVO", page: 0, size: 200 },
        })
      ).data.content,
  });
  const empresariales = useQuery({
    queryKey: ["/tutores", "empresariales-activos", convenio.empresaId],
    enabled: open,
    queryFn: async () =>
      (
        await api.get<PageResponse<Tutor>>("/tutores", {
          params: {
            tipo: "EMPRESARIAL",
            estado: "ACTIVO",
            empresaId: convenio.empresaId,
            page: 0,
            size: 200,
          },
        })
      ).data.content,
  });

  const mut = useMutation({
    mutationFn: async () =>
      api.patch<Convenio>(`/convenios/${convenio.id}/tutores`, {
        tutorAcademicoId: academicoId,
        tutorEmpresarialId: empresarialId,
      }),
    onSuccess: () => {
      toast.success("Tutores asignados");
      setOpen(false);
      onChanged();
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline"><UserCog className="h-4 w-4" />Asignar tutores</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Asignar tutores al convenio</DialogTitle>
          <DialogDescription>Académico (universidad) y empresarial (empresa).</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Tutor académico</Label>
            <Combobox
              items={academicos.data ?? []}
              value={academicoId}
              onChange={setAcademicoId}
              placeholder="Selecciona tutor académico"
              searchPlaceholder="Buscar tutor académico..."
              getKey={(t) => t.id}
              getLabel={(t) => `${t.nombres} ${t.apellidos}`}
              getSecondary={(t) => t.dependencia ?? t.email}
              allowClear
            />
          </div>
          <div className="space-y-1">
            <Label>Tutor empresarial</Label>
            <Combobox
              items={empresariales.data ?? []}
              value={empresarialId}
              onChange={setEmpresarialId}
              placeholder="Selecciona tutor empresarial"
              searchPlaceholder="Buscar tutor empresarial..."
              getKey={(t) => t.id}
              getLabel={(t) => `${t.nombres} ${t.apellidos}`}
              getSecondary={(t) => t.cargo ?? t.email}
              allowClear
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={() => mut.mutate()} disabled={mut.isPending}>
            {mut.isPending && <Loader2 className="h-4 w-4 animate-spin" />}Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FinalizarDialog({ convenio, onChanged }: { convenio: Convenio; onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  const [calificacion, setCalificacion] = useState<string>("0");

  const mut = useMutation({
    mutationFn: async () =>
      api.patch<Convenio>(`/convenios/${convenio.id}/finalizar`, {
        calificacionFinal: Number(calificacion),
      }),
    onSuccess: () => {
      toast.success("Convenio finalizado");
      setOpen(false);
      onChanged();
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button><CheckCircle2 className="h-4 w-4" />Finalizar práctica</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Finalizar la práctica</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción registra la calificación final y cambia el estado del convenio a <strong>FINALIZADO</strong>.
            Después podrás emitir el certificado.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-1">
          <Label>Calificación final (0-5)</Label>
          <Input
            type="number"
            min={0}
            max={5}
            step="0.1"
            value={calificacion}
            onChange={(e) => setCalificacion(e.target.value)}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={(e) => { e.preventDefault(); mut.mutate(); }} disabled={mut.isPending}>
            {mut.isPending && <Loader2 className="h-4 w-4 animate-spin" />}Finalizar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

interface ParteFirmaConfig {
  parte: ParteFirmaConvenio;
  titulo: string;
  rolesPermitidos: Rol[];
  icon: JSX.Element;
}

const PARTES_FIRMA: ParteFirmaConfig[] = [
  {
    parte: "ESTUDIANTE",
    titulo: "Estudiante",
    rolesPermitidos: ["ESTUDIANTE", "ADMIN"],
    icon: <UserIcon className="h-4 w-4" />,
  },
  {
    parte: "EMPRESA",
    titulo: "Empresa",
    rolesPermitidos: ["EMPRESA", "ADMIN"],
    icon: <Building2 className="h-4 w-4" />,
  },
  {
    parte: "UNIVERSIDAD",
    titulo: "Universidad",
    rolesPermitidos: ["COORDINADOR", "ADMIN"],
    icon: <GraduationCap className="h-4 w-4" />,
  },
];

const ORDEN_FIRMA: ParteFirmaConvenio[] = ["ESTUDIANTE", "EMPRESA", "UNIVERSIDAD"];

function parteFirmada(estado: EstadoConvenio, parte: ParteFirmaConvenio): boolean {
  if (
    estado === "ACTIVO" ||
    estado === "FINALIZADO" ||
    estado === "CANCELADO" ||
    estado === "FIRMADO_UNIVERSIDAD"
  ) {
    return true;
  }
  if (parte === "ESTUDIANTE") {
    return (
      estado === "FIRMADO_ESTUDIANTE" ||
      estado === "FIRMADO_EMPRESA"
    );
  }
  if (parte === "EMPRESA") {
    return estado === "FIRMADO_EMPRESA";
  }
  return false;
}

function parteEnTurno(estado: EstadoConvenio, parte: ParteFirmaConvenio): boolean {
  if (estado === "BORRADOR") return parte === "ESTUDIANTE";
  if (estado === "FIRMADO_ESTUDIANTE") return parte === "EMPRESA";
  if (estado === "FIRMADO_EMPRESA") return parte === "UNIVERSIDAD";
  return false;
}

function BotonFirmar({
  convenio,
  config,
  onChanged,
}: {
  convenio: Convenio;
  config: ParteFirmaConfig;
  onChanged: () => void;
}): JSX.Element {
  const [open, setOpen] = useState(false);
  const hasRole = useAuthStore((s) => s.hasRole);

  const firmada = parteFirmada(convenio.estado, config.parte);
  const enTurno = parteEnTurno(convenio.estado, config.parte);
  const tieneRol = hasRole(...config.rolesPermitidos);
  const habilitado = enTurno && tieneRol;

  const mut = useMutation({
    mutationFn: async () =>
      api.patch<Convenio>(`/convenios/${convenio.id}/firmar/${config.parte}`),
    onSuccess: () => {
      toast.success(`Firmado como ${config.titulo.toLowerCase()}`);
      setOpen(false);
      onChanged();
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  if (firmada) {
    return (
      <div className="flex items-center justify-center rounded-md border border-success/50 bg-success/10 px-3 py-4 text-success">
        <CheckCircle2 className="h-5 w-5 mr-2" />
        <span className="font-medium text-sm">Firmado</span>
      </div>
    );
  }

  const tooltip = !enTurno
    ? "Esperando firma anterior"
    : !tieneRol
      ? "No tienes permiso para firmar esta parte"
      : undefined;

  const button = (
    <Button
      type="button"
      className="w-full"
      disabled={!habilitado}
      title={tooltip}
    >
      <PenLine className="h-4 w-4" />
      Firmar como {config.titulo.toLowerCase()}
    </Button>
  );

  if (!habilitado) return button;

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{button}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Firmar como {config.titulo.toLowerCase()}</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción es irreversible. Confirma que has revisado el convenio.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              mut.mutate();
            }}
            disabled={mut.isPending}
          >
            {mut.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirmar firma
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function FirmasSection({ convenio, onChanged }: { convenio: Convenio; onChanged: () => void }): JSX.Element {
  const ordenIdx = ORDEN_FIRMA.indexOf(
    convenio.estado === "BORRADOR"
      ? "ESTUDIANTE"
      : convenio.estado === "FIRMADO_ESTUDIANTE"
        ? "EMPRESA"
        : "UNIVERSIDAD"
  );
  return (
    <Card>
      <CardHeader>
        <CardTitle>Firmas del convenio</CardTitle>
        <CardDescription>
          Las tres partes deben firmar en orden: estudiante, empresa y universidad.
          {ordenIdx >= 0 && convenio.estado !== "ACTIVO" && convenio.estado !== "FINALIZADO" && convenio.estado !== "CANCELADO" && (
            <> Turno actual: <strong>{PARTES_FIRMA[ordenIdx]?.titulo}</strong>.</>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-3">
          {PARTES_FIRMA.map((cfg) => (
            <div key={cfg.parte} className="rounded-md border p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                {cfg.icon}
                {cfg.titulo}
                {parteFirmada(convenio.estado, cfg.parte) && (
                  <Check className="h-4 w-4 text-success ml-auto" aria-label="Firmado" />
                )}
              </div>
              <BotonFirmar convenio={convenio} config={cfg} onChanged={onChanged} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function TutorCard({ title, tutor }: { title: string; tutor: Convenio["tutorAcademico"] }) {
  return (
    <div className="rounded-md border p-3">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{title}</div>
      {tutor ? (
        <div className="mt-1">
          <div className="font-medium text-sm">{tutor.nombreCompleto}</div>
          <div className="text-xs text-muted-foreground">{tutor.email}</div>
        </div>
      ) : (
        <div className="mt-1 text-sm text-muted-foreground">Sin asignar</div>
      )}
    </div>
  );
}

function EvaluacionesSection({ convenioId, canCreate }: { convenioId: number; canCreate: boolean }) {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ["/evaluaciones/resumen", convenioId],
    queryFn: async () =>
      (await api.get<ResumenEvaluaciones>(`/evaluaciones/resumen/${convenioId}`)).data,
  });

  const num = (v: number | string | null | undefined) =>
    v == null ? "—" : Number(v).toFixed(2);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Evaluaciones</CardTitle>
            <CardDescription>Promedios y evaluaciones intermedias / finales.</CardDescription>
          </div>
          {canCreate && (
            <Button size="sm" onClick={() => navigate(`/evaluaciones/new?convenioId=${convenioId}`)}>
              <Plus className="h-4 w-4" /> Registrar evaluación
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />Cargando...
          </div>
        ) : !data || data.totalEvaluaciones === 0 ? (
          <EmptyState
            title="Sin evaluaciones aún"
            description="Cuando se registren evaluaciones, los promedios aparecerán aquí."
          />
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-md border p-3">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Calificación</div>
                <div className="text-2xl font-bold">{num(data.promedioCalificacion)}</div>
              </div>
              <div className="rounded-md border p-3">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Técnicas</div>
                <div className="text-2xl font-bold">{num(data.promedioCompetenciasTecnicas)}</div>
              </div>
              <div className="rounded-md border p-3">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Blandas</div>
                <div className="text-2xl font-bold">{num(data.promedioCompetenciasBlandas)}</div>
              </div>
              <div className="rounded-md border p-3">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Final sugerida</div>
                <div className="text-2xl font-bold">{num(data.calificacionFinalSugerida)}</div>
                <div className="flex gap-1 mt-1">
                  <Badge variant={data.tieneEvaluacionFinalAcademica ? "success" : "muted"}>Acad.</Badge>
                  <Badge variant={data.tieneEvaluacionFinalEmpresarial ? "success" : "muted"}>Emp.</Badge>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              {data.evaluaciones.map((ev) => (
                <div key={ev.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2">
                  <div className="flex flex-col">
                    <div className="text-sm font-medium">
                      {ev.tipo === "INTERMEDIA" ? "Intermedia" : "Final"} ·{" "}
                      {ev.evaluadorTipo === "ACADEMICO" ? "Académico" : "Empresarial"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {ev.tutorNombre ?? `Tutor #${ev.tutorId}`}
                      {ev.fechaEvaluacion && (
                        <> · {format(parseISO(ev.fechaEvaluacion), "PP", { locale: es })}</>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono">{Number(ev.calificacion).toFixed(2)}</span>
                    <Badge variant="outline">{ev.recomendacion}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CertificadoSection({ convenio, onChanged }: { convenio: Convenio; onChanged: () => void }) {
  const emitir = useMutation({
    mutationFn: async () => api.post(`/automatizacion/certificado/${convenio.id}`),
    onSuccess: () => {
      toast.success("Certificado emitido");
      onChanged();
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  const descargar = useMutation({
    mutationFn: async () =>
      downloadPdf(
        `/automatizacion/convenios/${convenio.id}/certificado`,
        `certificado-${convenio.numeroConvenio}.pdf`
      ),
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Award className="h-4 w-4" />Certificado</CardTitle>
        <CardDescription>Certificado de práctica del convenio finalizado.</CardDescription>
      </CardHeader>
      <CardContent>
        {convenio.estado !== "FINALIZADO" ? (
          <p className="text-sm text-muted-foreground">
            Disponible cuando el convenio se finalice con calificación.
          </p>
        ) : convenio.certificadoPdf ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm">
              <span className="font-medium">{convenio.certificadoPdf.nombreOriginal}</span>
              {convenio.calificacionFinal != null && (
                <span className="text-muted-foreground"> · Calificación {Number(convenio.calificacionFinal).toFixed(2)}</span>
              )}
            </div>
            <Button onClick={() => descargar.mutate()} disabled={descargar.isPending}>
              {descargar.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Descargar certificado
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              Aún no se ha emitido el certificado.
            </p>
            <Button onClick={() => emitir.mutate()} disabled={emitir.isPending}>
              {emitir.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FilePlus2 className="h-4 w-4" />}
              Emitir certificado
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ConvenioDetailPage(): JSX.Element {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const hasRole = useAuthStore((s) => s.hasRole);
  const canManageTutores = hasRole("ADMIN", "COORDINADOR");
  const canFinalizar = hasRole("ADMIN", "COORDINADOR");
  const canCreateEvaluacion = hasRole("COORDINADOR", "EMPRESA", "ADMIN");

  const { data, isLoading } = useQuery({
    queryKey: ["/convenios", id],
    queryFn: async () => (await api.get<Convenio>(`/convenios/${id}`)).data,
    enabled: !!id,
  });

  const descargaPdf = useMutation({
    mutationFn: async () => {
      const res = await api.get(`/automatizacion/convenios/${id}/pdf`, { responseType: "blob" });
      const blob = new Blob([res.data as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["/convenios", id] });
  };

  if (isLoading) {
    return (
      <div className="flex items-center text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />Cargando...
      </div>
    );
  }
  if (!data) return <div>No encontrado</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <h1 className="text-2xl font-bold">Convenio {data.numeroConvenio}</h1>
            <p className="text-sm text-muted-foreground">
              {data.estudiante?.nombreCompleto} ↔ {data.empresa?.razonSocial}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => descargaPdf.mutate()}
            disabled={descargaPdf.isPending || !data.documentoPdfId}
          >
            {descargaPdf.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            PDF formalización
          </Button>
          {canManageTutores && <AsignarTutoresDialog convenio={data} onChanged={refresh} />}
          {canFinalizar && data.estado === "ACTIVO" && (
            <FinalizarDialog convenio={data} onChanged={refresh} />
          )}
        </div>
      </div>

      <FirmasSection convenio={data} onChanged={refresh} />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader><CardTitle>Detalle</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Estado</span><StatusBadge kind="convenio" value={data.estado} /></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Vacante</span><span>{data.vacante?.titulo ?? "—"}</span></div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Vigencia</span>
              <span>
                {format(parseISO(data.fechaInicio), "PP", { locale: es })} → {format(parseISO(data.fechaFin), "PP", { locale: es })}
              </span>
            </div>
            <div className="flex justify-between"><span className="text-muted-foreground">Postulación</span><span>{data.postulacion?.referencia ?? "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">PDF formalización</span><span>{data.documentoPdf?.nombreOriginal ?? "—"}</span></div>
            {data.calificacionFinal != null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Calificación final</span>
                <span className="font-bold">{Number(data.calificacionFinal).toFixed(2)}</span>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Tutores</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <TutorCard title="Tutor académico" tutor={data.tutorAcademico} />
            <TutorCard title="Tutor empresarial" tutor={data.tutorEmpresarial} />
          </CardContent>
        </Card>
      </div>

      <TrimestresSection convenioId={data.id} />
      <EvaluacionesSection convenioId={data.id} canCreate={canCreateEvaluacion} />
      <CertificadoSection convenio={data} onChanged={refresh} />
    </div>
  );
}
