// Configuration
const REPO_OWNER = 'comenottaris';
const REPO_NAME = 'Sortez';
const WORKFLOW_FILE = 'add-event.yml';

// ============================================
// 1. INITIALISATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initialisation de Sortez...');
    
    // Configurer le formulaire
    setupEventForm();
});

// ============================================
// 2. FORMULAIRE D'AJOUT
// ============================================

function setupEventForm() {
    const form = document.getElementById('addEventForm');
    
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await addEvent();
        });
    }
}

async function addEvent() {
    const submitBtn = document.getElementById('submitBtn');
    const originalText = submitBtn.innerHTML;
    
    try {
        // Récupérer le token
        const token = localStorage.getItem('github_token');
        if (!token) {
            showStatus('⚠️ Veuillez d\'abord configurer votre token GitHub dans la section Configuration', 'error');
            // Ouvrir automatiquement la section admin
            const adminContent = document.getElementById('adminContent');
            if (adminContent) {
                adminContent.classList.add('active');
            }
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
            showStatus('⚠️ Veuillez remplir tous les champs obligatoires (date et titre)', 'error');
            return;
        }
        
        // Validation de la date
        const selectedDate = new Date(eventData.date);
        if (isNaN(selectedDate.getTime())) {
            showStatus('⚠️ Date invalide', 'error');
            return;
        }
        
        // Désactiver le bouton
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Ajout en cours...<span class="spinner"></span>';
        
        console.log('📤 Envoi de l\'événement:', eventData);
        
        // Déclencher le workflow GitHub Actions
        const success = await triggerWorkflow(token, eventData);
        
        if (success) {
            showStatus('✅ Événement ajouté avec succès ! Il apparaîtra dans l\'agenda d\'ici quelques secondes.', 'success');
            
            // Réinitialiser le formulaire
            document.getElementById('addEventForm').reset();
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('eventDate').value = today;
            document.getElementById('eventCount').value = 1;
            
            // Message d'encouragement
            setTimeout(() => {
                showStatus('👁️ Vous pouvez voir l\'agenda public sur iframe.html', 'info');
            }, 3000);
        } else {
            showStatus('❌ Erreur lors de l\'ajout de l\'événement. Vérifiez que votre token est valide et qu\'il a les permissions "repo" et "workflow".', 'error');
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
// 3. INTERACTION AVEC GITHUB ACTIONS
// ============================================

async function triggerWorkflow(token, eventData) {
    try {
        const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/workflows/${WORKFLOW_FILE}/dispatches`;
        
        console.log('🔗 URL du workflow:', url);
        console.log('📝 Données:', eventData);
        
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
        
        console.log('📡 Status de la réponse:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Réponse d\'erreur:', errorText);
            
            // Messages d'erreur plus clairs
            if (response.status === 401) {
                throw new Error('Token non autorisé. Vérifiez que votre token est valide.');
            } else if (response.status === 404) {
                throw new Error('Workflow non trouvé. Vérifiez que le fichier .github/workflows/add-event.yml existe dans le repo.');
            } else if (response.status === 422) {
                throw new Error('Données invalides. Vérifiez le format de vos données.');
            } else {
                throw new Error(`Erreur GitHub API: ${response.status}`);
            }
        }
        
        console.log('✅ Workflow déclenché avec succès');
        return true;
        
    } catch (error) {
        console.error('❌ Erreur lors du déclenchement du workflow:', error);
        throw error;
    }
}

// ============================================
// 4. UTILITAIRES
// ============================================

function showStatus(message, type = 'info') {
    const container = document.getElementById('statusContainer');
    
    if (!container) {
        console.warn('statusContainer non trouvé');
        return;
    }
    
    const statusDiv = document.createElement('div');
    statusDiv.className = `status-message status-${type}`;
    statusDiv.textContent = message;
    
    container.innerHTML = '';
    container.appendChild(statusDiv);
    
    // Auto-scroll vers le message
    statusDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    // Supprimer après 8 secondes
    setTimeout(() => {
        statusDiv.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => statusDiv.remove(), 300);
    }, 8000);
}

// Export pour utilisation dans index.html
window.showStatus = showStatus;

// ============================================
// 5. DEBUG (développement uniquement)
// ============================================

if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.debugSortez = {
        getToken: () => localStorage.getItem('github_token'),
        setToken: (token) => {
            localStorage.setItem('github_token', token);
            console.log('✅ Token défini');
        },
        clearToken: () => {
            localStorage.removeItem('github_token');
            console.log('🗑️ Token supprimé');
        },
        testWorkflow: async (eventData) => {
            const token = localStorage.getItem('github_token');
            if (!token) {
                console.error('❌ Aucun token configuré');
                return;
            }
            return await triggerWorkflow(token, eventData || {
                date: '2026-02-01',
                title: 'Test Event',
                count: 1,
                link: null,
                image: null,
                created_at: new Date().toISOString()
            });
        }
    };
    console.log('🛠️ Mode debug activé. Utilisez window.debugSortez pour déboguer.');
    console.log('Commandes disponibles:');
    console.log('  - debugSortez.getToken()');
    console.log('  - debugSortez.setToken("ghp_...")');
    console.log('  - debugSortez.clearToken()');
    console.log('  - debugSortez.testWorkflow()');
}
