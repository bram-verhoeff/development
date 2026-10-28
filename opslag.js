// Versleutelde opslag in de browser (localStorage), beveiligd met het wachtwoord.
// Alle data (leads, verstuurde mails, afzender) staat AES-GCM-versleuteld; de sleutel wordt met
// PBKDF2 afgeleid van het wachtwoord. Het wachtwoord zelf staat nergens in de code, alleen een hash.
// Online opslag (optioneel): dezelfde versleutelde kluis in een geheime GitHub Gist, zodat elk
// apparaat dezelfde gegevens heeft. GitHub ziet alleen versleutelde tekst.

// SHA-256 van "opportunityscanner|" + wachtwoord. Ander wachtwoord? Zie de README.
const WACHTWOORD_HASH = "b2f4c3b81c4915180195fe40651d996a7ae5c7d8f36d7303e0a7ecc151b704d6";
const ZOUT = new TextEncoder().encode("opportunityscanner-kluis-v1");
const KLUIS = "os-kluis";
const SESSIE = "os-sessie"; // sleutel voor dit tabblad, zodat herladen niet opnieuw om het wachtwoord vraagt
const WOLK = "os-wolk"; // versleutelde GitHub-token en gist-id van de online opslag

const GIST_BESCHRIJVING = "OpportunityScanner kluis (versleuteld)";
const GIST_BESTAND = "kluis.json";

const LEEG = () => ({ leads: [], mails: [], afzender: null, afzenderTijd: null });
let sleutel = null;
let staat = LEEG();

function naarB64(bytes) {
  const u = new Uint8Array(bytes);
  let s = "";
  for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000));
  return btoa(s);
}
const vanB64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const nu = () => new Date().toISOString();

async function hash(wachtwoord) {
  const h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`opportunityscanner|${wachtwoord}`));
  return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function leidSleutelAf(wachtwoord) {
  const basis = await crypto.subtle.importKey("raw", new TextEncoder().encode(wachtwoord), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: ZOUT, iterations: 250_000, hash: "SHA-256" },
    basis,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );
}

async function versleutel(obj) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, sleutel, new TextEncoder().encode(JSON.stringify(obj)));
  return JSON.stringify({ app: "opportunityscanner", v: 1, iv: naarB64(iv), data: naarB64(data) });
}

async function ontsleutel(tekst) {
  const k = JSON.parse(tekst);
  if (k?.app !== "opportunityscanner" || k.v !== 1) throw new Error("onbekend formaat");
  const data = await crypto.subtle.decrypt({ name: "AES-GCM", iv: vanB64(k.iv) }, sleutel, vanB64(k.data));
  return JSON.parse(new TextDecoder().decode(data));
}

function lees(k) {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
}

async function laadKluis() {
  const tekst = lees(KLUIS);
  staat = { ...LEEG(), ...(tekst ? await ontsleutel(tekst) : {}) };
}

async function schrijfLokaal() {
  const tekst = await versleutel(staat);
  try {
    localStorage.setItem(KLUIS, tekst);
  } catch {
    throw new Error("Opslaan mislukt: de opslag van je browser is vol of geblokkeerd. Download een backup.");
  }
}

// Schrijfacties na elkaar uitvoeren, zodat een trage schrijfactie een nieuwere niet overschrijft.
let wachtrij = Promise.resolve();
function schrijf() {
  const klaar = wachtrij.then(schrijfLokaal);
  wachtrij = klaar.catch(() => {});
  klaar.then(planSync, () => {});
  return klaar;
}

// --- Ontgrendelen ---
export async function ontgrendel(wachtwoord) {
  if ((await hash(wachtwoord)) !== WACHTWOORD_HASH) throw new Error("Onjuist wachtwoord.");
  sleutel = await leidSleutelAf(wachtwoord);
  try {
    await laadKluis();
  } catch {
    // Versleuteld met een ander (oud) wachtwoord: apart zetten in plaats van weggooien, en leeg beginnen.
    try {
      localStorage.setItem(`${KLUIS}-onleesbaar`, lees(KLUIS));
      localStorage.removeItem(KLUIS);
    } catch {}
    staat = LEEG();
  }
  await laadWolk();
  try {
    sessionStorage.setItem(SESSIE, naarB64(await crypto.subtle.exportKey("raw", sleutel)));
  } catch {}
}

/** Ontgrendelt opnieuw met de sleutel van dit tabblad (na herladen). */
export async function herstelSessie() {
  let ruw = null;
  try {
    ruw = sessionStorage.getItem(SESSIE);
  } catch {}
  if (!ruw) return false;
  try {
    sleutel = await crypto.subtle.importKey("raw", vanB64(ruw), "AES-GCM", true, ["encrypt", "decrypt"]);
    await laadKluis();
    await laadWolk();
    return true;
  } catch {
    vergrendel();
    return false;
  }
}

export function vergrendel() {
  sleutel = null;
  staat = LEEG();
  wolk = null;
  clearTimeout(syncTimer);
  meldSync({ soort: "uit" });
  try {
    sessionStorage.removeItem(SESSIE);
  } catch {}
}

// --- Data ---
export const leads = () => staat.leads;
export const afzender = () => staat.afzender;
export const mails = () => staat.mails;

/**
 * Slaat gescande leads op. Bestaande leads krijgen nieuwe bedrijfsgegevens, maar hun status en
 * mailgeschiedenis blijven staan. Met alleenNieuw blijven bestaande leads helemaal ongemoeid.
 */
export async function bewaarLeads(nieuw, { alleenNieuw = false } = {}) {
  const opId = new Map(staat.leads.map((l) => [l.id, l]));
  for (const { status, laatstGemaild, gevondenOp, gewijzigd, ...gegevens } of nieuw) {
    const bestaand = opId.get(gegevens.id);
    if (!bestaand) {
      const lead = { ...gegevens, status: status || "", laatstGemaild: null, gevondenOp: nu(), gewijzigd: nu() };
      staat.leads.push(lead);
      opId.set(lead.id, lead);
    } else if (!alleenNieuw) {
      Object.assign(bestaand, gegevens, { gewijzigd: nu() });
    }
  }
  await schrijf();
}

// Statussen waarbij een lead klaar is: geen opvolging meer nodig
export const AFGEROND = ["klant", "heeft_website", "geen_interesse"];
const OPVOLGEN_NA_DAGEN = 7;

/** Datum (JJJJ-MM-DD, lokale tijd) over een aantal dagen. */
export function overDagen(dagen) {
  const d = new Date();
  d.setDate(d.getDate() + dagen);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export async function zetStatus(id, status) {
  const lead = staat.leads.find((l) => l.id === id);
  if (lead && (lead.status || "") !== status) {
    lead.historie = [...(lead.historie || []), { status, tijd: nu() }];
    // Benaderd: vanzelf over een week opvolgen; afgerond: niet meer opvolgen
    if (status === "benaderd" && !lead.opvolgen) lead.opvolgen = overDagen(OPVOLGEN_NA_DAGEN);
    if (AFGEROND.includes(status)) lead.opvolgen = null;
    Object.assign(lead, { status, gewijzigd: nu() });
  }
  await schrijf();
}

/** Notitie en opvolgdatum van een lead bijwerken. */
export async function werkLeadBij(id, velden) {
  const lead = staat.leads.find((l) => l.id === id);
  if (!lead) return;
  for (const k of ["notitie", "opvolgen"]) if (k in velden) lead[k] = velden[k] || null;
  lead.gewijzigd = nu();
  await schrijf();
}

/** Legt een mail vast en geeft het tijdstip terug. */
export async function logMail(lead, onderwerp, tekst) {
  const tijd = nu();
  staat.mails.push({ id: lead.id, aan: lead.email, onderwerp, tekst, tijd });
  const opgeslagen = staat.leads.find((l) => l.id === lead.id);
  if (opgeslagen) Object.assign(opgeslagen, { laatstGemaild: tijd, gewijzigd: tijd });
  await schrijf();
  return tijd;
}

export async function bewaarAfzender(nieuweAfzender) {
  staat.afzender = { ...nieuweAfzender };
  staat.afzenderTijd = nu();
  await schrijf();
}

// --- Backup ---
/** Versleuteld backupbestand (alleen te openen met hetzelfde wachtwoord). */
export const maakBackup = () => versleutel(staat);

export async function zetBackupTerug(tekst) {
  let nieuw;
  try {
    nieuw = await ontsleutel(tekst);
  } catch {
    throw new Error("Dit backupbestand is ongeldig of met een ander wachtwoord gemaakt.");
  }
  staat = { ...LEEG(), ...nieuw };
  // De backup vervangt ook de online kopie, anders zou synchroniseren de oude gegevens terugmengen
  await schrijf();
  if (wolk) await sync({ overschrijf: true });
}

// --- Online opslag (GitHub Gist) ---
let wolk = null; // { token, gistId }
let syncTimer;
let syncBezig = null;
const luisteraars = { sync: new Set(), wijziging: new Set() };
let laatsteSync = { soort: "uit" };

/** Meldingen over de online opslag: { soort: "uit" | "bezig" | "ok" | "fout", tijd?, fout? }. */
export function opSyncStatus(cb) {
  luisteraars.sync.add(cb);
  cb(laatsteSync);
}
/** Wordt aangeroepen als er wijzigingen van een ander apparaat zijn binnengekomen. */
export function opWijziging(cb) {
  luisteraars.wijziging.add(cb);
}
function meldSync(s) {
  laatsteSync = s;
  luisteraars.sync.forEach((cb) => cb(s));
}

export const wolkGekoppeld = () => Boolean(wolk);

async function laadWolk() {
  const tekst = lees(WOLK);
  wolk = null;
  if (!tekst) return meldSync({ soort: "uit" });
  try {
    wolk = await ontsleutel(tekst);
  } catch {
    return meldSync({ soort: "uit" });
  }
  sync().catch(() => {});
}

async function github(pad, { methode = "GET", body, token = wolk?.token } = {}) {
  let r;
  try {
    r = await fetch(`https://api.github.com${pad}`, {
      method: methode,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
  } catch {
    throw new Error("Geen verbinding met GitHub.");
  }
  if (r.status === 401) throw new Error("GitHub-token is ongeldig of verlopen.");
  if (r.status === 403 || r.status === 404) throw new Error("Geen toegang: geef de token het recht 'gist'.");
  if (!r.ok) throw new Error(`GitHub gaf een fout (${r.status}).`);
  return r.json();
}

async function leesGist(gist) {
  const bestand = gist.files?.[GIST_BESTAND];
  if (!bestand) return null;
  if (!bestand.truncated) return bestand.content;
  // Grote bestanden levert de API ingekort; dan de volledige inhoud apart ophalen
  const r = await fetch(bestand.raw_url, { cache: "no-store" });
  if (!r.ok) throw new Error("Kon de online kluis niet ophalen.");
  return r.text();
}

const tijdVan = (lead) => lead.gewijzigd || lead.gevondenOp || "";

/** Voegt twee versies samen: per lead wint de laatst gewijzigde, mails worden samengevoegd. */
function voegSamen(a, b) {
  const leads = new Map(a.leads.map((l) => [l.id, l]));
  for (const l of b.leads) {
    const bestaand = leads.get(l.id);
    if (!bestaand || tijdVan(l) > tijdVan(bestaand)) leads.set(l.id, l);
  }
  const mails = new Map([...a.mails, ...b.mails].map((m) => [`${m.id}|${m.tijd}`, m]));
  const afzenderVan = (b.afzenderTijd || "") > (a.afzenderTijd || "") ? b : a;
  return {
    ...LEEG(),
    leads: [...leads.values()],
    mails: [...mails.values()].sort((x, y) => x.tijd.localeCompare(y.tijd)),
    afzender: afzenderVan.afzender,
    afzenderTijd: afzenderVan.afzenderTijd,
  };
}

function planSync() {
  if (!wolk) return;
  clearTimeout(syncTimer);
  // Even wachten, zodat snel achter elkaar wijzigen één upload wordt
  syncTimer = setTimeout(() => sync().catch(() => {}), 1500);
}

/** Haalt de online versie op, voegt samen met deze browser en zet het resultaat terug online. */
export function sync({ overschrijf = false } = {}) {
  if (!wolk) return Promise.resolve();
  if (syncBezig) return syncBezig.then(() => sync({ overschrijf }));
  syncBezig = (async () => {
    meldSync({ soort: "bezig" });
    try {
      const gist = await github(`/gists/${wolk.gistId}`);
      const tekst = overschrijf ? null : await leesGist(gist);
      let online = LEEG();
      if (tekst) {
        try {
          online = { ...LEEG(), ...(await ontsleutel(tekst)) };
        } catch {
          throw new Error("De online kluis is met een ander wachtwoord versleuteld.");
        }
      }
      const samen = voegSamen(staat, online);
      const lokaalVeranderd = JSON.stringify(samen) !== JSON.stringify({ ...LEEG(), ...staat });
      if (lokaalVeranderd) {
        staat = samen;
        await schrijfLokaal();
        luisteraars.wijziging.forEach((cb) => cb());
      }
      if (overschrijf || JSON.stringify(samen) !== JSON.stringify(online)) {
        await github(`/gists/${wolk.gistId}`, { methode: "PATCH", body: { files: { [GIST_BESTAND]: { content: await versleutel(staat) } } } });
      }
      meldSync({ soort: "ok", tijd: nu() });
    } catch (err) {
      meldSync({ soort: "fout", fout: err.message });
      throw err;
    } finally {
      syncBezig = null;
    }
  })();
  return syncBezig;
}

/** Koppelt de online opslag: zoekt een bestaande kluis-gist van dit account, of maakt een nieuwe (geheim). */
export async function koppelWolk(token) {
  token = token.trim();
  if (!token) throw new Error("Vul een GitHub-token in.");
  let gistId = null;
  for (let pagina = 1; pagina <= 10 && !gistId; pagina++) {
    const gists = await github(`/gists?per_page=100&page=${pagina}`, { token });
    gistId = gists.find((g) => g.description === GIST_BESCHRIJVING && g.files?.[GIST_BESTAND])?.id ?? null;
    if (gists.length < 100) break;
  }
  if (!gistId) {
    const gist = await github("/gists", {
      methode: "POST",
      token,
      body: { description: GIST_BESCHRIJVING, public: false, files: { [GIST_BESTAND]: { content: await versleutel(staat) } } },
    });
    gistId = gist.id;
  }
  wolk = { token, gistId };
  try {
    localStorage.setItem(WOLK, await versleutel(wolk));
  } catch {}
  await sync();
}

/** Ontkoppelt deze browser; de online kluis zelf blijft bestaan. */
export function ontkoppelWolk() {
  wolk = null;
  clearTimeout(syncTimer);
  try {
    localStorage.removeItem(WOLK);
  } catch {}
  meldSync({ soort: "uit" });
}

// Bij terugkeren naar het tabblad de wijzigingen van andere apparaten ophalen
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && wolk) sync().catch(() => {});
});
// Weer online na offline werken: de tussentijdse wijzigingen alsnog uploaden
addEventListener("online", () => wolk && sync().catch(() => {}));
