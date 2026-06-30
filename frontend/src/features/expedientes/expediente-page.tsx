import { useState } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  Award,
  Building2,
  CalendarRange,
  Download,
  FileText,
  FolderArchive,
  GraduationCap,
  Loader2,
  NotebookPen,
  Search,
  UserCog,
  User as UserIcon,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { api, extractApiMessage } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import type {
  ExpedienteResponse,
  ExpedienteResumenCohorte,
  ExpedienteSeccionDocumento,
  ExpedienteTrimestre,
} from "@/lib/types";

/* --------------------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------------------ */

function fmtFecha(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    return format(parseISO(value), "PP", { locale: es });
  } catch {
    return value;
  }
}

function fmtNota(value: number | null | undefined): string {
  return value == null ? "—" : Number(value).toFixed(2);
}

function descargarDocumento(id: number, nombre: string): Promise<void> {
  return api.get(`/documentos/${id}/descargar`, { responseType: "blob" }).then((res) => {
    const blob = new Blob([res.data as BlobPart]);
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = nombre;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
  });
}

/* --------------------------------------------------------------------------
 * Encabezado: estudiante / convenio / empresa / tutores
 * ------------------------------------------------------------------------ */

function InfoRow({ label, value }: { label: string; value: React.ReactNode }): JSX.Element {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value ?? "—"}</span>
    </div>
  );
}

function ResumenCards({ data }: { data: ExpedienteResponse }): JSX.Element {
  const { estudiante, convenio, empresa, tutores } = data;
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <UserIcon className="h-4 w-4 text-primary" />
            Estudiante
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <InfoRow label="Documento" value={estudiante.numeroDocumento} />
          <InfoRow label="Programa" value={estudiante.programaAcademico} />
          <InfoRow label="Semestre" value={estudiante.semestre ?? "—"} />
          <InfoRow
            label="Estado"
            value={
              estudiante.estado ? (
                <StatusBadge kind="estudiante" value={estudiante.estado} />
              ) : (
                "—"
              )
            }
          />
          <InfoRow label="Email" value={estudiante.email} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarRange className="h-4 w-4 text-primary" />
            Convenio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {convenio ? (
            <>
              <InfoRow label="Número" value={convenio.numeroConvenio} />
              <InfoRow
                label="Estado"
                value={<StatusBadge kind="convenio" value={convenio.estado} />}
              />
              <InfoRow
                label="Vigencia"
                value={`${fmtFecha(convenio.fechaInicio)} → ${fmtFecha(convenio.fechaFin)}`}
              />
              <InfoRow label="Semestre" value={convenio.semestreAcademico} />
              <InfoRow
                label="Continuidad"
                value={convenio.esContinuidad ? "Sí" : "No"}
              />
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              El estudiante aún no tiene un convenio asociado.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4 text-primary" />
            Empresa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {empresa ? (
            <>
              <InfoRow label="Razón social" value={empresa.razonSocial} />
              <InfoRow label="NIT" value={empresa.nit} />
              <InfoRow label="Sector" value={empresa.sector} />
              <InfoRow label="Ciudad" value={empresa.ciudad} />
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Sin empresa contraparte.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <UserCog className="h-4 w-4 text-primary" />
            Tutores
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Tutor académico
            </div>
            <div className="text-sm font-medium">{tutores?.tutorAcademico ?? "Sin asignar"}</div>
          </div>
          <Separator />
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Tutor empresarial
            </div>
            <div className="text-sm font-medium">
              {tutores?.tutorEmpresarial ?? "Sin asignar"}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* --------------------------------------------------------------------------
 * Calificación
 * ------------------------------------------------------------------------ */

function NotaCell({ label, value }: { label: string; value: number | null }): JSX.Element {
  return (
    <div className="rounded-lg border bg-muted/30 p-4 text-center">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold tabular-nums">{fmtNota(value)}</div>
    </div>
  );
}

function CalificacionSection({ data }: { data: ExpedienteResponse }): JSX.Element | null {
  const cal = data.calificacion;
  if (!cal) return null;

  // Escala colombiana 0-5; aprobado >= 3.0 cuando el cálculo está completo.
  const aprobado = cal.notaFinal != null && Number(cal.notaFinal) >= 3.0;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Calificación
            </CardTitle>
            <CardDescription>Notas por corte y nota final consolidada.</CardDescription>
          </div>
          {cal.completa ? (
            <Badge variant={aprobado ? "success" : "destructive"}>
              {aprobado ? "Aprobado" : "No aprobado"}
            </Badge>
          ) : (
            <Badge variant="warning">En curso</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <NotaCell label="Corte 1" value={cal.notaCorte1} />
          <NotaCell label="Corte 2" value={cal.notaCorte2} />
          <NotaCell label="Corte 3" value={cal.notaCorte3} />
          <div className="rounded-lg border-2 border-primary/40 bg-primary-soft p-4 text-center">
            <div className="text-xs uppercase tracking-wide text-primary/80">Nota final</div>
            <div className="mt-1 text-2xl font-bold tabular-nums text-primary">
              {fmtNota(cal.notaFinal)}
            </div>
          </div>
        </div>
        {cal.bloqueada && (
          <p className="text-xs text-muted-foreground">
            La calificación está bloqueada: el proceso fue cerrado y las notas no se recalculan.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

/* --------------------------------------------------------------------------
 * Trimestres (pestañas) + secciones
 * ------------------------------------------------------------------------ */

function SeccionRow({
  icon: Icon,
  titulo,
  estado,
  extra,
}: {
  icon: typeof FileText;
  titulo: string;
  estado: string;
  extra?: React.ReactNode;
}): JSX.Element {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Icon className="h-4 w-4 text-muted-foreground" />
        {titulo}
        {extra}
      </div>
      <StatusBadge kind="expedienteSeccion" value={estado} />
    </div>
  );
}

function firmasResumen(s: ExpedienteSeccionDocumento): string {
  const partes: string[] = [];
  if (s.firmadoEstudiante) partes.push("Estudiante");
  if (s.firmadoTutor) partes.push("Tutor");
  if (s.firmadoProfesor) partes.push("Profesor");
  return partes.length ? `Firmas: ${partes.join(", ")}` : "";
}

function TrimestreContent({ t }: { t: ExpedienteTrimestre }): JSX.Element {
  return (
    <div className="space-y-3">
      <SeccionRow
        icon={FileText}
        titulo={t.planActividades.nombre || "Plan de actividades"}
        estado={t.planActividades.estado}
        extra={
          firmasResumen(t.planActividades) ? (
            <span className="text-xs font-normal text-muted-foreground">
              · {firmasResumen(t.planActividades)}
            </span>
          ) : undefined
        }
      />

      <SeccionRow
        icon={NotebookPen}
        titulo={t.actas.nombre || "Actas de reunión"}
        estado={t.actas.estado}
        extra={
          <span className="text-xs font-normal text-muted-foreground">
            · {t.actas.firmadas}/{t.actas.total} firmadas
          </span>
        }
      />
      {t.actas.items.length > 0 && (
        <div className="ml-6 space-y-1.5">
          {t.actas.items.map((acta) => (
            <div
              key={acta.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-dashed px-3 py-2 text-sm"
            >
              <span className="text-muted-foreground">
                Acta {acta.numero ?? "—"}
                {acta.asunto ? ` · ${acta.asunto}` : ""}
                {acta.fecha ? ` · ${fmtFecha(acta.fecha)}` : ""}
              </span>
              <StatusBadge kind="expedienteSeccion" value={acta.estado} />
            </div>
          ))}
        </div>
      )}

      <SeccionRow
        icon={GraduationCap}
        titulo={t.evaluacionDocente.nombre || "Evaluación docente"}
        estado={t.evaluacionDocente.estado}
      />
      <SeccionRow
        icon={UserCog}
        titulo={t.evaluacionTutor.nombre || "Evaluación del tutor"}
        estado={t.evaluacionTutor.estado}
      />

      {t.informesFinales.length === 0 ? (
        <SeccionRow icon={Award} titulo="Informe final del plan de mejora" estado="NO_INICIADO" />
      ) : (
        t.informesFinales.map((inf) => (
          <SeccionRow
            key={inf.id}
            icon={Award}
            titulo={inf.titulo || "Informe final del plan de mejora"}
            estado={inf.estadoSeccion}
            extra={
              inf.notaPromedio != null ? (
                <span className="text-xs font-normal text-muted-foreground">
                  · Nota {fmtNota(inf.notaPromedio)}
                </span>
              ) : undefined
            }
          />
        ))
      )}
    </div>
  );
}

function TrimestresSection({ data }: { data: ExpedienteResponse }): JSX.Element {
  const trimestres = data.trimestres ?? [];
  return (
    <Card>
      <CardHeader>
        <CardTitle>Trimestres del proceso</CardTitle>
        <CardDescription>
          Estado de cada sección por trimestre: plan, actas, evaluaciones e informe final.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {trimestres.length === 0 ? (
          <EmptyState
            icon={CalendarRange}
            title="Sin trimestres registrados"
            description="Cuando se abran los trimestres del convenio aparecerán aquí con su avance."
          />
        ) : (
          <Tabs defaultValue={String(trimestres[0]?.id)} className="w-full">
            <TabsList className="flex w-full flex-wrap h-auto">
              {trimestres.map((t) => (
                <TabsTrigger key={t.id} value={String(t.id)}>
                  Trimestre {t.numero ?? "—"}
                </TabsTrigger>
              ))}
            </TabsList>
            {trimestres.map((t) => (
              <TabsContent key={t.id} value={String(t.id)} className="mt-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold">
                      Trimestre {t.numero ?? "—"}
                      {t.materiaNucleo ? ` — ${t.materiaNucleo}` : ""}
                    </div>
                  </div>
                  {t.estado && <Badge variant="secondary">{t.estado}</Badge>}
                </div>
                <TrimestreContent t={t} />
              </TabsContent>
            ))}
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}

/* --------------------------------------------------------------------------
 * Documentos descargables
 * ------------------------------------------------------------------------ */

function DocumentosSection({ data }: { data: ExpedienteResponse }): JSX.Element {
  const documentos = data.documentos ?? [];
  const [descargandoId, setDescargandoId] = useState<number | null>(null);

  const descargar = useMutation({
    mutationFn: async ({ id, nombre }: { id: number; nombre: string }) => {
      setDescargandoId(id);
      await descargarDocumento(id, nombre);
    },
    onSettled: () => setDescargandoId(null),
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FolderArchive className="h-5 w-5 text-primary" />
          Documentos y PDFs
        </CardTitle>
        <CardDescription>Soportes y documentos descargables del expediente.</CardDescription>
      </CardHeader>
      <CardContent>
        {documentos.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aún no hay documentos descargables en el expediente.
          </p>
        ) : (
          <div className="space-y-2">
            {documentos.map((doc) => (
              <div
                key={doc.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate text-sm font-medium">{doc.nombreOriginal}</span>
                    <StatusBadge kind="documento" value={doc.estado} />
                  </div>
                  <div className="mt-1 pl-6 text-xs text-muted-foreground">
                    {doc.tipo}
                    {doc.fecha ? ` · ${fmtFecha(doc.fecha)}` : ""}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => descargar.mutate({ id: doc.id, nombre: doc.nombreOriginal })}
                  disabled={descargandoId === doc.id}
                >
                  {descargandoId === doc.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Descargar
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* --------------------------------------------------------------------------
 * Página de detalle: /expedientes/:estudianteId
 * ------------------------------------------------------------------------ */

export function ExpedientePage(): JSX.Element {
  const { estudianteId } = useParams();
  const [searchParams] = useSearchParams();
  const convenioId = searchParams.get("convenioId");
  const navigate = useNavigate();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["/expedientes", estudianteId, convenioId],
    enabled: !!estudianteId,
    queryFn: async () =>
      (
        await api.get<ExpedienteResponse>(`/expedientes/${estudianteId}`, {
          params: convenioId ? { convenioId } : undefined,
        })
      ).data,
  });

  if (isLoading) {
    return (
      <div className="flex items-center text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Cargando expediente...
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
        <EmptyState
          icon={FolderArchive}
          title="No pudimos cargar el expediente"
          description={isError ? extractApiMessage(error) : "El expediente no está disponible."}
        />
      </div>
    );
  }

  const nombreCompleto = `${data.estudiante.nombres} ${data.estudiante.apellidos}`.trim();

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" className="w-fit" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4" />
        Volver
      </Button>

      <PageHeader
        icon={FolderArchive}
        title={`Expediente de ${nombreCompleto}`}
        description="Vista consolidada del proceso de Coformación: convenio, documentos, estados, firmas, notas y PDFs."
        badge={
          data.estadoGeneral ? (
            <StatusBadge kind="convenio" value={data.estadoGeneral} />
          ) : undefined
        }
      />

      <ResumenCards data={data} />
      <CalificacionSection data={data} />
      <TrimestresSection data={data} />
      <DocumentosSection data={data} />
    </div>
  );
}

/* --------------------------------------------------------------------------
 * Página índice: /expedientes (búsqueda + listado por cohorte)
 * ------------------------------------------------------------------------ */

function CohorteLista({ cohorteId }: { cohorteId: number }): JSX.Element {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["/expedientes/cohorte", cohorteId],
    queryFn: async () =>
      (await api.get<ExpedienteResumenCohorte[]>(`/expedientes/cohorte/${cohorteId}`)).data,
  });

  if (isLoading) {
    return (
      <div className="flex items-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Cargando cohorte...
      </div>
    );
  }
  if (isError) {
    return <p className="text-sm text-destructive">{extractApiMessage(error)}</p>;
  }
  const filas = data ?? [];
  if (filas.length === 0) {
    return (
      <EmptyState
        icon={FolderArchive}
        title="Sin expedientes en esta cohorte"
        description="No se encontraron estudiantes para el identificador de cohorte indicado."
      />
    );
  }

  return (
    <div className="space-y-2">
      {filas.map((fila) => (
        <Link
          key={fila.estudianteId}
          to={
            fila.convenioId
              ? `/expedientes/${fila.estudianteId}?convenioId=${fila.convenioId}`
              : `/expedientes/${fila.estudianteId}`
          }
          className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3 transition-colors hover:bg-muted"
        >
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">
              {fila.nombres} {fila.apellidos}
            </div>
            <div className="text-xs text-muted-foreground">
              {fila.numeroDocumento}
              {fila.programaAcademico ? ` · ${fila.programaAcademico}` : ""}
              {fila.numeroConvenio ? ` · ${fila.numeroConvenio}` : ""}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm tabular-nums">
              Nota: <strong>{fmtNota(fila.notaFinal)}</strong>
            </span>
            {fila.estadoGeneral && (
              <StatusBadge kind="convenio" value={fila.estadoGeneral} />
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}

export function ExpedientesIndexPage(): JSX.Element {
  const navigate = useNavigate();
  const hasRole = useAuthStore((s) => s.hasRole);
  const usuario = useAuthStore((s) => s.usuario);

  const esCoordinacion = hasRole("ADMIN", "COORDINADOR");
  const esEstudiantePuro =
    hasRole("ESTUDIANTE") && !hasRole("ADMIN", "COORDINADOR", "DOCENTE", "TUTOR");

  const [estudianteId, setEstudianteId] = useState("");
  const [cohorteInput, setCohorteInput] = useState("");
  const [cohorteId, setCohorteId] = useState<number | null>(null);

  // Un estudiante puro solo ve su propio expediente: redirige directo.
  if (esEstudiantePuro && usuario?.estudianteId != null) {
    return <Navigate to={`/expedientes/${usuario.estudianteId}`} replace />;
  }

  const buscarEstudiante = (): void => {
    const id = Number(estudianteId.trim());
    if (!Number.isInteger(id) || id <= 0) {
      toast.error("Ingresa un ID de estudiante válido.");
      return;
    }
    navigate(`/expedientes/${id}`);
  };

  const buscarCohorte = (): void => {
    const id = Number(cohorteInput.trim());
    if (!Number.isInteger(id) || id <= 0) {
      toast.error("Ingresa un ID de cohorte válido.");
      return;
    }
    setCohorteId(id);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        icon={FolderArchive}
        title="Expediente Digital Unificado"
        description="Consulta el expediente consolidado de un estudiante o lista los expedientes de una cohorte."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Buscar por estudiante</CardTitle>
          <CardDescription>Abre el expediente de un estudiante por su identificador.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-wrap items-end gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              buscarEstudiante();
            }}
          >
            <div className="space-y-1">
              <Label htmlFor="estudianteId">ID de estudiante</Label>
              <Input
                id="estudianteId"
                inputMode="numeric"
                placeholder="Ej: 42"
                value={estudianteId}
                onChange={(e) => setEstudianteId(e.target.value)}
                className="w-40"
              />
            </div>
            <Button type="submit">
              <Search className="h-4 w-4" />
              Ver expediente
            </Button>
          </form>
        </CardContent>
      </Card>

      {esCoordinacion && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Listar por cohorte</CardTitle>
            <CardDescription>
              Resumen de estado general y nota final por estudiante de la cohorte.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form
              className="flex flex-wrap items-end gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                buscarCohorte();
              }}
            >
              <div className="space-y-1">
                <Label htmlFor="cohorteId">ID de cohorte</Label>
                <Input
                  id="cohorteId"
                  inputMode="numeric"
                  placeholder="Ej: 1"
                  value={cohorteInput}
                  onChange={(e) => setCohorteInput(e.target.value)}
                  className="w-40"
                />
              </div>
              <Button type="submit" variant="outline">
                <Search className="h-4 w-4" />
                Listar cohorte
              </Button>
            </form>
            {cohorteId != null && <CohorteLista cohorteId={cohorteId} />}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
