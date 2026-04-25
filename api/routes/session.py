from __future__ import annotations

from fastapi import APIRouter

from controller import controller

router = APIRouter()


@router.post("/start")
async def start_session():
    session_id = await controller.start()
    return {"session_id": session_id}


@router.post("/stop")
async def stop_session():
    await controller.stop()
    return {"status": "stopped"}


@router.get("/state")
async def get_state():
    return controller.state.model_dump()


@router.post("/question/{question_id}/{action}")
async def resolve_question(question_id: str, action: str):
    await controller.resolve_question(question_id, action)
    return {"status": "ok"}
