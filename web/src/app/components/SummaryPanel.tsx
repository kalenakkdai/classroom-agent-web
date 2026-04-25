"use client";

type Summary = {
  ts: number;
  summary: string;
  key_points: string[];
  sentiment_note: string;
};

export default function SummaryPanel({ summaries }: { summaries: Summary[] }) {
  const latest = summaries[summaries.length - 1] ?? null;

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-2">
        Class Summary
      </h2>
      {!latest ? (
        <p className="text-zinc-500 text-sm italic">
          Summary will appear after ~5 minutes of lecture...
        </p>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-zinc-200">{latest.summary}</p>
          {latest.key_points.length > 0 && (
            <ul className="list-disc list-inside space-y-1 text-sm text-zinc-300">
              {latest.key_points.map((pt, i) => (
                <li key={i}>{pt}</li>
              ))}
            </ul>
          )}
          {latest.sentiment_note && (
            <div className="text-xs bg-amber-900/30 border border-amber-700/50 rounded-lg px-3 py-2 text-amber-300">
              <span className="font-medium">Sentiment note:</span>{" "}
              {latest.sentiment_note}
            </div>
          )}
          <p className="text-xs text-zinc-500">
            Updated {new Date(latest.ts * 1000).toLocaleTimeString()}
          </p>
        </div>
      )}
      {summaries.length > 1 && (
        <details className="mt-3">
          <summary className="text-xs text-zinc-500 cursor-pointer hover:text-zinc-300">
            Previous summaries ({summaries.length - 1})
          </summary>
          <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
            {summaries.slice(0, -1).reverse().map((s, i) => (
              <div key={i} className="text-xs text-zinc-400 border-l-2 border-zinc-700 pl-2">
                <span className="text-zinc-500">
                  {new Date(s.ts * 1000).toLocaleTimeString()}
                </span>{" "}
                {s.summary}
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
