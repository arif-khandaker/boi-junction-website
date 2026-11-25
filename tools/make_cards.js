/* প্রতি বইয়ের শেয়ার-কার্ড (১২০০×৬৩০) বানায়: og/<slug>.jpg — ফেসবুক/WhatsApp-এ লিংক দিলে এটি দেখায়।
   চালাতে: node tools/make_cards.js  (playwright লাগে)। নতুন বই যোগ করলে আবার চালান। */
const fs = require("fs"), path = require("path");
const { chromium } = require("playwright");
const root = path.join(__dirname, "..");
const src = fs.readFileSync(path.join(root, "script.js"), "utf8");
const grab = (name) => { const a = src.indexOf(`const ${name} = [`); const b = src.indexOf("\n];", a) + 3; return new Function(src.slice(a, b).replace(`const ${name} =`, "return"))(); };
const books = [...grab("BOOKS"), ...grab("EBOOKS")].filter((b) => b.slug && b.cover && fs.existsSync(path.join(root, b.cover)));
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const font = "file://" + path.join(root, "ak-sans.woff");
(async () => {
  fs.mkdirSync(path.join(root, "og"), { recursive: true });
  const br = await chromium.launch(); const pg = await br.newPage({ viewport: { width: 1200, height: 630 } });
  for (const b of books) {
    const html = `<!doctype html><meta charset=utf-8><style>@font-face{font-family:A;src:url(${font})}
*{box-sizing:border-box;margin:0}body{width:1200px;height:630px;font-family:A,sans-serif;background:linear-gradient(120deg,#eaf1fd,#fff 60%);display:flex;align-items:center;padding:0 70px;gap:70px;color:#1f2430;position:relative}
img{height:500px;width:333px;object-fit:cover;border-radius:8px;box-shadow:0 24px 50px -14px rgba(16,24,40,.45)}
.g{color:#2b5fb4;font-size:30px;margin-bottom:14px}h1{font-size:${b.title.length > 18 ? 62 : 80}px;line-height:1.15;color:#1f2430}
.a{font-size:34px;color:#667085;margin-top:18px}.w{position:absolute;right:70px;bottom:44px;font-size:34px;font-weight:700;color:#7a1f2b}.p{display:inline-block;margin-top:28px;background:#2b5fb4;color:#fff;font-size:30px;padding:10px 26px;border-radius:999px}
.o{background:#98a2b3}</style>
<img src="file://${path.join(root, b.cover)}"><div><div class=g>${esc(b.genre)}</div><h1>${esc(b.title)}</h1><div class=a>আরিফ খন্দকার</div>${b.out ? '<span class="p o">স্টক আউট</span>' : (b.price ? `<span class=p>${esc(b.price)}</span>` : "")}</div><div class=w>বই জংশন · boijunction.com</div>`;
    const tmp = path.join(require("os").tmpdir(), "bj-card.html"); fs.writeFileSync(tmp, html); await pg.goto("file://" + tmp, { waitUntil: "load" }); await pg.waitForTimeout(150);
    await pg.screenshot({ path: path.join(root, "og", b.slug + ".jpg"), type: "jpeg", quality: 82 });
  }
  await br.close(); console.log("কার্ড:", books.length);
})();
