import { FicheConditionnement, FormatNote } from "@/types";

const FICHES_KEY = "covinor_fiches";
const NOTES_KEY = "covinor_notes";

export function getFiches(): FicheConditionnement[] {
  const data = localStorage.getItem(FICHES_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveFiche(fiche: FicheConditionnement) {
  const fiches = getFiches();
  const idx = fiches.findIndex((f) => f.id === fiche.id);
  if (idx >= 0) fiches[idx] = fiche;
  else fiches.unshift(fiche);
  localStorage.setItem(FICHES_KEY, JSON.stringify(fiches));
}

export function deleteFiche(id: string) {
  const fiches = getFiches().filter((f) => f.id !== id);
  localStorage.setItem(FICHES_KEY, JSON.stringify(fiches));
}

export function getNotes(): FormatNote[] {
  const data = localStorage.getItem(NOTES_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveNote(note: FormatNote) {
  const notes = getNotes();
  const idx = notes.findIndex((n) => n.id === note.id);
  if (idx >= 0) notes[idx] = note;
  else notes.unshift(note);
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

export function deleteNote(id: string) {
  const notes = getNotes().filter((n) => n.id !== id);
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}
