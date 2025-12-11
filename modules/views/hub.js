
import { state } from '../state.js';
import { BankView } from './bank.js';
import { StaffView } from './staff.js';
import { AssetsView } from './assets.js';
import { IllicitView } from './illicit.js';
import { ServicesView } from './services.js';
import { EnterpriseView } from './enterprise.js';
import { hasPermission, router } from '../utils.js';
import { ui } from '../ui.js';
import { HEIST_DATA } from './illicit.js';
import { CONFIG } from '../config.js';

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

export const HubView = () => {
    // --- CHECK ALIGNMENT ---
    if (state.activeCharacter && !state.activeCharacter.alignment && !state.alignmentModalShown) {
        state.alignmentModalShown = true;
        setTimeout(() => {
            ui.showModal({
                title: "Mise à jour Dossier",
                content: `
                    <div class="text-center">
                        <p class="mb-4">Votre dossier citoyen nécessite une mise à jour administrative.</p>
                        <p class="font-bold text-white mb-2">Quelle est votre orientation actuelle ?</p>
                        <div class="grid grid-cols-2 gap-4 mt-4">
                            <button onclick="actions.setAlignment('legal')" class="p-4 rounded-xl bg-blue-500/20 border border-blue-500 hover:bg-blue-500/30 transition-colors">
                                <i data-lucide="briefcase" class="w-8 h-8 text-blue-400 mx-auto mb-2"></i>
                                <div class="text-sm font-bold text-white">Légal / Civil</div>
                            </button>
                            <button onclick="actions.setAlignment('illegal')" class="p-4 rounded-xl bg-red-500/20 border border-red-500 hover:bg-red-500/30 transition-colors">
                                <i data-lucide="skull" class="w-8 h-8 text-red-400 mx-auto mb-2"></i>
                                <div class="text-sm font-bold text-white">Illégal</div>
                            </button>
                        </div>
                    </div>
                `,
                confirmText: null, 
                type: 'default'
            });
            setTimeout(() => {
                const confirmBtn = document.getElementById('modal-confirm');
                if(confirmBtn) confirmBtn.style.display = 'none';
            }, 50);
        }, 500);
    }

    let content = '';
    
    // LOADER
    if (state.isPanelLoading) {
        return `
            <div class="flex h-full w-full bg-[#050505] items-center justify-center">
                <div class="text-center">
                    <div class="loader-spinner mb-4 mx-auto"></div>
                    <p class="text-gray-500 text-sm tracking-widest uppercase animate-pulse">Chargement des données...</p>
                </div>
            </div>
        `;
    }

    const isBypass = state.activeCharacter?.id === 'STAFF_BYPASS';
    // ERLC Data
    const { currentPlayers, maxPlayers, queue, joinKey } = state.erlcData;
    const robloxUrl = `roblox://placeId=2534724415&launchData=%7B%22psCode%22%3A%22${joinKey}%22%7D`;
    
    // Guild Memberships
    const inServiceGuild = state.user.guilds && state.user.guilds.includes(CONFIG.GUILD_SERVICES);
    const inIllegalGuild = state.user.guilds && state.user.guilds.includes(CONFIG.GUILD_ILLEGAL);
    const inStaffGuild = state.user.guilds && state.user.guilds.includes(CONFIG.GUILD_STAFF);
    
    // Check Session
    const isSessionActive = !!state.activeGameSession;

    // ... [Content logic] ...
    if (state.activeHubPanel === 'main') {
        if(isBypass) {
             setTimeout(() => actions.setHubPanel('staff'), 0);
             return ''; 
        }

        const showStaffCard = Object.keys(state.user.permissions || {}).length > 0 || state.user.isFounder;
        const isIllegal = state.activeCharacter?.alignment === 'illegal';
        const job = state.activeCharacter?.job || 'unemployed';
        const hasServiceAccess = ['leo', 'lafd', 'ladot'].includes(job);
        
        let newsHtml = '';
        if (state.globalActiveHeists && state.globalActiveHeists.length > 0) {
            const majorHeists = state.globalActiveHeists.filter(h => !['house', 'gas', 'atm'].includes(h.heist_type));
            if (majorHeists.length > 0) {
                newsHtml = `
                    <div class="glass-panel p-4 rounded-2xl bg-gradient-to-r from-red-900/40 to-black border-red-500/30 flex items-center gap-4 animate-pulse-slow">
                        <div class="p-2 bg-red-500 rounded-lg animate-pulse">
                            <i data-lucide="radio" class="w-5 h-5 text-white"></i>
                        </div>
                        <div class="flex-1 overflow-hidden">
                            <div class="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-0.5">Flash Info • Alerte Générale</div>
                            <div class="text-white font-medium text-sm truncate">
                                ${majorHeists.map(h => {
                                    const hData = HEIST_DATA.find(d => d.id === h.heist_type);
                                    return `Braquage en cours : ${hData ? hData.name : h.heist_type}`;
                                }).join(' • ')}
                            </div>
                        </div>
                    </div>
                `;
            } else {
                 newsHtml = `
                    <div class="glass-panel p-4 rounded-2xl border-white/5 flex items-center gap-4 opacity-70">
                        <div class="p-2 bg-white/10 rounded-lg">
                            <i data-lucide="sun" class="w-5 h-5 text-yellow-200"></i>
                        </div>
                        <div>
                            <div class="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">Flash Info</div>
                            <div class="text-gray-300 font-medium text-sm">Aucun incident majeur à signaler à Los Angeles.</div>
                        </div>
                    </div>
                `;
            }
        } else {
             newsHtml = `
                <div class="glass-panel p-4 rounded-2xl border-white/5 flex items-center gap-4 opacity-70">
                    <div class="p-2 bg-white/10 rounded-lg">
                        <i data-lucide="sun" class="w-5 h-5 text-yellow-200"></i>
                    </div>
                    <div>
                        <div class="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">Flash Info</div>
                        <div class="text-gray-300 font-medium text-sm">Aucun incident majeur à signaler à Los Angeles.</div>
                    </div>
                </div>
            `;
        }
        
        // 911 Bubble only if session active
        const callBubble = isSessionActive ? `
            <button onclick="actions.openCallPage()" class="glass-panel p-4 rounded-2xl border-red-500/20 flex items-center gap-4 hover:bg-red-500/5 transition-colors cursor-pointer text-left w-full group">
                <div class="p-2 bg-red-500/10 rounded-lg group-hover:bg-red-500/20 text-red-400">
                    <i data-lucide="phone-call" class="w-5 h-5"></i>
                </div>
                <div>
                    <div class="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-0.5">Urgence (911)</div>
                    <div class="text-white font-medium text-sm">Contacter Police / EMS</div>
                </div>
                <i data-lucide="chevron-right" class="w-4 h-4 text-gray-500 ml-auto"></i>
            </button>
        ` : `
            <div class="glass-panel p-4 rounded-2xl border-white/5 flex items-center gap-4 opacity-50 cursor-not-allowed">
                <div class="p-2 bg-gray-700/50 rounded-lg text-gray-400">
                    <i data-lucide="phone-off" class="w-5 h-5"></i>
                </div>
                <div>
                    <div class="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">Central 911</div>
                    <div class="text-gray-400 font-medium text-sm">Services Indisponibles</div>
                </div>
            </div>
        `;

        content = `
            <div class="animate-fade-in max-w-7xl mx-auto h-full flex flex-col">
                 <!-- DASHBOARD HEADER & BANNER -->
                 ${refreshBanner}
                 
                <div class="mb-6 relative rounded-3xl overflow-hidden h-48 group shadow-2xl bg-gradient-to-r from-gray-900 via-gray-800 to-black border border-white/10">
                    <div class="absolute inset-0 p-8 flex flex-col justify-center">
                        <div class="flex justify-between items-end">
                            <div>
                                <h1 class="text-3xl font-bold text-white mb-2">Team French RolePlay</h1>
                                <p class="text-gray-300 mb-4 flex items-center gap-2">
                                    <span class="w-2 h-2 ${isSessionActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'} rounded-full"></span>
                                    ${isSessionActive ? 'Serveur Privé ERLC' : 'Session Fermée'}
                                </p>
                                <div class="flex items-center gap-4">
                                    <div class="bg-white/10 backdrop-blur px-3 py-1.5 rounded-lg border border-white/10 text-xs text-white">
                                        <span class="text-gray-400 uppercase tracking-wide mr-2">Joueurs</span>
                                        <span class="font-mono font-bold text-lg">${currentPlayers}/${maxPlayers}</span>
                                    </div>
                                    <div class="bg-white/10 backdrop-blur px-3 py-1.5 rounded-lg border border-white/10 text-xs text-white">
                                        <span class="text-gray-400 uppercase tracking-wide mr-2">File</span>
                                        <span class="font-mono font-bold text-lg erlc-queue-count">${queue ? queue.length : 0}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="text-right hidden md:block">
                                ${isSessionActive ? `
                                    <div class="text-sm text-gray-400 mb-2 uppercase tracking-widest font-bold">Code Serveur</div>
                                    <div class="text-4xl font-mono font-bold text-white tracking-widest mb-4 text-glow">${joinKey}</div>
                                    <a href="${robloxUrl}" class="glass-btn px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-transform bg-white text-black shadow-lg shadow-white/10">
                                        <i data-lucide="play" class="w-5 h-5 fill-current"></i>
                                        Rejoindre
                                    </a>
                                ` : `
                                    <div class="flex flex-col items-end">
                                        <div class="px-4 py-2 bg-red-500/10 rounded-xl border border-red-500/20 text-red-400 text-sm font-bold flex items-center gap-2 mb-2">
                                            <i data-lucide="lock" class="w-4 h-4"></i> Accès Restreint
                                        </div>
                                        <p class="text-gray-500 text-xs max-w-[200px] leading-relaxed">
                                            Aucune session de jeu n'est en cours. Attendez l'ouverture par le staff.
                                        </p>
                                    </div>
                                `}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="flex-1 overflow-y-auto custom-scrollbar space-y-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        ${newsHtml}
                        ${callBubble}
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <button onclick="actions.setHubPanel('bank')" class="glass-card group text-left p-6 rounded-[24px] h-64 flex flex-col justify-between relative overflow-hidden cursor-pointer border-emerald-500/20">
                            <div class="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div class="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                                <i data-lucide="landmark" class="w-6 h-6"></i>
                            </div>
                            <div class="relative z-10">
                                <h3 class="text-xl font-bold text-white">Ma Banque</h3>
                                <p class="text-sm text-gray-400 mt-1">Solde, Retraits & Virements</p>
                            </div>
                        </button>

                        <button onclick="actions.setHubPanel('assets')" class="glass-card group text-left p-6 rounded-[24px] h-64 flex flex-col justify-between relative overflow-hidden cursor-pointer border-indigo-500/20">
                            <div class="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div class="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 group-hover:bg-indigo-500 group-hover:text-white transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                                <i data-lucide="gem" class="w-6 h-6"></i>
                            </div>
                            <div class="relative z-10">
                                <h3 class="text-xl font-bold text-white">Patrimoine</h3>
                                <p class="text-sm text-gray-400 mt-1">Inventaire & Valeur Totale</p>
                            </div>
                        </button>

                        <!-- ENTERPRISE CARD -->
                        <button onclick="actions.setHubPanel('enterprise')" class="glass-card group text-left p-6 rounded-[24px] h-64 flex flex-col justify-between relative overflow-hidden cursor-pointer border-blue-500/20">
                            <div class="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div class="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 mb-4 group-hover:bg-blue-500 group-hover:text-white transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                                <i data-lucide="building-2" class="w-6 h-6"></i>
                            </div>
                            <div class="relative z-10">
                                <h3 class="text-xl font-bold text-white">Entreprise</h3>
                                <p class="text-sm text-gray-400 mt-1">Gestion Société & Employés</p>
                                <div class="mt-2 text-[10px] text-blue-300 uppercase font-bold tracking-widest"><i data-lucide="clock" class="w-3 h-3 inline"></i> Bientôt</div>
                            </div>
                        </button>

                        ${hasServiceAccess ? `
                            <button onclick="actions.setHubPanel('services')" class="glass-card group text-left p-6 rounded-[24px] h-64 flex flex-col justify-between relative overflow-hidden cursor-pointer ${!inServiceGuild ? 'border-red-500/30 opacity-90' : ''}">
                                ${!inServiceGuild ? '<div class="absolute top-4 right-4 text-red-500 bg-red-500/10 p-2 rounded-full"><i data-lucide="lock" class="w-5 h-5"></i></div>' : ''}
                                <div class="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                <div class="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 mb-4 group-hover:bg-blue-500 group-hover:text-white transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                                    <i data-lucide="siren" class="w-6 h-6"></i>
                                </div>
                                <div class="relative z-10">
                                    <h3 class="text-xl font-bold text-white">Services Publics</h3>
                                    <p class="text-sm text-gray-400 mt-1">Dispatch, Annuaire & Rapports</p>
                                    <div class="inline-block px-2 py-0.5 mt-2 rounded bg-blue-500/20 text-blue-300 text-xs font-bold uppercase">${job}</div>
                                </div>
                            </button>
                        ` : isIllegal ? `
                            <button onclick="actions.setHubPanel('illicit')" class="glass-card group text-left p-6 rounded-[24px] h-64 flex flex-col justify-between relative overflow-hidden cursor-pointer border-red-500/20 ${!inIllegalGuild ? 'border-red-500/40 opacity-90' : ''}">
                                ${!inIllegalGuild ? '<div class="absolute top-4 right-4 text-red-500 bg-red-500/10 p-2 rounded-full"><i data-lucide="lock" class="w-5 h-5"></i></div>' : ''}
                                <div class="absolute inset-0 bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                <div class="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center text-red-400 mb-4 group-hover:bg-red-500 group-hover:text-white transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                                    <i data-lucide="skull" class="w-6 h-6"></i>
                                </div>
                                <div class="relative z-10">
                                    <h3 class="text-xl font-bold text-white">Monde Criminel</h3>
                                    <p class="text-sm text-gray-400 mt-1">Mafias, Gangs & Marché Noir</p>
                                </div>
                            </button>
                        ` : `
                            <div class="glass-card p-6 rounded-[24px] h-64 flex flex-col justify-center items-center text-center border-white/5 opacity-50">
                                <i data-lucide="briefcase" class="w-10 h-10 text-gray-500 mb-4"></i>
                                <h3 class="text-lg font-bold text-gray-400">Accès Civil</h3>
                                <p class="text-sm text-gray-600 mt-1">Aucun accès spécial.</p>
                                <p class="text-xs text-gray-600 mt-2">Rejoignez un métier (LEO/EMS) ou le crime pour débloquer.</p>
                            </div>
                        `}

                        <!-- STAFF LIST CARD (New Entry) -->
                        <button onclick="actions.setHubPanel('staff_list')" class="glass-card group text-left p-6 rounded-[24px] h-64 flex flex-col justify-between relative overflow-hidden cursor-pointer border-yellow-500/20">
                            <div class="absolute inset-0 bg-yellow-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div class="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center text-yellow-400 mb-4 group-hover:bg-yellow-500 group-hover:text-white transition-all shadow-[0_0_20px_rgba(234,179,8,0.3)]">
                                <i data-lucide="users-round" class="w-6 h-6"></i>
                            </div>
                            <div class="relative z-10">
                                <h3 class="text-xl font-bold text-white">Liste du Staff</h3>
                                <p class="text-sm text-gray-400 mt-1">Disponibilité & Statut</p>
                            </div>
                        </button>

                        ${showStaffCard ? `
                        <button onclick="actions.setHubPanel('staff')" class="glass-card group text-left p-6 rounded-[24px] h-64 flex flex-col justify-between relative overflow-hidden border-purple-500/20 cursor-pointer ${!inStaffGuild ? 'border-red-500/40 opacity-90' : ''}">
                             ${!inStaffGuild ? '<div class="absolute top-4 right-4 text-red-500 bg-red-500/10 p-2 rounded-full"><i data-lucide="lock" class="w-5 h-5"></i></div>' : ''}
                            <div class="absolute inset-0 bg-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div class="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 mb-4 group-hover:bg-purple-500 group-hover:text-white transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                                <i data-lucide="shield-alert" class="w-6 h-6"></i>
                            </div>
                            <div class="relative z-10">
                                <h3 class="text-xl font-bold text-white">Administration</h3>
                                <p class="text-sm text-gray-400 mt-1">Gestion Joueurs & Whitelist</p>
                                ${state.pendingApplications.length > 0 ? `<div class="absolute top-0 right-0 mt-6 mr-6 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>` : ''}
                            </div>
                        </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    } else if (state.activeHubPanel === 'staff_list') {
        const staffList = state.staffMembers || [];
        // Sort Founders first
        staffList.sort((a, b) => {
             const aF = CONFIG.ADMIN_IDS.includes(a.id);
             const bF = CONFIG.ADMIN_IDS.includes(b.id);
             return (aF === bF) ? 0 : aF ? -1 : 1;
        });

        content = `
            <div class="animate-fade-in max-w-7xl mx-auto h-full flex flex-col">
                <div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <div>
                        <h2 class="text-2xl font-bold text-white flex items-center gap-2">
                            <i data-lucide="users-round" class="w-6 h-6 text-blue-400"></i>
                            Liste du Staff
                        </h2>
                        <p class="text-gray-400 text-sm">Membres de l'équipe et statut de connexion.</p>
                    </div>
                    <button onclick="actions.refreshCurrentView()" class="glass-btn-secondary px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                        <i data-lucide="refresh-cw" class="w-4 h-4"></i> Actualiser
                    </button>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar p-1">
                    ${staffList.map(s => {
                        const isFounder = CONFIG.ADMIN_IDS.includes(s.id);
                        const discordStatus = state.discordStatuses[s.id] || 'offline';
                        const discordColor = { online: 'bg-green-500', idle: 'bg-yellow-500', dnd: 'bg-red-500', offline: 'bg-gray-500' }[discordStatus] || 'bg-gray-500';
                        
                        return `
                        <div class="glass-panel p-4 rounded-xl border border-white/5 flex items-center gap-4 hover:bg-white/5 transition-colors">
                            <div class="w-14 h-14 rounded-full border border-white/10 shrink-0">
                                <img src="${s.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png'}" class="w-full h-full rounded-full object-cover">
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="flex items-center gap-2">
                                    <h3 class="font-bold text-white truncate">${s.username}</h3>
                                    ${isFounder ? '<span class="text-[9px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded font-bold uppercase">Fondateur</span>' : ''}
                                </div>
                                <div class="flex items-center gap-3 mt-2 text-xs">
                                     <div class="flex items-center gap-1.5 bg-black/30 px-2 py-1 rounded-full border border-white/5">
                                         <div class="w-2 h-2 rounded-full ${s.is_on_duty ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}"></div>
                                         <span class="text-gray-400 uppercase text-[9px]">Panel</span>
                                     </div>
                                     <div class="flex items-center gap-1.5 bg-black/30 px-2 py-1 rounded-full border border-white/5">
                                         <div class="w-2 h-2 rounded-full ${discordColor}"></div>
                                         <span class="text-gray-400 uppercase text-[9px]">Discord</span>
                                     </div>
                                </div>
                            </div>
                        </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;

    } else if (state.activeHubPanel === 'enterprise') {
        content = EnterpriseView();
    } else if (state.activeHubPanel === 'bank') {
        content = BankView();
    } else if (state.activeHubPanel === 'assets') {
        content = AssetsView();
    } else if (state.activeHubPanel === 'illicit') {
        content = IllicitView();
    } else if (state.activeHubPanel === 'staff') {
        content = StaffView();
    } else if (state.activeHubPanel === 'services') {
        content = ServicesView();
    } else if (state.activeHubPanel === 'emergency_call') {
        content = `
            <div class="animate-fade-in max-w-7xl mx-auto h-full flex flex-col">
                <!-- EMERGENCY HEADER -->
                <div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <div>
                        <h2 class="text-2xl font-bold text-white flex items-center gap-2">
                            <i data-lucide="phone-call" class="w-6 h-6 text-red-500"></i>
                            Appel d'Urgence
                        </h2>
                        <p class="text-gray-400 text-sm">Central 911 • Los Angeles</p>
                    </div>
                </div>

                <div class="flex-1 overflow-y-auto custom-scrollbar flex items-center justify-center">
                    <div class="glass-panel p-8 rounded-2xl w-full max-w-2xl border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.1)]">
                        ${isSessionActive ? `
                            <form onsubmit="actions.createEmergencyCall(event)" class="space-y-6">
                                <div>
                                    <label class="text-xs text-gray-500 uppercase font-bold ml-1">Service Requis</label>
                                    <select name="service" class="glass-input p-3 rounded-xl w-full text-sm bg-black/40 mt-1">
                                        <option value="police">Police / Sheriff</option>
                                        <option value="ems">Ambulance / Pompier</option>
                                        <option value="dot">Dépanneuse (DOT)</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="text-xs text-gray-500 uppercase font-bold ml-1">Localisation</label>
                                    <input type="text" list="streets" name="location" placeholder="Rue ou Point de repère" class="glass-input w-full p-3 rounded-xl text-sm bg-black/40 mt-1" required>
                                    <datalist id="streets">
                                        ${CONFIG.STREET_NAMES.map(s => `<option value="${s}">`).join('')}
                                    </datalist>
                                </div>
                                <div>
                                    <label class="text-xs text-gray-500 uppercase font-bold ml-1">Description</label>
                                    <textarea name="description" rows="3" placeholder="Nature de l'incident, blessés, armes..." class="glass-input w-full p-3 rounded-xl text-sm bg-black/40 mt-1" required></textarea>
                                </div>
                                
                                <button type="submit" class="glass-btn w-full py-4 rounded-xl font-bold text-lg bg-red-600 hover:bg-red-500 shadow-lg shadow-red-900/20 flex items-center justify-center gap-2">
                                    <i data-lucide="radio" class="w-5 h-5"></i> Envoyer au Central
                                </button>
                            </form>
                        ` : `
                            <div class="text-center py-10">
                                <i data-lucide="radio-off" class="w-16 h-16 text-gray-600 mx-auto mb-4"></i>
                                <h3 class="text-xl font-bold text-gray-400 mb-2">Service Indisponible</h3>
                                <p class="text-sm text-gray-500">Aucun central de réception d'appels n'est actif car il n'y a pas de session de jeu en cours.</p>
                            </div>
                        `}
                    </div>
                </div>
            </div>
        `;
    }

    const navItem = (panel, icon, label, color = 'text-white') => {
        const isActive = state.activeHubPanel === panel;
        const bgClass = isActive ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white';
        
        let lockIcon = '';
        if (panel === 'services' && !inServiceGuild) lockIcon = '<i data-lucide="lock" class="w-3 h-3 text-red-500 ml-auto"></i>';
        if (panel === 'illicit' && !inIllegalGuild) lockIcon = '<i data-lucide="lock" class="w-3 h-3 text-red-500 ml-auto"></i>';
        if (panel === 'staff' && !inStaffGuild) lockIcon = '<i data-lucide="lock" class="w-3 h-3 text-red-500 ml-auto"></i>';

        return `
            <button onclick="actions.setHubPanel('${panel}'); actions.toggleSidebar();" class="w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center gap-3 cursor-pointer ${bgClass}">
                <i data-lucide="${icon}" class="w-5 h-5 ${isActive ? color : ''}"></i>
                ${label}
                ${lockIcon}
            </button>
        `;
    };

    const hasStaffAccess = Object.keys(state.user.permissions || {}).length > 0 || state.user.isFounder;
    const hasServiceAccess = ['leo', 'lafd', 'ladot'].includes(state.activeCharacter?.job);
    const isIllegal = state.activeCharacter?.alignment === 'illegal';
    
    // Staff on duty
    const staffOnDuty = state.onDutyStaff || [];

    return `
        <div class="flex h-full w-full bg-[#050505] relative overflow-hidden">
            <!-- Mobile Overlay -->
            ${state.ui.sidebarOpen ? `<div class="fixed inset-0 bg-black/80 z-[60] md:hidden animate-fade-in" onclick="actions.toggleSidebar()"></div>` : ''}

            <!-- SIDEBAR -->
            <aside class="fixed top-0 bottom-0 left-0 z-[100] w-72 h-[100dvh] glass-panel border-y-0 border-l-0 flex flex-col transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${state.ui.sidebarOpen ? 'translate-x-0' : '-translate-x-full'} shadow-2xl md:shadow-none pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
                <div class="p-6 border-b border-white/5 flex justify-between items-center shrink-0">
                    <div class="flex items-center gap-3">
                        <div class="relative w-10 h-10 shrink-0">
                            <img src="${state.user.avatar}" class="w-full h-full rounded-full border border-white/10 relative z-0 object-cover">
                            ${state.user.avatar_decoration ? `<img src="${state.user.avatar_decoration}" class="absolute top-1/2 left-1/2 w-[122%] h-[122%] -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none" style="max-width: none">` : ''}
                        </div>
                        <div class="overflow-hidden">
                            <h3 class="font-bold text-white truncate text-sm">${state.user.username}</h3>
                            <p class="text-xs text-blue-400 font-semibold uppercase tracking-wider">${state.activeCharacter.first_name} ${state.activeCharacter.last_name}</p>
                            ${state.activeCharacter?.job !== 'unemployed' ? `<div class="text-[10px] text-gray-500 uppercase mt-0.5">${state.activeCharacter?.job}</div>` : ''}
                        </div>
                    </div>
                    <button onclick="actions.toggleSidebar()" class="md:hidden text-gray-400 hover:text-white">
                        <i data-lucide="x" class="w-6 h-6"></i>
                    </button>
                </div>
                
                <div class="p-4 space-y-2 flex-1 overflow-y-auto custom-scrollbar">
                    ${!isBypass ? `
                        <div class="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-4 mb-2">Menu Principal</div>
                        ${navItem('main', 'layout-grid', 'Tableau de bord', 'text-blue-400')}
                        ${navItem('staff_list', 'users-round', 'Liste du Staff', 'text-yellow-400')}
                        
                        ${isSessionActive ? `
                            <button onclick="actions.openCallPage(); actions.toggleSidebar();" class="w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center gap-3 cursor-pointer text-red-400 hover:bg-red-500/10 hover:text-red-300">
                                 <i data-lucide="phone" class="w-5 h-5 text-red-500"></i> Appel d'urgence
                            </button>
                        ` : ''}

                        ${navItem('bank', 'landmark', 'Ma Banque', 'text-emerald-400')}
                        ${navItem('assets', 'gem', 'Patrimoine', 'text-indigo-400')}
                        ${navItem('enterprise', 'building-2', 'Entreprise', 'text-blue-400')}
                        
                        ${hasServiceAccess ? navItem('services', 'siren', 'Services Publics', 'text-blue-400') : ''}
                        ${isIllegal ? navItem('illicit', 'skull', 'Illégal', 'text-red-400') : ''}
                        
                        ${hasStaffAccess ? `<div class="my-4 border-t border-white/5"></div>` : ''}
                    ` : ''}

                    ${hasStaffAccess ? `
                        <div class="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-4 mb-2">Staff</div>
                        ${navItem('staff', 'shield-alert', 'Administration', 'text-purple-400')}
                    ` : ''}
                    
                    ${isSessionActive ? `
                        <!-- ERLC Status Widget (Updated) -->
                        <div class="mt-6 mx-2 p-3 bg-white/5 rounded-xl border border-white/5">
                             <div class="flex items-center justify-between mb-2">
                                <div class="flex items-center gap-2">
                                    <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                    <span class="text-xs font-bold text-gray-300">ERLC Live</span>
                                </div>
                                <span class="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-gray-400">Queue: <span class="text-white erlc-queue-count">${queue ? queue.length : 0}</span></span>
                             </div>
                             
                             <!-- Join Code -->
                             <div class="text-center bg-black/30 rounded border border-white/5 py-2 mb-2">
                                <div class="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Code Serveur</div>
                                <div class="font-mono font-bold text-white text-xl tracking-widest select-all">${joinKey}</div>
                             </div>

                             <!-- Join Button -->
                             <a href="${robloxUrl}" class="glass-btn-secondary w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-white/10 hover:text-white text-gray-300">
                                <i data-lucide="play" class="w-3 h-3"></i> Rejoindre ERLC
                             </a>
                        </div>
                    ` : ''}

                    <div class="mt-2 mx-2 p-3 bg-purple-500/5 rounded-xl border border-purple-500/10">
                        <div class="text-[10px] font-bold text-purple-400 uppercase mb-2">Staff En Service (${staffOnDuty.length})</div>
                        ${staffOnDuty.length > 0 
                            ? `<div class="space-y-1">${staffOnDuty.map(s => `<div class="flex items-center gap-2 text-xs text-gray-300"><img src="${s.avatar_url}" class="w-4 h-4 rounded-full"> ${s.username}</div>`).join('')}</div>` 
                            : '<div class="text-xs text-gray-500 italic">Aucun staff.</div>'
                        }
                    </div>
                </div>

                <div class="p-4 bg-black/20 border-t border-white/5 shrink-0 space-y-2">
                        <div class="flex justify-center gap-4 text-[10px] text-gray-600">
                            <button onclick="router('terms')" class="hover:text-white">CGU</button>
                            <button onclick="router('privacy')" class="hover:text-white">Confidentialité</button>
                        </div>
                        <div class="grid grid-cols-2 gap-2">
                            <button onclick="actions.backToSelect()" class="w-full glass-btn-secondary py-2 rounded-lg text-xs text-gray-300 hover:bg-white/10 cursor-pointer flex items-center justify-center gap-1" title="Changer de personnage">
                            <i data-lucide="users" class="w-3 h-3"></i> Persos
                            </button>
                            <button onclick="actions.confirmLogout()" class="w-full glass-btn-secondary py-2 rounded-lg text-xs text-red-300 hover:bg-red-900/20 border-red-500/10 cursor-pointer flex items-center justify-center gap-1">
                            <i data-lucide="log-out" class="w-3 h-3"></i> Sortir
                            </button>
                        </div>
                </div>
            </aside>

            <main class="flex-1 flex flex-col relative overflow-hidden h-full">
                <!-- Mobile Header -->
                <div class="md:hidden p-4 flex items-center justify-between border-b border-white/5 bg-[#050505] z-30 pt-[env(safe-area-inset-top)]">
                    <button onclick="actions.toggleSidebar()" class="text-gray-400 hover:text-white">
                        <i data-lucide="menu" class="w-6 h-6"></i>
                    </button>
                    <div class="font-bold text-white">TFRP Mobile</div>
                    <div class="w-6"></div> <!-- Spacer -->
                </div>

                <div class="flex-1 overflow-y-auto p-4 md:p-8 relative z-0 custom-scrollbar pb-[env(safe-area-inset-bottom)]">
                    ${content}
                </div>
            </main>
        </div>
    `;
};
