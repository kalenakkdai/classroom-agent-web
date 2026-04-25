"use client";

import { useEffect, useRef } from "react";

export default function VideoPreview({ stream }: { stream: MediaStream | null }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (ref.current && stream) {
      ref.current.srcObject = stream;
    }
  }, [stream]);

  if (!stream) return null;

  return (
    <video
      ref={ref}
      autoPlay
      muted
      playsInline
      className="w-full rounded-xl border border-zinc-700 bg-black"
    />
  );
}
