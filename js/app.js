console.log("🚀 Initialisation de ¡GET OUT!...\n");

const debugGetOut = {
    log: (message) => console.log("DEBUG:", message),
};

function showStatus(message, isError = false) {
    const statusEl = document.getElementById('statusMessage');
    statusEl.textContent = message;
    statusEl.className = isError ? 'error' : 'success';
    statusEl.style.display = 'block';
    
    setTimeout(() => {
        statusEl.style.display = 'none';
    }, 4000);
}

function triggerWorkflow() {
    console.log('Triggering GitHub Actions workflow...');
    // Code to trigger GitHub workflow (e.g., API call to GitHub Actions)
}

document.getElementById('eventForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Champs requis
    const eventName = document.getElementById('eventName').value.trim();
    const eventDate = document.getElementById('eventDate').value;
    
    // Champs optionnels
    const eventTime = document.getElementById('eventTime').value;
    const eventLieu = document.getElementById('eventLieu').value.trim();
    const eventDescription = document.getElementById('eventDescription').value.trim();
    const eventLink = document.getElementById('eventLink').value.trim();

    // Validation des champs requis
    if (!eventName || !eventDate) {
        showStatus('Veuillez remplir le nom et la date de l\'événement.', true);
        return;
    }

    // Validation URL si remplie
    if (eventLink && !isValidUrl(eventLink)) {
        showStatus('L\'URL du lien n\'est pas valide.', true);
        return;
    }

    // Construction de l'objet événement
    const eventData = {
        name: eventName,
        date: eventDate
    };

    // Ajout des champs optionnels seulement s'ils sont remplis
    if (eventTime) eventData.time = eventTime;
    if (eventLieu) eventData.lieu = eventLieu;
    if (eventDescription) eventData.description = eventDescription;
    if (eventLink) eventData.link = eventLink;

    debugGetOut.log("Données de l'événement:");
    console.log(eventData);

    // Process data
    console.log("Form data ready for processing:", eventData);
    showStatus('Événement ajouté avec succès! 🎉');
    triggerWorkflow();

    // Reset form
    this.reset();
});

function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}