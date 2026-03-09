import { FicheConditionnement, FormatNote } from "@/types";
import { supabase } from "@/integrations/supabase/client";

// ---- MySQL remote API via edge function ----

async function callApi(action: string, table: string, data?: any, id?: string) {
  const { data: result, error } = await supabase.functions.invoke("mysql-api", {
    body: { action, table, data, id },
  });
  if (error) throw error;
  if (result?.error) throw new Error(result.error);
  return result;
}

// Fiches
export async function getFichesRemote(): Promise<FicheConditionnement[]> {
  return await callApi("list", "fiches") || [];
}

export async function saveFicheRemote(fiche: FicheConditionnement): Promise<void> {
  await callApi("save", "fiches", fiche);
}

export async function deleteFicheRemote(id: string): Promise<void> {
  await callApi("delete", "fiches", undefined, id);
}

// Notes
export async function getNotesRemote(): Promise<FormatNote[]> {
  return await callApi("list", "notes") || [];
}

export async function saveNoteRemote(note: FormatNote): Promise<void> {
  await callApi("save", "notes", note);
}

export async function deleteNoteRemote(id: string): Promise<void> {
  await callApi("delete", "notes", undefined, id);
}
