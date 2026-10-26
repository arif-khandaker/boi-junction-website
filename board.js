/* বই জংশন — "এখন ছাড়ছে" ডিপার্চার বোর্ড: স্টেশনের বোর্ডের মতো একেকটি সারি উল্টে নতুন বইয়ে বদলায় */
(function () {
  const root = document.getElementById("bj-dep");
  if (!root || typeof BOOKS === "undefined") return;
  const BN = "০১২৩৪৫৬৭৮৯";
  const bn = (s) => String(s).replace(/\d/g, (d) => BN[d]);
  const list = BOOKS.filter((b) => b.slug && b.title && parseInt(String(b.price).replace(/[০-৯]/g, (d) => BN.indexOf(d)).replace(/\D/g, ""), 10) > 0);
  if (list.length < 6) return;
  const genres = [];
  list.forEach((b) => { if (genres.indexOf(b.genre) < 0) genres.push(b.genre); });
  const plat = (b) => genres.indexOf(b.genre) + 1;
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  // দিনের তারিখ থেকে ঠিক করা এলোমেলো ক্রম, যাতে প্রতিদিন নতুন বই দিয়ে শুরু হয়
  let seed = Math.floor(Date.now() / 86400000) + 7;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
  const order = list.slice().sort(() => rnd() - 0.5);
  const ROWS = 5;
  let next = 0;
  const take = () => order[next++ % order.length];

  const rowHtml = (b) =>
    `<div class="dep-row" data-slug="${esc(b.slug)}"><div class="dep-flap"><a class="dep-to" href="/b/${esc(b.slug)}/">${esc(b.title)}</a><span class="dep-pl"><i>${bn(plat(b))}</i> ${esc(b.genre)}</span><span class="dep-fare">${esc(bn(b.price).replace(" টাকা", ""))}<small>৳</small></span><button type="button" class="dep-buy" data-cart-add="${esc(b.slug)}" aria-label="${esc(b.title)} কার্টে নিন">+ কার্ট</button></div></div>`;

  root.innerHTML =
    `<div class="dep-head"><span class="dep-title"><b class="dep-lamp" aria-hidden="true"></b>এখন ছাড়ছে</span><span class="dep-clock" id="dep-clock" aria-hidden="true"></span></div>` +
    `<div class="dep-cols" aria-hidden="true"><span>গন্তব্য</span><span>প্ল্যাটফর্ম</span><span>ভাড়া</span></div>` +
    `<div class="dep-rows" id="dep-rows">${Array.from({ length: ROWS }, () => rowHtml(take())).join("")}</div>` +
    `<a class="dep-all" href="#books">সব বই দেখুন</a>`;
  root.hidden = false;

  // ঢাকার সময়
  const clock = document.getElementById("dep-clock");
  const tick = () => {
    try {
      clock.textContent = bn(new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Dhaka" }).format(new Date()));
    } catch (e) { clock.textContent = ""; }
  };
  tick(); setInterval(tick, 20000);

  const rows = root.querySelector("#dep-rows");
  let turn = 0, hover = false;
  rows.addEventListener("mouseenter", () => (hover = true));
  rows.addEventListener("mouseleave", () => (hover = false));
  rows.addEventListener("focusin", () => (hover = true));
  rows.addEventListener("focusout", () => (hover = false));
  const swap = () => {
    if (hover || document.hidden) return;
    const row = rows.children[turn++ % ROWS];
    const shown = Array.from(rows.children).map((r) => r.dataset.slug);
    let b = take(); let guard = 0;
    while (shown.indexOf(b.slug) >= 0 && guard++ < 20) b = take();
    const flap = row.firstElementChild;
    if (reduce) { row.outerHTML = rowHtml(b); return; }
    flap.classList.add("is-out");
    setTimeout(() => {
      const tmp = document.createElement("div"); tmp.innerHTML = rowHtml(b);
      const nr = tmp.firstElementChild; nr.firstElementChild.classList.add("is-in");
      row.replaceWith(nr);
      requestAnimationFrame(() => requestAnimationFrame(() => nr.firstElementChild.classList.remove("is-in")));
    }, 260);
  };
  setInterval(swap, 3200);
})();
