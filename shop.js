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
})();
