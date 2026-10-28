import { CATEGORIEEN, eigenDomein, scan, sorteer } from "./scan.js";
import { STANDAARD_AFZENDER, maakMail, standaardVorm } from "./mail.js";
import * as opslag from "./opslag.js";

const STATUSSEN = {
  "": "Nieuw",
  interessant: "Interessant",
  benaderd: "Benaderd",
  in_gesprek: "In gesprek",
  klant: "Klant geworden",
  heeft_website: "Heeft toch website",
  geen_interesse: "Geen interesse",
};
const TYPE_LABELS = { geen_website: "Geen website", alleen_social: "Alleen social" };
const MINDER_BEWEGING = matchMedia("(prefers-reduced-motion: reduce)").matches;

const $ = (s) => document.querySelector(s);
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const label = (c) => (c in CATEGORIEEN ? c[0].toUpperCase() + c.slice(1) : c);
const kleur = (naam) => getComputedStyle(document.documentElement).getPropertyValue(naam).trim();
const datum = (iso) => new Date(iso).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" });

// Onversleuteld localStorage alleen voor gemak (laatst ingevulde plaatsen); de echte data staat
// versleuteld in opslag.js. Het kan ontbreken (privévenster, geblokkeerde opslag).
function laad(sleutel, standaard) {
  try {
    const v = localStorage.getItem(sleutel);
    return v ? JSON.parse(v) : standaard;
  } catch {
    return standaard;
  }
}
function bewaar(sleutel, waarde) {
  try {
    localStorage.setItem(sleutel, JSON.stringify(waarde));
  } catch {}
}

let leads = [];
let afzender = { ...STANDAARD_AFZENDER };
let laatstePlaatsen = laad("os-laatste", "");
let kaart, markerLaag;
const markers = new Map();

// --- Meldingen ---
let toastTimer;
function toast(tekst, fout = false) {
  const el = $("#toast");
  el.textContent = tekst;
  el.className = `toast zichtbaar${fout ? " fout" : ""}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("zichtbaar"), fout ? 6000 : 3000);
}

// --- Wachtwoord ---
async function start() {
  if (!crypto?.subtle) {
    toonLogin();
    $("#loginFout").textContent = "Open de site via https (of localhost): versleuteling werkt hier niet.";
    return;
  }
  if (await opslag.herstelSessie()) await naOntgrendelen();
  else toonLogin();
}

function toonLogin() {
  $("#app").hidden = true;
  $("#login").hidden = false;
  $("#mailDialoog").open && $("#mailDialoog").close();
  $("#loginWachtwoord").focus();
}

$("#loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const knop = $("#loginKnop");
  knop.disabled = true;
  knop.querySelector(".knop-tekst").textContent = "Bezig met ontgrendelen";
  $("#loginFout").textContent = "";
  try {
    await opslag.ontgrendel($("#loginWachtwoord").value);
    $("#loginWachtwoord").value = "";
    await naOntgrendelen();
  } catch (err) {
    $("#loginFout").textContent = err.message;
    const form = $("#loginForm");
    form.classList.remove("schud");
    void form.offsetWidth; // animatie opnieuw starten
    form.classList.add("schud");
  } finally {
    knop.disabled = false;
    knop.querySelector(".knop-tekst").textContent = "Ontgrendelen";
  }
});

async function naOntgrendelen() {
  $("#login").hidden = true;
  $("#app").hidden = false;
  try {
    await zetOudeBrowserdataOver();
  } catch (err) {
    toast(err.message, true);
  }
  laadUitOpslag();
  toonResultaten(true);
}

function laadUitOpslag() {
  leads = sorteer([...opslag.leads()]);
  afzender = { ...STANDAARD_AFZENDER, ...(opslag.afzender() || {}) };
}

$("#uitlogKnop").addEventListener("click", () => {
  opslag.vergrendel();
  leads = [];
  $("#resultaten").hidden = true;
  toonLogin();
});

// Eenmalig: onversleutelde leads, statussen en afzender van een eerdere versie overzetten.
async function zetOudeBrowserdataOver() {
  const oud = laad("os-leads", null);
  const oudeAfzender = laad("os-afzender", null);
  if (oud?.length) {
    const statussen = laad("os-status", {});
    const metEmail = oud
      .filter((l) => l.email)
      .map((l) => ({ ...l, eigenDomein: l.eigenDomein ?? eigenDomein(l.email), status: statussen[l.id] || "" }));
    await opslag.bewaarLeads(metEmail, { alleenNieuw: true });
    if (metEmail.length) toast(`${metEmail.length} eerder gevonden leads overgezet naar de versleutelde opslag`);
  }
  if (oudeAfzender && !opslag.afzender()) await opslag.bewaarAfzender(oudeAfzender);
  for (const k of ["os-leads", "os-status", "os-afzender", "os-email"]) {
    try {
      localStorage.removeItem(k);
    } catch {}
  }
}

// --- Scannen ---
$("#categorieen").innerHTML = Object.keys(CATEGORIEEN)
  .map((c) => `<label class="chip"><input type="checkbox" value="${c}"><span>${label(c)}</span></label>`)
  .join("");
$("#plaatsen").value = laad("os-plaatsen", "");

$("#scanForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const plaatsen = $("#plaatsen").value.split(",").map((p) => p.trim()).filter(Boolean);
  const gekozen = [...document.querySelectorAll("#categorieen input:checked")].map((i) => i.value);
  if (!plaatsen.length) return;
  bewaar("os-plaatsen", $("#plaatsen").value);

  const knop = $("#scanKnop");
  knop.disabled = true;
  knop.querySelector(".knop-tekst").textContent = "Bezig met scannen";
  $("#radar").classList.add("scannen");
  $("#blips").innerHTML = "";
  zetStatus("Scan starten", "bezig");
  try {
    const res = await scan(plaatsen, gekozen, (t) => zetStatus(t.replace(/\.+$/, ""), "bezig"));
    const bekend = new Set(leads.map((l) => l.id));
    const nieuw = res.leads.filter((l) => !bekend.has(l.id)).length;
    zetStatus("Opslaan", "bezig");
    await opslag.bewaarLeads(res.leads);
    leads = sorteer([...opslag.leads()]);
    laatstePlaatsen = plaatsen.join(", ");
    bewaar("os-laatste", laatstePlaatsen);
    zetStatus(
      res.leads.length
        ? `${res.leads.length} ${res.leads.length === 1 ? "lead" : "leads"} gevonden (${nieuw} nieuw) in ${res.totaal} bedrijven`
        : `${res.totaal} bedrijven gescand, geen leads`,
      "klaar",
    );
    // Eén plaats gescand: meteen op die plaats filteren.
    toonResultaten(true, plaatsen.length === 1 ? plaatsen[0] : "");
    $("#resultaten").scrollIntoView({ behavior: MINDER_BEWEGING ? "auto" : "smooth" });
  } catch (err) {
    zetStatus(err.message, "fout");
    renderLijst();
  } finally {
    knop.disabled = false;
    knop.querySelector(".knop-tekst").textContent = "Start scan";
    $("#radar").classList.remove("scannen");
  }
});

function zetStatus(tekst, soort = "") {
  const el = $("#status");
  el.textContent = tekst;
  el.className = `status ${soort}`;
}

// --- Radar: leads als stipjes, op hun echte ligging ten opzichte van elkaar ---
function tekenBlips(lijst) {
  const punten = lijst.filter((l) => l.lat != null).slice(0, 60);
  let posities;
  if (punten.length) {
    const lats = punten.map((l) => l.lat), lons = punten.map((l) => l.lon);
    const [minLat, maxLat, minLon, maxLon] = [Math.min(...lats), Math.max(...lats), Math.min(...lons), Math.max(...lons)];
    const schaal = Math.max(maxLat - minLat, (maxLon - minLon) * 0.62, 0.002);
    const midLat = (minLat + maxLat) / 2, midLon = (minLon + maxLon) / 2;
    posities = punten.map((l) => {
      let x = ((l.lon - midLon) * 0.62) / schaal, y = (midLat - l.lat) / schaal;
      const r = Math.hypot(x, y);
      if (r > 1) (x /= r), (y /= r);
      const k = l.eigenDomein ? "var(--vermoed)" : l.type === "geen_website" ? "var(--geen)" : "var(--social)";
      return { x: x * 0.78, y: y * 0.78, kleur: k };
    });
  } else {
    // Nog geen resultaten: een paar decoratieve stipjes.
    posities = [[-0.35, -0.42], [0.48, -0.15], [0.12, 0.5], [-0.55, 0.22], [0.3, 0.18]].map(([x, y]) => ({ x, y }));
  }
  $("#blips").innerHTML = posities
    .map(
      (p, i) =>
        `<span class="blip" style="left:${50 + p.x * 50}%;top:${50 + p.y * 50}%;--d:${(i * 0.08).toFixed(2)}s${p.kleur ? `;--kleur:${p.kleur}` : ""}"></span>`,
    )
    .join("");
}

// --- Filters ---
const PAGINA = 60; // zoveel lead-kaartjes per keer, zodat duizenden leads vlot blijven
const WEERGAVEN = ["lijst", "pipeline", "dashboard"];
let weergave = WEERGAVEN.includes(laad("os-weergave", "lijst")) ? laad("os-weergave", "lijst") : "lijst";
let getoond = PAGINA;
let huidigeLijst = [];

const vandaag = () => opslag.overDagen(0);
const afgerond = (l) => opslag.AFGEROND.includes(l.status || "");
const moetOpvolgen = (l) => Boolean(l.opvolgen) && l.opvolgen <= vandaag() && !afgerond(l);
const dagenTussen = (van, tot) => Math.round((new Date(tot) - new Date(van)) / 864e5);

/** "vandaag", "3 dagen te laat" of "op 4 nov". */
function opvolgLabel(d) {
  const verschil = dagenTussen(d, vandaag());
  if (verschil === 0) return "vandaag";
  if (verschil > 0) return verschil === 1 ? "1 dag te laat" : `${verschil} dagen te laat`;
  return `op ${new Date(`${d}T12:00`).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}`;
}

$("#filterStatus").innerHTML =
  `<option value="*">Alle statussen</option><option value="@opvolgen">Op te volgen</option>` +
  Object.entries(STATUSSEN).map(([k, v]) => `<option value="${k}">${v}</option>`).join("");
$("#filterGebied").addEventListener("input", () => renderLijst(true));
for (const id of ["#filterCategorie", "#filterType", "#filterStatus"]) {
  $(id).addEventListener("input", () => renderLijst());
}
// Zoeken pas na een korte pauze in het typen, niet bij elke toets
let zoekTimer;
$("#zoek").addEventListener("input", () => {
  clearTimeout(zoekTimer);
  zoekTimer = setTimeout(() => renderLijst(), 150);
});

function gefilterd({ metStatus = true } = {}) {
  const zoek = $("#zoek").value.trim().toLowerCase();
  const gebied = $("#filterGebied").value;
  const cat = $("#filterCategorie").value;
  const type = $("#filterType").value;
  const status = metStatus ? $("#filterStatus").value : "*";
  return leads.filter(
    (l) =>
      (!zoek || `${l.naam} ${l.adres} ${l.plaats} ${l.email} ${l.notitie || ""}`.toLowerCase().includes(zoek)) &&
      (!gebied || l.gebied === gebied) &&
      (!cat || l.categorie === cat) &&
      (!type ||
        (type === "kans" ? !l.eigenDomein : type === "domein" ? !!l.eigenDomein : l.type === type)) &&
      (status === "*" || (status === "@opvolgen" ? moetOpvolgen(l) : (l.status || "") === status)),
  );
}

function vulSelect(sel, alles, waarden, naam = (w) => w) {
  const el = $(sel);
  const huidig = el.value;
  const telling = {};
  for (const w of waarden) telling[w] = (telling[w] || 0) + 1;
  el.innerHTML =
    `<option value="">${alles}</option>` +
    Object.entries(telling)
      .sort((a, b) => b[1] - a[1])
      .map(([w, n]) => `<option value="${esc(w)}">${esc(naam(w))} (${n})</option>`)
      .join("");
  if (huidig in telling) el.value = huidig;
}

// --- Weergave: lijst, pipeline of dashboard ---
document.querySelectorAll('input[name="weergave"]').forEach((r) => {
  r.checked = r.value === weergave;
  r.addEventListener("change", () => {
    weergave = r.value;
    bewaar("os-weergave", weergave);
    renderLijst(true);
  });
});

function kiesWeergave(nieuw) {
  weergave = nieuw;
  bewaar("os-weergave", weergave);
  document.querySelectorAll('input[name="weergave"]').forEach((r) => (r.checked = r.value === weergave));
}

// --- Resultaten ---
function toonResultaten(nieuweScan, gebied, zoom = true) {
  $("#resultaten").hidden = !leads.length && !laatstePlaatsen;
  $("#leeg").hidden = leads.length > 0;
  $("#inhoud").hidden = leads.length === 0;
  $("#exportKnop").hidden = leads.length === 0;
  const gebieden = new Set(leads.map((l) => l.gebied));
  $("#resultaatInfo").textContent =
    `${leads.length} leads in ${gebieden.size} ${gebieden.size === 1 ? "plaats" : "plaatsen"}` +
    (laatstePlaatsen ? ` · laatste scan: ${laatstePlaatsen}` : "");

  vulSelect("#filterGebied", "Alle plaatsen", leads.map((l) => l.gebied));
  vulSelect("#filterCategorie", "Alle branches", leads.map((l) => l.categorie), label);
  if (gebied !== undefined) $("#filterGebied").value = gebieden.has(gebied) ? gebied : "";

  renderStats(nieuweScan);
  renderLijst(zoom);
}

function renderStats(animeer) {
  const waarden = [
    [leads.length, "leads"],
    [leads.filter((l) => !l.eigenDomein).length, "beste kansen"],
    [leads.filter((l) => l.laatstGemaild).length, "gemaild"],
    [leads.filter((l) => l.status === "klant").length, "klanten"],
  ];
  const el = $("#stats");
  if (animeer || !el.children.length) {
    el.innerHTML = waarden
      .map(([, t], i) => `<div class="stat kaartje" style="--d:${i * 70}ms"><strong>0</strong><span>${t}</span></div>`)
      .join("");
  }
  waarden.forEach(([n], i) => telOp(el.children[i].querySelector("strong"), n));
}

function telOp(el, doel) {
  const start = Number(el.textContent) || 0;
  if (start === doel || MINDER_BEWEGING) return void (el.textContent = doel);
  const t0 = performance.now(), duur = 900;
  const stap = (t) => {
    const p = Math.min((t - t0) / duur, 1);
    el.textContent = Math.round(start + (doel - start) * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(stap);
  };
  requestAnimationFrame(stap);
}

function renderLijst(zoomKaart = false) {
  renderOpvolgen();
  // De statusfilter hoort bij de lijst; pipeline en dashboard laten juist alle statussen zien
  $("#filterStatus").hidden = weergave !== "lijst";
  $("#weergaveLijst").hidden = weergave !== "lijst";
  $("#weergavePipeline").hidden = weergave !== "pipeline";
  $("#weergaveDashboard").hidden = weergave !== "dashboard";

  const lijst = gefilterd({ metStatus: weergave === "lijst" });
  $("#aantal").textContent = `${lijst.length} van ${leads.length} leads`;
  tekenBlips(lijst);
  if (weergave === "lijst") {
    getoond = PAGINA;
    tekenLijst(lijst);
    if (leads.length) tekenKaart(lijst, zoomKaart);
  } else if (weergave === "pipeline") {
    renderPipeline(lijst);
  } else {
    renderDashboard(lijst);
  }
}

function tekenLijst(lijst) {
  huidigeLijst = lijst;
  $("#lijst").innerHTML = lijst.slice(0, getoond).map((l, i) => leadKaart(l, Math.min(i, 12) * 45)).join("");
  werkMeerBij();
}

function toonMeer() {
  if (getoond >= huidigeLijst.length) return;
  const van = getoond;
  getoond += PAGINA;
  $("#lijst").insertAdjacentHTML(
    "beforeend",
    huidigeLijst.slice(van, getoond).map((l, i) => leadKaart(l, Math.min(i, 12) * 45)).join(""),
  );
  werkMeerBij();
}

function werkMeerBij() {
  const over = huidigeLijst.length - getoond;
  $("#meer").hidden = over <= 0;
  $("#meerKnop").textContent = `Toon meer (${over} over)`;
}

$("#meerKnop").addEventListener("click", toonMeer);
// Vanzelf bijladen als je richting het einde van de lijst scrolt
new IntersectionObserver(([item]) => item.isIntersecting && toonMeer(), { rootMargin: "800px" }).observe($("#meer"));

const icoonNotitie =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h10l4 4v12H5z" /><path d="M9 12h6M9 16h4" /></svg>';

function leadKaart(l, vertraging, animeer = true) {
  const status = l.status || "";
  const extra = [
    l.telefoon && `<a href="tel:${esc(l.telefoon.replace(/\s/g, ""))}">${esc(l.telefoon)}</a>`,
    l.social && `<a href="${esc(l.social)}" target="_blank" rel="noopener">Social-pagina ↗</a>`,
    `<a href="${esc(l.googleMaps)}" target="_blank" rel="noopener">Check op Google Maps ↗</a>`,
  ].filter(Boolean);
  const badge = l.eigenDomein
    ? `<span class="badge vermoed">Check website</span>`
    : `<span class="badge ${l.type}">${TYPE_LABELS[l.type]}</span>`;
  return `<article class="lead-kaart kaartje ${status ? `st-${status}` : ""}" data-id="${esc(l.id)}"
      style="${animeer ? `--d:${vertraging}ms` : "animation:none"}">
    <div class="lead-kop">
      <div>
        <h3><button class="naam" type="button" data-kaart="${esc(l.id)}" title="Toon op kaart">${esc(l.naam)}</button></h3>
        <div class="lead-sub">${esc(label(l.categorie))} · ${esc([l.adres, l.plaats].filter(Boolean).join(", "))}</div>
      </div>
      ${badge}
    </div>
    ${
      l.eigenDomein
        ? `<p class="vermoed-tekst">E-mail op eigen domein, dus waarschijnlijk wél een website:
           <a href="https://${esc(l.eigenDomein)}" target="_blank" rel="noopener">${esc(l.eigenDomein)} ↗</a></p>`
        : ""
    }
    <div class="email">
      <a href="mailto:${esc(l.email)}">${esc(l.email)}</a>
      <button class="kopieer" type="button" data-kopieer="${esc(l.email)}">Kopieer</button>
    </div>
    <div class="extra">${extra.join("")}</div>
    ${l.notitie ? `<p class="notitie-kort">${esc(l.notitie)}</p>` : ""}
    ${
      l.laatstGemaild || (l.opvolgen && !afgerond(l))
        ? `<div class="lead-meta">
            ${l.laatstGemaild ? `<span class="gemaild">✓ Gemaild op ${esc(datum(l.laatstGemaild))}</span>` : ""}
            ${l.opvolgen && !afgerond(l) ? `<span class="opvolg-chip${moetOpvolgen(l) ? " nu" : ""}">Opvolgen ${esc(opvolgLabel(l.opvolgen))}</span>` : ""}
          </div>`
        : ""
    }
    <div class="lead-voet">
      <button class="mail-knop" type="button" data-mail="${esc(l.id)}">
        <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
        ${l.laatstGemaild ? "Opnieuw mailen" : "Mail opstellen"}
      </button>
      <div class="voet-rechts">
        <button class="icoon-knop" type="button" data-lead="${esc(l.id)}" title="Notities en opvolgen" aria-label="Notities en opvolgen van ${esc(l.naam)}">${icoonNotitie}</button>
        <select data-status="${esc(l.id)}" aria-label="Status van ${esc(l.naam)}">${Object.entries(STATUSSEN)
          .map(([k, v]) => `<option value="${k}"${k === status ? " selected" : ""}>${v}</option>`)
          .join("")}</select>
      </div>
    </div>
  </article>`;
}

/** Eén kaartje opnieuw tekenen zonder de hele lijst te laten animeren. */
function vervangKaart(lead) {
  const kaartje = document.querySelector(`.lead-kaart[data-id="${CSS.escape(lead.id)}"]`);
  if (kaartje) kaartje.outerHTML = leadKaart(lead, 0, false);
}

/** Alles bijwerken waar deze lead zichtbaar is, na een wijziging. */
function verversLead(lead) {
  renderStats(false);
  renderOpvolgen();
  if (weergave === "lijst") vervangKaart(lead);
  else renderLijst();
  if (actieveLead?.id === lead.id && $("#leadDialoog").open) vulLead();
}

async function zetLeadStatus(lead, status) {
  try {
    await opslag.zetStatus(lead.id, status);
  } catch (err) {
    toast(`Status niet opgeslagen: ${err.message}`, true);
  }
  verversLead(lead);
  if (weergave === "lijst" && $("#filterStatus").value !== "*") renderLijst();
}

async function bewerkLead(lead, velden) {
  try {
    await opslag.werkLeadBij(lead.id, velden);
  } catch (err) {
    toast(`Niet opgeslagen: ${err.message}`, true);
  }
  verversLead(lead);
}

$("#lijst").addEventListener("change", (e) => {
  const lead = leads.find((l) => l.id === e.target.dataset.status);
  if (lead) zetLeadStatus(lead, e.target.value);
});

// --- Vandaag opvolgen ---
function renderOpvolgen() {
  const lijst = leads.filter(moetOpvolgen).sort((a, b) => a.opvolgen.localeCompare(b.opvolgen));
  $("#opvolgBalk").hidden = !lijst.length;
  if (!lijst.length) return;
  $("#opvolgTitel").innerHTML = `<span class="opvolg-stip" aria-hidden="true"></span>Vandaag opvolgen <span class="teller">${lijst.length}</span>`;
  $("#opvolgAlles").hidden = lijst.length <= 5;
  $("#opvolgAlles").textContent = `Toon alle ${lijst.length} in de lijst`;
  $("#opvolgLijst").innerHTML = lijst
    .slice(0, 5)
    .map(
      (l) => `<li>
        <div class="opvolg-wie">
          <button class="naam" type="button" data-lead="${esc(l.id)}">${esc(l.naam)}</button>
          <span class="muted">${esc(STATUSSEN[l.status || ""])} · ${esc(opvolgLabel(l.opvolgen))}</span>
        </div>
        <div class="opvolg-acties">
          <button type="button" class="chipje" data-mail="${esc(l.id)}">Mailen</button>
          <button type="button" class="chipje" data-uitstel="${esc(l.id)}">+3 dagen</button>
          <button type="button" class="chipje" data-klaar="${esc(l.id)}">Klaar</button>
        </div>
      </li>`,
    )
    .join("");
}

$("#opvolgBalk").addEventListener("click", (e) => {
  const knop = e.target.closest("button");
  if (!knop) return;
  if (knop.id === "opvolgAlles") {
    kiesWeergave("lijst");
    $("#filterStatus").value = "@opvolgen";
    renderLijst(true);
    return;
  }
  const lead = leads.find((l) => l.id === (knop.dataset.lead || knop.dataset.mail || knop.dataset.uitstel || knop.dataset.klaar));
  if (!lead) return;
  if (knop.dataset.lead) openLead(lead);
  else if (knop.dataset.mail) openMail(lead);
  else if (knop.dataset.uitstel) bewerkLead(lead, { opvolgen: opslag.overDagen(3) });
  else bewerkLead(lead, { opvolgen: null });
});

// --- Pipeline ---
const KOLOMMEN = [
  ["", "Nieuw"],
  ["interessant", "Interessant"],
  ["benaderd", "Benaderd"],
  ["in_gesprek", "In gesprek"],
  ["klant", "Klant"],
  ["afgevallen", "Afgevallen"],
];
const PER_KOLOM = 40;
const kolomVan = (l) => (["heeft_website", "geen_interesse"].includes(l.status || "") ? "afgevallen" : l.status || "");

function renderPipeline(lijst) {
  const groepen = Object.fromEntries(KOLOMMEN.map(([k]) => [k, []]));
  for (const l of lijst) groepen[kolomVan(l)]?.push(l);
  $("#weergavePipeline").innerHTML = KOLOMMEN.map(([k, titel]) => {
    // Op te volgen bovenaan, daarna de laatst gewijzigde
    const items = groepen[k].sort(
      (a, b) => moetOpvolgen(b) - moetOpvolgen(a) || (b.gewijzigd || "").localeCompare(a.gewijzigd || ""),
    );
    return `<section class="kolom" data-kolom="${k}" aria-label="${titel}">
      <header class="kolom-kop"><h3>${titel}</h3><span class="teller">${items.length}</span></header>
      <div class="kolom-lijst">
        ${items.slice(0, PER_KOLOM).map(bordKaart).join("")}
        ${items.length > PER_KOLOM ? `<p class="muted kolom-meer">+ ${items.length - PER_KOLOM} meer · verfijn met de filters</p>` : ""}
        ${items.length ? "" : `<p class="muted kolom-leeg">Sleep een lead hierheen</p>`}
      </div>
    </section>`;
  }).join("");
}

function bordKaart(l) {
  const opvolg = l.opvolgen && !afgerond(l)
    ? `<span class="opvolg-chip${moetOpvolgen(l) ? " nu" : ""}">${esc(opvolgLabel(l.opvolgen))}</span>`
    : "";
  return `<article class="bord-kaart" draggable="true" tabindex="0" data-lead="${esc(l.id)}" aria-label="${esc(l.naam)}, openen">
    <strong>${esc(l.naam)}</strong>
    <span class="muted">${esc(label(l.categorie))} · ${esc(l.plaats)}</span>
    ${l.notitie ? `<span class="bord-notitie">${esc(l.notitie)}</span>` : ""}
    ${opvolg}
  </article>`;
}

const bord = $("#weergavePipeline");
bord.addEventListener("click", (e) => {
  const id = e.target.closest(".bord-kaart")?.dataset.lead;
  if (id) openLead(leads.find((l) => l.id === id));
});
bord.addEventListener("keydown", (e) => {
  const id = e.target.closest(".bord-kaart")?.dataset.lead;
  if (id && (e.key === "Enter" || e.key === " ")) {
    e.preventDefault();
    openLead(leads.find((l) => l.id === id));
  }
});
// Slepen tussen kolommen (op een touchscreen: tik op een kaart en kies de status)
bord.addEventListener("dragstart", (e) => {
  const kaartje = e.target.closest(".bord-kaart");
  if (!kaartje) return;
  e.dataTransfer.setData("text/plain", kaartje.dataset.lead);
  e.dataTransfer.effectAllowed = "move";
  kaartje.classList.add("sleept");
});
bord.addEventListener("dragend", () => {
  bord.querySelectorAll(".sleept, .doel").forEach((el) => el.classList.remove("sleept", "doel"));
});
bord.addEventListener("dragover", (e) => {
  const kolom = e.target.closest(".kolom");
  if (!kolom) return;
  e.preventDefault();
  bord.querySelectorAll(".kolom.doel").forEach((k) => k !== kolom && k.classList.remove("doel"));
  kolom.classList.add("doel");
});
bord.addEventListener("drop", (e) => {
  const kolom = e.target.closest(".kolom");
  if (!kolom) return;
  e.preventDefault();
  const lead = leads.find((l) => l.id === e.dataTransfer.getData("text/plain"));
  const doel = kolom.dataset.kolom;
  if (!lead || kolomVan(lead) === doel) return renderPipeline(gefilterd({ metStatus: false }));
  zetLeadStatus(lead, doel === "afgevallen" ? "geen_interesse" : doel);
});

// --- Dashboard ---
const ooitBenaderd = (l) =>
  Boolean(l.laatstGemaild) || ["benaderd", "in_gesprek", "klant"].includes(l.status || "") ||
  (l.historie || []).some((h) => ["benaderd", "in_gesprek", "klant"].includes(h.status));
const ooitInGesprek = (l) =>
  ["in_gesprek", "klant"].includes(l.status || "") || (l.historie || []).some((h) => ["in_gesprek", "klant"].includes(h.status));
const procent = (deel, geheel) => (geheel ? Math.round((deel / geheel) * 100) : 0);

/** Maandag van de week waarin dit tijdstip valt (lokale tijd). */
function weekStart(iso) {
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

function perWeek(tijden, weken = 12) {
  const deze = weekStart(new Date().toISOString());
  const reeks = Array.from({ length: weken }, (_, i) => {
    const d = new Date(deze);
    d.setDate(d.getDate() - (weken - 1 - i) * 7);
    return { start: d, n: 0 };
  });
  for (const t of tijden) {
    const w = weekStart(t).getTime();
    const vak = reeks.find((r) => r.start.getTime() === w);
    if (vak) vak.n++;
  }
  return reeks;
}

const weekLabel = (d) => d.toLocaleDateString("nl-NL", { day: "numeric", month: "short" });

/** Kolomgrafiek van één reeks per week, met een tabel als alternatief. */
function weekGrafiek(titel, eenheid, reeks) {
  const max = Math.max(1, ...reeks.map((r) => r.n));
  const piek = reeks.reduce((a, b) => (b.n > a.n ? b : a), reeks[0]);
  return `<figure class="grafiek kaartje">
    <figcaption><h3>${titel}</h3><span class="muted">laatste ${reeks.length} weken</span></figcaption>
    <div class="kolommen" role="img" aria-label="${titel}: ${reeks.map((r) => `week van ${weekLabel(r.start)} ${r.n}`).join(", ")}">
      ${reeks
        .map(
          (r, i) => `<div class="kolom-vak" tabindex="0" data-tip="Week van ${weekLabel(r.start)}: ${r.n} ${eenheid}">
            ${r === piek && r.n ? `<span class="kolom-waarde">${r.n}</span>` : ""}
            <span class="kolom-staaf" style="height:${(r.n / max) * 100}%"></span>
            <span class="kolom-as">${i % 3 === 0 || i === reeks.length - 1 ? weekLabel(r.start) : ""}</span>
          </div>`,
        )
        .join("")}
    </div>
    <details class="als-tabel"><summary>Als tabel</summary>
      <table><thead><tr><th>Week van</th><th>${eenheid}</th></tr></thead>
      <tbody>${reeks.map((r) => `<tr><td>${weekLabel(r.start)}</td><td>${r.n}</td></tr>`).join("")}</tbody></table>
    </details>
  </figure>`;
}

/** Tabel met leads, benaderd, klanten en conversie per groep (branche of plaats). */
function conversieTabel(titel, kolom, lijst, sleutel, naam = (w) => w) {
  const groepen = new Map();
  for (const l of lijst) {
    const g = groepen.get(sleutel(l)) || { leads: 0, benaderd: 0, klant: 0 };
    g.leads++;
    if (ooitBenaderd(l)) g.benaderd++;
    if (l.status === "klant") g.klant++;
    groepen.set(sleutel(l), g);
  }
  const rijen = [...groepen.entries()].sort((a, b) => b[1].benaderd - a[1].benaderd || b[1].leads - a[1].leads).slice(0, 8);
  return `<figure class="grafiek kaartje">
    <figcaption><h3>${titel}</h3><span class="muted">klanten van benaderde leads</span></figcaption>
    <table class="conversie">
      <thead><tr><th>${kolom}</th><th>Leads</th><th>Benaderd</th><th>Klant</th><th>Conversie</th></tr></thead>
      <tbody>${rijen
        .map(([k, g]) => {
          const p = procent(g.klant, g.benaderd);
          return `<tr><td>${esc(naam(k))}</td><td>${g.leads}</td><td>${g.benaderd}</td><td>${g.klant}</td>
            <td><span class="meter" data-tip="${g.klant} van ${g.benaderd} benaderd">
              <span class="meter-spoor"><span class="meter-vulling" style="width:${p}%"></span></span><span>${g.benaderd ? `${p}%` : "–"}</span>
            </span></td></tr>`;
        })
        .join("")}</tbody>
    </table>
  </figure>`;
}

function renderDashboard(lijst) {
  const ids = new Set(lijst.map((l) => l.id));
  const mails = opslag.mails().filter((m) => ids.has(m.id));
  const benaderd = lijst.filter(ooitBenaderd).length;
  const gesprek = lijst.filter(ooitInGesprek).length;
  const klanten = lijst.filter((l) => l.status === "klant").length;
  const trechter = [
    ["Gevonden", lijst.length],
    ["Benaderd", benaderd],
    ["In gesprek", gesprek],
    ["Klant", klanten],
  ];
  const deze = weekStart(new Date().toISOString()).getTime();
  const tegels = [
    [`${procent(klanten, benaderd)}%`, "conversie", `${klanten} klanten van ${benaderd} benaderde leads`],
    [`${procent(gesprek, benaderd)}%`, "reactie", "benaderde leads die in gesprek kwamen"],
    [mails.filter((m) => weekStart(m.tijd).getTime() === deze).length, "mails deze week", "sinds maandag"],
    [lijst.filter(moetOpvolgen).length, "op te volgen", "vandaag of eerder"],
  ];

  $("#weergaveDashboard").innerHTML = `
    <div class="tegels">${tegels
      .map(([w, t, uitleg]) => `<div class="stat kaartje" title="${uitleg}"><strong>${w}</strong><span>${t}</span></div>`)
      .join("")}</div>
    <figure class="grafiek kaartje trechter">
      <figcaption><h3>Van lead naar klant</h3><span class="muted">${lijst.length === leads.length ? "alle leads" : "binnen de filters"}</span></figcaption>
      ${trechter
        .map(([naam, n], i) => {
          const vorige = i ? trechter[i - 1][1] : 0;
          return `<div class="trechter-rij" tabindex="0" data-tip="${naam}: ${n}${i ? ` (${procent(n, vorige)}% van ${trechter[i - 1][0].toLowerCase()})` : ""}">
            <span class="trechter-naam">${naam}</span>
            <span class="trechter-baan"><span class="trechter-staaf" style="width:${trechter[0][1] ? Math.max((n / trechter[0][1]) * 100, n ? 1 : 0) : 0}%"></span></span>
            <span class="trechter-waarde"><strong>${n}</strong>${i ? ` <span class="muted">${procent(n, vorige)}%</span>` : ""}</span>
          </div>`;
        })
        .join("")}
    </figure>
    <div class="grafieken">
      ${weekGrafiek("Mails per week", "mails", perWeek(mails.map((m) => m.tijd)))}
      ${weekGrafiek("Nieuwe leads per week", "leads", perWeek(lijst.map((l) => l.gevondenOp).filter(Boolean)))}
    </div>
    <div class="grafieken">
      ${conversieTabel("Per branche", "Branche", lijst, (l) => l.categorie, label)}
      ${conversieTabel("Per plaats", "Plaats", lijst, (l) => l.gebied)}
    </div>`;
}

// Tooltip voor grafieken: bij aanwijzen of focus
function toonTip(el) {
  const tip = $("#tooltip");
  tip.textContent = el.dataset.tip;
  tip.hidden = false;
  const r = el.getBoundingClientRect();
  const b = tip.getBoundingClientRect();
  tip.style.left = `${Math.min(Math.max(8, r.left + r.width / 2 - b.width / 2), innerWidth - b.width - 8)}px`;
  tip.style.top = `${Math.max(8, r.top - b.height - 8)}px`;
}
const verbergTip = () => ($("#tooltip").hidden = true);
for (const [aan, uit] of [["pointerover", "pointerout"], ["focusin", "focusout"]]) {
  $("#weergaveDashboard").addEventListener(aan, (e) => {
    const el = e.target.closest("[data-tip]");
    if (el) toonTip(el);
  });
  $("#weergaveDashboard").addEventListener(uit, verbergTip);
}
addEventListener("scroll", verbergTip, { passive: true });

// --- Lead-venster: status, opvolgen, notities, geschiedenis ---
let actieveLead = null;
let notitieTimer;
$("#leadStatus").innerHTML = Object.entries(STATUSSEN).map(([k, v]) => `<option value="${k}">${v}</option>`).join("");

function openLead(lead) {
  if (!lead) return;
  actieveLead = lead;
  vulLead();
  $("#leadDialoog").showModal();
}

function vulLead() {
  const l = actieveLead;
  $("#leadTitel").textContent = l.naam;
  $("#leadSub").textContent = `${label(l.categorie)} · ${[l.adres, l.plaats].filter(Boolean).join(", ")}`;
  $("#leadContact").innerHTML = [
    `<a href="mailto:${esc(l.email)}">${esc(l.email)}</a>`,
    l.telefoon && `<a href="tel:${esc(l.telefoon.replace(/\s/g, ""))}">${esc(l.telefoon)}</a>`,
    `<a href="${esc(l.googleMaps)}" target="_blank" rel="noopener">Google Maps ↗</a>`,
  ]
    .filter(Boolean)
    .join("");
  $("#leadStatus").value = l.status || "";
  $("#leadOpvolgen").value = l.opvolgen || "";
  if (document.activeElement !== $("#leadNotitie")) $("#leadNotitie").value = l.notitie || "";
  const items = [
    ...(l.historie || []).map((h) => ({ tekst: `Status: ${STATUSSEN[h.status] ?? h.status}`, tijd: h.tijd })),
    ...opslag.mails().filter((m) => m.id === l.id).map((m) => ({ tekst: `Mail: ${m.onderwerp}`, tijd: m.tijd })),
    { tekst: "Gevonden bij een scan", tijd: l.gevondenOp },
  ]
    .filter((x) => x.tijd)
    .sort((a, b) => b.tijd.localeCompare(a.tijd));
  $("#leadHistorie").innerHTML = items
    .map((x) => `<li><span>${esc(x.tekst)}</span><time class="muted" datetime="${esc(x.tijd)}">${esc(datum(x.tijd))}</time></li>`)
    .join("");
}

function bewaarNotitie() {
  clearTimeout(notitieTimer);
  if (!actieveLead) return;
  const tekst = $("#leadNotitie").value.trim();
  if (tekst !== (actieveLead.notitie || "")) bewerkLead(actieveLead, { notitie: tekst });
}

$("#leadStatus").addEventListener("change", (e) => zetLeadStatus(actieveLead, e.target.value));
$("#leadOpvolgen").addEventListener("change", (e) => bewerkLead(actieveLead, { opvolgen: e.target.value || null }));
document.querySelectorAll("#leadDialoog [data-dagen]").forEach((knop) =>
  knop.addEventListener("click", () => {
    const opvolgen = knop.dataset.dagen ? opslag.overDagen(Number(knop.dataset.dagen)) : null;
    $("#leadOpvolgen").value = opvolgen || "";
    bewerkLead(actieveLead, { opvolgen });
  }),
);
$("#leadNotitie").addEventListener("input", () => {
  clearTimeout(notitieTimer);
  notitieTimer = setTimeout(bewaarNotitie, 700);
});
$("#leadNotitie").addEventListener("blur", bewaarNotitie);
$("#leadDialoog").addEventListener("close", bewaarNotitie);
$("#leadMail").addEventListener("click", () => {
  const lead = actieveLead;
  $("#leadDialoog").close();
  openMail(lead);
});

$("#lijst").addEventListener("click", async (e) => {
  const kopieer = e.target.closest("[data-kopieer]");
  if (kopieer) {
    try {
      await navigator.clipboard.writeText(kopieer.dataset.kopieer);
      kopieer.textContent = "Gekopieerd ✓";
    } catch {
      kopieer.textContent = "Lukt niet";
    }
    kopieer.classList.remove("ok");
    void kopieer.offsetWidth; // animatie opnieuw starten
    kopieer.classList.add("ok");
    setTimeout(() => (kopieer.textContent = "Kopieer"), 1600);
    return;
  }
  const mailId = e.target.closest("[data-mail]")?.dataset.mail;
  if (mailId) return openMail(leads.find((l) => l.id === mailId));
  const leadId = e.target.closest("[data-lead]")?.dataset.lead;
  if (leadId) return openLead(leads.find((l) => l.id === leadId));

  const id = e.target.closest("[data-kaart]")?.dataset.kaart;
  const m = id && markers.get(id);
  if (!m) return;
  $("#kaart").scrollIntoView({ behavior: MINDER_BEWEGING ? "auto" : "smooth", block: "center" });
  kaart.flyTo(m.getLatLng(), 17, { duration: MINDER_BEWEGING ? 0 : 1.2 });
  m.openPopup();
});

// --- Kaart ---
function tekenKaart(lijst, zoomOpResultaten) {
  if (typeof L === "undefined") return; // Leaflet niet geladen: alleen de lijst
  if (!kaart) {
    // Canvas: duizenden markers blijven vlot
    kaart = L.map("kaart", { scrollWheelZoom: false, preferCanvas: true });
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(kaart);
    markerLaag = L.layerGroup().addTo(kaart);
  }
  markerLaag.clearLayers();
  markers.clear();
  const kleuren = { geen_website: kleur("--geen"), alleen_social: kleur("--social"), vermoed: kleur("--vermoed") };
  for (const l of lijst) {
    if (l.lat == null) continue;
    const m = L.circleMarker([l.lat, l.lon], {
      radius: 8,
      weight: 2,
      color: "#fff",
      fillColor: kleuren[l.eigenDomein ? "vermoed" : l.type],
      fillOpacity: 0.95,
      className: "marker",
    }).bindPopup(
      `<strong>${esc(l.naam)}</strong><br>${esc(label(l.categorie))}<br>${esc(l.adres)}<br>` +
        `<a href="mailto:${esc(l.email)}">${esc(l.email)}</a><br>` +
        `<a href="${esc(l.googleMaps)}" target="_blank" rel="noopener">Check op Google Maps ↗</a>`,
    );
    markerLaag.addLayer(m);
    markers.set(l.id, m);
  }
  if (zoomOpResultaten || !kaart._loaded) {
    const punten = lijst.filter((l) => l.lat != null).map((l) => [l.lat, l.lon]);
    if (punten.length) kaart.fitBounds(punten, { padding: [40, 40], maxZoom: 15 });
    else kaart.setView([52.2, 5.3], 7);
  }
  // De kaart kan verborgen zijn geweest tijdens het aanmaken: grootte opnieuw meten.
  setTimeout(() => kaart.invalidateSize(), 50);
}

// --- E-mail opstellen ---
const mail = { lead: null, vorm: "je", variant: 0 };
const afzenderVelden = { naam: "#afzNaam", bedrijf: "#afzBedrijf", website: "#afzWebsite", telefoon: "#afzTelefoon" };

function openMail(lead) {
  Object.assign(mail, { lead, vorm: standaardVorm(lead), variant: 0 });
  for (const [k, sel] of Object.entries(afzenderVelden)) $(sel).value = afzender[k] || "";
  $("#mailSub").textContent =
    `${lead.naam} · ${lead.plaats}` + (lead.laatstGemaild ? ` · eerder gemaild op ${datum(lead.laatstGemaild)}` : "");
  const waarschuwing = $("#mailWaarschuwing");
  waarschuwing.hidden = !lead.eigenDomein;
  if (lead.eigenDomein) {
    waarschuwing.innerHTML = `Let op: het e-mailadres staat op een eigen domein. Check eerst of
      <a href="https://${esc(lead.eigenDomein)}" target="_blank" rel="noopener">${esc(lead.eigenDomein)} ↗</a> al een website heeft.`;
  }
  vulMail();
  $("#mailDialoog").showModal();
}

function vulMail() {
  const { aan, onderwerp, tekst } = maakMail(mail.lead, afzender, { vorm: mail.vorm, variant: mail.variant });
  document.querySelector(`input[name="vorm"][value="${mail.vorm}"]`).checked = true;
  $("#mailAan").value = aan;
  $("#mailOnderwerp").value = onderwerp;
  $("#mailTekst").value = tekst;
  werkLinksBij();
}

function werkLinksBij() {
  const aan = $("#mailAan").value;
  const onderwerp = $("#mailOnderwerp").value;
  const tekst = $("#mailTekst").value;
  $("#mailOpen").href =
    `mailto:${encodeURIComponent(aan)}?subject=${encodeURIComponent(onderwerp)}&body=${encodeURIComponent(tekst.replace(/\n/g, "\r\n"))}`;
  $("#mailGmail").href =
    "https://mail.google.com/mail/?" + new URLSearchParams({ view: "cm", fs: "1", to: aan, su: onderwerp, body: tekst });
}

$("#mailOnderwerp").addEventListener("input", werkLinksBij);
$("#mailTekst").addEventListener("input", werkLinksBij);
document.querySelectorAll('input[name="vorm"]').forEach((r) =>
  r.addEventListener("change", () => {
    mail.vorm = r.value;
    vulMail();
  }),
);
$("#mailVariant").addEventListener("click", () => {
  mail.variant++;
  vulMail();
  const tekst = $("#mailTekst");
  tekst.classList.remove("ververst");
  void tekst.offsetWidth; // animatie opnieuw starten
  tekst.classList.add("ververst");
});
for (const [k, sel] of Object.entries(afzenderVelden)) {
  $(sel).addEventListener("change", async () => {
    afzender[k] = $(sel).value.trim();
    vulMail();
    try {
      await opslag.bewaarAfzender(afzender);
      toast("Afzender opgeslagen");
    } catch (err) {
      toast(`Afzender niet opgeslagen: ${err.message}`, true);
    }
  });
}
$("#mailKopieer").addEventListener("click", async (e) => {
  try {
    await navigator.clipboard.writeText(`Onderwerp: ${$("#mailOnderwerp").value}\n\n${$("#mailTekst").value}`);
    e.target.textContent = "Gekopieerd ✓";
  } catch {
    e.target.textContent = "Lukt niet";
  }
  setTimeout(() => (e.target.textContent = "Kopieer tekst"), 1600);
});
for (const sel of ["#mailOpen", "#mailGmail"]) {
  // Niet blokkeren: de link opent gewoon, het vastleggen gebeurt op de achtergrond.
  $(sel).addEventListener("click", () => {
    const lead = mail.lead;
    if (["", "interessant"].includes(lead.status || "")) zetLeadStatus(lead, "benaderd");
    else if (!opslag.AFGEROND.includes(lead.status || "")) bewerkLead(lead, { opvolgen: opslag.overDagen(7) });
    opslag.logMail(lead, $("#mailOnderwerp").value, $("#mailTekst").value)
      .then((tijd) => {
        verversLead(lead);
        toast("Mail vastgelegd");
      })
      .catch((err) => toast(`Mail niet vastgelegd: ${err.message}`, true));
  });
}
for (const dialoog of ["#mailDialoog", "#leadDialoog"]) {
  $(dialoog).addEventListener("click", (e) => {
    // Sluiten via de knop of door naast het venster te klikken.
    if (e.target.closest("[data-sluit]") || e.target === e.currentTarget) e.currentTarget.close();
  });
}

// --- Export ---
$("#exportKnop").addEventListener("click", () => {
  const kolommen = ["naam", "categorie", "gebied", "adres", "plaats", "email", "eigenDomein", "telefoon", "type", "status", "laatstGemaild", "opvolgen", "notitie", "social", "googleMaps", "osm"];
  const cel = (v) => (/[";\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const regels = gefilterd().map((l) =>
    kolommen
      .map((k) =>
        cel(String(k === "status" ? STATUSSEN[l.status || ""] : k === "laatstGemaild" ? (l[k] ? datum(l[k]) : "") : (l[k] ?? ""))),
      )
      .join(";"),
  );
  const blob = new Blob(["﻿" + [kolommen.join(";"), ...regels].join("\r\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
});

// --- Backup ---
$("#backupKnop").addEventListener("click", async () => {
  const blob = new Blob([await opslag.maakBackup()], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `opportunityscanner-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  $("#backupMenu").open = false;
  toast("Backup gedownload");
});

$("#backupBestand").addEventListener("change", async (e) => {
  const bestand = e.target.files[0];
  e.target.value = "";
  $("#backupMenu").open = false;
  if (!bestand) return;
  if (opslag.leads().length && !confirm("De huidige leads, statussen en mails in deze browser worden vervangen door de backup. Doorgaan?")) return;
  try {
    await opslag.zetBackupTerug(await bestand.text());
    laadUitOpslag();
    toonResultaten(true);
    toast(`Backup teruggezet: ${leads.length} leads`);
  } catch (err) {
    toast(err.message, true);
  }
});

// --- Online opslag ---
const tijdstip = (iso) => new Date(iso).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });

opslag.opSyncStatus((s) => {
  const gekoppeld = opslag.wolkGekoppeld();
  $("#wolkForm").hidden = gekoppeld;
  $("#wolkActies").hidden = !gekoppeld;
  $("#wolkStip").className = `wolk-stip ${gekoppeld ? s.soort : ""}`;
  const el = $("#wolkStatus");
  el.classList.toggle("fout", s.soort === "fout");
  el.textContent = !gekoppeld
    ? "Uit: alles staat alleen in deze browser."
    : s.soort === "bezig"
      ? "Bezig met synchroniseren…"
      : s.soort === "fout"
        ? `Niet gesynchroniseerd: ${s.fout}`
        : `Online opgeslagen${s.tijd ? ` · ${tijdstip(s.tijd)}` : ""}`;
});

// Wijzigingen van een ander apparaat zijn binnengekomen
opslag.opWijziging(() => {
  laadUitOpslag();
  if (actieveLead) actieveLead = leads.find((l) => l.id === actieveLead.id) || null;
  toonResultaten(false, undefined, false);
  if (actieveLead && $("#leadDialoog").open) vulLead();
});

$("#wolkForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const knop = $("#wolkKoppel");
  knop.disabled = true;
  knop.textContent = "Bezig met koppelen…";
  try {
    await opslag.koppelWolk($("#wolkToken").value);
    $("#wolkToken").value = "";
    toast("Online opslag gekoppeld");
  } catch (err) {
    toast(err.message, true);
  } finally {
    knop.disabled = false;
    knop.textContent = "Koppelen";
  }
});

$("#wolkNu").addEventListener("click", () =>
  opslag.sync().then(
    () => toast("Gesynchroniseerd"),
    (err) => toast(err.message, true),
  ),
);

$("#wolkOntkoppel").addEventListener("click", () => {
  if (!confirm("Deze browser stopt met online opslaan. Je gegevens blijven hier en in de online kluis staan. Doorgaan?")) return;
  opslag.ontkoppelWolk();
  toast("Online opslag ontkoppeld in deze browser");
});

// --- Onthullen bij scrollen ---
const waarnemer = new IntersectionObserver(
  (items) => {
    for (const item of items) {
      if (!item.isIntersecting) continue;
      item.target.classList.add("zichtbaar");
      waarnemer.unobserve(item.target);
    }
  },
  { threshold: 0.15 },
);
document.querySelectorAll(".onthul").forEach((el) => waarnemer.observe(el));

// --- App: installeerbaar en offline bruikbaar ---
if ("serviceWorker" in navigator && location.protocol === "https:") {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}

tekenBlips([]);
start();
