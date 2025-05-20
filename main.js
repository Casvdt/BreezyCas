const url = "https://api.openweathermap.org/data/2.5/weather?units=metric&q=    ";

const APIKey = import.meta.env.API_KEY;


const searchBox = document.querySelector(".search input")
const searchBtn = document.querySelector(".search button")
const weatherIcon = document.querySelector(".weather-icon")

async function checkWeather(city) {
    const response = await fetch(url + city + `&appid=${APIKey}`);

    if (response.status == 404) {
        document.querySelector(".error").style.display = "block";
        document.querySelector(".weather").style.display = "none";
    } else {
        const data = await response.json();
        document.querySelector(".city").innerHTML = data.name;
        document.querySelector(".temp").innerHTML = Math.round(data.main.temp) + "°C";
        document.querySelector(".humidity").innerHTML = data.main.humidity + "%";
        document.querySelector(".wind").innerHTML = data.wind.speed + " km/h";


        if (data.weather[0].main == "Clouds") {
            weatherIcon.src = "IMG/clouds.png";
        }
        else if (data.weather[0].main == "Clear") {
            weatherIcon.src = "IMG/clear.png";
        }
        else if (data.weather[0].main == "Rain") {
            weatherIcon.src = "IMG/rain.png";
        }
        else if (data.weather[0].main == "Drizzle") {
            weatherIcon.src = "IMG/drizzle.png";
        }
        else if (data.weather[0].main == "Mist") {
            weatherIcon.src = "IMG/mist.png";
        }

        document.querySelector(".weather").style.display = "block"

    }
}




searchBtn.addEventListener("click", () => {
    checkWeather(searchBox.value);
})

