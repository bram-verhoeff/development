// Service worker: maakt de app installeerbaar en bruikbaar zonder internet.
// Eigen bestanden: eerst het netwerk (altijd de nieuwste versie), offline uit de cache.
// Leaflet en lettertypes: uit de cache, op de achtergrond ververst.
// Scans, kaarttegels en GitHub gaan altijd gewoon over het netwerk.
// Lukt de cache niet (volle of geblokkeerde opslag), dan werkt alles gewoon via het netwerk.

const CACHE = "opportunityscanner-v2";
const APP = [
  "./",
  "index.html",
  "app.js",
  "scan.js",
  "mail.js",
  "opslag.js",
  "style.css",
  "manifest.webmanifest",
  "icons/icon-192.png",
  "icons/icon.svg",
  "icons/icon-512.png",
];
const BIBLIOTHEKEN = ["https://unpkg.com/leaflet@1.9.4/dist/leaflet.css", "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"];
const EXTERN_CACHEN = ["unpkg.com", "fonts.googleapis.com", "fonts.gstatic.com"];

const openCache = () => caches.open(CACHE).catch(() => null);

self.addEventListener("install", (e) => {
  e.waitUntil(
    openCache().then((cache) => cache && Promise.allSettled([...APP, ...BIBLIOTHEKEN].map((url) => cache.add(url)))),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((namen) => Promise.all(namen.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .catch(() => {})
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const { request } = e;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  if (url.origin === location.origin && url.pathname.startsWith(new URL(self.registration.scope).pathname)) {
    e.respondWith(netwerkEerst(request));
  } else if (EXTERN_CACHEN.includes(url.hostname)) {
    e.respondWith(cacheEerst(request));
  }
});

async function bewaar(request, antwoord) {
  const cache = await openCache();
  if (cache) cache.put(request, antwoord).catch(() => {});
}

async function uitCache(request) {
  const cache = await openCache();
  if (!cache) return null;
  return (await cache.match(request, { ignoreSearch: true }).catch(() => null)) || null;
}

async function netwerkEerst(request) {
  try {
    const antwoord = await fetch(request);
    if (antwoord.ok) bewaar(request, antwoord.clone());
    return antwoord;
  } catch (fout) {
    const bewaard = (await uitCache(request)) || (request.mode === "navigate" && (await uitCache(new Request("index.html"))));
    if (bewaard) return bewaard;
    throw fout;
  }
}

async function cacheEerst(request) {
  const bewaard = await uitCache(request);
  const vers = fetch(request).then((antwoord) => {
    if (antwoord.ok || antwoord.type === "opaque") bewaar(request, antwoord.clone());
    return antwoord;
  });
  if (bewaard) {
    vers.catch(() => {});
    return bewaard;
  }
  return vers;
}
