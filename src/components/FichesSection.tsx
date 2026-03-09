import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, Search, Trash2, Eye, Image, Images, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FicheConditionnement } from "@/types";
import { getFiches, saveFiche, deleteFiche } from "@/lib/storage";
import { getFichesRemote, saveFicheRemote, deleteFicheRemote } from "@/lib/mysql-storage";
import { extractFicheCloud } from "@/lib/cloud-extract";
import { generateUUID } from "@/lib/uuid";
import FicheForm from "./FicheForm";
import FicheDetail from "./FicheDetail";
import { toast } from "sonner";

const emptyFiche = (imageUrl: string): FicheConditionnement => ({
  id: generateUUID(),
  codeProduit: "",
  reference: "",
  dateApplication: "",
  designation: "",
  client: "",
  marque: "",
  gencod: "",
  bouteille: "",
  bouchon: "",
  etiquette: "",
  colle: "",
  dluo: "",
  carton: "",
  collerCarton: "",
  etiquetteCarton: "",
  intercalaire: "",
  typePalette: "",
  palettisation: "",
  uvcParCarton: "",
  cartonsParCouche: "",
  couchesParPalette: "",
  uvcParPalette: "",
  filmEtirable: "",
  etiquettePalette: "",
  imageUrl,
  notes: "",
  createdAt: new Date().toISOString(),
});

const extractedFields: (keyof FicheConditionnement)[] = [
  "codeProduit", "reference", "dateApplication", "designation",
  "client", "marque", "gencod", "bouteille", "bouchon", "etiquette",
  "colle", "dluo", "carton", "collerCarton", "etiquetteCarton",
  "intercalaire", "typePalette", "palettisation", "uvcParCarton",
  "cartonsParCouche", "couchesParPalette", "uvcParPalette",
  "filmEtirable", "etiquettePalette",
];

const FichesSection = ({ aiEnabled }: { aiEnabled: boolean }) => {
  const [fiches, setFiches] = useState<FicheConditionnement[]>(getFiches());
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingFiche, setEditingFiche] = useState<FicheConditionnement | null>(null);
  const [viewingFiche, setViewingFiche] = useState<FicheConditionnement | null>(null);
  const [loading, setLoading] = useState(true);
  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number } | null>(null);
  const bulkRef = useRef<HTMLInputElement>(null);

  const loadFiches = useCallback(async () => {
    try {
      const remote = await getFichesRemote();
      setFiches(remote);
    } catch {
      setFiches(getFiches());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadFiches(); }, [loadFiches]);

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

  const handleSave = async (fiche: FicheConditionnement) => {
    saveFiche(fiche);
    setShowForm(false);
    setEditingFiche(null);
    try {
      await saveFicheRemote(fiche);
      toast.success("Fiche sauvegardée en base de données");
    } catch {
      toast.error("Erreur MySQL — sauvegarde locale uniquement");
    }
    await loadFiches();
  };

  const handleDelete = async (id: string) => {
    deleteFiche(id);
    setFiches((prev) => prev.filter((f) => f.id !== id));
    try {
      await deleteFicheRemote(id);
    } catch {
      toast.error("Erreur MySQL — suppression locale uniquement");
    }
  };

  // --- Bulk upload: 1 photo = 1 fiche automatique ---
  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const total = files.length;
    setBulkProgress({ current: 0, total });
    toast.info(`Import de ${total} photo${total > 1 ? "s" : ""} en cours...`);

    const readFileAsBase64 = (file: File): Promise<string> =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

    let successCount = 0;

    for (let i = 0; i < total; i++) {
      setBulkProgress({ current: i + 1, total });
      try {
        const base64 = await readFileAsBase64(files[i]);
        const fiche = emptyFiche(base64);

        // AI extraction si activée
        if (aiEnabled) {
          try {
            const result = await extractFicheCloud(base64);
            if (!result.error) {
              for (const key of extractedFields) {
                if (result[key]) {
                  (fiche as any)[key] = result[key];
                }
              }
              if (result.autoTitle) fiche.designation = result.autoTitle;
            }
          } catch (err) {
            console.error(`Extraction IA échouée pour photo ${i + 1}:`, err);
          }
        }

        // Sauvegarder
        saveFiche(fiche);
        try {
          await saveFicheRemote(fiche);
        } catch {
          // Sauvegarde locale uniquement
        }
        successCount++;
      } catch (err) {
        console.error(`Erreur photo ${i + 1}:`, err);
        toast.error(`Erreur sur la photo ${i + 1}`);
      }
    }

    setBulkProgress(null);
    // Reset input
    if (bulkRef.current) bulkRef.current.value = "";

    await loadFiches();

    if (successCount > 0) {
      toast.success(
        `${successCount} fiche${successCount > 1 ? "s" : ""} créée${successCount > 1 ? "s" : ""} avec succès${aiEnabled ? " (IA)" : ""}`
      );
    }
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
      {/* Barre de progression import en lot */}
      {bulkProgress && (
        <div className="rounded-lg border border-primary/50 bg-primary/5 p-4">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <div className="flex-1">
              <p className="font-display text-sm font-semibold text-foreground">
                Import en cours… {bulkProgress.current}/{bulkProgress.total}
              </p>
              {aiEnabled && (
                <p className="text-xs text-primary flex items-center gap-1 mt-0.5">
                  <Sparkles className="h-3 w-3" />
                  Extraction IA automatique
                </p>
              )}
            </div>
          </div>
          <div className="mt-3 h-2 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher par produit, code, client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-card border-border"
          />
        </div>
        <input
          type="file"
          ref={bulkRef}
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleBulkUpload}
        />
        <Button
          variant="outline"
          onClick={() => bulkRef.current?.click()}
          className="gap-2"
          disabled={!!bulkProgress}
        >
          <Images className="h-4 w-4" />
          Import photos
          {aiEnabled && <Sparkles className="h-3 w-3 text-primary" />}
        </Button>
        <Button onClick={() => setShowForm(true)} className="gap-2" disabled={!!bulkProgress}>
          <Plus className="h-4 w-4" />
          Nouvelle fiche
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <p className="text-sm">Chargement...</p>
        </div>
      ) : filtered.length === 0 ? (
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
