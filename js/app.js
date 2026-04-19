// REPLACE your entire app.js with this fixed version:

console.log('APP.JS LOADED');

import { supabase } from './supabase.js';

let isSigningOut = false; // Flag to prevent race conditions

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
    // Skip update if we're in the middle of signing out
    if (isSigningOut) {
        console.log('Skipping navbar update - sign out in progress');
        return;
    }
    
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
            
            // Remove any existing listeners to prevent duplicates
            const newAuthBtn = authBtn.cloneNode(true);
            authBtn.parentNode.replaceChild(newAuthBtn, authBtn);
            
            newAuthBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation(); // Prevent event bubbling
                console.log('Signing out...');
                
                isSigningOut = true; // Set flag before async operation
                
                try {
                    const { error } = await supabase.auth.signOut();
                    if (error) {
                        console.error('Sign out error:', error);
                        alert('Failed to sign out: ' + error.message);
                        isSigningOut = false; // Reset flag on error
                    } else {
                        console.log('Signed out successfully - redirecting...');
                        // Force immediate redirect, don't wait for auth state change
                        window.location.replace('index.html');
                    }
                } catch (err) {
                    console.error('Sign out exception:', err);
                    isSigningOut = false;
                }
            });
            
            if (adminLink) {
                const admin = await isAdmin();
                console.log('Admin:', admin);
                adminLink.style.display = admin ? 'inline' : 'none';
            }
        } else {
            console.log('Setting Sign In');
            // Only update if not currently on login page (avoid flicker)
            if (authBtn.textContent !== 'Sign In') {
                authBtn.textContent = 'Sign In';
                authBtn.href = 'index.html'; // Changed from 'login.html' to match your structure
                const newAuthBtn = authBtn.cloneNode(true);
                authBtn.parentNode.replaceChild(newAuthBtn, authBtn);
            }
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

    // Only update navbar on auth changes if we're not signing out
    supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth state changed:', event, session);
        if (!isSigningOut) {
            updateNavbar();
        }
    });

    // Mobile nav toggle
    window.toggleNav = () => {
        document.getElementById('navLinks').classList.toggle('active');
    };

    // Mobile dropdown toggle (touch-friendly)
    document.querySelectorAll('.dropdown > a').forEach(drop => {
        drop.addEventListener('click', (e) => {
            if (window.innerWidth < 1024) {
                e.preventDefault();
                drop.parentElement.classList.toggle('active');
            }
        });
    });
});