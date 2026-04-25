from __future__ import annotations

from fastapi import APIRouter, UploadFile, File, Form

from services.rag import ingest_file

router = APIRouter()


@router.post("/upload")
async def upload_material(
    file: UploadFile = File(...),
    course_id: str = Form("default"),
):
    content = await file.read()
    filename = file.filename or "unknown"
    count = await ingest_file(content, filename, course_id)
    return {"status": "ok", "filename": filename, "chunks_indexed": count}
