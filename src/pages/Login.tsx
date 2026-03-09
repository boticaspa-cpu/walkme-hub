import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import walkmeLogo from "@/assets/walkme-logo.png";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Login() {
  const { login, signup, isAuthenticated, pendingStatus, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") === "signup" ? "signup" : "login";
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");

  // Redirect when auth state changes (avoids depending on await login resolving)
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Show pending status message after login attempt
  useEffect(() => {
    if (pendingStatus && pendingStatus !== "approved") {
      const messages: Record<string, string> = {
        pending: "Tu cuenta está pendiente de aprobación por un administrador.",
        disabled: "Tu cuenta ha sido deshabilitada. Contacta al administrador.",
        rejected: "Tu cuenta ha sido rechazada. Contacta al administrador.",
      };
      toast({ title: "Acceso restringido", description: messages[pendingStatus] || "No tienes acceso.", variant: "destructive" });
    }
  }, [pendingStatus]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      // Navigation handled by useEffect above; pending status shown by useEffect
    } catch (err: any) {
      toast({ title: "Error al iniciar sesión", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signup(email, password, fullName);
      toast({ title: "Cuenta creada", description: "Revisa tu correo para confirmar tu cuenta." });
    } catch (err: any) {
      toast({ title: "Error al registrarse", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-primary p-4">
      <Card className="w-full max-w-sm shadow-2xl border-0">
        <CardHeader className="items-center gap-2 pb-2 pt-8">
          <img src={walkmeLogo} alt="Walkme Tours" className="h-14 w-14 rounded-2xl object-cover shadow-md" />
          <h1 className="text-xl font-bold font-display mt-2">Walkme Tours</h1>
          <p className="text-sm font-accent text-muted-foreground tracking-wide">Just freedom</p>
        </CardHeader>
        <CardContent className="pt-4">
          <Tabs defaultValue={defaultTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Iniciar sesión</TabsTrigger>
              <TabsTrigger value="signup">Registrarse</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="flex flex-col gap-4 mt-4">
                <div className="space-y-1.5">
                  <Label htmlFor="login-email">Correo electrónico</Label>
                  <Input id="login-email" type="email" placeholder="tu@walkmetravel.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="login-password">Contraseña</Label>
                  <Input id="login-password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <Button type="submit" className="mt-2 w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Entrar
                </Button>
                <button type="button" className="text-sm text-muted-foreground hover:text-primary underline mt-1 self-start" onClick={() => setShowForgot(true)}>
                  ¿Olvidaste tu contraseña?
                </button>
              </form>

              {showForgot && (
                <form
                  className="flex flex-col gap-3 mt-4 border-t pt-4"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setLoading(true);
                    try {
                      await resetPassword(forgotEmail);
                      toast({ title: "Correo enviado", description: "Revisa tu bandeja de entrada para restablecer tu contraseña." });
                      setShowForgot(false);
                    } catch (err: any) {
                      toast({ title: "Error", description: err.message, variant: "destructive" });
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  <p className="text-sm text-muted-foreground">Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.</p>
                  <Input type="email" placeholder="tu@walkmetravel.com" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} required />
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" disabled={loading}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Enviar enlace
                    </Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => setShowForgot(false)}>Cancelar</Button>
                  </div>
                </form>
              )
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="flex flex-col gap-4 mt-4">
                <div className="space-y-1.5">
                  <Label htmlFor="signup-name">Nombre completo</Label>
                  <Input id="signup-name" type="text" placeholder="Tu nombre" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signup-email">Correo electrónico</Label>
                  <Input id="signup-email" type="email" placeholder="tu@walkmetravel.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signup-password">Contraseña</Label>
                  <Input id="signup-password" type="password" placeholder="Mínimo 6 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                </div>
                <Button type="submit" className="mt-2 w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Crear cuenta
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
