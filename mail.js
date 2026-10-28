// Stelt per lead een persoonlijke e-mail op met een voorstel voor een (vernieuwde) demo-website.
// Twee soorten: voor een bedrijf zonder website, of voor een bedrijf met een verouderde website.
// Met een Gemini API-sleutel schrijft de AI een unieke mail; zonder sleutel gebruiken we sjablonen.

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

// Wat er mis kan zijn met een bestaande website (aan te vinken in het mailvenster)
export const PROBLEMEN = {
  mobiel: "niet mobielvriendelijk",
  ontwerp: "ouderwets ontwerp",
  https: "geen beveiligde verbinding (https)",
  traag: "laadt traag",
  vindbaar: "slecht vindbaar in Google",
  boeken: "geen online afspraken of bestellen",
  actueel: "informatie niet actueel",
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

/** Waarschijnlijk soort mail: een e-mailadres op een eigen domein wijst op een bestaande website. */
export const standaardSoort = (lead) => (lead.eigenDomein ? "verouderd" : "geen");

// Voornaamwoorden en werkwoorden voor de je- en u-vorm.
const VORMEN = {
  je: { je: "je", Je: "Je", jouw: "je", jou: "je", kunJe: "kun je", wilJe: "wil je", zieJe: "zie je", zitJe: "zit je", ontvangJe: "ontvang je", aanhef: "Hallo" },
  u: { je: "u", Je: "U", jouw: "uw", jou: "u", kunJe: "kunt u", wilJe: "wilt u", zieJe: "ziet u", zitJe: "zit u", ontvangJe: "ontvangt u", aanhef: "Beste" },
};

function voordeel(groep, lead, v, soort) {
  const plaats = lead.plaats;
  const vak = GROEPEN.vakman.includes(lead.categorie) ? lead.categorie : "vakman";
  const site = soort === "verouderd" ? "een vernieuwde website" : "een eigen website";
  const wordJe = v.je === "u" ? "wordt u" : "word je";
  return {
    horeca: `Met ${site} vinden gasten direct de menukaart, openingstijden en locatie, en kunnen ze vanuit Google meteen reserveren of bellen.`,
    beauty: `Met ${site} kunnen klanten ${v.jouw} werk bekijken, de prijzen zien en direct een afspraak maken, ook buiten openingstijden.`,
    vakman: `Met ${site} ${wordJe} gevonden door mensen die in ${plaats} een ${vak} zoeken, en kunnen ze direct een offerte aanvragen.`,
    winkel: `Met ${site} ${v.kunJe} het assortiment laten zien en ${wordJe} beter gevonden door mensen in ${plaats} die eerst online zoeken voordat ze langskomen.`,
    service: `Met ${site} kunnen klanten ${v.jouw} diensten en prijzen bekijken en direct een afspraak inplannen.`,
    zorg: `Met ${site} vinden nieuwe patiënten eenvoudig ${v.jouw} behandelingen, openingstijden en contactgegevens.`,
    overig: `Met ${site} ${wordJe} beter gevonden op Google en maak${v.je === "u" ? "t u" : " je"} direct een professionele eerste indruk.`,
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

/** "a", "a en b", "a, b en c" */
const opsomming = (lijst) => (lijst.length < 2 ? lijst.join("") : `${lijst.slice(0, -1).join(", ")} en ${lijst.at(-1)}`);
const kaleUrl = (url) => String(url).replace(/^https?:\/\//, "").replace(/\/$/, "");

/** Afmeldzin en ondertekening: altijd door de app toegevoegd, zodat ze nooit ontbreken of verzonnen worden. */
function slot(afzender, v) {
  const ik = afzender.naam || STANDAARD_AFZENDER.naam;
  const bedrijf = afzender.bedrijf || STANDAARD_AFZENDER.bedrijf;
  const handtekening = [ik, bedrijf !== afzender.website ? bedrijf : "", afzender.website || STANDAARD_AFZENDER.website, afzender.telefoon]
    .filter(Boolean)
    .join("\n");
  return `Geen interesse? Laat het gerust weten, dan ${v.ontvangJe} geen berichten meer van mij.\n\nMet vriendelijke groet,\n\n${handtekening}`;
}

/**
 * Maakt een e-mail voor een lead met sjablonen (zonder AI).
 * @param {object} lead
 * @param {object} afzender  { naam, bedrijf, website, telefoon }
 * @param {{ vorm?: "je" | "u", variant?: number, soort?: "geen" | "verouderd", website?: string, problemen?: string[] }} opties
 */
export function maakMail(lead, afzender, { vorm = standaardVorm(lead), variant = 0, soort = "geen", website = "", problemen = [] } = {}) {
  const v = VORMEN[vorm];
  const { naam, plaats } = lead;
  const ik = afzender.naam || STANDAARD_AFZENDER.naam;
  const bedrijf = afzender.bedrijf || STANDAARD_AFZENDER.bedrijf;
  const branche = MEERVOUD[lead.categorie] || "lokale ondernemers";
  const groep = groepVan(lead.categorie);
  const n = hash(lead.id) + variant;
  const kies = (opties) => opties[n % opties.length];
  const WilJe = v.wilJe[0].toUpperCase() + v.wilJe.slice(1);

  if (soort === "verouderd") {
    const punten = problemen.map((k) => PROBLEMEN[k]).filter(Boolean);
    const onderwerp = kies([
      `Een frisse website voor ${naam}`,
      `Idee voor de website van ${naam}`,
      `${naam}: gratis voorbeeld van een vernieuwde website`,
    ]);
    const intro = kies([
      `Ik ben ${ik} van ${bedrijf} en ik kwam de website van ${naam}${website ? ` (${kaleUrl(website)})` : ""} tegen toen ik keek naar ${branche} in ${plaats}.`,
      `Mijn naam is ${ik}, ik bouw websites voor ondernemers via ${bedrijf}. Toen ik zocht naar ${branche} in ${plaats}, kwam ik bij de website van ${naam} uit.`,
    ]);
    const observatie = punten.length
      ? `Wat me opviel: de site is ${opsomming(punten)}. Zonde, want daardoor haken bezoekers sneller af.`
      : `De site doet zijn werk, maar oogt niet meer van deze tijd, en dat is zonde van de eerste indruk.`;
    const aanbod = kies([
      `Daarom wil ik ${v.jou} een voorstel doen: ik maak gratis en vrijblijvend een voorbeeld van hoe een vernieuwde website voor ${naam} eruit kan zien. Zo ${v.zieJe} het verschil meteen, zonder dat het ${v.jou} iets kost.`,
      `Mijn voorstel: ik bouw gratis een vernieuwde versie van de homepage van ${naam}, in ${v.jouw} eigen stijl. Zo ${v.zieJe} meteen hoe het eruit kan zien, zonder kosten en zonder verplichtingen.`,
    ]);
    const vraag = kies([
      `Zal ik een voorbeeld voor ${naam} maken? Een kort antwoord op deze mail is genoeg.`,
      `${WilJe} het voorbeeld zien? Stuur gerust een kort berichtje terug.`,
    ]);
    const tekst = [`${v.aanhef} ${naam},`, intro, observatie, voordeel(groep, lead, v, soort), aanbod, vraag, slot(afzender, v)].join("\n\n");
    return { aan: lead.email, onderwerp, tekst };
  }

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
    `${WilJe} de demo zien? Stuur gerust een kort berichtje terug, dan ga ik ermee aan de slag.`,
  ]);

  const tekst = [`${v.aanhef} ${naam},`, intro, voordeel(groep, lead, v, soort), aanbod, vervolg, vraag, slot(afzender, v)].join("\n\n");

  return { aan: lead.email, onderwerp, tekst };
}

// --- AI (Gemini) ---

// Eerst het snelle standaardmodel; bij drukte (429/503) of een time-out het lichtere model.
const MODELLEN = ["gemini-flash-latest", "gemini-flash-lite-latest"];

const INSTRUCTIE = `Je schrijft korte, persoonlijke e-mails in het Nederlands voor een zelfstandige webdeveloper die lokale ondernemers benadert.
Schrijf zoals een echt mens dat doet: concreet, warm en to the point. Geen verkooppraatjes, geen clichés ("in de huidige digitale wereld"), geen overdreven complimenten, geen emoji's, geen opsommingstekens en geen placeholders tussen haken.
Verzin geen feiten: gebruik alleen wat in de gegevens staat. Noem nooit prijzen.`;

function prompt(lead, afzender, { vorm, soort, website, problemen, opgemerkt, notitie, variant }) {
  const branche = MEERVOUD[lead.categorie] ? `${lead.categorie} (${MEERVOUD[lead.categorie]})` : lead.categorie;
  const punten = (problemen || []).map((k) => PROBLEMEN[k]).filter(Boolean);
  const situatie =
    soort === "verouderd"
      ? [
          `Het bedrijf heeft al een website${website ? `: ${website}` : ""}, maar die is verouderd.`,
          punten.length ? `Wat de afzender aan de site zag: ${punten.join("; ")}.` : "De afzender heeft geen specifieke punten genoteerd; houd het algemeen (oogt niet meer van deze tijd).",
          "Doel: een gratis, vrijblijvend voorbeeld aanbieden van hoe een vernieuwde website eruit kan zien. Benoem hoogstens twee verbeterpunten, vriendelijk en zonder de huidige site af te kraken.",
        ]
      : [
          lead.type === "alleen_social"
            ? `Het bedrijf heeft geen eigen website, maar is wel actief op ${platformVan(lead.social)}.`
            : "Het bedrijf heeft geen eigen website.",
          "Doel: gratis en vrijblijvend een demo-website aanbieden, in de eigen stijl en met de eigen gegevens van het bedrijf.",
        ];
  return [
    "Gegevens:",
    `- Bedrijf: ${lead.naam}`,
    `- Branche: ${branche}`,
    `- Plaats: ${lead.plaats}${lead.adres ? ` (${lead.adres})` : ""}`,
    ...situatie.map((s) => `- ${s}`),
    opgemerkt ? `- Wat de afzender zelf opviel (gebruik dit, het maakt de mail persoonlijk): ${opgemerkt}` : "",
    notitie ? `- Notities van de afzender over dit bedrijf (alleen gebruiken als het relevant is): ${notitie}` : "",
    `- Afzender: ${afzender.naam || STANDAARD_AFZENDER.naam} van ${afzender.bedrijf || STANDAARD_AFZENDER.bedrijf}`,
    "",
    "Eisen:",
    `- Spreek de lezer aan met "${vorm}" en begin met "${VORMEN[vorm].aanhef} ${lead.naam},".`,
    "- Stel je kort voor, laat merken dat je dit bedrijf echt bekeken hebt, en noem één concreet voordeel voor juist deze branche.",
    "- 90 tot 150 woorden, korte alinea's gescheiden door een lege regel.",
    "- Eindig met één eenvoudige vraag. Geen afsluitende groet, geen naam en geen afmeldzin: die voegt de app zelf toe.",
    "- Onderwerp: maximaal 8 woorden, persoonlijk, met de bedrijfsnaam, zonder clickbait of uitroeptekens.",
    variant ? `- Dit is versie ${variant + 1}: kies een duidelijk andere invalshoek en andere formuleringen dan de vorige versie.` : "",
  ]
    .filter((r) => r !== "")
    .join("\n");
}

/**
 * Laat Gemini een persoonlijke e-mail schrijven. Afmeldzin en ondertekening voegen we zelf toe.
 * @returns {Promise<{ aan: string, onderwerp: string, tekst: string }>}
 */
export async function schrijfMetAI(lead, afzender, opties, sleutel) {
  const v = VORMEN[opties.vorm];
  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: INSTRUCTIE }] },
    contents: [{ role: "user", parts: [{ text: prompt(lead, afzender, opties) }] }],
    generationConfig: {
      temperature: 1,
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: { onderwerp: { type: "STRING" }, tekst: { type: "STRING" } },
        required: ["onderwerp", "tekst"],
      },
    },
  });

  let laatsteFout = null;
  for (const model of MODELLEN) {
    let r;
    try {
      r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": sleutel },
        body,
        signal: AbortSignal.timeout(45_000),
      });
    } catch (e) {
      laatsteFout = new Error(e.name === "TimeoutError" ? "Gemini reageerde niet op tijd." : "Geen verbinding met Gemini.");
      continue;
    }
    if (r.status === 429 || r.status === 503) {
      laatsteFout = new Error("Gemini is even druk of je daglimiet is bereikt. Probeer het zo opnieuw.");
      continue;
    }
    if (r.status === 404) {
      laatsteFout = new Error(`Het Gemini-model ${model} is niet beschikbaar.`);
      continue;
    }
    if (!r.ok) {
      const fout = await r.json().catch(() => ({}));
      const bericht = fout?.error?.message || "";
      if (r.status === 400 && /api key/i.test(bericht)) throw new Error("Deze Gemini API-sleutel is ongeldig.");
      if (r.status === 403) throw new Error("Geen toegang met deze Gemini API-sleutel.");
      throw new Error(`Gemini gaf een fout (${r.status})${bericht ? `: ${bericht}` : ""}`);
    }
    const data = await r.json();
    const ruw = data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";
    let uitkomst;
    try {
      uitkomst = JSON.parse(ruw);
    } catch {
      throw new Error("Gemini gaf een onverwacht antwoord. Probeer het opnieuw.");
    }
    const onderwerp = String(uitkomst.onderwerp || "").trim();
    const tekst = String(uitkomst.tekst || "").replace(/\r/g, "").trim();
    if (!onderwerp || !tekst) throw new Error("Gemini gaf een lege mail terug. Probeer het opnieuw.");
    return { aan: lead.email, onderwerp, tekst: `${tekst}\n\n${slot(afzender, v)}` };
  }
  throw laatsteFout || new Error("Gemini is niet bereikbaar.");
}
