// lib/types.ts
export interface FileEntry {
  key: string; // Unique key (UUID)
  name: string; // Original filename
  data: ArrayBuffer; // File content
  uploadedAt: number; // Timestamp
}

export interface QueryPlan {
  sql: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  optimizedSteps?: any; // Replace `any` with your engine's plan type
}

export interface CacheEntry {
  key: string; // Unique key (UUID or hash)
  result: unknown[]; // Query results
  plan?: QueryPlan; // Optional SQL plan
  createdAt: number;
  ttl?: number; // Optional time-to-live in ms
}

export interface RealtimeQueryDB extends IDBDatabase {
  files: { key: string; value: FileEntry };
  cache: { key: string; value: CacheEntry };
}
