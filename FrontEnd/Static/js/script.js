function updateCarousel() {
    const newTransform = -currentIndex * 100 + '%';
    list.style.transform = `translateX(${newTransform})`;
    
    // Update active state for main carousel items
    items.forEach((item, index) => {
        if (index === currentIndex) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // Update thumbnails
    thumbnails.forEach((thumb, index) => {
        if (index === currentIndex) {
            thumb.classList.add('active');
        } else {
            thumb.classList.remove('active');
        }
    });
}

// Initialize first item as active
items.forEach((item, index) => {
    if (index === 0) {
        item.classList.add('active');
    } else {
        item.classList.remove('active');
    }
});