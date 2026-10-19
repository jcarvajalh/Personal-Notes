// SE-001: fija el tema (claro/oscuro/sistema) antes de pintar para evitar
// parpadeo. Script externo cargado con next/script "beforeInteractive": Next lo
// inyecta en el HTML fuera del árbol de React (React 19 no permite <script>
// inline dentro de componentes). La clave y la lógica deben coincidir con
// src/components/theme-provider.tsx.
(function () {
  try {
    var t = localStorage.getItem("theme") || "system";
    var dark =
      t === "dark" ||
      (t === "system" && window.matchMedia("(prefers-color-scheme:dark)").matches);
    var e = document.documentElement;
    e.classList.remove("light", "dark");
    e.classList.add(dark ? "dark" : "light");
    e.style.colorScheme = dark ? "dark" : "light";
  } catch {
    /* no-op */
  }
})();
