// Step-by-step worked problems — solve real exam problems one sub-step at a time.
import { rich, el, shuffle } from './render.js';
import { recordAnswer, getQ } from './progress.js';

export function startSteps(container, course, bank, onExit) {
  const problems = (bank.questions || []).filter(q => q.type === 'steps');

  function list() {
    container.innerHTML = '';
    const top = el('div', 'game-top');
    const close = el('button', 'close', '✕');
    close.onclick = onExit;
    top.append(close, el('div', 'score', 'Step-by-step problems'));
    container.appendChild(top);

    problems.forEach((p, i) => {
      const item = el('button', 'step-list-item fade-in');
      item.appendChild(el('span', 'num', String(i + 1)));
      const txt = el('span');
      txt.appendChild(el('b', '', p.title));
      txt.appendChild(el('span', '', `${p.steps.length} steps · ${p.topic || ''}`));
      item.appendChild(txt);
      const stat = getQ(p.id);
      if (stat && stat.streak > 0) item.appendChild(el('span', 'done', '✓'));
      item.onclick = () => play(p);
      container.appendChild(item);
    });
  }

  function play(p) {
    let idx = -1; // -1 = intro
    const results = new Array(p.steps.length).fill(null);

    function progressBar() {
      const bar = el('div', 'step-progress');
      p.steps.forEach((_, i) => {
        const seg = el('i');
        if (results[i] === true) seg.className = 'ok';
        else if (results[i] === false) seg.className = 'bad';
        else if (i === idx) seg.className = 'on';
        bar.appendChild(seg);
      });
      return bar;
    }

    function head() {
      const top = el('div', 'game-top');
      const close = el('button', 'close', '✕');
      close.onclick = list;
      top.append(close, el('div', 'score', p.title));
      return top;
    }

    function intro() {
      container.innerHTML = '';
      container.appendChild(head());
      const card = el('div', 'qcard fade-in');
      if (p.topic) card.appendChild(el('span', 'topic', p.topic));
      const body = el('div', 'qtext', rich(p.intro));
      if (p.image) {
        const img = document.createElement('img');
        img.src = p.image;
        img.alt = '';
        body.appendChild(img);
      }
      card.appendChild(body);
      if (p.source) card.appendChild(el('div', 'src', p.source));
      container.appendChild(card);
      container.appendChild(el('p', 'intro-note', `Solve it in ${p.steps.length} guided steps. Work each step on paper first.`));
      const start = el('button', 'primary-btn', 'Start solving');
      start.onclick = () => { idx = 0; step(); };
      container.appendChild(start);
    }

    function step() {
      if (idx >= p.steps.length) return summary();
      const s = p.steps[idx];
      container.innerHTML = '';
      container.appendChild(head());
      container.appendChild(progressBar());

      const card = el('div', 'qcard fade-in');
      card.appendChild(el('span', 'topic', `Step ${idx + 1} / ${p.steps.length}`));
      card.appendChild(el('div', 'qtext', rich(s.prompt)));
      container.appendChild(card);

      if (s.choices) {
        const order = shuffle(s.choices.map((_, i) => i));
        const choices = el('div', 'choices');
        const keys = ['Α', 'Β', 'Γ', 'Δ', 'Ε'];
        order.forEach((orig, pos) => {
          const btn = el('button', 'choice');
          btn._orig = orig;
          btn.append(el('span', 'key', keys[pos]), el('span', 'qtext', rich(s.choices[orig])));
          btn.onclick = () => {
            const good = orig === s.answer;
            [...choices.children].forEach(b => { b.disabled = true; if (b !== btn) b.classList.add('dim'); });
            btn.classList.add(good ? 'correct' : 'wrong');
            if (!good) {
              const right = [...choices.children].find(b => b._orig === s.answer);
              if (right) { right.classList.remove('dim'); right.classList.add('correct'); }
            }
            after(good, s);
          };
          choices.appendChild(btn);
        });
        container.appendChild(choices);
      } else if (s.input) {
        const row = el('div', 'numeric-row');
        const input = document.createElement('input');
        input.type = 'text';
        input.inputMode = 'decimal';
        input.placeholder = 'Your result…';
        row.appendChild(input);
        if (s.input.unit) row.appendChild(el('span', 'unit', s.input.unit));
        const check = el('button', '', 'Check');
        row.appendChild(check);
        container.appendChild(row);
        const submit = () => {
          const v = parseFloat(input.value.replace(',', '.'));
          if (Number.isNaN(v)) { input.focus(); return; }
          const good = Math.abs(v - s.input.value) <= (s.input.tolerance ?? Math.abs(s.input.value) * 0.02);
          input.disabled = true;
          check.disabled = true;
          input.style.borderColor = good ? 'var(--ok)' : 'var(--bad)';
          after(good, s, v);
        };
        check.onclick = submit;
        input.onkeydown = e => { if (e.key === 'Enter') submit(); };
        input.focus();
      }
    }

    function after(good, s, entered) {
      results[idx] = good;
      const fb = el('div', `feedback ${good ? 'good' : 'bad'}`);
      fb.appendChild(el('div', 'verdict', good ? 'Correct step ✅' : 'Not this one ❌'));
      if (!good && s.input) {
        fb.appendChild(el('div', 'expl qtext', `<b>Expected:</b> ${s.input.value}${s.input.unit ? ' ' + s.input.unit : ''}`));
      }
      if (s.explanation) fb.appendChild(el('div', 'expl qtext', rich(s.explanation)));
      container.appendChild(fb);
      const next = el('button', 'primary-btn', idx + 1 < p.steps.length ? 'Next step' : 'Finish problem');
      next.onclick = () => { idx++; step(); };
      container.appendChild(next);
      next.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }

    function summary() {
      const good = results.filter(Boolean).length;
      const pct = Math.round(100 * good / results.length);
      recordAnswer(p.id, good >= Math.ceil(results.length * 2 / 3));
      container.innerHTML = '';
      container.appendChild(head());
      const wrap = el('div', 'result fade-in');
      const ring = el('div', 'ring', `${pct}%`);
      ring.style.setProperty('--pct', pct);
      wrap.appendChild(ring);
      wrap.appendChild(el('h2', '', pct === 100 ? 'Flawless solve!' : pct >= 66 ? 'Solid work' : 'Review this one'));
      wrap.appendChild(el('p', '', `${good} of ${results.length} steps correct`));
      container.appendChild(wrap);
      const back = el('button', 'primary-btn', 'More problems');
      back.onclick = list;
      const exit = el('button', 'ghost-btn', 'Back to course');
      exit.onclick = onExit;
      container.append(back, exit);
    }

    intro();
  }

  list();
}
