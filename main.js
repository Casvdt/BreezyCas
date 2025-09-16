const url = "https://api.openweathermap.org/data/2.5/weather?units=metric&q=";

// Import API key from config
import { API_KEY } from './config.js';

const APIKey = API_KEY;

const searchBox = document.querySelector(".search input")
const searchBtn = document.querySelector(".search button")
const weatherIcon = document.querySelector(".weather-icon")

async function checkWeather(city) {
    const trimmedCity = city.trim();
    if (!trimmedCity) {
        return;
    }
    try {
        const response = await fetch(url + encodeURIComponent(trimmedCity) + `&appid=${APIKey}`);

        if (response.status === 404) {
            document.querySelector(".error").style.display = "block";
            document.querySelector(".weather").style.display = "none";
            return;
        }

        if (!response.ok) {
            throw new Error(`Request failed: ${response.status}`);
        }

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

        document.querySelector(".error").style.display = "none";
        document.querySelector(".weather").style.display = "block";
    } catch (error) {
        document.querySelector(".error").style.display = "block";
        document.querySelector(".weather").style.display = "none";
        // Optionally log error to console for debugging
        console.error(error);
    }
}




searchBtn.addEventListener("click", () => {
    checkWeather(searchBox.value);
})

// Also trigger search when pressing Enter in the input
searchBox.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        checkWeather(searchBox.value);
    }
})

