# Exam Trainer

MEng finals training PWA — 9 courses, quiz / flashcards / step-by-step modes.

## Multi-agent

Cursor and Claude Code both work here. See:

- [`../AGENTS.md`](../AGENTS.md) — protocol
- [`STATUS.md`](STATUS.md) — current snapshot
- [`AGENT_LOG.md`](AGENT_LOG.md) — append-only work log

## Run locally

```powershell
cd C:\Users\user\Desktop\ACADEMY\exam-trainer
npx --yes serve -p 5173
```

Open http://localhost:5173

## Data

Question banks: `data/<courseId>.json`. Course list: `data/courses.json`.
