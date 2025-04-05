// Constants and global variables
let SEARCH_RADIUS = 5; // Search radius in kilometers
let userLocation = {lat: 12.9782, lng: 77.5744}; // Default to Bengaluru Majestic
let userMarker = null;
let resultMarkers = [];
let radiusCircle = null;
let selectedCategory = null;
let searchedLocation = null; // New variable to store searched location
let isSearchNearLocationActive = false; // Flag for search near location mode

// OSM feature tags for different categories with tourist-friendly names
const featureOsmTags = {
    "park": {
        tags: ["leisure=park", "leisure=garden", "landuse=recreation_ground", 
              "leisure=playground", "leisure=dog_park", "leisure=nature_reserve"],
        radius: 10000,
        limit: 10,
        displayName: "Parks & Gardens"
    },
    "zoo": {
        tags: ["tourism=zoo"],
        radius: 50000,
        limit: 5,
        displayName: "Wildlife Attractions"
    },
    "place_of_worship": {
        tags: ["amenity=place_of_worship"],
        radius: 10000,
        limit: 10,
        displayName: "Temples & Shrines"
    },
    "museum": {
        tags: ["tourism=museum"],
        radius: 50000,
        limit: 10,
        displayName: "Museums & Culture"
    },
    "viewpoint": {
        tags: ["tourism=viewpoint"],
        radius: 50000,
        limit: 10,
        displayName: "Scenic Views"
    },
    "beach": {
        tags: ["natural=beach"],
        radius: 50000,
        limit: 10,
        displayName: "Beaches"
    },
    "restaurant": {
        tags: ["amenity=restaurant"],
        radius: 5000,
        limit: 15,
        displayName: "Local Cuisine"
    }
};

// Initialize the map with default Bengaluru coordinates
const map = L.map('map').setView([12.9716, 77.5946], 13);

// Custom marker icon for attractions
const attractionIcon = L.icon({
    iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Custom marker icon for user location
const userIcon = L.icon({
    iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Custom marker icon for searched location
const searchedLocationIcon = L.icon({
    iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Add OpenStreetMap tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Function to calculate distance between two points using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const d = R * c; // Distance in km
    return d;
}

function deg2rad(deg) {
    return deg * (Math.PI/180);
}

// Function to get user's location
function getUserLocation() {
    // Add default user marker initially
    userMarker = L.marker([userLocation.lat, userLocation.lng], {icon: userIcon})
        .addTo(map)
        .bindPopup("Default location: Bengaluru Majestic")
        .openPopup();
    
    // Add radius circle
    radiusCircle = L.circle([userLocation.lat, userLocation.lng], {
        radius: SEARCH_RADIUS * 1000, // Convert km to meters
        className: 'radius-circle'
    }).addTo(map);
    
    // Set view to show the entire radius
    map.setView([userLocation.lat, userLocation.lng], 12);
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                // Update marker for user's location
                if (userMarker) {
                    map.removeLayer(userMarker);
                }
                
                userMarker = L.marker([userLocation.lat, userLocation.lng], {icon: userIcon})
                    .addTo(map)
                    .bindPopup("You are here")
                    .openPopup();
                
                // Update radius circle
                updateRadiusCircle();
                
                // Center map to show the entire radius
                map.setView([userLocation.lat, userLocation.lng], 12);
            },
            (error) => {
                console.log("Using default location due to error:", error.code, error.message);
                // Keep using the default Bengaluru location
                // We already have a default marker set
            },
            { 
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );
    } else {
        console.log("Geolocation not supported, using default location");
        // Keep using the default Bengaluru location
        // We already have a default marker set
    }
}

// Function to update radius circle based on a center location
function updateRadiusCircle(center = null) {
    if (radiusCircle) {
        map.removeLayer(radiusCircle);
    }
    
    const centerLocation = center || userLocation;
    
    radiusCircle = L.circle([centerLocation.lat, centerLocation.lng], {
        radius: SEARCH_RADIUS * 1000, // Convert km to meters
        className: 'radius-circle'
    }).addTo(map);
    
    document.getElementById('radius-display').textContent = SEARCH_RADIUS;
}

// Function to search for locations
async function searchLocation(query) {
    clearResults();

    const baseUrl = "https://nominatim.openstreetmap.org/search";
    let params = new URLSearchParams({
        q: query,
        format: "json",
        limit: 1, // Just get the first result since we're searching for a specific location
        addressdetails: 1
    });
    
    if (query.toLowerCase().includes("bengaluru") || query.toLowerCase().includes("bangalore")) {
        // If query already contains Bengaluru, don't modify it
    } else {
        // Add Bengaluru to the query for better results
        params = new URLSearchParams({
            q: query + " Bengaluru",
            format: "json",
            limit: 1,
            addressdetails: 1
        });
    }
    
    try {
        const response = await fetch(`${baseUrl}?${params.toString()}`);
        const data = await response.json();
        
        if (data && data.length > 0) {
            const location = data[0];
            searchedLocation = {
                lat: parseFloat(location.lat),
                lng: parseFloat(location.lon),
                name: location.display_name
            };
            
            // Add marker for searched location
            const marker = L.marker([searchedLocation.lat, searchedLocation.lng], {icon: searchedLocationIcon}).addTo(map);
            resultMarkers.push(marker);
            
            // Create a popup for the marker
            const popupContent = `
                <strong>${location.display_name.split(',')[0]}</strong><br>
                <span>${location.display_name}</span>
            `;
            marker.bindPopup(popupContent).openPopup();
            
            // Center map on the location
            map.setView([searchedLocation.lat, searchedLocation.lng], 15);
            
            return searchedLocation;
        } else {
            alert("Location not found. Please try a different search term.");
            return null;
        }
    } catch (error) {
        console.error("Error searching location:", error);
        alert("An error occurred while searching. Please try again.");
        return null;
    }
}

// Function to search for places using Overpass API
async function searchPlaces(query, category = null, isNearMe = false) {
    clearResults();
    
    // If a category is selected, use that for more specific search
    if (category) {
        await searchByCategory(category);
        return;
    }
    
    // Otherwise use Nominatim for general text search
    const baseUrl = "https://nominatim.openstreetmap.org/search";
    let params = new URLSearchParams({
        q: query,
        format: "json",
        limit: 20, // Request more results to filter by distance later
        addressdetails: 1
    });
    
    if (isNearMe) {
        params.append("lat", userLocation.lat);
        params.append("lon", userLocation.lng);
    } else if (query.toLowerCase().includes("bengaluru") || query.toLowerCase().includes("bangalore")) {
        // If query already contains Bengaluru, don't modify it
    } else {
        // Add Bengaluru to the query for better results
        params = new URLSearchParams({
            q: query + " Bengaluru",
            format: "json",
            limit: 20, // Request more results to filter by distance later
            addressdetails: 1
        });
    }
    
    try {
        const response = await fetch(`${baseUrl}?${params.toString()}`);
        const data = await response.json();
        
        if (data && data.length > 0) {
            // Calculate distance for all results
            data.forEach(place => {
                const distance = calculateDistance(
                    userLocation.lat, userLocation.lng,
                    parseFloat(place.lat), parseFloat(place.lon)
                );
                place.distance = distance; // Add distance to each place
            });
            
            let resultsToDisplay;
            
            // Only filter by distance for "near me" searches
            if (isNearMe) {
                // Filter results to only include places within SEARCH_RADIUS km
                resultsToDisplay = data.filter(place => place.distance <= SEARCH_RADIUS);
                
                // Sort by distance
                resultsToDisplay.sort((a, b) => a.distance - b.distance);
                
                // Take only top 10 results
                resultsToDisplay = resultsToDisplay.slice(0, 10);
            } else {
                // For direct searches, don't filter by distance, just sort and limit
                resultsToDisplay = [...data];
                resultsToDisplay.sort((a, b) => a.distance - b.distance);
                resultsToDisplay = resultsToDisplay.slice(0, 10);
            }
            
            if (resultsToDisplay.length > 0) {
                displayResults(resultsToDisplay);
            } else {
                showNoResults();
            }
        } else {
            showNoResults();
        }
    } catch (error) {
        console.error("Error searching places:", error);
        alert("An error occurred while searching. Please try again.");
    }
}

// Function to search by specific category using Overpass API with a custom center point
async function searchByCategory(category, customCenter = null) {
    if (!featureOsmTags[category]) {
        console.error("Unknown category:", category);
        return;
    }
    
    const { tags, radius, limit, displayName } = featureOsmTags[category];
    SEARCH_RADIUS = radius / 1000; // Convert meters to kilometers
    
    // Use custom center if provided, otherwise use user location
    const centerPoint = customCenter || userLocation;
    
    // Update radius circle to show around the center point
    updateRadiusCircle(centerPoint);
    
    // Update results panel title to match category
    const resultsHeader = document.querySelector('.results-header h3');
    if (resultsHeader) {
        if (customCenter) {
            resultsHeader.textContent = `${displayName} Near ${customCenter.name.split(',')[0]}`;
        } else {
            resultsHeader.textContent = `${displayName} Near You`;
        }
    }
    
    // Build Overpass query
    let tagQueries = [];
    
    tags.forEach(tag => {
        const [key, value] = tag.split('=');
        tagQueries.push(`node["${key}"="${value}"](around:${radius},${centerPoint.lat},${centerPoint.lng});`);
        tagQueries.push(`way["${key}"="${value}"](around:${radius},${centerPoint.lat},${centerPoint.lng});`);
    });
    
    const overpassQuery = `
        [out:json];
        (
            ${tagQueries.join('\n')}
        );
        out center;
    `;
    
    const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;
    
    try {
        const response = await fetch(overpassUrl);
        const data = await response.json();
        
        if (data && data.elements && data.elements.length > 0) {
            console.log(`Found ${data.elements.length} places for category ${category}`);
            
            // Process results
            const places = data.elements.map(element => {
                // Get coordinates based on element type
                let lat, lon;
                if (element.type === 'node') {
                    lat = element.lat;
                    lon = element.lon;
                } else if (element.center) {
                    lat = element.center.lat;
                    lon = element.center.lon;
                }
                
                const distance = calculateDistance(
                    centerPoint.lat, centerPoint.lng,
                    lat, lon
                );
                
                // Get place type
                let placeType = category.charAt(0).toUpperCase() + category.slice(1);
                if (category === 'park') {
                    if (element.tags.leisure === 'garden') placeType = 'Garden';
                    else if (element.tags.leisure === 'playground') placeType = 'Playground';
                    else if (element.tags.leisure === 'dog_park') placeType = 'Dog Park';
                    else if (element.tags.leisure === 'nature_reserve') placeType = 'Nature Reserve';
                    else placeType = 'Park';
                } else if (category === 'place_of_worship') {
                    placeType = 'Temple';
                    if (element.tags.religion) {
                        if (element.tags.religion === 'christian') placeType = 'Church';
                        else if (element.tags.religion === 'muslim') placeType = 'Mosque';
                        else if (element.tags.religion === 'hindu') placeType = 'Temple';
                        else if (element.tags.religion === 'buddhist') placeType = 'Buddhist Temple';
                        else if (element.tags.religion === 'jain') placeType = 'Jain Temple';
                        else placeType = element.tags.religion.charAt(0).toUpperCase() + element.tags.religion.slice(1) + ' Place of Worship';
                    }
                } else if (category === 'restaurant') {
                    placeType = 'Restaurant';
                    if (element.tags.cuisine) {
                        placeType = element.tags.cuisine.charAt(0).toUpperCase() + element.tags.cuisine.slice(1) + ' Restaurant';
                    }
                } else if (category === 'viewpoint') {
                    placeType = 'Scenic Viewpoint';
                } else if (category === 'museum') {
                    placeType = 'Museum';
                } else if (category === 'zoo') {
                    placeType = 'Zoo & Wildlife';
                } else if (category === 'beach') {
                    placeType = 'Beach';
                }
                
                return {
                    name: element.tags.name || `Unnamed ${placeType}`,
                    lat: lat,
                    lon: lon,
                    type: placeType,
                    tags: element.tags,
                    distance: distance
                };
            });
            
            // Filter out places with no coordinates
            const validPlaces = places.filter(place => place.lat && place.lon);
            
            // Sort by distance
            validPlaces.sort((a, b) => a.distance - b.distance);
            
            // Take only top results
            const topResults = validPlaces.slice(0, limit);
            
            if (topResults.length > 0) {
                displayCategoryResults(topResults, customCenter);
            } else {
                showNoResults();
            }
        } else {
            showNoResults();
        }
    } catch (error) {
        console.error("Error fetching places from Overpass API:", error);
        alert("An error occurred while searching. Please try again.");
    }
}

// Function to clear all result markers from the map
function clearResults() {
    // Clear all result markers
    resultMarkers.forEach(marker => {
        if (map.hasLayer(marker)) {
            map.removeLayer(marker);
        }
    });
    resultMarkers = [];
    
    // Hide results panel
    document.getElementById('results-panel').style.display = 'none';
}

// Function to show "No results found" message
function showNoResults() {
    const resultsPanel = document.getElementById('results-panel');
    const resultsList = document.getElementById('results-list');
    resultsList.innerHTML = '<div class="no-results">No results found. Try a different search or location.</div>';
    resultsPanel.style.display = 'block';
}

// Function to search near a location
function searchNearLocation(location) {
    // Geocode the location and search for attractions nearby
    console.log(`Searching for places near: ${location}`);
    
    // First, geocode the location
    searchLocation(location).then(geocodedLocation => {
        if (geocodedLocation) {
            // If we have a category selected, search for that category near the location
            if (selectedCategory) {
                searchByCategory(selectedCategory, geocodedLocation);
            } else {
                // Otherwise, just show the location on the map
                alert(`Location found: ${geocodedLocation.name}. Select a category to see attractions nearby.`);
            }
        }
    });
}

// Function to perform regular search
function performRegularSearch(query) {
    // Perform a regular search based on the query
    console.log(`Searching for: ${query}`);
    searchPlaces(query, selectedCategory, false);
}

// Function to display general search results
function displayResults(places) {
    const resultsPanel = document.getElementById('results-panel');
    const resultsList = document.getElementById('results-list');
    
    resultsList.innerHTML = '';
    
    places.forEach(place => {
        const lat = parseFloat(place.lat);
        const lon = parseFloat(place.lon);
        
        // Create marker for each place but don't add to map yet
        const marker = L.marker([lat, lon], {icon: attractionIcon});
        resultMarkers.push(marker);
        
        // Create popup for marker
        const popupContent = `
            <strong>${place.display_name.split(',')[0]}</strong><br>
            <span>${place.display_name}</span><br>
            <span>${place.distance.toFixed(1)} km away</span>
        `;
        marker.bindPopup(popupContent);
        
        // Create result item in panel
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';
        
        // Get place type from OSM class/type
        let placeType = 'Place';
        if (place.class === 'tourism') {
            placeType = place.type.charAt(0).toUpperCase() + place.type.slice(1);
        } else if (place.class === 'amenity') {
            placeType = place.type.charAt(0).toUpperCase() + place.type.slice(1);
        } else if (place.class === 'leisure') {
            placeType = place.type.charAt(0).toUpperCase() + place.type.slice(1);
        } else {
            placeType = place.class.charAt(0).toUpperCase() + place.class.slice(1);
        }
        
        resultItem.innerHTML = `
            <div class="result-name">${place.display_name.split(',')[0]}</div>
            <div class="result-type">${placeType}</div>
            <div class="result-address">${place.display_name}</div>
            <div class="distance">${place.distance.toFixed(1)} km away</div>
            <div class="result-actions">
                <label class="pin-marker">
                    <input type="checkbox" class="pin-checkbox"> Pin marker
                </label>
                <button class="directions-btn">Get Directions</button>
            </div>
        `;
        
        // Add hover events to show/hide marker
        resultItem.addEventListener('mouseenter', function() {
            // Only add marker if it's not already on the map
            if (!map.hasLayer(marker)) {
                marker.addTo(map);
                marker.openPopup();
            }
        });
        
        resultItem.addEventListener('mouseleave', function() {
            // Only remove marker if it's not pinned
            const checkbox = this.querySelector('.pin-checkbox');
            if (!checkbox.checked && map.hasLayer(marker)) {
                marker.closePopup();
                map.removeLayer(marker);
            }
        });
        
        // Add click event to result item to center map
        resultItem.addEventListener('click', function(e) {
            // Don't trigger if clicking on checkbox or button
            if (e.target.type !== 'checkbox' && !e.target.closest('button')) {
                map.setView([lat, lon], 16);
                if (!map.hasLayer(marker)) {
                    marker.addTo(map);
                }
                marker.openPopup();
            }
        });
        
        // Add change event to pin checkbox
        const pinCheckbox = resultItem.querySelector('.pin-checkbox');
        pinCheckbox.addEventListener('change', function() {
            if (this.checked) {
                // Add marker to map if it's not already there
                if (!map.hasLayer(marker)) {
                    marker.addTo(map);
                }
            } else {
                // Remove marker from map when unpinned
                if (map.hasLayer(marker)) {
                    marker.closePopup();
                    map.removeLayer(marker);
                }
            }
        });
        
        // Add click event to directions button
        const directionsBtn = resultItem.querySelector('.directions-btn');
        directionsBtn.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent triggering the parent click event
            
            // Open Google Maps directions in new tab
            const url = `https://www.google.com/maps/dir/${userLocation.lat},${userLocation.lng}/${lat},${lon}`;
            window.open(url, '_blank');
        });
        
        resultsList.appendChild(resultItem);
    });
    
    // Show results panel
    resultsPanel.style.display = 'block';
    
    // Fit map to show all markers
    if (places.length > 0) {
        const bounds = L.latLngBounds(places.map(place => [parseFloat(place.lat), parseFloat(place.lon)]));
        
        // Add user location to bounds
        if (userMarker) {
            bounds.extend([userLocation.lat, userLocation.lng]);
        }
        
        map.fitBounds(bounds, { padding: [50, 50] });
    }
}

// Function to display category search results
function displayCategoryResults(places, customCenter = null) {
    const resultsPanel = document.getElementById('results-panel');
    const resultsList = document.getElementById('results-list');
    
    resultsList.innerHTML = '';
    
    places.forEach(place => {
        // Create marker for each place but don't add to map yet
        const marker = L.marker([place.lat, place.lon], {icon: attractionIcon});
        resultMarkers.push(marker);
        
        // Create popup for marker
        const popupContent = `
            <strong>${place.name}</strong><br>
            <span>${place.type}</span><br>
            <span>${place.distance.toFixed(1)} km away</span>
        `;
        marker.bindPopup(popupContent);
        
        // Create result item in panel
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';
        
        // Format opening hours if available
        let hoursText = '';
        if (place.tags.opening_hours) {
            hoursText = `<div class="result-hours">Hours: ${place.tags.opening_hours}</div>`;
        }
        
        // Format phone if available
        let phoneText = '';
        if (place.tags.phone) {
            phoneText = `<div class="result-phone">Phone: ${place.tags.phone}</div>`;
        }
        
        resultItem.innerHTML = `
            <div class="result-name">${place.name}</div>
            <div class="result-type">${place.type}</div>
            ${hoursText}
            ${phoneText}
            <div class="distance">${place.distance.toFixed(1)} km away</div>
            <div class="result-actions">
                <label class="pin-marker">
                    <input type="checkbox" class="pin-checkbox"> Pin marker
                </label>
                <button class="directions-btn">Get Directions</button>
            </div>
        `;
        
        // Add hover events to show/hide marker
        resultItem.addEventListener('mouseenter', function() {
            // Only add marker if it's not already on the map
            if (!map.hasLayer(marker)) {
                marker.addTo(map);
                marker.openPopup();
            }
        });
        
        resultItem.addEventListener('mouseleave', function() {
            // Only remove marker if it's not pinned
            const checkbox = this.querySelector('.pin-checkbox');
            if (!checkbox.checked && map.hasLayer(marker)) {
                marker.closePopup();
                map.removeLayer(marker);
            }
        });
        
        // Add click event to result item to center map
        resultItem.addEventListener('click', function(e) {
            // Don't trigger if clicking on checkbox or button
            if (e.target.type !== 'checkbox' && !e.target.closest('button')) {
                map.setView([place.lat, place.lon], 16);
                if (!map.hasLayer(marker)) {
                    marker.addTo(map);
                }
                marker.openPopup();
            }
        });
        
        // Add change event to pin checkbox
        const pinCheckbox = resultItem.querySelector('.pin-checkbox');
        pinCheckbox.addEventListener('change', function() {
            if (this.checked) {
                // Add marker to map if it's not already there
                if (!map.hasLayer(marker)) {
                    marker.addTo(map);
                }
            } else {
                // Remove marker from map when unpinned
                if (map.hasLayer(marker)) {
                    marker.closePopup();
                    map.removeLayer(marker);
                }
            }
        });
        
        // Add click event to directions button
        const directionsBtn = resultItem.querySelector('.directions-btn');
        directionsBtn.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent triggering the parent click event
            
            // Open Google Maps directions in new tab
            const startPoint = customCenter ? 
                `${customCenter.lat},${customCenter.lng}` : 
                `${userLocation.lat},${userLocation.lng}`;
            
            const url = `https://www.google.com/maps/dir/${startPoint}/${place.lat},${place.lon}`;
            window.open(url, '_blank');
        });
        
        resultsList.appendChild(resultItem);
    });
    
    // Show results panel
    resultsPanel.style.display = 'block';
    
    // Fit map to show all markers
    if (places.length > 0) {
        const bounds = L.latLngBounds(places.map(place => [place.lat, place.lon]));
        
        // Add user location or custom center to bounds
        if (customCenter) {
            bounds.extend([customCenter.lat, customCenter.lng]);
        } else if (userMarker) {
            bounds.extend([userLocation.lat, userLocation.lng]);
        }
        
        map.fitBounds(bounds, { padding: [50, 50] });
    }
}

// Initialize the map and set up event listeners when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the map
    getUserLocation();
    
    // Set up event listeners for search functionality
    const searchBtn = document.getElementById('search-btn');
    const searchInput = document.getElementById('search-input');
    const nearMeBtn = document.getElementById('near-me-btn');
    const categoryButtons = document.querySelectorAll('.category-button');
    const closeResultsBtn = document.getElementById('close-results');
    const searchNearLocationBtn = document.getElementById('search-near-location-btn');
    
    // Search button click event
    searchBtn.addEventListener('click', function() {
        const query = searchInput.value.trim();
        
        if (query === '') {
            alert('Please enter a search term');
            return;
        }
        
        if (isSearchNearLocationActive) {
            // Search for places near the location entered in the search box
            searchNearLocation(query);
        } else {
            // Regular search functionality
            performRegularSearch(query);
        }
    });
    
    // Search near location button functionality
    searchNearLocationBtn.addEventListener('click', function() {
        isSearchNearLocationActive = !isSearchNearLocationActive;
        
        if (isSearchNearLocationActive) {
            searchNearLocationBtn.classList.add('active');
            console.log('Search near location mode activated');
        } else {
            searchNearLocationBtn.classList.remove('active');
            console.log('Search near location mode deactivated');
        }
    });
    
    // Enter key in search input
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const query = searchInput.value.trim();
            
            if (query === '') {
                alert('Please enter a search term');
                return;
            }
            
            if (isSearchNearLocationActive) {
                searchNearLocation(query);
            } else {
                performRegularSearch(query);
            }
        }
    });
    // Near Me button click event
    nearMeBtn.addEventListener('click', function() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    userLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    
                    // Update marker for user's location
                    if (userMarker) {
                        map.removeLayer(userMarker);
                    }
                    
                    userMarker = L.marker([userLocation.lat, userLocation.lng], {icon: userIcon})
                        .addTo(map)
                        .bindPopup("You are here")
                        .openPopup();
                    
                    // Update radius circle
                    updateRadiusCircle();
                    
                    // Center map to show the entire radius
                    map.setView([userLocation.lat, userLocation.lng], 13);
                    
                    // If a category is selected, search for that category near the user
                    if (selectedCategory) {
                        searchByCategory(selectedCategory);
                    } else {
                        // Otherwise, search for nearby attractions
                        searchPlaces("attractions", null, true);
                    }
                },
                (error) => {
                    console.error("Error getting location:", error);
                    alert("Unable to get your location. Please check your browser settings.");
                }
            );
        } else {
            alert("Geolocation is not supported by your browser");
        }
    });
    
    // Category button click events
    categoryButtons.forEach(button => {
        button.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            
            // Toggle active state for this button
            this.classList.toggle('active');
            
            // If button is now active, set as selected category
            if (this.classList.contains('active')) {
                selectedCategory = category;
                
                // Deactivate other category buttons
                categoryButtons.forEach(otherButton => {
                    if (otherButton !== this) {
                        otherButton.classList.remove('active');
                    }
                });
                
                // If search near location is active and we have a searched location
                if (isSearchNearLocationActive && searchedLocation) {
                    searchByCategory(category, searchedLocation);
                } else {
                    // Otherwise search near user location
                    searchByCategory(category);
                }
            } else {
                // If button is now inactive, clear selected category
                selectedCategory = null;
                
                // Clear results if any
                clearResults();
            }
        });
    });
    
    // Close results panel button
    if (closeResultsBtn) {
        closeResultsBtn.addEventListener('click', function() {
            clearResults();
        });
    }
    
    // Radius slider functionality
    const radiusSlider = document.getElementById('radius-slider');
    if (radiusSlider) {
        radiusSlider.addEventListener('input', function() {
            SEARCH_RADIUS = parseInt(this.value);
            updateRadiusCircle();
            
            // If a category is selected, update the search with new radius
            if (selectedCategory) {
                if (isSearchNearLocationActive && searchedLocation) {
                    searchByCategory(selectedCategory, searchedLocation);
                } else {
                    searchByCategory(selectedCategory);
                }
            }
        });
    }
    
    // Add click event to map for mobile-friendly location selection
            map.on('click', function(e) {
                // Only use map clicks for location if in search-near-location mode
                if (isSearchNearLocationActive) {
                    const clickedLocation = {
                        lat: e.latlng.lat,
                        lng: e.latlng.lng,
                        name: "Selected Location"
                    };
                    
                    // Clear previous results
                    clearResults();
                    
                    // Add marker for clicked location
                    const marker = L.marker([clickedLocation.lat, clickedLocation.lng], {icon: searchedLocationIcon}).addTo(map);
                    resultMarkers.push(marker);
                    
                    // Create a popup for the marker
                    const popupContent = `
                        <strong>Selected Location</strong><br>
                        <span>Latitude: ${clickedLocation.lat.toFixed(6)}, Longitude: ${clickedLocation.lng.toFixed(6)}</span>
                    `;
                    marker.bindPopup(popupContent).openPopup();
                    
                    // Store as searched location
                    searchedLocation = clickedLocation;
                    
                    // If a category is selected, search for that category near the clicked location
                    if (selectedCategory) {
                        searchByCategory(selectedCategory, clickedLocation);
                    }
                }
            });
        });