// client/app.js
new Vue({
    el: '#app',
    data: {
        city: '',
        title: '3-day Weather Forecast',
        forecast: null,
        errorMessage: '',
        umbrellaAdvice: false,
        weatherType: '',
        packingAdvice: [], // Changed to an array for bulleted list
        airQuality: null,
        airQualityAdvice: '',
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
                const response = await fetch(url);
                if (!response.ok) throw new Error("Failed to fetch weather data");
    
                const data = await response.json();
                this.processWeatherData(data.forecast);
                this.title = `3-day Weather Forecast for ${this.city}`;
                this.showMap = true;
                setTimeout(() => this.updateMap(data.coord.lat, data.coord.lon), 0);
    
                this.errorMessage = '';
                await this.fetchAirQuality(data.coord.lat, data.coord.lon);
    
                // Initialize particle effect based on the updated isSnow state
                this.initializeRainEffect();
            } catch (error) {
                console.error("Fetch error:", error);
                this.errorMessage = 'Could not fetch weather data.';
            }
        },
        async fetchAirQuality(lat, lon) {
            const apiUrl = `http://localhost:3000/api/air_quality?lat=${lat}&lon=${lon}`;

            try {
                const response = await fetch(apiUrl, { method: 'GET' });
                if (!response.ok) throw new Error("Failed to fetch air quality data");

                const data = await response.json();
                this.airQuality = data;
                this.generateAirQualityAdvice();
            } catch (error) {
                console.error("Air Quality fetch error:", error);
                this.airQualityAdvice = 'Air quality data unavailable.';
            }
        },
        generateAirQualityAdvice() {
            const { co, pm2_5, pm10, no2, so2, o3 } = this.airQuality;
            let advice = [];

            if (co > 1000) advice.push("Elevated CO levels: avoid poorly ventilated areas.");
            if (pm2_5 > 35) advice.push("High PM2.5 levels: limit outdoor activities.");
            if (pm10 > 50) advice.push("High PM10 levels: avoid outdoor activities for sensitive groups.");
            if (no2 > 100) advice.push("High NO₂ levels: limit physical activities outside.");
            if (so2 > 20) advice.push("High SO₂ levels: limit exposure if you have respiratory issues.");
            if (o3 > 180) advice.push("High ozone levels: avoid prolonged sun exposure.");

            this.airQualityAdvice = advice.length ? advice.join(" ") : "Air quality is good. No precautions necessary.";
        },
        processWeatherData(forecastData) {
            this.forecast = forecastData;
            const isRaining = this.forecast.some(day => day.rain > 0);
            const recommendations = [];

            if (isRaining) {
                this.umbrellaAdvice = true;
                recommendations.push("Umbrella");
            } else {
                this.umbrellaAdvice = false;
                this.clearRainEffect();
            }

            const avgTemp = this.forecast.reduce((sum, day) => sum + day.temp, 0) / this.forecast.length;
            if (avgTemp < 8) {
                this.weatherType = 'Cold';
                recommendations.push("Hat and gloves");
            } else if (avgTemp <= 24) {
                this.weatherType = 'Mild';
                recommendations.push("Comfortable clothing for mild weather");
            } else {
                this.weatherType = 'Hot';
                recommendations.push("Swimming shorts, suncream, and light clothing");
            }

            this.packingAdvice = recommendations; // Store array of items
        },
        initializeRainEffect() {
            const isSnow = this.isSnow; // Use computed isSnow directly

            particlesJS('particles-js', {
                number: { value: isSnow ? 200 : 300, density: { enable: true, value_area: 800 } },
                particles: {
                    color: { value: isSnow ? '#a6dcef' : '#0000ff' }, // Frost blue for snow, solid blue for rain
                    shape: { type: 'circle' },
                    size: {
                        value: 3,
                        random: true
                    },
                    move: {
                        direction: 'bottom',
                        speed: isSnow ? 10 : 17.5, // Slower speed for snow
                        straight: isSnow ? false : true,
                        random: isSnow ? true : false, // Drifting movement for snow
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
                this.map = L.map('map', {
                    center: [lat, lon],
                    zoom: 10,
                    maxBoundsViscosity: 1.0,
                });

                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    maxZoom: 19,
                    attribution: '&copy; OpenStreetMap contributors'
                }).addTo(this.map);

                // Bind map container dimensions
                window.addEventListener('resize', () => {
                    this.map.invalidateSize();
                });
            }

            if (this.marker) {
                this.marker.setLatLng([lat, lon]);
            } else {
                this.marker = L.marker([lat, lon]).addTo(this.map);
            }

            this.map.setView([lat, lon], 10);
            this.map.invalidateSize();
        }
    },
    watch: {
        isSnow(newVal) {
            // Re-trigger initializeRainEffect only when isSnow changes
            this.initializeRainEffect();
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
        },
        isSnow() {
            // Automatically updates based on current weatherType and umbrellaAdvice
            return this.weatherType === 'Cold' && this.umbrellaAdvice;
        }
    }
});