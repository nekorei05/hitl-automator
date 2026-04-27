<div align="center">

# HITL Automator

**Human-in-the-Loop AI Task Orchestrator for Job Application Outreach**

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Gemini_AI-4285F4?style=for-the-badge&logo=google&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

</div>

---

> *Most AI tools generate output and stop. This one generates output and waits for you.*

HITL Automator is an **agentic AI system** for job application outreach. You paste a job description, the AI agent reads your real profile from a database, assesses skill fit and drafts a tailored cold email. Then it stops and waits. Nothing goes out until you approve it.

That pause is the point.

---

## Agentic Architecture

The core is a **tool-calling agent** built on Gemini 2.0 Flash. It doesn't respond to a prompt and return text : it reasons across multiple steps, calls real tools, and persists state to a database:

```
User submits job description
        ↓
[Agent] Calls → get_my_profile      # reads skills, projects, experience from MongoDB
        ↓
[Agent] Analyzes job vs profile     # determines match level: HIGH / MEDIUM / LOW
        ↓
[Agent] Drafts tailored cold email  # tone adapts based on match level
        ↓
[Agent] Calls → stage_outreach      # saves task to DB, status → READY_FOR_REVIEW
        ↓
[Human] Approves or Rejects         # ← the HITL gate. agent cannot pass this alone.
        ↓
[Worker] Executes → COMPLETED / REJECTED
```

The agent handles transient failures with a `withRetry` wrapper — 503 overloads are retried with delay, 429 quota errors fail immediately (retrying quota errors wastes your remaining quota).

---

## Features

- **Agentic tool-calling** — multi-turn Gemini chat loop with `get_my_profile` and `stage_outreach` as registered tools
- **Match analysis** — scores job fit HIGH / MEDIUM / LOW with missing skills, strengths and improvement suggestions
- **Profile-aware drafting** — email references your actual projects and experience not a generic template
- **Human approval gate** — AI cannot move a task past `READY_FOR_REVIEW` without explicit human action
- **Task lifecycle** — defined state machine from `CREATED` through to `COMPLETED` or `REJECTED`
- **Agent logs panel** — collapsible terminal-style view in the UI showing every tool call the agent made
- **Rate limit resilience** — smart retry logic that distinguishes overload (retry) from quota exhaustion (fail fast)

---

## Tech Stack

| Layer | Tech |
|-------|------|
| AI Agent | Google Gemini 2.0 Flash (function calling) |
| Backend | Node.js, Express |
| Database | MongoDB + Mongoose |
| Email | Nodemailer |
| Frontend | React 18, Vite |
| Styling | Tailwind CSS |

---

## Task Lifecycle

Every job description goes through a defined state machine:

| Status | Triggered by | Meaning |
|--------|-------------|---------|
| `CREATED` | `POST /api/tasks` | Task saved, pending AI processing |
| `READY_FOR_REVIEW` | `POST /api/tasks/:id/generate-draft` | Email drafted, waiting for human |
| `COMPLETED` | `POST /api/tasks/:id/approve` | Human approved — task done |
| `REJECTED` | `POST /api/tasks/:id/reject` | Human rejected, reason stored |
| `STALE` | Worker fallback | Unknown task type, skipped |

The frontend polls every 6 seconds so status updates appear without a manual refresh. The HITL gate sits between `READY_FOR_REVIEW` and `COMPLETED` — the agent cannot cross it alone.

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or [Atlas](https://mongodb.com/atlas))
- [Gemini API key](https://aistudio.google.com)

### Backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
GEMINI_API_KEY=your_key_here
MONGO_URI=mongodb://localhost:27017/hitl
PORT=3000
CLIENT_URL=http://localhost:5173
```

```bash
npm run dev
```

> On first run, a default user profile (name, skills, projects) is automatically inserted into MongoDB if none exists. You can update it at any time via `PUT /api/profile` — no need to touch the database directly.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173`, API at `http://localhost:3000`.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/prompt` | Trigger the agent with a job description |
| `GET` | `/api/tasks` | Fetch all tasks |
| `POST` | `/api/tasks/:id/generate-draft` | Regenerate email draft for a task |
| `POST` | `/api/tasks/:id/approve` | Approve a task |
| `POST` | `/api/tasks/:id/reject` | Reject a task with optional reason |
| `GET` | `/api/profile` | Fetch the active user profile |
| `PUT` | `/api/profile` | Update name, skills, projects, experience |

---

## On AI Quota

This project uses the Gemini free tier, which has per-minute and daily limits. If you see `429 Too Many Requests`:

- The retry logic will handle brief overloads automatically
- If the daily quota is exhausted, wait for reset or add billing at [console.cloud.google.com](https://console.cloud.google.com) — Gemini Flash costs ~$0.075 per million tokens, so a portfolio project costs almost nothing

---
