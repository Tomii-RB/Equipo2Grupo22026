// js/circuits.js
import { getCircuits, getRaces, getNextRace, fmtDate, fmtTime } from "./api.js";
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

// --- Render de tarjetas de circuito ---
function renderCircuits(container, circuits) {
  if (!circuits.length) {
    container.innerHTML = `<div class="p-8 text-center text-on-surface-variant col-span-full">No hay circuitos.</div>`;
    return;
  }

  container.innerHTML = circuits.map(c => {
    const img = c.image_url || "../images/placeholder.png";
    return `
      <div class="circuit-card group relative bg-surface-container overflow-hidden aspect-[4/5] border border-outline-variant/30 hover:border-primary-container transition-all duration-300">
        <div class="card-glint absolute inset-0 w-1/2 -skew-x-12 -translate-x-full"></div>
        <div class="absolute top-0 left-0 w-1 h-full bg-primary-container"></div>
        <div class="absolute inset-0 z-0">
          <img class="w-full h-full object-cover grayscale brightness-50 group-hover:grayscale-0 transition-all duration-500"
               src="${img}" alt="${escapeHtml(c.name)}"/>
        </div>
        <div class="relative z-10 p-6 h-full flex flex-col justify-between">
          <div>
            <span class="font-label-mono text-label-mono text-primary-container block mb-1">${escapeHtml(c.country).toUpperCase()}</span>
            <h3 class="font-headline-md text-headline-md uppercase">${escapeHtml(c.short_name || c.name)}</h3>
          </div>
          <div class="details-overlay opacity-0 transform translate-y-4 transition-all duration-300 bg-surface-container-highest/90 backdrop-blur-md p-4 border border-outline-variant/20">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="font-label-mono text-[10px] text-on-surface-variant uppercase">Length</p>
                <p class="font-stat-value text-stat-value">${c.length_km ?? "—"} KM</p>
              </div>
              <div>
                <p class="font-label-mono text-[10px] text-on-surface-variant uppercase">Laps</p>
                <p class="font-stat-value text-stat-value">${c.laps ?? "—"}</p>
              </div>
              <div class="col-span-2">
                <p class="font-label-mono text-[10px] text-on-surface-variant uppercase">Race Distance</p>
                <p class="font-stat-value text-stat-value">${c.race_distance_km ?? "—"} KM</p>
              </div>
            </div>
            <button class="mt-4 w-full bg-primary-container text-white py-2 font-headline-md text-sm uppercase transition-transform active:scale-95">Track Intel</button>
          </div>
        </div>
      </div>`;
  }).join("");
}

// --- Render del sidebar "Race Schedule" (próximas 4 carreras) ---
function renderRaceSchedule(container, races) {
  const upcoming = races
    .filter(r => r.status === "next" || r.status === "upcoming")
    .slice(0, 4);

  if (!upcoming.length) {
    container.innerHTML = `<p class="text-center text-on-surface-variant font-label-mono text-sm">No hay carreras próximas.</p>`;
    return;
  }

  container.innerHTML = upcoming.map((r, i) => {
    const d = new Date(r.date_start + "T00:00:00Z");
    const day = new Intl.DateTimeFormat("es-ES", { day: "2-digit", timeZone: "UTC" }).format(d);
    const mon = new Intl.DateTimeFormat("es-ES", { month: "short", timeZone: "UTC" }).format(d).toUpperCase().slice(0, 3);

    // Buscar primera sesión de la carrera para mostrar un horario representativo
    const firstSession = (r.sessions || [])[0];
    const sessionInfo = firstSession
      ? `${firstSession.type} • ${fmtTime(firstSession.starts_at)}`
      : "Horario a confirmar";

    return `
      <div class="group cursor-pointer">
        <div class="flex items-start gap-4">
          <div class="flex flex-col items-center">
            <span class="font-label-mono text-[10px] text-on-surface-variant uppercase">${mon}</span>
            <span class="font-stat-value text-stat-value ${i === 0 ? "text-primary-container" : ""}">${day}</span>
          </div>
          <div class="flex-1">
            <p class="font-label-mono text-[10px] text-on-surface-variant mb-1">${escapeHtml(r.country).toUpperCase()}</p>
            <h4 class="font-body-md font-bold uppercase group-hover:text-primary-container transition-colors">${escapeHtml(r.circuit_name)}</h4>
            <p class="text-[12px] text-on-surface-variant/80 mt-1">${escapeHtml(sessionInfo)}</p>
          </div>
        </div>
        ${i < upcoming.length - 1 ? `<div class="h-[1px] w-full bg-outline-variant/20 mt-4"></div>` : ""}
      </div>`;
  }).join("");
}

// --- Contador "Next Telemetry Drop" ---
let countdownTimer = null;
function renderNextTelemetry(container, race) {
  if (!race) {
    container.innerHTML = `<p class="font-label-mono text-[11px] text-primary-container uppercase">No hay próxima carrera.</p>`;
    return;
  }

  const raceSession = (race.sessions || []).find(s => s.type === "RACE");
  const targetIso = raceSession ? raceSession.starts_at : `${race.date_start}T00:00:00Z`;
  const target = new Date(targetIso).getTime();

  container.innerHTML = `
    <p class="font-label-mono text-[11px] text-primary-container uppercase mb-2">Next Telemetry Drop</p>
    <div id="telemetry-countdown" class="flex items-end gap-1"></div>
    <p class="font-label-mono text-[10px] text-on-surface-variant mt-2 uppercase">${escapeHtml(race.name)}</p>
  `;

  if (countdownTimer) clearInterval(countdownTimer);

  function tick() {
    const mount = document.getElementById("telemetry-countdown");
    if (!mount) { clearInterval(countdownTimer); return; }

    const diff = target - Date.now();
    if (diff <= 0) {
      mount.innerHTML = `<span class="font-stat-value text-xl text-primary-container">En curso</span>`;
      clearInterval(countdownTimer);
      return;
    }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);

    mount.innerHTML = `
      <span class="font-stat-value text-3xl">${String(d).padStart(2, "0")}</span>
      <span class="font-label-mono text-[10px] pb-1 mr-2 text-on-surface-variant">DAYS</span>
      <span class="font-stat-value text-3xl">${String(h).padStart(2, "0")}</span>
      <span class="font-label-mono text-[10px] pb-1 mr-2 text-on-surface-variant">HRS</span>
      <span class="font-stat-value text-3xl">${String(m).padStart(2, "0")}</span>
      <span class="font-label-mono text-[10px] pb-1 text-on-surface-variant">MIN</span>
    `;
  }
  tick();
  countdownTimer = setInterval(tick, 60000); // actualiza cada minuto alcanza
}

// --- Init ---
async function init() {
  const grid = document.getElementById("circuits-grid");
  const schedule = document.getElementById("race-schedule");
  const telemetry = document.getElementById("next-telemetry");

  showLoading(grid);
  showLoading(schedule);
  showLoading(telemetry);

  try {
    const [circuitsData, racesData, nextRace] = await Promise.all([
      getCircuits(),
      getRaces(),
      getNextRace(),
    ]);

    renderCircuits(grid, circuitsData.circuits);
    renderRaceSchedule(schedule, racesData.races);
    renderNextTelemetry(telemetry, nextRace);
  } catch (err) {
    showError(grid, `No se pudieron cargar los circuitos: ${err.message}`);
    showError(schedule, `No se pudo cargar el calendario: ${err.message}`);
    showError(telemetry, `No se pudo cargar la próxima carrera: ${err.message}`);
  }
}

// --- Interacción de las tarjetas (el click para mostrar overlay en mobile) ---
// La dejamos igual que tu script original, pero delegada para que funcione
// con elementos creados dinámicamente.
document.addEventListener("click", (e) => {
  const card = e.target.closest(".circuit-card");
  if (!card) return;
  const overlay = card.querySelector(".details-overlay");
  if (!overlay) return;

  const isVisible = overlay.classList.contains("opacity-100");

  document.querySelectorAll(".details-overlay").forEach(o => {
    o.classList.remove("opacity-100", "translate-y-0");
    o.classList.add("opacity-0", "translate-y-4");
  });

  if (!isVisible) {
    overlay.classList.remove("opacity-0", "translate-y-4");
    overlay.classList.add("opacity-100", "translate-y-0");
  }
});

document.addEventListener("DOMContentLoaded", () => {
  initCommon();
  init(); // la función propia de cada página
});