
import { state } from '../state.js';
import { CONFIG } from '../config.js';
import { HEIST_DATA } from './illicit.js';

const refreshBanner = `
    <div class="flex flex-col md:flex-row items-center justify-between px-4 py-3 mb-4 bg-blue-500/5 border-y border-blue-500/10 gap-3 shrink-0">
        <div class="text-xs text-blue-200 flex items-center gap-2">
             <div class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </div>
            <span><span class="font-bold">CAD System v2.4</span> • Connexion Sécurisée</span>
        </div>
        <button onclick="actions.refreshCurrentView()" id="refresh-data-btn" class="text-xs text-blue-400 hover:text-white flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap">
            <i data-lucide="refresh-cw" class="w-3 h-3"></i> Actualiser Données
        </button>
    </div>
`;

export const ServicesView = () => {
    // ACCESS CONTROL (Job)
    const job = state.activeCharacter?.job || 'unemployed';
    // Only LEO, LAFD, LADOT allowed in this panel generally
    if (!['leo', 'lafd', 'ladot'].includes(job)) {
         return `<div class="h-full flex flex-col items-center justify-center text-gray-500 animate-fade-in">
            <div class="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mb-6 border border-gray-700">
                <i data-lucide="shield-off" class="w-10 h-10 opacity-50"></i>
            </div>
            <h2 class="text-xl font-bold text-white mb-2">Accès Restreint</h2>
            <p class="text-sm">Ce terminal est réservé au personnel des Services Publics.</p>
            <div class="mt-4 px-3 py-1 rounded bg-red-500/10 text-red-400 text-xs border border-red-500/20 uppercase font-bold">Job RP Requis</div>
         </div>`;
    }

    // --- MODALS (Search, Dossier, etc.) ---
    // (Considérés comme des overlays, ils ne cassent pas le layout principal)
    let searchResultModal = '';
    if (state.policeSearchTarget) {
        const { targetName, items, cash } = state.policeSearchTarget;
        searchResultModal = `
            <div class="fixed inset-0 z-[70] flex items-center justify-center p-4 animate-fade-in">
                <div class="absolute inset-0 bg-black/90 backdrop-blur-md" onclick="actions.closePoliceSearch()"></div>
                <div class="glass-panel w-full max-w-lg p-0 rounded-2xl relative z-10 flex flex-col shadow-2xl border border-blue-500/30 overflow-hidden">
                    <div class="bg-blue-900/20 p-4 border-b border-white/10 flex justify-between items-center">
                        <h3 class="text-lg font-bold text-white flex items-center gap-2"><i data-lucide="search" class="w-5 h-5 text-blue-400"></i> Résultat Fouille</h3>
                        <button onclick="actions.closePoliceSearch()" class="text-gray-400 hover:text-white"><i data-lucide="x" class="w-5 h-5"></i></button>
                    </div>
                    <div class="p-6 bg-[#0a0a0a]">
                        <p class="text-sm text-gray-400 mb-4">Citoyen: <span class="text-white font-bold uppercase">${targetName}</span></p>
                        <div class="space-y-2 mb-6 max-h-[300px] overflow-y-auto custom-scrollbar">
                             <div class="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                                <div class="flex items-center gap-3">
                                    <i data-lucide="banknote" class="w-4 h-4 text-emerald-400"></i>
                                    <span class="text-sm font-bold text-white">Argent Liquide</span>
                                </div>
                                <span class="font-mono text-emerald-400">$${cash.toLocaleString()}</span>
                            </div>
                            ${items.length > 0 ? items.map(item => `
                                <div class="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                                    <div class="flex items-center gap-3">
                                        <i data-lucide="package" class="w-4 h-4 text-gray-400"></i>
                                        <span class="text-sm font-bold text-white">${item.name}</span>
                                    </div>
                                    <span class="text-sm text-gray-400">x${item.quantity}</span>
                                </div>
                            `).join('') : '<div class="text-center text-gray-500 py-4 italic text-sm">Aucun objet illégal visible.</div>'}
                        </div>
                        <button onclick="actions.closePoliceSearch()" class="glass-btn w-full py-3 rounded-xl text-sm font-bold">Fermer le rapport</button>
                    </div>
                </div>
            </div>
        `;
    }

    let dossierModal = '';
    if (state.dossierTarget) {
        const c = state.dossierTarget;
        const points = c.driver_license_points !== undefined ? c.driver_license_points : 12;
        const isLicenseValid = points > 0;
        
        let dots = '';
        for(let i=1; i<=12; i++) {
            let color = 'bg-gray-800';
            if (i <= points) {
                if(points > 8) color = 'bg-emerald-500';
                else if(points > 4) color = 'bg-orange-500';
                else color = 'bg-red-500';
            }
            dots += `<div class="flex-1 h-2 rounded-full ${color}"></div>`;
        }

        dossierModal = `
            <div class="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in">
                <div class="absolute inset-0 bg-black/90 backdrop-blur-md" onclick="actions.closeDossier()"></div>
                <div class="glass-panel w-full max-w-4xl p-0 rounded-2xl relative z-10 flex flex-col overflow-hidden shadow-2xl border border-blue-500/20 max-h-[90vh]">
                    
                    <!-- Header Dossier -->
                    <div class="bg-[#0f172a] p-6 border-b border-white/10 flex justify-between items-start shrink-0">
                        <div class="flex items-center gap-5">
                            <div class="w-16 h-16 rounded-xl bg-slate-800 flex items-center justify-center border border-white/10 shadow-inner">
                                <span class="text-2xl font-bold text-slate-500">${c.first_name[0]}</span>
                            </div>
                            <div>
                                <div class="flex items-center gap-2 mb-1">
                                    <h2 class="text-2xl font-bold text-white tracking-tight">${c.last_name.toUpperCase()}, ${c.first_name}</h2>
                                    ${c.job === 'unemployed' ? '' : `<span class="bg-blue-500/20 text-blue-300 text-[10px] px-2 py-0.5 rounded border border-blue-500/30 uppercase font-bold">${c.job}</span>`}
                                </div>
                                <div class="text-xs text-gray-400 font-mono">ID: ${c.id.split('-')[0]} • ${c.birth_place} • ${c.age} Ans</div>
                            </div>
                        </div>
                        <button onclick="actions.closeDossier()" class="p-2 hover:bg-white/10 rounded-full transition-colors"><i data-lucide="x" class="w-6 h-6 text-gray-400"></i></button>
                    </div>

                    <div class="flex-1 overflow-y-auto custom-scrollbar p-6 bg-[#050505]">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            
                            <!-- LICENSE SECTION -->
                            <div class="glass-panel p-5 rounded-xl border border-white/5 bg-white/[0.02]">
                                <div class="flex justify-between items-center mb-4">
                                    <h3 class="font-bold text-white flex items-center gap-2 text-sm"><i data-lucide="car" class="w-4 h-4 text-blue-400"></i> Permis de Conduire</h3>
                                    <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase ${isLicenseValid ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}">
                                        ${isLicenseValid ? 'Valide' : 'Suspendu'}
                                    </span>
                                </div>
                                
                                <div class="bg-black/40 p-4 rounded-lg border border-white/5 mb-4">
                                    <div class="flex justify-between text-xs text-gray-400 mb-2 uppercase font-bold tracking-wider">
                                        <span>Points</span>
                                        <span>${points}/12</span>
                                    </div>
                                    <div class="flex gap-1 mb-2">
                                        ${dots}
                                    </div>
                                </div>

                                ${isLicenseValid ? `
                                    <div class="grid grid-cols-3 gap-2">
                                        <button onclick="actions.updateLicensePoints('${c.id}', 1)" class="py-2 bg-slate-800 hover:bg-red-900/30 hover:border-red-500/30 text-slate-300 hover:text-red-400 text-xs font-bold rounded border border-white/5 transition-colors">-1 Pt</button>
                                        <button onclick="actions.updateLicensePoints('${c.id}', 3)" class="py-2 bg-slate-800 hover:bg-red-900/30 hover:border-red-500/30 text-slate-300 hover:text-red-400 text-xs font-bold rounded border border-white/5 transition-colors">-3 Pts</button>
                                        <button onclick="actions.updateLicensePoints('${c.id}', 6)" class="py-2 bg-slate-800 hover:bg-red-900/30 hover:border-red-500/30 text-slate-300 hover:text-red-400 text-xs font-bold rounded border border-white/5 transition-colors">-6 Pts</button>
                                    </div>
                                ` : ''}
                            </div>

                            <!-- ACTIONS GRID -->
                            <div class="space-y-3">
                                <button onclick="actions.openCriminalRecord('${c.id}')" class="w-full p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-blue-500/30 transition-all flex items-center gap-4 text-left group">
                                    <div class="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:text-white group-hover:bg-blue-500 transition-colors"><i data-lucide="file-clock" class="w-5 h-5"></i></div>
                                    <div>
                                        <div class="font-bold text-white text-sm">Casier Judiciaire</div>
                                        <div class="text-xs text-gray-500">Historique des infractions</div>
                                    </div>
                                    <i data-lucide="chevron-right" class="w-4 h-4 text-gray-600 ml-auto group-hover:text-white"></i>
                                </button>

                                <button onclick="actions.performPoliceSearch('${c.id}', '${c.first_name} ${c.last_name}')" class="w-full p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-purple-500/30 transition-all flex items-center gap-4 text-left group">
                                    <div class="p-2 rounded-lg bg-purple-500/10 text-purple-400 group-hover:text-white group-hover:bg-purple-500 transition-colors"><i data-lucide="search" class="w-5 h-5"></i></div>
                                    <div>
                                        <div class="font-bold text-white text-sm">Fouille Corporelle</div>
                                        <div class="text-xs text-gray-500">Inventaire & Argent</div>
                                    </div>
                                    <i data-lucide="chevron-right" class="w-4 h-4 text-gray-600 ml-auto group-hover:text-white"></i>
                                </button>

                                <button onclick="actions.addSuspectToReport('${c.id}'); actions.closeDossier();" class="w-full p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-red-500/30 transition-all flex items-center gap-4 text-left group">
                                    <div class="p-2 rounded-lg bg-red-500/10 text-red-400 group-hover:text-white group-hover:bg-red-500 transition-colors"><i data-lucide="file-plus" class="w-5 h-5"></i></div>
                                    <div>
                                        <div class="font-bold text-white text-sm">Nouveau Rapport</div>
                                        <div class="text-xs text-gray-500">Ajouter comme suspect</div>
                                    </div>
                                    <i data-lucide="chevron-right" class="w-4 h-4 text-gray-600 ml-auto group-hover:text-white"></i>
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    let recordModal = '';
    if (state.criminalRecordTarget) {
        const reports = state.criminalRecordReports || [];
        recordModal = `
            <div class="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in">
                <div class="absolute inset-0 bg-black/90 backdrop-blur-md" onclick="actions.closeCriminalRecord()"></div>
                <div class="glass-panel w-full max-w-2xl p-0 rounded-2xl relative z-10 flex flex-col max-h-[85vh] overflow-hidden">
                    <div class="p-5 border-b border-white/10 flex justify-between items-center bg-[#0f172a]">
                        <h3 class="text-lg font-bold text-white flex items-center gap-2"><i data-lucide="file-text" class="w-5 h-5 text-gray-400"></i> Casier Judiciaire</h3>
                        <button onclick="actions.closeCriminalRecord()" class="text-gray-400 hover:text-white"><i data-lucide="x" class="w-5 h-5"></i></button>
                    </div>
                    <div class="flex-1 overflow-y-auto custom-scrollbar p-5 bg-[#050505] space-y-3">
                        <div class="text-xs text-gray-500 uppercase font-bold mb-2">Historique pour ${state.criminalRecordTarget.first_name} ${state.criminalRecordTarget.last_name}</div>
                        ${reports.length > 0 ? reports.map(r => `
                            <div class="bg-white/5 p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                                <div class="flex justify-between items-start mb-2">
                                    <div class="font-bold text-orange-400 text-sm">${r.title}</div>
                                    <div class="text-[10px] text-gray-500 bg-black/30 px-2 py-1 rounded">${new Date(r.created_at).toLocaleDateString()}</div>
                                </div>
                                <div class="text-sm text-gray-300 mb-3 leading-relaxed">"${r.description}"</div>
                                <div class="flex gap-2 text-xs border-t border-white/5 pt-3">
                                    <div class="text-red-300"><span class="text-gray-500">Amende:</span> $${r.fine_amount}</div>
                                    <div class="text-gray-500">•</div>
                                    <div class="text-blue-300"><span class="text-gray-500">Prison:</span> ${Math.round(r.jail_time / 60)} min</div>
                                    <div class="ml-auto text-gray-600">Off. ${r.author_id}</div>
                                </div>
                            </div>
                        `).join('') : '<div class="text-center text-gray-500 py-10 italic border border-dashed border-white/10 rounded-xl">Casier vierge.</div>'}
                    </div>
                </div>
            </div>
        `;
    }

    // TABS DEFINITION
    let tabs = [];
    if (job === 'leo') {
        tabs = [
            { id: 'dispatch', label: 'Dispatch', icon: 'radio' },
            { id: 'directory', label: 'Annuaire', icon: 'folder-search' },
            { id: 'reports', label: 'Rapports', icon: 'file-text' },
            { id: 'map', label: 'Véhicules', icon: 'car-front' }
        ];
    } else {
         tabs = [
            { id: 'dispatch', label: 'Dispatch', icon: 'radio' }
        ];
    }

    if (!tabs.find(t => t.id === state.activeServicesTab)) {
        setTimeout(() => actions.setServicesTab('dispatch'), 0);
        return '';
    }

    // CONTENT SWITCHER
    let content = '';

    // === 1. DISPATCH / CENTRAL ===
    if (state.activeServicesTab === 'dispatch') {
        const heists = state.globalActiveHeists || [];
        // Filtre alertes > 30s
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

        // Theme colors based on job
        const themeColor = job === 'leo' ? 'blue' : job === 'lafd' ? 'red' : 'yellow';

        content = `
            <div class="flex flex-col h-full overflow-hidden">
                <!-- DASHBOARD STATS -->
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 shrink-0">
                    <div class="bg-white/5 border border-white/10 p-3 rounded-xl flex items-center justify-between">
                        <div>
                            <div class="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Code 3</div>
                            <div class="text-xl font-bold text-red-500 animate-pulse">${activeAlerts.length}</div>
                        </div>
                        <i data-lucide="siren" class="w-5 h-5 text-red-500/50"></i>
                    </div>
                    <div class="bg-white/5 border border-white/10 p-3 rounded-xl flex items-center justify-between">
                        <div>
                            <div class="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Appels 911</div>
                            <div class="text-xl font-bold text-white">${filteredCalls.length}</div>
                        </div>
                        <i data-lucide="phone-call" class="w-5 h-5 text-gray-500"></i>
                    </div>
                    <div class="bg-white/5 border border-white/10 p-3 rounded-xl flex items-center justify-between">
                        <div>
                            <div class="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Unités</div>
                            <div class="text-xl font-bold text-emerald-400">${state.erlcData.currentPlayers || '?'}</div>
                        </div>
                        <i data-lucide="users" class="w-5 h-5 text-emerald-500/50"></i>
                    </div>
                    <div class="bg-${themeColor}-500/10 border border-${themeColor}-500/20 p-3 rounded-xl flex items-center justify-between">
                        <div>
                            <div class="text-[10px] text-${themeColor}-300 uppercase font-bold tracking-widest">Canal</div>
                            <div class="text-lg font-bold text-${themeColor}-400 uppercase">${job}</div>
                        </div>
                        <i data-lucide="radio" class="w-5 h-5 text-${themeColor}-500"></i>
                    </div>
                </div>

                <!-- MAIN SPLIT VIEW -->
                <div class="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
                    
                    <!-- ALERTES MAJEURES -->
                    <div class="flex-1 flex flex-col bg-red-950/10 border border-red-500/20 rounded-2xl overflow-hidden relative">
                        <div class="p-4 border-b border-red-500/20 bg-red-500/5 flex justify-between items-center shrink-0">
                            <h3 class="font-bold text-red-400 flex items-center gap-2 text-sm uppercase tracking-wider">
                                <span class="relative flex h-3 w-3">
                                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                  <span class="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                </span>
                                Alertes Prioritaires
                            </h3>
                            <span class="text-[10px] text-red-500/60 font-mono">LIVE FEED</span>
                        </div>
                        
                        <div class="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                            ${activeAlerts.length > 0 ? activeAlerts.map(h => {
                                const hData = HEIST_DATA.find(d => d.id === h.heist_type);
                                return `
                                    <div class="bg-black/40 border-l-4 border-red-500 p-4 rounded-r-lg relative overflow-hidden group hover:bg-black/60 transition-colors">
                                        <div class="flex justify-between items-start mb-2">
                                            <div class="font-bold text-white text-lg">${hData ? hData.name : h.heist_type}</div>
                                            <i data-lucide="alert-triangle" class="w-5 h-5 text-red-500 animate-pulse"></i>
                                        </div>
                                        ${h.location ? `
                                            <div class="flex items-center gap-2 text-sm text-red-200 mb-2">
                                                <i data-lucide="map-pin" class="w-4 h-4"></i> ${h.location}
                                            </div>
                                        ` : ''}
                                        <div class="flex gap-2 mt-3">
                                            <button class="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded flex-1 transition-colors">Prendre l'appel</button>
                                            <button class="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-gray-300 text-xs font-bold rounded transition-colors">Ignorer</button>
                                        </div>
                                    </div>
                                `;
                            }).join('') : `
                                <div class="h-full flex flex-col items-center justify-center text-gray-600 opacity-50">
                                    <i data-lucide="check-circle" class="w-12 h-12 mb-2"></i>
                                    <p class="text-sm uppercase font-bold tracking-widest">Secteur Calme</p>
                                </div>
                            `}
                        </div>
                    </div>

                    <!-- FLUX 911 -->
                    <div class="flex-1 flex flex-col bg-white/5 border border-white/5 rounded-2xl overflow-hidden">
                        <div class="p-4 border-b border-white/5 bg-white/[0.02] flex justify-between items-center shrink-0">
                            <h3 class="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-wider">
                                <i data-lucide="radio" class="w-4 h-4 text-blue-400"></i>
                                Appels Entrants
                            </h3>
                            <span class="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px] font-bold">911</span>
                        </div>

                        <div class="flex-1 overflow-y-auto custom-scrollbar p-0">
                            ${filteredCalls.length > 0 ? filteredCalls.map(c => `
                                <div class="p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer group">
                                    <div class="flex justify-between items-start mb-1">
                                        <div class="flex items-center gap-2">
                                            <span class="text-xs font-mono text-gray-500">${new Date(c.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                            <span class="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">${c.caller_id}</span>
                                        </div>
                                        <span class="px-2 py-0.5 bg-white/10 rounded text-[10px] text-gray-400 uppercase tracking-wide">${c.service}</span>
                                    </div>
                                    <div class="text-sm text-gray-300 mb-2 pl-6 border-l-2 border-white/10 group-hover:border-blue-500/50 transition-colors">
                                        "${c.description}"
                                    </div>
                                    <div class="flex items-center gap-2 pl-6">
                                        <i data-lucide="map-pin" class="w-3 h-3 text-gray-500"></i>
                                        <span class="text-xs text-gray-400 font-mono">${c.location}</span>
                                    </div>
                                </div>
                            `).join('') : `
                                <div class="p-8 text-center text-gray-600 italic text-sm">
                                    Aucun appel en attente.
                                </div>
                            `}
                        </div>
                    </div>

                </div>
            </div>
        `;
    }

    // === 2. ANNUAIRE / DIRECTORY ===
    else if (state.activeServicesTab === 'directory') {
        let citizens = state.allCharactersAdmin || [];
        if (state.servicesSearchQuery) {
            const q = state.servicesSearchQuery.toLowerCase();
            citizens = citizens.filter(c => c.first_name.toLowerCase().includes(q) || c.last_name.toLowerCase().includes(q));
        }

        content = `
            <div class="flex flex-col h-full overflow-hidden">
                <div class="flex gap-4 mb-4 shrink-0">
                    <div class="relative flex-1">
                        <i data-lucide="search" class="w-4 h-4 absolute left-3 top-3 text-gray-500"></i>
                        <input type="text" 
                            oninput="actions.searchServices(this.value)" 
                            value="${state.servicesSearchQuery}"
                            placeholder="Rechercher nom, prénom..." 
                            class="glass-input pl-10 w-full p-2.5 rounded-xl text-sm bg-black/20 focus:bg-black/40 transition-colors">
                    </div>
                    <div class="px-4 py-2 bg-white/5 rounded-xl border border-white/5 text-xs text-gray-400 flex items-center gap-2">
                        <i data-lucide="database" class="w-3 h-3"></i>
                        ${citizens.length} Citoyens
                    </div>
                </div>

                <div class="flex-1 overflow-y-auto custom-scrollbar pb-6 pr-2">
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        ${citizens.map(c => `
                            <div class="bg-white/5 rounded-xl border border-white/5 p-4 hover:bg-white/10 hover:border-blue-500/30 transition-all group flex flex-col relative overflow-hidden">
                                <!-- Hover Highlight -->
                                <div class="absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                
                                <div class="flex justify-between items-start mb-3">
                                    <div class="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400 font-bold border border-white/10 text-sm">
                                        ${c.first_name[0]}${c.last_name[0]}
                                    </div>
                                    <button onclick="actions.openDossier('${c.id}')" class="text-xs bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-lg border border-blue-600/20 transition-colors font-medium">
                                        Dossier
                                    </button>
                                </div>
                                
                                <div class="font-bold text-white text-sm mb-0.5 truncate">${c.first_name} ${c.last_name}</div>
                                <div class="text-[10px] text-gray-500 uppercase tracking-widest mb-3">${c.id.split('-')[0]}</div>
                                
                                <div class="mt-auto pt-3 border-t border-white/5 flex justify-between items-center text-xs text-gray-400">
                                    <span>${c.age} Ans</span>
                                    <span>${c.job === 'unemployed' ? 'Sans Emploi' : c.job.toUpperCase()}</span>
                                </div>
                            </div>
                        `).join('')}
                        ${citizens.length === 0 ? '<div class="col-span-full text-center py-10 text-gray-500 italic">Aucun résultat.</div>' : ''}
                    </div>
                </div>
            </div>
        `;
    }

    // === 3. RAPPORTS ===
    else if (state.activeServicesTab === 'reports') {
        const suspectsList = state.reportSuspects.map((s, idx) => `
            <div class="flex items-center justify-between bg-white/5 p-2 rounded-lg text-sm border border-white/10">
                <div class="flex items-center gap-2">
                    <div class="w-6 h-6 rounded bg-gray-700 flex items-center justify-center text-[10px] text-gray-300 font-bold">${s.name[0]}</div>
                    <span class="text-white font-medium">${s.name}</span>
                </div>
                <button onclick="actions.removeSuspectFromReport(${idx})" class="text-gray-500 hover:text-red-400 p-1"><i data-lucide="x" class="w-3 h-3"></i></button>
            </div>
        `).join('');

        content = `
            <div class="flex flex-col lg:flex-row gap-6 h-full overflow-hidden">
                
                <!-- FORMULAIRE (Gauche) -->
                <div class="flex-1 flex flex-col bg-white/5 rounded-2xl border border-white/5 overflow-hidden">
                    <div class="p-5 border-b border-white/5 bg-white/[0.02]">
                        <h3 class="font-bold text-white flex items-center gap-2"><i data-lucide="file-plus" class="w-5 h-5 text-blue-400"></i> Nouveau Rapport</h3>
                    </div>
                    
                    <div class="flex-1 overflow-y-auto custom-scrollbar p-6">
                        <form onsubmit="actions.submitPoliceReport(event)" class="space-y-5">
                            
                            <!-- SUSPECTS SECTION -->
                            <div class="bg-black/20 p-4 rounded-xl border border-white/5">
                                <label class="text-xs text-gray-500 uppercase font-bold mb-3 block flex justify-between">
                                    Suspects
                                    <span class="text-blue-400">${state.reportSuspects.length} ajouté(s)</span>
                                </label>
                                ${suspectsList ? `<div class="space-y-2 mb-3">${suspectsList}</div>` : ''}
                                <button type="button" onclick="actions.setServicesTab('directory')" class="w-full py-2 bg-blue-500/10 border border-dashed border-blue-500/30 rounded-lg text-xs text-blue-300 hover:text-white hover:bg-blue-500/20 transition-colors flex items-center justify-center gap-2">
                                    <i data-lucide="user-plus" class="w-3 h-3"></i> Sélectionner dans l'annuaire
                                </button>
                            </div>

                            <div class="space-y-4">
                                <div>
                                    <label class="text-xs text-gray-400 uppercase font-bold ml-1 mb-1 block">Qualification des faits</label>
                                    <input type="text" name="title" class="glass-input w-full p-3 rounded-xl text-sm" placeholder="Ex: Refus d'obtempérer" required>
                                </div>
                                <div>
                                    <label class="text-xs text-gray-400 uppercase font-bold ml-1 mb-1 block">Rapport détaillé</label>
                                    <textarea name="description" rows="5" class="glass-input w-full p-3 rounded-xl text-sm leading-relaxed" placeholder="Circonstances, preuves, déroulé de l'intervention..."></textarea>
                                </div>
                                <div class="grid grid-cols-2 gap-4">
                                    <div>
                                        <label class="text-xs text-gray-400 uppercase font-bold ml-1 mb-1 block">Amende ($)</label>
                                        <div class="relative">
                                            <span class="absolute left-3 top-3 text-emerald-500 font-bold">$</span>
                                            <input type="number" name="fine_amount" class="glass-input w-full pl-6 p-3 rounded-xl text-sm font-mono" value="0" max="25000">
                                        </div>
                                    </div>
                                    <div>
                                        <label class="text-xs text-gray-400 uppercase font-bold ml-1 mb-1 block">Peine (Temps)</label>
                                        <div class="relative">
                                            <i data-lucide="clock" class="w-4 h-4 absolute left-3 top-3 text-blue-500"></i>
                                            <input type="number" name="jail_time" class="glass-input w-full pl-9 p-3 rounded-xl text-sm font-mono" value="0" placeholder="Secondes">
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="pt-4 border-t border-white/5">
                                <button type="submit" class="glass-btn w-full py-3 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2">
                                    <i data-lucide="save" class="w-4 h-4"></i>
                                    Archiver & Appliquer Sanctions
                                </button>
                                <p class="text-[10px] text-gray-500 text-center mt-2 italic">Les amendes sont prélevées automatiquement sur les comptes bancaires.</p>
                            </div>
                        </form>
                    </div>
                </div>

                <!-- INFO (Droite - Desktop Only) -->
                <div class="hidden lg:flex w-72 flex-col justify-center items-center text-center p-6 bg-white/5 rounded-2xl border border-white/5">
                    <div class="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mb-4 text-blue-400">
                        <i data-lucide="scale" class="w-10 h-10"></i>
                    </div>
                    <h3 class="text-lg font-bold text-white mb-2">Code Pénal</h3>
                    <p class="text-sm text-gray-400 leading-relaxed mb-6">Assurez-vous que les sanctions respectent la grille tarifaire en vigueur.</p>
                    
                    <div class="w-full space-y-2 text-left">
                        <div class="p-3 rounded bg-black/20 text-xs text-gray-400 border border-white/5">
                            <span class="text-orange-400 font-bold block mb-1">Délit Mineur</span>
                            Max $2,000 / 120 sec
                        </div>
                        <div class="p-3 rounded bg-black/20 text-xs text-gray-400 border border-white/5">
                            <span class="text-red-400 font-bold block mb-1">Crime / Braquage</span>
                            Max $15,000 / 600 sec
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // === 4. VEHICULES / MAP ===
    else if (state.activeServicesTab === 'map') {
        let vehicles = state.erlcData.vehicles || [];
        if(state.vehicleSearchQuery) {
            const q = state.vehicleSearchQuery.toLowerCase();
            vehicles = vehicles.filter(v => 
                (v.Name && v.Name.toLowerCase().includes(q)) || 
                (v.Owner && v.Owner.toLowerCase().includes(q))
            );
        }

        content = `
            <div class="flex flex-col h-full overflow-hidden">
                <div class="flex gap-4 mb-4 shrink-0">
                    <div class="relative flex-1">
                        <i data-lucide="search" class="w-4 h-4 absolute left-3 top-3 text-gray-500"></i>
                        <input type="text" 
                            oninput="actions.searchVehicles(this.value)" 
                            value="${state.vehicleSearchQuery}" 
                            placeholder="Rechercher plaque, modèle..." 
                            class="glass-input pl-10 w-full p-2.5 rounded-xl text-sm bg-black/20 focus:bg-black/40">
                    </div>
                    <div class="px-4 py-2 bg-white/5 rounded-xl border border-white/5 text-xs text-gray-400 flex items-center gap-2">
                        <i data-lucide="car" class="w-3 h-3"></i>
                        ${vehicles.length} Véhicules
                    </div>
                </div>

                <div class="flex-1 overflow-hidden rounded-xl border border-white/5 bg-white/5 flex flex-col">
                    <div class="overflow-y-auto custom-scrollbar flex-1">
                        <table class="w-full text-left text-sm border-collapse">
                            <thead class="bg-[#151515] text-xs uppercase text-gray-500 font-bold sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th class="p-4">Modèle</th>
                                    <th class="p-4">Propriétaire</th>
                                    <th class="p-4">Livrée</th>
                                    <th class="p-4 text-right">Type</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-white/5">
                                ${vehicles.length > 0 ? vehicles.map(v => {
                                    const isPolice = v.Name?.toLowerCase().includes('police') || v.Name?.toLowerCase().includes('sheriff');
                                    const isCivil = !isPolice && !v.Name?.toLowerCase().includes('ems');
                                    
                                    return `
                                    <tr class="hover:bg-white/5 transition-colors group">
                                        <td class="p-4 font-bold text-white">${v.Name || 'Inconnu'}</td>
                                        <td class="p-4 text-gray-300 group-hover:text-white transition-colors">${v.Owner || 'Non identifié'}</td>
                                        <td class="p-4 text-gray-500 text-xs">${v.Texture || 'Standard'}</td>
                                        <td class="p-4 text-right">
                                            <span class="text-[10px] px-2 py-0.5 rounded font-bold uppercase ${isPolice ? 'bg-blue-900/50 text-blue-300 border border-blue-500/20' : isCivil ? 'bg-gray-800 text-gray-400 border border-gray-700' : 'bg-red-900/50 text-red-300'}">
                                                ${isPolice ? 'Force de l\'ordre' : isCivil ? 'Civil' : 'Urgence'}
                                            </span>
                                        </td>
                                    </tr>
                                    `;
                                }).join('') : '<tr><td colspan="4" class="p-10 text-center text-gray-500 italic">Aucun véhicule détecté.</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }

    return `
        ${searchResultModal}
        ${dossierModal}
        ${recordModal}
        
        <div class="h-full flex flex-col bg-[#050505] overflow-hidden animate-fade-in relative">
            <!-- TOP NAVBAR -->
            ${refreshBanner}
            
            <div class="px-6 pb-4 flex flex-col md:flex-row justify-between items-end gap-4 border-b border-white/5 shrink-0">
                <div>
                    <h2 class="text-2xl font-bold text-white flex items-center gap-2">
                        <i data-lucide="shield-check" class="w-6 h-6 text-blue-500"></i>
                        Terminal Services
                    </h2>
                    <div class="flex items-center gap-2 mt-1">
                        <span class="text-xs text-gray-400">Opérateur:</span>
                        <span class="text-xs font-bold text-white bg-white/10 px-2 py-0.5 rounded">${state.activeCharacter.first_name} ${state.activeCharacter.last_name}</span>
                    </div>
                </div>
                
                <div class="flex bg-white/5 p-1 rounded-xl overflow-x-auto max-w-full no-scrollbar">
                    ${tabs.map(t => `
                        <button onclick="actions.setServicesTab('${t.id}')" 
                            class="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all whitespace-nowrap ${state.activeServicesTab === t.id ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}">
                            <i data-lucide="${t.icon}" class="w-4 h-4"></i> ${t.label}
                        </button>
                    `).join('')}
                </div>
            </div>

            <!-- MAIN CONTENT AREA -->
            <div class="flex-1 p-6 overflow-hidden relative min-h-0">
                ${content}
            </div>
        </div>
    `;
};
