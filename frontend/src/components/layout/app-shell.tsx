import { useEffect, useState } from "react";
import { useLocation, Outlet } from "react-router-dom";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { Sheet, SheetContent } from "@/components/ui/sheet";

export function AppShell(): JSX.Element {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Cierra el drawer al navegar (mobile)
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen surface-gradient">
      {/* Sidebar fijo en >=lg */}
      <div className="hidden lg:flex">
        <Sidebar collapsed={collapsed} />
      </div>

      {/* Sidebar drawer en <lg */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="p-0 w-72 max-w-[85%] bg-card border-r border-border/70"
        >
          <Sidebar collapsed={false} embedded />
        </SheetContent>
      </Sheet>

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          onToggleSidebar={() => {
            if (window.matchMedia("(min-width: 1024px)").matches) {
              setCollapsed((c) => !c);
            } else {
              setMobileOpen((o) => !o);
            }
          }}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 animate-fade-in">
          <div className="mx-auto w-full max-w-[1400px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
