// Stelt per lead een persoonlijke e-mail op met een voorstel voor een gratis demo-website.
// Puur sjablonen: gratis, geen API-key, en alles blijft in de browser.

export const STANDAARD_AFZENDER = { naam: "Bram Verhoeff", bedrijf: "agevodev.nl", website: "agevodev.nl", telefoon: "" };

// Meervoud voor "toen ik keek naar ... in {plaats}".
const MEERVOUD = {
  kapper: "kappers", schoonheidssalon: "schoonheidssalons", bakker: "bakkers", slager: "slagers",
  bloemist: "bloemisten", kledingwinkel: "kledingwinkels", juwelier: "juweliers", opticien: "opticiens",
  fietsenmaker: "fietsenmakers", garage: "garages", tattoo: "tattooshops", restaurant: "restaurants",
  cafe: "cafés", snackbar: "snackbars", loodgieter: "loodgieters", elektricien: "elektriciens",
  schilder: "schilders", timmerman: "timmermannen", aannemer: "aannemers", hovenier: "hoveniers",
  tandarts: "tandartsen", fysiotherapeut: "fysiotherapeuten",
};

const GROEPEN = {
  horeca: ["restaurant", "cafe", "snackbar"],
  beauty: ["kapper", "schoonheidssalon", "tattoo"],
  vakman: ["loodgieter", "elektricien", "schilder", "timmerman", "aannemer", "hovenier"],
  winkel: ["bakker", "slager", "bloemist", "kledingwinkel", "juwelier", "opticien"],
  service: ["garage", "fietsenmaker"],
  zorg: ["tandarts", "fysiotherapeut"],
};

function groepVan(categorie) {
  const g = Object.keys(GROEPEN).find((k) => GROEPEN[k].includes(categorie));
  if (g) return g;
  if (categorie.startsWith("shop=")) return "winkel";
  if (categorie.startsWith("craft=")) return "vakman";
  if (categorie.startsWith("healthcare=")) return "zorg";
  if (categorie.startsWith("amenity=")) return "horeca";
  return "overig";
}

/** Zorg spreken we standaard met "u" aan, de rest met "je". */
export function standaardVorm(lead) {
  return groepVan(lead.categorie) === "zorg" ? "u" : "je";
}

// Voornaamwoorden en werkwoorden voor de je- en u-vorm.
const VORMEN = {
  je: { je: "je", Je: "Je", jouw: "je", jou: "je", kunJe: "kun je", wilJe: "wil je", zieJe: "zie je", zitJe: "zit je", ontvangJe: "ontvang je", aanhef: "Hallo" },
  u: { je: "u", Je: "U", jouw: "uw", jou: "u", kunJe: "kunt u", wilJe: "wilt u", zieJe: "ziet u", zitJe: "zit u", ontvangJe: "ontvangt u", aanhef: "Beste" },
};

function voordeel(groep, lead, v) {
  const plaats = lead.plaats;
  const vak = GROEPEN.vakman.includes(lead.categorie) ? lead.categorie : "vakman";
  return {
    horeca: `Met een eigen website vinden gasten direct de menukaart, openingstijden en locatie, en kunnen ze vanuit Google meteen reserveren of bellen.`,
    beauty: `Met een eigen website kunnen klanten ${v.jouw} werk bekijken, de prijzen zien en direct een afspraak maken, ook buiten openingstijden.`,
    vakman: `Met een eigen website word${v.je === "u" ? "t u" : " je"} gevonden door mensen die in ${plaats} een ${vak} zoeken, en kunnen ze direct een offerte aanvragen.`,
    winkel: `Met een eigen website ${v.kunJe} het assortiment laten zien en word${v.je === "u" ? "t u" : " je"} beter gevonden door mensen in ${plaats} die eerst online zoeken voordat ze langskomen.`,
    service: `Met een eigen website kunnen klanten ${v.jouw} diensten en prijzen bekijken en direct een afspraak inplannen.`,
    zorg: `Met een eigen website vinden nieuwe patiënten eenvoudig ${v.jouw} behandelingen, openingstijden en contactgegevens.`,
    overig: `Met een eigen website word${v.je === "u" ? "t u" : " je"} beter gevonden op Google en maak${v.je === "u" ? "t u" : " je"} direct een professionele eerste indruk.`,
  }[groep];
}

function platformVan(url) {
  const u = String(url).toLowerCase();
  if (u.includes("instagram")) return "Instagram";
  if (u.includes("facebook")) return "Facebook";
  if (u.includes("tiktok")) return "TikTok";
  if (u.includes("linkedin")) return "LinkedIn";
  return "social media";
}

function hash(tekst) {
  let h = 0;
  for (const c of tekst) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

/**
 * Maakt een e-mail voor een lead.
 * @param {object} lead
 * @param {object} afzender  { naam, bedrijf, website, telefoon }
 * @param {{ vorm?: "je" | "u", variant?: number }} opties  variant wisselt de formulering
 */
export function maakMail(lead, afzender, { vorm = standaardVorm(lead), variant = 0 } = {}) {
  const v = VORMEN[vorm];
  const { naam, plaats } = lead;
  const ik = afzender.naam || STANDAARD_AFZENDER.naam;
  const bedrijf = afzender.bedrijf || STANDAARD_AFZENDER.bedrijf;
  const branche = MEERVOUD[lead.categorie] || "lokale ondernemers";
  const groep = groepVan(lead.categorie);
  const n = hash(lead.id) + variant;
  const kies = (opties) => opties[n % opties.length];

  const onderwerp = kies([
    `Gratis demo-website voor ${naam}`,
    `Een eigen website voor ${naam}? Ik maak gratis een demo`,
    `${naam} online: een gratis voorbeeldwebsite`,
  ]);

  const intro =
    lead.type === "alleen_social"
      ? kies([
          `Ik ben ${ik} van ${bedrijf} en ik kwam ${naam} tegen op ${platformVan(lead.social)}. Mooi om te zien hoe actief ${naam} daar is! Wat me wel opviel: er is nog geen eigen website.`,
          `Mijn naam is ${ik}, ik bouw websites voor ondernemers via ${bedrijf}. Ik zag ${naam} op ${platformVan(lead.social)} voorbijkomen en merkte dat er nog geen eigen website is.`,
        ])
      : kies([
          `Ik ben ${ik} van ${bedrijf} en ik kwam ${naam} tegen toen ik keek naar ${branche} in ${plaats}. Wat me opviel: ${naam} heeft nog geen eigen website.`,
          `Mijn naam is ${ik}, ik bouw websites voor ondernemers via ${bedrijf}. Toen ik zocht naar ${branche} in ${plaats}, zag ik dat ${naam} nog geen eigen website heeft.`,
        ]);

  const aanbod = kies([
    `Daarom wil ik ${v.jou} een voorstel doen: ik maak gratis en vrijblijvend een demo-website voor ${naam}, met ${v.jouw} eigen naam, gegevens en uitstraling. Zo ${v.zieJe} precies hoe het eruit komt te zien, zonder dat het ${v.jou} iets kost.`,
    `Mijn voorstel: ik bouw gratis een demo-website voor ${naam}, helemaal in ${v.jouw} eigen stijl en met ${v.jouw} eigen gegevens. Zo ${v.zieJe} meteen hoe het eruit kan zien, zonder kosten en zonder verplichtingen.`,
  ]);

  const vervolg = `Bevalt het? Dan bespreken we samen de mogelijkheden. Zo niet, dan ${v.zitJe} nergens aan vast.`;

  const vraag = kies([
    `Zal ik een demo voor ${naam} maken? Een kort antwoord op deze mail is genoeg.`,
    `${v.wilJe[0].toUpperCase() + v.wilJe.slice(1)} de demo zien? Stuur gerust een kort berichtje terug, dan ga ik ermee aan de slag.`,
  ]);

  const afmelden = `Geen interesse? Laat het gerust weten, dan ${v.ontvangJe} geen berichten meer van mij.`;

  const handtekening = [ik, bedrijf !== afzender.website ? bedrijf : "", afzender.website || STANDAARD_AFZENDER.website, afzender.telefoon]
    .filter(Boolean)
    .join("\n");

  const tekst = [
    `${v.aanhef} ${naam},`,
    intro,
    voordeel(groep, lead, v),
    aanbod,
    vervolg,
    vraag,
    afmelden,
    `Met vriendelijke groet,\n\n${handtekening}`,
  ].join("\n\n");

  return { aan: lead.email, onderwerp, tekst };
}
