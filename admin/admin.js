if(window.top!==window.self){document.documentElement.style.display="none";try{window.top.location=window.self.location;}catch(e){}throw new Error("framed");}
const BN="০১২৩৪৫৬৭৮৯", bn=s=>String(s).replace(/\d/g,d=>BN[d]);
const esc=t=>String(t==null?"":t).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const STATUS=[["new","অর্ডার পেয়েছি"],["paid","পেমেন্ট নিশ্চিত"],["packing","প্যাক হচ্ছে"],["shipped","ডাকে গেছে"],["delivered","পৌঁছে গেছে"],["cancelled","বাতিল"]];
const SL=Object.fromEntries(STATUS);
const taka=n=>bn(Number(n||0).toLocaleString("en-US"))+" টাকা";
const B="https://www.gstatic.com/firebasejs/10.12.2/";
const [appM,authM,fs]=await Promise.all([import(B+"firebase-app.js"),import(B+"firebase-auth.js"),import(B+"firebase-firestore.js")]);
const app=appM.initializeApp(window.AK_FIREBASE), au=authM.getAuth(app), db=fs.getFirestore(app);
const $=id=>document.getElementById(id);
let ORD=[];
$("login").onclick=()=>authM.signInWithPopup(au,new authM.GoogleAuthProvider()).catch(e=>{$("msg").textContent="ঢোকা যায়নি";});
$("logout").onclick=()=>{try{localStorage.removeItem("bj_admin");}catch(e){}authM.signOut(au);};
authM.onAuthStateChanged(au,async u=>{
  if(!u){$("auth").classList.remove("hide");$("app").classList.add("hide");return;}
  let ok=false; try{ok=(await fs.getDoc(fs.doc(db,"admins",u.uid))).exists();}catch(e){}
  if(!ok){$("auth").classList.remove("hide");$("app").classList.add("hide");$("msg").innerHTML='<span class="err">এই অ্যাকাউন্টে অনুমতি নেই।</span>';return;}
  try{localStorage.setItem("bj_admin","1");}catch(e){}
  $("auth").classList.add("hide");$("app").classList.remove("hide");$("who").textContent=u.displayName||u.email||"";
  STATUS.forEach(s=>{const o=document.createElement("option");o.value=s[0];o.textContent=s[1];$("fs").appendChild(o);});
  load();
});
async function load(){
  $("list").innerHTML='<p class="note">আনা হচ্ছে…</p>';
  try{
    const q=fs.query(fs.collection(db,"orders"),fs.orderBy("createdAt","desc"),fs.limit(300));
    ORD=(await fs.getDocs(q)).docs.map(d=>{const x=d.data();x.id=d.id;x.t=x.createdAt&&x.createdAt.toMillis?x.createdAt.toMillis():Date.now();return x;});
  }catch(e){$("list").innerHTML='<p class="err">অর্ডার আনা যায়নি। Firestore নিয়ম (rules) প্রকাশ করা হয়েছে কিনা দেখুন।</p>';return;}
  stats();render();
}
function dayKey(t){return new Date(t+6*3600e3).toISOString().slice(0,10);}
function stats(){
  const live=ORD.filter(o=>o.status!=="cancelled");
  const sum=live.reduce((a,o)=>a+(o.total||0),0), now=Date.now();
  const w=live.filter(o=>now-o.t<7*864e5);
  const pend=ORD.filter(o=>o.status==="new"||o.status==="paid"||o.status==="packing").length;
  $("stats").innerHTML=[[bn(ORD.length),"মোট অর্ডার"],[taka(sum),"মোট বিক্রি (বাতিল বাদে)"],[bn(w.length),"গত ৭ দিনে অর্ডার"],[taka(w.reduce((a,o)=>a+(o.total||0),0)),"গত ৭ দিনে বিক্রি"],[bn(pend),"এখনও পাঠানো বাকি"],[live.length?taka(Math.round(sum/live.length)):"—","গড় অর্ডার"]].map(x=>`<div class="st"><b>${x[0]}</b><span>${x[1]}</span></div>`).join("");
  const days=[];for(let i=13;i>=0;i--)days.push(dayKey(now-i*864e5));
  const cnt={};live.forEach(o=>{const k=dayKey(o.t);cnt[k]=(cnt[k]||0)+1;});
  const mx=Math.max(1,...days.map(d=>cnt[d]||0));
  $("bars").innerHTML=days.map(d=>`<div style="height:${Math.max(2,(cnt[d]||0)/mx*100)}%" title="${d}: ${cnt[d]||0}">${cnt[d]?`<small>${bn(cnt[d])}</small>`:""}</div>`).join("");
  $("lbls").innerHTML=days.map(d=>`<span>${bn(+d.slice(8))}</span>`).join("");
  const tb={};live.forEach(o=>(o.items||[]).forEach(i=>{const k=i.title||i.slug;const r=tb[k]||(tb[k]={q:0,v:0});const qn=Math.min(Math.max(Math.floor(Number(i.qty))||1,1),999),pn=Number(i.price)||0;r.q+=qn;r.v+=pn*qn;}));
  const rows=Object.entries(tb).sort((a,b)=>b[1].q-a[1].q||b[1].v-a[1].v).slice(0,12);
  $("top").innerHTML='<tr><th>বই</th><th class="n">কপি</th><th class="n">টাকা</th></tr>'+(rows.length?rows.map(r=>`<tr><td>${esc(r[0])}</td><td class="n">${bn(r[1].q)}</td><td class="n">${taka(r[1].v)}</td></tr>`).join(""):'<tr><td colspan="3" class="note">এখনও অর্ডার নেই।</td></tr>');
}
function wa(o){
  let p=String(o.phone||"").replace(/\D/g,"");if(p.startsWith("0"))p="88"+p;else if(!p.startsWith("880"))return"";
  return "https://wa.me/"+p+"?text="+encodeURIComponent(`আসসালামু আলাইকুম ${o.name||""}, বই জংশন থেকে জানাচ্ছি: আপনার অর্ডার (${o.ref}) এখন \"${SL[o.status]||""}\"। ধন্যবাদ।`);
}
function render(){
  const f=$("fs").value,q=$("fq").value.trim().toLowerCase();
  const rows=ORD.filter(o=>(!f||o.status===f)&&(!q||[o.ref,o.name,o.phone,o.address].join(" ").toLowerCase().includes(q)));
  $("cnt").textContent=bn(rows.length)+"টি অর্ডার";
  $("list").innerHTML=rows.map(o=>{
    const d=bn(new Intl.DateTimeFormat("bn-BD",{day:"numeric",month:"short",hour:"numeric",minute:"2-digit",hour12:false,timeZone:"Asia/Dhaka"}).format(new Date(o.t)));
    const w=wa(o);
    return `<article class="ord" data-ref="${esc(o.id)}"><header><b>${esc(o.ref||o.id)}</b><span>${d} · ${o.method==="whatsapp"?"WhatsApp":"সাইট"}</span></header>`+
      `<p><b>${esc(o.name||"—")}</b> · <a href="tel:${esc(o.phone)}">${esc(o.phone||"")}</a> ${w?`· <a href="${w}" target="_blank" rel="noopener">WhatsApp-এ জানান</a>`:""}</p>`+
      `<p class="note">${esc(o.area||"")} · ${esc(o.address||"")}</p>`+
      `<ul>${(o.items||[]).map(i=>`<li>${esc(i.title)} × ${bn(Math.min(Math.max(Math.floor(Number(i.qty))||1,1),999))}</li>`).join("")}</ul>`+
      `<div class="row"><b>${taka(o.total)}</b><select data-st>${STATUS.map(s=>`<option value="${s[0]}"${s[0]===o.status?" selected":""}>${s[1]}</option>`).join("")}</select><span class="note" data-ok></span></div></article>`;
  }).join("")||'<p class="note">কিছু পাওয়া যায়নি।</p>';
}
$("fs").onchange=render;$("fq").oninput=render;
$("list").addEventListener("change",async e=>{
  const sel=e.target.closest("[data-st]");if(!sel)return;
  const art=sel.closest(".ord"),ref=art.dataset.ref,st=sel.value,ok=art.querySelector("[data-ok]");
  ok.textContent="সংরক্ষণ হচ্ছে…";
  try{
    await fs.updateDoc(fs.doc(db,"orders",ref),{status:st});
    await fs.setDoc(fs.doc(db,"orderStatus",ref),{status:st,updatedAt:fs.serverTimestamp()});
    const o=ORD.find(x=>x.id===ref);if(o)o.status=st;ok.textContent="সংরক্ষিত ✓";stats();
  }catch(err){ok.innerHTML='<span class="err">সংরক্ষণ হয়নি</span>';}
});
$("csv").onclick=()=>{
  const cols=["ref","date","name","phone","area","address","items","total","method","status"];
  const q=v=>'"'+String(v==null?"":v).replace(/"/g,'""')+'"';
  const lines=[cols.join(",")].concat(ORD.map(o=>[o.ref,new Date(o.t).toISOString(),o.name,o.phone,o.area,o.address,(o.items||[]).map(i=>i.title+" x"+i.qty).join("; "),o.total,o.method,o.status].map(q).join(",")));
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob(["﻿"+lines.join("\n")],{type:"text/csv;charset=utf-8"}));a.download="boi-junction-orders.csv";a.click();
};
