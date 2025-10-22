// lib/indexedDB/db.ts
import { openDB } from "idb";
import type { IDBPDatabase, DBSchema } from "idb";
import type { FileEntry, CacheEntry } from "@/types/types";

interface RealtimeQueryDB extends DBSchema {
  files: { key: string; value: FileEntry };
  cache: { key: string; value: CacheEntry };
}

let db: IDBPDatabase<RealtimeQueryDB> | null = null;

export async function initDB(): Promise<IDBPDatabase<RealtimeQueryDB>> {
  if (db) return db;

  db = await openDB<RealtimeQueryDB>("RealtimeQueryDB", 1, {
    upgrade(database) {
      if (!database.objectStoreNames.contains("files")) {
        database.createObjectStore("files", { keyPath: "key" });
      }
      if (!database.objectStoreNames.contains("cache")) {
        database.createObjectStore("cache", { keyPath: "key" });
      }
    },
  });

  return db;
}
