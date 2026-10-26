// js/teams.js
import { getTeams, getConstructorStandings, getNextRace, fmtDate } from "./api.js";
import { initCommon } from "./search.js";

// --- Helpers ---
function showLoading(node, msg = "Cargando...", asSpan = false) {
  const html = `<div class="p-8 text-center text-on-surface-variant font-label-mono">${msg}</div>`;
  node.innerHTML = asSpan ? html : html;
}
function showError(node, msg) {
  node.innerHTML = `<div class="p-8 text-center bg-error-container text-on-error font-label-mono">${msg}</div>`;
}
function escapeHtml(s) {
  const d = document.createElement("div");
  d.textContent = s ?? "";
  return d.innerHTML;
}

// --- Render de tarjetas de equipo ---
function renderTeams(container, teams) {
  if (!teams.length) {
    container.innerHTML = `<div class="p-8 text-center text-on-surface-variant">No hay equipos para esta temporada.</div>`;
    return;
  }

  container.innerHTML = teams.map(t => {
    const color = t.color_hex || "#e10600";
    const drivers = (t.drivers || []);
    const d1 = drivers[0] || "—";
    const d2 = drivers[1] || "—";
    return `
      <div class="team-card bg-surface-container border border-outline-variant/30 group cursor-pointer relative team-card-expand">
        <div class="absolute left-0 top-0 bottom-0 w-1" style="background:${color}"></div>
        <div class="p-6">
          <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
            <div>
              <p class="font-label-mono text-label-mono uppercase tracking-widest mb-1" style="color:${color}">
                ${escapeHtml(t.full_name)}
              </p>
              <h2 class="font-headline-md text-headline-md text-on-surface uppercase">${escapeHtml(t.name)}</h2>
            </div>
            <div class="mt-4 md:mt-0 flex gap-4">
              <div class="text-right">
                <p class="font-label-mono text-[10px] text-on-surface-variant uppercase">Driver 1</p>
                <p class="font-bold text-on-surface">${escapeHtml(d1)}</p>
              </div>
              <div class="w-[1px] h-10 bg-outline-variant/30"></div>
              <div class="text-right">
                <p class="font-label-mono text-[10px] text-on-surface-variant uppercase">Driver 2</p>
                <p class="font-bold text-on-surface">${escapeHtml(d2)}</p>
              </div>
            </div>
          </div>

          <!-- Contenido expandido al hover -->
          <div class="pt-6 border-t border-outline-variant/20 mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <div class="grid md:grid-cols-2 gap-8">
              <div>
                <h4 class="font-label-mono text-label-mono text-on-surface-variant uppercase mb-2">Technical Profile</h4>
                <p class="text-on-surface-variant font-body-md leading-relaxed">${escapeHtml(t.description || "")}</p>
              </div>
              <div class="space-y-4">
                <div>
                  <h4 class="font-label-mono text-label-mono text-on-surface-variant uppercase mb-1">Headquarters</h4>
                  <p class="font-bold">${escapeHtml(t.headquarters || "—")}</p>
                </div>
                <div>
                  <h4 class="font-label-mono text-label-mono text-on-surface-variant uppercase mb-1">Team Principal</h4>
                  <p class="font-bold">${escapeHtml(t.team_principal || "—")}</p>
                </div>
                <div>
                  <h4 class="font-label-mono text-label-mono text-on-surface-variant uppercase mb-1">Points</h4>
                  <p class="font-stat-value text-stat-value" style="color:${color}">${t.points ?? "—"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>`;
  }).join("");
}

// --- Render del sidebar de standings (mismo layout que tenías) ---
function renderStandingsSidebar(container, standings) {
  container.innerHTML = standings.map((s, i) => {
    const color = s.team_color_hex || "#e10600";
    const isLeader = i === 0;
    // Réplica de tus clases de opacidad por posición
    const bgClass = isLeader
      ? "bg-surface-container-highest border-l-4"
      : i === 1
        ? "bg-surface-container-highest/50"
        : i === 2
          ? "bg-surface-container-highest/30"
          : i === 3
            ? "bg-surface-container-highest/10"
            : "bg-surface-container-highest/5";
    return `
      <div class="grid grid-cols-12 items-center px-2 py-3 ${bgClass}"
           ${isLeader ? `style="border-left-color:${color}"` : ""}>
        <div class="col-span-2 font-label-mono text-lg font-bold">${String(s.position).padStart(2, "0")}</div>
        <div class="col-span-7 font-bold uppercase truncate flex items-center gap-2">
          <span class="inline-block w-1 h-4" style="background:${color}"></span>
          ${escapeHtml(s.team_name)}
        </div>
        <div class="col-span-3 text-right font-label-mono text-lg ${isLeader ? "text-primary-container" : "text-on-surface"}">${s.points}</div>
      </div>`;
  }).join("");
}

// --- Render del bloque "Next Constructor Battle" ---
function renderNextBattle(container, race) {
  if (!race) {
    container.innerHTML = `<p class="font-label-mono text-[10px] text-on-surface-variant uppercase">No hay próxima carrera.</p>`;
    return;
  }
  container.innerHTML = `
    <div class="absolute inset-0 bg-primary-container/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
    <p class="font-label-mono text-[10px] text-on-surface-variant uppercase mb-2 relative z-10">Next Constructor Battle</p>
    <p class="font-bold text-on-surface mb-4 relative z-10">${escapeHtml(race.name)}</p>
    <div class="flex justify-between items-end relative z-10">
      <div class="flex flex-col">
        <span class="text-xs text-on-surface-variant">${fmtDate(race.date_start, { day: "2-digit", month: "short" })} - ${fmtDate(race.date_end, { day: "2-digit" })}</span>
        <span class="text-sm font-bold uppercase">${escapeHtml(race.city)}, ${escapeHtml(race.country)}</span>
      </div>
      <a href="calendar.html" class="bg-transparent border border-white text-white px-4 py-1 text-xs font-bold hover:bg-white hover:text-black transition-colors uppercase">Details</a>
    </div>`;
}

// --- Init ---
async function init() {
  const teamsList = document.getElementById("teams-list");
  const standingsBody = document.getElementById("constructor-standings-body");
  const seasonLabel = document.getElementById("season-label");
  const nextBattle = document.getElementById("next-battle-block");

  showLoading(teamsList);
  showLoading(standingsBody);
  showLoading(nextBattle);

  try {
    // Una sola llamada en paralelo: teams + standings + next race
    const [teamsData, standingsData, nextRace] = await Promise.all([
      getTeams(),
      getConstructorStandings(),
      getNextRace(),
    ]);

    seasonLabel.textContent = `${teamsData.season} SEASON`;

    renderTeams(teamsList, teamsData.teams);
    renderStandingsSidebar(standingsBody, standingsData.standings);
    renderNextBattle(nextBattle, nextRace);
  } catch (err) {
    showError(teamsList, `No se pudieron cargar los equipos: ${err.message}`);
    showError(standingsBody, `No se pudieron cargar los standings: ${err.message}`);
    showError(nextBattle, `No se pudo cargar la próxima carrera: ${err.message}`);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initCommon();
  init(); // la función propia de cada página
});