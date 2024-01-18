const url = "https://api.openweathermap.org/data/2.5/weather?units=metric&q=    ";

const APIKey = "c3af3ae614484e48429f427c5abea34c"


async function checkWeather() {
    const response = await fetch(url + `&appid=${APIKey}`);
    const data = await response.json();

    console.log(data);

document.querySelector(".city").innerHTML = data.name;
document.querySelector(".temp").innerHTML = data.main.temp + "°C";
document.querySelector(".humidity").innerHTML = data.main.humidity + "%";
document.querySelector(".wind").innerHTML = data.wind.speed + " km/h";

}

checkWeather();