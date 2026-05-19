import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  ArrowRight,
  Eye,
  EyeOff,
  GraduationCap,
  Loader2,
  Moon,
  Sparkles,
  Sun,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { api, extractApiMessage } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { applyTheme, getStoredTheme, type Theme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import type { AuthResponse } from "@/lib/types";

const schema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});

type LoginValues = z.infer<typeof schema>;

interface DemoCred {
  rol: string;
  emoji: string;
  email: string;
  password: string;
}

const DEMO_CREDS: DemoCred[] = [
  { rol: "Admin", emoji: "👑", email: "admin@uempresarial.edu.co", password: "Admin123*" },
  { rol: "Coordinación", emoji: "🎓", email: "coord@uempresarial.edu.co", password: "Coord123*" },
  { rol: "Estudiante", emoji: "📚", email: "kelly@est.uempresarial.edu.co", password: "Estudiante123*" },
  { rol: "Empresa", emoji: "🏢", email: "rrhh@coally.com", password: "Empresa123*" },
];

export function LoginPage(): JSX.Element {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [seeding, setSeeding] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => getStoredTheme());

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const form = useForm<LoginValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginValues) => {
    try {
      const { data } = await api.post<AuthResponse>("/auth/login", values);
      setSession(data);
      toast.success(`Hola, ${data.usuario.nombres}`);
      navigate("/", { replace: true });
    } catch (err) {
      toast.error(extractApiMessage(err));
    }
  };

  const seed = async () => {
    setSeeding(true);
    try {
      await api.post("/admin/seed");
      toast.success("Datos demo cargados");
    } catch (err) {
      toast.error(extractApiMessage(err));
    } finally {
      setSeeding(false);
    }
  };

  const usar = (cred: DemoCred) => {
    form.setValue("email", cred.email);
    form.setValue("password", cred.password);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Mesh gradient animado de fondo */}
      <MeshBackground />

      {/* Toggle theme flotante */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={`Cambiar a tema ${theme === "dark" ? "claro" : "oscuro"}`}
        onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
        className="absolute top-5 right-5 z-50 rounded-full bg-card/70 backdrop-blur-md ring-1 ring-border/60 hover:bg-card"
      >
        {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </Button>

      {/* Logo + chip institucional */}
      <div className="absolute top-5 left-5 z-50 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-uni-gradient text-primary-foreground shadow-md ring-1 ring-white/10">
          <GraduationCap className="h-4.5 w-4.5" />
        </div>
        <div className="leading-tight">
          <div className="font-display text-sm font-bold tracking-tight">SIVU</div>
          <div className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
            Uniempresarial
          </div>
        </div>
      </div>

      {/* Hero asimétrico — tipografía editorial */}
      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col items-center justify-center px-5 py-20 sm:px-8">
        <div className="grid w-full gap-12 lg:grid-cols-[1.1fr_minmax(360px,440px)] lg:items-center">
          {/* Lado izquierdo: marquesina tipográfica */}
          <section className="relative hidden lg:block">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/50 px-3 py-1 text-xs font-medium backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-secondary" />
              </span>
              Coformación 2026 abierta
            </div>

            <h1 className="mt-6 font-display text-[3.4rem] xl:text-[4.2rem] font-bold leading-[0.95] tracking-tight">
              <span className="block">Practicar.</span>
              <span className="block text-primary">Aprender.</span>
              <span className="relative inline-block">
                <span className="relative z-10">Avanzar.</span>
                <span
                  aria-hidden
                  className="absolute -bottom-1 left-0 right-0 h-3 bg-secondary/40 -z-0"
                />
              </span>
            </h1>

            <p className="mt-7 max-w-md text-base text-muted-foreground leading-relaxed">
              El sistema institucional de Uniempresarial para vincularte a una práctica
              real — sin formularios infinitos, sin papeleo perdido, sin esperar correos.
            </p>

            <div className="mt-10 flex items-center gap-6">
              <Stat n="6" label="roles" />
              <span className="h-10 w-px bg-border" />
              <Stat n="100%" label="trazable" />
              <span className="h-10 w-px bg-border" />
              <Stat n="0" label="papel" />
            </div>
          </section>

          {/* Card de login — glassmorphism */}
          <section className="relative">
            <div className="relative rounded-3xl border border-border/60 bg-card/70 p-7 shadow-2xl backdrop-blur-xl sm:p-8">
              <div
                aria-hidden
                className="pointer-events-none absolute -top-px left-10 right-10 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
              />
              <div className="lg:hidden mb-4 inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/50 px-3 py-1 text-[10px] uppercase tracking-widest font-semibold backdrop-blur">
                <Sparkles className="h-3 w-3 text-primary" /> Bienvenido
              </div>

              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
                Inicia sesión
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Entra con tu correo institucional para acceder al panel.
              </p>

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="mt-6 space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Correo
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="kelly@est.uempresarial.edu.co"
                            autoComplete="email"
                            className="h-11"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Contraseña
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              autoComplete="current-password"
                              placeholder="••••••••"
                              className="h-11 pr-11"
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword((s) => !s)}
                              className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                              aria-label={showPassword ? "Ocultar" : "Mostrar"}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    variant="gradient"
                    size="lg"
                    className="group w-full"
                    disabled={form.formState.isSubmitting}
                  >
                    {form.formState.isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        Entrar
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </Button>
                </form>
              </Form>

              <div className="mt-6 text-center text-xs text-muted-foreground">
                ¿Sin cuenta?{" "}
                <Link
                  to="/register"
                  className="font-semibold text-primary hover:underline underline-offset-4"
                >
                  Regístrate
                </Link>
              </div>
            </div>

            {/* Demo creds horizontales — chips minimalistas */}
            <div className="mt-5 flex flex-col items-center gap-2.5">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                <span className="h-px w-6 bg-border" />
                Probar como
                <span className="h-px w-6 bg-border" />
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {DEMO_CREDS.map((c) => (
                  <button
                    key={c.email}
                    type="button"
                    onClick={() => usar(c)}
                    className={cn(
                      "group inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/60 px-3 py-1.5 text-xs font-medium",
                      "backdrop-blur-md transition-all duration-200",
                      "hover:border-primary/40 hover:bg-primary-soft hover:text-primary hover:-translate-y-0.5 hover:shadow-md"
                    )}
                  >
                    <span aria-hidden>{c.emoji}</span>
                    <span>{c.rol}</span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={seed}
                disabled={seeding}
                className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1 disabled:opacity-50"
              >
                {seeding ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3" />
                )}
                Cargar datos demo
              </button>
            </div>
          </section>
        </div>
      </main>

      <footer className="absolute bottom-4 left-0 right-0 z-10 text-center text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
        © {new Date().getFullYear()} · Fundación Universitaria Empresarial
      </footer>
    </div>
  );
}

function Stat({ n, label }: { n: string; label: string }): JSX.Element {
  return (
    <div>
      <div className="font-display text-2xl font-bold tracking-tight leading-none">{n}</div>
      <div className="mt-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

/**
 * Fondo con mesh gradient animado: tres blobs cónicos que rotan + grano sutil.
 * Define keyframes inline para no tocar tailwind config.
 */
function MeshBackground(): JSX.Element {
  return (
    <>
      <style>{`
        @keyframes meshDrift1 {
          0%, 100% { transform: translate(0%, 0%) rotate(0deg); }
          50% { transform: translate(8%, -6%) rotate(40deg); }
        }
        @keyframes meshDrift2 {
          0%, 100% { transform: translate(0%, 0%) rotate(0deg); }
          50% { transform: translate(-10%, 8%) rotate(-30deg); }
        }
        @keyframes meshDrift3 {
          0%, 100% { transform: translate(0%, 0%) rotate(0deg); }
          50% { transform: translate(6%, 10%) rotate(60deg); }
        }
        .mesh-blob {
          position: absolute;
          border-radius: 9999px;
          filter: blur(80px);
          will-change: transform;
          mix-blend-mode: screen;
        }
        .dark .mesh-blob { mix-blend-mode: lighten; opacity: 0.55; }
        .light .mesh-blob, html:not(.dark) .mesh-blob { opacity: 0.55; }
      `}</style>
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="mesh-blob"
          style={{
            top: "-15%",
            left: "-10%",
            width: "55vw",
            height: "55vw",
            background:
              "radial-gradient(circle at 30% 30%, hsl(var(--primary) / 0.55), transparent 60%)",
            animation: "meshDrift1 18s ease-in-out infinite",
          }}
        />
        <div
          className="mesh-blob"
          style={{
            top: "20%",
            right: "-15%",
            width: "50vw",
            height: "50vw",
            background:
              "radial-gradient(circle at 60% 40%, hsl(var(--accent) / 0.55), transparent 60%)",
            animation: "meshDrift2 22s ease-in-out infinite",
          }}
        />
        <div
          className="mesh-blob"
          style={{
            bottom: "-20%",
            left: "25%",
            width: "60vw",
            height: "60vw",
            background:
              "radial-gradient(circle at 40% 60%, hsl(var(--secondary) / 0.45), transparent 60%)",
            animation: "meshDrift3 26s ease-in-out infinite",
          }}
        />
        {/* Sutil grano para textura — usando data URI pequeño */}
        <div
          className="absolute inset-0 opacity-[0.04] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='1'/></svg>\")",
          }}
        />
      </div>
    </>
  );
}
