# Parrot Classroom Agent

**Kalena Dai** (first author) maintains this repository: an open-source, teacher-facing web build of the classroom agent from our paper, co-authored with **Arya Sarukkai**. The stack covers sentiment analysis, lecture summarization, curious-student question generation, and RAG-grounded Q&A in one dashboard.

## Paper

**Parrot: An Agentic Classroom AI** (Kalena Dai, Arya Sarukkai) was presented as a workshop poster at the *ICML 2025* **Collaborative and Federated Agentic Workflows (CFAgentic @ ICML'25)** workshop, Vancouver, Canada, July 2025.

- [OpenReview](https://openreview.net/forum?id=qx8NYuQh4v) — full paper
- [ICML workshop program](https://icml.cc/virtual/2025/47971) — listing

## Architecture

- **Frontend**: Next.js 14 (App Router, TypeScript, Tailwind CSS) with Recharts
- **Backend**: Python FastAPI with WebSocket gateway
- **AI**: OpenAI GPT-4o (sentiment, summaries, agents), Whisper (ASR), text-embedding-3-small (RAG)
- **Vector Store**: ChromaDB (local persistent)

## Quick Start

### Prerequisites

- Node.js 20+
- Python 3.11+
- OpenAI API key

### 1. Setup environment

```bash
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
```

### 2. Start the backend

```bash
cd api
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Start the frontend

```bash
cd web
npm install
npm run dev
```

### 4. Open the dashboard

Navigate to [http://localhost:3000](http://localhost:3000).

## Usage

1. **Upload course materials** (PDF, text) in the Materials panel to ground the assistant
2. Click **Start Class** to begin streaming webcam + microphone
3. The system will:
   - Transcribe speech in real-time via Whisper
   - Analyze engagement every ~20 seconds via GPT-4o
   - Generate summaries every ~5 minutes
   - Suggest student questions when engagement dips (3+ consecutive low scores)
4. Use the **Ask the Assistant** chat to get curriculum-grounded answers with citations
5. Accept or dismiss suggested questions via the teacher-in-the-loop controls

## Project Structure

```
classroom-agent/
├── api/                     # FastAPI backend
│   ├── main.py              # App entry, CORS, routers
│   ├── controller.py        # Session state & orchestration
│   ├── models.py            # Pydantic schemas
│   ├── routes/
│   │   ├── ws.py            # WebSocket gateway
│   │   ├── qa.py            # Q&A endpoint
│   │   ├── materials.py     # File upload + ingestion
│   │   ├── session.py       # Session control
│   │   └── eval.py          # Offline replay for evaluation
│   ├── agents/
│   │   ├── curious_student.py
│   │   └── assistant_lecturer.py
│   └── services/
│       ├── asr.py           # Whisper ASR
│       ├── sentiment.py     # GPT-4o multimodal sentiment
│       ├── summary.py       # Periodic summarization
│       ├── rag.py           # ChromaDB + embeddings
│       └── anonymizer.py    # DeepPrivacy2 stub
├── web/                     # Next.js frontend
│   └── src/app/
│       ├── dashboard/       # Main teacher view
│       ├── components/      # UI components
│       └── lib/session.ts   # WS client + media capture
├── .env.example
└── README.md
```

## Deferred (v2)

- DeepPrivacy2 face anonymization (stub interface ready)
- Multi-user auth and course management
- Student-facing interface
- Recording storage and post-class analytics
- On-prem model hosting
