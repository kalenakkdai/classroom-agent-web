"use client";

import { useState, useCallback } from "react";
import { uploadMaterial } from "../lib/session";

export default function CourseMaterialUploader() {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploading(true);
      setResult(null);
      try {
        const res = await uploadMaterial(file);
        setResult(
          `Indexed ${res.chunks_indexed} chunks from "${file.name}"`
        );
      } catch {
        setResult("Upload failed. Please try again.");
      } finally {
        setUploading(false);
      }
    },
    []
  );

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
        Course Materials
      </h2>
      <label className="block">
        <span className="text-xs text-zinc-400">
          Upload PDF or text files to ground the assistant
        </span>
        <input
          type="file"
          accept=".pdf,.txt,.md"
          onChange={handleUpload}
          disabled={uploading}
          className="mt-1 block w-full text-sm text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-zinc-700 file:text-zinc-300 hover:file:bg-zinc-600 file:cursor-pointer file:transition-colors"
        />
      </label>
      {uploading && (
        <p className="text-xs text-zinc-500 animate-pulse">Processing...</p>
      )}
      {result && <p className="text-xs text-green-400">{result}</p>}
    </div>
  );
}
