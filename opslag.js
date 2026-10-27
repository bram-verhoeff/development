// Versleutelde opslag in de browser (localStorage), beveiligd met het wachtwoord.
// Alle data (leads, verstuurde mails, afzender) staat AES-GCM-versleuteld; de sleutel wordt met
// PBKDF2 afgeleid van het wachtwoord. Het wachtwoord zelf staat nergens in de code, alleen een hash.
// Overzetten naar een ander apparaat: backup downloaden en daar terugzetten (zelfde wachtwoord).

// SHA-256 van "opportunityscanner|" + wachtwoord. Ander wachtwoord? Zie de README.
const WACHTWOORD_HASH = "b2f4c3b81c4915180195fe40651d996a7ae5c7d8f36d7303e0a7ecc151b704d6";
const ZOUT = new TextEncoder().encode("opportunityscanner-kluis-v1");
const KLUIS = "os-kluis";
const SESSIE = "os-sessie"; // sleutel voor dit tabblad, zodat herladen niet opnieuw om het wachtwoord vraagt

const LEEG = () => ({ leads: [], mails: [], afzender: null });
let sleutel = null;
let staat = LEEG();

function naarB64(bytes) {
  const u = new Uint8Array(bytes);
  let s = "";
  for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000));
  return btoa(s);
}
const vanB64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

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

// Schrijfacties na elkaar uitvoeren, zodat een trage schrijfactie een nieuwere niet overschrijft.
let wachtrij = Promise.resolve();
function schrijf() {
  const klaar = wachtrij.then(async () => {
    const tekst = await versleutel(staat);
    try {
      localStorage.setItem(KLUIS, tekst);
    } catch {
      throw new Error("Opslaan mislukt: de opslag van je browser is vol of geblokkeerd. Download een backup.");
    }
  });
  wachtrij = klaar.catch(() => {});
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
    return true;
  } catch {
    vergrendel();
    return false;
  }
}

export function vergrendel() {
  sleutel = null;
  staat = LEEG();
  try {
    sessionStorage.removeItem(SESSIE);
  } catch {}
}

// --- Data ---
export const leads = () => staat.leads;
export const afzender = () => staat.afzender;

/**
 * Slaat gescande leads op. Bestaande leads krijgen nieuwe bedrijfsgegevens, maar hun status en
 * mailgeschiedenis blijven staan. Met alleenNieuw blijven bestaande leads helemaal ongemoeid.
 */
export async function bewaarLeads(nieuw, { alleenNieuw = false } = {}) {
  const opId = new Map(staat.leads.map((l) => [l.id, l]));
  for (const { status, laatstGemaild, gevondenOp, ...gegevens } of nieuw) {
    const bestaand = opId.get(gegevens.id);
    if (!bestaand) {
      const lead = { ...gegevens, status: status || "", laatstGemaild: null, gevondenOp: new Date().toISOString() };
      staat.leads.push(lead);
      opId.set(lead.id, lead);
    } else if (!alleenNieuw) {
      Object.assign(bestaand, gegevens);
    }
  }
  await schrijf();
}

export async function zetStatus(id, status) {
  const lead = staat.leads.find((l) => l.id === id);
  if (lead) lead.status = status;
  await schrijf();
}

/** Legt een mail vast en geeft het tijdstip terug. */
export async function logMail(lead, onderwerp, tekst) {
  const tijd = new Date().toISOString();
  staat.mails.push({ id: lead.id, aan: lead.email, onderwerp, tekst, tijd });
  const opgeslagen = staat.leads.find((l) => l.id === lead.id);
  if (opgeslagen) opgeslagen.laatstGemaild = tijd;
  await schrijf();
  return tijd;
}

export async function bewaarAfzender(nieuweAfzender) {
  staat.afzender = { ...nieuweAfzender };
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
  await schrijf();
}
