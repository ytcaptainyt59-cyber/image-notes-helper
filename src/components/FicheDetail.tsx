import { FicheConditionnement } from "@/types";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit } from "lucide-react";

interface Props {
  fiche: FicheConditionnement;
  onBack: () => void;
  onEdit: () => void;
}

const detailFields: { key: keyof FicheConditionnement; label: string }[] = [
  { key: "codeProduit", label: "Code Produit" },
  { key: "reference", label: "Référence" },
  { key: "dateApplication", label: "Date d'application" },
  { key: "designation", label: "Désignation" },
  { key: "client", label: "Client" },
  { key: "marque", label: "Marque" },
  { key: "gencod", label: "GENCOD" },
  { key: "bouteille", label: "Bouteille" },
  { key: "bouchon", label: "Bouchon" },
  { key: "etiquette", label: "Étiquette" },
  { key: "colle", label: "Colle" },
  { key: "dluo", label: "DLUO" },
  { key: "carton", label: "Carton" },
  { key: "collerCarton", label: "Colle carton" },
  { key: "etiquetteCarton", label: "Étiquette carton" },
  { key: "intercalaire", label: "Intercalaire" },
  { key: "typePalette", label: "Type palette" },
  { key: "palettisation", label: "Palettisation" },
  { key: "uvcParCarton", label: "UVC/carton" },
  { key: "cartonsParCouche", label: "Cartons/couche" },
  { key: "couchesParPalette", label: "Couches/palette" },
  { key: "uvcParPalette", label: "UVC/palette" },
  { key: "filmEtirable", label: "Film étirable" },
  { key: "etiquettePalette", label: "Étiquette palette" },
];

const FicheDetail = ({ fiche, onBack, onEdit }: Props) => {
  const filledFields = detailFields.filter((f) => fiche[f.key]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="font-display text-lg font-bold text-foreground">
            {fiche.designation || "Fiche"}
          </h2>
        </div>
        <Button size="sm" variant="outline" className="gap-2" onClick={onEdit}>
          <Edit className="h-4 w-4" />
          Modifier
        </Button>
      </div>

      {fiche.imageUrl && (
        <div className="rounded-lg overflow-hidden border border-border">
          <img src={fiche.imageUrl} alt="Fiche" className="w-full max-h-96 object-contain bg-secondary" />
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        {filledFields.map((field) => (
          <div key={field.key} className="rounded-lg bg-card border border-border p-3">
            <p className="text-xs text-muted-foreground font-display uppercase">{field.label}</p>
            <p className="text-sm text-foreground mt-1">{fiche[field.key] as string}</p>
          </div>
        ))}
      </div>

      {fiche.notes && (
        <div className="rounded-lg bg-card border border-border p-4">
          <p className="text-xs text-muted-foreground font-display uppercase mb-2">Notes</p>
          <p className="text-sm text-foreground whitespace-pre-wrap">{fiche.notes}</p>
        </div>
      )}
    </div>
  );
};

export default FicheDetail;
