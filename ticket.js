/* বই জংশন — (১) বইয়ের কার্ড রেলের টিকিট, কার্টে নিলে "পাঞ্চ" (২) "ভাগ্যে ছেড়ে দিন" বই-বাছাই */
(function () {
  if (typeof BOOKS === "undefined") return;
  const BN = "০১২৩৪৫৬৭৮৯";
  const bn = (s) => String(s).replace(/\d/g, (d) => BN[d]);
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const num = (p) => parseInt(String(p).replace(/[০-৯]/g, (d) => BN.indexOf(d)).replace(/\D/g, ""), 10) || 0;
  const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const genres = [];
  BOOKS.forEach((b) => { if (b.genre && genres.indexOf(b.genre) < 0) genres.push(b.genre); });

  /* ---------- ১. টিকিট ---------- */
  const inCart = () => { try { return (JSON.parse(localStorage.getItem("ak-cart-v1")) || []).map((x) => x.slug); } catch (e) { return []; } };
  function ticketize() {
    const cart = inCart();
    document.querySelectorAll("#book-grid .book").forEach((card, n) => {
      if (card.dataset.tk) return;
      card.dataset.tk = "1";
      card.classList.add("tk");
      const cover = card.querySelector(".book-cover");
      const btn = card.querySelector("[data-cart-add]");
      const slug = btn ? btn.dataset.cartAdd : "";
      const b = BOOKS.find((x) => x.slug === slug);
      const pl = b ? genres.indexOf(b.genre) + 1 : 0;
      const head = document.createElement("div");
      head.className = "tk-head";
      head.innerHTML = `<span>টিকিট নং ${bn(String(n + 1).padStart(3, "0"))}</span><span>${pl ? "প্ল্যাটফর্ম " + bn(pl) : ""}</span>`;
      card.insertBefore(head, card.firstChild);
      const perf = document.createElement("div");
      perf.className = "tk-perf"; perf.setAttribute("aria-hidden", "true");
      if (cover) cover.after(perf);
      const stamp = document.createElement("span");
      stamp.className = "tk-stamp"; stamp.setAttribute("aria-hidden", "true"); stamp.textContent = "কার্টে ✓";
      card.appendChild(stamp);
      if (slug && cart.indexOf(slug) >= 0) card.classList.add("is-punched", "no-anim");
    });
  }
  document.addEventListener("click", (e) => {
    const add = e.target.closest("[data-cart-add]");
    if (!add) return;
    const card = add.closest(".tk");
    if (!card) return;
    card.classList.remove("no-anim");
    card.classList.remove("is-punched"); void card.offsetWidth; card.classList.add("is-punched");
  });
  ticketize();
  // বই পরে লোড হলে (যেমন ফিল্টার) নতুন কার্ডও টিকিট হবে
  const grid = document.getElementById("book-grid");
  if (grid && window.MutationObserver) new MutationObserver(ticketize).observe(grid, { childList: true });

  /* ---------- ২. ভাগ্যে ছেড়ে দিন ---------- */
  const box = document.getElementById("bj-pick");
  if (!box) return;
  const pool = BOOKS.filter((b) => b.slug && b.title && num(b.price) > 0);
  if (pool.length < 5) return;
  box.innerHTML =
    `<div class="pk-panel"><div class="pk-top"><span class="pk-lamp" aria-hidden="true"></span><span>আজকের টিকিট</span></div>` +
    `<div class="pk-win" id="pk-win" aria-live="polite"><span class="pk-ph">কোন বই পড়বেন ঠিক করতে পারছেন না?</span></div>` +
    `<div class="pk-res" id="pk-res" hidden></div>` +
    `<button type="button" class="btn btn-gold pk-go" id="pk-go">🎫 ভাগ্যে ছেড়ে দিন</button></div>`;
  const win = document.getElementById("pk-win"), res = document.getElementById("pk-res"), go = document.getElementById("pk-go");
  let busy = false, last = "";
  function show(b) {
    win.innerHTML = `<span class="pk-name">${esc(b.title)}</span>`;
  }
  function land(b) {
    last = b.slug;
    win.classList.add("is-landed");
    const cover = b.cover ? `<img src="${esc(b.cover)}" alt="" width="64" height="96">` : "";
    res.hidden = false;
    res.innerHTML = `<a class="pk-cover" href="/b/${esc(b.slug)}/">${cover}</a><div class="pk-info"><p class="pk-genre">${esc(b.genre || "")}</p><p class="pk-price">${esc(bn(b.price))}</p>` +
      `<div class="pk-act"><button type="button" class="btn btn-gold" data-cart-add="${esc(b.slug)}">+ কার্ট</button><a href="#" class="btn btn-outline-gold" data-wa="title" data-title="${esc(b.title)}">WhatsApp অর্ডার</a><a class="pk-more" href="/b/${esc(b.slug)}/">বিস্তারিত</a></div></div>`;
    go.textContent = "🎫 আরেকটা টিকিট";
    busy = false; go.disabled = false;
  }
  go.addEventListener("click", () => {
    if (busy) return;
    busy = true; go.disabled = true; res.hidden = true; win.classList.remove("is-landed");
    let target = pool[Math.floor(Math.random() * pool.length)];
    let g = 0; while (target.slug === last && g++ < 10) target = pool[Math.floor(Math.random() * pool.length)];
    if (reduce) { show(target); land(target); return; }
    let step = 0; const total = 22;
    const run = () => {
      if (step >= total) { show(target); win.classList.add("is-hit"); setTimeout(() => win.classList.remove("is-hit"), 400); land(target); return; }
      show(pool[Math.floor(Math.random() * pool.length)]);
      win.classList.remove("is-tick"); void win.offsetWidth; win.classList.add("is-tick");
      step++;
      setTimeout(run, 55 + Math.pow(step / total, 3) * 330);
    };
    run();
  });
})();
