/* Explorador (Calendario y resultados · Deportistas) sobre los datos congelados de la fase Regionales.
   Sin conteos, sin colegios y sin sedes: solo lo que el API público ya entrega. Estado de filtros en el hash. */
(function boot(me) {
  "use strict";
  const D = window.EXPLORADOR_DATOS;
  const root = document.getElementById("explorador");
  if (!D || !root) return;
  /* Medallas <nao-award>: módulo ES local, edición Colombia (la de JIN). Hay que servir por HTTP. */
  if (!customElements.get("nao-award") && !document.querySelector("script[data-nao-awards]")) { const m = document.createElement("script"); m.type = "module"; m.dataset.naoAwards = ""; m.src = ((me && me.src) || "").replace(/explorador\.js(\?.*)?$/, "awards.js"); document.head.appendChild(m); }
  /* Demo: la final de ejemplo (datos ficticios) va siempre encendida. */
  const DEMO = (() => { let on = true; try { on = on || localStorage.getItem("nwx-demo-final") === "1"; } catch (e) { /* sin storage */ } return on; })();
  if (DEMO && !window.EXPLORADOR_DEMO) { const s = document.createElement("script"); s.src = ((me && me.src) || "").replace(/explorador\.js(\?.*)?$/, "explorador-datos-demo.js"); s.onload = () => boot(me); document.head.appendChild(s); return; }
  if (DEMO && !D.demoFusion) { D.demoFusion = true; ["pruebas", "encuentros", "participaciones", "deportistas", "instituciones", "sedes"].forEach((k) => { D[k] = D[k].concat(window.EXPLORADOR_DEMO[k] || []); }); }
  /* Juego limpio (DIG-CT-09): columna JL en las tablas de posiciones de los deportes de conjunto.
     Los puntos son DE EJEMPLO: la foto de los Regionales no los trae. Salen de la tabla de puntos de cada
     deporte (reglamentos 2026), repartidos de forma determinista por partido jugado. */
  const COL_TIP = { PJ: "Partidos jugados", G: "Partidos ganados", E: "Partidos empatados", P: "Partidos perdidos", GF: "Goles a favor", GC: "Goles en contra", PF: "Puntos a favor", PC: "Puntos en contra", SG: "Sets ganados", SP: "Sets perdidos", Dif: "Diferencia: a favor menos en contra", Pts: "Puntos de la tabla", JL: "Juego limpio: puntos por tarjetas y sanciones. Menos puntos es mejor y desempata" };
  const colTh = (c) => COL_TIP[c] ? '<span class="nwx-tip' + (c === "JL" ? " nwx-tip--jl" : "") + '" tabindex="0" data-tip="' + esc(COL_TIP[c]) + '" aria-label="' + esc(COL_TIP[c]) + '">' + esc(c) + "</span>" : esc(c);
  const JL_TABLA = { "Fútbol": [10, 15, 30, 80, 100], "Fútbol sala": [10, 15, 30, 80, 100], "Fútbol de Salón": [10, 15, 30, 80, 100], "Baloncesto": [10, 20, 30, 50, 80, 100], "Baloncesto 3x3": [20, 30, 50, 100], "Voleibol": [10, 30, 80, 90, 100] };
  const jlHash = (t) => { let h = 2166136261; for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const jlPuntos = (disc, key, pj) => { const tb = JL_TABLA[disc]; let tot = 0; for (let k = 0; k < pj; k++) { const h = jlHash(key + "|" + k); if (h % 2 === 0) tot += tb[(h >>> 8) % tb.length]; } return tot; };
  if (!D.jlHecho) { D.jlHecho = true; (D.pruebas || []).concat((window.EXPLORADOR_DEMO && window.EXPLORADOR_DEMO.pruebas) || []).forEach((p) => { const r = p.resultado; if (!r || r.tipo !== "posiciones" || !JL_TABLA[p.disciplina]) return; r.tablas.forEach((t) => { if (t.columnas.indexOf("JL") > -1) return; if (t.columnas.indexOf("Pts") < 0 && /^Fútbol/.test(p.disciplina)) { const iG = t.columnas.indexOf("G"), iE = t.columnas.indexOf("E"); t.columnas.push("Pts"); t.filas.forEach((f) => { f.v.push(String(3 * (+f.v[iG] || 0) + (iE > -1 ? +f.v[iE] || 0 : 0))); }); } t.filas.forEach((f) => { f.v.unshift(String(jlPuntos(p.disciplina, p.id + f.refId, +f.v[0] || 0))); }); t.columnas.unshift("JL"); }); }); }

  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const norm = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const by = (a) => Object.fromEntries(a.map((x) => [x.id, x]));
  const DEPO = by(D.deportes), REG = by(D.regionales), DPT = by(D.departamentos), ATH = by(D.deportistas), INS = by(D.instituciones);
  const REGIONALES = D.regionales.filter((r) => r.faseId === "regionales");
  const GRUPO_TIPO = { "Atletismo": "individual", "Deportes de conjunto": "conjunto" };
  const TIPO_LABEL = { individual: "Individual", conjunto: "De conjunto" };
  const SEXO_LABEL = { H: "Hombre", M: "Mujer", MX: "Mixto" };
  const ORDER = ["tipo", "deporte", "prueba", "regional", "depto", "sexo", "cat", "inst"];
  const EVT_LABEL = { individual: "Deportes individuales", conjunto: "Deportes de conjunto" }, FASE_LABEL = { REG: "Regional", NAC: "Final nacional" };
  /* La lente sale de la ruta (/calendario/, /resultados/, /deportistas/); ?entrada= queda para enlaces viejos de /explorador/. */
  const RUTA = { eventos: "calendario", resultados: "resultados", deportistas: "deportistas" };
  const ENTRADA_RAW = Object.keys(RUTA).find((k) => new RegExp("/" + RUTA[k] + "(/index\\.html|/)?$").test(location.pathname)) || new URLSearchParams(location.search).get("entrada");
  const BASE = location.pathname.replace(/[^/]*(\/index\.html|\/)?$/, "").replace(/\/$/, "").replace(/\/(calendario|resultados|deportistas|explorador)$/, "") + "/";
  const urlOf = (lente) => BASE + RUTA[lente] + "/";
  let ENT = { e: "", f: "REG" };
  (() => {
    const qs = new URLSearchParams(location.search), qe = qs.get("e");
    /* «Fase final» no lleva evento: una sola vista con todos los deportes de la final. */
    if (!qe && qs.get("f") === "NAC" && ENTRADA_RAW !== "deportistas" && window.NWX_FINAL_PUBLICADA) { ENT = { e: "", f: "NAC" }; return; }
    if (EVT_LABEL[qe]) { ENT = { e: qe, f: qs.get("f") === "NAC" && ENTRADA_RAW !== "deportistas" ? "NAC" : "REG" }; if (ENTRADA_RAW === "deportistas") return; try { sessionStorage.setItem("nwx-entrada", ENT.e + "|" + ENT.f); } catch (x) { /* sin storage */ } return; }
    if (ENTRADA_RAW === "deportistas") return; /* sin evento: se ofrece el selector, no se hereda uno recordado */
    let m = ""; try { m = sessionStorage.getItem("nwx-entrada") || ""; } catch (x) { /* sin storage */ }
    /* Mientras la final no esté publicada (interruptor de behaviors.js), volver sin «f» nunca deja en ella. */
    const q = m.split("|"); if (EVT_LABEL[q[0]]) ENT = { e: q[0], f: q[1] === "NAC" && window.NWX_FINAL_PUBLICADA ? "NAC" : "REG" };
    else if (ENTRADA_RAW !== "deportistas") ENT = { e: "individual", f: "REG" };
  })();
  const CHIPTL = { tipo: "Evento", deporte: "Deporte", prueba: "Prueba", regional: "Regional", depto: "Departamento", sexo: "Sexo", cat: "Categoría", inst: "Institución" };

  /* Dos lentes sobre la misma máquina de niveles; «dia» y «calendario-resultados» son enlaces viejos que se conservan. */
  const ENTRADA = { deportistas: "deportistas", eventos: "eventos", dia: "eventos", resultados: "resultados", "calendario-resultados": "resultados" }[ENTRADA_RAW] || "resultados";
  const LENS = ENTRADA !== "deportistas", RES = ENTRADA === "resultados";
  const VISTA = { deportistas: "Deportistas", eventos: "Eventos y fases" }[ENTRADA] || "Resultados";
  const nameOf = (id) => (ATH[id] || INS[id] || { nombre: id }).nombre;

  /* ── Índices ─────────────────────────────────────────────── */
  const partes = {}, ENC = {}, pruebasDe = {};
  D.participaciones.forEach((x) => { (partes[x.pruebaId] = partes[x.pruebaId] || []).push(x); if (x.tipo === "deportista" && !x.ejemplo) (pruebasDe[x.refId] = pruebasDe[x.refId] || []).push(x.pruebaId); });
  D.encuentros.forEach((e) => { (ENC[e.pruebaId] = ENC[e.pruebaId] || []).push(e); });
  const PBY = by(D.pruebas), ENCBY = by(D.encuentros), SEDE = by(D.sedes);
  const faseNow = () => (ENTRADA === "deportistas" ? "REG" : ENT.f);
  /* Las bifurcaciones leen los atributos de la fase (regiones, medallas), no su clave. */
  const FASES = by(D.fases), faseOf = (p) => FASES[p.faseId] || {};
  const FASE = D.fases.filter((f) => f.clave === faseNow())[0] || D.fases[0];
  /* Las lentes ven solo su fase; Deportistas no depende de la fase y nunca ve la muestra. */
  const PRUEBAS = D.pruebas.filter((p) => (LENS ? p.faseId === FASE.id && (!p.ejemplo || DEMO) : !p.ejemplo));
  const depsFase = () => D.deportes.filter((d) => (!ENT.e || d.tipo === ENT.e) && PRUEBAS.some((q) => q.deporteId === d.id));
  /* Atletismo con un solo deporte en la final entra directo a sus pruebas; conjunto entra por Deportes. */
  /* En la final, un evento con un solo deporte en el catálogo (Atletismo) salta Deportes; sale del catálogo, no de los datos. */
  const depsCat = () => D.deportes.filter((d) => d.tipo === ENT.e);
  const autoDep = () => !FASE.regiones && !!ENT.e && depsCat().length === 1;
  const SELD = FASE.regiones ? "nwx-seld" : "nwx-seld-" + FASE.clave;
  const deptsOf = {};
  D.pruebas.forEach((p) => { deptsOf[p.id] = new Set((partes[p.id] || []).map((x) => ((x.tipo === "deportista" ? ATH[x.refId] : INS[x.refId]) || {}).departamentoId).filter(Boolean)); });
  /* Instituciones con datos publicados por prueba: equipos, nóminas y la institución de cada deportista. */
  const instOfP = (x) => (x.tipo === "deportista" ? (ATH[x.refId] || {}).institucionId : x.refId);
  const instsOf = {};
  D.pruebas.forEach((p) => { const s = new Set(); (partes[p.id] || []).forEach((x) => { const i = instOfP(x); if (i && INS[i]) s.add(i); });
    (p.nominas || []).forEach((n) => { if (INS[n.refId]) s.add(n.refId); });
    (ENC[p.id] || []).forEach((e) => e.participantes.forEach((x) => { const i = instOfP(x); if (i && INS[i]) s.add(i); })); instsOf[p.id] = s; });
  const disciplinas = (dep) => [...new Set(PRUEBAS.filter((p) => p.deporteId === dep).map((p) => p.disciplina))].sort((a, b) => a.localeCompare(b, "es"));

  /* ── Contexto (filtros) ──────────────────────────────────── */
  const ok = (p, c) => {
    if (c.tipo && DEPO[p.deporteId].tipo !== c.tipo) return false;
    if (c.deporte && p.deporteId !== c.deporte) return false;
    if (c.prueba && p.disciplina !== c.prueba) return false;
    if (c.sexo && p.sexo !== c.sexo) return false;
    if (c.cat && p.categoria !== c.cat) return false;
    if (c.regional && p.regionalId !== c.regional) return false;
    /* En Deportistas el departamento y la institución se filtran sobre la persona (inscriptions), no sobre la prueba. */
    if (LENS && c.depto && !deptsOf[p.id].has(c.depto)) return false;
    if (LENS && c.inst && !instsOf[p.id].has(c.inst)) return false;
    return true;
  };
  const regTipo = (id) => GRUPO_TIPO[REG[id].grupo];
  const setC = (c0, t, v) => {
    const c = Object.assign({}, c0);
    if (t === "tipo") { c.tipo = v; delete c.deporte; delete c.prueba; if (c.regional && regTipo(c.regional) !== v) { delete c.regional; delete c.depto; } }
    else if (t === "deporte") { if (c.deporte !== v) delete c.prueba; c.deporte = v; c.tipo = DEPO[v].tipo; if (c.regional && regTipo(c.regional) !== c.tipo) { delete c.regional; delete c.depto; } }
    else if (t === "regional") { if (c.regional !== v && LENS) delete c.depto; c.regional = v; if (c.tipo !== regTipo(v)) { c.tipo = regTipo(v); delete c.deporte; delete c.prueba; } }
    else c[t] = v;
    return c;
  };
  const rmC = (c0, t) => {
    if (t === "tipo" && ENT.e) return c0;
    const c = Object.assign({}, c0); delete c[t];
    if (!ENT.e && (t === "deporte" || (t === "regional" && !c.deporte))) delete c.tipo;
    if (t === "tipo") { delete c.deporte; delete c.prueba; }
    if (t === "deporte") delete c.prueba;
    if (t === "deporte" && LENS) { delete c.sexo; delete c.cat; delete c.inst; } /* lo que se elige después del deporte se va con él */
    if (t === "regional" && LENS) delete c.depto;
    return c;
  };
  const rmSel = (t) => { S.c = rmC(S.c, t); if (t === "deporte" && LENS) { S.p = ""; S.m = ""; S.d = ""; S.dAll = false; } };
  const tipoCtx = (c) => c.tipo || (c.deporte ? DEPO[c.deporte].tipo : "");
  const valLabel = (t, v) => ({ tipo: EVT_LABEL[v], deporte: (DEPO[v] || {}).nombre, prueba: v, regional: (REG[v] || {}).nombre, depto: (DPT[v] || {}).nombre, sexo: SEXO_LABEL[v], cat: v, inst: (INS[v] || {}).nombre }[t]);

  /* ── Estado y URL ────────────────────────────────────────── */
  const S = { c: {}, d: "", dAll: false, ficha: "", hl: "", p: "", m: "", todas: false, pop: false, pg: 1 };
  /* Coherencia del nivel: una prueba o un partido que no cuelgan del contexto actual se descartan. */
  const normalize = () => {
    const q = PBY[S.p];
    if (S.p && (!q || q.faseId !== FASE.id || (FASE.regiones && q.regionalId !== S.c.regional) || q.deporteId !== S.c.deporte)) S.p = "";
    if (S.m && (!ENCBY[S.m] || ENCBY[S.m].pruebaId !== S.p)) S.m = "";
    if (S.todas && (!RES || S.c.regional)) S.todas = false;
    cleanAttrs();
    if (S.p && q && S.c.sexo && S.c.sexo !== q.sexo) delete S.c.sexo; /* la prueba define el suyo: no se hereda el del hash */
    if (S.p && q && S.c.cat && S.c.cat !== q.categoria) delete S.c.cat;
    if (S.d && (!("CDEF".includes(level()) || (LENS && S.todas)) || !datedDays(dayPool(S.c)).includes(S.d))) S.d = "";
    /* Sin «d» en el enlace manda la regla de hoy; «Todos» se recuerda con d=todos para no reimponerla. */
    if (!"CDEF".includes(level())) S.dAll = false;
    else if (!S.d && !S.dAll && !RES && "CDE".includes(level()) && (FASE.regiones || level() !== "C")) { const ds = datedDays(dayPool(S.c)); if (ds.length) S.d = defaultDay(ds); }
  };
  /* Categorías y sexos que existen en el alcance actual (sin contar el propio filtro); Mixto solo si hay pruebas mixtas. */
  const CORDER = ["Prejuvenil", "Juvenil"];
  const scopeOf = (c) => PRUEBAS.filter((q) => ok(q, Object.assign({}, c, { sexo: "", cat: "" })));
  const attrOpts = (c) => { const s = scopeOf(c); return { cats: [...new Set(s.map((q) => q.categoria).filter(Boolean))].sort((a, b) => (CORDER.indexOf(a) + 1 || 99) - (CORDER.indexOf(b) + 1 || 99) || a.localeCompare(b, "es")), mx: s.some((q) => q.sexo === "MX"), nosex: s.some((q) => !q.sexo) }; };
  const cleanAttrs = () => { if (S.c.cat && (!LENS || !attrOpts(S.c).cats.includes(S.c.cat))) delete S.c.cat; }; /* Deportistas no filtra por edad; en las otras lentes se limpia si el alcance no la tiene */
  /* Días reales: salen solo de las fechas de los partidos; sin ellas no hay selector ni se inventa nada. */
  const datedDays = (ps) => [...new Set(ps.flatMap((p) => (ENC[p.id] || []).map((e) => e.fecha).filter(Boolean)))].sort();
  /* En C (deportes) el eje cubre toda la regional; en T (todas las regionales), las del evento. */
  const dayPool = (c) => (S.p && PBY[S.p] ? [PBY[S.p]] : c.deporte && (!FASE.regiones || c.regional) ? PRUEBAS.filter((p) => p.deporteId === c.deporte && ok(p, c))
    : !c.deporte && LENS && (!FASE.regiones || c.regional) ? PRUEBAS.filter((p) => ok(p, c) && (!FASE.regiones || p.regionalId === c.regional) && p.faseId === FASE.id) : !c.deporte && LENS && S.todas ? PRUEBAS.filter((p) => regTipo(p.regionalId) === ENT.e && ok(p, Object.assign({}, c, { regional: p.regionalId }))) : []);
  const parse = () => {
    const p = new URLSearchParams(location.hash.slice(1));
    S.c = {};
    (p.get("c") || "").split("|").filter(Boolean).forEach((x) => { const i = x.indexOf(":"); if (ORDER.includes(x.slice(0, i))) S.c[x.slice(0, i)] = x.slice(i + 1); });
    S.ficha = p.get("f") || ""; S.hl = p.get("h") || ""; S.p = p.get("p") || ""; S.m = p.get("m") || ""; S.todas = p.get("t") === "1"; S.d = /^\d{4}-\d\d-\d\d$/.test(p.get("d") || "") ? p.get("d") : ""; S.dAll = p.get("d") === "todos"; S.pg = Math.max(1, parseInt(p.get("g"), 10) || 1);
    if (S.c.inst && !INS[S.c.inst]) delete S.c.inst;
    if (S.ficha[0] === "m" && ENCBY[S.ficha.slice(2)]) { S.hl = S.ficha.slice(2); S.ficha = "p:" + ENCBY[S.hl].pruebaId; }
    if (ENT.e) { S.c.tipo = ENT.e; if (S.c.deporte && DEPO[S.c.deporte] && DEPO[S.c.deporte].tipo !== ENT.e) { delete S.c.deporte; delete S.c.prueba; } }
    if (LENS) {
      S.pg = 1;
      /* Enlaces viejos (?entrada=dia, ficha p:/m:) llegan al mismo nivel del flujo nuevo. */
      if (S.ficha[0] === "p" && PBY[S.ficha.slice(2)]) { const q = PBY[S.ficha.slice(2)]; S.c = { tipo: S.c.tipo, regional: q.regionalId, deporte: q.deporteId }; S.p = q.id; S.m = S.hl; S.ficha = ""; S.hl = ""; }
      if (S.c.prueba) { const qs = PRUEBAS.filter((q) => ok(q, S.c)); if (qs.length === 1 && !S.p) S.p = qs[0].id; delete S.c.prueba; }
      if (autoDep() && !S.c.deporte) S.c.deporte = depsCat()[0].id;
      normalize();
    } else cleanAttrs();
  };
  const hashOf = (o) => {
    const p = new URLSearchParams();
    const c = ORDER.filter((k) => o.c[k]).map((k) => k + ":" + o.c[k]).join("|");
    if (c) p.set("c", c);
    if (o.todas) p.set("t", "1");
    if (o.d) p.set("d", o.d); else if ("d" in o && ("dAll" in o ? o.dAll : S.dAll)) p.set("d", "todos");
    if (o.pg > 1) p.set("g", o.pg);
    if (o.p) p.set("p", o.p);
    if (o.m) p.set("m", o.m);
    if (o.ficha) p.set("f", o.ficha);
    if (o.hl && (o.ficha || "")[0] === "p") p.set("h", o.hl);
    const s = p.toString();
    return s ? "#" + s : "";
  };
  const ser = () => { if (LENS) normalize(); else cleanAttrs(); return hashOf(S); };
  const nav = () => { const h = ser(); if ((location.hash || "") === h) render(); else location.hash = h; };

  /* ── Calendario ──────────────────────────────────────────── */
  const days = PRUEBAS.flatMap((p) => [p.fechaInicio, p.fechaFin]).filter(Boolean).sort();
  const isoOf = (d) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  const dateOf = (iso) => new Date(iso + "T12:00:00");
  const RANGE = (() => {
    if (!days.length) return [];
    const a = dateOf(days[0]), b = dateOf(days[days.length - 1]);
    a.setDate(a.getDate() - ((a.getDay() + 6) % 7)); b.setDate(b.getDate() + (6 - ((b.getDay() + 6) % 7)));
    const out = []; for (const d = new Date(a); d <= b; d.setDate(d.getDate() + 1)) out.push(isoOf(d));
    return out;
  })();
  const covers = (p, day) => p.fechaInicio && p.fechaInicio <= day && day <= (p.fechaFin || p.fechaInicio);
  /* «Hoy» es la fecha local; ?hoy=AAAA-MM-DD solo en localhost, para probar la regla sin esperar al calendario. */
  const HOY = (() => { const q = new URLSearchParams(location.search).get("hoy"); return /^\d{4}-\d\d-\d\d$/.test(q || "") && /^(localhost|127\.0\.0\.1|)$/.test(location.hostname) ? q : isoOf(new Date()); })();
  const defaultDay = (ds) => (ds.includes(HOY) ? HOY : ds.filter((d) => d > HOY)[0] || ds[0]);
  const HOYMK = '<i class="nwx-hoyd" aria-hidden="true"></i><span class="nwx-vh">, hoy</span>';
  const fmt = (iso, o) => dateOf(iso).toLocaleDateString("es-CO", o).replace(".", "");
  /* Única convención de día: «27 de sept», «dom, 27 de sept» y la larga «domingo 27 de septiembre» (aria). */
  const fmtDia = (iso, k) => k === "larga" ? fmt(iso, { weekday: "long", day: "numeric", month: "long" }).replace(",", "") : (k === "wd" ? fmt(iso, { weekday: "short" }) + ", " : "") + dateOf(iso).getDate() + " de " + fmt(iso, { month: "short" });
  /* Eje de días único (como buildDayAxis de la app): la grilla y la tira lo comparten; mismo hoy, selección y d=. */
  const dayAxis = (o) => {
    const hoyOn = (d) => d === HOY && d >= o.evA && d <= o.evB; /* fuera de las fechas con datos no se marca nada */
    const lbl = (d) => fmtDia(d, "larga") + (hoyOn(d) ? ", hoy" : "") + (d === o.sel ? ", seleccionado" : "");
    /* Misma celda en la grilla y en la tira: día de la semana, número y mes solo cuando cambia. */
    const cell = (d) => { const on = d === o.sel, h = hoyOn(d), i = o.days.indexOf(d), mes = i < 1 || fmt(o.days[i - 1], { month: "short" }) !== fmt(d, { month: "short" }), cls = "nwx-dc" + (on ? " is-sel" : "") + (h ? " is-hoy" : ""),
        inner = "<small>" + esc(fmt(d, { weekday: "short" })) + "</small><b>" + dateOf(d).getDate() + '</b>' + '<small class="nwx-dmes">' + esc(fmt(d, { month: "short" })) + "</small>" + (h ? HOYMK : "");
      return o.pick.has(d) ? '<button type="button" class="' + cls + '" data-a="day" data-d="' + d + '" aria-pressed="' + on + '" aria-label="' + esc(lbl(d)) + '"' + (h ? ' title="Hoy"' : "") + ">" + inner + "</button>" : '<span class="' + cls + ' is-off" aria-label="' + esc(lbl(d)) + '">' + inner + "</span>"; };
    const line = (ds) => '<div class="nwx-days" role="group" aria-label="Elegir un día"><button type="button" class="nwx-dc nwx-dc--all' + (o.sel ? "" : " is-sel") + '" data-a="day" data-d="" aria-pressed="' + !o.sel + '">Todos</button>' + ds.map((d) => cell(d)).join("") + "</div>";
    /* Variante de encabezado de tabla: los días se reparten parejo (como la grilla) y «Todos» es un botón compacto a la derecha. */
    const lineHd = (ds) => '<div class="nwx-days nwx-days--hd" role="group" aria-label="Elegir un día"><div class="nwx-dtrack">' + ds.map((d) => cell(d)).join("") + '<button type="button" class="nwx-dc nwx-dc--all nwx-todos' + (o.sel ? "" : " is-sel") + '" data-a="day" data-d="" aria-pressed="' + !o.sel + '">Todos</button></div></div>';
    return { cell, line, lineHd };
  };

  /* ── Resultados ──────────────────────────────────────────── */
  const who = (id) => ATH[id] ? '<button type="button" class="nwx-link" data-a="ficha" data-id="' + esc(id) + '">' + esc(ATH[id].nombre) + "</button>" : esc(nameOf(id));
  const flagHtml = (id) => { const d = (ATH[id] || INS[id] || {}).departamentoId; return d ? '<img class="nwx-flag" src="../public/department_flags/' + slugOf(d) + '.png" alt="" width="22" height="15">' : ""; };
  const rank = (n) => '<span class="nwx-rank">' + esc(n) + "</span>";
  const PLAINC = "#5b2d86";
  const METALES = ["gold", "silver", "bronze"];
  /* Medalla del podio: puesto en el centro, con cinta y sombra, como en el podio de COC (aquí sin banderas). */
  const medalla = (i, size) => '<nao-award kind="medal" metal="' + METALES[i] + '" icon="' + (i + 1) + '" edition="colombia" size="' + size + '"></nao-award>';
  const initials = (n) => n.replace(/^Instituci[oó]n Educativa\s*/i, "").split(" ").slice(0, 2).map((w) => w[0]).join("");
  const podiumHtml = (items) => '<div class="nwx-pod' + (items.plain ? " nwx-pod--plain" : " nwx-pod--medal") + '">' + [1, 0, 2].map((i) => { const it = items[i]; if (!it) return "";
    return '<div class="nwx-pd p' + (i + 1) + '"' + (items.plain ? "" : ' data-m="' + ["oro", "plata", "bronce"][i] + '"') + '>' + (items.plain ? '<span class="nwx-pav" style="--mc:' + PLAINC + '">' + (it.person ? PERSON : "<b>" + esc(initials(it.name)) + "</b>") + '<span class="nwx-pbadge" style="background:' + PLAINC + '">' + (i + 1) + "</span></span>" : '<span class="nwx-pmed">' + medalla(i, window.matchMedia("(max-width:700px)").matches ? (i ? 96 : 124) : (i ? 140 : 190)) + "</span>") + "<b class=\"nwx-pname\" title=\"" + esc(it.name) + "\">" + esc(it.name) + "</b><small title=\"" + esc(it.sub) + "\">" + esc(it.sub) + '</small><span class="nwx-pmark">' + esc(it.mark) + "</span></div>"; }).join("") + "</div>";
  const depName = (id) => ((DPT[(ATH[id] || INS[id] || {}).departamentoId] || {}).nombre) || "";
  /* El podio sale de las filas con medalla (no del orden) y solo si la fase de la prueba reparte medallas. Sin cifra en equipos. */
  const MEDAL_IX = { oro: 0, plata: 1, bronce: 2 };
  const podOf = (p) => { const r = p.resultado; if (!r || !faseOf(p).medallas) return null;
    const out = [], fs = r.tipo === "clasificacion" ? r.filas : r.tipo === "posiciones" ? r.tablas.flatMap((t) => t.filas) : [];
    fs.forEach((f) => { const i = MEDAL_IX[f.medalla]; if (i != null && !out[i]) out[i] = { name: nameOf(f.refId), sub: depName(f.refId), mark: f.marca || "", person: !!ATH[f.refId] }; });
    return out.length ? out : null; };
  /* Individual terminada: el podio sale de los 3 primeros puestos; con medallas solo si la fase las reparte (podOf). */
  const indRows = (p) => { const r = p.resultado; return p.estado === "finalizada" && r && r.tipo === "clasificacion" ? r.filas.slice().sort((a, b) => (a.puesto || 99) - (b.puesto || 99)) : null; };
  const indPod = (p) => { const m = podOf(p); if (m) return m; const fs = indRows(p); if (!fs || !fs.length) return null;
    const o = fs.slice(0, 3).map((f) => ({ name: nameOf(f.refId), sub: depName(f.refId), mark: f.marca || "", person: !!ATH[f.refId] })); o.plain = true; return o; };
  /* Con institución elegida, sus filas se resaltan y lo dicen en texto, no solo en color. */
  const hiRow = (refId) => !!S.c.inst && (refId === S.c.inst || (ATH[refId] || {}).institucionId === S.c.inst);
  const hiTr = (refId) => (hiRow(refId) ? ' class="nwx-hi"' : ""), hiTx = (refId) => (hiRow(refId) ? '<span class="nwx-vh"> (institución seleccionada)</span>' : "");
  const clasifTable = (fs, o) => { o = o || {}; return '<div class="nwx-tbox nwx-tscroll"><table class="nwx-rtab"><thead><tr><th scope="col">' + (o.orden ? "Orden" : "Puesto") + '</th><th scope="col">Deportista</th><th scope="col">Departamento</th>' + (o.sinMarca ? "" : '<th scope="col" class="r">Marca</th>') + "</tr></thead><tbody>" +
    fs.map((f) => "<tr" + hiTr(f.refId) + '><th scope="row" class="nwx-rk">' + rank(f.puesto) + '</th><td><span class="nwx-who nwx-clip">' + who(f.refId) + "</span>" + hiTx(f.refId) + '</td><td><span class="nwx-clip" title="' + esc(depName(f.refId)) + '">' + esc(depName(f.refId) || "—") + '</span></td>' + (o.sinMarca ? "" : '<td class="r"><b>' + esc(f.marca || "—") + "</b></td>") + "</tr>").join("") + "</tbody></table></div>"; };
  /* Podio de 3 + tabla: el panel pasa max (puestos 4.º en adelante); la vista interna, todos. */
  const podBlock = (p, max) => { const fs = indRows(p), pod = indPod(p); if (!pod) return "";
    const rest = max ? fs.slice(3, 3 + max) : fs; return '<div class="nwx-pb">' + podiumHtml(pod) + (rest.length ? clasifTable(rest) : "") + "</div>"; };
  const UNIT = { "Fútbol": "Goles", "Fútbol sala": "Goles", "Fútbol de Salón": "Goles", "Baloncesto": "Puntos", "Baloncesto 3x3": "Puntos", "Voleibol": "Sets ganados" };
  /* Nómina: deportistas de la institución inscritos en una prueba del mismo deporte y sexo. */
  const rosterOf = (insId, p) => D.deportistas.filter((a) => a.institucionId === insId && (pruebasDe[a.id] || []).some((pid) => PBY[pid] && PBY[pid].deporteId === p.deporteId && PBY[pid].sexo === p.sexo));
  /* La nómina publicada (pruebas[].nominas) manda; sin ese campo se deduce de las inscripciones. */
  const nominaOf = (insId, p) => { if (!p.nominas) return rosterOf(insId, p); const n = p.nominas.filter((x) => x.refId === insId)[0]; return n ? n.deportistas.map((id) => ATH[id]).filter(Boolean) : []; };
  const rosterHtml = (x, p) => { const r = nominaOf(x.refId, p);
    return '<div class="nwx-rost"><p class="nwx-muted nwx-rt">Nómina · ' + esc(nameOf(x.refId)) + '</p>' + (r.length ? r.map((a, i) => '<div class="nwx-rr"><span class="nwx-num">' + (i + 1) + '</span><b>' + esc(a.nombre) + '</b><button type="button" class="nwx-pf" data-a="ficha" data-id="' + esc(a.id) + '" aria-label="Ver el perfil de ' + esc(a.nombre) + '" title="Ver perfil">' + PERSON + "</button></div>").join("") : '<p class="nwx-muted nwx-rn">Nómina no publicada.</p>') + "</div>"; };
  const teamCard = (e, solo, inView) => { const ps = e.participantes, p = PBY[e.pruebaId], val = (x) => (x.marcador != null ? esc(x.marcador) : "–"), st = STATE[{ finalizado: "finalizada", "en-curso": "en-competencia" }[e.estado] || e.estado] || ["prog", "Programada"];
    const win = ps[0].marcador != null && ps[1].marcador != null ? (+ps[0].marcador > +ps[1].marcador ? 0 : +ps[1].marcador > +ps[0].marcador ? 1 : -1) : -1;
    const nm = (x, i, al) => '<span class="nwx-mn ' + al + (win === i ? " win" : "") + '"><b>' + esc(nameOf(x.refId)) + "</b><small>" + esc(depName(x.refId)) + "</small></span>";
    const unit = UNIT[(DEPO[p.deporteId] || {}).nombre] || "";
    const row = nm(ps[0], 0, "r") + '<span class="nwx-big"><span class="nwx-sc"><b>' + val(ps[0]) + "</b><i>vs</i><b>" + val(ps[1]) + "</b></span>" + (unit ? '<small class="nwx-unit">' + unit + "</small>" : "") + (solo ? "" : '<span class="nwx-state ' + st[0] + '">' + st[1] + "</span>") + "</span>" + nm(ps[1], 1, "l");
    if (solo) return '<div class="nwx-mc solo">' + row + "</div>";
    return '<div class="nwx-mc nwx-rowlink" role="button" tabindex="0" data-a="fm" data-id="' + esc(e.id) + '" aria-label="Ver el partido ' + esc(nameOf(ps[0].refId) + " contra " + nameOf(ps[1].refId)) + '">' + row +
      '<span class="nwx-sm nwx-icon" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg></span></div>'; };
  const serieRow = (e) => { const fin = e.estado === "finalizado", ps = e.participantes.slice().sort((a, b) => (a.puesto || 99) - (b.puesto || 99)), w = ps[0];
    const mid = fin && w ? '<span class="nwx-mn"><b>' + esc(nameOf(w.refId)) + "</b><small>" + esc(depName(w.refId)) + (w.marca ? " · " + esc(w.marca) : "") + "</small></span>" : '<span class="nwx-mn"><b>' + ps.length + (ps.length === 1 ? " participante" : " participantes") + "</b><small>" + (fin ? "" : "Lista de salida") + "</small></span>";
    const st = STATE[{ finalizado: "finalizada", "en-curso": "en-competencia" }[e.estado] || e.estado] || ["prog", "Programada"];
    return '<div class="nwx-mc nwx-sr nwx-rowlink" role="button" tabindex="0" data-a="fm" data-id="' + esc(e.id) + '" aria-label="Ver la serie ' + esc(e.numero || "") + '"><span class="nwx-mn"><b>Serie ' + esc(e.numero || "") + "</b><small>" + (e.fecha ? esc(fmtDia(e.fecha)) : "") + "</small></span>" + mid + '<span class="nwx-state ' + st[0] + '">' + st[1] + '</span><span class="nwx-sm nwx-icon" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg></span></div>'; };
  const resultHtml = (p, withPod, o) => {
    o = o || {};
    const r = p.resultado;
    let h = "";
    if (o.part === "enc") { /* solo enfrentamientos */ } else if (r && r.tipo === "clasificacion") {
      if (withPod && podOf(p)) h += podiumHtml(podOf(p));
      h += clasifTable(r.filas.filter((f) => !o.only || f.refId === o.only).sort((a, b) => (a.puesto || 99) - (b.puesto || 99)));
    } else if (r && r.tipo === "posiciones") {
      if (withPod && p.estado === "finalizada" && podOf(p)) h += podiumHtml(podOf(p));
      h += r.tablas.map((t) => '<div class="nwx-tbox nwx-tscroll"><div class="nwx-gt">' + (t.grupo ? "Grupo " + esc(t.grupo) : "Posiciones") + '</div><table class="nwx-rtab"><thead><tr><th>#</th><th>Equipo</th>' +
        t.columnas.map((c) => '<th class="c">' + colTh(c) + "</th>").join("") + "</tr></thead><tbody>" +
        t.filas.map((f) => "<tr" + hiTr(f.refId) + "><td>" + rank(f.puesto) + '</td><td><span class="nwx-who">' + flagHtml(f.refId) + esc(nameOf(f.refId)) + "</span>" + hiTx(f.refId) + "</td>" + f.v.map((v, i) => '<td class="c">' + (t.columnas[i] === "Pts" ? "<b>" + esc(v) + "</b>" : esc(v)) + "</td>").join("") + "</tr>").join("") + "</tbody></table>" +
        "</div>").join("");
    } else {
      h += p.estado === "finalizada" || p.estado === "en-competencia" ? empty(p.estado === "finalizada" ? "Aún no hay resultado publicado." : "En juego: el resultado aparece al terminar.") : "";
    }
    /* Con o.only (ficha del deportista) quedan solo los enfrentamientos donde compite él o su institución. */
    const mine = o.only ? [o.only, (ATH[o.only] || {}).institucionId] : null;
    const es = (ENC[p.id] || []).filter((e) => e.participantes.length && e.id !== o.exId && (!mine || e.participantes.some((x) => mine.includes(x.refId))));
    if (es.length && o.part !== "tables") {
      const ronda = (e) => ((p.rondas || []).filter((x) => x.id === e.rondaId)[0] || {}).nombre || "";
      const head = (e) => [ronda(e), e.grupo ? "Grupo " + e.grupo : ""].filter(Boolean).join(" - ") || "Enfrentamientos";
      let last = null;
      h += '<div class="nwx-enc nwx-rbox">';
      es.slice(0, 24).forEach((e) => {
        const hd = head(e); if (hd !== last) { h += '<div class="nwx-gt">' + esc(hd) + "</div>"; last = hd; }
        const ps = e.participantes, val = (x) => x.marcador != null ? esc(x.marcador) : x.marca ? esc(x.marca) : "–";
        if (ps.length === 2 && ps[0].tipo === "equipo") h += teamCard(e); else if (false) h += '<div class="nwx-vs"><span class="nwx-vn r">' + esc(nameOf(ps[0].refId)) + flagHtml(ps[0].refId) + "</span><b>" + val(ps[0]) + "</b><i>-</i><b>" + val(ps[1]) + '</b><span class="nwx-vn">' + flagHtml(ps[1].refId) + esc(nameOf(ps[1].refId)) + "</span></div>";
        else h += serieRow(e);
      });
      h += (es.length > 24 ? '<p class="nwx-muted" style="margin:.5rem 0 0">… y ' + (es.length - 24) + " más</p>" : "") + "</div>";
    }
    return h;
  };
  const STATE = { finalizada: ["fin", "Terminada"], "en-competencia": ["live", "En curso"], programada: ["prog", "Programada"] };
  const CHEV = '<svg class="nwx-chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
  const lugarOf = (p) => (faseOf(p).regiones === false ? "Final nacional · " + (faseOf(p).sede || "") : "Regional " + ((REG[p.regionalId] || {}).nombre || ""));
  const eHead = () => '<div class="nwx-ehead"><span>Prueba</span><span>Fase</span><span>Estado</span><span></span></div>';
  const rowHtml = (p, extra, only) => {
    const s = STATE[p.estado] || ["prog", p.estado];
    const tags = [SEXO_LABEL[p.sexo], p.categoria].filter(Boolean).map((t) => '<span class="nwx-tag">' + esc(t) + "</span>").join("");
    const reg = lugarOf(p);
    return '<details class="nwx-erow"' + '><summary><span class="nwx-ename"><b class="nwx-ebox">' + esc(p.disciplina) + "</b>" + tags + '</span><span class="nwx-ereg">' + esc(reg) + (extra ? " · " + esc(extra) : "") +
      '</span><span class="nwx-state ' + s[0] + '">' + s[1] + "</span>" + CHEV + '</summary><div class="nwx-body">' + resultHtml(p, false, only ? { only } : undefined) + '<div class="nwx-detail"><button type="button" class="nwx-btn" data-a="fp" data-id="' + esc(p.id) + '">Ver detalle de la prueba</button></div></div></details>';
  };
  /* Estado vacío estándar: una sola línea de texto (y, si aplica, una acción), sin título ni caja propia. */
  const empty = (msg, act) => '<div class="nwx-es" role="status"><span>' + msg + "</span>" + (act || "") + "</div>";
  const emptyHtml = (t, m) => empty(m || t, '<button type="button" class="nwx-back-btn" data-a="clear">Quitar filtros</button>');

  /* ── Vistas ──────────────────────────────────────────────── */
  /* ── Calendario como visor del árbol: las filas son los hijos del nodo de «Qué» que se está viendo ── */
  const FLAG = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 22V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 7.3 2A6 6 0 0 0 20 3v10a1 1 0 0 1-.4.8A6 6 0 0 1 16 15c-3 0-5-2-8-2a6 6 0 0 0-4 1.5"/></svg>';
  /* Cuántos partidos (o series) hay dentro de cada ficha: total y por día. */
  const blOf = (ps) => { const all = ps.flatMap((p) => encsOf(p)), by = {}; all.forEach((e) => { if (e.fecha) (by[e.fecha] = by[e.fecha] || []).push(e); });
    return { total: all.length ? nEnc(all) : "", days: Object.fromEntries(Object.keys(by).map((d) => [d, nEnc(by[d])])) }; };
  const buildGrid = (o) => {
    const { days, evA, evB, rows } = o;
    const dl = (d) => fmtDia(d, "larga"), mk = (ic, t, tip) => '<span class="nwx-tip nwx-mk" tabindex="0" data-tip="' + esc(tip) + '" aria-label="' + esc(tip) + '"><span class="nwx-gm2">' + ic + "</span><small>" + t + "</small></span>";
    const tint = (r) => r.tint || TINT[r.dep] || "bg-calendar-orange";
    const cnt = (r, d) => { const t = r.bl && (d ? r.bl.days[d] : r.bl.total); if (!t) return ""; const m = /^(\d+)\s+(.+)$/.exec(t); return '<span class="nwx-bl">' + (m ? "<b>" + m[1] + "</b><small>" + esc(m[2]) + "</small>" : esc(t)) + "</span>"; };
    const pick = "CDT".includes(level()) ? new Set(datedDays(dayPool(Object.assign({}, S.c, { sexo: "" })))) : new Set(), sel = S.d, ax = dayAxis({ pick, sel, evA, evB, days });
    /* Sin fecha por partido, la prueba es una sola banda de INICIO a FINAL; con fecha, una ficha por día. Ninguna lleva texto: va en title/aria-label. */
    const band = (r, d) => { const ds = [...r.ds].sort(), tip = spanLbl2(r) + (r.lbl ? " · " + r.lbl : "") + " · " + r.name + (cnt(r) ? " · " + r.bl.total : "");
      return d !== ds[0] ? "" : '<a class="nwx-band ' + tint(r) + '" href="' + r.href + '" style="--n:' + ds.length + '" title="' + esc(tip) + '" aria-label="' + esc(tip) + '"><span class="nwx-bi" style="color:#e4403a">' + (ICON[r.dep] || ICON.fds) + "</span>" + cnt(r) + "</a>"; };
    const cell = (d, r) => { const inR = d >= evA && d <= evB, edge = (d === evA ? " nwx-el" : "") + (d === evB ? " nwx-er" : "") + (d === sel ? " nwx-dsel" : "");
      if (!r) return '<div class="nwx-gcell ' + (inR ? "bg-white" : "bg-NW-gray-400") + edge + '">' + (d === evA ? mk(FLAG, "Inicio", "Inicio de la competencia · " + dl(d)) : d === evB ? mk(TROPHY_W, "Final", "Cierre de la competencia · " + dl(d)) : "") + "</div>";
      const on = r.ds.has(d);
      const tip1 = dl(d) + (r.lbl ? " · " + r.lbl : "") + " · " + r.name + (cnt(r, d) ? " · " + r.bl.days[d] : "");
      return '<div class="nwx-gcell ' + (inR ? "bg-white" : "bg-NW-gray-400") + edge + '">' + (r.range ? (on ? band(r, d) : "") : on ? '<a class="nwx-band ' + tint(r) + '" href="' + r.href + '" style="--n:1" title="' + esc(tip1) + '" aria-label="' + esc(tip1) + '"><span class="nwx-bi" style="color:#e4403a">' + (ICON[r.dep] || ICON.fds) + "</span>" + cnt(r, d) + "</a>" : "") + "</div>"; };
    return '<div class="w-full h-full mx-auto bg-white rounded-xl shadow-lg nwx-gcard"><div class="w-full nwx-gwrap"><div class="nwx-rgrid2" style="grid-template-columns:minmax(14rem,17rem) repeat(' + days.length + ',minmax(4.25rem,1fr))">' +
      '<div class="nwx-gh flex items-center justify-end border-b border-r border-gray-200 bg-white px-4"><span class="text-sm">Días</span></div>' + days.map((d) => '<div class="nwx-gh bg-linear-to-b from-white to-gray-50 border-b-2 border-gray-200 flex items-center justify-center py-3' + (d >= evA && d <= evB ? " nwx-hd" : "") + (d === evA ? " nwx-el" : "") + (d === evB ? " nwx-er" : "") + '">' + ax.cell(d) + "</div>").join("") +
      '<div class="px-2 md:px-4 py-2 border-b border-r border-gray-200 bg-white flex items-center"><span class="font-bold text-sm uppercase tracking-wide" style="color:var(--color-JIC-violet-900)">' + o.label + "</span></div>" + days.map((d) => cell(d, null)).join("") +
      rows.map((r) => '<a href="' + r.href + '" class="nwx-rh px-2 md:px-4 py-2 border-b border-r border-gray-200 bg-white flex flex-col justify-center transition-colors duration-200 hover:bg-NW-gray-300 no-underline" style="text-decoration:none"><span class="nwx-rl"><span class="block truncate font-bold text-sm text-JIN6-text-primary leading-tight" title="' + esc(r.name) + '">' + esc(r.name) + "</span>" + (r.pill ? r.pill : "") + '</span><span class="block truncate text-xs text-JIN6-text-secondary leading-tight" title="' + esc(r.sub || spanLbl2(r)) + '">' + esc(r.sub || spanLbl2(r)) + "</span></a>" + days.map((d) => cell(d, r)).join("")).join("") + "</div></div></div>";
  };
  const ventana = () => { const a = dateOf(FASE.inicio), b = dateOf(FASE.fin), m = (d) => fmt(isoOf(d), { month: "long" });
    return "Del " + a.getDate() + (m(a) === m(b) ? "" : " de " + m(a)) + " al " + b.getDate() + " de " + m(b); };
  /* Mismo empty que la final sin publicar: pill de contexto, título y detalle (sin la nota al pie con divisor). */
  const sinRes = (tit, det) => '<div class="nwx-card nwx-npub" role="status"><div class="nwx-empty"><small class="nwx-npk">' + esc((FASE.regiones ? "Fase regional" : "Fase final nacional") + (EVT_LABEL[ENT.e] ? " · " + EVT_LABEL[ENT.e] : "")) + "</small><b>" + tit + "</b>" + (det ? "<span>" + det + "</span>" : "") + "</div></div>";
  const nacVacio = () => '<div class="nwx-card nwx-npub" role="status"><div class="nwx-empty"><small class="nwx-npk">Fase final nacional · ' + esc(EVT_LABEL[ENT.e] || "") + "</small><b>Aún no hay calendario ni resultados publicados</b><span>" + esc(ventana() + " de " + FASE.inicio.slice(0, 4) + " · Sede única: " + (FASE.sede || "por confirmar")) + "</span></div></div>";
  const gridOf = (label, rows, full) => {
    /* La final tiene ventana oficial (/phases): sus días son las columnas aunque no haya filas ni fechas. */
    if (!FASE.regiones && FASE.inicio && FASE.fin) { const ds = []; for (const d = dateOf(FASE.inicio); isoOf(d) <= FASE.fin; d.setDate(d.getDate() + 1)) ds.push(isoOf(d));
      return '<div class="nwx-nacg">' + buildGrid({ days: ds, evA: FASE.inicio, evB: FASE.fin, label, rows }) + "</div>" + (rows.length ? "" : nacVacio()); }
    const all = [...new Set((full || rows).flatMap((r) => [...r.ds]))].sort();
    if (!all.length) return '<div class="nwx-card">' + emptyHtml("Sin " + label.toLowerCase(), "Con estos filtros no hay nada que mostrar en este nivel.") + "</div>";
    const evA = all[0], evB = all[all.length - 1], days = [], st = dateOf(evA); st.setDate(st.getDate() - 3);
    const span = Math.max(12, Math.round((dateOf(evB) - dateOf(evA)) / 864e5) + 7);
    for (let i = 0; i < span; i++) { days.push(isoOf(st)); st.setDate(st.getDate() + 1); }
    return buildGrid({ days, evA, evB, label, rows });
  };

  /* ── Niveles del flujo único: B regionales · T todas · C deportes · D pruebas · E partidos · F partido ── */
  const plab = (p) => (p.disciplina === (DEPO[p.deporteId] || {}).nombre ? [SEXO_LABEL[p.sexo], p.categoria] : [p.disciplina, SEXO_LABEL[p.sexo], p.categoria]).filter(Boolean).join(" · ") || p.disciplina; /* sin sexo ni categoría la prueba se llama como su disciplina */
  /* El partido o la serie entra si algún participante es la institución (o un deportista suyo). */
  const encIn = (e) => !S.c.inst || e.participantes.some((x) => instOfP(x) === S.c.inst);
  const encsOf = (p) => { const ro = (e) => ((p.rondas || []).filter((x) => x.id === e.rondaId)[0] || {}).orden || 0;
    return (ENC[p.id] || []).filter((e) => e.participantes.length).sort((a, b) => ro(a) - ro(b) || (a.numero || 0) - (b.numero || 0)); };
  const isTeam = (e) => e.participantes.length === 2 && e.participantes[0].tipo === "equipo";
  const elab = (e) => (isTeam(e) ? "Partido " : "Serie ") + (e.numero || "");
  const rondaOf = (p, e) => ((p.rondas || []).filter((x) => x.id === e.rondaId)[0] || {}).nombre || "";
  const dated = (p) => (ENC[p.id] || []).some((e) => e.fecha);
  /* Sin regiones (la final) no hay tarjetas de regional: la fase entra directo a Deportes. */
  const level = () => { const R = FASE.regiones ? S.c.regional : true; return S.m && ENCBY[S.m] ? "F" : S.p && PBY[S.p] ? "E" : R && S.c.deporte ? "D" : R ? "C" : S.todas ? "T" : "B"; };
  const entryLvl = () => (FASE.regiones ? "B" : autoDep() ? "D" : "C");
  const LV = {
    B: () => ({ c: { tipo: ENT.e } }), T: () => ({ c: { tipo: ENT.e }, todas: true }), C: (r) => ({ c: { tipo: ENT.e, regional: r } }),
    D: (dep) => ({ c: Object.assign({}, S.c, { deporte: dep }) }), E: (pid) => ({ c: S.c, d: S.d, p: pid }), F: (mid) => ({ c: S.c, d: S.d, p: S.p, m: mid })
  };
  const hrefOf = (o) => hashOf(o) || "#";
  /* Estado agregado de un conjunto de pruebas, calculado de los datos (sin inventar avance). */
  const progress = (ps) => { const n = ps.length, fin = ps.filter((p) => p.estado === "finalizada").length, live = ps.some((p) => p.estado === "en-competencia");
    return { st: n && fin === n ? ["fin", "Terminado"] : live || fin ? ["live", "En competencia"] : ["prog", "Programado"], txt: fin + " de " + n + (n === 1 ? " prueba terminada" : " pruebas terminadas") }; };
  const RTINT = { fin: "bg-calendar-blue", live: "bg-calendar-orange", prog: "bg-calendar-pink" };
  const SHORT = { fin: "Terminado", live: "En curso", prog: "Programado" };
  const pillH = (st) => '<span class="nwx-state nwx-gst ' + st[0] + '">' + esc(st[1]) + "</span>";
  const ENCST = { finalizado: ["fin", "Finalizado"], "en-curso": ["live", "En curso"] };
  const encSt = (e) => ENCST[e.estado] || ["prog", "Programado"];
  const nEnc = (es) => { const t = es.some(isTeam); return es.length + (t ? (es.length === 1 ? " partido" : " partidos") : (es.length === 1 ? " serie" : " series")); };
  const regPruebas = (rid) => PRUEBAS.filter((p) => (!FASE.regiones || p.regionalId === rid) && ok(p, Object.assign({}, S.c, { regional: rid })));
  const rowsT = (all) => REGIONALES.filter((r) => regTipo(r.id) === ENT.e && (all || !S.d || regPruebas(r.id).some(onDay))).map((r) => { const ps = regPruebas(r.id), pr = progress(ps);
    return { bl: blOf(ps), stl: pr.st[1], name: r.nombre, dep: "", ds: new Set(ps.flatMap(dayDates)), range: ps.length > 0 && !ps.some(dated), href: hrefOf(LV.C(r.id)), pill: pillH(pr.st), sub: pr.txt, tint: RTINT[pr.st[0]], lbl: SHORT[pr.st[0]] }; });
  const rowsC = (all) => { const ps = regPruebas(S.c.regional);
    return D.deportes.filter((d) => ps.some((p) => p.deporteId === d.id && (all || onDay(p)))).map((d) => { const mine = ps.filter((p) => p.deporteId === d.id), pr = progress(mine), ds = new Set(mine.flatMap(dayDates));
      const o = { name: d.nombre, dep: d.id, ds, range: !mine.some(dated), href: hrefOf(LV.D(d.id)), bl: blOf(mine) };
      return Object.assign(o, RES ? { stl: pr.st[1], pill: pillH(pr.st), sub: pr.txt, tint: RTINT[pr.st[0]], lbl: SHORT[pr.st[0]] } : { sub: spanLbl2(o) + " · " + mine.length + (mine.length === 1 ? " prueba" : " pruebas") }); }); };
  const onDay = (p) => !S.d || (ENC[p.id] || []).some((e) => e.fecha === S.d);
  const rowsD = () => regPruebas(S.c.regional).filter((p) => p.deporteId === S.c.deporte && onDay(p))
    .sort((a, b) => String(a.sexo).localeCompare(String(b.sexo)) || String(a.categoria).localeCompare(String(b.categoria)) || a.disciplina.localeCompare(b.disciplina, "es"))
    .map((p) => { const es = encsOf(p), st = STATE[p.estado] || ["prog", "Programada"], o = { name: plab(p), dep: p.deporteId, ds: new Set(dayDates(p)), range: !dated(p), href: hrefOf(LV.E(p.id)), bl: blOf([p]) };
      return Object.assign(o, RES ? { stl: st[1], pill: pillH(st), sub: nEnc(es) + (p.estado === "finalizada" ? " · " + leaderOf(p) : ""), tint: RTINT[st[0]], lbl: st[1] } : { sub: spanLbl2(o) + (es.length ? " · " + nEnc(es) : "") }); });
  const leaderOf = (p) => { const r = p.resultado, f = r && r.tipo === "clasificacion" ? r.filas[0] : r && r.tipo === "posiciones" && r.tablas.length === 1 ? r.tablas[0].filas[0] : null; return f ? "1.º " + nameOf(f.refId) : ""; };
  /* Medallería de la final: se cuenta desde las mismas filas con medalla del podio; un equipo suma una sola medalla. Sin medallas no se pinta. */
  const medalleria = () => {
    if (!RES || FASE.regiones || !FASE.medallas) return "";
    const t = {};
    PRUEBAS.forEach((p) => { const r = p.resultado; if (!r || p.estado !== "finalizada" || !ok(p, S.c)) return;
      (r.tipo === "clasificacion" ? r.filas : r.tipo === "posiciones" ? r.tablas.flatMap((x) => x.filas) : []).forEach((f) => { const i = MEDAL_IX[f.medalla], d = (ATH[f.refId] || INS[f.refId] || {}).departamentoId; if (i != null && DPT[d]) (t[d] = t[d] || [0, 0, 0])[i]++; }); });
    const rows = Object.keys(t).sort((a, b) => t[b][0] - t[a][0] || t[b][1] - t[a][1] || t[b][2] - t[a][2] || DPT[a].nombre.localeCompare(DPT[b].nombre, "es"));
    if (!rows.length) return "";
    const th = (i, n) => '<th scope="col" class="c"><span class="nwx-gsw" aria-hidden="true">' + '<nao-award kind="medal" metal="' + METALES[i] + '" icon="none" edition="colombia" size="18" ribbon="false" shadow="false" animated="false"></nao-award></span>' + n + "</th>";
    return fxCard("Medallería por departamento", '<div class="nwx-tbox nwx-tscroll"><table class="nwx-rtab"><thead><tr><th scope="col">#</th><th scope="col">Departamento</th>' + th(0, "Oro") + th(1, "Plata") + th(2, "Bronce") + '<th scope="col" class="c">Total</th></tr></thead><tbody>' +
      rows.map((d, n) => "<tr><td>" + rank(n + 1) + '</td><td><span class="nwx-who"><img class="nwx-flag" src="../public/department_flags/' + slugOf(d) + '.png" alt="" width="22" height="15">' + esc(DPT[d].nombre) + "</span></td>" + t[d].map((v) => '<td class="c">' + v + "</td>").join("") + '<td class="c"><b>' + (t[d][0] + t[d][1] + t[d][2]) + "</b></td></tr>").join("") + "</tbody></table></div>", "nwx-flat");
  };
  /* Convenciones de la grilla: se arman con las filas que de verdad se pintaron, así nunca dicen algo que no está. */
  let legOpen = false; /* solo en memoria; render() lo cierra al cambiar de nivel */
  document.addEventListener("click", (ev) => { const b = ev.target.closest && ev.target.closest(".nwx-gleg__btn"); if (!b) return; const box = b.closest(".nwx-gleg"); legOpen = !box.classList.contains("is-open"); box.classList.toggle("is-open", legOpen); b.setAttribute("aria-expanded", legOpen); });
  const legend = (rows) => {
    const it = [], seen = {}, ORD = ["bg-calendar-blue", "bg-calendar-orange", "bg-calendar-pink"], sw = (c) => '<i class="nwx-gsw ' + c + '" aria-hidden="true"></i>';
    if (RES) rows.slice().sort((a, b) => ORD.indexOf(a.tint) - ORD.indexOf(b.tint)).forEach((r) => { if (!seen[r.tint]) { seen[r.tint] = 1; it.push(sw(r.tint) + esc(r.stl)); } });
    else { const by = {}; rows.forEach((r) => { const c = TINT[r.dep] || "bg-calendar-orange", n = (DEPO[r.dep] || {}).nombre; if (!n) return; (by[c] = by[c] || []); if (!by[c].includes(n)) by[c].push(n); });
      Object.keys(by).forEach((c) => it.push(sw(c) + "Color del deporte: " + esc(by[c].join(", ")))); }
    const mark = (svg) => '<span class="nwx-gmk" aria-hidden="true">' + svg + "</span>";
    it.push(mark(FLAG) + "Inicio de la competencia", mark(TROPHY_W) + "Final de la competencia");
    /* Ficha y banda son lo mismo (días con partidos); un solo ítem y el texto se ajusta a lo que la grilla pinta. */
    const fi = rows.some((r) => !r.range && r.ds.size), ba = rows.some((r) => r.range && r.ds.size);
    const f1 = '<span class="nwx-gs1" aria-hidden="true"></span>Ficha: ese día hay partidos o series.', f2 = '<span class="nwx-gs2" aria-hidden="true"></span>Barra continua: la prueba se juega entre esos días; sus partidos aún no tienen fecha.';
    if (fi) it.push(f1);
    if (ba) it.push(f2);
    if (!it.length) return "";
    return '<section class="nwx-gleg' + (legOpen ? " is-open" : "") + '" aria-label="Convenciones del calendario"><button type="button" class="nwx-gleg__btn" aria-expanded="' + legOpen + '" aria-controls="nwx-gleg-list"><span>Convenciones · ' + it.length + "</span>" + CHEV + '</button><div class="nwx-gleg__body" id="nwx-gleg-list"><div class="nwx-gleg__in"><ul>' + it.map((x) => "<li>" + x + "</li>").join("") + "</ul></div></div></section>";
  };

  /* Fila de resultado estándar: Partido · Local [DEP] · marcador con estado · [DEP] Visitante · ›. El móvil apila dos líneas. */
  const depBadge = (id) => { const d = (ATH[id] || INS[id] || {}).departamentoId, n = depName(id); return d ? '<span class="nwx-dep" title="' + esc(n) + '" aria-label="' + esc(n) + '">' + esc(String(d).toUpperCase()) + "</span>" : ""; };
  const MCHEV = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>';
  const mrow = (e, p) => { const ps = e.participantes, team = isTeam(e), fin = e.estado === "finalizado", sede = SEDE[e.sedeId], sc = encSt(e)[0] !== "prog", st = encSt(e);
    const num = (x) => (sc && x.marcador != null ? +x.marcador : null), n0 = team ? num(ps[0]) : null, n1 = team ? num(ps[1]) : null, has = n0 != null && n1 != null;
    const w = has ? (n0 > n1 ? 0 : n1 > n0 ? 1 : -1) : -1, cls = (i) => (w < 0 ? "" : w === i ? " is-w" : " is-l");
    const tag = '<span class="nwx-mst ' + st[0] + '">' + st[1] + "</span>", href = hrefOf({ c: S.c, p: S.p || e.pruebaId, d: S.d, m: e.id }), lab = elab(e);
    const sub = [e.fecha ? fmtDia(e.fecha, "wd") : "", sede ? sede.nombre + " · " + sede.municipio : ""].filter(Boolean).join(" · ");
    const subH = sub ? '<small class="nwx-msub">' + esc(sub) + "</small>" : "";
    /* Eventos y fases es informativo: sin enlace por fila; el único acceso a Resultados está arriba, en viewE. */
    const btn = RES ? '<i class="nwx-mdv" aria-hidden="true"></i><span class="nwx-mgo-wrap" aria-hidden="true"><span class="nwx-mgo-t">Ver detalles</span><span class="nwx-mgo">' + MCHEV + "</span></span>" : "";
    const open = RES ? '<a class="nwx-mrow' : '<article class="nwx-mrow nwx-minfo', close = RES ? "</a>" : "</article>", lnk = (lb) => (RES ? ' href="' + href + '" aria-label="' : ' aria-label="') + lb + '">';
    if (!team) { const top = ps.slice().sort((a, b) => (a.puesto || 99) - (b.puesto || 99))[0];
      const n1 = ps.length + (ps.length === 1 ? " participante" : " participantes"), l1 = fin && top && top.puesto ? "1.º " + esc(nameOf(top.refId)) + (top.marca ? " · " + esc(top.marca) : "") : "";
      const t = n1 + (l1 ? " · " + l1 : ""), tH = "<span>" + n1 + "</span>" + (l1 ? '<span class="nwx-mw1">' + l1 + "</span>" : "");
      return open + ' nwx-msolo"' + lnk(esc(lab + ": " + t.replace(/<[^>]+>/g, "") + ", " + st[1].toLowerCase())) + '<b class="nwx-mn">' + esc(lab) + '</b><i class="nwx-mdv" aria-hidden="true"></i><span class="nwx-mwho">' + tH + subH + "</span>" + tag + btn + close; }
    const nm = (x, i) => '<span class="nwx-mnm' + cls(i) + '" title="' + esc(nameOf(x.refId)) + '">' + esc(nameOf(x.refId)) + "</span>", sd = (x, i) => i ? depBadge(x.refId) + nm(x, i) : nm(x, i) + depBadge(x.refId);
    const mid = has ? '<b class="nwx-mf' + cls(0) + '">' + n0 + '</b><span class="nwx-mg">–</span><b class="nwx-mf' + cls(1) + '">' + n1 + "</b>" : '<span class="nwx-mvs2">vs</span>';
    const mob = (x, i, n) => '<span class="nwx-mmq">' + depBadge(x.refId) + nm(x, i) + '</span><b class="nwx-mmb' + cls(i) + '">' + (n != null && has ? n : "–") + "</b>";
    const al = lab + ": " + nameOf(ps[0].refId) + (has ? " " + n0 : "") + ", " + nameOf(ps[1].refId) + (has ? " " + n1 : "") + ", " + st[1].toLowerCase();
    return open + '"' + lnk(esc(al)) + '<b class="nwx-mn">' + esc(lab) + subH + '</b><i class="nwx-mdv" aria-hidden="true"></i>'
      + '<span class="nwx-mhome"><span class="nwx-ml">' + sd(ps[0], 0) + "</span>" + '</span><span class="nwx-mbox"><span class="nwx-mscore">' + mid + "</span>" + tag + '</span><span class="nwx-maway">' + sd(ps[1], 1) + "</span>"
      + btn + '<span class="nwx-mtop" aria-hidden="true"><b class="nwx-mn">' + esc(lab) + subH + "</b>" + tag + '</span><span class="nwx-mm1" aria-hidden="true">' + mob(ps[0], 0, n0) + '</span><span class="nwx-mm2" aria-hidden="true">' + mob(ps[1], 1, n1) + "</span>" + close; };
  /* Cabecera del partido: mismo lenguaje que mrow en tamaño grande; la unidad rotula las cifras (el «3 vs 1» es ambiguo). */
  const matchHead = (e, p) => { const ps = e.participantes, st = encSt(e), unit = UNIT[(DEPO[p.deporteId] || {}).nombre] || "";
    const num = (x) => (encSt(e)[0] !== "prog" && x.marcador != null ? +x.marcador : null), n0 = num(ps[0]), n1 = num(ps[1]), has = n0 != null && n1 != null;
    const w = has ? (n0 > n1 ? 0 : n1 > n0 ? 1 : -1) : -1, cls = (i) => (w < 0 ? "" : w === i ? " is-w" : " is-l");
    const nm = (x, i) => '<span class="nwx-mnm' + cls(i) + '" title="' + esc(nameOf(x.refId)) + '">' + esc(nameOf(x.refId)) + "</span>", tag = '<span class="nwx-mst ' + st[0] + '">' + st[1] + "</span>";
    const mid = has ? '<b class="nwx-mf' + cls(0) + '">' + n0 + '</b><span class="nwx-mg">–</span><b class="nwx-mf' + cls(1) + '">' + n1 + "</b>" : '<span class="nwx-mvs2">vs</span>';
    const al = nameOf(ps[0].refId) + (has ? " " + n0 : "") + ", " + nameOf(ps[1].refId) + (has ? " " + n1 : "") + ", " + st[1].toLowerCase();
    const mob = (x, i, n) => '<span class="nwx-mmq">' + depBadge(x.refId) + nm(x, i) + '</span><b class="nwx-mmb' + cls(i) + '">' + (n != null && has ? n : "–") + "</b>";
    return '<div class="nwx-mhd" role="group" aria-label="' + esc(al) + '"><span class="nwx-ml">' + nm(ps[0], 0) + depBadge(ps[0].refId) + '</span><span class="nwx-mbox"><span class="nwx-mu">' + (has && unit ? unit : "") + '</span><span class="nwx-mscore">' + mid + "</span>" + tag + '</span><span class="nwx-maway">' + depBadge(ps[1].refId) + nm(ps[1], 1) + "</span>"
      + '<span class="nwx-mtop" aria-hidden="true">' + (has && unit ? '<span class="nwx-mu">' + unit + "</span>" : "<span></span>") + tag + '</span><span class="nwx-mm1" aria-hidden="true">' + mob(ps[0], 0, n0) + '</span><span class="nwx-mm2" aria-hidden="true">' + mob(ps[1], 1, n1) + "</span></div>"; };
  const mlist = (es, p) => { const solo = !es.some(isTeam); return '<div class="nwx-mlist2"><div class="nwx-mhead" aria-hidden="true"><span>' + (solo ? "Serie" : "Partido") + "</span><span></span>" + (solo ? '<span>Participantes</span><span class="nwx-mh-c">Estado</span>' : '<span class="nwx-mh-l">Local</span><span class="nwx-mh-c">Marcador</span><span class="nwx-mh-v">Visitante</span>') + (RES ? "<span></span><span></span>" : "") + "</div>" + es.map((e) => mrow(e, p)).join("") + "</div>"; };
  /* Tablas del resultado propio del nodo (grupo o prueba), siempre en bloque aparte de la lista de hijos. */
  const tablesOf = (p, grupo) => { const r = p.resultado; if (!r) return "";
    const q = grupo && r.tipo === "posiciones" ? Object.assign({}, p, { resultado: Object.assign({}, r, { tablas: r.tablas.filter((t) => t.grupo === grupo) }) }) : p;
    const tb = resultHtml(q, false, { part: "tables" }); return tb.includes("nwx-tbox") ? tb : ""; };
  const viewT = () => '<div class="nwx-view nwx-fx nwx-lens">' + (() => { const r = rowsT(); return gridOf("Regionales", r, rowsT(true)) + legend(r); })() + "</div>";
  /* Resultados lista solo deportes con algo jugado; el resto va en una nota al pie. */
  const viewC = () => '<div class="nwx-view nwx-fx nwx-lens">' + medalleria() + (() => { const all = rowsC(), full = rowsC(true), r = RES ? all.filter((x) => x.stl !== "Programado") : all, rest = all.length - r.length;
    const det = RES && rest ? rest + (rest === 1 ? " deporte programado, sin resultados todavía." : " deportes programados, sin resultados todavía.") : "", nota = det ? '<p class="nwx-muted nwx-porjugar">' + det + "</p>" : "";
    /* La final sin deportes publicados no es «sin resultados»: muestra su calendario vacío con la ventana real. */
    if (RES && !r.length && (FASE.regiones || all.length)) return sinRes("Aún no hay resultados " + (FASE.regiones ? "en esta regional" : "de la final"), det);
    return gridOf("Deportes", r, full) + legend(r) + nota; })() + "</div>";
  const viewDgrid = () => '<div class="nwx-view nwx-fx nwx-lens">' + dayStrip(true) + (() => { const r = rowsD(); return gridOf("Pruebas", r) + legend(r); })() + "</div>";
  /* Resultados no usa días: misma grilla, con una columna «Resultado» donde iban las fechas. */
  const cierreOf = (p) => { const r = p.resultado, li = (t, x) => '<b>' + esc(t) + "</b> " + esc(x);
    if (r && r.tipo === "clasificacion") return r.filas.slice(0, 3).map((f) => li((f.puesto || "") + ".º", nameOf(f.refId) + (f.marca ? " · " + f.marca : "")));
    if (r && r.tipo === "posiciones") return r.tablas.slice(0, 3).filter((t) => t.filas[0]).map((t) => li(t.grupo ? "Grupo " + t.grupo + " · 1.º" : "1.º", nameOf(t.filas[0].refId)));
    return []; };
  /* Resultados: maestro-detalle. Elegir una prueba solo repinta el panel; «Ver más» entra al nivel Prueba. */
  const MORE = (href, name) => '<a class="nwx-bmore" href="' + href + '" aria-label="Ampliar resultados: ' + esc(name) + '">' + MCHEV + " Ampliar resultados</a>";
  let selD = ""; try { selD = sessionStorage.getItem(SELD) || ""; } catch (x) { /* sin storage */ }
  const dRows = () => { const ps = regPruebas(S.c.regional).filter((p) => p.deporteId === S.c.deporte); return rowsD().map((r) => Object.assign(r, { p: ps.filter((q) => hrefOf(LV.E(q.id)) === r.href)[0] })).filter((r) => r.p); };
  const dPanel = (r) => { const p = r.p, es = encsOf(p), c = cierreOf(p);
    const inD = (e) => (!S.c.depto || e.participantes.some((x) => ((ATH[x.refId] || INS[x.refId] || {}).departamentoId) === S.c.depto)) && encIn(e);
    const fins = es.filter((e) => e.estado === "finalizado" && inD(e)).reverse();
    let body;
    const pod = p.estado === "finalizada" ? indPod(p) : null;
    if (pod && indRows(p)) body = podBlock(p, 5);
    else if (pod) body = podiumHtml(pod) + (fins.length && es.some(isTeam) ? '<div class="nwx-lcard"><div class="nwx-mlist2">' + fins.map((e) => mrow(e, p)).join("") + "</div></div>" : "");
    else if (fins.length && !(p.estado === "finalizada" && c.length && !es.some(isTeam))) body = '<div class="nwx-lcard"><div class="nwx-mlist2">' + fins.map((e) => mrow(e, p)).join("") + "</div></div>";
    else body = '<p class="nwx-bline">' + (p.estado === "finalizada" && c.length ? c.map((x) => "<span>" + x + "</span>").join(' <i class="nwx-rsep" aria-hidden="true">·</i> ') : "Aún sin partidos finalizados") + "</p>";
    return '<h3 class="nwx-dmt"><small class="nwx-dmk">Resultado</small>' + esc(r.name) + " " + r.pill + "</h3>" + body + MORE(r.href, r.name); };
  /* Tira de días: solo con fechas reales de partidos; sin ellas lo dice, no inventa un calendario. */
  /* Los días se ofrecen sin contar el sexo activo: elegir uno donde no juega ese sexo lo devuelve a «Todos». */
  /* Con grilla de días (Eventos y fases, nivel D) el encabezado es el selector y aquí solo van los avisos. */
  const dayStrip = (grid, hd) => { const pool = dayPool(Object.assign({}, S.c, { sexo: "" })), ds = datedDays(pool);
    if (!ds.length) return "";
    const ax = dayAxis({ pick: new Set(ds), sel: S.d, evA: ds[0], evB: ds[ds.length - 1], days: ds }); return grid ? "" : hd ? ax.lineHd(ds) : ax.line(ds); };
  const viewD = () => { const h = viewD0(), m = autoDep() ? medalleria() : ""; return m ? h.replace('<div class="nwx-view nwx-fx nwx-lens">', '<div class="nwx-view nwx-fx nwx-lens">' + m) : h; };
  const viewD0 = () => {
    if (!RES) return viewDgrid();
    const all = dRows(), rows = all.filter((r) => r.p.estado === "finalizada" || r.p.estado === "en-competencia"), rest = all.length - rows.length;
    const det = rest ? rest + (rest === 1 ? " prueba programada, sin resultados todavía." : " pruebas programadas, sin resultados todavía.") : "", nota = det ? '<p class="nwx-muted nwx-porjugar">' + det + "</p>" : "";
    if (!rows.length && !all.length && !FASE.regiones && FASE.inicio) return '<div class="nwx-view nwx-fx nwx-lens">' + nacVacio() + "</div>";
    if (!rows.length) return '<div class="nwx-view nwx-fx nwx-lens">' + (all.length ? sinRes("Aún no hay resultados", det) : '<div class="nwx-card">' + emptyHtml("Sin pruebas", "Con estos filtros no hay nada que mostrar en este nivel.") + "</div>") + "</div>";
    if (!rows.some((r) => r.p.id === selD)) selD = rows[0].p.id;
    const cur = rows.filter((r) => r.p.id === selD)[0];
    return '<div class="nwx-view nwx-fx nwx-lens"><div class="nwx-dm"><div class="nwx-dmh"><span>Pruebas</span><div class="nwx-dmhd">' + dayStrip(false, true) + '</div></div><div class="nwx-dml" role="group" aria-label="Pruebas">'
      + rows.map((r) => '<button type="button" class="nwx-dmi' + (r.p.id === selD ? " is-on" : "") + '" data-a="dsel" data-id="' + esc(r.p.id) + '" aria-pressed="' + (r.p.id === selD) + '"><span class="nwx-rl"><span class="block truncate font-bold text-sm" title="' + esc(r.name) + '">' + esc(r.name) + "</span>" + r.pill + '</span><span class="block truncate text-xs nwx-dms" title="' + esc(r.sub) + '">' + esc(r.sub) + "</span></button>").join("")
      + '</div><div class="nwx-dmp" id="nwx-dmp" aria-live="polite">' + dPanel(cur) + "</div></div>" + nota + "</div>";
  };
  /* Llaves de eliminación: una columna por ronda; el tercer puesto va aparte. Las líneas se dibujan en SVG según la posición real de las tarjetas. */
  const BR_RE = /final|cuartos|octavos|tercer/i, BR_KEY = "nwx-llaves-dir";
  const brEnc = (p) => (ENC[p.id] || []).slice().sort((a, b) => (a.numero || 0) - (b.numero || 0));
  const isBracket = (p) => { const rs = p.rondas || [], es = brEnc(p); return rs.length > 1 && es.length > 1 && rs.every((r) => BR_RE.test(r.nombre)) && rs.some((r) => /final/i.test(r.nombre)) && es.every((e) => e.participantes.length === 2); };
  let brDir = (() => { try { const v = localStorage.getItem(BR_KEY); if (v === "h" || v === "v") return v; } catch (e) { /* sin storage */ } return innerWidth < 700 ? "v" : "h"; })();
  const brCard = (e, nx, i) => {
    const st = encSt(e), sede = SEDE[e.sedeId], ps = e.participantes, sc = (x) => (x && st[0] !== "prog" && x.marcador != null ? +x.marcador : null);
    const w = sc(ps[0]) != null && sc(ps[1]) != null ? (sc(ps[0]) > sc(ps[1]) ? 0 : sc(ps[1]) > sc(ps[0]) ? 1 : -1) : -1;
    const row = (x, k) => x ? '<span class="nwx-brp' + (w === k ? " is-w" : w >= 0 ? " is-l" : "") + '"><span class="nwx-bra">' + esc(initials(nameOf(x.refId))) + '</span><span class="nwx-brn"><b>' + esc(nameOf(x.refId)) + "</b><small>" + esc(depName(x.refId)) + "</small></span>" + (sc(x) != null ? '<span class="nwx-brs">' + sc(x) + "</span>" : "") + "</span>"
      : '<span class="nwx-brp is-tbd"><span class="nwx-bra">?</span><span class="nwx-brn"><b>Por definir</b></span></span>';
    const meta = [e.fecha ? fmtDia(e.fecha, "wd") : "", sede ? sede.nombre + " · " + sede.municipio : ""].filter(Boolean).join(" · ");
    const inner = row(ps[0], 0) + row(ps[1], 1) + '<span class="nwx-brf"><span class="nwx-mst ' + st[0] + '">' + st[1] + "</span>" + (meta ? "<small>" + esc(meta) + "</small>" : "") + "</span>";
    const at = ' class="nwx-brc" data-id="' + esc(e.id) + '" data-nx="' + esc(nx || "") + '" style="--i:' + i + '"';
    return RES ? "<a" + at + ' href="' + hrefOf({ c: S.c, p: S.p || e.pruebaId, d: S.d, m: e.id }) + '" aria-label="' + esc(elab(e) + ": " + ps.map((x) => nameOf(x.refId)).join(" contra ")) + '">' + inner + "</a>" : "<div" + at + ' tabindex="0">' + inner + "</div>"; };
  const brSwitch = () => { const dir = (d, t) => '<button type="button" class="nwx-segb' + (brDir === d ? " on" : "") + '" aria-pressed="' + (brDir === d) + '" data-a="brdir" data-v="' + d + '">' + t + "</button>";
    return '<div class="nwx-seg nwx-brdir" role="group" aria-label="Orientación de las llaves">' + dir("h", "Horizontal") + dir("v", "Vertical") + "</div>"; };
  const bracketHtml = (p) => {
    const rs = (p.rondas || []).slice().sort((a, b) => (a.orden || 0) - (b.orden || 0)), es = brEnc(p), main = rs.filter((r) => !/tercer/i.test(r.nombre)), third = rs.filter((r) => /tercer/i.test(r.nombre))[0];
    const of = (r) => es.filter((e) => e.rondaId === r.id);
    const col = (r, ri) => { const ms = of(r), nxt = ri >= 0 && main[ri + 1] ? of(main[ri + 1]) : [];
      return '<section class="nwx-brcol" aria-label="' + esc(r.nombre) + '"><span class="nwx-brh">' + esc(r.nombre.replace(/^Semifinales$/i, "Semifinal")) + '</span><div class="nwx-brm">' + ms.map((e, i) => brCard(e, nxt[Math.floor(i / 2)] && nxt[Math.floor(i / 2)].id, ri * 3 + i)).join("") + "</div></section>"; };
    return '<div class="nwx-br" data-dir="' + brDir + '"><div class="nwx-brscroll"><div class="nwx-brtree"><svg class="nwx-brsvg" aria-hidden="true"></svg>' + main.map(col).join("") + "</div>"
      + (third ? '<div class="nwx-brthird">' + col(third, -1) + "</div>" : "") + "</div></div>"; };
  const brDraw = (box) => {
    const tree = box.querySelector(".nwx-brtree"), svg = box.querySelector(".nwx-brsvg"); if (!tree || !svg) return;
    const t = tree.getBoundingClientRect(), v = box.dataset.dir === "v", NS = "http://www.w3.org/2000/svg"; svg.innerHTML = ""; svg.setAttribute("width", tree.scrollWidth); svg.setAttribute("height", tree.scrollHeight);
    tree.querySelectorAll(".nwx-brc[data-nx]").forEach((c) => { const nx = c.dataset.nx; if (!nx) return; const d = tree.querySelector('.nwx-brc[data-id="' + nx.replace(/"/g, "") + '"]'); if (!d) return;
      const a = c.getBoundingClientRect(), b = d.getBoundingClientRect(), x1 = v ? a.left - t.left + a.width / 2 : a.right - t.left, y1 = v ? a.bottom - t.top : a.top - t.top + a.height / 2, x2 = v ? b.left - t.left + b.width / 2 : b.left - t.left, y2 = v ? d.closest(".nwx-brcol").getBoundingClientRect().top - t.top : b.top - t.top + b.height / 2;
      const m = v ? (y1 + y2) / 2 : (x1 + x2) / 2, path = document.createElementNS(NS, "path"); path.setAttribute("d", v ? "M" + x1 + " " + y1 + "V" + m + "H" + x2 + "V" + y2 : "M" + x1 + " " + y1 + "H" + m + "V" + y2 + "H" + x2);
      path.setAttribute("class", "nwx-brl"); path.dataset.a = c.dataset.id; path.dataset.b = nx; svg.appendChild(path); const l = Math.ceil(path.getTotalLength()); path.style.setProperty("--l", l); path.style.setProperty("--d", (+c.style.getPropertyValue("--i") * 0.12 + 0.25) + "s"); }); };
  const brAll = () => document.querySelectorAll(".nwx-br").forEach(brDraw);
  const brFocus = (id) => { document.querySelectorAll(".nwx-br").forEach((box) => { box.classList.toggle("has-hl", !!id); box.querySelectorAll(".is-hl").forEach((n) => n.classList.remove("is-hl")); if (!id) return;
    const set = new Set([id]), cards = [...box.querySelectorAll(".nwx-brc")]; let c = cards.filter((x) => x.dataset.id === id)[0]; while (c && c.dataset.nx) { set.add(c.dataset.nx); c = cards.filter((x) => x.dataset.id === c.dataset.nx)[0]; }
    for (let go = true; go;) { go = false; cards.forEach((x) => { if (set.has(x.dataset.nx) && !set.has(x.dataset.id)) { set.add(x.dataset.id); go = true; } }); }
    cards.forEach((x) => x.classList.toggle("is-hl", set.has(x.dataset.id))); box.querySelectorAll(".nwx-brl").forEach((l) => l.classList.toggle("is-hl", set.has(l.dataset.a) && set.has(l.dataset.b))); }); };
  const setBrDir = (d) => { brDir = d; try { localStorage.setItem(BR_KEY, d); } catch (e) { /* sin storage */ }
    document.querySelectorAll(".nwx-br").forEach((box) => { box.dataset.dir = d; box.classList.remove("is-anim"); void box.offsetWidth; box.classList.add("is-anim"); box.querySelectorAll('[data-a="brdir"]').forEach((b) => { b.classList.toggle("on", b.dataset.v === d); b.setAttribute("aria-pressed", String(b.dataset.v === d)); }); });
    requestAnimationFrame(brAll); };
  const DIV = '<hr class="nwx-div" role="separator">';
  const viewE = () => {
    const p = PBY[S.p], all = encsOf(p), es = (S.d ? all.filter((e) => e.fecha === S.d) : all).filter(encIn), team = all.some(isTeam), r = p.resultado;
    const gs = [...new Set(es.map((e) => e.grupo).filter(Boolean))], rs = p.rondas || [];
    const kick = [rs.length === 1 ? rs[0].nombre : "", gs.length === 1 ? "Grupo " + gs[0] : ""].filter(Boolean).join(" · ");
    /* Misma prueba en la lente Resultados; solo si hay algo jugado, para no llevar a una pantalla vacía. */
    const played = es.some((e) => encSt(e)[0] !== "prog") || p.estado === "finalizada" || p.estado === "en-competencia";
    const qs = new URLSearchParams(location.search); qs.delete("entrada");
    const ver = !RES && played ? '<a class="nwx-bver" href="' + urlOf("resultados") + (qs.toString() ? "?" + qs.toString() : "") + hrefOf({ c: S.c, d: S.d, p: S.p }) + '" aria-label="Ver esta prueba en resultados">Ver en resultados <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg></a>' : "";
    const one = r && r.tipo === "posiciones" && r.tablas.length === 1, tb = tablesOf(p);
    const pod = p.estado === "finalizada" ? indPod(p) : null;
    const res = tb || pod ? fxCard((pod ? "Podio y clasificación" : one ? "Resultado de este grupo" : "Resultado de la prueba") + (kick ? ' <small class="nwx-k2">' + esc(kick) + "</small>" : ""), (indRows(p) ? podBlock(p) : (pod ? podiumHtml(pod) : "") + tb), "nwx-flat", ver) : "";
    /* Resultados lista solo lo jugado; lo programado queda en una línea, sin fechas inventadas. */
    const shown = RES ? es.filter((e) => encSt(e)[0] !== "prog") : es, rest = es.length - shown.length;
    const more = RES && rest ? '<p class="nwx-muted nwx-porjugar">' + rest + (team ? (rest === 1 ? " partido por jugar" : " partidos por jugar") : (rest === 1 ? " serie por jugar" : " series por jugar")) + "</p>" : "";
    const list = fxOut((team ? "Partidos de esta prueba" : "Series de esta prueba") + ' <small class="nwx-k2">' + esc([kick, shown.length ? nEnc(shown) : ""].filter(Boolean).join(" · ")) + "</small>",
      shown.length ? mlist(shown, p) + more : rest ? more : empty(S.c.inst && all.length ? "Esta institución no tiene " + (team ? "partidos" : "series") + " en esta prueba" + (S.d ? " ese día." : ".") : "Aún no hay " + (team ? "partidos publicados" : "series publicadas") + "."), ver);
    /* Lista de salida (prueba sin terminar) o detalle por serie (terminada); sin participantes publicados no se pinta. */
    const fin = p.estado === "finalizada", serie = (e, ord) => '<div class="nwx-gt">Serie ' + esc(e.numero || "") + (e.fecha ? " · " + esc(fmtDia(e.fecha, "wd")) : "") + "</div>" +
      clasifTable(e.participantes.map((x, i) => ({ puesto: ord ? i + 1 : x.puesto || i + 1, refId: x.refId, marca: ord ? "" : x.marca || "" })).sort((a, b) => a.puesto - b.puesto), { orden: ord, sinMarca: ord });
    const pend = team || fin ? [] : es.filter((e) => e.estado !== "finalizado" && e.participantes.length), hechas = team || !fin || all.length < 2 ? [] : es.filter((e) => e.estado === "finalizado" && e.participantes.length);
    const salida = pend.length ? fxCard('Lista de salida <small class="nwx-k2">' + esc(nEnc(pend)) + "</small>", pend.map((e) => serie(e, true)).join(""), "nwx-flat nwx-salida") : "";
    const series = hechas.length ? fxCard('Series y marcas <small class="nwx-k2">' + esc(nEnc(hechas)) + "</small>", hechas.map((e) => serie(e, false)).join(""), "nwx-flat nwx-series") : "";
    const brk = isBracket(p) ? fxCard('Llaves <small class="nwx-k2">' + esc(nEnc(brEnc(p))) + "</small>", bracketHtml(p), "nwx-flat nwx-brk", '<div class="nwx-brtop">' + brSwitch() + ver + "</div>") : "";
    if (RES) { selD = p.id; try { sessionStorage.setItem(SELD, selD); } catch (x) { /* sin storage */ } } /* el back vuelve con esta prueba elegida */
    const back = '<a class="nwx-bmore nwx-bback" href="' + hrefOf({ c: S.c, d: S.d }) + '">' + MCHEV.replace("<svg", '<svg style="transform:scaleX(-1)"') + " Volver a las pruebas</a>";
    return '<div class="nwx-view nwx-fx nwx-lens"><div class="nwx-brow">' + back + dayStrip() + "</div>" + (brk ? [brk, res] : fin ? [list, res, series] : [salida, list, res]).filter(Boolean).join(DIV) + "</div>";
  };
  const viewF = () => {
    const e = ENCBY[S.m], p = PBY[e.pruebaId], team = isTeam(e), g = e.grupo;
    const sib = encsOf(p).filter((x) => x.id !== e.id && (g ? x.grupo === g : x.rondaId === e.rondaId));
    const kick = [rondaOf(p, e), g ? "Grupo " + g : ""].filter(Boolean).join(" · "), tb = tablesOf(p, g);
    const pos = tb ? fxCard((g ? "Posiciones del grupo" : "Resultado de la prueba") + (kick ? ' <small class="nwx-k2">' + esc(kick) + "</small>" : ""), tb, "nwx-flat") : "";
    const otros = sib.length ? fxOut((team ? (g ? "Otros partidos del grupo" : "Otros partidos") : "Otras series") + ' <small class="nwx-k2">' + esc([kick, nEnc(sib)].filter(Boolean).join(" · ")) + "</small>", mlist(sib, p)) : "";
    const back = '<div class="nwx-brow nwx-brow--s"><a class="nwx-bmore nwx-bback" href="' + hrefOf({ c: S.c, p: p.id, d: S.d }) + '">' + MCHEV.replace("<svg", '<svg style="transform:scaleX(-1)"') + (team ? " Volver a los partidos" : " Volver a las series") + "</a></div>";
    return '<div class="nwx-view nwx-fx nwx-lens nwx-lf">' + back + [matchSection(e, p), ...(RES ? [pos, otros] : [otros, pos])].filter(Boolean).join(DIV) + "</div>";
  };

  const slugOf = (id) => { const FIX = { sap: "archipielago-de-san-andres-providencia-y-santa-catalina", bog: "bogota-d-c-dpt", lgu: "guajira", nsa: "norte--santander" }; return FIX[id] || norm((DPT[id] || {}).nombre || "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); };
  const GEN = {
    H: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3a48a8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-label="Hombre" role="img"><circle cx="10" cy="14" r="5"/><path d="M14 10l6-6M15 4h5v5"/></svg>',
    M: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c0398a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-label="Mujer" role="img"><circle cx="12" cy="9" r="5"/><path d="M12 14v7M9 18h6"/></svg>'
  };
  const PERSON = '<svg width="20" height="20" viewBox="0 0 24 24" fill="#9a9aa8" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8z"/></svg>';
  /* Deportistas filtra sobre la persona: departamento propio e institución (propia o de la nómina de su equipo). */
  const athInst = (a, p, inst) => a.institucionId === inst || (p.nominas || []).some((n) => n.refId === inst && n.deportistas.includes(a.id));
  const inscriptions = (c0) => {
    const c = c0 || S.c, out = [];
    /* Todas las fases reales; la final de ejemplo nunca entra aquí. */
    D.participaciones.forEach((x) => { const p = PBY[x.pruebaId]; if (x.tipo === "deportista" && ATH[x.refId] && p && !p.ejemplo && ok(p, c)) out.push({ a: ATH[x.refId], p }); });
    /* Deportes de conjunto: los deportistas salen de la nómina publicada de cada equipo. */
    D.pruebas.forEach((p) => { if (!p.ejemplo && p.nominas && ok(p, c)) p.nominas.forEach((n) => n.deportistas.forEach((id) => { if (ATH[id] && !out.some((o) => o.a.id === id && o.p.id === p.id)) out.push({ a: ATH[id], p }); })); });
    return out.filter(({ a, p }) => (!c.depto || a.departamentoId === c.depto) && (!c.inst || athInst(a, p, c.inst))).sort((x, y) => x.a.nombre.localeCompare(y.a.nombre, "es"));
  };
  const PAGE = 25; /* paginación en el cliente: el conteo y las páginas reales del servidor requieren backend */
  const nAth = (rows) => new Set(rows.map((r) => r.a.id)).size;
  const chipsHtml = () => { const n = S.c.inst && INS[S.c.inst] ? INS[S.c.inst].nombre : ""; if (!n) return "";
    return '<div class="nwx-fchips" role="group" aria-label="Filtros activos"><span class="nwx-fchip"><b>' + esc(n) + '</b><button type="button" class="nwx-fchx" data-a="rm" data-t="inst" aria-label="Quitar el filtro de institución: ' + esc(n) + '"><span aria-hidden="true">×</span> Quitar</button></span></div>'; };
  const pagerHtml = (pg, pages) => pages < 2 ? "" : '<nav class="nwx-pager" aria-label="Paginación de deportistas"><button type="button" class="nwx-back-btn" data-a="pg" data-g="' + (pg - 1) + '"' + (pg <= 1 ? " disabled" : "") + '>Anterior</button><span class="nwx-pgx" aria-current="page">Página ' + pg + " de " + pages + '</span><button type="button" class="nwx-back-btn" data-a="pg" data-g="' + (pg + 1) + '"' + (pg >= pages ? " disabled" : "") + ">Siguiente</button></nav>";
  const evSelHtml = () => ENT.e ? "" : '<nav class="nwx-evsel" aria-label="Elegir evento">' + Object.keys(EVT_LABEL).map((k) => '<a class="nwx-evcard" href="' + urlOf("deportistas") + '?e=' + k + '"><small>Evento</small><b>' + EVT_LABEL[k] + "</b></a>").join("") + "</nav>";
  const viewDeportistas = () => {
    const rowsAll = inscriptions(), n = nAth(rowsAll), tot = nAth(inscriptions(ENT.e ? { tipo: ENT.e } : {})), act = Object.keys(S.c).some((k) => k !== "tipo");
    const pages = Math.max(1, Math.ceil(rowsAll.length / PAGE)), pg = Math.min(S.pg, pages);
    const bar = '<div class="nwx-tbar"><p class="nwx-count" role="status" aria-live="polite" data-n="' + n + '" data-rows="' + rowsAll.length + '" data-total="' + tot + '"><b>' + (act ? n + " de " + tot : n) + "</b> " + (n === 1 && !act ? "deportista" : "deportistas") + (rowsAll.length !== n ? " · " + rowsAll.length + " inscripciones" : "") + "</p>" + (act && rowsAll.length ? '<button type="button" class="nwx-back-btn" data-a="clear">Quitar filtros</button>' : "") + "</div>" + chipsHtml();
    if (!rowsAll.length) return '<div class="nwx-phead"><h2>Deportistas</h2></div>' + bar + '<div class="nwx-card">' + emptyHtml("No hay deportistas", "Con estos filtros no hay deportistas inscritos.") + "</div>";
    const rows = rowsAll.slice((pg - 1) * PAGE, pg * PAGE).map(({ a, p }) => {
      const dep = (DPT[a.departamentoId] || {}).nombre || "";
      return '<div class="nwx-trow" role="row" data-id="' + esc(a.id) + '"><span class="nwx-tname"><span class="nwx-tavatar">' + (GEN[a.sexo] || PERSON) + "</span>" + esc(a.nombre) + '</span><span>' + (SEXO_LABEL[a.sexo] || "") + '</span><span class="nwx-tdep"><img src="../public/department_flags/' + slugOf(a.departamentoId) + '.png" alt="" width="24" height="16">' + esc(dep) + '</span>' +
        '<span class="nwx-tsp">' + esc(DEPO[p.deporteId].nombre) + '</span><span class="nwx-tpr" title="' + esc([p.disciplina, p.categoria, SEXO_LABEL[p.sexo]].filter(Boolean).join(" ")) + '">' + esc([p.disciplina, p.categoria, SEXO_LABEL[p.sexo]].filter(Boolean).join(" ")) + '</span><button type="button" class="nwx-tlink" data-a="ficha" data-id="' + a.id + '" aria-label="Ver perfil de ' + esc(a.nombre) + '" title="Ver perfil"><span class="nwx-mgo-t">Ver perfil</span><span class="nwx-mgo">' + MCHEV + "</span></button></div>";
    }).join("");
    return '<div class="nwx-phead"><h2>Deportistas</h2></div>' + evSelHtml() + bar + '<div class="nwx-card nwx-card--flush"><div class="nwx-tgrid" role="table"><div class="nwx-thead" role="row"><span>Nombre</span><span>Sexo</span><span>Departamento</span><span>Deporte</span><span>Prueba</span><span></span></div>' + rows + "</div>" + pagerHtml(pg, pages) + "</div>";
  };
  const fxCard = (t, body, cls, act) => '<section class="nwx-fxc' + (cls ? " " + cls : "") + '"><h3>' + t + "</h3>" + (act || "") + body + "</section>";
  const fxOut = (t, body, act) => '<section class="nwx-fxc nwx-flat nwx-out"><h3>' + t + "</h3>" + (act || "") + '<div class="nwx-lcard">' + body + "</div></section>";
  const BACK = '<button type="button" class="nwx-back-btn nwx-icon" data-a="back" aria-label="Volver" title="Volver"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg></button>';
  const sedesCard = (p) => {
    if (p.estado === "finalizada") return "";
    const ids = [...new Set((ENC[p.id] || []).map((e) => e.sedeId).filter(Boolean))].filter((id) => SEDE[id]);
    return ids.length ? fxCard("Sedes del evento", '<div class="nwx-sedes">' + ids.map((id) => '<div class="nwx-sede"><b>' + esc(SEDE[id].nombre) + "</b><span>" + esc(SEDE[id].municipio) + "</span></div>").join("") + "</div>") : "";
  };
  const otrasCard = (p) => {
    const otras = PRUEBAS.filter((q) => q.id !== p.id && q.deporteId === p.deporteId && q.regionalId === p.regionalId).slice(0, 8);
    return otras.length ? fxCard("Otras pruebas de " + esc(DEPO[p.deporteId].nombre), '<div class="nwx-otras">' + otras.map((q) => '<button type="button" class="nwx-sm" data-a="fp" data-id="' + esc(q.id) + '">' + [q.disciplina, SEXO_LABEL[q.sexo], q.categoria].filter(Boolean).map(esc).join(" · ") + "</button>").join("") + "</div>") : "";
  };
  const matchSection = (e, p) => {
    const ps = e.participantes, team = ps.length === 2 && ps[0].tipo === "equipo", fin = e.estado === "finalizado";
    const ronda = ((p.rondas || []).filter((x) => x.id === e.rondaId)[0] || {}).nombre || "", sede = SEDE[e.sedeId];
    const meta = [ronda, e.grupo ? "Grupo " + e.grupo : "", e.fecha ? fmtDia(e.fecha, "larga") : "Fecha por confirmar", sede ? sede.nombre + " · " + sede.municipio : "Sin sede asignada"].filter(Boolean);
    let body;
    if (team) body = '<div class="nwx-mcard">' + matchHead(e, p) + '<div class="nwx-two">' + rosterHtml(ps[0], p) + "<span></span>" + rosterHtml(ps[1], p) + "</div></div>";
    else body = ps.length ? clasifTable(ps.map((x, i) => ({ puesto: fin ? x.puesto || i + 1 : i + 1, refId: x.refId, marca: fin ? (x.marca || (x.marcador != null ? x.marcador : "")) : "" })), { orden: !fin, sinMarca: !fin }) : empty("Aún no hay participantes asignados.");
    return '<section class="nwx-fxc nwx-match" data-eid="' + esc(e.id) + '"><div class="nwx-mh"><div><h3>' + esc(elab(e) + " · " + DEPO[p.deporteId].nombre + " · " + plab(p)) + (team ? "" : fin ? " · Resultado" : " · Lista de salida") + '</h3><p class="nwx-muted">' + esc(meta.join(" · ")) + '</p></div></div>' + body + "</section>";
  };
  const viewPrueba = () => {
    const p = PBY[S.ficha.slice(2)];
    if (!p) return '<div class="nwx-view">' + BACK + emptyHtml("No encontramos esa prueba", "") + "</div>";
    const s = STATE[p.estado] || ["prog", p.estado], r = p.resultado, e = S.hl && ENCBY[S.hl] && ENCBY[S.hl].pruebaId === p.id ? ENCBY[S.hl] : null;
    const pod = p.estado === "finalizada" ? podOf(p) : null;
    const head = '<header class="nwx-fxc nwx-hero"><div><div class="nwx-k">' + esc(DEPO[p.deporteId].nombre) + " · " + esc(lugarOf(p)) + "</div><h2>" + esc(p.disciplina) + " " +
      [SEXO_LABEL[p.sexo], p.categoria].filter(Boolean).map((t) => '<span class="nwx-tag">' + esc(t) + "</span>").join(" ") + '</h2></div><span class="nwx-state ' + s[0] + '">' + s[1] + "</span></header>";
    let enc = resultHtml(p, false, { part: "enc", exId: e && e.id }), tabs = resultHtml(p, false, { part: "tables" });
    if (!enc.includes("nwx-mc")) enc = ""; if (!tabs.includes("nwx-tbox")) tabs = "";
    if (e && r && r.tipo === "clasificacion" && (ENC[p.id] || []).filter((x) => x.participantes.length).length === 1) tabs = "";
    if (e) return '<div class="nwx-view nwx-fx">' + BACK + head + matchSection(e, p) + "</div>";
    return '<div class="nwx-view nwx-fx">' + BACK + head + (pod ? fxCard("Podio", podiumHtml(pod)) : "") + (/nwx-(tbox|mc|sr)/.test(resultHtml(p, false)) ? fxCard("Resultados", resultHtml(p, false)) : "") + sedesCard(p) + otrasCard(p) + "</div>";
  };
  const viewFicha = () => {
    if (S.ficha[0] === "p") return viewPrueba();
    const id = S.ficha.slice(2), a = ATH[id];
    if (!a) return '<div class="nwx-view">' + BACK + emptyHtml("No encontramos esa ficha", "") + "</div>";
    const ps = (pruebasDe[id] || []).map((pid) => PBY[pid]).filter(Boolean);
    const lugar = (p) => { const f = p.resultado && p.resultado.filas ? p.resultado.filas.filter((x) => x.refId === id)[0] : null; return f ? "Puesto " + f.puesto + (f.marca ? " · " + f.marca : "") : ""; };
    const dep = DPT[a.departamentoId] || {}, ins = a.institucionId && INS[a.institucionId] ? INS[a.institucionId].nombre : "";
    const deps = [...new Set(ps.map((p) => DEPO[p.deporteId].nombre))];
    const TROPHY = '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#f2c230" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>';
    return '<div class="nwx-view nwx-fx">' + BACK + '<div class="nwx-prof"><aside class="nwx-pside"><span class="nwx-photo">' + PERSON + '</span><h2>' + esc(a.nombre) + "</h2>" +
      '<div class="nwx-info"><div><small>Institución</small><b>' + (ins ? esc(ins) : "—") + '</b></div><div><small>Departamento</small><b>' + (dep.nombre ? flagHtml(id) + esc(dep.nombre) : "—") + '</b></div><div><small>Sexo</small><b>' + esc(SEXO_LABEL[a.sexo] || "—") + "</b></div></div>" +
      '<div class="nwx-info nwx-info1"><div><small>Deporte</small><b>' + (deps.length ? esc(deps.join(", ")) : "—") + "</b></div></div>" +
      '</aside>' +
      '<div class="nwx-pmain"><div class="nwx-stage"><span class="nwx-trophy">' + TROPHY + '</span><div><small>Fase</small><b>' + esc([...new Set(ps.map((p) => FASE_LABEL[faseOf(p).clave]).filter(Boolean))].join(" · ") || "Regional") + "</b></div></div>" +
      '<div class="nwx-sport"><small>Deporte</small><div class="nwx-pills">' + (deps.length ? deps.map((d) => '<span class="nwx-pill">' + esc(d) + "</span>").join("") : "—") + "</div></div><h3>Prueba</h3>" +
      (ps.length ? '<div class="nwx-plist">' + eHead() + ps.map((p) => rowHtml(p, lugar(p), id)).join("") + "</div>" : '<div class="nwx-none">Todavía no tiene pruebas programadas en esta fase.</div>') + "</div></div></div>";
  };
  const REGIMG = {"atletismo|amazonia orinoquia": "public/images/regionales/amazonia-orinoquia.jpg", "atletismo|centro sur pacifico": "public/images/galeria/N2.jpeg", "atletismo|centro oriente eje cafetero": "public/images/regionales/centro-oriente-eje-cafetero.jpg", "atletismo|caribe 1 caribe 2": "public/images/regionales/caribe-1-caribe-2.jpg", "conjuntos|pacifico": "public/images/galeria/N1.jpeg", "conjuntos|orinoquia": "public/images/galeria/N2.jpeg", "conjuntos|eje cafetero": "public/images/galeria/N3.jpeg", "conjuntos|centro sur": "public/images/galeria/N4.jpeg", "conjuntos|centro oriente": "public/images/galeria/N5.jpeg", "conjuntos|caribe 1": "public/images/galeria/N6.jpeg", "conjuntos|caribe 2": "public/images/galeria/N7.jpeg", "conjuntos|amazonia": "public/images/galeria/N8.jpeg"};
  const nkey = (s) => norm(s).replace(/[^a-z0-9]+/g, " ").trim();
  const viewEventos = () => {
    const grp = ENT.e === "conjunto" ? "conjuntos" : "atletismo", cards = REGIONALES.filter((r) => !ENT.e || regTipo(r.id) === ENT.e);
    const ARROW = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6" aria-hidden="true"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>';
    return '<div class="nwx-view nwx-fx nwx-evt">' +
      '<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full">' + cards.map((r) => { const src = REGIMG[grp + "|" + nkey(r.nombre)];
        return '<a href="' + hrefOf(LV.C(r.id)) + '" aria-label="Ver ' + esc(r.nombre) + '" class="flex flex-col rounded-2xl bg-white p-3 shadow-md transition-all hover:shadow-lg text-inherit no-underline"><div class="relative w-full rounded-lg overflow-hidden" style="flex:1 1 auto;min-height:11.25rem">' + (src ? '<img alt="" loading="lazy" class="object-cover" style="position:absolute;height:100%;width:100%;left:0;top:0" src="../' + esc(src) + '">' : "") + '</div><div class="flex items-end justify-between gap-2 mt-3"><div class="min-w-0"><span class="block text-sm text-JIN6-text-secondary" style="line-height:1.25">' + esc(r.sede ? "Sede " + r.sede : "") + '</span><h3 class="text-lg font-bold text-JIN6-text-primary line-clamp-2" style="margin:.125rem 0 0;line-height:1.25">' + esc(r.nombre.replace(" / ", " - ")) + '</h3></div><span class="shrink-0 nwx-mgo" style="justify-self:auto">' + ARROW.replace('class="h-6 w-6"', 'width="18" height="18"').replace('width="24" height="24"', "") + "</span></div></a>"; }).join("") + "</div></div>";
  };
  const TROPHY_W = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>';
  const dayDates = (p) => { const es = [...new Set((ENC[p.id] || []).map((e) => e.fecha).filter(Boolean))].sort(); if (es.length) return es; const out = []; if (p.fechaInicio) { const e = p.fechaFin || p.fechaInicio; for (let d = dateOf(p.fechaInicio); isoOf(d) <= e; d.setDate(d.getDate() + 1)) out.push(isoOf(d)); } return out; };
  const spanLbl2 = (o) => { const ds = [...o.ds].sort(); if (!ds.length) return FASE.regiones ? "Sin fecha" : "Fecha por confirmar"; const m = fmt(ds[ds.length - 1], { month: "short" }), dn = ds.map((d) => dateOf(d).getDate()), cont = ds.every((d, i) => !i || Math.round((dateOf(d) - dateOf(ds[i - 1])) / 864e5) === 1);
    return ds.length === 1 ? dn[0] + " de " + m : cont ? "Del " + dn[0] + " al " + dn[dn.length - 1] + " de " + m : dn.slice(0, -1).join(", ") + " y " + dn[dn.length - 1] + " de " + m; };
  // Glifos de la font naotech-icons (foundations 4.3.0); la burbuja de color la pone TINT.
  const GL = { bal: "mini-basketball", b3: "mini-basketball", fut: "soccer", fsa: "futsal", fds: "soccer", vol: "mini-volleyball", atl: "athletics" };
  const GI = (g) => '<i class="naotech-icon-' + g + '" aria-hidden="true"></i>';
  // b3 comparte glifo con Baloncesto; el badge x3 lo distingue (el nombre del deporte ya va en title/aria-label).
  const ICON = Object.fromEntries(Object.entries(GL).map(([k, g]) => [k, k === "b3" ? '<span class="nwx-ic3">' + GI(g) + '<b class="nwx-x3" aria-hidden="true">x3</b></span>' : GI(g)]));
  const TINT = { bal: "bg-calendar-orange", fut: "bg-calendar-orange", fds: "bg-calendar-orange", b3: "bg-calendar-pink", fsa: "bg-calendar-pink", vol: "bg-calendar-pink", atl: "bg-calendar-blue" };

  /* ── Filtros: carriles (cada nivel es un select y el siguiente aparece debajo) ── */
  const lanes = () => {
    const c = S.c;
    const regionalOpts = () => REGIONALES.filter((r) => !tipoCtx(c) || regTipo(r.id) === tipoCtx(c)).map((r) => ["regional", r.id, r.nombre + (tipoCtx(c) ? "" : " · " + (regTipo(r.id) === "individual" ? "Atletismo" : "Conjuntos"))]);
    const deptoOpts = () => REG[c.regional].departamentoIds.map((id) => ["depto", id, DPT[id].nombre]).sort((a, b) => a[2].localeCompare(b[2], "es"));
    const single = c.deporte && disciplinas(c.deporte).length <= 1;
    const deporteGroups = Object.keys(EVT_LABEL).map((t) => [EVT_LABEL[t], D.deportes.filter((d) => d.tipo === t).map((d) => ["deporte", d.id, d.nombre])]);
    /* En Deportistas el departamento no depende de la regional: salen los presentes entre los deportistas del alcance. */
    const deptsPres = () => { const b = Object.assign({}, c); delete b.depto; const ids = new Set(inscriptions(b).map((r) => r.a.departamentoId).filter(Boolean)); if (c.depto) ids.add(c.depto); return [...ids].filter((id) => DPT[id]).map((id) => ["depto", id, DPT[id].nombre]).sort((a, b2) => a[2].localeCompare(b2[2], "es")); };
    const geo = { title: "Evento", total: 2, n: (c.regional ? 1 : 0) + (c.depto ? 1 : 0), levels: [{ t: "regional", label: "Regional", opts: regionalOpts() }] };
    if (!LENS) geo.levels.push({ t: "depto", label: "Departamento", opts: deptsPres() });
    else if (c.regional) geo.levels.push({ t: "depto", label: "Departamento", opts: deptoOpts() });
    const spTot = single ? 1 : 2;
    const sp = { title: "Qué deporte", total: spTot, n: c.prueba || (single && c.deporte) ? spTot : c.deporte ? 1 : 0, levels: [{ t: "deporte", label: "Deporte", groups: deporteGroups }] };
    if (c.deporte && !single) sp.levels.push({ t: "prueba", label: "Prueba", opts: disciplinas(c.deporte).map((d) => ["prueba", d, d]) });
    const cats = LENS ? attrOpts(c).cats : [];
    const lvC = cats.length ? [{ t: "cat", label: "Edad", opts: cats.map((k) => ["cat", k, k]) }] : [];
    const sx = { title: LENS ? "Categoría" : "Sexo", total: lvC.length + 1, n: (c.sexo ? 1 : 0) + (c.cat ? 1 : 0),
      levels: [{ t: "sexo", label: "Sexo", seg: true, opts: [["sexo", "H", "Hombre"], ["sexo", "M", "Mujer"], ["sexo", "MX", "Mixto"]] }].concat(lvC) };
    if (LENS) {
      /* Prueba y Partido se navegan por la grilla y el camino, no por filtros (DC-155/176/177/181). */
      const pq = PBY[S.p], deps = D.deportes.filter((d) => (!ENT.e || d.tipo === ENT.e) && PRUEBAS.some((q) => q.deporteId === d.id && (!c.regional || q.regionalId === c.regional)));
      const spL = { title: "Qué deporte", total: 1, n: c.deporte ? 1 : 0, levels: [{ t: "deporte", label: "Deporte", opts: deps.map((d) => ["deporte", d.id, d.nombre]) }] };
      const sxL = pq ? { title: "Categoría", total: 1, n: 1, fixed: pq, levels: [] } : sx;
      /* En la final no hay dónde que elegir: el carril «Dónde» no se muestra y la franja queda en dos. */
      if (!FASE.regiones) { const fx = (title, v, note) => ({ title, total: 1, n: 1, fixedHtml: fixedVal(title, v, note), levels: [] });
        return [autoDep() ? fx("Qué deporte", depsCat()[0].nombre, "La define el evento") : deps.length ? spL : fx("Qué deporte", "Por publicar", ""), sxL]; } /* la sede única de la final no se muestra: no se puede cambiar */
      return [spL, geo, sxL];
    }
    return [sp, geo, sx];
  };
  const LOCK = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
  /* Sexo y Categoría son atributos de la prueba: desde ese nivel quedan fijos, no son filtros. */
  const fixedAttr = (p) => { const seg = (label, opts, on) => '<div class="nwx-seg is-fixed" role="group" aria-label="' + label + ' (la define la prueba)">' + opts.map((o) => '<button type="button" class="nwx-segb' + (o === on ? " on" : "") + '" aria-pressed="' + (o === on) + '" disabled>' + esc(o) + "</button>").join("") + "</div>";
    /* Sin sexo definido no se apagan los botones: un único botón encendido lo dice. */
    const sx = p.sexo ? seg("Sexo", ["Todos los sexos", "Hombre", "Mujer", "Mixto"], SEXO_LABEL[p.sexo]) : seg("Sexo", ["Sin sexo definido"], "Sin sexo definido");
    const ct = p.categoria ? fixedSel("Edad", p.categoria) : ""; /* sin categoría no se inventa un rótulo */
    return sx + ct + '<p class="nwx-fixnote">' + LOCK + (p.sexo ? "La define la prueba" : "Prueba sin sexo definido") + "</p>"; };
  const CATSALL = [...new Set(PRUEBAS.map((q) => q.categoria).filter(Boolean))].sort((a, b) => (CORDER.indexOf(a) + 1 || 99) - (CORDER.indexOf(b) + 1 || 99));
  /* Selector bloqueado con un único valor: no se puede cambiar. */
  const fixedSel = (label, v) => '<div class="nwx-selw"><select class="nwx-sel" disabled aria-label="' + esc(label + " (no se puede cambiar)") + '"><option>' + esc(v) + "</option></select></div>";
  const fixedVal = (label, v, note) => '<div class="nwx-seg is-fixed" role="group" aria-label="' + esc(note ? label + " (" + note.toLowerCase() + ")" : label) + '"><button type="button" class="nwx-segb on" aria-pressed="true" disabled>' + esc(v) + '</button></div>' + (note ? '<p class="nwx-fixnote">' + LOCK + esc(note) + "</p>" : "");
  const segHtml = (lv) => { const cur = S.c[lv.t], on = (x) => (x[1] ? cur === x[1] : !cur);
    return (lv.cap ? '<span class="nwx-cap">' + esc(lv.cap) + "</span>" : "") + '<div class="nwx-seg" role="group" aria-label="' + esc(lv.label) + '">' + [["", "", lv.t === "cat" ? "Todas las edades" : lv.t === "sexo" ? "Todos los sexos" : "Todos"]].concat(lv.opts).map((x) => '<button type="button" class="nwx-segb' + (on(x) ? " on" : "") + '" aria-pressed="' + on(x) + '" data-a="' + (!x[1] || cur === x[1] ? "rm" : "pick") + '" data-t="' + (x[0] || lv.t) + '" data-v="' + esc(x[1]) + '">' + esc(x[2]) + "</button>").join("") + "</div>"; };
  const fixedReg = (lv) => lv.t === "regional" && ENTRADA === "eventos"; /* viniendo de Eventos y fases la regional solo se cambia */
  const selHtml = (lv) => {
    if (lv.seg) return segHtml(lv);
    if (lv.t === "cat" && lv.opts.length === 1) return fixedSel(lv.label, lv.opts[0][2]);
    const cur = S.c[lv.t], opt = (x) => '<option value="' + x[0] + ":" + esc(x[1]) + '"' + (cur === x[1] ? " selected" : "") + ">" + esc(x[2]) + "</option>";
    const body = (lv.groups ? lv.groups.map((g) => '<optgroup label="' + esc(g[0]) + '">' + g[1].map(opt).join("") + "</optgroup>").join("") : lv.opts.map(opt).join(""));
    return '<div class="nwx-selw' + (cur && !fixedReg(lv) ? " has-x" : "") + '"><select class="nwx-sel" data-sel aria-label="' + esc(lv.label) + '">' + (cur ? (fixedReg(lv) ? "" : '<option value="rm:' + lv.t + '">Todos</option>') : '<option value="" selected disabled>Elegir ' + esc(lv.label) + "…</option>") + body + "</select>" +
      (cur && !fixedReg(lv) ? '<button type="button" class="nwx-selx" data-a="rm" data-t="' + lv.t + '" aria-label="Limpiar ' + esc(lv.label) + '"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button>' : "") + "</div>";
  };
  const prevKeys = {};
  const lanesHtml = () => lanes().map((l) => {
    const keys = l.levels.map((lv) => lv.t), before = prevKeys[l.title];
    const lvHtml = l.levels.map((lv) => '<div class="nwx-lv' + (before && !before.includes(lv.t) ? " nwx-grow" : "") + '"><div class="nwx-lvi">' + selHtml(lv) + "</div></div>").join("") +
      (before || []).filter((t) => !keys.includes(t)).map((t) => '<div class="nwx-lv nwx-shrink" aria-hidden="true"><div class="nwx-lvi"><select class="nwx-sel" disabled tabindex="-1"><option>' + esc(CHIPTL[t] || t) + "</option></select></div></div>").join("");
    prevKeys[l.title] = keys;
    const dots = Array.from({ length: l.total }, (_, i) => '<span class="nwx-dot' + (i < l.n ? " on" : "") + '"></span>').join("");
    return '<div class="nwx-lane"><div class="nwx-lh"><span class="nwx-lt"><b>' + l.title + '</b></span><span class="nwx-dots" aria-label="Paso ' + Math.min(l.n + 1, l.total) + " de " + l.total + '">' + dots + '</span></div><div class="nwx-stack">' + (l.fixed ? fixedAttr(l.fixed) : l.fixedHtml || lvHtml) + "</div></div>";
  }).join("");

  /* ── Breadcrumb ──────────────────────────────────────────── */
  let prevCrumbs = null, filtrosOpen = true, lastLvl = null;
  /* Camino del flujo único: cada nivel anterior es un enlace real a su nivel; el actual no es enlace. */
  const lensCrumbs = () => {
    const reg = FASE.regiones, r = reg && REG[S.c.regional], dep = DEPO[S.c.deporte], p = PBY[S.p], e = ENCBY[S.m];
    const toB = level() === entryLvl() ? "" : hrefOf(LV.B());
    /* Subir por el camino conserva los filtros de sexo y categoría vigentes. */
    const keep = (o) => Object.assign({ tipo: ENT.e }, o, S.c.sexo ? { sexo: S.c.sexo } : null, S.c.cat ? { cat: S.c.cat } : null, S.c.inst ? { inst: S.c.inst } : null);
    const it = [["Viendo", VISTA, ""]].concat(ENT.e ? [["Evento", EVT_LABEL[ENT.e] || "", toB]] : [], [["Fase", FASE_LABEL[faseNow()] + (reg ? "" : " · Bogotá"), toB]]);
    if (reg && S.todas) it.push(["Regional", "Todas", hrefOf(LV.T())]);
    if (r) it.push(["Regional", r.nombre, hrefOf({ c: keep({ regional: r.id }) })]);
    if (r && S.c.depto && DPT[S.c.depto]) it.push(["Departamento", DPT[S.c.depto].nombre, hrefOf({ c: keep({ regional: r.id, depto: S.c.depto }) })]);
    if (r && dep) it.push(["Deporte", dep.nombre, hrefOf({ c: keep({ regional: r.id, deporte: dep.id, depto: S.c.depto }), d: S.d })]);
    /* En la final con un solo deporte, ese paso es fijo: lo define el evento. */
    if (!reg && dep) it.push(["Deporte", dep.nombre, autoDep() ? "" : hrefOf({ c: keep({ deporte: dep.id }), d: S.d })]);
    /* Filtros activos: segmentos informativos (en la prueba ya viajan en su nombre). */
    if (!p && !S.ficha) { if (S.c.sexo) it.push(["Sexo", SEXO_LABEL[S.c.sexo], "", true]); if (S.c.cat) it.push(["Categoría", S.c.cat, "", true]); }
    if (!S.ficha && S.c.inst && INS[S.c.inst]) it.push(["Institución", INS[S.c.inst].nombre, "", true]);
    if (p) it.push(["Prueba", plab(p), hrefOf(LV.E(p.id))]);
    /* DC-182: en el nivel Partido el camino termina en Prueba; la banda ya dice dónde se está. */
    const hideLast = !!e && !S.ficha;
    if (e && S.ficha) it.push([isTeam(e) ? "Partido" : "Serie", elab(e), hrefOf(LV.F(e.id))]);
    if (S.ficha) it.push([S.ficha[0] === "a" ? "Ficha" : "Prueba", S.ficha[0] === "a" ? (ATH[S.ficha.slice(2)] || {}).nombre || "" : "", ""]);
    const last = it.map((x) => !x[3]).lastIndexOf(true);
    return it.map(([k, v, h, f], i) => { const cur = !hideLast && i === last;
      return '<span class="nwx-cg"><small class="nwx-cl">' + k + "</small>" + (f ? '<span class="nwx-c is-fixed" title="Filtro activo: ' + esc(v) + '">' + esc(v) + "</span>" : cur ? '<span class="nwx-c is-cur is-wide" aria-current="location">' + esc(v) + "</span>" : h ? '<a class="nwx-c is-link" href="' + h + '">' + esc(v) + "</a>" : '<span class="nwx-c is-fixed">' + esc(v) + "</span>") + "</span>"; }).join('<span class="nwx-sep" aria-hidden="true">›</span>');
  };
  const crumbsHtml = () => {
    if (LENS) return lensCrumbs();
    const seen = {}, nw = (k) => { seen[k] = 1; return prevCrumbs && !prevCrumbs[k] ? " nwx-new" : ""; };
    const keys = ORDER.filter((k) => S.c[k]), rest = keys.filter((k) => k !== "tipo");
    const alone = !keys.length && !S.ficha;
    const fx = (k, lbl, v) => '<span class="nwx-cg' + nw(k + v) + '"><small class="nwx-cl">' + lbl + '</small><span class="nwx-c is-fixed" title="' + esc(v) + ' · se cambia desde el menú ' + (ENTRADA === "deportistas" ? "Deportistas" : "Eventos y Fases") + '">' + esc(v) + "</span></span>";
    const out = ['<span class="nwx-cg' + nw("v") + '"><small class="nwx-cl">Viendo</small>' + (alone ? '<span class="nwx-c is-cur is-wide is-fixed">' + VISTA + "</span>" : '<button type="button" class="nwx-c is-link is-fixed" data-a="root" title="' + VISTA + '">' + VISTA + "</button>") + "</span>"];
    if (S.c.tipo && FASE.regiones) out.push(fx("tipo", "Evento", EVT_LABEL[S.c.tipo]));
    if (ENTRADA !== "deportistas") out.push(fx("fase", "Fase", FASE_LABEL[faseNow()]));
    rest.forEach((k, i) => {
      const cur = !S.ficha && i === rest.length - 1, v = valLabel(k, S.c[k]);
      out.push('<span class="nwx-cg' + nw(k + S.c[k]) + '"><small class="nwx-cl">' + CHIPTL[k] + '</small><span class="nwx-cv">' +
        (cur ? '<span class="nwx-c is-cur" title="' + esc(v) + '">' + esc(v) + "</span>" : '<button type="button" class="nwx-c is-link" data-a="crumb" data-t="' + k + '" title="' + esc(v) + '">' + esc(v) + "</button>") +
        "</span></span>");
    });
    if (S.ficha) { const a = ATH[S.ficha.slice(2)], pm = S.ficha[0] === "m" ? PBY[(ENCBY[S.ficha.slice(2)] || {}).pruebaId] : S.ficha[0] === "p" ? PBY[S.ficha.slice(2)] : null; out.push('<span class="nwx-cg' + nw("f" + S.ficha) + '"><small class="nwx-cl">' + (S.ficha[0] === "p" ? "Prueba" : pm ? "Partido" : "Ficha") + '</small><span class="nwx-c is-cur is-wide">' + esc(pm ? pm.disciplina : a ? a.nombre : "Ficha") + "</span></span>"); }
    prevCrumbs = seen;
    return out.join('<span class="nwx-sep">›</span>');
  };

  /* ── Buscador ────────────────────────────────────────────── */
  const INDEX = [];
  REGIONALES.forEach((r) => INDEX.push({ k: "regional", id: r.id, label: r.nombre, group: "Regionales", sub: r.grupo === "Atletismo" ? "Atletismo" : "Conjuntos" }));
  Object.keys(DPT).forEach((id) => { if (PRUEBAS.some((p) => deptsOf[p.id].has(id))) INDEX.push({ k: "depto", id, label: DPT[id].nombre, group: "Departamentos", sub: "" }); });
  D.deportes.forEach((d) => INDEX.push({ k: "deporte", id: d.id, label: d.nombre, group: "Deportes", sub: TIPO_LABEL[d.tipo] }));
  D.deportes.forEach((d) => disciplinas(d.id).forEach((dis) => { if (dis !== d.nombre) INDEX.push({ k: "prueba", id: d.id + "|" + dis, label: dis, group: "Pruebas", sub: d.nombre }); }));
  Object.keys(pruebasDe).forEach((id) => { if (ATH[id]) INDEX.push({ k: "atleta", id, label: ATH[id].nombre, group: "Deportistas", sub: (DPT[ATH[id].departamentoId] || {}).nombre || "" }); });
  /* Instituciones con datos publicados (equipos, nóminas o deportistas); la búsqueda no inventa ninguna. */
  const instIds = new Set(); PRUEBAS.forEach((p) => instsOf[p.id].forEach((i) => instIds.add(i)));
  instIds.forEach((id) => INDEX.push({ k: "inst", id, label: INS[id].nombre, group: "Instituciones", sub: (DPT[INS[id].departamentoId] || {}).nombre || "" }));
  const GROUPS = ["Regionales", "Departamentos", "Deportes", "Pruebas", "Instituciones", "Deportistas"];
  const pathCtx = (k, id) => {
    let c = S.c;
    if (k === "regional") c = setC(c, "regional", id);
    else if (k === "depto") c = setC(c, "depto", id);
    else if (k === "deporte") c = setC(c, "deporte", id);
    else if (k === "inst") c = setC(c, "inst", id);
    else if (k === "prueba") { const i = id.indexOf("|"); c = setC(setC(c, "deporte", id.slice(0, i)), "prueba", id.slice(i + 1)); }
    return c;
  };
  const fit = (k, id) => {
    if (k === "atleta") return (pruebasDe[id] || []).some((pid) => PBY[pid] && ok(PBY[pid], S.c));
    if (k === "inst" && !LENS) return inscriptions(Object.assign({}, S.c, { inst: id })).length > 0;
    const c = pathCtx(k, id);
    if (ENT.e && c.tipo !== ENT.e) return false;
    return JSON.stringify(c) !== JSON.stringify(S.c) && PRUEBAS.some((p) => ok(p, c));
  };
  const recents = () => { try { return JSON.parse(localStorage.getItem("nwx-recents") || "[]"); } catch (e) { return []; } };
  const saveRecent = (r) => { try { const l = recents().filter((x) => x.k + x.id !== r.k + r.id); l.unshift(r); localStorage.setItem("nwx-recents", JSON.stringify(l.slice(0, 5))); } catch (e) { /* sin storage */ } };
  const btnPick = (k, id, label) => '<button type="button" class="nwx-chip" data-a="spick" data-k="' + k + '" data-id="' + esc(id) + '">' + esc(label) + "</button>";
  const popHtml = () => {
    const q = $q.value.trim();
    let h = "";
    if (norm(q).length >= 3) {
      const all = INDEX.filter((x) => (!LENS || x.k === "inst") && (norm(x.label).includes(norm(q)) || norm(x.sub).includes(norm(q))));
      const res = all.filter((x) => fit(x.k, x.id));
      const rrow = (x) => '<button type="button" class="nwx-rrow" data-a="spick" data-k="' + x.k + '" data-id="' + esc(x.id) + '">' + "<span>" + esc(x.label) + "</span>" + (x.k === "inst" && depBadge(x.id) ? depBadge(x.id) : x.sub ? '<span class="nwx-dep" title="' + esc(x.sub) + '">' + esc(x.sub) + "</span>" : "") + "</button>";
      let body = "";
      GROUPS.forEach((g) => {
        const it = res.filter((x) => x.group === g);
        if (!it.length) return;
        body += "<h5>" + g + " (" + it.length + ")</h5>" + it.slice(0, 5).map(rrow).join("") + (it.length > 5 ? '<p class="nwx-muted" style="margin:.25rem .625rem">… y ' + (it.length - 5) + " más: afina la búsqueda</p>" : "");
      });
      /* Sin resultado exacto se ofrece algo: coincidencia por palabra suelta o, si no, lo que sí hay en esta vista. */
      let vacio = "";
      if (!body) {
        const pal = norm(q).split(/\s+/).filter((w) => w.length >= 3), buscable = (x) => (!LENS || x.k === "inst") && fit(x.k, x.id);
        const parc = INDEX.filter((x) => buscable(x) && pal.some((w) => norm(x.label).includes(w))).slice(0, 5);
        const disp = parc.length ? [] : INDEX.filter(buscable).slice(0, 5);
        vacio = '<p style="margin:.25rem .625rem">' + (all.length ? "Hay coincidencias para «" + esc(q) + "», pero ninguna dentro de tus filtros activos." : "No encontramos «" + esc(q) + "»" + (LENS ? " entre las instituciones de esta vista." : ".")) + "</p>" +
          (parc.length ? "<h5>Coincidencias parciales</h5>" + parc.map(rrow).join("") : disp.length ? "<h5>" + (LENS ? "Instituciones con datos en esta vista" : "Algunas opciones") + "</h5>" + disp.map(rrow).join("") : "") +
          '<button type="button" class="nwx-link" data-a="clearq" style="margin:.25rem .625rem">Limpiar búsqueda</button>';
      }
      h += '<div class="nwx-sec"><h4>Sugerencias de búsqueda</h4>' + (body || vacio) + "</div>";
    } else if (q) h += '<p class="nwx-muted" style="margin:.25rem .625rem">Escribe al menos 3 letras para buscar.</p>';
    /* La nota es el mensaje inicial del desplegable: con texto escrito ya no se muestra. */
    if (LENS) return q ? h : '<p class="nwx-muted" style="margin:.25rem .625rem">Escribe para buscar un deportista, deporte, prueba, departamento o institución.</p><p class="nwx-muted" style="margin:.25rem .625rem">Solo instituciones con datos publicados.</p>';
    const rec = recents().filter((x) => fit(x.k, x.id));
    const sug = [["deporte", "atl", "Atletismo"], ["deporte", "fut", "Fútbol"], ["deporte", "vol", "Voleibol"]].filter((x) => fit(x[0], x[1]));
    if (rec.length) h += '<div class="nwx-sec"><h4>Recientes</h4><div class="nwx-wrap">' + rec.map((x) => btnPick(x.k, x.id, x.label)).join("") + "</div></div>";
    if (sug.length) h += '<div class="nwx-sec"><h4>Sugeridos</h4><div class="nwx-wrap">' + sug.map((x) => btnPick(x[0], x[1], x[2])).join("") + "</div></div>";
    return h;
  };

  /* ── Montaje ─────────────────────────────────────────────── */
  root.innerHTML = '<div id="nwx-live" class="nwx-sr" role="status" aria-live="polite"></div>' + '<div id="nwx-top" class="nwx-top"><nav id="nwx-crumbs" class="nwx-crumbs" aria-label="Estás consultando"></nav></div><div id="nwx-dock" class="nwx-dock"><div id="nwx-estas" class="nwx-estas"></div></div><div id="nwx-filtros" class="nwx-card"><div class="nwx-lanes" id="nwx-lanes"></div></div>' +
    '<div class="nwx-search" id="nwx-search"><input id="nwx-q" class="nwx-input" type="search" autocomplete="off" aria-label="Buscar" placeholder="Buscar deportista, institución, deporte, prueba o departamento"><div class="nwx-pop" id="nwx-pop" hidden></div></div>' +
    '<div id="nwx-view"></div>';
  const $q = document.getElementById("nwx-q"), $pop = document.getElementById("nwx-pop");
  const setPop = (v) => { S.pop = v; const h = v ? popHtml() : ""; $pop.innerHTML = h; $pop.hidden = !v || !h; };

  /* «Estás viendo»: título del nodo actual. */
  const viendo = () => {
    const t = S.c.tipo;
    if (S.ficha) return { que: S.ficha[0] === "p" ? "Detalle de la prueba" : "Ficha del deportista" };
    if (ENTRADA === "deportistas") return { que: "Deportistas inscritos" };
    const lvl = level(), r = REG[S.c.regional], dep = DEPO[S.c.deporte], p = PBY[S.p], e = ENCBY[S.m];
    /* La frase de apoyo vive en la banda porque este nivel no tiene botón de colapsar (DC-167). */
    if (lvl === "B") return { que: t === "conjunto" ? "Regionales de conjunto" : "Regionales de atletismo", apoyo: RES ? "Sigue el minuto a minuto de los eventos de esta fase" : "Sigue el minuto a minuto de los eventos de esta fase" };
    if (lvl === "T") return { que: "Todas las regionales de " + (EVT_LABEL[t] || "").toLowerCase() };
    if (lvl === "C") return { que: FASE.regiones ? "Deportes de la Regional " + r.nombre : "Deportes de la Fase final nacional" };
    if (lvl === "D") return { que: "Pruebas de " + dep.nombre + (FASE.regiones ? "" : " · Final nacional") };
    if (lvl === "E") return { que: (encsOf(p).some(isTeam) ? "Partidos de " : "Series de ") + dep.nombre + " · " + plab(p) };
    return { que: elab(e) + " · " + [rondaOf(p, e), e.grupo ? "Grupo " + e.grupo : ""].filter(Boolean).join(" · ") };
  };
  const bandaHtml = (hasF) => {
    const v = viendo();
    return '<span class="nwx-eye" aria-hidden="true"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg></span><span class="nwx-etx"><span class="nwx-elbl">Estás viendo:</span><b class="nwx-eque" title="' + esc(v.que) + '">' + esc(v.que) + "</b></span>" + (!hasF && v.apoyo ? '<p class="nwx-eapoyo" title="' + esc(v.apoyo) + '">' + esc(v.apoyo) + "</p>" : "") +
      '<span class="nwx-eact">' +
      (hasF ? '<button type="button" class="nwx-tog" data-a="tog" aria-expanded="' + filtrosOpen + '" aria-controls="nwx-filtros"><span class="nwx-tl">Ubicaciones y filtros</span><span class="nwx-tc"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 15 6-6 6 6"/></svg></span></button>' : "") + "</span>";
  };
  const LINK = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/></svg>';
  /* Copia location.href; sin permiso del portapapeles cae a execCommand. El aviso va en un aria-live fijo. */
  let copyT = 0;
  const copyLink = async (btn) => { let ok = false;
    try { await navigator.clipboard.writeText(location.href); ok = true; } catch (x) { const t = document.createElement("textarea"); t.value = location.href; t.setAttribute("readonly", ""); t.style.cssText = "position:fixed;opacity:0;top:0"; document.body.appendChild(t); t.select(); try { ok = document.execCommand("copy"); } catch (y) { /* sin permiso */ } t.remove(); }
    const live = document.getElementById("nwx-live"), lbl = btn.querySelector(".nwx-cpl"), msg = ok ? "Enlace copiado" : "No se pudo copiar el enlace";
    if (live) live.textContent = msg; if (lbl) lbl.textContent = msg; btn.classList.toggle("is-ok", ok); clearTimeout(copyT);
    copyT = setTimeout(() => { if (live) live.textContent = ""; if (lbl && btn.isConnected) lbl.textContent = "Copiar enlace"; btn.classList.remove("is-ok"); }, 2200); };

  function render() {
    const crumbsEl = document.getElementById("nwx-crumbs");
    const fichaOn = !!S.ficha, lvl = LENS ? level() : "";
    const hasF = LENS ? !fichaOn && "CDEF".includes(lvl) : !fichaOn;
    /* Con deporte y departamento ya elegidos la franja arranca colapsada; lo manual vale hasta cambiar de nivel (DC-175). */
    if (lvl === "D" && lastLvl && "BTC".includes(lastLvl)) selD = ""; /* entrar desde arriba abre la primera prueba; Atrás conserva la elegida */
    if (LENS && lvl !== lastLvl) { lastLvl = lvl; legOpen = false; filtrosOpen = !("EF".includes(lvl) || ("D".includes(lvl) && S.c.depto)); }
    crumbsEl.innerHTML = crumbsHtml() + '<span class="nwx-ccopy"><button type="button" class="nwx-copy" data-a="copy" aria-label="Copiar enlace a esta vista">' + LINK + '<span class="nwx-cpl">Copiar enlace</span></button></span>';
    crumbsEl.scrollLeft = crumbsEl.scrollWidth; /* en móvil el camino se desplaza: queda a la vista el último eslabón */
    document.getElementById("nwx-estas").innerHTML = bandaHtml(hasF);
    const $f = document.getElementById("nwx-filtros"); clearTimeout(fT); $f.classList.remove("is-collapsed"); $f.style.height = "";
    $f.hidden = !hasF || !filtrosOpen; $f.inert = $f.hidden;
    document.getElementById("nwx-search").hidden = fichaOn || (LENS && !"CDE".includes(lvl));
    $q.placeholder = LENS ? "Buscar institución" : "Buscar deportista, institución, deporte, prueba o departamento"; $q.setAttribute("aria-label", LENS ? "Buscar institución" : "Buscar");
    document.getElementById("nwx-lanes").innerHTML = hasF ? lanesHtml() : "";
    const V = { B: viewEventos, T: viewT, C: viewC, D: viewD, E: viewE, F: viewF };
    if (LENS && !RES && !fichaOn && lvl === "F") { toResultados(); return; }
    paintView(fichaOn ? viewFicha() : LENS ? ("CDE".includes(lvl) ? chipsHtml() : "") + V[lvl]() : viewDeportistas());
    if ($f.hidden) floatOff();
    syncTog();
    if (S.pop) setPop(true);
  }

  /* ── Carga entre niveles: transición visual (los datos son estáticos); LOADER_MS = 0 la apaga ── */
  const LOADER_MS = 650;
  let loadT = 0, prevKey = null, prevNav = null, prevLens = "";
  try { prevLens = sessionStorage.getItem("nwx-lente") || ""; if (sessionStorage.getItem("nwx-fusion")) { sessionStorage.removeItem("nwx-fusion"); prevLens = ENTRADA; } sessionStorage.setItem("nwx-lente", ENTRADA); } catch (x) { /* sin storage */ }
  /* Cualquier cambio de estado que repinta el contenido (nivel, filtros, chips) es una carga; colapsar no toca el estado. */
  const levelKey = () => ENTRADA + "|" + hashOf(Object.assign({}, S, { pg: 1 })); /* cambiar de página no es cambiar de nivel: sin carga */
  let loadMsg = "", pgScroll = false;
  const loadingText = () => {
    if (loadMsg) return loadMsg;
    if (S.ficha) return "Cargando la ficha…";
    if (!LENS) return "Cargando los deportistas…";
    const lvl = level(), r = REG[S.c.regional], dep = DEPO[S.c.deporte], p = PBY[S.p], e = ENCBY[S.m];
    return { B: "Cargando las regionales…", T: "Cargando el panorama de todas las regionales…", C: FASE.regiones ? "Cargando los deportes de la Regional " + (r ? r.nombre : "") + "…" : "Cargando los deportes de la final…", D: "Cargando las pruebas de " + (dep ? dep.nombre : "") + "…",
      E: "Cargando los partidos de " + (p ? plab(p) : "") + "…", F: "Cargando " + (e ? elab(e) : "el partido") + "…" }[lvl];
  };
  const loaderHtml = () => {
    const deps = D.deportes.filter((d) => !ENT.e || d.tipo === ENT.e).slice(0, 4);
    const icons = deps.map((d, i) => '<span class="nwx-lic ' + (TINT[d.id] || "bg-calendar-orange") + '" style="animation-delay:' + i * 120 + 'ms;color:#e4403a">' + (ICON[d.id] || ICON.fds) + "</span>").join("");
    return '<div class="nwx-load" role="status" aria-live="polite"><div class="nwx-lgrp"><span class="nwx-licons" aria-hidden="true">' + icons + '</span><b>' + esc(loadingText()) + '</b><div class="nwx-lbar" aria-hidden="true"></div></div></div>';
  };
  /* La primera visita y el colapso de filtros pintan al instante; el resto pasa por la carga. */
  const paintView = (html) => {
    const $v = document.getElementById("nwx-view"), key = levelKey();
    const first = prevKey === null, anim = LOADER_MS > 0 && (first ? !!prevLens && prevLens !== ENTRADA : key !== prevKey);
    prevKey = key; clearTimeout(loadT);
    /* Al cambiar de nivel (no de filtro) la página destino siempre abre arriba. */
    const nav = ENTRADA + "|" + (LENS ? level() : "") + "|" + [S.c.regional, S.c.deporte, S.p, S.m, S.ficha].join("|");
    if (prevNav !== null && nav !== prevNav) window.scrollTo({ top: 0, behavior: "instant" });
    prevNav = nav;
    const done = () => { loadMsg = ""; $v.innerHTML = html; $v.removeAttribute("aria-busy"); $v.classList.remove("nwx-enter"); if (anim) { void $v.offsetWidth; $v.classList.add("nwx-enter"); } stickyBg(); requestAnimationFrame(() => { brAll(); document.querySelectorAll(".nwx-br").forEach((b) => b.classList.add("is-anim")); });
      if (pgScroll) { pgScroll = false; const t = $v.getBoundingClientRect().top + scrollY - (parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nwx-top")) || 0) - 150; window.scrollTo({ top: Math.max(0, t), behavior: "instant" }); } };
    if (!anim) return done();
    /* El loader ocupa el alto visible que queda bajo la franja y centra el grupo; nunca menos de 320 px. */
    $v.setAttribute("aria-busy", "true"); $v.innerHTML = loaderHtml(); loadMsg = "";
    const L = $v.firstChild; if (L) L.style.minHeight = Math.max(320, Math.round(innerHeight - Math.max(0, $v.getBoundingClientRect().top) - 24)) + "px";
    loadT = setTimeout(done, LOADER_MS);
  };

  /* El Partido es el primer nivel con marcador, y solo existe en Resultados: se cambia de lente con replace para que Atrás vuelva a la Prueba. */
  const toResultados = (dest) => {
    const $v = document.getElementById("nwx-view"), $p = document.getElementById("explorador").parentElement;
    clearTimeout(loadT);
    /* Todo el bloque (filtros, vista y pie) se desvanece junto; el cambio de layout ocurre ya invisible y luego entra el loader. */
    $p.style.transition = "opacity .3s ease"; $p.style.opacity = "0";
    loadT = setTimeout(() => {
      loadMsg = "Cambiando a Resultados…"; document.documentElement.classList.add("nwx-cambio"); window.scrollTo({ top: 0, behavior: "instant" });
      $v.setAttribute("aria-busy", "true"); $v.innerHTML = loaderHtml(); loadMsg = "";
      const L = $v.firstChild; if (L) L.style.minHeight = Math.max(320, Math.round(innerHeight - Math.max(0, $v.getBoundingClientRect().top) - 24)) + "px";
      requestAnimationFrame(() => { $p.style.opacity = "1"; });
      const qs = new URLSearchParams(location.search); qs.delete("entrada");
      const url = dest || urlOf("resultados") + (qs.toString() ? "?" + qs.toString() : "") + location.hash;
      try { sessionStorage.setItem("nwx-fusion", "1"); } catch (x) { /* sin storage */ }
      loadT = setTimeout(() => location.replace(url), 2000);
    }, 300);
  };
  /* Atrás puede restaurar la página desde caché con la pantalla de cambio aún puesta. */
  addEventListener("pageshow", () => { document.documentElement.classList.remove("nwx-cambio"); const r = document.getElementById("explorador"); if (r && r.parentElement) { r.parentElement.style.opacity = ""; r.parentElement.style.transition = ""; } });

  /* Cajón de filtros: anima alto y margen a la vez para que el contenido de abajo solo se mueva lo que mide el cajón. */
  const F_MS = 280;
  let fT = 0;
  /* DC-198: la franja solo flota si el usuario la abre con la banda pegada; al despegarse vuelve al flujo. */
  const fl = () => document.getElementById("nwx-filtros");
  const floatPos = () => { const f = fl(), r = document.getElementById("nwx-dock").getBoundingClientRect(); f.style.setProperty("--nwx-fl", r.left + "px"); f.style.setProperty("--nwx-fw", r.width + "px"); };
  /* Única fuente del chevron: el panel «se ve» si está abierto y flota, o abierto en el flujo con la banda sin pegar. */
  const syncTog = () => { const b = document.querySelector(".nwx-tog"); if (b) b.setAttribute("aria-expanded", String(filtrosOpen && (fl().classList.contains("is-float") || !document.getElementById("nwx-dock").classList.contains("is-stuck")))); };
  const floatOn = (hole) => { const f = fl(); if (hole && !document.getElementById("nwx-fph")) { const h = document.createElement("div"); h.id = "nwx-fph"; h.style.height = f.offsetHeight + "px"; f.before(h); } floatPos(); f.classList.add("is-float"); syncTog(); };
  const floatOff = () => { const f = fl(); f.classList.remove("is-float"); const h = document.getElementById("nwx-fph"); if (h) h.remove(); syncTog(); };
  const toggleFiltros = (open) => {
    const f = document.getElementById("nwx-filtros"), top = document.getElementById("nwx-dock");
    filtrosOpen = open; clearTimeout(fT);
    if (open && top.classList.contains("is-stuck")) floatOn(false);
    syncTog();
    const still = (fn) => { top.style.transition = "none"; f.style.transition = "none"; fn(); void f.offsetHeight; top.style.transition = ""; f.style.transition = ""; };
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { f.hidden = !open; f.inert = !open; if (!open) floatOff(); return; }
    if (!open) {
      f.style.height = f.offsetHeight + "px"; void f.offsetHeight;
      f.classList.add("is-collapsed"); f.style.height = "0px";
      fT = setTimeout(() => still(() => { f.hidden = true; f.inert = true; f.classList.remove("is-collapsed"); f.style.height = ""; floatOff(); }), F_MS);
    } else {
      f.hidden = false; f.inert = false; f.style.height = ""; const H = f.offsetHeight;
      still(() => { f.classList.add("is-collapsed"); f.style.height = "0px"; });
      f.classList.remove("is-collapsed"); f.style.height = H + "px";
      fT = setTimeout(() => { f.style.height = ""; }, F_MS);
    }
  };

  root.addEventListener("keydown", (e) => { const r = e.target.closest && e.target.closest(".nwx-rowlink"); if (r && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); r.click(); } });
  root.addEventListener("click", (e) => {
    const rv = e.target.closest("a.nwx-bver");
    if (rv && !e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) { e.preventDefault(); toResultados(rv.getAttribute("href")); return; } /* mismo loader que al abrir un partido */
    const b = e.target.closest("[data-a]"); if (!b) return;
    const a = b.dataset.a, d = b.dataset;
    if (a === "brdir") { setBrDir(d.v); return; }
    if (a === "pg") { S.pg = Math.max(1, +d.g || 1); pgScroll = true; nav(); return; }
    if (a === "pick") S.c = setC(S.c, d.t, d.v);
    else if (a === "rm") rmSel(d.t);
    else if (a === "clear") { S.c = ENT.e ? { tipo: ENT.e } : {}; S.ficha = ""; S.d = ""; S.dAll = false; }
    else if (a === "root") { S.c = ENT.e ? { tipo: ENT.e } : {}; S.ficha = ""; S.d = ""; S.dAll = false; }
    else if (a === "copy") { copyLink(b); return; }
    else if (a === "day") { S.d = d.d === S.d ? "" : d.d; S.dAll = !S.d;
      /* Si ese día no tiene pruebas del sexo activo, se vuelve a «Todos» en vez de dejar la jornada vacía. */
      if (S.d && S.c.sexo && !S.p && !dayPool(Object.assign({}, S.c, { sexo: "" })).some((q) => q.sexo === S.c.sexo && (ENC[q.id] || []).some((e) => e.fecha === S.d))) delete S.c.sexo; }
    else if (a === "crumb") { const i = ORDER.indexOf(d.t); ORDER.slice(i + 1).forEach((k) => { S.c = rmC(S.c, k); }); S.ficha = ""; }
    else if (a === "tog") {
      const f = fl(), st = document.getElementById("nwx-dock").classList.contains("is-stuck");
      /* Abierta en el flujo pero ya fuera de vista: el botón la trae flotando en vez de cerrarla a ciegas. */
      if (st && filtrosOpen && !f.hidden && !f.classList.contains("is-float")) { floatOn(true); return; }
      toggleFiltros(!filtrosOpen); return;
    }
    else if (a === "ficha") S.ficha = "a:" + d.id;
    else if (a === "fm") { const x = ENCBY[d.id], q = x && PBY[x.pruebaId]; if (!q) return; if (LENS) { S.c = { tipo: ENT.e, regional: q.regionalId, deporte: q.deporteId }; S.p = q.id; S.m = x.id; S.ficha = ""; } else { S.hl = d.id; S.ficha = "p:" + q.id; } }
    else if (a === "fp") { const q = PBY[d.id]; if (!q) return; const t = DEPO[q.deporteId].tipo;
      /* Dentro de una lente la prueba se abre sin salir de ella, así el menú activo no cambia. */
      if (LENS && t === ENT.e && q.faseId === FASE.id) { S.c = { tipo: t, regional: q.regionalId, deporte: q.deporteId }; S.p = q.id; S.m = ""; S.ficha = ""; }
      else { location.href = urlOf(ENTRADA === "deportistas" ? "resultados" : ENTRADA) + "?e=" + t + "&f=" + (faseOf(q).clave || "REG") + (DEMO ? "&demo=nac" : "") + hashOf({ c: { tipo: t, regional: q.regionalId, deporte: q.deporteId }, p: q.id }); return; } }
    else if (a === "back") { S.ficha = ""; S.hl = ""; }
    else if (a === "dsel") { selD = d.id; try { sessionStorage.setItem(SELD, selD); } catch (x) { /* sin storage */ }
      const r = dRows().filter((x) => x.p.id === selD)[0], pn = document.getElementById("nwx-dmp"); if (!r || !pn) return;
      root.querySelectorAll(".nwx-dmi").forEach((x) => { const on = x.dataset.id === selD; x.classList.toggle("is-on", on); x.setAttribute("aria-pressed", on); });
      pn.innerHTML = dPanel(r); pn.classList.remove("nwx-fade"); void pn.offsetWidth; pn.classList.add("nwx-fade"); return; }
    else if (a === "clearq") { $q.value = ""; setPop(true); return; }
    else if (a === "spick") {
      const it = INDEX.filter((x) => x.k === d.k && x.id === d.id)[0];
      if (it) saveRecent({ k: it.k, id: it.id, label: it.label });
      $q.value = ""; setPop(false); loadMsg = "Buscando «" + (it ? it.label : "") + "»…";
      if (d.k === "atleta") S.ficha = "a:" + d.id; else { S.c = pathCtx(d.k, d.id); S.ficha = ""; }
    } else return;
    S.pg = 1; nav();
  });
  root.addEventListener("mouseover", (e) => { const c = e.target.closest && e.target.closest(".nwx-brc"); if (c) brFocus(c.dataset.id); });
  root.addEventListener("mouseout", (e) => { if (e.target.closest && e.target.closest(".nwx-brc")) brFocus(""); });
  root.addEventListener("focusin", (e) => { const c = e.target.closest && e.target.closest(".nwx-brc"); if (c) brFocus(c.dataset.id); });
  root.addEventListener("focusout", (e) => { if (e.target.closest && e.target.closest(".nwx-brc")) brFocus(""); });
  window.addEventListener("resize", () => { clearTimeout(window.__brT); window.__brT = setTimeout(brAll, 120); });
  root.addEventListener("animationend", (e) => { if (e.target.classList && e.target.classList.contains("nwx-shrink")) e.target.remove(); });
  root.addEventListener("change", (e) => {
    const s = e.target.closest("select[data-sel]"); if (!s || !s.value) return;
    const i = s.value.indexOf(":"), t = s.value.slice(0, i), v = s.value.slice(i + 1);
    if (t === "rm") rmSel(v);
    else {
      if (t === "deporte" && FASE.regiones && DEPO[v] && ENT.e && DEPO[v].tipo !== ENT.e) { ENT.e = DEPO[v].tipo; try { sessionStorage.setItem("nwx-entrada", ENT.e + "|" + ENT.f); } catch (x) { /* sin storage */ } const prevReg = S.c.regional && REG[S.c.regional]; S.c = { tipo: ENT.e };
        if (prevReg) { const mine = new Set(prevReg.departamentoIds), best = REGIONALES.filter((r) => regTipo(r.id) === ENT.e).map((r) => [r, r.departamentoIds.filter((d) => mine.has(d)).length]).sort((x, y) => y[1] - x[1])[0]; if (best) S.c.regional = best[0].id; } }
      S.c = setC(S.c, t, v);
    }
    S.pg = 1; nav();
  });
  const gridFilter = () => { const q = norm((root.querySelector(".nwx-gq") || {}).value || ""), d = (root.querySelector(".nwx-gs") || {}).value || ""; root.querySelectorAll(".nwx-gr").forEach((tr) => { tr.hidden = (q && !tr.dataset.q.includes(q)) || (d && tr.dataset.dep !== d); }); };
  root.addEventListener("input", (e) => { if (e.target.closest(".nwx-gq")) gridFilter(); });
  root.addEventListener("change", (e) => { if (e.target.closest(".nwx-gs")) gridFilter(); });
  $q.addEventListener("input", () => setPop(true));
  $q.addEventListener("focus", () => setPop(true));
  $q.addEventListener("click", () => setPop(true));
  $q.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { setPop(false); $q.blur(); }
  });
  document.addEventListener("click", (e) => { if (S.pop && !e.target.closest("#nwx-search")) setPop(false); });
  window.addEventListener("hashchange", () => { parse(); render(); });

  /* El menú activo lo fija la lente de entrada y no cambia al bajar de nivel. */
  const link = [...document.querySelectorAll("header button[aria-haspopup=menu]")].find((x) => x.textContent.trim() === VISTA);
  if (link) link.setAttribute("aria-current", link.tagName === "BUTTON" ? "true" : "page");
  /* Patrón único de encabezado fijo que crece a lo ancho: el fondo se ensancha hasta el borde de pantalla con la misma animación
     que la banda #nwx-estas y se pega a ella con 1 px de traslape. Lo usan la grilla de días, el encabezado de Resultados,
     la tabla de Eventos y la de Deportistas; el fondo toma el color del propio encabezado. */
  const STICKY = [[".nwx-gh", ".nwx-rgrid2", ".nwx-gcard"], [".nwx-dmh > span", ".nwx-dm", ".nwx-dm"], [".nwx-ehead", null, null], [".nwx-thead", ".nwx-tgrid", ".nwx-card"]];
  let sfull = null;
  const stickyBg = () => { const dk = document.getElementById("nwx-dock"), dh = dk ? Math.max(0, dk.offsetHeight - 1) : 0; document.documentElement.style.setProperty("--nwx-dock", dh + "px");
    if (!sfull) { sfull = document.createElement("div"); sfull.className = "nwx-fullbg"; sfull.setAttribute("aria-hidden", "true"); document.body.appendChild(sfull); }
    let c = null, host = null, card = null;
    for (const [s, h, cd] of STICKY) { c = document.querySelector(s); if (c) { host = h ? c.closest(h) : c.parentElement; card = cd ? c.closest(cd) : c.parentElement; break; } }
    document.querySelectorAll(".is-sf").forEach((x) => { if (x !== c) x.classList.remove("is-sf"); });
    if (!c || !host) { sfull.style.opacity = "0"; return; }
    const top = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nwx-top")) || 0, r = c.getBoundingClientRect(), g = host.getBoundingClientRect(), cr = (card || host).getBoundingClientRect();
    const stuck = r.top <= top + dh + 0.5 && g.bottom > top + dh + r.height;
    sfull.style.display = "block"; sfull.style.background = getComputedStyle(c).backgroundColor; sfull.style.top = top + dh + "px"; sfull.style.height = r.height + "px";
    sfull.style.left = (stuck ? 0 : Math.round(cr.left)) + "px"; sfull.style.right = (stuck ? 0 : Math.round(innerWidth - cr.right)) + "px"; sfull.style.opacity = stuck ? "1" : "0"; c.classList.toggle("is-sf", stuck); };
  window.addEventListener("scroll", stickyBg, { passive: true }); window.addEventListener("resize", stickyBg);
  const setTop = () => { const hd = document.querySelector("header"); document.documentElement.style.setProperty("--nwx-top", (hd ? hd.getBoundingClientRect().height : 0) + "px"); };
  setTop(); window.addEventListener("resize", setTop);
  /* El header del sitio es sticky: la banda se pega justo debajo (--nwx-top) y el IntersectionObserver evita escuchar el scroll. */
  const dock = document.getElementById("nwx-dock");
  let io = null;
  const watchDock = () => { if (!("IntersectionObserver" in window)) return; if (io) io.disconnect();
    const off = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nwx-top")) || 0;
    io = new IntersectionObserver(([en]) => { const st = !en.isIntersecting && en.boundingClientRect.bottom <= off + 1; dock.classList.toggle("is-stuck", st); if (!st) floatOff(); else syncTog(); }, { rootMargin: -Math.round(off) + "px 0px 0px 0px" }); 
    io.observe(document.getElementById("nwx-top")); };
  watchDock(); window.addEventListener("resize", () => { watchDock(); if (fl().classList.contains("is-float")) floatPos(); });
  parse(); render();
})(document.currentScript);
