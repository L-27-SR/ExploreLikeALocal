document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('place-search');
    const searchButton = document.getElementById('search-button');
    const loadingIndicator = document.getElementById('loading-indicator');
    const errorMessage = document.getElementById('error-message');
    const resultsContainer = document.getElementById('results-container');
    const originalPlaceContainer = document.getElementById('original-place');
    const similarPlacesGrid = document.getElementById('similar-places-grid');

    // Add event listener for search button
    searchButton.addEventListener('click', searchSimilarPlaces);
    
    // Add event listener for Enter key in search input
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchSimilarPlaces();
        }
    });

    // Function to search for similar places
    async function searchSimilarPlaces() {
        const place = searchInput.value.trim();
        console.log(place);
        
        if (!place) {
            showError('Please enter a place name');
            return;
        }
        
        // Show loading indicator
        loadingIndicator.style.display = 'block';
        errorMessage.style.display = 'none';
        resultsContainer.style.display = 'none';
        
        try {
            // Make API request to get similar places
            const response = await fetch(`/api/get_similar_places/${encodeURIComponent(place)}`, {
                method: 'POST'
            });
            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }
            
            const data = await response.json();
            console.log(data);
            // Hide loading indicator
            loadingIndicator.style.display = 'none';
            
            // Display results
            displayResults(data);
            
        } catch (error) {
            console.error('Error fetching similar places:', error);
            loadingIndicator.style.display = 'none';
            showError('Failed to find similar places. Please try again.');
        }
    }

    // Function to display error message
    function showError(message) {
        errorMessage.querySelector('p').textContent = message;
        errorMessage.style.display = 'block';
        loadingIndicator.style.display = 'none';
        resultsContainer.style.display = 'none';
    }

    // Function to display results
    function displayResults(data) {
        // Clear previous results
        originalPlaceContainer.innerHTML = '';
        similarPlacesGrid.innerHTML = '';
        
        // Display original place (first item in the array)
        const originalPlace = data.similar_places[0];
        if (!originalPlace) {
            showError('No similar places found');
            return; 
        }
        // Create HTML for original place
        originalPlaceContainer.innerHTML = `
            <div class="original-place-info">
               <h2>${originalPlace.name}</h2>
                <p>${originalPlace.description}</p>
                <div class="things-to-do">
                    <h4>Things to Do:</h4>
                    <p>${originalPlace.things_to_do || 'Information not available'}</p
                </div>
                <div class="keywords">
                    ${data.keywords ? data.keywords.map(keyword => `<span class="keyword">${keyword}</span>`).join('') : ''}
                </div>
            </div>
        `;
        
        // Display similar places (skip the first one if it's the original place)
        const similarPlaces = data.similar_places.slice(1);
        
        if (similarPlaces.length === 0) {
            similarPlacesGrid.innerHTML = '<p class="no-results">No similar places found</p>';
        } else {
            // Create HTML for each similar place
            similarPlaces.forEach(place => {
                const placeCard = document.createElement('div');
                placeCard.className = 'place-card';
                
                placeCard.innerHTML = `
                    <div class="place-card-content">
                        <h3>${place.name}</h3>
                        <p>${place.description}</p>
                        <div class="things-to-do">
                            <h4>Things to Do:</h4>
                            <p>${place.things_to_do || 'Information not available'}</p>
                        </div>
                    </div>
                `;
                
                similarPlacesGrid.appendChild(placeCard);
            });
        }
        
        // Show results container
        resultsContainer.style.display = 'block';
        
        // Scroll to results
        resultsContainer.scrollIntoView({ behavior: 'smooth' });
    }

    // Check if URL has a search parameter
    const urlParams = new URLSearchParams(window.location.search);
    const placeParam = urlParams.get('place');
    
    if (placeParam) {
        searchInput.value = placeParam;
        searchSimilarPlaces();
    }
});