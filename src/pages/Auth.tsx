import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Store, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup state
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupName, setSignupName] = useState("");

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState("");
  const [showForgot, setShowForgot] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Login realizado com sucesso");
      navigate("/");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: signupEmail,
      password: signupPassword,
      options: {
        data: { display_name: signupName },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Conta criada! Verifique seu e-mail para confirmar.");
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("E-mail de recuperação enviado!");
      setShowForgot(false);
    }
  };

  if (showForgot) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Store className="h-10 w-10 mx-auto text-primary mb-2" />
            <CardTitle>Recuperar Senha</CardTitle>
            <CardDescription>Informe seu e-mail para receber o link de recuperação</CardDescription>
          </CardHeader>
          <form onSubmit={handleForgotPassword}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} required />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                Enviar Link
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowForgot(false)}>
                Voltar ao login
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Store className="h-10 w-10 mx-auto text-primary mb-2" />
          <CardTitle className="text-2xl">GestãoLoja</CardTitle>
          <CardDescription>Sistema de Gestão de Loja</CardDescription>
        </CardHeader>
        <Tabs defaultValue="login">
          <TabsList className="grid w-full grid-cols-2 mx-auto max-w-[90%]">
            <TabsTrigger value="login">Entrar</TabsTrigger>
            <TabsTrigger value="signup">Cadastrar</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <form onSubmit={handleLogin}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Senha</Label>
                  <Input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                  Entrar
                </Button>
                <Button type="button" variant="link" className="text-xs" onClick={() => setShowForgot(true)}>
                  Esqueci minha senha
                </Button>
              </CardFooter>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleSignup}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input value={signupName} onChange={(e) => setSignupName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input type="email" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Senha</Label>
                  <Input type="password" minLength={6} value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} required />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                  Criar Conta
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default Auth;
