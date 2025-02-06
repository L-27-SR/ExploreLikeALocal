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

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('vacationForm');
    const destinationSelect = document.getElementById('destination');
    const activitiesContainer = document.getElementById('activitiesContainer');
    const shareBtn = document.getElementById('shareBtn');
    const downloadBtn = document.getElementById('downloadBtn');

    // Update activities when destination changes
    destinationSelect.addEventListener('change', updateActivities);

    // Initial activities update
    updateActivities();

    // Form submission
    form.addEventListener('submit', handleFormSubmit);

    // Share button
    shareBtn.addEventListener('click', shareItinerary);

    // Download button
    downloadBtn.addEventListener('click', downloadItinerary);
});

function updateActivities() {
    const destinationSelect = document.getElementById('destination');
    const activitiesContainer = document.getElementById('activitiesContainer');
    const selectedDestination = destinations[destinationSelect.value];

    activitiesContainer.innerHTML = selectedDestination.activities.map(activity => `
        <label class="activity-checkbox">
            <input type="checkbox" name="activities" value="${activity}">
            <span>${activity}</span>
        </label>
    `).join('');
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    const destinationId = document.getElementById('destination').value;
    const numDays = parseInt(document.getElementById('days').value);
    const selectedActivities = Array.from(document.querySelectorAll('input[name="activities"]:checked'))
        .map(checkbox => checkbox.value);

    if (selectedActivities.length === 0) {
        alert('Please select at least one activity');
        return;
    }

    // Show loading state
    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.textContent = 'Generating...';
    submitButton.disabled = true;

    try {
        const itinerary = await generateItineraryWithGemini(destinationId, numDays, selectedActivities);
        displayItinerary(itinerary);
    } catch (error) {
        console.error('Error generating itinerary:', error);
        alert('There was an error generating the itinerary. Please try again.');
    } finally {
        submitButton.textContent = originalButtonText;
        submitButton.disabled = false;
    }
}

async function generateItineraryWithGemini(destinationId, numDays, selectedActivities) {
    const destination = destinations[destinationId];
    const prompt = `Create a ${numDays}-day vacation itinerary for ${destination.name}. 
        The selected activities are: ${selectedActivities.join(', ')}. 
        Structure the response as a valid JSON array where each element represents a day and contains exactly these three properties:
        - morning_activity (string)
        - afternoon_activity (string)
        - evening_activity (string)
        
        Example format:
        [
          {
            "morning_activity": "Visit Temple X",
            "afternoon_activity": "Lunch and Shopping at Y",
            "evening_activity": "Dinner at Z"
          }
        ]
        
        Make the itinerary realistic and consider travel times between locations. Include the selected activities but also add other relevant activities for the destination. Ensure the JSON is valid and properly formatted.`;

    const API_KEY = 'AIzaSyDLRu2eZszzM15g7aTA6GjyLrCKQ6D6duw';
    const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1024,
            }
        })
    });

    if (!response.ok) {
        throw new Error('Failed to generate itinerary');
    }

    const data = await response.json();
    
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error('Invalid response format from API');
    }

    const itineraryText = data.candidates[0].content.parts[0].text;
    
    // Extract JSON from the response text (in case there's additional text)
    const jsonMatch = itineraryText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
        throw new Error('Could not find valid JSON in the response');
    }

    try {
        const itineraryData = JSON.parse(jsonMatch[0]);
        
        // Validate the structure
        if (!Array.isArray(itineraryData) || itineraryData.length !== numDays) {
            throw new Error('Invalid itinerary structure');
        }

        for (const day of itineraryData) {
            if (!day.morning_activity || !day.afternoon_activity || !day.evening_activity) {
                throw new Error('Missing required activities in the itinerary');
            }
        }

        return {
            destination: destinationId,
            days: itineraryData
        };
    } catch (error) {
        console.error('JSON parsing error:', error);
        throw new Error('Failed to parse the generated itinerary');
    }
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
        const itineraryContainer = document.getElementById('itineraryContainer');
        const title = 'My Dream Vacation Itinerary';
        const text = 'Check out my vacation itinerary!';
        const url = window.location.href;

        if (navigator.share) {
            await navigator.share({
                title,
                text,
                url
            });
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
        
        // Create a new container for the export layout
        const exportContainer = document.createElement('div');
        exportContainer.className = 'export-container';
        
        // Copy the itinerary content
        const itineraryContent = itineraryContainer.querySelector('#itineraryContent');
        const dayPlans = Array.from(itineraryContent.querySelectorAll('.day-plan'));
        
        // Create rows of 3 days each
        for (let i = 0; i < dayPlans.length; i += 3) {
            const row = document.createElement('div');
            row.className = 'export-row';
            
            // Add up to 3 days to this row
            for (let j = 0; j < 3 && i + j < dayPlans.length; j++) {
                const dayClone = dayPlans[i + j].cloneNode(true);
                row.appendChild(dayClone);
            }
            
            exportContainer.appendChild(row);
        }
        
        // Add the export container to the document temporarily
        document.body.appendChild(exportContainer);
        
        // Generate the image
        const canvas = await html2canvas(exportContainer, {
            backgroundColor: '#f0f9ff', // Light blue gradient start color
            scale: 2, // Higher resolution
            onclone: (clonedDoc) => {
                const container = clonedDoc.querySelector('.export-container');
                container.style.background = 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #bae6fd 100%)';
                container.style.padding = '2rem';
                container.style.borderRadius = '1rem';
            }
        });
        
        // Remove the temporary container
        document.body.removeChild(exportContainer);
        
        // Download the image
        const link = document.createElement('a');
        link.download = 'vacation-itinerary.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    } catch (error) {
        console.error('Error downloading:', error);
        alert('There was an error generating the image. Please try again.');
    }
}