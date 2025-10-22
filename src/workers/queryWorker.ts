/// <reference lib="webworker" />

import { initDuckDB } from "@/lib/wasmLoader";
import { getFile } from "@/lib/indexedDb/files";
import type { FileEntry, QueryRow } from "@/types/types";
import type { WorkerMessage, WorkerResponse } from "@/types/types";
import type { AsyncDuckDB, AsyncDuckDBConnection } from "@duckdb/duckdb-wasm";

let db: AsyncDuckDB | null = null;
let conn: AsyncDuckDBConnection | null = null;

const BATCH_SIZE = 500;

// Convert a row to a fully serializable object (BigInt -> string)
function serializeRow(row: QueryRow): QueryRow {
  const obj: QueryRow = {};
  for (const key in row) {
    const value = row[key];
    obj[key] =
      typeof value === "bigint"
        ? value.toString()
        : (value as string | number | boolean | null);
  }
  return obj;
}

addEventListener("message", async (event: MessageEvent<WorkerMessage>) => {
  const data = event.data;

  try {
    switch (data.type) {
      case "loadData": {
        const key = data.key;
        if (!key) throw new Error("Missing file key");

        const file: FileEntry | undefined = await getFile(key);
        if (!file) throw new Error("File not found");

        if (!db) {
          db = await initDuckDB();
          conn = await db.connect();
        }

        const tableName = file.name.replace(/\W/g, "_");
        const buffer = new Uint8Array(file.data);

        if (!db || !conn) throw new Error("DB connection not available");

        await db.registerFileBuffer(file.name, buffer);
        await conn.query(`DROP TABLE IF EXISTS ${tableName}`);
        await conn.query(
          `CREATE TABLE ${tableName} AS SELECT * FROM read_csv_auto('${file.name}')`
        );

        postMessage({ type: "loaded", table: tableName } as WorkerResponse);
        break;
      }

      case "executeQuery": {
        if (!conn) throw new Error("DB not initialized");

        const table = await conn.query(data.sql);
        const rows: QueryRow[] = (await table.toArray()) as QueryRow[];
        const plainResult = rows.map(serializeRow);

        if (plainResult.length > BATCH_SIZE) {
          const totalBatches = Math.ceil(plainResult.length / BATCH_SIZE);
          for (let i = 0; i < totalBatches; i++) {
            const batch = plainResult.slice(
              i * BATCH_SIZE,
              (i + 1) * BATCH_SIZE
            );
            postMessage({
              type: "queryResultBatch",
              batch,
              index: i + 1,
              totalBatches,
            } as WorkerResponse);
          }
        } else {
          postMessage({
            type: "queryResult",
            result: plainResult,
          } as WorkerResponse);
        }

        break;
      }

      case "getSchema": {
        if (!conn) throw new Error("DB not initialized");
        const schemaTable = await conn.query("PRAGMA show_tables;");
        const rows: QueryRow[] = (await schemaTable.toArray()) as QueryRow[];
        const schema = rows.map((r) => r.table_name as string);
        postMessage({ type: "schema", schema } as WorkerResponse);
        break;
      }

      case "clearCache": {
        db = null;
        conn = null;
        postMessage({ type: "cleared" } as WorkerResponse);
        break;
      }

      default:
        throw new Error("Unknown message type");
    }
  } catch (err: unknown) {
    postMessage({
      type: "error",
      message: err instanceof Error ? err.message : String(err),
    } as WorkerResponse);
  }
});
