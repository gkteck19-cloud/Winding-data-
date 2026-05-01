let db;
const request = indexedDB.open("WindingDirectoryDB", 2);

request.onupgradeneeded = (e) => {
    db = e.target.result;
    if (!db.objectStoreNames.contains("records")) {
        db.createObjectStore("records", { keyPath: "id", autoIncrement: true });
    }
};

request.onsuccess = (e) => {
    db = e.target.result;
    renderList();
};

function openForm() { 
    document.getElementById('formModal').style.display = 'block'; 
}

function closeModal(id) { 
    document.getElementById(id).style.display = 'none'; 
    resetForm(); 
}

async function saveData() {
    const name = document.getElementById('itemName').value;
    if(!name) return alert("मोटर का नाम भरना ज़रूरी है!");

    const record = {
        name,
        idSize: document.getElementById('idSize').value,
        odSize: document.getElementById('odSize').value,
        stamping: document.getElementById('stamping').value,
        slots: document.getElementById('slots').value,
        pitch: document.getElementById('pitch').value,
        wireType: document.getElementById('wireType').value,
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
