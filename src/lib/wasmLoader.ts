// lib/wasmLoader.ts
import * as duckdb from "@duckdb/duckdb-wasm";
import { AsyncDuckDB } from "@duckdb/duckdb-wasm";

let dbInstance: AsyncDuckDB | null = null;

export async function initDuckDB(): Promise<AsyncDuckDB> {
  if (dbInstance) return dbInstance;

  // 1️⃣ Get bundles from jsDelivr
  const bundles = duckdb.getJsDelivrBundles();
  const bundle = await duckdb.selectBundle(bundles);

  // 2️⃣ Create Blob URL for the worker (avoids CORS issues)
  const workerBlob = new Blob([`importScripts("${bundle.mainWorker}");`], {
    type: "application/javascript",
  });
  const workerUrl = URL.createObjectURL(workerBlob);
  const worker = new Worker(workerUrl);

  // 3️⃣ Logger
  const logger = new duckdb.ConsoleLogger();

  // 4️⃣ Instantiate DuckDB
  const db = new AsyncDuckDB(logger, worker);
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);

  dbInstance = db;
  return dbInstance;
}
