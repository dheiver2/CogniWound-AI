document.addEventListener('DOMContentLoaded', () => {
    // Smooth scroll para links de navegação
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - document.querySelector('.nav-container').offsetHeight,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Efeito de parallax no hero
    const hero = document.querySelector('.hero');
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        // hero.style.backgroundPositionY = `${scrolled * 0.5}px`; // Commented out parallax
    });

    // Navbar scroll effect
    const nav = document.querySelector('.nav-container');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        // Adiciona classe scrolled quando rolar
        if (currentScroll > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }

        // Efeito de esconder/mostrar navbar - REMOVED
        // if (currentScroll > lastScroll && currentScroll > 100) {
        // nav.style.transform = 'translateY(-100%)';
        // } else {
        // nav.style.transform = 'translateY(0)';
        // }
        // lastScroll = currentScroll; // lastScroll only needed for hide/show
    });

    // Animação de entrada para elementos
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Removed direct style manipulation, CSS will handle 'visible' class
                // if (entry.target.classList.contains('feature-card') ||
                // entry.target.classList.contains('step')) {
                // entry.target.style.opacity = '1';
                // entry.target.style.transform = 'translateY(0)';
                // }
            }
        });
    }, observerOptions);

    // Adiciona classe animate-on-scroll aos elementos
    const elementsToAnimate = [
        ...document.querySelectorAll('.feature-card'),
        ...document.querySelectorAll('.step'),
        ...document.querySelectorAll('.about-feature'),
        document.querySelector('.cta-content'),
        document.querySelector('.about-content')
    ];

    elementsToAnimate.forEach(element => {
        element.classList.add('animate-on-scroll');
        observer.observe(element);
    });

    // Efeito de hover com sombra dinâmica - COMMENTED OUT
    // function addDynamicShadow(element) {
    //     element.addEventListener('mousemove', (e) => {
    //         const rect = element.getBoundingClientRect();
    //         const x = e.clientX - rect.left;
    //         const y = e.clientY - rect.top;
            
    //         const centerX = rect.width / 2;
    //         const centerY = rect.height / 2;
            
    //         const deltaX = (x - centerX) / centerX;
    //         const deltaY = (y - centerY) / centerY;
            
    //         const shadowX = deltaX * 20;
    //         const shadowY = deltaY * 20;
            
    //         element.style.boxShadow = `
    //             ${shadowX}px ${shadowY}px 30px rgba(0, 0, 0, 0.4),
    //             inset 0 0 20px rgba(255, 255, 255, 0.05)
    //         `;
    //     });
        
    //     element.addEventListener('mouseleave', () => {
    //         element.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.4)';
    //     });
    // }

    // Efeito de scroll suave com fade - COMMENTED OUT (handled by IntersectionObserver)
    // function addScrollFade() {
    //     const elements = document.querySelectorAll('.feature-card, .step, .cta-content');
        
    //     const observer = new IntersectionObserver((entries) => {
    //         entries.forEach(entry => {
    //             if (entry.isIntersecting) {
    //                 entry.target.style.opacity = '1';
    //                 entry.target.style.transform = 'translateY(0)';
    //             }
    //         });
    //     }, {
    //         threshold: 0.1
    //     });
        
    //     elements.forEach(element => {
    //         element.style.opacity = '0';
    //         element.style.transform = 'translateY(20px)';
    //         element.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
    //         observer.observe(element);
    //     });
    // }

    // Efeito de hover com brilho sutil - COMMENTED OUT
    // function addGlowEffect() {
    //     const cards = document.querySelectorAll('.feature-card, .step');
        
    //     cards.forEach(card => {
    //         card.addEventListener('mousemove', (e) => {
    //             const rect = card.getBoundingClientRect();
    //             const x = e.clientX - rect.left;
    //             const y = e.clientY - rect.top;
                
    //             const centerX = rect.width / 2;
    //             const centerY = rect.height / 2;
                
    //             const deltaX = (x - centerX) / centerX;
    //             const deltaY = (y - centerY) / centerY;
                
    //             const glowX = deltaX * 50;
    //             const glowY = deltaY * 50;
                
    //             card.style.background = `
    //                 radial-gradient(
    //                     circle at ${x}px ${y}px,
    //                     rgba(255, 255, 255, 0.1) 0%,
    //                     rgba(26, 26, 26, 0.8) 50%
    //                 )
    //             `;
    //         });
            
    //         card.addEventListener('mouseleave', () => {
    //             card.style.background = 'rgba(26, 26, 26, 0.8)';
    //         });
    //     });
    // }

    // Efeito de digitação para o título
    const heroTitle = document.querySelector('.hero-content h1');
    if (heroTitle) {
        typeWriter(heroTitle, heroTitle.textContent);
    }
    
    // Animar gradiente do CTA - COMMENTED OUT
    // animateGradient();
    
    // Adicionar efeitos de sombra dinâmica - COMMENTED OUT
    // document.querySelectorAll('.feature-card, .step, .cta-content').forEach(addDynamicShadow);
    
    // Adicionar efeito de scroll com fade - COMMENTED OUT
    // addScrollFade();
    
    // Adicionar efeito de brilho - COMMENTED OUT
    // addGlowEffect();

    // Efeito de ripple para botões
    document.querySelectorAll('.btn').forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            ripple.classList.add('ripple');
            this.appendChild(ripple);

            const rect = button.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            ripple.style.width = ripple.style.height = `${size}px`;
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;

            ripple.addEventListener('animationend', () => {
                if (ripple.parentElement) { // Check if still attached before removing
                    ripple.remove();
                }
            }, { once: true }); // Use { once: true } for the event listener
        });
    });
}); 

// Efeito de digitação para o título
function typeWriter(element, text, speed = 50) {
    let i = 0;
    element.innerHTML = '';
    element.style.opacity = '1'; // Ensure it's visible for typing
    
    function type() {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    
    type();
}

// Efeito de gradiente animado para o CTA - COMMENTED OUT
// function animateGradient() {
//     const cta = document.querySelector('.cta-content');
//     if (!cta) return;
    
//     let angle = 0;
//     const animate = () => {
//         angle = (angle + 1) % 360;
//         const gradient = `linear-gradient(${angle}deg,
//             rgba(255, 255, 255, 0.05) 0%,
//             rgba(255, 255, 255, 0.02) 50%,
//             rgba(255, 255, 255, 0.05) 100%)`;
//         cta.style.background = gradient;
//         requestAnimationFrame(animate);
//     };
//     animate();
// }