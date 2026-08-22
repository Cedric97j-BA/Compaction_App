const APP_VERSION = 'v1.0.0.0';

// ========================================== //
// 1. NAVIGATION ET INITIALISATION            //
// ========================================== //

document.addEventListener('DOMContentLoaded', () => {
    const versionEl = document.getElementById('app-version');
    if (versionEl) versionEl.textContent = APP_VERSION;

    if (document.getElementById('essais-container').children.length === 0) {
        addEssai();
    }
    updateDropdown();
});

function showTab(tabId) {
    document.querySelectorAll('.tab-section').forEach(tab => tab.style.display = 'none');
    document.getElementById(tabId).style.display = 'block';
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.currentTarget.classList.add('active');
}

function toggleNO(checkbox, sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) return;
    
    if (checkbox.checked) {
        section.style.opacity = '0.3';
        section.style.pointerEvents = 'none';
        // Décoche tout le contenu
        section.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
        section.querySelectorAll('input[type="text"], input[type="number"]').forEach(txt => txt.value = '');
    } else {
        section.style.opacity = '1';
        section.style.pointerEvents = 'auto';
    }
}

// ========================================== //
// 2. GESTION DES ESSAIS ET CALCULS "N-C"     //
// ========================================== //

function addEssai() {
    const container = document.getElementById('essais-container');
    const template = document.getElementById('essai-template');
    const clone = template.content.cloneNode(true);
    
    clone.querySelectorAll('.trigger-calc').forEach(input => {
        input.addEventListener('input', calculateCompacite);
    });

    container.appendChild(clone);
    updateRowIndices();
}

function duplicateEssai(btn) {
    const originalCard = btn.closest('.essai-card');
    const container = document.getElementById('essais-container');
    const newCard = originalCard.cloneNode(true);
    
    // Ajout des listeners sur la nouvelle carte
    newCard.querySelectorAll('.trigger-calc').forEach(input => {
        input.addEventListener('input', calculateCompacite);
    });

    // Insertion juste après la carte copiée
    originalCard.insertAdjacentElement('afterend', newCard);
    updateRowIndices();
    calculateCompacite(); // Recalculer au cas où
}

function deleteEssai(btn) {
    if (confirm("Supprimer cette ligne d'essai ?")) {
        btn.closest('.essai-card').remove();
        updateRowIndices();
        calculateCompacite();
    }
}

function updateRowIndices() {
    const cards = document.querySelectorAll('.essai-card');
    cards.forEach((card, index) => {
        card.querySelector('.row-index').textContent = index + 1;
    });
}

function calculateCompacite() {
    const globalMaxStr = document.getElementById('carac-mv-seche-max').value;
    const globalMax = parseFloat(globalMaxStr);
    
    const exigenceStr = document.getElementById('exigence-compacite').value;
    const exigence = parseFloat(exigenceStr);

    document.querySelectorAll('.essai-card').forEach(card => {
        const mvSecheStr = card.querySelector('.essai-mv-seche').value;
        const mvMaxCorrStr = card.querySelector('.essai-mv-max-corr').value;
        const compaciteInput = card.querySelector('.essai-compacite');
        const remInput = card.querySelector('.essai-rem');

        if (!mvSecheStr) {
            compaciteInput.value = '';
            compaciteInput.style.borderColor = '#cbd5e1';
            compaciteInput.style.backgroundColor = '#f8fafc';
            compaciteInput.style.color = '#334155';
            return;
        }

        const mvSeche = parseFloat(mvSecheStr);
        // Utilise la valeur corrigée de la ligne, SINON la globale
        const referenceMax = mvMaxCorrStr ? parseFloat(mvMaxCorrStr) : globalMax;

        if (!isNaN(mvSeche) && !isNaN(referenceMax) && referenceMax > 0) {
            const compacite = (mvSeche / referenceMax) * 100;
            compaciteInput.value = compacite.toFixed(1).replace('.', ',');

            // Logique N-C Intelligente
            if (!isNaN(exigence)) {
                if (compacite < exigence) {
                    compaciteInput.style.borderColor = '#ef4444'; // Rouge
                    compaciteInput.style.backgroundColor = '#fef2f2';
                    compaciteInput.style.color = '#b91c1c';
                    
                    let currentRem = remInput.value.trim();
                    if (!currentRem.includes("N-C")) {
                        remInput.value = currentRem ? "N-C, " + currentRem : "N-C";
                    }
                } else {
                    compaciteInput.style.borderColor = '#22c55e'; // Vert
                    compaciteInput.style.backgroundColor = '#f0fdf4';
                    compaciteInput.style.color = '#15803d';
                    
                    // Retire le N-C automatique si le chiffre redevient bon
                    if (remInput.value.includes("N-C")) {
                        let parts = remInput.value.split(',').map(s=>s.trim()).filter(s => s !== "N-C" && s !== "");
                        remInput.value = parts.join(', ');
                    }
                }
            } else {
                compaciteInput.style.borderColor = '#cbd5e1';
                compaciteInput.style.backgroundColor = '#f8fafc';
                compaciteInput.style.color = '#334155';
            }
        } else {
            compaciteInput.value = '';
        }
    });
}

// ========================================== //
// 3. MOTEUR DE SAUVEGARDE (LOCALSTORAGE)     //
// ========================================== //

let currentActiveReportKey = null;

function updateDropdown() {
    const dropdown = document.getElementById('saved-reports-dropdown');
    if (!dropdown) return;
    
    dropdown.innerHTML = '<option value="">-- Sélectionnez un rapport --</option>';
    let savedKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('compactage_')) savedKeys.push(key);
    }
    savedKeys.sort().forEach(key => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = key.replace('compactage_', '').replace(/_/g, ' ');
        dropdown.appendChild(option);
    });
    if (currentActiveReportKey) dropdown.value = currentActiveReportKey;
}

function clearForm() {
    document.querySelectorAll('input, select, textarea').forEach(el => {
        if (el.id === 'saved-reports-dropdown') return; 
        if (el.type === 'checkbox') el.checked = false;
        else el.value = '';
    });

    document.getElementById('section-sous-jacent').style.opacity = '1';
    document.getElementById('section-sous-jacent').style.pointerEvents = 'auto';
    document.getElementById('section-equip').style.opacity = '1';
    document.getElementById('section-equip').style.pointerEvents = 'auto';

    document.getElementById('essais-container').innerHTML = '';
    addEssai();
    calculateCompacite();
}

function newReportPrompt() {
    if (confirm("Écran réinitialisé. Vous allez commencer un nouveau rapport de compactage. Continuer ?")) {
        currentActiveReportKey = null; 
        clearForm(); 
        document.getElementById('saved-reports-dropdown').value = ""; 
    }
}

function loadReport() {
    const selectedKey = document.getElementById('saved-reports-dropdown').value;
    if (!selectedKey) return alert("Sélectionnez un rapport d'abord.");

    const reportData = JSON.parse(localStorage.getItem(selectedKey));
    if (!reportData) return;

    clearForm();

    if (reportData.static) {
        for (const [id, value] of Object.entries(reportData.static)) {
            const el = document.getElementById(id);
            if (el) {
                if (el.type === 'checkbox') el.checked = value;
                else el.value = value;
            }
        }
    }

    if (reportData.essais && Array.isArray(reportData.essais)) {
        const container = document.getElementById('essais-container');
        container.innerHTML = '';
        
        reportData.essais.forEach(es => {
            addEssai();
            const cards = container.querySelectorAll('.essai-card');
            const card = cards[cards.length - 1];
            
            card.querySelector('.essai-secteur').value = es.secteur || '';
            card.querySelector('.essai-no').value = es.no || '';
            card.querySelector('.essai-elevation').value = es.elevation || '';
            card.querySelector('.essai-part').value = es.part || '';
            card.querySelector('.essai-eau').value = es.eau || '';
            card.querySelector('.essai-mv-seche').value = es.mvSeche || '';
            card.querySelector('.essai-mv-max-corr').value = es.mvMaxCorr || '';
            card.querySelector('.essai-rem').value = es.rem || '';
        });
    }

    calculateCompacite();
    currentActiveReportKey = selectedKey; 
    document.getElementById('saved-reports-dropdown').value = selectedKey;
    alert("Rapport chargé avec succès.");
}

function saveReport() {
    const noProjet = document.getElementById('global-no-projet').value.trim() || 'SANS-NUMERO';
    const rawDate = document.getElementById('global-date').value || new Date().toISOString().split('T')[0];
    const techName = document.getElementById('sig-englobe-nom')?.value || '';
    const techInitials = techName.split(' ').filter(n => n).map(n => n[0].toUpperCase()).join('') || 'TECH';
    
    const defaultBaseName = `compactage_${rawDate}_${noProjet}_${techInitials}`;
    let userPromptName = prompt("Nom de sauvegarde du rapport :", defaultBaseName);
    if (!userPromptName) return; 
    
    let baseName = userPromptName.trim() || defaultBaseName;
    if (!baseName.startsWith('compactage_')) baseName = `compactage_${baseName}`;

    if (currentActiveReportKey && !currentActiveReportKey.startsWith(baseName)) {
        currentActiveReportKey = null;
    }

    const staticData = {};
    document.querySelectorAll('input[id], select[id], textarea[id]').forEach(el => {
        if (el.id === 'saved-reports-dropdown') return;
        staticData[el.id] = el.type === 'checkbox' ? el.checked : el.value;
    });

    const essaisData = [];
    document.querySelectorAll('.essai-card').forEach(card => {
        essaisData.push({
            secteur: card.querySelector('.essai-secteur').value,
            no: card.querySelector('.essai-no').value,
            elevation: card.querySelector('.essai-elevation').value,
            part: card.querySelector('.essai-part').value,
            eau: card.querySelector('.essai-eau').value,
            mvSeche: card.querySelector('.essai-mv-seche').value,
            mvMaxCorr: card.querySelector('.essai-mv-max-corr').value,
            rem: card.querySelector('.essai-rem').value
        });
    });

    let saveKey = currentActiveReportKey;
    if (!saveKey || saveKey !== baseName) {
        let maxIndex = 0;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(baseName)) {
                const parts = key.split('_');
                const idx = parseInt(parts[parts.length - 1]);
                if (!isNaN(idx) && idx > maxIndex) maxIndex = idx;
            }
        }
        const nextIndex = String(maxIndex + 1).padStart(2, '0');
        saveKey = `${baseName}_${nextIndex}`;
    }

    const reportData = {
        static: staticData,
        essais: essaisData,
        timestamp: new Date().getTime()
    };

    localStorage.setItem(saveKey, JSON.stringify(reportData));
    currentActiveReportKey = saveKey; 
    updateDropdown();
    document.getElementById('saved-reports-dropdown').value = saveKey;
    alert("Sauvegardé sous : " + saveKey);
}

function deleteReport() {
    const targetKey = currentActiveReportKey || document.getElementById('saved-reports-dropdown').value;
    if (!targetKey) return alert("Sélectionnez un rapport.");

    if (confirm("Supprimer ce rapport définitivement ?")) {
        localStorage.removeItem(targetKey); 
        currentActiveReportKey = null; 
        clearForm(); 
        updateDropdown(); 
        alert("Supprimé.");
    }
}

// ========================================== //
// 4. MOTEUR D'EXPORT PDF (PLACEHOLDER)       //
// ========================================== //

async function exportToPDF() {
    // Note : Comme pour les autres apps, vous devrez fournir le TEMPLATE_COMPACTAGE
    // en Base64 dans le fichier pdf_templates.js, et on fera le mapping final des champs 
    // en utilisant exactement les IDs du dictionnaire Excel !
    alert("Le moteur PDF sera branché dès que nous aurons validé la structure avec le modèle PDF Base64.");
}