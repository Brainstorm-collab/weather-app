const weatherForm = document.querySelector(".weatherForm");
const cityInput = document.querySelector(".cityInput");
const card = document.querySelector(".card");
const cityDisplay = document.querySelector(".cityDisplay");
const descDisplay = document.querySelector(".descDisplay");
const tempDisplay = document.querySelector(".tempDisplay");
const weatherEmoji = document.querySelector(".weatherEmoji");
const humidityDisplay = document.querySelector(".humidityDisplay");
const windDisplay = document.querySelector(".windDisplay");
const apiKey = "787c488f6f7aaeaad4fa74e688551b3c"; // Replace with your OpenWeatherMap API key

weatherForm.addEventListener("submit", async event => {
    event.preventDefault();
    const city = cityInput.value.trim();
    if (city) {
        try {
            const weatherData = await getWeatherData(city);
            displayWeatherInfo(weatherData);
        } catch (error) {
            console.error(error);
            displayError("Could not fetch weather data");
        }
    } else {
        displayError("Please enter a city");
    }
});

async function getWeatherData(city) {
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
    const response = await fetch(apiUrl);
    if (!response.ok) {
        throw new Error("Could not fetch weather data");
    }
    return await response.json();
}

function displayWeatherInfo(data) {
    const { name: city, main: { temp, humidity }, weather: [{ description, id }], wind: { speed } } = data;
    cityDisplay.textContent = city;
    descDisplay.textContent = description;
    tempDisplay.textContent = `${temp.toFixed(1)}°C`;
    weatherEmoji.textContent = getWeatherEmoji(id);
    humidityDisplay.textContent = `Humidity: ${humidity}%`;
    windDisplay.textContent = `Wind: ${speed} km/h`;
    card.style.display = "block";
}

function getWeatherEmoji(weatherId) {
    switch (true) {
        case (weatherId >= 200 && weatherId < 300): return "⛈";
        case (weatherId >= 300 && weatherId < 600): return "🌧";
        case (weatherId >= 600 && weatherId < 700): return "❄";
        case (weatherId >= 700 && weatherId < 800): return "🌫";
        case (weatherId === 800): return "☀";
        case (weatherId > 800): return "☁";
        default: return "❓";
    }
}

function displayError(message) {
    card.innerHTML = `<p class="errorDisplay">${message}</p>`;
    card.style.display = "block";
}