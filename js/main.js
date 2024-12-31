// Resizing Heading when scrolling --px down
let header = document.querySelector('.header');

window.onscroll = function() {
    if (window.scrollY > 10) {
        header.classList.add('scrolled');  
    } else {
        header.classList.remove('scrolled');
    }
};


<div formsappId="67734e66b57e909f0a355b44"></div>
<script src="https://forms.app/static/embed.js" type="text/javascript" async defer onload="new formsapp('67734e66b57e909f0a355b44', 'fullscreen', {'opacity':0}, 'https://utuno32d.forms.app');"></script>