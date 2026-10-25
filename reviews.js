/* =========================================================
   বইয়ের রেটিং ও রিভিউ + "একসাথে কিনুন" বাক্স (বইয়ের পাতায় চলে)
   - পাঠক Google বা ইমেইল-লিংকে লগইন করে রিভিউ দেন; আপনি অনুমোদন দিলে তবেই প্রকাশ হয়।
   - আপনার নিজের লেখা "লেখকের কথা" আলাদা ব্যাজে দেখায়, পাঠকের রেটিংয়ের হিসাবে ঢোকে না।
   - ডেটা থাকে Firebase-এ (firebase-config.js ভরলে চালু হয়)।
   ========================================================= */
(function () {
  "use strict";
  var BN = "০১২৩৪৫৬৭৮৯";
  var toBn = function (n) { return String(n).replace(/\d/g, function (d) { return BN[d]; }); };
  var MONTHS = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
  var esc = function (t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var fmtDate = function (ms) { var d = new Date(ms); return toBn(d.getDate()) + " " + MONTHS[d.getMonth()] + " " + toBn(d.getFullYear()); };
  var LABELS = ["", "খুবই খারাপ", "ভালো নয়", "মোটামুটি", "ভালো", "অসাধারণ!"];
  var CART_KEY = "ak-cart-v1";

  /* ---------- একসাথে কিনুন বাক্স (রিভিউ ব্যবস্থা ছাড়াই চলে) ---------- */
  function addToCart(slugs) {
    var c = [];
    try { c = JSON.parse(localStorage.getItem(CART_KEY) || "[]"); if (!Array.isArray(c)) c = []; } catch (e) { c = []; }
    slugs.forEach(function (s) { if (!c.some(function (x) { return x && x.slug === s; })) c.push({ slug: s, qty: 1 }); });
    try { localStorage.setItem(CART_KEY, JSON.stringify(c)); } catch (e) {}
    location.href = "/?cart=1";
  }
  function initBundle() {
    var box = $("#bd-box");
    if (box) {
      var rows = [].slice.call(box.querySelectorAll("input[data-slug]"));
      var sum = $("#bd-sum"), btn = $("#bd-add");
      var recalc = function () {
        var on = rows.filter(function (r) { return r.checked; });
        var total = on.reduce(function (n, r) { return n + (+r.dataset.price || 0); }, 0);
        sum.textContent = toBn(total.toLocaleString("en-US")) + " টাকা";
        btn.disabled = on.length === 0;
        btn.textContent = on.length > 1 ? "এই " + toBn(on.length) + "টি বই কার্টে নিন" : "বইটি কার্টে নিন";
      };
      rows.forEach(function (r) { r.addEventListener("change", recalc); });
      btn.addEventListener("click", function () {
        addToCart(rows.filter(function (r) { return r.checked; }).map(function (r) { return r.dataset.slug; }));
      });
      recalc();
    }
    [].forEach.call(document.querySelectorAll("[data-set-add]"), function (b) {
      b.addEventListener("click", function () { addToCart(b.dataset.setAdd.split(",")); });
    });
  }
  initBundle();

  /* ---------- রিভিউ ---------- */
  var root = $("#rv-app");
  if (!root) return;
  var admin = root.dataset.mode === "admin";
  var slug = root.dataset.slug || "";
  var bookTitle = root.dataset.title || "";
  var be = null;
  var S = { user: null, isAdmin: false, list: [], mine: null, filter: 0, more: false, sort: "new", form: false, rating: 0, loaded: false, error: "", msg: "", linkSent: "", needEmail: false, busy: false, pend: [] };

  function stars(r, cls) {
    return '<span class="rv-st ' + (cls || "") + '" style="--p:' + Math.max(0, Math.min(100, (r / 5) * 100)) + '%" aria-label="৫-এর মধ্যে ' + toBn(Math.round(r * 10) / 10) + '">★★★★★</span>';
  }
  function stats() {
    var rs = S.list.filter(function (x) { return x.kind !== "author" && x.rating > 0; });
    var dist = [0, 0, 0, 0, 0, 0];
    rs.forEach(function (x) { dist[x.rating]++; });
    var n = rs.length, avg = n ? rs.reduce(function (a, x) { return a + x.rating; }, 0) / n : 0;
    return { n: n, avg: avg, dist: dist, rs: rs };
  }

  async function makeBackend() {
    if (window.__AK_MOCK) return window.__AK_MOCK;
    var cfg = window.AK_FIREBASE;
    if (!cfg) return null;
    var B = "https://www.gstatic.com/firebasejs/10.12.2/";
    var m = await Promise.all([import(B + "firebase-app.js"), import(B + "firebase-auth.js"), import(B + "firebase-firestore.js")]);
    var app = m[0], auth = m[1], fs = m[2];
    var a = app.initializeApp(cfg), au = auth.getAuth(a), db = fs.getFirestore(a);
    var ser = function (d) { var x = d.data(); x.id = d.id; x.createdAt = x.createdAt && x.createdAt.toMillis ? x.createdAt.toMillis() : Date.now(); return x; };
    return {
      onAuth: function (cb) { auth.onAuthStateChanged(au, function (u) { cb(u ? { uid: u.uid, name: u.displayName || "", email: u.email || "" } : null); }); },
      google: function () { return auth.signInWithPopup(au, new auth.GoogleAuthProvider()); },
      sendLink: function (email) { return auth.sendSignInLinkToEmail(au, email, { url: location.origin + location.pathname + "?rvlogin=1#reviews", handleCodeInApp: true }); },
      isLink: function () { return auth.isSignInWithEmailLink(au, location.href); },
      finishLink: function (email) { return auth.signInWithEmailLink(au, email, location.href); },
      signOut: function () { return auth.signOut(au); },
      list: async function (s) { var q = fs.query(fs.collection(db, "reviews"), fs.where("slug", "==", s), fs.where("status", "==", "approved"), fs.limit(200)); return (await fs.getDocs(q)).docs.map(ser); },
      mine: async function (s, uid) { var d = await fs.getDoc(fs.doc(db, "reviews", s + "_" + uid)); return d.exists() ? ser(d) : null; },
      submit: function (s, uid, v) { return fs.setDoc(fs.doc(db, "reviews", s + "_" + uid), { slug: s, uid: uid, name: v.name, rating: v.rating, text: v.text, kind: "reader", status: "pending", createdAt: fs.serverTimestamp() }); },
      isAdmin: async function (uid) { try { return (await fs.getDoc(fs.doc(db, "admins", uid))).exists(); } catch (e) { return false; } },
      pending: async function (s) { var c = [fs.collection(db, "reviews"), fs.where("status", "==", "pending")]; if (s) c.push(fs.where("slug", "==", s)); c.push(fs.limit(100)); return (await fs.getDocs(fs.query.apply(null, c))).docs.map(ser); },
      setStatus: function (id, st) { return fs.updateDoc(fs.doc(db, "reviews", id), { status: st }); },
      remove: function (id) { return fs.deleteDoc(fs.doc(db, "reviews", id)); },
      authorNote: function (s, uid, text) { return fs.setDoc(fs.doc(db, "reviews", "author_" + s + "_" + Date.now()), { slug: s, uid: uid, name: "আরিফ খন্দকার", rating: 0, text: text, kind: "author", status: "approved", createdAt: fs.serverTimestamp() }); }
    };
  }

  /* ---------- দেখানো ---------- */
  function summaryHtml(st) {
    if (!st.n) {
      return '<div class="rv-empty"><div class="rv-empty-ico">✍️</div><h3>এখনো কেউ রিভিউ দেননি</h3><p>বইটি পড়ে থাকলে প্রথম রিভিউটি আপনিই লিখুন। আপনার দুটো কথা অন্য পাঠকের বই বাছাইয়ে কাজে লাগবে।</p></div>';
    }
    var bars = [5, 4, 3, 2, 1].map(function (k) {
      var pct = Math.round((st.dist[k] / st.n) * 100);
      return '<button type="button" class="rv-bar' + (S.filter === k ? " on" : "") + '" data-filter="' + k + '" aria-label="' + toBn(k) + ' তারার রিভিউ দেখুন"><span>' + toBn(k) + ' ★</span><i><b style="width:' + pct + '%"></b></i><em>' + toBn(st.dist[k]) + "</em></button>";
    }).join("");
    return '<div class="rv-sum"><div class="rv-avg"><strong>' + toBn(st.avg.toFixed(1)) + "</strong><span>/ ৫</span>" + stars(st.avg, "big") + "<small>" + toBn(st.n) + "টি রিভিউ</small></div><div class=\"rv-bars\">" + bars + "</div></div>";
  }
  function shareHtml(x) { return x.id ? '<div class="rv-sh-row"><button type="button" class="rv-sh" data-sh="' + esc(x.id) + '">↗ শেয়ার করুন</button></div>' : ""; }
  function shareReview(id) {
    var x = S.list.filter(function (r) { return r.id === id; })[0]; if (!x) return;
    var title = root.dataset.title || document.title, url = location.origin + location.pathname + "#reviews";
    var t = String(x.text || "").replace(/\s+/g, " ").trim(); if (t.length > 220) t = t.slice(0, 217).replace(/\s+\S*$/, "") + "…";
    var text = x.kind === "author" ? "“" + t + "” — লেখকের কথা, " + title : "“" + t + "” — " + x.name + ", " + title + " বইয়ের পাঠক-রিভিউ";
    if (navigator.share) { navigator.share({ title: title, text: text, url: url }).catch(function () {}); return; }
    window.open("https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(url) + "&quote=" + encodeURIComponent(text), "_blank", "noopener");
  }
  function textHtml(x) {
    var long = String(x.text || "").length > 380;
    return '<p class="rv-text' + (long ? " rv-clamp" : "") + '">' + esc(x.text).replace(/\n/g, "<br>") + "</p>" + (long ? '<button type="button" class="rv-rm">আরও পড়ুন ▾</button>' : "");
  }
  function cardHtml(x) {
    var initial = esc(String(x.name || "প").trim().charAt(0) || "প");
    if (x.kind === "author") {
      return '<article class="rv-card author"><div class="rv-badge">✎ লেখকের কথা</div>' + textHtml(x) + '<div class="rv-by"><span class="rv-av">আ</span><b>আরিফ খন্দকার</b><time>' + fmtDate(x.createdAt) + '</time></div>' + shareHtml(x) + "</article>";
    }
    return '<article class="rv-card"><header>' + stars(x.rating) + '<span class="rv-lab">' + LABELS[x.rating] + '</span></header>' + textHtml(x) + '<div class="rv-by"><span class="rv-av">' + initial + "</span><b>" + esc(x.name) + "</b><time>" + fmtDate(x.createdAt) + "</time></div>" + shareHtml(x) + "</article>";
  }
  function listHtml(st) {
    var authors = S.list.filter(function (x) { return x.kind === "author"; }).sort(function (a, b) { return b.createdAt - a.createdAt; });
    var rs = st.rs.slice();
    if (S.filter) rs = rs.filter(function (x) { return x.rating === S.filter; });
    if (S.sort === "top") rs.sort(function (a, b) { return b.rating - a.rating || b.createdAt - a.createdAt; });
    else if (S.sort === "low") rs.sort(function (a, b) { return a.rating - b.rating || b.createdAt - a.createdAt; });
    else rs.sort(function (a, b) { return b.createdAt - a.createdAt; });
    var head = "";
    if (st.n) {
      head = '<div class="rv-tools"><label>সাজান: <select id="rv-sort"><option value="new"' + (S.sort === "new" ? " selected" : "") + '>সবচেয়ে নতুন</option><option value="top"' + (S.sort === "top" ? " selected" : "") + '>সবচেয়ে ভালো আগে</option><option value="low"' + (S.sort === "low" ? " selected" : "") + ">কম রেটিং আগে</option></select></label>" + (S.filter ? '<button type="button" class="rv-clear" id="rv-clear">' + toBn(S.filter) + " ★ ফিল্টার সরান ✕</button>" : "") + "</div>";
    }
    var shown = S.more ? rs : rs.slice(0, 5);
    return head + authors.map(cardHtml).join("") + (rs.length ? shown.map(cardHtml).join("") : (S.filter ? '<p class="rv-none">এই রেটিংয়ে কোনো রিভিউ নেই।</p>' : "")) + (!S.more && rs.length > 5 ? '<button type="button" class="btn" id="rv-more">আরও ' + toBn(rs.length - 5) + "টি রিভিউ দেখুন</button>" : "");
  }
  function authHtml() {
    if (S.user) {
      return '<p class="rv-who">লগইন আছে: <b>' + esc(S.user.name || S.user.email) + '</b> · <button type="button" class="rv-link" id="rv-out">লগআউট</button></p>';
    }
    return "";
  }
  function formHtml() {
    if (!S.form) return "";
    if (!S.user) {
      if (S.needEmail) {
        return '<div class="rv-form"><h3>ইমেইল নিশ্চিত করুন</h3><p class="rv-hint">লগইন লিংকটি যে ইমেইলে এসেছে সেটি লিখুন।</p><input type="email" id="rv-email2" placeholder="আপনার ইমেইল" autocomplete="email"><button class="btn gold" id="rv-finish">লগইন সম্পূর্ণ করুন</button>' + (S.error ? '<p class="rv-err">' + esc(S.error) + "</p>" : "") + "</div>";
      }
      if (S.linkSent) {
        return '<div class="rv-form"><h3>ইমেইল দেখুন ✉️</h3><p class="rv-hint"><b>' + esc(S.linkSent) + "</b> ঠিকানায় একটি লগইন লিংক পাঠানো হয়েছে। লিংকে চাপ দিলেই লগইন হয়ে যাবে। না পেলে স্প্যাম ফোল্ডারও দেখুন।</p></div>";
      }
      return '<div class="rv-form"><h3>রিভিউ লিখতে আগে লগইন করুন</h3><p class="rv-hint">আপনার নাম ও রিভিউ ছাড়া ইমেইল অন্য কাউকে দেখানো হবে না।</p><button class="btn gold" id="rv-google"><span class="g">G</span> Google দিয়ে চালিয়ে যান</button><div class="rv-or"><span>অথবা</span></div><input type="email" id="rv-email" placeholder="আপনার ইমেইল লিখুন" autocomplete="email"><button class="btn" id="rv-send">ইমেইলে লগইন লিংক পাঠান</button>' + (S.error ? '<p class="rv-err">' + esc(S.error) + "</p>" : "") + "</div>";
    }
    if (S.mine) {
      return '<div class="rv-form"><h3>' + (S.mine.status === "approved" ? "আপনার রিভিউ প্রকাশিত ✓" : "ধন্যবাদ! রিভিউটি যাচাইয়ের অপেক্ষায় আছে") + '</h3><p class="rv-hint">একটি বইয়ে একটি রিভিউ দেওয়া যায়।</p></div>';
    }
    var r = S.rating;
    return '<div class="rv-form"><h3>আপনার রিভিউ লিখুন</h3><div class="rv-pick" role="radiogroup" aria-label="তারা দিন">' + [1, 2, 3, 4, 5].map(function (k) { return '<button type="button" class="rv-star' + (k <= r ? " on" : "") + '" data-r="' + k + '" aria-label="' + toBn(k) + ' তারা">★</button>'; }).join("") + '<span class="rv-pl">' + (r ? LABELS[r] : "তারা বেছে নিন") + '</span></div><input type="text" id="rv-name" maxlength="40" placeholder="আপনার নাম (যেভাবে দেখাবে)" value="' + esc(S.draftName != null ? S.draftName : S.user.name || "") + '"><textarea id="rv-text" rows="5" maxlength="1500" placeholder="বইটি কেমন লাগল? কাহিনি, লেখা, প্রচ্ছদ — যা মনে আসে লিখুন (কমপক্ষে ১৫ অক্ষর)">' + esc(S.draftText || "") + '</textarea><div class="rv-count"><span id="rv-cnt">' + toBn((S.draftText || "").length) + '</span>/১৫০০</div>' + (S.error ? '<p class="rv-err">' + esc(S.error) + "</p>" : "") + '<button class="btn gold" id="rv-submit"' + (S.busy ? " disabled" : "") + ">রিভিউ জমা দিন</button><p class=\"rv-hint\">রিভিউ যাচাইয়ের পর প্রকাশ হয়।</p></div>";
  }
  function adminHtml() {
    if (!S.isAdmin) return "";
    var p = S.pend.length ? S.pend.map(function (x) {
      return '<div class="rv-pend"><div>' + stars(x.rating) + " <b>" + esc(x.name) + "</b></div><p>" + esc(x.text) + '</p><div class="rv-pa"><button class="btn gold" data-ok="' + esc(x.id) + '">প্রকাশ করুন</button><button class="btn" data-no="' + esc(x.id) + '">বাতিল</button></div></div>';
    }).join("") : '<p class="rv-hint">অপেক্ষায় কোনো রিভিউ নেই।</p>';
    var note = slug ? '<h4>লেখকের কথা লিখুন (আপনার নামে, আলাদা ব্যাজে দেখাবে)</h4><textarea id="rv-an" rows="4" placeholder="এই বই নিয়ে আপনার দুটো কথা…"></textarea><button class="btn gold" id="rv-an-save">প্রকাশ করুন</button>' : "";
    return '<div class="rv-admin"><h3>🔧 আপনার জন্য (শুধু আপনি দেখছেন)</h3><h4>যাচাইয়ের অপেক্ষায়</h4>' + p + note + "</div>";
  }
  function render() {
    if (!be) {
      root.innerHTML = '<div class="rv-empty"><div class="rv-empty-ico">⭐</div><h3>রেটিং ও রিভিউ শীঘ্রই চালু হচ্ছে</h3><p>পাঠকরা এখানে বইটি নিয়ে নিজেদের মত জানাতে পারবেন।</p></div>';
      return;
    }
    if (!S.loaded) { root.innerHTML = '<p class="rv-none">রিভিউ আনা হচ্ছে…</p>'; return; }
    var st = stats();
    root.innerHTML = '<div class="rv-top">' + summaryHtml(st) + '<div class="rv-cta"><button class="btn gold" id="rv-write">' + (S.mine ? "আপনার রিভিউ" : "✎ রিভিউ লিখুন") + "</button>" + authHtml() + "</div></div>" + (S.msg ? '<p class="rv-ok">' + esc(S.msg) + "</p>" : "") + '<div id="rv-formbox">' + formHtml() + "</div>" + adminHtml() + '<div class="rv-list">' + listHtml(st) + "</div>";
    bind();
  }
  function bind() {
    var on = function (sel, ev, fn) { var e = $(sel, root); if (e) e.addEventListener(ev, fn); };
    on("#rv-write", "click", function () { S.form = !S.form; S.error = ""; render(); if (S.form) { var f = $("#rv-formbox", root); if (f) f.scrollIntoView({ behavior: "smooth", block: "center" }); } });
    [].forEach.call(root.querySelectorAll("[data-filter]"), function (b) { b.addEventListener("click", function () { var k = +b.dataset.filter; S.filter = S.filter === k ? 0 : k; render(); }); });
    on("#rv-more", "click", function () { S.more = true; render(); });
    [].forEach.call(root.querySelectorAll("[data-sh]"), function (b) { b.addEventListener("click", function () { shareReview(b.dataset.sh); }); });
    [].forEach.call(root.querySelectorAll(".rv-rm"), function (b) { b.addEventListener("click", function () { var t = b.previousElementSibling; var o = t.classList.toggle("rv-open"); b.textContent = o ? "কম দেখুন ▴" : "আরও পড়ুন ▾"; }); });
    on("#rv-clear", "click", function () { S.filter = 0; render(); });
    on("#rv-sort", "change", function (e) { S.sort = e.target.value; render(); });
    on("#rv-out", "click", async function () { await be.signOut(); });
    on("#rv-google", "click", async function () { S.error = ""; try { await be.google(); } catch (e) { S.error = "Google দিয়ে লগইন হয়নি। Chrome ব্রাউজারে খুলুন, অথবা ইমেইল লিংকে চেষ্টা করুন।"; render(); } });
    on("#rv-send", "click", async function () {
      var em = ($("#rv-email", root).value || "").trim();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) { S.error = "সঠিক ইমেইল লিখুন।"; render(); return; }
      try { localStorage.setItem("ak-rev-email", em); } catch (e) {}
      try { await be.sendLink(em); S.linkSent = em; S.error = ""; } catch (e) { S.error = "লিংক পাঠানো যায়নি। একটু পরে আবার চেষ্টা করুন, অথবা Google দিয়ে লগইন করুন।"; }
      render();
    });
    on("#rv-finish", "click", async function () {
      var em = ($("#rv-email2", root).value || "").trim();
      try { await be.finishLink(em); S.needEmail = false; history.replaceState(null, "", location.pathname + "#reviews"); } catch (e) { S.error = "ইমেইল মেলেনি বা লিংকের মেয়াদ শেষ। আবার লিংক নিন।"; render(); }
    });
    [].forEach.call(root.querySelectorAll(".rv-star"), function (b) { b.addEventListener("click", function () { S.draftName = ($("#rv-name", root) || {}).value; S.draftText = ($("#rv-text", root) || {}).value; S.rating = +b.dataset.r; render(); }); });
    on("#rv-text", "input", function (e) { S.draftText = e.target.value; $("#rv-cnt", root).textContent = toBn(e.target.value.length); });
    on("#rv-name", "input", function (e) { S.draftName = e.target.value; });
    on("#rv-submit", "click", async function () {
      var name = ($("#rv-name", root).value || "").trim(), text = ($("#rv-text", root).value || "").trim();
      S.draftName = name; S.draftText = text;
      if (!S.rating) { S.error = "আগে তারা বেছে নিন।"; render(); return; }
      if (!name) { S.error = "নাম লিখুন।"; render(); return; }
      if (text.length < 15) { S.error = "রিভিউ আরেকটু বড় করে লিখুন (কমপক্ষে ১৫ অক্ষর)।"; render(); return; }
      S.busy = true; S.error = "";
      try {
        await be.submit(slug, S.user.uid, { name: name, rating: S.rating, text: text });
        S.mine = { status: "pending" }; S.msg = "ধন্যবাদ! আপনার রিভিউ যাচাইয়ের পর প্রকাশিত হবে।"; S.form = false; S.draftText = ""; S.rating = 0;
      } catch (e) { S.error = "জমা হয়নি। আবার চেষ্টা করুন।"; }
      S.busy = false; render();
    });
    [].forEach.call(root.querySelectorAll("[data-ok]"), function (b) { b.addEventListener("click", async function () { await be.setStatus(b.dataset.ok, "approved"); await reload(); }); });
    [].forEach.call(root.querySelectorAll("[data-no]"), function (b) { b.addEventListener("click", async function () { await be.setStatus(b.dataset.no, "rejected"); await reload(); }); });
    on("#rv-an-save", "click", async function () { var t = ($("#rv-an", root).value || "").trim(); if (t.length < 5) return; await be.authorNote(slug, S.user.uid, t); await reload(); });
  }
  async function reload() {
    try {
      S.list = slug ? await be.list(slug) : [];
      if (S.user) {
        S.mine = slug ? await be.mine(slug, S.user.uid) : null;
        S.isAdmin = await be.isAdmin(S.user.uid);
        S.pend = S.isAdmin ? await be.pending(slug || null) : [];
      } else { S.mine = null; S.isAdmin = false; S.pend = []; }
    } catch (e) { S.list = []; }
    S.loaded = true; render();
  }

  /* ---------- অ্যাডমিন পাতা (সব বইয়ের অপেক্ষমাণ রিভিউ) ---------- */
  function renderAdminPage() {
    if (!S.loaded) { root.innerHTML = '<p class="rv-none">লোড হচ্ছে…</p>'; return; }
    if (!S.user) {
      root.innerHTML = '<div class="rv-form"><h3>লগইন করুন</h3><button class="btn gold" id="rv-google"><span class="g">G</span> Google দিয়ে চালিয়ে যান</button></div>';
      $("#rv-google", root).addEventListener("click", function () { be.google().catch(function () {}); });
      return;
    }
    if (!S.isAdmin) { root.innerHTML = '<p class="rv-none">এই অ্যাকাউন্টের অ্যাডমিন অনুমতি নেই।</p><div class="rv-form"><h3>আপনার UID</h3><p class="rv-hint">অ্যাডমিন বানাতে Firestore-এর admins ডকুমেন্ট আইডিতে এই কোডটা বসাতে হবে।</p><input id="rv-uid" readonly value="' + esc(S.user.uid) + '"><button class="btn gold" id="rv-cp">কপি করুন</button></div>' + authHtml(); var cp = $("#rv-cp", root); if (cp) cp.addEventListener("click", function () { var i = $("#rv-uid", root); i.select(); i.setSelectionRange(0, 999); try { navigator.clipboard.writeText(i.value); } catch (e) { document.execCommand("copy"); } cp.textContent = "কপি হয়েছে ✓"; }); var o = $("#rv-out", root); if (o) o.addEventListener("click", function () { be.signOut(); }); return; }
    root.innerHTML = '<h3>যাচাইয়ের অপেক্ষায় (' + toBn(S.pend.length) + ")</h3>" + (S.pend.length ? S.pend.map(function (x) {
      return '<div class="rv-pend"><div>' + stars(x.rating) + " <b>" + esc(x.name) + '</b> · <a href="/b/' + esc(x.slug) + '/#reviews">' + esc(x.slug) + "</a></div><p>" + esc(x.text) + '</p><div class="rv-pa"><button class="btn gold" data-ok="' + esc(x.id) + '">প্রকাশ করুন</button><button class="btn" data-no="' + esc(x.id) + '">বাতিল</button></div></div>';
    }).join("") : '<p class="rv-hint">অপেক্ষায় কোনো রিভিউ নেই 🎉</p>') + authHtml();
    [].forEach.call(root.querySelectorAll("[data-ok]"), function (b) { b.addEventListener("click", async function () { await be.setStatus(b.dataset.ok, "approved"); await reloadAdmin(); }); });
    [].forEach.call(root.querySelectorAll("[data-no]"), function (b) { b.addEventListener("click", async function () { await be.setStatus(b.dataset.no, "rejected"); await reloadAdmin(); }); });
    var o2 = $("#rv-out", root); if (o2) o2.addEventListener("click", function () { be.signOut(); });
  }
  async function reloadAdmin() {
    if (S.user) { S.isAdmin = await be.isAdmin(S.user.uid); S.pend = S.isAdmin ? await be.pending(null) : []; }
    S.loaded = true; renderAdminPage();
  }

  /* ---------- শুরু ---------- */
  (async function () {
    try { be = await makeBackend(); } catch (e) { be = null; }
    if (!be) { render(); return; }
    var wasLink = false;
    try { wasLink = be.isLink && be.isLink(); } catch (e) {}
    be.onAuth(async function (u) {
      S.user = u;
      if (u) { S.linkSent = ""; S.needEmail = false; }
      if (admin) await reloadAdmin(); else await reload();
    });
    if (wasLink) {
      var em = ""; try { em = localStorage.getItem("ak-rev-email") || ""; } catch (e) {}
      S.form = true;
      if (em) { try { await be.finishLink(em); history.replaceState(null, "", location.pathname + "#reviews"); } catch (e) { S.needEmail = true; } }
      else S.needEmail = true;
      if (S.needEmail) render();
    }
    if (!admin) render(); else renderAdminPage();
  })();
})();
