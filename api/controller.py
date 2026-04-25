"""Central session controller that manages classroom state and orchestrates agents."""

from __future__ import annotations

import asyncio
import time
import uuid
from typing import Any, Callable, Coroutine

from models import (
    SessionState,
    SentimentUpdate,
    SuggestedQuestion,
    SummaryUpdate,
    TranscriptChunk,
)


class SessionController:
    def __init__(self) -> None:
        self.state = SessionState(session_id=str(uuid.uuid4()))
        self._listeners: list[Callable[[str, Any], Coroutine]] = []
        self._tasks: list[asyncio.Task] = []
        self._sentiment_fn: Callable | None = None
        self._summary_fn: Callable | None = None
        self._curious_fn: Callable | None = None

    def register_listener(self, fn: Callable[[str, Any], Coroutine]) -> None:
        self._listeners.append(fn)

    def remove_listener(self, fn: Callable[[str, Any], Coroutine]) -> None:
        self._listeners = [l for l in self._listeners if l is not fn]

    async def _emit(self, event: str, data: Any) -> None:
        for fn in self._listeners:
            try:
                await fn(event, data)
            except Exception:
                pass

    def set_sentiment_fn(self, fn: Callable) -> None:
        self._sentiment_fn = fn

    def set_summary_fn(self, fn: Callable) -> None:
        self._summary_fn = fn

    def set_curious_fn(self, fn: Callable) -> None:
        self._curious_fn = fn

    async def start(self) -> str:
        self.state.active = True
        self.state.session_id = str(uuid.uuid4())
        self.state.transcript.clear()
        self.state.sentiments.clear()
        self.state.summaries.clear()
        self.state.suggested_questions.clear()
        await self._emit("session_started", {"session_id": self.state.session_id})
        return self.state.session_id

    async def stop(self) -> None:
        self.state.active = False
        for t in self._tasks:
            t.cancel()
        self._tasks.clear()
        await self._emit("session_stopped", {"session_id": self.state.session_id})

    # ---- transcript ----

    async def add_transcript(self, text: str) -> None:
        chunk = TranscriptChunk(ts=time.time(), text=text)
        self.state.transcript.append(chunk)
        await self._emit("transcript_update", chunk.model_dump())

    def get_recent_transcript(self, seconds: float = 120) -> str:
        cutoff = time.time() - seconds
        parts = [c.text for c in self.state.transcript if c.ts >= cutoff]
        return " ".join(parts)

    def get_full_transcript(self) -> str:
        return " ".join(c.text for c in self.state.transcript)

    # ---- sentiment ----

    async def add_sentiment(self, update: SentimentUpdate) -> None:
        self.state.sentiments.append(update)
        await self._emit("sentiment_update", update.model_dump())
        await self._check_engagement_dip()

    async def _check_engagement_dip(self) -> None:
        recent = self.state.sentiments[-3:]
        if len(recent) < 3:
            return
        if all(s.label == "disengaged" for s in recent):
            await self._emit("engagement_alert", {
                "ts": time.time(),
                "message": "Sustained disengagement detected over last readings",
            })
            if self._curious_fn and self.state.active:
                asyncio.create_task(self._trigger_curious_student())

    async def _trigger_curious_student(self) -> None:
        if not self._curious_fn:
            return
        transcript = self.get_recent_transcript(300)
        result = await self._curious_fn(transcript)
        if result:
            sq = SuggestedQuestion(
                id=str(uuid.uuid4()),
                ts=time.time(),
                text=result["text"],
                rationale=result["rationale"],
                topic=result.get("topic", ""),
            )
            self.state.suggested_questions.append(sq)
            await self._emit("suggested_question", sq.model_dump())

    # ---- summary ----

    async def add_summary(self, update: SummaryUpdate) -> None:
        self.state.summaries.append(update)
        await self._emit("summary_update", update.model_dump())

    # ---- question management ----

    async def resolve_question(self, question_id: str, action: str) -> None:
        for sq in self.state.suggested_questions:
            if sq.id == question_id:
                sq.status = action  # type: ignore[assignment]
                await self._emit("question_resolved", {
                    "id": question_id,
                    "status": action,
                })
                break


# Singleton
controller = SessionController()
