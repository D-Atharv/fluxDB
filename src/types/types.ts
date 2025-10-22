// lib/types.ts
export interface FileEntry {
  key: string; // Unique key (UUID)
  name: string; // Original filename
  data: ArrayBuffer; // File content
  type?: string; // optional MIME type
  uploadedAt: number; // Timestamp
}

export interface QueryPlan {
  sql: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  optimizedSteps?: any; // Replace `any` with your engine's plan type
}

export interface CacheEntry {
  key: string; // Unique key (UUID or hash)
  result: QueryRow[]; // Query results
  plan?: QueryPlan; // Optional SQL plan
  createdAt: number;
  ttl?: number; // Optional time-to-live in ms
}

export interface RealtimeQueryDB extends IDBDatabase {
  files: { key: string; value: FileEntry };
  cache: { key: string; value: CacheEntry };
}

// Type-safe row definition
export type QueryRow = Record<
  string,
  string | number | boolean | bigint | null
>;

export type WorkerMessage =
  | { type: "loadData"; key: string }
  | { type: "executeQuery"; sql: string }
  | { type: "getSchema" }
  | { type: "clearCache" };

export type WorkerResponse =
  | { type: "loaded"; table: string }
  | { type: "queryResult"; result: QueryRow[] }
  | {
      type: "queryResultBatch";
      batch: QueryRow[];
      index: number;
      totalBatches: number;
    }
  | { type: "schema"; schema: string[] }
  | { type: "cleared" }
  | { type: "error"; message: string };
