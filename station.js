/* বই জংশন — (১) স্থির "প্ল্যাটফর্ম" সাইনবোর্ড: ধরন অনুযায়ী বই বাছাই  (২) "পরের ট্রেন": মেজাজ বেছে একটি বই */
(function () {
  const BN = "০১২৩৪৫৬৭৮৯";
  const bn = (s) => String(s).replace(/\d/g, (d) => BN[d]);
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const num = (p) => parseInt(String(p).replace(/[০-৯]/g, (d) => BN.indexOf(d)).replace(/\D/g, ""), 10) || 0;

  /* প্ল্যাটফর্ম নম্বর সবখানে (বোর্ড, টিকিট, সাইনবোর্ড) একই থাকবে */
  const PLAT = [
    { n: 1, label: "থ্রিলার উপন্যাস", chip: "থ্রিলার উপন্যাস", test: (g) => /থ্রিলার/.test(g) },
    { n: 2, label: "রোমান্টিক উপন্যাস", chip: "রোমান্টিক উপন্যাস", test: (g) => /রোমান্টিক/.test(g) },
    { n: 3, label: "কাব্যগ্রন্থ", chip: "কাব্যগ্রন্থ", test: (g) => /কাব্য|কবিতা/.test(g) },
    { n: 4, label: "সমকালীন উপন্যাস", chip: "সমকালীন উপন্যাস", test: (g) => g === "উপন্যাস" },
    { n: 5, label: "গল্পগ্রন্থ", chip: "গল্পগ্রন্থ", test: (g) => /গল্প/.test(g) },
    { n: 6, label: "সায়েন্স ফিকশন", chip: "সায়েন্স ফিকশন", test: (g) => /সায়েন্স ফিকশন/.test(g) },
  ];
  window.bjPlatform = function (genre) {
    const g = String(genre || "");
    const p = PLAT.find((x) => x.test(g));
    return p ? p.n : 0;
  };

  if (typeof BOOKS === "undefined") return;
  const buyable = BOOKS.filter((b) => b.slug && b.title && num(b.price) > 0);
  /* "পরের ট্রেন"-এ আপাতত শুধু এই ১১টি বই আসবে (তালিকা বদলাতে নিচের নামগুলো বদলান) */
  const NEXT_SLUGS = ["asman-jominer-upakhyan", "ekhane-tabij-bikri-hoy", "boro-bhai", "akulpathar", "rojonigandha-resort", "nira", "gulshan", "ajat", "unamanush", "bedona-ronger-bari", "ajmeri"];
  const nextPool = buyable.filter((b) => NEXT_SLUGS.indexOf(b.slug) >= 0);

  /* ---------- ১. প্ল্যাটফর্ম সাইনবোর্ড ---------- */
  const plat = document.getElementById("bj-plat");
  const chips = document.getElementById("book-chips");
  if (plat && chips) {
    const chipFor = (label) => Array.from(chips.querySelectorAll(".chip")).find((c) => c.textContent.replace(/[০-৯\s]+$/, "").trim() === label);
    const signs = PLAT.map((p) => {
      const cnt = BOOKS.filter((b) => p.test(String(b.genre || ""))).length;
      return cnt && chipFor(p.chip) ? { p, cnt } : null;
    }).filter(Boolean);
    if (signs.length) {
      plat.innerHTML =
        `<p class="pl-head"><span class="pl-lamp" aria-hidden="true"></span>আপনার প্ল্যাটফর্ম কোনটা?</p>` +
        `<div class="pl-row" role="group" aria-label="প্ল্যাটফর্ম অনুযায়ী বই">` +
        signs.map((s) => `<button type="button" class="pl-sign" data-pl="${s.p.n}" aria-pressed="false"><b>${bn(s.p.n)}</b><span>${esc(s.p.label)}</span><small>${bn(s.cnt)}টি বই</small></button>`).join("") +
        `</div>`;
      plat.hidden = false;
      const sync = () => {
        const on = chips.querySelector(".chip.is-on");
        const t = on ? on.textContent.replace(/[০-৯\s]+$/, "").trim() : "";
        plat.querySelectorAll(".pl-sign").forEach((b) => {
          const p = PLAT.find((x) => String(x.n) === b.dataset.pl);
          const act = p && p.chip === t;
          b.classList.toggle("is-on", !!act);
          b.setAttribute("aria-pressed", String(!!act));
        });
      };
      plat.addEventListener("click", (e) => {
        const b = e.target.closest(".pl-sign");
        if (!b) return;
        const p = PLAT.find((x) => String(x.n) === b.dataset.pl);
        const c = p && chipFor(p.chip);
        if (!c) return;
        const already = c.classList.contains("is-on");
        const all = chips.querySelector(".chip");
        (already && all ? all : c).click();
        sync();
        const tools = document.getElementById("book-tools");
        if (tools && !already) tools.scrollIntoView({ behavior: window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
      });
      chips.addEventListener("click", () => setTimeout(sync, 0));
      sync();
    }
  }

  /* ---------- ২. পরের ট্রেন (মেজাজ বেছে বই) ---------- */
  const mood = document.getElementById("bj-next");
  if (!mood) return;
  const MOODS = [
    { k: "fear", t: "ভয় ও রহস্য চাই", sub: "বুক ধুকপুক করা রাত", test: (g) => /থ্রিলার|হরর/.test(g) },
    { k: "love", t: "প্রেমে ডুবতে চাই", sub: "মন নরম করা গল্প", test: (g) => /রোমান্টিক/.test(g) },
    { k: "sad", t: "একা ও মন খারাপ", sub: "নীরবে পড়ার মতো", test: (g) => /কাব্য|কবিতা|গল্প/.test(g) || g === "উপন্যাস" },
    { k: "new", t: "অন্যরকম কিছু", sub: "চেনা ছকের বাইরে", test: (g) => /সায়েন্স ফিকশন|ঐতিহাসিক|সাইকোলজিক্যাল/.test(g) },
  ].map((m) => ({ ...m, pool: nextPool.filter((b) => m.test(String(b.genre || ""))) })).filter((m) => m.pool.length);
  if (!MOODS.length) return;
  mood.innerHTML =
    `<div class="md-panel"><div class="md-top"><span class="md-lamp" aria-hidden="true"></span><span>পরের ট্রেন কোন দিকে?</span></div>` +
    `<p class="md-sub">আজ মনের অবস্থা কেমন? একটা বেছে নিন, আমরা একটা বই বেছে দিই।</p>` +
    `<div class="md-opts" role="group" aria-label="মেজাজ">${MOODS.map((m) => `<button type="button" class="md-opt" data-md="${m.k}" aria-pressed="false"><b>${esc(m.t)}</b><small>${esc(m.sub)}</small></button>`).join("")}</div>` +
    `<div class="md-res" id="md-res" hidden aria-live="polite"></div></div>`;
  mood.hidden = false;
  const res = document.getElementById("md-res");
  const last = {};
  const pick = (m) => {
    let b = m.pool[Math.floor(Math.random() * m.pool.length)];
    let g = 0; while (m.pool.length > 1 && b.slug === last[m.k] && g++ < 12) b = m.pool[Math.floor(Math.random() * m.pool.length)];
    last[m.k] = b.slug; return b;
  };
  const show = (m) => {
    const b = pick(m);
    const pl = window.bjPlatform(b.genre);
    const cover = b.cover ? `<img src="${esc(b.cover)}" alt="${esc(b.title)} — প্রচ্ছদ" width="64" height="96" loading="lazy">` : "";
    res.hidden = false;
    res.classList.remove("is-in"); void res.offsetWidth; res.classList.add("is-in");
    res.innerHTML =
      `<p class="md-line">আপনার পরের ট্রেন${pl ? ` · প্ল্যাটফর্ম ${bn(pl)}` : ""}</p>` +
      `<div class="md-card"><a class="md-cover" href="/b/${esc(b.slug)}/">${cover}</a><div class="md-info"><a class="md-name" href="/b/${esc(b.slug)}/">${esc(b.title)}</a><p class="md-genre">${esc(b.genre || "")} · ${esc(bn(b.price))}</p>` +
      `<div class="md-act"><button type="button" class="btn btn-gold" data-cart-add="${esc(b.slug)}">+ কার্ট</button><a href="#" class="btn btn-outline-gold" data-wa="title" data-title="${esc(b.title)}">WhatsApp অর্ডার</a></div></div></div>` +
      `<div class="md-more">${m.pool.length > 1 ? `<button type="button" class="md-again" data-again="${m.k}">আরেকটা দেখি</button>` : ""}<button type="button" class="md-share" data-share="${esc(b.slug)}" data-t="${esc(b.title)}">বন্ধুকে পাঠান</button></div>`;
  };
  mood.addEventListener("click", (e) => {
    const o = e.target.closest(".md-opt");
    if (o) {
      mood.querySelectorAll(".md-opt").forEach((x) => { x.classList.toggle("is-on", x === o); x.setAttribute("aria-pressed", String(x === o)); });
      show(MOODS.find((m) => m.k === o.dataset.md));
      return;
    }
    const a = e.target.closest(".md-again");
    if (a) { show(MOODS.find((m) => m.k === a.dataset.again)); return; }
    const s = e.target.closest(".md-share");
    if (s) {
      const url = location.origin + "/b/" + s.dataset.share + "/";
      const text = `"${s.dataset.t}" — আরিফ খন্দকারের বই। বই জংশনে:`;
      if (navigator.share) { navigator.share({ title: s.dataset.t, text, url }).catch(() => {}); return; }
      const done = () => { s.textContent = "লিংক কপি হয়েছে ✓"; };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, done); else done();
    }
  });
})();
