// Service worker: maakt de app installeerbaar en bruikbaar zonder internet.
// Eigen bestanden: eerst het netwerk (altijd de nieuwste versie), offline uit de cache.
// Leaflet en lettertypes: uit de cache, op de achtergrond ververst.
// Scans, kaarttegels en GitHub gaan altijd gewoon over het netwerk.

const CACHE = "opportunityscanner-v1";
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
  "icons/icon-512.png",
];
const BIBLIOTHEKEN = ["https://unpkg.com/leaflet@1.9.4/dist/leaflet.css", "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"];
const EXTERN_CACHEN = ["unpkg.com", "fonts.googleapis.com", "fonts.gstatic.com"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) =>
      // Eén mislukt bestand mag de installatie niet tegenhouden
      Promise.allSettled([...APP, ...BIBLIOTHEKEN].map((url) => cache.add(url))),
    ),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((namen) => Promise.all(namen.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
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

async function netwerkEerst(request) {
  const cache = await caches.open(CACHE);
  try {
    const antwoord = await fetch(request);
    if (antwoord.ok) cache.put(request, antwoord.clone());
    return antwoord;
  } catch {
    return (await cache.match(request, { ignoreSearch: true })) || (await cache.match("index.html")) || Response.error();
  }
}

async function cacheEerst(request) {
  const cache = await caches.open(CACHE);
  const bewaard = await cache.match(request);
  const vers = fetch(request)
    .then((antwoord) => {
      if (antwoord.ok || antwoord.type === "opaque") cache.put(request, antwoord.clone());
      return antwoord;
    })
    .catch(() => bewaard);
  return bewaard || vers;
}
