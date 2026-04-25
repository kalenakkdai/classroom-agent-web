from __future__ import annotations

from fastapi import APIRouter

from models import QARequest, QAAnswer
from agents.assistant_lecturer import answer_question

router = APIRouter()


@router.post("/ask", response_model=QAAnswer)
async def ask(req: QARequest):
    from controller import controller
    transcript_context = controller.get_recent_transcript(300)
    result = await answer_question(req.question, req.course_id, transcript_context)
    return result
