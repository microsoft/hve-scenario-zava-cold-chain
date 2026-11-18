/* Copyright (c) Microsoft Corporation.
   Licensed under the MIT license. */
/* Workshop Journey: the three-day HVE Core workshop on the Zava Silent Night, laid out as a field notebook.
   Content comes from workshop/*.json through /api/journey. Nothing here writes to disk. */
"use strict";

const $ = id => document.getElementById(id);
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]));
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { /* private mode */ } },
};
const ROLES = {attendee: "Attendee", coach: "Coach", facilitator: "Facilitator"};
const J = {doc: null, ch: {}, art: {}, order: [], status: {}, statusOk: null, role: "attendee", r: null};

/* ---------- text ---------- */
// Content allows `code` and [label](target) only. Everything else is escaped.
function md(s) {
  return esc(s)
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, label, target) => label === target && !/^(https:\/\/|\/?#\/)/.test(target) ? "`" + target + "`" : m)
    .replace(/`([^`]+)`/g, '<code translate="no">$1</code>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, label, target) => {
      if (/^https:\/\//.test(target)) return '<a href="' + target + '" target="_blank" rel="noopener">' + label + "</a>";
      if (/^\/?#\//.test(target)) return '<a href="' + target + '">' + label + "</a>";
      return label + ' (<code translate="no">' + target + "</code>)";
    });
}
const plural = (n, one, many) => n + " " + (n === 1 ? one : many);
const toMin = hm => { const [h, m] = hm.split(":").map(Number); return h * 60 + m; };
const hm = m => String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
function dur(m) {
  if (m < 60) return m + " min";
  const h = Math.floor(m / 60), r = m % 60;
  return r ? h + " h " + r + " min" : plural(h, "hour", "hours");
}
const when = iso => { try { return new Intl.DateTimeFormat(undefined, {dateStyle: "medium", timeStyle: "short"}).format(new Date(iso)); } catch (e) { return iso; } };
const longDate = iso => { try { return new Intl.DateTimeFormat(undefined, {dateStyle: "long"}).format(new Date(iso + "T12:00:00")); } catch (e) { return iso; } };
const list = (items, tag = "ul", cls = "") => items && items.length ? "<" + tag + (cls ? ' class="' + cls + '"' : "") + ">" + items.map(x => "<li>" + md(x) + "</li>").join("") + "</" + tag + ">" : "";

function toast(text) {
  const t = document.createElement("div");
  t.className = "toast"; t.textContent = text;
  $("toasts").appendChild(t);
  setTimeout(() => t.remove(), 5000);
  return t;
}

/* ---------- data helpers ---------- */
const chName = id => J.ch[id] ? id + " " + J.ch[id].title : id;
const sessions = (track = "three-day") => J.doc.tracks[track] || [];
function chSpans(id) {
  const byDay = {};
  sessions().filter(s => s.chapter === id).forEach(s => {
    const d = byDay[s.day] || (byDay[s.day] = {start: 1e9, end: 0});
    d.start = Math.min(d.start, toMin(s.start)); d.end = Math.max(d.end, toMin(s.start) + s.minutes);
  });
  return Object.entries(byDay).map(([d, t]) => ({day: Number(d), text: "Day " + d + ", " + hm(t.start) + " to " + hm(t.end)}));
}
const firstDay = id => (sessions().find(s => s.chapter === id) || {day: 1}).day;
function hveLabel(c) {
  const h = c.hve || {};
  if (h.stage) return "HVE Core stage " + h.stage + ", " + h.name;
  if (h.dt_methods) return "Design Thinking methods " + h.dt_methods[0] + " to " + h.dt_methods[h.dt_methods.length - 1];
  return "Sets the scene";
}
const ticks = id => (J.ch[id].done_when || []).map((_, i) => store.get("zj-done:" + id + ":" + i) === "1");
const chDone = id => { const t = ticks(id); return t.length > 0 && t.every(Boolean); };

function statusOf(a) {
  if (!a) return {label: "", cls: "unknown"};
  if (J.statusOk === false) return {label: "Unknown", cls: "unknown"};
  if (a.kind === "outside") return {label: "Outside the repo", cls: "outside"};
  const s = J.status[a.id];
  if (!s) return {label: "Checking…", cls: "unknown"};
  if (a.kind === "repo") return s.exists ? {label: "Ships with the repo", cls: "found"} : {label: "Missing from the repo", cls: "missing"};
  return s.exists ? {label: "Found on this computer", cls: "found"} : {label: "Not found on this computer", cls: "missing"};
}
const stHtml = id => { const s = statusOf(J.art[id]); return '<span class="st ' + s.cls + '" data-st="' + id + '"><i aria-hidden="true"></i>' + esc(s.label) + "</span>"; };
function nowChapter() {
  const start = J.doc.delivery_start;
  if (!start) return null;
  const d0 = new Date(start + "T00:00:00"), now = new Date();
  const n = Math.floor((now - d0) / 864e5) + 1, m = now.getHours() * 60 + now.getMinutes();
  const s = sessions().find(x => x.day === n && x.chapter && toMin(x.start) <= m && m < toMin(x.start) + x.minutes);
  return s ? s.chapter : null;
}

/* ---------- routing ---------- */
function parse() {
  const raw = location.hash.replace(/^#\/?/, "");
  const [path, query] = raw.split("?");
  const parts = path.split("/").filter(Boolean);
  return {view: parts[0] || "landing", id: parts[1] || null, q: new URLSearchParams(query || "")};
}
const afterRender = {};
function route() {
  if (!J.doc) return;
  J.r = parse();
  const {view, id} = J.r;
  const v = {landing: viewLanding, overview: viewOverview, day: viewDay, ch: viewChapter, artifacts: viewArtifacts}[view] || notFound;
  const el = $("jv");
  stopLanding();
  document.body.classList.toggle("landing", view === "landing");
  el.innerHTML = v(id, J.r.q);
  el.classList.remove("enter"); void el.offsetWidth; el.classList.add("enter");
  nav(view, id);
  if (afterRender[view]) afterRender[view](el);
}
function notFound() {
  document.title = "Not found · Workshop Journey · Zava";
  return '<div class="page narrow"><h1>That page isn’t here</h1><p class="lede">The workshop has an overview, three days, chapters 01 to 11 and the artifacts. <a href="#/overview">Go to the overview</a>.</p></div>';
}

/* ---------- the navigator: three days on one line, chapters spaced by their time in the room ---------- */
function nav(view, id) {
  const cur = view === "ch" ? id : null, curDay = view === "day" ? Number(id) : null, live = nowChapter();
  const seen = new Set();
  const days = J.doc.days.map(d => {
    const stops = [];
    sessions().filter(s => s.day === d.n && s.chapter).forEach(s => {
      const st = stops.find(x => x.id === s.chapter);
      if (st) st.min += s.minutes; else stops.push({id: s.chapter, min: s.minutes});
    });
    return '<li class="day' + (curDay === d.n ? " on" : "") + '"><a class="day-h" href="#/day/' + d.n + '"' + (curDay === d.n ? ' aria-current="page"' : "") + '><span class="dn">Day ' + d.n + '</span><span class="dt">' + esc(d.theme) + "</span></a>"
      + '<ol class="stops">' + stops.map(s => {
        const again = seen.has(s.id); seen.add(s.id);
        const done = chDone(s.id);
        const cls = "stop" + (s.id === cur ? " cur" : "") + (done ? " done" : "") + (again ? " again" : "") + (s.id === live ? " now" : "");
        return '<li style="--m:' + s.min + '"><a class="' + cls + '" href="#/ch/' + s.id + '"' + (s.id === cur && !again ? ' aria-current="page"' : "") + ">"
          + '<span class="dot" aria-hidden="true"></span><span class="sn">' + s.id + '</span><span class="sl">' + esc(J.ch[s.id].title) + (again ? '<span class="sr">, continued</span><span class="cont" aria-hidden="true"> continued</span>' : "") + "</span>"
          + (done ? '<span class="sr">, ticked off</span>' : "") + (s.id === live ? '<span class="nowtag">now</span>' : "") + "</a></li>";
      }).join("") + "</ol></li>";
  }).join("");
  $("line").innerHTML = '<a class="ov' + (view === "overview" ? " on" : "") + '" href="#/overview"' + (view === "overview" ? ' aria-current="page"' : "") + ">Overview</a><ol class=\"days\">" + days + "</ol>";
  document.querySelectorAll("[data-nav]").forEach(a => a.toggleAttribute("aria-current", a.dataset.nav === view));
  const i = J.order.indexOf(cur);
  $("mwhere").textContent = cur && J.ch[cur] ? cur + " of " + J.order.length + ", " + J.ch[cur].short : cur ? "Not found" : view === "day" ? "Day " + id : view === "artifacts" ? "Artifacts" : "Overview";
  // Keep the current chapter in view inside the navigator without moving the page.
  const on = $("line").querySelector(".stop.cur, .day.on .day-h"), box = $("nav");
  if (on && box.scrollHeight > box.clientHeight) {
    const top = on.getBoundingClientRect().top - box.getBoundingClientRect().top;
    if (top < 80 || top > box.clientHeight - 80) box.scrollTop += top - box.clientHeight / 2;
  }
}
function setNav(open) {
  document.body.classList.toggle("navopen", open);
  $("navbtn").setAttribute("aria-expanded", String(open));
  $("scrim").hidden = !open;
  if (open) { const a = $("nav").querySelector(".stop.cur, .ov"); if (a) a.focus(); }
}
$("navbtn").onclick = () => setNav(!document.body.classList.contains("navopen"));
$("scrim").onclick = () => setNav(false);

/* ---------- landing: the night, then what it costs, then the journey ---------- */
const fmtCount = (it, v) => {
  if (it.format === "duration") { const m = Math.round(v); return Math.floor(m / 60) + " h " + String(m % 60).padStart(2, "0") + " min"; }
  const n = it.decimals ? v.toFixed(it.decimals) : Math.round(v).toLocaleString("en-GB");
  return (it.prefix || "") + n + (it.suffix || "");
};
const degC = c => (c < 0 ? "\u2212" : "") + Math.abs(c).toFixed(1) + " °C";
const countHtml = it => '<span class="count-up" data-count="' + it.count + '" data-i="' + esc(JSON.stringify(it)) + '">' + esc(fmtCount(it, it.count)) + "</span>";
function traceGeometry(tr) {
  const W = 1000, H = 300, lo = -25, hi = 55, n = tr.temps.length - 1;
  const x = i => (i / n) * W, y = c => H - ((c - lo) / (hi - lo)) * H;
  return {W, H, x, y, d: tr.temps.map((c, i) => (i ? "L" : "M") + x(i).toFixed(1) + " " + y(c).toFixed(1)).join(" ")};
}
function viewLanding() {
  document.title = "The Silent Night · Workshop Journey · Zava";
  const L = J.doc.landing, tr = L.trace, g = traceGeometry(tr), lim = g.y(tr.limit);
  // Labels are HTML, not SVG text, so they stay readable when the chart stretches to the screen.
  const ticks = '<div class="ticks" aria-hidden="true">' + [0, 12, 24, 36, 48, 60].map(i => "<span>" + hm((toMin(tr.start) + i * tr.step_minutes) % 1440) + "</span>").join("") + "</div>";
  const limPct = ((lim + 10) / 340 * 100).toFixed(2);
  const act = L.activity, pr = L.pairs, nu = L.numbers, wo = L.world, cta = L.cta;
  return '<div class="land">'
    + '<header class="lhead"><span class="mark-t">Workshop Journey</span><a href="#/overview">Skip to the journey</a></header>'
    + '<section class="night" aria-labelledby="lh1"><div class="night-in">'
    + '<p class="lk reveal">' + esc(L.kicker) + '</p><h1 id="lh1" class="reveal">' + esc(L.headline) + '</h1><p class="lsub reveal">' + esc(L.sub) + "</p>"
    + '<figure class="trace" aria-label="' + esc(tr.label + ": " + degC(tr.temps[0]) + " at 22:00, above its " + degC(tr.limit) + " limit from 01:35, " + degC(tr.temps[tr.temps.length - 1]) + " at 08:00. No alarm. The night cost the pilot region €" + L.cost.count.toLocaleString("en-GB") + ".") + '">'
    + '<div class="readout" aria-hidden="true"><div><span class="rl">Clock</span><b class="num" id="lclock">22:00</b></div><div><span class="rl">' + esc(tr.label) + '</span><b class="num" id="ltemp">' + degC(tr.temps[0]) + '</b></div><div class="alarm"><span class="rl">Freezer alarms</span><b class="num" id="lalarm">0</b></div>'
    + '<div class="cost" id="lcost"><span class="rl">' + esc(L.cost.label.charAt(0).toUpperCase() + L.cost.label.slice(1)) + '</span><b class="num"><span class="count-up" id="lcostn" data-count="' + L.cost.count + '" data-i="' + esc(JSON.stringify({prefix: "€", count: L.cost.count})) + '">€0</span></b><span class="chain">' + esc(L.cost.chain) + "</span></div></div>"
    + '<div class="plot"><span class="limit-t" style="top:' + limPct + '%" aria-hidden="true">Food-safety limit ' + degC(tr.limit).replace(".0", "") + "</span>"
    + '<svg viewBox="-4 -10 1008 340" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="heat" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="' + g.H + '"><stop offset="0" stop-color="var(--hot)"/><stop offset="' + (lim / g.H).toFixed(3) + '" stop-color="var(--hot)"/><stop offset="' + (lim / g.H).toFixed(3) + '" stop-color="var(--cold)"/><stop offset="1" stop-color="var(--cold)"/></linearGradient>'
    + '<clipPath id="reveal"><rect id="lclip" x="-4" y="-10" width="0" height="340"/></clipPath></defs>'
    + '<line class="limit" x1="0" x2="' + g.W + '" y1="' + lim.toFixed(1) + '" y2="' + lim.toFixed(1) + '"/>'
    + '<g clip-path="url(#reveal)"><path class="tline" d="' + g.d + '"/></g></svg><span id="ldot" aria-hidden="true"></span></div>' + ticks
    + '<figcaption>' + esc(tr.note) + ' <button type="button" class="link" id="lreplay">Replay the night</button></figcaption></figure>'
    + '<button type="button" class="scrollcue" id="lcue">Read on</button></div></section>'

    + '<section class="lsec act" id="act" aria-labelledby="acth"><h2 id="acth" class="reveal">' + esc(act.title) + '</h2><div class="brace"><span class="bl reveal" aria-hidden="true">' + esc(act.activity_label) + '</span><ol class="lines">'
    + act.lines.map((l, i) => '<li class="reveal" style="--d:' + (i * 140) + 'ms">' + esc(l) + "</li>").join("") + "</ol></div>"
    + '<p class="outcome reveal" style="--d:' + (act.lines.length * 140 + 200) + 'ms"><span class="ol" aria-hidden="true">' + esc(act.outcome_label) + "</span>" + esc(act.outcome) + "</p></section>"

    + '<section class="lsec" aria-labelledby="prh"><h2 id="prh" class="reveal">' + esc(pr.title) + '</h2><p class="lintro reveal">' + esc(pr.intro) + "</p>"
    + '<div class="pairs" role="table" aria-label="' + esc(pr.title) + '"><div class="prow ph" role="row"><span role="columnheader">' + esc(pr.left) + '</span><span role="columnheader">' + esc(pr.right) + "</span></div>"
    + pr.rows.map((r, i) => '<div class="prow reveal" role="row" style="--d:' + (i * 110) + 'ms"><span role="cell" class="po">' + esc(r.output) + '</span><span role="cell" class="pc">' + esc(r.outcome) + "</span></div>").join("") + "</div></section>"

    + '<section class="lsec" aria-labelledby="nuh"><h2 id="nuh" class="reveal">' + esc(nu.title) + '</h2><p class="lintro reveal">' + esc(nu.intro) + '</p><ul class="nums">'
    + nu.items.map((it, i) => '<li class="reveal" style="--d:' + (i * 90) + 'ms"><b class="big num">' + countHtml(it) + "</b><span>" + esc(it.label) + '</span><span class="goal">Goal: ' + esc(it.goal) + "</span></li>").join("") + "</ul></section>"

    + '<section class="lsec world" aria-labelledby="woh"><h2 id="woh" class="reveal">' + esc(wo.title) + '</h2><p class="lintro reveal">' + esc(wo.intro) + '</p><ul class="wl">'
    + wo.items.map((it, i) => '<li class="reveal" style="--d:' + (i * 120) + 'ms"><b class="big num">' + countHtml(it) + "</b><p>" + esc(it.text) + '</p><a class="src" href="' + esc(it.url) + '" target="_blank" rel="noopener">' + esc(it.source) + "</a></li>").join("") + "</ul></section>"

    + '<section class="lsec cta" aria-labelledby="ctah"><h2 id="ctah" class="reveal">' + esc(cta.title) + '</h2><p class="lintro reveal">' + esc(cta.text) + '</p><div class="ctas reveal"><a class="go" href="#/overview"><b>' + esc(cta.button) + '</b><span>11 chapters, three days, one night to fix</span></a><a class="mon" href="/#/business">Open the Business impact screen</a></div>'
    + '<p class="foot">Zava, Inc. is fictitious and every Zava figure is synthetic. The figures in “' + esc(wo.title) + '” are real and cited.</p></section></div>';
}
const LAND = {raf: 0, io: null};
const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
function stopLanding() { cancelAnimationFrame(LAND.raf); if (LAND.io) LAND.io.disconnect(); LAND.io = null; }
function countUp(el, ms) {
  const it = JSON.parse(el.dataset.i), to = Number(el.dataset.count);
  if (reduced() || !to) { el.textContent = fmtCount(it, to); return; }
  const t0 = performance.now();
  const step = now => { const p = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - p, 3); el.textContent = fmtCount(it, to * e); if (p < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}
function playNight() {
  const tr = J.doc.landing.trace, g = traceGeometry(tr), n = tr.temps.length - 1;
  const clip = $("lclip"), dot = $("ldot"), clock = $("lclock"), temp = $("ltemp"), cost = $("lcost");
  if (!clip) return;
  cancelAnimationFrame(LAND.raf);
  cost.classList.remove("in"); $("lcostn").textContent = "€0";
  const show = f => {
    const i = Math.min(n, Math.floor(f * n)), c = tr.temps[i];
    clip.setAttribute("width", (f * g.W + 8).toFixed(1));
    // The chart stretches unevenly, so the dot is placed in percentages to stay round.
    dot.style.left = ((g.x(f * n) + 4) / 1008 * 100).toFixed(2) + "%"; dot.style.top = ((g.y(c) + 10) / 340 * 100).toFixed(2) + "%";
    dot.classList.toggle("hot", c > tr.limit); temp.classList.toggle("hot", c > tr.limit);
    clock.textContent = hm((toMin(tr.start) + Math.round(f * n * tr.step_minutes)) % 1440);
    temp.textContent = degC(c);
  };
  const finish = () => { show(1); cost.classList.add("in"); countUp($("lcostn"), reduced() ? 0 : 1400); };
  if (reduced()) { finish(); return; }
  const dur = 6500, t0 = performance.now();
  // The first frame's timestamp can be a little earlier than t0, so keep progress between 0 and 1.
  const frame = now => { const f = Math.max(0, Math.min(1, (now - t0) / dur)); show(f); if (f < 1) LAND.raf = requestAnimationFrame(frame); else finish(); };
  LAND.raf = requestAnimationFrame(frame);
}
afterRender.landing = el => {
  const items = el.querySelectorAll(".reveal");
  if (reduced() || !("IntersectionObserver" in window)) items.forEach(x => x.classList.add("in"));
  else {
    LAND.io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add("in"); LAND.io.unobserve(e.target);
      e.target.querySelectorAll(".count-up").forEach(c => countUp(c, 1200));
    }), {threshold: 0.2});
    items.forEach(x => LAND.io.observe(x));
    el.querySelectorAll(".nums .count-up, .wl .count-up").forEach(c => { c.textContent = fmtCount(JSON.parse(c.dataset.i), 0); });
  }
  playNight();
  $("lreplay").onclick = playNight;
  $("lcue").onclick = () => $("act").scrollIntoView({behavior: reduced() ? "auto" : "smooth"});
};

/* ---------- overview ---------- */
function viewOverview() {
  document.title = "Workshop Journey · Zava";
  const o = J.doc.outcome, role = J.role, last = store.get("zj-last");
  const start = {attendee: ["02", "Start with chapter 02, Setup", "Do it before Day 1, so the morning can start with the story."],
    coach: ["03", "Start with chapter 03, Design Thinking", "It has the five character cards you play on Day 1."],
    facilitator: [null, "Start with the Day 1 plan", "Every session, break and checkpoint, and what to prepare the night before."]}[role];
  const others = Object.keys(ROLES).filter(r => r !== role).map(r => '<button type="button" class="link" data-setrole="' + r + '">' + ROLES[r].toLowerCase() + "</button>").join(" or ");
  const map = J.order.map(id => {
    const c = J.ch[id], h = c.hve || {};
    const tag = h.stage ? "Stage " + h.stage : h.dt_methods ? "DT" : "Scene";
    return '<li class="' + (h.stage ? "stage" : "extra") + '"><a href="#/ch/' + id + '"><span class="mt">' + esc(tag) + '</span><span class="mn">' + id + '</span><span class="ml">' + esc(c.short) + "</span></a></li>";
  }).join("");
  let prep = "";
  if (role === "facilitator") {
    prep = '<section class="block"><h2>Before each session</h2>' + J.doc.days.map(d => {
      const items = J.order.filter(id => firstDay(id) === d.n).flatMap(id => ((J.ch[id].facilitator || {}).before || []));
      return items.length ? '<details class="fold"><summary>Day ' + d.n + ": " + plural(items.length, "thing", "things") + " to prepare</summary>" + list(items) + "</details>" : "";
    }).join("") + "</section>";
  }
  return '<div class="page">'
    + (last && J.ch[last] ? '<p class="resume">You were last on <a href="#/ch/' + last + '">' + esc(chName(last)) + "</a>.</p>" : "")
    + '<header class="hero"><h1>' + esc(o.title) + '</h1><p class="lede">' + md(o.story) + "</p></header>"
    + '<dl class="trio"><div><dt>The outcome</dt><dd>' + md(o.statement) + "</dd></div><div><dt>How it’s measured</dt><dd>" + md(o.measure) + "</dd></div><div><dt>What must not change</dt><dd>" + md(o.must_not_change) + "</dd></div></dl>"
    + '<p class="figures">' + o.figures.map(f => '<span><b class="num">' + esc(f.value) + "</b> " + esc(f.label) + "</span>").join("") + "</p>"
    + '<section class="begin"><a class="go" href="' + (start[0] ? "#/ch/" + start[0] : "#/day/1") + '"><b>' + esc(start[1]) + "</b><span>" + esc(start[2]) + "</span></a>"
    + '<p class="small">Here as a ' + others + '? Switch the view. New to HVE Core? <a href="#/artifacts/brd">Follow one requirement through every chapter</a>.</p></section>'
    + '<section class="block"><h2>Eleven chapters on HVE Core’s nine stages</h2><p class="small">Chapter 01 sets the scene and chapter 03 is Design Thinking, which feeds the lifecycle. The other nine are HVE Core’s stages, in order. Work can go back: review sends a fix back to implementation, and operations can send a hotfix.</p><ol class="lifemap">' + map + "</ol></section>"
    + prep
    + '<p class="foot">Agent and skill names checked against <a href="https://microsoft.github.io/hve-core/docs/hve-guide/" target="_blank" rel="noopener">HVE Core’s documentation</a> on ' + esc(longDate(J.doc.hve_core_checked)) + ". Zava, Inc. is fictitious and every figure is synthetic.</p></div>";
}

/* ---------- day ---------- */
function viewDay(id, q) {
  const n = Number(id), d = J.doc.days.find(x => x.n === n);
  if (!d) return notFound();
  const track = q.get("track") === "one-day" ? "one-day" : "three-day";
  document.title = (track === "one-day" ? "One-day track" : "Day " + n) + " · Workshop Journey · Zava";
  const rows = sessions(track).filter(s => s.day === (track === "one-day" ? 1 : n));
  const sw = '<div class="seg" role="group" aria-label="Workshop length"><a href="#/day/' + (track === "one-day" ? 1 : n) + '"' + (track === "three-day" ? ' aria-current="true"' : "") + ">Three days</a><a href=\"#/day/1?track=one-day\"" + (track === "one-day" ? ' aria-current="true"' : "") + ">One day</a></div>";
  const head = track === "one-day"
    ? '<header class="hero"><p class="kicker">One-day track</p><h1>The whole journey in a day</h1><p class="lede">The run sheet from <code translate="no">docs/facilitator.md</code>. Chapter 02 becomes pre-work, the 10:45 break stands in for chapters 06 and 07, and chaos cards during the Investment Board stand in for chapter 11.</p></header>'
    : '<header class="hero"><p class="kicker">Day ' + n + " of 3</p><h1>" + esc(d.theme) + '</h1><p class="lede">By the end of the day: ' + esc(d.checkpoint.what.charAt(0).toLowerCase() + d.checkpoint.what.slice(1)) + ". " + esc(d.checkpoint.who) + ".</p></header>";
  const LABEL = {break: "Break", lunch: "Lunch", recap: "Recap", debrief: "Debrief", checkpoint: "Checkpoint"};
  const body = rows.map(s => {
    const quiet = !s.chapter && (s.kind === "break" || s.kind === "lunch");
    if (quiet) return '<li class="pause"><span class="t num">' + esc(s.start) + "</span><span>" + esc(LABEL[s.kind]) + ", " + esc(dur(s.minutes)) + (s.what !== LABEL[s.kind] ? ". " + md(s.what.replace(/^(Break|Lunch)\.\s*/, "")) : "") + "</span></li>";
    return '<li class="' + s.kind + '"><span class="t num">' + esc(s.start) + '</span><div><p class="what">' + (s.chapter ? '<a href="#/ch/' + s.chapter + '">' + esc(chName(s.chapter)) + "</a>" : esc(LABEL[s.kind] || "")) + (s.kind === "checkpoint" ? ' <span class="pill">Checkpoint</span>' : "") + '<span class="len">' + esc(dur(s.minutes)) + "</span></p><p>" + md(s.what) + "</p></div></li>";
  }).join("");
  let prep = "";
  if (J.role === "facilitator" && track === "three-day") {
    const items = J.order.filter(c => firstDay(c) === n).flatMap(c => ((J.ch[c].facilitator || {}).before || []).map(x => [c, x]));
    if (items.length) prep = '<details class="fold"><summary>Before each session: ' + plural(items.length, "thing", "things") + " to prepare</summary><ul>" + items.map(([c, x]) => "<li>" + md(x) + ' <span class="small">' + esc(chName(c)) + "</span></li>").join("") + "</ul></details>";
  }
  const debrief = J.role === "facilitator" && rows.some(s => s.kind === "debrief") && (J.doc.debrief || []).length ? '<section class="block"><h2>Debrief questions</h2>' + list(J.doc.debrief) + "</section>" : "";
  const pn = track === "three-day" ? '<nav class="pn" aria-label="Days">' + (n > 1 ? '<a href="#/day/' + (n - 1) + '">Day ' + (n - 1) + "</a>" : "<span></span>") + (n < J.doc.days.length ? '<a class="nx" href="#/day/' + (n + 1) + '">Day ' + (n + 1) + ": " + esc(J.doc.days[n].theme) + "</a>" : "") + "</nav>" : "";
  return '<div class="page">' + head + sw + '<ol class="timeline">' + body + "</ol>" + prep + debrief + pn + "</div>";
}

/* ---------- chapter ---------- */
function prompts(c, open) {
  const ps = (c.attendee || {}).prompts || [];
  return ps.map((p, i) => '<figure class="prompt"><figcaption><span>' + esc(p.label) + '</span><button type="button" class="copy" data-copy="pr-' + i + '" aria-label="Copy prompt: ' + esc(p.label) + '">Copy</button></figcaption><pre translate="no" id="pr-' + i + '">' + esc(p.text) + "</pre></figure>").join("");
}
function toolsHtml(c) {
  return c.tools && c.tools.length ? '<dl class="tools">' + c.tools.map(t => '<div><dt><b translate="no">' + esc(t.name) + '</b><kbd translate="no">' + esc(t.open) + "</kbd></dt><dd>" + md(t.for) + "</dd></div>").join("") + "</dl>" : "";
}
function artBlock(id) {
  const a = J.art[id]; if (!a) return "";
  const s = J.status[id] || {};
  const found = s.exists && s.matches && s.matches.length ? '<p class="small">Changed ' + esc(when(s.modified)) + (s.count > 1 ? ", newest of " + s.count : "") + "</p>" : "";
  return '<div class="art" id="art-' + id + '"><p class="art-n">' + esc(a.name) + (a.optional ? ' <span class="small">optional</span>' : "") + "</p>" + stHtml(id)
    + (a.path ? '<p class="path"><code translate="no">' + esc(a.path) + "</code></p>" : '<p class="small">' + esc(a.made_by) + "</p>") + found
    + '<div class="acts">' + (s.exists && a.kind === "create" ? '<button type="button" class="link" data-preview="' + id + '" data-which="yours">Preview yours</button>' : "")
    + (a.reference ? '<button type="button" class="link ref" data-preview="' + id + '" data-which="reference" aria-describedby="spoil">See the facilitator’s example</button>' : "") + "</div>"
    + '<div class="pv" id="pv-' + id + '" hidden></div></div>';
}
function viewChapter(id) {
  const c = J.ch[id];
  if (!c) return '<div class="page narrow"><h1>There’s no chapter ' + esc(id) + '</h1><p class="lede">The workshop has chapters 01 to 11. <a href="#/overview">Go to the overview</a>.</p></div>';
  store.set("zj-last", id);
  document.title = c.id + " " + c.title + " · Workshop Journey · Zava";
  const a = c.attendee || {}, co = c.coach || {}, f = c.facilitator || {}, role = J.role;
  const i = J.order.indexOf(id), next = J.order[i + 1], prev = J.order[i - 1];
  const t = ticks(id), doneN = t.filter(Boolean).length;

  let primary;
  if (role === "facilitator") {
    primary = '<h2>Run the session</h2>'
      + ((f.before || []).length ? '<h3>Before you start</h3>' + list(f.before, "ul", "checkish") : "")
      + ((f.run || []).length ? '<h3>In the room</h3><ol class="run">' + f.run.map(r => '<li><span class="t num">' + esc(r.at) + '</span><span class="len">' + esc(dur(r.minutes)) + "</span><p>" + md(r.do) + "</p></li>").join("") + "</ol>" : "")
      + (f.demo ? '<h3>Show on screen</h3><p>' + md(f.demo) + "</p>" : "")
      + (toolsHtml(c) ? "<h3>Tools tables use</h3>" + toolsHtml(c) : "")
      + ((a.prompts || []).length ? '<details class="fold"><summary>The prompts tables start with</summary>' + prompts(c) + "</details>" : "");
  } else if (role === "coach") {
    primary = '<h2>Ask this</h2>' + list(co.ask, "ul", "asks")
      + ((co.step_in || []).length ? "<h3>Step in when</h3>" + list(co.step_in) : "")
      + ((co.mistakes || []).length ? "<h3>Mistakes tables make</h3>" + list(co.mistakes) : "")
      + ((co.character || []).length ? '<details class="fold"><summary>The five character cards</summary>' + co.character.map(x => '<div class="cardlet"><h4>' + esc(x.role) + '</h4><dl><dt>Knows</dt><dd>' + md(x.knows) + "</dd><dt>Believes</dt><dd>" + md(x.believes) + "</dd><dt>Won’t volunteer</dt><dd>" + md(x.wont_volunteer) + "</dd><dt>Line</dt><dd>" + md(x.line) + "</dd></dl></div>").join("") + "</details>" : "");
  } else {
    primary = '<h2>Your task</h2><p class="goal">' + md(c.objective) + "</p>" + list(a.steps, "ol", "steps") + prompts(c)
      + (toolsHtml(c) ? "<h3>Tools</h3>" + toolsHtml(c) : "")
      + ((c.words || []).length ? '<details class="fold"><summary>Words used in this workshop</summary><dl class="words">' + c.words.map(w => '<dt translate="no">' + md(w.term) + "</dt><dd>" + md(w.meaning) + "</dd>").join("") + "</dl></details>" : "");
  }
  const done = '<section class="block" id="done"><h2>Done when <span class="count" id="donecount">' + doneN + " of " + t.length + "</span></h2>"
    + '<ul class="checks">' + (c.done_when || []).map((x, k) => '<li><label><input type="checkbox" data-tick="' + k + '"' + (t[k] ? " checked" : "") + "><span>" + md(x) + "</span></label></li>").join("") + "</ul>"
    + (role === "facilitator" && f.good_answer ? '<p class="answer"><b>A good answer.</b> ' + md(f.good_answer) + "</p>" : "")
    + '<p class="small">Ticks stay in this browser. <button type="button" class="link" data-reset>Clear them</button></p></section>';
  const stuckItems = (c.stuck || []).map(s => "<dt>" + md(s.if) + "</dt><dd>" + md(s.then) + "</dd>").join("");
  const watch = role === "facilitator" && (f.watch_for || []).length ? "<h3>Watch for</h3>" + list(f.watch_for) : "";
  const stuck = stuckItems || watch ? '<details class="fold" id="stuck"><summary>' + (role === "facilitator" ? "If a table stalls" : "If you get stuck") + "</summary>" + watch + (stuckItems ? '<dl class="ifthen">' + stuckItems + "</dl>" : "") + "</details>" : "";

  const uses = (c.needs || []).filter(n => J.art[n]).map(n => '<li><a href="#/ch/' + J.art[n].chapter + '">' + esc(J.art[n].name) + "</a> " + stHtml(n) + "</li>").join("");
  const margin = '<aside class="margin" aria-label="Around this chapter">'
    + '<div class="m"><h2>The story so far</h2><p>' + md(c.scenario) + "</p></div>"
    + ((c.produces || []).length ? '<div class="m"><h2>You’ll produce</h2>' + c.produces.map(artBlock).join("") + '<p class="small" id="spoil">The facilitator’s example comes from a recorded run of this workshop and gives away the answer.</p></div>' : "")
    + (uses ? '<div class="m"><h2>Built on</h2><ul class="uses">' + uses + "</ul></div>" : "")
    + ((c.monitor || []).length ? '<div class="m"><h2>In the monitor</h2><p>' + c.monitor.map(m => '<a href="/#/' + esc(m.route) + '">' + esc(m.label) + "</a>").join(", ") + "</p></div>" : "")
    + ((c.loops || []).length ? '<div class="m"><h2>Can go back</h2><ul>' + c.loops.map(l => '<li><a href="#/ch/' + l.to + '">' + esc(chName(l.to)) + "</a>: " + md(l.when) + "</li>").join("") + "</ul></div>" : "")
    + ((c.references || []).length ? '<div class="m"><h2>Read more</h2><ul>' + c.references.map(r => "<li>" + md("[" + r.label + "](" + r.target + ")") + "</li>").join("") + "</ul></div>" : "")
    + "</aside>";
  const h = c.handoff || {};
  const nextBlock = next ? '<a class="next" href="#/ch/' + next + '"><span class="nl">Next</span><span class="nt"><span class="nn">' + next + "</span> " + esc(J.ch[next].title) + "</span>" + (h.note ? '<span class="nd">' + md(h.note).replace(/<a [^>]*>|<\/a>/g, "") + "</span>" : "") + "</a>"
    : '<a class="next" href="#/day/3"><span class="nl">That’s the journey</span><span class="nt">Back to Day 3 and the debrief</span></a>';
  return '<article class="page chapter">'
    + '<header class="hero"><p class="kicker">' + chSpans(id).map(s => esc(s.text)).join(" and ") + '<span class="sep" aria-hidden="true"></span>' + (c.hve && c.hve.docs ? '<a href="' + esc(c.hve.docs) + '" target="_blank" rel="noopener">' + esc(hveLabel(c)) + "</a>" : esc(hveLabel(c))) + "</p>"
    + '<h1><span class="bignum" aria-hidden="true">' + c.id + '</span><span class="sr">Chapter ' + c.id + ": </span>" + esc(c.title) + '</h1><p class="lede">' + md(c.why) + "</p></header>"
    + '<div class="grid"><div class="col"><section class="primary block" id="task">' + primary + "</section>" + done + stuck + "</div>" + margin + "</div>"
    + nextBlock + (prev ? '<p class="prev"><a href="#/ch/' + prev + '">Back to ' + esc(chName(prev)) + "</a></p>" : "")
    + "</article>";
}
afterRender.ch = el => {
  const id = J.r.id; if (!J.ch[id]) return;
  const s = J.r.q.get("s");
  const target = s && $({do: "task", ask: "task", run: "task", done: "done", stuck: "stuck", produce: "art-" + ((J.ch[id].produces || [])[0] || "")}[s] || "");
  if (target) { if (target.tagName === "DETAILS") target.open = true; setTimeout(() => target.scrollIntoView({block: "start"}), 0); }
  el.querySelectorAll("[data-tick]").forEach(b => b.onchange = () => {
    store.set("zj-done:" + id + ":" + b.dataset.tick, b.checked ? "1" : null);
    const t = ticks(id); $("donecount").textContent = t.filter(Boolean).length + " of " + t.length;
    nav("ch", id);
  });
  const reset = el.querySelector("[data-reset]");
  if (reset) reset.onclick = () => {
    const before = ticks(id);
    before.forEach((_, i) => store.set("zj-done:" + id + ":" + i, null));
    route();
    const t = toast("Cleared your ticks for chapter " + id + ".");
    const u = document.createElement("button"); u.type = "button"; u.className = "link"; u.textContent = "Undo";
    u.onclick = () => { before.forEach((v, i) => store.set("zj-done:" + id + ":" + i, v ? "1" : null)); t.remove(); route(); };
    t.appendChild(u);
  };
};

/* ---------- artifacts ---------- */
// Columns follow the chapters. Neighbouring chapters share a column when together they hold four artifacts or fewer,
// so the whole lineage fits a laptop screen without sideways scrolling.
function layout() {
  const count = c => J.doc.artifacts.filter(a => a.chapter === c).length;
  const cols = [];
  J.order.filter(count).forEach(c => {
    const last = cols[cols.length - 1];
    if (last && last.length < 2 && last.reduce((n, x) => n + count(x), 0) + count(c) <= 4) last.push(c); else cols.push([c]);
  });
  const W = 138, H = 56, GX = 30, GY = 14, TOP = 46;
  const pos = {};
  cols.forEach((group, ci) => J.doc.artifacts.filter(a => group.includes(a.chapter))
    .sort((a, b) => J.order.indexOf(a.chapter) - J.order.indexOf(b.chapter))
    .forEach((a, ri) => { pos[a.id] = {x: 22 + ci * (W + GX), y: TOP + ri * (H + GY), w: W, h: H}; }));
  const rows = Math.max(...cols.map(g => g.reduce((n, c) => n + count(c), 0)));
  return {cols, pos, W, H, GX, width: 30 + cols.length * (W + GX) - GX, height: TOP + rows * (H + GY)};
}
function wrap(text, n) {
  const out = [""];
  text.split(" ").forEach(w => { if ((out[out.length - 1] + " " + w).trim().length > n && out[out.length - 1]) out.push(w); else out[out.length - 1] = (out[out.length - 1] + " " + w).trim(); });
  return out.slice(0, 2);
}
function viewArtifacts(sel, q) {
  document.title = "Artifacts · Workshop Journey · Zava";
  const narrow = window.matchMedia("(max-width: 700px)").matches;
  const mode = q.get("view") || (narrow ? "list" : "diagram");
  const a = sel && J.art[sel];
  const rel = a ? new Set([a.id, ...a.reads, ...(a.read_by || [])]) : null;
  const qs = over => { const p = new URLSearchParams(q); Object.entries(over).forEach(([k, v]) => v == null ? p.delete(k) : p.set(k, v)); const s = p.toString(); return s ? "?" + s : ""; };
  const base = "#/artifacts" + (sel ? "/" + sel : "");
  const toolbar = '<div class="seg" role="group" aria-label="Show as"><a href="' + base + qs({view: "diagram"}) + '"' + (mode !== "list" ? ' aria-current="true"' : "") + '>Diagram</a><a href="' + base + qs({view: "list"}) + '"' + (mode === "list" ? ' aria-current="true"' : "") + ">List</a></div>";
  let body;
  if (mode === "list") {
    body = '<ol class="alist">' + J.order.map(c => {
      const arts = J.doc.artifacts.filter(x => x.chapter === c);
      return arts.length ? '<li><p class="ach"><a href="#/ch/' + c + '">' + esc(chName(c)) + "</a></p>" + arts.map(x => '<div class="arow' + (x.id === sel ? " sel" : "") + '"><a class="an" href="#/artifacts/' + x.id + qs({}) + '">' + esc(x.name) + "</a>" + stHtml(x.id)
        + '<p class="small">Made by ' + esc(x.made_by) + (x.reads.length ? ". Built on " + x.reads.map(r => esc(J.art[r].name)).join(", ") : "") + ".</p></div>").join("") + "</li>" : "";
    }).join("") + "</ol>";
  } else {
    const L = layout();
    const edges = J.doc.artifacts.flatMap(x => x.reads.filter(r => L.pos[r]).map(r => [r, x.id]));
    const path = (s, t) => {
      const A = L.pos[s], B = L.pos[t];
      if (A.x === B.x) { const x = A.x, y1 = A.y + A.h / 2, y2 = B.y + B.h / 2; return "M" + x + " " + y1 + " C" + (x - 18) + " " + y1 + " " + (x - 18) + " " + y2 + " " + x + " " + y2; }
      const x1 = A.x + A.w, y1 = A.y + A.h / 2, x2 = B.x, y2 = B.y + B.h / 2, m = (x2 - x1) / 2;
      return "M" + x1 + " " + y1 + " C" + (x1 + m) + " " + y1 + " " + (x2 - m) + " " + y2 + " " + x2 + " " + y2;
    };
    body = '<div class="graph"><svg viewBox="0 0 ' + L.width + " " + L.height + '" width="' + L.width + '" height="' + L.height + '" role="group" aria-label="How the artifacts build on each other. Each one links to its details.">'
      + L.cols.map((g, ci) => g.map((c, li) => '<text class="colh" x="' + (22 + ci * (L.W + L.GX)) + '" y="' + (14 + li * 15) + '">' + esc(c + " " + J.ch[c].short) + "</text>").join("")).join("")
      + edges.map(([s, t]) => '<path class="edge' + (rel ? (rel.has(s) && rel.has(t) && (s === sel || t === sel) ? " on" : " dim") : "") + '" d="' + path(s, t) + '"/>').join("")
      + J.doc.artifacts.map(x => {
        const p = L.pos[x.id], st = statusOf(x), lines = wrap(x.name, 18);
        return '<a href="#/artifacts/' + x.id + qs({}) + '" class="node k-' + x.kind + " s-" + st.cls + (x.id === sel ? " sel" : "") + (rel && !rel.has(x.id) ? " dim" : "") + '" aria-label="' + esc(x.name + ", chapter " + x.chapter + ", " + st.label) + '">'
          + '<rect x="' + p.x + '" y="' + p.y + '" width="' + p.w + '" height="' + p.h + '" rx="6"/>'
          + lines.map((l, i) => '<text x="' + (p.x + 10) + '" y="' + (p.y + 19 + i * 15) + '">' + esc(l) + "</text>").join("")
          + '<circle class="sd" cx="' + (p.x + 13) + '" cy="' + (p.y + p.h - 11) + '" r="3.5"/><text class="stt" x="' + (p.x + 22) + '" y="' + (p.y + p.h - 7) + '">' + esc({found: x.kind === "repo" ? "Ships with the repo" : "Found", missing: "Not found", outside: "Outside the repo", unknown: "Unknown"}[st.cls]) + "</text></a>";
      }).join("") + "</svg></div>";
  }
  const panel = a ? '<aside class="apanel margin" aria-label="' + esc(a.name) + '"><div class="m"><p class="kicker">Chapter ' + a.chapter + ", " + esc(J.ch[a.chapter].short) + '</p><h2 class="ph">' + esc(a.name) + '</h2><a class="close" href="#/artifacts' + qs({}) + '">Close</a>'
    + '<dl class="kv"><dt>Made by</dt><dd>' + esc(a.made_by) + "</dd><dt>Built on</dt><dd>" + (a.reads.map(r => '<a href="#/artifacts/' + r + qs({}) + '">' + esc(J.art[r].name) + "</a>").join(", ") || "Nothing earlier") + "</dd><dt>Read by</dt><dd>" + ((a.read_by || []).map(r => '<a href="#/artifacts/' + r + qs({}) + '">' + esc(J.art[r].name) + "</a>").join(", ") || "Nothing later") + "</dd></dl>"
    + artBlock(a.id) + '<p class="small" id="spoil">The facilitator’s example gives away the answer.</p><p><a href="#/ch/' + a.chapter + '">Open chapter ' + a.chapter + "</a></p></div></aside>" : "";
  return '<div class="page wide"><header class="hero"><h1>How one night becomes a funded fix</h1><p class="lede">Each chapter leaves a file or a decision that a later one builds on. Select one to see what it’s built from and what uses it.</p></header>'
    + '<div class="atool">' + toolbar + '<p class="small">Status checks this computer only, so a file on another table’s laptop shows as not found.</p></div>'
    + '<div class="abody' + (a ? " has-panel" : "") + '">' + body + panel + "</div></div>";
}
afterRender.artifacts = el => {
  const s = el.querySelector(".node.sel, .arow.sel .an"); if (!s) return;
  s.focus({preventScroll: true});
  // Bring the selected artifact into the middle of the diagram when the panel leaves less room.
  const g = el.querySelector(".graph"), r = s.querySelector && s.querySelector("rect");
  if (g && r && g.scrollWidth > g.clientWidth) g.scrollLeft = Number(r.getAttribute("x")) - g.clientWidth / 2 + 70;
};
document.addEventListener("keydown", e => {
  if (e.key !== "Escape") return;
  if (document.body.classList.contains("navopen")) { setNav(false); $("navbtn").focus(); return; }
  if (J.r && J.r.view === "artifacts" && J.r.id) location.hash = "#/artifacts" + (J.r.q.toString() ? "?" + J.r.q : "");
});

/* ---------- shared clicks ---------- */
document.addEventListener("click", async e => {
  const cp = e.target.closest("[data-copy]");
  if (cp) {
    const text = $(cp.dataset.copy).textContent;
    try { await navigator.clipboard.writeText(text); } catch (x) { const r = document.createRange(); r.selectNodeContents($(cp.dataset.copy)); getSelection().removeAllRanges(); getSelection().addRange(r); }
    cp.textContent = "Copied"; cp.classList.add("ok"); toast("Prompt copied"); setTimeout(() => { cp.textContent = "Copy"; cp.classList.remove("ok"); }, 2000);
    return;
  }
  const rl = e.target.closest("[data-setrole]");
  if (rl) { setRole(rl.dataset.setrole, true); return; }
  const pv = e.target.closest("[data-preview]");
  if (pv) {
    const box = $("pv-" + pv.dataset.preview); if (!box) return;
    box.hidden = false; box.innerHTML = '<p class="small">Loading…</p>';
    try {
      const r = await fetch("/api/journey/preview?id=" + encodeURIComponent(pv.dataset.preview) + "&which=" + pv.dataset.which);
      if (!r.ok) { box.innerHTML = '<p class="small">' + (pv.dataset.which === "reference" ? "The reference run doesn’t have this file." : "This file can’t be previewed. It may have moved, or it isn’t a text document.") + "</p>"; return; }
      const d = await r.json();
      box.innerHTML = '<div class="pv-h"><code translate="no">' + esc(d.path) + '</code><span><a href="' + esc(d.vscode) + '">Open in VS Code</a><button type="button" class="link" data-closepv="' + esc(pv.dataset.preview) + '">Close</button></span></div><pre>' + esc(d.text) + "</pre>"
        + (d.truncated ? '<p class="small">The preview stops here. Open it in VS Code to read the rest; the link needs VS Code on this computer.</p>' : "");
    } catch (x) { box.innerHTML = '<p class="small">The preview didn’t load. Is the server still running?</p>'; }
    return;
  }
  const cl = e.target.closest("[data-closepv]");
  if (cl) { const b = $("pv-" + cl.dataset.closepv); b.hidden = true; b.innerHTML = ""; }
  if (e.target.closest("#nav a")) setNav(false);
});

/* ---------- role ---------- */
function setRole(r, announce) {
  if (!ROLES[r]) r = "attendee";
  J.role = r; store.set("zj-role", r);
  document.querySelectorAll("#role input").forEach(i => { i.checked = i.value === r; });
  document.body.dataset.role = r;
  if (announce) { toast("Showing the " + ROLES[r].toLowerCase() + " view"); route(); }
}
document.querySelectorAll("#role input").forEach(i => i.onchange = () => setRole(i.value, true));

/* ---------- status ---------- */
function paintStatus() {
  document.querySelectorAll("[data-st]").forEach(el => { const s = statusOf(J.art[el.dataset.st]); el.className = "st " + s.cls; el.lastChild.textContent = s.label; });
}
async function refreshStatus() {
  try {
    const r = await fetch("/api/journey/status");
    if (!r.ok) throw new Error(r.status);
    const d = await r.json();
    const before = JSON.stringify(J.status);
    J.status = Object.fromEntries(d.artifacts.map(a => [a.id, a]));
    const changed = J.statusOk !== true || before !== JSON.stringify(J.status);
    J.statusOk = true;
    if (changed) { if (keepFocus()) paintStatus(); else route(); }
  } catch (e) {
    if (J.statusOk !== false) { J.statusOk = false; paintStatus(); toast("Couldn’t check which files exist."); }
  }
}
// Don't re-render under someone who is typing, reading a preview or has something open.
const keepFocus = () => { const a = document.activeElement; return (a && /^(INPUT|SELECT|TEXTAREA)$/.test(a.tagName)) || !!document.querySelector(".pv:not([hidden]), #jv details[open]"); };

/* ---------- start ---------- */
async function load() {
  try {
    const r = await fetch("/api/journey");
    const d = await r.json();
    if (!r.ok) throw d;
    J.doc = d;
    d.chapters.forEach(c => { J.ch[c.id] = c; });
    d.artifacts.forEach(a => { J.art[a.id] = a; });
    J.order = d.chapters.map(c => c.id);
  } catch (e) {
    const where = e && e.path ? "<code translate=\"no\">" + esc(e.path) + "</code>, " + esc(e.detail) : "the server didn’t answer";
    $("jv").innerHTML = '<div class="page narrow"><h1>The workshop content didn’t load</h1><p class="lede">Problem: ' + where + '.</p><p>Run <code translate="no">python -m unittest tests.test_journey</code> from the repo folder to see what’s wrong, fix the file, then reload this page.</p></div>';
    return;
  }
  setRole(store.get("zj-role") || "attendee", false);
  route();
  refreshStatus();
  setInterval(() => { if (document.visibilityState === "visible") refreshStatus(); }, 10000);
}
window.addEventListener("hashchange", () => {
  const before = J.r;
  route();
  const same = before && before.view === J.r.view && before.id === J.r.id;
  if (same && J.r.view === "artifacts") return;
  if (same && J.r.q.get("s")) return;
  window.scrollTo(0, 0);
  const h = $("jv").querySelector("h1"); if (h) { h.tabIndex = -1; h.focus({preventScroll: true}); }
});
load();
