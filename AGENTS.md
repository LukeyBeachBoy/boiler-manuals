# Boiler Manuals

A web application for managing boiler manufacturer documentation — organising manufacturers, models, variants, and their associated PDF manuals.

**Live URL:** https://lukeybeachboy.github.io/boiler-manuals/
**Repo:** https://github.com/LukeyBeachBoy/boiler-manuals

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Framework** | React | 19.2 |
| **Language** | TypeScript | 5.9 |
| **Build** | Vite | 8.0 |
| **Routing** | React Router DOM | 7.13 |
| **State Management** | Legend State (`@legendapp/state`) | 3.0 (beta) |
| **Backend / DB** | Supabase (PostgreSQL + Auth + Storage) | JS SDK 2.100 |
| **Styling** | CSS Modules + CSS custom properties | — |
| **Deployment** | GitHub Pages via GitHub Actions | Node 22 |

## Architecture

### Data Model (Supabase PostgreSQL)

```
manufacturers (id, name, created_at)
  └── models (id, manufacturer_id, name, created_at)
        ├── variants (id, model_id, name, gc_number, created_at)
        └── manuals (id, model_id, title, file_path, file_size, created_at)
              └── manual_variants (manual_id, variant_id)  ← junction table
```

- **Manufacturers** → have many **Models**
- **Models** → have many **Variants** (each with a GC number) and **Manuals** (PDF files)
- **Manuals** → linked to specific **Variants** via `manual_variants` junction table
- PDF files stored in Supabase Storage bucket named `manuals`, path pattern: `{model_id}/{timestamp}-{filename}`
- Cascade deletes: deleting a manufacturer removes all its models, variants, manuals, and storage files

### State Management Pattern

Uses **Legend State V3** observables (not React Context or Redux):
- `src/store/auth.ts` — auth state + `signIn` / `signOut` actions
- `src/store/manufacturers.ts` — CRUD for manufacturers
- `src/store/models.ts` — CRUD for models, including `fetchModelWithRelations`
- `src/store/variants.ts` — CRUD for variants (name + GC number)
- `src/store/manuals.ts` — upload/delete/download manuals with Supabase Storage
- `src/store/search.ts` — global search across all entity types using `ilike` patterns

Components use `useValue()` hook from `@legendapp/state/react` for reactivity.
Local component state uses `useObservable()` instead of React `useState`.

### Routing

Base path: `/boiler-manuals/` (for GitHub Pages)

| Route | Page | Description |
|-------|------|-------------|
| `/login` | LoginPage | Email/password auth via Supabase |
| `/` | DashboardPage | Lists all manufacturers with CRUD |
| `/manufacturer/:id` | ManufacturerDetailPage | Models for a manufacturer |
| `/model/:id` | ModelDetailPage | Variants + manuals for a model |
| `/search?q=` | SearchPage | Global search results |

All routes except `/login` are wrapped in `ProtectedRoute` which requires Supabase auth.

### Component Structure

```
src/
├── components/
│   ├── Layout/          — Header with search bar + sign out + <Outlet/>
│   ├── ProtectedRoute/  — Auth guard (redirects to /login)
│   ├── ConfirmDialog/   — Reusable modal for destructive actions
│   ├── ManufacturerList/ — CRUD list on dashboard
│   ├── ModelList/       — CRUD list on manufacturer detail
│   ├── VariantList/     — CRUD list on model detail (name + GC number)
│   ├── ManualList/      — Upload/download/delete PDFs on model detail
│   └── LoginForm/       — Email + password form
├── pages/
│   ├── Dashboard/       — Renders ManufacturerList
│   ├── Login/           — Renders LoginForm (redirects if already authed)
│   ├── ManufacturerDetail/ — Breadcrumb + ModelList
│   ├── ModelDetail/     — Breadcrumb + VariantList + ManualList
│   └── Search/          — Global search results grouped by entity type
├── store/               — Legend State observables + Supabase queries
├── lib/supabase.ts      — Supabase client init
├── types/database.ts    — TypeScript interfaces for all entities
└── index.css            — Global styles + CSS custom properties
```

### Styling

- **CSS Modules** (`.module.css`) for component-scoped styles
- **CSS Custom Properties** defined in `src/index.css` for theming:
  - `--color-primary: #2563eb` (blue)
  - `--color-danger: #dc2626` (red)
  - `--color-bg: #f8f9fa`, `--color-surface: #ffffff`
  - `--radius: 8px`, `--shadow`, etc.
- System font stack, max-width `960px` layout

## Supabase Configuration

- **Project URL:** `https://eqttpdbkdsdedpiciarz.supabase.co`
- **Tables:** `manufacturers`, `models`, `variants`, `manuals`, `manual_variants`
- **Storage Bucket:** `manuals` (PDFs)
- **Auth:** Email/password via `supabase.auth.signInWithPassword`
- **File access:** Signed URLs with 1-hour expiry via `createSignedUrl`

### Type Generation

Database types are generated from the live Supabase schema — **never hand-edit `src/types/supabase.ts`**.

```bash
supabase gen types typescript --project-id eqttpdbkdsdedpiciarz > src/types/supabase.ts
```

- `src/types/supabase.ts` — Auto-generated (do not edit)
- `src/types/database.ts` — App-level aliases and extended relation types, derived from `supabase.ts`
- `src/lib/supabase.ts` — Client typed with `Database` generic for full query type safety

## Development

```bash
npm install
npm run dev      # Vite dev server
npm run build    # TypeScript check + Vite production build
npm run lint     # ESLint
npm run preview  # Preview production build locally
```

Path alias: `@/` → `./src/` (configured in vite.config.ts)

## Deployment

Automatic via GitHub Actions on push to `main`:
1. `npm ci` + `npm run build` (with Supabase env vars from GitHub Secrets)
2. Copies `index.html` → `404.html` for SPA routing on GitHub Pages
3. Deploys `dist/` to GitHub Pages
