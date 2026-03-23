# Coffee Finder (Grubhub-style)

Find nearby cafes that serve the coffee you want. Discover by location or taste, browse menus, order ahead for pickup.

## Quick Start

**Requires Docker Desktop to be running.**

```bash
npm run dev
```

This starts PostgreSQL, the API, seeds the database, and runs the consumer app. Open **http://localhost:5174** (or the port Vite shows).

Or run services separately:

```bash
docker compose up -d db api
# Wait ~10s for API, then seed:
docker compose exec api python -m scripts.seed
# In another terminal:
cd consumer && npm run dev
```

- **Consumer app**: http://localhost:5174 (or 5175/5176 if port in use)
- **API**: http://localhost:8000
- **API docs**: http://localhost:8000/docs
- **Widget** (legacy): http://localhost:8080

## Setup

1. Start services: `docker-compose up --build`
2. Wait for DB health (≈10s). Seed runs automatically on first API startup.
3. Open **Coffee Finder**: http://localhost:5174
4. Admin: Run `cd admin && npm run dev` then http://localhost:5173/admin/login (user: `admin`, pass: `changeme`)

### Embedding the Widget

Add to your storefront:

```html
<script
  src="http://localhost:8080/sommelier-widget.js"
  data-merchant="default"
  data-api="http://localhost:8000"
  data-widget-url="http://localhost:8080/embed.html"
></script>
```

For production, replace URLs with your deployed API and widget origins.

### Admin Dashboard (standalone)

Run the admin app separately (proxies to API):

```bash
cd admin && npm install && npm run dev
```

Open http://localhost:5173/admin/login

### Local Development (no Docker)

**Backend:**

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
# Start Postgres (e.g. Docker: docker run -e POSTGRES_PASSWORD=sommelier -p 5432:5432 postgres:16)
export DATABASE_URL=postgresql+asyncpg://postgres:sommelier@localhost:5432/postgres
python scripts/seed.py
uvicorn app.main:app --reload
```

**Consumer (Coffee Finder):**

```bash
cd consumer && npm install && npm run dev
```

Open http://localhost:5174 (proxies /api to backend).

**Widget (legacy):**

```bash
cd widget && npm install && npm run dev
```

**Tests:**

```bash
cd backend && pip install pytest pytest-asyncio && pytest tests/ -v
```

## Features (Market-Ready)

- **Auth**: Register, login (JWT), order history for logged-in users
- **Saved taste profile**: Logged-in users can save quiz preferences to their account
- **Recommendation history**: Logged-in users can revisit past AI cafe matches
- **Address search**: Search city or address to find cafes
- **AI cafe matching**: Rank nearby cafes against roast, acidity, body, sweetness, flavor, milk, caffeine, and budget preferences
- **Live nearby coffee shops**: Optional Google Places integration for real-world coffee shop discovery around the searched location
- **Toast notifications**: Feedback for add-to-cart, order placed, errors
- **Micro-interactions**: Button press, staggered card animations, success pulse
- **404 page**: Proper not-found handling
- **PWA**: Manifest for "Add to Home Screen"
- **Guest checkout**: Order without account; optionally log in for order history

## API Endpoints

| Method | Path | Auth |
|--------|------|------|
| GET | /api/v1/discover | - |
| GET | /api/v1/cafes/{id} | - |
| GET | /api/v1/coffees | - |
| POST | /api/v1/orders | Optional Bearer |
| GET | /api/v1/geocode | - |
| POST | /api/v1/auth/register | - |
| POST | /api/v1/auth/login | - |
| GET | /api/v1/auth/me | Bearer |
| GET | /api/v1/me/preferences | Bearer |
| PUT | /api/v1/me/preferences | Bearer |
| GET | /api/v1/me/recommendations | Bearer |
| POST | /api/v1/recommendations/nearby | Optional Bearer |
| POST | /api/v1/recommend | - |
| GET | /admin/cafes | Basic |
| GET | /admin/orders | Basic |
| GET | /admin/products | Basic |
| PATCH | /admin/weights | Basic |
| GET | /admin/analytics | Basic |

## Environment

| Variable | Default |
|----------|---------|
| DATABASE_URL | postgresql+asyncpg://sommelier:sommelier@db:5432/sommelier |
| ADMIN_USER | admin |
| ADMIN_PASSWORD | changeme |
| CORS_ORIGINS | localhost origins |
| GOOGLE_PLACES_API_KEY | optional |
| GOOGLE_PLACES_REGION_CODE | US |

## Notes

- For backend local development, use **Python 3.13**. The current dependency stack is not ready for Python 3.14.
- If `GOOGLE_PLACES_API_KEY` is unset, the app still works with the seeded cafe catalog and OSM geocoding, but live nearby coffee shop discovery is disabled.

## Architecture

```
Consumer App (React) → FastAPI → Postgres
     ↓                    ↓
  Discovery          cafes, coffees, cafe_coffees, orders
  Cart / Checkout    Scoring engine (preference ranking)
```

- **Discovery**: Haversine geo filter, radius (5–50 km), sort (distance/rating), optional preference filters. Location search with Photon autocomplete and recent searches.
- **Orders**: Guest checkout, pay at pickup.
- **Admin**: Cafes, Orders, Products, Weights, Analytics.
