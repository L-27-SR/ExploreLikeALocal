// Global variable to store the name of the first tourist location
let firstLocationName = null;

// OSM feature tags for different categories
const featuresOSMTags = {
    "Zoo": "tourism=zoo",
    "Temple": "amenity=place_of_worship",
    "Museum": "tourism=museum",
    "Park": "leisure=park",
    "Viewpoint": "tourism=viewpoint",
    "Beach": "natural=beach",
    "Restaurant": "amenity=restaurant",
};
const categories = {
    restaurants: { type: "restaurant", radius: 5000, limit: 5 },
    gasStations: { type: "fuel", radius: 5000, limit: 5 },
    temples: { type: "place_of_worship", radius: 10000, limit: 3 },
    parks: { type: "park", radius: 10000, limit: 5 },
    touristAttractions: { type: "tourism", value: "attraction", radius: 50000, limit: 10 }
};

// Initialize the map with a placeholder position until the actual location is obtained
const map = L.map('map').setView([51.505, -0.09], 13); // Default center (can be changed)

// Add the OpenStreetMap tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Retrieve 'category' from local storage
const category = localStorage.getItem('category');
if (!category) {
    console.error("No category found in local storage");
} else {
    console.log("Category:", category);
}

// Function to get the user's current location
function getUserLocation() {
    return new Promise((resolve, reject) => {
        if (navigator.geolocation) {
            console.log("Getting user location...");
            navigator.geolocation.getCurrentPosition(
                position => {
                    const { latitude, longitude } = position.coords;
                    console.log(`User location: Latitude: ${latitude}, Longitude: ${longitude}`);
                    resolve({ latitude, longitude });
                },
                error => {
                    reject('Geolocation failed: ' + error.message);
                }
            );
        } else {
            reject('Geolocation is not supported by this browser.');
        }
    });
}

// Add Weather Information
async function addWeatherInfo(latitude, longitude) {
    try {
        const response = await fetch(`/api/weather/${latitude},${longitude}`);
        const weatherData = await response.json();
        
        if (weatherData && weatherData[0]) {
            const weather = weatherData[0].current;
            const weatherDiv = document.createElement('div');
            weatherDiv.className = 'weather-info';
            weatherDiv.innerHTML = `
                <h3>Current Weather</h3>
                <p>Temperature: ${weather.temperature}°C</p>
                <p>Condition: ${weather.skytext}</p>
                <p>Humidity: ${weather.humidity}%</p>
            `;
            document.querySelector('.location-info').prepend(weatherDiv);
        }
    } catch (error) {
        console.error('Error fetching weather:', error);
    }
}

// Add 3D Preview
function add3DPreview(latitude, longitude) {
    const container = document.createElement('div');
    container.id = '3d-preview';
    container.style.height = '300px';
    document.querySelector('.location-info').appendChild(container);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // Add 3D terrain using elevation data
    const geometry = new THREE.PlaneGeometry(50, 50, 100, 100);
    const material = new THREE.MeshPhongMaterial({ color: 0x55ff55 });
    const terrain = new THREE.Mesh(geometry, material);
    scene.add(terrain);

    // Add lighting
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(0, 1, 1);
    scene.add(light);

    camera.position.z = 50;

    function animate() {
        requestAnimationFrame(animate);
        terrain.rotation.x += 0.001;
        renderer.render(scene, camera);
    }
    animate();
}

// Social Sharing
function addSocialSharing(locationName) {
    const shareDiv = document.createElement('div');
    shareDiv.className = 'social-share';
    shareDiv.innerHTML = `
        <h3>Share this location</h3>
        <button onclick="shareOnTwitter('${locationName}')">Share on Twitter</button>
        <button onclick="shareOnFacebook('${locationName}')">Share on Facebook</button>
    `;
    document.querySelector('.location-info').appendChild(shareDiv);
}

window.shareOnTwitter = function(locationName) {
    const text = `Check out ${locationName} on ExploreLikeALocal!`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`);
};

window.shareOnFacebook = function(locationName) {
    const url = window.location.href;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`);
};

// Virtual Tour Guide
const socket = io();

function requestVirtualGuide(locationName) {
    socket.emit('requestGuide', locationName);
}

socket.on('guideResponse', (response) => {
    const guideDiv = document.createElement('div');
    guideDiv.className = 'virtual-guide';
    guideDiv.innerHTML = `
        <h3>Virtual Tour Guide</h3>
        <p>${response}</p>
        <button onclick="speakGuideText(this.previousElementSibling.textContent)">Listen</button>
    `;
    document.querySelector('.location-info').appendChild(guideDiv);
});

function speakGuideText(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
}

// Function to search for location
function searchLocation() {
    let location = document.getElementById("locationInput").value;
    if (!location) {
        alert("Please enter a location");
        return;
    }

    let apiUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${location}`;

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            if (data.length === 0) {
                alert("Location not found");
                return;
            }

            let lat = parseFloat(data[0].lat);
            let lon = parseFloat(data[0].lon);
            
            map.setView([lat, lon], 12);

            L.marker([lat, lon]).addTo(map)
                .bindPopup(`<b>${location}</b>`)
                .openPopup();

            Object.keys(categories).forEach(category => {
                if (document.getElementById(category).checked) {
                    findPlaces(lat, lon, category);
                } else {
                    document.getElementById(category + "Results").querySelector("ul").innerHTML = "";
                }
            });
        })
        .catch(error => console.error("Error fetching location:", error));
}

// Function to find places from Overpass API
function findPlaces(lat, lon, category) {
    let { type, radius, limit } = categories[category];
    
    let query;
    if (category === 'parks') {
        query = `
            [out:json];
            (
                // Regular parks
                node["leisure"="park"](around:${radius}, ${lat}, ${lon});
                way["leisure"="park"](around:${radius}, ${lat}, ${lon});
                
                // Gardens
                node["leisure"="garden"](around:${radius}, ${lat}, ${lon});
                way["leisure"="garden"](around:${radius}, ${lat}, ${lon});
                
                // Urban green spaces
                node["landuse"="recreation_ground"](around:${radius}, ${lat}, ${lon});
                way["landuse"="recreation_ground"](around:${radius}, ${lat}, ${lon});
                
                // Playgrounds
                node["leisure"="playground"](around:${radius}, ${lat}, ${lon});
                way["leisure"="playground"](around:${radius}, ${lat}, ${lon});
                
                // Dog parks
                node["leisure"="dog_park"](around:${radius}, ${lat}, ${lon});
                way["leisure"="dog_park"](around:${radius}, ${lat}, ${lon});
                
                // Nature reserves and protected areas
                node["leisure"="nature_reserve"](around:${radius}, ${lat}, ${lon});
                way["leisure"="nature_reserve"](around:${radius}, ${lat}, ${lon});
                
                // City parks
                node["leisure"="city_park"](around:${radius}, ${lat}, ${lon});
                way["leisure"="city_park"](around:${radius}, ${lat}, ${lon});
            );
            out center;
        `;
    } else if (category === 'touristAttractions') {
        // Keep the existing tourist attractions query
        query = `
            [out:json];
            (
                // Museums
                node["tourism"="museum"](around:${radius}, ${lat}, ${lon});
                way["tourism"="museum"](around:${radius}, ${lat}, ${lon});
                
                // Beaches
                node["natural"="beach"](around:${radius}, ${lat}, ${lon});
                way["natural"="beach"](around:${radius}, ${lat}, ${lon});
                
                // Amusement Parks
                node["leisure"="amusement_park"](around:${radius}, ${lat}, ${lon});
                way["leisure"="amusement_park"](around:${radius}, ${lat}, ${lon});
                
                // National Parks and Forests
                node["leisure"="nature_reserve"](around:${radius}, ${lat}, ${lon});
                way["leisure"="nature_reserve"](around:${radius}, ${lat}, ${lon});
                node["boundary"="national_park"](around:${radius}, ${lat}, ${lon});
                way["boundary"="national_park"](around:${radius}, ${lat}, ${lon});
                
                // Waterfalls
                node["waterway"="waterfall"](around:${radius}, ${lat}, ${lon});
                
                // Resorts
                node["tourism"="resort"](around:${radius}, ${lat}, ${lon});
                way["tourism"="resort"](around:${radius}, ${lat}, ${lon});
                
                // Other tourist attractions
                node["tourism"="attraction"](around:${radius}, ${lat}, ${lon});
                way["tourism"="attraction"](around:${radius}, ${lat}, ${lon});
                node["tourism"="viewpoint"](around:${radius}, ${lat}, ${lon});
                node["historic"="monument"](around:${radius}, ${lat}, ${lon});
                node["historic"="castle"](around:${radius}, ${lat}, ${lon});
                node["historic"="ruins"](around:${radius}, ${lat}, ${lon});
            );
            out center;
        `;
    } else {
        query = `
            [out:json];
            (
              node["amenity"="${type}"](around:${radius}, ${lat}, ${lon});
            );
            out center;
        `;
    }

    let overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

    fetch(overpassUrl)
        .then(response => response.json())
        .then(data => {
            let places = data.elements;

            // Sort places by distance
            places.sort((a, b) => getDistance(lat, lon, a.lat, a.lon) - getDistance(lat, lon, b.lat, b.lon));
            places = places.slice(0, limit);

            let listContainer = document.getElementById(category + "Results").querySelector("ul");
            listContainer.innerHTML = "";

            places.forEach(place => {
                let placeName = place.tags.name || "Unnamed Park";
                let placeLat = place.center ? place.center.lat : place.lat;
                let placeLon = place.center ? place.center.lon : place.lon;
                let placeType = "";
                
                // Determine the type of park/space
                if (place.tags.leisure === "park") placeType = "Park";
                else if (place.tags.leisure === "garden") placeType = "Garden";
                else if (place.tags.leisure === "playground") placeType = "Playground";
                else if (place.tags.leisure === "dog_park") placeType = "Dog Park";
                else if (place.tags.leisure === "nature_reserve") placeType = "Nature Reserve";
                else if (place.tags.landuse === "recreation_ground") placeType = "Recreation Ground";
                else placeType = "Green Space";

                let listItem = document.createElement("li");
                listItem.style.display = "flex";
                listItem.style.justifyContent = "space-between";
                listItem.style.alignItems = "center";
                listItem.style.padding = "8px";
                listItem.style.cursor = "pointer";
                listItem.style.borderBottom = "1px solid #eee";
                listItem.style.margin = "5px 0";

                let nameSpan = document.createElement("span");
                nameSpan.innerHTML = `${placeName} <small>(${placeType})</small><br>${getDistance(lat, lon, placeLat, placeLon).toFixed(2)} km`;
                
                let navButton = document.createElement("button");
                navButton.innerHTML = '<i class="fas fa-directions"></i>';
                navButton.style.marginLeft = "10px";
                navButton.style.border = "2px solid #4CAF50";
                navButton.style.backgroundColor = "white";
                navButton.style.color = "#4CAF50";
                navButton.style.padding = "5px 10px";
                navButton.style.borderRadius = "4px";
                navButton.style.cursor = "pointer";
                navButton.style.transition = "all 0.3s";

                navButton.onmouseover = () => {
                    navButton.style.backgroundColor = "#4CAF50";
                    navButton.style.color = "white";
                };
                navButton.onmouseout = () => {
                    navButton.style.backgroundColor = "white";
                    navButton.style.color = "#4CAF50";
                };

                navButton.onclick = (event) => {
                    event.stopPropagation();
                    window.open(`https://www.google.com/maps/dir/${lat},${lon}/${placeLat},${placeLon}`, "_blank");
                };

                listItem.onclick = () => {
                    map.setView([placeLat, placeLon], 16);
                    // Add a marker for the selected park
                    L.marker([placeLat, placeLon])
                        .addTo(map)
                        .bindPopup(`<b>${placeName}</b><br>${placeType}`);
                };

                listItem.appendChild(nameSpan);
                listItem.appendChild(navButton);
                listContainer.appendChild(listItem);
            });
        })
        .catch(error => console.error("Error fetching places:", error));
}

// Distance calculation (Haversine formula)
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
// Modify the fetchLocations function to store the first tourist location name
async function fetchLocations(category, userLocation) {
    const { latitude, longitude } = userLocation;
    const radius = 1000000; // 50 km in meters
    let osmTag;

    // Use a switch case to assign the correct OSM tag based on category
    switch (category) {
        case "Zoo":
            osmTag = "zoo";
            break;
        case "Temple":
            osmTag = "place_of_worship";
            break;
        case "Museum":
            osmTag = "museum";
            break;
        case "Park":
            osmTag = "park";
            break;
        case "Viewpoint":
            osmTag = "viewpoint";
            break;
        case "Beach":
            osmTag = "beach";
            break;
        case "Restaurant":
            osmTag = "restaurant";
            break;
        default:
            console.error("Unknown category: " + category);
            return;
    }

    console.log(`Fetching locations for category: ${category}, within a ${radius / 1000} km radius`);

    // Create the Overpass API query URL for the given category and radius
    const overpassQuery = `
    [out:json];
    (
        node["${osmTag}"](around:${radius},${latitude},${longitude});
    );
    out body;
    `;

    try {
        // Make the Overpass API request
        console.log("Sending request to Overpass API...");
        const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`);
        const data = await response.json();

        if (data.elements && data.elements.length > 0) {
            console.log(`Found ${data.elements.length} locations.`);

            // Store the name of the first tourist location
            firstLocationName = data.elements[0].tags.name || "Unnamed Location";  // Default if name is missing

            // Iterate over each element and place markers or polygons
            data.elements.forEach(element => {
                if (element.type === 'node') {
                    L.marker([element.lat, element.lon])
                        .addTo(map)
                        .bindPopup(`<b>${category}</b>`);
                    console.log(`Added marker for node at Latitude: ${element.lat}, Longitude: ${element.lon}`);
                } else if (element.type === 'way' || element.type === 'relation') {
                    let coords = [];
                    if (element.type === 'way') {
                        element.geometry.forEach(geo => coords.push([geo.lat, geo.lon]));
                    }
                    if (coords.length) {
                        L.polygon(coords).addTo(map).bindPopup(`<b>${category}</b>`);
                        console.log("Added polygon for way/relation.");
                    }
                }
            });

            // Add new features after locations are fetched
            addWeatherInfo(userLocation.latitude, userLocation.longitude);
            add3DPreview(userLocation.latitude, userLocation.longitude);
            
            if (firstLocationName) {
                addSocialSharing(firstLocationName);
                requestVirtualGuide(firstLocationName);
            }
        } else {
            console.log("No relevant locations found within the specified range.");
        }
    } catch (error) {
        console.error('Error fetching Overpass data:', error);
    }
}

// Function to handle "Generate" button click and send POST request
document.getElementById("generate").addEventListener("click", async () => {
    if (firstLocationName) {
        try {
            const response = await fetch('/map/gen', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ locationName: firstLocationName }),
            });

            if (response.ok) {
                console.log("Location name sent to server:", firstLocationName);
            } else {
                console.error("Failed to send location name to server");
            }
        } catch (error) {
            console.error("Error sending location name:", error);
        }
    } else {
        console.error("No tourist location found to send");
    }
});

// Main function to execute everything
async function initMap() {
    try {
        const userLocation = await getUserLocation();
        
        // Center the map to the user's current location
        map.setView([userLocation.latitude, userLocation.longitude], 13);

        // Fetch locations based on the user's location
        fetchLocations(category, userLocation);
    } catch (error) {
        console.error(error);
    }
}

// Initialize map and fetch locations
initMap();