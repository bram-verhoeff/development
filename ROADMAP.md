# Hookline — Roadmap

> **Hookline**: een SaaS waarin creators een account aanmaken en met AI-tools content bedenken, schrijven, plannen, publiceren en analyseren. Creators gebruiken hun eigen Anthropic API-key en betalen een abonnement (Stripe) voor de app zelf.

Status: 🟡 **Plan ter goedkeuring**. Er is nog geen code geschreven.

---

## Productvisie

Eén plek van idee → script → kalender → gepubliceerde post → inzicht. De app leert van wat werkt en stuurt nieuwe ideeën die kant op.

Over "viraal": geen enkele tool kan viraliteit garanderen. Wat de app wel doet, is de bewezen patronen systematisch toepassen: sterke hooks, retentie-structuur, duidelijke CTA en de juiste lengte per platform. Elk idee krijgt een onderbouwde **viral-score**. Vanaf fase 3 traint de app op de eigen resultaten van de creator, zodat die score steeds beter wordt.

## Architectuur (overzicht)

```
┌──────────────────────────── Next.js app (Vercel) ────────────────────────────┐
│  UI (App Router, React, Tailwind, shadcn/ui)                                 │
│  Server Actions / Route Handlers                                             │
│    ├─ ai/        → Claude API met key van de gebruiker, prompts /prompts/*.md│
│    ├─ billing/   → Stripe Checkout, Customer Portal, webhooks              │
│    ├─ domain/    → brand-profiel, ideeën, scripts, kalender (pure logica)    │
│    └─ platforms/ → één module per platform achter PlatformAdapter (fase 2)   │
└──────────────┬──────────────────────────────────────────┬────────────────────┘
               │                                          │
        Supabase Postgres  ◄── Prisma ORM          Supabase Auth (e-mail + Google)
        Supabase Storage (media, fase 2)           
               │
        Achtergrondjobs (fase 2+): Vercel Cron → job-tabel in Postgres
        (ingeplande posts, token-refresh, analytics ophalen, met retries/backoff)
```

### Platform-interface (fase 2)

```ts
interface PlatformAdapter {
  id: 'tiktok' | 'instagram' | 'youtube' | 'linkedin' | ...;
  capabilities: { directPublish: boolean; schedule: boolean; analytics: boolean; formats: Format[] };
  connect(userId): Promise<AuthUrl>;            // OAuth start
  handleCallback(code): Promise<Connection>;    // tokens versleuteld opslaan
  publish(post, connection): Promise<PublishResult>;
  schedule(post, at, connection): Promise<ScheduleResult>; // native of via eigen queue
  fetchAnalytics(postRef, connection): Promise<Metrics>;
}
```

Kan een platform of accounttype niet via de API publiceren, dan krijgt de creator een **klaar-om-te-posten-pakket** (tekst, media, hashtags) en een melding op het geplande moment.

## Datamodel (kern)

| Tabel | Belangrijkste velden |
|---|---|
| `User` | id, email, naam, locale (beheerd via Supabase Auth) |
| `ApiKey` | userId, provider (`anthropic`), encryptedKey (AES-256-GCM), last4, status (valid/invalid), laatstGecontroleerd |
| `Subscription` | userId, stripeCustomerId, stripeSubscriptionId, plan (`trial`/`creator`/`pro`), status, currentPeriodEnd |
| `Workspace` | id, ownerId, naam (één creator kan meerdere merken hebben) |
| `BrandProfile` | workspaceId, niche, doelgroep, toneOfVoice, contentTaal (nl/en/beide), verbodenWoorden[], kernboodschappen[], voorbeeldposts[] |
| `Idea` | workspaceId, titel, hook, beschrijving, platforms[], tags[], status (`backlog`→`in_progress`→`scripted`→`scheduled`→`published`/`archived`), viralScore, scoreRationale, bron (ai/handmatig) |
| `Script` | ideaId, platform, format (short/long/post/carousel), inhoud (JSON per format: hook, scènes, onScreenText, cta, caption, hashtags, slides, titels, hoofdstukken…), versie |
| `CalendarItem` | workspaceId, scriptId, platform, geplandOp (UTC + tz), status, notities |
| `GenerationLog` | userId, type, model, tokens in/uit, geschatte kosten (zodat de creator ziet wat zijn key verbruikt) |
| *fase 2* `PlatformConnection` | workspaceId, platform, accountId, encryptedTokens, scopes, expiresAt |
| *fase 2* `Job` | type, payload, runAt, attempts, lastError, status |
| *fase 3* `PostMetrics` | calendarItemId, views, likes, comments, shares, saves, watchTime, gemetenOp |
| *fase 3* `Insight` | workspaceId, tekst, onderbouwing, actief |

## Mappenstructuur (gepland)

```
/
├─ app/                    # Next.js routes
│  ├─ (auth)/login, signup
│  └─ (app)/dashboard, brand, ideas, scripts, calendar, settings
├─ components/             # UI-componenten
├─ lib/
│  ├─ ai/                  # Claude-client (per-user key), prompt-loader, output-validatie (zod)
│  ├─ billing/             # Stripe: plannen, checkout, webhooks, feature-gates
│  ├─ domain/              # pure kernlogica (getest)
│  ├─ platforms/           # fase 2: adapter per platform
│  ├─ jobs/                # fase 2: queue-runner
│  └─ crypto/              # encryptie van API-keys (fase 1) en OAuth-tokens (fase 2)
├─ prompts/                # aanpasbare prompt-bestanden per contenttype
│  ├─ ideas.md
│  ├─ script.short-video.md
│  ├─ script.youtube-long.md
│  ├─ script.linkedin.md
│  ├─ script.instagram.md
│  └─ viral-score.md
├─ prisma/schema.prisma
├─ tests/
├─ .env.example
├─ README.md
├─ ROADMAP.md
└─ DECISIONS.md
```

---

## Fases

### Fase 0: Opschonen en fundament
- [ ] ContentRoom-branch leegmaken (oude portaalbestanden en deploy-workflow weg)
- [ ] Next.js + TypeScript + Tailwind + Prisma + Vitest opzetten
- [ ] Supabase-project koppelen, `.env.example`, README
- [ ] Account aanmaken, inloggen en uitloggen (e-mail + Google)
- [ ] Instellingen: eigen Anthropic API-key invoeren → validatie met een testaanroep → versleuteld opslaan (alleen de laatste 4 tekens zichtbaar)

**Opleveren:** je kunt lokaal een account aanmaken, je key koppelen en komt in een leeg dashboard.

### Fase 1: MVP (zonder platformkoppelingen)
- [ ] **Onboarding en brand-profiel**: wizard (niche, doelgroep, toon, taal, verboden woorden, voorbeeldposts)
- [ ] **Ideeën-engine**: batch-ideeën genereren met hook, format, platform en viral-score met uitleg. Backlog met tags, status, filters en "meer zoals dit"
- [ ] **Scriptschrijver** per platform:
  - TikTok / Reels / Shorts: 3 hook-varianten, scènes, on-screen tekst, CTA
  - YouTube lang: titelopties, outline, script, beschrijving, hoofdstukken, tags
  - LinkedIn: openingszin, post met leesbare opmaak, carrouseltekst
  - Instagram: caption, hashtags, carrouselslides
- [ ] **Hook-lab**: één hook herschrijven in 10 bewezen patronen (vraag, contrast, getal, "stop met…", enz.)
- [ ] **Contentkalender**: maand- en weekweergave, drag & drop, best-practice posttijden (Europe/Amsterdam), waarschuwing bij gaten
- [ ] Brand-check: elke generatie wordt getoetst aan verboden woorden en toon
- [ ] Verbruiksoverzicht: tokens en geschatte kosten van de eigen key per maand, en duidelijke meldingen bij een ongeldige key of rate limit
- [ ] **Abonnementen via Stripe**: 14 dagen proef → Creator/Pro, Stripe Checkout + Customer Portal, webhooks synchroniseren de status, feature-gates per plan (zie DECISIONS.md)
- [ ] Tests voor de kernlogica (status-flow, kalender-gaten, prompt-opbouw, output-parsing)
- [ ] Deploy naar Vercel

**Opleveren:** een online app waarin een creator zich aanmeldt, een abonnement afsluit (Stripe testmodus), een key koppelt, een profiel invult, ideeën en scripts genereert en zijn kalender vult. → *Feedbackmoment*

### Fase 2: Platformintegraties
Volgorde (voorlopig): **YouTube → LinkedIn → Instagram → TikTok**. YouTube en LinkedIn hebben de minst zware app-review. Instagram en TikTok vereisen een (business/creator-)account en een app-audit, en die kan weken duren. Die aanvragen starten we daarom al vroeg in fase 1.
- [ ] Per platform eerst de actuele documentatie nalopen: accounttypes, scopes, review en limieten (vastleggen in DECISIONS.md)
- [ ] `PlatformAdapter`-interface + OAuth + tokens versleuteld (AES-256-GCM) + auto-refresh
- [ ] Mediabibliotheek (Supabase Storage)
- [ ] Job-queue: ingeplande posts, retries met backoff, rate-limit-afhandeling
- [ ] Fallback: klaar-om-te-posten-pakket + melding (e-mail/push)

**Opleveren:** per platform één echte post die automatisch gepubliceerd wordt. → *Feedbackmoment per platform*

### Fase 3: Analytics en leerlus
- [ ] Metrics periodiek ophalen per platform
- [ ] Dashboard: prestaties per platform, format en hook-type
- [ ] Inzichten genereren ("hooks met een vraag scoren 40% beter bij jou")
- [ ] Inzichten en topposts terugvoeren in de ideeën-engine en de viral-score

**Opleveren:** dashboard met echte data + merkbaar betere ideeën. → *Feedbackmoment*

### Fase 4: Repurposing en uitbreiding
- [ ] Lange video, blog of transcript → varianten voor alle platforms
- [ ] Extra platforms: X, Facebook, Pinterest, Threads
- [ ] Teams en rollen (Agency-plan)

---

## Openstaande vragen
1. Prijzen per plan: voorstel Creator €12/mnd, Pro €29/mnd (jaarlijks 2 maanden gratis). Akkoord?
2. Bedrijfsgegevens voor Stripe (KvK, btw) zijn nodig vóór live-modus. Tot die tijd draait alles in testmodus.
