// client/app.js
new Vue({
    el: '#app',
    data: {
        city: '',
        forecast: null,
        errorMessage: '',
        umbrellaAdvice: false,
        weatherType: '',
        packingAdvice: '',  // New property for combined packing advice
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
            const isRaining = this.forecast.some(day => day.rain > 0);
            const recommendations = [];  // Array to hold packing items based on conditions

            if (isRaining) {
                this.umbrellaAdvice = true;
                recommendations.push("an umbrella");  // Recommend umbrella for rainy weather
            } else {
                this.umbrellaAdvice = false;
                this.clearRainEffect();
            }

            // Determine temperature-based recommendations
            const avgTemp = this.forecast.reduce((sum, day) => sum + day.temp, 0) / this.forecast.length;
            if (avgTemp < 8) {
                this.weatherType = 'Cold';
                recommendations.push("warm pants, jackets, hat, gloves and scarf");  // Cold weather items
            } else if (avgTemp <= 24) {
                this.weatherType = 'Mild';
                recommendations.push("shorts, t-shirts and hoodies");
            } else {
                this.weatherType = 'Hot';
                recommendations.push("swimming shorts, suncream, and light clothing");  // Hot weather items
            }

            // Combine all recommendations into a single packing advice string
            this.packingAdvice = "Don't forget to pack: " + recommendations.join(", ") + ".";
        },
        initializeRainEffect() {
            particlesJS('particles-js', {
                particles: {
                    number: { value: 400, density: { enable: true, value_area: 800 } },
                    color: { value: '#0099ff' },
                    shape: { type: 'circle' },
                    size: {
                        value: 3,
                        random: true
                    },
                    move: {
                        direction: 'bottom',
                        speed: 15,
                        straight: false,
                        random: true,
                        out_mode: 'out'
                    },
                    line_linked: {
                        enable: false
                    }
                },
                interactivity: {
                    detect_on: 'canvas',
                    events: {
                        onhover: { enable: false },
                        onclick: { enable: false }
                    }
                },
                retina_detect: true
            });
        },
        clearRainEffect() {
            const particlesCanvas = document.querySelector('#particles-js canvas');
            if (particlesCanvas) {
                particlesCanvas.remove();
            }
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
    watch: {
        umbrellaAdvice(newVal) {
            if (newVal) {
                this.initializeRainEffect();
            } else {
                this.clearRainEffect();
            }
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
