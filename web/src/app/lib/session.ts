/**
 * WebSocket client + browser media capture for streaming audio chunks
 * and periodic JPEG frames to the backend.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const WS_URL = process.env.NEXT_PUBLIC_API_WS_URL || "ws://localhost:8000";

export type WSEvent = {
  event: string;
  data: Record<string, unknown>;
};

export type EventHandler = (evt: WSEvent) => void;

export class ClassroomSession {
  private ws: WebSocket | null = null;
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private videoEl: HTMLVideoElement | null = null;
  private canvasEl: HTMLCanvasElement | null = null;
  private frameInterval: ReturnType<typeof setInterval> | null = null;
  private listeners: EventHandler[] = [];

  onEvent(handler: EventHandler) {
    this.listeners.push(handler);
    return () => {
      this.listeners = this.listeners.filter((h) => h !== handler);
    };
  }

  private emit(evt: WSEvent) {
    this.listeners.forEach((h) => h(evt));
  }

  async start(): Promise<void> {
    const res = await fetch(`${API_URL}/session/start`, { method: "POST" });
    const { session_id } = await res.json();

    this.ws = new WebSocket(`${WS_URL}/ws`);
    this.ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data) as WSEvent;
        this.emit(msg);
      } catch {}
    };

    await new Promise<void>((resolve, reject) => {
      this.ws!.onopen = () => resolve();
      this.ws!.onerror = (e) => reject(e);
    });

    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });

    this.videoEl = document.createElement("video");
    this.videoEl.srcObject = this.mediaStream;
    this.videoEl.muted = true;
    await this.videoEl.play();

    this.canvasEl = document.createElement("canvas");
    this.canvasEl.width = 640;
    this.canvasEl.height = 480;

    this.startAudioStreaming();
    this.startFrameCapture();
  }

  private startAudioStreaming() {
    if (!this.mediaStream || !this.ws) return;

    const audioStream = new MediaStream(this.mediaStream.getAudioTracks());
    this.mediaRecorder = new MediaRecorder(audioStream, {
      mimeType: "audio/webm;codecs=opus",
    });

    this.mediaRecorder.ondataavailable = async (e) => {
      if (e.data.size > 0 && this.ws?.readyState === WebSocket.OPEN) {
        const buffer = await e.data.arrayBuffer();
        const b64 = btoa(
          new Uint8Array(buffer).reduce(
            (data, byte) => data + String.fromCharCode(byte),
            ""
          )
        );
        this.ws.send(JSON.stringify({ type: "audio", data: b64 }));
      }
    };

    // Send audio chunks every ~20 seconds
    this.mediaRecorder.start(20000);
  }

  private startFrameCapture() {
    if (!this.videoEl || !this.canvasEl || !this.ws) return;

    const ctx = this.canvasEl.getContext("2d")!;

    this.frameInterval = setInterval(() => {
      if (this.ws?.readyState !== WebSocket.OPEN) return;
      ctx.drawImage(this.videoEl!, 0, 0, 640, 480);
      const dataUrl = this.canvasEl!.toDataURL("image/jpeg", 0.6);
      const b64 = dataUrl.split(",")[1];
      this.ws.send(JSON.stringify({ type: "frame", data: b64 }));
    }, 10000); // one frame per 10 seconds
  }

  async stop(): Promise<void> {
    if (this.frameInterval) {
      clearInterval(this.frameInterval);
      this.frameInterval = null;
    }

    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
      this.mediaRecorder = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    await fetch(`${API_URL}/session/stop`, { method: "POST" });
  }

  requestSummary() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: "force_summary" }));
    }
  }

  getVideoStream(): MediaStream | null {
    return this.mediaStream;
  }
}

// REST helpers

export async function askQuestion(
  question: string,
  courseId = "default"
): Promise<{ answer: string; citations: { source: string; snippet: string }[] }> {
  const res = await fetch(`${API_URL}/qa/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, course_id: courseId }),
  });
  return res.json();
}

export async function uploadMaterial(
  file: File,
  courseId = "default"
): Promise<{ chunks_indexed: number }> {
  const form = new FormData();
  form.append("file", file);
  form.append("course_id", courseId);
  const res = await fetch(`${API_URL}/materials/upload`, {
    method: "POST",
    body: form,
  });
  return res.json();
}

export async function resolveQuestion(
  questionId: string,
  action: "accepted" | "dismissed"
) {
  await fetch(`${API_URL}/session/question/${questionId}/${action}`, {
    method: "POST",
  });
}
