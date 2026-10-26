// js/calendar.js
import { getRaces, fmtTime } from "./api.js";
import { initCommon } from "./search.js";

// --- Helpers ---
function showLoading(node, msg = "Cargando...") {
  node.innerHTML = `<div class="p-8 text-center text-on-surface-variant font-label-mono">${msg}</div>`;
}
function showError(node, msg) {
  node.innerHTML = `<div class="p-8 text-center bg-error-container text-on-error font-label-mono">${msg}</div>`;
}
function escapeHtml(s) {
  const d = document.createElement("div");
  d.textContent = s ?? "";
  return d.innerHTML;
}

// Formatea rango de fecha tipo "FEB 29 - MAR 02" (UTC, como tu diseño original)
function formatRange(startIso, endIso) {
  if (!startIso) return "—";
  const s = new Date(startIso + "T00:00:00Z");
  const e = endIso ? new Date(endIso + "T00:00:00Z") : s;
  const day = (d) => new Intl.DateTimeFormat("es-ES", { day: "2-digit", timeZone: "UTC" }).format(d);
  const mon = (d) => new Intl.DateTimeFormat("es-ES", { month: "short", timeZone: "UTC" }).format(d).toUpperCase().slice(0, 3);
  if (!endIso || startIso === endIso) return `${mon(s)} ${day(s)}`;
  return `${mon(s)} ${day(s)} - ${mon(e)} ${day(e)}`;
}

// Renderiza el bloque de sesiones agrupadas por día (igual que tu diseño)
function renderSessions(sessions) {
  if (!sessions || !sessions.length) {
    return `<div class="pt-6 border-t border-outline-variant/20 mt-6 text-on-surface-variant font-label-mono text-sm">
      Horarios a confirmar.
    </div>`;
  }

  // Agrupar por día (en UTC para no depender de la zona del server)
  const groups = {};
  sessions
    .slice()
    .sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at))
    .forEach(s => {
      const d = new Date(s.starts_at);
      const key = new Intl.DateTimeFormat("es-ES", {
        weekday: "long", timeZone: "UTC"
      }).format(d).toUpperCase();
      if (!groups[key]) groups[key] = [];
      groups[key].push(s);
    });

  const LABELS = {
    FP1: "Practice 1",
    FP2: "Practice 2",
    FP3: "Practice 3",
    SPRINT_QUALIFYING: "Sprint Qualifying",
    SPRINT: "Sprint",
    QUALIFYING: "Qualifying",
    RACE: "Race",
  };

  return `
    <div class="hover-reveal">
      <div class="pt-6 border-t border-outline-variant/20 mt-6 grid grid-cols-1 md:grid-cols-3 gap-gutter">
        ${Object.entries(groups).map(([dayName, list]) => `
          <div>
            <span class="font-label-mono text-[11px] text-primary-container">${escapeHtml(dayName)}</span>
            ${list.map(s => {
              const isRace = s.type === "RACE";
              return `
                <div class="flex justify-between mt-2 border-b border-outline-variant/10 pb-2 ${isRace ? "bg-primary-container/10 px-2 -mx-2" : ""}">
                  <span class="font-body-md text-body-md ${isRace ? "font-bold" : ""}">${LABELS[s.type] || s.type}</span>
                  <span class="font-label-mono text-label-mono ${isRace ? "font-bold" : ""}">${fmtTime(s.starts_at)}</span>
                </div>`;
            }).join("")}
          </div>`).join("")}
      </div>
    </div>`;
}

// --- Render de una fila COMPLETED (con ganador) ---
function renderCompletedRow(r) {
  const winner = r.winner
    ? `${r.winner.name.split(" ").slice(-1)[0]}` // apellido
    : "—";
  return `
    <div class="calendar-row group bg-surface-container border border-outline-variant/20 transition-all duration-300 hover:border-primary-container/40">
      <div class="flex flex-col md:flex-row items-stretch">
        <div class="md:w-48 p-6 flex flex-col justify-center items-center border-b md:border-b-0 md:border-r border-outline-variant/20 bg-surface-container-low">
          <span class="font-label-mono text-label-mono text-on-surface-variant">ROUND ${String(r.round).padStart(2, "0")}</span>
          <div class="font-stat-value text-stat-value text-on-surface mt-1">${formatRange(r.date_start, r.date_end)}</div>
          <span class="mt-2 text-[10px] font-bold tracking-[0.2em] text-on-surface-variant/50 uppercase">Completed</span>
        </div>
        <div class="flex-1 p-6 relative overflow-hidden">
          <div class="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h3 class="font-headline-md text-headline-md uppercase group-hover:text-primary-container transition-colors">${escapeHtml(r.official_name || r.name)}</h3>
              <div class="flex items-center gap-2 mt-1">
                <span class="material-symbols-outlined text-sm text-on-surface-variant">location_on</span>
                <span class="font-label-mono text-label-mono text-on-surface-variant uppercase">${escapeHtml(r.city)}, ${escapeHtml(r.country)}</span>
              </div>
            </div>
            <div class="mt-4 md:mt-0 flex items-center gap-6">
              <div class="text-right">
                <div class="font-label-mono text-[10px] text-on-surface-variant/60">WINNER</div>
                <div class="font-stat-value text-stat-value text-primary-container uppercase">${escapeHtml(winner)}</div>
              </div>
              <span class="material-symbols-outlined text-4xl text-outline-variant/30 group-hover:text-primary-container/20 transition-colors">flag</span>
            </div>
          </div>
          ${renderSessions(r.sessions)}
        </div>
      </div>
    </div>`;
}

// --- Render de una fila NEXT (resaltada, sin Tickets) ---
function renderNextRow(r) {
  return `
    <div class="calendar-row group bg-surface-container-high border-l-4 border-l-primary-container border-y border-r border-outline-variant/30 shadow-[0_0_40px_-10px_rgba(225,6,0,0.15)]">
      <div class="flex flex-col md:flex-row items-stretch">
        <div class="md:w-48 p-6 flex flex-col justify-center items-center border-b md:border-b-0 md:border-r border-outline-variant/20 bg-primary-container/5">
          <span class="font-label-mono text-label-mono text-primary-container">ROUND ${String(r.round).padStart(2, "0")}</span>
          <div class="font-stat-value text-stat-value text-on-surface mt-1">${formatRange(r.date_start, r.date_end)}</div>
          <span class="mt-2 text-[10px] font-black tracking-[0.2em] text-primary-container uppercase animate-pulse">Up Next</span>
        </div>
        <div class="flex-1 p-6 relative overflow-hidden">
          <div class="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h3 class="font-headline-md text-headline-md uppercase text-on-surface">${escapeHtml(r.official_name || r.name)}</h3>
              <div class="flex items-center gap-2 mt-1">
                <span class="material-symbols-outlined text-sm text-on-surface-variant">location_on</span>
                <span class="font-label-mono text-label-mono text-on-surface-variant uppercase">${escapeHtml(r.city)}, ${escapeHtml(r.country)}</span>
              </div>
            </div>
            <!-- Sin botón Tickets (no hay datos) -->
          </div>
          ${renderSessions(r.sessions)}
        </div>
      </div>
    </div>`;
}

// --- Render de una fila UPCOMING (compacta) ---
function renderUpcomingRow(r) {
  return `
    <div class="calendar-row group bg-surface-container border border-outline-variant/20 opacity-60 hover:opacity-100 transition-all">
      <div class="flex items-center px-6 py-4">
        <div class="w-32 font-label-mono text-label-mono text-on-surface-variant">ROUND ${String(r.round).padStart(2, "0")}</div>
        <div class="flex-1 font-headline-md text-[18px] uppercase">${escapeHtml(r.name)}</div>
        <div class="text-right font-label-mono text-label-mono">${formatRange(r.date_start, r.date_end)}</div>
      </div>
      ${renderSessions(r.sessions)}
    </div>`;
}

// --- Render principal ---
function renderCalendar(container, races) {
  if (!races.length) {
    container.innerHTML = `<div class="p-8 text-center text-on-surface-variant">No hay carreras para esta temporada.</div>`;
    return;
  }

  container.innerHTML = races.map(r => {
    if (r.status === "completed") return renderCompletedRow(r);
    if (r.status === "next")      return renderNextRow(r);
    return renderUpcomingRow(r);
  }).join("");
}

// --- Init ---
async function init() {
  const list = document.getElementById("calendar-list");
  const seasonLabel = document.getElementById("season-label");

  showLoading(list);

  try {
    const data = await getRaces();
    seasonLabel.textContent = `SEASON ${data.season}`;
    renderCalendar(list, data.races);
  } catch (err) {
    showError(list, `No se pudo cargar el calendario: ${err.message}`);
  }
}

// --- Click en mobile para abrir/cerrar el hover-reveal ---
document.addEventListener("click", (e) => {
  const row = e.target.closest(".calendar-row");
  if (!row) return;
  // Solo en mobile (evitamos conflicto con el hover desktop)
  if (window.matchMedia("(min-width: 768px)").matches) return;

  const reveal = row.querySelector(".hover-reveal");
  if (!reveal) return;

  // Cerrar los demás
  document.querySelectorAll(".calendar-row.is-open").forEach(r => {
    if (r !== row) r.classList.remove("is-open");
  });
  row.classList.toggle("is-open");
});

// --- Efecto de glow que sigue al mouse (del script original) ---
document.addEventListener("mousemove", (e) => {
  const glow = document.getElementById("cursor-glow");
  if (glow) {
    glow.style.transform = `translate(${e.clientX - 250}px, ${e.clientY - 250}px)`;
  }
});

document.addEventListener("DOMContentLoaded", () => {
  initCommon();
  init(); // la función propia de cada página
});