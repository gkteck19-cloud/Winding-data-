let db;
const DB_NAME = "MaaBhagawatiDB";
const STORE_NAME = "motors";

// Database Setup
const request = indexedDB.open(DB_NAME, 6);

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

// 1. फॉर्म खोलने का फ़ंक्शन (Add Button के लिए)
function openForm() {
    const modal = document.getElementById('entryModal');
    const form = document.getElementById('windingForm');
    
    if (modal && form) {
        form.reset(); // पुराना डेटा साफ़ करें
        document.getElementById('editId').value = ""; // ID हटाएँ (New Entry mode)
        document.getElementById('formTitle').innerText = "नया डेटा जोड़ें";
        document.getElementById('saveBtn').innerText = "डेटा सेव करें";
        modal.classList.remove('hidden'); // फॉर्म दिखाएँ
    }
}

function closeForm() { 
    document.getElementById('entryModal').classList.add('hidden'); 
}

function closeDetails() { 
    document.getElementById('detailsModal').classList.add('hidden'); 
}

// 2. डेटा सेव करने का फ़ंक्शन
document.getElementById('windingForm').onsubmit = async (e) => {
    e.preventDefault();
    
    const fileInput = document.getElementById('photoInput');
    const editId = document.getElementById('editId').value;
    
    let base64 = "";
    if (fileInput && fileInput.files[0]) {
        base64 = await new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(fileInput.files[0]);
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

    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    if(editId) {
        motorData.id = parseInt(editId);
        store.put(motorData);
    } else {
        store.add(motorData);
    }

    tx.oncomplete = () => {
        alert("डेटा सफलतापूर्वक सेव हुआ!");
        closeForm();
        loadMotors();
    };
};

// 3. लिस्ट लोड करना
function loadMotors() {
    const list = document.getElementById('motorList');
    if (!list) return;
    list.innerHTML = "";
    
    const store = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME);
    store.openCursor().onsuccess = (e) => {
        const cursor = e.target.result;
        if(cursor) {
            const m = cursor.value;
            list.innerHTML += `
                <div class="card p-4 rounded-xl shadow-lg flex justify-between items-center" onclick="showDetails(${m.id})">
                    <div>
                        <h3 class="font-bold text-orange-400 uppercase text-lg">${m.name}</h3>
                        <p class="text-[10px] text-slate-400 font-bold uppercase mt-1">स्लॉट: ${m.slots} | ${m.wireType}</p>
                    </div>
                    <span class="text-orange-500/50 text-2xl font-bold">❯</span>
                </div>`;
            cursor.continue();
        }
    };
}

// ... बाकी फ़ंक्शन (showDetails, deleteData, export/import) वैसे ही रहेंगे ...

function closeDetails() { 
    document.getElementById('detailsModal').classList.add('hidden'); 
}

// 2. डेटा सेव करने का फ़ंक्शन
document.getElementById('windingForm').onsubmit = async (e) => {
    e.preventDefault();
    
    const fileInput = document.getElementById('photoInput');
    const editId = document.getElementById('editId').value;
    
    let base64 = "";
    if (fileInput && fileInput.files[0]) {
        base64 = await new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(fileInput.files[0]);
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

    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    if(editId) {
        motorData.id = parseInt(editId);
        store.put(motorData);
    } else {
        store.add(motorData);
    }

    tx.oncomplete = () => {
        alert("डेटा सफलतापूर्वक सेव हुआ!");
        closeForm();
        loadMotors();
    };
};

// 3. लिस्ट लोड करना
function loadMotors() {
    const list = document.getElementById('motorList');
    if (!list) return;
    list.innerHTML = "";
    
    const store = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME);
    store.openCursor().onsuccess = (e) => {
        const cursor = e.target.result;
        if(cursor) {
            const m = cursor.value;
            list.innerHTML += `
                <div class="card p-4 rounded-xl shadow-lg flex justify-between items-center" onclick="showDetails(${m.id})">
                    <div>
                        <h3 class="font-bold text-orange-400 uppercase text-lg">${m.name}</h3>
                        <p class="text-[10px] text-slate-400 font-bold uppercase mt-1">स्लॉट: ${m.slots} | ${m.wireType}</p>
                    </div>
                    <span class="text-orange-500/50 text-2xl font-bold">❯</span>
                </div>`;
            cursor.continue();
        }
    };
}

// ... बाकी फ़ंक्शन (showDetails, deleteData, export/import) वैसे ही रहेंगे ...
