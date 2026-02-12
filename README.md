# 🛡️ AI-Driven Data Policy Enforcement Platform

**Automated Compliance Monitoring for Modern Data Infrastructures.**

> **Status:** 🟢 **Active Beta (MVP Complete)**
> **Tech Stack:** Python (FastAPI), React + Vite, PostgreSQL (pgvector), Redis, Ollama (Llama 3), Docker

---

## 🚀 Overview

The **Data Policy Enforcement Platform** is an enterprise-grade solution that uses AI to automatically extract compliance rules from legal documents (PDFs) and enforce them across your database infrastructure in real-time. It eliminates manual audits and reduces the risk of GDPR/CCPA violations.

### Key Capabilities
- **📄 AI Rule Extraction:** Upload PDF policies (GDPR, HIPAA) -> AI (spaCy + Llama 3) extracts actionable logic.
- **🔍 Violation Scanner:** Automatically translates rules into SQL queries and scans your database for non-compliant records.
- **📊 Real-time Dashboard:** A modern React UI for monitoring compliance scores, reviewing extracted rules, and managing violations.
- **⚡ High Performance:** Async microservices architecture using FastAPI, Redis queues, and Vector Search.

---

## 🛠️ System Architecture

The platform consists of four core microservices orchestrated via Docker Compose:

1.  **Frontend (React + Vite):** The user interface for uploading docs and viewing dashboards.
2.  **Document Processor:** Handles PDF ingestion, OCR, chunking, and Vector DB storage.
3.  **Rule Extractor:** Uses LLMs (Ollama) and NLP (spaCy) to convert text into structured JSON rules.
4.  **Violation Scanner:** The enforcement engine that generates SQL queries and detects non-compliant data.

### Tech Stack
- **Backend:** Python 3.11, FastAPI, Uvicorn
- **Frontend:** React 18, TypeScript, Tailwind CSS, Lucide Icons, Recharts
- **AI/ML:** Ollama (Llama 3), spaCy (en_core_web_sm), SentenceTransformers
- **Database:** PostgreSQL 16 (Relational + JSONB), pgvector (Embeddings), Redis (Queue/Cache)
- **Infrastructure:** Docker, Docker Compose

---

## ⚡ Quick Start

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop) installed and running.
- [Node.js](https://nodejs.org/) (v18+) for frontend development.

### 1. Start the Backend Services
Run the entire platform infrastructure with a single command:

```bash
docker-compose up -d --build
```
*This starts Postgres, Redis, Ollama, ChromaDB, and all Python microservices.*

### 2. Start the Frontend Dashboard
Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

### 3. Access the Platform
- **Dashboard UI:** [http://localhost:5173](http://localhost:5173) (or the port shown in terminal)
- **API Docs (Swagger):**
  - Document Processor: [http://localhost:8081/docs](http://localhost:8081/docs)
  - Rule Extractor: [http://localhost:8082/docs](http://localhost:8082/docs)
  - Scanner: [http://localhost:8083/docs](http://localhost:8083/docs)

---

## 🧪 Operational Workflow

1.  **Upload Policy:** Go to the **Documents** tab and upload a PDF (e.g., "Data Retention Policy").
2.  **AI Extraction:** The system automatically OCRs the text and extracts rules (e.g., "*User data must be deleted after 5 years*").
3.  **Review Rules:** Go to the **Rules Engine** tab to see and approve the AI-generated logic.
4.  **Scan for Violations:** Go to **Violations** and click **"Run Full Scan"**. The system checks your database against the new rules.
5.  **View Report:** See a list of non-compliant records (Red Alerts) on the dashboard.

---

## 📂 Project Structure

```
compliance-platform/
├── services/               # Microservices Source Code
│   ├── document-processor/ # PDF ingestion & OCR
│   ├── rule-extractor/     # AI Logic (spaCy + Ollama)
│   └── scanner/            # SQL Generation & Enforcement
├── frontend/               # React Dashboard Application
├── database/               # SQL Init Scripts & Migrations
├── docs/                   # Detailed Documentation
└── docker-compose.yml      # Container Orchestration
```

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to submit pull requests, report issues, and setup your development environment.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
**Built with ❤️ by ScalerAi Team**
