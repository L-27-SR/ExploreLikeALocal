class GlobalWeatherMap {
    constructor() {
        // Constants
        this.API_KEY = 'fcc8de7015bbb202209bbf0261babf4c';
        this.BASE_URL = 'https://api.openweathermap.org/data/2.5';
        this.MAP_URL = 'https://tile.openweathermap.org/map';
        
        // Wait for Leaflet to be ready
        if (typeof L === 'undefined') {
            console.error('Leaflet is not loaded. Please ensure the Leaflet script is included before this code.');
            return;
        }
        
        this.initMap();
        this.setupEventListeners();
        this.fetchGlobalWeatherData();
    }

    initMap() {
        // Initialize the map
        this.map = L.map('global-weather-map', {
            center: [0, 0],
            zoom: 3,
            worldCopyJump: true
        });

        // Add base tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        // Add initial weather layer
        this.addWeatherLayer('temp_new');
    }

    addWeatherLayer(layerType) {
        // Remove existing weather layer if it exists
        if (this.weatherLayer) {
            this.map.removeLayer(this.weatherLayer);
        }

        // Add new weather layer
        this.weatherLayer = L.tileLayer(`${this.MAP_URL}/${layerType}/{z}/{x}/{y}.png?appid=${this.API_KEY}`, {
            opacity: 0.7,
            zIndex: 1000
        }).addTo(this.map);
    }

    setupEventListeners() {
        const layerSelector = document.getElementById('layer-selector');
        if (layerSelector) {
            layerSelector.addEventListener('change', (event) => {
                this.addWeatherLayer(event.target.value);
            });
        }

        const timeButtons = document.querySelectorAll('.time-btn');
        timeButtons.forEach(button => {
            button.addEventListener('click', () => {
                timeButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                this.updateWeatherData(button.textContent);
            });
        });
    }

    async fetchGlobalWeatherData() {
        try {
            const response = await fetch(`${this.BASE_URL}/weather?lat=0&lon=0&appid=${this.API_KEY}&units=metric`);
            if (!response.ok) throw new Error('Weather API request failed');
            
            const data = await response.json();
            this.displayGlobalWeatherData(data);
        } catch (error) {
            console.error('Failed to load global weather data:', error);
            this.displayError('Failed to load weather data');
        }
    }

    displayGlobalWeatherData(data) {
        const tempElement = document.getElementById('global-temp');
        const descElement = document.getElementById('weather-description');
        const windElement = document.getElementById('global-wind');
        const humidityElement = document.getElementById('global-humidity');

        if (tempElement) tempElement.textContent = `Temperature: ${data.main.temp}°C`;
        if (descElement) descElement.textContent = `Weather: ${data.weather[0].description}`;
        if (windElement) windElement.textContent = `Wind: ${data.wind.speed} km/h`;
        if (humidityElement) humidityElement.textContent = `Humidity: ${data.main.humidity}%`;
    }

    async updateWeatherData(timeFrame) {
        try {
            let endpoint;
            const params = new URLSearchParams({
                lat: '0',
                lon: '0',
                appid: this.API_KEY,
                units: 'metric'
            });

            if (timeFrame === 'Past 6 Hours') {
                const timestamp = Math.floor(Date.now() / 1000) - 6 * 3600;
                params.append('dt', timestamp.toString());
                endpoint = `${this.BASE_URL}/timemachine?${params}`;
            } else if (timeFrame === 'Future 6 Hours') {
                endpoint = `${this.BASE_URL}/forecast?${params}`;
            }

            const response = await fetch(endpoint);
            if (!response.ok) throw new Error('Weather API request failed');
            
            const data = await response.json();
            this.processTimeData(timeFrame, data);
        } catch (error) {
            console.error('Failed to update weather data:', error);
        }
    }

    processTimeData(timeFrame, data) {
        if (timeFrame === 'Future 6 Hours') {
            const futureData = data.list.slice(0, 2);
            futureData.forEach((forecast, index) => {
                const element = document.getElementById(`forecast-${index}`);
                if (element) {
                    element.textContent = `Time: ${forecast.dt_txt}, Temp: ${forecast.main.temp}°C, Weather: ${forecast.weather[0].description}`;
                }
            });
        }
    }

    displayError(message) {
        const weatherInfo = document.getElementById('weather-info');
        if (weatherInfo) {
            weatherInfo.innerHTML = `<div style="color: red;">${message}</div>`;
        }
    }
}

// Initialize when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Ensure Leaflet is loaded before initializing
    if (typeof L !== 'undefined') {
        new GlobalWeatherMap();
    } else {
        console.error('Leaflet is not loaded. Please ensure the Leaflet script is included before this code.');
    }
});