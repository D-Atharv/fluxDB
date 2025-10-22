"use client";

import { useState, useCallback } from "react";
import { useQueryWorker } from "@/hooks/useQueryWorker";
import { putFile } from "@/lib/indexedDb/files";
import type { WorkerResponse } from "@/types/types";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function QueryRunner() {
  const [logs, setLogs] = useState<string[]>([]);
  const [results, setResults] = useState<unknown[]>([]);
  const [dbReady, setDbReady] = useState<boolean>(false);

  const handleMessage = useCallback((msg: WorkerResponse) => {
    switch (msg.type) {
      case "loaded":
        setDbReady(true);
        setLogs((prev) => [...prev, `✅ Table loaded: ${msg.table}`]);
        break;

      case "queryResult":
        setResults(msg.result);
        setLogs((prev) => [
          ...prev,
          `✅ Query completed with ${msg.result.length} rows`,
        ]);
        break;

      case "queryResultBatch":
        setResults((prev) => [...prev, ...msg.batch]);
        setLogs((prev) => [
          ...prev,
          `📦 Batch ${msg.index}/${msg.totalBatches} (${msg.batch.length} rows)`,
        ]);
        break;

      case "schema":
        setLogs((prev) => [...prev, `📋 Tables: ${msg.schema.join(", ")}`]);
        break;

      case "cleared":
        setLogs((prev) => [...prev, "🧹 Database cleared"]);
        setResults([]);
        setDbReady(false);
        break;

      case "error":
        setLogs((prev) => [...prev, `❌ Error: ${msg.message}`]);
        break;
    }
  }, []);

  const { post } = useQueryWorker(handleMessage);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogs((prev) => [...prev, `📁 Uploading ${file.name}...`]);

    const buffer = await file.arrayBuffer();
    const key = await putFile({ name: file.name, data: buffer });

    post({ type: "loadData", key });
    setLogs((prev) => [...prev, `✅ ${file.name} saved with key ${key}`]);
  };

  const runQuery = () => {
    setResults([]);
    setLogs((prev) => [...prev, `⚡ Running query on example_csv...`]);
    post({ type: "executeQuery", sql: "SELECT * FROM example_csv;" });
  };

  const getSchema = () => {
    post({ type: "getSchema" });
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold text-center">Query Runner</h2>

      {/* Upload & Actions */}
      <Card className="p-4 flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className="flex flex-col gap-1 w-full md:w-auto">
          <Label htmlFor="csv-upload">📤 Upload CSV File</Label>
          <Input
            id="csv-upload"
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="max-w-xs"
          />
        </div>
        <div className="flex gap-2 mt-2 md:mt-0">
          <Button onClick={runQuery} disabled={!dbReady}>
            Run Query
          </Button>
          <Button variant="secondary" onClick={getSchema}>
            Show Tables
          </Button>
        </div>
      </Card>

      {/* Logs */}
      <Card className="p-4">
        <h3 className="font-semibold mb-2">Logs</h3>
        <ScrollArea className="max-h-40 border rounded p-2">
          <ul className="space-y-1">
            {logs.map((log, idx) => (
              <li key={idx}>{log}</li>
            ))}
          </ul>
        </ScrollArea>
      </Card>

      {/* Results */}
      <Card className="p-4">
        <h3 className="font-semibold mb-2">Results</h3>
        {results.length > 0 ? (
          <ScrollArea className="max-h-80 border rounded p-2">
            <Table className="table-auto min-w-full">
              <TableHeader>
                <TableRow>
                  {Object.keys(results[0] as Record<string, unknown>).map(
                    (col) => (
                      <TableHead key={col}>{col}</TableHead>
                    )
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((row, i) => {
                  const r = row as Record<string, unknown>;
                  return (
                    <TableRow key={i}>
                      {Object.values(r).map((val, j) => (
                        <TableCell key={j}>{val?.toString()}</TableCell>
                      ))}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        ) : (
          <p className="text-sm text-muted-foreground">No results yet.</p>
        )}
      </Card>
    </div>
  );
}
