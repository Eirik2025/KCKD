import { supabase, getDropStatus, nowInCST, isAdmin } from './supabase.js';

/**
 * Check if a page/set should be locked, teaser, or unlocked
 * based purely on the drops table.
 * 
 * @param {string} pageName - The title field to match in drops table
 * @param {string} dropType - 'page', 'faction', 'vault', 'timeline', 'whisper'
 * @returns {Promise<{state: string, drop: object, isAdmin: boolean}>}
 */
export async function checkPageLock(pageName, dropType = 'page') {
    const now = new Date();
    
    // Fetch the drop for this page
    let query = supabase
        .from('drops')
        .select('*')
        .eq('drop_type', dropType)
        .eq('is_visible', true);
    
    if (pageName) {
        query = query.ilike('title', `%${pageName}%`);
    }
    
    const { data: drops, error } = await query;
    
    if (error) {
        console.error('Error fetching drop:', error);
        return { state: 'locked', drop: null, isAdmin: false };
    }
    
    const drop = drops && drops.length > 0 ? drops[0] : null;
    
    // Check admin status
    let isAdminUser = false;
    try {
        isAdminUser = await isAdmin();
    } catch (e) {
        console.log('Admin check failed:', e);
    }
    
    if (!drop) {
        // No drop found - locked unless admin
        return { state: isAdminUser ? 'unlocked' : 'locked', drop: null, isAdmin: isAdminUser };
    }
    
    const status = getDropStatus(drop);
    
    // Admin sees everything unlocked
    if (isAdminUser) {
        return { state: 'unlocked', drop, isAdmin: true };
    }
    
    return { state: status.state, drop, isAdmin: false };
}

/**
 * Start a countdown timer that auto-refreshes the page when target is reached
 * @param {Date} target - The target date
 * @param {Function} callback - Called every tick with {days, hours, minutes, seconds, totalMs}
 * @param {Function} onComplete - Called when timer reaches zero
 */
export function startCountdown(target, callback, onComplete) {
    if (!target) {
        if (callback) callback({ days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0, text: 'Coming Soon' });
        return null;
    }
    
    const tick = () => {
        const now = nowInCST();
        const diff = target - now;
        
        if (diff <= 0) {
            if (onComplete) onComplete();
            return;
        }
        
        const days = Math.floor(diff / 86400000);
        const hours = Math.floor((diff % 86400000) / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        
        const text = days > 0 
            ? `${days}d ${hours}h ${minutes}m`
            : hours > 0 
                ? `${hours}h ${minutes}m ${seconds}s`
                : `${minutes}m ${seconds}s`;
        
        if (callback) callback({ days, hours, minutes, seconds, totalMs: diff, text });
    };
    
    tick();
    return setInterval(tick, 1000);
}

/**
 * Format a date for display in CST
 */
export function formatCSTDate(date) {
    if (!date) return 'Coming Soon';
    return date.toLocaleString('en-US', {
        timeZone: 'America/Chicago',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
    });
}

/**
 * Apply lock/teaser/unlock views to a page
 * @param {string} state - 'locked', 'teaser', or 'unlocked'
 * @param {Object} elements - { locked, teaser, unlocked, adminBadge }
 * @param {boolean} isAdmin 
 * @param {Date} unlockAt - For showing admin preview badge
 */
export function applyPageState(state, elements, isAdmin = false, unlockAt = null) {
    // Hide all first
    if (elements.locked) elements.locked.style.display = 'none';
    if (elements.teaser) elements.teaser.style.display = 'none';
    if (elements.unlocked) elements.unlocked.style.display = 'none';
    if (elements.adminBadge) elements.adminBadge.style.display = 'none';
    
    switch (state) {
        case 'unlocked':
            if (elements.unlocked) elements.unlocked.style.display = 'block';
            // Show admin preview badge if admin viewing before official unlock
            if (isAdmin && unlockAt && new Date() < unlockAt) {
                if (elements.adminBadge) elements.adminBadge.style.display = 'block';
            }
            break;
        case 'teaser':
            if (elements.teaser) elements.teaser.style.display = 'flex';
            break;
        case 'locked':
        default:
            if (elements.locked) elements.locked.style.display = 'flex';
            break;
    }
}