import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  FileUp,
  Image as ImageIcon,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/page-header";
import { api, extractApiMessage } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { cn, formatBytes } from "@/lib/utils";
import { TIPO_DOCUMENTO_LABELS } from "@/lib/enum-labels";
import type {
  Documento,
  Estudiante,
  PageResponse,
  Postulacion,
  TipoDocumentoSoporte,
} from "@/lib/types";

const TIPOS: TipoDocumentoSoporte[] = [
  "HOJA_VIDA",
  "DOCUMENTO_IDENTIDAD",
  "CERTIFICADO_ACADEMICO",
  "EPS",
  "FORMALIZACION",
  "CERTIFICADO",
  "OTRO",
];

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPTED_MIME = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const ACCEPT_ATTR = ".pdf,.jpg,.jpeg,.png,.docx";

function iconForMime(mime: string): JSX.Element {
  if (mime.startsWith("image/")) {
    return <ImageIcon className="h-6 w-6" />;
  }
  return <FileText className="h-6 w-6" />;
}

function validarArchivo(file: File | null): string | null {
  if (!file) return "Selecciona un archivo";
  if (file.size > MAX_BYTES) return `El archivo supera 10MB (${formatBytes(file.size)})`;
  if (!ACCEPTED_MIME.includes(file.type)) {
    return "Tipo no permitido. Solo PDF, JPG, PNG o DOCX.";
  }
  return null;
}

interface DropzoneProps {
  archivo: File | null;
  onChange: (f: File | null) => void;
  error: string | null;
}

function Dropzone({ archivo, onChange, error }: DropzoneProps): JSX.Element {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const pick = () => inputRef.current?.click();
  const handle = (file: File | null) => onChange(file);

  return (
    <div className="space-y-2">
      <Label>Archivo</Label>
      <button
        type="button"
        onClick={pick}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handle(e.dataTransfer.files?.[0] ?? null);
        }}
        className={cn(
          "w-full rounded-2xl border-2 border-dashed p-6 sm:p-8 text-center transition-all",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          dragOver
            ? "border-primary bg-primary-soft"
            : error
              ? "border-destructive/60 bg-destructive/5"
              : archivo
                ? "border-primary/50 bg-primary-soft/60"
                : "border-border/80 bg-muted/30 hover:bg-muted/50"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_ATTR}
          className="sr-only"
          onChange={(e) => handle(e.target.files?.[0] ?? null)}
        />
        {archivo ? (
          <div className="flex items-center justify-center gap-3 text-left">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              {iconForMime(archivo.type)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-medium truncate">{archivo.name}</div>
              <div className="text-xs text-muted-foreground">
                {formatBytes(archivo.size)} · listo para subir
              </div>
            </div>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
              aria-label="Quitar archivo"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <FileUp className="h-6 w-6" />
            </div>
            <div>
              <p className="font-display text-base font-semibold">
                Toca o arrastra tu archivo aquí
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PDF, JPG, PNG o DOCX · máximo 10MB
              </p>
            </div>
          </div>
        )}
      </button>
      {error && <p className="text-sm font-medium text-destructive">{error}</p>}
    </div>
  );
}

function NuevoDocumentoForm(): JSX.Element {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const usuario = useAuthStore((s) => s.usuario);
  const hasRole = useAuthStore((s) => s.hasRole);
  const isStudent = hasRole("ESTUDIANTE") && !hasRole("ADMIN", "COORDINADOR");

  const [archivo, setArchivo] = useState<File | null>(null);
  const [archivoError, setArchivoError] = useState<string | null>(null);
  const [tipo, setTipo] = useState<TipoDocumentoSoporte>("HOJA_VIDA");
  const [estudianteId, setEstudianteId] = useState<number | null>(
    isStudent ? usuario?.estudianteId ?? null : null
  );
  const [postulacionId, setPostulacionId] = useState<number | null>(null);

  const estudiantes = useQuery({
    queryKey: ["/estudiantes", "for-doc-upload"],
    enabled: !isStudent,
    queryFn: async () =>
      (await api.get<PageResponse<Estudiante>>("/estudiantes", {
        params: { page: 0, size: 200 },
      })).data.content,
  });

  const postulaciones = useQuery({
    queryKey: ["/postulaciones", "for-doc-upload", estudianteId],
    enabled: !!estudianteId,
    queryFn: async () =>
      (await api.get<PageResponse<Postulacion>>("/postulaciones", {
        params: { estudianteId, page: 0, size: 200 },
      })).data.content,
  });

  const onArchivoChange = (file: File | null) => {
    setArchivo(file);
    setArchivoError(file ? validarArchivo(file) : null);
  };

  const subir = useMutation({
    mutationFn: async () => {
      if (!archivo) throw new Error("Falta el archivo");
      const formData = new FormData();
      formData.append("archivo", archivo);
      const params: Record<string, string | number> = { tipo };
      if (estudianteId) params.estudianteId = estudianteId;
      if (postulacionId) params.postulacionId = postulacionId;
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

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validarArchivo(archivo);
    if (err) {
      setArchivoError(err);
      return;
    }
    subir.mutate();
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <Card>
        <CardContent className="pt-6 space-y-5">
          <Dropzone archivo={archivo} onChange={onArchivoChange} error={archivoError} />

          <div className="space-y-2">
            <Label htmlFor="doc-tipo">Tipo de documento</Label>
            <Select
              value={tipo}
              onValueChange={(v) => setTipo(v as TipoDocumentoSoporte)}
            >
              <SelectTrigger id="doc-tipo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPOS.map((t) => (
                  <SelectItem key={t} value={t}>
                    {TIPO_DOCUMENTO_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Elige qué tipo de soporte es este archivo.
            </p>
          </div>

          {!isStudent && (
            <div className="space-y-2">
              <Label htmlFor="doc-est">Estudiante (opcional)</Label>
              <Select
                value={estudianteId ? String(estudianteId) : "none"}
                onValueChange={(v) => {
                  setEstudianteId(v === "none" ? null : Number(v));
                  setPostulacionId(null);
                }}
              >
                <SelectTrigger id="doc-est">
                  <SelectValue placeholder="Sin asociar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin asociar</SelectItem>
                  {estudiantes.data?.map((e) => (
                    <SelectItem key={e.id} value={String(e.id)}>
                      {e.nombres} {e.apellidos}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {estudianteId && (postulaciones.data?.length ?? 0) > 0 && (
            <div className="space-y-2">
              <Label htmlFor="doc-post">Postulación relacionada (opcional)</Label>
              <Select
                value={postulacionId ? String(postulacionId) : "none"}
                onValueChange={(v) =>
                  setPostulacionId(v === "none" ? null : Number(v))
                }
              >
                <SelectTrigger id="doc-post">
                  <SelectValue placeholder="Ninguna" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ninguna</SelectItem>
                  {postulaciones.data?.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      #{p.id} · {p.vacanteTitulo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Si este documento es para una postulación específica.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="sticky bottom-0 -mx-4 sm:mx-0 sm:relative bg-background/90 backdrop-blur sm:bg-transparent border-t sm:border-t-0 border-border/60 px-4 py-3 sm:p-0">
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="gradient"
            disabled={subir.isPending || !archivo || !!archivoError}
            className="w-full sm:w-auto"
          >
            {subir.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Subir documento
          </Button>
        </div>
      </div>
    </form>
  );
}

function EditarDocumentoForm({ id }: { id: string }): JSX.Element {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tipo, setTipo] = useState<TipoDocumentoSoporte>("HOJA_VIDA");
  const [nombre, setNombre] = useState("");

  const detail = useQuery({
    queryKey: ["/documentos", id],
    queryFn: async () => (await api.get<Documento>(`/documentos/${id}`)).data,
  });

  useEffect(() => {
    if (detail.data) {
      setTipo(detail.data.tipo);
      setNombre(detail.data.nombreOriginal);
    }
  }, [detail.data]);

  const save = useMutation({
    mutationFn: async () => {
      if (!detail.data) throw new Error("Documento no cargado");
      return api.put<Documento>(`/documentos/${id}`, {
        ...detail.data,
        tipo,
        nombreOriginal: nombre,
      });
    },
    onSuccess: () => {
      toast.success("Documento actualizado");
      qc.invalidateQueries({ queryKey: ["/documentos"] });
      navigate("/documentos");
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  if (detail.isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando...
        </CardContent>
      </Card>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
      className="space-y-5"
    >
      <Card>
        <CardContent className="pt-6 space-y-5">
          {detail.data && (
            <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-muted/30 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
                {iconForMime(detail.data.mimeType)}
              </div>
              <div className="min-w-0 flex-1 text-sm">
                <div className="font-medium truncate">{detail.data.nombreOriginal}</div>
                <div className="text-xs text-muted-foreground">
                  {formatBytes(detail.data.tamanoBytes)} · {detail.data.mimeType}
                </div>
              </div>
              <CheckCircle2 className="h-4 w-4 text-success" />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="edit-tipo">Tipo</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as TipoDocumentoSoporte)}>
              <SelectTrigger id="edit-tipo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPOS.map((t) => (
                  <SelectItem key={t} value={t}>
                    {TIPO_DOCUMENTO_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-nombre">Nombre</Label>
            <input
              id="edit-nombre"
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="sticky bottom-0 -mx-4 sm:mx-0 sm:relative bg-background/90 backdrop-blur sm:bg-transparent border-t sm:border-t-0 border-border/60 px-4 py-3 sm:p-0">
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="gradient"
            disabled={save.isPending}
            className="w-full sm:w-auto"
          >
            {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Guardar cambios
          </Button>
        </div>
      </div>
    </form>
  );
}

export function DocumentoFormPage(): JSX.Element {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  return (
    <div className="space-y-5">
      <PageHeader
        title={isEdit ? "Editar documento" : "Subir documento"}
        description={
          isEdit
            ? "Actualiza el tipo o el nombre del documento."
            : "Sube un soporte: hoja de vida, certificado, EPS, etc. Acepta PDF, JPG, PNG o DOCX hasta 10 MB."
        }
        icon={FileUp}
        actions={
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" /> Volver
          </Button>
        }
      />
      {isEdit && id ? <EditarDocumentoForm id={id} /> : <NuevoDocumentoForm />}
    </div>
  );
}
