# Folder Structure

```
coffee-sommelier/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   └── scoring/
│   │       ├── __init__.py
│   │       ├── engine.py
│   │       ├── explanation.py
│   │       └── brew_guide.py
│   ├── scripts/
│   │   ├── __init__.py
│   │   └── seed.py
│   ├── tests/
│   │   ├── __init__.py
│   │   └── test_scoring.py
│   ├── Dockerfile
│   ├── entrypoint.sh
│   └── requirements.txt
├── widget/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── Intake.tsx
│   │   ├── Results.tsx
│   │   ├── FeedbackModal.tsx
│   │   ├── main.tsx
│   │   ├── demo.tsx
│   │   ├── loader.ts
│   │   ├── types.ts
│   │   └── index.css
│   ├── index.html
│   ├── embed.html
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── admin/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── Layout.tsx
│   │   └── pages/
│   │       ├── Login.tsx
│   │       ├── Products.tsx
│   │       ├── Weights.tsx
│   │       └── Analytics.tsx
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── data/
│   └── seed/
│       ├── merchants.json
│       ├── products.json
│       └── products.csv
├── docs/
│   ├── ARCHITECTURE.md
│   ├── IMPLEMENTATION_PLAN.md
│   ├── API_SPEC.md
│   └── FOLDER_STRUCTURE.md
├── docker-compose.yml
└── README.md
```
