// js/index.js
import { getHome, fmtDate } from "./api.js";
import { initCommon } from "./search.js";

// --- Helpers ---
function showLoading(node, msg = "Cargando...") {
  if (!node) return;
  node.innerHTML = `<div class="p-8 text-center text-on-surface-variant font-label-mono">${msg}</div>`;
}

function showError(node, msg) {
  if (!node) return;
  node.innerHTML = `<div class="p-8 text-center bg-error-container text-on-error font-label-mono">${msg}</div>`;
}

function escapeHtml(s) {
  const d = document.createElement("div");
  d.textContent = s ?? "";
  return d.innerHTML;
}

// --- Contador en vivo (próxima carrera) ---
let countdownTimer = null;
function startCountdown(targetIso, mountId) {
  if (countdownTimer) clearInterval(countdownTimer);
  const target = new Date(targetIso).getTime();

  function tick() {
    const mount = document.getElementById(mountId);
    if (!mount) { clearInterval(countdownTimer); return; }

    const diff = target - Date.now();
    if (diff <= 0) {
      mount.innerHTML = `<div class="text-primary font-headline-lg text-headline-lg text-center">En curso</div>`;
      clearInterval(countdownTimer);
      return;
    }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    const cell = (val, label) => `
      <div class="bg-surface-container p-4">
        <div class="font-headline-lg text-headline-lg text-primary font-black">${String(val).padStart(2, "0")}</div>
        <div class="font-label-mono text-label-mono uppercase text-on-surface-variant">${label}</div>
      </div>`;
    mount.innerHTML = `<div class="grid grid-cols-4 gap-4 w-full text-center">
      ${cell(d, "Days")}${cell(h, "Hours")}${cell(m, "Min")}${cell(s, "Seg")}
    </div>`;
  }
  tick();
  countdownTimer = setInterval(tick, 1000);
}

// --- Render de la tarjeta "Next Event" ---
function renderNextRace(race) {
  const section = document.getElementById("next-race-section");
  if (!section) return;

  if (!race) {
    section.innerHTML = `<div class="glass-panel p-8 text-center">No hay próximas carreras.</div>`;
    return;
  }

  const raceSession = (race.sessions || []).find(s => s.type === "RACE");
  const target = raceSession ? raceSession.starts_at : `${race.date_start}T00:00:00Z`;

  section.innerHTML = `
    <div class="glass-panel p-8 md:p-12 red-accent-card flex flex-col lg:flex-row justify-between items-center gap-12 overflow-hidden relative">
      <div class="absolute top-0 right-0 p-4 opacity-5">
        <span class="material-symbols-outlined !text-[120px]">timer</span>
      </div>
      <div class="relative z-10 w-full lg:w-1/2">
        <div class="flex items-center gap-4 mb-4">
          <span class="font-label-mono text-label-mono text-primary uppercase tracking-widest">Next Event</span>
          <div class="h-px flex-1 bg-outline-variant/30"></div>
        </div>
        <h2 class="font-headline-xl text-headline-xl mb-2">${escapeHtml(race.name)}</h2>
        <p class="font-headline-md text-headline-md text-on-surface-variant mb-6">${escapeHtml(race.circuit_name)} • ${escapeHtml(race.city)}</p>
        <div class="flex items-center gap-6">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-primary">calendar_today</span>
            <span class="font-body-lg text-body-lg">${fmtDate(race.date_start)}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-primary">public</span>
            <span class="font-body-lg text-body-lg">${escapeHtml(race.country)}</span>
          </div>
        </div>
      </div>
      <div id="countdown-mount" class="relative z-10 w-full lg:w-1/2"></div>
    </div>`;

  startCountdown(target, "countdown-mount");
}

// --- Render de tablas de standings (top N) ---
function renderDriverStandings(rows) {
  const body = document.getElementById("driver-standings-body");
  if (!body) return;
  body.innerHTML = rows.map((r, i) => `
    <tr class="${i % 2 ? "bg-surface-container-low" : ""} border-b border-outline-variant/10 hover:bg-surface-variant transition-colors">
      <td class="p-4 font-black ${i === 0 ? "text-primary" : ""}">${r.position}</td>
      <td class="p-4 flex items-center gap-3">
        <div class="w-1 h-8" style="background:${r.team_color_hex || "#e10600"}"></div>
        <span class="${i === 0 ? "font-bold" : ""}">${escapeHtml(r.driver_name)}</span>
      </td>
      <td class="p-4 text-right ${i === 0 ? "font-black" : ""}">${r.points}</td>
    </tr>`).join("");
}

function renderConstructorStandings(rows) {
  const body = document.getElementById("constructor-standings-body");
  if (!body) return;
  body.innerHTML = rows.map((r, i) => `
    <tr class="${i % 2 ? "bg-surface-container-low" : ""} border-b border-outline-variant/10 hover:bg-surface-variant transition-colors">
      <td class="p-4 font-black ${i === 0 ? "text-primary" : ""}">${r.position}</td>
      <td class="p-4 flex items-center gap-3">
        <div class="w-1 h-8" style="background:${r.team_color_hex || "#e10600"}"></div>
        <span>${escapeHtml(r.team_name)}</span>
      </td>
      <td class="p-4 text-right ${i === 0 ? "font-black" : ""}">${r.points}</td>
    </tr>`).join("");
}

// --- Render de secciones destacadas ---
function renderFeaturedDrivers(drivers) {
  const section = document.getElementById("featured-drivers-section");
  if (!section) return;
  section.innerHTML = `
    <h2 class="font-headline-lg text-headline-lg uppercase mb-8 flex items-center gap-4">
      <span class="material-symbols-outlined text-primary">sports_score</span> Featured Drivers
    </h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      ${drivers.map(d => `
        <div class="bg-surface-container group overflow-hidden border border-outline-variant/20 hover:border-primary/50 transition-all">
          <div class="h-64 overflow-hidden relative">
            <img class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                 src="${d.photo_url || "images/placeholder.png"}"
                 alt="${escapeHtml(d.first_name + " " + d.last_name)}"/>
            <div class="absolute top-4 right-4 bg-primary text-on-primary font-black px-3 py-1 font-stat-value">${d.number ?? "—"}</div>
          </div>
          <div class="p-6 red-accent-card">
            <h4 class="font-headline-md text-headline-md mb-1">${escapeHtml(d.first_name)} ${escapeHtml(d.last_name)}</h4>
            <p class="font-label-mono text-label-mono text-on-surface-variant uppercase mb-4">${escapeHtml(d.team_name)} • ${escapeHtml(d.country_code)}</p>
            <div class="flex justify-between items-center">
              <span class="text-xs uppercase font-label-mono text-on-surface-variant">Position</span>
              <span class="font-stat-value text-stat-value">${d.championship_position ?? "—"}</span>
            </div>
          </div>
        </div>`).join("")}
    </div>`;
}

function renderFeaturedTeams(teams) {
  const section = document.getElementById("featured-teams-section");
  if (!section) return;
  section.innerHTML = `
    <h2 class="font-headline-lg text-headline-lg uppercase mb-8">Engineering Powerhouses</h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      ${teams.map((t, i) => `
        <div class="${i === 0 || i === 3 ? "md:col-span-2" : ""} bg-surface-container-high p-8 flex flex-col md:flex-row gap-8 items-center border border-outline-variant/20 relative overflow-hidden">
          <div class="w-24 h-24 flex-shrink-0 bg-white p-4">
            <img class="w-full h-full object-contain" src="${t.logo_url || "images/placeholder.png"}" alt="${escapeHtml(t.name)}"/>
          </div>
          <div class="flex-1 space-y-4">
            <h3 class="font-headline-lg text-headline-lg uppercase italic">${escapeHtml(t.full_name)}</h3>
            <div class="flex gap-8">
              <div>
                <p class="text-xs font-label-mono text-on-surface-variant uppercase">Drivers</p>
                <p class="font-body-lg">${(t.drivers || []).join(", ") || "—"}</p>
              </div>
              <div>
                <p class="text-xs font-label-mono text-on-surface-variant uppercase">Points</p>
                <p class="font-stat-value text-stat-value text-primary">${t.points ?? "—"}</p>
              </div>
            </div>
          </div>
        </div>`).join("")}
    </div>`;
}

function renderUpcomingRaces(races) {
  const section = document.getElementById("upcoming-races-section");
  if (!section) return;
  section.innerHTML = `
    <div class="flex justify-between items-center mb-8">
      <h2 class="font-headline-lg text-headline-lg uppercase">Race Calendar</h2>
      <div class="hidden md:flex gap-2">
        <button class="p-2 border border-outline-variant hover:bg-primary/10 transition-colors"><span class="material-symbols-outlined">chevron_left</span></button>
        <button class="p-2 border border-outline-variant hover:bg-primary/10 transition-colors"><span class="material-symbols-outlined">chevron_right</span></button>
      </div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1">
      ${races.map(r => `
        <div class="bg-surface-container-low p-6 flex justify-between items-center group hover:bg-surface-variant transition-colors border-l-2 border-transparent hover:border-primary">
          <div>
            <p class="font-label-mono text-label-mono text-primary mb-1">${fmtDate(r.date_start, { day: "2-digit", month: "short" })}</p>
            <h4 class="font-headline-md text-headline-md">${escapeHtml(r.name)}</h4>
            <p class="text-xs text-on-surface-variant uppercase">${escapeHtml(r.circuit_name)}</p>
          </div>
          <span class="material-symbols-outlined text-outline-variant group-hover:text-primary transition-colors">flag</span>
        </div>`).join("")}
    </div>`;
}

function renderFeaturedCircuits(circuits) {
  const section = document.getElementById("featured-circuits-section");
  if (!section) return;
  section.innerHTML = `
    <h2 class="font-headline-lg text-headline-lg uppercase mb-8">Legendary Circuits</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      ${circuits.map(c => `
        <div class="group bg-surface-container overflow-hidden border border-outline-variant/20">
          <div class="h-48 relative overflow-hidden bg-black flex items-center justify-center p-8">
            <img class="max-w-full max-h-full object-contain opacity-80 group-hover:opacity-100 transition-opacity"
                 src="${c.image_url || "images/placeholder.png"}" alt="${escapeHtml(c.name)}"/>
          </div>
          <div class="p-6 red-accent-card">
            <h4 class="font-headline-md text-headline-md uppercase">${escapeHtml(c.short_name || c.name)}</h4>
            <p class="font-label-mono text-label-mono text-on-surface-variant mb-4">${escapeHtml(c.city)}, ${escapeHtml(c.country)}</p>
            <div class="grid grid-cols-2 gap-4 pt-4 border-t border-outline-variant/20">
              <div>
                <p class="text-[10px] uppercase font-label-mono text-on-surface-variant">Length</p>
                <p class="font-stat-value text-sm">${c.length_km ?? "—"} km</p>
              </div>
              <div>
                <p class="text-[10px] uppercase font-label-mono text-on-surface-variant">Laps</p>
                <p class="font-stat-value text-sm">${c.laps ?? "—"}</p>
              </div>
            </div>
          </div>
        </div>`).join("")}
    </div>`;
}

// --- Init ---
async function init() {
  const sections = [
    "next-race-section",
    "featured-drivers-section",
    "featured-teams-section",
    "upcoming-races-section",
    "featured-circuits-section",
  ];
  sections.forEach(id => showLoading(document.getElementById(id)));

  try {
    const home = await getHome();

    renderNextRace(home.next_race);
    renderDriverStandings(home.driver_standings.slice(0, 5));
    renderConstructorStandings(home.constructor_standings.slice(0, 4));
    renderFeaturedDrivers(home.featured_drivers);
    renderFeaturedTeams(home.featured_teams);
    renderUpcomingRaces(home.upcoming_races);
    renderFeaturedCircuits(home.featured_circuits);
  } catch (err) {
    sections.forEach(id => showError(document.getElementById(id), `Error al cargar datos: ${err.message}`));
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initCommon();
  init();
});