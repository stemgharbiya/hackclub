// Resizing Heading when scrolling --px down
let header = document.querySelector('.header');

window.onscroll = function() {
    if (window.scrollY > 10) {
        header.classList.add('scrolled');  
    } else {
        header.classList.remove('scrolled');
    }
};

