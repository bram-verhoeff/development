# PostPilot

PostPilot is een webapplicatie om per merk social-mediacontent te laten schrijven door AI (Google Gemini; Claude kan ook), die posts te beoordelen en ze in een kalender in te plannen.

- **Merken**: onbeperkt merkprofielen met doelgroep, tone of voice, USP's, kleuren, logo en woorden die vermeden moeten worden.
- **Genereren**: posts, hooks en hashtags voor Instagram, LinkedIn, TikTok, X en Facebook, met de juiste lengte en stijl per platform. Optioneel op basis van een webpagina of eigen tekst.
- **Beoordelen**: elke post is *concept*, *goedgekeurd* of *afgewezen*. Je kunt hem zelf bewerken of opnieuw laten schrijven met extra instructies. Elke versie wordt bewaard.
- **Kalender**: goedgekeurde posts inplannen (Nederlandse tijd), met filters op merk en platform.
- **Toegang**: inloggen en registreren via Supabase. Alleen e-mailadressen op een allowlist mogen registreren.

> Fase 2 (nog niet gebouwd): automatisch publiceren via de platform-API's. De code is daarop voorbereid, zie [Fase 2: publiceren](#fase-2-publiceren).

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
| `ANTHROPIC_API_KEY`, `CLAUDE_MODEL`, `CLAUDE_EFFORT` | alleen bij `AI_PROVIDER=claude` |
| `GENERATION_DAILY_LIMIT` | maximaal aantal AI-opdrachten per gebruiker per 24 uur (standaard 100) |
| `SUPABASE_URL` | project-URL van Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | *secret key* (of oude *service_role key*). Alleen in de backend! |
| `SUPABASE_JWT_SECRET` | alleen voor oudere Supabase-projecten met HS256-tokens; anders leeg |
| `STORAGE_BUCKET` | naam van de bucket voor logo's (standaard `logos`) |
| `ALLOWED_EMAILS` | wie mag registreren en de app gebruiken |

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

## Fase 2: publiceren

`backend/app/publishers/` bevat de gedeelde interface:

- `base.py`: `Publisher` met `validate(post)` en `publish(post, account) -> PublishResult`.
- `registry.py`: koppelt een platform aan een publisher.
- `dry_run.py`: een test-publisher die niets echt plaatst.

Een platform toevoegen:
1. Maak bijvoorbeeld `publishers/linkedin.py` met een subklasse van `Publisher`.
2. Registreer die in `registry.py`.
3. Bouw de koppeling: een tabel `social_accounts` (versleutelde OAuth-tokens per merk en platform), een tabel `publish_jobs`, en een scheduler die ingeplande, goedgekeurde posts op het juiste moment via `get_publisher(platform).publish(...)` plaatst.
