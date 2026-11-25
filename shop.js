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

  /* ---- অফার স্ট্রিপ (সেটের ছাড়) ---- */
  try {
    var off = $("#rk-offer");
    if (off && typeof SETS !== "undefined" && SETS.length) {
      var st = SETS[0], sum = setSum(st), save = sum - st.price;
      if (save > 0) {
        off.innerHTML = "<b>✦ " + st.title + "</b> — মাত্র <strong>" + taka(st.price) + "</strong> <s>" + taka(sum) + "</s> <em>" + taka(save) + " সাশ্রয়</em>";
        off.hidden = false;
      }
    }
  } catch (e) {}

  /* ---- ধরন অনুযায়ী সারি (রেইল) ---- */
  var rails = $("#rk-rails"), grid = $("#book-grid");
  if (rails && grid && grid.children.length) {
    var cards = Array.prototype.slice.call(grid.querySelectorAll(".book"));
    var groups = [
      { t: "নতুন বই", f: function (c) { return !!c.querySelector(".cover-badge"); } },
      { t: "থ্রিলার উপন্যাস", f: function (c) { return /থ্রিলার/.test(g(c)); } },
      { t: "রোমান্টিক উপন্যাস", f: function (c) { return /রোমান্টিক/.test(g(c)); } },
      { t: "কাব্যগ্রন্থ", f: function (c) { return /কাব্য|কবিতা/.test(g(c)); } },
      { t: "সমকালীন উপন্যাস", f: function (c) { return g(c).trim() === "উপন্যাস"; } },
      { t: "সায়েন্স ফিকশন", f: function (c) { return /সায়েন্স ফিকশন/.test(g(c)); } }
    ];
    function g(c) { var e = c.querySelector(".book-genre"); return e ? e.textContent : ""; }
    groups.forEach(function (gr) {
      var list = cards.filter(gr.f);
      if (!list.length) return;
      var sec = document.createElement("section");
      sec.className = "rk-rail";
      sec.innerHTML = '<div class="rk-rail-head"><h2></h2></div><div class="rk-rail-row"></div>';
      sec.querySelector("h2").textContent = gr.t;
      var row = sec.querySelector(".rk-rail-row");
      list.forEach(function (c) {
        var cl = c.cloneNode(true);
        cl.removeAttribute("id"); cl.classList.remove("reveal"); cl.classList.add("is-visible");
        Array.prototype.forEach.call(cl.querySelectorAll("[id]"), function (n) { n.removeAttribute("id"); });
        row.appendChild(cl);
      });
      rails.appendChild(sec);
    });
    var head = $("#rk-allhead"); if (head) head.hidden = false;
    /* খোঁজা বা ধরন বাছলে সারি লুকায়, নইলে দেখায় */
    var inp = $("#book-search"), chips = $("#book-chips");
    function sync2() {
      var pc = $("#price-chips .chip.is-on");
      var filtered = (inp && inp.value.trim() !== "") || (pc && pc.getAttribute("data-price") !== "0") || (chips && chips.querySelector(".chip.is-on") && chips.querySelector(".chip.is-on").getAttribute("data-chip") !== "0");
      rails.hidden = !!filtered;
      if (head) head.hidden = !!filtered;
    }
    if (inp) inp.addEventListener("input", sync2);
    if (chips) chips.addEventListener("click", function () { setTimeout(sync2, 0); });
    var pcs = $("#price-chips"); if (pcs) pcs.addEventListener("click", function () { setTimeout(sync2, 0); });
  }

  /* ---- হেডার সার্চের সাজেশন ---- */
  try {
    var qbox = $("#rk-q"), sug = $("#rk-suggest");
    if (qbox && sug && grid) {
      var F = function (t) { return (window.bjFold ? window.bjFold(t) : String(t).toLowerCase()); };
      var titles = Array.prototype.map.call(grid.querySelectorAll(".book"), function (c) {
        var t = c.querySelector(".book-title"), l = c.querySelector(".book-title-link");
        return t ? { n: t.textContent.trim(), f: F(t.textContent.trim()), h: l ? l.getAttribute("href") : "#books" } : null;
      }).filter(Boolean);
      qbox.addEventListener("input", function () {
        var v = F(qbox.value.trim());
        sug.innerHTML = "";
        if (!v) { sug.hidden = true; return; }
        var m = titles.filter(function (x) { return x.f.indexOf(v) > -1; }).slice(0, 6);
        m.forEach(function (x) { var li = document.createElement("li"), a = document.createElement("a"); a.href = x.h; a.textContent = x.n; li.appendChild(a); sug.appendChild(li); });
        sug.hidden = !m.length;
      });
      document.addEventListener("click", function (e) { if (!e.target.closest(".rk-search")) sug.hidden = true; });
    }
  } catch (e) {}

  /* ---- দাম অনুযায়ী সাজানো ---- */
  try {
    var sel = $("#rk-sort");
    if (sel && grid) {
      var orig = Array.prototype.slice.call(grid.children);
      var bn = "০১২৩৪৫৬৭৮৯";
      var num = function (c) { var p = c.querySelector(".price"); var s = (p ? p.textContent : "").replace(/[০-৯]/g, function (d) { return bn.indexOf(d); }).replace(/[^0-9]/g, ""); return parseInt(s || "0", 10); };
      sel.addEventListener("change", function () {
        var arr = orig.slice();
        if (sel.value === "asc") arr.sort(function (a, b) { return num(a) - num(b); });
        if (sel.value === "desc") arr.sort(function (a, b) { return num(b) - num(a); });
        arr.forEach(function (c) { grid.appendChild(c); });
      });
    }
  } catch (e) {}

  /* ---- কার্ডে রিভিউ-তারা (Firebase থেকে, ধীরে ও চুপচাপ) ---- */
  function stars() {
    var cfg = window.AK_FIREBASE;
    if (!cfg) return;
    var B = "https://www.gstatic.com/firebasejs/10.12.2/";
    Promise.all([import(B + "firebase-app.js"), import(B + "firebase-firestore.js")]).then(function (m) {
      var a = m[0].initializeApp(cfg, "stars"), fs = m[1], db = fs.getFirestore(a);
      return fs.getDocs(fs.query(fs.collection(db, "reviews"), fs.where("status", "==", "approved"), fs.limit(1000)));
    }).then(function (snap) {
      var agg = {};
      snap.docs.forEach(function (d) {
        var x = d.data();
        if (x.kind === "author" || !(x.rating > 0) || !x.slug) return;
        var o = agg[x.slug] || (agg[x.slug] = { s: 0, n: 0 });
        o.s += x.rating; o.n++;
      });
      var toBn = function (v) { return String(v).replace(/\d/g, function (d) { return "০১২৩৪৫৬৭৮৯".charAt(d); }); };
      Array.prototype.forEach.call(document.querySelectorAll(".book"), function (c) {
        var l = c.querySelector(".book-title-link"); if (!l || c.querySelector(".rk-stars")) return;
        var m = /\/b\/([^/]+)\//.exec(l.getAttribute("href") || ""), o = m && agg[m[1]];
        if (!o) return;
        var p = document.createElement("p");
        p.className = "rk-stars";
        p.innerHTML = "<b>★</b> " + toBn((Math.round(o.s / o.n * 10) / 10).toFixed(1)) + " <span>(" + toBn(o.n) + ")</span>";
        var t = c.querySelector(".book-title"); if (t) t.insertAdjacentElement("afterend", p);
      });
    }).catch(function () {});
  }
  (window.requestIdleCallback || function (f) { setTimeout(f, 1500); })(stars);

  /* ---- পছন্দের তালিকা (উইশলিস্ট): ফোনেই জমা থাকে ---- */
  try {
    var KEY = "bj-wish", wish = [];
    try { wish = JSON.parse(localStorage.getItem(KEY) || "[]"); if (!Array.isArray(wish)) wish = []; } catch (e) { wish = []; }
    var save = function () { try { localStorage.setItem(KEY, JSON.stringify(wish)); } catch (e) {} };
    var bnum = function (v) { return String(v).replace(/\d/g, function (d) { return "০১২৩৪৫৬৭৮৯".charAt(d); }); };
    var slugOf = function (c) { var l = c.querySelector(".book-title-link"), m = l && /\/b\/([^/]+)\//.exec(l.getAttribute("href") || ""); return m ? m[1] : ""; };
    var HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2z"/></svg>';
    var addHearts = function () {
      Array.prototype.forEach.call(document.querySelectorAll("#book-grid .book, .rk-rail-row .book"), function (c) {
        if (c.querySelector(".rk-heart")) return;
        var sl = slugOf(c); if (!sl) return;
        var b = document.createElement("button");
        b.type = "button"; b.className = "rk-heart"; b.setAttribute("data-wish", sl);
        b.setAttribute("aria-label", "পছন্দের তালিকায় রাখুন"); b.innerHTML = HEART;
        c.appendChild(b);
      });
    };
    var mark = function () {
      Array.prototype.forEach.call(document.querySelectorAll(".rk-heart"), function (b) {
        var on = wish.indexOf(b.getAttribute("data-wish")) > -1;
        b.classList.toggle("is-on", on); b.setAttribute("aria-pressed", on ? "true" : "false");
      });
      var n = wish.length;
      Array.prototype.forEach.call(document.querySelectorAll("[data-wish-count]"), function (e) { e.textContent = n ? bnum(n) : ""; e.hidden = !n; });
    };
    var sheet = document.createElement("div");
    sheet.id = "rk-wish"; sheet.hidden = true;
    sheet.innerHTML = '<div class="wish-back" data-wclose></div><div class="wish-box" role="dialog" aria-label="পছন্দের তালিকা"><div class="wish-head"><b>♥ পছন্দের তালিকা</b><button type="button" data-wclose aria-label="বন্ধ করুন">✕</button></div><div class="wish-list"></div></div>';
    document.body.appendChild(sheet);
    var openSheet = function () {
      var list = $(".wish-list", sheet);
      list.innerHTML = "";
      wish.forEach(function (sl) {
        var b = bookBySlug(sl); if (!b) return;
        var r = document.createElement("div"); r.className = "wish-row";
        r.innerHTML = (b.cover ? '<img src="' + b.cover + '" alt="" width="48" height="72">' : "<span></span>") +
          '<div><a href="/b/' + sl + '/"><b></b></a><small></small></div>' +
          (b.out ? '<span class="wish-out">স্টক আউট</span>' : '<button type="button" class="btn btn-gold" data-cart-add="' + sl + '">কার্টে নিন</button>') +
          '<button type="button" class="wish-rm" data-wish="' + sl + '" aria-label="বাদ দিন">✕</button>';
        r.querySelector("b").textContent = b.title; r.querySelector("small").textContent = b.price || "";
        list.appendChild(r);
      });
      if (!list.children.length) list.innerHTML = '<p class="wish-empty">এখনো কিছু রাখেননি। বইয়ের কোণার ♡ চাপলে এখানে জমবে।</p>';
      sheet.hidden = false;
    };
    var cartBtn = $(".rk-cart");
    if (cartBtn && !$(".rk-acts")) {
      var acts = document.createElement("div"); acts.className = "rk-acts";
      cartBtn.parentNode.insertBefore(acts, cartBtn);
      var hb = document.createElement("button");
      hb.type = "button"; hb.className = "rk-cart rk-wishbtn"; hb.setAttribute("aria-label", "পছন্দের তালিকা");
      hb.innerHTML = HEART + '<span class="rk-cart-count" data-wish-count hidden></span>';
      hb.addEventListener("click", openSheet);
      acts.appendChild(hb); acts.appendChild(cartBtn);
    }
    document.addEventListener("click", function (e) {
      var h = e.target.closest("[data-wish]");
      if (h) {
        e.preventDefault(); e.stopPropagation();
        var sl = h.getAttribute("data-wish"), i = wish.indexOf(sl);
        if (i > -1) wish.splice(i, 1); else wish.unshift(sl);
        save(); mark();
        if (!sheet.hidden && h.classList.contains("wish-rm")) openSheet();
        return;
      }
      if (e.target.closest("[data-wclose]")) { sheet.hidden = true; return; }
      if (e.target.closest("#rk-wish [data-cart-add]")) setTimeout(function () { sheet.hidden = true; }, 50);
    }, true);
    addHearts(); mark();
  } catch (e) { window.__wishErr = e; }
})();
