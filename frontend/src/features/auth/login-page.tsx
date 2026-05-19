import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  ArrowRight,
  GraduationCap,
  Loader2,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { api, extractApiMessage } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import type { AuthResponse } from "@/lib/types";

const schema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});

type LoginValues = z.infer<typeof schema>;

const DEMO_CREDS = [
  { rol: "ADMIN", email: "admin@uempresarial.edu.co", password: "Admin123*" },
  { rol: "COORDINADOR", email: "coord@uempresarial.edu.co", password: "Coord123*" },
  { rol: "ESTUDIANTE", email: "kelly@est.uempresarial.edu.co", password: "Estudiante123*" },
  { rol: "EMPRESA", email: "rrhh@coally.com", password: "Empresa123*" },
];

const ROL_COLOR: Record<string, string> = {
  ADMIN: "bg-accent-soft text-accent",
  COORDINADOR: "bg-primary-soft text-primary",
  ESTUDIANTE: "bg-secondary-soft text-secondary-foreground",
  EMPRESA: "bg-warning-soft text-warning",
};

export function LoginPage(): JSX.Element {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [seeding, setSeeding] = useState(false);

  const form = useForm<LoginValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginValues) => {
    try {
      const { data } = await api.post<AuthResponse>("/auth/login", values);
      setSession(data);
      toast.success(`Bienvenido ${data.usuario.nombres}`);
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

  const usar = (email: string, password: string) => {
    form.setValue("email", email);
    form.setValue("password", password);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.05fr_1fr]">
      {/* Hero institucional */}
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-uni-gradient text-primary-foreground p-12">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-secondary opacity-30 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-0 h-80 w-80 -translate-x-1/3 translate-y-1/3 rounded-full bg-coral opacity-30 blur-3xl"
        />
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur ring-1 ring-white/30">
            <GraduationCap className="h-7 w-7" />
          </div>
          <div className="leading-tight">
            <div className="font-display text-xl font-bold tracking-tight">SIVU</div>
            <div className="text-xs uppercase tracking-widest text-white/80">
              Uniempresarial
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-6 max-w-md">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur ring-1 ring-white/20">
            <Sparkles className="h-3.5 w-3.5" /> Sistema institucional
          </div>
          <h1 className="font-display text-4xl xl:text-5xl font-bold leading-tight tracking-tight">
            Vinculación de prácticas, simple y trazable.
          </h1>
          <p className="text-white/85 text-lg">
            Coordina estudiantes, empresas y convenios desde un solo lugar.
            Conformamos el Coformación Empresarial en cada paso del proceso.
          </p>

          <div className="grid grid-cols-1 gap-3 pt-4">
            <FeatureRow
              icon={UsersRound}
              title="6 roles, un solo flujo"
              text="Estudiante, coordinador, empresa, tutor académico, empresarial y MCP."
            />
            <FeatureRow
              icon={ShieldCheck}
              title="Trazabilidad GTC-FM"
              text="Actas, planes, evaluaciones e informes con firmas y PDFs oficiales."
            />
            <FeatureRow
              icon={Sparkles}
              title="Automatización inteligente"
              text="Validación documental, matching y Fábrica de Soluciones."
            />
          </div>
        </div>

        <div className="relative z-10 text-xs text-white/70">
          © {new Date().getFullYear()} Fundación Universitaria Empresarial — Demo académica
        </div>
      </aside>

      {/* Formulario */}
      <section className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 surface-gradient">
        <div className="mx-auto w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-uni-gradient text-primary-foreground shadow-md">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <div className="font-display text-lg font-bold">SIVU</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Uniempresarial
              </div>
            </div>
          </div>

          <h2 className="font-display text-3xl font-bold tracking-tight">
            Inicia sesión
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Ingresa con tu correo institucional para acceder al panel.
          </p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo institucional</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="usuario@uempresarial.edu.co"
                        autoComplete="email"
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
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        autoComplete="current-password"
                        placeholder="••••••••"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                variant="gradient"
                size="lg"
                className="w-full"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
                Entrar al sistema
              </Button>
              <div className="text-xs text-muted-foreground text-center">
                ¿Sin cuenta?{" "}
                <Link to="/register" className="text-primary font-medium hover:underline">
                  Regístrate
                </Link>
              </div>
            </form>
          </Form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center" aria-hidden>
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-background px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Credenciales demo
                </span>
              </div>
            </div>

            <Card className="mt-4 p-2">
              <ul className="grid gap-1 text-sm">
                {DEMO_CREDS.map((c) => (
                  <li key={c.email}>
                    <button
                      type="button"
                      onClick={() => usar(c.email, c.password)}
                      className="group w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-left transition-colors hover:bg-primary-soft"
                    >
                      <span
                        className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${ROL_COLOR[c.rol] ?? "bg-muted text-muted-foreground"}`}
                      >
                        {c.rol}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">{c.email}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </button>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={seed}
                  disabled={seeding}
                >
                  {seeding ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  Cargar datos demo
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}

interface FeatureRowProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  text: string;
}

function FeatureRow({ icon: Icon, title, text }: FeatureRowProps): JSX.Element {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-white/10 p-3 ring-1 ring-white/15 backdrop-blur-sm">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15 text-white">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-xs text-white/75">{text}</div>
      </div>
    </div>
  );
}
