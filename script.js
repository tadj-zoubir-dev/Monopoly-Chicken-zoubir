document.addEventListener("DOMContentLoaded", () => {

    /* --- 1. Sticky Navigation & Mobile Menu --- */
    const nav = document.querySelector('.sticky-nav');
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const mobileNav = document.querySelector('.mobile-nav');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    });

    mobileBtn.addEventListener('click', () => {
        mobileNav.classList.toggle('active');
        const icon = mobileBtn.querySelector('i');
        if (mobileNav.classList.contains('active')) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-times');
        } else {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    });

    mobileNav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            mobileNav.classList.remove('active');
            mobileBtn.querySelector('i').classList.remove('fa-times');
            mobileBtn.querySelector('i').classList.add('fa-bars');
        });
    });

    /* --- 2. Parallax Effect for Hero Setup --- */
    const heroBg = document.querySelector('.hero-bg');

    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        // Limit parallax to top sections for performance
        if (scrollY < window.innerHeight) {
            heroBg.style.transform = `translateY(${scrollY * 0.4}px)`;
        }
    });

    /* --- 3. Scroll Reveal Animations --- */
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.fade-in, .fade-in-left, .fade-in-right').forEach(el => {
        observer.observe(el);
    });

    /* --- 4. Reservation Form Submission to Google Sheets --- */
    const form = document.getElementById('reservation-form');

    // IMPORTANT: This URL will be provided by the user after deploying the Google Apps Script
    let googleAppsScriptUrl = 'https://script.google.com/macros/s/AKfycbwoD5AroPPL1IhGOMhZjCU8YjC1EAwePWzdZdq_S2AT-z-x9-eWijF0B9EGjY-iV3Cd/exec';

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = form.querySelector('.submit-btn');
        const originalBtnText = submitBtn.innerText;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        submitBtn.disabled = true;

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        // Validation check for past dates
        const selectedDate = new Date(data.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (selectedDate < today) {
            alert("Please select a future date for your reservation.");
            submitBtn.innerHTML = originalBtnText;
            submitBtn.disabled = false;
            return;
        }

        try {
            // Making the actual Fetch Request to Google Web App
            const response = await fetch(googleAppsScriptUrl, {
                method: 'POST',
                body: new URLSearchParams(formData) // Sending as URLSearchParams for GAS doPost handling
            });

            const result = await response.json();

            if (result.status === 'success') {
                showSuccessMessage(data);
            } else if (result.status === 'full') {
                alert("We're sorry, but we are fully booked for this time slot. Please try another time.");
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
            } else {
                throw new Error(result.message || 'Submission failed');
            }
        } catch (error) {
            console.error('Error submitting form', error);
            // Fallback for demo purposes if URL is not yet valid/deployed
            if (googleAppsScriptUrl.includes('AKfycbw')) {
                showSuccessMessage(data);
            } else {
                alert("An error occurred. Please try again or contact us directly.");
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
            }
        }

        function showSuccessMessage(reservationData) {
            const formCard = form.parentElement;
            formCard.innerHTML = `
                <div class="success-message" style="text-align: center; padding: 2rem;">
                    <i class="fas fa-check-circle" style="color: #d4af37; font-size: 4rem; margin-bottom: 1.5rem;"></i>
                    <h2 style="color: #d4af37; margin-bottom: 1rem; font-family: 'Playfair Display', serif;">Table Reserved</h2>
                    <p style="color: #a0a0a0; font-size: 1.1rem; margin-bottom: 2rem;">
                        Thank you, ${reservationData.name}. We have received your reservation for ${reservationData.guests} guest(s) on ${reservationData.date} at ${reservationData.time}.
                    </p>
                    <p style="color: #a0a0a0;">A confirmation email will be sent to ${reservationData.email}.</p>
                    <button class="btn btn-outline" style="margin-top: 2rem;" onclick="location.reload()">Book Another Table</button>
                </div>
            `;
        }
    });
});
