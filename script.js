let db;
const request = indexedDB.open("MaaBhagawatiDB", 5);

request.onupgradeneeded = (e) => {
    db = e.target.result;
    if (!db.objectStoreNames.contains("motors")) {
        db.createObjectStore("motors", { keyPath: "id", autoIncrement: true });
    }
};

request.onsuccess = (e) => { db = e.target.result; loadMotors(); };

function openForm() { 
    document.getElementById('windingForm').reset(); 
    document.getElementById('editId').value = "";
    document.getElementById('modalTitle').innerText = "नया डेटा जोड़ें";
    document.getElementById('saveButton').innerText = "डेटा सेव करें";
    document.getElementById('entryModal').classList.remove('hidden'); 
}

function closeForm() { document.getElementById('entryModal').classList.add('hidden'); }

document.getElementById('windingForm').onsubmit = async (e) => {
    e.preventDefault();
    const file = document.getElementById('photoInput').files[0];
    const editId = document.getElementById('editId').value;
    
    let base64 = "";
    if(file) {
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

    if(base64) motorData.pic = base64;

    const tx = db.transaction("motors", "readwrite");
    const store = tx.objectStore("motors");

    if(editId) {
        motorData.id = parseInt(editId);
        store.get(motorData.id).onsuccess = (ev) => {
            const existing = ev.target.result;
            if(!base64 && existing.pic) motorData.pic = existing.pic;
            store.put(motorData);
        };
    } else {
        store.add(motorData);
    }

    tx.oncomplete = () => {
        alert(editId ? "डेटा सफलतापूर्वक अपडेट हुआ!" : "डेटा सफलतापूर्वक अपलोड हुआ!");
        closeForm();
        loadMotors();
    };
};

function loadMotors() {
    const list = document.getElementById('motorList');
    list.innerHTML = "";
    const store = db.transaction("motors").objectStore("motors");
    store.openCursor().onsuccess = (e) => {
        const cursor = e.target.result;
        if(cursor) {
            const m = cursor.value;
            list.innerHTML += `
                <div class="card p-4 rounded-xl shadow-md flex justify-between items-center" onclick="showDetails(${m.id})">
                    <div>
                        <h3 class="font-bold text-orange-400 uppercase text-lg">${m.name}</h3>
                        <p class="text-xs text-slate-400 italic">स्लॉट: ${m.slots} | स्टांपिंग: ${m.stamping}</p>
                    </div>
                    <span class="text-slate-600 text-2xl">❯</span>
                </div>`;
            cursor.continue();
        }
    };
}

function showDetails(id) {
    db.transaction("motors").objectStore("motors").get(id).onsuccess = (e) => {
        const m = e.target.result;
        const details = document.getElementById('detailsContent');
        details.innerHTML = `
            ${m.pic ? `<img src="${m.pic}" class="bg-pic">` : ''}
            <div class="content-overlay">
                <button onclick="closeDetails()" class="float-right text-white text-3xl">✕</button>
                <h2 class="text-3xl font-bold text-orange-500 uppercase mt-4 mb-2">${m.name}</h2>
                
                <div class="grid grid-cols-2 gap-3 mb-6">
                    <div class="bg-black/60 p-3 rounded-xl border border-white/10">
                        <p class="text-[10px] text-slate-400 uppercase">Size (ID/OD)</p>
                        <p class="font-bold text-sm text-white">${m.idSize || '-'} / ${m.odSize || '-'}</p>
                    </div>
                    <div class="bg-black/60 p-3 rounded-xl border border-white/10">
                        <p class="text-[10px] text-slate-400 uppercase">Slots/Stamp</p>
                        <p class="font-bold text-sm text-white">${m.slots || '-'} / ${m.stamping || '-'}</p>
                    </div>
                </div>

                <div class="space-y-4">
                    <div class="bg-blue-600/20 p-4 rounded-xl border border-blue-400/30 shadow-xl">
                        <p class="font-bold text-blue-400 border-b border-blue-400/20 mb-2 uppercase text-xs">Running Data</p>
                        <div class="grid grid-cols-2 text-sm gap-y-1">
                            <p class="text-slate-300">SWG: <b class="text-white">${m.running.swg}</b></p>
                            <p class="text-slate-300">Turns: <b class="text-white">${m.running.turns}</b></p>
                            <p class="text-slate-300">Weight: <b class="text-white">${m.running.weight}g</b></p>
                            <p class="text-blue-200 font-bold">Length: <b>${m.running.length}</b></p>
                        </div>
                    </div>

                    <div class="bg-green-600/20 p-4 rounded-xl border border-green-400/30 shadow-xl">
                        <p class="font-bold text-green-400 border-b border-green-400/20 mb-2 uppercase text-xs">Starting Data</p>
                        <div class="grid grid-cols-2 text-sm gap-y-1">
                            <p class="text-slate-300">SWG: <b class="text-white">${m.starting.swg}</b></p>
                            <p class="text-slate-300">Turns: <b class="text-white">${m.starting.turns}</b></p>
                            <p class="text-slate-300">Weight: <b class="text-white">${m.starting.weight}g</b></p>
                            <p class="text-green-200 font-bold">Length: <b>${m.starting.length}</b></p>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-3 mt-8">
                    <button onclick="editData(${m.id})" class="bg-blue-600 text-white font-bold py-3 rounded-lg shadow-lg">सुधारें (Edit)</button>
                    <button onclick="deleteData(${m.id})" class="bg-red-500/80 text-white font-bold py-3 rounded-lg shadow-lg">डिलीट</button>
                </div>
            </div>
        `;
        document.getElementById('detailsModal').classList.remove('hidden');
    };
}

function closeDetails() { document.getElementById('detailsModal').classList.add('hidden'); }

function editData(id) {
    db.transaction("motors").objectStore("motors").get(id).onsuccess = (e) => {
        const m = e.target.result;
        document.getElementById('editId').value = m.id;
        document.getElementById('motorName').value = m.name;
        document.getElementById('idSize').value = m.idSize;
        document.getElementById('odSize').value = m.odSize;
        document.getElementById('stamping').value = m.stamping;
        document.getElementById('slots').value = m.slots;
        document.getElementById('rSWG').value = m.running.swg;
        document.getElementById('rTurns').value = m.running.turns;
        document.getElementById('rWeight').value = m.running.weight;
        document.getElementById('rLength').value = m.running.length;
        document.getElementById('sSWG').value = m.starting.swg;
        document.getElementById('sTurns').value = m.starting.turns;
        document.getElementById('sWeight').value = m.starting.weight;
        document.getElementById('sLength').value = m.starting.length;

        document.getElementById('modalTitle').innerText = "डेटा सुधारें";
        document.getElementById('saveButton').innerText = "अपडेट करें";
        
        closeDetails();
        document.getElementById('entryModal').classList.remove('hidden');
    };
}

function deleteData(id) {
    if(confirm("क्या आप वाकई इस डेटा को हटाना चाहते हैं?")) {
        db.transaction("motors", "readwrite").objectStore("motors").delete(id).onsuccess = () => {
            closeDetails(); loadMotors();
        };
    }
}

function exportData() {
    db.transaction("motors").objectStore("motors").getAll().onsuccess = (e) => {
        const data = JSON.stringify(e.target.result);
        const blob = new Blob([data], {type: "application/json"});
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `Winding_Backup_${new Date().toLocaleDateString()}.json`;
        a.click();
    };
}

function importData(event) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            const tx = db.transaction("motors", "readwrite");
            data.forEach(m => { delete m.id; tx.objectStore("motors").add(m); });
            tx.oncomplete = () => { alert("पुराना बैकअप सफलता से लोड हो गया!"); loadMotors(); };
        } catch(err) { alert("गलत फाइल फॉर्मेट!"); }
    };
    reader.readAsText(event.target.files[0]);
}

function searchMotor() {
    let f = document.getElementById('searchInput').value.toUpperCase();
    document.querySelectorAll('.card').forEach(c => {
        c.style.display = c.innerText.toUpperCase().includes(f) ? "" : "none";
    });
}
            weight: document.getElementById('rWeight').value, 
            length: document.getElementById('rLength').value 
        },
        starting: { 
            swg: document.getElementById('sSWG').value, 
            turns: document.getElementById('sTurns').value, 
            weight: document.getElementById('sWeight').value, 
            length: document.getElementById('sLength').value 
        },
        pic: base64
    };

    const tx = db.transaction("motors", "readwrite");
    tx.objectStore("motors").add(motorData);
    tx.oncomplete = () => {
        alert("डेटा सफलतापूर्वक अपलोड हुआ!");
        closeForm();
        loadMotors();
    };
};

function loadMotors() {
    const list = document.getElementById('motorList');
    list.innerHTML = "";
    const store = db.transaction("motors").objectStore("motors");
    store.openCursor().onsuccess = (e) => {
        const cursor = e.target.result;
        if(cursor) {
            const m = cursor.value;
            list.innerHTML += `
                <div class="card p-4 rounded-xl shadow-lg flex justify-between items-center" onclick="showDetails(${m.id})">
                    <div>
                        <h3 class="font-bold text-orange-400 uppercase text-lg">${m.name}</h3>
                        <p class="text-xs text-slate-400 italic">स्लॉट: ${m.slots} | स्टांपिंग: ${m.stamping}</p>
                    </div>
                    <span class="text-slate-600 text-2xl">❯</span>
                </div>`;
            cursor.continue();
        }
    };
}

function showDetails(id) {
    db.transaction("motors").objectStore("motors").get(id).onsuccess = (e) => {
        const m = e.target.result;
        const details = document.getElementById('detailsContent');
        details.innerHTML = `
            ${m.pic ? `<img src="${m.pic}" class="bg-pic">` : ''}
            <div class="content-overlay">
                <button onclick="closeDetails()" class="float-right text-white text-3xl">✕</button>
                <h2 class="text-3xl font-bold text-orange-500 uppercase mt-4 mb-2">${m.name}</h2>
                
                <div class="grid grid-cols-2 gap-3 mb-6">
                    <div class="bg-black/60 p-3 rounded-xl border border-white/10">
                        <p class="text-[10px] text-slate-400 uppercase">Size (ID/OD)</p>
                        <p class="font-bold text-sm">${m.idSize || '-'} / ${m.odSize || '-'}</p>
                    </div>
                    <div class="bg-black/60 p-3 rounded-xl border border-white/10">
                        <p class="text-[10px] text-slate-400 uppercase">Slots/Stamp</p>
                        <p class="font-bold text-sm">${m.slots || '-'} / ${m.stamping || '-'}</p>
                    </div>
                </div>

                <div class="space-y-4">
                    <div class="bg-blue-600/20 p-4 rounded-xl border border-blue-400/30 shadow-xl">
                        <p class="font-bold text-blue-400 border-b border-blue-400/20 mb-2 uppercase text-xs">Running Data</p>
                        <div class="grid grid-cols-2 text-sm gap-y-1">
                            <p>SWG: <b>${m.running.swg}</b></p>
                            <p>Turns: <b>${m.running.turns}</b></p>
                            <p>Weight: <b>${m.running.weight}g</b></p>
                            <p class="text-blue-200">Length: <b>${m.running.length}</b></p>
                        </div>
                    </div>

                    <div class="bg-green-600/20 p-4 rounded-xl border border-green-400/30 shadow-xl">
                        <p class="font-bold text-green-400 border-b border-green-400/20 mb-2 uppercase text-xs">Starting Data</p>
                        <div class="grid grid-cols-2 text-sm gap-y-1">
                            <p>SWG: <b>${m.starting.swg}</b></p>
                            <p>Turns: <b>${m.starting.turns}</b></p>
                            <p>Weight: <b>${m.starting.weight}g</b></p>
                            <p class="text-green-200">Length: <b>${m.starting.length}</b></p>
                        </div>
                    </div>
                </div>

                <button onclick="deleteData(${m.id})" class="mt-10 text-red-500 text-xs font-bold uppercase tracking-widest border border-red-500/20 px-4 py-2 rounded-lg">डेटा डिलीट करें</button>
            </div>
        `;
        document.getElementById('detailsModal').classList.remove('hidden');
    };
}

function closeDetails() { document.getElementById('detailsModal').classList.add('hidden'); }

function deleteData(id) {
    if(confirm("क्या आप वाकई इस डेटा को हटाना चाहते हैं?")) {
        db.transaction("motors", "readwrite").objectStore("motors").delete(id).onsuccess = () => {
            closeDetails(); loadMotors();
        };
    }
}

function exportData() {
    db.transaction("motors").objectStore("motors").getAll().onsuccess = (e) => {
        const data = JSON.stringify(e.target.result);
        const blob = new Blob([data], {type: "application/json"});
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `Maa_Bhagawati_Winding_Backup_${new Date().toLocaleDateString()}.json`;
        a.click();
    };
}

function importData(event) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            const tx = db.transaction("motors", "readwrite");
            data.forEach(m => { delete m.id; tx.objectStore("motors").add(m); });
            tx.oncomplete = () => { alert("पुराना बैकअप सफलता से लोड हो गया!"); loadMotors(); };
        } catch(err) { alert("गलत फाइल फॉर्मेट!"); }
    };
    reader.readAsText(event.target.files[0]);
}

function searchMotor() {
    let f = document.getElementById('searchInput').value.toUpperCase();
    document.querySelectorAll('.card').forEach(c => {
        c.style.display = c.innerText.toUpperCase().includes(f) ? "" : "none";
    });
}
}

function closeForm() {
    document.getElementById('entryModal').classList.add('hidden');
}

function closeDetails() {
    document.getElementById('detailsModal').classList.add('hidden');
}

// --- 2. SAVE & EDIT DATA FUNCTION ---
document.getElementById('windingForm').onsubmit = async (e) => {
    e.preventDefault();
    
    if (!db) return alert("Database तैयार नहीं है।");

    const editId = document.getElementById('editId').value;
    const file = document.getElementById('photoInput').files[0];
    let base64 = "";

    // फोटो प्रोसेसिंग
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
        // UPDATE MODE
        motorData.id = parseInt(editId);
        // पुरानी फोटो को बचाने का लॉजिक
        const getRequest = store.get(motorData.id);
        getRequest.onsuccess = () => {
            motorData.pic = base64 || getRequest.result.pic || "";
            store.put(motorData).onsuccess = () => finishAction("डेटा अपडेट हुआ!");
        };
    } else {
        // ADD NEW MODE
        motorData.pic = base64;
        store.add(motorData).onsuccess = () => finishAction("डेटा सेव हुआ!");
    }

    function finishAction(msg) {
        alert(msg);
        closeForm();
        loadMotors();
    }
};

// --- 3. LOAD DATA (LIST VIEW) ---
function loadMotors() {
    const list = document.getElementById('motorList');
    if (!list || !db) return;
    list.innerHTML = "";

    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    
    store.openCursor().onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
            const m = cursor.value;
            list.innerHTML += `
                <div class="card p-4 rounded-xl shadow-lg flex justify-between items-center" onclick="showDetails(${m.id})">
                    <div>
                        <h3 class="font-bold text-orange-400 uppercase text-lg leading-tight">${m.name}</h3>
                        <p class="text-[10px] text-slate-400 font-bold uppercase mt-1">स्लॉट: ${m.slots || '-'} | ${m.wireType || '-'}</p>
                    </div>
                    <span class="text-orange-500/50 text-2xl font-bold">❯</span>
                </div>`;
            cursor.continue();
        }
    };
}

// --- 4. SHOW DETAILS MODAL ---
function showDetails(id) {
    const tx = db.transaction(STORE_NAME, "readonly");
    tx.objectStore(STORE_NAME).get(id).onsuccess = (e) => {
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
                            <p>Wt: <b class="text-white">${m.running.weight}g</b></p>
                            <p>L: <b class="text-white">${m.running.length}</b></p>
                        </div>
                    </div>
                    <div class="bg-green-600/20 p-4 rounded-xl border border-green-400/30">
                        <p class="text-green-400 font-bold mb-2 uppercase text-[10px] tracking-widest text-center border-b border-green-900/30 pb-1">Starting</p>
                        <div class="grid grid-cols-2 text-xs gap-y-1">
                            <p>SWG: <b class="text-white">${m.starting.swg}</b></p>
                            <p>Turns: <b class="text-white">${m.starting.turns}</b></p>
                            <p>Wt: <b class="text-white">${m.starting.weight}g</b></p>
                            <p>L: <b class="text-white">${m.starting.length}</b></p>
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

// --- 5. EDIT DATA FILL FUNCTION ---
function editMotor(id) {
    const tx = db.transaction(STORE_NAME, "readonly");
    tx.objectStore(STORE_NAME).get(id).onsuccess = (e) => {
        const m = e.target.result;
        if (!m) return;

        document.getElementById('editId').value = m.id;
        document.getElementById('motorName').value = m.name;
        document.getElementById('idSize').value = m.idSize || "";
        document.getElementById('odSize').value = m.odSize || "";
        document.getElementById('stamping').value = m.stamping || "";
        document.getElementById('slots').value = m.slots || "";
        document.getElementById('wireType').value = m.wireType || "Copper";

        // Coils
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

// --- 6. BACKUP FUNCTIONS (EXPORT/IMPORT) ---
function exportData() {
    if (!db) return;
    db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).getAll().onsuccess = (e) => {
        const data = JSON.stringify(e.target.result);
        const blob = new Blob([data], {type: "application/json"});
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `Winding_Backup_${new Date().toLocaleDateString()}.json`;
        a.click();
    };
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            const tx = db.transaction(STORE_NAME, "readwrite");
            const store = tx.objectStore(STORE_NAME);
            
            data.forEach(m => {
                delete m.id; // फ्रेश आईडी देने के लिए पुरानी आईडी डिलीट करें
                store.add(m);
            });

            tx.oncomplete = () => {
                alert("बैकअप लोड हुआ!");
                location.reload(); // पेज ताज़ा करें ताकि डेटा दिखे
            };
        } catch(err) {
            alert("गलत फाइल फॉर्मेट!");
        }
    };
    reader.readAsText(file);
}

// --- 7. DELETE & SEARCH ---
function deleteData(id) {
    if(confirm("डिलीट करें?")) {
        db.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME).delete(id).onsuccess = () => {
            closeDetails();
            loadMotors();
        };
    }
}

function searchMotor() {
    let f = document.getElementById('searchInput').value.toUpperCase();
    document.querySelectorAll('.card').forEach(c => {
        c.style.display = c.innerText.toUpperCase().includes(f) ? "" : "none";
    });
          }
                  weight: document.getElementById('rWeight').value, 
            length: document.getElementById('rLength').value 
        },
        starting: { 
            swg: document.getElementById('sSWG').value, 
            turns: document.getElementById('sTurns').value, 
            weight: document.getElementById('sWeight').value, 
            length: document.getElementById('sLength').value 
        },
        pic: base64
    };

    const tx = db.transaction("motors", "readwrite");
    tx.objectStore("motors").add(motorData);
    tx.oncomplete = () => {
        alert("डेटा सफलतापूर्वक अपलोड हुआ!");
        closeForm();
        loadMotors();
    };
};

function loadMotors() {
    const list = document.getElementById('motorList');
    list.innerHTML = "";
    const store = db.transaction("motors").objectStore("motors");
    store.openCursor().onsuccess = (e) => {
        const cursor = e.target.result;
        if(cursor) {
            const m = cursor.value;
            list.innerHTML += `
                <div class="card p-4 rounded-xl shadow-lg flex justify-between items-center" onclick="showDetails(${m.id})">
                    <div>
                        <h3 class="font-bold text-orange-400 uppercase text-lg">${m.name}</h3>
                        <p class="text-xs text-slate-400 italic">स्लॉट: ${m.slots} | स्टांपिंग: ${m.stamping}</p>
                    </div>
                    <span class="text-slate-600 text-2xl">❯</span>
                </div>`;
            cursor.continue();
        }
    };
}

function showDetails(id) {
    db.transaction("motors").objectStore("motors").get(id).onsuccess = (e) => {
        const m = e.target.result;
        const details = document.getElementById('detailsContent');
        details.innerHTML = `
            ${m.pic ? `<img src="${m.pic}" class="bg-pic">` : ''}
            <div class="content-overlay">
                <button onclick="closeDetails()" class="float-right text-white text-3xl">✕</button>
                <h2 class="text-3xl font-bold text-orange-500 uppercase mt-4 mb-2">${m.name}</h2>
                
                <div class="grid grid-cols-2 gap-3 mb-6">
                    <div class="bg-black/60 p-3 rounded-xl border border-white/10">
                        <p class="text-[10px] text-slate-400 uppercase">Size (ID/OD)</p>
                        <p class="font-bold text-sm">${m.idSize || '-'} / ${m.odSize || '-'}</p>
                    </div>
                    <div class="bg-black/60 p-3 rounded-xl border border-white/10">
                        <p class="text-[10px] text-slate-400 uppercase">Slots/Stamp</p>
                        <p class="font-bold text-sm">${m.slots || '-'} / ${m.stamping || '-'}</p>
                    </div>
                </div>

                <div class="space-y-4">
                    <div class="bg-blue-600/20 p-4 rounded-xl border border-blue-400/30 shadow-xl">
                        <p class="font-bold text-blue-400 border-b border-blue-400/20 mb-2 uppercase text-xs">Running Data</p>
                        <div class="grid grid-cols-2 text-sm gap-y-1">
                            <p>SWG: <b>${m.running.swg}</b></p>
                            <p>Turns: <b>${m.running.turns}</b></p>
                            <p>Weight: <b>${m.running.weight}g</b></p>
                            <p class="text-blue-200">Length: <b>${m.running.length}</b></p>
                        </div>
                    </div>

                    <div class="bg-green-600/20 p-4 rounded-xl border border-green-400/30 shadow-xl">
                        <p class="font-bold text-green-400 border-b border-green-400/20 mb-2 uppercase text-xs">Starting Data</p>
                        <div class="grid grid-cols-2 text-sm gap-y-1">
                            <p>SWG: <b>${m.starting.swg}</b></p>
                            <p>Turns: <b>${m.starting.turns}</b></p>
                            <p>Weight: <b>${m.starting.weight}g</b></p>
                            <p class="text-green-200">Length: <b>${m.starting.length}</b></p>
                        </div>
                    </div>
                </div>

                <button onclick="deleteData(${m.id})" class="mt-10 text-red-500 text-xs font-bold uppercase tracking-widest border border-red-500/20 px-4 py-2 rounded-lg">डेटा डिलीट करें</button>
            </div>
        `;
        document.getElementById('detailsModal').classList.remove('hidden');
    };
}

function closeDetails() { document.getElementById('detailsModal').classList.add('hidden'); }

function deleteData(id) {
    if(confirm("क्या आप वाकई इस डेटा को हटाना चाहते हैं?")) {
        db.transaction("motors", "readwrite").objectStore("motors").delete(id).onsuccess = () => {
            closeDetails(); loadMotors();
        };
    }
}

function exportData() {
    db.transaction("motors").objectStore("motors").getAll().onsuccess = (e) => {
        const data = JSON.stringify(e.target.result);
        const blob = new Blob([data], {type: "application/json"});
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `Maa_Bhagawati_Winding_Backup_${new Date().toLocaleDateString()}.json`;
        a.click();
    };
}

function importData(event) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            const tx = db.transaction("motors", "readwrite");
            data.forEach(m => { delete m.id; tx.objectStore("motors").add(m); });
            tx.oncomplete = () => { alert("पुराना बैकअप सफलता से लोड हो गया!"); loadMotors(); };
        } catch(err) { alert("गलत फाइल फॉर्मेट!"); }
    };
    reader.readAsText(event.target.files[0]);
}

function searchMotor() {
    let f = document.getElementById('searchInput').value.toUpperCase();
    document.querySelectorAll('.card').forEach(c => {
        c.style.display = c.innerText.toUpperCase().includes(f) ? "" : "none";
    });
}
    const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `Winding_Backup_${new Date().toLocaleDateString()}.json`;
        a.click();
    };
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            const tx = db.transaction(STORE_NAME, "readwrite");
            const store = tx.objectStore(STORE_NAME);
            
            data.forEach(m => {
                delete m.id; // फ्रेश आईडी देने के लिए पुरानी आईडी डिलीट करें
                store.add(m);
            });

            tx.oncomplete = () => {
                alert("बैकअप लोड हुआ!");
                location.reload(); // पेज ताज़ा करें ताकि डेटा दिखे
            };
        } catch(err) {
            alert("गलत फाइल फॉर्मेट!");
        }
    };
    reader.readAsText(file);
}

// --- 7. DELETE & SEARCH ---
function deleteData(id) {
    if(confirm("डिलीट करें?")) {
        db.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME).delete(id).onsuccess = () => {
            closeDetails();
            loadMotors();
        };
    }
}

function searchMotor() {
    let f = document.getElementById('searchInput').value.toUpperCase();
    document.querySelectorAll('.card').forEach(c => {
        c.style.display = c.innerText.toUpperCase().includes(f) ? "" : "none";
    });
          }
      
