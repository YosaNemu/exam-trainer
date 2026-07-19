// Quick-fire MCQ engine
import { rich, el, shuffle } from './render.js';
import { recordAnswer, weightedSample } from './progress.js';

const ROUND = 10;

export function startQuiz(container, course, bank, onExit) {
  const pool = (bank.questions || []).filter(q => q.type === 'mcq');
  const round = weightedSample(pool, Math.min(ROUND, pool.length));
  let idx = 0, score = 0;

  function header(total) {
    const top = el('div', 'game-top');
    const close = el('button', 'close', '✕');
    close.onclick = onExit;
    const bar = el('div', 'bar');
    bar.appendChild(el('i', '', ''));
    bar.firstChild.style.width = `${(idx / total) * 100}%`;
    const score_ = el('div', 'score', `${idx + 1}/${total}`);
    top.append(close, bar, score_);
    return top;
  }

  function show() {
    if (idx >= round.length) return finish();
    const q = round[idx];
    container.innerHTML = '';
    container.appendChild(header(round.length));

    const card = el('div', 'qcard fade-in');
    if (q.topic) card.appendChild(el('span', 'topic', q.topic));
    const body = el('div', 'qtext', rich(q.question));
    if (q.image) {
      const img = document.createElement('img');
      img.src = q.image;
      img.alt = '';
      body.appendChild(img);
    }
    card.appendChild(body);
    container.appendChild(card);

    // shuffle choices, remember where the right answer went
    const order = shuffle(q.choices.map((_, i) => i));
    const choices = el('div', 'choices');
    const keys = ['Α', 'Β', 'Γ', 'Δ', 'Ε', 'ΣΤ'];
    order.forEach((orig, pos) => {
      const btn = el('button', 'choice fade-in');
      btn._orig = orig;
      btn.append(el('span', 'key', keys[pos]), el('span', 'qtext', rich(q.choices[orig])));
      btn.onclick = () => pick(orig, btn, choices, q);
      choices.appendChild(btn);
    });
    container.appendChild(choices);
  }

  function pick(orig, btn, choicesEl, q) {
    const good = orig === q.answer;
    if (good) score++;
    recordAnswer(q.id, good);

    const btns = [...choicesEl.querySelectorAll('.choice')];
    btns.forEach(b => { b.disabled = true; if (b !== btn) b.classList.add('dim'); });
    btn.classList.remove('dim');
    btn.classList.add(good ? 'correct' : 'wrong');
    if (!good) {
      const right = btns.find(b => b._orig === q.answer);
      if (right) { right.classList.remove('dim'); right.classList.add('correct'); }
    }

    const fb = el('div', `feedback ${good ? 'good' : 'bad'}`);
    fb.appendChild(el('div', 'verdict', good ? pickMsg(GOOD) : pickMsg(BAD)));
    if (q.explanation) fb.appendChild(el('div', 'expl qtext', rich(q.explanation)));
    if (q.source) fb.appendChild(el('div', 'src', q.source));
    container.appendChild(fb);

    const next = el('button', 'primary-btn', idx + 1 < round.length ? 'Next question' : 'See results');
    next.onclick = () => { idx++; show(); };
    container.appendChild(next);
    next.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }

  function finish() {
    container.innerHTML = '';
    const pct = round.length ? Math.round(100 * score / round.length) : 0;
    const wrap = el('div', 'result fade-in');
    const ring = el('div', 'ring', `${pct}%`);
    ring.style.setProperty('--pct', pct);
    wrap.appendChild(ring);
    wrap.appendChild(el('h2', '', pct >= 80 ? 'Excellent!' : pct >= 60 ? 'Good progress' : 'Keep training'));
    wrap.appendChild(el('p', '', `${score} of ${round.length} correct`));
    container.appendChild(wrap);

    const again = el('button', 'primary-btn', 'Play another round');
    again.onclick = () => startQuiz(container, course, bank, onExit);
    const back = el('button', 'ghost-btn', 'Back to course');
    back.onclick = onExit;
    container.append(again, back);
  }

  show();
}

const GOOD = ['Correct! 🎯', 'Nailed it! ✅', 'Right! 💪', 'Exactly! ⭐'];
const BAD = ['Not quite ❌', 'Wrong one 😬', 'Missed it 📚'];
function pickMsg(list) {
  return list[Math.floor(Math.random() * list.length)];
}
