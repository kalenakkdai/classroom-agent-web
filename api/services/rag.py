"""RAG service: PDF ingestion, chunking, embedding with OpenAI, Chroma storage."""

from __future__ import annotations

import os
import uuid

import chromadb
from openai import AsyncOpenAI

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

CHROMA_DIR = os.getenv("CHROMA_DIR", os.path.join(os.path.dirname(__file__), "..", "data", "chroma"))
chroma_client = chromadb.PersistentClient(path=CHROMA_DIR)

CHUNK_SIZE = 800
CHUNK_OVERLAP = 100
EMBEDDING_MODEL = "text-embedding-3-small"


def _get_collection(course_id: str):
    return chroma_client.get_or_create_collection(
        name=f"course_{course_id}",
        metadata={"hnsw:space": "cosine"},
    )


def _chunk_text(text: str) -> list[str]:
    words = text.split()
    chunks = []
    i = 0
    while i < len(words):
        chunk = " ".join(words[i : i + CHUNK_SIZE])
        chunks.append(chunk)
        i += CHUNK_SIZE - CHUNK_OVERLAP
    return chunks


async def _embed(texts: list[str]) -> list[list[float]]:
    resp = await client.embeddings.create(model=EMBEDDING_MODEL, input=texts)
    return [d.embedding for d in resp.data]


async def ingest_file(content: bytes, filename: str, course_id: str = "default") -> int:
    """Ingest a file (PDF or plain text) into the vector store."""
    text = ""
    if filename.lower().endswith(".pdf"):
        from pypdf import PdfReader
        import io
        reader = PdfReader(io.BytesIO(content))
        for page in reader.pages:
            text += (page.extract_text() or "") + "\n"
    else:
        text = content.decode("utf-8", errors="replace")

    chunks = _chunk_text(text)
    if not chunks:
        return 0

    embeddings = await _embed(chunks)
    collection = _get_collection(course_id)

    ids = [str(uuid.uuid4()) for _ in chunks]
    metadatas = [{"source": filename, "chunk_index": i} for i in range(len(chunks))]

    collection.add(
        ids=ids,
        embeddings=embeddings,
        documents=chunks,
        metadatas=metadatas,
    )
    return len(chunks)


async def retrieve(query: str, course_id: str = "default", top_k: int = 5) -> list[dict]:
    """Retrieve relevant chunks for a query."""
    collection = _get_collection(course_id)
    if collection.count() == 0:
        return []

    query_embedding = (await _embed([query]))[0]
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=min(top_k, collection.count()),
        include=["documents", "metadatas", "distances"],
    )

    hits = []
    for i in range(len(results["ids"][0])):
        hits.append({
            "text": results["documents"][0][i],
            "source": results["metadatas"][0][i].get("source", "unknown"),
            "chunk_index": results["metadatas"][0][i].get("chunk_index", 0),
            "distance": results["distances"][0][i],
        })
    return hits
