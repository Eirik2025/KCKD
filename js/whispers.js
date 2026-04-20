import { supabase, getDropStatus, isAdmin } from './supabase.js';
import { startCountdown, formatCSTDate } from './locks.js';

export async function loadWhispers() {
    const container = document.querySelector('.timeline');
    if (!container) return;
    
    container.innerHTML = '<div class="loading-factions" style="text-align:center;padding:3rem;">Listening for whispers...</div>';
    
    try {
        const isAdminUser = await isAdmin();
        
        // Get timeline/whisper drops
        const { data: events, error } = await supabase
            .from('drops')
            .select('*')
            .eq('drop_type', 'timeline')
            .order('unlock_at', { ascending: true });
        
        if (error) {
            console.error('Error loading whispers:', error);
            container.innerHTML = '<div class="loading-factions">Error loading timeline.</div>';
            return;
        }
        
        if (!events || events.length === 0) {
            container.innerHTML = `
                <div class="timeline-item">
                    <div class="timeline-dot active"></div>
                    <div class="timeline-content">
                        <span class="timeline-date">Now</span>
                        <h4>The Veil Lifts</h4>
                        <p>The first shadow emerges. Watch closely.</p>
                    </div>
                </div>
            `;
            return;
        }
        
        container.innerHTML = events.map((event, index) => {
            const status = getDropStatus(event);
            let effectiveState = status.state;
            if (isAdminUser) effectiveState = 'unlocked';
            
            const isRevealed = effectiveState === 'unlocked';
            const isTeaser = effectiveState === 'teaser';
            
            const dotClass = isRevealed ? 'active' : (isTeaser ? 'teaser' : '');
            const contentClass = isRevealed ? '' : (isTeaser ? 'teaser' : 'locked');
            
            const dateText = isRevealed 
                ? (event.unlock_at ? formatCSTDate(new Date(event.unlock_at)) : 'Revealed')
                : (event.teaser_at ? formatCSTDate(new Date(event.teaser_at)) : '???');
            
            const title = isRevealed || isTeaser ? event.title : 'Redacted';
            const desc = isRevealed || isTeaser 
                ? (event.description || '[Content classified]')
                : '[This knowledge remains sealed]';
            
            return `
            <div class="timeline-item" data-id="${event.id}">
                <div class="timeline-dot ${dotClass}"></div>
                <div class="timeline-content ${contentClass}">
                    <span class="timeline-date">${dateText}</span>
                    <h4>${title}</h4>
                    <p>${desc}</p>
                </div>
            </div>
            `;
        }).join('');
        
        // Start countdowns for upcoming events
        events.forEach(event => {
            if (event.unlock_at && getDropStatus(event).state !== 'unlocked') {
                const item = container.querySelector(`[data-id="${event.id}"] .timeline-date`);
                if (item) {
                    startCountdown(new Date(event.unlock_at), (time) => {
                        item.textContent = time.text;
                    }, () => {
                        location.reload();
                    });
                }
            }
        });
        
    } catch (err) {
        console.error('Whispers load error:', err);
    }
}