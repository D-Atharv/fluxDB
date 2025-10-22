// lib/indexedDB/cache.ts
import { v4 as uuidv4 } from "uuid";
import { initDB } from "../db";
import type { CacheEntry } from "../../types/types";

export async function saveCache(entry: Omit<CacheEntry, "key" | "createdAt">) {
  const db = await initDB();
  const cacheEntry: CacheEntry = {
    key: uuidv4(),
    createdAt: Date.now(),
    ...entry,
  };
  await db.put("cache", cacheEntry);
  return cacheEntry.key;
}

export async function getCache(key: string): Promise<CacheEntry | undefined> {
  const db = await initDB();
  const entry = await db.get("cache", key);

  if (!entry) return undefined;

  if (entry.ttl && Date.now() - entry.createdAt > entry.ttl) {
    await db.delete("cache", key);
    return undefined;
  }

  return entry;
}

export async function deleteCache(key: string) {
  const db = await initDB();
  await db.delete("cache", key);
}

export async function listCache(): Promise<CacheEntry[]> {
  const db = await initDB();
  const allEntries = await db.getAll("cache");

  // Filter expired entries
  const validEntries: CacheEntry[] = [];
  for (const entry of allEntries) {
    if (!entry.ttl || Date.now() - entry.createdAt <= entry.ttl) {
      validEntries.push(entry);
    } else {
      await db.delete("cache", entry.key);
    }
  }

  return validEntries;
}
