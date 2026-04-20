import { supabase, getDropStatus, isAdmin } from './supabase.js';
import { checkPageLock, applyPageState, startCountdown, formatCSTDate } from './locks.js';

export async function loadFactionLore() {
    const params = new URLSearchParams(window.location.search);
    const factionId = params.get('id');
    
    if (!factionId) {
        window.location.href = 'factions.html';
        return;
    }
    
    const container = document.getElementById('contentContainer');
    if (!container) return;
    
    try {
        // Get the faction drop
        const { data: faction, error } = await supabase
            .from('drops')
            .select('*')
            .eq('id', factionId)
            .eq('drop_type', 'faction')
            .single();
        
        if (error || !faction) {
            container.innerHTML = '<div class="page-content"><h2>Faction not found</h2></div>';
            return;
        }
        
        const status = getDropStatus(faction);
        const isAdminUser = await isAdmin();
        
        let view = 'locked';
        if (isAdminUser || status.state === 'unlocked') view = 'unlocked';
        else if (status.state === 'teaser') view = 'teaser';
        
        // Sigil color
        const sigilColor = faction.image_url && faction.image_url.startsWith('#')
            ? faction.image_url
            : 'var(--accent)';
        
        if (view === 'locked') {
            container.innerHTML = `
                <div class="locked-view">
                    <div class="seal-sigil" style="border-color: ${sigilColor}; color: ${sigilColor};">
                        <span>&#128274;</span>
                    </div>
                    <h1 class="lore-title locked-title" style="color: ${sigilColor};">${faction.title}</h1>
                    <p style="color: var(--text-secondary);">This faction remains sealed.</p>
                    <div class="lock-timer" id="loreTimer">...</div>
                    <div class="lock-date" id="loreDate"></div>
                </div>
            `;
            
            if (faction.teaser_at) {
                const timerEl = document.getElementById('loreTimer');
                const dateEl = document.getElementById('loreDate');
                if (dateEl) dateEl.textContent = 'Sealed until ' + formatCSTDate(new Date(faction.teaser_at));
                if (timerEl) {
                    startCountdown(new Date(faction.teaser_at), (time) => {
                        timerEl.textContent = time.text;
                    }, () => location.reload());
                }
            }
            
        } else if (view === 'teaser') {
            container.innerHTML = `
                <div class="teaser-view">
                    <div class="teaser-content">
                        <div class="lore-sigil-large" style="background: ${sigilColor}; border-color: ${sigilColor};"></div>
                        <h1 class="lore-title" style="color: var(--sun);">${faction.title}</h1>
                        <p class="lore-tagline">${faction.description || ''}</p>
                        <p style="color: var(--text-secondary);">Full lore coming soon...</p>
                        <div class="teaser-timer" id="loreTeaserTimer">...</div>
                    </div>
                </div>
            `;
            
            if (faction.unlock_at) {
                const timerEl = document.getElementById('loreTeaserTimer');
                if (timerEl) {
                    startCountdown(new Date(faction.unlock_at), (time) => {
                        timerEl.textContent = `Official drop in ${time.text}`;
                    }, () => location.reload());
                }
            }
            
        } else {
            container.innerHTML = `
                <div class="lore-hero">
                    <div class="lore-sigil-large" style="background: ${sigilColor}; border-color: ${sigilColor};"></div>
                    <h1 class="lore-title" style="color: ${sigilColor};">${faction.title}</h1>
                    <p class="lore-tagline">${faction.description || ''}</p>
                </div>
                <div class="lore-content">
                    <div class="lore-text">
                        ${faction.story_content || '<p>The full story of this faction has yet to be written...</p>'}
                    </div>
                </div>
                <div class="lore-cards-section">
                    <h3 class="font-display">Available Cards</h3>
                    <div class="collection-grid" id="factionCards">
                        <p style="color: var(--text-secondary); text-align: center; grid-column: 1/-1;">Cards will appear here when unlocked.</p>
                    </div>
                </div>
            `;
        }
        
    } catch (err) {
        console.error('Lore load error:', err);
        container.innerHTML = '<div class="page-content"><h2>Error loading faction lore</h2></div>';
    }
}