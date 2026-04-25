"""Multimodal sentiment analysis using GPT-4o on frames + transcript."""

from __future__ import annotations

import base64
import os
import time

from openai import AsyncOpenAI

from models import SentimentUpdate

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

SYSTEM_PROMPT = """You are a classroom engagement analyst. You receive a snapshot image from a classroom camera and a recent transcript excerpt. Analyze the students' apparent engagement level.

Return a JSON object with these exact fields:
- "score": integer from -5 (very disengaged) to +5 (very engaged)
- "label": one of "engaged", "neutral", "disengaged"
- "rationale": 1-2 sentence explanation of what you observed
- "cues": list of specific observable cues (e.g. "students looking at phones", "active note-taking", "raised hands")

Only return the JSON object, no other text."""


async def analyze_sentiment(
    frame: bytes | None,
    transcript: str,
) -> SentimentUpdate | None:
    """Run multimodal sentiment analysis on the latest frame + transcript."""
    if not transcript:
        return None

    messages: list[dict] = [{"role": "system", "content": SYSTEM_PROMPT}]

    content_parts: list[dict] = []

    if frame:
        b64 = base64.b64encode(frame).decode()
        content_parts.append({
            "type": "image_url",
            "image_url": {"url": f"data:image/jpeg;base64,{b64}", "detail": "low"},
        })

    content_parts.append({
        "type": "text",
        "text": f"Recent transcript (last ~20 seconds):\n{transcript}",
    })

    messages.append({"role": "user", "content": content_parts})

    try:
        resp = await client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            response_format={"type": "json_object"},
            max_tokens=300,
        )
        import json
        data = json.loads(resp.choices[0].message.content or "{}")
        return SentimentUpdate(
            ts=time.time(),
            score=max(-5, min(5, int(data.get("score", 0)))),
            label=data.get("label", "neutral"),
            rationale=data.get("rationale", ""),
            cues=data.get("cues", []),
        )
    except Exception as e:
        print(f"[Sentiment] Analysis error: {e}")
        return None
