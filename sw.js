// まいにち家計簿：オフラインで動かすためのキャッシュ。アプリを更新したら VERSION を上げる
const VERSION = 'v1.0.2';
const CACHE = 'mainichi-kakeibo-' + VERSION;
const CORE = ['./', './index.html', './guide.html', './manifest.webmanifest',
  './icons/favicon.svg', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png', './icons/maskable-512.png',
  './guide/setup.jpg', './guide/cal.jpg', './guide/sheet.jpg', './guide/accts.jpg', './guide/budget.jpg', './guide/cats.jpg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('mainichi-kakeibo-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('message', e => { if (e.data === 'skip') self.skipWaiting(); });
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // フォント：一度読み込んだら端末に保存
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open('mk-fonts').then(c => c.match(req).then(hit => hit || fetch(req).then(res => { c.put(req, res.clone()); return res; }).catch(() => hit))));
    return;
  }
  if (url.origin !== location.origin) return;
  // アプリ本体：保存済みのものをすぐ出す（オフラインでも動く）
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(res => {
    if (res.ok) caches.open(CACHE).then(c => c.put(req, res.clone()));
    return res;
  }).catch(() => req.mode === 'navigate' ? caches.match('./index.html') : undefined)));
});
