/* বই জংশন — সপ্তাহের বই, উপহার, বইয়ের পাসপোর্ট, পাঠকের পাতা */
(function () {
  if (typeof BOOKS === "undefined") return;
  const BN = "০১২৩৪৫৬৭৮৯";
  const bn = (s) => String(s).replace(/\d/g, (d) => BN[d]);
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const num = (p) => parseInt(String(p).replace(/[০-৯]/g, (d) => BN.indexOf(d)).replace(/\D/g, ""), 10) || 0;
  const bySlug = (sl) => BOOKS.find((b) => b.slug === sl);

  /* ---------- ১. এই সপ্তাহের বই (শনি–শুক্র; প্রতি সপ্তাহে পরের বই) ---------- */
  (function weekly() {
    const WEEK = ["boro-bhai", "akulpathar", "asman-jominer-upakhyan", "rojonigandha-resort", "ekhane-tabij-bikri-hoy", "ajmeri"];
    const pool = WEEK.map(bySlug).filter((b) => b && num(b.price) > 0);
    if (!pool.length) return;
    const DAY = 86400e3, OFF = 6 * 3600e3;               // ঢাকা = UTC+৬
    const wk = Math.floor((Date.now() + OFF - 2 * DAY) / (7 * DAY));   // ১৯৭০-০১-০৩ শনিবার
    const end = (wk + 1) * 7 * DAY + 2 * DAY - OFF;                    // শুক্র রাত ১২টা (ঢাকা)
    const b = pool[wk % pool.length];
    const hero = document.getElementById("home");
    if (!hero) return;
    const sec = document.createElement("section");
    sec.className = "bj-week"; sec.id = "week-book"; sec.setAttribute("aria-label", "এই সপ্তাহের বই");
    sec.innerHTML = `<div class="container"><div class="bw-card">` +
      (b.cover ? `<a class="bw-cover" href="/b/${esc(b.slug)}/"><img src="${esc(b.cover)}" alt="${esc(b.title)} — প্রচ্ছদ" width="96" height="144" loading="lazy"></a>` : "") +
      `<div class="bw-body"><p class="bw-k">এই সপ্তাহের বই <span class="bw-left" id="bw-left"></span></p>` +
      `<h2 class="bw-t"><a href="/b/${esc(b.slug)}/">${esc(b.title)}</a></h2><p class="bw-m">${esc(b.genre || "")} · ${esc(bn(b.price))}</p>` +
      `<div class="bw-act"><button type="button" class="btn btn-gold" data-cart-add="${esc(b.slug)}">+ কার্টে নিন</button><a class="btn btn-outline-gold" href="/b/${esc(b.slug)}/">বিস্তারিত</a></div></div></div></div>`;
    (document.querySelector(".bj-announce") || hero).after(sec);
    const left = sec.querySelector("#bw-left");
    const tick = () => {
      const ms = end - Date.now();
      if (ms <= 0) { left.textContent = ""; return; }
      const d = Math.floor(ms / DAY), h = Math.floor((ms % DAY) / 3600e3), m = Math.floor((ms % 3600e3) / 60e3);
      left.textContent = "· আর " + (d ? bn(d) + " দিন " : "") + bn(h) + " ঘণ্টা" + (d ? "" : " " + bn(m) + " মিনিট");
    };
    tick(); setInterval(tick, 30000);
  })();

  /* ---------- ২. উপহার ---------- */
  (function gift() {
    const btn = document.getElementById("gift-go");
    if (!btn) return;
    btn.addEventListener("click", () => {
      try { cartForm.gift = true; } catch (e) {}
      let n = 0; try { n = cartCount(); } catch (e) {}
      if (n > 0) { try { cartStep = "info"; openCart(); } catch (e) {} return; }
      const books = document.getElementById("books");
      if (books) books.scrollIntoView({ behavior: "smooth", block: "start" });
      try { toast("উপহারের বই কার্টে নিন। কার্টে উপহারের নাম আর কার্ডের বার্তা লেখার ঘর পাবেন"); } catch (e) {}
    });
  })();

  /* ---------- ৩. বইয়ের পাসপোর্ট ---------- */
  const PKEY = "bj-passport-v1";
  const load = () => { try { return JSON.parse(localStorage.getItem(PKEY)) || []; } catch (e) { return []; } };
  const save = (l) => { try { localStorage.setItem(PKEY, JSON.stringify(l)); } catch (e) {} };
  const LEVELS = [[10, "স্টেশন মাস্টার"], [5, "জংশন-বন্ধু"], [3, "নিয়মিত যাত্রী"], [1, "নতুন যাত্রী"]];
  function renderPass() {
    const grid = document.getElementById("pass-grid"), lv = document.getElementById("pass-level");
    if (!grid) return;
    const list = load();
    const lvl = LEVELS.find((l) => list.length >= l[0]);
    lv.textContent = list.length ? `${bn(list.length)}টি স্ট্যাম্প · ${lvl[1]}` : "এখনও কোনো স্ট্যাম্প পড়েনি। প্রথম বই অর্ডার করলেই প্রথম স্ট্যাম্প পড়বে।";
    const slots = Math.max(6, Math.ceil(list.length / 3) * 3);
    let h = "";
    for (let i = 0; i < slots; i++) {
      const e = list[i];
      h += e
        ? `<div class="ps ${i % 2 ? "ps-g" : "ps-r"}"><span class="ps-t">${esc(e.title)}</span><span class="ps-d">${esc(e.date)}</span></div>`
        : `<div class="ps ps-empty" aria-hidden="true"><span>${bn(i + 1)}</span></div>`;
    }
    grid.innerHTML = h;
  }
  window.bjPassportAdd = function (items) {
    const list = load();
    const date = new Intl.DateTimeFormat("bn-BD", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Dhaka" }).format(new Date());
    (items || []).forEach((it) => {
      if (!it || !it.title) return;
      if (!list.some((x) => x.title === it.title)) list.push({ title: it.title, date });
    });
    save(list.slice(0, 60)); renderPass();
  };
  renderPass();

  /* ---------- ৪. পাঠকের পাতা (readers.json-এ লিখলে দেখা যাবে) ---------- */
  (function readers() {
    const sec = document.getElementById("readers"), grid = document.getElementById("readers-grid");
    if (!sec || !grid || !window.fetch) return;
    fetch("/readers.json?v=" + Date.now()).then((r) => r.json()).then((list) => {
      if (!Array.isArray(list) || !list.length) return;
      grid.innerHTML = list.slice(0, 12).map((r) =>
        `<figure class="rd">${r.photo ? `<img src="${esc(r.photo)}" alt="${esc(r.name)}" loading="lazy" width="320" height="320">` : ""}<blockquote>${esc(r.text || "")}</blockquote><figcaption>${esc(r.name || "")}${r.book ? ` · <span>${esc(r.book)}</span>` : ""}</figcaption></figure>`).join("");
      sec.hidden = false;
    }).catch(() => {});
  })();
})();
