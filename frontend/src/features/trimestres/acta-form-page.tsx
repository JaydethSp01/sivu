import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Loader2, PenLine, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { api, extractApiMessage } from "@/lib/api";
import { TIPO_REUNION_LABELS } from "@/lib/enum-labels";
import type {
  ActaAsistente,
  ActaReunionRequest,
  ActaReunionResponse,
  ActaTema,
  ParteFirmaTrimestre,
  TipoReunion,
} from "@/lib/types";

export function ActaFormPage(): JSX.Element {
  const { convenioId, trimestreId, id } = useParams();
  const isEdit = !!id && id !== "new";
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [numero, setNumero] = useState<number>(1);
  const [fecha, setFecha] = useState<string>("");
  const [hora, setHora] = useState<string>("");
  const [lugar, setLugar] = useState<string>("");
  const [asunto, setAsunto] = useState<string>("");
  const [tipo, setTipo] = useState<TipoReunion>("SEGUIMIENTO");
  const [modalidad, setModalidad] = useState<"VIRTUAL" | "PRESENCIAL">("PRESENCIAL");
  const [observaciones, setObservaciones] = useState("");
  const [asistentes, setAsistentes] = useState<ActaAsistente[]>([]);
  const [temas, setTemas] = useState<ActaTema[]>([]);

  const detail = useQuery({
    queryKey: ["/actas", id],
    enabled: isEdit,
    queryFn: async () => (await api.get<ActaReunionResponse>(`/actas/${id}`)).data,
  });

  useEffect(() => {
    if (detail.data) {
      const d = detail.data;
      setNumero(d.numero);
      setFecha(d.fecha);
      setHora(d.hora ?? "");
      setLugar(d.lugar ?? "");
      setAsunto(d.asunto ?? "");
      setTipo(d.tipoReunion);
      setModalidad(d.modalidad ?? "PRESENCIAL");
      setObservaciones(d.observaciones ?? "");
      setAsistentes(d.asistentes.map((a) => ({ ...a })));
      setTemas(d.temas.map((t) => ({ ...t })));
    }
  }, [detail.data]);

  const save = useMutation({
    mutationFn: async () => {
      const payload: ActaReunionRequest = {
        numero,
        fecha,
        hora: hora || null,
        lugar: lugar || null,
        asunto: asunto || null,
        tipoReunion: tipo,
        modalidad,
        asistentes,
        observaciones: observaciones || null,
        temas: temas.map((t, i) => ({ ...t, orden: t.orden ?? i })),
      };
      if (isEdit) return api.put<ActaReunionResponse>(`/actas/${id}`, payload);
      return api.post<ActaReunionResponse>(`/trimestres/${trimestreId}/actas`, payload);
    },
    onSuccess: (res) => {
      toast.success(isEdit ? "Acta actualizada" : "Acta creada");
      qc.invalidateQueries({ queryKey: ["/trimestres/actas", trimestreId] });
      qc.invalidateQueries({ queryKey: ["/convenios/trimestres", Number(convenioId)] });
      navigate(`/convenios/${convenioId}/trimestres/${trimestreId}/actas/${res.data.id}`);
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  const firmar = useMutation({
    mutationFn: async (parte: ParteFirmaTrimestre) =>
      api.patch<ActaReunionResponse>(`/actas/${id}/firmar/${parte}`),
    onSuccess: () => {
      toast.success("Firma registrada");
      qc.invalidateQueries({ queryKey: ["/actas", id] });
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon"
            onClick={() => navigate(`/convenios/${convenioId}/trimestres/${trimestreId}/actas`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{isEdit ? `Editar Acta AC${numero}` : "Nueva acta de reunión"}</h1>
            <p className="text-sm text-muted-foreground">Trimestre #{trimestreId}</p>
          </div>
        </div>
        <Button onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Guardar
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Datos generales</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="space-y-1">
              <Label>Número de acta</Label>
              <Input type="number" min={1} value={numero} onChange={(e) => setNumero(Number(e.target.value))} />
            </div>
            <div className="space-y-1">
              <Label>Fecha</Label>
              <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Hora</Label>
              <Input value={hora} onChange={(e) => setHora(e.target.value)} placeholder="Ej: 10:00 a.m." />
            </div>
            <div className="space-y-1">
              <Label>Tipo de reunión</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as TipoReunion)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(TIPO_REUNION_LABELS) as TipoReunion[]).map((k) => (
                    <SelectItem key={k} value={k}>{TIPO_REUNION_LABELS[k]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Modalidad</Label>
              <Select value={modalidad} onValueChange={(v) => setModalidad(v as "VIRTUAL" | "PRESENCIAL")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PRESENCIAL">Presencial</SelectItem>
                  <SelectItem value="VIRTUAL">Virtual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <Label>Lugar</Label>
              <Input value={lugar} onChange={(e) => setLugar(e.target.value)} placeholder="Aula, oficina, virtual..." />
            </div>
            <div className="space-y-1">
              <Label>Asunto</Label>
              <Input value={asunto} onChange={(e) => setAsunto(e.target.value)} placeholder="Asunto principal de la reunión" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Asistentes</CardTitle>
            <Button size="sm" onClick={() => setAsistentes((a) => [...a, { nombre: "", rol: "", correo: "" }])}>
              <Plus className="h-4 w-4" /> Agregar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {asistentes.length === 0 && <p className="text-sm text-muted-foreground">Sin asistentes.</p>}
          {asistentes.map((a, idx) => (
            <div key={idx} className="grid gap-2 md:grid-cols-[2fr_1fr_2fr_auto]">
              <Input value={a.nombre} onChange={(e) => setAsistentes((all) => all.map((x, i) => i === idx ? { ...x, nombre: e.target.value } : x))} placeholder="Nombre" />
              <Input value={a.rol ?? ""} onChange={(e) => setAsistentes((all) => all.map((x, i) => i === idx ? { ...x, rol: e.target.value } : x))} placeholder="Rol" />
              <Input value={a.correo ?? ""} onChange={(e) => setAsistentes((all) => all.map((x, i) => i === idx ? { ...x, correo: e.target.value } : x))} placeholder="Correo" />
              <Button size="icon" variant="ghost" onClick={() => setAsistentes((all) => all.filter((_, i) => i !== idx))}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Aspectos de la reunión</CardTitle>
            <Button size="sm" onClick={() => setTemas((t) => [...t, { tema: "", observaciones: "" }])}>
              <Plus className="h-4 w-4" /> Agregar tema
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {temas.length === 0 && <p className="text-sm text-muted-foreground">Sin temas.</p>}
          {temas.map((t, idx) => (
            <div key={idx} className="grid gap-2 md:grid-cols-[1fr_2fr_auto]">
              <Input
                value={t.tema}
                onChange={(e) => setTemas((all) => all.map((x, i) => i === idx ? { ...x, tema: e.target.value } : x))}
                placeholder="Tema tratado"
              />
              <Textarea
                rows={2}
                value={t.observaciones ?? ""}
                onChange={(e) => setTemas((all) => all.map((x, i) => i === idx ? { ...x, observaciones: e.target.value } : x))}
                placeholder="Observaciones / compromisos"
              />
              <Button size="icon" variant="ghost" onClick={() => setTemas((all) => all.filter((_, i) => i !== idx))}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Otras observaciones</CardTitle></CardHeader>
        <CardContent>
          <Textarea rows={4} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
        </CardContent>
      </Card>

      {isEdit && detail.data && (
        <Card>
          <CardHeader><CardTitle>Firmas del acta</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3">
              <FirmaButton firmado={detail.data.firmadoEstudiante} parte="ESTUDIANTE" titulo="Estudiante" disabled={firmar.isPending} onSign={(p) => firmar.mutate(p)} />
              <FirmaButton firmado={detail.data.firmadoTutor} parte="TUTOR" titulo="Tutor empresarial" disabled={firmar.isPending} onSign={(p) => firmar.mutate(p)} />
              <FirmaButton firmado={detail.data.firmadoProfesor} parte="PROFESOR" titulo="Profesor" disabled={firmar.isPending} onSign={(p) => firmar.mutate(p)} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function FirmaButton({ firmado, parte, titulo, disabled, onSign }: {
  firmado: boolean;
  parte: ParteFirmaTrimestre;
  titulo: string;
  disabled: boolean;
  onSign: (p: ParteFirmaTrimestre) => void;
}): JSX.Element {
  if (firmado) {
    return (
      <div className="rounded-md border border-success/50 bg-success/10 px-3 py-3 text-success font-medium text-sm text-center">
        {titulo} · Firmado
      </div>
    );
  }
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button className="w-full" disabled={disabled}>
          <PenLine className="h-4 w-4" /> Firmar como {titulo.toLowerCase()}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Firmar como {titulo.toLowerCase()}</AlertDialogTitle>
          <AlertDialogDescription>Esta acción es irreversible.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={(e) => { e.preventDefault(); onSign(parte); }}>
            Confirmar firma
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
