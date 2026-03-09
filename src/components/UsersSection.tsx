import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getUsersRemote,
  createUserRemote,
  deleteUserRemote,
  changePasswordRemote,
  getRegistrationStatus,
  resetRegistration,
} from "@/lib/mysql-storage";
import {
  Users,
  Plus,
  Trash2,
  Key,
  Loader2,
  UserPlus,
  Link2,
  Link2Off,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";

const UsersSection = () => {
  const [users, setUsers] = useState<{ id: string; username: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [changingPw, setChangingPw] = useState<string | null>(null);
  const [newPw, setNewPw] = useState("");
  const [regAvailable, setRegAvailable] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      const data = await getUsersRemote();
      setUsers(data);
    } catch {
      toast.error("Impossible de charger les utilisateurs");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRegStatus = useCallback(async () => {
    const available = await getRegistrationStatus();
    setRegAvailable(available);
  }, []);

  useEffect(() => {
    loadUsers();
    loadRegStatus();
  }, [loadUsers, loadRegStatus]);

  const handleCreate = async () => {
    if (!newUsername.trim() || !newPassword.trim()) {
      toast.error("Remplissez tous les champs");
      return;
    }
    if (newPassword.length < 4) {
      toast.error("Mot de passe min. 4 caractères");
      return;
    }
    setCreating(true);
    try {
      await createUserRemote(newUsername.trim(), newPassword);
      toast.success(`Utilisateur "${newUsername}" créé`);
      setNewUsername("");
      setNewPassword("");
      setShowForm(false);
      loadUsers();
    } catch (err: any) {
      toast.error(err.message || "Erreur création");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string, username: string) => {
    if (!confirm(`Supprimer l'utilisateur "${username}" ?`)) return;
    try {
      await deleteUserRemote(id);
      toast.success(`"${username}" supprimé`);
      loadUsers();
    } catch (err: any) {
      toast.error(err.message || "Erreur suppression");
    }
  };

  const handleChangePassword = async (id: string) => {
    if (!newPw.trim() || newPw.length < 4) {
      toast.error("Mot de passe min. 4 caractères");
      return;
    }
    try {
      await changePasswordRemote(id, newPw);
      toast.success("Mot de passe modifié");
      setChangingPw(null);
      setNewPw("");
    } catch (err: any) {
      toast.error(err.message || "Erreur");
    }
  };

  const handleToggleRegistration = async () => {
    try {
      if (!regAvailable) {
        await resetRegistration();
        toast.success("Lien d'inscription activé");
      } else {
        // Désactiver manuellement en le marquant comme utilisé
        // On réutilise le reset pour remettre à 0, mais ici on veut désactiver
        // Pour simplifier, on fait un register fantôme ou juste un message
        toast.info("L'inscription se désactivera après la première utilisation");
        return;
      }
      loadRegStatus();
    } catch (err: any) {
      toast.error(err.message || "Erreur");
    }
  };

  const registrationUrl = `${window.location.origin}?register=1`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(registrationUrl);
    setCopied(true);
    toast.success("Lien copié !");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-foreground">Utilisateurs</h2>
            <p className="text-xs text-muted-foreground">{users.length} compte{users.length > 1 ? "s" : ""}</p>
          </div>
        </div>
        <Button
          size="sm"
          className="gap-2 rounded-xl font-display text-xs"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus className="h-3.5 w-3.5" />
          Ajouter
        </Button>
      </div>

      {/* Lien d'inscription */}
      <div className="glass-card rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-primary" />
            <span className="text-sm font-display font-semibold text-foreground">Inscription externe</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 rounded-lg text-xs"
            onClick={handleToggleRegistration}
          >
            {regAvailable ? (
              <>
                <Link2 className="h-3.5 w-3.5 text-green-500" />
                Actif
              </>
            ) : (
              <>
                <Link2Off className="h-3.5 w-3.5 text-muted-foreground" />
                Désactivé
              </>
            )}
          </Button>
        </div>
        {regAvailable && (
          <div className="flex items-center gap-2">
            <Input
              value={registrationUrl}
              readOnly
              className="text-xs bg-background/50 border-border/50 font-mono"
            />
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 rounded-lg"
              onClick={handleCopyLink}
            >
              {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
          </div>
        )}
        <p className="text-[10px] text-muted-foreground">
          {regAvailable
            ? "⚡ Ce lien permet UNE seule inscription. Il sera désactivé après utilisation."
            : "Cliquez sur le bouton pour activer un lien d'inscription à usage unique."}
        </p>
      </div>

      {/* Formulaire création */}
      {showForm && (
        <div className="glass-card-elevated rounded-xl p-5 space-y-4 border-glow animate-fade-in">
          <h3 className="font-display text-sm font-semibold text-primary uppercase tracking-wider">
            Nouvel utilisateur
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Identifiant</Label>
              <Input
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="nom_utilisateur"
                className="bg-background/50 border-border/50 rounded-lg"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Mot de passe</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-background/50 border-border/50 rounded-lg"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>
              Annuler
            </Button>
            <Button size="sm" className="gap-2" onClick={handleCreate} disabled={creating}>
              {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              Créer
            </Button>
          </div>
        </div>
      )}

      {/* Liste */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">Aucun utilisateur</div>
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <div
              key={u.id}
              className="glass-card rounded-xl p-4 flex items-center justify-between hover-lift transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center">
                  <span className="text-xs font-display font-bold text-foreground uppercase">
                    {u.username.slice(0, 2)}
                  </span>
                </div>
                <span className="text-sm font-medium text-foreground">{u.username}</span>
              </div>
              <div className="flex items-center gap-1">
                {changingPw === u.id ? (
                  <div className="flex items-center gap-2 animate-fade-in">
                    <Input
                      type="password"
                      value={newPw}
                      onChange={(e) => setNewPw(e.target.value)}
                      placeholder="Nouveau mdp"
                      className="h-8 w-32 text-xs bg-background/50 border-border/50 rounded-lg"
                    />
                    <Button
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => handleChangePassword(u.id)}
                    >
                      OK
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => { setChangingPw(null); setNewPw(""); }}
                    >
                      ✕
                    </Button>
                  </div>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                      onClick={() => setChangingPw(u.id)}
                      title="Changer le mot de passe"
                    >
                      <Key className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(u.id, u.username)}
                      title="Supprimer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UsersSection;
