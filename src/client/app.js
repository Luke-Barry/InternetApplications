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
        initializeRainEffect() {
            particlesJS('particles-js', {
                particles: {
                    number: { value: 1000, density: { enable: true, value_area: 250 } },  // Increased density for thicker rain
                    color: { value: '#0099ff' },        // Blue color for raindrop look
                    shape: { type: 'circle' },          // Circle shape for raindrops
                    opacity: {
                        value: 2,                    // Lower opacity for visibility against background
                        random: true
                    },
                    size: {
                        value: 2,                      // Smaller size to create a finer raindrop effect
                        random: true
                    },
                    move: {
                        direction: 'bottom',           // Falling direction
                        speed: 12,                     // Faster speed to simulate rain
                        straight: false,               // Set to false to allow angular movement
                        random: true,                  // Enables slight horizontal drift to mimic wind
                        out_mode: 'out'                // Exit out of the canvas bottom
                    },
                    line_linked: {                     // Disable lines between particles
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
