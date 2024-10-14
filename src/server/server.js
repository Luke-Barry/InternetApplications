// server/server.js

const express = require('express');
const axios = require('axios');
const { OPENWEATHER_API_KEY } = require('./config/apiKeys');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// Function to fetch weather data using One Call API 3.0
async function getWeatherData(lat, lon) {
    const weatherUrl = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=current,minutely,hourly,alerts&units=metric&appid=${OPENWEATHER_API_KEY}`;
    const response = await axios.get(weatherUrl);
    
    // Extract daily data and format for a 3-day forecast
    const dailyData = response.data.daily.slice(0, 3);
    const dailyForecast = dailyData.map(day => ({
        date: new Date(day.dt * 1000).toDateString(),
        temp: day.temp.day, // Daytime temperature
        wind: day.wind_speed, // Wind speed
        rain: day.rain || 0 // Rain volume, default to 0 if not available
    }));

    return { forecast: dailyForecast, coord: { lat, lon } };
}

// New endpoint for air quality data
async function getAirQualityData(lat, lon) {
    const airQualityUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}`;
    
    try {
        const response = await axios.get(airQualityUrl);
        return response.data.list[0].components; // Return air quality components
    } catch (error) {
        console.error('Error fetching air quality data:', error.response ? error.response.data : error.message);
        throw new Error('Air Quality API request failed');
    }
}

// Endpoint to retrieve weather data
app.get('/api/weather', async (req, res) => {
    try {
        const { city } = req.query;
        if (!city) {
            return res.status(400).json({ error: 'City parameter is required' });
        }

        // Step 1: Convert city name to coordinates using Geocoding API
        const geoUrl = `http://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${OPENWEATHER_API_KEY}`;
        const geoResponse = await axios.get(geoUrl);
        const [location] = geoResponse.data;

        if (!location) {
            console.error(`City not found: ${city}`);
            return res.status(404).json({ error: 'City not found' });
        }

        const { lat, lon } = location;
        console.log(`Coordinates for ${city}: lat=${lat}, lon=${lon}`);

        // Step 2: Fetch weather data using One Call API 3.0
        const weatherData = await getWeatherData(lat, lon);
        res.json(weatherData);
    } catch (error) {
        console.error('Error fetching weather data:', error);
        res.status(500).json({ error: 'Error fetching weather data' });
    }
});

// Endpoint to retrieve air quality data
app.get('/api/air_quality', async (req, res) => {
    try {
        const { lat, lon } = req.query;
        if (!lat || !lon) {
            return res.status(400).json({ error: 'Latitude and longitude parameters are required' });
        }

        const airQualityData = await getAirQualityData(lat, lon);
        res.json(airQualityData);
    } catch (error) {
        console.error('Error in air quality route:', error.message);
        res.status(500).json({ error: 'Error fetching air quality data' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
