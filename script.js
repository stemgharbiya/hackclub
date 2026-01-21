// jQuery-based interactive functionality for Gharbiya Hack Club website

$(document).ready(function() {
    // Smooth scroll for anchor links
    $('a[href^="#"]').on('click', function(event) {
        const target = $(this.getAttribute('href'));
        if(target.length) {
            event.preventDefault();
            $('html, body').stop().animate({
                scrollTop: target.offset().top - 80
            }, 1000, 'swing');
        }
    });

    // Animate elements on scroll
    function animateOnScroll() {
        $('.feature-card, .bootcamp-card, .timeline-item').each(function() {
            const elementTop = $(this).offset().top;
            const elementBottom = elementTop + $(this).outerHeight();
            const viewportTop = $(window).scrollTop();
            const viewportBottom = viewportTop + $(window).height();

            if (elementBottom > viewportTop && elementTop < viewportBottom) {
                $(this).addClass('fade-in-visible');
            }
        });
    }

    // Add fade-in animation class
    $('<style>')
        .text(`
            .feature-card, .bootcamp-card, .timeline-item {
                opacity: 0;
                transform: translateY(30px);
                transition: opacity 0.6s ease, transform 0.6s ease;
            }
            .fade-in-visible {
                opacity: 1 !important;
                transform: translateY(0) !important;
            }
        `)
        .appendTo('head');

    $(window).on('scroll', animateOnScroll);
    animateOnScroll(); // Initial check

    // Bootcamp card hover effects with jQuery
    $('.bootcamp-card').hover(
        function() {
            $(this).find('.bootcamp-icon').css('transform', 'scale(1.2) rotate(5deg)');
        },
        function() {
            $(this).find('.bootcamp-icon').css('transform', 'scale(1) rotate(0deg)');
        }
    );

    $('.bootcamp-icon').css('transition', 'transform 0.3s ease');

    // Add dynamic counter animation for timeline
    let timelineAnimated = false;
    
    $(window).on('scroll', function() {
        if (!timelineAnimated && $('.timeline-section').length) {
            const timelineTop = $('.timeline-section').offset().top;
            const viewportBottom = $(window).scrollTop() + $(window).height();

            if (viewportBottom > timelineTop + 100) {
                timelineAnimated = true;
                $('.timeline-number').each(function(index) {
                    $(this).css({
                        'opacity': '0',
                        'transform': 'scale(0)'
                    });
                    
                    setTimeout(() => {
                        $(this).css({
                            'transition': 'all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                            'opacity': '1',
                            'transform': 'scale(1)'
                        });
                    }, index * 200);
                });
            }
        }
    });

    // Add parallax effect to hero section
    $(window).on('scroll', function() {
        const scrolled = $(window).scrollTop();
        $('.hero-section').css('background-position', 'center ' + (scrolled * 0.5) + 'px');
    });

    // Button ripple effect
    $('.btn').on('click', function(e) {
        const button = $(this);
        const ripple = $('<span class="ripple"></span>');
        
        button.append(ripple);
        
        const x = e.pageX - button.offset().left;
        const y = e.pageY - button.offset().top;
        
        ripple.css({
            left: x + 'px',
            top: y + 'px'
        });
        
        setTimeout(() => ripple.remove(), 600);
    });

    // Add ripple styles
    $('<style>')
        .text(`
            .btn {
                position: relative;
                overflow: hidden;
            }
            .ripple {
                position: absolute;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.6);
                transform: scale(0);
                animation: ripple-animation 0.6s ease-out;
            }
            @keyframes ripple-animation {
                to {
                    transform: scale(20);
                    opacity: 0;
                }
            }
        `)
        .appendTo('head');

    // Add loading animation when page loads
    $('body').css('opacity', '0');
    $(window).on('load', function() {
        $('body').animate({opacity: 1}, 500);
    });

    // Dynamic year update in footer
    const currentYear = new Date().getFullYear();
    $('footer').find('.small:contains("2026")').text(function(_, text) {
        return text.replace('2026', currentYear);
    });

    // Add hover effect to social links
    $('.social-links a').hover(
        function() {
            $(this).css({
                'transform': 'translateY(-2px)',
                'color': '#338eda'
            });
        },
        function() {
            $(this).css({
                'transform': 'translateY(0)',
                'color': ''
            });
        }
    );

    $('.social-links a').css('transition', 'all 0.3s ease');

    // Track bootcamp card clicks for analytics (console log)
    $('.bootcamp-card a').on('click', function() {
        const bootcamp = $(this).closest('.bootcamp-card').data('bootcamp');
        console.log('Bootcamp application clicked:', bootcamp);
    });

    // Add scroll progress indicator
    const progressBar = $('<div>')
        .css({
            'position': 'fixed',
            'top': '0',
            'left': '0',
            'width': '0%',
            'height': '4px',
            'background': 'linear-gradient(90deg, #ec3750 0%, #ff8c37 25%, #f1c40f 50%, #33d6a6 75%, #338eda 100%)',
            'z-index': '10000',
            'transition': 'width 0.1s ease'
        })
        .prependTo('body');

    $(window).on('scroll', function() {
        const winScroll = $(window).scrollTop();
        const height = $(document).height() - $(window).height();
        const scrolled = (winScroll / height) * 100;
        progressBar.css('width', scrolled + '%');
    });

    // Easter egg: Konami code
    let konamiCode = [];
    const konamiSequence = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65]; // ↑↑↓↓←→←→BA

    $(document).on('keydown', function(e) {
        konamiCode.push(e.keyCode);
        if (konamiCode.length > 10) konamiCode.shift();
        
        if (konamiCode.join(',') === konamiSequence.join(',')) {
            // Activate rainbow mode
            $('body').css({
                'animation': 'rainbow 3s linear infinite'
            });
            
            $('<style>')
                .text(`
                    @keyframes rainbow {
                        0% { filter: hue-rotate(0deg); }
                        100% { filter: hue-rotate(360deg); }
                    }
                `)
                .appendTo('head');
            
            alert('🎉 Rainbow mode activated! You found the secret!');
        }
    });

    // Add typing effect for hero text (optional enhancement)
    function typeWriter(element, text, speed) {
        let i = 0;
        element.text('');
        
        function type() {
            if (i < text.length) {
                element.text(element.text() + text.charAt(i));
                i++;
                setTimeout(type, speed);
            }
        }
        
        type();
    }

    // Uncomment to activate typing effect on hero
    // const heroText = $('.hero-section p.lead').text();
    // typeWriter($('.hero-section p.lead'), heroText, 30);
});

// Form-specific JavaScript for application pages
$(document).ready(function() {
    // Character counter for textareas
    $('textarea[id="story"], textarea[id="experience"]').each(function() {
        const textarea = $(this);
        const counter = $('<div class="char-counter text-muted small mt-1"></div>');
        textarea.after(counter);
        
        function updateCounter() {
            const length = textarea.val().length;
            counter.text(length + ' characters');
            
            if (textarea.attr('id') === 'story') {
                if (length < 100) {
                    counter.addClass('text-danger').removeClass('text-success');
                } else {
                    counter.addClass('text-success').removeClass('text-danger');
                }
            }
        }
        
        textarea.on('input', updateCounter);
        updateCounter();
    });

    // Auto-save form data to localStorage
    $('form input, form textarea, form select').on('change', function() {
        const formId = $(this).closest('form').attr('id');
        const fieldName = $(this).attr('name');
        const fieldValue = $(this).val();
        
        if (formId && fieldName) {
            const savedData = JSON.parse(localStorage.getItem(formId) || '{}');
            savedData[fieldName] = fieldValue;
            localStorage.setItem(formId, JSON.stringify(savedData));
        }
    });

    // Restore form data from localStorage
    const formId = $('form').attr('id');
    if (formId) {
        const savedData = JSON.parse(localStorage.getItem(formId) || '{}');
        Object.keys(savedData).forEach(function(fieldName) {
            const field = $('[name="' + fieldName + '"]');
            if (field.attr('type') === 'radio') {
                $('[name="' + fieldName + '"][value="' + savedData[fieldName] + '"]').prop('checked', true);
            } else {
                field.val(savedData[fieldName]);
            }
        });
    }

    // Clear saved data on successful submission
    $('form').on('submit', function() {
        const formId = $(this).attr('id');
        if (formId) {
            setTimeout(() => {
                localStorage.removeItem(formId);
            }, 1000);
        }
    });

    // Add visual feedback for form validation
    $('input[required], textarea[required], select[required]').on('blur', function() {
        if ($(this).val().trim() === '') {
            $(this).addClass('is-invalid');
        } else {
            $(this).removeClass('is-invalid').addClass('is-valid');
        }
    });
});
