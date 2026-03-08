import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { FicheConditionnement, FormatNote } from '@/types';

const FICHES_FILE = 'covinor/fiches.json';
const NOTES_FILE = 'covinor/notes.json';
const IMAGES_DIR = 'covinor/images';

async function ensureDir() {
  try {
    await Filesystem.mkdir({
      path: 'covinor',
      directory: Directory.Documents,
      recursive: true,
    });
  } catch {
    // already exists
  }
  try {
    await Filesystem.mkdir({
      path: IMAGES_DIR,
      directory: Directory.Documents,
      recursive: true,
    });
  } catch {
    // already exists
  }
}

async function readJsonFile<T>(path: string, fallback: T[]): Promise<T[]> {
  try {
    const result = await Filesystem.readFile({
      path,
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
    });
    return JSON.parse(result.data as string);
  } catch {
    return fallback;
  }
}

async function writeJsonFile<T>(path: string, data: T[]) {
  await ensureDir();
  await Filesystem.writeFile({
    path,
    directory: Directory.Documents,
    data: JSON.stringify(data, null, 2),
    encoding: Encoding.UTF8,
    recursive: true,
  });
}

// --- Fiches ---

export async function getNativeFiches(): Promise<FicheConditionnement[]> {
  return readJsonFile<FicheConditionnement>(FICHES_FILE, []);
}

export async function saveNativeFiche(fiche: FicheConditionnement) {
  const fiches = await getNativeFiches();
  const idx = fiches.findIndex((f) => f.id === fiche.id);
  if (idx >= 0) fiches[idx] = fiche;
  else fiches.unshift(fiche);
  await writeJsonFile(FICHES_FILE, fiches);
}

export async function deleteNativeFiche(id: string) {
  const fiches = (await getNativeFiches()).filter((f) => f.id !== id);
  await writeJsonFile(FICHES_FILE, fiches);
}

// --- Notes ---

export async function getNativeNotes(): Promise<FormatNote[]> {
  return readJsonFile<FormatNote>(NOTES_FILE, []);
}

export async function saveNativeNote(note: FormatNote) {
  const notes = await getNativeNotes();
  const idx = notes.findIndex((n) => n.id === note.id);
  if (idx >= 0) notes[idx] = note;
  else notes.unshift(note);
  await writeJsonFile(NOTES_FILE, notes);
}

export async function deleteNativeNote(id: string) {
  const notes = (await getNativeNotes()).filter((n) => n.id !== id);
  await writeJsonFile(NOTES_FILE, notes);
}

// --- Images ---

export async function saveImageToDevice(base64Data: string, fileName: string): Promise<string> {
  await ensureDir();
  const path = `${IMAGES_DIR}/${fileName}`;
  await Filesystem.writeFile({
    path,
    directory: Directory.Documents,
    data: base64Data.replace(/^data:image\/\w+;base64,/, ''),
    recursive: true,
  });
  return path;
}

export async function pickImageFromGallery(): Promise<string | null> {
  try {
    const photo = await Camera.getPhoto({
      quality: 80,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Photos,
    });
    return photo.dataUrl || null;
  } catch {
    return null;
  }
}

export async function takePhoto(): Promise<string | null> {
  try {
    const photo = await Camera.getPhoto({
      quality: 80,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera,
    });
    return photo.dataUrl || null;
  } catch {
    return null;
  }
}

// --- Platform detection ---

export function isNativePlatform(): boolean {
  return typeof (window as any)?.Capacitor !== 'undefined' && 
         (window as any)?.Capacitor?.isNativePlatform?.() === true;
}
