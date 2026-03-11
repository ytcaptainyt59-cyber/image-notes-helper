import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Trash2, Edit2, ChevronDown, ChevronRight, AlertTriangle, Wrench, ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MachineDefaut, MACHINES, MachineName } from "@/types";
import { getDefauts, saveDefaut, deleteDefaut } from "@/lib/storage";
import { getDefautsRemote, saveDefautRemote, deleteDefautRemote } from "@/lib/mysql-storage";
import { generateUUID } from "@/lib/uuid";
import { toast } from "sonner";

const machineIcons: Record<MachineName, string> = {
  "POSIMAT": "📦",
  "TIREUSE VINAIGRETTE": "🫗",
  "TIREUSE VINAIGRE": "🍶",
  "BOUCHONNEUSE": "🔩",
  "ÉTIQUETEUSE": "🏷️",
  "PRASMATIC": "📐",
};

const severityConfig = {
  low: { label: "Faible", class: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  medium: { label: "Moyen", class: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  high: { label: "Critique", class: "bg-red-500/20 text-red-400 border-red-500/30" },
};

const DefautsSection = () => {
  const [defauts, setDefauts] = useState<MachineDefaut[]>(getDefauts());
  const [search, setSearch] = useState("");
  const [filterMachine, setFilterMachine] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [editingDefaut, setEditingDefaut] = useState<MachineDefaut | null>(null);
  const [expandedMachines, setExpandedMachines] = useState<Set<string>>(new Set(MACHINES));
  const [loading, setLoading] = useState(true);

  const loadDefauts = useCallback(async () => {
    try {
      const remote = await getDefautsRemote();
      setDefauts(remote);
    } catch {
      setDefauts(getDefauts());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDefauts(); }, [loadDefauts]);

  const filtered = defauts.filter((d) => {
    const q = search.toLowerCase();
    const matchSearch = d.title.toLowerCase().includes(q) ||
      d.description.toLowerCase().includes(q) ||
      d.solution.toLowerCase().includes(q) ||
      d.machine.toLowerCase().includes(q);
    const matchMachine = filterMachine === "all" || d.machine === filterMachine;
    return matchSearch && matchMachine;
  });

  // Grouper par machine
  const grouped = MACHINES.reduce((acc, machine) => {
    const items = filtered.filter((d) => d.machine === machine);
    if (items.length > 0) acc.set(machine, items);
    return acc;
  }, new Map<MachineName, MachineDefaut[]>());

  const toggleMachine = (machine: string) => {
    setExpandedMachines((prev) => {
      const next = new Set(prev);
      if (next.has(machine)) next.delete(machine);
      else next.add(machine);
      return next;
    });
  };

  const handleSave = async (defaut: MachineDefaut) => {
    saveDefaut(defaut);
    setShowForm(false);
    setEditingDefaut(null);
    try {
      await saveDefautRemote(defaut);
      toast.success("Défaut sauvegardé");
    } catch {
      toast.error("Erreur serveur — sauvegarde locale uniquement");
    }
    await loadDefauts();
  };

  const handleDelete = async (id: string) => {
    deleteDefaut(id);
    setDefauts((prev) => prev.filter((d) => d.id !== id));
    try {
      await deleteDefautRemote(id);
    } catch {
      toast.error("Erreur serveur — suppression locale uniquement");
    }
  };

  if (showForm || editingDefaut) {
    return (
      <DefautForm
        defaut={editingDefaut}
        onSave={handleSave}
        onCancel={() => { setShowForm(false); setEditingDefaut(null); }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 sm:gap-3 flex-wrap">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un défaut..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-card border-border text-sm"
          />
        </div>
        <Select value={filterMachine} onValueChange={setFilterMachine}>
          <SelectTrigger className="w-[140px] sm:w-[180px] bg-card border-border text-sm h-9 sm:h-10">
            <SelectValue placeholder="Machine" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            {MACHINES.map((m) => (
              <SelectItem key={m} value={m}>
                {machineIcons[m]} {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5 sm:gap-2 h-9 sm:h-10 text-xs sm:text-sm">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nouveau défaut</span>
          <span className="sm:hidden">Ajouter</span>
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <p className="text-sm">Chargement...</p>
        </div>
      ) : grouped.size === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <AlertTriangle className="h-12 w-12 mb-4 opacity-50" />
          <p className="text-lg font-display">Aucun défaut enregistré</p>
          <p className="text-sm">Documentez les défauts rencontrés sur vos machines</p>
        </div>
      ) : (
        <div className="space-y-3">
          {Array.from(grouped.entries()).map(([machine, items]) => (
            <div key={machine} className="rounded-xl border border-border bg-card overflow-hidden">
              <button
                onClick={() => toggleMachine(machine)}
                className="w-full flex items-center gap-3 p-3 sm:p-4 hover:bg-secondary/30 transition-colors"
              >
                {expandedMachines.has(machine) ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                )}
                <span className="text-lg">{machineIcons[machine]}</span>
                <span className="font-display text-sm font-semibold text-foreground uppercase tracking-wide">
                  {machine}
                </span>
                <span className="ml-auto text-xs text-muted-foreground font-mono bg-secondary rounded-full px-2 py-0.5">
                  {items.length}
                </span>
              </button>

              {expandedMachines.has(machine) && (
                <div className="border-t border-border/50 divide-y divide-border/30">
                  {items.map((defaut) => (
                    <div key={defaut.id} className="p-3 sm:p-4 hover:bg-secondary/10 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-display text-sm font-semibold text-foreground">
                              {defaut.title}
                            </h4>
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border ${severityConfig[defaut.severity].class}`}>
                              {severityConfig[defaut.severity].label}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {defaut.description}
                          </p>
                          {defaut.solution && (
                            <div className="flex items-start gap-1.5 mt-2 p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                              <Wrench className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                              <p className="text-xs text-emerald-300 line-clamp-2">{defaut.solution}</p>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => setEditingDefaut(defaut)}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(defaut.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Form ---
interface DefautFormProps {
  defaut: MachineDefaut | null;
  onSave: (d: MachineDefaut) => void;
  onCancel: () => void;
}

const DefautForm = ({ defaut, onSave, onCancel }: DefautFormProps) => {
  const [machine, setMachine] = useState<MachineName>(defaut?.machine || MACHINES[0]);
  const [title, setTitle] = useState(defaut?.title || "");
  const [description, setDescription] = useState(defaut?.description || "");
  const [solution, setSolution] = useState(defaut?.solution || "");
  const [severity, setSeverity] = useState<"low" | "medium" | "high">(defaut?.severity || "medium");

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error("Le titre est requis");
      return;
    }
    onSave({
      id: defaut?.id || generateUUID(),
      machine,
      title: title.trim(),
      description: description.trim(),
      solution: solution.trim(),
      severity,
      createdAt: defaut?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onCancel} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>
        <h2 className="font-display text-lg font-bold text-foreground">
          {defaut ? "Modifier le défaut" : "Nouveau défaut"}
        </h2>
      </div>

      <div className="space-y-4 rounded-xl border border-border bg-card p-4 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="font-display text-xs uppercase tracking-wider text-muted-foreground">Machine</Label>
            <Select value={machine} onValueChange={(v) => setMachine(v as MachineName)}>
              <SelectTrigger className="bg-secondary/50 border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MACHINES.map((m) => (
                  <SelectItem key={m} value={m}>
                    {machineIcons[m]} {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="font-display text-xs uppercase tracking-wider text-muted-foreground">Sévérité</Label>
            <Select value={severity} onValueChange={(v) => setSeverity(v as "low" | "medium" | "high")}>
              <SelectTrigger className="bg-secondary/50 border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">🟢 Faible</SelectItem>
                <SelectItem value="medium">🟡 Moyen</SelectItem>
                <SelectItem value="high">🔴 Critique</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="font-display text-xs uppercase tracking-wider text-muted-foreground">Titre du défaut</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Bouteille mal positionnée sur le tapis"
            className="bg-secondary/50 border-border"
          />
        </div>

        <div className="space-y-2">
          <Label className="font-display text-xs uppercase tracking-wider text-muted-foreground">Description du problème</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Décrivez le défaut, quand il survient, les symptômes..."
            rows={4}
            className="bg-secondary/50 border-border resize-none"
          />
        </div>

        <div className="space-y-2">
          <Label className="font-display text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Wrench className="h-3.5 w-3.5 text-emerald-400" />
            Solution / Réglage
          </Label>
          <Textarea
            value={solution}
            onChange={(e) => setSolution(e.target.value)}
            placeholder="Comment résoudre ce problème, quels réglages appliquer..."
            rows={4}
            className="bg-secondary/50 border-border resize-none"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Annuler
          </Button>
          <Button onClick={handleSubmit} className="flex-1 gap-2">
            <Save className="h-4 w-4" />
            {defaut ? "Modifier" : "Enregistrer"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DefautsSection;
