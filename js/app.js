console.log('APP.JS LOADED');

import { supabase } from './supabase.js';

async function isAdmin() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;
        const { data } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
        return data?.is_admin || false;
    } catch (e) {
        console.error('isAdmin error:', e);
        return false;
    }
}

async function updateNavbar() {
    console.log('Checking auth...');
    
    try {
        const { data, error } = await supabase.auth.getUser();
        const user = data?.user;
        
        console.log('User:', user);
        console.log('Auth error:', error);
        
        const authBtn = document.getElementById('authBtn');
        const adminLink = document.getElementById('adminLink');
        
        if (!authBtn) {
            console.log('No authBtn found');
            return;
        }
        
        if (user) {
            console.log('Setting Sign Out');
            authBtn.textContent = 'Sign Out';
            authBtn.href = '#';
            authBtn.onclick = async (e) => {
                e.preventDefault();
                await supabase.auth.signOut();
                location.reload();
            };
            
            if (adminLink) {
                const admin = await isAdmin();
                console.log('Admin:', admin);
                adminLink.style.display = admin ? 'inline' : 'none';
            }
        } else {
            console.log('Setting Sign In');
            authBtn.textContent = 'Sign In';
            authBtn.href = 'login.html';
            authBtn.onclick = null;
            if (adminLink) adminLink.style.display = 'none';
        }
    } catch (err) {
        console.error('Navbar crash:', err);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM ready');

    const { data: { session } } = await supabase.auth.getSession();
    console.log('Session:', session);

    updateNavbar();

    supabase.auth.onAuthStateChange(() => updateNavbar());
});