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

export interface FormatNote {
  id: string;
  title: string;
  content: string;
  keywords: string[];
  createdAt: string;
  updatedAt: string;
}
