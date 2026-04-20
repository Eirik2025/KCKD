export function initLearnPage() {
    const tabs = document.querySelectorAll('.tutorial-nav button');
    const sections = document.querySelectorAll('.tutorial-section');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.target;
            
            // Update tabs
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Update sections
            sections.forEach(s => {
                s.classList.remove('active');
                if (s.id === target) {
                    s.classList.add('active');
                }
            });
        });
    });
    
    // Activate first tab by default
    if (tabs.length > 0 && sections.length > 0) {
        tabs[0].click();
    }
}