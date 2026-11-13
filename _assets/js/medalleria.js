/* Medallería 2026: podio de delegaciones y resumen total desplegable. Cuenta desde las mismas filas con medalla del explorador. */
(function boot(me) {
  "use strict";
  const D = window.EXPLORADOR_DATOS, root = document.getElementById("medalleria");
  if (!D || !root) return;
  const base = ((me && me.src) || "").replace(/medalleria\.js(\?.*)?$/, "");
  if (!customElements.get("nao-award") && !document.querySelector("script[data-nao-awards]")) { const m = document.createElement("script"); m.type = "module"; m.dataset.naoAwards = ""; m.src = base + "awards.js"; document.head.appendChild(m); }
  if (!window.EXPLORADOR_DEMO) { const s = document.createElement("script"); s.src = base + "explorador-datos-demo.js"; s.onload = () => boot(me); document.head.appendChild(s); return; }
  if (!D.demoFusion) { D.demoFusion = true; ["deportes", "pruebas", "encuentros", "participaciones", "deportistas", "instituciones", "sedes"].forEach((k) => { D[k] = D[k].concat(window.EXPLORADOR_DEMO[k] || []); }); }

  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const norm = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const by = (a) => Object.fromEntries(a.map((x) => [x.id, x]));
  const DEPO = by(D.deportes), DPT = by(D.departamentos), ATH = by(D.deportistas), INS = by(D.instituciones), FASE = by(D.fases);
  const METALES = ["gold", "silver", "bronze"], NOMBRE = ["Oro", "Plata", "Bronce"], MEDAL_IX = { oro: 0, plata: 1, bronce: 2 };
  const SEXO = { H: "Hombre", M: "Mujer", MX: "Mixto" };
  const slugOf = (id) => { const FIX = { sap: "archipielago-de-san-andres-providencia-y-santa-catalina", bog: "bogota-d-c-dpt", lgu: "guajira", nsa: "norte--santander" }; return FIX[id] || norm((DPT[id] || {}).nombre || "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); };
  const flag = (id, w) => '<img class="nwx-flag" src="../public/department_flags/' + slugOf(id) + '.png" alt="" width="' + w + '" height="' + Math.round(w * 0.68) + '">';
  const award = (i, size, plain) => '<nao-award kind="medal" metal="' + METALES[i] + '" icon="' + (plain ? "none" : i + 1) + '" edition="colombia" size="' + size + '"' + (plain ? ' ribbon="false" shadow="false" animated="false"' : "") + "></nao-award>";
  const sum = (m) => m[0] + m[1] + m[2];
  /* Medallita + número; el metal en cero no se pinta. */
  const counter = (m, size) => '<span class="nwm-mc" role="text" aria-label="' + m.map((v, i) => v ? v + " " + NOMBRE[i].toLowerCase() : "").filter(Boolean).join(", ") + '">' + m.map((v, i) => v ? '<span class="nwm-mi">' + award(i, size, true) + "<b>" + v + "</b></span>" : "").join("") + "</span>";
  const sv = (d) => '<svg class="nwm-si" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + "</svg>";
  const PERSONA = '<circle cx="14" cy="5" r="2"/><path d="M5 21l4-7 3 2 2-5-4-2-3 3M14 9l3 4 4 1M12 16l3 5"/>';
  const ICO = { atl: PERSONA, fsa: '<circle cx="12" cy="12" r="9"/><path d="M12 8l3.5 2.5-1.3 4h-4.4l-1.3-4zM12 3v5M20.5 9.5l-5-1M17.5 19.5l-3.3-5M6.5 19.5l3.3-5M3.5 9.5l5-1"/>', bal: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3v18M5.6 5.6c3 3 3 9.8 0 12.8M18.4 5.6c-3 3-3 9.8 0 12.8"/>', tdm: '<circle cx="9" cy="9" r="6"/><path d="M13.3 13.3L20 20M18 5.5a1.5 1.5 0 1 0 .01 0"/>', aje: '<circle cx="12" cy="6" r="2.5"/><path d="M9.5 21h5M8.5 17.5h7M10 17.5c0-4 .5-5 2-7 1.5 2 2 3 2 7M9 10.5h6"/>', box: '<path d="M7 11V7a3 3 0 0 1 3-3h4a4 4 0 0 1 4 4v5a5 5 0 0 1-5 5H9a2 2 0 0 1-2-2zM8 20h9"/>' };
  const icon = (sp) => sv(ICO[sp] || '<circle cx="9" cy="5" r="2"/><path d="M5 21l3-8 3 2 2 6M8 13l-3-2M11 15l4-3 5 1M14 8l-3 2"/>');

  /* delegación › deporte › prueba; un equipo suma una sola medalla (su fila ya es la institución). */
  const T = {};
  D.pruebas.forEach((p) => {
    const r = p.resultado; if (!r || p.estado !== "finalizada" || !(FASE[p.faseId] || {}).medallas) return;
    const filas = r.tipo === "clasificacion" ? r.filas : r.tipo === "posiciones" ? r.tablas.flatMap((x) => x.filas) : [];
    filas.forEach((f) => {
      const i = MEDAL_IX[f.medalla], d = (ATH[f.refId] || INS[f.refId] || {}).departamentoId; if (i == null || !DPT[d]) return;
      const t = T[d] = T[d] || { m: [0, 0, 0], dep: {} }, s = t.dep[p.deporteId] = t.dep[p.deporteId] || { m: [0, 0, 0], pr: [] };
      t.m[i]++; s.m[i]++; s.pr.push({ n: p.disciplina, cat: p.categoria, sexo: SEXO[p.sexo] || "", i });
    });
  });
  const cmp = (a, b) => b[0] - a[0] || b[1] - a[1] || b[2] - a[2];
  const rows = Object.keys(T).sort((a, b) => cmp(T[a].m, T[b].m) || DPT[a].nombre.localeCompare(DPT[b].nombre, "es"));
  const tot = rows.reduce((a, d) => a.map((v, i) => v + T[d].m[i]), [0, 0, 0]);

  /* Estado del evento según sus pruebas: ninguna finalizada → sin tag; todas → Finalizado; el resto → En curso. */
  const nac = D.pruebas.filter((p) => (FASE[p.faseId] || {}).medallas), fin = nac.filter((p) => p.estado === "finalizada").length;
  const estado = !fin ? "" : fin === nac.length ? '<span class="nwm-st nwm-st--fin">Finalizado</span>' : '<span class="nwm-st nwm-st--live">En curso</span>';
  const CHEV = '<span class="nwm-ch" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></span>';
  const cells = (m, bold) => m.map((v) => '<td class="c' + (v ? "" : " z") + '">' + v + "</td>").join("") + '<td class="c"><b>' + sum(m) + "</b></td>";
  const th = (i) => '<th scope="col" class="c"><span class="nwx-gsw" aria-hidden="true">' + award(i, 18, true) + "</span>" + NOMBRE[i] + "</th>";

  const podium = () => {
    const mob = window.matchMedia("(max-width:700px)").matches;
    return '<div class="nwx-pod nwx-pod--medal nwm-pod">' + [1, 0, 2].map((i) => { const d = rows[i]; if (!d) return "";
      const m = T[d].m;
      return '<div class="nwx-pd p' + (i + 1) + '" data-m="' + ["oro", "plata", "bronce"][i] + '"><span class="nwx-pmed">' + award(i, mob ? (i ? 96 : 124) : (i ? 140 : 190)) + '</span><b class="nwx-pname nwm-pn">' + flag(d, 31) + "<span>" + esc(DPT[d].nombre) + "</span></b>" +
        '<span class="nwx-pmark">' + counter(m, 22) + "</span><small>" + sum(m) + " medallas</small></div>"; }).join("") + "</div>";
  };

  const body = () => rows.map((d, n) => {
    const t = T[d], id = "nwm-" + d, deps = Object.keys(t.dep).sort((a, b) => cmp(t.dep[a].m, t.dep[b].m) || DEPO[a].nombre.localeCompare(DEPO[b].nombre, "es"));
    let h = '<tbody><tr class="d1" data-id="' + id + '"><td>' + '<span class="nwx-rank">' + (n + 1) + '</span></td><td><button type="button" class="nwm-tg" aria-expanded="false" aria-controls="' + id + '-c" data-k="' + id + '"><span class="nwx-who">' + flag(d, 22) + esc(DPT[d].nombre) + "</span></button></td>" + cells(t.m) + '<td class="nwm-end">' + CHEV + "</td></tr>";
    deps.forEach((sp) => { const s = t.dep[sp], sid = id + "-" + sp;
      h += '<tr class="d2" hidden data-p="' + id + '" data-k="' + sid + '"><td></td><td><button type="button" class="nwm-tg" aria-expanded="false" data-k="' + sid + '"><span class="nwx-who">' + icon(sp) + esc(DEPO[sp].nombre) + "</span></button></td>" + cells(s.m) + '<td class="nwm-end">' + CHEV + "</td></tr>";
      s.pr.sort((a, b) => a.i - b.i || a.n.localeCompare(b.n, "es")).forEach((p) => { const m = [0, 0, 0]; m[p.i] = 1;
        h += '<tr class="d3" hidden data-p="' + sid + '" data-g="' + id + '"><td></td><td>' + esc(p.n) + '<span class="nwm-tags">' + [p.sexo, p.cat].filter(Boolean).map((t) => '<span class="nwx-tag">' + esc(t) + "</span>").join("") + "</span></td>" + cells(m) + '<td class="nwm-end"></td></tr>'; });
    });
    return h + "</tbody>";
  }).join("");

  root.innerHTML = '<div class="nwx-view nwx-fx"><div class="nwm-h"><div><h2>Medallería 2026</h2><p class="nwm-tags2"><span class="nwx-tag">Final nacional</span>' + estado + '</p></div></div>' +
    (rows.length ? '<section class="nwx-fxc nwx-flat"><h3>Podio de delegaciones</h3>' + podium() + "</section>" +
      '<hr class="nwm-hr"><section class="nwx-fxc nwx-flat"><h3 class="nwm-h3"><span>Resumen total de medallas <span class="nwx-k2 nwm-sub">' + counter(tot, 20) + '<span class="nwm-n">' + sum(tot) + " en total</span></span></span>" + '<button type="button" class="nwm-all" data-all="1">Expandir todo</button></h3>' +
      '<div class="nwx-tbox nwx-tscroll nwx-stk"><table class="nwx-rtab nwm-t"><thead><tr><th scope="col">#</th><th scope="col">Delegación</th>' + th(0) + th(1) + th(2) + '<th scope="col" class="c">' + '<span class="nwx-tri" aria-hidden="true">' + [0, 1, 2].map((i) => '<nao-award kind="medal" metal="' + METALES[i] + '" icon="none" edition="colombia" size="18" ribbon="false" shadow="false" animated="false"></nao-award>').join('') + '</span>Total' + '</th><th scope="col" class="nwm-end"><span class="nwx-sr">Desplegar</span></th></tr></thead>' + body() + "</table></div></section>"
      : '<p class="nwm-vacio">Todavía no hay medallas entregadas.</p>') + "</div>";

  const setTop = () => { const hd = document.querySelector("header"); document.documentElement.style.setProperty("--nwx-top", (hd ? hd.getBoundingClientRect().height : 0) + "px"); };
  setTop(); addEventListener("resize", setTop);
  const open = new Set();
  const paint = () => {
    root.querySelectorAll("tr[data-p]").forEach((tr) => { const p = tr.dataset.p; tr.hidden = !open.has(p) || (tr.dataset.g ? !open.has(tr.dataset.g) : false); });
    root.querySelectorAll(".nwm-tg").forEach((b) => b.setAttribute("aria-expanded", open.has(b.dataset.k)));
    root.querySelectorAll("tr.d1,tr.d2").forEach((tr) => tr.classList.toggle("is-o", open.has(tr.dataset.id || tr.dataset.k)));
    /* Cebra por bloque: cada delegación abierta es una banda y sus filas alternan desde blanco; las cerradas alternan por posición. */
    let z = 0, n = 0; root.querySelectorAll("tbody tr").forEach((tr) => { if (tr.hidden) return; if (tr.classList.contains("d1")) { z = 0; tr.classList.toggle("is-z", !open.has(tr.dataset.id) && n++ % 2 === 1); if (open.has(tr.dataset.id)) n++; } else tr.classList.toggle("is-z", z++ % 2 === 1); });
    const vis = [...root.querySelectorAll("tbody tr")].filter((tr) => !tr.hidden); root.querySelectorAll("tr.is-last").forEach((tr) => tr.classList.remove("is-last")); if (vis.length) vis[vis.length - 1].classList.add("is-last");
    const all = root.querySelector(".nwm-all"); if (all) all.textContent = open.size ? "Contraer todo" : "Expandir todo";
  };
  const tbl = root.querySelector(".nwm-t");
  const WIDE = matchMedia("(min-width:701px)");
  /* Línea de pegado del piso 2: borde inferior del encabezado cuando está pegado. */
  const lineOf = () => (parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nwx-top")) || 0) + tbl.tHead.rows[0].cells[0].getBoundingClientRect().height;
  const jump = (y) => window.scrollTo({ top: Math.max(0, y), behavior: "instant" });
  root.addEventListener("click", (ev) => {
    const e = ev.target.closest("td.nwm-end"), b = ev.target.closest(".nwm-tg") || (e && e.parentElement.querySelector(".nwm-tg")), a = ev.target.closest(".nwm-all");
    if (b) {
      const k = b.dataset.k, tr = b.closest("tr"), cierra = open.has(k);
      cierra ? open.delete(k) : open.add(k);
      if (cierra) [...open].forEach((x) => { if (x.indexOf(k + "-") === 0) open.delete(x); });
      /* Al cerrar una delegación pegada, la página vuelve a su fila: si no, el lector queda en otra delegación. */
      const top = tr.classList.contains("d1") && cierra && WIDE.matches ? tr.parentElement.getBoundingClientRect().top - lineOf() : 0;
      paint(); if (top < 0) jump(scrollY + top);
    } else if (a) {
      const lejos = tbl.getBoundingClientRect().top < lineOf();
      if (open.size) { open.clear(); paint(); if (lejos) jump(scrollY + root.querySelector(".nwm-h3").getBoundingClientRect().top - lineOf()); }
      else { root.querySelectorAll(".nwm-tg").forEach((x) => open.add(x.dataset.k)); paint(); }
    }
    pin();
  });
  /* Pegado en dos pisos. La delegación abierta se pega al llegar a la línea y sale empujada por el final de su bloque. */
  const pin = () => {
    if (!tbl) return;
    const wide = WIDE.matches, top0 = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nwx-top")) || 0, line = lineOf();
    tbl.style.setProperty("--nwm-hh", (line - top0) + "px");
    const stuck = wide && tbl.tHead.getBoundingClientRect().top <= top0 + 0.5 && tbl.getBoundingClientRect().bottom > line;
    let quieta = false;
    tbl.querySelectorAll("tr.d1").forEach((tr) => {
      const abierta = tr.classList.contains("is-o"), tb = tr.parentElement.getBoundingClientRect(), h = tr.cells[0].getBoundingClientRect().height;
      const on = stuck && abierta && tb.top <= line + 0.5 && tb.bottom > line, y = on ? Math.max(-h, Math.min(0, tb.bottom - line - h)) : 0;
      tr.classList.toggle("is-pin", on); tr.classList.toggle("is-gone", wide && abierta && tb.bottom <= line);
      tr.style.setProperty("--nwm-y", y + "px"); quieta = quieta || (on && y === 0);
    });
    document.documentElement.classList.toggle("nwm-bar", stuck);
    tbl.classList.toggle("is-stuck", stuck); tbl.classList.toggle("has-pin", quieta);
  };
  let raf = 0; const tick = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(pin); };
  addEventListener("scroll", tick, { passive: true }); addEventListener("resize", tick);
  paint(); pin();
})(document.currentScript);
