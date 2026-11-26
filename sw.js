/* বই জংশন সার্ভিস ওয়ার্কার: পাতা/স্ক্রিপ্ট আগে ইন্টারনেট থেকে (সবসময় নতুন), প্রচ্ছদ ছবি আগে মেমরি থেকে (দ্রুত),
   ইন্টারনেট না থাকলে শেষ দেখা পাতা। অর্ডার, ফর্ম বা বাইরের সাইটের অনুরোধে হাত দেয় না। */
const CACHE = "bj-shell-v31";
const SHELL = ["/", "/shop.css", "/script.js", "/shop.js", "/favicon-32.png", "/icon-192.png"];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all(SHELL.map((u) => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  if (/\.(webp|jpg|png|woff2?)$/i.test(new URL(req.url).pathname)) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    })));
    return;
  }
  e.respondWith(
    fetch(req).then((res) => {
      if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req).then((r) => r || caches.match("/")))
  );
});
