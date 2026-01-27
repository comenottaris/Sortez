// Configuration
const REPO_OWNER = 'comenottaris';
const REPO_NAME = 'Sortez';
const WORKFLOW_FILE = 'add-event.yml';
const EVENTS_FILE_PATH = '/data/events.json';

// État global
let calInstance = null;
let allEvents = [];

// ============================================
// 1. INITIALISATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initialisation de Sortez...');
    
    // Charger le token s'il existe
    loadTokenFromStorage();
    
    // Charger les événements
    loadEventsFromRepo();
    
    // Configurer le formulaire
    setupEventForm();
    
    // Rafraîchir automatiquement toutes les 30 secondes
    setInterval(loadEventsFromRepo, 30000);
});

// ============================================
// 2. CHARGEMENT DES ÉVÉNEMENTS
// ============================================

async function loadEventsFromRepo() {
    try {
        console.log('📥 Chargement des événements...');
        
        // Ajouter un timestamp pour éviter le cache
        const timestamp = new Date().getTime();
        const response = await fetch(`${EVENTS_FILE_PATH}?t=${timestamp}`, {
            cache: 'no-store',
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }
        
        const events = await response.json();
        console.log(`✅ ${events.length} événement(s) chargé(s)`);
        
        allEvents = events;
        
        // Mettre à jour la heatmap
        updateCalendar(events);
        
        // Afficher la liste des événements
        renderEventsList(events);
        
    } catch (error) {
        console.error('❌ Erreur lors du chargement des événements:', error);
        showStatus('Erreur lors du chargement des événements. Vérifiez que le fichier data/events.json existe.', 'error');
    }
}

// ============================================
// 3. AFFICHAGE DU CALENDRIER (Cal-Heatmap)
// ============================================

function updateCalendar(events) {
    const calData = eventsToCalData(events);
    
    if (calInstance) {
        // Mettre à jour le calendrier existant
        calInstance.update(calData);
    } else {
        // Créer un nouveau calendrier
        initCalendar(calData);
    }
}

function initCalendar(data) {
    try {
        calInstance = new CalHeatMap();
        
        // Détecter si on est sur mobile
        const isMobile = window.innerWidth < 640;
        
        calInstance.init({
            // Container
            itemSelector: '#calendar',
            
            // Data
            data: data,
            
            // Configuration temporelle
            domain: 'month',
            subDomain: 'day',
            start: new Date(),
            range: isMobile ? 3 : 6, // 3 mois sur mobile, 6 sur desktop
            
            // Affichage
            cellSize: isMobile ? 12 : 15,
            cellPadding: 2,
            cellRadius: 2,
            
            // Légende
            legend: [1, 3, 7, 15],
            legendColors: {
                min: '#f0f9ff',
                max: '#6366f1',
                empty: '#f1f5f9'
            },
            
            // Tooltip
            tooltip: true,
            
            // Labels
            label: {
                position: 'top',
                width: isMobile ? 40 : 60,
                height: 30
            },
            
            // Orientation
            verticalOrientation: false,
            
            // Animation
            animationDuration: 300,
            
            // Callback pour le contenu du tooltip
            subDomainTitleFormat: {
                empty: 'Aucun événement le {date}',
                filled: '{count} événement(s) le {date}'
            },
            
            // Format de date
            subDomainDateFormat: function(date) {
                const options = { day: 'numeric', month: 'long', year: 'numeric' };
                return date.toLocaleDateString('fr-FR', options);
            },
            
            // Format du domaine (mois)
            domainLabelFormat: function(date) {
                const options = { month: 'long', year: 'numeric' };
                return date.toLocaleDateString('fr-FR', options);
            }
        });
        
        console.log('📅 Calendrier initialisé');
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation du calendrier:', error);
        showStatus('Erreur lors de l\'affichage du calendrier', 'error');
    }
}

// Convertir les événements au format Cal-Heatmap
function eventsToCalData(events) {
    const dataObj = {};
    
    events.forEach(event => {
        try {
            // Créer une date en UTC midnight pour éviter les problèmes de fuseau horaire
            const dateParts = event.date.split('-');
            const date = new Date(Date.UTC(
                parseInt(dateParts[0]),
                parseInt(dateParts[1]) - 1,
                parseInt(dateParts[2])
            ));
            
            // Timestamp en secondes (requis par Cal-Heatmap)
            const timestamp = Math.floor(date.getTime() / 1000);
            
            // Accumuler les counts pour la même date
            const count = Number(event.count) || 1;
            dataObj[timestamp] = (dataObj[timestamp] || 0) + count;
        } catch (error) {
            console.error('Erreur lors du traitement de l\'événement:', event, error);
        }
    });
    
    return dataObj;
}

// ============================================
// 4. AFFICHAGE DE LA LISTE DES ÉVÉNEMENTS
// ============================================

function renderEventsList(events) {
    const container = document.getElementById('eventsList');
    
    if (!events || events.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                <p>Aucun événement pour le moment</p>
            </div>
        `;
        return;
    }
    
    // Trier par date (les plus récents d'abord)
    const sortedEvents = [...events].sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
    });
    
    // Limiter aux 20 événements les plus récents
    const recentEvents = sortedEvents.slice(0, 20);
    
    container.innerHTML = recentEvents.map(event => {
        const formattedDate = formatDate(event.date);
        
        return `
            <div class="event-item">
                <div class="event-date">${formattedDate}</div>
                <div class="event-title">${escapeHtml(event.title || 'Sans titre')}</div>
                ${event.link ? `<a href="${escapeHtml(event.link)}" class="event-link" target="_blank" rel="noopener">🔗 Voir le lien</a>` : ''}
                ${event.image ? `<br><img src="${escapeHtml(event.image)}" class="event-image" alt="${escapeHtml(event.title || 'Event')}">` : ''}
            </div>
        `;
    }).join('');
}

// ============================================
// 5. AJOUT D'ÉVÉNEMENTS
// ============================================

function setupEventForm() {
    const form = document.getElementById('addEventForm');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await addEvent();
    });
}

async function addEvent() {
    const submitBtn = document.getElementById('submitBtn');
    const originalText = submitBtn.innerHTML;
    
    try {
        // Récupérer le token
        const token = localStorage.getItem('github_token');
        if (!token) {
            showStatus('Veuillez configurer votre token GitHub dans la section Admin', 'error');
            return;
        }
        
        // Récupérer les données du formulaire
        const eventData = {
            date: document.getElementById('eventDate').value,
            title: document.getElementById('eventTitle').value.trim(),
            count: parseInt(document.getElementById('eventCount').value) || 1,
            link: document.getElementById('eventLink').value.trim() || null,
            image: document.getElementById('eventImage').value.trim() || null,
            created_at: new Date().toISOString()
        };
        
        // Validation
        if (!eventData.date || !eventData.title) {
            showStatus('Veuillez remplir tous les champs obligatoires', 'error');
            return;
        }
        
        // Désactiver le bouton
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Ajout en cours...<span class="spinner"></span>';
        
        console.log('📤 Envoi de l\'événement:', eventData);
        
        // Déclencher le workflow GitHub Actions
        const success = await triggerWorkflow(token, eventData);
        
        if (success) {
            showStatus('✅ Événement ajouté avec succès ! Le calendrier sera mis à jour dans quelques secondes.', 'success');
            
            // Réinitialiser le formulaire
            document.getElementById('addEventForm').reset();
            document.getElementById('eventDate').value = new Date().toISOString().split('T')[0];
            document.getElementById('eventCount').value = 1;
            
            // Recharger les événements après 5 secondes
            setTimeout(loadEventsFromRepo, 5000);
        } else {
            showStatus('❌ Erreur lors de l\'ajout de l\'événement. Vérifiez votre token.', 'error');
        }
        
    } catch (error) {
        console.error('❌ Erreur:', error);
        showStatus(`Erreur: ${error.message}`, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

// ============================================
// 6. INTERACTION AVEC GITHUB ACTIONS
// ============================================

async function triggerWorkflow(token, eventData) {
    try {
        const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/workflows/${WORKFLOW_FILE}/dispatches`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ref: 'main',
                inputs: {
                    payload: JSON.stringify(eventData)
                }
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Réponse GitHub:', response.status, errorText);
            throw new Error(`GitHub API error: ${response.status}`);
        }
        
        console.log('✅ Workflow déclenché avec succès');
        return true;
        
    } catch (error) {
        console.error('❌ Erreur lors du déclenchement du workflow:', error);
        return false;
    }
}

// ============================================
// 7. GESTION DU TOKEN
// ============================================

function loadTokenFromStorage() {
    const token = localStorage.getItem('github_token');
    if (token) {
        document.getElementById('githubToken').value = token;
        console.log('🔑 Token chargé depuis le stockage local');
    }
}

// ============================================
// 8. UTILITAIRES
// ============================================

function showStatus(message, type = 'info') {
    const container = document.getElementById('statusContainer');
    
    const statusDiv = document.createElement('div');
    statusDiv.className = `status-message status-${type}`;
    statusDiv.textContent = message;
    
    container.innerHTML = '';
    container.appendChild(statusDiv);
    
    // Supprimer après 5 secondes
    setTimeout(() => {
        statusDiv.remove();
    }, 5000);
}

function formatDate(dateString) {
    try {
        const date = new Date(dateString + 'T00:00:00');
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        return date.toLocaleDateString('fr-FR', options);
    } catch (error) {
        return dateString;
    }
}

function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ============================================
// 9. RESPONSIVE - Reconfigurer sur resize
// ============================================

let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        if (calInstance && allEvents.length > 0) {
            // Réinitialiser le calendrier avec la nouvelle taille
            document.getElementById('calendar').innerHTML = '';
            calInstance = null;
            updateCalendar(allEvents);
        }
    }, 250);
});

// ============================================
// 10. DEBUG (développement uniquement)
// ============================================

if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.debugSortez = {
        getEvents: () => allEvents,
        getCalInstance: () => calInstance,
        reload: loadEventsFromRepo,
        clearToken: () => {
            localStorage.removeItem('github_token');
            console.log('Token supprimé');
        }
    };
    console.log('🛠️ Mode debug activé. Utilisez window.debugSortez pour déboguer.');
}
