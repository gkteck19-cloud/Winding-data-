let db;
const DB_NAME = "MaaBhagawatiDB";
const STORE_NAME = "motors";

// डेटाबेस वर्शन 9 (ताकि सब कुछ फ्रेश रहे)
const request = indexedDB.open(DB_NAME, 9);

request.onupgradeneeded = (e) => {
    db = e.target.result;
    if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
    }
};

request.onsuccess = (e) => {
    db = e.target.result;
    loadMotors();
};

// 1. फॉर्म कंट्रोल (Add/Edit Mode)
function openForm() {
    document.getElementById('windingForm').reset();
    document.getElementById('editId').value = "";
    document.getElementById('formTitle').innerText = "नया डेटा जोड़ें";
    document.getElementById('saveBtn').innerText = "डेटा सेव करें";
    document.getElementById('entryModal').classList.remove('hidden');
}

function closeForm() { document.getElementById('entryModal').classList.add('hidden'); }
function closeDetails() { document.getElementById('detailsModal').classList.add('hidden'); }

// 2. डेटा सेव और अपडेट फंक्शन
document.getElementById('windingForm').onsubmit = async (e) => {
    e.preventDefault();
    
    const editId = document.getElementById('editId').value;
    const file = document.getElementById('photoInput').files[0];
    let base64 = "";

    if (file) {
        base64 = await new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(file);
        });
    }

    const motorData = {
        name: document.getElementById('motorName').value,
        idSize: document.getElementById('idSize').value,
        odSize: document.getElementById('odSize').value,
        stamping: document.getElementById('stamping').value,
        slots: document.getElementById('slots').value,
        wireType: document.getElementById('wireType').value,
        running: {
            swg: document.getElementById('rSWG').value,
            turns: document.getElementById('rTurns').value,
            weight: document.getElementById('rWeight').value,
            length: document.getElementById('rLength').value
        },
        starting: {
            swg: document.getElementById('sSWG').value,
            turns: document.getElementById('sTurns').value,
            weight: document.getElementById('sWeight').value,
            length: document.getElementById('sLength').value
        }
    };

    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    if (editId) {
        motorData.id = parseInt(editId);
        // अगर फोटो नहीं बदली, तो पुरानी फोटो को सुरक्षित रखना
        const getOld = store.get(motorData.id);
        getOld.onsuccess = () => {
            motorData.pic = base64 || getOld.result.pic || "";
            store.put(motorData).onsuccess = () => finishSave();
        };
    } else {
        motorData.pic = base64;
        store.add(motorData).onsuccess = () => finishSave();
    }

    function finishSave() {
        alert("डेटा सुरक्षित हुआ!");
        closeForm();
        loadMotors();
    }
};

// 3. लिस्ट लोड फंक्शन
function loadMotors() {
    const list = document.getElementById('motorList');
    if (!list) return;
    list.innerHTML = "";
    const store = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME);
    store.openCursor().onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
            const m = cursor.value;
            list.innerHTML += `
                <div class="card p-4 rounded-xl shadow-lg flex justify-between items-center" onclick="showDetails(${m.id})">
                    <div>
                        <h3 class="font-bold text-orange-400 uppercase text-lg">${m.name}</h3>
                        <p class="text-[10px] text-slate-400 font-bold uppercase mt-1">स्लॉट: ${m.slots || '-'} | ${m.wireType || '-'}</p>
                    </div>
                    <span class="text-orange-500/50 text-2xl font-bold">❯</span>
                </div>`;
            cursor.continue();
        }
    };
}

// 4. एडिट फंक्शन (Data Fill Logic)
function editMotor(id) {
    db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(id).onsuccess = (e) => {
        const m = e.target.result;
        if (!m) return;

        document.getElementById('editId').value = m.id;
        document.getElementById('motorName').value = m.name;
        document.getElementById('idSize').value = m.idSize || "";
        document.getElementById('odSize').value = m.odSize || "";
        document.getElementById('stamping').value = m.stamping || "";
        document.getElementById('slots').value = m.slots || "";
        document.getElementById('wireType').value = m.wireType || "Copper";

        // रनिंग और स्टार्टिंग डेटा भरना
        document.getElementById('rSWG').value = m.running?.swg || "";
        document.getElementById('rTurns').value = m.running?.turns || "";
        document.getElementById('rWeight').value = m.running?.weight || "";
        document.getElementById('rLength').value = m.running?.length || "";
        document.getElementById('sSWG').value = m.starting?.swg || "";
        document.getElementById('sTurns').value = m.starting?.turns || "";
        document.getElementById('sWeight').value = m.starting?.weight || "";
        document.getElementById('sLength').value = m.starting?.length || "";

        document.getElementById('formTitle').innerText = "डेटा सुधारें";
        document.getElementById('saveBtn').innerText = "अपडेट करें";
        
        closeDetails();
        document.getElementById('entryModal').classList.remove('hidden');
    };
}

// 5. बैकअप फंक्शन (Export & Import)
function exportData() {
    db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).getAll().onsuccess = (e) => {
        const blob = new Blob([JSON.stringify(e.target.result)], {type: "application/json"});
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `Winding_Master_Backup_${new Date().toLocaleDateString()}.json`;
        a.click();
    };
}

function importData(event) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            const tx = db.transaction(STORE_NAME, "readwrite");
            const store = tx.objectStore(STORE_NAME);
            data.forEach(m => { delete m.id; store.add(m); });
            tx.oncomplete = () => { 
                alert("बैकअप लोड हुआ!"); 
                location.reload(); 
            };
        } catch(err) { alert("गलत फाइल!"); }
    };
    reader.readAsText(event.target.files[0]);
}

// 6. सर्च और डिलीट
function searchMotor() {
    let f = document.getElementById('searchInput').value.toUpperCase();
    document.querySelectorAll('.card').forEach(c => {
        c.style.display = c.innerText.toUpperCase().includes(f) ? "" : "none";
    });
}

function deleteData(id) {
    if(confirm("डिलीट करें?")) {
        db.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME).delete(id).onsuccess = () => {
            closeDetails(); loadMotors();
        };
    }
}

// डिटेल्स दिखाने का लॉजिक (showDetails) पहले जैसा ही रहेगा।

    getRequest.onsuccess = (e) => {
        const m = e.target.result;
        if (!m) return;

        // फॉर्म में पुरानी वैल्यू भरना
        document.getElementById('editId').value = m.id;
        document.getElementById('motorName').value = m.name;
        document.getElementById('idSize').value = m.idSize || "";
        document.getElementById('odSize').value = m.odSize || "";
        document.getElementById('stamping').value = m.stamping || "";
        document.getElementById('slots').value = m.slots || "";
        document.getElementById('wireType').value = m.wireType || "Copper";

        // रनिंग डेटा
        document.getElementById('rSWG').value = m.running?.swg || "";
        document.getElementById('rTurns').value = m.running?.turns || "";
        document.getElementById('rWeight').value = m.running?.weight || "";
        document.getElementById('rLength').value = m.running?.length || "";

        // स्टार्टिंग डेटा
        document.getElementById('sSWG').value = m.starting?.swg || "";
        document.getElementById('sTurns').value = m.starting?.turns || "";
        document.getElementById('sWeight').value = m.starting?.weight || "";
        document.getElementById('sLength').value = m.starting?.length || "";

        // UI अपडेट
        document.getElementById('formTitle').innerText = "डेटा सुधारें";
        document.getElementById('saveBtn').innerText = "अपडेट करें";
        
        closeDetails(); // डिटेल्स विंडो बंद करें
        document.getElementById('entryModal').classList.remove('hidden'); // फॉर्म खोलें
    };
}

// सेव और अपडेट लॉजिक
document.getElementById('windingForm').onsubmit = async (e) => {
    e.preventDefault();
    
    const editId = document.getElementById('editId').value;
    const file = document.getElementById('photoInput').files[0];
    let base64 = "";

    if (file) {
        base64 = await new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(file);
        });
    }

    const motorData = {
        name: document.getElementById('motorName').value,
        idSize: document.getElementById('idSize').value,
        odSize: document.getElementById('odSize').value,
        stamping: document.getElementById('stamping').value,
        slots: document.getElementById('slots').value,
        wireType: document.getElementById('wireType').value,
        running: {
            swg: document.getElementById('rSWG').value,
            turns: document.getElementById('rTurns').value,
            weight: document.getElementById('rWeight').value,
            length: document.getElementById('rLength').value
        },
        starting: {
            swg: document.getElementById('sSWG').value,
            turns: document.getElementById('sTurns').value,
            weight: document.getElementById('sWeight').value,
            length: document.getElementById('sLength').value
        }
    };

    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    if (editId) {
        motorData.id = parseInt(editId);
        // अगर नई फोटो नहीं चुनी, तो पुरानी फोटो बचाने के लिए
        const getOld = store.get(motorData.id);
        getOld.onsuccess = () => {
            if (!base64 && getOld.result.pic) motorData.pic = getOld.result.pic;
            else if (base64) motorData.pic = base64;
            store.put(motorData);
        };
    } else {
        if (base64) motorData.pic = base64;
        store.add(motorData);
    }

    tx.oncomplete = () => {
        alert("सफलतापूर्वक सुरक्षित हुआ!");
        closeForm();
        loadMotors();
    };
};

// लिस्ट लोड करना
function loadMotors() {
    const list = document.getElementById('motorList');
    if (!list) return;
    list.innerHTML = "";
    const store = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME);
    store.openCursor().onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
            const m = cursor.value;
            list.innerHTML += `
                <div class="card p-4 rounded-xl shadow-lg flex justify-between items-center" onclick="showDetails(${m.id})">
                    <div>
                        <h3 class="font-bold text-orange-400 uppercase text-lg">${m.name}</h3>
                        <p class="text-[10px] text-slate-400 font-bold uppercase mt-1">स्लॉट: ${m.slots || '-'} | ${m.wireType || '-'}</p>
                    </div>
                    <span class="text-orange-500/50 text-2xl font-bold">❯</span>
                </div>`;
            cursor.continue();
        }
    };
}

// डिटेल्स दिखाना
function showDetails(id) {
    db.transaction(STORE_NAME).objectStore(STORE_NAME).get(id).onsuccess = (e) => {
        const m = e.target.result;
        const details = document.getElementById('detailsContent');
        details.innerHTML = `
            ${m.pic ? `<img src="${m.pic}" class="bg-pic">` : '<div class="bg-slate-900 w-full h-full absolute inset-0"></div>'}
            <div class="content-overlay">
                <button onclick="closeDetails()" class="float-right text-white text-3xl">✕</button>
                <h2 class="text-3xl font-bold text-orange-500 uppercase mt-4 mb-2">${m.name}</h2>
                <div class="grid grid-cols-2 gap-2 mb-6 text-[11px] font-bold uppercase">
                    <div class="bg-black/60 p-2 rounded-xl border border-white/10 text-white text-center">ID/OD: ${m.idSize || '-'}/${m.odSize || '-'}</div>
                    <div class="bg-black/60 p-2 rounded-xl border border-white/10 text-white text-center">स्लॉट: ${m.slots || '-'}</div>
                    <div class="bg-black/60 p-2 rounded-xl border border-white/10 text-white text-center">कोर: ${m.stamping || '-'}</div>
                    <div class="bg-black/60 p-2 rounded-xl border border-white/10 text-white text-center">वायर: ${m.wireType || '-'}</div>
                </div>
                <div class="space-y-3">
                    <div class="bg-blue-600/20 p-4 rounded-xl border border-blue-400/30">
                        <p class="text-blue-400 font-bold mb-2 uppercase text-[10px] tracking-widest text-center border-b border-blue-900/30 pb-1">Running</p>
                        <div class="grid grid-cols-2 text-xs gap-y-1">
                            <p>SWG: <b class="text-white">${m.running.swg}</b></p>
                            <p>Turns: <b class="text-white">${m.running.turns}</b></p>
                            <p>Weight: <b class="text-white">${m.running.weight}g</b></p>
                            <p>Length: <b class="text-white">${m.running.length}</b></p>
                        </div>
                    </div>
                    <div class="bg-green-600/20 p-4 rounded-xl border border-green-400/30">
                        <p class="text-green-400 font-bold mb-2 uppercase text-[10px] tracking-widest text-center border-b border-green-900/30 pb-1">Starting</p>
                        <div class="grid grid-cols-2 text-xs gap-y-1">
                            <p>SWG: <b class="text-white">${m.starting.swg}</b></p>
                            <p>Turns: <b class="text-white">${m.starting.turns}</b></p>
                            <p>Weight: <b class="text-white">${m.starting.weight}g</b></p>
                            <p>Length: <b class="text-white">${m.starting.length}</b></p>
                        </div>
                    </div>
                </div>
                <div class="flex gap-2 mt-8">
                    <button onclick="editMotor(${m.id})" class="flex-grow bg-blue-600 text-white py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest">🛠 Edit</button>
                    <button onclick="deleteData(${m.id})" class="bg-red-500/20 text-red-500 px-6 py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest">🗑 Delete</button>
                </div>
            </div>`;
        document.getElementById('detailsModal').classList.remove('hidden');
    };
}

// डिलीट, एक्सपोर्ट, इम्पोर्ट और सर्च (पुराने कोड की तरह ही रखें)
function deleteData(id) {
    if(confirm("डिलीट करें?")) {
        db.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME).delete(id).onsuccess = () => {
            closeDetails(); loadMotors();
        };
    }
}

function exportData() {
    db.transaction(STORE_NAME).objectStore(STORE_NAME).getAll().onsuccess = (e) => {
        const blob = new Blob([JSON.stringify(e.target.result)], {type: "application/json"});
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = "Winding_Backup.json";
        a.click();
    };
}

function importData(event) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const data = JSON.parse(e.target.result);
        const tx = db.transaction(STORE_NAME, "readwrite");
        data.forEach(m => { delete m.id; tx.objectStore(STORE_NAME).add(m); });
        tx.oncomplete = () => { alert("बैकअप लोड हुआ!"); location.reload(); };
    };
    reader.readAsText(event.target.files[0]);
}

function searchMotor() {
    let f = document.getElementById('searchInput').value.toUpperCase();
    document.querySelectorAll('.card').forEach(c => {
        c.style.display = c.innerText.toUpperCase().includes(f) ? "" : "none";
    });
}
