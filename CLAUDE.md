# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server at localhost:4321
npm run build     # Build production site to ./dist/
npm run preview   # Preview production build locally
npm run astro     # Access Astro CLI (astro add, astro check, astro sync, etc.)
```

Run `npm run astro sync` after any change to `db/config.ts` to regenerate Astro DB types in `.astro/types.d.ts`. Until types are regenerated, TS errors on new table/column names are expected.

No test or lint scripts are configured yet.

## Architecture

Astro 6 ecommerce app. Server-rendered pages in Astro; interactive islands in React 19. Styling via Tailwind CSS 4 (Vite plugin, no PostCSS config file). Global state via nanostores with localStorage persistence.

Language is set to Italian (`lang="it"`).

### Data model

Three-tier product model defined in `db/config.ts` (Astro DB / SQLite):

- **Products** — `id, name, slug, description, longDescription, gender (M/W/U), brandId (FK→Brands), defaultSkuId, collectionIds (json)`, timestamps, soft delete
- **Variants** — one row per color: `id, productId (FK), color, imageIds (json string[])`, timestamps, soft delete
- **Skus** — one purchasable unit per size×color: `id, variantId (FK), size (number), price, stockQty`, timestamps, soft delete
- **Brands** — `id, name, slug, description`, timestamps, soft delete

`Products.defaultSkuId` is a plain `column.text()` (no FK) to avoid a circular dependency with Skus. Insert order in `db/seed.ts`: Brands → Products → Variants → Skus.

The augmented type used throughout the frontend:
```ts
type VariantWithSkus = Variant & { skus: Sku[] }
```
Built server-side in `src/pages/products/[slug].astro` by grouping the joined query rows.

### Image pipeline

Local images live in `testdata/images/` named `variant-{id}.webp` (primary) and `variant-{id}-N.webp` (gallery). `db/seed.ts:syncImages()` uploads them to Cloudinary on each seed run, using MD5 hashes cached in `testdata/.image-manifest.json` to skip unchanged files. Credentials come from `.env` (`PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — never commit this file). Delivery uses `src/lib/cloudinary.ts:cloudinaryImagePath(transformations, publicId)` with a fallback placeholder.

### Cart

`src/features/cart/cartStore.ts` — nanostores `persistentMap` keyed by SKU ID, serialised to localStorage under prefix `"cart:"`. Each entry: `{ sku, variant, qty }`. `addToCart(sku, variant)` increments qty if the SKU is already present. `cartTotal` and `cartCount` are computed atoms. Cart panel and badge are React islands (`client:only="react"`).

### Navigation & menu

Static menu config in `src/config/menu.ts` defines `TopLevelItem[]` (Uomo, Donna, Attrezzatura), each with a `columns: MenuItem[][]` for the mega panel. All hrefs point to `/catalogue` with `?gender=M|W` and/or `?collection=slug` params. Three React components (`client:load` in Layout):
- `Navigation.tsx` — header shell, owns CartBadge
- `MegaMenu.tsx` — desktop hover panel (hidden on mobile)
- `MobileMenu.tsx` — hamburger + accordion drawer (hidden on desktop)

### Page data flow

- `src/pages/index.astro` — joins Products → Skus (via `defaultSkuId`) → Variants for the product grid
- `src/pages/products/[slug].astro` — joins Products → Variants → Skus, groups into `VariantWithSkus[]`, passes to `<ProductPage client:load />`
- `src/pages/catalogue.astro` — stub that passes `Astro.url.searchParams` to a React filtering component

### Styling

Tailwind v4 via `@tailwindcss/vite`. All config is CSS-only in `src/styles/global.css`: `@import "tailwindcss"`, `@source ".."` for class scanning, `@theme inline` for the Roboto font variable (`--font-roboto`), `@layer components` for `.button`. Custom keyframes (e.g. `badge-pop`) are defined at the top level.

### Key files

- `astro.config.mjs` — integrations (db, react), Vite/Tailwind plugin, Roboto font via fontsource
- `db/config.ts` — all table definitions
- `db/seed.ts` — Cloudinary image sync + DB seeding from `testdata/seed.json`
- `src/layouts/Layout.astro` — HTML shell, imports Navigation, CartSidePanel, Toaster
- `src/config/menu.ts` — static mega menu tree
- `src/features/product/ProductPage.tsx` — color/size selection, image gallery, add-to-cart
- `src/features/cart/cartStore.ts` — cart state and operations
- `src/lib/cloudinary.ts` — `cloudinaryImagePath(transformations, publicId)`
