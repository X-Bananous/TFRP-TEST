








import { state } from '../state.js';

// Helper to generate a single row HTML - ensures consistency between Main View and Search Results
export const generateInventoryRow = (item) => {
    // Determine icon and color classes
    let iconName = 'package';
    let iconClass = 'bg-indigo-500/20 text-indigo-400';
    let action = `actions.openIdCard(null, 'id_card')`;

    if (item.is_cash) {
        iconName = 'banknote';
        iconClass = 'bg-emerald-500/20 text-emerald-400';
    } else if (item.is_virtual) {
        if (item.icon) {
            iconName = item.icon;
            // Differentiate colors for known virtual items
            if(iconName === 'credit-card') {
                iconClass = 'bg-purple-500/20 text-purple-400';
                action = `actions.openIdCard(null, 'credit_card')`;
            }
            else if(iconName === 'car') {
                iconClass = 'bg-orange-500/20 text-orange-400';
                action = `actions.openIdCard(null, 'driver_license')`;
            }
            else {
                iconClass = 'bg-blue-500/20 text-blue-400';
                action = `actions.openIdCard(null, 'id_card')`;
            }
        } else {
            iconName = 'id-card';
            iconClass = 'bg-blue-500/20 text-blue-400';
        }
    }

    return `
    <div class="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors group">
        <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl ${iconClass} flex items-center justify-center border border-white/5">
                <i data-lucide="${iconName}" class="w-6 h-6"></i>
            </div>
            <div>
                <div class="font-bold text-white text-base">${item.name}</div>
                <div class="text-xs text-gray-500 font-mono">
                    Qté: <span class="text-gray-300">${item.quantity.toLocaleString()}</span> ${!item.is_virtual ? `&times; $${item.estimated_value.toLocaleString()}` : ''}
                </div>
            </div>
        </div>
        <div class="text-right flex items-center gap-4">
            ${!item.is_virtual ? `
                <div>
                    <div class="font-bold text-white">$ ${(item.quantity * item.estimated_value).toLocaleString()}</div>
                    <div class="text-[10px] text-gray-500 uppercase tracking-wider">Valeur</div>
                </div>
                ${!item.is_cash ? `
                    <button onclick="actions.deleteInventoryItem('${item.id}', '${item.name}')" class="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors" title="Jeter">
                        <i data-lucide="trash" class="w-4 h-4"></i>
                    </button>
                ` : ''}
            ` : `
                <button onclick="${action}" class="glass-btn-secondary px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-500/20 hover:text-blue-300 transition-colors">
                    Consulter
                </button>
            `}
        </div>
    </div>
    `;
};

export const AssetsView = () => {
    if (!state.bankAccount) return '<div class="p-8 text-center text-gray-500"><div class="loader-spinner mb-4 mx-auto"></div>Synchronisation du patrimoine...</div>';

    // --- ID CARD / DOCUMENTS MODAL ---
    let documentHtml = '';
    if (state.idCardModalOpen) {
        const char = state.idCardTarget || state.activeCharacter;
        const birthDate = new Date(char.birth_date).toLocaleDateString('fr-FR');
        const createdAt = new Date(char.created_at).toLocaleDateString('fr-FR');
        const docType = state.activeDocumentType || 'id_card'; // id_card, driver_license, credit_card

        let cardContent = '';

        // 1. DRIVER LICENSE (BLUE)
        if (docType === 'driver_license') {
            cardContent = `
                <div class="id-card-bg w-full max-w-[400px] h-[250px] rounded-2xl relative z-10 overflow-hidden text-gray-800 p-6 flex flex-col justify-between shadow-2xl transform scale-110">
                    <!-- Background Pattern -->
                    <div class="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                    
                    <div class="flex justify-between items-start border-b-2 border-blue-800 pb-2 relative z-10">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-full bg-blue-900 flex items-center justify-center text-white font-bold text-xs">LA</div>
                            <div>
                                <h3 class="font-bold text-lg leading-none text-blue-900">STATE OF CALIFORNIA</h3>
                                <div class="text-[8px] font-bold tracking-widest uppercase text-blue-700">Driver License</div>
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="text-[10px] font-bold text-red-600">ID: ${char.id.split('-')[0].toUpperCase()}</div>
                            <div class="text-[8px] text-gray-500">EXP: 12/2030</div>
                        </div>
                    </div>

                    <div class="flex gap-4 mt-2 relative z-10">
                        <div class="w-24 h-32 bg-gray-300 border border-gray-400 rounded-md overflow-hidden shrink-0">
                            ${state.user.avatar ? `<img src="${state.user.avatar}" class="w-full h-full object-cover grayscale contrast-125">` : '<div class="w-full h-full flex items-center justify-center bg-gray-200"><i data-lucide="user" class="w-8 h-8 text-gray-400"></i></div>'}
                        </div>
                        <div class="flex-1 space-y-1">
                            <div>
                                <div class="text-[8px] text-gray-500 uppercase">Last Name</div>
                                <div class="font-bold text-lg uppercase leading-none">${char.last_name}</div>
                            </div>
                            <div>
                                <div class="text-[8px] text-gray-500 uppercase">First Name</div>
                                <div class="font-bold text-sm uppercase leading-none">${char.first_name}</div>
                            </div>
                             <div class="grid grid-cols-2 gap-2 mt-2">
                                <div>
                                    <div class="text-[8px] text-gray-500 uppercase">DOB</div>
                                    <div class="font-bold text-xs leading-none text-red-700">${birthDate}</div>
                                </div>
                                <div>
                                    <div class="text-[8px] text-gray-500 uppercase">Sex</div>
                                    <div class="font-bold text-xs leading-none">M</div>
                                </div>
                            </div>
                            <div class="mt-2">
                                <div class="text-[8px] text-gray-500 uppercase">Issued</div>
                                <div class="font-bold text-xs leading-none">${createdAt}</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } 
        // 2. CREDIT CARD (BLACK/GOLD)
        else if (docType === 'credit_card') {
            const bankBalance = state.bankAccount ? state.bankAccount.bank_balance.toLocaleString() : '****';
            cardContent = `
                <div class="w-full max-w-[400px] h-[250px] rounded-2xl relative z-10 overflow-hidden text-white p-8 flex flex-col justify-between shadow-2xl transform scale-110 bg-gradient-to-br from-gray-900 via-gray-800 to-black border border-yellow-600/30">
                    <!-- Shine Effect -->
                    <div class="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 rounded-full blur-[80px] pointer-events-none"></div>
                    
                    <div class="flex justify-between items-start relative z-10">
                        <div class="flex items-center gap-2">
                            <i data-lucide="landmark" class="w-6 h-6 text-yellow-500"></i>
                            <span class="font-bold tracking-widest text-lg">TFRP BANK</span>
                        </div>
                        <span class="text-xs font-bold text-yellow-500 uppercase tracking-widest border border-yellow-500/30 px-2 py-1 rounded">Gold Debit</span>
                    </div>

                    <div class="relative z-10">
                        <div class="w-12 h-9 rounded bg-gradient-to-br from-yellow-200 to-yellow-500 mb-4 shadow-lg flex items-center justify-center relative overflow-hidden">
                            <div class="absolute inset-0 border border-black/20 rounded"></div>
                            <div class="w-8 h-6 border border-black/10 rounded flex flex-col justify-between p-1">
                                <div class="h-[1px] bg-black/20 w-full"></div>
                                <div class="h-[1px] bg-black/20 w-full"></div>
                                <div class="h-[1px] bg-black/20 w-full"></div>
                            </div>
                        </div>
                        <div class="font-mono text-xl tracking-widest text-gray-300 drop-shadow-md">
                            **** **** **** ${char.id.substring(0,4).toUpperCase()}
                        </div>
                    </div>

                    <div class="flex justify-between items-end relative z-10">
                        <div>
                            <div class="text-[8px] text-gray-400 uppercase tracking-widest mb-0.5">Card Holder</div>
                            <div class="font-bold text-sm uppercase tracking-wide text-yellow-100">${char.first_name} ${char.last_name}</div>
                        </div>
                        <div class="text-right">
                             <div class="text-[8px] text-gray-400 uppercase tracking-widest mb-0.5">Expires</div>
                             <div class="font-mono text-sm">12/28</div>
                        </div>
                    </div>
                </div>
            `;
        }
        // 3. GENERIC ID CARD (WHITE/SIMPLE)
        else {
             cardContent = `
                <div class="bg-white w-full max-w-[400px] h-[250px] rounded-2xl relative z-10 overflow-hidden text-gray-900 p-6 flex flex-col justify-between shadow-2xl transform scale-110 border-2 border-gray-300">
                    <div class="flex justify-between items-center border-b-2 border-gray-800 pb-3">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 bg-gray-900 text-white flex items-center justify-center font-bold text-xl rounded">US</div>
                            <div>
                                <h3 class="font-black text-xl uppercase tracking-tighter">Identification</h3>
                                <div class="text-[10px] font-bold uppercase text-gray-500 tracking-widest">United States of America</div>
                            </div>
                        </div>
                    </div>

                    <div class="flex gap-4 mt-4 h-full">
                        <div class="w-28 bg-gray-200 border border-gray-300 rounded overflow-hidden shrink-0 relative">
                             ${state.user.avatar ? `<img src="${state.user.avatar}" class="w-full h-full object-cover grayscale">` : ''}
                        </div>
                        <div class="flex-1 flex flex-col justify-center space-y-3">
                            <div>
                                <div class="text-[9px] font-bold text-gray-400 uppercase">Name</div>
                                <div class="font-bold text-xl uppercase">${char.last_name}, ${char.first_name}</div>
                            </div>
                            <div class="grid grid-cols-2 gap-2">
                                <div>
                                    <div class="text-[9px] font-bold text-gray-400 uppercase">Birth Date</div>
                                    <div class="font-mono font-bold">${birthDate}</div>
                                </div>
                                <div>
                                    <div class="text-[9px] font-bold text-gray-400 uppercase">Sex</div>
                                    <div class="font-mono font-bold">M</div>
                                </div>
                            </div>
                            <div>
                                <div class="text-[9px] font-bold text-gray-400 uppercase">ID Number</div>
                                <div class="font-mono text-sm tracking-widest text-red-600">${char.id.substring(0,8).toUpperCase()}</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        documentHtml = `
            <div class="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in">
                <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" onclick="actions.closeIdCard()"></div>
                ${cardContent}
                <button onclick="actions.closeIdCard()" class="absolute top-10 right-10 text-white hover:text-gray-300 z-50">
                    <i data-lucide="x-circle" class="w-10 h-10"></i>
                </button>
            </div>
        `;
    }

    // --- MY CRIMINAL RECORD MODAL ---
    let myRecordHtml = '';
    if (state.criminalRecordTarget && state.criminalRecordTarget.id === state.activeCharacter.id) {
        const reports = state.criminalRecordReports || [];
        myRecordHtml = `
            <div class="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in">
                <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" onclick="actions.closeMyRecord()"></div>
                <div class="glass-panel w-full max-w-2xl p-6 rounded-2xl relative z-10 flex flex-col max-h-[85vh]">
                    <div class="flex justify-between items-start mb-6 border-b border-white/10 pb-4">
                        <div>
                            <h3 class="text-xl font-bold text-white">Mon Casier Judiciaire</h3>
                            <p class="text-sm text-gray-400">Dossier: <span class="text-white font-bold">${state.activeCharacter.first_name} ${state.activeCharacter.last_name}</span></p>
                        </div>
                        <button onclick="actions.closeMyRecord()" class="text-gray-500 hover:text-white"><i data-lucide="x" class="w-6 h-6"></i></button>
                    </div>

                    <div class="flex-1 overflow-y-auto custom-scrollbar space-y-3">
                        ${reports.length > 0 ? reports.map(r => `
                            <div class="bg-white/5 p-4 rounded-xl border border-white/5">
                                <div class="flex justify-between items-start mb-2">
                                    <div class="font-bold text-white text-sm uppercase text-orange-400">${r.title}</div>
                                    <div class="text-xs text-gray-500">${new Date(r.created_at).toLocaleDateString()}</div>
                                </div>
                                <div class="text-sm text-gray-300 mb-3 italic">"${r.description}"</div>
                                <div class="flex gap-4 text-xs">
                                    <div class="bg-red-500/10 px-2 py-1 rounded text-red-300 border border-red-500/20">Amende: $${r.fine_amount}</div>
                                    <div class="bg-blue-500/10 px-2 py-1 rounded text-blue-300 border border-blue-500/20">Prison: ${Math.round(r.jail_time / 60)} min</div>
                                </div>
                                <div class="text-[10px] text-gray-500 mt-2 text-right">Officier: ${r.author_id}</div>
                            </div>
                        `).join('') : '<div class="text-center text-gray-500 py-10 italic">Votre casier est vierge.</div>'}
                    </div>
                </div>
            </div>
        `;
    }

    // --- TABS ---
    const tabs = [
        { id: 'overview', label: 'Vue d\'Ensemble', icon: 'pie-chart' },
        { id: 'inventory', label: 'Inventaire', icon: 'backpack' }
    ];

    let content = '';

    // --- TAB: OVERVIEW ---
    if (state.activeAssetsTab === 'overview') {
        content = `
            <div class="space-y-6">
                 <!-- Global Wealth Card -->
                <div class="glass-card p-8 rounded-[30px] bg-gradient-to-r from-gray-900 to-black border-indigo-500/20 relative overflow-hidden text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-6">
                    <div class="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -mr-16 -mt-16"></div>
                    
                    <div>
                        <div class="flex items-center gap-2 justify-center md:justify-start mb-2">
                            <i data-lucide="gem" class="w-5 h-5 text-indigo-400"></i>
                            <span class="text-xs font-bold text-indigo-400 uppercase tracking-widest">Patrimoine Total Estimé</span>
                        </div>
                        <div class="text-5xl font-bold text-white tracking-tighter mb-1">$ ${state.patrimonyTotal.toLocaleString()}</div>
                        <p class="text-gray-500 text-xs">Cumul: Banque + Espèces + Valeur Objets</p>
                    </div>

                    <div class="flex gap-4">
                        <div class="bg-white/5 px-5 py-3 rounded-2xl border border-white/5">
                            <div class="text-[10px] text-gray-400 uppercase">Banque</div>
                            <div class="font-mono font-bold text-emerald-400">$ ${state.bankAccount.bank_balance.toLocaleString()}</div>
                        </div>
                        <div class="bg-white/5 px-5 py-3 rounded-2xl border border-white/5">
                            <div class="text-[10px] text-gray-400 uppercase">Physique</div>
                            <div class="font-mono font-bold text-indigo-400">$ ${(state.patrimonyTotal - state.bankAccount.bank_balance).toLocaleString()}</div>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="glass-panel p-6 rounded-2xl flex flex-col items-center text-center">
                        <div class="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 mb-4">
                            <i data-lucide="id-card" class="w-8 h-8"></i>
                        </div>
                        <h3 class="font-bold text-white text-lg">Documents d'Identité</h3>
                        <p class="text-sm text-gray-400 mb-6">Permis, Carte d'identité & Casier</p>
                        <div class="grid grid-cols-2 gap-3 w-full">
                             <button onclick="actions.openIdCard(null, 'id_card')" class="glass-btn w-full py-3 rounded-xl font-bold">Identité</button>
                             <button onclick="actions.openMyRecord()" class="glass-btn-secondary w-full py-3 rounded-xl font-bold text-xs text-orange-300 hover:bg-orange-500/10 border-orange-500/20">Mon Casier</button>
                        </div>
                    </div>
                    
                     <div class="glass-panel p-6 rounded-2xl flex flex-col items-center text-center opacity-75">
                        <div class="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center text-orange-400 mb-4">
                            <i data-lucide="car-front" class="w-8 h-8"></i>
                        </div>
                        <h3 class="font-bold text-white text-lg">Véhicules (ERLC)</h3>
                        <p class="text-sm text-gray-400 mb-6">Gestion via concessionnaire en jeu</p>
                        <button disabled class="glass-btn-secondary w-full py-3 rounded-xl font-bold cursor-not-allowed">Synchronisation auto</button>
                    </div>
                </div>
            </div>
        `;
    }

    // --- TAB: INVENTORY ---
    else if (state.activeAssetsTab === 'inventory') {
         let combinedInventory = [];
        if (state.bankAccount.cash_balance > 0) {
            combinedInventory.push({
                id: 'cash',
                name: 'Espèces (Liquide)',
                quantity: state.bankAccount.cash_balance,
                estimated_value: 1,
                is_cash: true
            });
        }
        combinedInventory = [...combinedInventory, ...state.inventory];

        if (state.inventoryFilter) {
            const lower = state.inventoryFilter.toLowerCase();
            combinedInventory = combinedInventory.filter(i => i.name.toLowerCase().includes(lower));
        }

        const inventoryHtml = combinedInventory.length > 0 
            ? combinedInventory.map(generateInventoryRow).join('')
            : `<div class="text-center text-gray-500 py-10 italic">Aucun objet trouvé.</div>`;
        
        content = `
            <div class="glass-panel rounded-2xl p-6 h-full flex flex-col">
                <div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <h3 class="text-lg font-bold text-white flex items-center gap-2">
                        <i data-lucide="backpack" class="w-5 h-5 text-gray-400"></i>
                        Liste des Objets
                    </h3>
                    
                    <div class="relative w-full md:w-64">
                        <i data-lucide="search" class="w-4 h-4 absolute left-3 top-3 text-gray-500"></i>
                        <input type="text" 
                            oninput="actions.handleInventorySearch(this.value)" 
                            value="${state.inventoryFilter}"
                            placeholder="Rechercher un objet..." 
                            class="glass-input pl-10 pr-4 py-2.5 rounded-xl w-full text-sm">
                    </div>
                </div>

                <div class="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-1" id="inventory-list-container">
                    ${inventoryHtml}
                </div>
            </div>
        `;
    }

    return `
        ${documentHtml}
        ${myRecordHtml}
        <div class="animate-fade-in max-w-7xl mx-auto h-full flex flex-col">
             <!-- HEADER NAV -->
            <div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div>
                    <h2 class="text-2xl font-bold text-white flex items-center gap-2">
                        <i data-lucide="gem" class="w-6 h-6 text-indigo-500"></i>
                        Gestion de Patrimoine
                    </h2>
                    <p class="text-gray-400 text-sm">Biens personnels et inventaire</p>
                </div>
                <div class="flex gap-2 bg-white/5 p-1 rounded-xl overflow-x-auto max-w-full">
                    ${tabs.map(t => `
                        <button onclick="actions.setAssetsTab('${t.id}')" 
                            class="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all whitespace-nowrap ${state.activeAssetsTab === t.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}">
                            <i data-lucide="${t.icon}" class="w-4 h-4"></i> ${t.label}
                        </button>
                    `).join('')}
                </div>
            </div>

            <div class="flex-1 overflow-hidden relative overflow-y-auto custom-scrollbar">
                ${content}
            </div>
        </div>
    `;
};