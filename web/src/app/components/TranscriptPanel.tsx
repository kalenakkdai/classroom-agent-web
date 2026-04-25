"use client";

import { useEffect, useRef } from "react";

type Chunk = { ts: number; text: string };

export default function TranscriptPanel({ chunks }: { chunks: Chunk[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chunks.length]);

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-2">
        Live Transcript
      </h2>
      <div className="flex-1 overflow-y-auto space-y-2 pr-2">
        {chunks.length === 0 && (
          <p className="text-zinc-500 text-sm italic">
            Waiting for audio...
          </p>
        )}
        {chunks.map((c, i) => (
          <div key={i} className="text-sm leading-relaxed">
            <span className="text-zinc-500 text-xs mr-2">
              {new Date(c.ts * 1000).toLocaleTimeString()}
            </span>
            <span className="text-zinc-200">{c.text}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
