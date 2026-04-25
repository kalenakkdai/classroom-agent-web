"""Curious Student Agent: generates engaging questions when engagement dips."""

from __future__ import annotations

import json
import os

from openai import AsyncOpenAI
from services.rag import retrieve

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

SYSTEM_PROMPT = """You are a curious, engaged student in a classroom. Your job is to ask thoughtful questions that:
1. Clarify complex or confusing points from the lecture
2. Connect abstract concepts to real-world applications
3. Encourage deeper exploration of the topic
4. Re-engage the class when attention is waning

Given the recent lecture transcript (and optionally relevant course material), generate ONE question a student might ask.

Return a JSON object with:
- "text": The question itself (1-2 sentences, conversational tone)
- "rationale": Why this question is pedagogically useful (1 sentence)
- "topic": The main topic/concept the question addresses

Only return the JSON object, no other text."""


async def generate_question(transcript: str, course_id: str = "default") -> dict | None:
    """Generate a curious-student question based on recent transcript."""
    if not transcript or len(transcript.split()) < 15:
        return None

    rag_context = ""
    try:
        hits = await retrieve(transcript[-500:], course_id, top_k=3)
        if hits:
            rag_context = "\n\nRelevant course material:\n" + "\n---\n".join(
                h["text"][:300] for h in hits
            )
    except Exception:
        pass

    try:
        resp = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"Recent transcript:\n{transcript}{rag_context}"},
            ],
            response_format={"type": "json_object"},
            max_tokens=300,
        )
        data = json.loads(resp.choices[0].message.content or "{}")
        if "text" in data:
            return data
        return None
    except Exception as e:
        print(f"[CuriousStudent] Error: {e}")
        return None
