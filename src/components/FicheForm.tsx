import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FicheConditionnement } from "@/types";
import { ArrowLeft, Upload, X, Loader2, Sparkles, ImagePlus, Camera } from "lucide-react";
import { extractFicheRemote } from "@/lib/mysql-storage";
import { toast } from "sonner";
import { isNativePlatform, pickImageFromGallery, takePhoto } from "@/lib/native-storage";

const emptyFiche = (): FicheConditionnement => ({
  id: crypto.randomUUID(),
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
  imageUrl: "",
  notes: "",
  createdAt: new Date().toISOString(),
});

interface Props {
  fiche: FicheConditionnement | null;
  onSave: (fiche: FicheConditionnement) => void;
  onCancel: () => void;
  aiEnabled?: boolean;
}

const fields: { key: keyof FicheConditionnement; label: string; section: string }[] = [
  { key: "codeProduit", label: "Code Produit", section: "Identification" },
  { key: "reference", label: "Référence", section: "Identification" },
  { key: "dateApplication", label: "Date d'application", section: "Identification" },
  { key: "designation", label: "Désignation produit", section: "Identification" },
  { key: "client", label: "Client", section: "Identité" },
  { key: "marque", label: "Marque", section: "Identité" },
  { key: "gencod", label: "GENCOD", section: "Identité" },
  { key: "bouteille", label: "Bouteille", section: "Conditionnement" },
  { key: "bouchon", label: "Bouchon", section: "Conditionnement" },
  { key: "etiquette", label: "Étiquette", section: "Conditionnement" },
  { key: "colle", label: "Colle", section: "Conditionnement" },
  { key: "dluo", label: "DLUO", section: "Conditionnement" },
  { key: "carton", label: "Carton", section: "Emballage" },
  { key: "collerCarton", label: "Colle carton", section: "Emballage" },
  { key: "etiquetteCarton", label: "Étiquette carton", section: "Emballage" },
  { key: "intercalaire", label: "Intercalaire", section: "Emballage" },
  { key: "typePalette", label: "Type palette", section: "Palettisation" },
  { key: "palettisation", label: "Palettisation", section: "Palettisation" },
  { key: "uvcParCarton", label: "UVC par carton", section: "Palettisation" },
  { key: "cartonsParCouche", label: "Cartons par couche", section: "Palettisation" },
  { key: "couchesParPalette", label: "Couches par palette", section: "Palettisation" },
  { key: "uvcParPalette", label: "UVC par palette", section: "Palettisation" },
  { key: "filmEtirable", label: "Film étirable", section: "Palettisation" },
  { key: "etiquettePalette", label: "Étiquette palette", section: "Palettisation" },
];

const FicheForm = ({ fiche, onSave, onCancel, aiEnabled = false }: Props) => {
  const [data, setData] = useState<FicheConditionnement>(fiche || emptyFiche());
  const [extracting, setExtracting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const update = (key: keyof FicheConditionnement, value: string) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const handleExtract = async (base64: string) => {
    setExtracting(true);
    toast.info("Extraction des informations en cours...");
    try {
      const { data: result, error } = await supabase.functions.invoke("extract-fiche", {
        body: { imageBase64: base64 },
      });
      if (error) throw error;
      if (result.error) throw new Error(result.error);
      const extractedFields: (keyof FicheConditionnement)[] = [
        "codeProduit", "reference", "dateApplication", "designation",
        "client", "marque", "gencod", "bouteille", "bouchon", "etiquette",
        "colle", "dluo", "carton", "collerCarton", "etiquetteCarton",
        "intercalaire", "typePalette", "palettisation", "uvcParCarton",
        "cartonsParCouche", "couchesParPalette", "uvcParPalette",
        "filmEtirable", "etiquettePalette",
      ];
      setData((prev) => {
        const updated = { ...prev };
        for (const key of extractedFields) {
          if (result[key]) {
            (updated as any)[key] = result[key];
          }
        }
        if (result.autoTitle) updated.designation = result.autoTitle;
        return updated;
      });
      toast.success("Informations extraites avec succès !");
    } catch (err) {
      console.error("Extraction error:", err);
      toast.error("Erreur lors de l'extraction. Remplissez les champs manuellement.");
    } finally {
      setExtracting(false);
    }
  };

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      update("imageUrl", base64);
      if (aiEnabled) {
        await handleExtract(base64);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleNativeImage = async (img: string | null) => {
    if (!img) return;
    update("imageUrl", img);
    if (aiEnabled) {
      await handleExtract(img);
    }
  };

  const sections = [...new Set(fields.map((f) => f.section))];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="font-display text-lg font-bold text-foreground">
          {fiche ? "Modifier la fiche" : "Nouvelle fiche"}
        </h2>
      </div>

      {/* Image upload */}
      <div className="rounded-lg border border-dashed border-border bg-card p-6">
        <input type="file" ref={fileRef} accept="image/*" className="hidden" onChange={handleImage} />
        {data.imageUrl ? (
          <div className="relative">
            <img src={data.imageUrl} alt="Fiche" className="max-h-64 rounded-lg mx-auto" />
            {extracting && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
                <div className="flex items-center gap-2 text-primary">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="font-display text-sm font-semibold">Extraction IA en cours...</span>
                </div>
              </div>
            )}
            {!extracting && (
              <Button
                size="sm"
                variant="destructive"
                className="absolute top-2 right-2"
                onClick={() => update("imageUrl", "")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ) : (
          <div className="w-full flex flex-col items-center gap-4 py-6">
            <div className="relative">
              <Upload className="h-8 w-8 text-muted-foreground" />
              {aiEnabled && <Sparkles className="h-4 w-4 text-primary absolute -top-1 -right-2" />}
            </div>
            {aiEnabled ? (
              <span className="text-xs text-primary">L'IA extraira automatiquement les infos</span>
            ) : (
              <span className="text-xs text-muted-foreground">IA désactivée — remplissage manuel</span>
            )}
            <div className="flex gap-3 flex-wrap justify-center">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={async () => {
                  if (isNativePlatform()) {
                    await handleNativeImage(await pickImageFromGallery());
                  } else {
                    fileRef.current?.click();
                  }
                }}
              >
                <ImagePlus className="h-4 w-4" />
                Galerie
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={async () => {
                  if (isNativePlatform()) {
                    await handleNativeImage(await takePhoto());
                  } else {
                    fileRef.current?.click();
                  }
                }}
              >
                <Camera className="h-4 w-4" />
                Photo
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Fields by section */}
      {sections.map((section) => (
        <div key={section} className="space-y-3">
          <h3 className="font-display text-sm font-semibold text-primary uppercase tracking-wider">
            {section}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {fields
              .filter((f) => f.section === section)
              .map((field) => (
                <div key={field.key} className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{field.label}</Label>
                  <Input
                    value={(data[field.key] as string) || ""}
                    onChange={(e) => update(field.key, e.target.value)}
                    className="bg-secondary border-border text-sm"
                    placeholder={field.label}
                  />
                </div>
              ))}
          </div>
        </div>
      ))}

      {/* Notes */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Notes supplémentaires</Label>
        <Textarea
          value={data.notes}
          onChange={(e) => update("notes", e.target.value)}
          className="bg-secondary border-border min-h-[80px]"
          placeholder="Notes, remarques..."
        />
      </div>

      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button onClick={() => onSave(data)} disabled={extracting}>
          Enregistrer
        </Button>
      </div>
    </div>
  );
};

export default FicheForm;
