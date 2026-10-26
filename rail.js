/* বই জংশন — পাতার ওপরে রেললাইন: স্ক্রল করলে ছোট্ট ট্রেন এগোয়, প্রতিটি অংশ একেকটি স্টেশন */
(function () {
  const header = document.getElementById("site-header");
  if (!header) return;
  const STOPS = [
    ["home", "বই জংশন"], ["books", "বইসমূহ"], ["how-to-order", "কীভাবে অর্ডার"],
    ["dakpiyon", "ডাকপিয়ন"], ["author", "লেখক"], ["contact", "যোগাযোগ"]
  ].filter((s) => document.getElementById(s[0]));
  if (STOPS.length < 3) return;
  const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  const rail = document.createElement("div");
  rail.className = "bj-rail"; rail.setAttribute("role", "navigation"); rail.setAttribute("aria-label", "পাতার স্টেশন");
  rail.innerHTML =
    `<div class="rl-track" aria-hidden="true"></div><div class="rl-done" id="rl-done" aria-hidden="true"></div>` +
    STOPS.map((s) => `<a class="rl-stop" href="#${s[0]}" data-id="${s[0]}" aria-label="${s[1]} স্টেশনে যান"><i></i></a>`).join("") +
    `<svg class="rl-train" id="rl-train" viewBox="0 0 44 18" aria-hidden="true"><rect x="1" y="5" width="12" height="9" rx="1.5"/><rect x="15" y="5" width="12" height="9" rx="1.5"/><path d="M29 5h8l5 5v4H29z"/><rect x="3" y="7" width="3" height="3" class="w"/><rect x="8" y="7" width="3" height="3" class="w"/><rect x="17" y="7" width="3" height="3" class="w"/><rect x="22" y="7" width="3" height="3" class="w"/><rect x="33" y="7" width="3" height="3" class="w"/><circle cx="7" cy="15.5" r="2"/><circle cx="21" cy="15.5" r="2"/><circle cx="33" cy="15.5" r="2"/><circle cx="39" cy="15.5" r="2"/></svg>` +
    `<span class="rl-name" id="rl-name" aria-live="off"></span>`;
  document.body.appendChild(rail);
  const train = rail.querySelector("#rl-train"), done = rail.querySelector("#rl-done"), nameEl = rail.querySelector("#rl-name");
  const stopEls = Array.from(rail.querySelectorAll(".rl-stop"));
  const TW = 56;
  let tops = [], max = 1, W = 0;

  function measure() {
    W = rail.clientWidth;
    max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    tops = STOPS.map((s) => {
      const el = document.getElementById(s[0]);
      return Math.max(0, Math.min(max, el.getBoundingClientRect().top + scrollY - header.offsetHeight));
    });
    stopEls.forEach((a, i) => { a.style.left = 12 + (W - 24) * (tops[i] / max) + "px"; });
  }
  let cur = -1;
  function update() {
    rail.style.top = header.offsetHeight + "px";
    const p = Math.max(0, Math.min(1, scrollY / max));
    const x = 12 + (W - 24) * p;
    train.style.transform = `translateX(${(x - TW / 2).toFixed(1)}px)`;
    done.style.width = x + "px";
    let idx = 0;
    for (let i = 0; i < tops.length; i++) if (scrollY >= tops[i] - 40) idx = i;
    if (idx !== cur) {
      cur = idx;
      stopEls.forEach((a, i) => { a.classList.toggle("is-past", i <= idx); a.classList.toggle("is-here", i === idx); });
      nameEl.textContent = STOPS[idx][1] + " স্টেশন";
      nameEl.classList.remove("is-pop"); void nameEl.offsetWidth; nameEl.classList.add("is-pop");
    }
    document.body.classList.toggle("rail-hide", document.body.classList.contains("no-scroll"));
  }
  let raf = 0;
  const on = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; update(); }); };
  addEventListener("scroll", on, { passive: true });
  addEventListener("resize", () => { measure(); on(); });
  addEventListener("load", () => { measure(); update(); });
  // ছবি লোড হয়ে পাতা লম্বা হলে মাপ আবার ঠিক করা
  [600, 1500, 3500, 8000].forEach((ms) => setTimeout(() => { measure(); update(); }, ms));
  measure(); update();
})();
