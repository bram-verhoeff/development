// Zoeklogica: OpenStreetMap (Nominatim + Overpass) -> bedrijven zonder eigen website.
// Zelfde regels als OpportunityScanner/scanner.py.

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
// Andere publieke Overpass-servers (private.coffee, kumi, mail.ru) bleken onbetrouwbaar:
// time-outs, 504's of een lege uitkomst omdat ze de gebiedsdata missen.
const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const POGINGEN = 8;

// Nederlandse categorie -> OSM-tags als [sleutel, waarde-regex]; null = elke waarde.
export const CATEGORIEEN = {
  kapper: [["shop", "hairdresser"]],
  schoonheidssalon: [["shop", "beauty"]],
  bakker: [["shop", "bakery"]],
  slager: [["shop", "butcher"]],
  bloemist: [["shop", "florist"]],
  kledingwinkel: [["shop", "clothes"]],
  juwelier: [["shop", "jewelry"]],
  opticien: [["shop", "optician"]],
  fietsenmaker: [["shop", "bicycle"]],
  garage: [["shop", "car_repair"]],
  tattoo: [["shop", "tattoo"]],
  restaurant: [["amenity", "restaurant"]],
  cafe: [["amenity", "cafe|pub|bar"]],
  snackbar: [["amenity", "fast_food"]],
  loodgieter: [["craft", "plumber"]],
  elektricien: [["craft", "electrician"]],
  schilder: [["craft", "painter"]],
  timmerman: [["craft", "carpenter"]],
  aannemer: [["craft", "builder"]],
  hovenier: [["craft", "gardener"]],
  tandarts: [["amenity", "dentist"]],
  fysiotherapeut: [["healthcare", "physiotherapist"]],
};
const ALLES = [
  ["shop", null],
  ["craft", null],
  ["healthcare", null],
  ["amenity", "restaurant|cafe|pub|bar|fast_food|dentist"],
];

const WEBSITE_TAGS = ["website", "contact:website", "url"];
const EMAIL_TAGS = ["email", "contact:email"];
const SOCIAL_TAGS = ["contact:facebook", "facebook", "contact:instagram", "instagram"];
// Een Facebook/Instagram-pagina telt niet als eigen website.
const SOCIAL_DOMEINEN = ["facebook.com", "instagram.com", "linkedin.com", "twitter.com", "x.com", "tiktok.com", "linktr.ee"];

// Mailproviders: een adres hierop zegt niets over een eigen website.
const MAILPROVIDERS = new Set([
  "gmail.com", "googlemail.com", "hotmail.com", "hotmail.nl", "outlook.com", "outlook.nl", "live.com", "live.nl",
  "msn.com", "yahoo.com", "yahoo.nl", "icloud.com", "me.com", "mac.com", "aol.com", "protonmail.com", "proton.me",
  "gmx.com", "gmx.net", "gmx.de", "web.de", "t-online.de", "telenet.be", "skynet.be",
  "ziggo.nl", "kpnmail.nl", "kpnplanet.nl", "planet.nl", "home.nl", "hetnet.nl", "xs4all.nl", "chello.nl",
  "casema.nl", "quicknet.nl", "zeelandnet.nl", "upcmail.nl", "tele2.nl", "online.nl", "telfort.nl",
  "versatel.nl", "solcon.nl", "onsbrabantnet.nl", "caiway.nl", "kabelfoon.nl", "freeler.nl", "wxs.nl",
]);

/** Het domein van een e-mailadres als dat een eigen domein is (dan is er waarschijnlijk een website), anders "". */
export function eigenDomein(email) {
  const domein = String(email).split("@")[1]?.trim().toLowerCase() || "";
  return domein && !MAILPROVIDERS.has(domein) ? domein : "";
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function past(tags, filters) {
  return filters.some(([k, v]) => k in tags && (v === null || new RegExp(`^(${v})$`).test(tags[k])));
}

function tagFilter([k, v]) {
  return v === null ? `["${k}"]` : `["${k}"~"^(${v})$"]`;
}

/** 'geen_website', 'alleen_social' of null (heeft een website / niet relevant). */
export function classificeer(tags) {
  if (!tags.name || tags.brand || tags["brand:wikidata"]) return null; // naamloos of een keten
  if (["vacant", "no"].includes(tags.shop) || Object.keys(tags).some((k) => /^(disused|abandoned):/.test(k))) return null;
  const url = WEBSITE_TAGS.map((k) => tags[k]).find(Boolean) || "";
  if (url && !SOCIAL_DOMEINEN.some((d) => url.toLowerCase().includes(d))) return null;
  if (url || SOCIAL_TAGS.some((k) => k in tags)) return "alleen_social";
  return "geen_website";
}

function categorieVan(tags) {
  const naam = Object.keys(CATEGORIEEN).find((c) => past(tags, CATEGORIEEN[c]));
  if (naam) return naam;
  const [k] = ALLES.find((f) => past(tags, [f])) || [];
  return k ? `${k}=${tags[k]}` : "overig";
}

async function zoekGebied(plaats) {
  const params = new URLSearchParams({ q: plaats, countrycodes: "nl", format: "jsonv2", limit: 5, "accept-language": "nl" });
  const r = await fetch(`${NOMINATIM_URL}?${params}`);
  if (!r.ok) throw new Error(`Plaats zoeken mislukt (${r.status})`);
  const res = (await r.json()).find((x) => x.osm_type === "relation");
  if (!res) throw new Error(`Plaats '${plaats}' niet gevonden in OpenStreetMap.`);
  return { id: 3600000000 + Number(res.osm_id), naam: res.display_name };
}

async function overpass(query, plaats, onStatus) {
  for (let poging = 1; poging <= POGINGEN; poging++) {
    const start = Date.now();
    const tik = () => onStatus(`Bedrijven ophalen in ${plaats} (${Math.round((Date.now() - start) / 1000)}s)`);
    tik();
    const timer = setInterval(tik, 1000);
    try {
      const r = await fetch(OVERPASS_URL, {
        method: "POST",
        body: new URLSearchParams({ data: query }),
        signal: AbortSignal.timeout(180_000),
      });
      if (r.ok) {
        const elementen = (await r.json()).elements;
        // De query geeft het gebied zelf ook terug; ontbreekt dat, dan kende de server
        // het gebied (nog) niet (lege uitkomst zonder foutmelding) en proberen we opnieuw.
        if (elementen.some((el) => el.type === "area")) return elementen.filter((el) => el.type !== "area");
      } else if (![429, 502, 503, 504].includes(r.status)) {
        throw new Error(`Overpass fout ${r.status}`);
      }
    } catch (e) {
      if (e.message.startsWith("Overpass fout")) throw e;
      // Netwerk-/CORS-fout (bv. 429 zonder CORS-header) of time-out: opnieuw proberen.
    } finally {
      clearInterval(timer);
    }
    if (poging === POGINGEN) break;
    for (let s = Math.min(5 * poging, 30); s > 0; s--) {
      onStatus(`Server is druk, poging ${poging + 1} van ${POGINGEN} over ${s}s`);
      await sleep(1000);
    }
  }
  throw new Error("De OpenStreetMap-server blijft druk, probeer het later opnieuw.");
}

/**
 * Scant plaatsen op bedrijven zonder eigen website.
 * @param {string[]} plaatsen
 * @param {string[]} categorieen  namen uit CATEGORIEEN, of leeg voor alles
 * @param {(tekst: string) => void} onStatus
 */
export async function scan(plaatsen, categorieen, onStatus = () => {}) {
  const filters = categorieen.length ? categorieen.flatMap((c) => CATEGORIEEN[c]) : ALLES;
  const gezien = new Set();
  const leads = [];
  let totaal = 0;

  for (const [i, plaats] of plaatsen.entries()) {
    onStatus(`Plaats zoeken: ${plaats}...`);
    if (i > 0) await sleep(1000); // Nominatim staat max. 1 aanvraag per seconde toe
    const gebied = await zoekGebied(plaats);

    // Alleen bedrijven met een openbaar e-mailadres (email of contact:email).
    const query =
      `[out:json][timeout:170];\narea(id:${gebied.id})->.a;\n(\n` +
      filters.flatMap((f) => EMAIL_TAGS.map((e) => `  nwr${tagFilter(f)}["${e}"](area.a);`)).join("\n") +
      `\n);\nout center tags;\n.a out ids;`;
    const elementen = await overpass(query, plaats, onStatus);
    totaal += elementen.length;

    for (const el of elementen) {
      const id = `${el.type}/${el.id}`;
      if (gezien.has(id)) continue;
      gezien.add(id);
      const tags = el.tags || {};
      const type = classificeer(tags);
      const email = EMAIL_TAGS.map((k) => tags[k]).find(Boolean);
      if (!type || !email) continue;
      const straat = [tags["addr:street"], tags["addr:housenumber"]].filter(Boolean).join(" ");
      const stad = tags["addr:city"] || plaats;
      leads.push({
        id,
        naam: tags.name,
        categorie: categorieVan(tags),
        gebied: plaats,
        adres: [straat, tags["addr:postcode"]].filter(Boolean).join(", "),
        plaats: stad,
        telefoon: tags.phone || tags["contact:phone"] || "",
        email,
        eigenDomein: eigenDomein(email),
        type,
        social: [...WEBSITE_TAGS, ...SOCIAL_TAGS].map((k) => tags[k]).find(Boolean) || "",
        lat: el.lat ?? el.center?.lat,
        lon: el.lon ?? el.center?.lon,
        googleMaps:
          "https://www.google.com/maps/search/?api=1&query=" +
          encodeURIComponent([tags.name, straat, stad].filter(Boolean).join(" ")),
        osm: `https://www.openstreetmap.org/${id}`,
      });
    }
  }

  return { leads: sorteer(leads), totaal };
}

/** Beste kansen eerst: e-mail bij een mailprovider, dus waarschijnlijk echt geen website. */
export function sorteer(leads) {
  return leads.sort(
    (a, b) =>
      !!a.eigenDomein - !!b.eigenDomein ||
      a.categorie.localeCompare(b.categorie) ||
      a.naam.localeCompare(b.naam, "nl", { sensitivity: "base" }),
  );
}
