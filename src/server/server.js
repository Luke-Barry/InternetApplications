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

// Existing endpoint for weather data
async function getWeatherData(city) {
    const weatherUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${OPENWEATHER_API_KEY}`;
    const response = await axios.get(weatherUrl);
    const forecastData = response.data.list;

    const dailyForecast = [];
    const dates = new Set();

    forecastData.forEach(entry => {
        const date = new Date(entry.dt * 1000).toDateString();
        if (!dates.has(date) && dailyForecast.length < 3) {
            dates.add(date);
            dailyForecast.push({
                date: date,
                temp: entry.main.temp,
                wind: entry.wind.speed,
                rain: entry.rain ? entry.rain['3h'] : 0
            });
        }
    });

    return { forecast: dailyForecast, coord: response.data.city.coord };
}

// New endpoint for air quality data
async function getAirQualityData(lat, lon) {
    const airQualityUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}`;
    
    try {
        const response = await axios.get(airQualityUrl);
        return response.data.list[0].components; // Return components
    } catch (error) {
        console.error('Error fetching air quality data:', error.response ? error.response.data : error.message);
        throw new Error('Air Quality API request failed');
    }
}

app.get('/api/weather', async (req, res) => {
    try {
        const { city } = req.query;
        if (!city) {
            return res.status(400).json({ error: 'City parameter is required' });
        }

        const weatherData = await getWeatherData(city);
        res.json(weatherData);
    } catch (error) {
        console.error('Error fetching weather data:', error.message);
        res.status(500).json({ error: 'Error fetching weather data' });
    }
});

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
