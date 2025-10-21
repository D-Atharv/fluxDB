// lib/indexedDB/files.ts
import { v4 as uuidv4 } from "uuid";
import { initDB } from "./db";
import { FileEntry } from "../types";

export async function saveFile(entry: Omit<FileEntry, "key" | "uploadedAt">) {
  const db = await initDB();
  const fileEntry: FileEntry = {
    key: uuidv4(),
    uploadedAt: Date.now(),
    ...entry,
  };
  await db.put("files", fileEntry);
  return fileEntry.key;
}

export async function getFile(key: string): Promise<FileEntry | undefined> {
  const db = await initDB();
  return db.get("files", key);
}

export async function deleteFile(key: string) {
  const db = await initDB();
  await db.delete("files", key);
}

export async function listFiles(): Promise<FileEntry[]> {
  const db = await initDB();
  return db.getAll("files");
}
