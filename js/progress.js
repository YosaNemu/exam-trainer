// Progress persistence — all data stays in this device's localStorage.
const KEY = 'examTrainer.v1';

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; }
  catch { return {}; }
}

const state = load();
state.q = state.q || {};                 // per-question stats keyed by question id
state.meta = state.meta || { answered: 0, dayStreak: 0, lastDay: null };

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage full/blocked */ }
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function touchDayStreak() {
  const t = today();
  if (state.meta.lastDay === t) return;
  const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  state.meta.dayStreak = state.meta.lastDay === yesterday ? state.meta.dayStreak + 1 : 1;
  state.meta.lastDay = t;
}

function ensure(id) {
  if (!state.q[id]) state.q[id] = { attempts: 0, correct: 0, streak: 0, box: 0, due: 0, last: 0 };
  return state.q[id];
}

export function getQ(id) {
  return state.q[id] || null;
}

export function dayStreak() {
  // streak display: broken if last activity was before yesterday
  const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  if (state.meta.lastDay !== today() && state.meta.lastDay !== yesterday) return 0;
  return state.meta.dayStreak;
}

// MCQ / step answers
export function recordAnswer(id, isCorrect) {
  const q = ensure(id);
  q.attempts++;
  q.last = Date.now();
  if (isCorrect) { q.correct++; q.streak++; } else { q.streak = 0; }
  state.meta.answered++;
  touchDayStreak();
  save();
}

// Flashcard grading — Leitner boxes 1..5 with intervals in days
const INTERVALS = [0, 1, 2, 4, 8];
export function recordCard(id, grade) { // 0 again, 1 hard, 2 good, 3 easy
  const q = ensure(id);
  q.attempts++;
  q.last = Date.now();
  if (grade === 0) q.box = 1;
  else if (grade === 1) q.box = Math.max(1, q.box);
  else if (grade === 2) q.box = Math.min(5, (q.box || 0) + 1);
  else q.box = Math.min(5, (q.box || 0) + 2);
  if (grade >= 2) { q.correct++; q.streak++; } else { q.streak = 0; }
  q.due = Date.now() + INTERVALS[q.box - 1] * 864e5;
  state.meta.answered++;
  touchDayStreak();
  save();
}

export function isDue(id) {
  const q = state.q[id];
  return !q || q.due <= Date.now();
}

export function isMastered(question) {
  const q = state.q[question.id];
  if (!q) return false;
  return question.type === 'flashcard' ? q.box >= 3 : q.streak >= 2;
}

export function isSeen(id) {
  return !!state.q[id];
}

// Sampling weight: unseen and recently-wrong questions come up more often
export function weightFor(id) {
  const q = state.q[id];
  if (!q) return 3;
  if (q.streak === 0 && q.attempts > 0) return 4;
  if (q.streak === 1) return 2;
  return 1;
}

export function weightedSample(items, n) {
  const pool = items.map(it => ({ it, w: weightFor(it.id) }));
  const out = [];
  while (out.length < n && pool.length) {
    let total = 0;
    for (const p of pool) total += p.w;
    let r = Math.random() * total;
    let idx = 0;
    for (; idx < pool.length; idx++) {
      r -= pool[idx].w;
      if (r <= 0) break;
    }
    idx = Math.min(idx, pool.length - 1);
    out.push(pool[idx].it);
    pool.splice(idx, 1);
  }
  return out;
}

export function courseStats(bank) {
  const qs = bank.questions || [];
  let seen = 0, mastered = 0;
  for (const question of qs) {
    if (isSeen(question.id)) seen++;
    if (isMastered(question)) mastered++;
  }
  return {
    total: qs.length,
    seen,
    mastered,
    pct: qs.length ? Math.round(100 * mastered / qs.length) : 0,
  };
}
