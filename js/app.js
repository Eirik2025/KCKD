// Placeholder for now
console.log('Klandestine initialized');

// Countdown placeholder
const countdownEl = document.getElementById('countdown');
countdownEl.innerHTML = '<p class="countdown">Something stirs...</p>';

const heroCard = document.getElementById('heroCard');
heroCard.addEventListener('click', () => {
    heroCard.classList.toggle('flipped');
});


// Time-Gated Content System
class ContentDropSystem {
    constructor() {
        this.now = new Date();
        this.init();
    }

    init() {
        this.checkFactionLocks();
        this.checkVaultDrops();
        this.checkTimelineReveals();
        this.initCountdown();
    }

    // Faction unlocks
    checkFactionLocks() {
        document.querySelectorAll('.faction-lock').forEach(lock => {
            const unlockDate = lock.dataset.unlock;
            if (!unlockDate) return;

            if (new Date() >= new Date(unlockDate)) {
                lock.classList.add('unlocked');
                lock.innerHTML = '<span class="lock-date">Unlocked</span>';
            }
        });
    }

    // Vault card drops
    checkVaultDrops() {
        document.querySelectorAll('.vault-slot').forEach(slot => {
            const dropDate = slot.dataset.drop;
            if (new Date() >= new Date(dropDate)) {
                slot.classList.remove('locked');
                slot.classList.add('unlocked');
                // Replace ? with actual card (you'd load real image here)
                slot.querySelector('.drop-date').textContent = 'Available Now';
            }
        });
    }

    // Timeline reveals
    checkTimelineReveals() {
        document.querySelectorAll('.timeline-item[data-reveal]').forEach(item => {
            const revealDate = item.dataset.reveal;
            if (new Date() >= new Date(revealDate)) {
                const content = item.querySelector('.timeline-content');
                content.classList.remove('locked');
                content.querySelector('h4').textContent = 'The Plot Thickens';
                content.querySelector('p').textContent = 'New secrets have been unveiled...';
                content.querySelector('.timeline-date').textContent = revealDate;
                item.querySelector('.timeline-dot').classList.add('active');
            }
        });
    }

    // Countdown to next drop
    initCountdown() {
        const drops = [
            ...document.querySelectorAll('[data-unlock]'),
            ...document.querySelectorAll('[data-drop]'),
            ...document.querySelectorAll('[data-reveal]')
        ].map(el => new Date(el.dataset.unlock || el.dataset.drop || el.dataset.reveal));

        const nextDrop = drops.filter(d => d > new Date()).sort((a, b) => a - b)[0];
        
        if (nextDrop) {
            this.updateCountdown(nextDrop);
            setInterval(() => this.updateCountdown(nextDrop), 1000);
        }
    }

    updateCountdown(targetDate) {
        const diff = targetDate - new Date();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        const el = document.getElementById('countdown');
        if (el) {
            el.innerHTML = `
                <p class="countdown-label">Next Revelation</p>
                <div class="countdown-timer">
                    <span>${days}d</span> <span>${hours}h</span> <span>${mins}m</span>
                </div>
            `;
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new ContentDropSystem();

    // Card flip click for mobile
    const heroCard = document.getElementById('heroCard');
    if (heroCard) {
        heroCard.addEventListener('click', () => {
            heroCard.classList.toggle('flipped');
        });
    }
});