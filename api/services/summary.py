"""Periodic class summary generator using GPT-4o."""

from __future__ import annotations

import json
import os
import time

from openai import AsyncOpenAI

from models import SentimentUpdate, SummaryUpdate

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

SYSTEM_PROMPT = """You are a classroom summary assistant. Given a lecture transcript and recent sentiment observations, produce a structured summary.

Return a JSON object with:
- "summary": A 2-4 sentence summary of what was covered
- "key_points": List of 3-5 bullet-point key takeaways
- "sentiment_note": If sentiment data suggests notable engagement patterns (confusion, excitement, boredom), include a brief note; otherwise empty string

Only return the JSON object, no other text."""


async def generate_summary(
    transcript: str,
    recent_sentiments: list[SentimentUpdate] | None = None,
) -> SummaryUpdate | None:
    """Generate a class summary from the transcript and sentiment data."""
    if not transcript or len(transcript.split()) < 20:
        return None

    sentiment_ctx = ""
    if recent_sentiments:
        labels = [s.label for s in recent_sentiments]
        rationales = [s.rationale for s in recent_sentiments if s.rationale]
        sentiment_ctx = (
            f"\nRecent engagement labels: {labels}\n"
            f"Observer notes: {'; '.join(rationales[-3:])}"
        )

    try:
        resp = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"Transcript:\n{transcript}\n{sentiment_ctx}"},
            ],
            response_format={"type": "json_object"},
            max_tokens=500,
        )
        data = json.loads(resp.choices[0].message.content or "{}")
        return SummaryUpdate(
            ts=time.time(),
            summary=data.get("summary", ""),
            key_points=data.get("key_points", []),
            sentiment_note=data.get("sentiment_note", ""),
        )
    except Exception as e:
        print(f"[Summary] Generation error: {e}")
        return None
