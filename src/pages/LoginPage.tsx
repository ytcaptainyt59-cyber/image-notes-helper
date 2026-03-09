import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, User, Zap, LogIn, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  onLogin: (user: { id: string; username: string }) => void;
}

const LoginPage = ({ onLogin }: Props) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password.trim()) {
      setError("Veuillez remplir tous les champs");
      return;
    }

    setLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("mysql-auth", {
        body: { action: "login", username: username.trim(), password },
      });

      if (fnError) throw fnError;
      if (data?.error) {
        setError(data.error);
        return;
      }

      // Store session
      localStorage.setItem("covinor_session", JSON.stringify({
        user: data.user,
        token: data.token,
      }));

      onLogin(data.user);
    } catch (err) {
      console.error("Login error:", err);
      // Fallback: local auth if MySQL unavailable
      const localUsers = JSON.parse(localStorage.getItem("covinor_local_users") || "[]");
      const found = localUsers.find(
        (u: any) => u.username === username.trim() && u.password === password
      );
      if (found) {
        localStorage.setItem("covinor_session", JSON.stringify({
          user: { id: found.id || "local", username: found.username },
          token: "local",
        }));
        onLogin({ id: found.id || "local", username: found.username });
      } else {
        setError("Connexion impossible — vérifiez vos identifiants ou la connexion réseau");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-primary">
            <span className="font-display text-2xl font-bold text-white">C</span>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold font-display tracking-tight text-foreground">
              COVINOR <span className="gradient-text">Régleur</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1 flex items-center justify-center gap-1">
              <Zap className="h-3.5 w-3.5 text-accent" />
              Gestion des formats & réglages
            </p>
          </div>
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground font-display uppercase tracking-wider">
                Identifiant
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 bg-secondary/50 border-border/50 rounded-xl h-11"
                  placeholder="Nom d'utilisateur"
                  autoComplete="username"
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground font-display uppercase tracking-wider">
                Mot de passe
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-secondary/50 border-border/50 rounded-xl h-11"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
            </div>

            {error && (
              <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-center">
                {error}
              </div>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-12 rounded-xl font-display font-semibold text-sm gap-2 glow-primary"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogIn className="h-4 w-4" />
            )}
            {loading ? "Connexion..." : "Se connecter"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
