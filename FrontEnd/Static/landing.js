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
    const themeToggle = document.getElementById('theme-toggle');

    // Theme toggle functionality
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

    // Get saved theme from localStorage or use system preference
    const savedTheme = localStorage.getItem('theme') || 
        (prefersDarkScheme.matches ? 'dark' : 'light');
    
    // Set initial theme
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
    
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });
    
    function updateThemeIcon(theme) {
        const icon = themeToggle.querySelector('i');
        icon.setAttribute('data-lucide', theme === 'dark' ? 'moon' : 'sun');
        lucide.createIcons();
    }

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
    if (authBtn) {
        authBtn.addEventListener('click', showModal);
    }
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

    // Initialize Lucide icons
    lucide.createIcons();
});
const testimonials = [
    {
      quote: "This platform is a game-changer for travelers! The built-in translation tool helped me navigate conversations effortlessly, and the planner kept my itinerary perfectly organized.",
      name: "Pranav Ajay",
      designation: "Frequent Traveler & Travel Blogger",
      src: "https://www.wallsnapy.com/img_gallery/thalapathy-vijay-hd-wallpapers-pc-4532407.jpg"
    },
    {
      quote: "Managing expenses while traveling was always a hassle—until I found this platform. The wallet feature made transactions smooth, and I never had to worry about exchange rates again!",
      name: "Sai Kavya",
      designation: "Solo Explorer & Digital Nomad",
      src: "https://static.toiimg.com/thumb/imgsize-23456,msid-83095349,width-600,resizemode-4/83095349.jpg"
    },
    {
      quote: "From last-minute itinerary changes to real-time flight updates, this platform does it all. It’s like having a personal travel assistant in my pocket!",
      name: "Ashok Dinda",
      designation: "Indian Bowling Head Coach & Travel Enthusiast",
      src: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_w_1200,q_50/lsci/db/PICTURES/CMS/270100/270181.jpg"
    },
    {
      quote: "I’ve never felt safer while traveling solo! The emergency assistance and offline maps were lifesavers when I was in remote locations.",
      name: "Vir Das",
      designation: "Adventure Seeker & Solo Traveler",
      src: "https://images.unsplash.com/photo-1636041293178-808a6762ab39?q=80&w=3464&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
    },
    {
      quote: "I planned a month-long trip across multiple countries, and this platform made it effortless. From budget tracking to local recommendations, it had everything I needed!",
      name: "Lisa Thompson",
      designation: "VP of Technology & Travel Addict",
      src: "https://images.unsplash.com/photo-1624561172888-ac93c696e10c?q=80&w=2592&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
    }
];

  // DOM Elements
  const imagesContainer = document.querySelector('.testimonial-images');
  const testimonialName = document.querySelector('.testimonial-name');
  const testimonialDesignation = document.querySelector('.testimonial-designation');
  const testimonialQuote = document.querySelector('.testimonial-quote');
  const testimonialInfo = document.querySelector('.testimonial-info');
  const prevButton = document.querySelector('.prev-button');
  const nextButton = document.querySelector('.next-button');

  // State
  let activeIndex = 0;
  let autoplayInterval = null;

  // Initialize
  function initialize() {
    // Create image elements
    testimonials.forEach((testimonial, index) => {
      const img = document.createElement('img');
      img.src = testimonial.src;
      img.alt = testimonial.name;
      img.classList.add('testimonial-image');
      img.dataset.index = index;
      imagesContainer.appendChild(img);
    });

    // Set initial active testimonial
    updateActiveTestimonial();

    // Add event listeners
    prevButton.addEventListener('click', handlePrev);
    nextButton.addEventListener('click', handleNext);

    // Start autoplay
    startAutoplay();
  }

  // Update active testimonial
  function updateActiveTestimonial() {
    // Update images with proper class assignment
    const images = document.querySelectorAll('.testimonial-image');
    
    images.forEach((img, index) => {
      // Remove all classes first
      img.classList.remove('active', 'prev', 'next');
      
      if (index === activeIndex) {
        img.classList.add('active');
      } else if (index === getPrevIndex()) {
        img.classList.add('prev');
      } else if (index === getNextIndex()) {
        img.classList.add('next');
      }
    });

    // Update content with animation
    testimonialInfo.classList.remove('active');
    
    setTimeout(() => {
      testimonialName.textContent = testimonials[activeIndex].name;
      testimonialDesignation.textContent = testimonials[activeIndex].designation;
      
      const words = testimonials[activeIndex].quote.split(' ');
    testimonialQuote.innerHTML = '';

    words.forEach((word, index) => {
    const span = document.createElement('span');
    // Make sure to add a space after each word
    span.textContent = word;
    span.style.transitionDelay = `${index * 0.02}s`;
    testimonialQuote.appendChild(span);
    
    // Add a space after each word (except the last one)
    if (index < words.length - 1) {
        testimonialQuote.appendChild(document.createTextNode(' '));
    }
    });
      
      testimonialInfo.classList.add('active');
      testimonialQuote.classList.add('active');
    }, 200);
  }

  // Get previous index with wrap-around
  function getPrevIndex() {
    return (activeIndex - 1 + testimonials.length) % testimonials.length;
  }

  // Get next index with wrap-around
  function getNextIndex() {
    return (activeIndex + 1) % testimonials.length;
  }

  // Handle previous button click
  function handlePrev() {
    activeIndex = getPrevIndex();
    updateActiveTestimonial();
    resetAutoplay();
  }

  // Handle next button click
  function handleNext() {
    activeIndex = getNextIndex();
    updateActiveTestimonial();
    resetAutoplay();
  }

  // Start autoplay
  function startAutoplay() {
    autoplayInterval = setInterval(handleNext, 5000);
  }

  // Reset autoplay
  function resetAutoplay() {
    clearInterval(autoplayInterval);
    startAutoplay();
  }

  // Initialize the component
  initialize();