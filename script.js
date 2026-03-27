const API_KEY = "d9ec5726f4bacb7542a1b30a7c241e6e";
const STORAGE_KEY = "weather-dashboard-history";
const MAX_HISTORY_ITEMS = 8;

const searchForm = document.getElementById("search-form");
const cityInput = document.getElementById("city-input");
const searchButton = document.getElementById("search-button");
const statusMessage = document.getElementById("status-message");
const clearHistoryButton = document.getElementById("clear-history");
const searchHistoryContainer = document.getElementById("search-history-container");
const todaysForecast = document.getElementById("todays-forecast");
const fiveDaySection = document.getElementById("five-day-section");
const fiveDayContainer = document.getElementById("five-day-container");
const emptyState = document.getElementById("empty-state");

let currentLocationName = "";

searchForm.addEventListener("submit", handleSearchSubmit);
clearHistoryButton.addEventListener("click", clearHistory);
searchHistoryContainer.addEventListener("click", handleHistoryClick);

initializeDashboard();

function initializeDashboard() {
  renderSearchHistory();

  const history = getSearchHistory();
  if (history.length) {
    fetchWeather(history[0], false);
  }
}

async function handleSearchSubmit(event) {
  event.preventDefault();
  const query = cityInput.value.trim();

  if (!query) {
    setStatus("Enter a city or ZIP code to search.", true);
    return;
  }

  await fetchWeather(query, true);
}

async function handleHistoryClick(event) {
  const button = event.target.closest("button[data-city]");
  if (!button) {
    return;
  }

  const query = button.dataset.city;
  await fetchWeather(query, false);
}

async function fetchWeather(query, shouldPersist) {
  setLoadingState(true);
  setStatus(`Loading weather for ${query}...`);

  try {
    const currentResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(query)}&units=imperial&appid=${API_KEY}`
    );

    if (!currentResponse.ok) {
      throw new Error("Location not found. Try a different city or ZIP code.");
    }

    const currentData = await currentResponse.json();
    currentLocationName = `${currentData.name}, ${currentData.sys.country}`;

    const forecastResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${currentData.coord.lat}&lon=${currentData.coord.lon}&units=imperial&appid=${API_KEY}`
    );

    if (!forecastResponse.ok) {
      throw new Error("Unable to load the forecast right now.");
    }

    const forecastData = await forecastResponse.json();

    renderCurrentWeather(currentData);
    renderFiveDayForecast(forecastData);

    if (shouldPersist) {
      saveSearch(currentData.name);
    }

    cityInput.value = "";
    setStatus(`Showing weather for ${currentLocationName}.`);
  } catch (error) {
    setStatus(error.message || "Something went wrong while loading the weather.", true);
  } finally {
    setLoadingState(false);
  }
}

function renderCurrentWeather(data) {
  emptyState.classList.add("hidden");
  todaysForecast.classList.remove("hidden");

  const icon = data.weather?.[0]?.icon || "01d";
  const description = toTitleCase(data.weather?.[0]?.description || "Current conditions");
  const sunrise = formatTime(data.sys.sunrise, data.timezone);
  const sunset = formatTime(data.sys.sunset, data.timezone);

  todaysForecast.innerHTML = `
    <div class="current-top">
      <div class="current-heading">
        <div class="current-title-row">
          <h2>${currentLocationName}</h2>
          <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${description}" />
        </div>
        <p class="current-subtitle">${formatLongDate(new Date())} • ${description}</p>
      </div>
      <div class="temperature-pill">${Math.round(data.main.temp)}°F</div>
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
        <span class="metric-label">Sunrise / Sunset</span>
        <p class="metric-value">${sunrise} / ${sunset}</p>
      </article>
    </div>
  `;
}

function renderFiveDayForecast(forecastData) {
  fiveDaySection.classList.remove("hidden");

  const dailyForecasts = forecastData.list.filter((entry) => entry.dt_txt.includes("12:00:00")).slice(0, 5);

  if (!dailyForecasts.length) {
    fiveDayContainer.innerHTML = "<p class=\"current-subtitle\">Forecast data is temporarily unavailable.</p>";
    return;
  }

  fiveDayContainer.innerHTML = dailyForecasts
    .map((entry) => {
      const icon = entry.weather?.[0]?.icon || "01d";
      const description = toTitleCase(entry.weather?.[0]?.description || "Forecast");
      const date = new Date(entry.dt * 1000);

      return `
        <article class="forecast-card">
          <h3>${formatShortDay(date)}</h3>
          <p class="forecast-date">${formatShortDate(date)}</p>
          <img class="forecast-icon" src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${description}" />
          <div class="forecast-detail"><span>High</span><strong>${Math.round(entry.main.temp_max)}°F</strong></div>
          <div class="forecast-detail"><span>Low</span><strong>${Math.round(entry.main.temp_min)}°F</strong></div>
          <div class="forecast-detail"><span>Wind</span><strong>${Math.round(entry.wind.speed)} mph</strong></div>
          <div class="forecast-detail"><span>Humidity</span><strong>${entry.main.humidity}%</strong></div>
        </article>
      `;
    })
    .join("");
}

function saveSearch(city) {
  const history = getSearchHistory().filter((item) => item.toLowerCase() !== city.toLowerCase());
  history.unshift(city);

  const trimmedHistory = history.slice(0, MAX_HISTORY_ITEMS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedHistory));
  renderSearchHistory();
}

function getSearchHistory() {
  const storedHistory = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  return Array.isArray(storedHistory) ? storedHistory : [];
}

function renderSearchHistory() {
  const history = getSearchHistory();

  if (!history.length) {
    searchHistoryContainer.innerHTML = '<p class="current-subtitle">Your recent searches will appear here.</p>';
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
  statusMessage.style.color = isError ? "#fda4af" : "";
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
