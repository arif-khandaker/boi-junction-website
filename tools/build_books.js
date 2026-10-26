/* বইয়ের আলাদা পাতা বানানোর স্ক্রিপ্ট।
   script.js-এর BOOKS ও EBOOKS থেকে প্রতিটি বইয়ের জন্য b/<slug>/index.html বানায় (গুগলে খুঁজে পাওয়ার মতো আসল পাতা)
   এবং sitemap.xml হালনাগাদ করে (হোমপেজ + লেখার পাতা + বইয়ের পাতা)।
   চালাতে: node tools/build_books.js
   নতুন বই যোগ করলে BOOKS/EBOOKS-এ slug দিয়ে তারপর এটি চালান। */
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const src = fs.readFileSync(path.join(root, "script.js"), "utf8");
function grab(name) {
  const a = src.indexOf(`const ${name} = [`);
  const b = src.indexOf("\n];", a) + 3;
  return new Function(src.slice(a, b).replace(`const ${name} =`, "return"))();
}
const BOOKS = grab("BOOKS");
const EBOOKS = grab("EBOOKS");
const SETS = grab("SETS");
const AUTHOR = "আরিফ খন্দকার";
const SITE = "https://wwwboijunction.com";
const AUTHOR_SITE = "https://authorarifkhandaker.com";
const V = "20261027w";
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const en = (t) => String(t || "").replace(/[০-৯]/g, (d) => "০১২৩৪৫৬৭৮৯".indexOf(d));
const num = (t) => { const n = parseInt(en(t).replace(/[^0-9]/g, ""), 10); return Number.isFinite(n) ? n : 0; };
const yearOf = (t) => { const m = en(t).match(/(19|20)\d\d/); return m ? m[0] : ""; };
const filled = (t) => typeof t === "string" && t.trim().length > 0;

const all = [
  ...BOOKS.filter((b) => b.slug).map((b) => ({ ...b, ebook: false })),
  ...EBOOKS.filter((b) => b.slug && b.link).map((b) => ({ ...b, ebook: true })),
];

function desc(b) {
  const syn = (b.synopsis || []).find(filled);
  if (syn) {
    const t = syn.replace(/\s+/g, " ").trim();
    return `${b.genre} · ` + (t.length > 120 ? t.slice(0, 117).replace(/\s+\S*$/, "") + "…" : t);
  }
  return `${AUTHOR}-এর ${b.genre}${b.publisher ? " · " + b.publisher : ""}${b.price ? " · মূল্য " + b.price : ""}। ${b.ebook ? "ইবুক কিনুন।" : "লেখকের স্বাক্ষরসহ, সরাসরি অর্ডার করুন।"}`;
}

function related(b) {
  const pool = all.filter((x) => x.slug !== b.slug && x.cover);
  const same = pool.filter((x) => x.genre === b.genre);
  const rest = pool.filter((x) => x.genre !== b.genre);
  const idx = all.findIndex((x) => x.slug === b.slug);
  const rot = (arr) => arr.slice(idx % Math.max(arr.length, 1)).concat(arr.slice(0, idx % Math.max(arr.length, 1)));
  return [...rot(same), ...rot(rest)].slice(0, 4);
}

const bnum = (t) => String(t).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[d]);
const taka = (n) => bnum(Number(n).toLocaleString("en-US")) + " টাকা";
const buyable = (x) => x && x.slug && num(x.price) > 0;
const physical = BOOKS.filter(buyable);
const bySlug = (sl) => physical.find((x) => x.slug === sl);

/* রিভিউর পাশের "একসাথে কিনুন" বাক্স: এই বই + একই ধরনের আরও ২টি (ছাড় ছাড়া, যোগফল) এবং বিশেষ সেট (SETS থেকে) */
function sideBoxes(b) {
  let out = "";
  if (!b.ebook && buyable(b)) {
    const pool = physical.filter((x) => x.slug !== b.slug && x.cover);
    const same = pool.filter((x) => x.genre === b.genre);
    const rest = pool.filter((x) => x.genre !== b.genre);
    const idx = physical.findIndex((x) => x.slug === b.slug);
    const rot = (arr) => { const k = idx % Math.max(arr.length, 1); return arr.slice(k).concat(arr.slice(0, k)); };
    const two = [...rot(same), ...rot(rest)].slice(0, 2);
    const trio = [b, ...two];
    out += `<div class="bd" id="bd-box"><p class="bd-eye">একসাথে কিনুন</p><h3>এই বই + আরও ${bnum(two.length)}টি</h3>${trio.map((x, i) => `<label class="bd-row"><input type="checkbox" checked data-slug="${esc(x.slug)}" data-price="${num(x.price)}"><img src="/${esc(x.cover)}" alt="" loading="lazy"><span class="bd-t">${esc(x.title)}<small>${taka(num(x.price))}</small></span></label>`).join("")}<div class="bd-total"><span>মোট</span><b id="bd-sum">${taka(trio.reduce((n, x) => n + num(x.price), 0))}</b></div><button type="button" class="btn gold" id="bd-add">এই ${bnum(trio.length)}টি বই কার্টে নিন</button><small class="bd-note">কার্টে গিয়ে বিকাশ, নগদ বা রকেটে পেমেন্ট করে অর্ডার নিশ্চিত করুন।</small></div>`;
  }
  SETS.forEach((st) => {
    const bs = st.slugs.map(bySlug).filter(Boolean);
    if (bs.length !== st.slugs.length) return;
    const sum = bs.reduce((n, x) => n + num(x.price), 0);
    out += `<div class="bd set"><p class="bd-eye">✦ বিশেষ সেট</p><h3>${esc(st.title)}</h3><div class="bd-covers">${bs.map((x) => `<img src="/${esc(x.cover)}" alt="${esc(x.title)}" loading="lazy">`).join("")}</div><p class="bd-names">${bs.map((x) => esc(x.title)).join(" · ")}</p><div class="bd-price"><s>${taka(sum)}</s><strong>${taka(st.price)}</strong></div><span class="bd-save">🎉 ছাড় ${taka(sum - st.price)}</span><ul>${st.perks.map((x) => `<li>${esc(x)}</li>`).join("")}</ul><button type="button" class="btn gold" data-set-add="${st.slugs.join(",")}">সেটটি কার্টে নিন</button><small class="bd-note">কার্টে গিয়ে বিকাশ, নগদ বা রকেটে পেমেন্ট করুন।</small></div>`;
  });
  return out;
}

function reviewSection(b) {
  return `<section class="rv" id="reviews"><h2>রেটিং ও রিভিউ</h2><div class="rv-grid"><div class="rv-main"><div id="rv-app" data-slug="${esc(b.slug)}" data-title="${esc(b.title)}"><p style="color:#a59c8b">রিভিউ আনা হচ্ছে…</p></div></div><aside class="rv-side">${sideBoxes(b)}</aside></div></section>`;
}

function page(b) {
  const url = `${SITE}/b/${b.slug}/`;
  const d = desc(b);
  const image = b.cover ? `${SITE}/${b.cover}` : `${SITE}/author.jpg`;
  const priceN = num(b.price);
  const ld = {
    "@context": "https://schema.org", "@type": "Book", name: b.title, inLanguage: "bn", url, genre: b.genre, image,
    description: d, bookFormat: b.ebook ? "https://schema.org/EBook" : "https://schema.org/Paperback",
    author: { "@type": "Person", name: AUTHOR, alternateName: "Arif Khandaker", url: AUTHOR_SITE + "/" },
  };
  if (b.publisher) ld.publisher = { "@type": "Organization", name: b.publisher };
  if (num(b.pages)) ld.numberOfPages = num(b.pages);
  if (yearOf(b.year)) ld.datePublished = yearOf(b.year);
  if (priceN > 0) ld.offers = { "@type": "Offer", price: priceN, priceCurrency: "BDT", availability: "https://schema.org/InStock", url: b.ebook ? b.link : url };
  const cta = b.ebook
    ? `<a class="btn gold" href="${esc(b.link)}" target="_blank" rel="noopener">ইবুক কিনুন ↗</a>`
    : `<a class="btn gold" href="/#book-${esc(b.slug)}">${priceN > 0 ? "কার্টে যোগ করুন / অর্ডার" : "বইয়ের বিস্তারিত"}</a>`;
  const rel = related(b);
  const details = [
    ["ধরন", b.genre + (b.ebook ? " · ইবুক" : "")],
    b.publisher && ["প্রকাশনী", b.publisher],
    b.year && ["প্রকাশকাল", b.year],
    b.pages && ["পৃষ্ঠা", b.pages],
    b.price && ["মূল্য", b.price],
  ].filter(Boolean);
  const syn = (b.synopsis || []).filter(filled);
  return `<!DOCTYPE html>
<html lang="bn">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(b.title)} — ${esc(b.genre)} | ${AUTHOR} · বই জংশন</title>
<meta name="description" content="${esc(d)}">
<link rel="canonical" href="${url}">
<meta name="theme-color" content="#0e0d0b">
<meta property="og:type" content="book">
<meta property="og:site_name" content="বই জংশন">
<meta property="og:locale" content="bn_BD">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${esc(b.title)} — ${AUTHOR} · বই জংশন">
<meta property="og:description" content="${esc(d)}">
<meta property="og:image" content="${image}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.ico?v=2" sizes="any">
<link rel="manifest" href="/manifest.webmanifest">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
<script async src="https://www.googletagmanager.com/gtag/js?id=G-H027R58T1E"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-H027R58T1E');</script>
<link rel="stylesheet" href="/reviews.css?v=${V}">
<style>
@font-face{font-family:"AK Serif";src:url("/ak-serif.woff?v=3") format("woff");font-weight:400 500;font-display:swap}
@font-face{font-family:"AK Tiro";src:url("/ak-tiro.woff?v=3") format("woff");font-weight:400;font-display:swap}
@font-face{font-family:"AK Sans";src:url("/ak-sans.woff?v=3") format("woff");font-weight:300 600;font-display:swap}
*{box-sizing:border-box}
html{background:#0e0d0b}
body{margin:0;color:#ece6d8;font-family:"AK Sans","Noto Sans Bengali",sans-serif;line-height:1.7}
a{color:#e2c98f}
.top{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 22px;border-bottom:1px solid rgba(201,164,92,.22)}
.brand{text-decoration:none;color:#f7f3ea;font-family:"AK Tiro","AK Serif",serif;font-size:20px}
.brand small{display:block;font-family:"AK Sans",sans-serif;color:#c9a45c;font-size:11px;letter-spacing:.22em}
.top a.back{font-size:14px;text-decoration:none;border:1px solid rgba(201,164,92,.5);padding:8px 14px;border-radius:999px}
main{max-width:1020px;margin:0 auto;padding:40px 22px 16px}
.book{display:grid;grid-template-columns:240px 1fr;gap:34px;align-items:start}
.book img{width:100%;height:auto;display:block;border-radius:4px;box-shadow:0 30px 60px -28px rgba(0,0,0,.9),0 0 0 1px rgba(201,164,92,.2)}
.kicker{color:#c9a45c;letter-spacing:.12em;font-size:14px;margin:0 0 8px}
h1{font-family:"AK Tiro","AK Serif",serif;font-weight:400;font-size:clamp(34px,7vw,52px);line-height:1.25;margin:0 0 6px;color:#fffdf8}
.by{color:#a59c8b;margin:0 0 22px;font-size:15px}
dl{margin:0 0 22px;display:grid;grid-template-columns:auto 1fr;gap:6px 18px;font-size:15px}
dt{color:#a59c8b}dd{margin:0}
.signed{display:inline-block;margin:0 0 18px;border:1px solid rgba(201,164,92,.5);border-radius:999px;padding:6px 14px;color:#e2c98f;font-size:14px}
.actions{display:flex;flex-wrap:wrap;gap:10px}
.btn{font:inherit;font-size:15px;padding:11px 20px;border-radius:999px;border:1px solid rgba(201,164,92,.5);background:transparent;color:#e2c98f;cursor:pointer;text-decoration:none}
.btn.gold{background:#c9a45c;color:#1a1508;border-color:#c9a45c;font-weight:600}
h2{font-family:"AK Tiro","AK Serif",serif;font-weight:400;font-size:26px;margin:44px 0 14px;color:#f7f3ea}
.syn p{font-family:"AK Serif","Noto Serif Bengali",serif;font-size:19px;line-height:2;margin:0 0 1em}
.rel{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
.rel a{text-decoration:none;color:#ece6d8;font-size:14px;line-height:1.5}
.rel b{display:block;font-weight:500}.rel small{display:block;color:#c9a45c;font-size:12.5px;margin-top:2px}
.rel img{width:100%;height:auto;display:block;border-radius:3px;margin-bottom:8px;box-shadow:0 14px 30px -18px rgba(0,0,0,.9)}
footer{margin-top:50px;padding:26px 22px;text-align:center;color:#a59c8b;font-size:13px;border-top:1px solid rgba(201,164,92,.22)}
@media (max-width:640px){.book{grid-template-columns:1fr;text-align:center}.book img{max-width:220px;margin:0 auto}dl{text-align:left;max-width:320px;margin-left:auto;margin-right:auto}.actions{justify-content:center}.rel{grid-template-columns:repeat(2,1fr)}.syn p{text-align:left}}
</style>
</head>
<body>
<header class="top"><a class="brand" href="/"><span style="color:#e5484d">বই</span> <span style="color:#3dbb72">জংশন</span><small>BOI JUNCTION</small></a><a class="back" href="/#books">← সব বই</a></header>
<main>
<div class="book">
${b.cover ? `<img src="/${esc(b.cover)}" alt="${esc(b.title)} — প্রচ্ছদ" width="240" height="360">` : "<div></div>"}
<div>
<p class="kicker">${esc(b.genre)}${b.ebook ? " · ইবুক" : ""}</p>
<h1>${esc(b.title)}</h1>
<p class="by">${AUTHOR}</p>
${!b.ebook && priceN > 0 ? '<p class="signed">✎ লেখকের স্বাক্ষরসহ</p>' : ""}
<dl>${details.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join("")}</dl>
<div class="actions">${cta}<button type="button" class="btn" id="copy">লিংক কপি করুন</button><a class="btn" href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}" target="_blank" rel="noopener">ফেসবুকে শেয়ার</a></div>
</div>
</div>
${syn.length ? `<h2>সারসংক্ষেপ</h2><div class="syn">${syn.map((p) => `<p>${esc(p).replace(/\n/g, "<br>")}</p>`).join("")}</div>` : ""}
${reviewSection(b)}
<h2>${rel.length && rel.every((x) => x.genre === b.genre) ? "একই ধরনের আরও বই" : "আরও বই"}</h2>
<div class="rel">${rel.map((x) => `<a href="/b/${x.slug}/"><img src="/${esc(x.cover)}" alt="${esc(x.title)}" loading="lazy"><b>${esc(x.title)}</b><small>${esc(x.genre)}${buyable(x) ? " · " + taka(num(x.price)) : ""}</small></a>`).join("")}</div>
</main>
<footer>© বই জংশন (Boi Junction)। সর্বস্বত্ব সংরক্ষিত। · লেখক: <a href="https://authorarifkhandaker.com/" rel="noopener">${AUTHOR}</a> · <a href="/#books">সব বই</a></footer>
<script src="/firebase-config.js?v=${V}"></script>
<script src="/reviews.js?v=${V}"></script>
<script>
document.getElementById("copy").addEventListener("click",function(){var b=this,u=location.href;function ok(){b.textContent="লিংক কপি হয়েছে ✓";setTimeout(function(){b.textContent="লিংক কপি করুন"},2200)}
if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(u).then(ok,function(){prompt("লিংক:",u)})}else{prompt("লিংক:",u)}});
</script>
</body>
</html>
`;
}

all.forEach((b) => {
  const dir = path.join(root, "b", b.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), page(b));
});
console.log("বইয়ের পাতা তৈরি:", all.length);

/* sitemap.xml: হোমপেজ + লেখার পাতা + বইয়ের পাতা */
const dirs = (d) => (fs.existsSync(path.join(root, d)) ? fs.readdirSync(path.join(root, d)).filter((n) => fs.existsSync(path.join(root, d, n, "index.html"))).sort() : []);
const urls = [SITE + "/", ...all.map((b) => `${SITE}/b/${b.slug}/`)];
fs.writeFileSync(path.join(root, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${u}</loc></url>`).join("\n")}\n</urlset>\n`);
console.log("sitemap.xml হালনাগাদ:", urls.length, "টি ঠিকানা");

/* হোমপেজে সব বইয়ের সাধারণ লিংক-তালিকা + ItemList (গুগল সহজে সব বইয়ের পাতা খুঁজে পায়) */
{
  const ip = path.join(root, "index.html");
  let h = fs.readFileSync(ip, "utf8");
  const items = all.map((b) => `<li><a href="/b/${b.slug}/">${esc(b.title)}</a>${b.genre ? " <small>" + esc(b.genre) + "</small>" : ""}${b.ebook ? " <em class=\"bj-eb\">ইবুক</em>" : ""}</li>`).join("");
  const ld = { "@context": "https://schema.org", "@type": "ItemList", name: "বই জংশন — আরিফ খন্দকারের সব বই", itemListElement: all.map((b, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE}/b/${b.slug}/`, name: b.title })) };
  const block = `<!--BJ-LIST-START-->\n    <section class="section section-dark bj-all" id="all-books"><div class="container"><h2>আরিফ খন্দকারের সব বই — বই জংশন</h2><p>বই জংশনে পাবেন আরিফ খন্দকারের উপন্যাস, থ্রিলার, গল্প ও কবিতার বই। যেকোনো বইয়ের নামে চাপ দিয়ে বিস্তারিত দেখুন।</p><ul class="bj-all-list">${items}</ul></div></section>\n    <script type="application/ld+json">${JSON.stringify(ld)}</script>\n    <!--BJ-LIST-END-->`;
  h = h.replace(/<!--BJ-LIST-START-->[\s\S]*?<!--BJ-LIST-END-->/, () => block);
  fs.writeFileSync(ip, h);
}
