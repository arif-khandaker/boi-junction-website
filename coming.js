/* বই জংশন — "আসছে ট্রেন": ট্রেন ঢুকে আসার অ্যানিমেশন, "চালু হলে জানান" বোতাম, ঐচ্ছিক কাউন্টডাউন */
(function () {
  /* প্রি-অর্ডার চালুর তারিখ ঠিক হলে এখানে লিখুন, যেমন "2027-01-15"। খালি থাকলে কাউন্টডাউন দেখাবে না। */
  var LAUNCH = "";
  var BN = "০১২৩৪৫৬৭৮৯";
  var bn = function (s) { return String(s).replace(/\d/g, function (d) { return BN[d]; }); };
  var num = (typeof waNumber !== "undefined" && waNumber) ? waNumber : "8801823818887";
  document.querySelectorAll("[data-notify]").forEach(function (a) {
    var t = a.getAttribute("data-notify");
    a.href = "https://wa.me/" + num + "?text=" + encodeURIComponent("আসসালামু আলাইকুম। \"" + t + "\" বইটির প্রি-অর্ডার চালু হলে আমাকে জানাবেন।");
    a.target = "_blank"; a.rel = "noopener";
  });
  var box = document.getElementById("cm-count");
  if (box && /^\d{4}-\d{2}-\d{2}$/.test(LAUNCH)) {
    var d = Math.ceil((new Date(LAUNCH + "T00:00:00+06:00").getTime() - Date.now()) / 86400000);
    if (d > 0) box.textContent = "ট্রেন ছাড়তে আর " + bn(d) + " দিন। চালু হলে সবার আগে জানতে নিচের বোতাম চাপুন।";
  }
  /* ট্রেন স্টেশনে ঢুকে আসে (পর্দায় এলে একবার) */
  var tr = document.getElementById("tr"), wrap = document.getElementById("tr-wrap");
  if (tr && wrap) {
    var still = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    var settle = function () { wrap.classList.add("tr-done"); };
    if (still || !("IntersectionObserver" in window)) { settle(); }
    else {
      tr.classList.add("tr-pre");
      var io = new IntersectionObserver(function (es) {
        if (!es.some(function (e) { return e.isIntersecting; })) return;
        io.disconnect();
        tr.classList.remove("tr-pre"); tr.classList.add("is-run");
        setTimeout(settle, 2400);
      }, { threshold: 0.35 });
      io.observe(wrap);
    }
  }
})();
