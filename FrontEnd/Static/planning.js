// Global destinations data
const destinations = {
    bali: {
        id: 'bali',
        name: 'Bali, Indonesia',
        activities: [
            'Beach Activities',
            'Temple Visits',
            'Rice Terrace Tours',
            'Spa & Wellness',
            'Water Sports',
            'Cultural Shows',
            'Cooking Classes',
            'Mountain Hiking'
        ]
    },
    paris: {
        id: 'paris',
        name: 'Paris, France',
        activities: [
            'Museum Tours',
            'Food Tasting',
            'City Walks',
            'River Cruise',
            'Shopping',
            'Historical Sites',
            'Wine Tasting',
            'Art Galleries'
        ]
    },
    tokyo: {
        id: 'tokyo',
        name: 'Tokyo, Japan',
        activities: [
            'Temple Visits',
            'Food Tours',
            'Shopping',
            'Garden Visits',
            'Technology Museums',
            'Cultural Experiences',
            'Night Tours',
            'Tea Ceremonies'
        ]
    }
};

// Global utility functions
function updateActivities(destinationId) {
    const activitiesContainer = document.getElementById('activitiesContainer');
    const selectedDestination = destinations[destinationId];
    
    if (!selectedDestination) {
        activitiesContainer.innerHTML = '<p>Please select a destination first</p>';
        return;
    }
    
    activitiesContainer.innerHTML = selectedDestination.activities.map(activity => `
        <label class="activity-checkbox">
            <input type="checkbox" name="activities" value="${activity}">
            <span>${activity}</span>
        </label>
    `).join('');
}

async function generateItineraryWithGemini(destinationId, numDays, selectedActivities) {
    const destination = destinations[destinationId];
    const prompt = `Create a ${numDays}-day vacation itinerary for ${destination.name}. 
        The selected activities are: ${selectedActivities.join(', ')}. 
        Structure the response as a valid JSON array where each element represents a day and contains exactly these three properties:
        - morning_activity (string)
        - afternoon_activity (string)
        - evening_activity (string)`;

    try {
        const response = await fetch('https://api.example.com/generate-itinerary', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                destination: destination.name,
                numDays,
                activities: selectedActivities
            })
        });

        if (!response.ok) {
            throw new Error('Failed to generate itinerary');
        }

        const data = await response.json();
        return {
            destination: destinationId,
            days: data.itinerary
        };

    } catch (error) {
        console.error('Error:', error);
        return {
            destination: destinationId,
            days: formatResponseAsItinerary(null, numDays)
        };
    }
}

function formatResponseAsItinerary(text, numDays) {
    const itinerary = [];
    for (let i = 0; i < numDays; i++) {
        itinerary.push({
            morning_activity: "Explore local attractions",
            afternoon_activity: "Lunch and sightseeing",
            evening_activity: "Dinner and relaxation"
        });
    }
    return itinerary;
}

function displayItinerary(itinerary) {
    const itineraryContainer = document.getElementById('itineraryContainer');
    const itineraryContent = document.getElementById('itineraryContent');
    
    const daysHTML = itinerary.days.map((day, index) => `
        <div class="day-plan">
            <h3>Day ${index + 1}</h3>
            <ul>
                <li>🌅 Morning: ${day.morning_activity}</li>
                <li>☀️ Afternoon: ${day.afternoon_activity}</li>
                <li>🌙 Evening: ${day.evening_activity}</li>
            </ul>
        </div>
    `).join('');

    itineraryContent.innerHTML = daysHTML;
    itineraryContainer.classList.remove('hidden');
}

async function shareItinerary() {
    try {
        const title = 'My Dream Vacation Itinerary';
        const text = 'Check out my vacation itinerary!';
        const url = window.location.href;

        if (navigator.share) {
            await navigator.share({ title, text, url });
        } else {
            alert('Sharing is not supported on this browser. You can copy the URL instead.');
        }
    } catch (error) {
        console.error('Error sharing:', error);
    }
}

async function downloadItinerary() {
    try {
        const itineraryContainer = document.getElementById('itineraryContainer');
        const itineraryContent = document.getElementById('itineraryContent');
        
        const exportContainer = document.createElement('div');
        exportContainer.className = 'export-container';
        
        const dayPlans = Array.from(itineraryContent.querySelectorAll('.day-plan'));
        
        for (let i = 0; i < dayPlans.length; i += 3) {
            const row = document.createElement('div');
            row.className = 'export-row';
            
            for (let j = 0; j < 3 && i + j < dayPlans.length; j++) {
                const dayClone = dayPlans[i + j].cloneNode(true);
                row.appendChild(dayClone);
            }
            
            exportContainer.appendChild(row);
        }
        
        document.body.appendChild(exportContainer);
        
        const canvas = await html2canvas(exportContainer, {
            backgroundColor: '#f0f9ff',
            scale: 2,
            onclone: (clonedDoc) => {
                const container = clonedDoc.querySelector('.export-container');
                container.style.background = 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #bae6fd 100%)';
                container.style.padding = '2rem';
                container.style.borderRadius = '1rem';
            }
        });
        
        document.body.removeChild(exportContainer);
        
        const link = document.createElement('a');
        link.download = 'vacation-itinerary.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    } catch (error) {
        console.error('Error downloading:', error);
        alert('There was an error generating the image. Please try again.');
    }
}

function setupThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) return;

    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        themeToggle.innerHTML = newTheme === 'dark' 
            ? `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`
            : `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`;
    });
    
    themeToggle.innerHTML = savedTheme === 'dark'
        ? `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`;
}

function handleFormSubmit(e) {
    e.preventDefault();
    
    const searchInput = document.getElementById('search');
    const destinationName = searchInput.value;
    const destinationId = Object.values(destinations).find(dest => dest.name === destinationName)?.id;

    if (!destinationId) {
        alert('Please select a valid destination');
        return;
    }

    const numDays = parseInt(document.getElementById('days').value);
    const selectedActivities = Array.from(document.querySelectorAll('input[name="activities"]:checked'))
        .map(checkbox => checkbox.value);

    if (selectedActivities.length === 0) {
        alert('Please select at least one activity');
        return;
    }

    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.textContent = 'Generating...';
    submitButton.disabled = true;

    generateItineraryWithGemini(destinationId, numDays, selectedActivities)
        .then(itinerary => {
            displayItinerary(itinerary);
        })
        .catch(error => {
            console.error('Error generating itinerary:', error);
            alert('There was an error generating the itinerary. Please try again.');
        })
        .finally(() => {
            submitButton.textContent = originalButtonText;
            submitButton.disabled = false;
        });
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('vacationForm');
    const shareBtn = document.getElementById('shareBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const searchInput = document.getElementById('search');

    if (searchInput) {
        const destinationOptions = Object.values(destinations).map(dest => dest.name);
        const datalist = document.createElement('datalist');
        datalist.id = 'destinationList';
        destinationOptions.forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            datalist.appendChild(option);
        });
        document.body.appendChild(datalist);
        searchInput.setAttribute('list', 'destinationList');
        
        searchInput.addEventListener('change', (e) => {
            const destinationName = e.target.value;
            const destination = Object.values(destinations).find(dest => dest.name === destinationName);
            if (destination) {
                updateActivities(destination.id);
            }
        });
    }

    if (form) form.addEventListener('submit', handleFormSubmit);
    if (shareBtn) shareBtn.addEventListener('click', shareItinerary);
    if (downloadBtn) downloadBtn.addEventListener('click', downloadItinerary);
    
    setupThemeToggle();
});