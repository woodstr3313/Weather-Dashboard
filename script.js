const API_KEY = "d9ec5726f4bacb7542a1b30a7c241e6e";
const STORAGE_KEY = "weather-dashboard-history";
const MAX_HISTORY_ITEMS = 8;
const ZIP_CODE_PATTERN = /^\d{5}(?:-\d{4})?$/;

const searchForm = document.getElementById("search-form");
const cityInput = document.getElementById("city-input");
const searchButton = document.getElementById("search-button");
const statusMessage = document.getElementById("status-message");
const clearHistoryButton = document.getElementById("clear-history");
const searchHistoryContainer = document.getElementById("search-history-container");
const todaysForecast = document.getElementById("todays-forecast");
const fiveDaySection = document.getElementById("five-day-section");
const fiveDayContainer = document.getElementById("five-day-container");
const hourlySection = document.getElementById("hourly-section");
const hourlyContainer = document.getElementById("hourly-container");
const emptyState = document.getElementById("empty-state");
const particleContainer = document.getElementById("weather-particles");
const tiltSurfaces = Array.from(document.querySelectorAll(".tilt-surface"));

let currentLocationName = "";

searchForm.addEventListener("submit", handleSearchSubmit);
clearHistoryButton.addEventListener("click", clearHistory);
searchHistoryContainer.addEventListener("click", handleHistoryClick);
initializeTiltSurfaces();
initializeDashboard();

function initializeDashboard() {
  renderSearchHistory();
  buildWeatherScene("clear");

  const history = getSearchHistory();
  if (history.length) {
    fetchWeather(history[0], false);
  }
}

async function handleSearchSubmit(event) {
  event.preventDefault();
  const query = cityInput.value.trim();

  if (!query) {
    setStatus("Enter a U.S. city or ZIP code to search.", true);
    return;
  }

  await fetchWeather(query, true);
}

async function handleHistoryClick(event) {
  const button = event.target.closest("button[data-city]");
  if (!button) {
    return;
  }

  await fetchWeather(button.dataset.city, false);
}

async function fetchWeather(query, shouldPersist) {
  const normalizedQuery = query.trim();
  setLoadingState(true);
  setStatus(`Loading weather for ${normalizedQuery}...`);

  try {
    const isZipCode = ZIP_CODE_PATTERN.test(normalizedQuery);
    const { currentData, forecastData, displayQuery } = isZipCode
      ? await fetchZipWeather(normalizedQuery)
      : await fetchCityWeather(normalizedQuery);

    currentLocationName = `${currentData.name}, ${currentData.sys.country}`;

    const weatherType = normalizeWeatherType(currentData.weather?.[0]?.main || "Clear");
    renderCurrentWeather(currentData);
    renderHourlyForecast(forecastData.list.slice(0, 6));
    renderFiveDayForecast(forecastData);
    buildWeatherScene(weatherType);

    if (shouldPersist) {
      saveSearch(displayQuery);
    }

    cityInput.value = "";
    setStatus(`Showing weather for ${currentLocationName}.`);
  } catch (error) {
    setStatus(error.message || "Something went wrong while loading the weather.", true);
  } finally {
    setLoadingState(false);
  }
}

async function fetchZipWeather(zipCode) {
  try {
    return await fetchZipWeatherDirect(zipCode);
  } catch (directError) {
    return fetchZipWeatherByGeocode(zipCode, directError);
  }
}

async function fetchZipWeatherDirect(zipCode) {
  const zipParam = `${zipCode},US`;
  const [currentResponse, forecastResponse] = await Promise.all([
    fetch(`https://api.openweathermap.org/data/2.5/weather?zip=${encodeURIComponent(zipParam)}&units=imperial&appid=${API_KEY}`),
    fetch(`https://api.openweathermap.org/data/2.5/forecast?zip=${encodeURIComponent(zipParam)}&units=imperial&appid=${API_KEY}`)
  ]);

  if (currentResponse.status === 404 || forecastResponse.status === 404) {
    throw new Error("That ZIP code was not found through the direct ZIP lookup.");
  }

  if (!currentResponse.ok || !forecastResponse.ok) {
    throw new Error("Direct ZIP forecast lookup failed.");
  }

  const [currentData, forecastData] = await Promise.all([
    currentResponse.json(),
    forecastResponse.json()
  ]);

  return {
    currentData,
    forecastData,
    displayQuery: zipCode
  };
}

async function fetchZipWeatherByGeocode(zipCode, originalError) {
  const geoResponse = await fetch(
    `https://api.openweathermap.org/geo/1.0/zip?zip=${encodeURIComponent(`${zipCode},US`)}&appid=${API_KEY}`
  );

  if (geoResponse.status === 404) {
    throw new Error("That ZIP code was not found. Try another U.S. ZIP code.");
  }

  if (!geoResponse.ok) {
    throw new Error(originalError?.message || "Unable to load weather for that ZIP code right now.");
  }

  const geoData = await geoResponse.json();
  const [currentResponse, forecastResponse] = await Promise.all([
    fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${geoData.lat}&lon=${geoData.lon}&units=imperial&appid=${API_KEY}`
    ),
    fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${geoData.lat}&lon=${geoData.lon}&units=imperial&appid=${API_KEY}`
    )
  ]);

  if (!currentResponse.ok || !forecastResponse.ok) {
    throw new Error("Unable to load weather for that ZIP code right now.");
  }

  const [currentData, forecastData] = await Promise.all([
    currentResponse.json(),
    forecastResponse.json()
  ]);

  return {
    currentData,
    forecastData,
    displayQuery: zipCode
  };
}

async function fetchCityWeather(city) {
  const geoResponse = await fetch(
    `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)},US&limit=1&appid=${API_KEY}`
  );

  if (!geoResponse.ok) {
    throw new Error("Unable to search for that city right now.");
  }

  const geoResults = await geoResponse.json();
  const match = geoResults?.[0];

  if (!match) {
    throw new Error("That city was not found. Try a U.S. city name or ZIP code.");
  }

  const [currentResponse, forecastResponse] = await Promise.all([
    fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${match.lat}&lon=${match.lon}&units=imperial&appid=${API_KEY}`
    ),
    fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${match.lat}&lon=${match.lon}&units=imperial&appid=${API_KEY}`
    )
  ]);

  if (!currentResponse.ok || !forecastResponse.ok) {
    throw new Error("Unable to load the forecast right now.");
  }

  const [currentData, forecastData] = await Promise.all([
    currentResponse.json(),
    forecastResponse.json()
  ]);

  return {
    currentData,
    forecastData,
    displayQuery: match.name
  };
}

function renderCurrentWeather(data) {
  emptyState.classList.add("hidden");
  todaysForecast.classList.remove("hidden");

  const icon = data.weather?.[0]?.icon || "01d";
  const description = toTitleCase(data.weather?.[0]?.description || "Current conditions");
  const weatherType = normalizeWeatherType(data.weather?.[0]?.main || "Clear");
  const high = data.main.temp_max;
  const low = data.main.temp_min;
  const sunrise = formatTime(data.sys.sunrise, data.timezone);
  const sunset = formatTime(data.sys.sunset, data.timezone);

  todaysForecast.innerHTML = `
    <div class="current-top">
      <div class="current-main">
        <div class="location-row">
          <h2>${currentLocationName}</h2>
          <span class="current-badge">${prettyWeatherLabel(weatherType)}</span>
        </div>
        <p class="current-subtitle">${formatLongDate(new Date())} • ${description}</p>
      </div>
      <div class="current-summary">
        <div class="current-icon-wrap">
          <img src="https://openweathermap.org/img/wn/${icon}@4x.png" alt="${description}" />
        </div>
        <div class="temperature-block">
          <div class="current-temp">${Math.round(data.main.temp)}°</div>
          <div class="current-desc">H ${Math.round(high)}° • L ${Math.round(low)}°</div>
        </div>
      </div>
    </div>

    <div class="metric-grid">
      <article class="metric-card">
        <span class="metric-label">Feels Like</span>
        <p class="metric-value">${Math.round(data.main.feels_like)}°F</p>
      </article>
      <article class="metric-card">
        <span class="metric-label">Humidity</span>
        <p class="metric-value">${data.main.humidity}%</p>
      </article>
      <article class="metric-card">
        <span class="metric-label">Wind</span>
        <p class="metric-value">${Math.round(data.wind.speed)} mph</p>
      </article>
      <article class="metric-card">
        <span class="metric-label">Pressure</span>
        <p class="metric-value">${data.main.pressure} hPa</p>
      </article>
      <article class="metric-card">
        <span class="metric-label">Sunrise</span>
        <p class="metric-value">${sunrise}</p>
      </article>
      <article class="metric-card">
        <span class="metric-label">Sunset</span>
        <p class="metric-value">${sunset}</p>
      </article>
    </div>
  `;
}

function renderHourlyForecast(hourlyEntries) {
  hourlySection.classList.remove("hidden");

  hourlyContainer.innerHTML = hourlyEntries
    .map((entry) => {
      const icon = entry.weather?.[0]?.icon || "01d";
      const label = toTitleCase(entry.weather?.[0]?.main || "Clear");

      return `
        <article class="hourly-card">
          <p class="hourly-time">${formatHour(new Date(entry.dt * 1000))}</p>
          <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${label}" />
          <p class="hourly-temp">${Math.round(entry.main.temp)}°</p>
          <p class="hourly-label">${label}</p>
        </article>
      `;
    })
    .join("");
}

function renderFiveDayForecast(forecastData) {
  fiveDaySection.classList.remove("hidden");

  const dailyForecasts = forecastData.list
    .filter((entry) => entry.dt_txt.includes("12:00:00"))
    .slice(0, 5);

  if (!dailyForecasts.length) {
    fiveDayContainer.innerHTML = '<p class="current-subtitle">Forecast data is temporarily unavailable.</p>';
    return;
  }

  fiveDayContainer.innerHTML = dailyForecasts
    .map((entry) => {
      const icon = entry.weather?.[0]?.icon || "01d";
      const description = toTitleCase(entry.weather?.[0]?.description || "Forecast");
      const date = new Date(entry.dt * 1000);

      return `
        <article class="forecast-card">
          <h3 class="forecast-day">${formatShortDay(date)}</h3>
          <p class="forecast-meta">${formatShortDate(date)}</p>
          <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${description}" />
          <div class="forecast-range"><span>High</span><strong>${Math.round(entry.main.temp_max)}°F</strong></div>
          <div class="forecast-range"><span>Low</span><strong>${Math.round(entry.main.temp_min)}°F</strong></div>
          <div class="forecast-detail"><span>Wind</span><strong>${Math.round(entry.wind.speed)} mph</strong></div>
          <div class="forecast-detail"><span>Humidity</span><strong>${entry.main.humidity}%</strong></div>
        </article>
      `;
    })
    .join("");
}

function saveSearch(query) {
  const history = getSearchHistory().filter((item) => item.toLowerCase() !== query.toLowerCase());
  history.unshift(query);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, MAX_HISTORY_ITEMS)));
  renderSearchHistory();
}

function getSearchHistory() {
  const storedHistory = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  return Array.isArray(storedHistory) ? storedHistory : [];
}

function renderSearchHistory() {
  const history = getSearchHistory();

  if (!history.length) {
    searchHistoryContainer.innerHTML = '<p>Your recent searches will appear here.</p>';
    return;
  }

  searchHistoryContainer.innerHTML = history
    .map(
      (item) =>
        `<button type="button" class="history-button" data-city="${escapeHtml(item)}">${escapeHtml(item)}</button>`
    )
    .join("");
}

function clearHistory() {
  localStorage.removeItem(STORAGE_KEY);
  renderSearchHistory();
  setStatus("Search history cleared.");
}

function setLoadingState(isLoading) {
  searchButton.disabled = isLoading;
  searchButton.textContent = isLoading ? "Loading..." : "Get Weather";
}

function setStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.style.color = isError ? "#fecdd3" : "";
}

function buildWeatherScene(weatherType) {
  document.body.dataset.weather = weatherType;
  particleContainer.innerHTML = "";

  const config = getParticleConfig(weatherType);
  for (let index = 0; index < config.count; index += 1) {
    const particle = document.createElement("span");
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.top = `${Math.random() * 100}%`;
    particle.style.animationDuration = `${config.minDuration + Math.random() * config.durationSpread}s`;
    particle.style.animationDelay = `${Math.random() * config.delaySpread}s`;
    particle.style.opacity = `${config.baseOpacity}`;

    if (config.type === "cloud") {
      particle.style.top = `${5 + Math.random() * 55}%`;
      particle.style.transform = `scale(${0.7 + Math.random() * 0.7})`;
    }

    particleContainer.appendChild(particle);
  }
}

function getParticleConfig(weatherType) {
  switch (weatherType) {
    case "rain":
    case "drizzle":
      return { count: 55, minDuration: 1.6, durationSpread: 1.8, delaySpread: 3, baseOpacity: 0.7, type: "rain" };
    case "thunderstorm":
      return { count: 70, minDuration: 1.1, durationSpread: 1.2, delaySpread: 2, baseOpacity: 0.9, type: "rain" };
    case "snow":
      return { count: 42, minDuration: 6, durationSpread: 4, delaySpread: 6, baseOpacity: 0.95, type: "snow" };
    case "clouds":
    case "mist":
    case "fog":
    case "haze":
      return { count: 9, minDuration: 18, durationSpread: 10, delaySpread: 18, baseOpacity: 0.32, type: "cloud" };
    default:
      return { count: 7, minDuration: 20, durationSpread: 12, delaySpread: 18, baseOpacity: 0.22, type: "cloud" };
  }
}

function initializeTiltSurfaces() {
  tiltSurfaces.forEach((surface) => {
    surface.addEventListener("mousemove", (event) => {
      const rect = surface.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const rotateY = ((x / rect.width) - 0.5) * 8;
      const rotateX = ((y / rect.height) - 0.5) * -8;
      surface.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-2px)`;
    });

    surface.addEventListener("mouseleave", () => {
      surface.style.transform = "perspective(1200px) rotateX(0deg) rotateY(0deg) translateY(0px)";
    });
  });
}

function normalizeWeatherType(value) {
  const normalized = value.toLowerCase();

  if (normalized.includes("thunder")) return "thunderstorm";
  if (normalized.includes("drizzle")) return "drizzle";
  if (normalized.includes("rain")) return "rain";
  if (normalized.includes("snow")) return "snow";
  if (normalized.includes("mist")) return "mist";
  if (normalized.includes("fog")) return "fog";
  if (normalized.includes("haze")) return "haze";
  if (normalized.includes("cloud")) return "clouds";
  return "clear";
}

function prettyWeatherLabel(value) {
  return value === "clear" ? "Clear Skies" : toTitleCase(value);
}

function formatLongDate(date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

function formatShortDay(date) {
  return new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date);
}

function formatShortDate(date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric"
  }).format(date);
}

function formatHour(date) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    hour12: true
  }).format(date);
}

function formatTime(unixTimestamp, timezoneOffsetSeconds) {
  const localTime = new Date((unixTimestamp + timezoneOffsetSeconds) * 1000);
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC"
  }).format(localTime);
}

function toTitleCase(value) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
