# Contract PDF Clause & Risk Analyzer

An automated, AI-powered legal document intelligence platform that extracts legal text from PDF contracts, performs clause-by-clause decomposition, detects asymmetrical liabilities and compliance pitfalls using **Google Gemini 3.6 Flash**, and generates granular clause risk scores and redline recommendations.

---

## Key Features

1. **Automated PDF Text & Page Extraction**
   - Direct extraction of contract text, page numbers, and structural sections from multi-page PDFs using PyMuPDF / standard PDF parsers.

2. **AI Clause Extraction & Risk Scoring (Gemini 3.6 Flash)**
   - Automatically decomposes complex legal contracts into standardized clause categories:
     - *Termination*, *Payment*, *Liability*, *Indemnification*, *Confidentiality*, *Intellectual Property*, *Data Protection*, *Non-Compete*, *Dispute Resolution*, *Governing Law*, *Renewal*, *Warranty*, *Insurance*, *Force Majeure*, and *Other*.
   - Assigns risk classifications: **Critical Risk**, **High Risk**, **Medium Risk**, and **Standard**.
   - Computes overall contract risk score (0–100) and per-clause risk scores.
   - Generates legal explanations and actionable negotiation/redline recommendations.

3. **Interactive Analysis Dashboard**
   - **Upload Zone**: Drag-and-drop PDF upload with validation and progress tracking.
   - **Contract Repository**: Repository sidebar with status tags (*Queued*, *Processing*, *Completed*, *Failed*), file size, and page counts.
   - **Selected Contract Details**: Displays identified executing parties, effective terms, overall risk score meter, and executive summary.
   - **Analysis Results Explorer**: Summary filter pills for all risk tiers, real-time full-text search, clause type filtering, and expandable/collapsible clause cards with pagination references.
   - **PDF Inspection Modal**: Embedded viewer for reviewing the source PDF alongside parsed clauses.

4. **Production Architecture**
   - Complete asynchronous pipeline with background task execution, deterministic fallback resilience, and database persistence.

---

## Tech Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons
- **Backend (Python)**: FastAPI, Pydantic v2, SQLAlchemy, Uvicorn, PyMuPDF (Fitz), Google GenAI SDK
- **Backend (Node/TS Server)**: Express.js, TypeScript, tsx, esbuild
- **Database**: PostgreSQL / In-Memory & Relational ORM Models
- **AI Engine**: Google Gemini 3.6 Flash (`@google/genai` / `google-genai`)
- **Containerization**: Docker, Docker Compose

---

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── endpoints.py      # REST API route handlers
│   │   ├── database/
│   │   │   └── session.py        # SQLAlchemy engine & session maker
│   │   ├── models/
│   │   │   └── contract.py       # Contract and Clause DB models
│   │   ├── schemas/
│   │   │   └── contract.py       # Pydantic v2 schemas & Gemini structured output
│   │   ├── services/
│   │   │   ├── gemini_analyzer.py# Google GenAI SDK & Gemini analysis
│   │   │   └── pdf_extractor.py  # PyMuPDF text & page parsing
│   │   └── main.py               # FastAPI application entry point
│   ├── Dockerfile
│   └── requirements.txt
├── src/
│   ├── components/
│   │   ├── Header.tsx            # Navigation, brand & system status
│   │   ├── UploadZone.tsx        # Drag & drop upload & sample loader
│   │   ├── ContractList.tsx      # Repository listing & statuses
│   │   ├── ContractOverview.tsx  # Metadata cards & overall risk score
│   │   ├── ClausesExplorer.tsx   # Filterable, expandable clause list
│   │   └── PdfViewerModal.tsx    # Source PDF inspector modal
│   ├── types.ts                  # Shared TypeScript interfaces
│   ├── App.tsx                   # Main React application
│   └── main.tsx
├── server/
│   ├── db.ts                     # In-memory storage layer & samples
│   ├── gemini-worker.ts          # Server-side Gemini AI analysis worker
│   └── pdf-utils.ts              # PDF extraction & synthetic doc generator
├── server.ts                     # Express + Vite development server
├── docker-compose.yml            # Multi-container orchestration
├── .env.example                  # Environment configuration template
└── README.md
```

---

## Quickstart & Installation

### 1. Environment Setup

Copy `.env.example` to `.env` and provide your Google Gemini API key:

```bash
cp .env.example .env
```

Edit `.env`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
```

---

### 2. Running with Docker Compose

Run the complete stack (PostgreSQL + FastAPI backend + React frontend):

```bash
docker-compose up --build
```

- Frontend: `http://localhost:3000`
- FastAPI Swagger Docs: `http://localhost:8000/docs`
- PostgreSQL: `localhost:5432`

---

### 3. Local Development (Node / Express + Vite Fullstack)

To run the live interactive fullstack application directly:

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` to interact with the web interface.

---

### 4. Local Development (Python FastAPI Backend)

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/contracts/upload` | Upload contract PDF, extract text, and queue AI analysis |
| `GET` | `/api/contracts` | List all uploaded contracts with risk summary |
| `GET` | `/api/contracts/{id}` | Get contract details, metadata, and extracted clauses |
| `GET` | `/api/contracts/{id}/clauses` | Get all categorized clauses and risk assessments |
| `POST` | `/api/contracts/{id}/analyze` | Re-trigger Gemini 3.6 Flash clause analysis |
| `GET` | `/api/contracts/{id}/pdf` | Download or view original PDF document |
| `DELETE` | `/api/contracts/{id}` | Delete contract and associated clause records |
| `GET` | `/api/health` | Service health status |

---

## Legal Disclaimer

> **Notice**: The Contract PDF Clause & Risk Analyzer is an AI-assisted tool designed for contract triage, risk discovery, and workflow acceleration. It does not provide formal legal advice and should not replace qualified legal counsel.
