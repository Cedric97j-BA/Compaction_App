// ========================================== //
// 1. INITIALISATION ET UI                    //
// ========================================== //

document.addEventListener('DOMContentLoaded', () => {
    const logoEl = document.getElementById('main-logo');
    if (logoEl && typeof LOGO_BASE64 !== 'undefined') {
        logoEl.src = LOGO_BASE64;
        logoEl.style.display = 'block';
    }
    
    if (localStorage.getItem('darkMode') === 'enabled') {
        document.body.classList.add('dark-mode');
    }

    buildEssaisMatrix();
    updateDropdown();
});

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type} show`;
    toast.innerText = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => { if (document.body.contains(toast)) toast.remove(); }, 500);
    }, 3000);
}

function showTab(tabId, event) {
    const allTabs = document.querySelectorAll('.tab-section');
    allTabs.forEach(tab => tab.style.display = 'none');
    document.getElementById(tabId).style.display = 'block';

    const allButtons = document.querySelectorAll('.tab-btn');
    allButtons.forEach(btn => btn.classList.remove('active'));
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }
}

// ========================================== //
// 2. GÉNÉRATION DES 3 ZONES D'ESSAIS         //
// ========================================== //

function buildEssaisMatrix() {
    const container = document.getElementById('essais-matrix-container');
    if (!container) return;

    let html = '';
    for (let i = 1; i <= 3; i++) {
        html += `
        <div class="form-section truck-card">
            <h4 style="color: var(--primary); border-bottom: 1px solid var(--border); padding-bottom: 5px; margin-bottom: 15px; font-weight: bold;">
                Emplacement / Endroit ${i}
            </h4>
            
            <div class="input-group" style="margin-bottom: 15px;">
                <label>Description de l'endroit</label>
                <input type="text" id="essais-endroit-${i}" placeholder="Ex: Ch 12+345">
            </div>

            <label style="display:block; font-size: 0.9rem; font-weight: bold; margin-bottom: 5px; color: #64748b;">Lectures Nucléodensimètre (M.V.)</label>
            <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 15px;">
                <input type="number" step="0.001" id="essais-${i}-1" oninput="calculateEssais()" placeholder="Lec 1" style="flex: 1; min-width: 80px;">
                <input type="number" step="0.001" id="essais-${i}-2" oninput="calculateEssais()" placeholder="Lec 2" style="flex: 1; min-width: 80px;">
                <input type="number" step="0.001" id="essais-${i}-3" oninput="calculateEssais()" placeholder="Lec 3" style="flex: 1; min-width: 80px;">
                <input type="number" step="0.001" id="essais-${i}-4" oninput="calculateEssais()" placeholder="Lec 4" style="flex: 1; min-width: 80px;">
                <input type="number" step="0.001" id="essais-${i}-5" oninput="calculateEssais()" placeholder="Lec 5" style="flex: 1; min-width: 80px;">
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 10px; margin-bottom: 15px; background: #f1f5f9; padding: 10px; border-radius: 6px;">
                <div class="input-group"><label>Médiane</label><input type="text" id="essais-${i}-med" readonly style="background: #e2e8f0;"></div>
                <div class="input-group"><label>Int. Min</label><input type="text" id="essais-${i}-int-1" readonly style="background: #e2e8f0;"></div>
                <div class="input-group"><label>Int. Max</label><input type="text" id="essais-${i}-int-2" readonly style="background: #e2e8f0;"></div>
                <div class="input-group"><label>Moyenne</label><input type="text" id="essais-${i}-moy" readonly style="background: #e2e8f0; font-weight: bold;"></div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px;">
                <div class="input-group"><label>Épaisseur</label><input type="number" step="0.1" id="essais-${i}-epaisseur" oninput="calculateEssais()"></div>
                <div class="input-group"><label style="color: #b45309;">Densité Carotte</label><input type="number" step="0.001" id="essais-${i}-carottes" oninput="calculateEssais()"></div>
                <div class="input-group"><label>Comp. Nucléo (%)</label><input type="text" id="essais-${i}-c_nuc" readonly style="background: #e2e8f0;"></div>
                <div class="input-group"><label>Comp. Carotte (%)</label><input type="text" id="essais-${i}-c_carot" readonly style="background: #e2e8f0;"></div>
            </div>
        </div>
        `;
    }
    container.innerHTML = html;
}

// ========================================== //
// 3. MOTEUR MATHÉMATIQUE (CALCULS)           //
// ========================================== //

function calculateEssais() {
    const densMax = parseFloat(document.getElementById('spec-dens-max').value);
    const validDensMax = !isNaN(densMax) && densMax > 0;

    let globalMoyNuc = [], globalEpais = [], globalCarot = [], globalCompNuc = [], globalCompCarot = [];

    for (let i = 1; i <= 3; i++) {
        // Collecter les 5 lectures
        let readings = [];
        for (let j = 1; j <= 5; j++) {
            let val = parseFloat(document.getElementById(`essais-${i}-${j}`).value);
            if (!isNaN(val)) readings.push(val);
        }

        if (readings.length > 0) {
            // Tri pour médiane et Intervalles
            let sorted = [...readings].sort((a, b) => a - b);
            
            // Médiane
            let med = sorted[Math.floor(sorted.length / 2)];
            if (sorted.length % 2 === 0) med = (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;
            document.getElementById(`essais-${i}-med`).value = med.toFixed(3);
            
            // Intervalles
            document.getElementById(`essais-${i}-int-1`).value = sorted[0].toFixed(3);
            document.getElementById(`essais-${i}-int-2`).value = sorted[sorted.length - 1].toFixed(3);
            
            // Moyenne Nucléo
            let avg = readings.reduce((sum, val) => sum + val, 0) / readings.length;
            document.getElementById(`essais-${i}-moy`).value = avg.toFixed(3);
            globalMoyNuc.push(avg);

            // Compacité Nucléo
            if (validDensMax) {
                let compNuc = (avg / densMax) * 100;
                document.getElementById(`essais-${i}-c_nuc`).value = compNuc.toFixed(1);
                globalCompNuc.push(compNuc);
            } else {
                document.getElementById(`essais-${i}-c_nuc`).value = "";
            }
        } else {
            // Vider si aucune lecture
            document.getElementById(`essais-${i}-med`).value = "";
            document.getElementById(`essais-${i}-int-1`).value = "";
            document.getElementById(`essais-${i}-int-2`).value = "";
            document.getElementById(`essais-${i}-moy`).value = "";
            document.getElementById(`essais-${i}-c_nuc`).value = "";
        }

        // Épaisseur
        let epais = parseFloat(document.getElementById(`essais-${i}-epaisseur`).value);
        if (!isNaN(epais)) globalEpais.push(epais);

        // Densité Carotte & Compacité Carotte (Vérifie si le labo a fourni les résultats)
        let carot = parseFloat(document.getElementById(`essais-${i}-carottes`).value);
        if (!isNaN(carot)) {
            globalCarot.push(carot);
            if (validDensMax) {
                let compCarot = (carot / densMax) * 100;
                document.getElementById(`essais-${i}-c_carot`).value = compCarot.toFixed(1);
                globalCompCarot.push(compCarot);
            } else {
                document.getElementById(`essais-${i}-c_carot`).value = "";
            }
        } else {
            document.getElementById(`essais-${i}-c_carot`).value = "";
        }
    }

    // Calcul des moyennes globales
    const setAvg = (id, arr, decimals = 1) => {
        if (arr.length > 0) {
            let avg = arr.reduce((sum, val) => sum + val, 0) / arr.length;
            document.getElementById(id).value = avg.toFixed(decimals);
            return avg;
        }
        document.getElementById(id).value = "";
        return null;
    };

    let moyNuc = setAvg('essais-moy', globalMoyNuc, 3);
    setAvg('essais-epaisseur', globalEpais, 1);
    let moyCarot = setAvg('essais-carottes', globalCarot, 3);
    let moyCompNuc = setAvg('essais-c_nuc', globalCompNuc, 1);
    let moyCompCarot = setAvg('essais-c_carot', globalCompCarot, 1);

    // Facteurs de Concordance
    if (moyNuc !== null && moyCarot !== null) {
        document.getElementById('conc-mv').value = (moyCarot - moyNuc).toFixed(3);
    } else {
        document.getElementById('conc-mv').value = "";
    }

    if (moyCompNuc !== null && moyCompCarot !== null) {
        document.getElementById('conc-pour').value = (moyCompCarot - moyCompNuc).toFixed(1);
    } else {
        document.getElementById('conc-pour').value = "";
    }
}

// ========================================== //
// 4. MOTEUR DE SAUVEGARDE                    //
// ========================================== //

let currentActiveReportKey = null;

function updateLastSavedStatus(timestamp = Date.now()) {
    const status = document.getElementById('last-saved-status');
    if (status) {
        const date = new Date(timestamp);
        const dateText = date.toLocaleDateString('fr-CA');
        const timeText = date.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit', hour12: false }).replace(':', 'H');
        status.textContent = `Dernière sauvegarde : ${dateText} - ${timeText}`;
    }
}

function updateDropdown() {
    const dropdown = document.getElementById('saved-reports-dropdown');
    if (!dropdown) return;
    
    dropdown.innerHTML = '<option value="">-- Sélectionnez un rapport --</option>';
    let savedReports = [];
    
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('PAVAGE_')) {
            try {
                const dataStr = localStorage.getItem(key);
                if (dataStr) {
                    const data = JSON.parse(dataStr);
                    if (data && data.displayName) {
                        const displayName = data.displayName.replace('englobe_', '').replace(/_/g, ' ');
                        savedReports.push({ key: key, display: displayName });
                    }
                }
            } catch (e) {}
        }
    }

    savedReports.sort((a, b) => a.display.localeCompare(b.display));
    savedReports.forEach(report => {
        const option = document.createElement('option');
        option.value = report.key;
        option.textContent = report.display;
        dropdown.appendChild(option);
    });

    if (currentActiveReportKey) dropdown.value = currentActiveReportKey;
}

function clearForm() {
    document.querySelectorAll('input, select, textarea').forEach(el => {
        if (el.id === 'saved-reports-dropdown') return; 
        if (el.type === 'checkbox' || el.type === 'radio') el.checked = false;
        else el.value = ''; 
    });
}

let newArmed = false;
let newTimeout = null;

function newReportPrompt() {
    const newBtn = document.querySelector('button[onclick="newReportPrompt()"]');
    if (!newArmed) {
        newArmed = true;
        if (newBtn) { newBtn.textContent = "⚠️ Confirmer ?"; newBtn.style.background = "#b91c1c"; }
        newTimeout = setTimeout(() => {
            newArmed = false;
            if (newBtn) { newBtn.textContent = "➕ Nouveau"; newBtn.style.background = "#0284c7"; }
        }, 4000);
        return; 
    }
    clearTimeout(newTimeout);
    newArmed = false;
    if (newBtn) { newBtn.textContent = "➕ Nouveau"; newBtn.style.background = "#0284c7"; }
    
    currentActiveReportKey = null; 
    clearForm(); 
    document.getElementById('saved-reports-dropdown').value = ""; 
    document.getElementById('last-saved-status').textContent = "Dernière sauvegarde : aucune";
    showToast("Écran réinitialisé.", "success");
}

function loadReport() {
    const dropdown = document.getElementById('saved-reports-dropdown');
    const selectedKey = dropdown.value;
    if (!selectedKey) { showToast("Veuillez d'abord sélectionner un rapport.", "info"); return; }

    const reportDataStr = localStorage.getItem(selectedKey);
    if (!reportDataStr) return;

    clearForm();
    try {
        const reportData = JSON.parse(reportDataStr);
        updateLastSavedStatus(reportData.timestamp);

        if (reportData.static) {
            for (const [id, value] of Object.entries(reportData.static)) {
                const el = document.getElementById(id);
                if (el) {
                    if (el.type === 'checkbox') el.checked = value;
                    else el.value = value;
                }
            }
        }

        calculateEssais(); // Recalcule l'affichage après chargement
        currentActiveReportKey = selectedKey; 
        dropdown.value = selectedKey;
        showToast("Rapport chargé avec succès.", "success");
    } catch (error) {
        showToast("Erreur lors du chargement.", "error");
    }
}

function saveReport(isDuplicate = false) {
    let saveKey = currentActiveReportKey;

    const noProjet = document.getElementById('global-no-projet').value.trim() || 'SANS-NUMERO';
    const rawDate = document.getElementById('global-date').value || new Date().toISOString().split('T')[0];
    const techName = document.getElementById('sig-prep-nom')?.value || '';
    const techInitials = techName.split(' ').filter(n => n).map(n => n[0].toUpperCase()).join('') || 'TECH';
    
    let baseName = `englobe_${rawDate}_${noProjet}_CONC-PAVAGE_${techInitials}`;

    if (!saveKey || isDuplicate) {
        if (isDuplicate) baseName += "_copie";
        let userPromptName = prompt(isDuplicate ? "Nom pour la COPIE :" : "Nom de sauvegarde du rapport :", baseName);
        if (userPromptName === null) return; 
        
        baseName = userPromptName.trim() || baseName;
        if (!baseName.startsWith('englobe_')) baseName = `englobe_${baseName}`;
        saveKey = 'PAVAGE_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    } else {
        const existingDataStr = localStorage.getItem(saveKey);
        if (existingDataStr) {
            try {
                const existingData = JSON.parse(existingDataStr);
                if (existingData.displayName) baseName = existingData.displayName;
            } catch(e) {}
        }
    }

    const staticData = {};
    document.querySelectorAll('input[id], select[id], textarea[id]').forEach(el => {
        if (el.id === 'saved-reports-dropdown' || el.type === 'file') return; 
        staticData[el.id] = el.type === 'checkbox' ? el.checked : el.value;
    });

    const reportData = {
        displayName: baseName, 
        static: staticData,
        timestamp: new Date().getTime()
    };

    localStorage.setItem(saveKey, JSON.stringify(reportData));
    currentActiveReportKey = saveKey; 
    updateLastSavedStatus(reportData.timestamp);
    updateDropdown();
    
    document.getElementById('saved-reports-dropdown').value = saveKey;
    showToast(isDuplicate ? "Copie sauvegardée." : "Rapport sauvegardé.", "success");
}

let deleteArmed = false;
let deleteTimeout = null;

function deleteReport() {
    const dropdown = document.getElementById('saved-reports-dropdown');
    const targetKey = currentActiveReportKey || (dropdown ? dropdown.value : null);

    if (!targetKey) { showToast("Sélectionnez un rapport à supprimer.", "info"); return; }

    const deleteBtn = document.querySelector('button[onclick="deleteReport()"]');
    if (!deleteArmed) {
        deleteArmed = true;
        if (deleteBtn) { deleteBtn.textContent = "⚠️ Confirmer ?"; deleteBtn.style.background = "#b91c1c"; }
        deleteTimeout = setTimeout(() => {
            deleteArmed = false;
            if (deleteBtn) { deleteBtn.textContent = "🗑️ Supprimer"; deleteBtn.style.background = "#ef4444"; }
        }, 4000);
        return; 
    }
    clearTimeout(deleteTimeout);
    deleteArmed = false;
    
    if (deleteBtn) { deleteBtn.textContent = "🗑️ Supprimer"; deleteBtn.style.background = "#ef4444"; }
    localStorage.removeItem(targetKey); 
    showToast(`Rapport supprimé avec succès.`, "success");
    currentActiveReportKey = null; 
    clearForm(); 
    updateDropdown(); 
}

// ========================================== //
// 5. MOTEUR D'EXPORT PDF                     //
// ========================================== //

async function exportToPDF() {
    if (typeof TEMPLATE_PAVAGE_CONCORDANCE === 'undefined') {
        showToast("Le modèle PDF n'est pas encore intégré. Préparez-le avec Python !", "info");
        return;
    }

    try {
        const btn = document.querySelector('button[onclick="exportToPDF()"]');
        const originalText = btn ? btn.textContent : "📄 Exporter en PDF";
        if (btn) { btn.textContent = "⏳ Génération..."; btn.disabled = true; }

        const getBuffer = (base64) => {
            const str = window.atob(base64);
            const bytes = new Uint8Array(str.length);
            for (let i = 0; i < str.length; i++) bytes[i] = str.charCodeAt(i);
            return bytes.buffer;
        };

        const pdfDoc = await PDFLib.PDFDocument.load(getBuffer(TEMPLATE_PAVAGE_CONCORDANCE));
        pdfDoc.registerFontkit(fontkit);
        const form = pdfDoc.getForm();

        // 1. Remplissage des champs texte et checkbox
        const allInputs = document.querySelectorAll('input[id], textarea[id]');
        allInputs.forEach(el => {
            const name = el.id;
            try {
                if (el.type === 'checkbox') {
                    el.checked ? form.getCheckBox(name).check() : form.getCheckBox(name).uncheck();
                } else if (el.type !== 'file' && el.type !== 'hidden') {
                    let valToPrint = el.value || "";
                    // Conversion des points en virgules pour le format Francophone
                    if (el.type === 'number' || el.id.includes('med') || el.id.includes('int') || el.id.includes('moy') || el.id.includes('conc') || el.id.includes('c_nuc') || el.id.includes('c_carot')) {
                        if (valToPrint.includes('.')) valToPrint = valToPrint.replace('.', ',');
                    }
                    form.getTextField(name).setText(valToPrint);
                }
            } catch (e) {} 
        });

        // 2. Gestion de la police Tahoma
        try {
            const fontBytes = new Uint8Array(getBuffer(TAHOMA_FONT));
            const tahomaFont = await pdfDoc.embedFont(fontBytes);
            form.updateFieldAppearances(tahomaFont);
            if (form.acroForm) form.acroForm.dict.set(PDFLib.PDFName.of('NeedAppearances'), PDFLib.PDFBool.False);
        } catch(e) {}

        const noProjet = document.getElementById('global-no-projet').value.trim() || 'SANS-NUMERO';
        const rawDate = document.getElementById('global-date').value || new Date().toISOString().split('T')[0];
        const techName = document.getElementById('sig-prep-nom')?.value || '';
        const techInitials = techName.split(' ').filter(n => n).map(n => n[0].toUpperCase()).join('') || 'TECH';

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const fileName = `Concordance_${rawDate}_${noProjet}_${techInitials}.pdf`;

        // TÉLÉCHARGEMENT
        const isMacTouch = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
        const isApple = /iPhone|iPad|iPod/i.test(navigator.userAgent) || isMacTouch;
        
        let attemptedShare = false;
        try {
            if (isApple && navigator.share && navigator.canShare) {
                const file = new File([blob], fileName, { type: 'application/pdf' });
                if (navigator.canShare({ files: [file] })) {
                    attemptedShare = true;
                    await navigator.share({ files: [file] });
                }
            }
        } catch (err) { if (err.name !== 'AbortError') attemptedShare = false; }

        if (!attemptedShare) {
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => window.URL.revokeObjectURL(url), 100);
        }
        
        if (btn) { btn.textContent = originalText; btn.disabled = false; }
    } catch (error) {
        console.error(error);
        showToast("Erreur lors de l'export PDF.", "error");
        const btn = document.querySelector('button[onclick="exportToPDF()"]');
        if (btn) { btn.textContent = "📄 Exporter en PDF"; btn.disabled = false; }
    }
}