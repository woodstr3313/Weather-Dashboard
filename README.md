# Weather Dashboard

An Apple-inspired weather dashboard with U.S. city and ZIP search, animated day and night scenes, hourly preview cards, and a polished five day outlook.

## App preview

![Weather Dashboard preview](./images/app-preview.png)

## What changed

- removed the redundant hero chips on the right so the landing area stays cleaner
- improved ZIP search reliability with direct ZIP lookup plus geocode fallback
- added cinematic weather scenes with day and night awareness
- added stronger storm treatment with lightning flash effects
- improved the current conditions presentation and icon treatment
- kept the app as a no-build static site for easy local testing and GitHub Pages deployment

## Features

- search by U.S. city or ZIP code
- current conditions with key metrics
- hourly preview
- five day forecast
- recent search history stored in local storage
- animated reactive background based on the returned weather condition
- subtle 3D tilt interaction on major cards

## Local development

```bash
python3 -m http.server 8082
```

Then open `http://localhost:8082`.

## Tech

- HTML
- CSS
- Vanilla JavaScript
- OpenWeather APIs

## Notes

This version still uses a client-side API key because the app is deployed as a static site. The next production step would be moving weather requests behind a small serverless proxy on a platform like Vercel, Netlify, or Cloudflare.

## Live site

Published at: https://woodstr3313.github.io/Weather-Dashboard/
