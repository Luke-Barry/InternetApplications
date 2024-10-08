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

// Helper function to get 3-day weather forecast
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

app.get('/api/weather', async (req, res) => {
    try {
        const { city } = req.query;
        if (!city) {
            return res.status(400).json({ error: 'City parameter is required' });
        }

        const weatherData = await getWeatherData(city);
        res.json(weatherData);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching data' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
