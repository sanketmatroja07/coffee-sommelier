# Coffee Sommelier - System Architecture

## Overview

B2B white-label Shopify-embeddable widget for specialty coffee roasters. Deterministic recommendation engine with optional LLM for grounded explanations.

## Architecture Diagram

```
Browser (Shopify Storefront)
        │
        ▼
Embeddable Widget Script (sommelier-widget.js)
        │
        ▼
Widget Iframe (React + Vite)
        │
        ▼
FastAPI Backend (http://api:8000)
        │
        ├─────────────────────────────┐
        ▼                             ▼
Scoring Engine Module            Postgres
(deterministic rules)            (merchants, products, profiles, logs)
        │                             
        ▼                             
Optional LLM Service (if API key)     
        │                             
        ▼                             
Grounded Explanation Generator       

Admin Dashboard (React) ──────────────► FastAPI Backend
```

## Component Boundaries

| Component | Responsibility |
|-----------|----------------|
| Widget Script | Loader; injects iframe, signs requests |
| Widget Iframe | 5–7 step intake, results UI, feedback |
| FastAPI | REST API, auth, rate limit, orchestration |
| Scoring Engine | Hard filters, weighted cosine, MMR, penalties |
| Postgres | All persistent data |
| LLM (optional) | Parse free-form text, generate explanation from catalog JSON |
| Admin | Product/weight management, analytics, A/B toggle |

## Data Flow

1. Merchant embeds `<script src=".../sommelier-widget.js" data-merchant="...">`
2. Widget loads iframe, user completes intake
3. Intake → structured vector (roast, acidity, body, sweetness, flavor_tags, brew_method, caffeine, budget)
4. API: POST /recommend with merchant_id, session_id, vector
5. Scoring engine: hard filters → cosine similarity → MMR → top 3
6. Explanation: template or LLM (grounded to catalog)
7. Return: products, scores, reasons, brew_guide
8. Events logged to interactions + recommendations_log

## Security Boundaries

- CORS: widget origin + admin origin whitelist
- Rate limit: per merchant_id + IP
- Admin: Basic auth, env secrets
- Widget: signed token per merchant (HMAC)
