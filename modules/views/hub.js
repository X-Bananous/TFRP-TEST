
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

// --- ADVENT CALENDAR VIEW COMPONENT ---
const AdventCalendarView = () => {
    const today = new Date();
    const currentDay = today.getDate();
    // Logic: 16 to 25
    const startDay = 16;
    const endDay = 25;
    const days = [];
    
    // Check next unlock
    let nextUnlockStr = '';
    if (currentDay < startDay) {
        nextUnlockStr = `Ouverture le ${startDay} Décembre`;
    } else if (currentDay >= endDay) {
        nextUnlockStr = "Joyeuses Fêtes !";
    } else {
        // Calculate time until next day (00:00)
        const tomorrow = new Date(today);
        tomorrow.setDate(currentDay + 1);
        tomorrow.setHours(0,0,0,0);
        const diff = Math.ceil((tomorrow - today) / (1000 * 60 * 60));
        nextUnlockStr = `Prochaine case dans ~${diff}h`;
    }

    for (let i = startDay; i <= endDay; i++) {
        const isClaimed = state.user.advent_calendar?.includes(i);
        const isLocked = i > currentDay; // Future date
        const isAvailable = !isLocked && !isClaimed;
        
        let bgClass = 'bg-white/5 border-white/5';
        let icon = 'lock';
        let textClass = 'text-gray-500';
        let statusText = 'Verrouillé';
        
        if (isClaimed) {
            bgClass = 'bg-emerald-900/20 border-emerald-500/30';
            icon = 'check-circle';
            textClass = 'text-emerald-400';
            statusText = 'Ouvert';
        } else if (isAvailable) {
            bgClass = 'bg-gradient-to-br from-red-600 to-red-800 border-red-500 shadow-[0_0_15px_rgba(220,38,38,0.4)] animate-pulse-slow';
            icon = 'gift';
            textClass = 'text-white';
            statusText = 'Ouvrir !';
        }

        days.push({ day: i, isClaimed, isLocked, isAvailable, bgClass, icon, textClass, statusText });
    }

    return `
        <div class="animate-fade-in max-w-5xl mx-auto h-full flex flex-col">
            <div class="text-center mb-10 mt-4">
                <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 text-red-400 text-sm font-bold border border-red-500/20 mb-4">
                    <i data-lucide="snowflake" class="w-4 h-4"></i> Édition Spéciale Noël
                </div>
                <h1 class="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">Calendrier de l'Avent</h1>
                <p class="text-gray-400 max-w-lg mx-auto">Connectez-vous chaque jour du 16 au 25 Décembre pour débloquer des récompenses exclusives.</p>
                <div class="mt-4 text-xs font-mono text-emerald-400 bg-black/40 inline-block px-3 py-1 rounded border border-emerald-500/20">
                    <i data-lucide="clock" class="w-3 h-3 inline mr-1"></i> ${nextUnlockStr}
                </div>
            </div>

            <div class="flex-1 overflow-y-auto custom-scrollbar pb-10">
                <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 px-4">
                    ${days.map(d => `
                        <button 
                            ${d.isAvailable ? `onclick="actions.claimAdventReward(${d.day})"` : 'disabled'}
                            class="relative aspect-square rounded-2xl border ${d.bgClass} flex flex-col items-center justify-center gap-2 group transition-all transform hover:scale-105 ${d.isLocked ? 'opacity-50 cursor-not-allowed grayscale' : 'cursor-pointer'}">
                            
                            <div class="absolute top-3 left-4 font-black text-4xl text-white/10 select-none">${d.day}</div>
                            
                            <div class="relative z-10 p-3 rounded-full bg-black/20 backdrop-blur-sm">
                                <i data-lucide="${d.icon}" class="w-8 h-8 ${d.textClass}"></i>
                            </div>
                            
                            <div class="relative z-10 text-sm font-bold ${d.textClass} uppercase tracking-wider">
                                ${d.statusText}
                            </div>
                            
                            ${d.isAvailable ? '<div class="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>' : ''}
                        </button>
                    `).join('')}
                </div>
                
                <div class="mt-12 text-center">
                    <div class="inline-block p-4 bg-white/5 rounded-xl border border-white/5 max-w-md">
                        <h4 class="text-white font-bold mb-1 flex items-center justify-center gap-2"><i data-lucide="gift" class="w-4 h-4 text-yellow-400"></i> Récompense Finale</h4>
                        <p class="text-xs text-gray-400">Cumulez jusqu'à <b>$55,000</b> en ouvrant toutes les cases.</p>
                    </div>
                </div>
            </div>
        </div>
    `;
};

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
                        <!-- ADVENT CALENDAR CARD -->
                        <button onclick="actions.setHubPanel('advent')" class="glass-card group text-left p-6 rounded-[24px] h-64 flex flex-col justify-between relative overflow-hidden cursor-pointer border-red-500/20">
                            <div class="absolute inset-0 bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div class="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center text-red-400 mb-4 group-hover:bg-red-500 group-hover:text-white transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)]">
                                <i data-lucide="gift" class="w-6 h-6"></i>
                            </div>
                            <div class="relative z-10">
                                <h3 class="text-xl font-bold text-white">Calendrier Avent</h3>
                                <p class="text-sm text-gray-400 mt-1">Cadeaux Quotidiens</p>
                            </div>
                        </button>

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

                        <!-- ENTERPRISE CARD (Updated) -->
                        <button onclick="actions.setHubPanel('enterprise')" class="glass-card group text-left p-6 rounded-[24px] h-64 flex flex-col justify-between relative overflow-hidden cursor-pointer border-blue-500/20">
                            <div class="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div class="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 mb-4 group-hover:bg-blue-500 group-hover:text-white transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                                <i data-lucide="building-2" class="w-6 h-6"></i>
                            </div>
                            <div class="relative z-10">
                                <h3 class="text-xl font-bold text-white">Entreprise</h3>
                                <p class="text-sm text-gray-400 mt-1">Gestion Société & Employés</p>
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
    } else if (state.activeHubPanel === 'advent') {
        content = AdventCalendarView();
    } else if (state.activeHubPanel === 'staff_list') {
// ... rest of the file (staff list, etc) remains the same
