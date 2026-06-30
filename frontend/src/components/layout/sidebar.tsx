import { NavLink } from "react-router-dom";
import {
  Building2,
  CalendarClock,
  CalendarPlus,
  CalendarRange,
  FolderArchive,
  FileSignature,
  FileText,
  LayoutDashboard,
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
  return roles.includes("TUTOR") && !roles.includes("ADMIN") && !roles.includes("COORDINADOR")
    ? "Mis practicantes"
    : "Estudiantes";
}
function labelPracticas(roles: Rol[]): string {
  // El estudiante ES quien hace la práctica; la empresa RECIBE practicantes.
  if (roles.includes("ADMIN") || roles.includes("COORDINADOR")) return "Prácticas";
  if (roles.includes("TUTOR")) return "Convenios";
  return "Mi práctica";
}
function labelTutores(roles: Rol[]): string {
  return roles.includes("TUTOR") && !roles.includes("ADMIN") && !roles.includes("COORDINADOR")
    ? "Mis tutores"
    : "Tutores";
}
function labelDocumentos(roles: Rol[]): string {
  return roles.includes("TUTOR") && !roles.includes("ADMIN") && !roles.includes("COORDINADOR")
    ? "Documentos de mi empresa"
    : "Documentos";
}
function labelExpediente(roles: Rol[]): string {
  return roles.includes("ESTUDIANTE") &&
    !roles.includes("ADMIN") &&
    !roles.includes("COORDINADOR") &&
    !roles.includes("DOCENTE") &&
    !roles.includes("TUTOR")
    ? "Mi expediente"
    : "Expediente";
}

const MAIN_ITEMS: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
];

const GROUPS: NavGroup[] = [
  // Personas — estudiantes y tutores que intervienen en la práctica.
  {
    label: "Personas",
    items: [
      { to: "/estudiantes", label: labelEstudiantes, icon: Users, roles: ["ADMIN", "COORDINADOR", "DOCENTE", "TUTOR"] },
      { to: "/tutores", label: labelTutores, icon: UserCog, roles: ["ADMIN", "COORDINADOR", "TUTOR", "MCP_AGENT"] },
    ],
  },
  // Empresas — registro de coformadoras y vista propia de la empresa.
  {
    label: "Empresas",
    items: [
      { to: "/empresas", label: "Empresas", icon: Building2, roles: ["ADMIN", "COORDINADOR"] },
      { to: "/mi-empresa", label: "Mi empresa", icon: Building2, roles: ["TUTOR"] },
    ],
  },
  // Coformación — la práctica activa y todo su ciclo de seguimiento.
  {
    label: "Coformación",
    items: [
      { to: "/convenios", label: labelPracticas, icon: FileSignature },
      { to: "/expedientes", label: labelExpediente, icon: FolderArchive, roles: ["ADMIN", "COORDINADOR", "ESTUDIANTE", "DOCENTE", "TUTOR"] },
      { to: "/documentos", label: labelDocumentos, icon: FileText },
    ],
  },
  // Agendamiento colaborativo — franjas del docente y reuniones
  // estudiante ↔ tutor (RF-C01/C02/C03).
  {
    label: "Agendamiento",
    items: [
      { to: "/agendamiento/disponibilidad", label: "Disponibilidad docente", icon: CalendarClock, roles: ["ADMIN", "COORDINADOR", "DOCENTE"] },
      { to: "/agendamiento/proponer", label: "Proponer reunión", icon: CalendarPlus, roles: ["ESTUDIANTE"] },
      { to: "/agendamiento/reuniones", label: "Reuniones", icon: CalendarRange, roles: ["ESTUDIANTE", "ADMIN", "COORDINADOR"] },
    ],
  },
  // Administración — gestión de usuarios del sistema.
  {
    label: "Administración",
    roles: ["ADMIN"],
    items: [
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
