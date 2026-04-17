// Placeholder for now
console.log('Klandestine initialized');

// Countdown placeholder
const countdownEl = document.getElementById('countdown');
countdownEl.innerHTML = '<p class="countdown">Something stirs...</p>';

const heroCard = document.getElementById('heroCard');
heroCard.addEventListener('click', () => {
    heroCard.classList.toggle('flipped');
});