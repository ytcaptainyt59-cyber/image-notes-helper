import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { note } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build a text summary of the note for the AI
    let noteText = `TITRE: ${note.title}\n`;
    if (note.content) noteText += `NOTES GÉNÉRALES:\n${note.content}\n\n`;
    if (note.keywords?.length > 0) noteText += `MOTS-CLÉS: ${note.keywords.join(", ")}\n\n`;
    if (note.machines?.length > 0) {
      noteText += "ZONES MACHINES:\n";
      for (const m of note.machines) {
        noteText += `\n--- ${m.machine} ---\n`;
        if (m.content) noteText += `${m.content}\n`;
        if (m.keywords?.length > 0) noteText += `Mots-clés: ${m.keywords.join(", ")}\n`;
      }
    }

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
            role: "system",
            content: `Tu es un expert en mise en page de documents industriels. Tu génères du HTML complet (avec <html>, <head>, <style>, <body>) pour une fiche A4 prête à imprimer.

RÈGLES DE MISE EN PAGE :
- La page doit être en format A4 portrait (210mm x 297mm)
- Utilise @page { size: A4; margin: 15mm; }
- Style professionnel industriel : en-tête avec logo COVINOR, bordures, sections bien délimitées
- Couleurs : bleu foncé (#1a2744) pour les en-têtes, gris clair (#f5f5f5) pour les fonds de section
- Police : Arial ou Helvetica
- Chaque machine doit avoir sa propre section encadrée avec son nom en gras
- Les mots-clés doivent apparaître comme des badges/étiquettes colorées
- Ajoute un pied de page avec la date et "COVINOR Régleur"
- Le document doit être auto-suffisant (pas de CSS externe)
- Optimisé pour l'impression : pas de couleurs de fond excessives
- Retourne UNIQUEMENT le HTML complet, rien d'autre`,
          },
          {
            role: "user",
            content: `Génère une belle fiche A4 imprimable pour ce format de conditionnement :\n\n${noteText}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Trop de requêtes, réessayez plus tard." }), {
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
    let html = data.choices?.[0]?.message?.content || "";

    // Clean markdown fences if present
    html = html.replace(/^```html?\s*/i, "").replace(/```\s*$/, "").trim();

    return new Response(JSON.stringify({ html }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-fiche-pdf error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
