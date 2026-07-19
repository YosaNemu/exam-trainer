// Flashcards — Leitner spaced repetition
import { rich, el, shuffle } from './render.js';
import { recordCard, isDue, getQ } from './progress.js';

const SESSION_MAX = 15;

export function dueCount(bank) {
  return (bank.questions || []).filter(q => q.type === 'flashcard' && isDue(q.id)).length;
}

export function startFlashcards(container, course, bank, onExit) {
  const all = (bank.questions || []).filter(q => q.type === 'flashcard');
  // due first (seen cards whose interval elapsed), then new cards
  const due = shuffle(all.filter(q => getQ(q.id) && isDue(q.id)));
  const fresh = shuffle(all.filter(q => !getQ(q.id)));
  const queue = due.concat(fresh).slice(0, SESSION_MAX);
  let idx = 0;
  const counts = [0, 0, 0, 0]; // again/hard/good/easy

  function show() {
    if (idx >= queue.length) return finish();
    const q = queue[idx];
    container.innerHTML = '';

    const top = el('div', 'game-top');
    const close = el('button', 'close', '✕');
    close.onclick = onExit;
    const bar = el('div', 'bar');
    bar.appendChild(el('i'));
    bar.firstChild.style.width = `${(idx / queue.length) * 100}%`;
    top.append(close, bar, el('div', 'score', `${idx + 1}/${queue.length}`));
    container.appendChild(top);

    const wrap = el('div', 'flash-wrap fade-in');
    const card = el('div', 'flash-card');
    const front = el('div', 'flash-face');
    if (q.topic) front.appendChild(el('span', 'topic', q.topic));
    front.appendChild(el('div', 'qtext', rich(q.front)));
    front.appendChild(el('div', 'hint', 'tap to flip'));
    const back = el('div', 'flash-face back');
    back.appendChild(el('div', 'qtext', rich(q.back)));
    if (q.source) back.appendChild(el('div', 'src', q.source));
    card.append(front, back);
    wrap.appendChild(card);
    container.appendChild(wrap);

    const grades = el('div', 'grade-row');
    grades.style.visibility = 'hidden';
    [['again', 'Again'], ['hard', 'Hard'], ['good', 'Good'], ['easy', 'Easy']].forEach(([cls, label], g) => {
      const b = el('button', `grade-btn ${cls}`, label);
      b.onclick = () => { recordCard(q.id, g); counts[g]++; idx++; show(); };
      grades.appendChild(b);
    });
    container.appendChild(grades);

    card.onclick = () => {
      card.classList.toggle('flipped');
      grades.style.visibility = 'visible';
    };
  }

  function finish() {
    container.innerHTML = '';
    const total = counts.reduce((a, b) => a + b, 0);
    const strong = counts[2] + counts[3];
    const pct = total ? Math.round(100 * strong / total) : 0;
    const wrap = el('div', 'result fade-in');
    const ring = el('div', 'ring', `${pct}%`);
    ring.style.setProperty('--pct', pct);
    wrap.appendChild(ring);
    wrap.appendChild(el('h2', '', total === 0 ? 'All caught up!' : pct >= 70 ? 'Strong recall!' : 'They will come back'));
    wrap.appendChild(el('p', '', total === 0
      ? 'No cards due right now — come back later.'
      : `${strong} solid · ${counts[1]} hard · ${counts[0]} again`));
    container.appendChild(wrap);

    const more = el('button', 'primary-btn', 'Review more');
    more.onclick = () => startFlashcards(container, course, bank, onExit);
    const back = el('button', 'ghost-btn', 'Back to course');
    back.onclick = onExit;
    container.append(more, back);
  }

  show();
}
