from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class SentimentUpdate(BaseModel):
    ts: float
    score: int = Field(ge=-5, le=5)
    label: Literal["engaged", "neutral", "disengaged"]
    rationale: str
    cues: list[str] = Field(default_factory=list)


class SuggestedQuestion(BaseModel):
    id: str
    ts: float
    text: str
    rationale: str
    topic: str
    status: Literal["pending", "accepted", "dismissed"] = "pending"


class QARequest(BaseModel):
    question: str
    course_id: str = "default"


class QAAnswer(BaseModel):
    answer: str
    citations: list[dict] = Field(default_factory=list)


class TranscriptChunk(BaseModel):
    ts: float
    text: str


class SummaryUpdate(BaseModel):
    ts: float
    summary: str
    key_points: list[str] = Field(default_factory=list)
    sentiment_note: str = ""


class SessionState(BaseModel):
    session_id: str
    active: bool = False
    transcript: list[TranscriptChunk] = Field(default_factory=list)
    sentiments: list[SentimentUpdate] = Field(default_factory=list)
    summaries: list[SummaryUpdate] = Field(default_factory=list)
    suggested_questions: list[SuggestedQuestion] = Field(default_factory=list)


class MaterialUpload(BaseModel):
    course_id: str = "default"
    filename: str
