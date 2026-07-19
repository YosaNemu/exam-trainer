// Shared DOM + markdown/math helpers used by every training mode.
// Owned jointly: keep exports `rich`, `el`, `shuffle` stable.

export function el(tag, className = '', html) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (html !== undefined && html !== null && html !== '') node.innerHTML = html;
  return node;
}

export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function katexHtml(tex, displayMode) {
  const k = (typeof katex !== 'undefined' && katex) || (typeof window !== 'undefined' && window.katex);
  if (k && k.renderToString) {
    try {
      return k.renderToString(tex, { throwOnError: false, displayMode, strict: 'ignore' });
    } catch { /* fall through */ }
  }
  return `<code class="inline">${escapeHtml(tex)}</code>`;
}

const C_KEYWORDS = new Set([
  'auto','break','case','char','const','continue','default','do','double','else',
  'enum','extern','float','for','goto','if','int','long','register','return','short',
  'signed','sizeof','static','struct','switch','typedef','union','unsigned','void',
  'volatile','while','include','define','ifdef','ifndef','endif','NULL','true','false',
  'bool','EOF','FILE','size_t','printf','scanf','malloc','calloc','realloc','free',
]);

function highlightC(code) {
  const parts = [];
  const re = /(\/\*[\s\S]*?\*\/|\/\/[^\n]*)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])')|(\b\d+\.?\d*\b)|([A-Za-z_]\w*)|([{}()\[\];,.<>=!+\-*/%&|^~?:#]+)|(\s+)|(.)/g;
  let m;
  while ((m = re.exec(code))) {
    const [tok, comment, str, num, ident, punct, space, other] = m;
    if (comment) parts.push(`<span class="c">${escapeHtml(tok)}</span>`);
    else if (str) parts.push(`<span class="s">${escapeHtml(tok)}</span>`);
    else if (num) parts.push(`<span class="n">${escapeHtml(tok)}</span>`);
    else if (ident) {
      parts.push(C_KEYWORDS.has(ident)
        ? `<span class="k">${escapeHtml(ident)}</span>`
        : escapeHtml(ident));
    } else if (punct) parts.push(`<span class="p">${escapeHtml(tok)}</span>`);
    else if (space) parts.push(space);
    else parts.push(escapeHtml(other || tok));
  }
  return parts.join('');
}

function fenceHtml(lang, body) {
  const code = body.replace(/^\n+|\n+$/g, '');
  const inner = !lang || /^c\b/i.test(lang) ? highlightC(code) : escapeHtml(code);
  return `<pre class="code"><code>${inner}</code></pre>`;
}

function renderPlain(text) {
  let out = escapeHtml(text);
  out = out.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
  out = out.replace(/`([^`\n]+)`/g, '<code class="inline">$1</code>');
  out = out.replace(/\n\n+/g, '<br><br>').replace(/\n/g, '<br>');
  return out;
}

/** Markdown-ish → HTML: fences, $$/$, `code`, **bold**, newlines + KaTeX. */
export function rich(src) {
  if (src == null || src === '') return '';
  const text = String(src);
  const parts = [];
  const re = /```([a-zA-Z0-9_+-]*)\n?([\s\S]*?)```|\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g;
  let last = 0, m;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(renderPlain(text.slice(last, m.index)));
    if (m[2] !== undefined) parts.push(fenceHtml(m[1], m[2]));
    else if (m[3] !== undefined) parts.push(katexHtml(m[3].trim(), true));
    else parts.push(katexHtml(m[4].trim(), false));
    last = re.lastIndex;
  }
  if (last < text.length) parts.push(renderPlain(text.slice(last)));
  return parts.join('');
}