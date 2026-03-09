import { FicheConditionnement, FormatNote } from "@/types";
import { supabase } from "@/integrations/supabase/client";

// Detect if we're running on VPS (self-hosted) or Lovable Cloud
// On VPS: the API runs on the same domain at /api
// On Lovable: use edge functions
const isVPS = !import.meta.env.VITE_SUPABASE_URL || localStorage.getItem("covinor_use_local_api") === "true";

function getApiBase(): string {
  // If custom API URL is set, use it
  const custom = localStorage.getItem("covinor_api_url");
  if (custom) return custom;
  // Default: same origin /api
  return `${window.location.origin}/api`;
}

async function callApiLocal(endpoint: string, body: any) {
  const resp = await fetch(`${getApiBase()}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data.error || "Erreur serveur");
  return data;
}

async function callApiCloud(action: string, table: string, data?: any, id?: string) {
  const { data: result, error } = await supabase.functions.invoke("mysql-api", {
    body: { action, table, data, id },
  });
  if (error) throw error;
  if (result?.error) throw new Error(result.error);
  return result;
}

// ---- Fiches ----

export async function getFichesRemote(): Promise<FicheConditionnement[]> {
  if (isVPS) {
    return await callApiLocal("/data", { action: "list", table: "fiches" }) || [];
  }
  return await callApiCloud("list", "fiches") || [];
}

export async function saveFicheRemote(fiche: FicheConditionnement): Promise<void> {
  if (isVPS) {
    await callApiLocal("/data", { action: "save", table: "fiches", data: fiche });
  } else {
    await callApiCloud("save", "fiches", fiche);
  }
}

export async function deleteFicheRemote(id: string): Promise<void> {
  if (isVPS) {
    await callApiLocal("/data", { action: "delete", table: "fiches", id });
  } else {
    await callApiCloud("delete", "fiches", undefined, id);
  }
}

// ---- Notes ----

export async function getNotesRemote(): Promise<FormatNote[]> {
  if (isVPS) {
    return await callApiLocal("/data", { action: "list", table: "notes" }) || [];
  }
  return await callApiCloud("list", "notes") || [];
}

export async function saveNoteRemote(note: FormatNote): Promise<void> {
  if (isVPS) {
    await callApiLocal("/data", { action: "save", table: "notes", data: note });
  } else {
    await callApiCloud("save", "notes", note);
  }
}

export async function deleteNoteRemote(id: string): Promise<void> {
  if (isVPS) {
    await callApiLocal("/data", { action: "delete", table: "notes", id });
  } else {
    await callApiCloud("delete", "notes", undefined, id);
  }
}

// ---- Auth ----

export async function loginRemote(username: string, password: string) {
  if (isVPS) {
    return await callApiLocal("/auth", { action: "login", username, password });
  }
  const { data, error } = await supabase.functions.invoke("mysql-auth", {
    body: { action: "login", username, password },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}
