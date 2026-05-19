import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Menu, Moon, Sun, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/lib/auth-store";
import { applyTheme, getStoredTheme, type Theme } from "@/lib/theme";

interface TopbarProps {
  onToggleSidebar: () => void;
}

export function Topbar({ onToggleSidebar }: TopbarProps): JSX.Element {
  const navigate = useNavigate();
  const usuario = useAuthStore((s) => s.usuario);
  const clear = useAuthStore((s) => s.clear);
  const [theme, setTheme] = useState<Theme>(() => getStoredTheme());

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const initials = `${usuario?.nombres?.[0] ?? "?"}${usuario?.apellidos?.[0] ?? ""}`.toUpperCase();
  const rolPrincipal = usuario?.roles?.[0] ?? "";

  const handleLogout = () => {
    clear();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border/70 bg-background/80 backdrop-blur-md px-4 supports-[backdrop-filter]:bg-background/60">
      <Button variant="ghost" size="icon" onClick={onToggleSidebar} aria-label="Alternar menú">
        <Menu className="h-5 w-5" />
      </Button>

      <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
        <span className="h-1.5 w-1.5 rounded-full bg-secondary animate-pulse" />
        <span className="text-xs font-medium uppercase tracking-wider">
          Sistema en línea
        </span>
      </div>

      <div className="flex-1" />

      <Button
        variant="ghost"
        size="icon"
        aria-label={`Cambiar a tema ${theme === "dark" ? "claro" : "oscuro"}`}
        aria-pressed={theme === "dark"}
        onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
      >
        {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="gap-2 px-2 rounded-full">
            <Avatar className="ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
              <AvatarFallback className="bg-uni-gradient text-primary-foreground font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden lg:flex flex-col items-start leading-tight">
              <span className="text-sm font-medium">
                {usuario?.nombres} {usuario?.apellidos}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {rolPrincipal}
              </span>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span className="text-sm">{usuario?.email}</span>
              <span className="text-xs text-muted-foreground">{usuario?.roles?.join(", ")}</span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate("/")}>
            <UserIcon className="h-4 w-4" /> Mi panel
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
            <LogOut className="h-4 w-4" /> Cerrar sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
