import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, User, LogIn, Loader2, Shield } from "lucide-react";
import { loginRemote } from "@/lib/mysql-storage";

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
      const data = await loginRemote(username.trim(), password);
      localStorage.setItem("covinor_session", JSON.stringify({ user: data.user, token: data.token }));
      onLogin(data.user);
    } catch (err: any) {
      // Fallback local
      const localUsers = JSON.parse(localStorage.getItem("covinor_local_users") || "[]");
      const found = localUsers.find((u: any) => u.username === username.trim() && u.password === password);
      if (found) {
        localStorage.setItem("covinor_session", JSON.stringify({ user: { id: found.id || "local", username: found.username }, token: "local" }));
        onLogin({ id: found.id || "local", username: found.username });
      } else {
        setError(err?.message || "Connexion impossible — vérifiez vos identifiants");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background noise-bg grid-pattern flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 -left-32 w-64 h-64 bg-primary/5 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-accent/5 rounded-full blur-[100px]" />
      <div className="absolute top-10 right-10 w-2 h-2 rounded-full bg-primary/40 animate-float" style={{ animationDelay: '0s' }} />
      <div className="absolute top-1/3 left-20 w-1.5 h-1.5 rounded-full bg-accent/30 animate-float" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-1/3 right-1/4 w-1 h-1 rounded-full bg-primary/20 animate-float" style={{ animationDelay: '2s' }} />

      <div className="w-full max-w-[400px] space-y-8 relative z-10 animate-fade-in">
        <div className="flex flex-col items-center gap-5">
          <div className="relative">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary via-primary to-accent flex items-center justify-center glow-primary animate-float">
              <span className="font-display text-3xl font-bold text-white tracking-tighter">C</span>
            </div>
            <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-lg bg-accent flex items-center justify-center glow-accent">
              <Shield className="h-3 w-3 text-accent-foreground" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold font-display tracking-tight text-foreground">COVINOR</h1>
            <p className="text-lg font-display font-medium gradient-text">Régleur</p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <div className="h-px w-8 bg-gradient-to-r from-transparent to-border" />
              <p className="text-xs text-muted-foreground uppercase tracking-[0.2em] font-display">Espace sécurisé</p>
              <div className="h-px w-8 bg-gradient-to-l from-transparent to-border" />
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="glass-card-elevated rounded-2xl p-7 space-y-5 border-glow">
            <div className="space-y-2">
              <Label className="text-[11px] text-muted-foreground font-display uppercase tracking-[0.15em]">Identifiant</Label>
              <div className="relative group">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input value={username} onChange={(e) => setUsername(e.target.value)} className="pl-11 bg-background/50 border-border/50 rounded-xl h-12 text-sm transition-all focus:border-primary/50 focus:bg-background/80" placeholder="Nom d'utilisateur" autoComplete="username" autoFocus />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] text-muted-foreground font-display uppercase tracking-[0.15em]">Mot de passe</Label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-11 bg-background/50 border-border/50 rounded-xl h-12 text-sm transition-all focus:border-primary/50 focus:bg-background/80" placeholder="••••••••" autoComplete="current-password" />
              </div>
            </div>
            {error && (
              <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-xl p-3.5 text-center animate-fade-in">{error}</div>
            )}
          </div>
          <Button type="submit" className="w-full rounded-xl font-display font-semibold text-sm gap-2.5 glow-primary bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary transition-all shimmer" disabled={loading} style={{ height: '52px' }}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
            {loading ? "Connexion..." : "Se connecter"}
          </Button>
        </form>

        <p className="text-center text-[10px] text-muted-foreground/50 font-display uppercase tracking-[0.2em]">Système de gestion interne</p>
      </div>
    </div>
  );
};

export default LoginPage;
