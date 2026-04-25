"use client";

import { useState, useRef, useEffect } from "react";
import { askQuestion } from "../lib/session";

type Message = {
  role: "user" | "assistant";
  text: string;
  citations?: { source: string; snippet: string }[];
};

export default function QAChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const send = async () => {
    const q = input.trim();
    if (!q || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setLoading(true);

    try {
      const res = await askQuestion(q);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: res.answer, citations: res.citations },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Sorry, something went wrong." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-2">
        Ask the Assistant
      </h2>
      <div className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1">
        {messages.length === 0 && (
          <p className="text-zinc-500 text-sm italic">
            Ask a course-related question...
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`text-sm rounded-xl px-3 py-2 max-w-[85%] ${
              m.role === "user"
                ? "bg-indigo-600 text-white ml-auto"
                : "bg-zinc-800 text-zinc-200"
            }`}
          >
            <p>{m.text}</p>
            {m.citations && m.citations.length > 0 && (
              <div className="mt-2 pt-2 border-t border-zinc-700 space-y-1">
                {m.citations.map((c, ci) => (
                  <p key={ci} className="text-xs text-zinc-400">
                    <span className="font-medium text-zinc-300">
                      {c.source}:
                    </span>{" "}
                    {c.snippet}
                  </p>
                ))}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="text-xs text-zinc-500 animate-pulse">Thinking...</div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Type a question..."
          className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <button
          onClick={send}
          disabled={loading}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-700 text-white text-sm rounded-lg transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
}
