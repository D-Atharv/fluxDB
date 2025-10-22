// app/testIndexedDB/page.tsx
"use client";

import { useEffect, useState } from "react";
import {
  putFile,
  getFile,
  listFiles,
  deleteFile,
} from "../lib/indexedDb/files";
import {
  saveCache,
  getCache,
  listCache,
  deleteCache,
} from "../lib/indexedDb/cache";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TestIndexedDB() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [files, setFiles] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [cacheEntries, setCacheEntries] = useState<any[]>([]);
  const [fileContent, setFileContent] = useState<string>("");

  const refreshFiles = async () => setFiles(await listFiles());
  const refreshCache = async () => setCacheEntries(await listCache());

  useEffect(() => {
    // Initial load
    refreshFiles();
    refreshCache();
  }, []);

  const handleUploadFile = async () => {
    const dummyCSV = new TextEncoder().encode("id,name\n1,Atharv\n2,John");
    const key = await putFile({ name: "dummy.csv", data: dummyCSV.buffer });
    await refreshFiles();
    alert(`File saved with key: ${key}`);
  };

  const handleViewFile = async (key: string) => {
    const file = await getFile(key);
    if (file) {
      const textContent = new TextDecoder().decode(file.data);
      setFileContent(textContent);
    }
  };

  const handleSaveCache = async () => {
    const key = await saveCache({
      result: [{ message: "Hello cache!" }],
      ttl: 5000, // 5 seconds
    });
    await refreshCache();
    alert(`Cache saved with key: ${key}`);
  };

  const handleCheckCache = async (key: string) => {
    const cache = await getCache(key);
    alert(
      cache
        ? `Cache exists: ${JSON.stringify(cache.result)}`
        : "Cache expired or not found"
    );
    await refreshCache();
  };

  return (
    <div className="p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Files</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button onClick={handleUploadFile}>Upload Dummy File</Button>
          {files.length > 0 && (
            <ul className="space-y-1">
              {files.map((f) => (
                <li key={f.key} className="flex items-center justify-between">
                  <span>
                    {f.name} ({new Date(f.uploadedAt).toLocaleTimeString()})
                  </span>
                  <div className="space-x-2">
                    <Button size="sm" onClick={() => handleViewFile(f.key)}>
                      View Content
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={async () => {
                        await deleteFile(f.key);
                        await refreshFiles();
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {fileContent && (
            <pre className="bg-gray-100 p-2 rounded">{fileContent}</pre>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cache</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button onClick={handleSaveCache}>Save Dummy Cache</Button>
          {cacheEntries.length > 0 && (
            <ul className="space-y-1">
              {cacheEntries.map((c) => (
                <li key={c.key} className="flex items-center justify-between">
                  <span>
                    Cache Key: {c.key} (TTL: {c.ttl || "∞"} ms)
                  </span>
                  <div className="space-x-2">
                    <Button size="sm" onClick={() => handleCheckCache(c.key)}>
                      Check
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={async () => {
                        await deleteCache(c.key);
                        await refreshCache();
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
