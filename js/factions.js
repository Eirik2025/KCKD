import { supabase, getDropStatus, isAdmin } from './supabase.js';

export async function loadFactions() {
    const container = document.getElementById('factionsContainer');
    if (!container) return;
    
    container.innerHTML = '<div class="loading-factions">Summoning factions...</div>';
    
    try {
        // Get ALL faction drops (admin sees hidden too)
        let query = supabase
            .from('drops')
            .select('*')
            .eq('drop_type', 'faction')
            .order('sort_order');
        
        const { data: factions, error } = await query;
        
        if (error) {
            console.error('Error loading factions:', error);
            container.innerHTML = '<div class="loading-factions">Error loading factions.</div>';
            return;
        }
        
        if (!factions || factions.length === 0) {
            container.innerHTML = '<div class="loading-factions">No factions found.</div>';
            return;
        }
        
        const isAdminUser = await isAdmin();
        
        container.innerHTML = factions.map(faction => {
            const status = getDropStatus(faction);
            
            // Admin sees everything; others respect lock state
            let effectiveState = status.state;
            if (isAdminUser) effectiveState = 'unlocked';
            
            const isLocked = effectiveState === 'locked';
            const isTeaser = effectiveState === 'teaser';
            
            // Determine link target
            let href = '#';
            let clickHandler = '';
            
            if (!isLocked || isAdminUser) {
                // Check if this faction has a set page drop
                href = `set-${faction.title.toLowerCase().replace(/\\s+/g, '-')}.html`;
                // Fallback to lore page if no set page exists
                // href = `faction-lore.html?id=${faction.id}`;
            } else {
                clickHandler = 'onclick="event.preventDefault();"';
            }
            
            // Format dates
            const teaserDate = faction.teaser_at 
                ? new Date(faction.teaser_at).toLocaleDateString('en-US', { timeZone: 'America/Chicago' })
                : 'Soon';
            const unlockDate = faction.unlock_at
                ? new Date(faction.unlock_at).toLocaleDateString('en-US', { timeZone: 'America/Chicago' })
                : 'Soon';
            
            // Sigil color from image_url (hex) or default
            const sigilColor = faction.image_url && faction.image_url.startsWith('#') 
                ? faction.image_url 
                : 'var(--spirit)';
            const borderColor = faction.image_url && faction.image_url.startsWith('#')
                ? faction.image_url
                : 'var(--card-gold)';
            
            const lockClass = isLocked ? '' : (isTeaser ? 'teaser' : 'unlocked');
            const lockDisplay = isLocked ? 'flex' : (isTeaser ? 'flex' : 'none');
            
            return `
            <a href="${href}" class="faction-card" data-faction="${faction.id}" ${clickHandler}>
                <div class="faction-sigil" style="background: ${sigilColor}; border-color: ${borderColor};"></div>
                <span class="faction-name">${faction.title}</span>
                <p class="faction-tagline">${faction.description || 'Secrets yet to be revealed...'}</p>
                ${!isAdminUser ? `
                <div class="faction-lock ${lockClass}" style="display: ${lockDisplay};">
                    <span class="lock-date">
                        ${isTeaser 
                            ? `Teaser until ${unlockDate}<div class="teaser-text">Preview available</div>` 
                            : `Sealed until ${teaserDate}`}
                    </span>
                </div>
                ` : ''}
            </a>
            `;
        }).join('');
        
    } catch (err) {
        console.error('Factions load error:', err);
        container.innerHTML = '<div class="loading-factions">Error loading factions.</div>';
    }
}