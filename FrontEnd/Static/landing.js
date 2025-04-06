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
            } else {
                // Add this else block for scroll down animation
                entry.target.classList.remove('animate-in');
            }
        });
    }, { 
        threshold: 0.1,
        // Add rootMargin to trigger animation slightly before element comes into view
        rootMargin: '50px'
    });

    // Observe all sections and feature pairs
    document.querySelectorAll('section, .feature-pair').forEach(element => {
        observer.observe(element);
        // Add initial state for animation
        element.style.transition = 'transform 0.6s ease-out, opacity 0.6s ease-out';
        element.style.opacity = '0';
        element.style.transform = 'translateY(50px)';
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
  // Remove this duplicate event listener
  document.addEventListener('DOMContentLoaded', function() {
      // Set up map dimensions
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Set up projection
      const projection = d3.geoMercator()
        .scale(width / 2 / Math.PI)
        .translate([width / 2, height / 2]);
      
      // Create path generator
      const path = d3.geoPath().projection(projection);
      
      // Create SVG element
      const svg = d3.select('#map-container')
        .append('svg')
        .attr('width', width)
        .attr('height', height);
      
      // Create graticule
      const graticule = d3.geoGraticule();
      
      // Add graticule lines
      svg.append('path')
        .datum(graticule)
        .attr('class', 'graticule')
        .attr('d', path);
      
      // Define capitals
      const capitals = [
        {id: "US-DC", name: "Washington D.C.", country: "United States", lat: 38.8951, lon: -77.0364},
        {id: "GB-LON", name: "London", country: "United Kingdom", lat: 51.5074, lon: -0.1278},
        {id: "IN-MUM", name: "Mumbai", country: "India", lat: 19.0760, lon: 72.8777},
        {id: "ZA-CPT", name: "Cape Town", country: "South Africa", lat: -33.9249, lon: 18.4241},
        {id: "RU-MOW", name: "Moscow", country: "Russia", lat: 55.7558, lon: 37.6173},
        {id: "JP-TKY", name: "Tokyo", country: "Japan", lat: 35.6762, lon: 139.6503},
        {id: "CN-BJ", name: "Beijing", country: "China", lat: 39.9042, lon: 116.4074},
        {id: "BR-BSB", name: "Brasília", country: "Brazil", lat: -15.7801, lon: -47.9292},
        {id: "EG-CAI", name: "Cairo", country: "Egypt", lat: 30.0444, lon: 31.2357},
        {id: "AU-SYD", name: "Sydney", country: "Australia", lat: -33.8688, lon: 151.2093}
      ];
      
      // Generate connections between all cities with varying values
      const connections = [];
      
      // Helper function to generate a random value for connections
      function getRandomValue() {
        // Values between 40 and 95
        return Math.floor(Math.random() * 56) + 40;
      }
      
      // Create connections between each pair of cities
      for (let i = 0; i < capitals.length; i++) {
        for (let j = i + 1; j < capitals.length; j++) {
          connections.push({
            from: capitals[i].id,
            to: capitals[j].id,
            value: getRandomValue()
          });
        }
      }
      
      // Helper function to get coordinates by ID
      function getCapitalById(id) {
        return capitals.find(capital => capital.id === id);
      }
      
      // Create tooltip
      const tooltip = d3.select('.tooltip');
      
      // Load world map data
      d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
        .then(function(world) {
          // Draw countries
          svg.append('g')
            .selectAll('path')
            .data(topojson.feature(world, world.objects.countries).features)
            .enter()
            .append('path')
            .attr('class', 'country')
            .attr('d', path);
          
          // Add animation delay for connections
          const lineGroup = svg.append('g');
      
          // Draw connections with staggered animations
          connections.forEach(function(connection, index) {
            const fromCapital = getCapitalById(connection.from);
            const toCapital = getCapitalById(connection.to);
            
            if (fromCapital && toCapital) {
              // Calculate projected points
              const fromPoint = projection([fromCapital.lon, fromCapital.lat]);
              const toPoint = projection([toCapital.lon, toCapital.lat]);
              
              // Skip if points are not visible
              if (!fromPoint || !toPoint) return;
              
              // Calculate distance between points
              const dx = toPoint[0] - fromPoint[0];
              const dy = toPoint[1] - fromPoint[1];
              const dist = Math.sqrt(dx * dx + dy * dy);
              
              // Skip connections that are too long (across the world)
              if (dist > width * 0.8) return;
              
              // Calculate curve height based on distance
              const curveHeight = dist * 0.3;
              
              // Calculate midpoint for the curve
              const midX = (fromPoint[0] + toPoint[0]) / 2;
              const midY = (fromPoint[1] + toPoint[1]) / 2;
              
              // Adjust the control point perpendicular to the midpoint
              const angle = Math.atan2(dy, dx) - Math.PI / 2;
              const ctrlX = midX + Math.cos(angle) * curveHeight;
              const ctrlY = midY + Math.sin(angle) * curveHeight;
              
              // Create the path string for a quadratic curve
              const pathData = `M${fromPoint[0]},${fromPoint[1]} Q${ctrlX},${ctrlY} ${toPoint[0]},${toPoint[1]}`;
              
              // Choose color based on connection value
              let color;
              if (connection.value > 85) color = "blood red"; // High connectivity
              else if (connection.value > 70) color = "#1E90FF"; // Medium-high connectivity
              else if (connection.value > 50) color = "#4682B4"; // Medium connectivity
              else color = "#4169E1"; // Lower connectivity
              
              // Adjust stroke width based on connection value
              const strokeWidth = (connection.value / 100) * 2 + 0.5;
              
              // Add the path to the SVG with staggered animation
              lineGroup.append('path')
                .attr('class', 'connection-line')
                .attr('d', pathData)
                .style('stroke', color)
                .style('stroke-width', strokeWidth)
                .attr('data-from', fromCapital.name)
                .attr('data-to', toCapital.name)
                .attr('data-value', connection.value)
                .style('animation-delay', `${index * 0.05}s`);
            }
          });
          
          // Add cities last so they appear on top of connections
          svg.selectAll('.city-marker')
            .data(capitals)
            .enter()
            .append('circle')
            .attr('class', 'city-marker')
            .attr('cx', d => {
              const coords = projection([d.lon, d.lat]);
              return coords ? coords[0] : null;
            })
            .attr('cy', d => {
              const coords = projection([d.lon, d.lat]);
              return coords ? coords[1] : null;
            })
            .attr('r', 5)
            .on('mouseover', function(event, d) {
              // Enlarge the marker
              d3.select(this).attr('r', 7);
              
              // Highlight related connections
              lineGroup.selectAll('path')
                .style('opacity', function() {
                  const from = d3.select(this).attr('data-from');
                  const to = d3.select(this).attr('data-to');
                  return (from === d.name || to === d.name) ? 1 : 0.1;
                })
                .style('stroke-width', function() {
                  const from = d3.select(this).attr('data-from');
                  const to = d3.select(this).attr('data-to');
                  if (from === d.name || to === d.name) {
                    const value = d3.select(this).attr('data-value');
                    return (value / 100) * 3 + 0.5;
                  }
                  return d3.select(this).style('stroke-width');
                });
              
              // Show tooltip
              tooltip.style('opacity', 1)
                .html(`<strong>${d.name}</strong><br>${d.country}`)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', function() {
              // Restore marker size
              d3.select(this).attr('r', 5);
              
              // Restore all connections
              lineGroup.selectAll('path')
                .style('opacity', 0.6)
                .style('stroke-width', function() {
                  const value = d3.select(this).attr('data-value');
                  return (value / 100) * 2 + 0.5;
                });
              
              // Hide tooltip
              tooltip.style('opacity', 0);
            });
          
          // Add zoom behavior
          const zoom = d3.zoom()
            .scaleExtent([1, 8])
            .on('zoom', function(event) {
              svg.selectAll('path')
                .attr('transform', event.transform);
              svg.selectAll('circle')
                .attr('transform', event.transform);
            });
          
          svg.call(zoom);
          
          // Control buttons
          document.getElementById('zoom-in').addEventListener('click', function() {
            svg.transition().call(zoom.scaleBy, 1.5);
          });
          
          document.getElementById('zoom-out').addEventListener('click', function() {
            svg.transition().call(zoom.scaleBy, 0.75);
          });
          
          document.getElementById('reset').addEventListener('click', function() {
            svg.transition().call(zoom.transform, d3.zoomIdentity);
          });
        })
        .catch(function(error) {
          console.error('Error loading world map data:', error);
          // Fallback for when loading external data fails
          svg.append('text')
            .attr('x', width / 2)
            .attr('y', height / 2)
            .attr('text-anchor', 'middle')
            .style('fill', 'white')
            .style('font-size', '16px')
            .text('World map data could not be loaded. Please check your internet connection.');
        });
      
      // Make the visualization responsive
      window.addEventListener('resize', function() {
        const newWidth = window.innerWidth;
        const newHeight = window.innerHeight;
        
        svg.attr('width', newWidth)
           .attr('height', newHeight);
        
        projection.translate([newWidth / 2, newHeight / 2])
               .scale(newWidth / 2 / Math.PI);
        
        // Redraw everything (simplified for this example)
        svg.selectAll('.country').attr('d', path);
        svg.selectAll('.graticule').attr('d', path);
      });
    });
  
  // Initialize the component
  initialize();
document.addEventListener('DOMContentLoaded', () => {
    // Initialize GSAP ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);

    // Initialize animations for feature cards
    const featurePairs = document.querySelectorAll('.feature-pair');

    featurePairs.forEach((pair, index) => {
        // Initial setup
        gsap.set(pair, {
            opacity: 0,
            y: 100
        });
    
        // Scroll trigger animation
        gsap.to(pair, {
            scrollTrigger: {
                trigger: pair,
                start: "top center+=100",
                end: "top center-=100",
                scrub: 1,
                toggleActions: "play none none reverse"
            },
            opacity: 1,
            y: 0,
            rotation: 0,
            duration: 1.5,
            ease: "power2.out"
        });
    
        // Exit animation (falling effect)
        ScrollTrigger.create({
            trigger: pair,
            start: "top top-=200",
            onEnterBack: () => {
                gsap.to(pair, {
                    opacity: 1,
                    y: 0,
                    rotation: 0,
                    duration: 0.5
                });
            },
            onLeave: () => {
                gsap.to(pair, {
                    opacity: 0,
                    y: 200,
                    rotation: 45,
                    duration: 0.5
                });
            }
        });
    });
});