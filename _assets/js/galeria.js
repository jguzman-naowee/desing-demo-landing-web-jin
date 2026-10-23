/* Galería del home: máximo 8 fotos, giro continuo automático (pausa al pasar el mouse) y flechas/puntos que funcionan sin Swiper. */
(() => {
  const pag = document.querySelector(".swiper-custom-pagination");
  if (!pag) return;
  const root = pag.closest(".w-full.relative"), wrap = root.querySelector(".swiper-wrapper");
  const prev = root.querySelector(".swiper-button-prev"), next = root.querySelector(".swiper-button-next");
  const MAX = 8, EVERY = 3000;
  const all = [...wrap.querySelectorAll(".swiper-slide")];
  all.slice(MAX).forEach((s) => s.remove());
  const slides = all.slice(0, MAX);
  const step = () => slides[0].getBoundingClientRect().width + (parseFloat(getComputedStyle(slides[0]).marginRight) || 0);
  let clones = [], i = 0, hover = false, busy = false;

  // Copias de las primeras fotos al final: al llegar al final el giro continúa sin saltos visibles.
  const makeClones = () => {
    clones.forEach((c) => c.remove());
    const n = Math.min(MAX, Math.ceil(wrap.parentElement.getBoundingClientRect().width / step()) + 1);
    clones = slides.slice(0, n).map((s) => { const c = s.cloneNode(true); c.setAttribute("aria-hidden", "true"); wrap.appendChild(c); return c; });
  };
  const set = (n, anim) => { wrap.style.transitionDuration = anim ? "500ms" : "0ms"; wrap.style.transform = "translate3d(" + -n * step() + "px,0,0)"; };

  const base = pag.children.length ? pag.children[0].className.replace(/\bw-8!.*$/, "").trim() : "w-3 h-3 bg-gray-300 rounded-full inline-block mx-1 cursor-pointer transition-all duration-300 opacity-50 hover:opacity-100";
  pag.innerHTML = "";
  const dots = Array.from({ length: MAX }, (_, k) => {
    const b = document.createElement("span");
    b.className = base; b.setAttribute("role", "button"); b.setAttribute("aria-label", "Foto " + (k + 1));
    b.addEventListener("click", () => go(k));
    pag.appendChild(b); return b;
  });
  const paint = () => dots.forEach((b, k) => {
    const on = k === i % MAX;
    b.style.width = on ? "2rem" : ""; b.style.opacity = on ? "1" : ""; b.style.background = on ? "var(--color-JIC-violet-900,#28123b)" : "";
  });

  const go = (n) => {
    if (busy) return;
    if (n < 0) { set(MAX, false); void wrap.offsetWidth; n = MAX - 1; }
    i = n; set(i, true); paint();
    if (i >= MAX) { busy = true; setTimeout(() => { i = i % MAX; set(i, false); paint(); busy = false; }, 520); }
  };
  if (prev) prev.addEventListener("click", () => go(i - 1));
  if (next) next.addEventListener("click", () => go(i + 1));

  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduce) setInterval(() => { if (!hover && !document.hidden) go(i + 1); }, EVERY);
  ["mouseenter", "focusin"].forEach((e) => root.addEventListener(e, () => { hover = true; }));
  ["mouseleave", "focusout"].forEach((e) => root.addEventListener(e, () => { hover = false; }));
  addEventListener("resize", () => { makeClones(); set(i % MAX, false); });
  makeClones(); set(0, false); paint();
})();
