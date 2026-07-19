// Offline support: stale-while-revalidate for all same-origin GETs.
const CACHE = 'exam-trainer-v1';
const SHELL = [
  '.',
  'index.html',
  'css/app.css',
  'js/app.js', 'js/quiz.js', 'js/flashcards.js', 'js/steps.js', 'js/progress.js', 'js/render.js',
  'vendor/katex/katex.min.css',
  'vendor/katex/katex.min.js',
  'data/courses.json',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(
    caches.open(CACHE).then(async cache => {
      const cached = await cache.match(e.request);
      const network = fetch(e.request)
        .then(res => {
          if (res.ok) cache.put(e.request, res.clone());
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
