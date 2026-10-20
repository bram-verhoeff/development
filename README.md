# PostPilot

PostPilot is een webapplicatie om per merk social-mediacontent te laten schrijven door AI (Google Gemini; Claude kan ook), die posts te beoordelen en ze in een kalender in te plannen.

- **Merken**: onbeperkt merkprofielen met doelgroep, tone of voice, USP's, kleuren, logo en woorden die vermeden moeten worden.
- **Genereren**: posts, hooks en hashtags voor Instagram, LinkedIn, TikTok, X en Facebook, met de juiste lengte en stijl per platform. Optioneel op basis van een webpagina of eigen tekst.
- **Beoordelen**: elke post is *concept*, *goedgekeurd* of *afgewezen*. Je kunt hem zelf bewerken of opnieuw laten schrijven met extra instructies. Elke versie wordt bewaard.
- **Beeld en video**: laat bij een post een afbeelding (Gemini Image) of korte video (Veo) maken in de stijl en kleuren van het merk, met de juiste verhouding per platform.
- **Kalender**: goedgekeurde posts inplannen (Nederlandse tijd), met filters op merk en platform.
- **Toegang**: inloggen en registreren via Supabase. Alleen e-mailadressen op een allowlist mogen registreren.
- **Koppelen en plaatsen**: koppel per merk LinkedIn, X, een Facebook-pagina, Instagram en TikTok, of allemaal tegelijk met **Alles koppelen**. Goedgekeurde posts plaats je met één klik op LinkedIn, X en Facebook. Instagram en TikTok accepteren alleen posts met afbeelding of video; dat volgt.

- **Automatisch plaatsen**: goedgekeurde, ingeplande posts worden op het geplande moment vanzelf geplaatst, met nieuwe pogingen bij tijdelijke fouten. Zie [Automatisch publiceren (scheduler)](#automatisch-publiceren-scheduler).

## Architectuur

```
Browser ─► Next.js (frontend/, Vercel) ── Supabase Auth: registreren, inloggen, wachtwoordherstel
              │  stuurt bij elke API-aanroep het Supabase-token mee (server-side)
              ▼
           FastAPI (backend/, Render) ── controleert het token (JWKS) + allowlist
              ├─► Database via SQLAlchemy + Alembic (lokaal SQLite, online Supabase Postgres)
              ├─► Supabase Storage (logo's)
              └─► Gemini API (google-genai SDK), of Claude via AI_PROVIDER=claude
```

| Map | Inhoud |
|---|---|
| `backend/app/routers/` | API-routes: `auth`, `brands`, `generate`, `posts`, `dashboard` |
| `backend/app/services/ai/` | AI-aanroepen (`gemini.py`, `claude.py` op een gedeelde basis in `writer.py`), prompts, regels per platform |
| `backend/app/services/` | bron ophalen (SSRF-veilig), controles, opslag van logo's, postlogica |
| `backend/app/publishers/` | gedeelde interface voor publiceren per platform (fase 2) |
| `backend/prompts/` | de prompts als `.md`-bestanden; aan te passen zonder codewijziging |
| `backend/alembic/` | databasemigraties |
| `frontend/src/app/` | pagina's: dashboard, genereren, posts, kalender, merken, login |
| `frontend/messages/nl.json` | alle teksten van de interface |

## Vereisten

- Python 3.12 of nieuwer (getest met 3.13)
- Node.js 20 of nieuwer (getest met 24)
- Een Supabase-project (gratis) en een Gemini API-sleutel ([Google AI Studio](https://aistudio.google.com/apikey))

## Lokaal opstarten

### 1. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
copy .env.example .env          # macOS/Linux: cp .env.example .env  → daarna invullen
alembic upgrade head            # maakt of bijwerkt de databasetabellen
python -m scripts.setup_storage # eenmalig: opslag voor logo's in Supabase
uvicorn app.main:app --reload
```

De API draait op http://localhost:8000, met documentatie op http://localhost:8000/docs.

> Op Windows blijft `--reload` soms hangen na een codewijziging. Start de server dan opnieuw (zonder `--reload` als het vaker gebeurt).

### 2. Frontend

```bash
cd frontend
npm install
copy .env.example .env.local    # macOS/Linux: cp .env.example .env.local → daarna invullen
npm run dev
```

De app draait op http://localhost:3000.

### 3. Supabase instellen

1. Maak een project aan op [supabase.com](https://supabase.com).
2. **Authentication → Sign In / Providers → Email**: zet *Email* aan, met *Confirm email* aan.
3. **Authentication → URL Configuration**:
   - *Site URL*: `http://localhost:3000` (online: het adres van de frontend)
   - *Redirect URLs*: `http://localhost:3000/auth/callback` (online ook `https://<jouw-frontend>/auth/callback`)
4. **Project Settings → API Keys**:
   - project-URL + *publishable key* → `frontend/.env.local`
   - project-URL + *secret key* → `backend/.env` (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`)
5. Zet in `backend/.env` bij `ALLOWED_EMAILS` de e-mailadressen die mogen registreren, gescheiden door komma's.

**Zo werkt de toegang:**
- Registreren controleert eerst of het e-mailadres op de allowlist staat.
- De backend controleert bij elke aanroep het token van Supabase en de allowlist. Een account zonder toegang kan daardoor niets doen, ook niet als het buiten de app om is aangemaakt.

## Configuratie

Alle sleutels staan in `backend/.env` en `frontend/.env.local`. Die bestanden staan niet in git; de `.env.example`-bestanden laten zien welke variabelen nodig zijn.

**Backend** (`backend/.env`)

| Variabele | Betekenis |
|---|---|
| `DATABASE_URL` | `sqlite:///./postpilot.db` lokaal; online de Supabase-connection string (`postgresql://…` mag zo geplakt worden) |
| `CORS_ORIGINS` | adres(sen) van de frontend, kommagescheiden |
| `AI_PROVIDER` | `gemini` (standaard) of `claude` |
| `GEMINI_API_KEY` | sleutel van [Google AI Studio](https://aistudio.google.com/apikey) |
| `GEMINI_MODEL` | `gemini-flash-latest` (standaard, snel en voordelig) of `gemini-pro-latest` (grondiger) |
| `GEMINI_IMAGE_MODEL` | beeldmodel, standaard `gemini-3.1-flash-image` |
| `GEMINI_VIDEO_MODEL` | videomodel, standaard `veo-3.1-fast-generate-preview` (`veo-3.1-lite-…` is goedkoper, `veo-3.1-generate-preview` mooier) |
| `VIDEO_DURATION_SECONDS` | lengte van video's: 4, 6 of 8 |
| `VIDEO_DAILY_LIMIT` | maximaal aantal video's per gebruiker per 24 uur (standaard 5) |
| `MEDIA_BUCKET` | bucket voor gegenereerde media (standaard `media`; aanmaken met `python -m scripts.setup_storage`) |
| `ANTHROPIC_API_KEY`, `CLAUDE_MODEL`, `CLAUDE_EFFORT` | alleen bij `AI_PROVIDER=claude` |
| `GENERATION_DAILY_LIMIT` | maximaal aantal AI-opdrachten per gebruiker per 24 uur (standaard 100) |
| `SUPABASE_URL` | project-URL van Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | *secret key* (of oude *service_role key*). Alleen in de backend! |
| `SUPABASE_JWT_SECRET` | alleen voor oudere Supabase-projecten met HS256-tokens; anders leeg |
| `STORAGE_BUCKET` | naam van de bucket voor logo's (standaard `logos`) |
| `ALLOWED_EMAILS` | wie mag registreren en de app gebruiken |
| `APP_SECRET_KEY` | geheim (min. 32 tekens) voor het versleutelen van platform-tokens; nooit wijzigen na het koppelen |
| `CRON_SECRET` | geheim voor de cronjob van de scheduler; leeg = automatisch plaatsen staat uit |
| `BACKEND_PUBLIC_URL` | publiek adres van de backend (waar LinkedIn naar terugstuurt) |
| `FRONTEND_URL` | publiek adres van de frontend (waar je na het koppelen terugkomt) |
| `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET` | van je LinkedIn-app, zie hieronder |
| `LINKEDIN_API_VERSION` | versie van de LinkedIn-API (`JJJJMM`); versies vervallen na ongeveer een jaar |
| `X_CLIENT_ID`, `X_CLIENT_SECRET` | van je X-app (OAuth 2.0) |
| `META_APP_ID`, `META_APP_SECRET` | van je Meta-app (Facebook-pagina's) |
| `INSTAGRAM_APP_ID`, `INSTAGRAM_APP_SECRET` | Instagram-app-ID en -geheim uit dezelfde Meta-app (Instagram Login) |
| `META_GRAPH_VERSION` | versie van de Graph API, bijv. `v26.0` |
| `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET` | van je TikTok-app |

**Frontend** (`frontend/.env.local`)

| Variabele | Betekenis |
|---|---|
| `NEXT_PUBLIC_API_URL` | adres van de backend |
| `NEXT_PUBLIC_SITE_URL` | adres van de frontend zelf (voor links in mails) |
| `NEXT_PUBLIC_SUPABASE_URL` | project-URL van Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | *publishable key* (of oude *anon key*); mag publiek zijn |

## Testen

```bash
cd backend
pytest                          # alle backendtests (Gemini, Claude en Supabase worden nagebootst)

cd frontend
npx tsc --noEmit                # typecontrole
npm run lint
npm run build
```

## Hoe de AI werkt

- Per platform gaat er één aanroep naar de AI. Die aanroepen lopen tegelijk, dus genereren voor meerdere platforms duurt niet veel langer.
- Het model antwoordt in een vast JSON-formaat (hook, tekst, hashtags) dat de backend met Pydantic controleert.
- De prompts staan in `backend/prompts/`. De regels per platform (lengte, stijl, aantal hashtags) staan in `backend/app/services/ai/platforms.py`.
- Een webpagina als bron wordt server-side opgehaald, alleen van publieke adressen. Interne netwerkadressen worden geblokkeerd.
- Na het schrijven controleert PostPilot elke post op lengte, aantal hashtags en te vermijden woorden, en toont waarschuwingen.
- Blokkeert het model een verzoek (veiligheidsfilter), dan krijg je een duidelijke melding om de bron of instructies aan te passen. Bij Claude probeert de API het eerst nog automatisch met een ander model.
- Een andere AI-dienst toevoegen: een subklasse van `BaseWriter` in `backend/app/services/ai/` die alleen `_ask` implementeert.
- Genereren en herschrijven tellen mee voor de daglimiet. Tokens per opdracht worden opgeslagen in `generation_runs`.

## Beeld en video

Op de pagina van een post staat het blok **Beeld & video**:
- **Afbeelding**: klaar in ongeveer 10 seconden.
- **Video**: Veo maakt op de achtergrond een clip van 4 tot 8 seconden. Dat duurt meestal 1 à 3 minuten. De pagina vraagt zelf op wanneer hij klaar is, en je mag de pagina intussen verlaten.

Wat je verder moet weten:
- Het merkprofiel (kleuren, toon, doelgroep) en de tekst van de post gaan mee in de prompt. De prompts staan in `backend/prompts/image.md` en `video.md`.
- De beeldverhouding past bij het platform: Instagram 4:5, TikTok 9:16, X 16:9, LinkedIn en Facebook 1:1. Video's zijn 9:16 of 16:9.
- Bestanden komen in de publieke Supabase-bucket `media`. Je kunt ze downloaden of verwijderen.
- **Kosten**: beelden en video's zitten niet in het gratis plan van Google. Zet *Billing* aan in Google AI Studio. Video's kosten per seconde, en daarom is er een aparte daglimiet.

## Database en migraties

- Lokaal: SQLite. Online: PostgreSQL van Supabase, via `DATABASE_URL`.
- Wijzig je een model in `backend/app/models.py`, maak dan een migratie en voer die uit:

  ```bash
  alembic revision --autogenerate -m "korte omschrijving"
  alembic upgrade head
  ```
- Op PostgreSQL zet de eerste migratie Row Level Security aan op alle tabellen (zonder policies). Daardoor kan alleen de backend de data lezen, niet de publieke Supabase-API.

## Online zetten

**1. Database (Supabase)**
- Open je project en klik op **Connect** → *Session pooler*. Kopieer de connection string en vul je databasewachtwoord in.
- Gebruik de pooler, niet de directe verbinding: Render heeft geen IPv6, en de directe verbinding van Supabase wel alleen IPv6.

**2. Backend (Render)**
- Zet deze branch op GitHub.
- Kies in Render **New → Blueprint** en selecteer de repo. `render.yaml` regelt de rest:
  - de build;
  - `alembic upgrade head` bij elke start;
  - de health-check op `/health`.
- Vul de geheime variabelen in het dashboard in. Zet `CORS_ORIGINS` op het adres van de frontend.
- Let op: het gratis plan valt na een kwartier zonder verkeer in slaap. Het eerste verzoek daarna duurt ongeveer een minuut.

**3. Frontend (Vercel)**
- Kies **Add New → Project**, kies de repo en zet *Root Directory* op `frontend`.
- Vul de vier `NEXT_PUBLIC_…`-variabelen in, met `NEXT_PUBLIC_API_URL` = het Render-adres.

**4. Supabase-URL's**
- Zet onder *Authentication → URL Configuration* de *Site URL* op het Vercel-adres.
- Voeg `https://<vercel-adres>/auth/callback` toe aan de *Redirect URLs*.

## Talen

De interface is Nederlands. Alle teksten staan in `frontend/messages/nl.json`. De backend geeft alleen codes terug (`approved`, `post_not_approved`), die de frontend vertaalt.

Een taal toevoegen:
1. Maak `messages/<code>.json`.
2. Voeg de code toe in `frontend/src/i18n/config.ts`.
3. De taal wordt gekozen via de cookie `locale`.

De taal van de gegenereerde posts stel je per merk in.

## Social media koppelen

Op de pagina van een merk staat **Koppelingen**:
- **Alles koppelen** gaat alle ingestelde, nog niet gekoppelde platforms na elkaar langs. Annuleer je er een, of mislukt het, dan slaat hij dat platform in die ronde over.
- Een platform verschijnt pas als koppelbaar als de client-ID en het geheim in `backend/.env` staan. Herstart daarna de backend.

De redirect-URL die je bij elk platform invult, is steeds `<BACKEND_PUBLIC_URL>/connections/<platform>/callback`. Lokaal is dat bijvoorbeeld `http://localhost:8000/connections/x/callback`.

> Sommige platforms (zeker TikTok, en Instagram) accepteren alleen **https**-adressen als redirect-URL, dus niet `http://localhost`. Koppel die na het online zetten, of gebruik lokaal een tunnel (bijv. ngrok) en zet `BACKEND_PUBLIC_URL` op dat https-adres.

### LinkedIn

1. Ga naar [linkedin.com/developers/apps](https://www.linkedin.com/developers/apps) → **Create app**.
   - Een LinkedIn-app moet aan een bedrijfspagina hangen. Heb je die niet, maak er dan eerst een aan (dat kan gratis).
2. **Products**: voeg **Sign In with LinkedIn using OpenID Connect** en **Share on LinkedIn** toe. Die zijn direct actief.
3. **Auth** → *Authorized redirect URLs for your app*: voeg `http://localhost:8000/connections/linkedin/callback` toe. Online ook `https://<backend-adres>/connections/linkedin/callback`.
4. Kopieer op het tabblad **Auth** de *Client ID* en het *Primary Client Secret* naar `backend/.env` (`LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`) en herstart de backend.
5. Open in PostPilot een merk → **Koppelingen** → **LinkedIn koppelen**.

**Goed om te weten:**
- PostPilot post op het **persoonlijke profiel** van het gekoppelde account. Posten op een bedrijfspagina vereist een product dat LinkedIn eerst moet goedkeuren (Community Management API).
- Een gratis LinkedIn-app krijgt geen refresh-tokens. Een koppeling verloopt daarom na ongeveer 60 dagen; PostPilot laat zien wanneer, en dan koppel je opnieuw.
- Tokens worden versleuteld opgeslagen met `APP_SECRET_KEY`. Verander je die sleutel, dan moeten alle accounts opnieuw gekoppeld worden.

### X
1. Maak op [developer.x.com](https://developer.x.com) een project en app aan.
2. Kies bij **User authentication settings**: OAuth 2.0, type **Web App** (confidential client), met de rechten *Read and write*.
3. Vul de redirect-URL `…/connections/x/callback` en een website-URL in.
4. Kopieer bij **Keys and tokens** de *OAuth 2.0 Client ID* en het *Client Secret* naar `X_CLIENT_ID` en `X_CLIENT_SECRET`.

Goed om te weten:
- Toegangstokens gelden 2 uur. PostPilot ververst ze automatisch.
- Posten via de X-API kost geld volgens het tarief van X (pay-per-use). Zonder tegoed krijg je een melding.

### Facebook (pagina)
1. Maak op [developers.facebook.com](https://developers.facebook.com/apps) een app aan, type **Business**.
2. Voeg **Facebook Login for Business** toe en zet `…/connections/facebook/callback` bij de geldige OAuth-redirect-URI's.
3. Kopieer onder *App settings → Basic* het *App ID* en het *App secret* naar `META_APP_ID` en `META_APP_SECRET`.

Goed om te weten:
- PostPilot koppelt de **eerste pagina** die je beheert, en post daar als die pagina. Het pagina-token verloopt niet.
- In ontwikkelmodus werkt het alleen voor mensen met een rol in de app. Voor anderen moet Meta de rechten `pages_manage_posts` en `pages_read_engagement` eerst beoordelen.

### Instagram
1. Voeg in dezelfde Meta-app het product **Instagram** toe, en kies daar **API setup with Instagram login**.
2. Zet `…/connections/instagram/callback` bij de redirect-URL's.
3. Kopieer het *Instagram app ID* en het *Instagram app secret* naar `INSTAGRAM_APP_ID` en `INSTAGRAM_APP_SECRET`.

Goed om te weten:
- Je hebt een **professioneel** Instagram-account nodig (zakelijk of creator).
- Het token geldt 60 dagen. PostPilot ververst het automatisch, ruim voordat het verloopt.
- Instagram accepteert alleen posts met een afbeelding of video. Plaatsen via PostPilot volgt zodra afbeeldingen ondersteund worden.

### TikTok
1. Maak op [developers.tiktok.com](https://developers.tiktok.com) een app aan, met de producten **Login Kit** en **Content Posting API**.
2. Zet de redirect-URL `…/connections/tiktok/callback`. Dat moet een https-adres zijn, zie de opmerking hierboven.
3. Kopieer de *Client key* en het *Client secret* naar `TIKTOK_CLIENT_KEY` en `TIKTOK_CLIENT_SECRET`.

Goed om te weten:
- TikTok accepteert alleen video's en foto's.
- Zonder audit door TikTok worden posts alleen privé geplaatst. Plaatsen via PostPilot volgt samen met ondersteuning voor media.

## Automatisch publiceren (scheduler)

Goedgekeurde posts met een geplande tijd worden automatisch geplaatst. Er draait geen apart proces: een cronjob roept elke minuut dit endpoint aan.

```
POST /internal/run-scheduler      header: X-Cron-Secret: <CRON_SECRET>
```

Per run (`backend/app/services/scheduler.py`):
- Alle posts die **goedgekeurd** zijn, **nog niet online** staan en waarvan de **geplande tijd voorbij** is, worden geplaatst (maximaal 25 per run, ruim binnen een minuut).
- Elke post wordt eerst **vergrendeld** met één database-update. Twee runs tegelijk, of een run en de knop "Nu plaatsen", kunnen een post dus nooit dubbel plaatsen. Een vergrendeling die ouder is dan 10 minuten (vastgelopen poging) wordt overgenomen.
- **Tijdelijke fout** (storing, rate limit): nieuwe poging na 2, 10, 30 en 120 minuten; daarna stopt de scheduler.
- **Blijvende fout** (koppeling verlopen, post geweigerd): de scheduler stopt meteen. De foutcode staat bij de post. Opnieuw inplannen of "Nu plaatsen" begint weer bij nul.
- Het antwoord laat zien wat er gebeurde: `{"published": [...], "retrying": [...], "failed": [...]}`.

**Instellen**
1. Maak een geheim: `python -c "import secrets; print(secrets.token_urlsafe(48))"` en zet het als `CRON_SECRET` in de backend (lokaal in `backend/.env`, online in het dashboard van Render). Zonder `CRON_SECRET` staat automatisch plaatsen uit.
2. Maak een cronjob die elke minuut draait. Bijvoorbeeld in **DirectAdmin (Vimexx) → Geavanceerde functies → Cronjobs**, met als tijd `* * * * *` en als commando:
   ```
   curl -fsS -m 55 -X POST -H "X-Cron-Secret: <CRON_SECRET>" https://api.postpilotai.nl/internal/run-scheduler > /dev/null
   ```
   Werkt ook met Vercel Cron: die stuurt `Authorization: Bearer <CRON_SECRET>`, wat de backend ook accepteert.
3. Lokaal testen: `curl -X POST -H "X-Cron-Secret: <CRON_SECRET>" http://localhost:8000/internal/run-scheduler`

Let op: op het gratis plan van Render slaapt de backend; de eerste aanroep na een pauze kan dan te laat komen. Gebruik voor automatisch plaatsen een plan dat altijd aan staat.

## Fase 2: publiceren

Koppelen (OAuth) zit in `backend/app/services/social/` (`OAuthProvider`, met `linkedin.py`). Publiceren zit in `backend/app/publishers/`:

- `base.py`: `Publisher` met `validate(post)` en `publish(post, account) -> PublishResult`.
- `registry.py`: koppelt een platform aan een publisher.
- `dry_run.py`: een test-publisher die niets echt plaatst.

Een platform toevoegen:
1. Maak bijvoorbeeld `publishers/linkedin.py` met een subklasse van `Publisher`.
2. Registreer die in `registry.py`.
3. Voeg de OAuth-koppeling toe als subklasse van `OAuthProvider` en zet het platform in `SUPPORTED` in `services/social/registry.py`. De tabel `social_accounts` en het versleutelen van tokens zijn al klaar.
4. Klaar: de scheduler en "Nu plaatsen" gebruiken het nieuwe platform vanzelf via `services/publishing.py`.
