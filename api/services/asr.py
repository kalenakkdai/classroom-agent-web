"""Whisper ASR: converts audio chunks to text via OpenAI Whisper API."""

from __future__ import annotations

import io
import os
import tempfile

from openai import AsyncOpenAI

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))


async def transcribe_audio(audio_bytes: bytes) -> str:
    """Transcribe raw audio bytes (webm/opus) using OpenAI Whisper."""
    if not audio_bytes:
        return ""

    suffix = ".webm"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name

    try:
        with open(tmp_path, "rb") as f:
            response = await client.audio.transcriptions.create(
                model="whisper-1",
                file=f,
                response_format="text",
            )
        return response.strip() if isinstance(response, str) else ""
    except Exception as e:
        print(f"[ASR] Transcription error: {e}")
        return ""
    finally:
        os.unlink(tmp_path)
