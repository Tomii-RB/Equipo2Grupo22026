// js/search.js
import { search } from "./api.js";
import { initCommon } from "./search.js";

// --- Helpers ---
const TYPE_LABEL = {
  driver: "Piloto",
  team: "Equipo",
  circuit: "Circuito",
  race: "Carrera",
};
const TYPE_ICON = {
  driver: "person",
  team: "groups",
  circuit: "map",
  race: "flag",
};

function escapeHtml(s) {
  const d = document.createElement("div");
  d.textContent = s ?? "";
  return d.innerHTML;
}

// --- Buscador ---
function initSearch() {
  const input = document.getElementById("search-input");
  const results = document.getElementById("search-results");
  if (!input || !results) return;

  let debounceTimer = null;
  let lastQuery = "";

  // Mostrar/ocultar resultados
  function showResults(items) {
    if (!items.length) {
      results.innerHTML = `<div class="search-empty">Sin resultados</div>`;
      return;
    }
    results.innerHTML = items.map(r => `
      <a class="search-result-item" href="${escapeHtml(r.url)}">
        <span class="material-symbols-outlined text-primary text-sm">${TYPE_ICON[r.type] || "search"}</span>
        <span class="search-result-type">${TYPE_LABEL[r.type] || r.type}</span>
        <span class="search-result-label">${escapeHtml(r.label)}</span>
      </a>
    `).join("");
  }

  function hideResults() {
    results.innerHTML = "";
  }

  async function doSearch(q) {
    if (!q || q.trim().length < 2) {
      hideResults();
      return;
    }
    try {
      const data = await search(q.trim());
      // Si mientras esperábamos cambió la query, descartamos esta respuesta
      if (q !== input.value) return;
      showResults(data.results || []);
    } catch (err) {
      console.error("Search error:", err);
      results.innerHTML = `<div class="search-empty">Error al buscar</div>`;
    }
  }

  input.addEventListener("input", (e) => {
    const q = e.target.value;
    lastQuery = q;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => doSearch(q), 300);
  });

  // Cerrar al hacer click afuera
  document.addEventListener("click", (e) => {
    if (!input.contains(e.target) && !results.contains(e.target)) {
      hideResults();
    }
  });

  // Cerrar con Escape
  input.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      hideResults();
      input.blur();
    }
  });
}

// --- Menú hamburguesa mobile ---
function initMobileMenu() {
  const btn = document.getElementById("mobile-menu-btn");
  const menu = document.getElementById("mobile-menu");
  if (!btn || !menu) return;

  btn.addEventListener("click", () => {
    menu.classList.toggle("hidden");
    const icon = btn.querySelector(".material-symbols-outlined");
    if (icon) {
      icon.textContent = menu.classList.contains("hidden") ? "menu" : "close";
    }
  });

  // Cerrar al clickear un link
  menu.querySelectorAll("a").forEach(a => {
    a.addEventListener("click", () => {
      menu.classList.add("hidden");
      const icon = btn.querySelector(".material-symbols-outlined");
      if (icon) icon.textContent = "menu";
    });
  });
}

// --- Init (se ejecuta cuando el DOM está listo) ---
export function initCommon() {
  initSearch();
  initMobileMenu();
}