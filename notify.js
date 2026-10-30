/* অ্যাডমিনের জন্য নতুন অর্ডারের বিজ্ঞপ্তি।
   সাধারণ দর্শকের ফোনে কিছুই লোড হয় না: শুধু যে ব্রাউজারে /admin/ দিয়ে একবার ঢোকা হয়েছে, সেখানেই চলে। */
(function () {
  var on = false;
  try { on = localStorage.getItem("bj_admin") === "1"; } catch (e) {}
  if (!on || !window.AK_FIREBASE) return;
  var BN = "০১২৩৪৫৬৭৮৯", bn = function (s) { return String(s).replace(/\d/g, function (d) { return BN[d]; }); };
  (async function () {
    try {
      var B = "https://www.gstatic.com/firebasejs/10.12.2/";
      var m = await Promise.all([import(B + "firebase-app.js"), import(B + "firebase-auth.js"), import(B + "firebase-firestore.js")]);
      var app = m[0].initializeApp(window.AK_FIREBASE), au = m[1].getAuth(app), db = m[2].getFirestore(app), fs = m[2];
      var bar = null, last = -1, unsub = null;
      function show(n, newest) {
        if (!bar) {
          bar = document.createElement("a");
          bar.className = "bj-alert"; bar.href = "/admin/";
          bar.setAttribute("role", "status");
          document.body.appendChild(bar);
        }
        bar.hidden = n === 0;
        if (!n) return;
        var who = newest && newest.name ? " · সর্বশেষ: " + String(newest.name).slice(0, 24) : "";
        bar.textContent = "🔔 " + bn(n) + "টি নতুন অর্ডার এসেছে" + who + " — দেখুন →";
        if (last >= 0 && n > last) { try { navigator.vibrate && navigator.vibrate([200, 100, 200]); } catch (e) {} }
        last = n;
        document.title = "(" + bn(n) + ") " + document.title.replace(/^\([^)]*\)\s*/, "");
      }
      m[1].onAuthStateChanged(au, async function (u) {
        if (unsub) { unsub(); unsub = null; }
        if (!u) return;
        var ok = false;
        try { ok = (await fs.getDoc(fs.doc(db, "admins", u.uid))).exists(); } catch (e) {}
        if (!ok) return;
        unsub = fs.onSnapshot(
          fs.query(fs.collection(db, "orders"), fs.where("status", "==", "new"), fs.limit(100)),
          function (snap) {
            var newest = null, t = -1;
            snap.docs.forEach(function (d) { var x = d.data(), ms = x.createdAt && x.createdAt.toMillis ? x.createdAt.toMillis() : 0; if (ms >= t) { t = ms; newest = x; } });
            show(snap.size, newest);
          },
          function () {}
        );
      });
    } catch (e) {}
  })();
})();
