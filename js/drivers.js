// js/drivers.js
import { getDrivers, getDriverStandings } from "./api.js";
import { initCommon } from "./search.js";

// --- Helpers ---
function showLoading(node, msg = "Cargando...") {
  node.innerHTML = `<div class="p-8 text-center text-on-surface-variant font-label-mono col-span-full">${msg}</div>`;
}
function showError(node, msg) {
  node.innerHTML = `<div class="p-8 text-center bg-error-container text-on-error font-label-mono col-span-full">${msg}</div>`;
}
function escapeHtml(s) {
  const d = document.createElement("div");
  d.textContent = s ?? "";
  return d.innerHTML;
}

// --- Render de la grilla de pilotos ---
function renderDriversGrid(container, drivers) {
  if (!drivers.length) {
    container.innerHTML = `<div class="p-8 text-center text-on-surface-variant col-span-full">No hay pilotos para esta temporada.</div>`;
    return;
  }

  container.innerHTML = drivers.map(d => {
    const photo = d.photo_url || "../images/placeholder.png";
    const color = d.team_color_hex || "#e10600";
    const position = d.championship_position ?? "—";
    return `
      <div class="driver-card group relative bg-surface-container border border-outline-variant/30 transition-all duration-300 overflow-hidden cursor-pointer">
        <div class="absolute top-0 left-0 w-1 h-full" style="background:${color}"></div>
        <div class="relative h-80 w-full overflow-hidden">
          <img class="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 transform group-hover:scale-105"
               src="${photo}" alt="${escapeHtml(d.first_name + ' ' + d.last_name)}"/>
          <div class="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-80"></div>
          <div class="absolute bottom-4 left-6">
            <span class="font-label-mono text-label-mono text-primary-container">${String(d.number).padStart(2, "0")}</span>
            <h3 class="font-headline-md text-headline-md uppercase leading-none">${escapeHtml(d.first_name)} ${escapeHtml(d.last_name)}</h3>
            <p class="font-label-mono text-label-mono text-on-surface-variant opacity-70">${escapeHtml(d.team_name)}</p>
          </div>
        </div>
        <div class="p-6 reveal-content">
          <p class="font-body-md text-body-md text-on-surface-variant italic">${escapeHtml(d.bio || "")}</p>
          <div class="mt-4 flex gap-4">
            <div class="bg-surface-container-highest p-3 border border-outline-variant/20 flex-1">
              <span class="block font-label-mono text-[10px] text-on-surface-variant uppercase">Wins</span>
              <span class="font-stat-value text-stat-value text-primary-container">${d.wins ?? 0}</span>
            </div>
            <div class="bg-surface-container-highest p-3 border border-outline-variant/20 flex-1">
              <span class="block font-label-mono text-[10px] text-on-surface-variant uppercase">Podiums</span>
              <span class="font-stat-value text-stat-value">${d.podiums ?? 0}</span>
            </div>
          </div>
        </div>
      </div>`;
  }).join("");
}

// --- Render del sidebar de standings ---
function renderStandingsSidebar(tbody, standings) {
  tbody.innerHTML = standings.map((s, i) => {
    const color = s.team_color_hex || "#e10600";
    const isLeader = i === 0;
    return `
      <tr class="border-b border-outline-variant/10 hover:bg-white/5 transition-colors group">
        <td class="py-4 ${isLeader ? "text-primary-container font-bold italic" : "text-on-surface-variant"}">${String(s.position).padStart(2, "0")}</td>
        <td class="py-4">
          <div class="flex flex-col">
            <span class="text-on-surface font-bold uppercase flex items-center gap-2">
              <span class="inline-block w-1 h-4" style="background:${color}"></span>
              ${escapeHtml(s.driver_name)}
            </span>
            <span class="text-[10px] text-on-surface-variant uppercase opacity-60">${escapeHtml(s.team_name)}</span>
          </div>
        </td>
        <td class="py-4 text-right font-bold text-on-surface group-hover:text-primary-container">${s.points}</td>
      </tr>`;
  }).join("");
}

// --- Init ---
async function init() {
  const grid = document.getElementById("drivers-grid");
  const standingsBody = document.getElementById("driver-standings-body");
  const seasonLabel = document.getElementById("season-label");
  const roundLabel = document.getElementById("round-label");

  showLoading(grid);
  showLoading(standingsBody, "");

  try {
    // Una sola llamada en paralelo: drivers + standings
    const [driversData, standingsData] = await Promise.all([
      getDrivers(),
      getDriverStandings(),
    ]);

    // Temporada en el header (la que devuelve la API)
    seasonLabel.textContent = `Season ${driversData.season}`;

    // Grilla de pilotos
    renderDriversGrid(grid, driversData.drivers);

    // Ronda X/Y en el sidebar (viene de standings)
    roundLabel.textContent = `ROUND ${standingsData.after_round}/${standingsData.total_rounds}`;

    // Tabla de standings del sidebar (top 8 como tenías)
    renderStandingsSidebar(standingsBody, standingsData.standings.slice(0, 8));
  } catch (err) {
    showError(grid, `No se pudieron cargar los pilotos: ${err.message}`);
    showError(standingsBody, `No se pudieron cargar los standings: ${err.message}`);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initCommon();
  init(); // la función propia de cada página
});