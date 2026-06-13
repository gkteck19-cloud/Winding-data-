let db;
const request = indexedDB.open("MaaBhagwatiDB", 6);

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

// चेक करने के लिए फंक्शन कि कहीं सेम नाम और कंपनी का मोटर पहले से तो नहीं है
function checkDuplicate(name, company) {
    return new Promise((resolve) => {
        let isDuplicate = false;
        const tx = db.transaction("motors", "readonly");
        const store = tx.objectStore("motors");
        
        store.openCursor().onsuccess = (e) => {
            const cursor = e.target.result;
            if (cursor) {
                if (cursor.value.name.trim().toUpperCase() === name.trim().toUpperCase() && 
                    (cursor.value.company || "").trim().toUpperCase() === company.trim().toUpperCase()) {
                    isDuplicate = true;
                    resolve(true);
                    return;
                }
                cursor.continue();
            } else {
                resolve(isDuplicate);
            }
        };
    });
}

document.getElementById('windingForm').onsubmit = async (e) => {
    e.preventDefault();
    const files = document.getElementById('photoInput').files;
    const editId = document.getElementById('editId').value;
    
    const mName = document.getElementById('motorName').value;
    const cName = document.getElementById('companyName').value;

    // अगर नया डेटा जोड़ रहे हैं, तो डुप्लीकेट चेक करेगा
    if (!editId) {
        const isDuplicate = await checkDuplicate(mName, cName);
        if (isDuplicate) {
            alert(`❌ रिकॉर्ड पहले से मौजूद है!\nइस कंपनी (${cName || 'No Company'}) और नाम (${mName}) की मोटर पहले से सेव्ड है।`);
            return;
        }
    }
    
    let picsArray = [];
    if(files.length > 0) {
        const maxFiles = Math.min(files.length, 5);
        for(let i=0; i<maxFiles; i++) {
            let base64 = await new Promise(resolve => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.readAsDataURL(files[i]);
            });
            picsArray.push(base64);
        }
    }

    const motorData = {
        name: mName,
        company: cName,
        stamping: document.getElementById('stamping').value,
        idSize: document.getElementById('idSize').value,
        odSize: document.getElementById('odSize').value,
        slots: document.getElementById('slots').value,
        wireType: document.getElementById('wireType').value,
        totalWeight: document.getElementById('totalWeight').value,
        paperSize: document.getElementById('paperSize').value,
        connection: document.getElementById('connection').value,
        condenser: document.getElementById('condenser').value,
        running: { 
            guage: document.getElementById('rGuage').value,
            pitch: document.getElementById('rPitch').value,
            round: document.getElementById('rRound').value,
            turns: document.getElementById('rTurns').value, 
            length: document.getElementById('rLength').value, 
            weight: document.getElementById('rWeight').value 
        },
        starting: { 
            guage: document.getElementById('sGuage').value,
            pitch: document.getElementById('sPitch').value,
            round: document.getElementById('sRound').value,
            turns: document.getElementById('sTurns').value, 
            length: document.getElementById('sLength').value, 
            weight: document.getElementById('sWeight').value 
        }
    };

    const tx = db.transaction("motors", "readwrite");
    const store = tx.objectStore("motors");

    if(editId) {
        motorData.id = parseInt(editId);
        store.get(motorData.id).onsuccess = (ev) => {
            const existing = ev.target.result;
            motorData.pics = picsArray.length > 0 ? picsArray : (existing.pics || []);
            store.put(motorData);
        };
    } else {
        motorData.pics = picsArray;
        store.add(motorData);
    }

    tx.oncomplete = () => {
        alert(editId ? "डेटा अपडेट हो गया!" : "नया रिकॉर्ड सुरक्षित हो गया!");
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
                        <h3 class="motor-title font-bold text-orange-400 uppercase text-lg">${m.name} ${m.company ? `(${m.company})` : ''}</h3>
                        <p class="text-xs text-slate-400 italic">स्लॉट: ${m.slots || '-'} | वायर: ${m.wireType || '-'} | स्टांपिंग: ${m.stamping || '-'}</p>
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
        
        let imagesHTML = "";
        if(m.pics && m.pics.length > 0) {
            imagesHTML = `<div class="flex gap-2 overflow-x-auto p-4 bg-slate-900/50">`;
            m.pics.forEach((picData, index) => {
                imagesHTML += `<img src="${picData}" class="bg-pic-slider" style="width: calc(100% / ${m.pics.length > 1 ? '1.2' : '1'}); flex-shrink: 0;" alt="Pic ${index+1}">`;
            });
            imagesHTML += `</div>`;
        }

        details.innerHTML = `
            <div class="content-overlay">
                <button onclick="closeDetails()" class="float-right text-white text-3xl">✕</button>
                <h2 class="text-2xl font-bold text-orange-500 uppercase mt-2">${m.name}</h2>
                <p class="text-sm text-slate-400 font-semibold border-b border-slate-700 pb-2 mb-4">कंपनी: ${m.company || '-'}</p>
                
                ${imagesHTML}

                <div class="grid grid-cols-2 gap-2 mb-4 text-xs">
                    <div class="bg-slate-700/50 p-2 rounded-lg">
                        <span class="text-slate-400 block">Stator Core/Stamp:</span>
                        <b class="text-white text-sm">${m.stamping || '-'}</b>
                    </div>
                    <div class="bg-slate-700/50 p-2 rounded-lg">
                        <span class="text-slate-400 block">ID / OD Size:</span>
                        <b class="text-white text-sm">${m.idSize || '-'} / ${m.odSize || '-'}</b>
                    </div>
                    <div class="bg-slate-700/50 p-2 rounded-lg">
                        <span class="text-slate-400 block">Slots / Wire Metal:</span>
                        <b class="text-white text-sm">${m.slots || '-'} / ${m.wireType || '-'}</b>
                    </div>
                    <div class="bg-slate-700/50 p-2 rounded-lg">
                        <span class="text-slate-400 block">कुल वायर वजन:</span>
                        <b class="text-white text-sm">${m.totalWeight ? m.totalWeight+'g' : '-'}</b>
                    </div>
                </div>

                <div class="bg-blue-600/10 p-3 rounded-xl border border-blue-400/20 shadow-md mb-3 text-xs">
                    <p class="font-bold text-blue-400 border-b border-blue-400/20 mb-2 uppercase text-[10px]">Running Coil Data</p>
                    <div class="grid grid-cols-3 gap-y-2">
                        <p class="text-slate-300">Guage: <b class="text-white text-sm block">${m.running.guage || '-'}</b></p>
                        <p class="text-slate-300">Pitch: <b class="text-white text-sm block">${m.running.pitch || '-'}</b></p>
                        <p class="text-slate-300">Round: <b class="text-white text-sm block">${m.running.round || '-'}</b></p>
                        <p class="text-slate-300">Turns: <b class="text-white text-sm block">${m.running.turns || '-'}</b></p>
                        <p class="text-slate-300">Coil Length: <b class="text-white text-sm block">${m.running.length || '-'}</b></p>
                        <p class="text-slate-300">Coil Weight: <b class="text-white text-sm block">${m.running.weight ? m.running.weight+'g' : '-'}</b></p>
                    </div>
                </div>

                <div class="bg-green-600/10 p-3 rounded-xl border border-green-400/20 shadow-md mb-3 text-xs">
                    <p class="font-bold text-green-400 border-b border-green-400/20 mb-2 uppercase text-[10px]">Starting Coil Data</p>
                    <div class="grid grid-cols-3 gap-y-2">
                        <p class="text-slate-300">Guage: <b class="text-white text-sm block">${m.starting.guage || '-'}</b></p>
                        <p class="text-slate-300">Pitch: <b class="text-white text-sm block">${m.starting.pitch || '-'}</b></p>
                        <p class="text-slate-300">Round: <b class="text-white text-sm block">${m.starting.round || '-'}</b></p>
                        <p class="text-slate-300">Turns: <b class="text-white text-sm block">${m.starting.turns || '-'}</b></p>
                        <p class="text-slate-300">Coil Length: <b class="text-white text-sm block">${m.starting.length || '-'}</b></p>
                        <p class="text-slate-300">Coil Weight: <b class="text-white text-sm block">${m.starting.weight ? m.starting.weight+'g' : '-'}</b></p>
                    </div>
                </div>

                <div class="bg-slate-700/30 p-3 rounded-xl border border-slate-600/50 grid grid-cols-3 gap-2 text-xs mb-4">
                    <div>
                        <span class="text-slate-400 block">पेपर साइज (L×H):</span>
                        <b class="text-white">${m.paperSize || '-'}</b>
                    </div>
                    <div>
                        <span class="text-slate-400 block">कनेक्शन:</span>
                        <b class="text-white">${m.connection || '-'}</b>
                    </div>
                    <div>
                        <span class="text-slate-400 block">कंडेंसर:</span>
                        <b class="text-white">${m.condenser || '-'}</b>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-3 mt-4">
                    <button onclick="editData(${m.id})" class="bg-blue-600 text-white font-bold py-2.5 rounded-lg text-sm shadow-md">सुधारें (Edit)</button>
                    <button onclick="deleteData(${m.id})" class="bg-red-500/80 text-white font-bold py-2.5 rounded-lg text-sm shadow-md">डिलीट</button>
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
        document.getElementById('companyName').value = m.company || "";
        document.getElementById('stamping').value = m.stamping || "";
        document.getElementById('idSize').value = m.idSize || "";
        document.getElementById('odSize').value = m.odSize || "";
        document.getElementById('slots').value = m.slots || "";
        document.getElementById('wireType').value = m.wireType || "Copper";
        document.getElementById('totalWeight').value = m.totalWeight || "";
        document.getElementById('paperSize').value = m.paperSize || "";
        document.getElementById('connection').value = m.connection || "";
        document.getElementById('condenser').value = m.condenser || "";
        
        document.getElementById('rGuage').value = m.running.guage || "";
        document.getElementById('rPitch').value = m.running.pitch || "";
        document.getElementById('rRound').value = m.running.round || "";
        document.getElementById('rTurns').value = m.running.turns || "";
        document.getElementById('rWeight').value = m.running.weight || "";
        document.getElementById('rLength').value = m.running.length || "";

        document.getElementById('sGuage').value = m.starting.guage || "";
        document.getElementById('sPitch').value = m.starting.pitch || "";
        document.getElementById('sRound').value = m.starting.round || "";
        document.getElementById('sTurns').value = m.starting.turns || "";
        document.getElementById('sWeight').value = m.starting.weight || "";
        document.getElementById('sLength').value = m.starting.length || "";

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
        a.download = `Maa_Bhagwati_Winding_Advanced_Backup_${new Date().toLocaleDateString()}.json`;
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
            tx.oncomplete = () => { alert("बैकअप सफलतापूर्वक लोड हो गया!"); loadMotors(); };
        } catch(err) { alert("गलत फाइल फॉर्मेट!"); }
    };
    reader.readAsText(event.target.files[0]);
}

function searchMotor() {
    let filter = document.getElementById('searchInput').value.toUpperCase();
    document.querySelectorAll('.card').forEach(card => {
        let nameText = card.querySelector('.motor-title').innerText.toUpperCase();
        card.style.display = nameText.includes(filter) ? "" : "none";
    });
  }
          
