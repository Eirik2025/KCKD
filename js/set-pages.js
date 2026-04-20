import { checkPageLock, startCountdown, formatCSTDate, applyPageState } from './locks.js';

/**
 * Initialize any set page (fehu, godrin, braided, etc.)
 * @param {string} pageName - The faction/set name to look up in drops
 */
export async function initSetPage(pageName) {
    const result = await checkPageLock(pageName, 'page');
    
    console.log(`${pageName} state:`, result.state, 'Admin:', result.isAdmin);
    
    // Get view elements
    const elements = {
        locked: document.getElementById(`${pageName.toLowerCase()}Locked`),
        teaser: document.getElementById(`${pageName.toLowerCase()}Teaser`),
        unlocked: document.getElementById(`${pageName.toLowerCase()}Unlocked`),
        adminBadge: document.getElementById('adminPreviewBadge')
    };
    
    // Apply the correct view
    applyPageState(result.state, elements, result.isAdmin, result.drop?.unlock_at ? new Date(result.drop.unlock_at) : null);
    
    // Set up countdowns
    if (result.state === 'locked' && result.drop?.teaser_at) {
        const timerEl = document.getElementById(`${pageName.toLowerCase()}Timer`);
        const dateEl = document.getElementById(`${pageName.toLowerCase()}LockDate`);
        
        if (dateEl) {
            dateEl.textContent = 'Sealed until ' + formatCSTDate(new Date(result.drop.teaser_at));
        }
        
        if (timerEl) {
            startCountdown(new Date(result.drop.teaser_at), (time) => {
                timerEl.textContent = time.text;
            }, () => {
                location.reload();
            });
        }
    } else if (result.state === 'teaser' && result.drop?.unlock_at) {
        const timerEl = document.getElementById(`${pageName.toLowerCase()}TeaserTimer`);
        const progressEl = document.getElementById('teaserProgress');
        
        if (timerEl) {
            startCountdown(new Date(result.drop.unlock_at), (time) => {
                timerEl.textContent = `Official drop in ${time.text}`;
                
                // Progress bar
                if (progressEl && result.drop.teaser_at) {
                    const teaserStart = new Date(result.drop.teaser_at).getTime();
                    const unlockTime = new Date(result.drop.unlock_at).getTime();
                    const now = Date.now();
                    const total = unlockTime - teaserStart;
                    const elapsed = now - teaserStart;
                    const pct = Math.min(100, Math.max(0, (elapsed / total) * 100));
                    progressEl.style.width = pct + '%';
                }
            }, () => {
                location.reload();
            });
        }
    }
    
    // Update page title if unlocked
    if (result.state === 'unlocked' && result.drop) {
        document.title = `${result.drop.title} - Kloak & Daggurrs`;
    }
}