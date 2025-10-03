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

// Add loading state
let isLoading = false;

weatherForm.addEventListener("submit", async event => {
    event.preventDefault();
    const city = cityInput.value.trim();
    
    if (!city) {
        displayError("Please enter a city name");
        return;
    }
    
    if (isLoading) {
        return; // Prevent multiple requests
    }
    
    await searchWeather(city);
});

// Enhanced search function with multiple fallback strategies
async function searchWeather(city) {
    isLoading = true;
    showLoading();
    
    try {
        // Try different search strategies
        const searchStrategies = [
            city, // Original city name
            `${city},`, // City with comma (helps with ambiguous names)
            city.toLowerCase(), // Lowercase version
            city.charAt(0).toUpperCase() + city.slice(1).toLowerCase() // Proper case
        ];
        
        let weatherData = null;
        let lastError = null;
        
        for (const searchTerm of searchStrategies) {
            try {
                weatherData = await getWeatherData(searchTerm);
                break; // Success, exit loop
            } catch (error) {
                lastError = error;
                console.log(`Failed to find weather for: ${searchTerm}`);
            }
        }
        
        if (weatherData) {
            displayWeatherInfo(weatherData);
            hideLoading();
        } else {
            // If all strategies fail, try to get suggestions
            const suggestions = await getCitySuggestions(city);
            if (suggestions && suggestions.length > 0) {
                displayErrorWithSuggestions(`City "${city}" not found. Did you mean:`, suggestions);
            } else {
                displayError(`City "${city}" not found. Please check the spelling and try again.`);
            }
            hideLoading();
        }
        
    } catch (error) {
        console.error("Search error:", error);
        displayError("Unable to fetch weather data. Please check your internet connection and try again.");
        hideLoading();
    } finally {
        isLoading = false;
    }
}

async function getWeatherData(city) {
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
        if (response.status === 404) {
            throw new Error("City not found");
        } else if (response.status === 401) {
            throw new Error("Invalid API key");
        } else if (response.status === 429) {
            throw new Error("API rate limit exceeded");
        } else {
            throw new Error(`HTTP error: ${response.status}`);
        }
    }
    
    const data = await response.json();
    
    if (!data || !data.name) {
        throw new Error("Invalid weather data received");
    }
    
    return data;
}

// Get city suggestions for better user experience
async function getCitySuggestions(city) {
    try {
        const apiUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=5&appid=${apiKey}`;
        const response = await fetch(apiUrl);
        
        if (response.ok) {
            const suggestions = await response.json();
            return suggestions.map(item => `${item.name}, ${item.country}`);
        }
    } catch (error) {
        console.log("Could not fetch city suggestions:", error);
    }
    return [];
}

function displayWeatherInfo(data) {
    try {
        const { 
            name: city, 
            sys: { country },
            main: { temp, humidity, pressure, feels_like }, 
            weather: [{ description, id }], 
            wind: { speed, deg },
            visibility,
            dt
        } = data;
        
        // Update city and country
        cityDisplay.textContent = city;
        if (country) {
            cityDisplay.textContent += `, ${country}`;
        }
        
        // Update weather description
        descDisplay.textContent = description.charAt(0).toUpperCase() + description.slice(1);
        
        // Update temperature
        tempDisplay.textContent = `${Math.round(temp)}°C`;
        
        // Update weather emoji
        weatherEmoji.textContent = getWeatherEmoji(id);
        
        // Update humidity
        humidityDisplay.textContent = `Humidity: ${humidity}%`;
        
        // Update wind with direction
        const windDirection = getWindDirection(deg);
        windDisplay.textContent = `Wind: ${Math.round(speed * 3.6)} km/h ${windDirection}`;
        
        // Show the card with animation
        card.style.display = "block";
        card.style.opacity = "0";
        card.style.transform = "translateY(20px)";
        
        // Animate in
        setTimeout(() => {
            card.style.transition = "all 0.3s ease";
            card.style.opacity = "1";
            card.style.transform = "translateY(0)";
        }, 100);
        
        // Clear any previous errors
        clearError();
        
    } catch (error) {
        console.error("Error displaying weather info:", error);
        displayError("Error displaying weather information");
    }
}

function getWeatherEmoji(weatherId) {
    switch (true) {
        case (weatherId >= 200 && weatherId < 300): return "⛈️";
        case (weatherId >= 300 && weatherId < 400): return "🌦️";
        case (weatherId >= 500 && weatherId < 600): return "🌧️";
        case (weatherId >= 600 && weatherId < 700): return "❄️";
        case (weatherId >= 700 && weatherId < 800): return "🌫️";
        case (weatherId === 800): return "☀️";
        case (weatherId === 801): return "🌤️";
        case (weatherId === 802): return "⛅";
        case (weatherId === 803): return "☁️";
        case (weatherId === 804): return "☁️";
        default: return "🌤️";
    }
}

function getWindDirection(degrees) {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
}

function displayError(message) {
    card.innerHTML = `
        <div class="error-container">
            <div class="error-icon">⚠️</div>
            <p class="errorDisplay">${message}</p>
        </div>
    `;
    card.style.display = "block";
    card.style.opacity = "0";
    card.style.transform = "translateY(20px)";
    
    setTimeout(() => {
        card.style.transition = "all 0.3s ease";
        card.style.opacity = "1";
        card.style.transform = "translateY(0)";
    }, 100);
}

function displayErrorWithSuggestions(message, suggestions) {
    const suggestionsList = suggestions.map(suggestion => 
        `<button class="suggestion-btn" onclick="searchWeather('${suggestion.split(',')[0]}')">${suggestion}</button>`
    ).join('');
    
    card.innerHTML = `
        <div class="error-container">
            <div class="error-icon">🔍</div>
            <p class="errorDisplay">${message}</p>
            <div class="suggestions">
                ${suggestionsList}
            </div>
        </div>
    `;
    card.style.display = "block";
    card.style.opacity = "0";
    card.style.transform = "translateY(20px)";
    
    setTimeout(() => {
        card.style.transition = "all 0.3s ease";
        card.style.opacity = "1";
        card.style.transform = "translateY(0)";
    }, 100);
}

function showLoading() {
    const button = document.querySelector('button[type="submit"]');
    const icon = button.querySelector('i');
    icon.className = 'fas fa-spinner fa-spin';
    button.disabled = true;
    cityInput.disabled = true;
}

function hideLoading() {
    const button = document.querySelector('button[type="submit"]');
    const icon = button.querySelector('i');
    icon.className = 'fas fa-search';
    button.disabled = false;
    cityInput.disabled = false;
}

function clearError() {
    // This function can be used to clear any error states
}

// Add input validation and auto-suggestions
cityInput.addEventListener('input', debounce(async (e) => {
    const query = e.target.value.trim();
    if (query.length > 2) {
        // Could add live suggestions here
    }
}, 300));

// Debounce function for input handling
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Add keyboard navigation
cityInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        weatherForm.dispatchEvent(new Event('submit'));
    }
});

// Add click outside to close suggestions
document.addEventListener('click', (e) => {
    if (!e.target.closest('.suggestions')) {
        // Close suggestions if needed
    }
});