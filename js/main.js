//Mega Menu Click Event
let megaMenu = document.getElementById("megamenu");
let megaMenuElement = document.querySelector('.header .main-nav li:last-child .mega-menu');

megaMenu.addEventListener('click', function(event) {
    event.preventDefault();
    event.stopPropagation(); 
    if (megaMenuElement.style.opacity === '1') {
        megaMenuElement.style.opacity = '0';
        megaMenuElement.style.top = 'calc(100% + 50px)';
        megaMenuElement.style.zIndex = '0'; 
        megaMenuElement.style.display ="none";
    } else {
        megaMenuElement.style.opacity = '1';
        megaMenuElement.style.top = 'calc(100% + 1px)';
        megaMenuElement.style.zIndex = '12';
        megaMenuElement.style.display ="flex";
    }
});

document.addEventListener('click', function(event) {
    if (!megaMenu.contains(event.target) && !megaMenuElement.contains(event.target)) {
        if (megaMenuElement.style.opacity === '1') {
            megaMenuElement.style.opacity = '0';
            megaMenuElement.style.top = 'calc(100% + 50px)';
            megaMenuElement.style.zIndex = '0';
            megaMenuElement.style.display ="none";
        }
    }
});
// Resizing Heading when scrolling --px down
let header = document.querySelector('.header');

window.onscroll = function() {
    if (window.scrollY > 10) {
        header.classList.add('scrolled');  
    } else {
        header.classList.remove('scrolled');
    }
};

