# OpenTap

**Public Water Access Accountability Platform**

A free, open-source civic tool for reporting, tracking, and fixing public drinking water infrastructure.

## What is OpenTap?

OpenTap lets citizens report broken, unsafe, or missing public water fountains via web, SMS, or QR code scan. Reports are tracked through a public accountability lifecycle, and cities get free dashboards to manage repairs. All data is open.

## Key Features

- **Report in 60 seconds** — mobile-first web form, SMS, or QR code scan
- **Public accountability map** — every fountain color-coded by status
- **City-agnostic** — works anywhere, no per-city configuration needed
- **Report lifecycle** — Reported → Acknowledged → In Progress → Resolved → Stale
- **City dashboards** — free operations tools for government staff
- **Open data** — full public API, all data open for developers and advocates
- **No ads, no paid features, no data sales** — free forever

## Tech Stack

- **Backend**: Python (FastAPI), PostgreSQL + PostGIS
- **Frontend**: React (Next.js), Leaflet + OpenStreetMap
- **SMS**: Twilio
- **Hosting**: Railway / Render (free tier)
- **Photos**: Cloudflare R2

## Quick Start

### Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env  # configure your database URL
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Project Structure

```
opentap/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application entry
│   │   ├── core/                # Config, database, auth
│   │   ├── models/              # SQLAlchemy + PostGIS models
│   │   ├── schemas/             # Pydantic request/response schemas
│   │   ├── services/            # Business logic
│   │   └── api/v1/              # Route handlers
│   ├── scripts/                 # Data import scripts (OSM, EPA)
│   └── tests/
├── frontend/                    # Next.js React app
└── README.md
```

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT License — see [LICENSE](LICENSE) for details.
