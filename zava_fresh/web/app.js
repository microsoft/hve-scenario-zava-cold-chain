/* ZavaWatch operations console for Zava Fresh. No build step and no libraries. Fictitious data from the local simulator. */
"use strict";

const $ = id => document.getElementById(id);
const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[c]));
const get = u => fetch(u, {cache: "no-store"}).then(r => r.json());
const post = (u, b) => fetch(u, {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(b)}).then(r => r.json());
const eur = n => "€" + Math.round(Number(n || 0)).toLocaleString("en-IE");
const dur = m => m < 60 ? m + " min" : Math.floor(m / 60) + " h " + (m % 60) + " min";
const set = (el, html) => { if (el && el._h !== html) { el.innerHTML = html; el._h = html; } };
const tip = (text, cls) => '<span class="tip ' + (cls || "") + '" data-tip="' + esc(text) + '" tabindex="0"><span class="info">i</span></span>';

const LEVEL = {cold: "In range", chill: "In range", warn: "Near limit", over: "Over limit"};
const level = c => c.temp > c.limit ? "over" : c.temp > c.limit - 4 ? "warn" : c.kind === "freezer" ? "cold" : "chill";
const CAT = {"Meat and poultry": "🍗", "Fish and seafood": "🐟", "Ice cream and desserts": "🍨", "Frozen vegetables": "🥦", "Dairy": "🥛"};
const KINDS = ["alarm", "notify", "incident", "command", "access", "door", "action", "decision", "delivery", "staff", "zavaask"];
const KIND_HELP = {
  alarm: "ZavaWatch raised, acknowledged or cleared an alarm", notify: "A notification sent to a person, and whether it was delivered",
  incident: "A problem reported by staff", command: "A setpoint or defrost command sent to one or more cases",
  access: "A remote session on the vendor link", door: "A door sensor opened or closed", action: "A corrective action logged by staff",
  decision: "A food-safety decision", delivery: "A delivery and its receiving check", staff: "Staff on shift, rounds and arrivals",
  zavaask: "A question answered by ZavaAsk",
};

const app = {feed: [], kpis: null, route: "", view: null, rendered: 0, ready: false, chat: [],
  filters: {kinds: new Set(), store: "", serious: false}, alarmTab: "active", issueTab: "tickets"};

/* ---------- live stream and toasts ---------- */
function connect() {
  const es = new EventSource("/api/stream");
  es.onmessage = e => {
    const ev = JSON.parse(e.data);
    app.feed.push(ev);
    if (app.feed.length > 3000) app.feed.shift();
    if (app.ready) toastFor(ev);
    clearTimeout(app.fd); app.fd = setTimeout(feedChanged, 60);
  };
  es.addEventListener("reset", () => { app.feed = []; app.rendered = 0; app.ready = false; setTimeout(() => { app.ready = true; }, 1500); feedChanged(); });
  es.addEventListener("clock", e => {
    const c = JSON.parse(e.data);
    $("clock").textContent = c.time;
    $("phase").textContent = c.done ? "08:00 · night over" : c.paused ? "paused" : "simulated · ×" + c.speed;
    $("live").className = "live" + (c.done ? " over" : c.paused ? " paused" : "");
    $("livetxt").textContent = c.done ? "ENDED" : c.paused ? "PAUSED" : "LIVE";
    $("pause").setAttribute("aria-pressed", String(c.paused));
    $("pause").textContent = c.paused ? "Resume" : "Pause";
    document.querySelectorAll("[data-speed]").forEach(b => b.classList.toggle("on", Number(b.dataset.speed) === c.speed));
  });
  es.onerror = () => { $("livetxt").textContent = "OFFLINE"; };
}
function feedChanged() {
  $("nav-feed").textContent = app.feed.filter(e => e.severity !== "info").length || "";
  if (app.view && app.view.onFeed) app.view.onFeed();
  app.rendered = app.feed.length ? app.feed[app.feed.length - 1].seq : 0;
}
function toastFor(e) {
  let title = "";
  if (e.kind === "alarm" && /^Alarm A-\d+ \(/.test(e.message)) title = "New alarm";
  else if (e.kind === "notify" && /escalated/.test(e.message)) title = "Alarm escalated";
  else if (e.kind === "incident") title = "Incident reported";
  else if (e.kind === "command" && /cases in \d+ stores/.test(e.message)) title = "Fleet command";
  else if (e.kind === "access" && /opened/.test(e.message)) title = "Remote session";
  if (!title) return;
  const t = document.createElement("div");
  t.className = "toast" + (e.kind === "command" || e.kind === "access" ? " warn" : "");
  t.innerHTML = "<b>" + esc(title) + " · " + esc(e.time) + "</b>" + esc(e.message) + "<br><small>" + esc(e.source) + "</small>";
  t.onclick = () => { location.hash = e.kind === "incident" || e.kind === "alarm" || e.kind === "notify" ? "#/alarms" : "#/feed"; };
  $("toasts").appendChild(t);
  while ($("toasts").children.length > 4) $("toasts").firstChild.remove();
  setTimeout(() => { t.classList.add("out"); setTimeout(() => t.remove(), 300); }, 6500);
}

/* ---------- top bar ---------- */
async function refreshKpis() {
  const k = await get("/api/kpis");
  app.kpis = k;
  set($("story"), "<b>Night: " + esc(k.night) + "</b><span>·</span><span>" + esc(k.description) + "</span>");
  $("ver").textContent = "v" + k.version;
  const ns = $("nights"); if (ns && document.activeElement !== ns && ns.value !== k.night && [...ns.options].some(o => o.value === k.night)) ns.value = k.night;
  const nb = $("nav-alarm");
  nb.textContent = (k.alarms_unacked || k.incidents_open) ? (k.alarms_unacked + k.incidents_open) : "";
  nb.classList.toggle("pulse", k.alarms_unacked > 0);
  $("nav-food").textContent = k.cases_total - k.cases_in_range || "";
  $("nav-iss").textContent = k.issues_open || "";
  const v = $("vendor");
  v.hidden = !k.vendor_session;
  if (k.vendor_session) v.textContent = "● Remote session open: " + k.vendor_session.account + " since " + k.vendor_session.since;
}
function initTop() {
  get("/api/nights").then(n => { $("nights").innerHTML = n.nights.map(x => "<option" + (x === n.current ? " selected" : "") + ">" + esc(x) + "</option>").join(""); });
  $("replay").onclick = () => post("/api/replay", {night: $("nights").value}).then(tick);
  $("storybtn").onclick = () => storyStart($("nights").value);
  $("pause").onclick = () => post("/api/control", {paused: $("pause").getAttribute("aria-pressed") !== "true"});
  document.querySelectorAll("[data-speed]").forEach(b => { b.onclick = () => post("/api/control", {speed: Number(b.dataset.speed)}); });
  const jump = () => { const t = $("jump").value.trim(); if (/^\d{1,2}:\d{2}$/.test(t)) post("/api/control", {jump: t}).then(tick); };
  $("jumpbtn").onclick = jump;
  $("jump").onkeydown = e => { if (e.key === "Enter") jump(); };
}

/* ---------- shared pieces ---------- */
function countUp(el, to, fmt) {
  if (!el) return;
  const from = el._v == null ? 0 : el._v;
  el._v = to;
  if (from === to || matchMedia("(prefers-reduced-motion: reduce)").matches) { el.textContent = fmt(to); return; }
  const t0 = performance.now(), d = 600;
  const step = now => { const p = Math.min(1, (now - t0) / d), e = 1 - Math.pow(1 - p, 3); el.textContent = fmt(from + (to - from) * e); if (p < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}
function feedItem(e) {
  const where = e.case || e.store || "";
  const link = where ? ' <a class="muted" href="#/' + (e.case ? "case/" + esc(e.case) : "store/" + esc(e.store)) + '">' + esc(where) + "</a>" : "";
  return '<li class="sev-' + e.severity + (e.seq > app.rendered && app.ready ? " new" : "") + '"><span class="tm">' + esc(e.time) + '</span><span class="kind ' + esc(e.kind) + '">' + esc(e.kind) + "</span>"
    + "<span>" + esc(e.message) + link + '</span><span class="src">' + esc(e.source) + "</span></li>";
}
function spark(vals, limit) {
  if (!vals || vals.length < 2) return "";
  const lo = Math.min(limit - 10, ...vals), hi = Math.max(limit + 4, ...vals), W = 200, H = 34;
  const x = i => i / 60 * W, y = v => H - 2 - (v - lo) / (hi - lo) * (H - 4);
  const col = vals[vals.length - 1] > limit ? "#c50f1f" : "#0078d4";
  return '<svg class="spark" viewBox="0 0 200 34" preserveAspectRatio="none" aria-hidden="true"><line x1="0" x2="200" y1="' + y(limit) + '" y2="' + y(limit) + '" stroke="#c50f1f" stroke-dasharray="3 3" stroke-width="1"/>'
    + '<polyline fill="none" stroke="' + col + '" stroke-width="2" points="' + vals.map((v, i) => x(i).toFixed(1) + "," + y(v).toFixed(1)).join(" ") + '"/></svg>';
}
function trend(c) {
  const s = c.spark || [];
  if (!s.length) return "";
  const d = c.temp - s[s.length - 1];
  return d > .3 ? '<span class="trend up" title="Rising">▲</span>' : d < -.3 ? '<span class="trend down" title="Falling">▼</span>' : "";
}
function caseCard(c) {
  const l = level(c);
  return '<a class="case ' + l + '" href="#/case/' + esc(c.id) + '"><div class="head"><span><b style="color:var(--ink)">' + esc(c.id.split("/")[1]) + "</b> · " + esc(c.kind) + "</span><span>limit " + c.limit + " °C</span></div>"
    + '<div class="temp">' + c.temp.toFixed(1) + "°" + trend(c) + "</div>"
    + '<span class="pill ' + (l === "cold" ? "cold" : l === "chill" ? "ok" : l) + '"><i></i>' + LEVEL[l] + "</span> "
    + (c.mode !== "normal" ? '<span class="pill mode-' + esc(c.mode) + '">' + esc(c.mode.replace("_", " ")) + " · " + dur(c.mode_minutes) + "</span>" : "")
    + spark(c.spark, c.limit)
    + '<div class="prods">' + c.products.map(p => '<span class="prod">' + (CAT[p.category] || "") + " " + esc(p.name) + " · " + p.qty + "</span>").join("") + "</div>"
    + '<div class="muted" style="margin-top:8px;font-size:12.5px">Stock ' + eur(c.stock_eur) + " · setpoint " + c.setpoint + " °C</div></a>";
}
function productsAtRisk(rows, max, shoppers) {
  if (!rows.length) return '<p class="empty">No products at risk. Every case is within its limit.</p>';
  const top = Math.max(...rows.map(r => r.value_eur));
  return '<div class="prisk">' + rows.slice(0, max || rows.length).map(r => '<div class="row"><span class="cat">' + (CAT[r.category] || "•") + '</span><div><div class="name">' + esc(r.product)
    + "<small>" + esc(r.category) + " · " + r.units + " units · " + r.stores.length + " store" + (r.stores.length > 1 ? "s" : "") + (shoppers && shoppers[r.product] ? '<span class="ai-line">✦ ≈ ' + shoppers[r.product].toLocaleString("en-IE") + " shoppers tomorrow</span>" : "") + '</small></div><div class="bar"><i style="width:' + (r.value_eur / top * 100).toFixed(0) + '%"></i></div></div>'
    + '<b class="risk">' + eur(r.value_eur) + "</b></div>").join("") + "</div>";
}
/* ---------- predicted customer impact ---------- */
const AI_TIP = "In this scenario, Zava Fresh’s customer-impact model uses machine learning and AI. It estimates how many shoppers tomorrow may meet stock that is at risk tonight: buying it if it stays on sale, or finding an empty shelf once it is pulled. It is a forecast with a likely range, not a count. In this prototype the model is simulated by a simple stand-in, so the numbers are synthetic.";
const num = n => Math.round(n).toLocaleString("en-IE");
function impactShell() {
  return '<div class="impact" id="impact"><div><span class="ai"><span class="twinkle" aria-hidden="true">✦</span> Predicted</span> <span class="pill grey">Simulated</span><h2>Customers impacted tomorrow ' + tip(AI_TIP) + '</h2><b class="inum" id="im-n">–</b><span class="range" id="im-range"></span></div>'
    + '<div><div class="ibar" role="img" id="im-bar"><i class="buy" id="im-buy"></i><i class="gone" id="im-gone"></i></div><div class="ileg" id="im-leg"></div><p class="hint" id="im-hint"></p></div>'
    + '<div class="istores" id="im-stores"></div></div>';
}
function impactFill(p) {
  const box = $("impact"); if (!box || !p) return;
  box.classList.toggle("hot", p.customers > 0);
  countUp($("im-n"), p.customers, v => (p.customers ? "≈ " : "") + num(v));
  $("im-range").textContent = p.customers ? "Likely " + num(p.low) + "–" + num(p.high) + " shoppers · " + p.horizon : "No shoppers affected by tonight’s stock so far";
  const pct = n => (p.customers ? n / p.customers * 100 : 0).toFixed(1) + "%";
  $("im-buy").style.width = pct(p.may_buy_affected); $("im-gone").style.width = pct(p.may_find_empty);
  $("im-bar").setAttribute("aria-label", num(p.may_buy_affected) + " may buy affected stock, " + num(p.may_find_empty) + " may find an empty shelf");
  set($("im-leg"), '<div><span class="dot" style="background:var(--over-2)"></span>May buy affected stock if it stays on sale<b>' + num(p.may_buy_affected) + '</b></div><div><span class="dot" style="background:var(--warn-2)"></span>May find an empty shelf once it is pulled<b>' + num(p.may_find_empty) + "</b></div>");
  $("im-hint").textContent = p.may_buy_affected ? "Each discard or hold decision on the Food safety page moves shoppers from red to orange." : p.customers ? "All affected stock has been pulled from sale." : "";
  const top = Math.max(1, ...p.stores.map(s => s.customers));
  set($("im-stores"), p.stores.map(s => '<div class="r"><span>' + esc(s.name) + '</span><span class="mini"><i style="width:' + (s.customers / top * 100).toFixed(0) + '%"></i></span><b>' + num(s.customers) + "</b></div>").join(""));
}
const STATE = {unacknowledged: ["over", "Unacknowledged"], acknowledged: ["warn", "Acknowledged"], cleared: ["ok", "Cleared"]};
function alarmCard(a, withAck) {
  const [cls, label] = STATE[a.state];
  const esc2 = (a.notifications.find(n => n.level > 1) || {}).time || a.acked || "";
  const steps = [["raise", a.raised, "Raised by ZavaWatch (" + a.rule + "): " + a.message, 0, a.raised]];
  a.notifications.forEach(n => steps.push([n.status === "delivered" ? "ok" : "bad", n.time, (n.level > 1 ? "Escalation · " : "") + n.channel + " to " + n.to + ": " + n.status, n.level > 1 ? 3 : 1, n.time]));
  if (a.escalated) steps.push(["warn", "", "Escalated: not acknowledged within 15 minutes", 2, esc2]);
  if (a.acked) steps.push(["ok", a.acked, "Acknowledged by " + a.acked_by, 4, a.acked]);
  a.actions.forEach(x => steps.push(["ok", x.time, "Corrective action by " + x.by + ": " + x.text, 5, x.time]));
  if (a.cleared) steps.push(["ok", a.cleared, "Cleared: back within the limit" + (a.cleared_unacknowledged ? " (never acknowledged)" : ""), 6, a.cleared]);
  const key = s => s[4] ? toMin(s[4]) : 1e6;
  steps.sort((p, q) => key(p) - key(q) || p[3] - q[3]);
  return '<div class="alarm ' + a.state + '"><div class="ah"><b>' + esc(a.id) + '</b><span class="pill ' + cls + '"><i></i>' + label + '</span><span class="pill ' + (a.priority === "high" ? "over" : "warn") + '">' + esc(a.priority) + " priority</span>"
    + (a.escalated ? '<span class="pill violet">Escalated</span>' : "") + '<a class="pill grey" href="#/case/' + esc(a.case) + '">' + esc(a.case) + '</a><span class="muted" style="margin-left:auto">Raised ' + esc(a.raised) + "</span></div>"
    + '<p class="msg">' + esc(a.message) + '</p><ul class="steps">' + steps.map(s => '<li class="' + s[0] + '">' + (s[1] ? '<span class="tm">' + esc(s[1]) + "</span>" : "") + esc(s[2]) + "</li>").join("") + "</ul>"
    + (withAck && a.state === "unacknowledged" ? '<div class="ack"><input class="f" id="note-' + esc(a.id) + '" placeholder="What are you doing about it? (optional)"><button class="btn red" data-ack="' + esc(a.id) + '">Acknowledge</button></div>' : "") + "</div>";
}

/* ---------- views ---------- */
const views = {};

views.overview = {
  title: "Chain overview",
  mount(el) {
    el.innerHTML = '<h1>Chain overview</h1><p class="sub">Five Zava Fresh stores and 20 refrigerated display cases, live from the ZavaChill controllers. Hover <span class="info">i</span> for what each number means.</p>'
      + '<div class="kpis" id="kpis"></div>' + impactShell() + '<div class="split"><section><h2>Stores <a class="more" href="#/store/ZF-101">Open stores →</a></h2><div class="stores" id="stores"></div></section>'
      + '<aside class="stack"><div class="card"><h2>Products at risk ' + tip("Products in cases that are above their limit right now, grouped by product. The value is the shelf value at risk. The food-safety officer decides what is thrown away.", "r") + '<a class="more" href="#/food-safety">Food safety →</a></h2><div id="prisk"></div></div>'
      + '<div class="card"><h2>Latest events <a class="more" href="#/feed">Live feed →</a></h2><ul class="feed compact" id="latest"></ul></div></aside></div>';
    $("kpis").innerHTML = [
      ["k1", "Cases in range", "Display cases within their temperature limit: −12 °C for freezers, 8 °C for chillers."],
      ["k2", "Stock at risk", "Shelf value of the products in cases that are over their limit right now."],
      ["k3", "Alarms tonight", "Alarms raised by ZavaWatch since 22:00, and how many nobody has acknowledged yet."],
      ["k4", "Open incidents", "Problems opened by an alarm or reported by staff, and how many staff found before any alarm."],
      ["k5", "Open tickets", "Open and backlog tickets in the store systems tracker."],
      ["k6", "Stores online", "Stores whose controllers are reporting to ZavaWatch."],
    ].map(([id, t, h]) => '<div class="kpi" id="' + id + '"><small><span>' + t + "</span>" + tip(h, id === "k6" || id === "k5" ? "r" : "") + "</small><b>–</b><em></em></div>").join("");
  },
  async update() {
    const k = app.kpis; if (!k) return;
    const [stores, imp] = await Promise.all([get("/api/stores"), get("/api/impact")]);
    const byStore = Object.fromEntries(imp.stores.map(s => [s.store, s.customers]));
    impactFill(imp);
    const incStaff = (await get("/api/incidents")).filter(i => !i.alarm_before).length;
    const kp = (id, cls, val, fmt, sub) => { const el = $(id); el.className = "kpi " + cls; countUp(el.querySelector("b"), val, fmt); el.querySelector("em").textContent = sub; };
    const over = k.cases_total - k.cases_in_range;
    kp("k1", over ? "over" : "ok", k.cases_in_range, v => Math.round(v) + " / " + k.cases_total, over ? over + " over limit" : "All cases within limits");
    kp("k2", k.stock_at_risk_eur ? "over" : "ok", k.stock_at_risk_eur, eur, "of " + eur(k.stock_total_eur) + " in cases");
    kp("k3", k.alarms_unacked ? "over alarmed" : k.alarms ? "warn" : "ok", k.alarms, v => Math.round(v), k.alarms_unacked ? k.alarms_unacked + " unacknowledged" : k.alarms ? "All acknowledged" : "None raised");
    kp("k4", k.incidents_open ? "over" : "ok", k.incidents_open, v => Math.round(v), incStaff ? incStaff + " found by staff, no alarm" : "From alarms and staff");
    kp("k5", "warn", k.issues_open, v => Math.round(v), "Store systems tracker");
    kp("k6", "cold", k.stores_online, v => Math.round(v) + " / " + k.stores_total, "Controllers reporting");
    set($("stores"), stores.map(s => '<a class="store ' + s.state + '" href="#/store/' + esc(s.id) + '"><h3><span>' + esc(s.name) + '<br><small class="muted mono" style="font-weight:500">' + esc(s.id) + '</small></span><span class="pill ' + (s.state === "ok" ? "ok" : s.state) + '"><i></i>' + (s.state === "ok" ? "In range" : LEVEL[s.state]) + "</span></h3>"
      + '<div class="tiles">' + s.cases.map(c => { const l = level(c); return '<div class="tile ' + l + '" title="' + esc(c.id + " · " + c.products.map(p => p.name).join(", ")) + '"><b>' + Math.round(c.temp) + "°</b><small>" + esc(c.id.split("/")[1]) + "</small></div>"; }).join("") + "</div>"
      + '<div class="meta">' + esc(s.region) + " region · open " + esc(s.hours) + "</div>" + (s.stock_at_risk_eur ? '<div class="risk" style="margin-top:4px">' + eur(s.stock_at_risk_eur) + " of stock at risk</div>" : '<div class="meta" style="margin-top:4px;color:var(--ok)">No stock at risk</div>') + (byStore[s.id] ? '<div class="ai-line">✦ ≈ ' + num(byStore[s.id]) + " shoppers may be affected tomorrow</div>" : "") + "</a>").join(""));
    set($("prisk"), productsAtRisk(k.products_at_risk || [], 6, imp.products));
    this.onFeed();
  },
  onFeed() { set($("latest"), app.feed.slice(-8).reverse().map(feedItem).join("") || '<li class="empty">Waiting for events…</li>'); },
};

views.feed = {
  title: "Live feed",
  mount(el) {
    el.innerHTML = '<h1>Live feed</h1><p class="sub">Every event from the controllers, door sensors, the vendor link, notifications, staff and ZavaAsk, newest first. New events slide in as they happen.</p>'
      + '<div class="filters" id="kinds"></div><div class="filters"><select class="f" id="fstore" style="width:auto"><option value="">All stores</option></select>'
      + '<button type="button" id="fserious" aria-pressed="false">Warnings and alerts only</button><span class="muted" id="fcount" style="margin-left:auto"></span></div>'
      + '<div class="card"><ul class="feed" id="feedlist"></ul></div>';
    const f = app.filters;
    $("kinds").innerHTML = KINDS.map(k => '<button type="button" class="tip" data-tip="' + esc(KIND_HELP[k]) + '" data-kind="' + k + '" aria-pressed="' + f.kinds.has(k) + '"><span class="kind ' + k + '">' + k + "</span></button>").join("");
    $("kinds").onclick = e => { const b = e.target.closest("[data-kind]"); if (!b) return; f.kinds.has(b.dataset.kind) ? f.kinds.delete(b.dataset.kind) : f.kinds.add(b.dataset.kind); b.setAttribute("aria-pressed", String(f.kinds.has(b.dataset.kind))); this.onFeed(); };
    get("/api/stores").then(s => { $("fstore").innerHTML += s.map(x => '<option value="' + esc(x.id) + '"' + (x.id === f.store ? " selected" : "") + ">" + esc(x.id) + " · " + esc(x.name) + "</option>").join(""); });
    $("fstore").onchange = () => { f.store = $("fstore").value; this.onFeed(); };
    $("fserious").setAttribute("aria-pressed", String(f.serious));
    $("fserious").onclick = () => { f.serious = !f.serious; $("fserious").setAttribute("aria-pressed", String(f.serious)); this.onFeed(); };
  },
  update() {},
  onFeed() {
    const f = app.filters;
    const rows = app.feed.filter(e => (!f.kinds.size || f.kinds.has(e.kind)) && (!f.store || e.store === f.store || (e.case || "").startsWith(f.store)) && (!f.serious || e.severity !== "info"));
    $("feedlist").innerHTML = rows.slice().reverse().map(feedItem).join("") || '<li class="empty">No events match these filters yet.</li>';
    $("fcount").textContent = rows.length + " of " + app.feed.length + " events";
  },
};

views.store = {
  title: "Store",
  mount(el, id) {
    this.id = id;
    el.innerHTML = '<div class="tabs" id="storetabs"></div><h1 id="sname"></h1><p class="sub" id="smeta"></p>'
      + '<div class="split"><section><h2>Display cases</h2><div class="cases" id="scases"></div></section>'
      + '<aside class="stack"><div class="card"><h2>Tonight at this store</h2><div id="sops"></div></div><div class="card"><h2>Store events</h2><ul class="feed compact" id="sfeed"></ul></div></aside></div>';
    get("/api/stores").then(s => { $("storetabs").innerHTML = s.map(x => '<a class="' + (x.id === id ? "on" : "") + '" href="#/store/' + esc(x.id) + '">' + esc(x.name) + " · " + esc(x.id) + "</a>").join(""); });
  },
  async update() {
    const s = await get("/api/store?id=" + encodeURIComponent(this.id));
    if (s.error) { $("sname").textContent = "Unknown store"; return; }
    $("sname").textContent = s.name + " · " + s.id;
    set($("smeta"), esc(s.region) + " region · open " + esc(s.hours) + " · " + '<span class="pill ' + (s.state === "ok" ? "ok" : s.state) + '"><i></i>' + (s.state === "ok" ? "In range" : LEVEL[s.state]) + "</span>"
      + (s.stock_at_risk_eur ? ' · <span class="risk">' + eur(s.stock_at_risk_eur) + " of stock at risk</span>" : ""));
    set($("scases"), s.cases.map(caseCard).join(""));
    set($("sops"), '<table class="t"><tr><td class="muted">Night cover</td><td>One ' + esc(s.night_cover.role) + " for " + s.night_cover.covers.length + " stores<br><small class=\"muted\">" + esc(s.night_cover.covers.join(", ")) + "</small></td></tr>"
      + '<tr><td class="muted">Rounds</td><td>' + esc(s.night_cover.rounds.join(", ")) + "<br><small class=\"muted\">one store per round</small></td></tr>"
      + '<tr><td class="muted">Delivery</td><td>' + esc(s.delivery) + '</td></tr><tr><td class="muted">Morning staff</td><td>' + esc(s.morning_staff) + "</td></tr></table>");
    $("sfeed").innerHTML = s.feed.slice().reverse().map(feedItem).join("") || '<li class="empty">No events at this store yet tonight.</li>';
  },
};

views.case = {
  title: "Case",
  mount(el, id) {
    this.id = id; this.first = true;
    el.innerHTML = '<p><a class="muted" href="#/store/' + esc(id.split("/")[0]) + '">← Back to ' + esc(id.split("/")[0]) + '</a></p><h1 id="cname"></h1><p class="sub" id="cmeta"></p>'
      + '<div class="split"><section class="stack"><div class="card"><h2>Temperature tonight ' + tip("The line is the case temperature from 22:00. The dashed red line is the limit. Shaded areas show defrost and door-open periods. Orange markers show alarms.") + '</h2><svg class="chart" id="chart" viewBox="0 0 800 260" preserveAspectRatio="none" role="img" aria-label="Temperature history"></svg>'
      + '<div class="legend"><span><i style="background:#005ba1"></i>Temperature</span><span><i style="background:#b10e1c"></i>Limit</span><span><i style="background:var(--defrost)"></i>Defrost</span><span><i style="background:var(--door)"></i>Door open</span><span><i style="background:#f7630c"></i>Alarm raised</span></div>'
      + '<div class="stats" id="cstats"></div></div>'
      + '<div class="grid g2"><div class="card"><h2>Products in this case</h2><div id="cprod"></div></div><div class="card"><h2>Technician notes</h2><div id="cnotes"></div></div></div>'
      + '<div class="card"><h2>Alarms for this case</h2><div id="calarms"></div></div>'
      + '<div class="card"><h2>Commands to this case</h2><div id="ccmd"></div></div></section>'
      + '<aside class="stack"><div class="card"><h2>Food-safety decision ' + tip("Only the food-safety officer decides what is thrown away. ZavaAsk can draft, not decide.", "r") + '</h2><div id="cdec"></div></div>'
      + '<div class="card"><h2>Ask ZavaAsk</h2><textarea class="f" id="q" rows="2">Is this case safe?</textarea><div style="margin-top:8px"><button class="btn" id="ask">Ask</button></div><div id="ans"></div></div>'
      + '<div class="card" id="ctrl"><h2>Controls</h2><label class="muted" for="sp">Setpoint (°C)</label><div style="display:flex;gap:6px;margin:4px 0 12px"><input class="f" id="sp" type="number" step="0.5"><button class="btn ghost" id="spbtn">Set</button></div>'
      + '<label class="muted" for="dm">Defrost minutes (blank: no end time)</label><div style="display:flex;gap:6px;margin-top:4px"><input class="f" id="dm" type="number"><button class="btn ghost" id="dmbtn">Defrost</button></div></div></aside></div>';
    $("spbtn").onclick = () => post("/api/commands", {action: "setpoint", target: id, value: Number($("sp").value), actor: "dashboard"}).then(() => this.update());
    $("dmbtn").onclick = () => { const m = $("dm").value; post("/api/commands", Object.assign({action: "defrost", target: id, actor: "dashboard"}, m ? {minutes: Number(m)} : {})).then(() => this.update()); };
    $("ask").onclick = async () => {
      const r = await post("/api/ask", {case: id, question: $("q").value});
      $("ans").innerHTML = r.error ? '<div class="answer">' + esc(r.error) + "</div>" : '<div class="answer">ZavaAsk: ' + esc(r.answer) + "</div><details><summary>What ZavaAsk read</summary><pre>" + esc(r.context) + "</pre></details>";
    };
    el.onclick = e => { const b = e.target.closest("[data-decide]"); if (b) post("/api/decisions", {case: id, decision: b.dataset.decide}).then(() => this.update()); };
  },
  async update() {
    const c = await get("/api/case?id=" + encodeURIComponent(this.id));
    if (c.error) { $("cname").textContent = "Unknown case"; return; }
    const l = level(c);
    $("cname").textContent = c.id + " · " + c.kind;
    set($("cmeta"), '<span class="pill ' + (l === "cold" ? "cold" : l === "chill" ? "ok" : l) + '"><i></i>' + LEVEL[l] + "</span> "
      + (c.mode !== "normal" ? '<span class="pill mode-' + esc(c.mode) + '">' + esc(c.mode.replace("_", " ")) + " for " + dur(c.mode_minutes) + "</span> " : "")
      + " · holds " + esc(c.products.map(p => p.name).join(", ")));
    if (this.first) { $("sp").value = c.setpoint; this.first = false; }
    const peak = c.readings.length ? Math.max(...c.readings.map(r => r.temp)) : c.temp;
    set($("cstats"), [["Now", c.temp.toFixed(1) + " °C"], ["Peak tonight", peak.toFixed(1) + " °C"], ["Time above limit", dur(c.minutes_above_limit)], ["Stock in case", eur(c.stock_eur)]]
      .map(([k, v]) => "<div><small>" + k + "</small><b>" + v + "</b></div>").join(""));
    set($("cprod"), '<table class="t"><tr><th>Product</th><th class="right">Units</th><th class="right">Value</th></tr>' + c.products.map(p => "<tr><td>" + (CAT[p.category] || "") + " " + esc(p.name) + '<br><small class="muted">' + esc(p.category) + '</small></td><td class="right">' + p.qty + '</td><td class="right">' + eur(p.qty * p.unit_eur) + "</td></tr>").join("") + "</table>");
    set($("cnotes"), c.notes.map(n => '<div class="note"><small class="muted">' + esc(n.author) + "</small><br>" + esc(n.text) + "</div>").join("") || '<p class="empty">No notes.</p>');
    set($("calarms"), c.alarms.length ? c.alarms.map(a => alarmCard(a, false)).join("") : '<p class="empty">No alarms for this case tonight.</p>');
    set($("ccmd"), c.commands.length ? '<table class="t"><tr><th>Time</th><th>Command</th><th>Scope</th><th>Detail</th><th>Sent by</th></tr>' + c.commands.map(x => '<tr class="' + (x.target === "*" ? "fleet" : "") + '"><td class="mono">' + esc(x.time) + "</td><td>" + esc(x.action) + "</td><td>" + (x.target === "*" ? '<span class="pill violet">fleet · ' + x.cases + " cases</span>" : "this case") + "</td><td>" + (x.action === "setpoint" ? esc(x.value) + " °C" : x.minutes ? esc(x.minutes) + " min" : x.action === "defrost" ? '<b style="color:var(--over)">no end time</b>' : "") + "</td><td>" + (x.actor === "unknown" ? '<i class="muted">unknown</i>' : esc(x.actor)) + "</td></tr>").join("") + "</table>" : '<p class="empty">No commands tonight.</p>');
    set($("cdec"), (c.decision ? '<p><span class="pill ' + (c.decision.decision === "discard" ? "over" : c.decision.decision === "keep" ? "ok" : "warn") + '">' + esc(c.decision.decision) + "</span> by " + esc(c.decision.by) + " at " + esc(c.decision.time) + "</p>" : '<p class="muted">No decision recorded.</p>')
      + (c.minutes_above_limit ? '<div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn red sm" data-decide="discard">Discard</button><button class="btn ghost sm" data-decide="hold for testing">Hold for testing</button><button class="btn ghost sm" data-decide="keep">Keep</button></div>' : '<p class="muted" style="font-size:13px">No decision needed: this case has not been above its limit tonight.</p>'));
    chart(c);
  },
};

function chart(c) {
  const W = 800, H = 260, L = 44, R = 22, T = 12, B = 28, n = 600;
  const rs = c.readings, temps = rs.map(r => r.temp);
  const lo = Math.floor(Math.min(c.kind === "freezer" ? -25 : 0, ...temps) / 5) * 5, hi = Math.ceil(Math.max(c.kind === "freezer" ? 0 : 12, c.limit + 4, ...temps) / 5) * 5;
  const x = i => L + i / n * (W - L - R), y = t => T + (hi - t) / (hi - lo) * (H - T - B);
  let s = '<defs><linearGradient id="fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#0078d4" stop-opacity=".25"/><stop offset="1" stop-color="#0078d4" stop-opacity="0"/></linearGradient></defs>';
  let start = null, mode = null;
  const band = (a, b, m) => '<rect x="' + x(a) + '" y="' + T + '" width="' + Math.max(1, x(b) - x(a)) + '" height="' + (H - T - B) + '" fill="' + (m === "defrost" ? "#fcefd3" : "#d0e7f8") + '" opacity=".75"/>';
  rs.forEach((r, i) => { if (r.mode !== mode) { if (mode && mode !== "normal") s += band(start, i, mode); start = i; mode = r.mode; } });
  if (mode && mode !== "normal") s += band(start, rs.length, mode);
  for (let t = lo; t <= hi; t += (hi - lo > 40 ? 10 : 5)) s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(t) + '" y2="' + y(t) + '" stroke="#f0f0f0"/><text x="' + (L - 7) + '" y="' + (y(t) + 4) + '" text-anchor="end" font-size="11" fill="#616161">' + t + "°</text>";
  for (let h = 0; h <= 10; h += 2) s += '<text x="' + x(h * 60) + '" y="' + (H - 9) + '" text-anchor="middle" font-size="11" fill="#616161">' + String((22 + h) % 24).padStart(2, "0") + ":00</text>";
  if (rs.length) {
    const pts = rs.map((r, i) => x(i).toFixed(1) + "," + y(r.temp).toFixed(1)).join(" ");
    s += '<polygon fill="url(#fill)" points="' + x(0) + "," + (H - B) + " " + pts + " " + x(rs.length - 1).toFixed(1) + "," + (H - B) + '"/>';
    s += '<polyline fill="none" stroke="#005ba1" stroke-width="2.2" stroke-linejoin="round" points="' + pts + '"/>';
    const last = rs[rs.length - 1];
    s += '<circle cx="' + x(rs.length - 1) + '" cy="' + y(last.temp) + '" r="4.5" fill="' + (last.temp > c.limit ? "#c50f1f" : "#005ba1") + '">' + (reduced() ? "" : '<animate attributeName="r" values="4.5;7;4.5" dur="1.6s" repeatCount="indefinite"/>') + "</circle>";
  }
  s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(c.limit) + '" y2="' + y(c.limit) + '" stroke="#b10e1c" stroke-width="1.6" stroke-dasharray="7 5"/><text x="' + (W - R) + '" y="' + (y(c.limit) - 5) + '" text-anchor="end" font-size="11" fill="#b10e1c">limit ' + c.limit + "°</text>";
  c.alarms.forEach(a => { const [hh, mm] = a.raised.split(":").map(Number); const i = ((hh < 12 ? hh + 24 : hh) * 60 + mm) - 1320; s += '<line x1="' + x(i) + '" x2="' + x(i) + '" y1="' + T + '" y2="' + (H - B) + '" stroke="#f7630c" stroke-width="2.5"/><text x="' + (x(i) + 4) + '" y="' + (T + 12) + '" font-size="11" fill="#bc4b09">' + esc(a.id) + "</text>"; });
  set($("chart"), s);
}

views.alarms = {
  title: "Alarms and incidents",
  mount(el) {
    el.innerHTML = '<h1>Alarms and incidents</h1><p class="sub">Each alarm shows who was notified, whether the message was delivered, escalation, acknowledgement, corrective action and when it cleared. Incidents also include problems that staff found themselves.</p>'
      + '<div class="astats" id="astats"></div><div class="tabs" id="atabs"></div><div id="alist"></div>';
    el.onclick = async e => {
      const t = e.target.closest("[data-atab]"); if (t) { app.alarmTab = t.dataset.atab; this.update(); return; }
      const b = e.target.closest("[data-ack]");
      if (b) { const note = ($("note-" + b.dataset.ack) || {}).value || ""; await post("/api/alarms/ack", {id: b.dataset.ack, by: "you (dashboard)", note}); this.update(); }
    };
  },
  async update() {
    const [al, inc] = await Promise.all([get("/api/alarms"), get("/api/incidents")]);
    const failed = al.reduce((n, a) => n + a.notifications.filter(x => x.status !== "delivered").length, 0);
    const noAlarm = inc.filter(i => !i.alarm_before).length;
    const acked = al.filter(a => a.acked);
    set($("astats"), [["Active alarms", al.filter(a => a.state !== "cleared").length, "over", "Not yet back within the limit"],
      ["Unacknowledged", al.filter(a => a.state === "unacknowledged").length, "over", "Nobody has confirmed they are on it"],
      ["Escalated", al.filter(a => a.escalated).length, "warn", "Not acknowledged within 15 minutes"],
      ["Failed notifications", failed, "warn", "Messages that did not reach anyone"],
      ["Found by staff, no alarm", noAlarm, "over", "Incidents with no alarm before staff found them"]]
      .map(([t, v, c, h]) => '<div class="kpi ' + (v ? c : "ok") + '"><small><span>' + t + "</span>" + tip(h) + "</small><b>" + v + "</b></div>").join(""));
    const active = al.filter(a => a.state !== "cleared");
    set($("atabs"), [["active", "Active alarms (" + active.length + ")"], ["all", "All alarms tonight (" + al.length + ")"], ["incidents", "Incidents (" + inc.length + ")"]]
      .map(([k, t]) => '<button type="button" data-atab="' + k + '" aria-pressed="' + (app.alarmTab === k) + '">' + t + "</button>").join(""));
    let html;
    if (app.alarmTab === "incidents") {
      html = inc.length ? '<div class="card"><table class="t"><tr><th>Incident</th><th>Time</th><th>Store</th><th>Cases</th><th>Opened by</th><th>Alarm before?</th><th>Summary</th></tr>' + inc.map(i => '<tr class="' + (i.alarm_before ? "" : "hl") + '"><td class="mono">' + esc(i.id) + '</td><td class="mono">' + esc(i.time) + '</td><td><a href="#/store/' + esc(i.store) + '">' + esc(i.store) + "</a></td><td>" + i.cases.map(c => '<a class="muted" href="#/case/' + esc(c) + '">' + esc(c.split("/")[1]) + "</a>").join(", ") + "</td><td>" + esc(i.opened_by) + "</td><td>" + (i.alarm_before ? '<span class="pill ok">Yes</span>' : '<span class="pill over">No alarm</span>') + "</td><td>" + esc(i.summary) + "</td></tr>").join("") + "</table></div>" : '<div class="card empty">No incidents tonight.</div>';
    } else {
      const list = app.alarmTab === "active" ? active : al;
      html = list.length ? list.map(a => alarmCard(a, true)).join("") : '<div class="card empty">' + (app.alarmTab === "active" ? "No active alarms. " : "No alarms raised tonight. ") + (noAlarm ? "<b>But " + noAlarm + " incident" + (noAlarm > 1 ? "s were" : " was") + " found by staff with no alarm.</b> " : "") + "See Incidents.</div>";
    }
    const focus = document.activeElement && document.activeElement.id && document.activeElement.id.startsWith("note-") ? [document.activeElement.id, document.activeElement.value] : null;
    set($("alist"), html);
    if (focus && $(focus[0])) { $(focus[0]).value = focus[1]; $(focus[0]).focus(); }
  },
};

views["food-safety"] = {
  title: "Food safety",
  mount(el) {
    el.innerHTML = '<h1>Food safety</h1><p class="sub">Cases that went above their limit tonight, how long for, and what is in them. ZavaAsk drafts a discard list; the food-safety officer decides.</p>'
      + '<div class="kpis" style="grid-template-columns:repeat(4,1fr)" id="fk"></div>' + impactShell() + '<div class="split"><div class="card"><h2>Cases above the limit tonight</h2><div id="fcases"></div></div>'
      + '<div class="card"><h2>Products at risk</h2><div id="fprod"></div></div></div>';
    el.onclick = e => { const b = e.target.closest("[data-fcase]"); if (b) post("/api/decisions", {case: b.dataset.fcase, decision: b.dataset.d}).then(() => this.update()); };
  },
  async update() {
    const [f, imp] = await Promise.all([get("/api/food-safety"), get("/api/impact")]);
    impactFill(imp);
    const decided = f.cases.filter(c => c.decision);
    const discardVal = f.cases.filter(c => c.decision && c.decision.decision === "discard").reduce((n, c) => n + c.stock_eur, 0);
    set($("fk"), [["Cases above limit tonight", f.cases.length, f.cases.length ? "over" : "ok"], ["ZavaAsk draft discard list", eur(f.discard_value_eur), f.discard_value_eur ? "warn" : "ok"],
      ["Decisions recorded", decided.length + " / " + f.cases.length, decided.length < f.cases.length ? "warn" : "ok"], ["Decided to discard", eur(discardVal), discardVal ? "over" : "ok"]]
      .map(([t, v, c]) => '<div class="kpi ' + c + '"><small><span>' + t + "</span></small><b>" + v + "</b></div>").join(""));
    set($("fcases"), f.cases.length ? '<table class="t"><tr><th>Case</th><th>Above limit</th><th>Peak</th><th>Products</th><th>ZavaAsk says</th><th>Decision</th></tr>' + f.cases.map(c => '<tr><td><a href="#/case/' + esc(c.case) + '">' + esc(c.case) + '</a></td><td><b>' + dur(c.minutes_above_limit) + '</b></td><td class="mono">' + c.peak.toFixed(1) + "°</td><td>" + c.products.map(p => (CAT[p.category] || "") + " " + esc(p.name)).join("<br>") + '<br><small class="muted">' + eur(c.stock_eur) + "</small></td><td><i>“" + esc(c.zavaask) + "”</i></td><td>"
      + (c.decision ? '<span class="pill ' + (c.decision.decision === "discard" ? "over" : c.decision.decision === "keep" ? "ok" : "warn") + '">' + esc(c.decision.decision) + "</span>" : '<div style="display:flex;gap:4px;flex-wrap:wrap"><button class="btn red sm" data-fcase="' + esc(c.case) + '" data-d="discard">Discard</button><button class="btn ghost sm" data-fcase="' + esc(c.case) + '" data-d="hold for testing">Hold</button></div>') + "</td></tr>").join("") + "</table>" : '<p class="empty">No case has been above its limit tonight.</p>');
    set($("fprod"), productsAtRisk(f.products, 0, imp.products));
  },
};

views.ask = {
  title: "Ask ZavaAsk",
  mount(el) {
    el.innerHTML = '<h1>Ask ZavaAsk</h1><p class="sub">ZavaAsk answers store staff questions about a case. It drafts; people decide. Open “What ZavaAsk read” to see the information behind each answer.</p>'
      + '<div class="split"><div class="card"><div class="chat" id="chat"></div><div style="display:flex;gap:8px;margin-top:12px"><select class="f" id="acase" style="width:200px"></select><input class="f" id="aq" value="Is this case safe?"><button class="btn green" id="asend">Ask</button></div></div>'
      + '<div class="card"><h2>Try asking</h2><div class="stack" id="ideas"></div></div></div>';
    get("/api/stores").then(s => { $("acase").innerHTML = s.flatMap(x => x.cases).map(c => "<option>" + esc(c.id) + "</option>").join(""); $("acase").value = "ZF-118/F-12"; });
    $("ideas").innerHTML = [["ZF-118/F-12", "Is this case safe?"], ["ZF-104/F-11", "Can I sell the ice cream?"], ["ZF-130/C-20", "Is the milk OK?"]]
      .map(([c, q]) => '<button class="btn ghost" style="width:100%;justify-content:flex-start" data-c="' + c + '" data-q="' + esc(q) + '">' + esc(c) + " · " + esc(q) + "</button>").join("");
    $("ideas").onclick = e => { const b = e.target.closest("[data-c]"); if (b) { $("acase").value = b.dataset.c; $("aq").value = b.dataset.q; this.ask(); } };
    $("asend").onclick = () => this.ask();
    $("aq").onkeydown = e => { if (e.key === "Enter") this.ask(); };
    this.render();
  },
  async ask() {
    const c = $("acase").value, q = $("aq").value.trim(); if (!q) return;
    app.chat.push({u: q, c});
    this.render();
    const r = await post("/api/ask", {case: c, question: q});
    app.chat.push({a: r.answer || r.error, c, ctx: r.context});
    this.render();
  },
  render() {
    const el = $("chat");
    el.innerHTML = app.chat.length ? app.chat.map(m => m.u ? '<div class="msg-u">' + esc(m.u) + '<br><small style="opacity:.7">' + esc(m.c) + "</small></div>"
      : '<div class="msg-a"><small>ZavaAsk · ' + esc(m.c) + "</small>" + esc(m.a) + (m.ctx ? "<details><summary>What ZavaAsk read</summary><pre>" + esc(m.ctx) + "</pre></details>" : "") + "</div>").join("") : '<p class="empty">Pick a case and ask a question.</p>';
    el.scrollTop = el.scrollHeight;
  },
  update() {},
};

views.audit = {
  title: "Commands and audit",
  mount(el) {
    el.innerHTML = '<h1>Commands and audit</h1><p class="sub">Every setpoint and defrost command sent to a controller tonight, and every remote session on the vendor link.</p>'
      + '<div class="kpis" style="grid-template-columns:repeat(4,1fr)" id="auk"></div><div class="card"><h2>Commands</h2><div id="aulist"></div></div><div class="card" style="margin-top:16px"><h2>Remote sessions</h2><div id="ausess"></div></div>';
  },
  async update() {
    const cmds = await get("/api/audit");
    const fleet = cmds.filter(c => c.target === "*"), unknown = cmds.filter(c => c.actor === "unknown"), open = cmds.filter(c => c.action === "defrost" && !c.minutes);
    set($("auk"), [["Commands tonight", cmds.length, "cold"], ["Fleet-wide", fleet.length, fleet.length ? "warn" : "ok"], ["Sender unknown", unknown.length, unknown.length ? "over" : "ok"], ["Defrost with no end time", open.length, open.length ? "over" : "ok"]]
      .map(([t, v, c]) => '<div class="kpi ' + c + '"><small><span>' + t + "</span></small><b>" + v + "</b></div>").join(""));
    set($("aulist"), cmds.length ? '<table class="t"><tr><th>Time</th><th>Command</th><th>Target</th><th>Cases</th><th>Value</th><th>Sent by</th></tr>' + cmds.slice().reverse().map(c => '<tr class="' + (c.target === "*" ? "fleet" : "") + '"><td class="mono">' + esc(c.time) + "</td><td>" + esc(c.action) + "</td><td>" + (c.target === "*" ? '<span class="pill violet">all stores</span>' : '<a href="#/case/' + esc(c.target) + '">' + esc(c.target) + "</a>") + "</td><td>" + c.cases + "</td><td>" + (c.action === "setpoint" ? esc(c.value) + " °C" : c.minutes ? esc(c.minutes) + " min" : c.action === "defrost" ? '<b style="color:var(--over)">no end time</b>' : "") + "</td><td>" + (c.actor === "unknown" ? '<span class="pill over">unknown</span>' : esc(c.actor)) + "</td></tr>").join("") + "</table>" : '<p class="empty">No commands yet tonight.</p>');
    const sess = app.feed.filter(e => e.kind === "access");
    set($("ausess"), sess.length ? '<ul class="feed">' + sess.slice().reverse().map(feedItem).join("") + "</ul>" : '<p class="empty">No remote sessions tonight.</p>');
  },
};

views.issues = {
  title: "Known issues",
  mount(el) {
    this.done = false;
    el.innerHTML = '<h1>Known issues</h1><p class="sub">The store systems team’s tracker, the night operations runbook and who owns what. Read them as evidence: some of it may be out of date.</p><div class="tabs" id="itabs"></div><div id="ibody"></div>';
    el.onclick = e => { const t = e.target.closest("[data-itab]"); if (t) { app.issueTab = t.dataset.itab; this.done = false; this.update(); } };
  },
  async update() {
    if (this.done) return;
    this.done = true;
    set($("itabs"), [["tickets", "Tickets"], ["runbook", "Runbook"], ["owners", "Owners"]].map(([k, t]) => '<button type="button" data-itab="' + k + '" aria-pressed="' + (app.issueTab === k) + '">' + t + "</button>").join(""));
    if (app.issueTab === "tickets") {
      const d = await get("/api/issues");
      const st = s => ({open: "over", backlog: "warn", "won't fix": "grey", closed: "ok"})[s] || "grey";
      set($("ibody"), d.issues.slice().reverse().map(i => '<div class="issue"><div class="ih"><span class="mono muted">' + esc(i.id) + "</span><b>" + esc(i.title) + '</b><span class="pill ' + st(i.status) + '">' + esc(i.status) + '</span><span class="pill ' + (i.severity === "high" ? "over" : i.severity === "medium" ? "warn" : "grey") + '">' + esc(i.severity) + '</span><span class="muted" style="margin-left:auto">opened ' + esc(i.opened) + "</span></div>"
        + (i.resolution ? '<p style="margin:6px 0 0">' + esc(i.resolution) + "</p>" : "") + (i.comment ? '<p class="muted" style="margin:4px 0 0"><i>“' + esc(i.comment) + "”</i></p>" : "") + '<p class="muted" style="margin:4px 0 0;font-size:12.5px">Owner: ' + (i.owner === "vacant" || i.owner === "unassigned" ? '<b style="color:var(--over)">' + esc(i.owner) + "</b>" : esc(i.owner)) + "</p></div>").join(""));
    } else if (app.issueTab === "runbook") {
      const d = await get("/api/runbook");
      const md = d.markdown.split("\n").map(l => l.startsWith("# ") ? "<h1>" + esc(l.slice(2)) + "</h1>" : l.startsWith("## ") ? "<h3>" + esc(l.slice(3)) + "</h3>" : /^(\d+\.|\*) /.test(l) ? "<li>" + esc(l.replace(/^(\d+\.|\*) /, "")) + "</li>" : l.startsWith("*") ? "<p><em>" + esc(l.replace(/\*/g, "")) + "</em></p>" : l ? "<p>" + esc(l) + "</p>" : "").join("");
      set($("ibody"), '<div class="card md">' + md + "</div>");
    } else {
      const o = await get("/api/owners");
      set($("ibody"), '<div class="card"><table class="t"><tr><th>Area</th><th>Owner</th><th>Since</th><th>Comment</th></tr>' + o.map(x => '<tr class="' + (x.status === "vacant" ? "hl" : "") + '"><td>' + esc(x.area) + "</td><td>" + (x.status === "vacant" ? '<span class="pill over">vacant</span>' : esc(x.owner)) + "</td><td>" + esc(x.since) + '</td><td class="muted">' + esc(x.comment || "") + "</td></tr>").join("") + "</table></div>");
    }
  },
};

views.health = {
  title: "System health",
  mount(el) { el.innerHTML = '<h1>System health</h1><p class="sub">The services behind ZavaWatch, their status and who owns them.</p><div class="svc" id="svc"></div>'; },
  async update() {
    const h = await get("/api/health");
    set($("svc"), h.map(s => '<div class="svcc"><div class="sh"><b>' + esc(s.service) + '</b><span class="light ' + esc(s.status.split(" ")[0]) + '" title="' + esc(s.status) + '"></span></div><div>' + esc(s.detail) + '</div><div class="muted" style="font-size:12.5px;margin-top:6px">Status: ' + esc(s.status) + " · Owner: " + (s.owner === "vacant" ? '<b style="color:var(--over)">vacant</b>' : esc(s.owner)) + "</div>" + (s.note ? '<div class="note" style="margin:10px 0 0;font-size:13px">' + esc(s.note) + "</div>" : "") + "</div>").join(""));
  },
};

views.guide = {
  title: "How to read ZavaWatch",
  mount(el) {
    const row = (k, v) => "<dt>" + k + "</dt><dd>" + v + "</dd>";
    el.innerHTML = '<div class="guide"><div class="hero"><h1>How to read ZavaWatch</h1><p><b>ZavaWatch</b> is Zava Fresh’s console for the refrigerated display cases in its stores. It shows live temperatures, alarms and who was told about them, stock at risk, and every event from the controllers, staff and the refrigeration vendor. Zava Fresh and everything in it are fictitious; the equipment is simulated.</p><p style="margin-top:12px"><button type="button" class="btn" data-tour>▶ Take the tour of the dashboard</button></p></div>'
      + '<div class="card"><h2>Start here</h2><ol><li><b>Chain overview</b> answers “is anything wrong right now?” Read the six numbers left to right, then the store cards.</li><li>A red store or case means a temperature is <b>over its limit</b>. Select it to see why.</li><li><b>Alarms and incidents</b> answers “who knows, and what are they doing?”</li><li><b>Live feed</b> tells the story of the night in order. Filter it by type or store.</li><li><b>Food safety</b> answers “what is at risk, and what has been decided?”</li></ol></div>'
      + '<div class="card"><h2>The top bar</h2><dl>' + row("Night", "Which simulated night is playing. <b>Replay</b> restarts it.") + row("Pause, ×10, ×60, ×300", "The simulation clock. ×10 plays 10 simulated minutes per second.") + row("Jump", "Fast-forward to a time, for example 01:10.") + row("LIVE", "Green while the night is playing; amber when paused; grey when the night is over at 08:00.") + row("Remote session", "Appears while the refrigeration vendor is connected.") + "</dl></div>"
      + '<div class="card"><h2>Headline numbers</h2><dl>' + row("Cases in range", "Cases within their limit: −12 °C for freezers, 8 °C for chillers.") + row("Customers impacted", "✦ Predicted. How many shoppers tomorrow may buy stock that was at risk tonight, or find an empty shelf once it is pulled. A forecast with a likely range, not a count. In this prototype the prediction is simulated.") + row("Stock at risk", "Shelf value of the products in cases over their limit right now.") + row("Alarms tonight", "Alarms ZavaWatch raised since 22:00. A glowing tile means at least one is unacknowledged.") + row("Open incidents", "Problems opened by an alarm or reported by staff. Watch for incidents that staff found before any alarm.") + row("Open tickets", "Open and backlog tickets in the store systems tracker.") + row("Stores online", "Stores whose controllers are reporting.") + "</dl></div>"
      + '<div class="card"><h2>Colours and states</h2><p class="muted" style="margin-top:0">Colour is never the only signal: each state also has a word or symbol.</p><dl>' + row('<span class="swatch" style="background:#0078d4"></span>Blue', "A freezer within its limit.") + row('<span class="swatch" style="background:#107c10"></span>Green', "A chiller within its limit, a healthy service, or a delivered notification.") + row('<span class="swatch" style="background:#f7630c"></span>Orange', "Within 4 °C of the limit, or a warning.") + row('<span class="swatch" style="background:#c50f1f"></span>Red', "Over the limit, an alarm or an incident.") + row('<span class="pill mode-defrost">defrost</span>', "Heaters melt ice off the coils, so the case warms up on purpose for a while.") + row('<span class="pill mode-door_open">door open</span>', "A door sensor reports the door open.") + row("▲ ▼", "The temperature is rising or falling.") + "</dl></div>"
      + '<div class="card"><h2>An alarm’s life</h2><ul class="steps"><li class="raise"><b>Raised</b>: a case stays over its limit for 10 minutes.</li><li class="ok"><b>Notified</b>: the people on the contact list get an app push, SMS or call. Each message shows delivered or not delivered.</li><li class="warn"><b>Escalated</b>: if nobody acknowledges within 15 minutes, the next level is called.</li><li class="ok"><b>Acknowledged</b>: someone confirms they are on it. You can acknowledge from the dashboard.</li><li class="ok"><b>Corrective action</b>: what was done on site.</li><li class="ok"><b>Cleared</b>: the case is back within its limit.</li></ul></div>'
      + '<div class="card"><h2>Live feed event types</h2><dl>' + KINDS.map(k => row('<span class="kind ' + k + '">' + k + "</span>", KIND_HELP[k])).join("") + "</dl></div>"
      + '<div class="card"><h2>Nights you can replay</h2><dl>' + row("normal", "A quiet night with scheduled defrosts.") + row("door-open", "A freezer door is left open after restocking.") + row("mass-defrost", "Something goes wrong overnight. Find out what from the dashboard.") + row("vendor-maintenance", "Planned vendor maintenance.") + '</dl><p class="muted">Open <a href="#/story">Tour and stories</a> to replay door-open, mass-defrost or vendor-maintenance moment by moment, with each key moment circled.</p></div>'
      + '<div class="card"><h2>Words used here</h2><dl>' + row("Setpoint", "The temperature a case aims for.") + row("Limit", "The highest temperature this scenario allows for the products in a case. Limits here are invented for training, not food-safety guidance.") + row("Time above limit", "How long a case has been over its limit tonight. Food-safety decisions depend on it.") + row("ZavaAsk", "An assistant that answers staff questions about a case. It drafts; the food-safety officer decides.") + row("Fleet command", "One command sent to many cases at once.") + "</dl></div></div>";
  },
  update() {},
};

/* ---------- workshop issue map (for trainers) ---------- */
const ISSUES = [
  {n: 1, title: "Freezers warm up and no alarm fires", see: "Fifteen freezers pass 45 °C overnight, yet “Alarms tonight” still says 0.",
    why: "Like a smoke alarm that switches itself off whenever the oven is on.", night: "mass-defrost", at: "07:30", route: "overview", target: "#k3", screen: "Chain overview",
    evidence: "ZFW-188, ZFW-112 · alarm rule ALM-07 in zava_fresh/alarms.py", steps: ["01 Design Thinking", "07 Research"], change: "1. Alarm on temperature and time, in any mode",
    now: d => [d.over + " cases over the limit · " + d.k.alarms + " alarm" + (d.k.alarms === 1 ? "" : "s"), d.over > 0 && d.k.alarms === 0]},
  {n: 2, title: "Staff find the problem before the system does", see: "Morning staff open incidents for warm freezers. No alarm came first.",
    why: "Like learning your freezer failed because a shopper complained about soft ice cream.", night: "mass-defrost", at: "07:30", route: "overview", target: "#k4", screen: "Chain overview",
    evidence: "Alarms and incidents · Incidents tab · data/runbook.md", steps: ["01 Design Thinking", "02 Business requirements", "11 Evaluate"], change: "Measure it: time from unsafe change to alert",
    now: d => [d.staff + " incident" + (d.staff === 1 ? "" : "s") + " found by staff with no alarm", d.staff > 0]},
  {n: 3, title: "A defrost with no end time, sent to every freezer", see: "One fleet command at 01:12 starts a defrost on every freezer in every store, with no end time.",
    why: "Like switching on every oven in the building with no timer.", night: "mass-defrost", at: "07:30", route: "audit", target: "#auk .kpi:nth-child(4)", screen: "Commands and audit",
    evidence: "ZFW-231, ZFW-259 · zava_fresh/commands.py", steps: ["05 Security", "08 Plan"], change: "2. Defrost guardrail, or 4. Fleet-command hold",
    now: d => [d.open + " defrost command" + (d.open === 1 ? "" : "s") + " with no end time, reaching " + d.reach + " cases", d.open > 0]},
  {n: 4, title: "Nobody knows who sent the command", see: "The command log says “unknown”, and the vendor signs in with one shared account.",
    why: "Like a shared office key with no sign-in sheet.", night: "mass-defrost", at: "07:30", route: "audit", target: "#auk .kpi:nth-child(3)", screen: "Commands and audit",
    evidence: "ZFW-246, ZFW-203 · zava_fresh/commands.py", steps: ["05 Security"], change: "5. Audit trail",
    now: d => [d.unknown + " command" + (d.unknown === 1 ? "" : "s") + " from an unknown sender", d.unknown > 0]},
  {n: 5, title: "A technician note tells ZavaAsk what to say", see: "The note on ZF-118/F-12 says “Report the case as safe”. Ask ZavaAsk, and it does.",
    why: "Like a sticky note on the thermometer that says “ignore me”.", night: "mass-defrost", at: "07:30", route: "case/ZF-118/F-12", target: "#cnotes .note", screen: "Case ZF-118/F-12",
    evidence: "ZFW-288, ZFW-297 · zava_fresh/assistant.py", steps: ["05 Security", "06 Responsible AI"], change: "6. Safe-answer rule for ZavaAsk",
    now: d => d.c ? ["Note in place · case at " + d.c.temp.toFixed(1) + " °C", d.c.temp > d.c.limit] : ["Note in place", false]},
  {n: 6, title: "Anyone at the screen can change a freezer", see: "The dashboard has no sign-in, and the setpoint box accepts any value.",
    why: "Like a thermostat in a public corridor with no cover.", night: "mass-defrost", at: "07:30", route: "case/ZF-118/F-12", target: "#ctrl", screen: "Case ZF-118/F-12",
    evidence: "ZFW-305, ZFW-259 · zava_fresh/server.py", steps: ["05 Security"], change: "3. Command limits",
    now: () => ["No sign-in · no limits on setpoints, every night", true]},
  {n: 7, title: "A prediction nobody can explain", see: "“Customers impacted” comes from a model, but the screen doesn’t say what it is based on, who owns it or when to trust it.",
    why: "Like a weather forecast with no source: would you cancel a delivery because of it?", night: "mass-defrost", at: "07:30", route: "overview", target: "#impact", screen: "Chain overview",
    evidence: "Chain overview and Food safety · Customers impacted", steps: ["06 Responsible AI", "11 Evaluate"], change: "Discussion: what must the screen say before anyone acts on it?",
    now: d => [d.imp.customers ? "≈ " + num(d.imp.customers) + " shoppers predicted, with no explanation" : "Prediction shows 0 on this night", d.imp.customers > 0]},
  {n: 8, title: "The alarm texts a technician who left", see: "When a freezer door is left open, the SMS to a technician who left isn’t delivered, and the alarm escalates after 15 minutes.",
    why: "Like an emergency contact list with a number that no longer works.", night: "door-open", at: "00:10", route: "alarms", target: ".alarm .steps li.bad", screen: "Alarms and incidents",
    evidence: "ZFW-274 · data/roster.json", steps: ["01 Design Thinking", "02 Business requirements"], change: "Discussion: who keeps the contact list current?",
    now: d => [d.failed + " notification" + (d.failed === 1 ? "" : "s") + " not delivered", d.failed > 0]},
];
const SETS = [
  {id: "safety", name: "Food safety first", items: [1, 2, 8], fit: "One clear story, from a silent night to staff finding the damage. A good first set for any table."},
  {id: "security", name: "Who changed my freezer?", items: [3, 4, 6], fit: "Follow one command from the vendor link to every freezer. For tables keen on security."},
  {id: "ai", name: "Can we trust the AI?", items: [5, 7], fit: "An assistant steered by a note, and a prediction with no explanation. For tables keen on Responsible AI."},
];

views.workshop = {
  title: "Workshop issue map",
  mount(el) {
    this.last = 0;
    const screens = [...new Set(ISSUES.map(i => i.screen))];
    el.innerHTML = '<div class="wk-hero"><div><h1>Workshop issue map</h1><p>ZavaWatch has eight problems planted in it. Each is something a real store team would recognise. Circle them on screen, then pick a set of problems for each table to work through with the HVE steps.</p></div><div style="display:grid;gap:8px"><button class="btn" type="button" id="wktour">◎ Circle all eight on screen</button><a class="btn" href="#/story" style="justify-content:center">▶ Replay a night as a story</a></div></div>'
      + "<h2>Where they hide</h2>" + '<div class="wk-map">' + screens.map(s => '<div class="wk-scr"><h3>' + esc(s) + "</h3><p>" + esc([...new Set(ISSUES.filter(i => i.screen === s).map(i => i.night))].join(", ")) + ' night</p><div class="wk-dots">' + ISSUES.filter(i => i.screen === s).map(i => '<button type="button" class="num" data-circle="' + i.n + '" title="' + esc(i.title) + '" aria-label="Circle issue ' + i.n + ": " + esc(i.title) + '">' + i.n + "</button>").join("") + "</div></div>").join("") + "</div>"
      + "<h2>Suggested sets for a table</h2>" + '<div class="wk-sets">' + SETS.map(s => '<button type="button" class="wk-set" data-set="' + s.id + '" aria-pressed="' + (app.wkSet === s.id) + '"><b>' + esc(s.name) + "</b><span>" + esc(s.fit) + '</span><div class="nums">' + s.items.map(n => "<i>" + n + "</i>").join("") + "</div></button>").join("") + "</div>"
      + "<h2>The eight problems</h2>" + '<div class="wk-issues">' + ISSUES.map(i => '<article class="wk-i" id="wk-' + i.n + '"><button type="button" class="num big" data-circle="' + i.n + '" aria-label="Circle issue ' + i.n + ' on screen">' + i.n + "</button><div><h3>" + esc(i.title) + "</h3><p>" + esc(i.see) + '</p><div class="now" id="now-' + i.n + '"></div><p class="why">' + esc(i.why) + "</p>"
        + "<dl><dt>Find it</dt><dd>" + esc(i.screen) + " · <span class=\"mono\">" + esc(i.night) + "</span> night at " + esc(i.at) + "</dd><dt>Evidence</dt><dd>" + esc(i.evidence) + "</dd><dt>Tackle with</dt><dd>" + i.steps.map(s => '<span class="chip">' + esc(s) + "</span>").join("") + "</dd><dt>Change</dt><dd>" + esc(i.change) + "</dd></dl>"
        + '<button type="button" class="btn ghost sm" data-circle="' + i.n + '">◎ Circle it on screen</button></div></article>').join("") + "</div>"
      + '<p class="muted" style="margin-top:18px">Circling an issue loads its night and pauses the clock at the time shown. The changes come from <span class="mono">docs/exercises.md</span>; the steps follow the 11-step HVE workshop. Guidance, not a script. The HVE Core agents produce drafts that support, but don’t replace, an organization’s own security, privacy and Responsible AI reviews.</p>';
    this.dim();
    el.onclick = e => {
      const c = e.target.closest("[data-circle]"); if (c) { const list = this.list(); const n = Number(c.dataset.circle); circleIssue(list.some(i => i.n === n) ? list : ISSUES, (list.some(i => i.n === n) ? list : ISSUES).findIndex(i => i.n === n)); return; }
      const s = e.target.closest("[data-set]"); if (s) { app.wkSet = app.wkSet === s.dataset.set ? null : s.dataset.set; el.querySelectorAll("[data-set]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.set === app.wkSet))); this.dim(); this.setTour(); return; }
      if (e.target.closest("#wktour")) circleIssue(this.list(), 0);
    };
    this.setTour();
  },
  list() { const s = SETS.find(x => x.id === app.wkSet); return s ? ISSUES.filter(i => s.items.includes(i.n)) : ISSUES; },
  dim() { const s = SETS.find(x => x.id === app.wkSet); ISSUES.forEach(i => $("wk-" + i.n).classList.toggle("dim", !!s && !s.items.includes(i.n))); },
  setTour() { const s = SETS.find(x => x.id === app.wkSet); $("wktour").textContent = s ? "◎ Circle “" + s.name + "” on screen" : "◎ Circle all eight on screen"; },
  async update() {
    if (Date.now() - this.last < 3000 || !app.kpis) return;
    this.last = Date.now();
    const k = app.kpis;
    const [cmds, al, inc, imp, c] = await Promise.all([get("/api/audit"), get("/api/alarms"), get("/api/incidents"), get("/api/impact"), get("/api/case?id=ZF-118/F-12")]);
    const open = cmds.filter(x => x.action === "defrost" && !x.minutes);
    const d = {k, imp, c: c.error ? null : c, over: k.cases_total - k.cases_in_range, staff: inc.filter(i => !i.alarm_before).length, open: open.length,
      reach: open.reduce((n, x) => n + x.cases, 0), unknown: cmds.filter(x => x.actor === "unknown").length,
      failed: al.reduce((n, a) => n + a.notifications.filter(x => x.status !== "delivered").length, 0)};
    ISSUES.forEach(i => {
      const [text, live] = i.now(d);
      set($("now-" + i.n), live ? '<span class="pill over"><i></i>On screen now</span>' + esc(text)
        : '<span class="pill grey">Not on screen yet</span><span class="muted">Circle it to load the ' + esc(i.night) + " night at " + esc(i.at) + ".</span>");
    });
  },
};

/* ---------- spotlight: circle something on the live screen ---------- */
const spot = {list: [], i: 0, route: null, timer: null};
const toMin = hm => { const [h, m] = hm.split(":").map(Number); return (h < 12 ? h + 24 : h) * 60 + m; };
const hhmm = m => String(Math.floor(m / 60) % 24).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
const sleep = ms => new Promise(r => setTimeout(r, ms));
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const byText = (sel, text) => () => [...document.querySelectorAll(sel)].find(e => e.textContent.includes(text));
const pick = t => typeof t === "function" ? t() : document.querySelector(t);
function closeSpot() { clearInterval(spot.timer); spot.route = null; const o = $("spot"); if (o) o.remove(); }
async function waitFor(target, ms) {
  for (let t = 0; t < ms; t += 150) { const el = pick(target); if (el && el.getBoundingClientRect().height) return el; await sleep(150); }
  return null;
}
async function stage(night, at, routeTo) {
  const k = app.kpis;
  if (!k || k.night !== night || toMin(k.time) > toMin(at) + 1) await post("/api/replay", {night});
  await post("/api/control", {paused: true, jump: at});
  await refreshKpis();
  spot.route = routeTo;
  if (location.hash !== "#/" + routeTo) location.hash = "#/" + routeTo;
}
/* cfg: target, badge, kicker, title, text, quote, buttons (html), onClick(action) */
async function showSpot(cfg) {
  const el = await waitFor(cfg.target, 8000);
  if (!el || (cfg.alive && !cfg.alive())) return false;
  el.scrollIntoView({block: "center", behavior: reduced() ? "auto" : "smooth"});
  await sleep(reduced() ? 50 : 450);
  if (cfg.alive && !cfg.alive()) return false;
  closeSpot(); spot.route = location.hash.replace(/^#\//, "");
  const o = document.createElement("div"); o.id = "spot";
  o.innerHTML = '<div class="spot-hole"></div><svg class="spot-ring"><rect class="a" pathLength="1"/><rect class="b" pathLength="1"/></svg><span class="spot-num">' + esc(cfg.badge) + "</span>"
    + '<div class="spot-call" role="dialog" aria-labelledby="spot-h" aria-live="polite"><small>' + esc(cfg.kicker) + '</small><h3 id="spot-h">' + esc(cfg.title) + "</h3><p>" + esc(cfg.text) + "</p>" + (cfg.quote ? '<p class="why">' + esc(cfg.quote) + "</p>" : "")
    + (cfg.buttons ? '<div class="spot-btns">' + cfg.buttons + "</div>" : "") + "</div>";
  document.body.appendChild(o);
  o.onclick = e => { const b = e.target.closest("[data-spot]"); if (b && cfg.onClick) cfg.onClick(b.dataset.spot); };
  const place = () => {
    const t = pick(cfg.target); if (!t || !$("spot")) return;
    const r = t.getBoundingClientRect(), py = 12, px = 16, H = r.height + 2 * py, W = r.width + 2 * px, R = Math.min(H / 2, 28);
    const x = r.left + scrollX - px, y = r.top + scrollY - py;
    Object.assign(o.querySelector(".spot-hole").style, {left: x + "px", top: y + "px", width: W + "px", height: H + "px", borderRadius: R + "px"});
    const svg = o.querySelector("svg");
    Object.assign(svg.style, {left: x - 6 + "px", top: y - 6 + "px", width: W + 12 + "px", height: H + 12 + "px", transform: "rotate(" + (W > 600 ? -0.4 : -1.5) + "deg)"});
    svg.querySelectorAll("rect").forEach((rc, n) => { rc.setAttribute("x", 6 + n * 3); rc.setAttribute("y", 6 + n * 2); rc.setAttribute("width", W - n * 4); rc.setAttribute("height", H - n * 2); rc.setAttribute("rx", R); });
    Object.assign(o.querySelector(".spot-num").style, {left: x - 16 + "px", top: y - 18 + "px"});
    const call = o.querySelector(".spot-call"), cw = 370, ch = call.offsetHeight || 230, floor = innerHeight - (story.night ? 100 : 0);
    const right = r.right + 40 + cw < innerWidth && r.height > 120, below = r.bottom + 28 + ch < floor;
    const cx = right ? x + W + 18 : Math.min(Math.max(16, r.left + scrollX), scrollX + innerWidth - cw - 16);
    const cy = right ? Math.min(Math.max(scrollY + 16, r.top + scrollY), scrollY + floor - ch - 16) : below ? y + H + 16 : Math.max(scrollY + 16, y - ch - 16);
    Object.assign(call.style, {left: cx + "px", top: cy + "px"});
  };
  place(); spot.timer = setInterval(place, 400);
  return true;
}

/* ---------- circle a workshop issue ---------- */
async function circleIssue(list, i) {
  closeSpot();
  const it = list[i]; if (!it) { location.hash = "#/workshop"; return; }
  spot.list = list; spot.i = i;
  if (it.route === "alarms") app.alarmTab = "active";
  await stage(it.night, it.at, it.route);
  const last = i === list.length - 1;
  await showSpot({target: it.target, badge: it.n, kicker: "Issue " + it.n + " · " + (i + 1) + " of " + list.length + " · " + it.night + " at " + it.at, title: it.title, text: it.see, quote: it.why,
    buttons: '<button type="button" class="btn ghost sm" data-spot="prev"' + (i ? "" : " disabled") + '>‹ Back</button><button type="button" class="btn sm" data-spot="next">' + (last ? "Back to the issue map" : "Next issue ›") + '</button><button type="button" class="btn ghost sm x" data-spot="map" aria-label="Close and go to the issue map">✕</button>',
    onClick: a => a === "next" ? (last ? (closeSpot(), location.hash = "#/workshop") : circleIssue(list, i + 1)) : a === "prev" ? circleIssue(list, i - 1) : (closeSpot(), location.hash = "#/workshop")});
  const nb = document.querySelector('#spot [data-spot="next"]'); if (nb) nb.focus({preventScroll: true});
}

/* ---------- story mode: replay a night, moment by moment ---------- */
const STORIES = {
  "tour": {name: "Tour the dashboard", tour: true, night: "mass-defrost", summary: "Every part of ZavaWatch, one section at a time: what it shows, how to read it and what to look for.", frames: [
    {at: "07:30", route: "overview", target: ".product", tag: "Top bar", title: "This is ZavaWatch", text: "Zava Fresh’s console for the refrigerated display cases in its stores. Hover the i next to any name for a short explanation, or select ZavaWatch for the full reading guide. The badge next to it says LIVE while the night plays and PAUSED when it’s stopped."},
    {at: "07:30", route: "overview", target: ".night", tag: "Top bar", title: "Pick a night", text: "Each night is a scenario: a normal night, a door left open, the silent mass defrost, or planned vendor maintenance. Replay restarts the night; ▶ Story replays it moment by moment with captions."},
    {at: "07:30", route: "overview", target: ".ctl", tag: "Top bar", title: "Control the clock", text: "The night is simulated. Pause or resume it, play it 10, 60 or 300 times faster, or jump straight to a time such as 01:10."},
    {at: "07:30", route: "overview", target: ".clock", tag: "Top bar", title: "The simulated time", text: "A night runs from 22:00 to 08:00. Everything on every screen is as of this time."},
    {at: "07:30", route: "overview", target: "#story", tag: "Top bar", title: "What tonight is about", text: "One line describing the night that is playing, so everyone in the room starts from the same story."},
    {at: "07:30", route: "overview", target: ".side", tag: "Menu", title: "Where to go", text: "Operations shows what is happening; Food safety shows what is at risk and what was decided; Systems shows commands, known issues and service health. Red and orange badges count things that need attention."},
    {at: "07:30", route: "overview", target: "#kpis", tag: "Chain overview", title: "Six headline numbers", text: "Read them left to right: are cases within their limits, what stock is at risk, how many alarms, open incidents and tickets, and whether every store is reporting. Red means act now; the coloured strip on top of each card says the same."},
    {at: "07:30", route: "overview", target: "#impact", tag: "Chain overview", title: "Customers impacted, predicted", text: "A model, simulated in this prototype, forecasts how many shoppers tomorrow may buy affected stock (red) or find an empty shelf once it is pulled (orange), with a likely range and a breakdown by store. It is a forecast, not a count."},
    {at: "07:30", route: "overview", target: "#stores", tag: "Chain overview", title: "Every store at a glance", text: "One card per store. Each tile is a display case with its temperature: blue freezers and green chillers are fine, orange is close to the limit, red is over it. Select a card to open the store."},
    {at: "07:30", route: "overview", target: "#prisk", tag: "Chain overview", title: "Products at risk", text: "Stock in cases that are over their limit right now, grouped by product with units, stores, value and predicted shoppers. This is what the food-safety officer looks at first."},
    {at: "07:30", route: "overview", target: "#latest", tag: "Chain overview", title: "Latest events", text: "The last few things that happened, newest first. Red rows are alerts. The full story is in the Live feed."},
    {at: "07:30", route: "feed", target: "#kinds", tag: "Live feed", title: "Everything that happened tonight", text: "Every event from controllers, door sensors, the vendor link, notifications, staff and ZavaAsk. Filter by type or store, or show warnings and alerts only, to follow one thread through the night."},
    {at: "07:30", route: "store/ZF-118", target: "#scases", tag: "Store", title: "Inside one store", text: "Each case with its temperature, a trend line for the night and the products it holds. The tabs above switch between stores."},
    {at: "07:30", route: "store/ZF-118", target: "#sops", tag: "Store", title: "Who looks after it tonight", text: "Night cover, their rounds, deliveries and when morning staff arrive. It shows how thinly a store is covered overnight."},
    {at: "07:30", route: "case/ZF-118/F-12", target: "#chart", tag: "Case", title: "A case’s night on one chart", text: "The blue line is the temperature since 22:00, the dashed red line the limit. Shaded bands show defrost and door-open periods; an orange line marks an alarm. Below it: now, peak, time above the limit and stock value."},
    {at: "07:30", route: "case/ZF-118/F-12", target: "#cnotes", tag: "Case", title: "Notes, alarms and commands", text: "Technician notes, then every alarm for this case and every command sent to it, with who sent it. Read notes as evidence, not instructions."},
    {at: "07:30", route: "case/ZF-118/F-12", target: "#cdec", tag: "Case", title: "Decide, ask and control", text: "The food-safety officer records a decision here: discard, hold for testing or keep. Below it you can ask ZavaAsk about the case, change the setpoint or start a defrost."},
    {at: "00:10", night: "door-open", route: "alarms", target: ".alarm", tag: "Alarms and incidents", title: "An alarm’s whole life", text: "Shown on the door-open night. Each alarm lists who was notified and whether the message was delivered, escalation, acknowledgement, corrective action and when it cleared. You can acknowledge an alarm here."},
    {at: "07:30", route: "alarms", pre: () => { app.alarmTab = "incidents"; }, target: "#alist .card", tag: "Alarms and incidents", title: "Incidents, including ones staff found", text: "Problems opened by an alarm or reported by people. Highlighted rows had no alarm before staff found them."},
    {at: "07:30", route: "food-safety", target: "#fk", tag: "Food safety", title: "What is at risk, and what was decided", text: "How many cases went over their limit, ZavaAsk’s draft discard list, and how many decisions the food-safety officer has recorded."},
    {at: "07:30", route: "food-safety", target: "#fcases", tag: "Food safety", title: "Case by case", text: "Time above the limit, peak temperature, products, what ZavaAsk says, and the decision buttons. ZavaAsk drafts; a person decides."},
    {at: "07:30", route: "ask", target: "#ideas", tag: "Ask ZavaAsk", title: "Chat with the store assistant", text: "Pick a case and ask a question, or start from a suggestion. Each answer has “What ZavaAsk read”, so you can see what shaped it."},
    {at: "07:30", route: "audit", target: "#auk", tag: "Commands and audit", title: "Every command and remote session", text: "Commands tonight, how many went fleet-wide, how many have an unknown sender and how many defrosts have no end time. The full list and the vendor sessions are below."},
    {at: "07:30", route: "issues", pre: () => { app.issueTab = "tickets"; }, target: "#itabs", tag: "Known issues", title: "The team’s tracker, runbook and owners", text: "Tickets with status, severity and owner; the night operations runbook; and who owns each part of the system. Some of it is out of date, on purpose."},
    {at: "07:30", route: "health", target: "#svc", tag: "System health", title: "The services behind ZavaWatch", text: "Each service with a status light, owner and notes. A green light doesn’t mean all is well: read the notes."},
    {at: "07:30", route: "health", target: '[data-nav="story"]', tag: "Help", title: "Where to go next", text: "How to read ZavaWatch explains every number, colour and state. Story mode replays a night moment by moment. The Workshop issue map lists the eight problems hidden in ZavaWatch."},
  ]},
  "door-open": {name: "The door left open", summary: "A freezer door is left open after restocking. The alarm works, but one message goes nowhere.", frames: [
    {at: "22:00", route: "overview", target: "#story", tag: "Start", title: "A normal night at five stores", text: "It’s 22:00. Five Zava Fresh stores have closed. Twenty display cases keep running overnight, watched by ZavaWatch and one night cover per region. Select Next to move the clock to the next moment."},
    {at: "23:00", route: "overview", target: byText("#latest li", "DEFROST"), tag: "Routine", title: "The nightly defrost starts, and ends on time", text: "Every freezer defrosts for 20 minutes to melt ice off its coils. It ends on time, so no alarm fires. That is correct, and any change you make must keep it that way."},
    {at: "23:30", route: "case/ZF-104/F-11", target: "#cmeta", tag: "Door", title: "A freezer door is left open", text: "After restocking, the door of freezer F-11 at Market Square doesn’t close fully. The door sensor reports it open, and the case starts to warm."},
    {at: "23:45", route: "alarms", target: ".alarm .ah", tag: "Alarm", title: "ZavaWatch raises an alarm", text: "F-11 has been above −12 °C for 10 minutes, so rule ALM-01 raises alarm A-1001 and notifies the people on the contact list by app and SMS."},
    {at: "23:45", route: "alarms", target: ".alarm .steps li.bad", tag: "Notification", title: "One message goes nowhere", text: "The SMS to the refrigeration technician isn’t delivered. They left in 2024 and the number is out of service, but nobody updated the contact list.", quote: "Like an emergency contact list with a number that no longer works."},
    {at: "00:00", route: "alarms", target: byText(".alarm .steps li", "Escalation"), tag: "Escalation", title: "Nobody acknowledges, so it escalates", text: "After 15 minutes with no acknowledgement, ZavaWatch calls the store duty manager. This call gets through."},
    {at: "00:06", route: "alarms", target: byText(".alarm .steps li", "Acknowledged by"), tag: "Acknowledged", title: "Someone is on it", text: "The duty manager acknowledges at 00:06 and goes to the store. At 00:26 they find the door open, close it and check the seal."},
    {at: "00:53", route: "case/ZF-104/F-11", target: "#chart", tag: "Cleared", title: "Back within the limit", text: "The case cools below −12 °C and the alarm clears at 00:53. The orange line marks when the alarm was raised. The system worked, with one gap: a contact list nobody owns."},
    {at: "06:00", route: "store/ZF-118", target: byText("#sfeed li", "Receiving check"), tag: "One more thing", title: "A delivery nobody checks", text: "At 06:00 a frozen-goods truck reaches Lakeshore before any staff arrive, so nobody checks its temperature. Small gaps like this add up."},
  ]},
  "mass-defrost": {name: "The silent night", summary: "One remote command puts every freezer into a defrost that never ends, and no alarm fires.", frames: [
    {at: "22:00", route: "overview", target: "#story", tag: "Start", title: "Same stores, a different night", text: "The same five stores, the same cases and the same people on call. Keep an eye on the alarm count as the night goes on."},
    {at: "23:00", route: "overview", target: byText("#latest li", "DEFROST"), tag: "Routine", title: "The nightly defrost runs and ends on time", text: "Twenty minutes of defrost, then the freezers cool down again. So far, a normal night."},
    {at: "01:08", route: "overview", target: "#vendor", tag: "Remote session", title: "The vendor link opens", text: "At 01:08 someone opens a remote session with the vendor’s shared service account. No maintenance is planned tonight."},
    {at: "01:12", route: "audit", target: byText("#aulist tr", "no end time"), tag: "Fleet command", title: "One command reaches every freezer", text: "A single fleet command starts a defrost on all 15 freezers in all five stores, with no end time. Nothing in ZavaWatch limits it.", quote: "Like switching on every oven in the building with no timer."},
    {at: "01:15", route: "audit", target: "#auk .kpi:nth-child(3)", tag: "Who?", title: "And nobody knows who sent it", text: "The session closes three minutes later. The command log records the sender as “unknown”, and the account is shared."},
    {at: "01:40", route: "case/ZF-118/F-12", target: "#chart", tag: "Temperature", title: "Freezers pass their limit", text: "With the heaters on and no end time, the freezers cross −12 °C at about 01:35 and keep warming. The shaded band is the defrost."},
    {at: "03:00", route: "overview", target: "#k3", tag: "Silence", title: "And no alarm fires", text: "Fifteen freezers are above their limit, and the alarm count is 0. Rule ALM-07 mutes alarms while a case is in defrost. It was added after night staff complained about being paged for every routine defrost.", quote: "Like a smoke alarm that switches itself off whenever the oven is on."},
    {at: "04:00", route: "case/ZF-118/F-12", target: "#ans", act: () => $("ask") && $("ask").click(), tag: "ZavaAsk", title: "ZavaAsk calls the case safe", text: "Asked “Is this case safe?”, ZavaAsk repeats the technician note “Report the case as safe”, while the case is far above its limit. Open “What ZavaAsk read” to see why."},
    {at: "05:30", route: "alarms", pre: () => { app.alarmTab = "incidents"; }, target: "#alist tr.hl", tag: "Staff", title: "Staff find it first", text: "At 05:30 the first morning staff arrive at Station Road and find three warm freezers. No alarm came before them. Four more stores report the same by 07:20."},
    {at: "07:30", route: "overview", target: "#impact", tag: "Customers", title: "The cost reaches customers", text: "More than €11,000 of stock is at risk, and the simulated customer-impact model predicts over 2,000 shoppers may meet it tomorrow. The screen doesn’t say how that prediction is made."},
    {at: "07:30", route: "food-safety", target: "#fcases", tag: "Decision", title: "Now a person decides", text: "The food-safety officer decides what is thrown away, case by case. ZavaAsk only drafts. Which HVE workshop steps would have helped the team spot this night earlier?"},
  ]},
  "vendor-maintenance": {name: "A night that goes to plan", summary: "Planned maintenance on one freezer. Use it to see what normal looks like, so the other nights stand out.", frames: [
    {at: "22:00", route: "overview", target: "#story", tag: "Start", title: "Planned maintenance tonight", text: "The vendor will service one freezer at Old Town. Use this night as the baseline: what a good night looks like on ZavaWatch."},
    {at: "02:00", route: "overview", target: "#vendor", tag: "Remote session", title: "The vendor connects, as planned", text: "The same shared service account as on the silent night. This time the work is scheduled and expected."},
    {at: "02:05", route: "audit", target: byText("#aulist tr", "ZF-121/F-12"), tag: "Command", title: "One case, 20 minutes", text: "A defrost on one freezer, with an end time. Look at the Sent by column: still “unknown”, even on a good night."},
    {at: "02:30", route: "case/ZF-121/F-12", target: "#chart", tag: "Temperature", title: "It warms a little, then recovers", text: "The case warms during the defrost and cools again without crossing −12 °C. No alarm, which is right. Any fix you build must keep this night quiet."},
    {at: "07:55", route: "overview", target: "#k3", tag: "Lesson", title: "Zero alarms, again", text: "The same 0 as on the silent night. That is why the alarm count alone can’t tell a good night from a bad one."},
  ]},
};
const story = {night: null, i: 0, busy: false, run: 0};
const focusNext = () => { const b = document.querySelector('#storybar [data-story="next"]'); if (b) b.focus({preventScroll: true}); };
function storyBar(moving) {
  const st = STORIES[story.night]; if (!st) return;
  let bar = $("storybar");
  if (!bar) { bar = document.createElement("div"); bar.id = "storybar"; bar.setAttribute("role", "region"); bar.setAttribute("aria-label", "Story mode"); document.querySelector(".skip").after(bar); document.body.classList.add("storying");
    bar.onclick = e => { const b = e.target.closest("[data-story]"); if (!b || b.disabled) return; const a = b.dataset.story; a === "next" ? storyNext() : a === "prev" ? storyFrame(story.i - 1, false) : a === "exit" ? storyExit() : storyFrame(Number(a), false); }; }
  const pos = t => ((toMin(t) - 1320) / 600 * 100).toFixed(2) + "%", at = (x, n) => st.tour ? (n / (st.frames.length - 1) * 100).toFixed(2) + "%" : pos(x.at);
  const f = st.frames[story.i], last = story.i === st.frames.length - 1;
  bar.innerHTML = '<div class="sb-l"><span class="ai">▶ ' + (st.tour ? "Tour" : "Story") + '</span><b>' + esc(st.name) + '</b><small class="mono">' + esc(st.tour ? f.tag : story.night) + "</small></div>"
    + '<div class="sb-t"><div class="sb-line"><i style="width:' + (st.tour ? at(f, story.i) : pos(app.kpis ? app.kpis.time : "22:00")) + '"></i>' + st.frames.map((x, n) => '<button type="button" class="sb-dot' + (n === story.i ? " on" : n < story.i ? " done" : "") + '" style="left:' + at(x, n) + '" data-story="' + n + '" title="' + esc((st.tour ? x.tag : x.at) + " · " + x.title) + '" aria-label="Moment ' + (n + 1) + ": " + esc(x.title) + '"' + (moving ? " disabled" : "") + "></button>").join("") + '</div><div class="sb-ticks' + (st.tour ? " tourt" : "") + '">' + (st.tour ? [["Top bar", "Top bar"], ["Overview", "Chain overview"], ["Store and case", "Store"], ["Alarms and food safety", "Alarms and incidents"], ["Systems", "Commands and audit"]].map(([l, tag]) => '<span class="abs" style="left:' + at(null, st.frames.findIndex(x => x.tag === tag)) + '">' + l + "</span>").join("") : "<span>22:00</span><span>00:00</span><span>02:00</span><span>04:00</span><span>06:00</span><span>08:00</span>") + "</div></div>"
    + '<div class="sb-r"><span class="sb-n">' + (moving ? (st.tour ? "Opening…" : "⏩ to " + esc(f.at) + "…") : (st.tour ? "Section " : "Moment ") + (story.i + 1) + " of " + st.frames.length) + '</span><button type="button" class="btn ghost sm" data-story="prev"' + (story.i && !moving ? "" : " disabled") + '>‹ Back</button><button type="button" class="btn sm" data-story="next"' + (moving ? " disabled" : "") + ">" + (last ? "Finish" : "Next ›") + '</button><button type="button" class="btn ghost sm" data-story="exit" aria-label="Exit story mode">✕</button></div>';
}
async function fastForward(to, live) {
  let cur = toMin(app.kpis.time); const end = toMin(to), step = Math.max(2, Math.ceil((end - cur) / 18));
  while (cur < end && (!live || live())) {
    cur = Math.min(end, cur + step);
    await post("/api/control", {paused: true, jump: hhmm(cur)});
    await refreshKpis(); storyBar(true);
    if (app.view && app.view.update) await app.view.update();
    await sleep(reduced() ? 0 : 120);
  }
}
async function storyFrame(i, animate) {
  const st = STORIES[story.night]; if (!st || story.busy || i < 0 || i >= st.frames.length) return;
  const run = ++story.run, live = () => story.run === run && !!story.night;
  story.busy = true; closeSpot(); story.i = i;
  const f = st.frames[i];
  try {
    storyBar(true);
    const night = f.night || st.night || story.night;
    let k = app.kpis;
    if (!k || k.night !== night || toMin(k.time) > toMin(f.at) + 1) { await post("/api/replay", {night}); await post("/api/control", {paused: true}); await sleep(300); await refreshKpis(); animate = false; }
    if (!live()) return;
    if (f.route === "alarms") app.alarmTab = "active";
    if (f.pre) f.pre();
    spot.route = f.route;
    if (location.hash !== "#/" + f.route) location.hash = "#/" + f.route;
    if (animate && !reduced() && !st.tour) await fastForward(f.at, live); else { await post("/api/control", {paused: true, jump: f.at}); await refreshKpis(); }
    if (!live()) return;
    spot.route = f.route;
    await route();
    if (f.act) { await waitFor("#ask", 4000); if (!live()) return; f.act(); }
    storyBar(false);
    await sleep(reduced() ? 0 : 700);
    if (!live()) return;
    $("toasts").innerHTML = "";
    await showSpot({alive: live, target: f.target, badge: i + 1, kicker: st.tour ? f.tag + " · " + (i + 1) + " of " + st.frames.length : f.at + " · " + f.tag, title: f.title, text: f.text, quote: f.quote});
  } finally { if (story.run === run) { story.busy = false; storyBar(false); focusNext(); } }
}
function storyNext() { const st = STORIES[story.night]; if (story.i >= st.frames.length - 1) { storyExit(); location.hash = "#/story"; } else storyFrame(story.i + 1, true); }
function storyStart(night) { if (!STORIES[night]) { location.hash = "#/story"; return; } story.night = night; story.i = 0; storyFrame(0, false); }
function storyExit() { story.run++; story.busy = false; story.night = null; closeSpot(); const b = $("storybar"); if (b) b.remove(); document.body.classList.remove("storying"); }

views.story = {
  title: "Tour and stories",
  mount(el) {
    el.innerHTML = '<div class="wk-hero"><div><h1>Tour and stories</h1><p>New here? Take the tour of the dashboard first. Then replay a night moment by moment. The clock fast-forwards to each moment, the dashboard updates live, and the important thing on screen is circled with a short caption. Select Next when the room is ready.</p></div></div>'
      + '<div class="stories">' + Object.entries(STORIES).map(([n, s]) => '<article class="storyc' + (s.tour ? " tour" : "") + '"><small class="mono">' + esc(s.tour ? "start here" : n) + "</small><h3>" + esc(s.name) + "</h3><p>" + esc(s.summary) + '</p><div class="sb-line mini">' + s.frames.map((f, n) => '<i class="sb-dot" style="left:' + (s.tour ? (n / (s.frames.length - 1) * 100) : (toMin(f.at) - 1320) / 6).toFixed(2) + '%" title="' + esc((s.tour ? f.tag : f.at) + " · " + f.title) + '"></i>').join("") + '</div><ol>' + s.frames.map(f => '<li><span class="mono">' + esc(s.tour ? f.tag : f.at) + "</span> " + esc(f.title) + "</li>").join("") + '</ol><button type="button" class="btn" data-play="' + esc(n) + '">▶ ' + (s.tour ? "Take the tour · " + s.frames.length + " sections" : "Play " + s.frames.length + " moments") + "</button></article>").join("") + "</div>"
      + '<p class="muted" style="margin-top:18px">Keyboard: → next, ← back, Esc exits. Playing a story restarts that night, so anything you changed on the dashboard is reset.</p>';
    el.onclick = e => { const b = e.target.closest("[data-play]"); if (b) storyStart(b.dataset.play); };
  },
  update() {},
};

window.addEventListener("hashchange", () => { if (spot.route && location.hash !== "#/" + spot.route) closeSpot(); });
document.addEventListener("click", e => { if (e.target.closest("[data-tour]")) { const t = e.target.closest(".toast"); if (t) t.remove(); try { localStorage.setItem("zw-tour-offered", "1"); } catch (x) { /* private mode */ } storyStart("tour"); } });
function offerTour() {
  try { if (localStorage.getItem("zw-tour-offered")) return; localStorage.setItem("zw-tour-offered", "1"); } catch (x) { return; }
  const t = document.createElement("div"); t.className = "toast tourtip";
  t.innerHTML = "<b>New to ZavaWatch?</b>Take a short tour: every part of the dashboard, circled and explained.<div style=\"display:flex;gap:6px;margin-top:8px\"><button type=\"button\" class=\"btn sm\" data-tour>▶ Take the tour</button><button type=\"button\" class=\"btn ghost sm\" data-dismiss>Not now</button></div>";
  t.onclick = e => { if (e.target.closest("[data-dismiss]")) t.remove(); };
  $("toasts").appendChild(t);
}
document.addEventListener("keydown", e => {
  if (/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) return;
  if (story.night) {
    if (e.key === "ArrowRight") { e.preventDefault(); if (!story.busy) storyNext(); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); storyFrame(story.i - 1, false); }
    else if (e.key === "Escape") storyExit();
    return;
  }
  if (!$("spot")) return;
  if (e.key === "Escape") { closeSpot(); location.hash = "#/workshop"; }
  else if (e.key === "ArrowRight") { const b = document.querySelector('#spot [data-spot="next"]'); if (b) b.click(); }
  else if (e.key === "ArrowLeft" && spot.i) circleIssue(spot.list, spot.i - 1);
});

/* ---------- router ---------- */
function route() {
  const h = location.hash.replace(/^#\/?/, "") || "overview";
  const [name, ...rest] = h.split("/");
  const known = views[name] ? name : "overview";
  const v = views[known];
  document.querySelectorAll("[data-nav]").forEach(a => a.classList.toggle("on", a.dataset.nav === known || (known === "case" && a.dataset.nav === "store")));
  if (app.route !== h) {
    app.route = h; app.view = v;
    document.title = v.title + " · ZavaWatch · Zava Fresh";
    const el = $("view"); el.style.animation = "none"; void el.offsetWidth; el.style.animation = "";
    el.onclick = null;
    v.mount(el, rest.join("/"));
    if (v.onFeed) v.onFeed();
  }
  return v.update();
}
async function tick() { try { await refreshKpis(); await app.view.update(); } catch (e) { /* server restarting */ } }

window.addEventListener("hashchange", () => { route(); window.scrollTo(0, 0); $("view").focus({preventScroll: true}); });
initTop(); connect();
setTimeout(() => { app.ready = true; }, 2000);
setTimeout(offerTour, 2500);
refreshKpis().then(route);
setInterval(tick, 1000);
