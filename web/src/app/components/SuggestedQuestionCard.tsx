"use client";

import { resolveQuestion } from "../lib/session";

type Question = {
  id: string;
  ts: number;
  text: string;
  rationale: string;
  topic: string;
  status: string;
};

export default function SuggestedQuestionCard({
  questions,
  onResolved,
}: {
  questions: Question[];
  onResolved: () => void;
}) {
  const pending = questions.filter((q) => q.status === "pending");

  const handle = async (id: string, action: "accepted" | "dismissed") => {
    await resolveQuestion(id, action);
    onResolved();
  };

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-2">
        Suggested Questions
      </h2>
      {pending.length === 0 ? (
        <p className="text-zinc-500 text-sm italic">
          No pending questions...
        </p>
      ) : (
        <div className="space-y-3">
          {pending.map((q) => (
            <div
              key={q.id}
              className="bg-indigo-950/40 border border-indigo-800/40 rounded-xl p-4 space-y-2"
            >
              <p className="text-sm text-zinc-100 font-medium">
                &ldquo;{q.text}&rdquo;
              </p>
              <div className="group relative inline-block">
                <span className="text-xs text-indigo-400 cursor-help underline decoration-dotted">
                  Why this?
                </span>
                <div className="hidden group-hover:block absolute z-10 bottom-full left-0 mb-1 w-64 bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-xs text-zinc-300 shadow-lg">
                  {q.rationale}
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => handle(q.id, "accepted")}
                  className="px-3 py-1 text-xs bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors"
                >
                  Accept
                </button>
                <button
                  onClick={() => handle(q.id, "dismissed")}
                  className="px-3 py-1 text-xs bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded-lg transition-colors"
                >
                  Dismiss
                </button>
                <span className="text-xs text-zinc-500 ml-auto">
                  Topic: {q.topic}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
