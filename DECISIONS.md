# Beslissingen (Decision Log)

Format: datum · beslissing · waarom · alternatieven.

---

### 2026-10-19 · App bouwen in de `ContentRoom`-branch, portaal op `main` blijft
**Waarom:** de repo `development` bevat op `main` een portaal met andere live projecten (GitHub Pages). Alleen deze branch wordt leeggemaakt, zodat de andere projecten online blijven. De deploy-workflow verdwijnt uit deze branch, zodat een push hier het portaal niet overschrijft.
**Alternatieven:** aparte repo (later nog mogelijk, git-historie gaat mee); `main` leegmaken (afgewezen: haalt alle projecten offline).

### 2026-10-19 · Multi-user SaaS met accounts
**Waarom:** creators moeten zelf een account kunnen aanmaken. Daarom vanaf dag één: authenticatie, data per `Workspace` en Row Level Security.

### 2026-10-19 · Hosting: Vercel + Supabase
**Waarom:** Next.js draait native op Vercel. Supabase levert Postgres, Auth en Storage in één, met gratis tiers om te starten. Lokaal ontwikkelen kan met de Supabase CLI.
**Alternatieven:** Railway/Fly.io (beter voor langlopende workers, heroverwegen in fase 2 als Vercel Cron niet volstaat); alleen lokaal.

### 2026-10-19 · Stack: Next.js (App Router) + TypeScript + Tailwind + shadcn/ui + Prisma + Vitest
**Waarom:** één taal voor front- en backend, sterke typing voor AI-output (met zod-validatie), en een groot ecosysteem.

### 2026-10-19 · Interface in het Nederlands, contenttaal per brand-profiel (NL/EN/beide)
**Waarom:** keuze van de gebruiker. De UI-teksten komen in een i18n-structuur, zodat een Engelse UI later eenvoudig toe te voegen is.

### 2026-10-19 · AI via Claude API, prompts als losse bestanden in `/prompts`
**Waarom:** prompts zijn aan te passen zonder codewijziging. Gestructureerde output (JSON + zod) maakt scripts betrouwbaar renderbaar. Modelkeuze per taak: een sterk model voor ideeën en scripts, een snel en goedkoop model voor varianten, hashtags en brand-checks. Elke aanroep wordt gelogd (tokens en geschatte kosten), zodat de creator het verbruik van zijn eigen key kan zien.

### 2026-10-19 · Bring your own key: creators leveren hun eigen Anthropic API-key
**Waarom:** keuze van de gebruiker. De AI-kosten liggen bij de creator, dus er is geen kostenrisico per gebruiker voor Hookline.
**Gevolgen:**
- Keys worden versleuteld opgeslagen (AES-256-GCM, master key alleen in `.env`), nooit gelogd en nooit naar de browser gestuurd. Alle Claude-aanroepen lopen server-side.
- De key wordt bij het invoeren gevalideerd met een minimale testaanroep.
- Fouten van de key (ongeldig, geen tegoed, rate limit) worden als begrijpelijke melding getoond, met een link naar de Anthropic Console.
- De onboarding legt stap voor stap uit hoe je een key aanmaakt.

### 2026-10-19 · Betaalde abonnementen via Stripe
**Waarom:** keuze van de gebruiker. Omdat de AI-kosten via de eigen key lopen, betaalt het abonnement voor de app zelf: workflow, kalender, integraties en analytics.
**Opzet:** Stripe Checkout + Customer Portal, met de abonnementsstatus via webhooks in de eigen database. Dat de app in de webhook-handler idempotent werkt, wordt getest. Plannen (voorstel):
- **Proef**: 14 dagen, alles van Creator
- **Creator**: 1 brand-profiel, ideeën, scripts, hook-lab, kalender, publiceren op 2 platforms (vanaf fase 2)
- **Pro**: 3 brand-profielen, alle platforms, analytics + leerlus, repurposing
- **Agency** (later): teams en rollen
**Alternatieven:** Lemon Squeezy/Paddle (merchant of record, regelt de btw zelf). Afgewezen, omdat de gebruiker voor Stripe koos. Stripe Tax kan de btw afhandelen.

### 2026-10-19 · Productnaam: Hookline
**Waarom:** de hook is het belangrijkste onderdeel van virale content, en "line" verwijst naar de pijplijn van idee tot post. De naam werkt in het NL en EN. *Merk- en domeinbeschikbaarheid nog controleren voor de lancering.*

### 2026-10-19 · Alleen officiële platform-API's
**Waarom:** scraping en browserautomatisering schenden de voorwaarden en leiden tot geblokkeerde accounts. Waar publiceren via de API niet kan, val de app terug op een klaar-om-te-posten-pakket + melding.

### 2026-10-19 · Platforms: TikTok, Instagram, YouTube, LinkedIn (alle vier in scope)
**Waarom:** keuze van de gebruiker. Integratievolgorde voorlopig YouTube → LinkedIn → Instagram → TikTok, op basis van de zwaarte van de app-review. Wordt bevestigd na het nalopen van de actuele documentatie in fase 2.

### 2026-10-19 · "Viraal" = onderbouwde viral-score, geen garantie
**Waarom:** eerlijk naar gebruikers. De score combineert bewezen patronen (hook, retentie, lengte, CTA) en vanaf fase 3 de eigen prestatiedata van de creator.
