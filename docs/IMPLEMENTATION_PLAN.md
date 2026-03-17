# Implementation Plan (Ordered)

1. **Project scaffolding**
   - Folder structure, docker-compose, .env.example

2. **Database**
   - Alembic migrations for merchants, products, user_profiles, interactions, feedback, recommendations_log

3. **Backend core**
   - FastAPI app, settings, db connection
   - Pydantic schemas for all entities
   - CRUD/repositories

4. **Scoring engine**
   - Hard filters (brew, caffeine, price, roast)
   - Weighted cosine similarity
   - Penalty rules (light+espresso, high acid + low tolerance)
   - MMR diversification
   - Explanation metadata builder
   - Unit tests

5. **API routes**
   - POST /recommend
   - POST /analytics
   - POST /feedback
   - Admin auth middleware

6. **Widget loader script**
   - sommelier-widget.js: inject iframe, sign requests

7. **Widget React app**
   - 5–7 step intake (flavor, roast, acidity, body, brew, milk, budget)
   - Results: top 3, why match, brew guide, add-to-cart
   - Feedback modal
   - Build to dist, served as embeddable

8. **Admin dashboard**
   - /admin/login, /admin/products, /admin/weights, /admin/analytics
   - CSV upload, taxonomy mapping, weight sliders, metrics, A/B toggle

9. **Seed data**
   - One merchant, 8+ products, mapped to schema

10. **Docker + README**
    - docker-compose up --build run instructions
