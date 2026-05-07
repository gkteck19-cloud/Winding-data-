
let db;
const request = indexedDB.open("MaaBhagawatiDB", 6); // Version updated

request.onupgradeneeded = (e) => {
    db = e.target.result;
    if (!db.objectStoreNames.contains("motors")) {
        db.createObjectStore("motors", { keyPath: "id", autoIncrement: true });
    }
};

request.onsuccess = (e) => { 
    db = e.target.result; 
    loadMotors(); 
};

function openForm() { document.getElementById('entryModal').classList.remove('hidden'); }
function closeForm() { document.getElementById('entryModal').classList.add('hidden'); }
function closeDetails() { document.getElementById('detailsModal').classList.add('hidden'); }

// Save Data Logic
document.getElementById('windingForm').onsubmit = async (e) => {
    e.preventDefault();
    const file = document.getElementById('photoInput').files[0];
    let base64 = "";
    if(file) {
        const reader = new FileReader();
        base64 = await new Promise(resolve => {
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(file);
        });
    }

    const motorData = {
        name: document.getElementById('motorName').value,
        idSize: document.getElementById('idSize').value,
        stamping: document.getElementById('stamping').value,
        running: { swg: document.getElementById('rSWG').value, turns: document.getElementById('rTurns').value, length: document.getElementById('rLength').value },
        starting: { swg: document.getElementById('sSWG').value, turns: document.getElementById('sTurns').value, length: document.getElementById('sLength').value },
        pic: base64
    };

    const tx = db.transaction("motors", "readwrite");
    tx.objectStore("motors").add(motorData);
    tx.oncomplete = () => {
        closeForm();
        loadMotors();
        document.getElementById('windingForm').reset();
    };
};

function loadMotors() {
    const list = document.getElementById('motorList');
    list.innerHTML = "";
    const store = db.transaction("motors", "readonly").objectStore("motors");
    store.openCursor().onsuccess = (e) => {
        const cursor = e.target.result;
        if(cursor) {
            const m = cursor.value;
            list.innerHTML += `
                <div class="card" onclick="showDetails(${m.id})">
                    <span class="font-bold text-slate-200 uppercase tracking-wide">${m.name}</span>
                    <span class="text-orange-500 text-xl font-black">❯</span>
                </div>`;
            cursor.continue();
        }
    };
}

function showDetails(id) {
    db.transaction("motors", "readonly").objectStore("motors").get(id).onsuccess = (e) => {
        const m = e.target.result;
        const details = document.getElementById('detailsContent');
        details.innerHTML = `
            <div class="bg-pic-container">
                ${m.pic ? `<img src="${m.pic}" class="bg-pic">` : `<div class="bg-slate-900 w-full h-full"></div>`}
            </div>
            <div class="overlay-data">
                <button onclick="closeDetails()" class="absolute top-6 right-6 bg-white/10 p-3 rounded-full backdrop-blur-md">✕</button>
                
                <h2 class="text-4xl font-black text-white uppercase mb-2 drop-shadow-lg">${m.name}</h2>
                <p class="text-orange-500 font-bold mb-6 tracking-widest text-sm">ID: ${m.idSize || '-'} | STAMP: ${m.stamping || '-'}</p>
                
                <div class="grid grid-cols-2 gap-4 mb-8">
                    <div class="bg-white/5 p-4 rounded-3xl border border-white/10 backdrop-blur-md">
                        <p class="text-blue-400 font-bold text-[10px] uppercase mb-2">Running</p>
                        <p class="text-sm">SWG: ${m.running.swg}</p>
                        <p class="text-sm">Turns: ${m.running.turns}</p>
                        <p class="text-xs text-white/50 mt-1">L: ${m.running.length}</p>
                    </div>
                    <div class="bg-white/5 p-4 rounded-3xl border border-white/10 backdrop-blur-md">
                        <p class="text-green-400 font-bold text-[10px] uppercase mb-2">Starting</p>
                        <p class="text-sm">SWG: ${m.starting.swg}</p>
                        <p class="text-sm">Turns: ${m.starting.turns}</p>
                        <p class="text-xs text-white/50 mt-1">L: ${m.starting.length}</p>
                    </div>
                </div>

                <button onclick="deleteData(${m.id})" class="text-red-500 text-xs font-bold uppercase py-4 border-t border-white/10">🗑 Delete Data</button>
            </div>
        `;
        document.getElementById('detailsModal').classList.remove('hidden');
    };
}

function deleteData(id) {
    if(confirm("डिलीट?")) {
        db.transaction("motors", "readwrite").objectStore("motors").delete(id).onsuccess = () => {
            closeDetails(); loadMotors();
        };
    }
}

// Backup & Import Fix
function exportData() {
    db.transaction("motors").objectStore("motors").getAll().onsuccess = (e) => {
        const blob = new Blob([JSON.stringify(e.target.result)], {type: "application/json"});
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `MaaBhagawati_Backup.json`;
        a.click();
    };
}

function importData(event) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const data = JSON.parse(e.target.result);
        const tx = db.transaction("motors", "readwrite");
        data.forEach(m => { 
            delete m.id; 
            tx.objectStore("motors").add(m); 
        });
        tx.oncomplete = () => { 
            alert("बैकअप लोड हो गया!"); 
            location.reload(); // पेज रिफ्रेश ताकि डेटा दिखने लगे
        };
    };
    reader.readAsText(event.target.files[0]);
}

function searchMotor() {
    let f = document.getElementById('searchInput').value.toUpperCase();
    document.querySelectorAll('.card').forEach(c => {
        c.style.display = c.innerText.toUpperCase().includes(f) ? "" : "none";
    });
}
// Edit Function - इसे script.js में कहीं भी पेस्ट करें
function editMotor(id) {
    const tx = db.transaction("motors", "readonly");
    const store = tx.objectStore("motors");
    
    store.get(id).onsuccess = (e) => {
        const m = e.target.result;
        
        // फॉर्म में पुराना डेटा भरना
        document.getElementById('motorName').value = m.name;
        document.getElementById('idSize').value = m.idSize || "";
        document.getElementById('stamping').value = m.stamping || "";
        
        document.getElementById('rSWG').value = m.running.swg || "";
        document.getElementById('rTurns').value = m.running.turns || "";
        document.getElementById('rLength').value = m.running.length || "";
        
        document.getElementById('sSWG').value = m.starting.swg || "";
        document.getElementById('sTurns').value = m.starting.turns || "";
        document.getElementById('sLength').value = m.starting.length || "";

        // हम 'save' बटन के व्यवहार को बदलेंगे ताकि वह नया बनाने के बजाय पुराने को अपडेट करे
        const form = document.getElementById('windingForm');
        
        // पुराने सबमिट इवेंट को हटाकर नया अपडेट वाला इवेंट जोड़ना
        form.onsubmit = async (event) => {
            event.preventDefault();
            
            const file = document.getElementById('photoInput').files[0];
            let base64 = m.pic; // पुरानी फोटो रखना अगर नई नहीं चुनी गई

            if(file) {
                base64 = await new Promise(resolve => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.readAsDataURL(file);
                });
            }

            const updatedData = {
                id: id, // पुरानी ID ही इस्तेमाल करें
                name: document.getElementById('motorName').value,
                idSize: document.getElementById('idSize').value,
                stamping: document.getElementById('stamping').value,
                running: { 
                    swg: document.getElementById('rSWG').value, 
                    turns: document.getElementById('rTurns').value, 
                    length: document.getElementById('rLength').value 
                },
                starting: { 
                    swg: document.getElementById('sSWG').value, 
                    turns: document.getElementById('sTurns').value, 
                    length: document.getElementById('sLength').value 
                },
                pic: base64
            };

            const updateTx = db.transaction("motors", "readwrite");
            updateTx.objectStore("motors").put(updatedData); // .put() पुराने डेटा को अपडेट कर देता है
            
            updateTx.oncomplete = () => {
                alert("डाटा अपडेट हो गया!");
                closeForm();
                closeDetails();
                loadMotors();
                // फॉर्म को वापस 'Add New' मोड में सेट करना
                resetFormToNormal();
            };
        };

        closeDetails(); // डिटेल्स वाला पर्दा बंद करें
        openForm();     // फॉर्म वाला पर्दा खोलें
        document.querySelector('#entryModal h2').innerText = "डाटा सुधारें"; // टाइटल बदलें
    };
}

// फॉर्म को वापस सामान्य मोड में लाने के लिए
function resetFormToNormal() {
    const form = document.getElementById('windingForm');
    document.querySelector('#entryModal h2').innerText = "नई एंट्री जोड़ें";
    
    form.onsubmit = async (e) => {
        // यहाँ वही ओरिजिनल 'save' वाला कोड रहेगा जो script.js में पहले से है
        // पेज रिफ्रेश करने पर यह अपने आप ठीक हो जाएगा
        location.reload(); 
    };
}
