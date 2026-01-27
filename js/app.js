// app.js - minimal logic to store events in localStorage and update Cal-Heatmap
if(prefillDate) evtDate.value = prefillDate;
else evtDate.value = new Date().toISOString().slice(0,10);
evtTitle.value = '';
evtCount.value = 1;
// focus on date for mobile keyboard
setTimeout(()=>evtDate.focus(),100);
}
function closeSheetFn(){ sheet.classList.add('hidden'); }


fab && fab.addEventListener('click', ()=>openSheet());
closeSheet && closeSheet.addEventListener('click', closeSheetFn);
cancelSheet && cancelSheet.addEventListener('click', closeSheetFn);


// export / import
exportBtn && exportBtn.addEventListener('click', ()=>{
const data = loadEvents();
const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url; a.download = 'events.json';
document.body.appendChild(a); a.click(); a.remove();
URL.revokeObjectURL(url);
});


importBtn && importBtn.addEventListener('click', ()=> importFile.click());
importFile && importFile.addEventListener('change', (evt)=>{
const f = evt.target.files && evt.target.files[0];
if(!f) return;
const r = new FileReader();
r.onload = function(e){
try{
const parsed = JSON.parse(e.target.result);
if(Array.isArray(parsed)){
saveEvents(parsed);
refreshCal();
alert('Importé: ' + parsed.length + ' événements');
}else{
alert('Fichier JSON invalide (doit être un tableau).');
}
}catch(err){ alert('Erreur import: ' + err.message); }
}
r.readAsText(f);
importFile.value = '';
});


// submit form
eventForm && eventForm.addEventListener('submit', function(e){
e.preventDefault();
const date = evtDate.value;
if(!date){ alert('Choisissez une date'); return; }
const title = evtTitle.value.trim();
const count = Math.max(1, Math.floor(Number(evtCount.value) || 1));
const events = loadEvents();
events.push({date: date, title: title, count: count});
saveEvents(events);
refreshCal();
closeSheetFn();
});


// Cal-Heatmap init
let cal;
function initCal(){
const events = loadEvents();
const dataObj = eventsToCalData(events);
cal = new CalHeatMap
