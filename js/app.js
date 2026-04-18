console.log('APP.JS LOADED');
import { getDrops, getUpcomingDrops, isAdmin, supabase } from './supabase.js';

// Auth navbar updater
async function updateNavbar() {
    console.log('Checking auth state...'); // Debug
    
    const { data: { user } } = await supabase.auth.getUser();
    const authBtn = document.getElementById('authBtn');
    const adminLink = document.getElementById('adminLink');
    
    console.log('User:', user); // Debug - check browser console for this
    
    if (!authBtn) return;
    
    if (user) {
        console.log('User is logged in, showing Sign Out'); // Debug
        authBtn.textContent = 'Sign Out';
        authBtn.href = '#';
        authBtn.onclick = async (e) => {
            e.preventDefault();
            await supabase.auth.signOut();
            location.reload();
        };
        
        if (adminLink) {
            const admin = await isAdmin();
            console.log('Is admin:', admin); // Debug
            adminLink.style.display = admin ? 'inline' : 'none';
        }
    } else {
        console.log('No user, showing Sign In'); // Debug
        authBtn.textContent = 'Sign In';
        authBtn.href = 'login.html';
        authBtn.onclick = null;
        if (adminLink) adminLink.style.display = 'none';
    }
}

// Content drops
class ContentDropSystem {
    constructor() {
        this.init();
    }
    
    async init() {
        await this.loadDrops();
        this.initCountdown();
        this.initFlip();
    }
    
    async loadDrops() {
        const drops = await getDrops();
        const upcoming = await getUpcomingDrops();
        this.nextDrop = upcoming;
        
        this.renderFactions(drops.filter(d => d.drop_type === 'faction'));
        this.renderVault(drops.filter(d => d.drop_type === 'vault'));
        this.renderTimeline(drops.filter(d => d.drop_type === 'timeline'));
    }
    
    renderFactions(drops) {
        drops.forEach(drop => {
            const faction = drop.title.toLowerCase().split(' ')[0];
            const card = document.querySelector(`.faction-card[data-faction="${faction}"]`);
            if (card) {
                const lock = card.querySelector('.faction-lock');
                if (lock) {
                    lock.classList.add('unlocked');
                    lock.innerHTML = '<span class="lock-date">Unlocked</span>';
                }
            }
        });
    }
    
    renderVault(drops) {
        const grid = document.getElementById('vaultGrid');
        if (!grid || drops.length === 0) return;
        
        const html = drops.map(drop => `
            <div class="vault-slot unlocked" data-id="${drop.id}">
                <div class="vault-card-back" style="background-image: url('${drop.image_url}'); background-size: cover; filter: blur(${drop.blur_level}px);"></div>
                <span class="drop-date">${drop.title}</span>
            </div>
        `).join('');
        
        grid.insertAdjacentHTML('beforeend', html);
    }
    
    renderTimeline(drops) {
        const timeline = document.querySelector('.timeline');
        if (!timeline || drops.length === 0) return;
        
        const html = drops.map(drop => `
            <div class="timeline-item revealed">
                <div class="timeline-dot active"></div>
                <div class="timeline-content">
                    <span class="timeline-date">${new Date(drop.unlock_at).toLocaleDateString()}</span>
                    <h4>${drop.title}</h4>
                    <p>${drop.description}</p>
                </div>
            </div>
        `).join('');
        
        const nowItem = timeline.querySelector('.timeline-item');
        if (nowItem) nowItem.insertAdjacentHTML('afterend', html);
    }
    
    initCountdown() {
        const el = document.getElementById('countdown');
        if (!el || !this.nextDrop) {
            if (el) el.innerHTML = '<p class="countdown">All secrets revealed.</p>';
            return;
        }
        
        const update = () => {
            const diff = new Date(this.nextDrop.unlock_at) - new Date();
            if (diff <= 0) { location.reload(); return; }
            const d = Math.floor(diff / 86400000);
            const h = Math.floor((diff % 86400000) / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            
            el.innerHTML = `
                <p class="countdown-label">Next: ${this.nextDrop.title}</p>
                <div class="countdown-timer">
                    <span>${d}d</span> <span>${h}h</span> <span>${m}m</span> <span>${s}s</span>
                </div>
            `;
        };
        
        update();
        setInterval(update, 1000);
    }
    
    initFlip() {
        const heroCard = document.getElementById('heroCard');
        if (heroCard) heroCard.addEventListener('click', () => heroCard.classList.toggle('flipped'));
    }
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    updateNavbar();
    new ContentDropSystem();
    supabase.auth.onAuthStateChange(() => updateNavbar());
});