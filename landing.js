// Wait until the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    
    // DOM Elements
    const authModal = document.getElementById('authModal');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const authBtn = document.getElementById('authBtn');
    const locationBtn = document.getElementById('locationBtn');
    const showSignupLink = document.getElementById('showSignup');
    const showLoginLink = document.getElementById('showLogin');
    const closeBtn = document.querySelector('.close');

    // Debugging: Check if closeBtn is found
    if (closeBtn) {
        console.log('Close button found:', closeBtn);
        closeBtn.addEventListener('click', () => {
            console.log('Close button clicked'); // Debugging log
            hideModal();
        });
    } else {
        console.log('Close button not found!');
    }

    // Animation Observer
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, { threshold: 0.1 });

    // Observe all sections
    document.querySelectorAll('section').forEach(section => {
        observer.observe(section);
    });

    // Location Functions
    async function getUserLocation() {
        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject);
            });
            
            const { latitude, longitude } = position.coords;
            fetchNearbyPlaces(latitude, longitude);  // Using mock data for now
        } catch (error) {
            alert('Please enable location services to find spots near you.');
        }
    }

    // Mock function to simulate fetching nearby places based on location
    function fetchNearbyPlaces(lat, lng) {
        // Example of mock places data for demonstration
        const places = [
            {
                name: 'Mountain Trail',
                distance: '2.5',
                categories: ['Hiking', 'Nature'],
                image: 'https://images.unsplash.com/photo-1533587851505-d119e13fa0d7'
            },
            {
                name: 'Local Art Gallery',
                distance: '1.2',
                categories: ['Culture', 'Indoor'],
                image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b'
            },
            {
                name: 'Historic Market',
                distance: '0.8',
                categories: ['Food', 'Shopping'],
                image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5'
            }
        ];

        updateNearbySection(places);  // Update the section with mock data
    }

    // Dynamically updates the 'Nearby' section with places
    function updateNearbySection(places) {
        const grid = document.querySelector('.destination-grid');
        grid.innerHTML = places.map(place => `
            <div class="destination-card" style="background-image: url('${place.image}')">
                <div class="card-content">
                    <h3>${place.name}</h3>
                    <p>${place.distance} km away • ${place.categories.join(' • ')}</p>
                </div>
            </div>
        `).join('');
    }

    // Auth Modal Functions
    function showModal() {
        authModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    function hideModal() {
        authModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    function showSignup() {
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
    }

    function showLogin() {
        signupForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
    }

    // Event Listeners
    authBtn.addEventListener('click', showModal);
    if (locationBtn) {
        locationBtn.addEventListener('click', getUserLocation);
    }
    if (showSignupLink) {
        showSignupLink.addEventListener('click', showSignup);
    }
    if (showLoginLink) {
        showLoginLink.addEventListener('click', showLogin);
    }

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === authModal) {
            hideModal();
        }
    });

    // Smooth Scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Experience Cards Hover Effect
    document.querySelectorAll('.experience-card').forEach(card => {
        card.addEventListener('mouseenter', (e) => {
            const { left, top, width, height } = card.getBoundingClientRect();
            const x = (e.clientX - left) / width;
            const y = (e.clientY - top) / height;
            
            card.style.transform = `
                perspective(1000px)
                rotateX(${(y - 0.5) * 10}deg)
                rotateY(${(x - 0.5) * 10}deg)
                translateZ(20px)
            `;
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'none';
        });
    });
});
