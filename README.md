# Patch — Discount Tire Information Center

An IT self-service chatbot for Discount Tire store associates, built with Next.js 16 App Router, MongoDB, and Ollama LLM integration.

## Features

- **Authentication**: Login/Signup with bcrypt-hashed passwords and JWT session cookies
- **AI Chat**: Conversational troubleshooting powered by Ollama (`gemma4:31b-cloud`)
- **Knowledge Base**: Markdown file-based KB retrieved contextually per category
- **Dynamic Controls**: LLM-driven buttons, dropdowns, and multi-card forms
- **Incident Management**: Full CRUD with list and detail views
- **Escalation/Resolution Flows**: Structured outcome cards with summary and feedback
- **Feedback System**: 1–5 star rating with optional comments
- **Resume Chat**: Session restoration via sessionStorage

## Getting Started

### 1. Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```bash
cp .env.example .env.local
```

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `MONGODB_DB` | Database name (default: `patch`) |
| `JWT_SECRET` | Secret for JWT signing (change in prod) |
| `OLLAMA_BASE_URL` | Ollama API base URL |
| `OLLAMA_API_KEY` | Ollama API key (if required) |
| `OLLAMA_MODEL` | Model name (default: `gemma4:31b-cloud`) |

### 2. Knowledge Base (optional)

Place Markdown troubleshooting guides in:
```
knowledge_base/workflows/vdi.md
knowledge_base/workflows/<category>.md
knowledge_base/images/<filename>.png
```

The system reads these at runtime — do NOT commit KB files.

### 3. Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Build

```bash
npm run build
npm start
```

## Project Structure

```
app/
  login/           Login page
  signup/          Signup page
  incidents/       Incident list + detail pages
  components/      Shared UI components
  api/             Route handlers (auth, chat, incidents, feedback, kb)
  page.tsx         Main page (pre-chat / active-chat state)
  layout.tsx       Root layout
lib/
  mongodb.ts       MongoDB connection singleton
  auth.ts          JWT + bcrypt utilities
  kb.ts            Knowledge base file reader
  llm.ts           Ollama API client + response sanitizer
types/
  index.ts         Shared TypeScript types
proxy.ts           Route protection (Next.js 16 proxy)
```

## Tech Stack

- **Framework**: Next.js 16 App Router (Turbopack)
- **Database**: MongoDB (via `mongodb` driver)
- **Auth**: JWT + bcryptjs
- **LLM**: Ollama (`gemma4:31b-cloud`)
- **Styles**: Tailwind CSS v4
- **Deploy**: Vercel
