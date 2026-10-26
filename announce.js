/* বই জংশন — "যাত্রীদের জ্ঞাতার্থে" ঘোষণার চলমান স্ট্রিপ (সব তথ্য সাইটের আসল তথ্য) */
(function () {
  const hero = document.getElementById("home");
  if (!hero || typeof BOOKS === "undefined") return;
  const BN = "০১২৩৪৫৬৭৮৯";
  const bn = (s) => String(s).replace(/\d/g, (d) => BN[d]);
  const total = BOOKS.filter((b) => b.slug).length + (typeof EBOOKS !== "undefined" ? EBOOKS.filter((b) => b.slug && b.link).length : 0);
  const ebooks = typeof EBOOKS !== "undefined" ? EBOOKS.filter((b) => b.slug && b.link).length : 0;
  const msgs = [
    "প্রতিটি বই লেখক আরিফ খন্দকারের স্বাক্ষরসহ",
    "ঢাকার ভেতরে ২৪ ঘণ্টায়, ঢাকার বাইরে ৪৮ থেকে ৭২ ঘণ্টায় বই পৌঁছায়",
    "বিকাশ, নগদ বা রকেটে পেমেন্ট করুন",
    `এখন ${bn(total)}টি বই পাওয়া যাচ্ছে` + (ebooks ? `, তার মধ্যে ${bn(ebooks)}টি ইবুক` : ""),
    "কোন বই নেবেন ঠিক করতে না পারলে “ভাগ্যে ছেড়ে দিন” বোতামে চাপুন"
  ];
  const item = (t) => `<span class="an-item">${t}</span><span class="an-sep" aria-hidden="true">◆</span>`;
  const run = msgs.map(item).join("");
  const bar = document.createElement("div");
  bar.className = "bj-announce";
  bar.setAttribute("role", "region");
  bar.setAttribute("aria-label", "যাত্রীদের জ্ঞাতার্থে");
  bar.innerHTML = `<span class="an-tag"><i aria-hidden="true"></i>যাত্রীদের জ্ঞাতার্থে</span><div class="an-view"><div class="an-run" aria-hidden="true"><div>${run}</div><div>${run}</div></div><p class="sr-only">${msgs.join(". ")}</p></div>`;
  hero.after(bar);
})();
