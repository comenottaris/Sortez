// Display events from data/events.json and localStorage
console.log("🎨 Initialisation de l'affichage des événements...\n");

const MONTHS = ['JAN', 'FÉV', 'MAR', 'AVR', 'MAI', 'JUN', 'JUL', 'AOÛ', 'SEP', 'OCT', 'NOV', 'DÉC'];

function getEventsFromStorage() {
    const STORAGE_KEY = 'getout_events';
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
}

async function loadAndDisplayEvents() {
    try {
        const eventsList = document.getElementById('eventsList');
        
        // Load events from JSON file
        let jsonEvents = [];
        try {
            const response = await fetch('data/events.json', { cache: 'no-store' });
            if (response.ok) {
                jsonEvents = await response.json();
                console.log('✓ Événements chargés depuis data/events.json:', jsonEvents.length);
            }
        } catch (error) {
            console.log('Note: data/events.json non accessible:', error.message);
        }
        
        // Load events from localStorage
        const localEvents = getEventsFromStorage();
        console.log('✓ Événements chargés depuis localStorage:', localEvents.length);
        
        // Merge both sources and remove duplicates
        const allEvents = [...jsonEvents, ...localEvents];
        
        // Remove duplicates based on date+name combination
        const uniqueEvents = allEvents.reduce((acc, event) => {
            const key = `${event.date}-${event.name}`;
            if (!acc.find(e => `${e.date}-${e.name}` === key)) {
                acc.push(event);
            }
            return acc;
        }, []);
        
        // Filter upcoming events
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const upcomingEvents = uniqueEvents.filter(event => {
            const eventDate = new Date(event.date);
            eventDate.setHours(0, 0, 0, 0);
            return eventDate >= today;
        });
        
        // Sort by date
        upcomingEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        console.log('✓ Événements à venir:', upcomingEvents.length);
        
        // Render events
        renderEventsList(upcomingEvents, eventsList);
        
    } catch (error) {
        console.error('Erreur lors du chargement des événements:', error);
        const eventsList = document.getElementById('eventsList');
        if (eventsList) {
            eventsList.innerHTML = '<div class="loading-message">Erreur lors du chargement des événements</div>';
        }
    }
}

function renderEventsList(events, container) {
    if (!container) return;
    
    if (!events || events.length === 0) {
        container.innerHTML = '<div class="loading-message">Aucun événement à venir</div>';
        return;
    }
    
    container.innerHTML = events.map(event => {
        const date = new Date(event.date);
        const day = String(date.getDate()).padStart(2, '0');
        const month = MONTHS[date.getMonth()];
        const year = date.getFullYear();
        
        const hasLink = event.link && event.link.trim() !== '';
        const tag = hasLink ? 'a' : 'div';
        const linkAttr = hasLink ? `href="${event.link}" target="_blank" rel="noopener noreferrer"` : '';
        
        let metaHtml = '';
        if (event.time) metaHtml += `<span>🕐 ${event.time}</span>`;
        if (event.lieu) metaHtml += `<span>📍 ${event.lieu}</span>`;
        
        let descHtml = '';
        if (event.description) descHtml = `<div class="event-description">${escapeHtml(event.description)}</div>`;
        
        let linkBtn = '';
        if (hasLink) linkBtn = `<span class="event-link-btn">→ Plus d'infos</span>`;
        
        return `
            <${tag} class="event-item" ${linkAttr}>
                <div class="event-date-block">
                    <span class="event-day">${day}</span>
                    <span class="event-month-year">${month} ${year}</span>
                </div>
                <div class="event-title">${escapeHtml(event.name)}</div>
                <div class="event-meta">${metaHtml}</div>
                ${descHtml}
                ${linkBtn}
            </${tag}>
        `;
    }).join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Load events when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAndDisplayEvents);
} else {
    loadAndDisplayEvents();
}

// Reload when localStorage changes (from form submission)
window.addEventListener('storage', loadAndDisplayEvents);

// Also listen for custom event when form is submitted
document.addEventListener('eventAdded', loadAndDisplayEvents);
