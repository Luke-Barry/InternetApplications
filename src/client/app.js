// client/app.js
new Vue({
    el: '#app',
    data: {
        city: '',
        forecast: null,
        errorMessage: '',
        umbrellaAdvice: false,
        weatherType: '',
        map: null,
        marker: null,
        showMap: false
    },
    created() {
        console.log("Vue instance initialized.");
    },
    methods: {
        async fetchWeather() {
            console.log("fetchWeather called with city:", this.city);

            if (!this.city) {
                this.errorMessage = 'Please enter a city name.';
                return;
            }

            const url = `http://localhost:3000/api/weather?city=${encodeURIComponent(this.city)}`;

            try {
                const response = await fetch(url, { method: 'GET' });
                if (!response.ok) throw new Error("Failed to fetch weather data");

                const data = await response.json();
                console.log("Response data:", data);

                // Process forecast data
                this.processWeatherData(data.forecast);

                // Set showMap to true to render the map container, then update map
                this.showMap = true;
                setTimeout(() => this.updateMap(data.coord.lat, data.coord.lon), 0);

                this.errorMessage = '';
            } catch (error) {
                console.error("Fetch error:", error);
                this.errorMessage = 'Could not fetch weather data.';
            }
        },
        processWeatherData(forecastData) {
            this.forecast = forecastData;

            // Set umbrella advice if any day has rain > 0
            this.umbrellaAdvice = this.forecast.some(day => day.rain > 0);

            // Determine weather type based on average temperature
            const avgTemp = this.forecast.reduce((sum, day) => sum + day.temp, 0) / this.forecast.length;
            this.weatherType = avgTemp < 8 ? 'Cold' : avgTemp <= 24 ? 'Mild' : 'Hot';
        },
        updateMap(lat, lon) {
            // Ensure the map is initialized only once
            if (!this.map) {
                this.map = L.map('map').setView([lat, lon], 10);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    maxZoom: 19,
                    attribution: '&copy; OpenStreetMap contributors'
                }).addTo(this.map);
            }

            // Update marker position or create a new one
            if (this.marker) {
                this.marker.setLatLng([lat, lon]);
            } else {
                this.marker = L.marker([lat, lon]).addTo(this.map);
            }

            // Center the map on the new coordinates
            this.map.setView([lat, lon], 10);
        }
    }
});
