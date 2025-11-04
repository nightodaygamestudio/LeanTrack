// /app/i18n/i18n.js
const I18N_CACHE_PREFIX = 'lt_i18n_';
const I18N_MANIFEST_URL = '/app/i18n/manifest.json';

async function fetchJson(url) {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`i18n fetch failed: ${url} ${res.status}`);
  return res.json();
}

async function loadManifest() {
  const m = await fetchJson(I18N_MANIFEST_URL);
  if (!m || !Array.isArray(m.languages)) throw new Error('Invalid i18n manifest');
  return m;
}

function getCachedLang(code) {
  try { return JSON.parse(localStorage.getItem(I18N_CACHE_PREFIX + code) || 'null'); }
  catch { return null; }
}
function setCachedLang(code, data) {
  try { localStorage.setItem(I18N_CACHE_PREFIX + code, JSON.stringify(data)); } catch {}
}

export async function getLanguages() {
  const m = await loadManifest();
  return m.languages;
}

export async function loadStrings(code) {
  const manifest = await loadManifest();
  const def = manifest.default || 'en';
  const langs = manifest.languages;

  const defEntry = langs.find(l => l.code === def);
  const reqEntry = langs.find(l => l.code === code) || defEntry;

  // Try cache first
  const cachedReq = getCachedLang(reqEntry.code);
  const cachedDef = getCachedLang(defEntry.code);

  let base = cachedDef || await fetchJson(defEntry.path);
  if (!cachedDef) setCachedLang(defEntry.code, base);

  if (reqEntry.code === defEntry.code) return base;

  let overlay = cachedReq || null;
  if (!overlay) {
    try {
      overlay = await fetchJson(reqEntry.path);
      setCachedLang(reqEntry.code, overlay);
    } catch {
      // fallback if missing
      overlay = {};
    }
  }

  // Deep merge (shallow is enough hier, Keys = flat)
  return { ...base, ...overlay };
}
