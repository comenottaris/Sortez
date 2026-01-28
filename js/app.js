// Configuration
const REPO_OWNER = 'comenottaris';
const REPO_NAME = 'Sortez';
const WORKFLOW_FILE = 'add-event.yml';
const TOKEN_KEY = 'sortez_github_token';

let calInstance = null;

// ============================================================
// GESTION DU TOKEN
// ============================================================

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

function toggleTokenConfig() {
    const config = document.getElementById('tokenConfig');
    config.classList.toggle('active');
}

function saveToken() {
    const token = document.getElementById('githubToken').value.trim();
    if (!token) {
        showAlert('Veuillez entrer un token valide', 'error');
        return;
    }
    
    // Validation basique du format du token
    if (!token.startsWith('ghp_') && !token.startsWith('github_pat_')) {
        showAlert('Le token doit commencer par "ghp_" ou "github_pat_"', 'error');
        return;
    }
    
    localStorage.setItem(TOKEN_KEY, token);
    checkTokenStatus();
    showAlert('Token enregistré avec succès! 🎉', 'success');
    document.getElementById('githubToken').value = '';
    document.getElementById('tokenConfig').classList.remove('active');
}

function clearToken() {
    if (confirm('Êtes-vous sûr de vouloir effacer le token?')) {
        localStorage.removeItem(TOKEN_KEY);
        checkTokenStatus();
        showAlert('Token effacé', 'success');
    }
}

// ============================================================
// AFFICHAGE DES ALERTES
// ============================================================

function showAlert(message, type) {
    const alertContainer = document.getElementById('alertContainer');
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

// ============================================================
// CHARGEMENT DES ÉVÉNEMENTS
// ============================================================

async function loadEventsFromRepo() {
    try {
        const response = await fetch('/data/events.json', {
            cache: 'no-store',
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });
        
        if (!response.ok) {
            console.warn('events.json non trouvé ou erreur de chargement');
            updateHeatmap([]);
            renderEventsList([]);
            return [];
        }
        
        const events = await response.json();
        console.log(`${events.length} événement(s) chargé(s)`);
        
        updateHeatmap(events);
        renderEventsList(events);
        return events;
    } catch (error) {
        console.error('Erreur lors du chargement des événements:', error);
        updateHeatmap([]);
        renderEventsList([]);
        return [];
    }
}

// ============================================================
// CONVERSION DES DONNÉES POUR CAL-HEATMAP
// ============================================================

function eventsToCalData(events) {
    const dataObj = {};
    
    events.forEach(event => {
        if (!event.date) {
            console.warn('Événement sans date:', event);
            return;
        }
        
        // Créer la date en forçant le fuseau horaire UTC pour éviter les problèmes
        const date = new Date(event.date + 'T00:00:00Z');
        
        if (isNaN(date.getTime())) {
            console.warn('Date invalide:', event.date);
            return;
        }
        
        const timestamp = Math.floor(date.getTime() / 1000);
        const count = Number(event.count) || 1;
        
        dataObj[timestamp] = (dataObj[timestamp] || 0) + count;
    });
    
    return dataObj;
}

// ============================================================
// MISE À JOUR DE LA HEATMAP
// ============================================================

function updateHeatmap(events) {
    const dataObj = eventsToCalData(events);
    
    if (calInstance) {
        // Mettre à jour les données existantes
        calInstance.update(dataObj);
    } else {
        // Initialiser la heatmap
        calInstance = new CalHeatMap();
        
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
                min: '#efefef',
                max: '#1e6823',
                empty: '#ededed'
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

// ============================================================
// AFFICHAGE DE LA LISTE DES ÉVÉNEMENTS
// ============================================================

function renderEventsList(events) {
    const eventsList = document.getElementById('eventsList');
    
    if (!events || events.length === 0) {
        eventsList.innerHTML = '<p style="color:#999; text-align:center; padding:20px;">Aucun événement pour le moment. Ajoutez-en un! 🎭</p>';
        return;
    }
    
    // Trier par date décroissante (les plus récents d'abord)
    const sortedEvents = [...events].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
    ).slice(0, 20); // Afficher les 20 derniers
    
    eventsList.innerHTML = sortedEvents.map(event => {
        const eventLink = event.link ? 
            `<div><a href="${escapeHtml(event.link)}" target="_blank" rel="noopener noreferrer">🔗 Voir l'événement</a></div>` : 
            '';
        
        return `
            <div class="event-item">
                <div class="event-date">${formatDate(event.date)}</div>
                <div class="event-title">${escapeHtml(event.title)}</div>
                ${eventLink}
            </div>
        `;
    }).join('');
}

// ============================================================
// FORMATAGE
// ============================================================

function formatDate(dateStr) {
    try {
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (error) {
        return dateStr;
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================================
// AJOUT D'ÉVÉNEMENT VIA GITHUB ACTIONS
// ============================================================

async function addEvent(eventData) {
    const token = localStorage.getItem(TOKEN_KEY);
    
    if (!token || token.trim() === '') {
        showAlert('❌ Veuillez configurer votre token GitHub d\'abord', 'error');
        document.getElementById('tokenConfig').classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return false;
    }

    try {
        // Construire le payload
        const payload = {
            date: eventData.date,
            title: eventData.title,
            count: eventData.count,
            link: eventData.link || '',
            image: eventData.image || '',
            created_at: new Date().toISOString()
        };

        console.log('Envoi de l\'événement:', payload);

        // Déclencher le workflow GitHub Actions
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
                showAlert('❌ Token invalide ou sans les permissions nécessaires. Vérifiez votre token.', 'error');
            } else if (response.status === 404) {
                showAlert('❌ Workflow non trouvé. Vérifiez que .github/workflows/add-event.yml existe.', 'error');
            } else {
                showAlert(`❌ Erreur lors de l'ajout: ${response.status} ${response.statusText}`, 'error');
            }
            return false;
        }

        showAlert('✅ Événement ajouté! Le calendrier sera mis à jour dans quelques instants...', 'success');
        
        // Recharger les événements après un délai pour laisser le temps au workflow de s'exécuter
        setTimeout(async () => {
            await loadEventsFromRepo();
            showAlert('🔄 Calendrier mis à jour!', 'success');
        }, 5000);
        
        return true;
    } catch (error) {
        console.error('Erreur lors de l\'ajout:', error);
        showAlert('❌ Erreur réseau lors de l\'ajout de l\'événement', 'error');
        return false;
    }
}

// ============================================================
// GESTION DU FORMULAIRE
// ============================================================

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
            title: document.getElementById('eventTitle').value.trim(),
            link: document.getElementById('eventLink').value.trim(),
            image: document.getElementById('eventImage').value.trim(),
            count: parseInt(document.getElementById('eventCount').value) || 1
        };
        
        // Validation
        if (!eventData.date || !eventData.title) {
            showAlert('❌ Veuillez remplir tous les champs obligatoires', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = '✨ Ajouter l\'événement';
            return;
        }
        
        const success = await addEvent(eventData);
        
        if (success) {
            // Réinitialiser le formulaire
            form.reset();
            // Remettre la date d'aujourd'hui par défaut
            document.getElementById('eventDate').value = new Date().toISOString().split('T')[0];
            document.getElementById('eventCount').value = 1;
        }
        
        submitBtn.disabled = false;
        submitBtn.textContent = '✨ Ajouter l\'événement';
    });
}

// ============================================================
// INITIALISATION
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('Initialisation de Sortez...');
    
    // Définir la date d'aujourd'hui par défaut
    const dateInput = document.getElementById('eventDate');
    if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }
    
    // Vérifier le statut du token
    checkTokenStatus();
    
    // Initialiser le formulaire
    initEventForm();
    
    // Charger les événements
    loadEventsFromRepo();
    
    // Rafraîchir automatiquement toutes les 30 secondes
    setInterval(() => {
        loadEventsFromRepo();
    }, 30000);
    
    console.log('✅ Sortez initialisé avec succès!');
});

// Exposer les fonctions nécessaires globalement
window.checkTokenStatus = checkTokenStatus;
window.toggleTokenConfig = toggleTokenConfig;
window.saveToken = saveToken;
window.clearToken = clearToken;
