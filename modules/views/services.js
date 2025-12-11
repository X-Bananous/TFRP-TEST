


import { state } from '../state.js';
import { CONFIG } from '../config.js';
import { HEIST_DATA } from './illicit.js';

const refreshBanner = `
    <div class="flex flex-col md:flex-row items-center justify-between p-4 mb-6 bg-blue-500/5 border border-blue-500/10 rounded-xl gap-3">
        <div class="text-xs text-blue-200 flex items-center gap-2">
             <i data-lucide="info" class="w-4 h-4 text-blue-400"></i>
            <span><span class="font-bold">Besoin d'actualiser ?</span> Vous ne trouvez pas ce que vous cherchez ?</span>
        </div>
        <button onclick="actions.refreshCurrentView()" id="refresh-data-btn" class="glass-btn-secondary px-3 py-1.5 rounded-lg text-xs hover:bg-blue-500/10 hover:text-blue-300 flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap w-full md:w-auto justify-center">
            <i data-lucide="refresh-cw" class="w-3 h-3"></i> Recharger les données
        </button>
    </div>
`;

export const ServicesView = () => {
    // ACCESS CONTROL (Job)
    const job = state.activeCharacter?.job || 'unemployed';
    // Only LEO, LAFD, LADOT allowed in this panel generally
    if (!['leo', 'lafd', 'ladot'].includes(job)) {
         return `<div class="h-full flex flex-col items-center justify-center text-gray-500">
            <i data-lucide="shield-off" class="w-16 h-16 mb-4 opacity-50"></i>
            <h2 class="text-xl font-bold text-white">Accès Restreint</h2>
            <p>Ce terminal est réservé au personnel des Services Publics (Job RP requis).</p>
         </div>`;
    }

    // --- SEARCH RESULT MODAL (FOUILLE) ---
    let searchResultModal = '';
    if (state.policeSearchTarget) {
        const { targetName, items, cash } = state.policeSearchTarget;
        
        searchResultModal = `
            <div class="fixed inset-0 z-[70] flex items-center justify-center p-4 animate-fade-in">
                <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" onclick="actions.closePoliceSearch()"></div>
                <div class="glass-panel w-full max-w-lg p-6 rounded-2xl relative z-10 flex flex-col shadow-2xl border border-blue-500/30">
                    <div class="flex justify-between items-start mb-6 border-b border-white/10 pb-4">
                        <div>
                            <h3 class="text-xl font-bold text-white flex items-center gap-2"><i data-lucide="search" class="w-5 h-5 text-blue-400"></i> Résultat Fouille</h3>
                            <p class="text-sm text-gray-400">Citoyen: <span class="text-white font-bold">${targetName}</span></p>
                            <p class="text-[10px] text-blue-300 mt-1 italic"><i data-lucide="info" class="w-3 h-3 inline"></i> Rapport automatique généré.</p>
                        </div>
                        <button onclick="actions.closePoliceSearch()" class="text-gray-500 hover:text-white"><i data-lucide="x" class="w-6 h-6"></i></button>
                    </div>

                    <div class="flex-1 overflow-y-auto custom-scrollbar space-y-2 mb-4">
                         <div class="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                            <div class="flex items-center gap-3">
                                <div class="p-2 bg-emerald-500/20 rounded text-emerald-400"><i data-lucide="banknote" class="w-4 h-4"></i></div>
                                <span class="text-sm font-bold text-white">Argent Liquide</span>
                            </div>
                            <span class="font-mono text-emerald-400">$${cash.toLocaleString()}</span>
                        </div>

                        ${items.length > 0 ? items.map(item => `
                            <div class="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                                <div class="flex items-center gap-3">
                                    <div class="p-2 bg-gray-700 rounded text-gray-300"><i data-lucide="package" class="w-4 h-4"></i></div>
                                    <span class="text-sm font-bold text-white">${item.name}</span>
                                </div>
                                <span class="text-sm text-gray-400">x${item.quantity}</span>
                            </div>
                        `).join('') : '<div class="text-center text-gray-500 py-6 italic">Aucun objet sur la personne.</div>'}
                    </div>
                    
                    <button onclick="actions.closePoliceSearch()" class="glass-btn w-full py-2 rounded-lg text-sm font-bold">Fermer</button>
                </div>
            </div>
        `;
    }

    // --- DOSSIER CITOYEN MODAL ---
    let dossierModal = '';
    if (state.dossierTarget) {
        const c = state.dossierTarget;
        const points = c.driver_license_points !== undefined ? c.driver_license_points : 12;
        const isLicenseValid = points > 0;
        
        // Generate Points Dots
        let dots = '';
        for(let i=1; i<=12; i++) {
            let color = 'bg-gray-700';
            if (i <= points) {
                if(points > 8) color = 'bg-emerald-500';
                else if(points > 4) color = 'bg-orange-500';
                else color = 'bg-red-500';
            }
            dots += `<div class="w-2 h-4 rounded-sm ${color}"></div>`;
        }

        dossierModal = `
            <div class="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in">
                <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" onclick="actions.closeDossier()"></div>
                <div class="glass-panel w-full max-w-4xl p-0 rounded-2xl relative z-10 flex flex-col overflow-hidden shadow-2xl border border-blue-500/20 max-h-[90vh]">
                    
                    <!-- Header -->
                    <div class="bg-gradient-to-r from-blue-900/40 to-black p-6 border-b border-white/10 flex justify-between items-start">
                        <div class="flex items-center gap-4">
                            <div class="w-20 h-20 rounded-2xl bg-gray-800 flex items-center justify-center border-2 border-white/10 shadow-lg">
                                <span class="text-3xl font-bold text-gray-500">${c.first_name[0]}</span>
                            </div>
                            <div>
                                <div class="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Dossier Criminel # ${c.id.substring(0,6).toUpperCase()}</div>
                                <h2 class="text-3xl font-bold text-white leading-none mb-1">${c.last_name.toUpperCase()}, ${c.first_name}</h2>
                                <div class="flex items-center gap-4 text-xs text-gray-400">
                                    <span><i data-lucide="calendar" class="w-3 h-3 inline"></i> ${c.age} Ans</span>
                                    <span><i data-lucide="map-pin" class="w-3 h-3 inline"></i> ${c.birth_place}</span>
                                    <span><i data-lucide="briefcase" class="w-3 h-3 inline"></i> ${c.job || 'Chômeur'}</span>
                                </div>
                            </div>
                        </div>
                        <button onclick="actions.closeDossier()" class="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors"><i data-lucide="x" class="w-6 h-6 text-white"></i></button>
                    </div>

                    <div class="flex-1 overflow-y-auto custom-scrollbar p-6 bg-[#0a0a0a]">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            
                            <!-- LICENSE SECTION -->
                            <div class="glass-panel p-6 rounded-xl border border-white/5">
                                <div class="flex justify-between items-center mb-4">
                                    <h3 class="font-bold text-white flex items-center gap-2"><i data-lucide="car" class="w-5 h-5 text-orange-400"></i> Permis de Conduire</h3>
                                    <span class="px-2 py-1 rounded text-[10px] font-bold uppercase ${isLicenseValid ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}">
                                        ${isLicenseValid ? 'VALIDE' : 'SUSPENDU / INVALIDE'}
                                    </span>
                                </div>
                                
                                <div class="bg-black/30 p-4 rounded-xl border border-white/5 mb-4">
                                    <div class="flex justify-between text-xs text-gray-400 mb-2 uppercase font-bold">
                                        <span>Solde de Points</span>
                                        <span>${points}/12</span>
                                    </div>
                                    <div class="flex gap-1 mb-2 justify-between">
                                        ${dots}
                                    </div>
                                    <p class="text-[10px] text-gray-500 italic text-center">Récupération automatique: 1 point / 24h.</p>
                                </div>

                                ${isLicenseValid ? `
                                    <div class="bg-red-900/10 border border-red-500/20 p-3 rounded-xl">
                                        <label class="text-[10px] font-bold text-red-400 uppercase mb-2 block">Retrait de points (Sanction)</label>
                                        <div class="grid grid-cols-3 gap-2">
                                            <button onclick="actions.updateLicensePoints('${c.id}', 1)" class="py-2 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400 text-xs font-bold rounded border border-red-500/20 transition-colors">-1 Pt</button>
                                            <button onclick="actions.updateLicensePoints('${c.id}', 3)" class="py-2 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400 text-xs font-bold rounded border border-red-500/20 transition-colors">-3 Pts</button>
                                            <button onclick="actions.updateLicensePoints('${c.id}', 6)" class="py-2 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400 text-xs font-bold rounded border border-red-500/20 transition-colors">-6 Pts</button>
                                        </div>
                                    </div>
                                ` : `
                                    <div class="bg-red-500/10 p-3 rounded-xl border border-red-500/20 text-center">
                                        <p class="text-xs text-red-300 font-bold">Permis Invalide.</p>
                                        <p class="text-[10px] text-red-200">Le conducteur n'est plus autorisé à conduire. Véhicule immobilisable.</p>
                                    </div>
                                `}
                            </div>

                            <!-- ACTIONS GRID -->
                            <div class="grid grid-cols-1 gap-4">
                                <button onclick="actions.openCriminalRecord('${c.id}')" class="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-blue-500/30 transition-all flex items-center gap-4 text-left group">
                                    <div class="p-3 rounded-full bg-blue-500/20 text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors"><i data-lucide="file-clock" class="w-6 h-6"></i></div>
                                    <div>
                                        <div class="font-bold text-white">Casier Judiciaire</div>
                                        <div class="text-xs text-gray-400">Consulter l'historique</div>
                                    </div>
                                </button>

                                <button onclick="actions.performPoliceSearch('${c.id}', '${c.first_name} ${c.last_name}')" class="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-purple-500/30 transition-all flex items-center gap-4 text-left group">
                                    <div class="p-3 rounded-full bg-purple-500/20 text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-colors"><i data-lucide="search" class="w-6 h-6"></i></div>
                                    <div>
                                        <div class="font-bold text-white">Fouille Corporelle</div>
                                        <div class="text-xs text-gray-400">Inventaire & Argent (Rapport Auto)</div>
                                    </div>
                                </button>

                                <button onclick="actions.addSuspectToReport('${c.id}'); actions.closeDossier();" class="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-red-500/30 transition-all flex items-center gap-4 text-left group">
                                    <div class="p-3 rounded-full bg-red-500/20 text-red-400 group-hover:bg-red-500 group-hover:text-white transition-colors"><i data-lucide="file-plus" class="w-6 h-6"></i></div>
                                    <div>
                                        <div class="font-bold text-white">Nouveau Rapport</div>
                                        <div class="text-xs text-gray-400">Ajouter comme suspect</div>
                                    </div>
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        `;
    }


    // TABS DEFINITION
    let tabs = [];
    if (job === 'leo') {
        tabs = [
            { id: 'dispatch', label: 'Dispatch Central', icon: 'radio' },
            { id: 'directory', label: 'Annuaire & Casiers', icon: 'folder-search' },
            { id: 'reports', label: 'Rédaction Rapport', icon: 'file-text' },
            { id: 'map', label: 'Véhicules', icon: 'car-front' }
        ];
    } else {
         tabs = [
            { id: 'dispatch', label: 'Dispatch Central', icon: 'radio' }
        ];
    }

    if (!tabs.find(t => t.id === state.activeServicesTab)) {
        setTimeout(() => actions.setServicesTab('dispatch'), 0);
        return '';
    }

    let content = '';

    // --- TAB: DISPATCH ---
    if (state.activeServicesTab === 'dispatch') {
        const heists = state.globalActiveHeists || [];
        const activeAlerts = heists.filter(h => {
            const duration = Date.now() - new Date(h.start_time).getTime();
            return duration > 30000; 
        });

        const allCalls = state.emergencyCalls || [];
        const filteredCalls = allCalls.filter(c => {
            if (job === 'leo') return c.service === 'police';
            if (job === 'lafd') return c.service === 'ems';
            if (job === 'ladot') return c.service === 'dot';
            return false;
        });

        content = `
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                <!-- COL 1: ALERTS & HEISTS -->
                <div class="flex flex-col gap-6">
                    <div class="glass-panel p-6 rounded-2xl flex-1">
                        <h3 class="font-bold text-white mb-4 flex items-center gap-2">
                            <i data-lucide="siren" class="w-5 h-5 text-red-500 animate-pulse"></i> 
                            Alertes Prioritaires (Code 3)
                        </h3>
                        <div class="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
                            ${activeAlerts.length > 0 ? activeAlerts.map(h => {
                                const hData = HEIST_DATA.find(d => d.id === h.heist_type);
                                return `
                                    <div class="bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r-xl relative overflow-hidden">
                                        <div class="absolute right-2 top-2 text-red-500/20"><i data-lucide="alert-triangle" class="w-12 h-12"></i></div>
                                        <div class="font-bold text-red-200 text-sm uppercase mb-1 flex items-center gap-2">
                                            <span class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                                            Braquage en cours
                                        </div>
                                        <div class="font-bold text-white text-lg">${hData ? hData.name : h.heist_type}</div>
                                        ${h.location ? `
                                            <div class="text-sm font-bold text-white bg-red-500/10 p-2 rounded mt-2 border border-red-500/20 flex items-center gap-2">
                                                <i data-lucide="map-pin" class="w-4 h-4"></i> ${h.location}
                                            </div>
                                        ` : ''}
                                        <div class="text-xs text-red-300 mt-2">Suspects sur place. Intervention requise.</div>
                                    </div>
                                `;
                            }).join('') : '<div class="text-gray-500 italic text-sm text-center py-8 bg-white/5 rounded-xl border border-white/5">Aucune alerte majeure en cours.</div>'}
                        </div>
                    </div>
                </div>

                <!-- COL 2: 911 CALLS -->
                <div class="glass-panel p-6 rounded-2xl flex flex-col">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="font-bold text-white flex items-center gap-2">
                            <i data-lucide="radio" class="w-5 h-5 text-blue-400"></i>
                            Appels 911 (${job.toUpperCase()})
                        </h3>
                        <div class="text-xs text-gray-500 bg-black/30 px-2 py-1 rounded">Live Feed</div>
                    </div>

                    <div class="space-y-3 flex-1 overflow-y-auto custom-scrollbar">
                        ${filteredCalls.length > 0 ? filteredCalls.map(c => `
                            <div class="bg-white/5 p-4 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                                <div class="flex justify-between items-start mb-2">
                                    <div class="flex items-center gap-2">
                                        <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase ${c.service === 'police' ? 'bg-blue-500/20 text-blue-300' : c.service === 'ems' ? 'bg-red-500/20 text-red-300' : 'bg-yellow-500/20 text-yellow-300'}">${c.service}</span>
                                        <span class="text-xs text-gray-400 font-mono">${c.location}</span>
                                    </div>
                                    <span class="text-[10px] text-gray-500">${new Date(c.created_at).toLocaleTimeString()}</span>
                                </div>
                                <div class="text-sm text-white font-medium mb-1">"${c.description}"</div>
                                <div class="text-[10px] text-gray-500 flex items-center gap-1"><i data-lucide="user" class="w-3 h-3"></i> ${c.caller_id}</div>
                            </div>
                        `).join('') : '<div class="text-gray-500 italic text-sm text-center py-10">Aucun appel en attente.</div>'}
                    </div>
                </div>
            </div>
        `;
    }

    // --- TAB: DIRECTORY (MODIFIED) ---
    else if (state.activeServicesTab === 'directory') {
        let citizens = state.allCharactersAdmin || [];
        if (state.servicesSearchQuery) {
            const q = state.servicesSearchQuery.toLowerCase();
            citizens = citizens.filter(c => c.first_name.toLowerCase().includes(q) || c.last_name.toLowerCase().includes(q));
        }

        content = `
            <div class="flex flex-col h-full">
                ${refreshBanner}
                <div class="mb-6 relative">
                    <i data-lucide="search" class="w-4 h-4 absolute left-3 top-3.5 text-gray-500"></i>
                    <input type="text" 
                        oninput="actions.searchServices(this.value)" 
                        value="${state.servicesSearchQuery}"
                        placeholder="Rechercher un citoyen par nom..." 
                        class="glass-input pl-10 p-3 rounded-xl w-full text-sm">
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto custom-scrollbar flex-1 pb-4">
                    ${citizens.map(c => `
                        <div class="bg-white/5 p-4 rounded-xl border border-white/5 flex items-center justify-between gap-4 group hover:border-blue-500/30 transition-all">
                            <div class="flex items-center gap-4 flex-1 min-w-0">
                                <div class="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 font-bold text-lg border border-white/10 shrink-0">
                                    ${c.first_name[0]}
                                </div>
                                <div class="flex-1 min-w-0">
                                    <div class="font-bold text-white text-sm truncate">${c.first_name} ${c.last_name}</div>
                                    <div class="text-xs text-gray-400 mb-1">${c.age} Ans</div>
                                    ${c.job && c.job !== 'unemployed' ? `<span class="text-[9px] uppercase px-1.5 py-0.5 rounded bg-blue-900/50 text-blue-300">${c.job}</span>` : ''}
                                </div>
                            </div>
                            
                            <button onclick="actions.openDossier('${c.id}')" class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-blue-600/20 shrink-0">
                                Ouvrir Dossier
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // --- TAB: REPORTS ---
    else if (state.activeServicesTab === 'reports') {
        const suspectsList = state.reportSuspects.map((s, idx) => `
            <div class="flex items-center justify-between bg-white/5 p-2 rounded-lg text-sm border border-white/5">
                <span class="text-white font-medium">${s.name}</span>
                <button onclick="actions.removeSuspectFromReport(${idx})" class="text-red-400 hover:text-white"><i data-lucide="x" class="w-3 h-3"></i></button>
            </div>
        `).join('');

        content = `
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full overflow-hidden">
                <div class="glass-panel p-6 rounded-2xl flex flex-col h-full overflow-y-auto custom-scrollbar">
                    <h3 class="font-bold text-white mb-4 flex items-center gap-2"><i data-lucide="pen-tool" class="w-4 h-4 text-blue-400"></i> Nouveau Rapport</h3>
                    
                    <div class="mb-4">
                        <label class="text-xs text-gray-500 uppercase font-bold ml-1 mb-2 block">Suspects Concernés</label>
                        ${suspectsList ? `<div class="space-y-2 mb-2">${suspectsList}</div>` : ''}
                        <button onclick="actions.setServicesTab('directory')" class="w-full py-2 bg-white/5 border border-dashed border-gray-600 rounded-lg text-xs text-gray-400 hover:text-white hover:border-gray-400 transition-colors flex items-center justify-center gap-2">
                            <i data-lucide="plus" class="w-3 h-3"></i> Ajouter un suspect depuis l'annuaire
                        </button>
                    </div>

                    <form onsubmit="actions.submitPoliceReport(event)" class="space-y-4">
                        <div>
                            <label class="text-xs text-gray-500 uppercase font-bold ml-1">Titre de l'infraction</label>
                            <input type="text" name="title" class="glass-input w-full p-2 rounded-lg text-sm" placeholder="Ex: Excès de vitesse" required>
                        </div>
                        <div>
                            <label class="text-xs text-gray-500 uppercase font-bold ml-1">Description / Preuves</label>
                            <textarea name="description" rows="3" class="glass-input w-full p-2 rounded-lg text-sm" placeholder="Détails de l'incident..."></textarea>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="text-xs text-gray-500 uppercase font-bold ml-1">Amende ($)</label>
                                <input type="number" name="fine_amount" class="glass-input w-full p-2 rounded-lg text-sm" value="0" max="25000">
                                <div class="text-[9px] text-gray-500 mt-1">Max: $25,000</div>
                            </div>
                            <div>
                                <label class="text-xs text-gray-500 uppercase font-bold ml-1">Peine (Secondes)</label>
                                <input type="number" name="jail_time" class="glass-input w-full p-2 rounded-lg text-sm" value="0">
                            </div>
                        </div>
                        <button type="submit" class="glass-btn w-full py-3 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-500">
                            Archiver le Rapport
                        </button>
                    </form>
                </div>
                <div class="glass-panel p-6 rounded-2xl lg:col-span-2 flex flex-col justify-center items-center text-center text-gray-500 h-full">
                    <i data-lucide="file-archive" class="w-16 h-16 mb-4 opacity-50"></i>
                    <h3 class="text-xl font-bold text-white mb-2">Gestion des Rapports</h3>
                    <p class="max-w-md">Sélectionnez des suspects via l'annuaire pour commencer un rapport.<br>Les amendes sont prélevées automatiquement.</p>
                </div>
            </div>
        `;
    }

    // --- TAB: MAP / VEHICULES (UPDATED) ---
    else if (state.activeServicesTab === 'map') {
        let vehicles = state.erlcData.vehicles || [];

        // Search Filter
        if(state.vehicleSearchQuery) {
            const q = state.vehicleSearchQuery.toLowerCase();
            vehicles = vehicles.filter(v => 
                (v.Name && v.Name.toLowerCase().includes(q)) || 
                (v.Owner && v.Owner.toLowerCase().includes(q)) || 
                (v.Texture && v.Texture.toLowerCase().includes(q))
            );
        }

        content = `
            <div class="h-full flex flex-col">
                <div class="flex justify-between items-center mb-6">
                    <div>
                        <h3 class="font-bold text-white text-xl flex items-center gap-2">
                            <i data-lucide="radar" class="w-6 h-6 text-indigo-500"></i> 
                            Base de Données Véhicules
                        </h3>
                        <p class="text-sm text-gray-400">Registre ERLC en temps réel.</p>
                    </div>
                    <div class="bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-lg">
                        <span class="text-indigo-300 text-xs font-bold uppercase tracking-wider">Total: ${state.erlcData.vehicles ? state.erlcData.vehicles.length : 0}</span>
                    </div>
                </div>
                
                ${refreshBanner}

                <div class="mb-4 relative">
                     <i data-lucide="search" class="w-4 h-4 absolute left-3 top-3 text-gray-500"></i>
                     <input type="text" 
                        oninput="actions.searchVehicles(this.value)" 
                        value="${state.vehicleSearchQuery}" 
                        placeholder="Plaque, Modèle ou Propriétaire..." 
                        class="glass-input pl-10 w-full p-2.5 rounded-xl text-sm">
                </div>

                <div class="glass-panel overflow-hidden rounded-xl flex-1 flex flex-col">
                    <div class="overflow-y-auto custom-scrollbar flex-1">
                        <table class="w-full text-left border-collapse">
                            <thead class="bg-white/5 text-xs uppercase text-gray-500 font-bold sticky top-0 backdrop-blur-md">
                                <tr>
                                    <th class="p-4 border-b border-white/5">Véhicule</th>
                                    <th class="p-4 border-b border-white/5">Propriétaire</th>
                                    <th class="p-4 border-b border-white/5">Texture / Livery</th>
                                    <th class="p-4 border-b border-white/5 text-right">Statut</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-white/5 text-sm">
                                ${vehicles.length > 0 ? vehicles.map(v => {
                                    const isPolice = v.Name?.toLowerCase().includes('police') || v.Name?.toLowerCase().includes('sheriff') || v.Name?.toLowerCase().includes('lapd');
                                    const isCivil = !isPolice && !v.Name?.toLowerCase().includes('ems') && !v.Name?.toLowerCase().includes('fire');
                                    
                                    return `
                                    <tr class="hover:bg-white/5 transition-colors">
                                        <td class="p-4 font-bold text-white">${v.Name || 'Inconnu'}</td>
                                        <td class="p-4 text-gray-300">${v.Owner || 'Non identifié'}</td>
                                        <td class="p-4 text-gray-400">${v.Texture || 'Standard'}</td>
                                        <td class="p-4 text-right">
                                            <span class="text-[10px] px-2 py-0.5 rounded font-bold uppercase ${isPolice ? 'bg-blue-500/20 text-blue-300' : isCivil ? 'bg-gray-500/20 text-gray-300' : 'bg-orange-500/20 text-orange-300'}">
                                                ${isPolice ? 'Police' : isCivil ? 'Civil' : 'Service'}
                                            </span>
                                        </td>
                                    </tr>
                                    `;
                                }).join('') : '<tr><td colspan="4" class="p-8 text-center text-gray-500 italic">Aucun véhicule correspondant.</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }

    // --- MODAL: CRIMINAL RECORD (Keep for non-Dossier flows or fallback) ---
    let recordModal = '';
    if (state.criminalRecordTarget) {
        const reports = state.criminalRecordReports || [];
        recordModal = `
            <div class="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in">
                <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" onclick="actions.closeCriminalRecord()"></div>
                <div class="glass-panel w-full max-w-2xl p-6 rounded-2xl relative z-10 flex flex-col max-h-[85vh]">
                    <div class="flex justify-between items-start mb-6 border-b border-white/10 pb-4">
                        <div>
                            <h3 class="text-xl font-bold text-white">Casier Judiciaire</h3>
                            <p class="text-sm text-gray-400">Dossier: <span class="text-white font-bold">${state.criminalRecordTarget.first_name} ${state.criminalRecordTarget.last_name}</span></p>
                        </div>
                        <button onclick="actions.closeCriminalRecord()" class="text-gray-500 hover:text-white"><i data-lucide="x" class="w-6 h-6"></i></button>
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
                        `).join('') : '<div class="text-center text-gray-500 py-10 italic">Casier vierge.</div>'}
                    </div>
                </div>
            </div>
        `;
    }

    return `
        ${searchResultModal}
        ${dossierModal}
        ${recordModal}
        <div class="animate-fade-in max-w-7xl mx-auto h-full flex flex-col">
            <!-- HEADER NAV -->
            <div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div>
                    <h2 class="text-2xl font-bold text-white flex items-center gap-2">
                        <i data-lucide="shield" class="w-6 h-6 text-blue-500"></i>
                        Terminal Services Publics
                    </h2>
                    <p class="text-gray-400 text-sm">Session sécurisée: <span class="text-blue-400 uppercase font-bold">${job}</span></p>
                </div>
                <div class="flex gap-2 bg-white/5 p-1 rounded-xl overflow-x-auto max-w-full">
                    ${tabs.map(t => `
                        <button onclick="actions.setServicesTab('${t.id}')" 
                            class="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all whitespace-nowrap ${state.activeServicesTab === t.id ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}">
                            <i data-lucide="${t.icon}" class="w-4 h-4"></i> ${t.label}
                        </button>
                    `).join('')}
                </div>
            </div>

            <div class="flex-1 overflow-hidden relative">
                ${content}
            </div>
        </div>
    `;
};