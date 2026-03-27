# Weather Dashboard

A refreshed version of the original weather dashboard with a cleaner interface, better responsiveness, and sturdier client-side logic.

## What changed

- Reworked the layout into a modern dashboard with a cleaner visual hierarchy
- Removed duplicate library loading and dropped the old jQuery dependency entirely
- Switched weather icon requests to `https` to avoid mixed-content issues
- Added loading states, empty states, and clearer error handling
- Improved search history behavior with deduping and a clear-history action
- Rebuilt the forecast rendering to be more readable on desktop and mobile

## Features

- Search by city or ZIP code
- View current conditions including temperature, feels like, humidity, wind, and sunrise/sunset
- View a 5 day forecast
- Store recent searches in local storage

## Tech

- HTML
- CSS
- Vanilla JavaScript
- OpenWeather API

## Live site

Published at: https://woodstr3313.github.io/Weather-Dashboard/
