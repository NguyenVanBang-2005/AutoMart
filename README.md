# AutoMart

**Vietnamese used car marketplace with AI consultation, built with FastAPI + Jinja2 + PostgreSQL.**

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.135-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-4169E1?logo=postgresql&logoColor=white)](https://supabase.com)
[![License](https://img.shields.io/badge/License-MIT-c8a96e)](LICENSE)

---

## Features

- **Browse & search** — filter cars by brand, type, year, and price range
- **Sell listings** — post your car with photos, location, and contact info
- **AI consultation** — chat with Groq LLaMA 3.3 + SQL Agent for real-time inventory advice
- **Test drive booking** — upload CCCD/GPLX, choose showroom and time slot
- **Monthly deals** — time-limited discount system with admin management
- **News & Q&A** — articles and community questions
- **Contact form** — with read/unread tracking for staff
- **Auth** — email + OTP registration, JWT cookies, Google OAuth
- **Role-based access** — `user` / `staff` / `admin` dashboards
- **Cloud images** — Cloudinary for car photos, avatars, CCCD/GPLX uploads

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI (Python 3.11) |
| ORM | SQLModel + SQLAlchemy |
| Database | PostgreSQL (Supabase) |
| Frontend | Jinja2 SSR + Vanilla JS |
| Image storage | Cloudinary |
| AI | Groq API (`llama-3.3-70b-versatile`) |
| Email | Resend API |
| Auth | JWT HttpOnly cookies, Google OAuth (Authlib) |
| Deployment | Render |

---

## Project Structure

```
app/
├── api/v1/
│   ├── endpoints/          # Route handlers (cars, auth, tu_van, lai_thu, ...)
│   └── router.py           # APIRouter registration
├── core/
│   ├── config.py           # Pydantic BaseSettings (.env loader)
│   ├── database.py         # SQLModel engine + get_session + init_db
│   ├── security.py         # JWT encode/decode, bcrypt, cookie helpers
│   └── deps.py             # FastAPI dependencies (require_admin, require_staff)
├── models/                 # SQLModel table definitions
├── services/               # Business logic (ai_services, car_service, ...)
├── templates/              # Jinja2 HTML pages + partials/
├── static/
│   ├── js/                 # Per-page JavaScript files
│   └── css/                # Per-page CSS files
└── main.py                 # FastAPI app + page routes + lifespan
```

---

## Local Setup

### Prerequisites

- Python **3.11+**
- PostgreSQL database (local or [Supabase](https://supabase.com) free tier)
- [Groq API key](https://console.groq.com) (free)
- [Cloudinary account](https://cloudinary.com) (free tier)
- [Resend API key](https://resend.com) (free tier)

### 1. Clone the repository

```bash
git clone https://github.com/NguyenVanBang-2005/AutoMart.git
cd AutoMart
```

### 2. Create virtual environment

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in all values — see [Environment Variables](#️-environment-variables) below for details.

**Minimum required to run locally:**

```env
DATABASE_URL=postgresql://user:password@localhost:5432/automart
SECRET_KEY=your-random-secret-key-min-32-chars
GROQ_API_KEY=gsk_...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
RESEND_API_KEY=re_...
```

> Generate a secure SECRET_KEY:
> ```bash
> python -c "import secrets; print(secrets.token_hex(32))"
> ```

### 5. Run the development server

```bash
uvicorn app.main:app --reload
```

The app will be available at **http://localhost:8000**

> Do NOT run `python app/core/database.py` directly — `settings.DATABASE_URL` will be `None` without the FastAPI app context loading the `.env` file.

Tables are created automatically on first startup via `init_db()` in the lifespan event. Sample car data is seeded automatically.

---

## Environment Variables

| Variable | Required | Description |
|---|---------|---|
| `APP_NAME` | Yes     | Application name (default: `AutoMart`) |
| `DEBUG` | Yes     | `True` for dev, `False` for production |
| `DATABASE_URL` | Yes     | PostgreSQL connection string |
| `SECRET_KEY` | Yes     | JWT signing key — min 32 characters, keep secret |
| `ALGORITHM` | Yes     | JWT algorithm (default: `HS256`) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Yes     | JWT expiry in minutes (default: `30`) |
| `FRONTEND_URL` | Yes     | Base URL for OAuth redirects (e.g. `http://localhost:8000`) |
| `ENVIRONMENT` | Yes     | `development` or `production` — controls cookie `secure` flag |
| `GROQ_API_KEY` | Yes     | Groq API key for AI consultation |
| `CLOUDINARY_CLOUD_NAME` | Yes     | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Yes     | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Yes     | Cloudinary API secret |
| `RESEND_API_KEY` | Yes     | Resend API key for OTP emails |
| `GOOGLE_CLIENT_ID` |  Optional | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` |  Optional | Google OAuth client secret |
| `FACEBOOK_CLIENT_ID` |  Optional | Facebook OAuth client ID |
| `FACEBOOK_CLIENT_SECRET` | ️ Optional | Facebook OAuth client secret |
| `JINA_API_KEY` |  Optional | Jina AI key for vector embeddings (RAG) |
| `GMAIL_USER` |  Legacy | Replaced by Resend — leave empty |
| `GMAIL_APP_PASSWORD` |  Legacy | Replaced by Resend — leave empty |

> **DATABASE_URL format:**
> ```
> # Local PostgreSQL
> postgresql://username:password@localhost:5432/automart
>
> # Supabase (recommended)
> postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
> ```

> **Cookie security:** `ENVIRONMENT=production` enables `Secure` flag on JWT cookies (HTTPS only). Set `ENVIRONMENT=development` for local HTTP.

---

## Docker

```bash
# Build image
docker build -t automart .

# Run container (pass your .env file)
docker run -p 8000:8000 --env-file .env automart
```

Or with Docker Compose:

```bash
docker-compose up --build
```

---

## Deployment (Render)

1. Push code to GitHub
2. Create a new **Web Service** on [Render](https://render.com)
3. Set **Build Command:** `pip install -r requirements.txt`
4. Set **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port 8000`
5. Add all environment variables from `.env.example` in the Render dashboard
6. Set `ENVIRONMENT=production` and `FRONTEND_URL=https://your-app.onrender.com`

> The app uses `ProxyHeadersMiddleware` so Render's reverse proxy is handled automatically.

---

## API Documentation

Interactive Swagger UI available at:

```
http://localhost:8000/docs
```

Key endpoints:

| Endpoint | Method | Description |
|---|---|---|
| `/api/v1/cars` | GET | List cars with filters |
| `/api/v1/auth/login` | POST | Login with email + password |
| `/api/v1/auth/register` | POST | Register with OTP verification |
| `/api/v1/tu-van/chat` | POST | AI consultation chat |
| `/api/v1/lai-thu` | POST | Book a test drive |
| `/api/v1/ban-xe` | POST | Create sell listing |
| `/auth/google` | GET | Google OAuth login |

---

## Demo Accounts

After first run, use these credentials to explore the app:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@automart.vn` | *(set manually in DB or via seeder)* |
| User | Register via `/` → OTP email | — |

> To promote a user to admin, update their `role` column in the `users` table:
> ```sql
> UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
> ```

---

## AI Features

### AI Consultation Chat (`/tu-van`)
- Powered by **Groq API** (`llama-3.3-70b-versatile`)
- Configurable persona, budget slider, brand/year filters
- **SQL Agent** auto-detects car-related questions and queries the live database
- Conversation history maintained client-side (last 20 messages)

### Vector RAG (optional)
- Implemented in `rag_service.py` + `embedding_service.py`
- Requires `pgvector` extension enabled on PostgreSQL
- Enable on Supabase: **Database → Extensions → vector**
- Set `JINA_API_KEY` for embedding generation

---

## Known Issues

- Facebook OAuth callback not fully implemented
- RAG vector search inactive without `pgvector` extension
- No automated test suite yet

---

## License

MIT © 2025 Nguyen Van Bang