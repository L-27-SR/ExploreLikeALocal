function toggleTheme() {
    // Get the stylesheets
    const lightTheme = document.getElementById('light theme');
    const darkTheme = document.getElementById('dark theme');
    const themeToggleButton = document.getElementById('theme-toggle');

    // Toggle between light and dark themes
    if (lightTheme.disabled) {
        lightTheme.disabled = false; // Enable light theme
        darkTheme.disabled = true;  // Disable dark theme
        themeToggleButton.innerText = 'Switch to Dark Mode'; // Update button text
    } else {
        lightTheme.disabled = true;  // Disable light theme
        darkTheme.disabled = false; // Enable dark theme
        themeToggleButton.innerText = 'Switch to Light Mode'; // Update button text
    }
}

// Set the initial button text based on the current theme
document.addEventListener('DOMContentLoaded', () => {
    const lightTheme = document.getElementById('light theme');
    const themeToggleButton = document.getElementById('theme-toggle');

    if (lightTheme.disabled) {
        themeToggleButton.innerText = 'Switch to Light Mode';
    } else {
        themeToggleButton.innerText = 'Switch to Dark Mode';
    }
});
