import { FicheConditionnement, FormatNote } from "@/types";

// Toujours utiliser l'API locale (Node.js Express sur le VPS)
// Pas de dépendance à Lovable Cloud / Supabase

function getApiBase(): string {
  const custom = localStorage.getItem("covinor_api_url");
  if (custom) return custom;
  return `${window.location.origin}/api`;
}

async function callApi(endpoint: string, body: any) {
  const resp = await fetch(`${getApiBase()}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const contentType = resp.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error("Serveur API non disponible");
  }
  const data = await resp.json();
  if (!resp.ok) throw new Error(data.error || "Erreur serveur");
  return data;
}

// ---- Fiches ----

export async function getFichesRemote(): Promise<FicheConditionnement[]> {
  return (await callApi("/data", { action: "list", table: "fiches" })) || [];
}

export async function saveFicheRemote(fiche: FicheConditionnement): Promise<void> {
  await callApi("/data", { action: "save", table: "fiches", data: fiche });
}

export async function deleteFicheRemote(id: string): Promise<void> {
  await callApi("/data", { action: "delete", table: "fiches", id });
}

// ---- Notes ----

export async function getNotesRemote(): Promise<FormatNote[]> {
  return (await callApi("/data", { action: "list", table: "notes" })) || [];
}

export async function saveNoteRemote(note: FormatNote): Promise<void> {
  await callApi("/data", { action: "save", table: "notes", data: note });
}

export async function deleteNoteRemote(id: string): Promise<void> {
  await callApi("/data", { action: "delete", table: "notes", id });
}

// ---- Auth ----

export async function loginRemote(username: string, password: string) {
  return await callApi("/auth", { action: "login", username, password });
}

export async function registerRemote(username: string, password: string) {
  return await callApi("/auth", { action: "register", username, password });
}

export async function getRegistrationStatus(): Promise<boolean> {
  try {
    const data = await callApi("/auth", { action: "registration_status" });
    return data.available;
  } catch {
    return false;
  }
}

export async function resetRegistration(): Promise<void> {
  await callApi("/auth", { action: "reset_registration" });
}

// ---- Users ----

export async function getUsersRemote(): Promise<{ id: string; username: string }[]> {
  return (await callApi("/users", { action: "list" })) || [];
}

export async function createUserRemote(username: string, password: string) {
  return await callApi("/users", { action: "create", username, password });
}

export async function deleteUserRemote(id: string): Promise<void> {
  await callApi("/users", { action: "delete", id });
}

export async function changePasswordRemote(id: string, password: string): Promise<void> {
  await callApi("/users", { action: "change_password", id, password });
}

// ---- AI Extract ----

export async function extractFicheRemote(imageBase64: string) {
  return await callApi("/extract", { imageBase64 });
}
