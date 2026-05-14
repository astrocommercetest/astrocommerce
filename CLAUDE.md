# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server at localhost:4321
npm run build     # Build production site to ./dist/
npm run preview   # Preview production build locally
npm run astro     # Access Astro CLI (astro add, astro check, etc.)
```

No test or lint scripts are configured yet.

## Architecture

This is an early-stage Astro 6 ecommerce application with:

- **Astro DB** (`@astrojs/db`) — built-in SQLite-backed database, schema defined in `db/config.ts`, seed data in `db/seed.ts` (not yet implemented)
- **Tailwind CSS 4** — configured via Vite plugin (`@tailwindcss/vite`), global styles in `src/styles/global.css`
- **Roboto font** — loaded via `astro:fonts`, exposed as CSS variable `--font-roboto`
- Language set to Italian (`lang="it"`)

## Database Schema

Three tables defined in `db/config.ts`:

- **Products** — `id, name, slug, description, brandId (FK), collectionIds, variantIds`, timestamps, soft delete; indexed on `updatedAt`
- **Variants** — `id, productId (FK), name, imageId, price, stockQty`, timestamps, soft delete; indexed on `updatedAt`
- **Brands** — `id, name, slug, description`, timestamps, soft delete; indexed on `updatedAt` and `name`

## Key Files

- `astro.config.mjs` — Vite/Tailwind plugin, font config, Astro DB integration
- `db/config.ts` — database table definitions
- `src/layouts/Layout.astro` — root HTML shell, imports global CSS and font variable
- `src/styles/global.css` — Tailwind directives and font variable registration
