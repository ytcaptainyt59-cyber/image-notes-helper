import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageBase64 } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Tu es un expert en extraction de données de fiches de conditionnement industrielles (COVINOR). Analyse cette image et extrais TOUTES les informations visibles. Retourne les données structurées.`,
              },
              {
                type: "image_url",
                image_url: { url: imageBase64 },
              },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_fiche",
              description: "Extraire les informations d'une fiche de conditionnement",
              parameters: {
                type: "object",
                properties: {
                  codeProduit: { type: "string", description: "Code produit" },
                  reference: { type: "string", description: "Référence du document" },
                  dateApplication: { type: "string", description: "Date d'application" },
                  designation: { type: "string", description: "Désignation complète du produit" },
                  client: { type: "string", description: "Nom du client (ex: SCAMARK)" },
                  marque: { type: "string", description: "Marque du produit (ex: Rustica)" },
                  gencod: { type: "string", description: "Code GENCOD/EAN" },
                  bouteille: { type: "string", description: "Type de bouteille et référence" },
                  bouchon: { type: "string", description: "Type de bouchon et référence" },
                  etiquette: { type: "string", description: "Type d'étiquette et référence" },
                  colle: { type: "string", description: "Type de colle et référence" },
                  dluo: { type: "string", description: "DLUO (durée de vie)" },
                  carton: { type: "string", description: "Type de carton et référence" },
                  collerCarton: { type: "string", description: "Colle carton et référence" },
                  etiquetteCarton: { type: "string", description: "Étiquette carton et référence" },
                  intercalaire: { type: "string", description: "Intercalaire et référence" },
                  typePalette: { type: "string", description: "Type de palette et référence" },
                  palettisation: { type: "string", description: "Infos palettisation" },
                  uvcParCarton: { type: "string", description: "Nombre d'UVC par carton" },
                  cartonsParCouche: { type: "string", description: "Nombre de cartons par couche" },
                  couchesParPalette: { type: "string", description: "Nombre de couches par palette" },
                  uvcParPalette: { type: "string", description: "Nombre d'UVC par palette" },
                  filmEtirable: { type: "string", description: "Film étirable et référence" },
                  etiquettePalette: { type: "string", description: "Étiquette palette et référence" },
                  volume: { type: "string", description: "Volume du produit (ex: 50cl, 1L)" },
                },
                required: ["designation"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_fiche" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Trop de requêtes, réessayez dans un moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits IA épuisés." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No extraction result");

    const extracted = JSON.parse(toolCall.function.arguments);

    // Build auto-title: marque + client + volume
    const parts = [extracted.marque, extracted.client, extracted.volume].filter(Boolean);
    const autoTitle = parts.length > 0 ? parts.join(" - ") : extracted.designation || "Fiche";

    return new Response(JSON.stringify({ ...extracted, autoTitle }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
