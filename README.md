# design-demo-landing-web-jin

Demo navegable del nuevo flujo **Eventos y fases · Resultados · Deportistas** de la landing de los Juegos Intercolegiados (Naowee · Ministerio del Deporte). Es un prototipo de diseño estático: no consulta ningún servicio.

**Ver la demo:** https://jguzman-naowee.github.io/desing-demo-landing-web-jin/

## Cómo usarla

- Pulsa **Demo** en la barra azul de GOV.CO (arriba a la derecha). Se abre un cajón con los objetivos del usuario y sus casos.
- Cada caso se ejecuta solo, desde el inicio del sitio y usando el navbar, a velocidad lenta. Avanzas con **Siguiente ▸** (en la barra de abajo o dentro del tooltip); **↺ Reiniciar** repite el caso.
- **Diseño anterior** abre el modal con la captura de antes y la de ahora, los clics y por qué mejora.

## Qué contiene

- `calendario/`, `resultados/` y `deportistas/`: las tres lentes del explorador (mismo código; la ruta decide la lente). `explorador/?entrada=` queda solo para enlaces viejos.
- `_assets/demo/`: la capa de la demo (`demo-layer.js`, `demo-casos.js`, `demo-layer.css`) y las capturas `antes/` y `ahora/`.
- El resto de páginas (inicio, noticias, soporte, términos) completa la navegación del sitio.

## Datos

Los datos del explorador son una foto congelada de la fase Regionales (`_assets/js/explorador-datos.js`), no el servicio en vivo. Los textos «Pendiente» de cada caso dicen lo que aún no hace el diseño nuevo.

## Correr en local

```bash
python3 -m http.server 8770
```
