import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  const { login, signup, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect when auth state changes (avoids depending on await login resolving)
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      // Navigation handled by useEffect above
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
          <Tabs defaultValue="login">
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
              </form>
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
