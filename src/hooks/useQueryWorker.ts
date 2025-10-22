// hooks/useQueryWorker.ts
import { useEffect, useRef, useCallback } from "react";
import type { WorkerMessage, WorkerResponse } from "@/types/types";

export function useQueryWorker(onMessage: (msg: WorkerResponse) => void) {
  const workerRef = useRef<Worker | null>(null);

  const stableOnMessage = useCallback(
    (msg: WorkerResponse) => onMessage(msg),
    [onMessage]
  );

  useEffect(() => {
    // Create worker from your queryWorker.ts
    const worker = new Worker(
      new URL("../workers/queryWorker.ts", import.meta.url),
      { type: "module" }
    );

    worker.onmessage = (event: MessageEvent<WorkerResponse>) =>
      stableOnMessage(event.data);

    workerRef.current = worker;

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, [stableOnMessage]);

  const post = useCallback((msg: WorkerMessage) => {
    workerRef.current?.postMessage(msg);
  }, []);

  return { post };
}
