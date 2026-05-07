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
    document.getElementById('editId').value = "";
    document.getElementById('formTitle').innerText = "नया डेटा जोड़ें";
    document.getElementById('saveBtn').innerText = "डेटा सेव करें";
    document.getElementById('windingForm').reset(); 
    document.getElementById('entryModal').classList.remove('hidden'); 
}
function closeForm() { document.getElementById('entryModal').classList.add('hidden'); }
function closeDetails() { document.getElementById('detailsModal').classList.add('hidden'); }

document.getElementById('windingForm').onsubmit = async (e) => {
    e.preventDefault();
    const editId = document.getElementById('editId').value;
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

    if(base64) motorData.pic = base64;

    const tx = db.transaction("motors", "readwrite");
    const store = tx.objectStore("motors");
    
    if(editId) {
        motorData.id = parseInt(editId);
        store.put(motorData);
    } else {
        store.add(motorData);
    }

    tx.oncomplete = () => {
        alert("डेटा सुरक्षित हुआ!");
        closeForm();
        loadMotors();
    };
};

function loadMotors() {
    const list = document.getElementById('motorList');
    list.innerHTML = "";
    db.transaction("motors").objectStore("motors").openCursor().onsuccess = (e) => {
        const cursor = e.target.result;
        if(cursor) {
            const m = cursor.value;
            list.innerHTML += `
                <div class="card p-4 rounded-xl shadow-lg flex justify-between items-center" onclick="showDetails(${m.id})">
                    <div>
                        <h3 class="font-bold text-orange-400 uppercase text-lg leading-tight">${m.name}</h3>
                        <p class="text-[10px] text-slate-400 font-bold uppercase mt-1">स्लॉट: ${m.slots} | ${m.wireType}</p>
                    </div>
                    <span class="text-slate-600 text-2xl font-bold">❯</span>
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
                <button onclick="closeDetails()" class="float-right text-white text-3xl font-bold">✕</button>
                <h2 class="text-3xl font-bold text-orange-500 uppercase mt-4 mb-2 tracking-tighter">${m.name}</h2>
                
                <div class="grid grid-cols-2 gap-2 mb-6 text-[11px] font-bold uppercase">
                    <div class="bg-black/60 p-2 rounded-xl border border-white/10">ID/OD: ${m.idSize}/${m.odSize}</div>
                    <div class="bg-black/60 p-2 rounded-xl border border-white/10">स्लॉट: ${m.slots}</div>
                    <div class="bg-black/60 p-2 rounded-xl border border-white/10">कोर: ${m.stamping}</div>
                    <div class="bg-black/60 p-2 rounded-xl border border-white/10">वायर: ${m.wireType}</div>
                </div>

                <div class="space-y-3">
                    <div class="bg-blue-600/20 p-4 rounded-xl border border-blue-400/30">
                        <p class="text-blue-400 font-bold mb-2 uppercase text-[10px] tracking-widest">Running Coil</p>
                        <div class="grid grid-cols-2 text-xs gap-y-1">
                            <p>SWG: <b class="text-white">${m.running.swg}</b></p>
                            <p>Turns: <b class="text-white">${m.running.turns}</b></p>
                            <p>Weight: <b class="text-white">${m.running.weight}g</b></p>
                            <p>Length: <b class="text-white">${m.running.length}</b></p>
                        </div>
                    </div>

                    <div class="bg-green-600/20 p-4 rounded-xl border border-green-400/30">
                        <p class="text-green-400 font-bold mb-2 uppercase text-[10px] tracking-widest">Starting Coil</p>
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
            </div>
        `;
        document.getElementById('detailsModal').classList.remove('hidden');
    };
}

function editMotor(id) {
    db.transaction("motors").objectStore("motors").get(id).onsuccess = (e) => {
        const m = e.target.result;
        document.getElementById('editId').value = m.id;
        document.getElementById('motorName').value = m.name;
        document.getElementById('idSize').value = m.idSize;
        document.getElementById('odSize').value = m.odSize;
        document.getElementById('stamping').value = m.stamping;
        document.getElementById('slots').value = m.slots;
        document.getElementById('wireType').value = m.wireType;
        document.getElementById('rSWG').value = m.running.swg;
        document.getElementById('rTurns').value = m.running.turns;
        document.getElementById('rWeight').value = m.running.weight;
        document.getElementById('rLength').value = m.running.length;
        document.getElementById('sSWG').value = m.starting.swg;
        document.getElementById('sTurns').value = m.starting.turns;
        document.getElementById('sWeight').value = m.starting.weight;
        document.getElementById('sLength').value = m.starting.length;
        
        document.getElementById('formTitle').innerText = "डाटा सुधारें";
        document.getElementById('saveBtn').innerText = "अपडेट करें";
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
        const blob = new Blob([JSON.stringify(e.target.result)], {type: "application/json"});
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `Winding_Backup_${new Date().toLocaleDateString()}.json`;
        a.click();
    };
}

function importData(event) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const data = JSON.parse(e.target.result);
        const tx = db.transaction("motors", "readwrite");
        data.forEach(m => { delete m.id; tx.objectStore("motors").add(m); });
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
       c.style.display = c.innerText.toUpperCase().includes(f) ? "" : "none";
    });
}
