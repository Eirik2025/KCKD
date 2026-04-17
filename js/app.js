import { signUp, signIn, signOut, getDrops, getUpcomingDrops, isAdmin, supabase } from './supabase.js';

// ========== AUTH UI ==========
function openAuth() {
    document.getElementById('authModal').style.display = 'block';
    checkAuthState();
}

function closeAuth() {
    document.getElementById('authModal').style.display = 'none';
}

function toggleAuthMode() {
    const login = document.getElementById('loginForm');
    const reg = document.getElementById('registerForm');
    login.style.display = login.style.display === 'none' ? 'block' : 'none';
    reg.style.display = reg.style.display === 'none' ? 'block' : 'none';
}

async function handleRegister() {
    const email = document.getElementById('regEmail').value;
    const pass = document.getElementById('regPass').value;
    const { error } = await signUp(email, pass);
    if (error) alert('Initiation failed: ' + error.message);
    else alert('Check your email to confirm initiation.');
}

async function handleLogin() {
    const email = document.getElementById('authEmail').value;
    const pass = document.getElementById('authPass').value;
    const { error } = await signIn(email, pass);
    if (error) alert('Access denied: ' + error.message);
    else {
        closeAuth();
        updateNavbar();
    }
}

async function handleLogout() {
    await signOut();
    updateNavbar();
    openAuth();
}

async function checkAuthState() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        document.getElementById('authForms').style.display = 'none';
        document.getElementById('userPanel').style.display = 'block';
        document.getElementById('userEmail').textContent = user.email;
    } else {
        document.getElementById('authForms').style.display = 'block';
        document.getElementById('userPanel').style.display = 'none';
    }
}

async function updateNavbar() {
    const { data: { user } } = await supabase.auth.getUser();
    const authBtn = document.getElementById('authBtn');
    const adminLink = document.getElementById('adminLink');
    
    if (user) {
        authBtn.textContent = 'Account';
        authBtn.onclick = () => { openAuth(); return false; };
        
        const admin = await isAdmin();
        if (admin) {
            adminLink.style.display = 'inline';
        } else {
            adminLink.style.display = 'none';
        }
    } else {
        authBtn.textContent = 'Sign In';
        authBtn.onclick = () => { openAuth(); return false; };
        adminLink.style.display = 'none';
    }
}

// ========== CONTENT DROPS ==========
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
        
        this.renderFactions(drops.filter(d => d.drop_type === 'faction'));
        this.renderVault(drops.filter(d => d.drop_type === 'vault'));
        this.renderTimeline(drops.filter(d => d.drop_type === 'timeline'));
        this.nextDrop = upcoming;
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
        
        const unlockedHTML = drops.map(drop => `
            <div class="vault-slot unlocked" data-id="${drop.id}">
                <div class="vault-card-back" style="background-image: url('${drop.image_url}'); background-size: cover; filter: blur(${drop.blur_level}px);"></div>
                <span class="drop-date">${drop.title}</span>
            </div>
        `).join('');
        
        grid.insertAdjacentHTML('beforeend', unlockedHTML);
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
                location.reload();
                return;
            }
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
        if (heroCard) {
            heroCard.addEventListener('click', () => heroCard.classList.toggle('flipped'));
        }
    }
}

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', () => {
    updateNavbar();
    new ContentDropSystem();
    
    // Close modal on outside click
    window.onclick = (e) => {
        if (e.target === document.getElementById('authModal')) closeAuth();
    };
    
    // Auth state listener
    supabase.auth.onAuthStateChange(() => updateNavbar());
});