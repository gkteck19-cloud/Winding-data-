let db;
const request = indexedDB.open("MaaBhagawatiDB", 5);

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

// Form Functions
function openForm() { 
    document.getElementById('windingForm').reset(); 
    document.getElementById('entryModal').classList.remove('hidden'); 
}

function closeForm() { 
    document.getElementById('entryModal').classList.add('hidden'); 
}

function closeDetails() { 
    document.getElementById('detailsModal').classList.add('hidden'); 
}

// Save Data
document.getElementById('windingForm').onsubmit = async (e) => {
    e.preventDefault();
    const file = document.getElementById('photoInput').files[0];
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
        },
        pic: base64
    };

    const tx = db.transaction("motors", "readwrite");
    tx.objectStore("motors").add(motorData);
    tx.oncomplete = () => {
        alert("डेटा सफलतापूर्वक सुरक्षित हुआ!");
        closeForm();
        loadMotors();
    };
};

// Load List
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
                    <span class="text-slate-600 text-2xl font-bold">❯</span>
                </div>`;
            cursor.continue();
        }
    };
}

// Show Details
function showDetails(id) {
    db.transaction("motors").objectStore("motors").get(id).onsuccess = (e) => {
        const m = e.target.result;
        const details = document.getElementById('detailsContent');
        details.innerHTML = `
            ${m.pic ? `<img src="${m.pic}" class="bg-pic">` : ''}
            <div class="content-overlay">
                <button onclick="closeDetails()" class="float-right text-white text-3xl font-bold">✕</button>
                <h2 class="text-3xl font-bold text-orange-500 uppercase mt-4 mb-2">${m.name}</h2>
                
                <div class="grid grid-cols-2 gap-3 mb-6">
                    <div class="bg-black/60 p-3 rounded-xl border border-white/10 text-center">
                        <p class="text-[10px] text-slate-400 uppercase tracking-widest">ID / OD Size</p>
                        <p class="font-bold text-sm">${m.idSize || '-'} / ${m.odSize || '-'}</p>
                    </div>
                    <div class="bg-black/60 p-3 rounded-xl border border-white/10 text-center">
                        <p class="text-[10px] text-slate-400 uppercase tracking-widest">Slots / Stamp</p>
                        <p class="font-bold text-sm">${m.slots || '-'} / ${m.stamping || '-'}</p>
                    </div>
                </div>

                <div class="space-y-4">
                    <div class="bg-blue-600/20 p-4 rounded-xl border border-blue-400/30 shadow-xl">
                        <p class="font-bold text-blue-400 border-b border-blue-400/20 mb-2 uppercase text-xs">Running Coil (रनिंग)</p>
                        <div class="grid grid-cols-2 text-sm gap-y-1">
                            <p>SWG: <b>${m.running.swg || '-'}</b></p>
                            <p>Turns: <b>${m.running.turns || '-'}</b></p>
                            <p>Weight: <b>${m.running.weight || '-'}g</b></p>
                            <p class="text-blue-200">Length: <b>${m.running.length || '-'}</b></p>
                        </div>
                    </div>

                    <div class="bg-green-600/20 p-4 rounded-xl border border-green-400/30 shadow-xl">
                        <p class="font-bold text-green-400 border-b border-green-400/20 mb-2 uppercase text-xs">Starting Coil (स्टार्टिंग)</p>
                        <div class="grid grid-cols-2 text-sm gap-y-1">
                            <p>SWG: <b>${m.starting.swg || '-'}</b></p>
                            <p>Turns: <b>${m.starting.turns || '-'}</b></p>
                            <p>Weight: <b>${m.starting.weight || '-'}g</b></p>
                            <p class="text-green-200">Length: <b>${m.starting.length || '-'}</b></p>
                        </div>
                    </div>
                </div>

                <button onclick="deleteData(${m.id})" class="mt-10 w-full text-red-500 text-xs font-bold uppercase tracking-widest border border-red-500/20 px-4 py-4 rounded-xl">🗑 डेटा डिलीट करें</button>
            </div>
        `;
        document.getElementById('detailsModal').classList.remove('hidden');
    };
}

// Delete Data
function deleteData(id) {
    if(confirm("क्या आप वाकई इस डेटा को हटाना चाहते हैं?")) {
        db.transaction("motors", "readwrite").objectStore("motors").delete(id).onsuccess = () => {
            closeDetails(); 
            loadMotors();
        };
    }
}

// Backup (Export)
function exportData() {
    db.transaction("motors").objectStore("motors").getAll().onsuccess = (e) => {
        const data = JSON.stringify(e.target.result);
        const blob = new Blob([data], {type: "application/json"});
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `Winding_Master_Backup_${new Date().toLocaleDateString()}.json`;
        a.click();
    };
}

// Import (Load Backup)
function importData(event) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            const tx = db.transaction("motors", "readwrite");
            data.forEach(m => { 
                delete m.id; // New ID will be generated
                tx.objectStore("motors").add(m); 
            });
            tx.oncomplete = () => { 
                alert("बैकअप लोड हो गया!"); 
                loadMotors(); 
            };
        } catch(err) { 
            alert("गलत फाइल फॉर्मेट!"); 
        }
    };
    reader.readAsText(event.target.files[0]);
}

// Search Function
function searchMotor() {
    let f = document.getElementById('searchInput').value.toUpperCase();
    document.querySelectorAll('.card').forEach(c => {
        c.style.display = c.innerText.toUpperCase().includes(f) ? "" : "none";
    });
}
        rSwg: document.getElementById('rSwg').value,
        rTurns: document.getElementById('rTurns').value,
        rWeight: document.getElementById('rWeight').value,
        rLength: document.getElementById('rLength').value,
        sSwg: document.getElementById('sSwg').value,
        sTurns: document.getElementById('sTurns').value,
        sWeight: document.getElementById('sWeight').value,
        sLength: document.getElementById('sLength').value,
        date: new Date().toLocaleDateString('hi-IN')
    };

    const file = document.getElementById('photoFile').files[0];
    if(file) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => { 
            record.img = reader.result; 
            finalizeSave(record); 
        };
    } else { 
        finalizeSave(record); 
    }
}

function finalizeSave(record) {
    const tx = db.transaction("records", "readwrite");
    tx.objectStore("records").add(record);
    tx.oncomplete = () => { 
        alert("डेटा सुरक्षित हो गया!"); 
        closeModal('formModal'); 
        renderList(); 
    };
}

function renderList() {
    const term = document.getElementById('searchInput').value.toLowerCase();
    const tx = db.transaction("records", "readonly");
    tx.objectStore("records").getAll().onsuccess = (e) => {
        const list = document.getElementById('motorList');
        list.innerHTML = "";
        e.target.result.reverse().forEach(d => {
            if(d.name.toLowerCase().includes(term)) {
                list.innerHTML += `
                    <div onclick="viewData(${d.id})" class="bg-white p-4 rounded-2xl shadow-sm flex justify-between items-center border-l-8 border-orange-500 active:bg-orange-50 transition">
                        <div>
                            <h3 class="font-bold text-gray-800 uppercase text-lg leading-tight">${d.name}</h3>
                            <p class="text-[11px] text-gray-500 font-bold">SLOTS: ${d.slots} | STAMPING: ${d.stamping}</p>
                        </div>
                        <span class="text-orange-300 text-2xl">❯</span>
                    </div>`;
            }
        });
    };
}

function viewData(id) {
    const tx = db.transaction("records", "readonly");
    tx.objectStore("records").get(id).onsuccess = (e) => {
        const d = e.target.result;
        const content = document.getElementById('modalContent');
        content.innerHTML = `
            <h2 class="text-2xl font-bold text-orange-600 mb-1 uppercase">${d.name}</h2>
            <p class="text-[10px] text-gray-400 mb-4 border-b pb-2">Entry Date: ${d.date}</p>
            
            <div class="grid grid-cols-2 gap-3 text-xs mb-6 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <p><b>SLOTS:</b> ${d.slots}</p>
                <p><b>PITCH:</b> ${d.pitch}</p>
                <p><b>ID SIZE:</b> ${d.idSize}</p>
                <p><b>OD SIZE:</b> ${d.odSize}</p>
                <p><b>STAMPING:</b> ${d.stamping}</p>
                <p><b>WIRE:</b> ${d.wireType}</p>
            </div>

            <div class="grid grid-cols-2 gap-3 mb-6">
                <div class="bg-blue-50 p-3 rounded-2xl border border-blue-100 shadow-sm">
                    <p class="font-bold text-blue-700 border-b border-blue-200 mb-2 uppercase text-[10px] tracking-widest">Running</p>
                    <p class="text-xs">SWG: <b>${d.rSwg}</b></p>
                    <p class="text-xs">Turns: <b>${d.rTurns}</b></p>
                    <p class="text-blue-800 font-bold mt-1 text-sm">Wt: ${d.rWeight}</p>
                    <p class="text-[9px] mt-1 italic text-gray-400">Length: ${d.rLength}</p>
                </div>
                <div class="bg-green-50 p-3 rounded-2xl border border-green-100 shadow-sm">
                    <p class="font-bold text-green-700 border-b border-green-200 mb-2 uppercase text-[10px] tracking-widest">Starting</p>
                    <p class="text-xs">SWG: <b>${d.sSwg}</b></p>
                    <p class="text-xs">Turns: <b>${d.sTurns}</b></p>
                    <p class="text-green-800 font-bold mt-1 text-sm">Wt: ${d.sWeight}</p>
                    <p class="text-[9px] mt-1 italic text-gray-400">Length: ${d.sLength}</p>
                </div>
            </div>
            ${d.img ? `<img src="${d.img}" class="w-full rounded-2xl shadow-lg border-4 border-white mb-4">` : ''}
            <button onclick="deleteData(${d.id})" class="w-full text-red-400 font-bold text-xs mt-4 py-2 border border-red-100 rounded-lg">🗑 Delete Entry</button>
        `;
        document.getElementById('viewModal').style.display = 'block';
    };
}

function deleteData(id) {
    if(confirm("क्या आप इस डेटा को हमेशा के लिए मिटाना चाहते हैं?")) {
        db.transaction("records", "readwrite").objectStore("records").delete(id).onsuccess = () => {
            closeModal('viewModal');
            renderList();
        };
    }
}

function resetForm() {
    document.querySelectorAll('input').forEach(i => i.type !== 'button' && (i.value = ""));
    document.getElementById('editId').value = "";
}

function exportData() {
    db.transaction("records", "readonly").objectStore("records").getAll().onsuccess = (e) => {
        const blob = new Blob([JSON.stringify(e.target.result)], {type:"application/json"});
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `Winding_Maa_Bhagawati_${new Date().toLocaleDateString()}.json`;
        a.click();
    };
}

function importData(event) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const data = JSON.parse(e.target.result);
        const tx = db.transaction("records", "readwrite");
        data.forEach(item => { 
            delete item.id; 
            tx.objectStore("records").add(item); 
        });
        tx.oncomplete = () => { 
            alert("पुराना बैकअप सफलता के साथ लोड हो गया!"); 
            renderList(); 
        };
    };
    reader.readAsText(event.target.files[0]);
}
