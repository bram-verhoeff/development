# ContentRoom

Webapplicatie om per merk social-mediacontent te laten genereren met AI (Claude), goed te keuren en in te plannen in een kalender.

> Status: in ontwikkeling (fase 1). Deze README wordt per stap aangevuld.

## Structuur

```
backend/    FastAPI + SQLAlchemy (Python)
frontend/   Next.js + Tailwind (TypeScript)
```

## Vereisten

- Python 3.12 of nieuwer
- Node.js 20 of nieuwer

## Lokaal opstarten

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
copy .env.example .env          # macOS/Linux: cp .env.example .env  → daarna invullen
uvicorn app.main:app --reload
```

De API draait op http://localhost:8000 (documentatie: http://localhost:8000/docs).

Tests: `pytest` (in de map `backend`, met de virtuele omgeving actief).

### Frontend

```bash
cd frontend
npm install
copy .env.example .env.local    # macOS/Linux: cp .env.example .env.local
npm run dev
```

De app draait op http://localhost:3000.

## Configuratie

Alle sleutels en geheimen staan in `backend/.env` en `frontend/.env.local`. Die bestanden staan niet in git; de `.env.example`-bestanden laten zien welke variabelen nodig zijn.

## Talen

De interface is Nederlands. Alle teksten staan in `frontend/messages/nl.json`. Een taal toevoegen: maak `messages/<code>.json` en voeg de code toe in `frontend/src/i18n/config.ts`.
