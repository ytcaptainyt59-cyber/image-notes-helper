import { useState } from "react";
import { Plus, Search, Trash2, Eye, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FicheConditionnement } from "@/types";
import { getFiches, saveFiche, deleteFiche } from "@/lib/storage";
import FicheForm from "./FicheForm";
import FicheDetail from "./FicheDetail";

const FichesSection = ({ aiEnabled }: { aiEnabled: boolean }) => {
  const [fiches, setFiches] = useState<FicheConditionnement[]>(getFiches());
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingFiche, setEditingFiche] = useState<FicheConditionnement | null>(null);
  const [viewingFiche, setViewingFiche] = useState<FicheConditionnement | null>(null);

  const refresh = () => setFiches(getFiches());

  const filtered = fiches.filter((f) => {
    const q = search.toLowerCase();
    return (
      f.designation.toLowerCase().includes(q) ||
      f.codeProduit.toLowerCase().includes(q) ||
      f.reference.toLowerCase().includes(q) ||
      f.client.toLowerCase().includes(q) ||
      f.marque.toLowerCase().includes(q)
    );
  });

  const handleSave = (fiche: FicheConditionnement) => {
    saveFiche(fiche);
    refresh();
    setShowForm(false);
    setEditingFiche(null);
  };

  const handleDelete = (id: string) => {
    deleteFiche(id);
    refresh();
  };

  if (viewingFiche) {
    return (
      <FicheDetail
        fiche={viewingFiche}
        onBack={() => setViewingFiche(null)}
        onEdit={() => {
          setEditingFiche(viewingFiche);
          setShowForm(true);
          setViewingFiche(null);
        }}
      />
    );
  }

  if (showForm || editingFiche) {
    return (
      <FicheForm
        fiche={editingFiche}
        onSave={handleSave}
        onCancel={() => {
          setShowForm(false);
          setEditingFiche(null);
        }}
        aiEnabled={aiEnabled}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher par produit, code, client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-card border-border"
          />
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouvelle fiche
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Image className="h-12 w-12 mb-4 opacity-50" />
          <p className="text-lg font-display">Aucune fiche</p>
          <p className="text-sm">Ajoutez votre première fiche de conditionnement</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((fiche) => (
            <div
              key={fiche.id}
              className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => setViewingFiche(fiche)}
            >
              {fiche.imageUrl ? (
                <img
                  src={fiche.imageUrl}
                  alt="Fiche"
                  className="h-16 w-16 rounded object-cover border border-border"
                />
              ) : (
                <div className="h-16 w-16 rounded bg-secondary flex items-center justify-center">
                  <FileIcon className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-display text-sm font-semibold text-foreground truncate">
                  {fiche.designation || "Sans désignation"}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {fiche.codeProduit && `Code: ${fiche.codeProduit}`}
                  {fiche.client && ` · ${fiche.client}`}
                  {fiche.marque && ` · ${fiche.marque}`}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(fiche.createdAt).toLocaleDateString("fr-FR")}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    setViewingFiche(fiche);
                  }}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(fiche.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const FileIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

export default FichesSection;
