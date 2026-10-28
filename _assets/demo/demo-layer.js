/* Capa Demo: cajón de casos, recorrido animado (foco, cursor, menús y selectores simulados) y modal «Antes y ahora». Solo se carga con una línea <script>; no toca el resto del sitio. */
(() => {
  "use strict";
  const me = document.currentScript;
  if (!me || window.__nwDemo) return;
  window.__nwDemo = true;
  const BASE = me.src.replace(/demo-layer\.js.*$/, "");
  const SITE = BASE.replace(/_assets\/demo\/$/, "");
  const K_RUN = "nwx-demo-run", K_OBJ = "nwx-demo-obj";
  const qs = new URLSearchParams(location.search);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const ss = { get: (k) => { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) { /* sin storage */ } }, del: (k) => { try { sessionStorage.removeItem(k); } catch (e) { /* sin storage */ } } };
  const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const readRun = () => { try { return JSON.parse(ss.get(K_RUN)); } catch (e) { return null; } };

  /* El CSS y el velo de llegada van antes del primer cuadro posible: al venir de una navegación de la demo la página entra con un fundido. */
  const css = document.createElement("link"); css.rel = "stylesheet"; css.href = BASE + "demo-layer.css"; document.head.appendChild(css);
  let veil = null;
  const veilShow = (txt) => {
    if (!veil) { veil = document.createElement("div"); veil.className = "dl-veil"; veil.setAttribute("role", "status"); veil.style.cssText = "position:fixed;inset:0;z-index:99997;background:rgba(246,247,251,.9);display:flex;align-items:center;justify-content:center;transition:opacity .45s ease"; document.body.appendChild(veil); }
    veil.innerHTML = '<span class="dl-vp"><i class="dl-spin" aria-hidden="true"></i>' + esc(txt) + "</span>"; veil.style.opacity = "1";
  };
  const veilHide = () => { if (!veil) return; const v = veil; veil = null; v.style.opacity = "0"; setTimeout(() => v.remove(), 500); };
  const run0 = readRun();
  if (run0 && run0.leaving) veilShow(run0.leaving);

  /* ── Ayudas para resolver ids en vivo contra los datos del explorador ── */
  const D = () => window.EXPLORADOR_DATOS;
  const must = (x, what) => { if (!x) throw new Error("No hay datos para: " + what); return x; };
  const regTipo = (r) => (r.grupo === "Atletismo" ? "individual" : "conjunto");
  const dep = (id) => (D().deportes.find((d) => d.id === id) || {});
  const all = (sel) => [].slice.call(document.querySelectorAll(sel));
  const q1 = (s) => document.querySelector(s);
  const shown = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  const ORDER = ["tipo", "deporte", "prueba", "regional", "depto", "sexo", "cat", "inst"];
  const H = {
    exp: (entrada, e, f) => SITE + "explorador/index.html?entrada=" + entrada + (e ? "&e=" + e : "") + (f ? "&f=" + f : ""),
    hash: (o) => {
      const c = ORDER.filter((k) => o[k]).map((k) => k + ":" + o[k]).join("|"), p = new URLSearchParams();
      if (c) p.set("c", c);
      if (o.d) p.set("d", o.d);
      if (o.p) p.set("p", o.p);
      if (o.m) p.set("m", o.m);
      return "#" + p.toString();
    },
    tipoDe: (p) => dep(p.deporteId).tipo,
    regionalesDe: (tipo) => D().regionales.filter((r) => r.faseId === "regionales" && regTipo(r) === tipo),
    regional: (tipo) => must(H.regionalesDe(tipo).find((r) => D().pruebas.some((p) => p.regionalId === r.id && p.estado === "finalizada")), "una regional de " + tipo + " con pruebas jugadas"),
    cardIndex: (tipo) => H.regionalesDe(tipo).findIndex((r) => r.id === H.regional(tipo).id),
    otraRegional: (tipo) => must(D().regionales.filter((r) => r.faseId === "regionales" && regTipo(r) === tipo && D().pruebas.some((p) => p.regionalId === r.id))[1], "otra regional de " + tipo),
    deporteDe: (rid) => must(D().pruebas.find((p) => p.regionalId === rid && p.estado === "finalizada") || D().pruebas.find((p) => p.regionalId === rid), "pruebas de la regional").deporteId,
    deptoDe: (rid) => must((D().regionales.find((r) => r.id === rid) || {}).departamentoIds, "departamentos")[0] || (() => { throw new Error("La regional no tiene departamentos"); })(),
    pruebaClasificada: () => must(D().pruebas.find((p) => p.faseId === "regionales" && p.estado === "finalizada" && p.resultado && p.resultado.tipo === "clasificacion"), "una prueba individual terminada"),
    pruebaJugada: () => H.pruebaClasificada(),
    pruebaProgramada: () => must(D().pruebas.find((p) => p.faseId === "regionales" && p.estado === "programada"), "una prueba programada"),
    encuentroJugado: () => must(D().encuentros.find((e) => e.estado === "finalizado" && dep((D().pruebas.find((p) => p.id === e.pruebaId) || {}).deporteId).tipo === "conjunto"), "un partido de conjunto jugado"),
    pruebaDe: (e) => must(D().pruebas.find((p) => p.id === e.pruebaId), "la prueba del partido"),
    home: () => SITE + "index.html",
    pruebaJugadaEn: (tipo) => must(D().pruebas.find((p) => p.faseId === "regionales" && p.estado === "finalizada" && p.regionalId === H.regional(tipo).id && (tipo !== "individual" || (p.resultado && p.resultado.tipo === "clasificacion"))), "una prueba jugada de " + tipo),
    pruebaProgramadaEn: (tipo) => must(D().pruebas.find((p) => p.faseId === "regionales" && p.estado === "programada" && p.regionalId === H.regional(tipo).id), "una prueba programada de " + tipo),
    diaConDatos: (tipo) => must(D().encuentros.find((e) => e.fecha && D().pruebas.some((p) => p.id === e.pruebaId && p.faseId === "regionales" && p.regionalId === H.regional(tipo).id)), "un día con partidos").fecha,
    nombre: () => must(D().deportistas[0], "deportistas").nombre.split(" ")[0],
    /* Lo que se pulsa se elige entre lo que está pintado, no en los datos: el día por defecto de la grilla esconde parte de las pruebas. */
    card: (tipo) => { const n = "Ver " + H.regional(tipo).nombre; return all("a[aria-label^='Ver ']").find((a) => a.getAttribute("aria-label") === n) || null; },
    band: (pred) => all("a.nwx-band").filter(shown).find((a) => { const m = /[#&]p=([^&]+)/.exec(a.getAttribute("href") || ""), p = m && D().pruebas.find((x) => x.id === decodeURIComponent(m[1])); return p && (!pred || pred(p)); }) || null,
    jugadaConPartidos: (p) => p.estado === "finalizada" && D().encuentros.some((e) => e.pruebaId === p.id && e.estado === "finalizado"),
    partido: () => { const rows = all("a.nwx-mrow[href*='m='], .nwx-rowlink[data-a='fm']").filter(shown); return rows.find((r) => /finalizado/i.test(r.getAttribute("aria-label") || r.textContent)) || rows[0] || null; },
  };
  let CFG = null;
  const caso = (id) => CFG.casos.find((c) => c.id === id);

  /* ── Estado ── */
  const S = { open: false, obj: +ss.get(K_OBJ) || 1, sel: "", speed: 0.25, mode: "todo", wait: false, doneI: -1, run: null, paused: false, err: "", modal: false, mcase: "" };
  let token = 0, skip = false;
  /* Movimiento (cursor, scroll, desplegables) escala con la velocidad y se apaga con reduced-motion; la lectura escala pero nunca se apaga. «Siguiente» durante la animación la adelanta. */
  const TM = (ms, cap) => (skip || RM ? 0 : Math.min(cap, ms / S.speed));
  const TR = (ms, cap) => (skip ? 0 : Math.min(cap, ms / S.speed));
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const frames = (dur, fn, my) => new Promise((ok) => { const t0 = performance.now(); const f = (now) => { const t = dur > 0 && !skip ? Math.min(1, (now - t0) / dur) : 1; fn(ease(t)); if (t < 1 && my === token) requestAnimationFrame(f); else ok(); }; requestAnimationFrame(f); });

  /* ── Esperas ── */
  async function settle() {
    const t0 = Date.now();
    await sleep(40);
    while (Date.now() - t0 < 7000) {
      const root = document.getElementById("explorador"), v = document.getElementById("nwx-view");
      const busy = v && v.getAttribute("aria-busy") === "true", cambio = document.documentElement.classList.contains("nwx-cambio");
      if (document.readyState === "complete" && !busy && !cambio && !(root && v && !v.firstElementChild)) break;
      await sleep(80);
    }
    await sleep(60);
  }
  async function hold(ms, my) {
    let t = 0;
    while (t < ms) {
      if (my !== token || skip) return;
      await sleep(50);
      if (!S.paused) t += 50;
    }
  }
  /* El tiempo de lectura cuenta desde que aparece el rótulo, así el viaje del cursor ya es parte de él. */
  const readHold = (t0, ms, my) => hold(Math.max(0, ms - (performance.now() - t0)), my);

  /* ── Capas: velo de foco, aro, rótulo con controles, cursor, desplegable simulado, aviso ── */
  let dim, ring, tip, cur, toast;
  const barH = () => { const b = q1(".dl-bar"); return b && !b.hidden ? b.offsetHeight : 0; };
  const FOCO = [[/nwx-bver/, "Enlace «Ver en resultados ↗»"], [/nwx-tog/, "Botón «Ubicaciones y filtros»"], [/nwx-crumbs/, "Camino: eslabón para subir un nivel"], [/nwx-copy/, "Botón «Copiar enlace»"], [/nwx-dc\b/, "Eje de días"], [/nwx-dchip/, "Tira de días"], [/nwx-segb/, "Segmento de sexo o categoría"], [/nwx-pop/, "Sugerencias del buscador"], [/nwx-q/, "Buscador global"], [/nwx-rrow/, "Sugerencia del buscador"], [/nwx-dmi/, "Lista de pruebas (elige una)"], [/nwx-dmp/, "Panel con el resultado de la prueba"], [/ficha/, "Ficha del deportista"], [/nwx-band/, "Barra de la prueba en el calendario"], [/nwx-bmore/, "Enlace «Ampliar resultados»"], [/nwx-mrow|nwx-rowlink/, "Fila del partido"], [/nwx-minfo/, "Filas de partido: solo informativas"], [/nwx-pager/, "Paginación"], [/nwx-count/, "Conteo de deportistas"], [/nwx-fchips/, "Filtros activos"], [/nwx-days/, "Tira de días"], [/nwx-view/, "Contenido de la vista"]];
  const focoOf = (st, el) => {
    if (st.foco) return typeof st.foco === "function" ? st.foco(el) : st.foco;
    const lbl = el && el.getAttribute("aria-label");
    if (lbl && /^Ver /.test(lbl) && el.matches("a[aria-label^='Ver ']")) return "Tarjeta «" + lbl.slice(4) + "»";
    return (FOCO.find((f) => f[0].test((st.sel || "") + " " + (el ? el.className + " " + (el.id || "") : ""))) || [0, "Elemento resaltado"])[1];
  };

  const SP = { el: null, label: "", on: false, cr: null, snap: true, side: "" };
  let raf = 0, CX = null, CY = null, moving = false, pin = null, hov = null;
  const setSpot = (el, label) => { if (el !== SP.el) SP.side = ""; SP.el = el; SP.label = label || ""; SP.on = !!el; updTip(); loop(); };
  const loop = () => { if (!raf) raf = requestAnimationFrame(frame); };
  function frame() {
    raf = 0;
    if (!dim) return;
    const bottomB = innerHeight - barH() - 6;
    let t = null;
    if (SP.on && SP.el && SP.el.isConnected) {
      const r = SP.el.getBoundingClientRect(), pad = 6;
      const x = Math.max(3, r.left - pad), y = Math.max(3, r.top - pad), x2 = Math.min(innerWidth - 3, r.right + pad), y2 = Math.min(bottomB, r.bottom + pad);
      if (x2 - x > 14 && y2 - y > 14) t = { x, y, w: x2 - x, h: y2 - y };
    }
    if (t) {
      /* El recuadro se desliza hacia el nuevo objetivo; si venía oculto aparece ya en su sitio, sin cruzar la pantalla. */
      if (SP.snap || !SP.cr || RM) SP.cr = t;
      else { const k = 0.2; SP.cr = { x: SP.cr.x + (t.x - SP.cr.x) * k, y: SP.cr.y + (t.y - SP.cr.y) * k, w: SP.cr.w + (t.w - SP.cr.w) * k, h: SP.cr.h + (t.h - SP.cr.h) * k }; }
      SP.snap = false;
      [dim, ring].forEach((n) => { n.style.transform = "translate(" + SP.cr.x + "px," + SP.cr.y + "px)"; n.style.width = SP.cr.w + "px"; n.style.height = SP.cr.h + "px"; });
    } else SP.snap = true;
    dim.classList.toggle("on", !!t); ring.classList.toggle("on", !!t);
    placeTip(t ? anchorRect() : null);
    if (!moving && pin && pin.el.isConnected && CX != null) { const r = pin.el.getBoundingClientRect(); if (r.width) setCur(Math.min(innerWidth - 20, r.left + pin.dx), Math.min(bottomB - 10, r.top + pin.dy)); }
    if (S.run) loop();
  }
  /* Dentro de un menú o del desplegable, el rótulo se ancla a la lista entera para no tapar las opciones. */
  const anchorRect = () => { const box = SP.el.closest && SP.el.closest("[role=menu], .dl-dd"); if (!box) return SP.cr; const r = box.getBoundingClientRect(); return { x: r.left - 6, y: r.top - 6, w: r.width + 12, h: r.height + 12, list: true }; };
  function placeTip(a) {
    if (!tip || tip.hidden) return;
    const w = tip.offsetWidth, h = tip.offsetHeight, top0 = 8, bot = innerHeight - barH() - 10, rgt = innerWidth - 10;
    const clampX = (x) => Math.max(10, Math.min(rgt - w, x)), clampY = (y) => Math.max(top0, Math.min(bot - h, y));
    let x, y;
    if (!a) { x = rgt - w - 8; y = bot - h - 6; SP.side = ""; }
    else {
      const pos = {
        top: () => [clampX(a.x), a.y - h - 12, a.y - h - 12 >= top0],
        bottom: () => [clampX(a.x), a.y + a.h + 12, a.y + a.h + 12 + h <= bot],
        right: () => [a.x + a.w + 14, clampY(a.y), a.x + a.w + 14 + w <= rgt],
        left: () => [a.x - w - 14, clampY(a.y), a.x - w - 14 >= 10],
      };
      const order = a.list ? ["right", "left", "bottom", "top"] : ["top", "bottom", "right", "left"];
      const pick = (SP.side && pos[SP.side] && pos[SP.side]()[2] ? [SP.side] : []).concat(order).find((k) => pos[k]()[2]);
      if (pick) { SP.side = pick; [x, y] = pos[pick](); }
      else { SP.side = ""; x = clampX(a.x + a.w - w - 12); y = clampY(bot - h - 6); }
    }
    tip.style.transform = "translate(" + Math.round(x) + "px," + Math.round(y) + "px)";
  }
  function updTip() {
    if (!tip) return;
    tip.hidden = !S.run;
    if (!S.run) return;
    const c = caso(S.run.id), n = c.steps.length, i = Math.min(S.run.i, n - 1), last = i >= n - 1;
    tip.querySelector(".dl-tn").textContent = "Paso " + (i + 1) + " de " + n;
    tip.querySelector(".dl-tl").textContent = S.err ? "No se pudo completar el paso" : SP.label || (S.wait ? "Paso hecho" : c.titulo);
    tip.querySelector(".dl-tb").textContent = S.err || (S.wait && S.doneI >= 0 ? "Hecho: " + c.steps[S.doneI].body + (c.steps[S.doneI + 1] ? " · Sigue: " + c.steps[S.doneI + 1].body : " · Fin del caso") : c.steps[i].body);
    tip.classList.toggle("dl-terr", !!S.err);
    const nb = tip.querySelector(".dl-tnext");
    nb.textContent = (last && (S.wait || S.doneI >= i) ? "Terminar" : "Siguiente") + " ▸";
    nb.classList.toggle("dl-mute", !S.wait); nb.hidden = !!S.err;
    nb.title = S.wait ? "" : "Adelantar la animación de este paso";
    placeTip(SP.on && SP.cr && SP.el && SP.el.isConnected ? anchorRect() : null);
  }

  /* ── Cursor ilustrativo: viaja en curva suave y nunca se teletransporta ── */
  const setCur = (x, y) => { CX = x; CY = y; cur.style.transform = "translate(" + Math.round(x) + "px," + Math.round(y) + "px)"; };
  const setHov = (el) => { if (hov && hov !== el) hov.classList.remove("dl-hov"); hov = el; if (el) el.classList.add("dl-hov"); };
  const hoverAt = (x, y) => { const e = document.elementFromPoint(x + 3, y + 3), o = e && e.closest(".nw-menu-item, .dl-ddo"); if (o || (hov && hov.matches(".nw-menu-item, .dl-ddo"))) setHov(o); };
  const pointOf = (el) => { const r = el.getBoundingClientRect(), bottomB = innerHeight - barH() - 12; return { x: Math.max(12, Math.min(innerWidth - 24, r.left + Math.min(r.width / 2, Math.max(22, r.width * 0.3)))), y: Math.max(12, Math.min(bottomB, r.top + Math.min(r.height / 2, 26))), r }; };
  async function moveTo(x, y, my) {
    cur.hidden = false;
    if (CX == null) { const b = document.getElementById("dl-btn"), r = b && b.getBoundingClientRect(); setCur(r && r.width ? r.left + r.width / 2 : innerWidth - 80, r && r.width ? r.bottom + 4 : 40); }
    const x0 = CX, y0 = CY, dx = x - x0, dy = y - y0, d = Math.hypot(dx, dy);
    if (d < 2) return;
    /* La curva se dobla hacia un lado con un punto de control perpendicular, como una mano que no va en línea recta. */
    const bend = Math.min(120, d * 0.16), cx = x0 + dx / 2 - (dy / d) * bend, cy = y0 + dy / 2 + (dx / d) * bend;
    moving = true; pin = null;
    await frames(TM(Math.min(650, 220 + d * 0.4), 1500), (e) => { const u = 1 - e; setCur(u * u * x0 + 2 * u * e * cx + e * e * x, u * u * y0 + 2 * u * e * cy + e * e * y); hoverAt(CX, CY); }, my);
    moving = false;
  }
  async function press(el, my) {
    cur.classList.remove("click"); void cur.offsetWidth; cur.classList.add("click"); ring.classList.add("pulse");
    if (el) el.classList.add("dl-press");
    await sleep(Math.max(120, TM(220, 520)));
    setTimeout(() => { cur.classList.remove("click"); ring.classList.remove("pulse"); if (el) el.classList.remove("dl-press"); }, 420);
    if (my !== token) throw new Error("stop");
  }

  /* ── Scroll visible: animado por cuadros (el sitio puede tener scroll-behavior:smooth) y con el foco oculto mientras se mueve ── */
  const cssPx = (v) => parseFloat(getComputedStyle(document.documentElement).getPropertyValue(v)) || 0;
  function scrollDelta(el) {
    const r = el.getBoundingClientRect(), hd = q1("header"), dock = document.getElementById("nwx-dock");
    const top = Math.max(cssPx("--nwx-top"), hd ? Math.max(0, hd.getBoundingClientRect().bottom) : 0) + (dock ? dock.offsetHeight : 0) + 70;
    const bot = innerHeight - barH() - 24, room = bot - top;
    if (r.top >= top && r.bottom <= bot) return 0;
    if (r.height > room) return r.top - top;
    return r.top - (top + (room - r.height) / 2);
  }
  async function scrollBy(delta, my) {
    const y0 = scrollY, max = document.documentElement.scrollHeight - innerHeight, y1 = Math.max(0, Math.min(max, y0 + delta)), d = y1 - y0;
    if (Math.abs(d) < 4) return;
    await frames(TM(Math.min(900, 280 + Math.abs(d) * 0.45), 2600), (e) => window.scrollTo({ top: y0 + d * e, behavior: "instant" }), my);
  }
  async function focusOn(el, label, my, withCursor) {
    if (!el.closest("header, [role=menu], .dl-dd, .dl-back")) {
      const d = scrollDelta(el);
      if (Math.abs(d) > 4) { SP.on = false; pin = null; await sleep(TM(200, 300)); await scrollBy(d, my); }
    }
    setSpot(el, label);
    const t0 = performance.now();
    if (withCursor !== false) { const p = pointOf(el); await moveTo(p.x, p.y, my); const r = el.getBoundingClientRect(); pin = { el, dx: CX - r.left, dy: CY - r.top }; if (!el.matches(".nw-menu-item, .dl-ddo, [role=menu] a")) setHov(el); }
    return t0;
  }

  /* ── Desplegable simulado: un <select> nativo no se abre por código, así que se dibuja una lista con sus opciones reales ── */
  let dd = null;
  function openDD(sel, goal) {
    closeDD(true);
    const r = sel.getBoundingClientRect(), top0 = 8, bot = innerHeight - barH() - 10;
    dd = document.createElement("div"); dd.className = "dl-dd"; dd.setAttribute("aria-hidden", "true");
    let goalEl = null;
    [].forEach.call(sel.options, (o) => {
      if (!o.value && !o.textContent.trim()) return;
      const d = document.createElement("div"); d.className = "dl-ddo" + (o.selected ? " cur" : "") + (o.disabled ? " off" : ""); d.textContent = o.textContent.trim();
      dd.appendChild(d); if (o === goal) goalEl = d;
    });
    document.getElementById("dl-root").appendChild(dd);
    const w = Math.max(r.width, 220), full = dd.scrollHeight, below = bot - r.bottom - 6, above = r.top - 6 - top0, up = below < Math.min(full, 200) && above > below;
    const h = Math.min(full, 320, up ? above : below);
    dd.style.width = w + "px"; dd.style.maxHeight = h + "px"; dd.style.left = Math.max(8, Math.min(innerWidth - w - 8, r.left)) + "px";
    dd.style.top = (up ? r.top - 4 - h : r.bottom + 4) + "px"; dd.classList.toggle("up", up);
    void dd.offsetWidth; dd.classList.add("on");
    return goalEl;
  }
  function closeDD(now) { if (!dd) return; const d = dd; dd = null; if (now) d.remove(); else { d.classList.remove("on"); setTimeout(() => d.remove(), 220); } }

  /* ── Avisos ── */
  function showToast(html) { if (!toast) return; toast.innerHTML = html; toast.hidden = false; void toast.offsetWidth; toast.classList.add("on"); }
  function hideToast() { if (toast) { toast.classList.remove("on"); toast.hidden = true; } }
  let backEl = null;
  const backShow = () => { if (backEl) return backEl; backEl = document.createElement("div"); backEl.className = "dl-back"; backEl.innerHTML = '<span class="dl-bk" aria-hidden="true">←</span><span>Atrás del navegador</span>'; document.getElementById("dl-root").appendChild(backEl); void backEl.offsetWidth; backEl.classList.add("on"); return backEl; };
  const backHide = () => { if (backEl) { backEl.remove(); backEl = null; } };

  /* ── Pasos ── */
  const pickEl = (st) => {
    if (st.find) return st.find();
    let els = all(st.sel);
    if (st.text) els = els.filter((e) => st.text.test(e.textContent));
    const vis = els.filter(shown);
    if (vis.length) els = vis;
    if (!els.length) return null;
    return st.pick === "last" ? els[els.length - 1] : els[st.pick || 0] || null;
  };
  const save = (id, i, extra) => ss.set(K_RUN, JSON.stringify(Object.assign({ id, i, speed: S.speed, mode: S.mode, cur: CX != null ? [CX, CY] : null }, extra || {})));
  const sameDoc = (url) => { const a = new URL(url, location.href); return a.pathname === location.pathname && a.search === location.search; };
  const forever = async (my) => { const t0 = Date.now(); while (my === token && Date.now() - t0 < 9000) await sleep(100); };
  /* Navegación propia: se cierra el cajón (sin salto de layout), se guarda dónde sigue y entra el velo «Abriendo…». */
  function leave(c, i, txt, extra) { S.open = false; render(); save(c.id, i + 1, Object.assign({ leaving: txt, after: "nav" }, extra)); veilShow(txt); }
  async function esperar(my) {
    if (S.mode === "auto") return;
    S.wait = true; render();
    while (S.wait && my === token) await sleep(60);
    S.wait = false; render();
  }
  const closeMenus = async () => { if (q1("[role=menu]")) { document.body.click(); await sleep(120); } };
  /* El menú del sitio se alterna con su botón y se cierra con cualquier clic fuera: se cierra antes y se reintenta. */
  async function openMenu(btn, st) {
    for (let k = 0; k < 3; k++) {
      await closeMenus();
      btn.click();
      for (let w = 0; w < 10 && !q1("[role=menu]"); w++) await sleep(40);
      const it = all("[role=menu] a").filter((a) => st.item.test(a.textContent))[st.nth || 0];
      if (it) return it;
    }
    throw new Error("No se abrió el menú «" + btn.textContent.trim() + "»");
  }
  const grupoDe = (a) => { let n = a; while ((n = n.previousElementSibling)) if (!n.matches("a, [role=separator]")) return n.textContent.trim(); return ""; };

  async function doStep(c, i, my) {
    const st0 = c.steps[i];
    const st = Object.assign({}, st0, { sel: typeof st0.sel === "function" ? st0.sel() : st0.sel, pick: typeof st0.pick === "function" ? st0.pick() : st0.pick });
    const READ = TR(850, 3400);
    console.log("[demo] caso", c.id, "paso", i + 1 + "/" + c.steps.length, st.t);
    hideToast();
    if (st.t === "goto") {
      const url = st.url();
      if (sameDoc(url)) { setSpot(null); await scrollBy(-scrollY, my); const h = new URL(url, location.href).hash; if (h !== location.hash) location.hash = h; return; }
      leave(c, i, /index\.html$/.test(url) ? "Abriendo el inicio del sitio…" : "Abriendo la vista…", st.auto ? { auto: true } : null);
      location.assign(url);
      return forever(my);
    }
    if (st.t === "menu") {
      const btn = all("header button[aria-haspopup=menu]").find((b) => st.label.test(b.textContent.trim()) && shown(b));
      if (!btn) throw new Error("No encuentro el menú del encabezado");
      const name = btn.textContent.trim().replace(/\s*▾?$/, "");
      await closeMenus();
      let t0 = await focusOn(btn, "Menú «" + name + "»", my);
      await readHold(t0, TR(600, 2400), my);
      await press(btn, my);
      let it = await openMenu(btn, st);
      const txt = it.textContent.trim().replace(/\s+/g, " "), grp = grupoDe(it);
      await sleep(TM(200, 450));
      const item = it.querySelector("[role=menuitem]") || it;
      t0 = await focusOn(item, "Opción «" + (grp ? grp + " · " : "") + txt + "»", my);
      await readHold(t0, READ, my);
      if (!it.isConnected) it = await openMenu(btn, st);
      await press(item, my);
      if (st.nav) leave(c, i, "Abriendo " + name + " · " + (grp ? grp + " · " : "") + txt + "…");
      it.click();
      if (st.nav) return forever(my);
      return;
    }
    if (st.t === "select") {
      const find = () => all("select[data-sel]").find((x) => [].some.call(x.options, (o) => o.value.indexOf(st.prefix) === 0) && shown(x));
      let sel = find();
      if (!sel) throw new Error("No hay un selector de " + st.prefix.replace(":", "") + " en esta vista");
      const name = sel.getAttribute("aria-label") || st.prefix.replace(":", "");
      const want = st.value(), goal = [].find.call(sel.options, (o) => o.value === want) || [].find.call(sel.options, (o) => o.value.indexOf(st.prefix) === 0 && o.value !== sel.value);
      if (!goal) throw new Error("No hay otra opción para elegir");
      let t0 = await focusOn(sel, "Selector «" + name + "»", my);
      await readHold(t0, TR(650, 2600), my);
      await press(sel, my);
      const gEl = openDD(sel, goal);
      await sleep(TM(220, 420));
      if (gEl && dd) { const box = dd, s0 = box.scrollTop, s1 = Math.max(0, gEl.offsetTop - box.clientHeight / 2 + gEl.offsetHeight / 2); await frames(TM(400, 900), (e) => { box.scrollTop = s0 + (s1 - s0) * e; }, my); }
      t0 = await focusOn(gEl || dd, "Opción «" + goal.textContent.trim() + "» de «" + name + "»", my);
      await readHold(t0, TR(650, 2600), my);
      await press(gEl, my);
      if (gEl) gEl.classList.add("pick");
      await sleep(TM(180, 400));
      closeDD(); setSpot(null);
      sel = find() || sel;
      sel.value = goal.value; sel.dispatchEvent(new Event("change", { bubbles: true }));
      return;
    }
    if (st.t === "back") {
      const b = backShow();
      const t0 = await focusOn(b, "Botón «Atrás» del navegador", my);
      await readHold(t0, READ, my);
      await press(b, my);
      save(c.id, i + 1);
      history.back(); await sleep(350); setSpot(null); backHide();
      return;
    }
    if (st.t === "hash") { location.hash = st.value(); return; }
    const target = pickEl(st);
    if (st.t === "note") {
      if (target) { const t0 = await focusOn(target, focoOf(st, target), my, false); await readHold(t0, TR(1000, 4000), my); }
      else { setSpot(null); await hold(TR(1000, 4000), my); }
      return "note";
    }
    if (!target) throw new Error("No encuentro «" + focoOf(st, null) + "» en esta vista");
    const t0 = await focusOn(target, focoOf(st, target), my);
    if (st.t === "type") {
      await readHold(t0, TR(500, 2000), my);
      await press(target, my);
      target.focus(); target.value = ""; target.dispatchEvent(new Event("input", { bubbles: true }));
      for (const ch of String(st.val())) {
        if (my !== token) return;
        target.value += ch; target.dispatchEvent(new Event("input", { bubbles: true }));
        await sleep(TM(70 + Math.random() * 70, 560));
      }
      await sleep(Math.max(150, TM(200, 500)));
      const pop = ["#nwx-pop", "#nwx-ib-list"].map(q1).find((x) => x && !x.hidden && x.offsetHeight > 0);
      if (pop) { const t1 = await focusOn(pop, "Sugerencias mientras se escribe", my, false); await readHold(t1, READ, my); }
      return;
    }
    await readHold(t0, READ, my);
    await press(target, my);
    setHov(null);
    if (st.nav) save(c.id, i + 1, { after: "nav" });
    target.click();
    if (st.toast === "copy") {
      await sleep(450);
      const ok = /copiado/i.test((target.querySelector(".nwx-cpl") || target).textContent);
      showToast("<b>" + (ok ? "Enlace copiado" : "Este es el enlace de la vista") + "</b><code>" + esc(location.href) + "</code>" + (ok ? "" : "<small>El navegador no dio permiso para copiar; el enlace es este.</small>"));
    }
    if (st.nav) return forever(my);
    /* Tras el clic se deja ver la reacción del sitio (pliegue, repintado) antes de seguir. */
    await sleep(Math.max(150, TM(320, 900)));
  }

  async function run(id, from, resume) {
    const my = ++token, c = caso(id);
    if (!c) return;
    if (q1("[role=menu]")) document.body.click();
    S.err = ""; S.paused = false; S.open = false;
    S.run = { id, i: from || 0 }; S.doneI = -1;
    if (resume && resume.cur) { setCur(resume.cur[0], resume.cur[1]); cur.hidden = false; }
    save(id, from || 0);
    render();
    if (resume && (from || 0) > 0 && !resume.auto) { S.doneI = from - 1; await settle(); setTimeout(veilHide, 60); await esperar(my); if (my !== token) return; }
    for (let i = from || 0; i < c.steps.length; i++) {
      if (my !== token) return;
      skip = false; S.run.i = i; render();
      await settle(); veilHide();
      let r;
      try { r = await doStep(c, i, my); } catch (e) { if (my === token && e.message !== "stop") { S.err = e.message; console.warn("[demo] fallo", id, e.message); closeDD(true); setSpot(null); render(); } return; }
      if (my !== token) return;
      skip = false; S.doneI = i; await settle();
      if (r !== "note") { pin = null; if (!SP.el || !SP.el.isConnected) setSpot(null); }
      if (!c.steps[i].auto) await esperar(my);
      if (my !== token) return;
    }
    console.log("[demo] fin", id, location.hash);
    stop(true);
  }
  function stop(done) {
    token++; S.wait = false; ss.del(K_RUN); setSpot(null); closeDD(true); hideToast(); backHide(); setHov(null); pin = null; if (cur) cur.hidden = true;
    if (q1("[role=menu]")) document.body.click();
    const c = S.run && caso(S.run.id);
    if (done && c) { S.sel = c.id; S.obj = c.obj; }
    S.run = null; S.err = ""; S.open = !!done;
    render();
  }

  /* Interruptor de la final ficticia: lo lee explorador.js al cargar, por eso recarga. Apagado por defecto. */
  const finalOn = () => { try { return localStorage.getItem("nwx-demo-final") === "1"; } catch (e) { return false; } };
  /* ── Vista: cajón, barra inferior, modal ── */
  const disabledReason = (c) => { if (!D()) return ""; try { c.steps.forEach((s) => { if (s.url) s.url(); if (typeof s.sel === "function") s.sel(); if (s.value) s.value(); }); return ""; } catch (e) { return e.message; } };
  function sheetHtml() {
    const objs = CFG.objetivos.map((o) => '<button type="button" class="dl-obj' + (o.n === S.obj ? " on" : "") + '" data-dl="obj" data-n="' + o.n + '"' + (o.proximo ? " disabled" : "") + ' aria-pressed="' + (o.n === S.obj) + '"><b>' + o.n + "</b> " + esc(o.t) + (o.proximo ? "<em>próximamente</em>" : "") + "</button>").join("");
    const list = CFG.casos.filter((c) => c.obj === S.obj);
    const cur = caso(S.sel) && caso(S.sel).obj === S.obj ? caso(S.sel) : list[0];
    const cases = list.map((c) => { const why = disabledReason(c); return '<li class="dl-row"><button type="button" class="dl-case' + (cur && c.id === cur.id ? " on" : "") + '" data-dl="sel" data-id="' + c.id + '"><span class="dl-n">' + c.id + '</span><span class="dl-ct"><b>' + esc(c.titulo) + "</b><small>" + (why ? esc(why) : c.clics && c.clics[0] ? c.clics[0] + " → " + c.clics[1] + " clics" : "clic a clic, automatizado") + '</small></span></button><button type="button" class="dl-btn dl-play" data-dl="play" data-id="' + c.id + '"' + (why ? " disabled" : "") + ' aria-label="Automatizar caso ' + c.id + '" title="Automatizar">▶</button></li>'; }).join("");
    const info = cur ? '<p class="dl-p">' + esc(cur.banner) + '</p><p class="dl-falta"><b>Pendiente</b> ' + esc(cur.falta) + "</p>" : "";
    return '<div class="dl-handle"></div><div class="dl-head"><button type="button" class="dl-x" data-dl="close" aria-label="Cerrar demo">×</button><span class="dl-pt">Panel demo</span><button type="button" class="dl-sw" data-dl="final" role="switch" aria-checked="' + finalOn() + '"><i aria-hidden="true"></i>' + (finalOn() ? "Desactivar" : "Activar") + ' final de ejemplo</button></div>' +
      '<div class="dl-objs" role="group" aria-label="Objetivos">' + objs + '</div><div class="dl-body"><div class="dl-col"><div class="dl-k">LO QUE VERÁS</div>' + info + '</div><div class="dl-col"><div class="dl-k">CASOS · PULSA PARA AUTOMATIZAR</div><ul class="dl-cases">' + cases + '</ul></div></div>';
  }
  /* La barra se arma una vez y se actualiza en su sitio: rehacerla con innerHTML le quitaba el foco de teclado al botón pulsado. */
  function barInit(bar) {
    bar.innerHTML = '<span class="dl-chip">DEMO</span><div class="dl-bt"><b class="dl-bti"></b><span class="dl-bts"></span></div><button type="button" class="dl-btn dl-ic dl-bnext" data-dl="next"></button><button type="button" class="dl-btn dl-ic" data-dl="stop" aria-label="Detener" title="Detener">⏹</button><button type="button" class="dl-btn dl-ghost dl-ic" data-dl="restart" aria-label="Reiniciar" title="Reiniciar">↺</button><span class="dl-div" aria-hidden="true"></span><button type="button" class="dl-btn dl-ghost" data-dl="antes">Antes y ahora</button>';
  }
  function barUpd(bar) {
    const c = caso(S.run.id), n = c.steps.length, i = Math.min(S.run.i, n - 1), last = i >= n - 1, st = c.steps[i];
    bar.querySelector(".dl-bti").textContent = c.id + " · " + c.titulo;
    const sub = bar.querySelector(".dl-bts");
    sub.innerHTML = S.err ? '<em class="dl-err">' + esc(S.err) + "</em>" : esc(S.wait && S.doneI >= 0 ? "Hecho: " + c.steps[S.doneI].body + (c.steps[S.doneI + 1] ? " · Sigue: " + c.steps[S.doneI + 1].body : " · Fin del caso") : st.body);
    const nb = bar.querySelector(".dl-bnext"), lbl = last && (S.wait || S.doneI >= i) ? "Terminar" : "Siguiente";
    nb.className = "dl-btn dl-ic dl-bnext " + (S.wait ? "dl-go" : "dl-ghost");
    nb.setAttribute("aria-label", lbl); nb.title = lbl; nb.textContent = lbl === "Terminar" ? "✓" : "⏭";
  }
  function modalHtml() {
    const c = caso(S.mcase) || CFG.casos[0];
    return '<div class="dl-md" role="dialog" aria-modal="true" aria-label="Antes y ahora"><div class="dl-mh"><div><div class="dl-k">ANTES Y AHORA · caso ' + esc(c.id) + '</div><div class="dl-mt">' + esc(c.titulo) + '</div></div><span class="dl-sp"></span><button type="button" class="dl-x" data-dl="mclose" aria-label="Cerrar">×</button></div>' +
      '<div class="dl-mb"><div class="dl-pair">' +
      '<figure class="dl-shot"><figcaption class="dl-k dl-was-k">ANTES · diseño anterior</figcaption><img src="' + BASE + "antes/" + esc(c.img) + '" alt="Captura del diseño anterior: ' + esc(c.titulo) + '" onerror="this.replaceWith(Object.assign(document.createElement(\'p\'),{className:\'dl-noimg\',textContent:\'Sin captura de este caso todavía.\'}))"></figure>' +
      '<figure class="dl-shot dl-shot-now"><figcaption class="dl-k dl-now">AHORA · explorador nuevo</figcaption><img src="' + BASE + "ahora/" + esc(c.id) + '.png" alt="Captura del diseño nuevo: ' + esc(c.titulo) + '" onerror="this.replaceWith(Object.assign(document.createElement(\'p\'),{className:\'dl-noimg\',textContent:\'Sin captura de este caso todavía.\'}))"></figure></div>' +
      '<div class="dl-tx">' + (c.clics && c.clics[0] ? '<div class="dl-clics"><b>' + c.clics[0] + "</b> → <b>" + c.clics[1] + "</b> clics</div>" : "") +
      '<div class="dl-why"><div class="dl-k dl-ok">POR QUÉ ES MEJOR</div><p>' + esc(c.mejor) + '</p></div><div class="dl-k dl-now">CÓMO ES AHORA</div><p>' + esc(c.ahora) + '</p>' +
      '<div class="dl-k">CÓMO ERA</div><p class="dl-was">' + esc(c.antes) + '</p></div></div></div>';
  }
  let modalWas = false, modalFrom = null;
  function render() {
    const root = document.getElementById("dl-root");
    if (!root || !CFG) return;
    const sheet = root.querySelector(".dl-sheet"), bar = root.querySelector(".dl-bar"), modal = root.querySelector(".dl-modal");
    document.documentElement.classList.toggle("dl-push", S.open && !S.run && innerWidth > 900);
    document.documentElement.classList.toggle("dl-run", !!S.run);
    sheet.hidden = !(S.open && !S.run);
    if (!sheet.hidden) {
      const f = document.activeElement, key = f && sheet.contains(f) && f.dataset.dl ? '[data-dl="' + f.dataset.dl + '"]' + (f.dataset.id ? '[data-id="' + f.dataset.id + '"]' : f.dataset.n ? '[data-n="' + f.dataset.n + '"]' : "") : "";
      sheet.innerHTML = sheetHtml();
      const back = key && sheet.querySelector(key); if (back) back.focus();
    }
    bar.hidden = !S.run; if (S.run) barUpd(bar);
    S.paused = !!(S.run && S.modal);
    modal.hidden = !S.modal;
    if (S.modal && !modalWas) { modalFrom = document.activeElement; modal.innerHTML = modalHtml(); const x = modal.querySelector(".dl-x"); if (x) x.focus(); }
    if (!S.modal && modalWas && modalFrom && modalFrom.isConnected) modalFrom.focus();
    modalWas = S.modal;
    const b = document.getElementById("dl-btn"); if (b) { b.setAttribute("aria-expanded", String(S.open)); b.classList.toggle("on", S.open || !!S.run); }
    updTip(); if (S.run) loop();
  }

  /* ── Eventos: los clics de la capa no llegan a document, así no cierran el menú ni las sugerencias del sitio ── */
  function onAction(t, e) {
    const a = t.dataset.dl;
    if (a === "final") { try { finalOn() ? localStorage.removeItem("nwx-demo-final") : localStorage.setItem("nwx-demo-final", "1"); } catch (e) { /* sin storage */ } location.reload(); return; }
    if (a === "close") { S.open = false; }
    else if (a === "obj") { S.obj = +t.dataset.n; ss.set(K_OBJ, S.obj); }
    else if (a === "sel") { S.sel = t.dataset.id; }
    else if (a === "play") { if (e && e.clientX) { CX = e.clientX; CY = e.clientY; } run(t.dataset.id || S.sel, 0); return; }
    else if (a === "next") { if (S.err) return; if (S.wait) S.wait = false; else skip = true; return; }
    else if (a === "stop") { stop(false); return; }
    else if (a === "restart") { const id = S.run && S.run.id; if (id) { ["nwx-entrada", "nwx-lente", "nwx-fusion", "nwx-seld", "nwx-seld-NAC"].forEach(ss.del); run(id, 0); } return; }
    else if (a === "antes") { S.modal = true; S.mcase = t.dataset.id || (S.run && S.run.id) || (caso(S.sel) && S.sel) || (CFG.casos.find((c) => c.obj === S.obj) || {}).id; }
    else if (a === "mclose") { S.modal = false; }
    render();
  }
  document.addEventListener("click", (e) => {
    const t = e.target.closest("#dl-btn"); if (!t || !CFG) return;
    e.preventDefault(); e.stopPropagation(); if (S.run) return; S.open = !S.open; render();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && (S.modal || (S.open && !S.run))) { S.modal ? (S.modal = false) : (S.open = false); render(); return; }
    /* Con la demo en marcha, → avanza como «Siguiente», salvo mientras se escribe en un campo. */
    if (S.run && !S.modal && (e.key === "ArrowRight" || e.key === "PageDown") && !/^(INPUT|TEXTAREA|SELECT)$/.test((e.target || {}).tagName || "")) { e.preventDefault(); onAction({ dataset: { dl: "next" } }); }
  });
  addEventListener("hashchange", () => { if (!S.run) render(); });
  addEventListener("resize", () => { if (S.run) loop(); });

  /* ── Montaje ── */
  function mount() {
    const root = document.createElement("div"); root.id = "dl-root";
    root.innerHTML = '<div class="dl-sheet" hidden></div><div class="dl-bar" hidden></div><div class="dl-dim" aria-hidden="true"></div><div class="dl-ring" aria-hidden="true"></div>' +
      '<div class="dl-tip" hidden role="group" aria-label="Paso de la demo"><div class="dl-th"><small class="dl-tk">FOCO</small><small class="dl-tn"></small></div><b class="dl-tl"></b><p class="dl-tb" aria-live="polite"></p><div class="dl-ta"><button type="button" class="dl-tnext" data-dl="next"></button><button type="button" class="dl-trs" data-dl="restart" aria-label="Reiniciar el caso">↺ Reiniciar</button></div></div>' +
      '<div class="dl-cursor" hidden aria-hidden="true"><svg width="26" height="26" viewBox="0 0 24 24"><path d="M5 3l14 8-6.2 1.6L9.6 19z" fill="#fff" stroke="#282834" stroke-width="1.6" stroke-linejoin="round"/></svg></div><div class="dl-toast" hidden role="status"></div><div class="dl-modal" hidden></div>';
    document.body.appendChild(root);
    dim = root.querySelector(".dl-dim"); ring = root.querySelector(".dl-ring"); tip = root.querySelector(".dl-tip"); cur = root.querySelector(".dl-cursor"); toast = root.querySelector(".dl-toast");
    barInit(root.querySelector(".dl-bar"));
    root.addEventListener("click", (e) => { e.stopPropagation(); const t = e.target.closest("[data-dl]"); if (t && root.contains(t) && !t.disabled) onAction(t, e); });
    /* Pulsar un control de la demo no le quita el foco al campo del sitio (la lista de instituciones se cierra al perderlo). */
    root.addEventListener("mousedown", (e) => { if (S.run && e.target.closest(".dl-tip button, .dl-bar button")) e.preventDefault(); });
    root.querySelector(".dl-modal").addEventListener("click", (e) => { if (e.target.classList.contains("dl-modal")) { S.modal = false; render(); } });
    const es = all("button").find((b) => b.textContent.trim() === "ES" && /border-white/.test(b.className));
    /* behaviors.js ya pinta el botón «Demo» junto a ES, sin acción: se reutiliza; si falta, se crea. */
    let btn = all("button").find((b) => b.textContent.trim() === "Demo" && /border-white/.test(b.className));
    if (!btn) {
      btn = document.createElement("button"); btn.type = "button"; btn.textContent = "Demo";
      if (es) { btn.className = es.className; es.parentNode.insertBefore(btn, es.nextSibling); } else { btn.className = "dl-float"; document.body.appendChild(btn); }
    }
    btn.id = "dl-btn"; btn.setAttribute("aria-haspopup", "dialog"); btn.setAttribute("aria-expanded", "false");
    render();
  }
  const loadScript = (src) => new Promise((ok, no) => { const s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = () => no(new Error("No cargó " + src)); document.head.appendChild(s); });
  async function boot() {
    try {
      await loadScript(BASE + "demo-casos.js");
      if (!D()) await loadScript(SITE + "_assets/js/explorador-datos.js").catch(() => {});
      CFG = window.DemoCasos(H);
      mount();
      const saved = readRun();
      if (qs.get("dlfast")) { S.speed = 40; S.mode = "auto"; } if (qs.get("dlspeed")) S.speed = +qs.get("dlspeed");
      if (saved && caso(saved.id)) { S.speed = qs.get("dlspeed") ? +qs.get("dlspeed") : qs.get("dlfast") ? 40 : saved.speed || 0.25; S.mode = qs.get("dlfast") ? "auto" : saved.mode || "todo"; run(saved.id, saved.i, saved); }
      else if (qs.get("dl") === "run" && caso(qs.get("dlcaso"))) { veilHide(); if (qs.get("dlmode")) S.mode = qs.get("dlmode"); run(qs.get("dlcaso"), +qs.get("dlfrom") || 0); }
      else { veilHide(); if (qs.get("dl") === "open") { S.open = true; if (qs.get("dlcaso")) S.sel = qs.get("dlcaso"); if (caso(S.sel)) S.obj = caso(S.sel).obj; render(); }
        else if (qs.get("dl") === "antes") { S.modal = true; S.mcase = qs.get("dlcaso") || "1.1"; render(); } }
    } catch (e) { veilHide(); console.warn("[demo] desactivada:", e.message); }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
