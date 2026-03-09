# Recruitment Tool

A full-stack candidate recommendation system with resume upload, AI-powered parsing, and skill-based search.

## Tech Stack
- **Frontend**: React 19, TypeScript
- **Backend**: NestJS 11, TypeScript
- **Database**: PostgreSQL
- **Resume parsing**: OpenAI GPT-4o-mini (extracts structured data from PDF/DOCX)

## Features
- Filter candidates by skills, experience, location, gender
- **Semantic similarity search** – skills filter uses pgvector + OpenAI embeddings for semantic matching
- **Upload resumes** (PDF or DOCX) – AI extracts name, skills, experience, location, etc.
- Pagination with filters preserved
- Seed data (20 sample profiles) on first run

## Setup

### 1. Prerequisites
- Node.js 20+
- PostgreSQL
- OpenAI API key

### 2. Database
Install pgvector extension (required for similarity search):
```bash
# macOS (Homebrew)
brew install pgvector

# Or use a PostgreSQL image with pgvector pre-installed
```

Create the database and enable the extension:
```bash
createdb recruit
psql -d recruit -c "CREATE EXTENSION IF NOT EXISTS vector"
```

### 3. Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env: set DB_* and OPENAI_API_KEY
npm run start:dev
```

### 4. Frontend
```bash
cd frontend
npm install
npm start
```

### 5. Open
- Frontend: http://localhost:3001
- Backend API: http://localhost:3000

## Environment (.env)
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=recruit
OPENAI_API_KEY=sk-your-key
```

## API
- `GET /profiles?skills=React,Node&experience=3&location=NY&gender=Male&page=1&limit=5` – search candidates
- `POST /resumes/upload` – upload PDF/DOCX (multipart/form-data, field: `file`)

---

## Deploy to Vercel

Deploy frontend and backend as **two separate Vercel projects** from the same repo.

### 1. Database (Vercel Postgres or Neon)

Use [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres) or [Neon](https://neon.tech) (with pgvector). Add connection env vars to the backend project.

### 2. Backend Project

1. Create new project at [vercel.com/new](https://vercel.com/new)
2. Import repo, set **Root Directory** to `backend`
3. Add environment variables:
   - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` (from your Postgres provider)
   - `OPENAI_API_KEY`
   - `BLOB_READ_WRITE_TOKEN` (from Vercel Dashboard → Storage → Blob)
   - `SKILLS_SIMILARITY_THRESHOLD` (optional, default 0.7)
4. Deploy. Note the URL (e.g. `https://recruit-api.vercel.app`)

### 3. Frontend Project

1. Create another project, set **Root Directory** to `frontend`
2. Add environment variable: `REACT_APP_API_URL` = your backend URL (e.g. `https://recruit-api.vercel.app`)
3. Deploy

### 4. Enable Vercel Blob

In the backend project: Vercel Dashboard → Storage → Create Database → Blob. Copy `BLOB_READ_WRITE_TOKEN` to env vars.
