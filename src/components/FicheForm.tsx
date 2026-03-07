import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FicheConditionnement } from "@/types";
import { ArrowLeft, Upload, X } from "lucide-react";

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

const FicheForm = ({ fiche, onSave, onCancel }: Props) => {
  const [data, setData] = useState<FicheConditionnement>(fiche || emptyFiche());
  const fileRef = useRef<HTMLInputElement>(null);

  const update = (key: keyof FicheConditionnement, value: string) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => update("imageUrl", reader.result as string);
    reader.readAsDataURL(file);
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
            <Button
              size="sm"
              variant="destructive"
              className="absolute top-2 right-2"
              onClick={() => update("imageUrl", "")}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full flex flex-col items-center gap-2 py-8 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Upload className="h-8 w-8" />
            <span className="text-sm">Cliquez pour ajouter la photo de la fiche</span>
          </button>
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
        <Button onClick={() => onSave(data)}>Enregistrer</Button>
      </div>
    </div>
  );
};

export default FicheForm;
