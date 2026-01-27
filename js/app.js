const debugGetOut = {
    log: (message) => console.log("DEBUG:", message),
};

function triggerWorkflow() {
    console.log('Triggering GitHub Actions workflow...');
    // Code to trigger GitHub workflow (e.g., API call to GitHub Actions)
}

function showStatus(message) {
    console.log("Status: ", message);
}

document.getElementById('eventForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const heure = document.getElementById('heure').value;
    const description = document.getElementById('description').value;
    const lieu = document.getElementById('lieu').value;

    const data = {
        heure: heure ? heure : undefined,
        description: description ? description : undefined,
        lieu: lieu ? lieu : undefined,
    };

    // Form validation
    if (!data.heure || !data.description || !data.lieu) {
        showStatus('Please fill out all required fields.');
        return;
    }

    // Process data
    console.log("Form data ready for processing:", data);
    triggerWorkflow();
});

console.log("🚀 Initialisation de ¡GET OUT!...\n");