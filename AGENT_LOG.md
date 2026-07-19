# Exam Trainer — AGENT_LOG

Append-only. Newest entries at the **bottom**.
Format:

```
### YYYY-MM-DD HH:MM TZ — <cursor|claude-code>
- Did: …
- Files: …
- Notes: …
```

---

### 2026-07-19 ~14:30+ — claude-code
- Did: Scaffolded Exam Trainer PWA (index, CSS, quiz/flashcards/steps/progress, KaTeX vendor, SW, 9 course banks).
- Files: `exam-trainer/**` (initial)
- Notes: `mining.json` left empty; `render.js` expected by imports.

### 2026-07-19 ~17:20+03:00 — cursor
- Did: Confirmed `render.js` was present but contained null bytes (broke tooling); rewrote clean UTF-8 `js/render.js` preserving `rich`/`el`/`shuffle`. Seeded `data/mining.json` with 12 curriculum starter items (5 MCQ, 5 flashcards, 2 steps) because `Εξορυξη/` has 0 files. Added multi-agent coordination docs.
- Files: `exam-trainer/js/render.js`, `exam-trainer/data/mining.json`, `AGENTS.md`, `CLAUDE.md`, `exam-trainer/STATUS.md`, `exam-trainer/AGENT_LOG.md`, `exam-trainer/README.md`, `.cursor/rules/multi-agent-coordination.mdc`
- Notes: Do not wipe mining seed until real materials arrive; prefer appending exam-sourced questions. Banks now total **150** questions.

### 2026-07-19 ~17:30+03:00 — cursor (session-close)
- Did: Adapted company session-close skill for ACADEMY; added MANUAL-TASKS + Cursor rule; synced STATUS/AGENTS/CLAUDE; initial `exam-trainer` git commit as part of ritual.
- Files: `.claude/skills/session-close/SKILL.md`, `.cursor/rules/session-close.mdc`, `MANUAL-TASKS.md`, `AGENTS.md`, `CLAUDE.md`, `exam-trainer/STATUS.md`, `exam-trainer/AGENT_LOG.md`, plus first commit of app tree under `exam-trainer/`
- Notes: Root ops docs remain outside git (M3). Handoff delivered in chat.
