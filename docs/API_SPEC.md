# API Specification (OpenAPI-style)

Base URL: `http://localhost:8000` (local) or env `API_BASE_URL`

## Public API (Widget)

### POST /api/v1/recommend

**Auth:** Optional `X-Widget-Token` (signed per merchant)

**Request:**
```json
{
  "merchant_id": "uuid",
  "session_id": "string",
  "structured_vector": {
    "roast_preference": 2,
    "acidity_preference": 4,
    "body_preference": 3,
    "sweetness_preference": 3,
    "flavor_tags": ["fruity", "floral"],
    "brew_method": "pour_over",
    "caffeine": "full",
    "price_max": 22,
    "milk": false
  }
}
```

**Response:**
```json
{
  "recommendations": [
    {
      "product_id": "uuid",
      "score": 0.89,
      "reasons": ["High fruity notes", "Optimized for pour-over"],
      "brew_guide": {"grind": "Medium", "time": "2:45–3:15", "ratio": "1:16", "temp": "93–96°C", "tips": ["..."]},
      "product": {...}
    }
  ]
}
```

### POST /api/v1/analytics

**Request:**
```json
{
  "merchant_id": "uuid",
  "session_id": "string",
  "event_type": "intake_start|intake_complete|recommendation_view|product_click|add_to_cart|feedback_submit",
  "product_id": "uuid|null",
  "payload": {}
}
```

### POST /api/v1/feedback

**Request:**
```json
{
  "user_profile_id": "uuid",
  "product_id": "uuid",
  "rating": "Loved|OK|Disliked",
  "sour_bitter_slider": -1,
  "weak_strong_slider": 1,
  "notes": "string|null"
}
```

### GET /api/v1/brew-guide/{brew_method}

**Query:** `low_acid`, `low_bitterness` (bool)

**Response:** Brew guide object

---

## Admin API

**Auth:** Basic Auth (env ADMIN_USER, ADMIN_PASSWORD)

### GET /admin/products

List products for merchant (from token/session)

### POST /admin/products/upload

**Body:** multipart/form-data CSV file

### PATCH /admin/products/{id}

Update product

### GET /admin/weights

Get scoring weights for merchant

### PATCH /admin/weights

**Body:** `{"roast": 1.2, "acidity": 1.0, ...}`

### GET /admin/analytics

**Query:** merchant_id, from_date, to_date

**Response:** completion_rate, ctr, add_to_cart_count, feedback_distribution

### PATCH /admin/ab-test

**Body:** `{"variant": "control|treatment"}`

---

## Health

### GET /health

Returns `{"status": "ok"}`
