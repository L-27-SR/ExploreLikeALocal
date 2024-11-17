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
    // Add more categories as needed
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
