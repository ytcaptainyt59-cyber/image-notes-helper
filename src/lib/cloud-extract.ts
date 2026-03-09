import { supabase } from "@/integrations/supabase/client";

/**
 * Extraction IA via la fonction cloud (pas de clé API requise).
 * Fonctionne partout : preview Lovable, VPS, mobile.
 */
export async function extractFicheCloud(imageBase64: string) {
  const { data, error } = await supabase.functions.invoke("extract-fiche", {
    body: { imageBase64 },
  });

  if (error) {
    // Gestion des erreurs spécifiques
    const msg = error.message || "";
    if (msg.includes("429") || msg.includes("rate")) {
      throw new Error("Trop de requêtes IA, réessayez dans un moment.");
    }
    if (msg.includes("402") || msg.includes("payment") || msg.includes("credits")) {
      throw new Error("Crédits IA épuisés.");
    }
    throw new Error(msg || "Erreur lors de l'extraction IA");
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data;
}
