import { CATEGORIEEN, eigenDomein, scan, sorteer } from "./scan.js";
import { STANDAARD_AFZENDER, maakMail, standaardVorm } from "./mail.js";
import * as opslag from "./opslag.js";

const STATUSSEN = {
  "": "Nieuw",
  interessant: "Interessant",
  benaderd: "Benaderd",
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
$("#filterStatus").innerHTML =
  `<option value="*">Alle statussen</option>` +
  Object.entries(STATUSSEN).map(([k, v]) => `<option value="${k}">${v}</option>`).join("");
$("#filterGebied").addEventListener("input", () => renderLijst(true));
for (const id of ["#zoek", "#filterCategorie", "#filterType", "#filterStatus"]) {
  $(id).addEventListener("input", () => renderLijst());
}

function gefilterd() {
  const zoek = $("#zoek").value.trim().toLowerCase();
  const gebied = $("#filterGebied").value;
  const cat = $("#filterCategorie").value;
  const type = $("#filterType").value;
  const status = $("#filterStatus").value;
  return leads.filter(
    (l) =>
      (!zoek || `${l.naam} ${l.adres} ${l.plaats} ${l.email}`.toLowerCase().includes(zoek)) &&
      (!gebied || l.gebied === gebied) &&
      (!cat || l.categorie === cat) &&
      (!type ||
        (type === "kans" ? !l.eigenDomein : type === "domein" ? !!l.eigenDomein : l.type === type)) &&
      (status === "*" || (l.status || "") === status),
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

// --- Resultaten ---
function toonResultaten(nieuweScan, gebied) {
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
  renderLijst(true);
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
  const lijst = gefilterd();
  $("#aantal").textContent = `${lijst.length} van ${leads.length} leads`;
  $("#lijst").innerHTML = lijst.map((l, i) => leadKaart(l, Math.min(i, 12) * 45)).join("");
  tekenBlips(lijst);
  if (leads.length) tekenKaart(lijst, zoomKaart);
}

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
    ${l.laatstGemaild ? `<p class="gemaild">✓ Gemaild op ${esc(datum(l.laatstGemaild))}</p>` : ""}
    <div class="lead-voet">
      <button class="mail-knop" type="button" data-mail="${esc(l.id)}">
        <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
        ${l.laatstGemaild ? "Opnieuw mailen" : "Mail opstellen"}
      </button>
      <select data-status="${esc(l.id)}" aria-label="Status van ${esc(l.naam)}">${Object.entries(STATUSSEN)
        .map(([k, v]) => `<option value="${k}"${k === status ? " selected" : ""}>${v}</option>`)
        .join("")}</select>
    </div>
  </article>`;
}

/** Eén kaartje opnieuw tekenen zonder de hele lijst te laten animeren. */
function vervangKaart(lead) {
  const kaartje = document.querySelector(`.lead-kaart[data-id="${CSS.escape(lead.id)}"]`);
  if (kaartje) kaartje.outerHTML = leadKaart(lead, 0, false);
}

async function zetLeadStatus(lead, status) {
  const oud = lead.status || "";
  lead.status = status;
  vervangKaart(lead);
  renderStats(false);
  try {
    await opslag.zetStatus(lead.id, status);
  } catch (err) {
    lead.status = oud;
    vervangKaart(lead);
    renderStats(false);
    toast(`Status niet opgeslagen: ${err.message}`, true);
  }
  if ($("#filterStatus").value !== "*") renderLijst();
}

$("#lijst").addEventListener("change", (e) => {
  const lead = leads.find((l) => l.id === e.target.dataset.status);
  if (lead) zetLeadStatus(lead, e.target.value);
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
    kaart = L.map("kaart", { scrollWheelZoom: false });
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
    opslag.logMail(lead, $("#mailOnderwerp").value, $("#mailTekst").value)
      .then((tijd) => {
        lead.laatstGemaild = tijd;
        vervangKaart(lead);
        renderStats(false);
        toast("Mail vastgelegd");
      })
      .catch((err) => toast(`Mail niet vastgelegd: ${err.message}`, true));
  });
}
$("#mailDialoog").addEventListener("click", (e) => {
  // Sluiten via de knop of door naast het venster te klikken.
  if (e.target.closest("[data-sluit]") || e.target === e.currentTarget) e.currentTarget.close();
});

// --- Export ---
$("#exportKnop").addEventListener("click", () => {
  const kolommen = ["naam", "categorie", "gebied", "adres", "plaats", "email", "eigenDomein", "telefoon", "type", "status", "laatstGemaild", "social", "googleMaps", "osm"];
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
  $(".menu").open = false;
  toast("Backup gedownload");
});

$("#backupBestand").addEventListener("change", async (e) => {
  const bestand = e.target.files[0];
  e.target.value = "";
  $(".menu").open = false;
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

tekenBlips([]);
start();
