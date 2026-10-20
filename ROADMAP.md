# PostPilot AI — Roadmap

> 🌐 **postpilotai.nl**

> **Doel:** dé Nederlandstalige contenttool voor social-media-freelancers en kleine bureaus die voor meerdere klanten werken, met een eenvoudige variant voor lokale ondernemers.
> **Belofte:** "Elke maandag staat de week klaar. Jij en je klant hoeven alleen nog goed te keuren."

Laatst bijgewerkt: 2026-10-20

---

## Waar we nu staan

| Onderdeel | Status |
|---|---|
| Merkprofielen (onbeperkt, met doelgroep, toon, USP's, kleuren, logo en te vermijden woorden) | ✅ |
| Posts, hooks en hashtags genereren voor Instagram, LinkedIn, TikTok, X en Facebook (Gemini, Claude als alternatief) | ✅ |
| Genereren vanuit een webpagina of eigen tekst | ✅ |
| Beoordelen: concept / goedgekeurd / afgewezen, met versiegeschiedenis | ✅ |
| Beeld (Gemini Image) en video (Veo) per post | ✅ |
| Kalender met filters | ✅ |
| Inloggen via Supabase, met allowlist | ✅ |
| Koppelen: LinkedIn, X, Facebook, Instagram, TikTok ("Alles koppelen") | ✅ |
| Handmatig plaatsen ("Nu plaatsen"): LinkedIn, X, Facebook | ✅ |
| Plaatsen op Instagram en TikTok (vereist media) | ⏳ |
| **Automatisch publiceren op het geplande moment (scheduler)** | ❌ |
| Analytics | ❌ |
| Betalingen / abonnementen | ❌ |

**Bekende knelpunten**
- De backend draait op het **gratis plan van Render**. Dat valt na inactiviteit in slaap, waardoor de eerste aanvraag 30–60 s duurt. Een scheduler kan daar ook niet betrouwbaar op draaien.
- De lokale Node.js-versie is 20. Supabase-js stopt binnenkort met de ondersteuning daarvan, dus upgraden naar Node 22+.
- Veo-video's kosten per seconde. Er is nu alleen een daglimiet, nog geen tegoed per abonnement.

---

## Doelgroepen

| Segment | Wie | Wat ze willen | Plan |
|---|---|---|---|
| **Freelancer / bureau** (hoofddoelgroep) | Social-media-freelancers en kleine bureaus met 5–25 klanten | Snel content per klant, klant laat goedkeuren, alles op één plek | Freelancer / Bureau |
| **Lokale ondernemer** | Bakker, kapper, installateur, webshop | "Elke week 3 posts zonder erover na te denken" | Solo |

---

## Fase 1: Fundament voor betrouwbaar publiceren
*Zonder automatisch publiceren is PostPilot een tekstgenerator. Dit gaat voor alles.*

- [ ] **Hosting zonder slaapstand**: de backend naar een betaald Render-plan (ca. $7/mnd). Daarmee verdwijnt ook de koude start. Vimexx-webhosting (DirectAdmin) kan geen Python-app permanent draaien, dus die wordt niet gebruikt voor de backend.
- [ ] **Vimexx inzetten waar het sterk in is**:
  - [ ] DNS van **postpilotai.nl**:
    - `postpilotai.nl` en `www`: landingspagina met uitleg, prijzen en aanmelden (Vercel)
    - `app.postpilotai.nl`: de app (Vercel, CNAME)
    - `api.postpilotai.nl`: de backend (Render, CNAME)
    - Supabase-instellingen, OAuth-redirect-URL's van alle platforms en `CORS_ORIGINS`/`FRONTEND_URL`/`BACKEND_PUBLIC_URL` daarop aanpassen
  - [ ] een mailbox (bijvoorbeeld `noreply@postpilotai.nl`) als SMTP voor Supabase Auth, met SPF, DKIM en DMARC ingesteld, zodat bevestigings- en herstelmails van het eigen adres komen en niet tegen de limiet van de standaardmail van Supabase aanlopen
  - [ ] een cronjob in DirectAdmin die elke minuut de scheduler aanroept (zie hieronder)
- [ ] **Scheduler**: een beveiligd endpoint `POST /internal/run-scheduler` (geheime header) dat elke minuut door een cronjob wordt aangeroepen en de ingeplande, goedgekeurde posts plaatst via `get_publisher(platform).publish(...)`. Geen apart proces dat altijd aan moet staan.
  - [ ] dezelfde post nooit dubbel plaatsen (vergrendeling per post, idempotent)
  - [ ] opnieuw proberen met backoff, rate limits per platform respecteren
  - [ ] status per post: `scheduled → publishing → published / failed`, met foutmelding
  - [ ] melding (e-mail) bij mislukte publicatie, met een knop "Opnieuw proberen"
  - [ ] tokens automatisch vernieuwen vóór ze verlopen; melding als opnieuw koppelen nodig is
- [ ] **Instagram publiceren** (afbeelding, carrousel, Reel) via de Instagram Graph API
- [ ] **TikTok publiceren** via de Content Posting API
- [ ] **App-reviews nu al aanvragen** bij Meta en TikTok: die duren weken
- [ ] Fallback voor elk platform dat (nog) niet kan: een klaar-om-te-posten-pakket (tekst + media) plus een melding op het geplande moment
- [ ] Node 22+ lokaal en in CI

**Klaar als:** een goedgekeurde post wordt op alle vijf platforms zonder handwerk op tijd geplaatst, en een mislukte poging wordt gemeld en opnieuw geprobeerd.

---

## Fase 2: Geld verdienen — abonnementen en klantgoedkeuring

### Abonnementen via Stripe
- [ ] De allowlist vervangen door open registratie met een proefperiode van 14 dagen
- [ ] Stripe Checkout + Customer Portal; webhooks synchroniseren de status naar de eigen database (idempotent en getest)
- [ ] Stripe Tax voor de btw, facturen met de bedrijfsgegevens van de klant
- [ ] Feature-gates en limieten per plan

| Plan | Merken | Inbegrepen | Voorstel prijs |
|---|---|---|---|
| **Solo** | 1 | Genereren, kalender, automatisch publiceren, 10 beelden/mnd | €15/mnd |
| **Freelancer** | 10 | + klantgoedkeuring via een link, weekplan, 50 beelden + 5 video's/mnd | €49/mnd |
| **Bureau** | 25 | + eigen logo en kleuren (white-label), teamleden, 150 beelden + 20 video's/mnd | €129/mnd |

Jaarlijks betalen: 2 maanden gratis. Prijzen zijn een voorstel en worden getest met de eerste klanten.

### Tegoed voor beeld en video
- [ ] Een tegoed per abonnement in plaats van alleen een daglimiet
- [ ] Extra tegoed los bij te kopen (bijvoorbeeld 10 video's voor €15)
- [ ] Tegoed en verbruik zichtbaar in het dashboard

### Klantgoedkeuring via een link
- [ ] Per merk of per selectie posts een deelbare link, zonder account voor de klant (een token met vervaldatum)
- [ ] De klant ziet een preview per platform en kan **goedkeuren**, **afwijzen** of **een opmerking plaatsen** per post
- [ ] Een melding naar de freelancer bij elke reactie; goedgekeurde posts gaan automatisch naar de kalender
- [ ] Herinnering aan de klant als hij na X dagen nog niet heeft gereageerd
- [ ] White-label (Bureau): eigen logo, kleuren en eventueel een eigen domein op de goedkeuringspagina

### Teams (Bureau)
- [ ] Teamleden uitnodigen, met rollen: eigenaar, redacteur, alleen-lezen
- [ ] Merken toewijzen aan teamleden

**Klaar als:** een nieuwe gebruiker zich zelf aanmeldt, betaalt, een klant uitnodigt om te keuren, en de goedgekeurde posts automatisch online gaan.

---

## Fase 3: Weekplan op de automatische piloot

- [ ] **Weekplan**: elke maandag (of op een zelfgekozen dag) staat per merk een voorstel klaar met het afgesproken aantal posts per platform, verdeeld over de week op goede tijden
- [ ] **Alles in één keer goedkeuren** of per post; op de telefoon door te swipen (rechts = goed, links = opnieuw)
- [ ] Een vaste mix per merk: bijvoorbeeld 40% kennis, 30% achter de schermen, 20% aanbod, 10% social proof
- [ ] **Nederlandse contentkalender**: momenten automatisch voorstellen (Koningsdag, Sinterklaas, Kerst, Black Friday, Moederdag, Valentijnsdag, start van het schooljaar, zomervakantie per regio, Week van de Duurzaamheid, branche-specifieke dagen), met een seintje ruim van tevoren
- [ ] **Waarschuwing bij gaten** in de planning per merk
- [ ] Beste posttijden per platform, eerst op basis van Nederlandse benchmarks en vanaf fase 4 op eigen data
- [ ] Goedkeuren via **WhatsApp of Telegram** (optioneel): het weekplan als bericht met knoppen

**Klaar als:** een lokale ondernemer alleen nog op maandag 2 minuten bezig is.

---

## Fase 4: Leerlus — analytics die de content beter maakt

- [ ] Prestaties ophalen per gepubliceerde post: bereik, weergaven, likes, reacties, shares, opslaan, kijkduur (waar het platform dat aanbiedt)
- [ ] **Analytics-dashboard** per merk en per platform, met een rapport per klant (PDF/link) voor bureaus
- [ ] **Inzichten** per merk, bijvoorbeeld: "Bij dit merk scoren posts met een vraag als opening 40% beter", "Carrousels doen het hier 2× beter dan losse afbeeldingen"
- [ ] Inzichten en de best presterende posts automatisch meegeven als context bij het genereren
- [ ] **Viral-score** per conceptpost (hook, verwachte kijkduur, deelbaarheid, trend-fit), eerst op basis van bewezen patronen en daarna getraind op eigen resultaten
- [ ] **Hook-lab**: één onderwerp → 10 hooks volgens bewezen patronen (vraag, contrast, getal, "stop met…", mythe, POV, enz.)
- [ ] Eigen beste posttijden per merk, in plaats van benchmarks

**Klaar als:** de gebruiker in het dashboard ziet dat de content van deze maand beter presteert dan die van vorige maand, en waarom.

---

## Fase 5: Meer bronnen — content uit wat er al is

- [ ] **Repurposing**: een blog, YouTube-video (transcript) of podcast → posts voor alle platforms
- [ ] **Webshop-koppeling**: een productfeed uit Shopify of WooCommerce → productposts, automatisch bij nieuwe producten of acties
- [ ] **Google-reviews → posts**: een goede review automatisch omzetten in een social-proof-post (met toestemming of geanonimiseerd)
- [ ] **Merkbibliotheek**: eigen foto's en video's uploaden en laten taggen, zodat de AI eigen beeld kan voorstellen in plaats van altijd te genereren
- [ ] **Korte video's**: script + voice-over + automatische ondertitels bovenop Veo, in de huisstijl van het merk
- [ ] Templates voor carrousels en afbeeldingen in de huisstijl van het merk

---

## Fase 6: Meer platforms

- [ ] **Google Bedrijfsprofiel**: posts, aanbiedingen en evenementen (belangrijk voor lokale ondernemers)
- [ ] **Threads**
- [ ] **Pinterest**
- [ ] **YouTube** (Shorts en lange video's)
- [ ] Elk platform als losse publisher achter de bestaande `Publisher`-interface

---

## Doorlopend: vertrouwen en compliance (verkoopargument)

- [ ] **AI-labels**: AI-gegenereerde beelden en video's automatisch labelen, conform de transparantieregels van de EU AI Act (van toepassing vanaf augustus 2026) en de eisen van Meta en TikTok
- [ ] **Data in de EU**: Supabase-project en backend in een EU-regio, en dat expliciet vermelden
- [ ] **AVG**: verwerkersovereenkomst voor bureaus, privacyverklaring, data exporteren en verwijderen per account
- [ ] Toegang en wijzigingen loggen (wie keurde wat goed, wanneer)
- [ ] Back-ups en een statuspagina

---

## Prioriteit in het kort

1. **Fase 1, scheduler en hosting**: zonder betrouwbaar automatisch publiceren is er geen product.
2. **Fase 2, Stripe en klantgoedkeuring**: daarmee komt er geld binnen, en klantgoedkeuring is de functie waarvoor bureaus betalen.
3. **Fase 4, leerlus**: dit maakt PostPilot op lange termijn moeilijk te vervangen.
4. Fase 3, 5 en 6 daarna, in de volgorde waarin klanten erom vragen.

## Open beslissingen

- [ ] Prijzen en tegoed per plan definitief maken (na gesprekken met 5–10 freelancers)
- [x] Hosting: frontend op Vercel, backend op Render (betaald plan), domein + mail + cronjob via Vimexx
- [x] Naam en domein: **PostPilot AI** op **postpilotai.nl** (in beheer bij Vimexx)
- [ ] Merkrecht: andere tools heten ook "PostPilot". Laat vóór de lancering een merkcheck doen (BOIP) en communiceer altijd als "PostPilot AI" met het eigen domein.
- [ ] Bedrijfsgegevens (KvK, btw) voor Stripe live-modus
