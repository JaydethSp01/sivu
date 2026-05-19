import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { GraduationCap, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
      toast.success("Datos demo cargados", {
        description: (
          <div className="text-xs leading-relaxed">
            <div>admin@uempresarial.edu.co / Admin123*</div>
            <div>coord@uempresarial.edu.co / Coord123*</div>
            <div>kelly@est.uempresarial.edu.co / Estudiante123*</div>
            <div>rrhh@coally.com / Empresa123*</div>
          </div>
        ),
        duration: 12_000,
      });
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
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="flex flex-col items-center gap-2">
          <div className="rounded-full bg-primary/10 p-3">
            <GraduationCap className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">SIVU</h1>
          <p className="text-sm text-muted-foreground">Sistema de Vinculación Universitaria</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Inicia sesión</CardTitle>
            <CardDescription>Ingresa tus credenciales para continuar.</CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo institucional</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="usuario@uempresarial.edu.co" autoComplete="email" {...field} />
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
                        <Input type="password" autoComplete="current-password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Entrar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={seed}
                  disabled={seeding}
                >
                  {seeding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Cargar datos demo
                </Button>
                <div className="text-xs text-muted-foreground text-center">
                  ¿Sin cuenta?{" "}
                  <Link to="/register" className="text-primary hover:underline">
                    Regístrate
                  </Link>
                </div>
              </CardFooter>
            </form>
          </Form>
        </Card>

        <Card className="bg-muted/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Credenciales demo</CardTitle>
            <CardDescription className="text-xs">
              Tras "Cargar datos demo", puedes iniciar sesión con cualquiera de estos roles.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-1 text-xs">
            {DEMO_CREDS.map((c) => (
              <button
                key={c.email}
                type="button"
                className="flex justify-between items-center gap-2 rounded px-2 py-1 hover:bg-accent text-left"
                onClick={() => usar(c.email, c.password)}
              >
                <span className="font-medium">{c.rol}</span>
                <span className="text-muted-foreground truncate">{c.email}</span>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
