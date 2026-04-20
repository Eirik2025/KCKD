import { supabase, getDropStatus, isAdmin } from './supabase.js';
import { startCountdown, formatCSTDate } from './locks.js';

export async function loadVault() {
    const container = document.getElementById('vaultGrid');
    if (!container) return;
    
    container.innerHTML = '<div class="loading-factions">Opening the vault...</div>';
    
    try {
        const isAdminUser = await isAdmin();
        const now = new Date().toISOString();
        
        // Get vault drops
        let query = supabase
            .from('drops')
            .select('*')
            .eq('drop_type', 'vault')
            .order('sort_order');
        
        const { data: cards, error } = await query;
        
        if (error) {
            console.error('Error loading vault:', error);
            container.innerHTML = '<div class="loading-factions">Error loading vault.</div>';
            return;
        }
        
        if (!cards || cards.length === 0) {
            container.innerHTML = '<div class="loading-factions">The vault is empty.</div>';
            return;
        }
        
        container.innerHTML = cards.map(card => {
            const status = getDropStatus(card);
            let effectiveState = status.state;
            if (isAdminUser) effectiveState = 'unlocked';
            
            const stateClass = effectiveState;
            const isLocked = effectiveState === 'locked';
            
            // Determine rarity from title or default
            const rarity = card.title?.toLowerCase().includes('gold') ? 'rarity-gold'
                : card.title?.toLowerCase().includes('mythic') ? 'rarity-mythic'
                : card.title?.toLowerCase().includes('rare') ? 'rarity-rare'
                : card.title?.toLowerCase().includes('uncommon') ? 'rarity-uncommon'
                : 'rarity-common';
            
            const dropText = card.unlock_at 
                ? formatCSTDate(new Date(card.unlock_at))
                : 'Coming Soon';
            
            return `
            <div class="vault-slot ${stateClass} ${rarity}" data-id="${card.id}">
                <div class="vault-card-back" style="${!isLocked ? `background: linear-gradient(135deg, var(--card-purple), var(--card-light-purple));` : ''}"></div>
                <span class="drop-date">${isLocked ? dropText : card.title}</span>
            </div>
            `;
        }).join('');
        
        // Start countdowns for locked items
        cards.forEach(card => {
            if (card.unlock_at && getDropStatus(card).state === 'locked') {
                const slot = container.querySelector(`[data-id="${card.id}"] .drop-date`);
                if (slot) {
                    startCountdown(new Date(card.unlock_at), (time) => {
                        slot.textContent = time.text;
                    }, () => {
                        location.reload();
                    });
                }
            }
        });
        
    } catch (err) {
        console.error('Vault load error:', err);
        container.innerHTML = '<div class="loading-factions">Error loading vault.</div>';
    }
}