/* ==========================================
   STYLE.JS
========================================== */

/* COLOR CONTROL ON SCROLLING */
window.addEventListener('scroll', function () {
    const header = document.querySelector('header');
    const menuToggle = document.querySelector('.menu-toggle');
    const navMenu = document.querySelector('#navMenu'); // Select the nav element
    const headerSeparator = this.document.querySelector(".header-separator");
    if (window.scrollY > 50) { // Adjust this value as needed
        header.classList.add('scrolled');
        menuToggle.classList.add('scrolled');
        navMenu.classList.add('scrolled'); // Apply the scrolled class to navMenu
        headerSeparator.classList.add("scrolled");
    } else {
        header.classList.remove('scrolled');
        menuToggle.classList.remove('scrolled');
        navMenu.classList.remove('scrolled');
        headerSeparator.classList.remove("scrolled");
    }
});


/* NAV MENU FOR SMALL SCREENS */
document.addEventListener('DOMContentLoaded', function () {
    // Make sure the DOM is fully loaded before adding event listeners
    const menuToggleButton = document.querySelector('.menu-toggle');
    const navMenu = document.getElementById('navMenu');

    // Ensure the button and nav menu exist before adding event listeners
    if (menuToggleButton && navMenu) {
        // Add click event listener to toggle the menu visibility
        menuToggleButton.addEventListener('click', function () {
            navMenu.classList.toggle('open');
        });
    } else {
        console.log(" Nav not found");
    }
});




