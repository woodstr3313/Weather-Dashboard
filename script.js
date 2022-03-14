console.log("working")
//Variables for Dom elements:
var cityInput = document.querySelector("#city-input");
var btn = document.getElementById("search-button");
var APIKey = "d9ec5726f4bacb7542a1b30a7c241e6e";
var todaysForecast = document.getElementById("todays-forecast");
var city;
var fiveDay = document.getElementById("five-day") 
//Function for 1st api call to get geographic coordinates. **Read up on event.preventDefault
function getCoordinates(event) {
  //Get user input
  event.preventDefault();
  city = cityInput.value.trim()
  console.log(city)
  fetch('http://api.openweathermap.org/data/2.5/weather?q='+city+'&appid='+APIKey, {
    cache: 'reload',
  })
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
     getForecast(data);
    });

    const searchHistoryKey = "searchHistory1";
    var searchHistoryList = JSON.parse (localStorage.getItem(searchHistoryKey))

    if (!searchHistoryList){
      searchHistoryList = []
    }
    
    if (searchHistoryList.length >= 8) {
       searchHistoryList = searchHistoryList.slice(-7);
    }
   
    searchHistoryList.push(city) 
    localStorage.setItem(searchHistoryKey, JSON.stringify (searchHistoryList))
      
}
//Function to get forecast with coordinates
function getForecast(coord) {
  console.log(coord)
  console.log(coord.coord)
  var lat = coord.coord.lat
  var lon = coord.coord.lon
  console.log(lat, lon)
  fetch(`https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&appid=${APIKey}`)
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      renderForecast(data);
    });
}
function renderForecast(info) {
  console.log(info)
  // Create variables for daily template
  var unixDate = info.current.dt;
  var dateObject = new Date(unixDate * 1000);
  var humanDate = dateObject.toLocaleString("en-US", {month: "long", day: "numeric", year:"numeric"});
  var temp = Math.round((info.current.temp - 273.5) * 1.8 + 32)
  console.log(temp)
  var uvi = info.current.uvi;
  var humidity = info.current.humidity;
  var windSpeed = info.current.wind_speed;
  var icon = info.current.weather[0].icon;
  console.log(uvi,humidity,windSpeed,icon);
  

  // Create template to inject date into. 
  var template = `
    <h2>${city}-${humanDate} <img src="http://openweathermap.org/img/wn/${icon}@2x.png" alt="Weather Icon"></h2>
    <p> temperature: ${temp} </p>
    <p> wind: ${windSpeed}MPH </p>
    <p> uvi: ${uvi}UV Index: </p>
    <p> humidity: ${humidity}% </p>

  `
  console.log(todaysForecast);
 // Inject template into DOM with inner html method
 todaysForecast.innerHTML = template  
  renderFiveDay(info)
}
//Create a function to render five-day forecast. 
function renderFiveDay(obj){
  console.log(obj)
  //Create a for loop that loops over the daily array inside the object. 
  for(var i = 0; i < 5; i++){
    console.log(obj.daily[i].dt);
    var unixDate = obj.daily[i].dt;
  var dateObject = new Date(unixDate * 1000);
  var humanDate = dateObject.toLocaleString("en-US", {month: "long", day: "numeric", year:"numeric"});
  console.log(humanDate)
  // Create element in for loop and
  }
}

//Add event listener for search button.
btn.addEventListener("click", getCoordinates)



// //Search Var
// var APIKey = "d9ec5726f4bacb7542a1b30a7c241e6e";
// var city = "woodstock";
// var search_Button = [

// // ];

// var list_Results = [
 
// // ];