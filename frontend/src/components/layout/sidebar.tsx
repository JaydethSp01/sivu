import { NavLink } from "react-router-dom";
import {
  BarChart3,
  Building2,
  BookCopy,
  Briefcase,
  CalendarClock,
  Factory,
  FileCog,
  Inbox as InboxIcon,
  FileSignature,
  FileText,
  FileUser,
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
import { UniempresarialLogo } from "@/components/uniempresarial-logo";

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

// Solo el Dashboard queda como ítem principal; el resto se agrupa por dominio
// para que cada rol vea un menú razonable y no una lista plana de 22 items.
const MAIN_ITEMS: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
];

const GROUPS: NavGroup[] = [
  // 1. Mi perfil — lo que cada rol gestiona sobre SÍ mismo.
  {
    label: "Mi perfil",
    items: [
      { to: "/mi-hoja-vida", label: "Mi Hoja de Vida", icon: FileUser, roles: ["ESTUDIANTE"] },
      { to: "/mi-empresa", label: "Mi empresa", icon: Building2, roles: ["EMPRESA"] },
      { to: "/empresas/proponer", label: "Proponer empresa", icon: Building2, roles: ["ESTUDIANTE"] },
      { to: "/mis-formularios", label: "Mis formularios", icon: InboxIcon },
    ],
  },
  // 2. Personas — listas que comparten Coformación y Empresa, con etiquetas
  //    distintas según rol ("Estudiantes" vs "Mis practicantes").
  {
    label: "Personas",
    items: [
      { to: "/estudiantes", label: labelEstudiantes, icon: Users, roles: ["ADMIN", "COORDINADOR", "EMPRESA"] },
      { to: "/tutores", label: labelTutores, icon: UserCog, roles: ["ADMIN", "COORDINADOR", "EMPRESA", "MCP_AGENT"] },
    ],
  },
  // 3. Coformación — acciones académicas exclusivas del coordinador.
  {
    label: "Coformación",
    roles: ["ADMIN", "COORDINADOR"],
    items: [
      { to: "/hoja-vida/bandeja", label: "Hojas de vida por revisar", icon: Inbox },
      { to: "/matching", label: "Recomendar candidatos", icon: Sparkles },
      { to: "/analytics", label: "Analítica institucional", icon: BarChart3 },
    ],
  },
  // 3. Empresas & vacantes — quién contrata y qué buscan.
  {
    label: "Empresas & vacantes",
    items: [
      { to: "/empresas", label: "Empresas", icon: Building2, roles: ["ADMIN", "COORDINADOR"] },
      { to: "/vacantes", label: labelVacantes, icon: Briefcase },
      // Vista compartida ESTUDIANTE/EMPRESA/COORD/ADMIN — la etiqueta cambia por rol.
      { to: "/postulaciones", label: labelPostulaciones, icon: Send },
      { to: "/entrevistas", label: labelEntrevistas, icon: CalendarClock },
    ],
  },
  // 4. Procesos & soportes — práctica activa, documentos, formularios.
  {
    label: "Procesos & soportes",
    items: [
      { to: "/convenios", label: labelPracticas, icon: FileSignature },
      { to: "/documentos", label: labelDocumentos, icon: FileText },
    ],
  },
  // 5. Programa interno — plan B académico. Solo coord/admin gestionan; los
  // estudiantes proponen su solicitud desde el Dashboard, no desde el sidebar.
  {
    label: "Programa interno",
    roles: ["ADMIN", "COORDINADOR"],
    items: [
      { to: "/fabrica-soluciones", label: "Cartera de proyectos", icon: Factory },
      { to: "/programa-interno/solicitudes", label: "Solicitudes recibidas", icon: Inbox },
    ],
  },
  // 6. Administración — solo COORDINADOR/ADMIN gestionan plantillas y catálogos.
  {
    label: "Administración",
    roles: ["ADMIN", "COORDINADOR"],
    items: [
      { to: "/plantillas", label: "Plantillas de formularios", icon: FileCog },
      { to: "/catalogos/modalidades", label: "Modalidades", icon: BookCopy },
      { to: "/catalogos/tipos-requisito", label: "Tipos de requisito", icon: Tags },
      { to: "/catalogos/matriz", label: "Matriz de requisitos", icon: ListChecks },
      { to: "/admin/usuarios", label: "Usuarios del sistema", icon: Users, roles: ["ADMIN"] },
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
  // Cada grupo se filtra por su propio rol Y se reduce a sólo los items que el
  // usuario puede ver. Grupos sin ningún item visible se ocultan completos.
  const groups = GROUPS
    .filter((g) => !g.roles || hasRole(...g.roles))
    .map((g) => ({
      ...g,
      items: g.items.filter((i) => !i.roles || hasRole(...i.roles)),
    }))
    .filter((g) => g.items.length > 0);

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
        <UniempresarialLogo size={36} />
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
