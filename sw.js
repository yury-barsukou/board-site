/* Service worker: отдаёт расшифрованные страницы дашборда из Cache Storage по адресу <scope>app/...
   Сам файл публичный и не содержит данных. Страницы появляются в кэше только после ввода пароля. */
const PREFIX = 'meddash-';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  const scope = new URL(self.registration.scope);
  const base = scope.pathname + 'app/';
  if (url.origin !== location.origin || !url.pathname.startsWith(base)) return;   // всё остальное — обычная сеть
  e.respondWith((async () => {
    let path = url.pathname;
    if (path.endsWith('/')) path += 'index.html';
    for (const name of await caches.keys()) {                                     // кэш каждой версии: meddash-<хэш>
      if (!name.startsWith(PREFIX)) continue;
      const hit = await (await caches.open(name)).match(url.origin + path);       // строка запроса (?i=...) игнорируется
      if (hit) return hit;
    }
    // данных нет (не вводили пароль / вышли) — вернуть на страницу входа
    return e.request.mode === 'navigate' ? Response.redirect(scope.href, 302) : new Response('locked', { status: 404 });
  })());
});
