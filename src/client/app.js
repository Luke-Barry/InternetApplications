// client/app.js
new Vue({
    el: '#app',
    data: {
        city: '',
        forecast: null,
        errorMessage: '',
        umbrellaAdvice: false,
        weatherType: '',  // 'Cold', 'Mild', or 'Hot' based on temperature
        map: null,
        marker: null,
        showMap: false
    },
    methods: {
        async fetchWeather() {
            if (!this.city) {
                this.errorMessage = 'Please enter a city name.';
                return;
            }

            const url = `http://localhost:3000/api/weather?city=${encodeURIComponent(this.city)}`;

            try {
                const response = await fetch(url, { method: 'GET' });
                if (!response.ok) throw new Error("Failed to fetch weather data");

                const data = await response.json();
                this.processWeatherData(data.forecast);
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
            this.umbrellaAdvice = this.forecast.some(day => day.rain > 0);

            const avgTemp = this.forecast.reduce((sum, day) => sum + day.temp, 0) / this.forecast.length;
            this.weatherType = avgTemp < 8 ? 'Cold' : avgTemp <= 24 ? 'Mild' : 'Hot';
        },
        updateMap(lat, lon) {
            if (!this.map) {
                this.map = L.map('map').setView([lat, lon], 10);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    maxZoom: 19,
                    attribution: '&copy; OpenStreetMap contributors'
                }).addTo(this.map);
            }

            if (this.marker) {
                this.marker.setLatLng([lat, lon]);
            } else {
                this.marker = L.marker([lat, lon]).addTo(this.map);
            }

            this.map.setView([lat, lon], 10);
        }
    },
    computed: {
        weatherClass() {
            switch (this.weatherType) {
                case 'Cold':
                    return 'cold-weather';
                case 'Mild':
                    return 'mild-weather';
                case 'Hot':
                    return 'hot-weather';
                default:
                    return '';
            }
        }
    }
});
