"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { ClassroomSession } from "../lib/session";
import TranscriptPanel from "../components/TranscriptPanel";
import SentimentTimeline from "../components/SentimentTimeline";
import SummaryPanel from "../components/SummaryPanel";
import SuggestedQuestionCard from "../components/SuggestedQuestionCard";
import QAChat from "../components/QAChat";
import CourseMaterialUploader from "../components/CourseMaterialUploader";
import AlertBanner from "../components/AlertBanner";
import VideoPreview from "../components/VideoPreview";

type TranscriptChunk = { ts: number; text: string };
type SentimentPoint = {
  ts: number;
  score: number;
  label: string;
  rationale: string;
  cues: string[];
};
type Summary = {
  ts: number;
  summary: string;
  key_points: string[];
  sentiment_note: string;
};
type Question = {
  id: string;
  ts: number;
  text: string;
  rationale: string;
  topic: string;
  status: string;
};

export default function DashboardPage() {
  const sessionRef = useRef<ClassroomSession | null>(null);
  const [active, setActive] = useState(false);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);

  const [transcripts, setTranscripts] = useState<TranscriptChunk[]>([]);
  const [sentiments, setSentiments] = useState<SentimentPoint[]>([]);
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);

  const [alertMsg, setAlertMsg] = useState("");
  const [alertVisible, setAlertVisible] = useState(false);

  const handleEvent = useCallback(
    (evt: { event: string; data: Record<string, unknown> }) => {
      switch (evt.event) {
        case "transcript_update":
          setTranscripts((prev) => [...prev, evt.data as unknown as TranscriptChunk]);
          break;
        case "sentiment_update":
          setSentiments((prev) => [...prev, evt.data as unknown as SentimentPoint]);
          break;
        case "summary_update":
          setSummaries((prev) => [...prev, evt.data as unknown as Summary]);
          break;
        case "suggested_question":
          setQuestions((prev) => [...prev, evt.data as unknown as Question]);
          break;
        case "engagement_alert":
          setAlertMsg((evt.data as { message: string }).message);
          setAlertVisible(true);
          setTimeout(() => setAlertVisible(false), 6000);
          break;
      }
    },
    []
  );

  const startSession = useCallback(async () => {
    const session = new ClassroomSession();
    sessionRef.current = session;
    session.onEvent(handleEvent);
    await session.start();
    setVideoStream(session.getVideoStream());
    setActive(true);
    setTranscripts([]);
    setSentiments([]);
    setSummaries([]);
    setQuestions([]);
  }, [handleEvent]);

  const stopSession = useCallback(async () => {
    await sessionRef.current?.stop();
    sessionRef.current = null;
    setActive(false);
    setVideoStream(null);
  }, []);

  const requestSummary = useCallback(() => {
    sessionRef.current?.requestSummary();
  }, []);

  useEffect(() => {
    return () => {
      sessionRef.current?.stop();
    };
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <AlertBanner message={alertMsg} visible={alertVisible} />

      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
            P
          </div>
          <h1 className="text-lg font-semibold">Parrot Classroom Agent</h1>
        </div>
        <div className="flex items-center gap-3">
          {active && (
            <button
              onClick={requestSummary}
              className="px-3 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 rounded-lg transition-colors"
            >
              Generate Summary Now
            </button>
          )}
          <button
            onClick={active ? stopSession : startSession}
            className={`px-4 py-1.5 text-sm rounded-lg font-medium transition-colors ${
              active
                ? "bg-red-600 hover:bg-red-500 text-white"
                : "bg-green-600 hover:bg-green-500 text-white"
            }`}
          >
            {active ? "Stop Class" : "Start Class"}
          </button>
          <div
            className={`w-2 h-2 rounded-full ${
              active ? "bg-green-400 animate-pulse" : "bg-zinc-600"
            }`}
          />
        </div>
      </header>

      {/* Main grid */}
      <main className="p-6 grid grid-cols-12 gap-6 max-w-[1600px] mx-auto">
        {/* Left column: Video + Transcript */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <VideoPreview stream={videoStream} />
            {!active && (
              <p className="text-sm text-zinc-500 text-center mt-2">
                Camera preview appears when class starts
              </p>
            )}
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 h-80">
            <TranscriptPanel chunks={transcripts} />
          </div>
        </div>

        {/* Center column: Sentiment + Summary + Questions */}
        <div className="col-span-12 lg:col-span-5 space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <SentimentTimeline data={sentiments} />
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <SummaryPanel summaries={summaries} />
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <SuggestedQuestionCard
              questions={questions}
              onResolved={() => {
                setQuestions((prev) => [...prev]);
              }}
            />
          </div>
        </div>

        {/* Right column: Q&A + Materials */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 h-[28rem]">
            <QAChat />
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <CourseMaterialUploader />
          </div>
        </div>
      </main>
    </div>
  );
}
