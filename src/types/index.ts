export interface FicheConditionnement {
  id: string;
  codeProduit: string;
  reference: string;
  dateApplication: string;
  designation: string;
  client: string;
  marque: string;
  gencod: string;
  bouteille: string;
  bouchon: string;
  etiquette: string;
  colle: string;
  dluo: string;
  carton: string;
  collerCarton: string;
  etiquetteCarton: string;
  intercalaire: string;
  typePalette: string;
  palettisation: string;
  uvcParCarton: string;
  cartonsParCouche: string;
  couchesParPalette: string;
  uvcParPalette: string;
  filmEtirable: string;
  etiquettePalette: string;
  imageUrl?: string;
  notes: string;
  createdAt: string;
}

export const MACHINES = [
  "POSIMAT",
  "TIREUSE VINAIGRETTE",
  "TIREUSE VINAIGRE",
  "BOUCHONNEUSE",
  "ÉTIQUETEUSE",
  "PRASMATIC",
] as const;

export type MachineName = (typeof MACHINES)[number];

export interface MachineNote {
  machine: MachineName;
  content: string;
  keywords: string[];
}

export interface FormatNote {
  id: string;
  title: string;
  content: string;
  keywords: string[];
  machines: MachineNote[];
  createdAt: string;
  updatedAt: string;
}

export interface MachineDefaut {
  id: string;
  machine: MachineName;
  title: string;
  description: string;
  solution: string;
  severity: "low" | "medium" | "high";
  createdAt: string;
  updatedAt: string;
}
