from __future__ import annotations

import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

from routes.ws import router as ws_router  # noqa: E402
from routes.qa import router as qa_router  # noqa: E402
from routes.materials import router as materials_router  # noqa: E402
from routes.session import router as session_router  # noqa: E402
from routes.eval import router as eval_router  # noqa: E402

app = FastAPI(title="Parrot Classroom Agent", version="0.1.0")

origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ws_router)
app.include_router(qa_router, prefix="/qa", tags=["Q&A"])
app.include_router(materials_router, prefix="/materials", tags=["Materials"])
app.include_router(session_router, prefix="/session", tags=["Session"])
app.include_router(eval_router, prefix="/eval", tags=["Eval"])


@app.on_event("startup")
async def _wire_agents():
    from controller import controller
    from agents.curious_student import generate_question

    controller.set_curious_fn(generate_question)


@app.get("/health")
async def health():
    return {"status": "ok"}
