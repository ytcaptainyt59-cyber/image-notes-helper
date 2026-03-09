import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { connect } from "https://deno.land/x/mysql@v2.12.1/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function getDb() {
  return await connect({
    hostname: Deno.env.get("MYSQL_HOST")!,
    port: parseInt(Deno.env.get("MYSQL_PORT") || "3306"),
    username: Deno.env.get("MYSQL_USER")!,
    password: Deno.env.get("MYSQL_PASSWORD")!,
    db: Deno.env.get("MYSQL_DATABASE")!,
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { action, table, data, id } = await req.json();
    const db = await getDb();

    let result: any = null;

    if (table === "fiches") {
      switch (action) {
        case "list":
          result = await db.query("SELECT * FROM fiches ORDER BY createdAt DESC");
          // Parse machines JSON for notes if present
          break;

        case "save": {
          const existing = await db.query("SELECT id FROM fiches WHERE id = ?", [data.id]);
          if (existing.length > 0) {
            await db.execute(
              `UPDATE fiches SET codeProduit=?, reference=?, dateApplication=?, designation=?, client=?, marque=?, gencod=?, bouteille=?, bouchon=?, etiquette=?, colle=?, dluo=?, carton=?, collerCarton=?, etiquetteCarton=?, intercalaire=?, typePalette=?, palettisation=?, uvcParCarton=?, cartonsParCouche=?, couchesParPalette=?, uvcParPalette=?, filmEtirable=?, etiquettePalette=?, imageUrl=?, notes=? WHERE id=?`,
              [
                data.codeProduit, data.reference, data.dateApplication, data.designation,
                data.client, data.marque, data.gencod, data.bouteille, data.bouchon,
                data.etiquette, data.colle, data.dluo, data.carton, data.collerCarton,
                data.etiquetteCarton, data.intercalaire, data.typePalette, data.palettisation,
                data.uvcParCarton, data.cartonsParCouche, data.couchesParPalette, data.uvcParPalette,
                data.filmEtirable, data.etiquettePalette, data.imageUrl || "", data.notes,
                data.id,
              ]
            );
          } else {
            await db.execute(
              `INSERT INTO fiches (id, codeProduit, reference, dateApplication, designation, client, marque, gencod, bouteille, bouchon, etiquette, colle, dluo, carton, collerCarton, etiquetteCarton, intercalaire, typePalette, palettisation, uvcParCarton, cartonsParCouche, couchesParPalette, uvcParPalette, filmEtirable, etiquettePalette, imageUrl, notes, createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
              [
                data.id, data.codeProduit, data.reference, data.dateApplication, data.designation,
                data.client, data.marque, data.gencod, data.bouteille, data.bouchon,
                data.etiquette, data.colle, data.dluo, data.carton, data.collerCarton,
                data.etiquetteCarton, data.intercalaire, data.typePalette, data.palettisation,
                data.uvcParCarton, data.cartonsParCouche, data.couchesParPalette, data.uvcParPalette,
                data.filmEtirable, data.etiquettePalette, data.imageUrl || "", data.notes,
                data.createdAt,
              ]
            );
          }
          result = { ok: true };
          break;
        }

        case "delete":
          await db.execute("DELETE FROM fiches WHERE id = ?", [id]);
          result = { ok: true };
          break;
      }
    } else if (table === "notes") {
      switch (action) {
        case "list":
          const rows = await db.query("SELECT * FROM format_notes ORDER BY updatedAt DESC");
          // Parse machines JSON
          result = (rows as any[]).map((r: any) => ({
            ...r,
            keywords: r.keywords ? JSON.parse(r.keywords) : [],
            machines: r.machines ? JSON.parse(r.machines) : [],
          }));
          break;

        case "save": {
          const existing = await db.query("SELECT id FROM format_notes WHERE id = ?", [data.id]);
          const keywordsJson = JSON.stringify(data.keywords || []);
          const machinesJson = JSON.stringify(data.machines || []);
          if (existing.length > 0) {
            await db.execute(
              `UPDATE format_notes SET title=?, content=?, keywords=?, machines=?, updatedAt=? WHERE id=?`,
              [data.title, data.content, keywordsJson, machinesJson, data.updatedAt, data.id]
            );
          } else {
            await db.execute(
              `INSERT INTO format_notes (id, title, content, keywords, machines, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?)`,
              [data.id, data.title, data.content, keywordsJson, machinesJson, data.createdAt, data.updatedAt]
            );
          }
          result = { ok: true };
          break;
        }

        case "delete":
          await db.execute("DELETE FROM format_notes WHERE id = ?", [id]);
          result = { ok: true };
          break;
      }
    }

    await db.close();

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("mysql-api error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
