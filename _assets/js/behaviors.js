/* Comportamientos del header y de los botones de accesibilidad, sin framework.
   Replica Header.tsx y FloatingButtons.tsx con las mismas clases de Tailwind. */
(() => {
  const script = document.currentScript;
  const ROOT = script.dataset.root || "./";
  const href = (p) => ROOT + p + "/index.html";
  const RUTAS = { eventos: "calendario", resultados: "resultados", deportistas: "deportistas" };
  const EXP = (lente) => ROOT + RUTAS[lente] + "/";
  const LINK = "text-JIC-violet-900 hover:text-JIC-violet-900/80 text-base font-medium transition-colors dark:text-dark-accent dark:hover:text-white";
  const ITEM = "nw-menu-item relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden transition-colors";
  const MENU = "z-1000 w-56 z-50 min-w-32 overflow-y-auto overflow-x-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md";
  const login = (document.querySelector('header a[href*="auth/login"]') || {}).href || "#";

  /* Interruptor único de la Fase final nacional en los menús (espejo de LANDING_PHASE). Con false vuelve a gris con su aviso. */
  const FINAL_PUBLICADA = true;
  window.NWX_FINAL_PUBLICADA = FINAL_PUBLICADA;
  const FINAL_AYUDA = "Del 13 al 30 de noviembre · Bogotá";
  const DEMO = true;
  const dest = (lente, e, f) => EXP(lente) + "?e=" + e + "&f=" + f + (f === "NAC" && DEMO ? "&demo=nac" : "");
  /* Las dos entradas abren el mismo popover y llevan al explorador ya filtrado por evento y fase. */
  const ICO_ATL = '<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" style="flex:none"><path d="M9 2h6M12 14l3-3" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="12" cy="14" r="8" fill="none" stroke="currentColor" stroke-width="2"/></svg>', ICO_BAL = '<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" style="flex:none"><circle cx="12" cy="12" r="10" fill="currentColor"/><path d="M2 12h20M12 2v20M5 5c4 3 4 11 0 14M19 5c-4 3-4 11 0 14" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>';
  /* Primer criterio la fase; debajo, los dos eventos. Cada enlace conserva evento y fase como contexto fijo del explorador. */
  const GRUPOS = [["REG", "Fase regional"], ["NAC", "Fase final nacional"]];
  const EVENTOS = [["individual", "Deportes individuales", ICO_ATL], ["conjunto", "Deportes de conjunto", ICO_BAL]];
  const VIOLETA = "var(--color-JIN6-foundations-violeta,#602a8c)";
  const _q = new URLSearchParams(location.search);
  const actual = (lente, e, f) => new RegExp("/" + RUTAS[lente] + "(/index\\.html|/)?$").test(location.pathname) && _q.get("e") === e && (_q.get("f") === "NAC" ? "NAC" : "REG") === f;
  const chip = (t) => `<span aria-hidden="true" style="font-weight:700;font-size:.875rem;color:${VIOLETA}">${t}</span>`;
  const fasesHtml = (lente) => GRUPOS.map(([f, t], i) => {
    const off = f === "NAC" && !FINAL_PUBLICADA;
    return (i ? '<div role="separator" aria-orientation="horizontal" style="height:1px;margin:.5rem 0;background:var(--color-divider-soft,#d8dee9)"></div>' : "") +
      `<div role="group" aria-label="${t}"><div class="px-2 pt-2 pb-1">${chip(t)}</div>${off ? `<small class="nwx-fayuda">${FINAL_AYUDA}</small>` : ""}` +
      EVENTOS.map(([e, n, ic]) => off ? `<div role="menuitem" aria-disabled="true" title="${FINAL_AYUDA}" class="${ITEM} nwx-mi opacity-40 cursor-not-allowed"><span style="display:inline-flex;align-items:center;gap:.5rem">${ic}${n}</span></div>`
        : `<a href="${dest(lente, e, f)}" class="${LINK}"${actual(lente, e, f) ? ' aria-current="page"' : ""}><div role="menuitem" class="${ITEM} nwx-mi"><span style="display:inline-flex;align-items:center;gap:.5rem"><span style="display:inline-flex;color:${VIOLETA}">${ic}</span>${n}</span></div></a>`).join("") + "</div>";
  }).join("");
  /* Deportistas no depende de la fase: solo ofrece el evento. */
  const eventos = [["Deportes individuales", EXP("deportistas") + "?e=individual"], ["#d"], ["Deportes de conjunto", EXP("deportistas") + "?e=conjunto"]];
  const MENUS = {
    Deportistas: eventos,
    "Eventos y fases": () => fasesHtml("eventos"),
    Resultados: () => fasesHtml("resultados"),
    "Medallería": () => {
      /* Mismo icono para ambos años: un trofeo (copa) en lugar de medallas. */
      const ic = () => '<nao-award kind="trophy" variant="copa" metal="gold" edition="colombia" size="22" shadow="false" animated="false"></nao-award>';
      const TAG = 'style="margin-left:auto;font-size:.625rem;line-height:1;font-weight:600;letter-spacing:.04em;padding:.125rem .3125rem;border:1px solid var(--color-divider-soft,#d8dee9);border-radius:9999px;color:var(--color-JIN6-text-secondary,#646587)"';
      return `<a href="${ROOT}public/pdfs/analisis_medallas_comite.pdf" target="_blank" rel="noopener noreferrer" class="${LINK}"><div role="menuitem" class="${ITEM}"><span style="display:inline-flex;align-items:center;gap:.5rem">${ic()}2025</span><span ${TAG}>PDF</span></div></a>` +
        '<div role="separator" aria-orientation="horizontal" style="height:1px;margin:.25rem 0;background:var(--color-divider-soft,#d8dee9)"></div>' +
        `<a href="${ROOT}medalleria/" class="${LINK}"${/\/medalleria\/?$/.test(location.pathname) ? ' aria-current="page"' : ""}><div role="menuitem" class="${ITEM}"><span style="display:inline-flex;align-items:center;gap:.5rem;font-weight:700">${ic()}2026</span></div></a>`;
    },
    "Desarrollo de Juegos": [["Resultados", EXP("resultados")], ["Deportistas", EXP("deportistas")], ["Inscríbete aquí", login, true]],
  };

  /* Medallas <nao-award> para el menú de Medallería. */
  if (!customElements.get("nao-award") && !document.querySelector("script[data-nao-awards]")) { const m = document.createElement("script"); m.type = "module"; m.dataset.naoAwards = ""; m.src = script.src.replace(/behaviors\.js(\?.*)?$/, "awards.js"); document.head.appendChild(m); }
  /* ── Dropdowns (Radix) ─────────────────────────────── */
  let openMenu = null;
  const closeMenu = () => {
    if (!openMenu) return;
    openMenu.trigger.setAttribute("aria-expanded", "false");
    openMenu.trigger.dataset.state = "closed";
    openMenu.el.remove();
    openMenu = null;
  };
  const place = (trigger, el) => {
    const r = trigger.getBoundingClientRect();
    const h = el.parentElement.getBoundingClientRect();
    const w = el.offsetWidth;
    el.style.position = "absolute";
    el.style.top = r.bottom - h.top + 4 + "px";
    el.style.left = Math.max(8, Math.min(innerWidth - w - 8, r.left + r.width / 2 - w / 2)) - h.left + "px";
  };
  /* Medallería pasa a desplegable (2025 → PDF, 2026 → vista) y se ubica antes de Deportistas (posición 3); el botón clona el de Deportistas. */
  document.querySelectorAll("header a").forEach((x) => {
    if (x.textContent.trim() !== "Medallería 2025") return;
    const dep = [...document.querySelectorAll("header button[aria-haspopup=menu]")].find((b) => b.textContent.trim() === "Deportistas");
    if (!dep) return;
    const btn = dep.cloneNode(true); btn.querySelector("span").firstChild.textContent = "Medallería";
    dep.before(btn); x.remove();
  });
  document.querySelectorAll("header button[aria-haspopup=menu]").forEach((trigger) => {
    const label = trigger.textContent.trim();
    const items = MENUS[label];
    if (!items) return;
    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      const was = openMenu && openMenu.trigger === trigger;
      closeMenu();
      if (was) return;
      const el = document.createElement("div");
      el.setAttribute("role", "menu");
      el.dataset.state = "open";
      el.className = MENU;
      el.innerHTML = typeof items === "function" ? items() : items.map(([t, h, ext, off]) => off ? `<div role="menuitem" aria-disabled="true" title="${FINAL_AYUDA}" class="${ITEM} opacity-40 cursor-not-allowed flex-col items-start gap-0"><span style="font-weight:700;color:var(--color-JIN6-foundations-violeta,#602a8c)">${t}</span><small class="text-xs">${FINAL_AYUDA}</small></div>` : t === "#h" ? `<div class="px-2 pt-2 pb-1 text-sm font-bold"><span style="display:inline-flex;align-items:center;gap:.375rem;color:var(--color-JIN6-foundations-violeta,#602a8c)">${h}</span></div>` : t === "#d" ? '<div role="separator" aria-orientation="horizontal" style="height:1px;margin:.5rem 0;background:var(--color-divider-soft,#d8dee9)"></div>' :
        `<a href="${h}" class="${LINK}"${ext ? ' target="_blank" rel="noopener noreferrer"' : ""}><div role="menuitem" class="${ITEM}">${t === "Deportes individuales" || t === "Deportes de conjunto" ? `<span style="display:inline-flex;align-items:center;gap:.5rem"><span style="display:inline-flex;color:var(--color-JIN6-foundations-violeta,#602a8c)">${t === "Deportes individuales" ? ICO_ATL : ICO_BAL}</span>${t}</span>` : t === "Fase final nacional" ? `<span style="font-weight:700;color:var(--color-JIN6-foundations-violeta,#602a8c)">${t}</span>` : t}</div></a>`).join("");
      (trigger.closest("header") || document.body).appendChild(el);
      place(trigger, el);
      trigger.setAttribute("aria-expanded", "true");
      trigger.dataset.state = "open";
      openMenu = { trigger, el };
    });
  });
  /* Títulos de sección del home: mismo tamaño y peso (40px / 700). */
  document.querySelectorAll("h2").forEach((h) => { if (["Galería multimedia", "Novedades", "Accesos principales"].includes(h.textContent.trim())) h.classList.add("nwx-h2s"); });
  /* Botón «Demo» a la derecha de ES, con su mismo formato (todavía sin acción asignada). */
  document.querySelectorAll("button.border-white").forEach((es) => {
    if (es.textContent.trim() !== "ES" || es.parentElement.dataset.demo) return;
    const demo = es.cloneNode(false); demo.textContent = "Demo"; demo.type = "button";
    const wrap = document.createElement("div"); wrap.className = "flex items-center gap-2"; wrap.dataset.demo = "1";
    es.replaceWith(wrap); wrap.append(es, demo);
  });
  /* Noticias, Soporte e Inscríbete aquí: se ven igual pero quedan desconectados (sin enlace ni menú). */
  const INERTES = ["Noticias", "Inscríbete aquí"];
  document.querySelectorAll("header a").forEach((x) => {
    if (!INERTES.includes(x.textContent.trim())) return;
    const s = document.createElement("span");
    s.className = x.className; s.innerHTML = x.innerHTML; s.setAttribute("aria-disabled", "true"); s.style.pointerEvents = "none";
    x.replaceWith(s);
  });
  /* Sección actual del navbar: negrita y violeta (DC-031). */
  const SECCION = { calendario: "Eventos y fases", resultados: "Resultados", deportistas: "Deportistas", medalleria: "Medallería", noticias: "Noticias" };
  const seg = Object.keys(SECCION).find((k) => new RegExp("/" + k + "(/index\\.html|/)?$").test(location.pathname));
  if (seg) document.querySelectorAll("header .md\\:flex > *").forEach((x) => { if (x.textContent.trim() !== SECCION[seg]) return; x.style.fontWeight = "700"; x.style.color = VIOLETA; x.setAttribute("aria-current", "page"); });
  /* Separación del menú de escritorio a 24px (DC-359). */
  document.querySelectorAll("header .md\\:flex.gap-8").forEach((n) => n.classList.replace("gap-8", "gap-6"));
  document.querySelectorAll("header button[aria-haspopup=menu]").forEach((t) => { if (t.textContent.trim() === "Soporte") { t.setAttribute("aria-disabled", "true"); t.style.pointerEvents = "none"; } });
  document.addEventListener("click", (e) => { if (openMenu && !openMenu.el.contains(e.target)) closeMenu(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenu(); });
  addEventListener("resize", closeMenu);

  /* ── Sidebar móvil ─────────────────────────────────── */
  const burger = document.querySelector("header svg.md\\:hidden");
  if (burger) {
    burger.style.cursor = "pointer";
    const L = "text-JIC-violet-900 hover:text-JIC-violet-900/80 text-xl font-medium transition-colors dark:text-dark-accent dark:hover:text-white";
    const movil = (t, lente) => `<div class="flex flex-col items-center gap-3">
              <button type="button" data-reg aria-expanded="false" class="${L}">${t} ▾</button>
              <div data-reg-list class="hidden flex-col items-center gap-3 text-base">
                ${GRUPOS.map(([f, t]) => movilGrupo(lente, f, t)).join("")}
              </div>
            </div>`;
    const a = (t, h, ext) => `<a href="${h}" class="${L}"${ext ? ' target="_blank" rel="noopener noreferrer"' : ""}>${t}</a>`;
    const ai = (t, h, ic, cur) => `<a href="${h}" class="${L} nwx-mm"${cur ? ' aria-current="page"' : ""} style="display:inline-flex;align-items:center;gap:.5rem"><span style="display:inline-flex;color:var(--color-JIN6-foundations-violeta,#602a8c)">${ic}</span>${t}</a>`;
    const movilGrupo = (lente, f, t) => `<div role="group" aria-label="${t}" class="flex flex-col items-center gap-1 w-full">${chip(t)}${f === "NAC" && !FINAL_PUBLICADA ? `<small class="nwx-fayuda">${FINAL_AYUDA}</small>` : ""}${EVENTOS.map(([e, n, ic]) => f === "NAC" && !FINAL_PUBLICADA ? `<span class="nwx-mm opacity-40" aria-disabled="true" title="${FINAL_AYUDA}">${n}</span>` : ai(n, dest(lente, e, f), ic, actual(lente, e, f))).join("")}</div>`;
    burger.addEventListener("click", () => {
      const wrap = document.createElement("div");
      wrap.className = "fixed inset-0 z-99999 md:hidden";
      wrap.innerHTML = `
        <div data-close class="fixed inset-0 bg-black/50"></div>
        <div class="fixed right-0 top-0 h-full w-full bg-white p-6 shadow-xl dark:bg-black z-100000 overflow-y-auto">
          <div class="flex flex-row justify-between gap-6">
            <img src="${ROOT}public/images/logos/cobranding.png" alt="JIC" width="1080" height="297" class="w-64 h-auto dark:hidden">
            <img src="${ROOT}public/images/logos/cobranding-white.png" alt="JIC" width="1080" height="292" class="w-64 h-auto hidden dark:block">
            <button data-close aria-label="Cerrar" class="text-JIC-violet-900 text-4xl leading-none">&times;</button>
          </div>
          <div class="flex flex-col gap-6 mt-20 justify-center items-center">
            ${a("Inicio", ROOT + "index.html")}
            ${movil("Eventos y fases", "eventos")}
            ${movil("Resultados", "resultados")}
            <div class="flex flex-col items-center gap-3">
              <button type="button" data-reg aria-expanded="false" class="${L}">Deportistas ▾</button>
              <div data-reg-list class="hidden flex-col items-center gap-3 text-base">${a("Deportes individuales", EXP("deportistas") + "?e=individual")}${a("Deportes de conjunto", EXP("deportistas") + "?e=conjunto")}</div>
            </div>
            ${a("Noticias", href("noticias"))}
            ${a("Medallería 2025", ROOT + "public/pdfs/analisis_medallas_comite.pdf", true)}${a("Medallería 2026", ROOT + "medalleria/")}
            ${a("Preguntas Frecuentes", href("faq"))}${a("Soporte Técnico", href("soporte-tecnico"))}
            <a href="${login}" target="_blank" rel="noopener noreferrer" class="bg-JIN6-foundations-violeta w-full text-NW-gray-50 py-2 px-3 rounded-md text-center text-xl font-medium">Inscríbete aquí</a>
          </div>
        </div>`;
      wrap.addEventListener("click", (e) => {
        if (e.target.closest("[data-close]")) wrap.remove();
        const reg = e.target.closest("[data-reg]");
        if (reg) { const l = reg.parentElement.querySelector("[data-reg-list]"); l.classList.toggle("hidden"); l.classList.toggle("flex"); reg.setAttribute("aria-expanded", l.classList.contains("flex")); }
      });
      document.body.appendChild(wrap);
    });
  }

  /* ── Accesibilidad: contraste y tamaño de texto ────── */
  document.querySelectorAll('[aria-label="Abrir menú de accesibilidad"], [aria-label="Modo alto contraste"], [aria-label="Aumentar texto"]')
    .forEach((n) => { const f = n.closest(".fixed"); if (f) f.parentElement.classList.contains("bg-GOV-blue-500") ? f.parentElement.remove() : f.remove(); });
  try { document.documentElement.classList.toggle("dark", localStorage.getItem("darkMode") === "true"); } catch {}
  let level = 0;
  const setSize = () => { document.documentElement.style.fontSize = Math.max(10, 16 + 2 * level) + "px"; };
  const ACTIONS = [
    ["Alto contraste", "<svg width='20' height='20' viewBox='0 0 24 24'><circle cx='12' cy='12' r='9' fill='none' stroke='currentColor' stroke-width='2'/><path d='M12 3a9 9 0 0 1 0 18z' fill='currentColor'/></svg>",
      () => { const d = document.documentElement.classList.toggle("dark"); try { localStorage.setItem("darkMode", d); } catch {} }],
    ["Aumentar texto", "<b style='font-size:15px'>A+</b>", () => { if (level < 4) level++; setSize(); }],
    ["Disminuir texto", "<b style='font-size:15px'>A−</b>", () => { if (level > -4) level--; setSize(); }],
  ];
  const BTN = "flex items-center bg-blue-600 hover:bg-JIC-violet-700 dark:hover:bg-white hover:border-2 hover:border-white text-white dark:text-black dark:bg-white dark:border-white transition-all duration-300 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-blue-400";
  const box = document.createElement("div");
  box.innerHTML = `
    <div class="hidden md:block"><div class="fixed right-0 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-999 bg-GOV-blue-700 dark:bg-black dark:border dark:border-white rounded-lg px-7 py-2">
      ${ACTIONS.map(([t, i], n) => `<div class="relative h-10"><button data-a="${n}" aria-label="${t}" style="font-size:16px" class="${BTN} absolute -right-5 justify-end flex-row-reverse h-10 rounded-lg overflow-hidden w-10 px-2"><span class="shrink-0">${i}</span><span class="whitespace-nowrap opacity-0 w-0">${t}</span></button></div>`).join("")}
    </div></div>
    <div class="md:hidden fixed bottom-4 right-4 z-9999">
      <button data-toggle aria-label="Abrir menú de accesibilidad" class="${BTN} w-14 h-14 rounded-lg shadow-lg justify-center text-xl">☰</button>
      <div data-panel class="absolute bottom-20 right-0 hidden"><div class="bg-GOV-blue-700 dark:bg-black rounded-lg shadow-xl p-3 min-w-[200px]">
        ${ACTIONS.map(([t, i], n) => `<button data-a="${n}" class="${BTN} w-full gap-3 px-4 py-4 rounded-md mb-2 last:mb-0 text-left text-sm font-medium"><span class="shrink-0">${i}</span><span>${t}</span></button>`).join("")}
      </div></div>
    </div>`;
  document.body.appendChild(box);
  box.addEventListener("click", (e) => {
    const b = e.target.closest("[data-a]");
    if (b) { ACTIONS[b.dataset.a][2](); box.querySelector("[data-panel]").classList.add("hidden"); }
    if (e.target.closest("[data-toggle]")) box.querySelector("[data-panel]").classList.toggle("hidden");
  });
  box.querySelectorAll(".md\\:block [data-a]").forEach((b) => {
    const [ic, lb] = b.children;
    const on = (v) => { b.classList.toggle("w-40", v); b.classList.toggle("pl-3", v); b.classList.toggle("pr-2", v); b.classList.toggle("w-10", !v); b.classList.toggle("px-2", !v); lb.classList.toggle("opacity-100", v); lb.classList.toggle("opacity-0", !v); lb.classList.toggle("w-0", !v); };
    b.addEventListener("mouseenter", () => on(true)); b.addEventListener("mouseleave", () => on(false));
  });

  /* ── Pestañas (Radix Tabs): el script de captura dejó cada panel en el DOM ── */
  document.addEventListener("click", (e) => {
    const tab = e.target.closest("[role=tab][data-nw-tab]");
    if (!tab) return;
    const group = tab.dataset.nwTab.split("-")[0] + "-";
    document.querySelectorAll(`[role=tab][data-nw-tab^="${group}"]`).forEach((x) => {
      const on = x === tab;
      x.setAttribute("aria-selected", on);
      x.dataset.state = on ? "active" : "inactive";
    });
    document.querySelectorAll(`[data-nw-tabpanel^="${group}"]`).forEach((p) => {
      p.style.display = p.dataset.nwTabpanel === tab.dataset.nwTab ? "" : "none";
    });
  });
})();
