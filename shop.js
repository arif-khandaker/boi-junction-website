/* বই জংশন — শপ থিমের ছোট স্ক্রিপ্ট: হেডার সার্চ, কার্ট সংখ্যা, নিচের ট্যাব */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };

  /* হেডার সার্চ → বইয়ের সার্চ বক্সে পাঠায় */
  var form = $("#rk-search");
  var box = $("#rk-q");
  if (form && box) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var target = $("#book-search");
      if (target) {
        target.value = box.value;
        target.dispatchEvent(new Event("input", { bubbles: true }));
      }
      var sec = $("#books");
      if (sec) sec.scrollIntoView({ behavior: "smooth", block: "start" });
      box.blur();
    });
  }

  /* কার্টের সংখ্যা হেডার ও ট্যাবে মিরর */
  var hdr = $("#rk-cart-count"), tab = $("#rk-tab-count");
  function sync() {
    var src = $(".cart-fab-count");
    var n = src ? (src.textContent || "").trim() : "";
    var show = n && n !== "0" && n !== "০";
    [hdr, tab].forEach(function (el) {
      if (!el) return;
      var t = show ? n : "";
      if (el.textContent !== t) el.textContent = t;
      if (el.hidden === !!show) el.hidden = !show;
    });
  }
  sync();
  var mo = new MutationObserver(sync);
  var fabWatch = function () {
    var f = $(".cart-fab");
    if (f) { mo.observe(f, { childList: true, subtree: true, characterData: true }); return true; }
    return false;
  };
  if (!fabWatch()) {
    var boot = new MutationObserver(function () { if (fabWatch()) { boot.disconnect(); sync(); } });
    boot.observe(document.body, { childList: true });
  }

  /* স্ক্রল করলে সক্রিয় ট্যাব চিহ্নিত */
  var tabs = Array.prototype.slice.call(document.querySelectorAll(".rk-tabbar a[href^='#']"));
  var map = tabs.map(function (a) { return { a: a, s: $(a.getAttribute("href")) }; }).filter(function (x) { return x.s; });
  function onScroll() {
    var y = window.scrollY + 140, cur = null;
    map.forEach(function (x) { if (x.s.offsetTop <= y) cur = x; });
    tabs.forEach(function (a) { a.classList.remove("is-on"); });
    if (cur) cur.a.classList.add("is-on");
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* স্লাইডার: নিজে নিজে চলে */
  var sl = $("#rk-slider");
  if (sl) {
    var track = $(".rk-track", sl), slides = sl.querySelectorAll(".rk-slide"), dots = $(".rk-dots", sl), idx = 0, timer = null, DELAY = 3000;
    var dotEls = [];
    for (var i = 0; i < slides.length; i++) {
      (function (n) {
        var d = document.createElement("button");
        d.type = "button"; d.setAttribute("role", "tab"); d.setAttribute("aria-label", "স্লাইড " + (n + 1));
        d.addEventListener("click", function () { go(n); start(); });
        dots.appendChild(d); dotEls.push(d);
      })(i);
    }
    function go(n) {
      idx = (n + slides.length) % slides.length;
      track.style.transform = "translateX(" + (-100 * idx) + "%)";
      dotEls.forEach(function (d, k) { d.setAttribute("aria-selected", k === idx ? "true" : "false"); });
    }
    function start() { stop(); if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) timer = setInterval(function () { go(idx + 1); }, DELAY); }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    sl.addEventListener("mouseenter", stop); sl.addEventListener("mouseleave", start);
    var x0 = null;
    sl.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; stop(); }, { passive: true });
    sl.addEventListener("touchend", function (e) {
      if (x0 !== null) { var dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) go(idx + (dx < 0 ? 1 : -1)); }
      x0 = null; start();
    });
    document.addEventListener("visibilitychange", function () { document.hidden ? stop() : start(); });
    go(0); start();
  }
})();
