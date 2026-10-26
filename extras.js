/* বই জংশন — (১) যাত্রার টিকিট (অর্ডারের পর ছবি) (২) আজকের লাইন (৩) আজকের মেজাজ (কুয়াশা / শিউলি) */
(function () {
  const BN = "০১২৩৪৫৬৭৮৯";
  const bn = (s) => String(s).replace(/\d/g, (d) => BN[d]);
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const toBnNum = (p) => parseInt(String(p).replace(/[০-৯]/g, (d) => BN.indexOf(d)).replace(/\D/g, ""), 10) || 0;

  /* =====================================================
     ১. যাত্রার টিকিট
     ===================================================== */
  const FONT_D = '"AK Tiro","Tiro Bangla","Noto Serif Bengali",serif';
  const FONT_S = '"AK Sans","Noto Sans Bengali",sans-serif';

  function loadImg(src) {
    return new Promise((res) => {
      if (!src) return res(null);
      const im = new Image();
      const t = setTimeout(() => res(null), 4000);
      im.onload = () => { clearTimeout(t); res(im); };
      im.onerror = () => { clearTimeout(t); res(null); };
      im.src = src;
    });
  }
  function wrap(ctx, text, maxW) {
    const words = String(text).split(/\s+/); const lines = []; let cur = "";
    words.forEach((w) => {
      const t = cur ? cur + " " + w : w;
      if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t;
    });
    if (cur) lines.push(cur);
    return lines;
  }
  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  async function drawTicket(snap) {
    const W = 1080, H = 1680;
    const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    const c = cv.getContext("2d");
    try {
      await Promise.all([
        document.fonts.load('48px "AK Tiro"', "বই জংশন যাত্রী"),
        document.fonts.load('600 32px "AK Sans"', "যাত্রী গন্তব্য ভাড়া"),
      ]);
    } catch (e) {}
    const name = snap.name || "প্রিয় পাঠক";
    const dateStr = new Intl.DateTimeFormat("bn-BD", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Dhaka" }).format(new Date());
    const fare = bn(Number(snap.total || 0).toLocaleString("en-US")) + " টাকা";

    // পটভূমি
    c.fillStyle = "#0b0a08"; c.fillRect(0, 0, W, H);
    const g = c.createRadialGradient(W / 2, 300, 50, W / 2, 300, 900);
    g.addColorStop(0, "rgba(201,164,92,.22)"); g.addColorStop(1, "rgba(201,164,92,0)");
    c.fillStyle = g; c.fillRect(0, 0, W, H);

    // টিকিটের কাগজ
    const X = 60, Y = 70, TW = 960, TH = 1470, PERF = 1130;
    c.save(); c.shadowColor = "rgba(0,0,0,.7)"; c.shadowBlur = 50; c.shadowOffsetY = 24;
    rr(c, X, Y, TW, TH, 38); c.fillStyle = "#efe3c8"; c.fill(); c.restore();
    c.save(); rr(c, X, Y, TW, TH, 38); c.clip();
    // ওপরের কালো ব্যান্ড
    c.fillStyle = "#14110c"; c.fillRect(X, Y, TW, 215);
    c.fillStyle = "rgba(201,164,92,.5)"; c.fillRect(X, Y + 215, TW, 4);
    c.textAlign = "center"; c.textBaseline = "alphabetic";
    c.font = `92px ${FONT_D}`;
    const w1 = c.measureText("বই ").width, w2 = c.measureText("জংশন").width, sx = W / 2 - (w1 + w2) / 2;
    c.textAlign = "left"; c.fillStyle = "#e5484d"; c.fillText("বই ", sx, Y + 118);
    c.fillStyle = "#3dbb72"; c.fillText("জংশন", sx + w1, Y + 118);
    c.textAlign = "center"; c.fillStyle = "#c9a45c"; c.font = `600 28px ${FONT_S}`;
    c.fillText("←   যাত্রার টিকিট · BOI JUNCTION EXPRESS   →", W / 2, Y + 178);

    // যাত্রী
    const INK = "#1a1508", MUTE = "#7a6c4a";
    c.textAlign = "left";
    c.fillStyle = MUTE; c.font = `600 30px ${FONT_S}`; c.fillText("যাত্রী", X + 60, Y + 300);
    c.fillStyle = INK; c.font = `76px ${FONT_D}`;
    let nm = name; while (c.measureText(nm).width > TW - 120 && nm.length > 4) nm = nm.slice(0, -2);
    if (nm !== name) nm += "…";
    c.fillText(nm, X + 60, Y + 385);
    c.fillStyle = "rgba(26,21,8,.18)"; c.fillRect(X + 60, Y + 415, TW - 120, 2);

    // গন্তব্য
    c.fillStyle = MUTE; c.font = `600 30px ${FONT_S}`; c.fillText("গন্তব্য", X + 60, Y + 485);
    c.fillStyle = INK; c.font = `54px ${FONT_D}`;
    const items = snap.items || []; let ly = Y + 565; const shown = items.slice(0, 3);
    shown.forEach((it) => {
      let t = it.title + (it.qty > 1 ? " × " + bn(it.qty) : "");
      const lines = wrap(c, t, TW - 120).slice(0, 2);
      lines.forEach((ln) => { c.fillText(ln, X + 60, ly); ly += 68; });
      ly += 8;
    });
    if (items.length > shown.length) { c.fillStyle = MUTE; c.font = `600 34px ${FONT_S}`; c.fillText("+ আরও " + bn(items.length - shown.length) + "টি বই", X + 60, ly); ly += 50; }

    // প্রচ্ছদ
    const imgs = (await Promise.all(items.slice(0, 4).map((it) => loadImg(it.cover)))).filter(Boolean);
    if (imgs.length) {
      const ch = Math.min(300, PERF - 60 - ly + Y - 10), gap = 26;
      if (ch > 140) {
        const ws = imgs.map((im) => ch * (im.width / im.height));
        const tot = ws.reduce((a, b) => a + b, 0) + gap * (imgs.length - 1);
        let cx = X + (TW - tot) / 2;
        imgs.forEach((im, i) => {
          c.save(); c.shadowColor = "rgba(0,0,0,.45)"; c.shadowBlur = 18; c.shadowOffsetY = 8;
          c.drawImage(im, cx, ly + 12, ws[i], ch); c.restore();
          cx += ws[i] + gap;
        });
      }
    }

    // পাঞ্চ-ছিদ্র ও ছেঁড়া রেখা
    c.restore();
    c.fillStyle = "#0b0a08";
    c.beginPath(); c.arc(X, Y + PERF, 36, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(X + TW, Y + PERF, 36, 0, Math.PI * 2); c.fill();
    c.strokeStyle = "rgba(26,21,8,.45)"; c.lineWidth = 4; c.setLineDash([16, 14]);
    c.beginPath(); c.moveTo(X + 50, Y + PERF); c.lineTo(X + TW - 50, Y + PERF); c.stroke(); c.setLineDash([]);

    // নিচের অংশ: ভাড়া, তারিখ, বারকোড
    c.textAlign = "left";
    c.fillStyle = MUTE; c.font = `600 28px ${FONT_S}`; c.fillText("ভাড়া", X + 60, Y + PERF + 80);
    c.fillStyle = INK; c.font = `58px ${FONT_D}`; c.fillText(fare, X + 60, Y + PERF + 148);
    c.textAlign = "right";
    c.fillStyle = MUTE; c.font = `600 28px ${FONT_S}`; c.fillText("তারিখ", X + TW - 60, Y + PERF + 80);
    c.fillStyle = INK; c.font = `40px ${FONT_D}`; c.fillText(dateStr, X + TW - 60, Y + PERF + 144);
    // বারকোড (অর্ডার নম্বর থেকে)
    const ref = String(snap.ref || "BJ");
    let bx = X + 60; c.fillStyle = INK; let seed = 7;
    for (let i = 0; i < ref.length * 6 && bx < X + 560; i++) { seed = (seed * 31 + ref.charCodeAt(i % ref.length) + i) % 9973; const w = 3 + (seed % 5); if (i % 2 === 0) c.fillRect(bx, Y + PERF + 190, w, 80); bx += w + 2; }
    c.textAlign = "left"; c.fillStyle = MUTE; c.font = `600 26px ${FONT_S}`; c.fillText("টিকিট নং " + bn(ref), X + 60, Y + PERF + 305);
    c.textAlign = "right"; c.fillStyle = MUTE; c.fillText("wwwboijunction.com", X + TW - 60, Y + PERF + 305);

    // স্ট্যাম্প
    c.save(); c.translate(X + TW - 175, Y + PERF - 115); c.rotate(-0.22); c.globalAlpha = 0.88;
    c.strokeStyle = "#c8353b"; c.fillStyle = "#c8353b";
    c.lineWidth = 8; c.beginPath(); c.arc(0, 0, 112, 0, Math.PI * 2); c.stroke();
    c.lineWidth = 3; c.beginPath(); c.arc(0, 0, 98, 0, Math.PI * 2); c.stroke();
    c.textAlign = "center"; c.font = `54px ${FONT_D}`; c.fillText("যাত্রা", 0, -2); c.fillText("শুরু", 0, 62);
    c.restore();

    // নিচে সাইটের নাম
    c.textAlign = "center"; c.fillStyle = "#c9a45c"; c.font = `600 34px ${FONT_S}`;
    c.fillText("বই জংশন · আরিফ খন্দকারের বই, লেখকের স্বাক্ষরসহ", W / 2, H - 52);
    return cv;
  }

  let tkOverlay = null;
  window.bjTicket = async function (snap) {
    if (!snap || !snap.items || !snap.items.length) return;
    let cv;
    try { cv = await drawTicket(snap); } catch (e) { return; }
    const url = cv.toDataURL("image/png");
    if (tkOverlay) tkOverlay.remove();
    const o = document.createElement("div");
    o.className = "bj-tkov"; o.setAttribute("role", "dialog"); o.setAttribute("aria-modal", "true"); o.setAttribute("aria-label", "আপনার যাত্রার টিকিট");
    o.innerHTML = `<div class="tko-panel"><button type="button" class="tko-x" aria-label="বন্ধ করুন">×</button>` +
      `<p class="tko-h">আপনার যাত্রার টিকিট তৈরি</p><img class="tko-img" src="${url}" alt="বই জংশন যাত্রার টিকিট — ${esc(snap.name || "পাঠক")}" width="540" height="750">` +
      `<p class="tko-s">ছবিটা সেভ করে Facebook বা Instagram-এ দিন। বই জংশনকে ট্যাগ করতে ভুলবেন না।</p>` +
      `<div class="tko-act"><button type="button" class="btn btn-gold" id="tko-share">শেয়ার করুন</button><a class="btn btn-outline-gold" id="tko-save" href="${url}" download="boi-junction-ticket.png">ছবি সেভ করুন</a></div></div>`;
    document.body.appendChild(o); tkOverlay = o;
    document.body.classList.add("no-scroll");
    requestAnimationFrame(() => o.classList.add("is-in"));
    const close = () => { o.remove(); tkOverlay = null; document.body.classList.remove("no-scroll"); };
    o.querySelector(".tko-x").addEventListener("click", close);
    o.addEventListener("click", (e) => { if (e.target === o) close(); });
    document.addEventListener("keydown", function esc1(e) { if (e.key === "Escape") { close(); document.removeEventListener("keydown", esc1); } });
    o.querySelector("#tko-share").addEventListener("click", () => {
      cv.toBlob((blob) => {
        if (!blob) return;
        const file = new File([blob], "boi-junction-ticket.png", { type: "image/png" });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          navigator.share({ files: [file], title: "বই জংশন — আমার যাত্রার টিকিট", text: "আমি বই জংশন থেকে বই নিলাম 📚 https://wwwboijunction.com/" }).catch(() => {});
        } else { o.querySelector("#tko-save").click(); }
      }, "image/png");
    });
    o.querySelector(".tko-x").focus();
  };

  /* =====================================================
     ২. আজকের লাইন
     ===================================================== */
  (function todayLine() {
    if (typeof BOOKS === "undefined") return;
    const hero = document.getElementById("home");
    if (!hero) return;
    const cand = [];
    BOOKS.forEach((b) => {
      if (!b.slug || !Array.isArray(b.synopsis) || !b.synopsis[0]) return;
      let t = String(b.synopsis[0]).replace(/\s+/g, " ").trim().replace(/^[‘“"]+/, "");
      const m = t.match(/^[^।?!]*[।?!]/);
      if (!m) return;
      let s = m[0].trim().replace(/[’”"]+$/, "");
      if (s.length < 28 || s.length > 170) return;
      cand.push({ b, s });
    });
    if (cand.length < 3) return;
    const day = Math.floor((Date.now() + 6 * 3600e3) / 86400e3);
    const pick = cand[day % cand.length];
    const b = pick.b;
    const buy = toBnNum(b.price) > 0;
    const dateStr = new Intl.DateTimeFormat("bn-BD", { day: "numeric", month: "long", timeZone: "Asia/Dhaka" }).format(new Date());
    const sec = document.createElement("section");
    sec.className = "bj-line"; sec.id = "aj-line"; sec.setAttribute("aria-label", "আজকের লাইন");
    sec.innerHTML = `<div class="container"><div class="bl-card"><span class="bl-mark" aria-hidden="true">“</span><p class="bl-kicker">আজকের লাইন · ${esc(dateStr)}</p>` +
      `<blockquote class="bl-q">${esc(pick.s)}</blockquote>` +
      `<p class="bl-by">— <a href="/b/${esc(b.slug)}/">${esc(b.title)}</a>, আরিফ খন্দকার</p>` +
      `<div class="bl-act"><a class="btn btn-outline-gold" href="/b/${esc(b.slug)}/">বইটা দেখুন</a>${buy ? `<button type="button" class="btn btn-gold" data-cart-add="${esc(b.slug)}">+ কার্টে নিন</button>` : ""}</div></div></div>`;
    (document.querySelector(".bj-announce") || hero).after(sec);
  })();

  /* =====================================================
     ৩. আজকের মেজাজ — থ্রিলারে কুয়াশা, রোমান্টিকে ঝরা শিউলি
     ===================================================== */
  (function mood() {
    const tools = document.getElementById("book-tools");
    if (!tools) return;
    const bar = document.createElement("div");
    bar.className = "bj-mood"; bar.setAttribute("role", "group"); bar.setAttribute("aria-label", "আজকের মেজাজ");
    bar.innerHTML = `<span class="bm-l">আজকের মেজাজ</span>` +
      `<button type="button" data-mood="thriller" aria-pressed="false">কুয়াশা · থ্রিলার</button>` +
      `<button type="button" data-mood="romantic" aria-pressed="false">শিউলি · রোমান্টিক</button>` +
      `<button type="button" data-mood="none" aria-pressed="true">স্বাভাবিক</button>`;
    tools.before(bar);

    const cv = document.createElement("canvas"); cv.id = "bj-mood-cv"; cv.setAttribute("aria-hidden", "true");
    const vig = document.createElement("div"); vig.className = "bj-vig"; vig.setAttribute("aria-hidden", "true");
    document.body.append(vig, cv);
    const ctx = cv.getContext("2d");
    let mode = "none", raf = 0, W = 0, H = 0, dpr = 1, parts = [];
    const size = () => { dpr = Math.min(window.devicePixelRatio || 1, 1.5); W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    size(); addEventListener("resize", () => { size(); build(); });
    function build() {
      parts = [];
      if (mode === "romantic") {
        const n = W < 600 ? 16 : 30;
        for (let i = 0; i < n; i++) parts.push({ x: Math.random() * W, y: Math.random() * H, s: 5 + Math.random() * 7, vy: 0.35 + Math.random() * 0.7, ph: Math.random() * 6.28, sw: 0.5 + Math.random() * 1.1, r: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.04, c: i % 3 ? "rgba(255,238,210,.8)" : "rgba(255,186,120,.75)" });
      } else if (mode === "thriller") {
        for (let i = 0; i < 6; i++) parts.push({ x: Math.random() * W, y: H * (0.15 + Math.random() * 0.8), r: 220 + Math.random() * 220, vx: (0.12 + Math.random() * 0.22) * (i % 2 ? 1 : -1) });
      }
    }
    function frame(t) {
      ctx.clearRect(0, 0, W, H);
      if (mode === "romantic") {
        parts.forEach((p) => {
          p.y += p.vy; p.x += Math.sin(t / 900 + p.ph) * p.sw; p.r += p.vr;
          if (p.y > H + 20) { p.y = -20; p.x = Math.random() * W; }
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c;
          ctx.beginPath(); ctx.ellipse(0, 0, p.s, p.s * 0.48, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        });
      } else if (mode === "thriller") {
        parts.forEach((p) => {
          p.x += p.vx; if (p.x > W + p.r) p.x = -p.r; if (p.x < -p.r) p.x = W + p.r;
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
          g.addColorStop(0, "rgba(200,205,215,.10)"); g.addColorStop(1, "rgba(200,205,215,0)");
          ctx.fillStyle = g; ctx.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
        });
      }
      if (!reduce && mode !== "none") raf = requestAnimationFrame(frame);
    }
    function set(m, silent) {
      mode = m;
      cancelAnimationFrame(raf); raf = 0;
      bar.querySelectorAll("[data-mood]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mood === m)));
      document.body.dataset.mood = m;
      vig.className = "bj-vig" + (m === "thriller" ? " is-thriller" : m === "romantic" ? " is-romantic" : "");
      ctx.clearRect(0, 0, W, H);
      build();
      if (m !== "none") { cv.style.display = "block"; if (reduce) frame(0); else raf = requestAnimationFrame(frame); } else cv.style.display = "none";
      try { sessionStorage.setItem("bj-mood", m); } catch (e) {}
    }
    bar.addEventListener("click", (e) => { const b = e.target.closest("[data-mood]"); if (b) set(b.dataset.mood); });
    // ধরন-বাছাইয়ের বোতামের সঙ্গে মেলানো
    document.addEventListener("click", (e) => {
      const chip = e.target.closest("#book-chips .chip");
      if (!chip) return;
      const t = chip.textContent || "";
      if (t.indexOf("থ্রিলার") >= 0) set("thriller");
      else if (t.indexOf("রোমান্টিক") >= 0) set("romantic");
      else if (t.indexOf("সব") >= 0) set("none");
    });
    document.addEventListener("visibilitychange", () => { if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else if (mode !== "none" && !reduce && !raf) raf = requestAnimationFrame(frame); });
    cv.style.display = "none";
    let saved = "none"; try { saved = sessionStorage.getItem("bj-mood") || "none"; } catch (e) {}
    if (saved !== "none") set(saved);
  })();
})();
