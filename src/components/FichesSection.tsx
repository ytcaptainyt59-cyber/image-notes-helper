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
      f.marque.toLowerCase().includes(q) ||
      f.gencod.toLowerCase().includes(q) ||
      f.etiquette.toLowerCase().includes(q) ||
      f.bouteille.toLowerCase().includes(q) ||
      f.bouchon.toLowerCase().includes(q)
    );
  });

  // Détection des doublons par gencod
  const gencodCount = new Map<string, number>();
  fiches.forEach((f) => {
    if (f.gencod) {
      gencodCount.set(f.gencod, (gencodCount.get(f.gencod) || 0) + 1);
    }
  });
  const isDuplicate = (f: FicheConditionnement) => !!f.gencod && (gencodCount.get(f.gencod) || 0) > 1;

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
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    // Convertir FileList en tableau pour un traitement fiable
    const files = Array.from(fileList);
    const total = files.length;
    setBulkProgress({ current: 0, total });
    toast.info(`Import de ${total} photo${total > 1 ? "s" : ""} en cours...`);

    // Reset input immédiatement pour permettre un nouveau sélection
    if (bulkRef.current) bulkRef.current.value = "";

    const readFileAsBase64 = (file: File): Promise<string> =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error(`Impossible de lire ${file.name}`));
        reader.readAsDataURL(file);
      });

    // Compresser l'image pour réduire la taille base64
    const compressImage = (base64: string, maxWidth = 1600): Promise<string> =>
      new Promise((resolve) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let { width, height } = img;
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.8));
        };
        img.onerror = () => resolve(base64); // fallback original
        img.src = base64;
      });

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < total; i++) {
      setBulkProgress({ current: i + 1, total });

      try {
        // 1. Lire et compresser l'image
        let base64: string;
        try {
          const raw = await readFileAsBase64(files[i]);
          base64 = await compressImage(raw);
        } catch (readErr: any) {
          toast.error(`Photo ${i + 1}: impossible de lire le fichier`);
          errorCount++;
          continue;
        }

        const fiche = emptyFiche(base64);

        // 2. Extraction IA si activée
        if (aiEnabled) {
          try {
            const result = await extractFicheCloud(base64);
            if (result && !result.error) {
              for (const key of extractedFields) {
                if (result[key]) {
                  (fiche as any)[key] = result[key];
                }
              }
              if (result.autoTitle) fiche.designation = result.autoTitle;
            }
          } catch (err: any) {
            console.error(`IA photo ${i + 1}:`, err);
            // Ne pas bloquer — la fiche sera créée sans extraction
          }
        }

        // 3. Sauvegarder en base distante
        let savedRemote = false;
        try {
          await saveFicheRemote(fiche);
          savedRemote = true;
        } catch (err) {
          console.error(`MySQL photo ${i + 1}:`, err);
        }

        // 4. Sauvegarder en local (fallback)
        try {
          saveFiche(fiche);
        } catch {
          if (!savedRemote) {
            toast.error(`Photo ${i + 1}: échec de sauvegarde`);
            errorCount++;
            continue;
          }
        }

        successCount++;
      } catch (err: any) {
        console.error(`Erreur inattendue photo ${i + 1}:`, err);
        errorCount++;
      }
    }

    setBulkProgress(null);
    await loadFiches();

    if (successCount > 0) {
      toast.success(
        `${successCount}/${total} fiche${successCount > 1 ? "s" : ""} créée${successCount > 1 ? "s" : ""}${aiEnabled ? " avec IA" : ""}`
      );
    }
    if (errorCount > 0 && successCount === 0) {
      toast.error("Aucune fiche n'a pu être créée. Vérifiez que votre serveur API est démarré.");
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

      <div className="flex gap-2 sm:gap-3 flex-wrap">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, gencod, marque, produit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-card border-border text-sm"
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
          size="sm"
          onClick={() => bulkRef.current?.click()}
          className="gap-1.5 sm:gap-2 h-9 sm:h-10 text-xs sm:text-sm"
          disabled={!!bulkProgress}
        >
          <Images className="h-4 w-4" />
          <span className="hidden sm:inline">Import photos</span>
          <span className="sm:hidden">Photos</span>
          {aiEnabled && <Sparkles className="h-3 w-3 text-primary" />}
        </Button>
        <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5 sm:gap-2 h-9 sm:h-10 text-xs sm:text-sm" disabled={!!bulkProgress}>
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nouvelle fiche</span>
          <span className="sm:hidden">Nouveau</span>
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
        <div className="grid gap-2 sm:gap-3">
          {filtered.map((fiche) => (
            <div
              key={fiche.id}
              className="flex items-center gap-3 sm:gap-4 rounded-xl border border-border bg-card p-3 sm:p-4 hover:border-primary/50 active:bg-card/80 transition-colors cursor-pointer"
              onClick={() => setViewingFiche(fiche)}
            >
              {fiche.imageUrl ? (
                <img
                  src={fiche.imageUrl}
                  alt="Fiche"
                  className="h-12 w-12 sm:h-16 sm:w-16 rounded-lg object-cover border border-border flex-shrink-0"
                />
              ) : (
                <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                  <FileIcon className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-display text-xs sm:text-sm font-semibold text-foreground truncate">
                  {fiche.designation || "Sans désignation"}
                </h3>
                {(() => {
                  const title = (fiche.designation || "").toLowerCase();
                  const extras = [
                    fiche.codeProduit,
                    ...(fiche.client && !title.includes(fiche.client.toLowerCase()) ? [fiche.client] : []),
                    ...(fiche.marque && !title.includes(fiche.marque.toLowerCase()) ? [fiche.marque] : []),
                    ...(fiche.etiquette && !title.includes(fiche.etiquette.toLowerCase()) ? [fiche.etiquette] : []),
                  ].filter(Boolean);
                  return extras.length > 0 ? (
                    <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 truncate">
                      {extras.join(" · ")}
                    </p>
                  ) : null;
                })()}
                {fiche.gencod && (
                  <p className="text-[10px] sm:text-[11px] text-accent font-mono mt-0.5 truncate">
                    EAN: {fiche.gencod}
                  </p>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 flex-shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
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
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
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
