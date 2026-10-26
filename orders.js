/* বই জংশন — অর্ডার সংরক্ষণ (Firestore) ও অর্ডারের অবস্থা দেখা। ব্যর্থ হলেও অর্ডার পাঠানোর কাজ আটকায় না। */
(function () {
  var REF_RE = /^BJ-[0-9]{6}-[0-9A-Z]{4}$/;
  var STEPS = [["new", "অর্ডার পেয়েছি"], ["paid", "পেমেন্ট নিশ্চিত"], ["packing", "প্যাক হচ্ছে"], ["shipped", "ডাকে গেছে"], ["delivered", "পৌঁছে গেছে"]];
  var cache = null;
  function backend() {
    if (cache) return cache;
    cache = (async function () {
      var cfg = window.AK_FIREBASE; if (!cfg) return null;
      var B = "https://www.gstatic.com/firebasejs/10.12.2/";
      var m = await Promise.all([import(B + "firebase-app.js"), import(B + "firebase-firestore.js")]);
      var app = m[0], fs = m[1];
      var a = app.getApps().length ? app.getApp() : app.initializeApp(cfg);
      return { fs: fs, db: fs.getFirestore(a) };
    })().catch(function () { cache = null; return null; });
    return cache;
  }

  /* যাত্রী নম্বর: প্রতিটি অর্ডার সফলভাবে সেভ হলে একটি কাউন্টার ১ বাড়ে। ব্যর্থ হলে টিকিট নম্বর ছাড়াই আগের মতো আসে। */
  var passP = {};
  window.bjPassengerFor = function (ref) { return passP[ref] || Promise.resolve(0); };
  async function bumpPassenger(fs, db, ref) {
    try {
      return await fs.runTransaction(db, async function (tx) {
        var cref = fs.doc(db, "meta", "passengers");
        var d = await tx.get(cref);
        var next = (d.exists() ? Number(d.data().n) || 0 : 0) + 1;
        tx.set(cref, { n: next, last: ref, updatedAt: fs.serverTimestamp() });
        return next;
      });
    } catch (e) { return 0; }
  }

  window.bjSaveOrder = async function (snap, method) {
    var done = function () {};
    try {
      if (!snap || !REF_RE.test(snap.ref || "")) return;
      passP[snap.ref] = new Promise(function (r) { done = r; });
      var b = await backend(); if (!b) return;
      var fs = b.fs, db = b.db;
      var items = (snap.items || []).slice(0, 30).map(function (x) { return { slug: String(x.slug || "").slice(0, 80), title: String(x.title || "").slice(0, 120), qty: Math.max(1, Math.min(99, x.qty | 0)), price: Math.max(0, x.price | 0) }; });
      if (!items.length) return;
      await fs.setDoc(fs.doc(db, "orders", snap.ref), {
        ref: snap.ref, name: String(snap.name || "").slice(0, 80), phone: String(snap.phone || "").slice(0, 20),
        address: String(snap.address || "").slice(0, 400), area: String(snap.area || "").slice(0, 30),
        items: items, total: Math.max(0, Math.round(snap.total || 0)), method: method === "whatsapp" ? "whatsapp" : "site",
        status: "new", createdAt: fs.serverTimestamp()
      });
      await fs.setDoc(fs.doc(db, "orderStatus", snap.ref), { status: "new", updatedAt: fs.serverTimestamp() });
      done(await bumpPassenger(fs, db, snap.ref));
    } catch (e) { /* চুপচাপ — অর্ডার ইমেইল/WhatsApp-এ ঠিকই গেছে */ }
    finally { done(0); }
  };

  window.bjOrderStatus = async function (ref) {
    var b = await backend(); if (!b) throw new Error("no-backend");
    var d = await b.fs.getDoc(b.fs.doc(b.db, "orderStatus", ref));
    if (!d.exists()) return null;
    var x = d.data(); var t = x.updatedAt && x.updatedAt.toMillis ? x.updatedAt.toMillis() : 0;
    return { status: x.status, updatedAt: t };
  };

  /* ---- অর্ডারের অবস্থা দেখার বক্স ---- */
  var form = document.getElementById("trk-form"), out = document.getElementById("trk-out");
  if (!form || !out) return;
  var BN = "০১২৩৪৫৬৭৮৯";
  function bn(s) { return String(s).replace(/\d/g, function (d) { return BN[d]; }); }
  function norm(v) { return String(v || "").trim().toUpperCase().replace(/[০-৯]/g, function (d) { return BN.indexOf(d); }).replace(/[\s–—_]+/g, "-"); }
  function show(r) {
    if (r.status === "cancelled") { out.innerHTML = '<p class="trk-msg">এই অর্ডারটি বাতিল হয়েছে। কিছু জানতে চাইলে WhatsApp-এ লিখুন।</p>'; return; }
    var idx = Math.max(0, STEPS.findIndex(function (s) { return s[0] === r.status; }));
    out.innerHTML = '<ol class="trk-steps">' + STEPS.map(function (s, i) { return '<li class="' + (i < idx ? "done" : i === idx ? "now" : "") + '"><i></i><span>' + s[1] + "</span></li>"; }).join("") + "</ol>" +
      '<p class="trk-msg">এখন: <b>' + STEPS[idx][1] + "</b>" + (r.updatedAt ? " · " + bn(new Intl.DateTimeFormat("bn-BD", { day: "numeric", month: "long", hour: "numeric", minute: "2-digit", hour12: false, timeZone: "Asia/Dhaka" }).format(new Date(r.updatedAt))) : "") + "</p>";
  }
  var busy = false;
  form.addEventListener("submit", function (e) {
    e.preventDefault(); if (busy) return;
    var ref = norm(document.getElementById("trk-ref").value);
    if (!REF_RE.test(ref)) { out.innerHTML = '<p class="trk-msg">অর্ডার নম্বরটা এভাবে হয়: <b>BJ-২৬১০২৬-AB১২</b>। টিকিটে বা অর্ডারের বার্তায় দেওয়া নম্বরটা লিখুন।</p>'; return; }
    busy = true; out.innerHTML = '<p class="trk-msg">খোঁজা হচ্ছে…</p>';
    window.bjOrderStatus(ref).then(function (r) {
      if (!r) out.innerHTML = '<p class="trk-msg">এই নম্বরে কোনো অর্ডার পাইনি। নম্বর ঠিক আছে কিনা দেখুন। নতুন অর্ডার হলে কয়েক মিনিট পর আবার দেখুন।</p>';
      else show(r);
    }).catch(function () { out.innerHTML = '<p class="trk-msg">এখন দেখা যাচ্ছে না। নেট দেখে একটু পরে আবার চেষ্টা করুন।</p>'; })
      .then(function () { busy = false; });
  });
})();
