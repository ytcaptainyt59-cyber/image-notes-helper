import { useState } from "react";
import { Plus, Search, Trash2, Edit, Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FormatNote } from "@/types";
import { getNotes, saveNote, deleteNote } from "@/lib/storage";

const NotesSection = () => {
  const [notes, setNotes] = useState<FormatNote[]>(getNotes());
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<FormatNote | null>(null);
  const [showForm, setShowForm] = useState(false);

  const refresh = () => setNotes(getNotes());

  const filtered = notes.filter((n) => {
    const q = search.toLowerCase();
    return (
      n.title.toLowerCase().includes(q) ||
      n.content.toLowerCase().includes(q) ||
      n.keywords.some((k) => k.toLowerCase().includes(q))
    );
  });

  const handleSave = (note: FormatNote) => {
    saveNote(note);
    refresh();
    setShowForm(false);
    setEditing(null);
  };

  const handleDelete = (id: string) => {
    deleteNote(id);
    refresh();
  };

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
            placeholder="Rechercher par mot-clé, titre..."
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

      {filtered.length === 0 ? (
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
              className="rounded-lg border border-border bg-card p-4 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-sm font-semibold text-foreground">
                    {note.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {note.content}
                  </p>
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
                    onClick={() => setEditing(note)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(note.id)}
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

  const addKeyword = () => {
    const kw = kwInput.trim();
    if (kw && !keywords.includes(kw)) {
      setKeywords([...keywords, kw]);
    }
    setKwInput("");
  };

  const handleSubmit = () => {
    const now = new Date().toISOString();
    onSave({
      id: note?.id || crypto.randomUUID(),
      title,
      content,
      keywords,
      createdAt: note?.createdAt || now,
      updatedAt: now,
    });
  };

  return (
    <div className="space-y-4">
      <h2 className="font-display text-lg font-bold text-foreground">
        {note ? "Modifier la note" : "Nouvelle note"}
      </h2>

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
        <Label className="text-xs text-muted-foreground">Mots-clés</Label>
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

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Contenu</Label>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="bg-secondary border-border min-h-[150px]"
          placeholder="Décrivez les étapes, réglages, points d'attention..."
        />
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

export default NotesSection;
