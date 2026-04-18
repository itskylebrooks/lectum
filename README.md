# Lectum — Minimal, Local-First Reading Tracker

Lectum is a focused reading tracker for managing what you are reading now, what is next, and what you have finished. It is designed for quick capture, clean organization, and useful reading stats while keeping your data local.

## Screenshots

Screenshots are not added to this repository README yet.

## Features

### Reading workflow

- Add, edit, and delete books
- Manage three practical states:
  - Reading now
  - Next to read
  - Finished
- Mark a next book as currently reading in one action
- Finish a book with date and rating
- Reopen finished books when needed
- Optional custom thumbnail support per book

### Library

- Dedicated finished-books library view
- Filter by:
  - Rating
  - Format (Print, Digital, Audiobook)
  - Category (Fiction, Non-fiction)
- Sort by finished date, title, author, and publication year

### Stats

- Reading stats built from finished books
- Per-year and per-month completion charts
- Rating, format, and category distributions
- Decade and publication spread visualizations

### Data management & preferences

- Export and import your Lectum data as JSON
- Safe import validation (`app: lectum`) before applying data
- Clear app data back to a starter state from settings
- Theme preference: system / light / dark
- Date format preference: DMY / MDY

### PWA support

- Installable web app support where available
- Service worker registration via `vite-plugin-pwa`
- Update-aware install flow in settings

### Sync roadmap

- `/sync` page documents planned optional sync functionality
- Local-first workflow remains fully supported without sync

## Privacy & data

- No required login
- Local-first by default
- Data is stored in IndexedDB when available (with an in-memory fallback)
- Export/import gives full control of portability and backups

> Note: Lectum stores your data on-device. Keep periodic JSON exports if you want backup copies outside the browser.

## Tech stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- Zustand
- Framer Motion
- date-fns
- Lucide React
- Vitest + Testing Library

## Getting started

```bash
pnpm install
pnpm run dev
```

### Local HTTPS dev (optional)

Use `mkcert` for trusted local certs:

1. Install mkcert (macOS): `brew install mkcert nss` and run `mkcert -install`
2. Generate certs:

```bash
mkdir -p certs
pnpm run gen:certs
```

3. Start with host mode:

```bash
pnpm run dev:host
```

Build + preview:

```bash
pnpm run build
pnpm run preview
```

Run full CI checks locally:

```bash
pnpm run ci
```

## Project structure

High-level layout:

- `src/`
  - `App.tsx`, `main.tsx` - app shell and routing
  - `features/`
    - `home/` - current reading and next queue
    - `library/` - finished-books browsing, filters, sorting
    - `stats/` - aggregated reading insights and charts
    - `sync/` - planned sync direction page
  - `shared/`
    - `store/` - state stores and actions
    - `components/` - reusable UI components and modals
    - `utils/` - stats, storage, import/export, date helpers
    - `types/` - shared type definitions
    - `styles/` - shared styling
- `public/` - icons, fonts, web manifest
- `dev-dist/` - generated service worker artifacts

## Contributing

PRs are welcome.

- Keep changes scoped and easy to review
- Add or update tests when behavior changes
- Preserve local-first behavior for core tracking

## License

Original work by Kyle Brooks.
