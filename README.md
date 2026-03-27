# Weather Dashboard

A redesigned weather dashboard with a more polished, Apple-inspired feel, support for U.S. city and ZIP code searches, and a reactive animated weather scene.

## What changed

- rebuilt the interface into a more premium glassmorphism layout
- added support for U.S. ZIP code searches alongside city searches
- added a dynamic background scene that changes with current weather conditions
- added lightweight animated weather particles for clear, cloudy, rainy, snowy, and misty conditions
- added an hourly preview section and improved the five day forecast presentation
- added a favicon and refreshed the project structure
- kept the app as a no-build static site so it still runs easily with GitHub Pages or a local server

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
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Tech

- HTML
- CSS
- Vanilla JavaScript
- OpenWeather APIs

## Notes

This version still uses a client-side API key because the app is deployed as a static site. To fully secure the API key, the next step would be moving requests behind a small serverless proxy on a platform like Vercel, Netlify, or Cloudflare.

## Live site

Published at: https://woodstr3313.github.io/Weather-Dashboard/
