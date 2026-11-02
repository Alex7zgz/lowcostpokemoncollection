// Service worker de "Mi colección de cartas Pokémon": permite abrir la web sin conexión.
// Súbelo a GitHub junto a index.html (misma carpeta). Para forzar una limpieza total, cambia el número de la versión.
const VERSION = "v1", C = "pokecards-" + VERSION;
const CORE = ["./", "index.html", "manifest.json", "apple-touch-icon.png", "icon-192.png", "icon-512.png"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(C).then(c => Promise.all(CORE.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET") return;
  const u = new URL(r.url);
  // Archivos propios (la página, iconos…): primero la red, para que las actualizaciones lleguen; si no hay conexión, la copia guardada.
  if (u.origin === location.origin) {
    e.respondWith(
      fetch(r).then(res => {
        if (res.ok) { const cp = res.clone(); caches.open(C).then(c => c.put(r, cp)); }
        return res;
      }).catch(() => caches.match(r).then(m => m || caches.match("index.html")))
    );
    return;
  }
  // Librería del Excel e imágenes externas: primero la copia guardada, y si no existe, la red.
  if (u.hostname === "cdnjs.cloudflare.com" || /\.(png|jpe?g|webp|gif)$/i.test(u.pathname)) {
    e.respondWith(
      caches.match(r).then(m => m || fetch(r).then(res => {
        const cp = res.clone(); caches.open(C).then(c => c.put(r, cp)).catch(() => {});
        return res;
      }).catch(() => m))
    );
  }
});
