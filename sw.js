/* সাদামাটা সার্ভিস ওয়ার্কার: সবসময় আগে ইন্টারনেট থেকে নতুন পাতা আনে।
   ইন্টারনেট না থাকলে শেষ দেখা পাতা দেখায়। অর্ডার, ফর্ম বা বাইরের সাইটের অনুরোধে হাত দেয় না। */
const CACHE = "bj-shell-v1";
self.addEventListener("install", (e) => { self.skipWaiting(); });
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req).then((res) => {
      if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req).then((r) => r || caches.match("/")))
  );
});
