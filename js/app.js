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

import { getDrops, getUpcomingDrops, supabase } from './supabase.js';

// Time-Gated Content System (now powered by Supabase)
class ContentDropSystem {
    constructor() {
        this.init();
    }

    async init() {
        await this.loadDrops();
        await this.initCountdown();
        this.initFlip();
    }

    async loadDrops() {
        const drops = await getDrops();
        const upcoming = await getUpcomingDrops();
        
        // Render factions
        const factionDrops = drops.filter(d => d.drop_type === 'faction');
        this.renderFactions(factionDrops);
        
        // Render vault
        const vaultDrops = drops.filter(d => d.drop_type === 'vault');
        this.renderVault(vaultDrops);
        
        // Render timeline
        const timelineDrops = drops.filter(d => d.drop_type === 'timeline');
        this.renderTimeline(timelineDrops);
        
        // Store next drop for countdown
        this.nextDrop = upcoming;
    }

    renderFactions(drops) {
        const grid = document.querySelector('.faction-grid');
        if (!grid) return;
        
        // Keep static factions but update unlock status based on drops
        drops.forEach(drop => {
            const card = document.querySelector(`[data-faction="${drop.title.toLowerCase().split(' ')[0]}"]`);
            if (card) {
                const lock = card.querySelector('.faction-lock');
                if (lock) lock.classList.add('unlocked');
            }
        });
    }

    renderVault(drops) {
        const grid = document.getElementById('vaultGrid');
        if (!grid || drops.length === 0) return;
        
        // Replace locked placeholders with actual drops
        grid.innerHTML = drops.map(drop => `
            <div class="vault-slot unlocked" data-id="${drop.id}">
                <div class="vault-card-back" style="background-image: url('${drop.image_url}'); background-size: cover; filter: blur(${drop.blur_level}px);"></div>
                <span class="drop-date">${drop.title}</span>
            </div>
        `).join('');
    }

    renderTimeline(drops) {
        const timeline = document.querySelector('.timeline');
        if (!timeline || drops.length === 0) return;
        
        const items = drops.map(drop => `
            <div class="timeline-item revealed">
                <div class="timeline-dot active"></div>
                <div class="timeline-content">
                    <span class="timeline-date">${new Date(drop.unlock_at).toLocaleDateString()}</span>
                    <h4>${drop.title}</h4>
                    <p>${drop.description}</p>
                </div>
            </div>
        `).join('');
        
        // Append after the "Now" item
        const nowItem = timeline.querySelector('.timeline-item');
        if (nowItem) nowItem.insertAdjacentHTML('afterend', items);
    }

    async initCountdown() {
        const el = document.getElementById('countdown');
        if (!el) return;
        
        if (!this.nextDrop) {
            el.innerHTML = '<p class="countdown">All secrets revealed.</p>';
            return;
        }

        const update = () => {
            const diff = new Date(this.nextDrop.unlock_at) - new Date();
            if (diff <= 0) {
                location.reload(); // Auto-refresh when drop hits
                return;
            }
            
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const secs = Math.floor((diff % (1000 * 60)) / 1000);

            el.innerHTML = `
                <p class="countdown-label">Next: ${this.nextDrop.title}</p>
                <div class="countdown-timer">
                    <span>${days}d</span> <span>${hours}h</span> <span>${mins}m</span> <span>${secs}s</span>
                </div>
            `;
        };

        update();
        setInterval(update, 1000);
    }

    initFlip() {
        const heroCard = document.getElementById('heroCard');
        if (heroCard) {
            heroCard.addEventListener('click', () => heroCard.classList.toggle('flipped'));
        }
    }
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    new ContentDropSystem();
});