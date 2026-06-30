import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  KeyRound,
  Loader2,
  PlusCircle,
  ShieldCheck,
  ShieldOff,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { api, extractApiMessage } from "@/lib/api";
import { ROL_LABELS } from "@/lib/enum-labels";
import type { Rol } from "@/lib/types";

interface UsuarioAdmin {
  id: string;
  email: string;
  nombres: string;
  apellidos: string;
  roles: Rol[];
  estudianteId: number | null;
  empresaId: number | null;
  activo: boolean;
  ultimoLogin: string | null;
  createdAt: string;
  updatedAt: string;
}

const ROLES_DISPONIBLES: Rol[] = ["ADMIN", "COORDINADOR", "ESTUDIANTE", "DOCENTE", "TUTOR", "MCP_AGENT"];

export function UsuariosAdminPage(): JSX.Element {
  const qc = useQueryClient();

  const lista = useQuery({
    queryKey: ["/admin/usuarios"],
    queryFn: async () => (await api.get<UsuarioAdmin[]>("/admin/usuarios")).data,
  });

  const setActivo = useMutation({
    mutationFn: async ({ id, activo }: { id: string; activo: boolean }) =>
      api.post(`/admin/usuarios/${id}/${activo ? "activar" : "desactivar"}`),
    onSuccess: () => {
      toast.success("Estado actualizado");
      qc.invalidateQueries({ queryKey: ["/admin/usuarios"] });
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  const cambiarRoles = useMutation({
    mutationFn: async ({ id, roles }: { id: string; roles: Rol[] }) =>
      api.put(`/admin/usuarios/${id}/roles`, { roles }),
    onSuccess: () => {
      toast.success("Roles actualizados");
      qc.invalidateQueries({ queryKey: ["/admin/usuarios"] });
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  const resetPwd = useMutation({
    mutationFn: async ({ id, password }: { id: string; password: string }) =>
      api.post(`/admin/usuarios/${id}/reset-password`, { password }),
    onSuccess: () => toast.success("Contraseña reseteada"),
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Usuarios"
        description="Administra las cuentas del sistema: roles, vinculaciones, activación y contraseñas."
        icon={Users}
        actions={<CrearUsuarioDialog onCreated={() => qc.invalidateQueries({ queryKey: ["/admin/usuarios"] })} />}
      />

      {lista.isLoading ? (
        <div className="flex items-center justify-center rounded-2xl border border-dashed p-12 text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" /> Cargando usuarios...
        </div>
      ) : (lista.data ?? []).length === 0 ? (
        <EmptyState title="Sin usuarios" description="Aún no se han creado usuarios en el sistema." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Vinculaciones</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lista.data!.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="font-medium">{u.nombres} {u.apellidos}</div>
                      <div className="text-xs text-muted-foreground">{u.email}</div>
                    </TableCell>
                    <TableCell>
                      <RolesEditor
                        roles={u.roles}
                        onChange={(roles) => cambiarRoles.mutate({ id: u.id, roles })}
                      />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {u.estudianteId != null && <div>Estudiante #{u.estudianteId}</div>}
                      {u.empresaId != null && <div>Empresa #{u.empresaId}</div>}
                      {u.estudianteId == null && u.empresaId == null && "—"}
                    </TableCell>
                    <TableCell>
                      {u.activo ? (
                        <Badge variant="success">
                          <ShieldCheck className="h-3 w-3" /> Activo
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <ShieldOff className="h-3 w-3" /> Inactivo
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-1">
                        <ResetPwdDialog usuario={u} onReset={(pwd) => resetPwd.mutate({ id: u.id, password: pwd })} />
                        <Button
                          size="sm"
                          variant={u.activo ? "outline" : "default"}
                          onClick={() => setActivo.mutate({ id: u.id, activo: !u.activo })}
                          disabled={setActivo.isPending}
                        >
                          {u.activo ? "Desactivar" : "Activar"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function RolesEditor({ roles, onChange }: { roles: Rol[]; onChange: (r: Rol[]) => void }): JSX.Element {
  const toggle = (r: Rol) => {
    const set = new Set(roles);
    if (set.has(r)) set.delete(r);
    else set.add(r);
    onChange(Array.from(set));
  };
  return (
    <div className="flex flex-wrap gap-1">
      {ROLES_DISPONIBLES.map((r) => {
        const active = roles.includes(r);
        return (
          <button
            key={r}
            type="button"
            onClick={() => toggle(r)}
            className={
              "rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider transition " +
              (active
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-primary-soft hover:text-primary")
            }
          >
            {ROL_LABELS[r] ?? r}
          </button>
        );
      })}
    </div>
  );
}

function ResetPwdDialog({
  usuario,
  onReset,
}: {
  usuario: UsuarioAdmin;
  onReset: (pwd: string) => void;
}): JSX.Element {
  const [open, setOpen] = useState(false);
  const [pwd, setPwd] = useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" aria-label="Resetear contraseña">
          <KeyRound className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resetear contraseña</DialogTitle>
          <DialogDescription>
            Asigna una contraseña temporal a <strong>{usuario.nombres} {usuario.apellidos}</strong>.
            El usuario debe cambiarla al iniciar sesión.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Nueva contraseña</Label>
          <Input
            type="text"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            placeholder="Mínimo 8 caracteres"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button
            disabled={pwd.length < 8}
            onClick={() => {
              onReset(pwd);
              setPwd("");
              setOpen(false);
            }}
          >
            Resetear
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CrearUsuarioDialog({ onCreated }: { onCreated: () => void }): JSX.Element {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [password, setPassword] = useState("");
  const [roles, setRoles] = useState<Rol[]>([]);

  const crear = useMutation({
    mutationFn: async () =>
      api.post("/admin/usuarios", { email, nombres, apellidos, password, roles }),
    onSuccess: () => {
      toast.success("Usuario creado");
      setOpen(false);
      setEmail(""); setNombres(""); setApellidos(""); setPassword(""); setRoles([]);
      onCreated();
    },
    onError: (e) => toast.error(extractApiMessage(e)),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="gradient">
          <PlusCircle className="h-4 w-4" /> Nuevo usuario
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear usuario</DialogTitle>
          <DialogDescription>Define los datos básicos y al menos un rol.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Correo</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Nombres</Label>
              <Input value={nombres} onChange={(e) => setNombres(e.target.value)} />
            </div>
            <div>
              <Label>Apellidos</Label>
              <Input value={apellidos} onChange={(e) => setApellidos(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Contraseña inicial</Label>
            <Input type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" />
          </div>
          <div>
            <Label className="mb-1.5 block">Roles</Label>
            <RolesEditor roles={roles} onChange={setRoles} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button
            variant="gradient"
            disabled={
              crear.isPending || !email || !nombres || !apellidos || password.length < 8 || roles.length === 0
            }
            onClick={() => crear.mutate()}
          >
            {crear.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Crear
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
