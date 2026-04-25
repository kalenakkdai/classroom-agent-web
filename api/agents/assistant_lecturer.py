"""Assistant Lecturer Agent: answers questions using RAG + GPT-4o with citations."""

from __future__ import annotations

import json
import os

from openai import AsyncOpenAI

from models import QAAnswer
from services.rag import retrieve

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

SYSTEM_PROMPT = """You are a knowledgeable teaching assistant for a course. Answer the student's question accurately and helpfully, using the provided course materials and recent lecture context.

Guidelines:
- Ground your answer in the retrieved course materials when possible
- Reference specific sources (e.g. "According to the lecture slides...")
- If the question is outside the course scope, say so politely
- Keep answers concise but thorough (2-4 paragraphs max)
- Use the same terminology the instructor has been using

Return a JSON object with:
- "answer": Your complete answer text
- "citations": List of objects with "source" (filename), "snippet" (relevant excerpt, max 100 chars)

Only return the JSON object, no other text."""


async def answer_question(
    question: str,
    course_id: str = "default",
    transcript_context: str = "",
) -> QAAnswer:
    """Answer a question using RAG retrieval and GPT-4o."""
    hits = await retrieve(question, course_id, top_k=5)

    rag_context = ""
    if hits:
        rag_context = "\n\nRetrieved course materials:\n" + "\n---\n".join(
            f"[Source: {h['source']}]\n{h['text'][:500]}" for h in hits
        )

    lecture_ctx = ""
    if transcript_context:
        lecture_ctx = f"\n\nRecent lecture context:\n{transcript_context[-1000:]}"

    try:
        resp = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": f"Question: {question}{rag_context}{lecture_ctx}",
                },
            ],
            response_format={"type": "json_object"},
            max_tokens=800,
        )
        data = json.loads(resp.choices[0].message.content or "{}")
        return QAAnswer(
            answer=data.get("answer", "I'm sorry, I couldn't generate an answer."),
            citations=data.get("citations", []),
        )
    except Exception as e:
        print(f"[AssistantLecturer] Error: {e}")
        return QAAnswer(
            answer="I'm sorry, there was an error processing your question. Please try again.",
            citations=[],
        )
