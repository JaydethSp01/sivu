import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, GraduationCap, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/combobox";
import { api, extractApiMessage } from "@/lib/api";
import type { Convenio, Empresa, Estudiante, PageResponse, Tutor } from "@/lib/types";

/**
 * Asignación de práctica (Coformación).
 * COORDINADOR/ADMIN vincula un estudiante con una empresa, asignándole tutor
 * académico y tutor empresarial y la vigencia de la práctica. Crea el convenio
 * vía POST /api/v1/convenios.
 */
export function AsignarPracticaPage(): JSX.Element {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [estudianteId, setEstudianteId] = useState<number | null>(null);
  const [empresaId, setEmpresaId] = useState<number | null>(null);
  const [tutorAcademicoId, setTutorAcademicoId] = useState<number | null>(null);
  const [tutorEmpresarialId, setTutorEmpresarialId] = useState<number | null>(null);
  const [fechaInicio, setFechaInicio] = useState<string>("");
  const [fechaFin, setFechaFin] = useState<string>("");

  const estudiantes = useQuery({
    queryKey: ["/estudiantes", "asignar-practica"],
    queryFn: async () =>
      (
        await api.get<PageResponse<Estudiante>>("/estudiantes", {
          params: { estado: "ACTIVO", page: 0, size: 500, sort: "apellidos,asc" },
        })
      ).data.content,
  });

  const empresas = useQuery({
    queryKey: ["/empresas", "asignar-practica"],
    queryFn: async () =>
      (
        await api.get<PageResponse<Empresa>>("/empresas", {
          params: { estado: "ACTIVA", page: 0, size: 500, sort: "razonSocial,asc" },
        })
      ).data.content,
  });

  const academicos = useQuery({
    queryKey: ["/tutores", "academicos-activos", "asignar-practica"],
    queryFn: async () =>
      (
        await api.get<PageResponse<Tutor>>("/tutores", {
          params: { tipo: "ACADEMICO", estado: "ACTIVO", page: 0, size: 500 },
        })
      ).data.content,
  });

  const empresariales = useQuery({
    queryKey: ["/tutores", "empresariales-activos", empresaId],
    enabled: !!empresaId,
    queryFn: async () =>
      (
        await api.get<PageResponse<Tutor>>("/tutores", {
          params: { tipo: "EMPRESARIAL", estado: "ACTIVO", empresaId, page: 0, size: 500 },
        })
      ).data.content,
  });

  const crear = useMutation({
    mutationFn: async () =>
      (
        await api.post<Convenio>("/convenios", {
          estudianteId,
          empresaId,
          tutorAcademicoId,
          tutorEmpresarialId,
          fechaInicio,
          fechaFin,
        })
      ).data,
    onSuccess: (convenio) => {
      toast.success("Práctica asignada");
      qc.invalidateQueries({ queryKey: ["/convenios"] });
      navigate(`/convenios/${convenio.id}`);
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  const valido =
    estudianteId != null && empresaId != null && !!fechaInicio && !!fechaFin && fechaFin >= fechaInicio;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Volver">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader
          title="Asignar práctica"
          description="Vincula un estudiante con una empresa y asigna sus tutores y vigencia. Se creará el convenio de práctica."
          icon={GraduationCap}
        />
      </div>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Datos de la práctica</CardTitle>
          <CardDescription>
            El tutor empresarial se filtra por la empresa seleccionada.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Vinculación */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">Vinculación</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>Estudiante</Label>
                <Combobox
                  items={estudiantes.data ?? []}
                  value={estudianteId}
                  onChange={setEstudianteId}
                  placeholder="Selecciona estudiante"
                  searchPlaceholder="Buscar por nombre o documento..."
                  getKey={(e) => e.id}
                  getLabel={(e) => `${e.nombres} ${e.apellidos}`}
                  getSecondary={(e) => `${e.numeroDocumento} · ${e.programaAcademico}`}
                />
              </div>
              <div className="space-y-1">
                <Label>Empresa</Label>
                <Combobox
                  items={empresas.data ?? []}
                  value={empresaId}
                  onChange={(v) => {
                    setEmpresaId(v);
                    setTutorEmpresarialId(null);
                  }}
                  placeholder="Selecciona empresa"
                  searchPlaceholder="Buscar empresa..."
                  getKey={(e) => e.id}
                  getLabel={(e) => e.razonSocial}
                  getSecondary={(e) => `${e.nit} · ${e.ciudad}`}
                />
              </div>
            </div>
          </div>

          {/* Tutores */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">Tutores de acompañamiento</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Tutor académico</Label>
              <Combobox
                items={academicos.data ?? []}
                value={tutorAcademicoId}
                onChange={setTutorAcademicoId}
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
                value={tutorEmpresarialId}
                onChange={setTutorEmpresarialId}
                placeholder={empresaId ? "Selecciona tutor empresarial" : "Selecciona una empresa primero"}
                searchPlaceholder="Buscar tutor empresarial..."
                getKey={(t) => t.id}
                getLabel={(t) => `${t.nombres} ${t.apellidos}`}
                getSecondary={(t) => t.cargo ?? t.email}
                disabled={!empresaId}
                allowClear
              />
            </div>
          </div>
          </div>

          {/* Vigencia */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">Vigencia de la práctica</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>Fecha de inicio</Label>
                <Input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Fecha de fin</Label>
                <Input
                  type="date"
                  value={fechaFin}
                  min={fechaInicio || undefined}
                  onChange={(e) => setFechaFin(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-border/60 pt-4">
            <Button variant="outline" onClick={() => navigate("/convenios")}>
              Cancelar
            </Button>
            <Button onClick={() => crear.mutate()} disabled={!valido || crear.isPending}>
              {crear.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Asignar práctica
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
