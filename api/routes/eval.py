"""Offline eval endpoint: replay a recorded session through the pipeline."""

from __future__ import annotations

import base64
import json

from fastapi import APIRouter, UploadFile, File, Form

from services.asr import transcribe_audio
from services.sentiment import analyze_sentiment
from services.summary import generate_summary

router = APIRouter()


@router.post("/replay")
async def replay_session(
    audio: UploadFile = File(None),
    transcript_text: str = Form(None),
    frames_json: str = Form(None),
):
    """Replay a recorded session for offline evaluation.

    Supply either raw audio (to test ASR) or a pre-made transcript.
    Optionally provide frames as JSON array of base64 strings.
    """
    results = {"transcripts": [], "sentiments": [], "summary": None}

    transcript = ""
    if audio:
        audio_bytes = await audio.read()
        transcript = await transcribe_audio(audio_bytes)
        results["transcripts"].append(transcript)
    elif transcript_text:
        transcript = transcript_text

    frames: list[bytes] = []
    if frames_json:
        for b64 in json.loads(frames_json):
            frames.append(base64.b64decode(b64))

    frame = frames[0] if frames else None
    sentiment = await analyze_sentiment(frame, transcript)
    if sentiment:
        results["sentiments"].append(sentiment.model_dump())

    summary = await generate_summary(transcript)
    if summary:
        results["summary"] = summary.model_dump()

    return results
