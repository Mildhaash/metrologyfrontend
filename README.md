# Legal Metrology Compliance Checker — Frontend

A Next.js 14 web application for scanning, verifying, and managing legal metrology compliance on product labels.

## Features

- **Image Scan** — Upload product label images for OCR-based compliance checking
- **Realtime Scan** — Camera-based instant scanning with AR overlay
- **Batch Scan** — Upload multiple labels at once
- **Dashboard** — Overview of scans, violations, and compliance trends
- **Inspections** — Manage and resolve compliance violations
- **History** — Browse past scans with filtering
- **Maps** — Geographic distribution of scans
- **Reports** — Export compliance data as PDF, DOCX, or CSV

## Tech Stack

| Technology | Purpose |
|------------|---------|
| Next.js 14 (App Router) | Framework |
| React 18 | UI library |
| TypeScript 5 | Type safety |
| Tailwind CSS 3.4 | Styling |
| Recharts 3.10 | Charts & graphs |
| Leaflet 1.9 | Map rendering |
| Lucide React | Icons |

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
```

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:8000/api` (dev) / `/api` (prod via rewrites) |

### Development

```bash
npm run dev
```

Opens at [http://localhost:3000](http://localhost:3000).

### Production Build

```bash
npm run build
npm run start
```

## Project Structure

```
frontend/
├── app/
│   ├── dashboard/          # Dashboard pages (inspections, history, maps, etc.)
│   ├── guidelines/         # Legal metrology guidelines
│   ├── scan/               # Scan result and batch scan pages
│   ├── globals.css         # Global styles + Google Fonts
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Landing page
├── components/
│   ├── auth/               # Login/signup modal
│   ├── scanner/            # Scan result view, camera scanner
│   ├── ui/                 # Reusable UI components (GradeBadge, etc.)
│   └── Navbar.tsx          # Navigation bar
├── lib/
│   └── api.ts              # API fetch helper with auth token
├── public/                 # Static assets
├── next.config.mjs         # Vercel rewrites (API proxy to backend)
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## Deployment

### Vercel (Recommended)

1. Push this folder to a GitHub repository
2. Import the repository in [Vercel](https://vercel.com)
3. The frontend uses **Vercel rewrites** to proxy `/api/*` requests to the Railway backend — no CORS issues, backend URL hidden from the browser.
4. Environment variables:
   - **Development** (`frontend/.env.local`): `NEXT_PUBLIC_API_URL=http://localhost:8000/api`
   - **Production** (`frontend/.env.production`): `NEXT_PUBLIC_API_URL=/api` (already configured)
5. Update the backend URL in `next.config.mjs` rewrites if your backend URL changes
6. Deploy

### How the API proxy works

```
Browser → Vercel (/api/scan/upload) → rewrite → Railway backend (https://metrologybackend-production.up.railway.app/api/scan/upload)
```

The `NEXT_PUBLIC_API_URL=/api` in `.env.production` makes all fetch calls relative to the Vercel domain. Next.js `rewrites` in `next.config.mjs` proxy these to the actual Railway backend server-side.

## License

Private — Internal use only.
