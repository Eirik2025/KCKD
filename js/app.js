import { supabase } from './supabase.js';

let isSigningOut = false;

async function checkAdmin() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;
        const { data } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
        return data?.is_admin || false;
    } catch (e) {
        return false;
    }
}

async function updateNavbar() {
    if (isSigningOut) return;
    
    try {
        const { data: { user } } = await supabase.auth.getUser();
        const authBtn = document.getElementById('authBtn');
        const adminLink = document.getElementById('adminLink');
        
        if (!authBtn) return;
        
        if (user) {
            authBtn.textContent = 'Sign Out';
            authBtn.href = '#';
            
            const newAuthBtn = authBtn.cloneNode(true);
            authBtn.parentNode.replaceChild(newAuthBtn, authBtn);
            
            newAuthBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                isSigningOut = true;
                
                try {
                    await supabase.auth.signOut();
                    window.location.replace('index.html');
                } catch (err) {
                    isSigningOut = false;
                }
            });
            
            if (adminLink) {
                const admin = await checkAdmin();
                adminLink.style.display = admin ? 'inline' : 'none';
            }
        } else {
            authBtn.textContent = 'Sign In';
            authBtn.href = 'login.html';
        }
    } catch (err) {
        console.error('Navbar error:', err);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    updateNavbar();
    
    supabase.auth.onAuthStateChange((event) => {
        if (!isSigningOut) updateNavbar();
    });
    
    // Mobile nav toggle
    window.toggleNav = () => {
        const nav = document.getElementById('navLinks');
        if (nav) nav.classList.toggle('active');
    };
    
    // Mobile dropdown toggle
    document.querySelectorAll('.dropdown > a').forEach(drop => {
        drop.addEventListener('click', (e) => {
            if (window.innerWidth < 1024) {
                e.preventDefault();
                drop.parentElement.classList.toggle('active');
            }
        });
    });
});