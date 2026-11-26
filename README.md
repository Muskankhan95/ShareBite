# ShareBite — Social-Impact Food Surplus Redistribution Platform

> **"Save Food. Share Hope."**  
> ShareBite is a production-grade full-stack web platform connecting commercial food donors (restaurants, hotels, college canteens, bakeries) with verified community NGOs and volunteer couriers to eliminate edible food waste and accelerate circular community relief.

---

## 1. Project Overview

Food waste is one of the world's greatest environmental and humanitarian challenges. Simultaneously, millions of families face acute food insecurity. ShareBite provides an automated, transparent, and legally responsible infrastructure to redistribute surplus edible food within hours of preparation.

### Core Ecosystem Roles
1. **Donors**: Post surplus food listings with portion estimates, preparation times, storage methods, allergen declarations, and responsible food safety certifications.
2. **NGOs**: Verified non-profit distribution shelters that discover nearby available surplus, review dietary compatibility, and claim food portions within their verified daily capacity.
3. **Volunteers**: Community couriers dispatched via optimized geographic routing who inspect packaging, verify temperatures, and execute tamper-evident delivery handovers.
4. **Administrators**: Compliance officers auditing NGO legal credentials, investigating community safety reports, tracking live platform urgency distribution, and monitoring macro-impact metrics.

---

## 2. Features

- **Multi-Role Dashboards**: Role-tailored dashboards for Donors, NGOs, Volunteer Couriers, and Compliance Administrators.
- **Responsible 4-Point Food Safety Protocol**: Donors certify accuracy, donor intent, temperature control, and disclosed allergens before publication. Urgency algorithms assist logistics without pretending to evaluate microbiological safety.
- **Smart NGO Recommendation Engine**: Server-side 5-factor scoring model ($0\text{--}100$) evaluating Distance (30%), Urgency (25%), Capacity/Quantity Compatibility (20%), Food Category Compatibility (15%), and Availability (10%).
- **Multi-Factor Dynamic Urgency Prediction**: Evaluates time remaining, elapsed preparation time, category perishability, storage temperature method, and local shelter proximity into 4 calibrated tiers (`Low`, `Medium`, `High`, `Critical`).
- **Interactive Geospatial Mapping**: Real-time Leaflet/OpenStreetMap interface supporting $1\text{ km}$, $5\text{ km}$, $10\text{ km}$, and $25\text{ km}$ radius discovery. Includes volunteer privacy fuzzing ($\le 0.8\text{ km}$ home address masking) and multi-waypoint turn-by-turn route previews.
- **AI-Assisted Operations & Vision Engine**:
  - **Food Photo Vision Classification**: Identifies categories (*Rice, Bread, Vegetables, Fruits, Cooked meal, Bakery, Packaged food, Unknown*).
  - **Donation Description Assistant**: Synthesizes donor shorthand (e.g. *"30 biryani packets, made 7 pm"*) into concise listings.
  - **Smart Categorization & Allergen Inference**: Detects common allergens (*Gluten, Dairy, Peanuts, Tree Nuts, Eggs, Soy, Shellfish, Sesame*) from ingredient hints.
  - **Natural Language Search**: Translates natural queries like *"Show me vegetarian food for around 40 people within 5 km"* into structured filters.
  - **Platform AI Assistant**: Conversational knowledge base with strict guardrails prohibiting medical, legal, or food safety guarantees.
  - **Zero-Downtime Local Fallback**: Automatically falls back to a deterministic heuristic engine if external AI APIs timeout, fail, or lack API keys.
- **Tamper-Evident Pickup Verification**: 7-stage courier lifecycle (`Available` $\rightarrow$ `Accepted` $\rightarrow$ `At Pickup` $\rightarrow$ `Picked Up` $\rightarrow$ `In Transit` $\rightarrow$ `Delivered` $\rightarrow$ `Completed`) with temperature recording and recipient digital sign-off.
- **Incident Reporting & Compliance Auditing**: Multi-category reporting (*food quality, late pickup, unresponsive, safety*) with administrator investigation and resolution workflows.

---

## 3. Technology Stack

- **Frontend & App Framework**: Next.js 14.2 (React 18, App Router, Server & Client Components)
- **Language**: TypeScript 5.6 (strict mode enabled across all routes and services)
- **Styling & UI**: Tailwind CSS 3.4, Lucide React Icons, Headless UI patterns
- **Mapping & Geocoding**: Leaflet 1.9, React-Leaflet, OpenStreetMap Tile Engine
- **Database Engine**: SQLite 3 (via `better-sqlite3` 13.0 with Write-Ahead Logging & Foreign Key enforcement)
- **Authentication**: Stateless HS256 JWT sessions via `jose`, `bcryptjs` password hashing, HTTP-only secure cookies
- **Security & Rate Limiting**: In-memory sliding-window token bucket limiter, Edge middleware route guards, CSP headers
- **AI Integration**: Multi-tier architecture supporting Google Gemini, OpenAI, or local deterministic heuristic engine

---

## 4. Architecture

```
ShareBite Monolithic Modular Architecture
├── Frontend Presentation Layer (Next.js 14 App Router)
│   ├── Public (Landing, About, How It Works, Login, Register, Map)
│   ├── Donor (/donor/dashboard, /donor/create, /donor/my-donations, /donor/history)
│   ├── NGO (/ngo/dashboard, /ngo/nearby, /ngo/requests, /ngo/accepted, /ngo/history)
│   ├── Volunteer (/volunteer/dashboard, /volunteer/available, /volunteer/my-pickups)
│   └── Admin (/admin/dashboard, /admin/users, /admin/ngos, /admin/donations, /admin/reports)
├── Security & Routing Middleware (src/middleware.ts)
│   ├── HTTP Security Headers (CSP, X-Frame-Options, X-Content-Type-Options)
│   ├── Sliding-Window Rate Limiter (Brute-force protection on /api/auth/*)
│   └── Role-Based Access Control (Redirects unauthorized roles, blocks non-admins)
├── Server API Layer (src/app/api/*)
│   ├── /api/auth/* (Login, register, logout, session verification)
│   ├── /api/donations/* (Create, lifecycle advance, edit, cancel, query)
│   ├── /api/ngo/* (Nearby food with Haversine filter, accept, stats)
│   ├── /api/pickups/* (Available claims, atomic race prevention, handover verification)
│   ├── /api/matching/* (Ranked NGOs, ranked couriers, dynamic urgency)
│   ├── /api/ai/* (Vision classification, description drafting, natural language search)
│   └── /api/admin/* (Auditing, soft-deactivation, reports, analytics)
├── Core Service & Engine Layer (src/lib/*)
│   ├── src/lib/matching/ (Smart NGO & courier matching, multi-factor urgency prediction)
│   ├── src/lib/ai/ (AI orchestrator, prompt templates, local heuristic fallback)
│   ├── src/lib/security/ (Rate limiting, input validation, PII sanitizer)
│   └── src/lib/monitoring/ (Structured audit logger, failure trackers)
└── Persistence Layer (src/lib/db/*)
    ├── SQLite WAL Database (data/foodrescue.db)
    ├── DDL Migrations & Indexes (src/lib/db/migrations.ts)
    └── Repositories (Donation, NGO, Volunteer, Admin, Auth, Impact, Notification)
```

---

## 5. Database Structure

The database schema is normalized and enforced with SQLite foreign key constraints and transactional integrity:

```sql
users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  phone TEXT NOT NULL,
  role TEXT CHECK(role IN ('donor', 'ngo', 'volunteer', 'admin')),
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'suspended', 'deactivated')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

donor_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  organization_name TEXT,
  address TEXT NOT NULL,
  latitude REAL,
  longitude REAL,
  verification_status TEXT DEFAULT 'verified' CHECK(verification_status IN ('verified', 'pending', 'rejected'))
);

ngo_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  organization_name TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude REAL,
  longitude REAL,
  contact_person TEXT NOT NULL,
  verification_status TEXT DEFAULT 'pending' CHECK(verification_status IN ('verified', 'pending', 'rejected', 'suspended')),
  capacity INTEGER DEFAULT 100 CHECK(capacity >= 0),
  current_requirement INTEGER DEFAULT 50 CHECK(current_requirement >= 0),
  preferred_categories TEXT
);

volunteer_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  latitude REAL,
  longitude REAL,
  availability_status TEXT DEFAULT 'available' CHECK(availability_status IN ('available', 'unavailable')),
  verification_status TEXT DEFAULT 'verified' CHECK(verification_status IN ('verified', 'pending', 'rejected')),
  vehicle_type TEXT DEFAULT 'Bike',
  preferred_radius REAL DEFAULT 10,
  completed_deliveries INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0
);

food_donations (
  id TEXT PRIMARY KEY,
  donor_id TEXT REFERENCES donor_profiles(id),
  food_name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  quantity REAL NOT NULL CHECK(quantity > 0),
  servings INTEGER NOT NULL CHECK(servings > 0),
  preparation_time DATETIME,
  available_until DATETIME NOT NULL,
  storage_method TEXT,
  allergens TEXT,
  image_url TEXT,
  pickup_address TEXT NOT NULL,
  latitude REAL,
  longitude REAL,
  status TEXT DEFAULT 'published' CHECK(status IN ('draft', 'published', 'matched', 'accepted', 'pickup_assigned', 'picked_up', 'delivered', 'completed', 'cancelled', 'expired')),
  safety_declaration INTEGER DEFAULT 1
);

pickups (
  id TEXT PRIMARY KEY,
  donation_id TEXT REFERENCES food_donations(id),
  volunteer_id TEXT REFERENCES volunteer_profiles(id),
  ngo_id TEXT REFERENCES ngo_profiles(id),
  pickup_location TEXT,
  delivery_location TEXT,
  pickup_lat REAL,
  pickup_lng REAL,
  delivery_lat REAL,
  delivery_lng REAL,
  status TEXT DEFAULT 'available' CHECK(status IN ('available', 'accepted', 'at_pickup', 'picked_up', 'in_transit', 'delivered', 'completed', 'cancelled', 'failed')),
  temperature_c REAL,
  recipient_signature TEXT
);
```

### Production Performance Indexes
- `idx_food_donations_status` ON `food_donations(status)`
- `idx_food_donations_coords` ON `food_donations(latitude, longitude)`
- `idx_food_donations_available` ON `food_donations(available_until)`
- `idx_ngo_profiles_coords` ON `ngo_profiles(latitude, longitude)`
- `idx_ngo_profiles_status` ON `ngo_profiles(verification_status)`
- `idx_volunteer_profiles_status` ON `volunteer_profiles(availability_status, verification_status)`
- `idx_pickups_status` ON `pickups(status)`
- `idx_pickups_volunteer` ON `pickups(volunteer_id)`
- `idx_matches_donation_ngo` ON `matches(donation_id, ngo_id)`
- `idx_reports_status` ON `reports(status)`

---

## 6. Environment Variables

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `NODE_ENV` | Yes | `development` | Runtime environment (`development`, `staging`, `production`) |
| `NEXT_PUBLIC_APP_URL` | Yes | `http://localhost:3000` | Canonical frontend domain for redirects & CORS |
| `BACKEND_URL` | Yes | `http://localhost:3000` | Backend API base URL |
| `JWT_SECRET` | Yes | *Required in Prod* | $\ge 32$-character cryptographically random signing secret |
| `JWT_EXPIRES_IN` | No | `7d` | Token session validity |
| `DATABASE_PATH` | No | `./data/foodrescue.db` | Path to persistent SQLite database |
| `ADMIN_INITIAL_EMAIL` | No | `admin@sharebite.org` | Bootstrap Administrator account email |
| `ADMIN_INITIAL_PASSWORD`| No | `AdminShareBite2026!` | Bootstrap Administrator initial password |
| `GEMINI_API_KEY` | Optional | `None` | Google Gemini API key for remote multimodal features |
| `OPENAI_API_KEY` | Optional | `None` | Alternative OpenAI vision/NLP API key |
| `RATE_LIMIT_MAX_REQUESTS`| No | `100` | Max API requests per window per IP |
| `RATE_LIMIT_WINDOW_MS` | No | `60000` | Sliding rate limit window ($60\text{ seconds}$) |
| `LOG_LEVEL` | No | `info` | Logging verbosity (`debug`, `info`, `warn`, `error`) |

---

## 7. Local Setup Instructions

### Prerequisites
- Node.js 18.18+ or 20.x LTS
- npm 9+

### Quickstart
```bash
# 1. Clone repository and install dependencies
git clone https://github.com/your-org/foodrescue.git
cd foodrescue
npm install

# 2. Configure environment
cp .env.example .env.local

# 3. Initialize database and bootstrap initial administrator
node scripts/create-admin.mjs admin@sharebite.org Password123! "Platform Admin"

# 4. Start local development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 8. API Documentation

### Authentication
- `POST /api/auth/register` — Register donor, NGO, or volunteer account.
- `POST /api/auth/login` — Authenticate credentials; sets `auth_token` secure cookie.
- `POST /api/auth/logout` — Invalidate session and clear auth cookies.
- `GET /api/auth/me` — Retrieve active session profile.

### Donations & Logistics
- `GET /api/donations` — Retrieve filtered donations (by donor, status, category).
- `POST /api/donations` — Create listing; requires 4-point safety declaration certification.
- `GET /api/donations/:id` — Get comprehensive details for listing.
- `PATCH /api/donations/:id` — Edit details (allowed in `draft`/`published`), advance lifecycle, or cancel.

### NGO Operations
- `GET /api/ngo/nearby` — Discover surplus within configurable radius ($1\text{--}25\text{ km}$).
- `POST /api/ngo/accept` — Atomically claim surplus for verified NGO intake.
- `GET /api/ngo/profile` & `POST /api/ngo/profile` — Manage capacity and category preferences.

### Volunteer Operations
- `GET /api/pickups` — Discover available pickups filtered by proximity and urgency.
- `POST /api/pickups` — Claim route (`action: "claim"`) with concurrency collision prevention.
- `PATCH /api/pickups/:id` — Update lifecycle stage with temperature verification notes and digital handover signature.

### Smart Matching & Urgency Engine
- `GET /api/matching/ngos?donationId=:id` — Ranked NGO recommendations with explainability checklist.
- `GET /api/matching/volunteers?pickupId=:id` — Ranked volunteer courier matches.
- `POST /api/matching/urgency` — Real-time dynamic multi-factor urgency evaluation.

### AI Assistance
- `POST /api/ai/classify-image` — Classify food photo into 8 standard categories.
- `POST /api/ai/generate-description` — Synthesize donor shorthand into polished descriptions.
- `POST /api/ai/categorize` — Predict category, description, and allergen warnings from food name.
- `POST /api/ai/parse-search` — Translate natural queries into structured search filters.
- `POST /api/ai/assistant` — Interactive platform assistant with safety refusal guardrails.

---

## 9. Testing Instructions

Run the automated test suites:

```bash
# Run master 55-assertion QA verification suite
node scripts/test-full-qa-suite.mjs

# Run advanced intelligent matching & urgency suite (10 scenarios)
node scripts/test-advanced-matching.mjs

# Run location & geospatial mapping verification suite
node scripts/test-location-module.mjs

# Run full Next.js production build verification
npm run build
```

---

## 10. Deployment Instructions

### Option A: Docker Deployment (Recommended)
ShareBite includes a production-optimized multi-stage Docker build:

```bash
# 1. Build and launch container in detached mode
docker compose up -d --build

# 2. Initialize production administrator
docker compose exec foodrescue-app node scripts/create-admin.mjs admin@yourdomain.com StrongAdminPass! "Head Admin"

# 3. Verify health status
curl -I http://localhost:3000/api/impact
```

### Option B: Vercel / Cloud Platforms
1. Push repository to GitHub or GitLab.
2. Link project in Vercel Dashboard.
3. Configure Environment Variables (`JWT_SECRET`, `NEXT_PUBLIC_APP_URL`, `DATABASE_PATH`).
4. Set build command to `npm run build` and output directory to `.next`.

### Option C: Database Backup Routine
Set up a daily cron job to run the safe online SQLite backup:
```bash
0 2 * * * cd /path/to/foodrescue && node scripts/backup-database.mjs >> /var/log/sharebite-backup.log 2>&1
```

---

## 11. Known Limitations

1. **Embedded SQLite Single-Node Concurrency**: SQLite with WAL mode supports hundreds of concurrent reads and serialized atomic writes, making it ideal for single-server or containerized deployments. For horizontal multi-region autoscaling across multiple Kubernetes pods, migrate SQLite to managed PostgreSQL.
2. **Offline Map Tiles**: In low-bandwidth or offline environments, OpenStreetMap tiles require cached tile storage or vector tile fallbacks.
3. **AI Vision File Size**: Local heuristic analysis handles file metadata and image URLs instantaneously; raw image base64 uploads over 10 MB are rate-limited to preserve server memory.

---

## 12. Future Improvements

- **SMS & Push Notifications**: Integration with Twilio and Web Push for real-time courier dispatch alerts.
- **Offline PWA Support**: Service worker caching enabling volunteers to complete delivery handovers in basement shelters with zero cellular reception.
- **Barcode & Batch RFID Scanning**: Instant cataloging for supermarket surplus pallets.
- **Multilingual Localization**: Dynamic translation into Spanish, French, Arabic, and Hindi for international community pantries.
- **Carbon Offset Certification**: Integration with third-party environmental auditing APIs to issue certified carbon reduction tax credits to commercial donors.
