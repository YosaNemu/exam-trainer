// Exam Trainer — router + home/course screens
import { el } from './render.js';
import { courseStats, dayStreak, isDue, getQ } from './progress.js';
import { startQuiz } from './quiz.js';
import { startFlashcards, dueCount } from './flashcards.js';
import { startSteps } from './steps.js';

const $app = document.getElementById('app');
let courses = null;
const banks = {};

async function loadCourses() {
  if (!courses) {
    const res = await fetch('data/courses.json');
    courses = (await res.json()).courses;
  }
  return courses;
}

async function loadBank(id) {
  if (!banks[id]) {
    try {
      const res = await fetch(`data/${id}.json`);
      banks[id] = res.ok ? await res.json() : { questions: [] };
    } catch {
      banks[id] = { questions: [] };
    }
  }
  return banks[id];
}

function courseVars(c) {
  return `--c-color:${c.color};--c-soft:${c.color}22`;
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr + 'T09:00:00');
  return Math.ceil((d - Date.now()) / 864e5);
}

/* ---------- Home ---------- */
async function homeScreen() {
  await loadCourses();
  await Promise.all(courses.map(c => loadBank(c.id)));
  $app.innerHTML = '';

  const header = el('div', 'home-header');
  const title = el('div');
  title.appendChild(el('h1', '', 'Exam Trainer'));
  title.appendChild(el('div', 'sub', 'MEng finals · 9 courses'));
  header.appendChild(title);
  const streak = dayStreak();
  header.appendChild(el('div', 'streak-chip', `🔥 ${streak} day${streak === 1 ? '' : 's'}`));
  $app.appendChild(header);

  // Upcoming exams strip (only courses with a date set)
  const dated = courses
    .map(c => ({ c, days: daysUntil(c.examDate) }))
    .filter(x => x.days !== null && x.days >= 0)
    .sort((a, b) => a.days - b.days);
  if (dated.length) {
    const strip = el('div', 'exam-strip');
    dated.forEach(({ c, days }) => {
      const chip = el('div', 'exam-chip');
      chip.innerHTML = `<span>${c.icon}</span><span><b>${c.short}</b><br>` +
        `<span class="days${days <= 7 ? ' soon' : ''}">${days === 0 ? 'today!' : days + 'd left'}</span></span>`;
      strip.appendChild(chip);
    });
    $app.appendChild(strip);
  }

  const grid = el('div', 'course-grid');
  courses.forEach(c => {
    const bank = banks[c.id];
    const stats = courseStats(bank);
    const card = el('button', 'course-card' + (stats.total === 0 ? ' empty' : ''));
    card.style.cssText = courseVars(c);
    card.appendChild(el('div', 'icon', c.icon));
    card.appendChild(el('div', 'name', c.name));
    card.appendChild(el('div', 'gr', c.greek));
    if (stats.total === 0) {
      card.appendChild(el('div', 'meta', '<span class="badge">awaiting materials</span>'));
    } else {
      const bar = el('div', 'bar');
      bar.appendChild(el('i'));
      bar.firstChild.style.width = `${stats.pct}%`;
      card.appendChild(bar);
      card.appendChild(el('div', 'meta', `<span>${stats.pct}% mastered</span><span>${stats.total} q</span>`));
    }
    card.onclick = () => { location.hash = `#/course/${c.id}`; };
    grid.appendChild(card);
  });
  $app.appendChild(grid);
}

/* ---------- Course screen ---------- */
async function courseScreen(id) {
  await loadCourses();
  const c = courses.find(x => x.id === id);
  if (!c) return homeScreen();
  const bank = await loadBank(id);
  const qs = bank.questions || [];
  $app.innerHTML = '';
  $app.style.cssText = courseVars(c);

  const top = el('div', 'topbar');
  const back = el('button', 'back', '←');
  back.onclick = () => { location.hash = '#/'; };
  const t = el('div');
  t.appendChild(el('div', 'title', `${c.icon} ${c.name}`));
  t.appendChild(el('div', 'subtitle', c.greek));
  top.append(back, t);
  $app.appendChild(top);

  if (qs.length === 0) {
    const empty = el('div', 'empty-state');
    empty.appendChild(el('div', 'big', '📭'));
    empty.appendChild(el('div', '', 'No questions yet — this bank fills up as soon as course materials are provided.'));
    $app.appendChild(empty);
    return;
  }

  const stats = courseStats(bank);
  const days = daysUntil(c.examDate);
  const row = el('div', 'stat-row');
  row.appendChild(statBox(stats.mastered, 'mastered'));
  row.appendChild(statBox(stats.seen, 'seen'));
  row.appendChild(days !== null && days >= 0 ? statBox(days, 'days to exam') : statBox(stats.total, 'questions'));
  $app.appendChild(row);

  const mcq = qs.filter(q => q.type === 'mcq').length;
  const cards = qs.filter(q => q.type === 'flashcard').length;
  const due = dueCount(bank);
  const probs = qs.filter(q => q.type === 'steps').length;

  $app.appendChild(el('div', 'section-label', 'Train'));
  $app.appendChild(modeBtn('⚡', 'Quick-fire quiz', 'Rounds of 10 — weak topics come up more', mcq ? `${mcq}` : null,
    mcq > 0, () => { location.hash = `#/play/${id}/quiz`; }));
  $app.appendChild(modeBtn('🃏', 'Flashcards', 'Spaced repetition — formulas & theory', cards ? `${due} due` : null,
    cards > 0, () => { location.hash = `#/play/${id}/cards`; }));
  $app.appendChild(modeBtn('🪜', 'Step-by-step', 'Real exam problems, guided sub-steps', probs ? `${probs}` : null,
    probs > 0, () => { location.hash = `#/play/${id}/steps`; }));
}

function statBox(value, label) {
  const s = el('div', 'stat');
  s.appendChild(el('b', '', String(value)));
  s.appendChild(el('span', '', label));
  return s;
}

function modeBtn(icon, name, desc, count, enabled, onClick) {
  const b = el('button', 'mode-btn');
  b.appendChild(el('div', 'icon', icon));
  const t = el('div');
  t.appendChild(el('b', '', name));
  t.appendChild(el('span', '', desc));
  b.appendChild(t);
  if (count) b.appendChild(el('span', 'count', count));
  b.disabled = !enabled;
  if (enabled) b.onclick = onClick;
  return b;
}

/* ---------- Play ---------- */
async function playScreen(id, mode) {
  await loadCourses();
  const c = courses.find(x => x.id === id);
  if (!c) return homeScreen();
  const bank = await loadBank(id);
  $app.innerHTML = '';
  $app.style.cssText = courseVars(c);
  const exit = () => { location.hash = `#/course/${id}`; };
  if (mode === 'quiz') startQuiz($app, c, bank, exit);
  else if (mode === 'cards') startFlashcards($app, c, bank, exit);
  else if (mode === 'steps') startSteps($app, c, bank, exit);
  else exit();
}

/* ---------- Router ---------- */
function route() {
  const h = location.hash.replace(/^#\/?/, '');
  const [seg, id, mode] = h.split('/');
  window.scrollTo(0, 0);
  if (seg === 'course' && id) courseScreen(id);
  else if (seg === 'play' && id && mode) playScreen(id, mode);
  else { $app.style.cssText = ''; homeScreen(); }
}

window.addEventListener('hashchange', route);
route();

// PWA offline support
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
