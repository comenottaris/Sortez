// ========================================
// CONFIGURATION
// ========================================

const REPO_OWNER = 'comenottaris';
const REPO_NAME = 'Sortez';
const WORKFLOW_FILE = 'add-event.yml';
const TOKEN_KEY = 'sortez_github_token';

const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 
                'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const MONTHS_SHORT = ['JAN', 'FÉV', 'MAR', 'AVR', 'MAI', 'JUN', 
                      'JUL', 'AOÛ', 'SEP', 'OCT', 'NOV', 'DÉC'];

let calInstance = null;
let allEvents = [];
let currentMonth = null;

// ========================================
// ADMIN PANEL
// ========================================

function toggleAdmin() {
    const panel = document.getElementById('adminPanel');
    panel.classList.toggle('active');
}

// ========================================
// TOKEN MANAGEMENT
// ========================================

function checkTokenStatus() {
    const token = localStorage.getItem(TOKEN_KEY);
    const tokenSection = document.getElementById('tokenSection');
    const tokenStatus = document.getElementById('tokenStatus');
    
    if (token && token.trim() !== '') {
        tokenSection.classList.add('configured');
        tokenStatus.textContent = '✅ Token configuré';
    } else {
        tokenSection.classList.remove('configured');
        tokenStatus.textContent = '⚠️ Token non configuré';
    }
}

function saveToken() {
    const token = document.getElementById('githubToken').value.trim();
    if (!token) {
        showAlert('Veuillez entrer un token valide', 'error');
        return;
    }
    
    if (!token.startsWith('ghp_') && !token.startsWith('github_pat_')) {
        showAlert('Le token doit commencer par "ghp_" ou "github_pat_"', 'error');
        return;
    }
    
    localStorage.setItem(TOKEN_KEY, token);
    checkTokenStatus();
    showAlert('Token enregistré avec succès! 🎉', 'success');
    document.getElementById('githubToken').value = '';
}

function clearToken() {
    if (confirm('Êtes-vous sûr de vouloir effacer le token?')) {
        localStorage.removeItem(TOKEN_KEY);
        checkTokenStatus();
        showAlert('Token effacé', 'success');
    }
}

// ========================================
// ALERTS
// ========================================

function showAlert(message, type) {
    const alertContainer = document.getElementById('alertContainer');
    if (!alertContainer) return;

    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    alertContainer.appendChild(alert);
    
    setTimeout(() => {
        alert.style.opacity = '0';
        alert.style.transform = 'translateX(400px)';
        setTimeout(() => alert.remove(), 300);
    }, 5000);
}

// ========================================
// LOAD EVENTS
// ========================================

async function loadEvents() {
    try {
        const response = await fetch('/data/events.json', {
            cache: 'no-store',
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });
        
        if (!response.ok) {
            throw new Error('Fichier non trouvé');
        }
        
        allEvents = await response.json();
        console.log(`${allEvents.length} événement(s) chargé(s)`);
        
        // Filter upcoming events
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        allEvents = allEvents.filter(event => {
            const eventDate = new Date(event.date);
            eventDate.setHours(0, 0, 0, 0);
            return eventDate >= today;
        });
        
        // Sort by date
        allEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        renderMonthFilter();
        renderEvents(allEvents);
        
        if (calInstance) {
            updateHeatmap(allEvents);
        }
    } catch (error) {
        console.error('Erreur chargement événements:', error);
        document.getElementById('eventsGrid').innerHTML = 
            '<div class="loading">Aucun événement trouvé</div>';
    }
}

// ========================================
// MONTH FILTER
// ========================================

function renderMonthFilter() {
    const monthFilter = document.getElementById('monthFilter');
    if (!monthFilter) return;

    const monthsWithEvents = new Set();
    allEvents.forEach(event => {
        const date = new Date(event.date);
        const key = `${date.getFullYear()}-${date.getMonth()}`;
        monthsWithEvents.add(key);
    });

    let html = '<button class="month-btn active" onclick="filterByMonth(null)">Tous les mois</button>';
    
    Array.from(monthsWithEvents).sort().forEach(key => {
        const [year, month] = key.split('-');
        const monthName = MONTHS[parseInt(month)];
        html += `<button class="month-btn" onclick="filterByMonth('${key}')">${monthName} ${year}</button>`;
    });

    monthFilter.innerHTML = html;
}

function filterByMonth(monthKey) {
    currentMonth = monthKey;
    
    // Update active button
    document.querySelectorAll('.month-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    if (!monthKey) {
        renderEvents(allEvents);
        return;
    }

    const [year, month] = monthKey.split('-');
    const filtered = allEvents.filter(evt => {
        const date = new Date(evt.date);
        return date.getFullYear() == year && date.getMonth() == month;
    });

    renderEvents(filtered);
}

// ========================================
// RENDER EVENTS
// ========================================

function renderEvents(events) {
    const grid = document.getElementById('eventsGrid');
    
    if (!events || events.length === 0) {
        grid.innerHTML = '<div class="loading">Aucun événement à venir</div>';
        return;
    }

    let lastMonth = null;
    let html = '';

    events.forEach(event => {
        const date = new Date(event.date);
        const monthYear = `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
        
        if (monthYear !== lastMonth) {
            if (lastMonth !== null) {
                html += '</div>'; // Close previous month section
            }
            html += `<h3 class="month-divider">${monthYear}</h3><div class="month-events">`;
            lastMonth = monthYear;
        }

        html += renderEventCard(event);
    });

    if (lastMonth !== null) {
        html += '</div>'; // Close last month section
    }

    grid.innerHTML = html;
}

function renderEventCard(event) {
    const date = new Date(event.date);
    const day = String(date.getDate()).padStart(2, '0');
    const month = MONTHS_SHORT[date.getMonth()];
    
    const time = event.time || '';
    const lieu = event.lieu || '';
    const type = event.type || '';
    const description = event.description || '';
    const image = event.image || '';
    const link = event.link || '';

    const hasLink = link && link.trim() !== '';
    const tag = hasLink ? 'a' : 'div';
    const linkAttr = hasLink ? `href="${escapeHtml(link)}" target="_blank" rel="noopener"` : '';

    return `
        <${tag} class="event-card" ${linkAttr}>
            ${image ? `<div class="event-image" style="background-image: url('${escapeHtml(image)}')"></div>` : 
                    '<div class="event-image event-image-placeholder"></div>'}
            <div class="event-content">
                <div class="event-date-badge">
                    ${day}.${month.substring(0, 2)}${time ? `<span class="event-time">${escapeHtml(time)}</span>` : ''}
                </div>
                <h3 class="event-name">${escapeHtml(event.name || event.title)}</h3>
                ${type ? `<p class="event-type">${escapeHtml(type)}</p>` : ''}
                ${lieu ? `<p class="event-lieu">📍 ${escapeHtml(lieu)}</p>` : ''}
                ${description ? `<p class="event-description">${escapeHtml(description)}</p>` : ''}
            </div>
        </${tag}>
    `;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========================================
// HEATMAP
// ========================================

function eventsToCalData(events) {
    const dataObj = {};
    
    events.forEach(event => {
        if (!event.date) return;
        
        const date = new Date(event.date + 'T00:00:00Z');
        if (isNaN(date.getTime())) return;
        
        const timestamp = Math.floor(date.getTime() / 1000);
        const count = Number(event.count) || 1;
        
        dataObj[timestamp] = (dataObj[timestamp] || 0) + count;
    });
    
    return dataObj;
}

function updateHeatmap(events) {
    if (!document.getElementById('cal-heatmap')) return;

    const dataObj = eventsToCalData(events);
    
    if (calInstance) {
        calInstance.update(dataObj);
    } else {
        calInstance = new CalHeatmap();
        
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        
        calInstance.init({
            itemSelector: '#cal-heatmap',
            data: dataObj,
            domain: 'month',
            subDomain: 'day',
            start: startDate,
            range: 6,
            cellSize: 15,
            cellPadding: 3,
            tooltip: true,
            legend: [1, 3, 7, 15],
            legendColors: {
                min: '#333333',
                max: '#FF6B6B',
                empty: '#1a1a1a'
            },
            label: {
                position: 'top'
            },
            domainLabelFormat: '%B %Y',
            subDomainTextFormat: '%d',
            itemName: ['événement', 'événements']
        });
    }
}

// ========================================
// ADD EVENT
// ========================================

async function addEvent(eventData) {
    const token = localStorage.getItem(TOKEN_KEY);
    
    if (!token || token.trim() === '') {
        showAlert('❌ Veuillez configurer votre token GitHub d\'abord', 'error');
        const adminPanel = document.getElementById('adminPanel');
        if (adminPanel && !adminPanel.classList.contains('active')) {
            adminPanel.classList.add('active');
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return false;
    }

    try {
        const payload = {
            date: eventData.date,
            name: eventData.name,
            time: eventData.time || '',
            type: eventData.type || '',
            lieu: eventData.lieu || '',
            description: eventData.description || '',
            image: eventData.image || '',
            link: eventData.link || '',
            count: 1,
            created_at: new Date().toISOString()
        };

        console.log('Envoi de l\'événement:', payload);

        const response = await fetch(
            `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/workflows/${WORKFLOW_FILE}/dispatches`,
            {
                method: 'POST',
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'X-GitHub-Api-Version': '2022-11-28'
                },
                body: JSON.stringify({
                    ref: 'main',
                    inputs: {
                        payload: JSON.stringify(payload)
                    }
                })
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Erreur API GitHub:', {
                status: response.status,
                statusText: response.statusText,
                body: errorText
            });
            
            if (response.status === 401 || response.status === 403) {
                showAlert('❌ Token invalide ou sans les permissions nécessaires', 'error');
            } else if (response.status === 404) {
                showAlert('❌ Workflow non trouvé. Vérifiez que .github/workflows/add-event.yml existe', 'error');
            } else {
                showAlert(`❌ Erreur: ${response.status} ${response.statusText}`, 'error');
            }
            return false;
        }

        showAlert('✅ Événement ajouté! Le calendrier sera mis à jour dans quelques instants', 'success');
        
        setTimeout(async () => {
            await loadEvents();
            showAlert('🔄 Calendrier mis à jour!', 'success');
        }, 5000);
        
        return true;
    } catch (error) {
        console.error('Erreur lors de l\'ajout:', error);
        showAlert('❌ Erreur réseau lors de l\'ajout de l\'événement', 'error');
        return false;
    }
}

// ========================================
// FORM HANDLING
// ========================================

function initEventForm() {
    const form = document.getElementById('eventForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = document.getElementById('submitBtn');
        submitBtn.disabled = true;
        submitBtn.textContent = '⏳ Ajout en cours...';
        
        const eventData = {
            date: document.getElementById('eventDate').value,
            name: document.getElementById('eventName').value.trim(),
            time: document.getElementById('eventTime').value,
            type: document.getElementById('eventType').value,
            lieu: document.getElementById('eventLieu').value.trim(),
            description: document.getElementById('eventDescription').value.trim(),
            image: document.getElementById('eventImage').value.trim(),
            link: document.getElementById('eventLink').value.trim()
        };
        
        if (!eventData.date || !eventData.name) {
            showAlert('❌ Veuillez remplir tous les champs obligatoires', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = '✨ Ajouter l\'événement';
            return;
        }
        
        const success = await addEvent(eventData);
        
        if (success) {
            form.reset();
            document.getElementById('eventDate').value = new Date().toISOString().split('T')[0];
        }
        
        submitBtn.disabled = false;
        submitBtn.textContent = '✨ Ajouter l\'événement';
    });
}

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('Initialisation de SORTEZ...');
    
    const dateInput = document.getElementById('eventDate');
    if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }
    
    checkTokenStatus();
    initEventForm();
    loadEvents();
    
    // Auto-refresh
    setInterval(() => {
        loadEvents();
    }, 60000); // Every minute
    
    console.log('✅ SORTEZ initialisé avec succès!');
});

// Expose global functions
window.toggleAdmin = toggleAdmin;
window.saveToken = saveToken;
window.clearToken = clearToken;
window.filterByMonth = filterByMonth;
