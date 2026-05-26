import { NavLink } from "react-router-dom";
import {
  Building2,
  BookCopy,
  Briefcase,
  CalendarClock,
  ClipboardList,
  Factory,
  FileCog,
  Inbox as InboxIcon,
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
  // El estudiante ES quien hace la práctica; la empresa RECIBE practicantes.
  if (roles.includes("ADMIN") || roles.includes("COORDINADOR")) return "Prácticas";
  if (roles.includes("EMPRESA")) return "Convenios";
  return "Mi práctica";
}
function labelPostulaciones(roles: Rol[]): string {
  if (roles.includes("EMPRESA") && !roles.includes("ADMIN") && !roles.includes("COORDINADOR")) {
    return "Postulaciones recibidas";
  }
  if (roles.includes("ESTUDIANTE") && !roles.includes("ADMIN") && !roles.includes("COORDINADOR") && !roles.includes("EMPRESA")) {
    return "Mis postulaciones";
  }
  return "Postulaciones";
}
function labelEntrevistas(roles: Rol[]): string {
  if (roles.includes("ESTUDIANTE") && !roles.includes("ADMIN") && !roles.includes("COORDINADOR") && !roles.includes("EMPRESA")) {
    return "Mis entrevistas";
  }
  return "Entrevistas";
}
function labelEvaluaciones(roles: Rol[]): string {
  if (roles.includes("EMPRESA") && !roles.includes("ADMIN") && !roles.includes("COORDINADOR")) {
    return "Evaluar practicantes";
  }
  return "Evaluaciones";
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
  { to: "/hoja-vida/bandeja", label: "Hojas de vida por revisar", icon: Inbox, roles: ["ADMIN", "COORDINADOR"] },
  { to: "/vacantes", label: labelVacantes, icon: Briefcase },
  { to: "/postulaciones", label: labelPostulaciones, icon: Send },
  { to: "/entrevistas", label: labelEntrevistas, icon: CalendarClock },
  { to: "/documentos", label: labelDocumentos, icon: FileText },
  { to: "/convenios", label: labelPracticas, icon: FileSignature },
  { to: "/tutores", label: labelTutores, icon: UserCog, roles: ["ADMIN", "COORDINADOR", "EMPRESA", "MCP_AGENT"] },
  { to: "/evaluaciones/new", label: labelEvaluaciones, icon: ClipboardList, roles: ["ADMIN", "COORDINADOR", "EMPRESA"] },
  { to: "/matching", label: "Recomendar candidatos", icon: Sparkles, roles: ["ADMIN", "COORDINADOR"] },
  { to: "/fabrica-soluciones", label: "Programa interno", icon: Factory, roles: ["ADMIN", "COORDINADOR"] },
  { to: "/programa-interno/solicitudes", label: "Solicitudes programa interno", icon: Inbox, roles: ["ADMIN", "COORDINADOR"] },
  { to: "/plantillas", label: "Plantillas de formularios", icon: FileCog, roles: ["ADMIN", "COORDINADOR"] },
  { to: "/mis-formularios", label: "Mis formularios", icon: InboxIcon },
  { to: "/admin/usuarios", label: "Usuarios", icon: Users, roles: ["ADMIN"] },
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
  /** Si true, no aplica sticky/h-screen (se usa dentro de un Sheet drawer). */
  embedded?: boolean;
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
          "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
          isActive
            ? "bg-primary-soft text-primary shadow-xs"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )
      }
      title={collapsed ? label : undefined}
    >
      {({ isActive }) => (
        <>
          <span
            className={cn(
              "absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full transition-all",
              isActive ? "bg-primary" : "bg-transparent"
            )}
            aria-hidden
          />
          <item.icon
            className={cn(
              "h-4 w-4 shrink-0 transition-colors",
              isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
            )}
          />
          {!collapsed && <span className="truncate">{label}</span>}
        </>
      )}
    </NavLink>
  );
}

export function Sidebar({ collapsed, embedded = false }: SidebarProps): JSX.Element {
  const hasRole = useAuthStore((s) => s.hasRole);
  const usuario = useAuthStore((s) => s.usuario);
  const userRoles: Rol[] = usuario?.roles ?? [];
  const items = MAIN_ITEMS.filter((i) => !i.roles || hasRole(...i.roles));
  const groups = GROUPS.filter((g) => !g.roles || hasRole(...g.roles));

  return (
    <aside
      className={cn(
        "bg-card transition-all duration-200 flex flex-col",
        embedded
          ? "h-full w-full"
          : "border-r border-border/70 h-screen sticky top-0",
        embedded ? "" : collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex items-center gap-3 border-b border-border/70 px-4 h-16">
        <div className="relative shrink-0">
          <div className="absolute inset-0 -m-1 rounded-xl bg-uni-gradient opacity-20 blur-md" />
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-uni-gradient text-primary-foreground shadow-md">
            <GraduationCap className="h-5 w-5" />
          </div>
        </div>
        {!collapsed && (
          <div className="leading-tight">
            <div className="font-display text-base font-bold tracking-tight">SIVU</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Uniempresarial
            </div>
          </div>
        )}
      </div>
      <nav className="flex-1 overflow-y-auto py-4 space-y-1 px-2">
        {!collapsed && (
          <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/80">
            Menú principal
          </div>
        )}
        {items.map((item) => renderItem(item, collapsed, userRoles))}
        {groups.map((group) => (
          <div key={group.label} className="pt-4">
            {!collapsed && (
              <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/80">
                {group.label}
              </div>
            )}
            <div className="space-y-1">
              {group.items.map((item) => renderItem(item, collapsed, userRoles))}
            </div>
          </div>
        ))}
      </nav>
      <div className="border-t border-border/70 p-3 text-[10px] text-muted-foreground flex items-center justify-between">
        {!collapsed ? (
          <>
            <span className="font-medium">v0.1.0</span>
            <span className="rounded-full bg-secondary-soft px-2 py-0.5 text-secondary-foreground font-semibold">
              ACADÉMICO
            </span>
          </>
        ) : (
          <span className="mx-auto h-2 w-2 rounded-full bg-secondary" />
        )}
      </div>
    </aside>
  );
}
