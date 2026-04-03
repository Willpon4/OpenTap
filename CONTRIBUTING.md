# Contributing to OpenTap

Thanks for your interest in contributing to OpenTap! This project is open source and we welcome contributions from anyone who wants to help improve public water access.

## What is OpenTap?

OpenTap is a civic platform that tracks public drinking water fountains and lets citizens report problems. Cities can use it to manage fountain maintenance and stay accountable. It's free, open source, and runs on about $1/month.

**Live site:** [opentapwater.com](https://opentapwater.com)

## How to contribute

There are many ways to help, not just code.

### Report fountains

The most valuable contribution right now is data. If you know where public drinking fountains are in your city, report them at [opentapwater.com/report](https://opentapwater.com/report). Walk your local park and report every fountain you find.

### Improve the code

We accept pull requests for bug fixes, new features, and improvements. See the setup guide below to get the project running locally.

### Suggest ideas

Open a [GitHub Issue](https://github.com/Willpon4/OpenTap/issues) to suggest features, report bugs, or ask questions. Please check existing issues first to avoid duplicates.

### Help with outreach

If you work for a city or know someone in parks and recreation, water utilities, or city government, we'd love to connect. Reach out via the [contact page](https://opentapwater.com/contact).

## Local development setup

### Prerequisites

- Python 3.12+
- Node.js 18+
- PostgreSQL with PostGIS extension (or a [Neon](https://neon.tech) account)

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in `backend/` with:

```
DATABASE_URL=postgresql+asyncpg://user:password@host/dbname
SECRET_KEY=your-secret-key-here
DEBUG=true
```

Run the server:

```bash
python -m uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000` with docs at `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend
npm install
```

Create a `.env.local` file in `frontend/` with:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Run the dev server:

```bash
npm run dev
```

The site will be available at `http://localhost:3000`.

### Database setup

You need PostgreSQL with the PostGIS extension. The easiest option is a free [Neon](https://neon.tech) account which gives you PostGIS out of the box. Tables are created automatically when the backend starts.

To import fountain data from OpenStreetMap:

```bash
cd backend
python -m scripts.import_osm --city "Your City Name"
```

## Project structure

```
OpenTap/
├── backend/
│   ├── app/
│   │   ├── api/v1/          # API endpoints (fountains, reports, admin)
│   │   ├── core/            # Config, auth, database, encryption, sanitization
│   │   ├── models/          # SQLAlchemy models (fountain, report, admin)
│   │   ├── schemas/         # Pydantic request/response schemas
│   │   └── services/        # Business logic (reports, fountains, storage, notifications)
│   ├── scripts/             # Import scripts, admin seeding
│   ├── requirements.txt
│   └── Procfile
├── frontend/
│   ├── src/
│   │   ├── app/             # Next.js pages (map, report, feed, admin, etc.)
│   │   ├── components/      # React components (Header, FountainMap, ReportForm)
│   │   ├── lib/             # API client
│   │   └── styles/          # Global CSS
│   └── package.json
└── CONTRIBUTING.md
```

## Tech stack

- **Frontend:** Next.js 14 / React on Vercel
- **Backend:** Python / FastAPI on Railway
- **Database:** PostgreSQL 17 + PostGIS on Neon
- **Maps:** Leaflet + OpenStreetMap
- **Auth:** JWT + bcrypt
- **Photos:** Cloudflare R2
- **Notifications:** Resend (email)

## Pull request guidelines

1. Fork the repo and create a branch from `main`
2. If you're adding a feature, open an issue first to discuss it
3. Keep PRs focused — one feature or fix per PR
4. Test your changes locally before submitting
5. Write a clear PR description explaining what you changed and why
6. Make sure the backend starts without errors and the frontend builds (`npm run build`)

## Code style

- **Python:** Follow PEP 8. Use type hints. Keep functions focused and small.
- **JavaScript/React:** Use functional components with hooks. Keep components in their own files.
- **CSS:** Use CSS modules. Follow the existing color palette defined in `globals.css`.
- **Commits:** Write clear, concise commit messages. Start with a verb: "Fix report form validation", "Add photo upload endpoint", "Update landing page stats".

## What we're looking for help with

Check the [Issues](https://github.com/Willpon4/OpenTap/issues) page for current needs. Some areas where contributions are especially welcome:

- **Fountain data:** Walk surveys, OSM imports, data cleanup
- **City outreach:** Connecting with city officials who could use the platform
- **Frontend polish:** Mobile responsiveness, accessibility, UX improvements
- **Testing:** Manual testing on different devices and browsers, writing automated tests
- **Documentation:** Improving this guide, adding API examples, writing tutorials

## Code of conduct

Be kind. Be constructive. Remember that this project exists to help people access clean drinking water. We don't tolerate harassment, discrimination, or bad faith participation.

If you encounter issues with other contributors, contact us through the [contact page](https://opentapwater.com/contact).

## License

OpenTap is released under the [MIT License](LICENSE). By contributing, you agree that your contributions will be licensed under the same license.

## Questions?

- Open an issue on GitHub
- Visit the [contact page](https://opentapwater.com/contact)
- Check the [API docs](https://opentap-production.up.railway.app/docs)
