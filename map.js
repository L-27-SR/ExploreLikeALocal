document.addEventListener("DOMContentLoaded", function () {
    // Create a map centered at a specific location
    var map = L.map('map').setView([51.505, -0.09], 13);  // Example: London coordinates

    // Add tile layer for the map background
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Add a marker
    var marker = L.marker([51.5, -0.09]).addTo(map)
        .openPopup();

    // Handle search functionality
    const searchInput = document.getElementById("searchInput");
    const searchBtn = document.getElementById("searchSubmitBtn");

    searchBtn.addEventListener("click", function () {
        const location = searchInput.value;
        geocodeLocation(location, map);
    });

    function geocodeLocation(location, map) {
        // You can use an API like Nominatim to geocode the location.
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${location}`)
            .then(response => response.json())
            .then(data => {
                if (data.length > 0) {
                    const lat = parseFloat(data[0].lat);
                    const lon = parseFloat(data[0].lon);
                    map.setView([lat, lon], 13);  // Move map to the searched location
                    L.marker([lat, lon]).addTo(map)
                        .bindPopup(`<b>${location}</b>`)
                        .openPopup();
                } else {
                    alert("Location not found!");
                }
            })
            .catch(error => {
                console.error("Error geocoding location:", error);
                alert("Failed to search location.");
            });
    }
});
