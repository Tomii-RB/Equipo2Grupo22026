// js/api.js
import { API_BASE } from "./config.js";
import { initCommon } from "./search.js";

async function getJSON(endpoint, params = {}) {
  const url = new URL(API_BASE + endpoint);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== null && v !== undefined) url.searchParams.append(k, v);
  });

  const res = await fetch(url.toString());
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { msg = (await res.json()).error || msg; } catch {}
    throw new Error(msg);
  }
  return res.json();
}

export const getHome                 = ()       => getJSON("/home");
export const getDrivers              = (season) => getJSON("/drivers", { season });
export const getTeams                = (season) => getJSON("/teams", { season });
export const getCircuits             = ()       => getJSON("/circuits");
export const getRaces                = (season) => getJSON("/races", { season });
export const getNextRace             = ()       => getJSON("/races/next");
export const getDriverStandings      = (season) => getJSON("/standings/drivers", { season });
export const getConstructorStandings = (season) => getJSON("/standings/constructors", { season });
export const search                  = (q)      => getJSON("/search", { q });

// Helpers de fechas (UTC -> hora local con Intl)
export function fmtDate(iso, opts = {}) {
  if (!iso) return "—";
  const d = new Date(iso.length === 10 ? iso + "T00:00:00Z" : iso);
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC", ...opts }).format(d);
}
export function fmtTime(iso) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso));
}
export function fmtRange(startIso, endIso) {
  if (!startIso || !endIso) return "—";
  const s = new Date(startIso + "T00:00:00Z");
  const e = new Date(endIso   + "T00:00:00Z");
  const dOpt = { day: "2-digit", timeZone: "UTC" };
  const mOpt = { month: "short", timeZone: "UTC" };
  return `${new Intl.DateTimeFormat("es-ES", dOpt).format(s)}-${new Intl.DateTimeFormat("es-ES", dOpt).format(e)} ${new Intl.DateTimeFormat("es-ES", mOpt).format(e).toUpperCase()}`;
}