import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Trash2, Edit, Tag, X, ArrowLeft, ChevronDown, ChevronRight, Wrench, Eye, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FormatNote, MachineNote, MACHINES, MachineName } from "@/types";
import { getNotes, saveNote, deleteNote } from "@/lib/storage";
import { getNotesRemote, saveNoteRemote, deleteNoteRemote } from "@/lib/mysql-storage";
import { toast } from "sonner";
import { generateAndPrintNote } from "@/lib/print-note";
import { generateUUID } from "@/lib/uuid";

// --- Note Detail View ---
const NoteDetail = ({
  note,
  onBack,
  onEdit,
}: {
  note: FormatNote;
  onBack: () => void;
  onEdit: () => void;
}) => {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="font-display text-lg font-bold text-foreground">{note.title}</h2>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="gap-2" onClick={() => generateAndPrintNote(note)}>
            <Printer className="h-4 w-4" />
            Imprimer
          </Button>
          <Button size="sm" variant="outline" className="gap-2" onClick={onEdit}>
            <Edit className="h-4 w-4" />
            Modifier
          </Button>
        </div>
      </div>

      {note.content && (
        <div className="rounded-lg bg-card border border-border p-4">
          <p className="text-xs text-muted-foreground font-display uppercase mb-2">Notes générales</p>
          <p className="text-sm text-foreground whitespace-pre-wrap">{note.content}</p>
        </div>
      )}

      {note.keywords.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {note.keywords.map((kw) => (
            <span
              key={kw}
              className="inline-flex items-center rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-medium text-primary"
            >
              {kw}
            </span>
          ))}
        </div>
      )}

      {(note.machines || []).length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground font-display uppercase tracking-wider">
            Zones Machines
          </p>
          {note.machines.map((m) => (
            <div
              key={m.machine}
              className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-2"
            >
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-primary" />
                <span className="font-display text-sm font-bold text-primary">{m.machine}</span>
              </div>
              {m.content && (
                <p className="text-sm text-foreground whitespace-pre-wrap">{m.content}</p>
              )}
              {m.keywords.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {m.keywords.map((kw) => (
                    <span
                      key={kw}
                      className="inline-flex items-center rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground text-right">
        Mis à jour : {new Date(note.updatedAt).toLocaleDateString("fr-FR")}
      </p>
    </div>
  );
};

// --- Main Section ---
const NotesSection = () => {
  const [notes, setNotes] = useState<FormatNote[]>(getNotes());
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<FormatNote | null>(null);
  const [viewing, setViewing] = useState<FormatNote | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadNotes = useCallback(async () => {
    try {
      const remote = await getNotesRemote();
      setNotes(remote);
    } catch {
      setNotes(getNotes());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadNotes(); }, [loadNotes]);

  const filtered = notes.filter((n) => {
    const q = search.toLowerCase();
    return (
      n.title.toLowerCase().includes(q) ||
      n.content.toLowerCase().includes(q) ||
      n.keywords.some((k) => k.toLowerCase().includes(q)) ||
      (n.machines || []).some(
        (m) =>
          m.machine.toLowerCase().includes(q) ||
          m.content.toLowerCase().includes(q) ||
          m.keywords.some((k) => k.toLowerCase().includes(q))
      )
    );
  });

  const handleSave = async (note: FormatNote) => {
    saveNote(note);
    setShowForm(false);
    setEditing(null);
    try {
      await saveNoteRemote(note);
      toast.success("Note sauvegardée en base de données");
    } catch {
      toast.error("Erreur MySQL — sauvegarde locale uniquement");
    }
    await loadNotes();
  };

  const handleDelete = async (id: string) => {
    deleteNote(id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
    try {
      await deleteNoteRemote(id);
    } catch {
      toast.error("Erreur MySQL — suppression locale uniquement");
    }
  };

  if (viewing) {
    return (
      <NoteDetail
        note={viewing}
        onBack={() => setViewing(null)}
        onEdit={() => {
          setEditing(viewing);
          setViewing(null);
        }}
      />
    );
  }

  if (showForm || editing) {
    return (
      <NoteForm
        note={editing}
        onSave={handleSave}
        onCancel={() => {
          setShowForm(false);
          setEditing(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher par machine, mot-clé..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-card border-border"
          />
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouvelle note
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <p className="text-sm">Chargement...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Tag className="h-12 w-12 mb-4 opacity-50" />
          <p className="text-lg font-display">Aucune note</p>
          <p className="text-sm">Créez des notes pour vos changements de format</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((note) => (
            <div
              key={note.id}
              className="rounded-lg border border-border bg-card p-4 hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => setViewing(note)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-sm font-semibold text-foreground">
                    {note.title}
                  </h3>
                  {note.content && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {note.content}
                    </p>
                  )}
                  {(note.machines || []).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {note.machines.map((m) => (
                        <span
                          key={m.machine}
                          className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground"
                        >
                          <Wrench className="h-3 w-3" />
                          {m.machine}
                        </span>
                      ))}
                    </div>
                  )}
                  {note.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {note.keywords.map((kw) => (
                        <span
                          key={kw}
                          className="inline-flex items-center rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-medium text-primary"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewing(note);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditing(note);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(note.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Note Form with Machine Zones ---

interface NoteFormProps {
  note: FormatNote | null;
  onSave: (note: FormatNote) => void;
  onCancel: () => void;
}

const NoteForm = ({ note, onSave, onCancel }: NoteFormProps) => {
  const [title, setTitle] = useState(note?.title || "");
  const [content, setContent] = useState(note?.content || "");
  const [keywords, setKeywords] = useState<string[]>(note?.keywords || []);
  const [kwInput, setKwInput] = useState("");
  const [machines, setMachines] = useState<MachineNote[]>(note?.machines || []);
  const [expandedMachines, setExpandedMachines] = useState<Set<MachineName>>(
    new Set(note?.machines?.map((m) => m.machine) || [])
  );

  const addKeyword = () => {
    const kw = kwInput.trim();
    if (kw && !keywords.includes(kw)) setKeywords([...keywords, kw]);
    setKwInput("");
  };

  const toggleMachine = (machine: MachineName) => {
    const exists = machines.find((m) => m.machine === machine);
    if (exists) {
      setExpandedMachines((prev) => {
        const next = new Set(prev);
        if (next.has(machine)) next.delete(machine);
        else next.add(machine);
        return next;
      });
    } else {
      setMachines([...machines, { machine, content: "", keywords: [] }]);
      setExpandedMachines((prev) => new Set(prev).add(machine));
    }
  };

  const removeMachine = (machine: MachineName) => {
    setMachines(machines.filter((m) => m.machine !== machine));
    setExpandedMachines((prev) => {
      const next = new Set(prev);
      next.delete(machine);
      return next;
    });
  };

  const updateMachineContent = (machine: MachineName, content: string) => {
    setMachines(machines.map((m) => (m.machine === machine ? { ...m, content } : m)));
  };

  const addMachineKeyword = (machine: MachineName, kw: string) => {
    const trimmed = kw.trim();
    if (!trimmed) return;
    setMachines(
      machines.map((m) =>
        m.machine === machine && !m.keywords.includes(trimmed)
          ? { ...m, keywords: [...m.keywords, trimmed] }
          : m
      )
    );
  };

  const removeMachineKeyword = (machine: MachineName, kw: string) => {
    setMachines(
      machines.map((m) =>
        m.machine === machine ? { ...m, keywords: m.keywords.filter((k) => k !== kw) } : m
      )
    );
  };

  const handleSubmit = () => {
    const now = new Date().toISOString();
    onSave({
      id: note?.id || crypto.randomUUID(),
      title,
      content,
      keywords,
      machines: machines.filter((m) => m.content.trim() || m.keywords.length > 0),
      createdAt: note?.createdAt || now,
      updatedAt: now,
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="font-display text-lg font-bold text-foreground">
          {note ? "Modifier la note" : "Nouvelle note"}
        </h2>
      </div>

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Titre</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-secondary border-border"
          placeholder="Ex: Changement format Rustica 50cl"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Notes générales</Label>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="bg-secondary border-border min-h-[80px]"
          placeholder="Notes générales sur le changement de format..."
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Mots-clés généraux</Label>
        <div className="flex gap-2">
          <Input
            value={kwInput}
            onChange={(e) => setKwInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addKeyword())}
            className="bg-secondary border-border"
            placeholder="Ajouter un mot-clé + Entrée"
          />
          <Button variant="outline" onClick={addKeyword} type="button">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {keywords.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {keywords.map((kw) => (
              <span
                key={kw}
                className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-medium text-primary"
              >
                {kw}
                <button onClick={() => setKeywords(keywords.filter((k) => k !== kw))}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Machine Zones */}
      <div className="space-y-3">
        <Label className="text-xs text-muted-foreground uppercase tracking-wider">
          Zones Machines
        </Label>
        <div className="grid gap-2">
          {MACHINES.map((machine) => {
            const machineNote = machines.find((m) => m.machine === machine);
            const isExpanded = expandedMachines.has(machine);
            const isActive = !!machineNote;

            return (
              <div
                key={machine}
                className={`rounded-lg border transition-colors ${
                  isActive ? "border-primary/50 bg-primary/5" : "border-border bg-card"
                }`}
              >
                <button
                  type="button"
                  className="w-full flex items-center justify-between p-3 text-left"
                  onClick={() => toggleMachine(machine)}
                >
                  <div className="flex items-center gap-2">
                    <Wrench className={`h-4 w-4 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                    <span className={`font-display text-sm font-semibold ${isActive ? "text-primary" : "text-foreground"}`}>
                      {machine}
                    </span>
                  </div>
                  {isActive ? (
                    isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Plus className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>

                {isActive && isExpanded && (
                  <div className="px-3 pb-3 space-y-3">
                    <Textarea
                      value={machineNote!.content}
                      onChange={(e) => updateMachineContent(machine, e.target.value)}
                      className="bg-secondary border-border min-h-[60px] text-sm"
                      placeholder={`Réglages, points d'attention pour ${machine}...`}
                    />
                    <MachineKeywordInput
                      keywords={machineNote!.keywords}
                      onAdd={(kw) => addMachineKeyword(machine, kw)}
                      onRemove={(kw) => removeMachineKeyword(machine, kw)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive text-xs"
                      onClick={() => removeMachine(machine)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Retirer {machine}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button onClick={handleSubmit} disabled={!title.trim()}>
          Enregistrer
        </Button>
      </div>
    </div>
  );
};

const MachineKeywordInput = ({
  keywords,
  onAdd,
  onRemove,
}: {
  keywords: string[];
  onAdd: (kw: string) => void;
  onRemove: (kw: string) => void;
}) => {
  const [input, setInput] = useState("");
  return (
    <div className="space-y-1.5">
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onAdd(input);
              setInput("");
            }
          }}
          className="bg-secondary border-border text-sm"
          placeholder="Mot-clé machine + Entrée"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            onAdd(input);
            setInput("");
          }}
          type="button"
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
      {keywords.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {keywords.map((kw) => (
            <span
              key={kw}
              className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground"
            >
              {kw}
              <button onClick={() => onRemove(kw)}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotesSection;
