"""WebSocket gateway: receives audio chunks and video frames, pushes events back."""

from __future__ import annotations

import asyncio
import base64
import json
import time

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from controller import controller
from services.asr import transcribe_audio
from services.sentiment import analyze_sentiment
from services.summary import generate_summary

router = APIRouter()

SENTIMENT_INTERVAL_S = 20
SUMMARY_INTERVAL_S = 300


@router.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()

    last_frame: bytes | None = None
    last_sentiment_time = 0.0
    last_summary_time = 0.0

    async def emit(event: str, data: dict):
        try:
            await ws.send_json({"event": event, "data": data})
        except Exception:
            pass

    controller.register_listener(emit)

    try:
        while True:
            raw = await ws.receive_text()
            msg = json.loads(raw)
            kind = msg.get("type")

            if kind == "audio":
                audio_bytes = base64.b64decode(msg["data"])
                text = await transcribe_audio(audio_bytes)
                if text:
                    await controller.add_transcript(text)

                    now = time.time()

                    if now - last_sentiment_time >= SENTIMENT_INTERVAL_S:
                        last_sentiment_time = now
                        asyncio.create_task(
                            _run_sentiment(last_frame, controller.get_recent_transcript(30))
                        )

                    if now - last_summary_time >= SUMMARY_INTERVAL_S:
                        last_summary_time = now
                        asyncio.create_task(
                            _run_summary(controller.get_recent_transcript(SUMMARY_INTERVAL_S))
                        )

            elif kind == "frame":
                last_frame = base64.b64decode(msg["data"])

            elif kind == "force_summary":
                asyncio.create_task(
                    _run_summary(controller.get_full_transcript())
                )
                last_summary_time = time.time()

    except WebSocketDisconnect:
        pass
    finally:
        controller.remove_listener(emit)


async def _run_sentiment(frame: bytes | None, transcript: str):
    result = await analyze_sentiment(frame, transcript)
    if result:
        await controller.add_sentiment(result)


async def _run_summary(transcript: str):
    from controller import controller as ctrl
    recent_sentiments = ctrl.state.sentiments[-5:]
    result = await generate_summary(transcript, recent_sentiments)
    if result:
        await controller.add_summary(result)
