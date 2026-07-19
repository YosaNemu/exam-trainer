# Exam Trainer — STATUS

Last updated: **2026-07-19** by **claude-code** (browser smoke-test)

## App health

| Item | State |
|------|--------|
| Shell (index, CSS, router) | OK |
| `js/render.js` (`rich`/`el`/`shuffle`) | OK (clean UTF-8) |
| Quiz / flashcards / steps | Implemented **and browser-verified** (M4 done) |
| KaTeX (inline, display, matrices) | Verified rendering correctly, light + dark |
| PWA (manifest + SW) | Present, not yet verified installable (no HTTPS/localhost prod test) |
| `localStorage` progress | Verified persists across full reloads; day-streak logic confirmed |
| Git (`exam-trainer/`) | Initialized, 1 local commit on `main` — **no remote yet** (M5) |
| Exam dates in `courses.json` | All `null` (see MANUAL-TASKS M1) |

## Question banks

| Course id | File | ~Q | Notes |
|-----------|------|---:|-------|
| c | `data/c.json` | 45 | Strongest bank |
| pse | `data/pse.json` | 27 | Strong |
| isxuos | `data/isxuos.json` | 12 | |
| numan | `data/numan.json` | 12 | |
| vlsi | `data/vlsi.json` | 12 | |
| math2 | `data/math2.json` | 10 | |
| mhx2 | `data/mhx2.json` | 10 | |
| graphics | `data/graphics.json` | 10 | |
| mining | `data/mining.json` | 12 | Curriculum seed (`Εξορυξη/` empty) |

**Total questions: 150**

## Known gaps / next work

1. M1 — set `examDate` values (user)
2. Grow banks from past-exam PDFs (agent-doable once targeting a course)
3. M2 — real mining materials → replace seed
4. ~~M4 — browser smoke-test~~ ✅ done 2026-07-19
5. M3/M5 — root git decision / remote push + GitHub Pages (user)

## Ownership notes

- App scaffold + most banks: **claude-code**
- `render.js` cleanup, mining seed, coordination docs, ACADEMY session-close skill: **cursor**
- Browser smoke-test (M4): **claude-code**
