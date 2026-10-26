// js/standings.js
import { getDriverStandings, getConstructorStandings } from "./api.js";
import { initCommon } from "./search.js";

// --- Helpers ---
function escapeHtml(s) {
  const d = document.createElement("div");
  d.textContent = s ?? "";
  return d.innerHTML;
}
function showState(msg, kind = "info") {
  const node = document.getElementById("standings-state");
  const cls = kind === "error"
    ? "bg-error-container text-on-error"
    : "text-on-surface-variant";
  node.innerHTML = `<div class="p-4 text-center font-label-mono ${cls}">${escapeHtml(msg)}</div>`;
}
function clearState() {
  document.getElementById("standings-state").innerHTML = "";
}

// --- Render de filas ---
function renderDriverRows(standings) {
  return standings.map((s, i) => {
    const color = s.team_color_hex || "#e10600";
    const isLeader = i === 0;
    return `
      <tr class="${isLeader ? "leader-row" : i % 2 ? "bg-surface-container-low" : ""} border-b border-outline-variant/10 hover:bg-surface-variant transition-colors">
        <td class="p-4 font-black ${isLeader ? "text-primary" : ""}">${String(s.position).padStart(2, "0")}</td>
        <td class="p-4">
          <div class="flex items-center gap-3">
            <div class="w-1 h-8" style="background:${color}"></div>
            <div class="flex flex-col">
              <span class="font-bold ${isLeader ? "text-on-surface" : ""}">${escapeHtml(s.driver_name)}</span>
              <span class="text-[10px] text-on-surface-variant uppercase opacity-60 md:hidden">${escapeHtml(s.team_name)}</span>
            </div>
          </div>
        </td>
        <td class="p-4 hidden md:table-cell text-on-surface-variant">${escapeHtml(s.team_name)}</td>
        <td class="p-4 text-right ${isLeader ? "font-black text-primary" : "font-bold"}">${s.points}</td>
        <td class="p-4 text-right hidden sm:table-cell">${s.wins ?? 0}</td>
      </tr>`;
  }).join("");
}

function renderConstructorRows(standings) {
  return standings.map((s, i) => {
    const color = s.team_color_hex || "#e10600";
    const isLeader = i === 0;
    return `
      <tr class="${isLeader ? "leader-row" : i % 2 ? "bg-surface-container-low" : ""} border-b border-outline-variant/10 hover:bg-surface-variant transition-colors">
        <td class="p-4 font-black ${isLeader ? "text-primary" : ""}">${String(s.position).padStart(2, "0")}</td>
        <td class="p-4">
          <div class="flex items-center gap-3">
            <div class="w-1 h-8" style="background:${color}"></div>
            <span class="font-bold ${isLeader ? "text-on-surface" : ""}">${escapeHtml(s.team_name)}</span>
          </div>
        </td>
        <td class="p-4 hidden md:table-cell text-on-surface-variant">—</td>
        <td class="p-4 text-right ${isLeader ? "font-black text-primary" : "font-bold"}">${s.points}</td>
        <td class="p-4 text-right hidden sm:table-cell">${s.wins ?? 0}</td>
      </tr>`;
  }).join("");
}

// --- Render principal ---
function renderTab(tab, cache) {
  const body = document.getElementById("standings-body");
  const roundInfo = document.getElementById("round-info");
  const seasonLabel = document.getElementById("season-label");
  const colName = document.getElementById("col-name");
  const colTeam = document.getElementById("col-team");

  if (tab === "drivers") {
    const data = cache.drivers;
    seasonLabel.textContent = `Season ${data.season}`;
    roundInfo.textContent = `Después de la ronda ${data.after_round} de ${data.total_rounds}`;
    colName.textContent = "Driver";
    colTeam.textContent = "Team";
    body.innerHTML = renderDriverRows(data.standings);
  } else {
    const data = cache.constructors;
    seasonLabel.textContent = `Season ${data.season}`;
    roundInfo.textContent = `Después de la ronda ${data.after_round} de ${data.total_rounds}`;
    colName.textContent = "Team";
    colTeam.textContent = ""; // ocultamos la columna duplicada en constructores
    body.innerHTML = renderConstructorRows(data.standings);
  }
  clearState();
}

// --- Init ---
async function init() {
  showState("Cargando standings...");

  // Referencias a los botones de tab
  const tabBtns = document.querySelectorAll(".tab-btn");

  try {
    // Una sola llamada en paralelo, cacheamos
    const [drivers, constructors] = await Promise.all([
      getDriverStandings(),
      getConstructorStandings(),
    ]);
    const cache = { drivers, constructors };

    // Tab inicial: Pilotos
    renderTab("drivers", cache);

    // Listeners de tabs
    tabBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        tabBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        renderTab(btn.dataset.tab, cache);
      });
    });
  } catch (err) {
    showState(`No se pudieron cargar los standings: ${err.message}`, "error");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initCommon();
  init(); // la función propia de cada página
});