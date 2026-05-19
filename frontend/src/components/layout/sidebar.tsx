import { NavLink } from "react-router-dom";
import {
  Building2,
  BookCopy,
  Briefcase,
  ClipboardList,
  FileSignature,
  FileText,
  FileUser,
  GraduationCap,
  Inbox,
  LayoutDashboard,
  ListChecks,
  Send,
  Sparkles,
  Tags,
  UserCog,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import type { Rol } from "@/lib/types";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  label: string | ((roles: Rol[]) => string);
  icon: LucideIcon;
  roles?: Rol[];
}

interface NavGroup {
  label: string;
  items: NavItem[];
  roles?: Rol[];
}

// Helpers para etiquetas dinámicas según el rol del usuario logueado.
function labelEstudiantes(roles: Rol[]): string {
  return roles.includes("EMPRESA") && !roles.includes("ADMIN") && !roles.includes("COORDINADOR")
    ? "Mis practicantes"
    : "Estudiantes";
}
function labelVacantes(roles: Rol[]): string {
  return roles.includes("EMPRESA") && !roles.includes("ADMIN") && !roles.includes("COORDINADOR")
    ? "Mis vacantes"
    : "Vacantes";
}
function labelPracticas(roles: Rol[]): string {
  // "Mis prácticas" para estudiante y empresa (los protagonistas).
  // "Prácticas" para coordinador/admin (no son suyas).
  if (roles.includes("ADMIN") || roles.includes("COORDINADOR")) return "Prácticas";
  return "Mis prácticas";
}
function labelDocumentos(roles: Rol[]): string {
  return roles.includes("EMPRESA") && !roles.includes("ADMIN") && !roles.includes("COORDINADOR")
    ? "Documentos de mi empresa"
    : "Documentos";
}
function labelTutores(roles: Rol[]): string {
  return roles.includes("EMPRESA") && !roles.includes("ADMIN") && !roles.includes("COORDINADOR")
    ? "Mis tutores"
    : "Tutores";
}

const MAIN_ITEMS: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/estudiantes", label: labelEstudiantes, icon: Users, roles: ["ADMIN", "COORDINADOR", "EMPRESA"] },
  // ADMIN/COORDINADOR ven la lista completa; EMPRESA pura va a su propia pantalla "Mi empresa".
  { to: "/empresas", label: "Empresas", icon: Building2, roles: ["ADMIN", "COORDINADOR"] },
  { to: "/mi-empresa", label: "Mi empresa", icon: Building2, roles: ["EMPRESA"] },
  // "Proponer empresa" es acción exclusiva del ESTUDIANTE. Coord/admin reciben la
  // propuesta en "Empresas" (filtro estado=EN_REVISION) para aprobar/rechazar.
  { to: "/empresas/proponer", label: "Proponer empresa", icon: Building2, roles: ["ESTUDIANTE"] },
  { to: "/mi-hoja-vida", label: "Mi Hoja de Vida", icon: FileUser, roles: ["ESTUDIANTE"] },
  { to: "/hoja-vida/bandeja", label: "Bandeja HV (Coformación)", icon: Inbox, roles: ["ADMIN", "COORDINADOR"] },
  { to: "/vacantes", label: labelVacantes, icon: Briefcase },
  { to: "/postulaciones", label: "Postulaciones", icon: Send },
  { to: "/documentos", label: labelDocumentos, icon: FileText },
  { to: "/convenios", label: labelPracticas, icon: FileSignature },
  { to: "/tutores", label: labelTutores, icon: UserCog, roles: ["ADMIN", "COORDINADOR", "EMPRESA", "MCP_AGENT"] },
  { to: "/evaluaciones/new", label: "Evaluaciones", icon: ClipboardList, roles: ["ADMIN", "COORDINADOR", "EMPRESA"] },
  { to: "/matching", label: "Matching", icon: Sparkles, roles: ["ADMIN", "COORDINADOR"] },
];

const GROUPS: NavGroup[] = [
  {
    label: "Catálogos",
    roles: ["ADMIN", "COORDINADOR"],
    items: [
      { to: "/catalogos/modalidades", label: "Modalidades", icon: BookCopy },
      { to: "/catalogos/tipos-requisito", label: "Tipos de requisito", icon: Tags },
      { to: "/catalogos/matriz", label: "Matriz de requisitos", icon: ListChecks },
    ],
  },
];

interface SidebarProps {
  collapsed: boolean;
}

function resolveLabel(item: NavItem, roles: Rol[]): string {
  return typeof item.label === "function" ? item.label(roles) : item.label;
}

function renderItem(item: NavItem, collapsed: boolean, roles: Rol[]): JSX.Element {
  const label = resolveLabel(item, roles);
  return (
    <NavLink
      key={item.to}
      to={item.to}
      end={item.to === "/"}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-accent hover:text-foreground"
        )
      }
      title={collapsed ? label : undefined}
    >
      <item.icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span>{label}</span>}
    </NavLink>
  );
}

export function Sidebar({ collapsed }: SidebarProps): JSX.Element {
  const hasRole = useAuthStore((s) => s.hasRole);
  const usuario = useAuthStore((s) => s.usuario);
  const userRoles: Rol[] = usuario?.roles ?? [];
  const items = MAIN_ITEMS.filter((i) => !i.roles || hasRole(...i.roles));
  const groups = GROUPS.filter((g) => !g.roles || hasRole(...g.roles));

  return (
    <aside
      className={cn(
        "border-r bg-card transition-all duration-200 flex flex-col h-screen sticky top-0",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex items-center gap-2 border-b px-4 h-14">
        <GraduationCap className="h-6 w-6 text-primary shrink-0" />
        {!collapsed && (
          <div className="leading-tight">
            <div className="font-bold text-sm">SIVU</div>
            <div className="text-[10px] text-muted-foreground">Vinculación U.</div>
          </div>
        )}
      </div>
      <nav className="flex-1 overflow-y-auto py-3 space-y-1 px-2">
        {items.map((item) => renderItem(item, collapsed, userRoles))}
        {groups.map((group) => (
          <div key={group.label} className="pt-3">
            {!collapsed && (
              <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {group.label}
              </div>
            )}
            <div className="space-y-1">
              {group.items.map((item) => renderItem(item, collapsed, userRoles))}
            </div>
          </div>
        ))}
      </nav>
      <div className="border-t p-3 text-[10px] text-muted-foreground">
        {!collapsed && <span>v0.1.0 · académico</span>}
      </div>
    </aside>
  );
}
