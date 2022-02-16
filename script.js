console.log("working")
//Variables for Dom elements:
var cityInput = document.querySelector("#city-input");
var btn = document.getElementById("search-button");
var APIKey = "d9ec5726f4bacb7542a1b30a7c241e6e";
var todaysForcast = document.getElementById("todays-forcast");
var city;
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


  // Create template to inject date into. 
  var template = `
    <h2>${city}-${humanDate} </h2>
    <p> temperature: ${temp} </p>
  `
 // Inject template into DOM with inner html method
 todaysForcast.innerHTML = template  

}


//Add event listener for search button.
btn.addEventListener("click", getCoordinates)



// //Search Var
// var APIKey = "d9ec5726f4bacb7542a1b30a7c241e6e";
// var city = "woodstock";
// var search_Button = [

// ];

// var list_Results = [

// ];