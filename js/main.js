// Resizing Heading and Flag when scrolling
let header = document.querySelector('.header');
let flag = document.querySelector('img[src*="flag-orpheus-top"]');

window.onscroll = function () {
    if (window.scrollY > 10) {
        header.classList.add('scrolled');
        if (flag) flag.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
        if (flag) flag.classList.remove('scrolled');
    }
};


