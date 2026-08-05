# UV Index

Mobile-first UV index tool. Multilingual (IT/EN/DE), GPS or manual location search,
science-backed content on sun exposure risk.

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- next-intl for i18n (`it`, `en`, `de`)
- MET Norway Locationforecast API for UV data (no key required)
- Open-Meteo geocoding API for location search (no key required)
- Deployed via Docker (multi-stage, Next.js standalone output) on Coolify

## Information architecture

Four surfaces, not four pages — home stays the center, everything else is an overlay:

1. **Home** — big number, color, one-line recommended action, current location
2. **Location** — GPS or search, reached by tapping the location label
3. **Perché? / Why?** — science layer with cited sources (WHO/IARC/AAD/Skin Cancer Foundation), reached by a dedicated button, not part of the main flow
4. **Settings** — language, skin type (for future reapplication timer), units

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm start
```

## Docker

```bash
docker build -t uv-index .
docker run -p 3000:3000 uv-index
```
