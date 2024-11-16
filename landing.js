// DOM Elements
const authModal = document.getElementById('authModal');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const authBtn = document.getElementById('authBtn');
const locationBtn = document.getElementById('locationBtn');
const showSignupLink = document.getElementById('showSignup');
const showLoginLink = document.getElementById('showLogin');
const closeBtn = document.querySelector('.close');

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
        fetchNearbyPlaces(latitude, longitude);
    } catch (error) {
        alert('Please enable location services to find spots near you.');
    }
}

async function fetchNearbyPlaces(lat, lng) {
    try {
        const response = await fetch(`/api/places?lat=${lat}&lng=${lng}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            const places = await response.json();
            updateNearbySection(places);
        }
    } catch (error) {
        console.error('Failed to fetch nearby places:', error);
    }
}

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
locationBtn.addEventListener('click', getUserLocation);
closeBtn.addEventListener('click', hideModal);
showSignupLink.addEventListener('click', showSignup);
showLoginLink.addEventListener('click', showLogin);

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === authModal) {
        hideModal();
    }
});

// Form Submissions
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(loginForm);
    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: formData.get('email'),
                password: formData.get('password'),
            }),
        });
        
        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('token', data.token);
            hideModal();
            getUserLocation(); // Fetch recommendations after login
        } else {
            throw new Error('Login failed');
        }
    } catch (error) {
        alert('Login failed. Please try again.');
    }
});

signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(signupForm);
    try {
        const response = await fetch('/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: formData.get('name'),
                email: formData.get('email'),
                password: formData.get('password'),
            }),
        });
        
        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('token', data.token);
            hideModal();
            getUserLocation(); // Fetch recommendations after signup
        } else {
            throw new Error('Signup failed');
        }
    } catch (error) {
        alert('Signup failed. Please try again.');
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