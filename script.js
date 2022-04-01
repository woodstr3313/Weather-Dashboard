console.log("working");
//Variables for Dom elements:
var cityInput = document.querySelector("#city-input");
var btn = document.getElementById("search-button");
var APIKey = "d9ec5726f4bacb7542a1b30a7c241e6e";
var todaysForecast = document.getElementById("todays-forecast");
var city;
var fiveDay = document.getElementById("five-day-container");
var searchHistoryContainer = document.getElementById(
  "search-history-container"
);
var searchHistoryList;
//Function for 1st api call to get geographic coordinates. **Read up on event.preventDefault
function getCoordinates(event) {
  //Get user input
  event.preventDefault();
  console.log(event.target);
  city = cityInput.value.trim();
  console.log(city);
  apiCall(city);

  const searchHistoryKey = "searchHistory1";
  searchHistoryList = JSON.parse(localStorage.getItem(searchHistoryKey));

  if (!searchHistoryList) {
    searchHistoryList = [];
  }

  if (searchHistoryList.length >= 8) {
    searchHistoryList = searchHistoryList.slice(-7);
  }

  searchHistoryList.push(city);
  localStorage.setItem(searchHistoryKey, JSON.stringify(searchHistoryList));

  searchHistoryResults(searchHistoryList);
}

function apiCall(city) {
  fetch(
    "http://api.openweathermap.org/data/2.5/weather?q=" +
      city +
      "&appid=" +
      APIKey,
    {
      cache: "reload",
    }
  )
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      getForecast(data);
    });
}

//TODO clean up any old elements. Run function to list list results
function searchHistoryResults(searchHistoryList) {
  searchHistoryList = JSON.parse(localStorage.getItem("searchHistory1"));
  // Check if the search history isnt in local storage
  if (!searchHistoryList) {
    return;
  }
  console.log(searchHistoryList);
  // Clear out old elements
  searchHistoryContainer.innerHTML = "";
  // Create a for loop to wrap each of our search items in our array
  console.log(typeof searchHistoryList);
  for (var i = 0; i < searchHistoryList.length; i++) {
    //Create a button element to wrap each item in the html
    var historyButton = document.createElement("button");
    // Research Classlist.add to add a class to the button element
    historyButton.classList.add("history-button");
    historyButton.innerText = searchHistoryList[i];
    historyButton.addEventListener("click", handleHistoryClick);
    searchHistoryContainer.appendChild(historyButton);
  }
}
function handleHistoryClick(event) {
  console.log("handlinghistory");
  console.log(event.target.innerText);
  city = event.target.innerText;
  apiCall(city);
}
//Function to get forecast with coordinates
function getForecast(coord) {
  console.log(coord);
  console.log(coord.coord);
  var lat = coord.coord.lat;
  var lon = coord.coord.lon;
  console.log(lat, lon);
  fetch(
    `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&appid=${APIKey}`
  )
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      renderForecast(data);
    });
}
function renderForecast(info) {
  console.log(info);
  // Create variables for daily template
  var unixDate = info.current.dt;
  var dateObject = new Date(unixDate * 1000);
  var humanDate = dateObject.toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  var temp = Math.round((info.current.temp - 273.15) * 1.8 + 32);
  console.log(temp);
  var uvi = info.current.uvi;
  var humidity = info.current.humidity;
  var windSpeed = info.current.wind_speed;
  var icon = info.current.weather[0].icon;
  console.log(uvi, humidity, windSpeed, icon);
  console.log(info);

  // Create template to inject date into.
  var template = `
    <h2>${city}-${humanDate} <img src="http://openweathermap.org/img/wn/${icon}@2x.png" alt="Weather Icon"></h2>
    <p> temperature: ${temp} </p>
    <p> wind: ${windSpeed}MPH </p>
    <p> uvi: ${uvi}UV Index: </p>
    <p> humidity: ${humidity}% </p>

  `;
  console.log(todaysForecast);
  // Inject template into DOM with inner html method
  todaysForecast.innerHTML = template;
  renderFiveDay(info);
}
//Create a function to render five-day forecast.
function renderFiveDay(obj) {
  fiveDay.innerHTML = "";
  //Create a for loop that loops over the daily array inside the object.
  for (var i = 1; i < 6; i++) {
    console.log(fiveDay);
    console.log(obj.daily[i].dt);
    var unixDate = obj.daily[i].dt;
    var dateObject = new Date(unixDate * 1000);
    var humanDate = dateObject.toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    var icon = obj.daily[i].weather[0].icon;
    var temp = Math.round((obj.daily[i].temp.day - 273.15) * 1.8 + 32);
    var humidity = obj.daily[i].humidity;
    var wind = obj.daily[i].wind_speed;
    console.log(icon, temp, humidity, wind);
    var template = `
      <h2>${humanDate} <img src="http://openweathermap.org/img/wn/${icon}@2x.png" alt="Weather Icon"></h2>
      <p> temperature: ${temp} </p>
      <p> wind: ${wind}MPH </p>
      <p> humidity: ${humidity}% </p>
    `;
    // Create element for each day for the forecast
    var card = document.createElement("div");
    card.classList.add("future");
    card.innerHTML = template;
    fiveDay.appendChild(card);
  }
}

//Add event listener for search button.
btn.addEventListener("click", getCoordinates);
searchHistoryResults(searchHistoryList);
