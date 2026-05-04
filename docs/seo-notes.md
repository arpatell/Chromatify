# Chromatify SEO Notes

## Objective
Increase organic visibility for intent around:
- spotify color aura
- spotify aura generator
- music aura color palette

## Constraints
- Keep on-site branding title as `Chromatify`.
- Keep SEO work invisible in app UI (head tags, robots/sitemap, structured data, internal docs).

## Implemented Foundation
- `public/index.html`
  - Clear home-page description targeting Spotify aura intent.
  - Canonical + OG URL are build-prepared to the production domain.
  - Open Graph and Twitter metadata aligned to product purpose.
  - JSON-LD graph includes `WebSite` + `SoftwareApplication`/`WebApplication`.
- `scripts/generate-seo-assets.js`
  - Resolves production domain from env (`REACT_APP_SITE_URL`, Vercel envs fallback).
  - Rewrites canonical and `og:url` at build time.
  - Generates `public/robots.txt` and `public/sitemap.xml` with absolute URLs.
- `package.json`
  - `prebuild` hook runs SEO asset generation automatically.
- `public/manifest.json`
  - App identity and colors updated to Chromatify branding.

## Domain/Env Notes
Set one of:
- `REACT_APP_SITE_URL=https://your-domain.com` (preferred)
- or rely on `REACT_APP_VERCEL_PROJECT_PRODUCTION_URL` when exposed by Vercel

Without this, fallback is `https://chromatify.vercel.app`.

## Next SEO Priorities (Non-UI Surface)
1. Acquire relevant backlinks from music-tech/product directories and indie webapp lists.
2. Add one crawlable, content-rich static route (for example `/about-aura`) with clear explanatory copy.
3. Connect Google Search Console and monitor:
   - Queries containing `spotify aura`, `color aura`.
   - Index coverage for `/` and sitemap status.
4. Ship periodic metadata refinements from query data (CTR-focused title/description updates).

## Realistic Expectation
Ranking first for broad terms (for example `spotify color aura`) is competitive and not immediate. 
This foundation improves crawl/index quality; authority and sustained content/link signals are required for top positions.
