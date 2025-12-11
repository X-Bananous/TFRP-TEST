


import { state } from '../state.js';
import { createHeistLobby, startHeistSync } from '../services.js';
import { showToast, showModal } from '../ui.js';
import { CONFIG } from '../config.js';

// CATALOGUES CONSTANTS
export const BLACK_MARKET_CATALOG = {
    light: [
        { name: "Beretta M9", price: 2800, icon: "target" },
        { name: "Revolver", price: 3000, icon: "circle-dot" },
        { name: "Colt M1911", price: 3500, icon: "target" },
        { name: "Colt Python", price: 4200, icon: "circle-dot" },
        { name: "Desert Eagle", price: 4500, icon: "triangle" },
        { name: "Lampe Torche", price: 20, icon: "flashlight" },
        { name: "Marteau", price: 20, icon: "hammer" },
        { name: "Lockpick", price: 50, icon: "key" },
        { name: "Sac", price: 100, icon: "shopping-bag" },
        { name: "Coupe Verre", price: 350, icon: "scissors" },
        { name: "Puce ATM", price: 2300, icon: "cpu" }
    ],
    medium: [
        { name: "TEC 9", price: 9500, icon: "zap" },
        { name: "SKORPION", price: 14500, icon: "zap" },
        { name: "Remington 870", price: 16500, icon: "move" },
        { name: "Kriss Vector", price: 20500, icon: "zap" }
    ],
    heavy: [
        { name: "PPSH 41", price: 40000, icon: "flame" },
        { name: "AK47", price: 50000, icon: "flame" }
    ],
    sniper: [
        { name: "Remington MSR", price: 60000, icon: "crosshair" }
    ]
};

// HEIST LOCATIONS DATA
export const HEIST_LOCATIONS = {
    house: [
        "7001 Academy PL. Banlieue", "7002 Academy PL. Banlieue", "7011 Franklin court Banlieue",
        "7012 Franklin court Banlieue", "7013 Franklin court Banlieue", "7021 Franklin court Banlieue",
        "7022 Franklin court Banlieue", "7023 Franklin court Banlieue", "7041 Franklin court Banlieue",
        "7042 Emerson HD Banlieue", "7043 Franklin court Banlieue", "7044 Franklin court Banlieue",
        "7051 Franklin court Banlieue", "7052 Franklin court Banlieue", "7053 Franklin court Banlieue",
        "7054 Emerson HD Banlieue", "7055 Franklin court Banlieue", "7056 Franklin court Banlieue",
        "7061 Franklin court Banlieue", "7062 Franklin court Banlieue", "7063 Joyner RD Banlieue",
        "7064 Franklin court Banlieue", "7091 Pineview circle Banlieue", "7092 Pineview circle Banlieue",
        "7094 Franklin court Banlieue", "7095 Franklin court Banlieue",
        "11091 Maple Street", "11092 Maple Street"
    ],
    atm: [
        "Atm 1 - Banque Ville-centre", "Atm 2 - Station service Ville-centre (bat 2001)",
        "Atm 3 - Main Street Ville-centre (bat 2072)", "Atm 4 - Indépendance Partway Ville-centre (bat 4031)",
        "Atm 5 - Géorgia Avenue (Bat 3041)", "Atm 6 - Orchard boulevard (bat 3091)",
        "Atm 7 - Colonial drive (bat 6021)", "Atm 8 - Elm Street Ville-Nord (bat 11101)",
        "Atm 9 - Maple Street Ville-Nord (bat 11041)", "Atm 10 - Maple Street Ville-Nord (bat 11042)"
    ],
    gas: [
        "2001 Liberty Way", "2063 Freedom Avenue", "2201 Liberty Way Station service",
        "4031 Indepence Parkway", "4061 Fairfax Road", "6021 Colonial drive Station service",
        "11101 Grand ST Station service", "11051 Maple Street", "11082 Maple street"
    ]
};

export const HEIST_DATA = [
    { id: 'car_theft', name: 'Vol de Voiture', min: 10000, max: 70000, time: 300, rate: 100, icon: 'car', requiresValidation: false, requiresGang: true, risk: 1, teamMin: 1, teamMax: 2, requiresLocation: false },
    { id: 'atm', name: 'Braquage ATM', min: 1000, max: 5000, time: 90, rate: 100, icon: 'credit-card', requiresValidation: false, requiresGang: false, risk: 2, teamMin: 1, teamMax: 3, requiresLocation: true },
    { id: 'house', name: 'Cambriolage Maison', min: 100, max: 500, time: 60, rate: 100, icon: 'home', requiresValidation: false, requiresGang: false, risk: 1, teamMin: 3, teamMax: 5, requiresLocation: true },
    { id: 'gas', name: 'Station Service', min: 500, max: 1000, time: 105, rate: 100, icon: 'fuel', requiresValidation: false, requiresGang: false, risk: 2, teamMin: 2, teamMax: 6, requiresLocation: true },
    { id: 'truck', name: 'Fourgon Blindé', min: 250000, max: 500000, time: 900, rate: 15, icon: 'truck', requiresValidation: true, requiresGang: true, risk: 4, teamMin: 5, teamMax: 10, requiresLocation: false },
    { id: 'jewelry', name: 'Bijouterie', min: 500000, max: 700000, time: 1020, rate: 10, icon: 'gem', requiresValidation: true, requiresGang: true, risk: 5, teamMin: 2, teamMax: 9, requiresLocation: false },
    { id: 'bank', name: 'Banque Centrale', min: 700000, max: 1000000, time: 1200, rate: 5, icon: 'landmark', requiresValidation: true, requiresGang: true, risk: 5, teamMin: 7, teamMax: 13, requiresLocation: false }
];

export const DRUG_DATA = {
    coke: {
        name: 'Cocaïne',
        harvest: { 100: 5, 500: 7, 1000: 35 }, // Minutes
        process: { 100: 5, 500: 10, 1000: 30 },
        sell: { 100: 7, 500: 13, 1000: 25 },
        pricePerG: 60
    },
    weed: {
        name: 'Cannabis',
        harvest: { 100: 3, 500: 5, 1000: 25 },
        process: { 100: 5, 500: 7, 1000: 25 },
        sell: { 100: 5, 500: 10, 1000: 25 },
        pricePerG: 20
    }
};

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

export const IllicitView = () => {
    // GUILD CHECK
    if (!state.user.guilds || !state.user.guilds.includes(CONFIG.GUILD_ILLEGAL)) {
         return `
            <div class="h-full flex flex-col items-center justify-center p-8 text-center animate-fade-in">
                <div class="glass-panel max-w-md w-full p-8 rounded-2xl border-red-500/30 shadow-[0_0_50px_rgba(239,68,68,0.1)]">
                    <div class="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
                        <i data-lucide="skull" class="w-10 h-10"></i>
                    </div>
                    <h2 class="text-2xl font-bold text-white mb-2">Accès Restreint</h2>
                    <p class="text-gray-400 mb-8">Pour accéder au réseau criminel, vous devez faire partie du serveur Discord Illégal.</p>
                    <a href="${CONFIG.INVITE_ILLEGAL}" target="_blank" class="glass-btn w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                        <i data-lucide="external-link" class="w-4 h-4"></i>
                        Rejoindre le Discord
                    </a>
                </div>
            </div>
         `;
    }

    if (!state.bankAccount) return '<div class="p-8 text-center text-gray-500"><div class="loader-spinner mb-4 mx-auto"></div>Chargement du réseau crypté...</div>';

    // NAVIGATION TABS
    const tabs = [
        { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
        { id: 'gangs', label: 'Gangs', icon: 'users' },
        { id: 'bounties', label: 'Contrats', icon: 'crosshair' },
        { id: 'market', label: 'Marché Noir', icon: 'shopping-cart' }
    ];

    const currentTab = ['dashboard', 'gangs', 'bounties', 'market'].includes(state.activeIllicitTab) ? state.activeIllicitTab : 'dashboard';
    const hasGang = !!state.activeGang;

    // --- CONTENT SWITCHER ---
    let content = '';

    // 1. DASHBOARD
    if (state.activeIllicitTab === 'dashboard') {
        
        // Activity Status
        let heistWidget = '';
        if (state.activeHeistLobby && state.activeHeistLobby.status === 'active') {
             const hData = HEIST_DATA.find(h => h.id === state.activeHeistLobby.heist_type);
             heistWidget = `
                <div class="glass-panel p-4 mb-4 rounded-xl border border-orange-500/30 flex items-center justify-between animate-pulse-slow">
                    <div class="flex items-center gap-3">
                        <div class="p-2 bg-orange-500/20 rounded text-orange-400"><i data-lucide="timer" class="w-5 h-5"></i></div>
                        <div>
                            <div class="text-xs font-bold text-orange-400 uppercase">Braquage en cours</div>
                            <div class="text-white font-bold">${hData ? hData.name : 'Opération'}</div>
                            ${state.activeHeistLobby.location ? `<div class="text-[10px] text-gray-400"><i data-lucide="map-pin" class="w-3 h-3 inline"></i> ${state.activeHeistLobby.location}</div>` : ''}
                        </div>
                    </div>
                    <div id="heist-timer-display" class="font-mono text-xl font-bold text-white">00:00</div>
                    <button onclick="actions.setIllicitTab('heists')" class="text-xs bg-orange-500/20 text-orange-300 px-2 py-1 rounded hover:bg-orange-500/30">Voir</button>
                </div>
             `;
        }
        
        // Pending Request Status
        let pendingStatus = '';
        if (state.activeGang && state.activeGang.myStatus === 'pending') {
             pendingStatus = `
                <div class="glass-panel p-4 mb-4 rounded-xl border border-purple-500/30 flex items-center gap-4">
                     <div class="p-2 bg-purple-500/20 rounded text-purple-400"><i data-lucide="hourglass" class="w-5 h-5"></i></div>
                     <div>
                        <div class="text-xs font-bold text-purple-400 uppercase">Candidature Gang</div>
                        <div class="text-white font-bold">En attente de validation par le chef</div>
                     </div>
                </div>
             `;
        }

        content = `
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <div class="space-y-6">
                    ${heistWidget}
                    ${pendingStatus}
                    
                    <div class="glass-panel p-6 rounded-2xl relative overflow-hidden">
                        <div class="absolute right-0 top-0 p-4 opacity-10"><i data-lucide="users" class="w-24 h-24 text-white"></i></div>
                        <h3 class="text-lg font-bold text-white mb-2">Mon Gang</h3>
                        ${hasGang && state.activeGang.myStatus === 'accepted' ? `
                            <div class="text-2xl font-bold text-purple-400 mb-1">${state.activeGang.name}</div>
                            <div class="text-sm text-gray-400 mb-4">Rang: <span class="text-white uppercase font-bold">${state.activeGang.myRank}</span></div>
                            <button onclick="actions.setIllicitTab('gangs')" class="glass-btn-secondary w-full py-2 rounded-lg text-sm">Gérer le Gang</button>
                        ` : hasGang && state.activeGang.myStatus === 'pending' ? `
                            <div class="text-2xl font-bold text-gray-400 mb-1">${state.activeGang.name}</div>
                            <p class="text-gray-400 text-sm mb-4">Votre dossier est sur le bureau du chef.</p>
                            <button onclick="actions.setIllicitTab('gangs')" class="glass-btn w-full py-2 rounded-lg text-sm bg-gray-700 hover:bg-gray-600">Voir Détails</button>
                        ` : `
                            <p class="text-gray-400 text-sm mb-4">Vous n'appartenez à aucun gang. Rejoignez une organisation pour débloquer les gros braquages et la production de drogue.</p>
                            <button onclick="actions.setIllicitTab('gangs')" class="glass-btn w-full py-2 rounded-lg text-sm bg-purple-600 hover:bg-purple-500">Trouver un Gang</button>
                        `}
                    </div>

                    <!-- Quick Access -->
                    <div class="grid grid-cols-2 gap-4">
                         <button onclick="actions.setIllicitTab('heists')" class="glass-panel p-4 rounded-xl hover:border-orange-500/50 transition-all text-left group">
                            <i data-lucide="timer" class="w-8 h-8 text-orange-500 mb-2 group-hover:scale-110 transition-transform"></i>
                            <div class="font-bold text-white">Braquages</div>
                            <div class="text-xs text-gray-500">Petits & Gros coups</div>
                        </button>
                         <button onclick="${hasGang && state.activeGang.myStatus === 'accepted' ? "actions.setIllicitTab('drugs')" : "ui.showToast('Gang requis.', 'error')"}" class="glass-panel p-4 rounded-xl hover:border-emerald-500/50 transition-all text-left group ${!hasGang || state.activeGang?.myStatus !== 'accepted' ? 'opacity-50' : ''}">
                            <i data-lucide="flask-conical" class="w-8 h-8 text-emerald-500 mb-2 group-hover:scale-110 transition-transform"></i>
                            <div class="font-bold text-white">Laboratoire</div>
                            <div class="text-xs text-gray-500">Production stupéfiants</div>
                            ${!hasGang || state.activeGang?.myStatus !== 'accepted' ? '<div class="mt-2 text-[10px] text-red-400 uppercase font-bold"><i data-lucide="lock" class="w-3 h-3 inline"></i> Gang Requis</div>' : ''}
                        </button>
                    </div>
                 </div>

                 <!-- Recent Bounties Preview -->
                 <div class="glass-panel p-6 rounded-2xl flex flex-col">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg font-bold text-white flex items-center gap-2"><i data-lucide="crosshair" class="w-5 h-5 text-red-400"></i> Contrats Récents</h3>
                        <button onclick="actions.setIllicitTab('bounties')" class="text-xs text-gray-400 hover:text-white">Voir tout</button>
                    </div>
                    <div class="space-y-3 flex-1 overflow-y-auto custom-scrollbar max-h-[300px]">
                        ${state.bounties.filter(b => b.status === 'active').slice(0, 5).map(b => `
                            <div class="bg-white/5 p-3 rounded-lg border border-white/5 flex justify-between items-center">
                                <div>
                                    <div class="font-bold text-white text-sm">${b.target_name}</div>
                                    <div class="text-xs text-gray-500">Par: ${b.creator?.first_name || 'Anonyme'}</div>
                                </div>
                                <div class="text-red-400 font-mono font-bold">$${b.amount.toLocaleString()}</div>
                            </div>
                        `).join('')}
                        ${state.bounties.filter(b => b.status === 'active').length === 0 ? '<div class="text-center text-gray-500 italic text-sm">Aucun contrat actif.</div>' : ''}
                    </div>
                 </div>
            </div>
        `;
    }

    // 2. GANGS
    else if (state.activeIllicitTab === 'gangs') {
        const myGang = state.activeGang;
        
        if (myGang) {
            // SHOW MY GANG INTERFACE
            const isLeader = (myGang.myRank === 'leader' || myGang.myRank === 'co_leader') && myGang.myStatus === 'accepted';
            const isPending = myGang.myStatus === 'pending';
            
            const leaderName = myGang.leader ? `${myGang.leader.first_name} ${myGang.leader.last_name}` : 'Inconnu';
            const coLeaderName = myGang.co_leader ? `${myGang.co_leader.first_name} ${myGang.co_leader.last_name}` : 'Aucun';
            
            const allMembers = myGang.members || [];
            const acceptedMembers = allMembers.filter(m => m.status === 'accepted');
            const pendingMembers = allMembers.filter(m => m.status === 'pending');
            
            const balance = myGang.balance || 0;

            if (isPending) {
                content = `
                    <div class="flex items-center justify-center h-full p-4">
                        <div class="glass-panel p-10 rounded-[40px] max-w-lg w-full text-center border-purple-500/30 shadow-[0_0_50px_rgba(168,85,247,0.1)] relative overflow-hidden">
                            <div class="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent"></div>
                            
                            <div class="w-24 h-24 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 mx-auto mb-6 relative">
                                <i data-lucide="hourglass" class="w-10 h-10 animate-pulse"></i>
                            </div>
                            
                            <h2 class="text-3xl font-bold text-white mb-2">Candidature en cours</h2>
                            <div class="inline-block px-4 py-1.5 rounded-full bg-purple-500/10 text-purple-300 text-sm font-bold border border-purple-500/20 mb-8">
                                ${myGang.name}
                            </div>
                            
                            <div class="text-gray-400 mb-8 leading-relaxed text-sm bg-black/20 p-4 rounded-xl border border-white/5">
                                Votre dossier a été transmis au chef de gang. Vous ne pouvez pas postuler ailleurs tant que cette demande n'a pas été traitée.
                            </div>
                            
                            <button onclick="actions.leaveGang()" class="glass-btn-secondary px-8 py-3 rounded-xl text-red-300 hover:bg-red-500/10 border-red-500/20 hover:text-red-400 w-full transition-all">
                                Annuler ma demande
                            </button>
                        </div>
                    </div>
                `;
            } else {
                content = `
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                        <div class="glass-panel p-6 rounded-2xl col-span-1 lg:col-span-2 flex flex-col">
                            <div class="flex justify-between items-start mb-6">
                                <div>
                                    <h2 class="text-3xl font-bold text-white mb-1">${myGang.name}</h2>
                                    <div class="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-bold uppercase tracking-wider">
                                        <i data-lucide="crown" class="w-3 h-3"></i> ${myGang.myRank}
                                    </div>
                                </div>
                                <button onclick="actions.leaveGang()" class="glass-btn-secondary px-4 py-2 rounded-lg text-xs text-red-300 hover:bg-red-500/20">Quitter le Gang</button>
                            </div>
                            
                            <div class="grid grid-cols-2 gap-4 mb-6">
                                <div class="bg-white/5 p-4 rounded-xl border border-white/5">
                                    <div class="text-gray-400 text-xs uppercase mb-1">Chef</div>
                                    <div class="text-white font-bold">${leaderName}</div>
                                </div>
                                <div class="bg-white/5 p-4 rounded-xl border border-white/5">
                                    <div class="text-gray-400 text-xs uppercase mb-1">Sous-Chef</div>
                                    <div class="text-white font-bold">${coLeaderName}</div>
                                </div>
                            </div>

                             <div class="mt-2 flex-1 overflow-hidden flex flex-col">
                                <h3 class="font-bold text-white mb-4">Membres du Gang (${acceptedMembers.length})</h3>
                                <div class="overflow-y-auto custom-scrollbar flex-1 bg-white/5 rounded-xl border border-white/5">
                                    <table class="w-full text-left text-sm">
                                        <thead class="bg-black/20 text-gray-500 uppercase text-xs sticky top-0 backdrop-blur-md">
                                            <tr>
                                                <th class="p-3">Nom</th>
                                                <th class="p-3">Rang</th>
                                                ${isLeader ? '<th class="p-3 text-right">Actions</th>' : ''}
                                            </tr>
                                        </thead>
                                        <tbody class="divide-y divide-white/5">
                                            ${acceptedMembers.map(m => `
                                                <tr class="hover:bg-white/5">
                                                    <td class="p-3 font-medium text-white">${m.characters?.first_name} ${m.characters?.last_name}</td>
                                                    <td class="p-3"><span class="px-2 py-0.5 rounded text-[10px] uppercase font-bold ${m.rank === 'leader' ? 'bg-red-500/20 text-red-400' : m.rank === 'co_leader' ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-500/20 text-gray-400'}">${m.rank}</span></td>
                                                    ${isLeader ? `
                                                        <td class="p-3 text-right flex justify-end gap-2">
                                                            ${m.character_id !== state.activeCharacter.id ? `
                                                                <button onclick="actions.gangDistribute('${m.character_id}', '${m.characters?.first_name}')" class="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded hover:bg-emerald-500/20" title="Donner Argent"><i data-lucide="banknote" class="w-3 h-3"></i></button>
                                                                ${m.rank !== 'leader' ? `<button onclick="actions.manageGangRequest('${m.character_id}', 'kick')" class="text-xs bg-red-500/10 text-red-400 px-2 py-1 rounded hover:bg-red-500/20" title="Virer"><i data-lucide="user-x" class="w-3 h-3"></i></button>` : ''}
                                                            ` : '<span class="text-xs text-gray-600">Vous</span>'}
                                                        </td>
                                                    `: ''}
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            
                            ${isLeader && pendingMembers.length > 0 ? `
                                <div class="mt-6">
                                    <h3 class="font-bold text-white mb-2 flex items-center gap-2">
                                        <span class="relative flex h-3 w-3">
                                          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                          <span class="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                                        </span>
                                        Demandes d'adhésion (${pendingMembers.length})
                                    </h3>
                                    <div class="bg-orange-500/10 border border-orange-500/20 rounded-xl overflow-hidden">
                                        ${pendingMembers.map(p => `
                                            <div class="p-3 flex justify-between items-center border-b border-orange-500/10 last:border-0">
                                                <div class="font-bold text-orange-200 text-sm">${p.characters?.first_name} ${p.characters?.last_name}</div>
                                                <div class="flex gap-2">
                                                    <button onclick="actions.manageGangRequest('${p.character_id}', 'accept')" class="bg-emerald-500 hover:bg-emerald-400 text-white p-1 rounded"><i data-lucide="check" class="w-4 h-4"></i></button>
                                                    <button onclick="actions.manageGangRequest('${p.character_id}', 'reject')" class="bg-red-500 hover:bg-red-400 text-white p-1 rounded"><i data-lucide="x" class="w-4 h-4"></i></button>
                                                </div>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                        
                        <div class="space-y-6">
                            <!-- GANG SAFE (COFFRE FORT) -->
                            <div class="glass-panel p-6 rounded-2xl bg-gradient-to-br from-gray-900 to-black border-purple-500/20 shadow-2xl">
                                <h3 class="font-bold text-white mb-4 flex items-center gap-2">
                                    <i data-lucide="vault" class="w-5 h-5 text-purple-400"></i> Coffre-Fort
                                </h3>
                                <div class="text-3xl font-mono font-bold text-white mb-6 text-center">$ ${balance.toLocaleString()}</div>
                                
                                <div class="space-y-3">
                                    <form onsubmit="actions.gangDeposit(event)" class="flex gap-2">
                                        <input type="number" name="amount" placeholder="Dépôt ($)" class="glass-input flex-1 p-2 rounded-lg text-sm bg-black/40" required min="1">
                                        <button type="submit" class="glass-btn-secondary bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 px-3 rounded-lg border-emerald-500/20"><i data-lucide="arrow-down" class="w-4 h-4"></i></button>
                                    </form>
                                    ${isLeader ? `
                                        <form onsubmit="actions.gangWithdraw(event)" class="flex gap-2">
                                            <input type="number" name="amount" placeholder="Retrait ($)" class="glass-input flex-1 p-2 rounded-lg text-sm bg-black/40" required min="1">
                                            <button type="submit" class="glass-btn-secondary bg-red-500/10 text-red-400 hover:bg-red-500/20 px-3 rounded-lg border-red-500/20"><i data-lucide="arrow-up" class="w-4 h-4"></i></button>
                                        </form>
                                    ` : ''}
                                    <p class="text-[10px] text-gray-500 text-center mt-2">Dépôt libre • Retrait Chef uniquement</p>
                                </div>
                            </div>

                            <div class="glass-panel p-6 rounded-2xl">
                                <h3 class="font-bold text-white mb-4">Infos Gang</h3>
                                <p class="text-sm text-gray-400 mb-4">En tant que membre, vous participez à la réputation et aux activités du groupe.</p>
                                <div class="space-y-2">
                                    <div class="flex items-center gap-3 text-sm text-gray-300"><i data-lucide="check" class="w-4 h-4 text-emerald-400"></i> Gros Braquages (Banque, Truck...)</div>
                                    <div class="flex items-center gap-3 text-sm text-gray-300"><i data-lucide="check" class="w-4 h-4 text-emerald-400"></i> Laboratoire de Drogue</div>
                                    <div class="flex items-center gap-3 text-sm text-gray-300"><i data-lucide="check" class="w-4 h-4 text-emerald-400"></i> Coffre commun (Taxe 25% Auto)</div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }
        } else {
            // LIST OF GANGS TO JOIN
            content = `
                <div class="max-w-4xl mx-auto">
                    ${refreshBanner}
                    <div class="text-center mb-8">
                        <h2 class="text-2xl font-bold text-white">Organisations Criminelles</h2>
                        <p class="text-gray-400 text-sm mt-1">Rejoignez un gang pour accéder aux opérations majeures.</p>
                        <p class="text-[10px] text-gray-500 mt-2">Pour créer un gang, veuillez faire une demande sur le Discord Illégal.</p>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        ${state.gangs.map(g => `
                            <div class="glass-panel p-6 rounded-2xl border border-white/5 hover:border-purple-500/30 transition-all group">
                                <div class="flex justify-between items-start mb-4">
                                    <div class="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 font-bold text-lg group-hover:bg-purple-500 group-hover:text-white transition-colors">
                                        ${g.name[0]}
                                    </div>
                                    <button onclick="actions.applyToGang('${g.id}')" class="glass-btn-secondary px-4 py-2 rounded-lg text-xs font-bold hover:bg-purple-500/20 hover:text-purple-300">
                                        Postuler
                                    </button>
                                </div>
                                <h3 class="text-xl font-bold text-white mb-1">${g.name}</h3>
                                <div class="text-xs text-gray-400">Chef: <span class="text-gray-300">${g.leader ? g.leader.first_name : 'Inconnu'}</span></div>
                            </div>
                        `).join('')}
                        ${state.gangs.length === 0 ? '<div class="col-span-2 text-center text-gray-500 py-10 bg-white/5 rounded-2xl">Aucun gang enregistré.</div>' : ''}
                    </div>
                </div>
            `;
        }
    }

    // 3. BOUNTIES (CONTRATS)
    else if (state.activeIllicitTab === 'bounties') {
        content = `
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                <!-- FORM -->
                <div class="glass-panel p-6 rounded-2xl h-fit">
                    <h3 class="font-bold text-white mb-4 flex items-center gap-2"><i data-lucide="file-plus" class="w-5 h-5 text-red-400"></i> Créer un Contrat</h3>
                    <form onsubmit="actions.createNewBounty(event)" class="space-y-4" autocomplete="off">
                        <div class="relative z-20">
                            <label class="text-xs text-gray-500 uppercase font-bold ml-1">Cible</label>
                            <div class="relative mt-1">
                                <i data-lucide="search" class="w-4 h-4 absolute left-3 top-3.5 text-gray-500"></i>
                                <input type="text" 
                                    id="bounty_target_input"
                                    placeholder="Rechercher citoyen..." 
                                    value="${state.bountySearchQuery}"
                                    oninput="actions.searchBountyTarget(this.value)"
                                    class="glass-input w-full p-3 pl-10 rounded-xl text-sm ${state.bountyTarget ? 'text-red-400 font-bold border-red-500/50' : ''}" 
                                    autocomplete="off"
                                    ${state.bountyTarget ? 'readonly' : ''}
                                >
                                ${state.bountyTarget ? `
                                    <button type="button" onclick="actions.clearBountyTarget()" class="absolute right-3 top-3 text-gray-500 hover:text-white p-1"><i data-lucide="x" class="w-4 h-4"></i></button>
                                ` : ''}
                            </div>
                             ${!state.bountyTarget ? `
                                <div class="absolute top-full left-0 right-0 bg-[#151515] border border-white/10 rounded-xl mt-1 max-h-48 overflow-y-auto z-50 shadow-2xl custom-scrollbar ${state.gangCreation.searchResults.length === 0 ? 'hidden' : ''}">
                                    ${state.gangCreation.searchResults.map(r => `
                                        <div onclick="actions.selectBountyTarget('${r.id}', '${r.first_name} ${r.last_name}')" class="p-3 hover:bg-white/10 cursor-pointer flex items-center gap-3 border-b border-white/5 last:border-0">
                                            <div class="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 text-xs font-bold">${r.first_name[0]}</div>
                                            <div class="text-sm text-gray-200">${r.first_name} ${r.last_name}</div>
                                        </div>
                                    `).join('')}
                                </div>
                             ` : ''}
                        </div>
                        <div>
                            <label class="text-xs text-gray-500 uppercase font-bold ml-1">Récompense ($)</label>
                            <input type="number" name="amount" min="10000" max="100000" placeholder="10000 - 100000" class="glass-input w-full p-3 rounded-xl text-sm" required>
                        </div>
                        <div>
                            <label class="text-xs text-gray-500 uppercase font-bold ml-1">Motif / Détails</label>
                            <textarea name="description" rows="3" placeholder="Raison du contrat (Optionnel)" class="glass-input w-full p-3 rounded-xl text-sm"></textarea>
                        </div>
                        <button type="submit" class="glass-btn w-full py-3 rounded-xl font-bold text-sm bg-red-600 hover:bg-red-500">Mettre à prix</button>
                        <p class="text-[10px] text-gray-500 text-center mt-2">L'argent est débité immédiatement de votre liquide.</p>
                    </form>
                </div>

                <!-- LIST -->
                <div class="glass-panel p-6 rounded-2xl lg:col-span-2 flex flex-col h-full">
                    ${refreshBanner}
                    <div class="flex justify-between items-center mb-6">
                        <h3 class="font-bold text-white">Tableau des Primes</h3>
                        <div class="text-xs text-gray-400">${state.bounties.filter(b => b.status === 'active').length} Actifs</div>
                    </div>
                    
                    <div class="space-y-4 flex-1 overflow-y-auto custom-scrollbar">
                        ${state.bounties.map(b => {
                            const isCreator = b.creator_id === state.activeCharacter.id;
                            const isActive = b.status === 'active';
                            
                            return `
                            <div class="bg-white/5 p-4 rounded-xl border ${isActive ? 'border-white/5' : 'border-gray-800 opacity-60'} relative group">
                                <div class="flex justify-between items-start">
                                    <div>
                                        <div class="flex items-center gap-2">
                                            <span class="text-lg font-bold text-white">${b.target_name}</span>
                                            ${!isActive ? `<span class="text-[10px] px-2 py-0.5 bg-gray-700 rounded text-gray-300 uppercase">${b.status}</span>` : ''}
                                        </div>
                                        <div class="text-xs text-gray-400 mt-1">Commanditaire: ${isCreator ? 'Vous' : 'Anonyme'}</div>
                                        ${b.description ? `<div class="text-sm text-gray-300 mt-2 bg-black/20 p-2 rounded italic">"${b.description}"</div>` : ''}
                                    </div>
                                    <div class="text-right">
                                        <div class="text-2xl font-mono font-bold text-red-400">$${b.amount.toLocaleString()}</div>
                                    </div>
                                </div>
                                
                                ${isCreator && isActive ? `
                                    <div class="mt-4 pt-3 border-t border-white/5 flex justify-end gap-2">
                                        <button onclick="actions.resolveBounty('${b.id}', 'CANCEL')" class="text-xs text-gray-500 hover:text-white px-3 py-1">Annuler</button>
                                        <button onclick="actions.resolveBounty('${b.id}')" class="glass-btn-secondary px-3 py-1 rounded text-xs font-bold text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20">Attribuer Prime</button>
                                    </div>
                                ` : ''}
                            </div>
                        `}).join('')}
                        ${state.bounties.length === 0 ? '<div class="text-center text-gray-500 py-10">Aucun contrat.</div>' : ''}
                    </div>
                </div>
            </div>
        `;
    }

    // 4. MARCHÉ NOIR
    else if (state.activeIllicitTab === 'market' || state.activeIllicitTab.startsWith('market-')) {
         
         // SESSION CHECK FOR MARKET
         if (!state.activeGameSession) {
             content = `
                <div class="flex flex-col items-center justify-center h-full p-10 text-center animate-fade-in">
                    <div class="w-24 h-24 bg-red-900/20 rounded-full flex items-center justify-center text-red-500 mb-6 border border-red-500/20">
                        <i data-lucide="lock" class="w-12 h-12"></i>
                    </div>
                    <h2 class="text-3xl font-bold text-white mb-4">Marché Fermé</h2>
                    <p class="text-gray-400 max-w-md mx-auto leading-relaxed">
                        Les fournisseurs ne sont pas en ville actuellement. Le marché noir n'est accessible que lorsqu'une session de jeu est active.
                    </p>
                </div>
            `;
         } else {
             const catTabs = [
                { id: 'light', label: 'Légères / Outils', icon: 'target' },
                { id: 'medium', label: 'Moyennes', icon: 'zap' },
                { id: 'heavy', label: 'Lourdes', icon: 'flame' },
                { id: 'sniper', label: 'Snipers', icon: 'crosshair' }
            ];
    
            let currentSubTab = state.activeIllicitTab === 'market' ? 'light' : state.activeIllicitTab.replace('market-', '');
    
            // Filter Items Logic
            let currentItems = BLACK_MARKET_CATALOG[currentSubTab] || [];
            if (state.blackMarketSearch) {
                const q = state.blackMarketSearch.toLowerCase();
                currentItems = currentItems.filter(i => i.name.toLowerCase().includes(q));
            }
    
            content = `
                <div class="space-y-6">
                     <!-- Search & Balance -->
                     <div class="flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div class="relative w-full md:w-96">
                            <i data-lucide="search" class="w-4 h-4 absolute left-3 top-3.5 text-gray-500"></i>
                            <input type="text" 
                                oninput="actions.searchBlackMarket(this.value)" 
                                value="${state.blackMarketSearch}"
                                placeholder="Rechercher arme, outil..." 
                                class="glass-input pl-10 pr-4 py-3 rounded-xl w-full text-sm">
                        </div>
                        <div class="text-right whitespace-nowrap px-4 py-2 bg-white/5 rounded-xl border border-white/5">
                            <div class="text-[10px] text-gray-400 uppercase tracking-widest">Liquide Disponible</div>
                            <div class="text-xl font-mono font-bold text-emerald-400">$ ${state.bankAccount.cash_balance.toLocaleString()}</div>
                        </div>
                    </div>
    
                     <!-- Category Tabs -->
                    <div class="flex gap-2 overflow-x-auto custom-scrollbar pb-2">
                        ${catTabs.map(tab => `
                            <button onclick="actions.setIllicitTab('market-${tab.id}')" 
                                class="px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all border ${currentSubTab === tab.id 
                                    ? 'bg-red-600 text-white border-red-500 shadow-lg shadow-red-500/20' 
                                    : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:text-white'}">
                                <i data-lucide="${tab.icon}" class="w-4 h-4"></i>
                                ${tab.label}
                            </button>
                        `).join('')}
                    </div>
    
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        ${currentItems.length === 0 ? '<div class="col-span-3 text-center text-gray-500 py-10">Aucun article trouvé.</div>' : ''}
                        ${currentItems.map(item => {
                            const canAfford = state.bankAccount.cash_balance >= item.price;
                            return `
                                <div class="glass-panel p-5 rounded-2xl border border-white/5 hover:border-red-500/30 transition-all group relative overflow-hidden">
                                    <div class="absolute inset-0 bg-red-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                                    <div class="relative z-10 mb-6">
                                        <div class="flex justify-between items-start mb-4">
                                            <div class="w-12 h-12 rounded-lg bg-black/50 border border-white/10 flex items-center justify-center text-gray-400 group-hover:text-red-400 transition-colors">
                                                <i data-lucide="${item.icon}" class="w-6 h-6"></i>
                                            </div>
                                            <div class="font-mono text-xl font-bold ${canAfford ? 'text-emerald-400' : 'text-red-500'}">
                                                $${item.price.toLocaleString()}
                                            </div>
                                        </div>
                                        <h3 class="text-lg font-bold text-white mb-1">${item.name}</h3>
                                        <div class="text-xs text-gray-500">Import illégal</div>
                                    </div>
                                    <button onclick="actions.buyIllegalItem('${item.name}', ${item.price})" ${!canAfford ? 'disabled' : ''} class="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${canAfford ? 'bg-white text-black hover:scale-105' : 'bg-white/5 text-gray-500 cursor-not-allowed'}">
                                        ${canAfford ? 'Acheter' : 'Fonds Insuffisants'}
                                    </button>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
         }
    }

    // 5. BRAQUAGES
    else if (state.activeIllicitTab === 'heists') {
        // --- NEW CHECK: SESSION ACTIVE ---
        if (!state.activeGameSession) {
            content = `
                <div class="flex flex-col items-center justify-center h-full p-10 text-center animate-fade-in">
                    <div class="w-24 h-24 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-500 mb-6 border border-orange-500/20">
                        <i data-lucide="timer-off" class="w-12 h-12"></i>
                    </div>
                    <h2 class="text-3xl font-bold text-white mb-4">Braquage en préparation...</h2>
                    <p class="text-gray-400 max-w-md mx-auto leading-relaxed">
                        Les équipes logistiques mettent en place le matériel nécessaire. Aucune opération majeure n'est possible tant que la session de jeu n'est pas active.
                    </p>
                    <div class="mt-8 bg-white/5 px-4 py-2 rounded-lg text-sm text-gray-500 border border-white/5">
                        Statut : <span class="text-orange-400 font-bold uppercase">Stand-by</span>
                    </div>
                </div>
            `;
        } else if (state.activeHeistLobby) {
            // LOBBY ACTIVE (Joined or Host)
            const lobby = state.activeHeistLobby;
            const hData = HEIST_DATA.find(h => h.id === lobby.heist_type);
            const isHost = lobby.host_id === state.activeCharacter.id;
            const isFinished = lobby.status === 'finished';
            const isActive = lobby.status === 'active';
            const isPendingReview = lobby.status === 'pending_review';

            // Check if current user is PENDING acceptance
            const myMembership = state.heistMembers.find(m => m.character_id === state.activeCharacter.id);
            if (myMembership && myMembership.status === 'pending') {
                 content = `
                    <div class="flex flex-col items-center justify-center h-full p-10 text-center animate-fade-in">
                        <div class="loader-spinner w-16 h-16 border-4 mb-6"></div>
                        <h2 class="text-2xl font-bold text-white mb-2">Demande envoyée</h2>
                        <p class="text-gray-400 max-w-md mx-auto mb-8">En attente de l'acceptation du chef d'équipe <b>${lobby.host_name}</b> pour rejoindre le braquage.</p>
                        <button onclick="actions.leaveLobby()" class="glass-btn-secondary px-6 py-2 rounded-xl text-sm font-bold border-red-500/30 text-red-400 hover:bg-red-500/10">Annuler ma demande</button>
                    </div>
                 `;
            } else {
                // Filter pending members for host view
                const pendingMembers = state.heistMembers.filter(m => m.status === 'pending');

                content = `
                    <div class="max-w-3xl mx-auto">
                        <div class="glass-panel p-8 rounded-2xl mb-6 text-center">
                            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold uppercase tracking-wider mb-4">
                                ${isPendingReview ? 'En attente de validation' : isActive ? 'Opération en cours' : isFinished ? 'Mission Terminée' : 'Préparation'}
                            </div>
                            <h2 class="text-4xl font-bold text-white mb-2">${hData ? hData.name : 'Inconnu'}</h2>
                            <p class="text-gray-400 mb-6">Chef d'équipe : <span class="text-white font-bold">${lobby.host_name || 'Inconnu'}</span></p>
                            ${lobby.location ? `
                                <div class="bg-white/5 p-3 rounded-lg inline-block mb-6 border border-white/5">
                                    <i data-lucide="map-pin" class="w-4 h-4 inline text-orange-400 mr-1"></i> 
                                    <span class="text-sm font-bold text-white">${lobby.location}</span>
                                </div>
                            ` : ''}

                            ${isActive ? `
                                <div class="text-6xl font-mono font-bold text-orange-500 mb-8" id="heist-timer-display">
                                    00:00
                                </div>
                                <div class="mb-4 text-sm text-gray-400 px-8">
                                    Une fois le délai écoulé, vous pourrez valider la réussite de la mission.
                                </div>
                                <div class="flex flex-col gap-3 justify-center items-center">
                                     ${isHost ? `<button onclick="actions.finishHeist()" class="glass-btn bg-emerald-600 hover:bg-emerald-500 px-8 py-4 rounded-xl font-bold text-lg animate-pulse shadow-lg shadow-emerald-500/20 w-full md:w-auto">Terminer l'opération</button>` : `<div class="text-sm text-gray-500 animate-pulse">En attente du signal du chef...</div>`}
                                     
                                     ${isHost ? `
                                        <button onclick="actions.stopHeist()" class="text-xs text-red-500 hover:text-red-300 underline mt-2">Abandonner / Arrêter le braquage</button>
                                     ` : ''}
                                </div>
                            ` : isPendingReview ? `
                                 <div class="bg-blue-500/10 border border-blue-500/20 p-6 rounded-xl text-blue-200">
                                    <i data-lucide="shield-check" class="w-8 h-8 mx-auto mb-2 text-blue-400"></i>
                                    <p>Le braquage est terminé. Un administrateur doit valider la réussite de l'action RP pour débloquer les fonds.</p>
                                 </div>
                                 <button onclick="actions.leaveLobby()" class="mt-4 text-gray-500 hover:text-white underline text-sm">Quitter le lobby</button>
                            ` : `
                                <div class="bg-white/5 rounded-xl p-6 mb-6 text-left">
                                    <h3 class="font-bold text-white mb-4 flex items-center justify-between">
                                        Équipe d'assaut
                                        <span class="text-xs font-normal text-gray-500">${state.heistMembers.filter(m => m.status === 'accepted').length}/${hData.teamMax} Membres (Min: ${hData.teamMin})</span>
                                    </h3>
                                    <div class="space-y-2">
                                        ${state.heistMembers.filter(m => m.status === 'accepted').map(m => `
                                            <div class="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                                                <div class="flex items-center gap-3">
                                                    <div class="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-400">${m.characters?.first_name[0]}</div>
                                                    <span class="text-sm text-gray-200">${m.characters?.first_name} ${m.characters?.last_name}</span>
                                                </div>
                                                <span class="text-[10px] uppercase font-bold text-emerald-500">Prêt</span>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                                
                                ${isHost && pendingMembers.length > 0 ? `
                                    <div class="bg-orange-500/5 border border-orange-500/20 rounded-xl p-4 mb-6 text-left">
                                         <h3 class="font-bold text-orange-200 mb-2 text-sm flex items-center gap-2">
                                            <i data-lucide="user-plus" class="w-4 h-4"></i> Demandes de participation
                                         </h3>
                                         <div class="space-y-2">
                                            ${pendingMembers.map(m => `
                                                <div class="flex items-center justify-between p-2 bg-black/20 rounded-lg">
                                                    <span class="text-sm text-gray-300 ml-2">${m.characters?.first_name} ${m.characters?.last_name}</span>
                                                    <div class="flex gap-2">
                                                        <button onclick="actions.acceptHeistApplicant('${m.character_id}')" class="bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-white p-1.5 rounded transition-colors"><i data-lucide="check" class="w-4 h-4"></i></button>
                                                        <button onclick="actions.rejectHeistApplicant('${m.character_id}')" class="bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white p-1.5 rounded transition-colors"><i data-lucide="x" class="w-4 h-4"></i></button>
                                                    </div>
                                                </div>
                                            `).join('')}
                                         </div>
                                    </div>
                                ` : ''}

                                <div class="flex gap-4">
                                    <button onclick="actions.leaveLobby()" class="glass-btn-secondary flex-1 py-3 rounded-xl text-sm font-bold">Annuler / Quitter</button>
                                    ${isHost ? `<button onclick="actions.startHeistLobby(${hData.time})" class="glass-btn flex-1 py-3 rounded-xl text-sm font-bold bg-orange-600 hover:bg-orange-500">Lancer l'assaut</button>` : ''}
                                </div>
                            `}
                        </div>
                    </div>
                `;
            }
        } else {
            // LISTE DES BRAQUAGES
            const activeLobbies = state.availableHeistLobbies.filter(l => l.status === 'active');
            const setupLobbies = state.availableHeistLobbies.filter(l => l.status === 'setup');

            content = `
                <div class="space-y-6">
                    ${refreshBanner}
                    
                    <!-- LOBBIES EN COURS / RECRUTEMENT -->
                    <div class="mb-8">
                        <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2"><i data-lucide="radio" class="w-5 h-5 text-red-500 animate-pulse"></i> Opérations en cours & Recrutement</h3>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            ${[...activeLobbies, ...setupLobbies].length === 0 ? '<div class="col-span-2 text-center text-gray-500 py-6 italic border border-dashed border-white/5 rounded-xl">Aucune activité criminelle détectée.</div>' : ''}
                            
                            ${[...activeLobbies, ...setupLobbies].map(l => {
                                const h = HEIST_DATA.find(d => d.id === l.heist_type);
                                const isSetup = l.status === 'setup';
                                const isOpen = l.access_type === 'open';
                                
                                // Calculate time if active
                                let timeDisplay = '';
                                if(!isSetup) {
                                    const remaining = Math.max(0, Math.ceil((new Date(l.end_time).getTime() - Date.now()) / 1000));
                                    timeDisplay = `${Math.floor(remaining / 60)}:${(remaining % 60).toString().padStart(2, '0')}`;
                                }

                                return `
                                    <div class="glass-panel p-4 rounded-xl border border-white/5 flex items-center justify-between">
                                        <div class="flex items-center gap-4">
                                            <div class="w-10 h-10 rounded-full ${isSetup ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'} flex items-center justify-center">
                                                <i data-lucide="${isSetup ? 'users' : 'timer'}" class="w-5 h-5"></i>
                                            </div>
                                            <div>
                                                <div class="font-bold text-white text-sm">${h.name}</div>
                                                <div class="text-xs text-gray-400">Chef: ${l.host_name}</div>
                                            </div>
                                        </div>
                                        
                                        ${isSetup ? `
                                            <button onclick="actions.requestJoinLobby('${l.id}')" class="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-white flex items-center gap-2 transition-colors border border-white/10">
                                                ${isOpen ? '<i data-lucide="unlock" class="w-3 h-3 text-green-400"></i> Rejoindre' : '<i data-lucide="lock" class="w-3 h-3 text-purple-400"></i> Postuler'}
                                            </button>
                                        ` : `
                                            <div class="font-mono font-bold text-orange-400 text-lg">${timeDisplay}</div>
                                        `}
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>

                    <!-- CREATE NEW -->
                    <div class="flex justify-between items-center">
                        <h2 class="text-2xl font-bold text-white">Lancer un Braquage</h2>
                    </div>

                    <div class="grid grid-cols-1 gap-4">
                        ${HEIST_DATA.map(h => {
                            const isLocked = h.requiresGang && (!hasGang || state.activeGang?.myStatus !== 'accepted');
                            
                            // Visual Risk Dots
                            let riskDots = '';
                            for(let i=0; i<5; i++) {
                                riskDots += `<div class="w-2 h-2 rounded-full ${i < h.risk ? 'bg-red-500' : 'bg-gray-700'}"></div>`;
                            }

                            return `
                                <div class="glass-card p-0 rounded-2xl flex flex-col md:flex-row overflow-hidden group ${isLocked ? 'opacity-50 grayscale' : 'hover:border-orange-500/50'} transition-all">
                                    <!-- Icon Section -->
                                    <div class="bg-white/5 w-full md:w-32 flex items-center justify-center p-6 md:p-0">
                                        <i data-lucide="${h.icon}" class="w-10 h-10 ${isLocked ? 'text-gray-500' : 'text-orange-500'}"></i>
                                    </div>
                                    
                                    <!-- Content -->
                                    <div class="p-6 flex-1 flex flex-col md:flex-row items-center justify-between gap-6">
                                        <div class="flex-1 text-center md:text-left">
                                            <div class="flex items-center justify-center md:justify-start gap-2 mb-1">
                                                <h3 class="text-xl font-bold text-white">${h.name}</h3>
                                                ${isLocked ? '<i data-lucide="lock" class="w-4 h-4 text-gray-500"></i>' : ''}
                                            </div>
                                            
                                            <div class="flex items-center justify-center md:justify-start gap-1 mb-2" title="Niveau de Risque">
                                                ${riskDots}
                                                <span class="text-xs text-gray-500 ml-2 uppercase font-bold">Risque niv. ${h.risk}</span>
                                            </div>

                                            <div class="flex flex-wrap justify-center md:justify-start gap-3 text-xs text-gray-400">
                                                <span class="flex items-center gap-1"><i data-lucide="clock" class="w-3 h-3"></i> ${Math.floor(h.time/60)} min</span>
                                                <span class="flex items-center gap-1"><i data-lucide="users" class="w-3 h-3"></i> ${h.teamMin}-${h.teamMax} Pers.</span>
                                                <span class="flex items-center gap-1"><i data-lucide="users" class="w-3 h-3"></i> ${h.requiresGang ? 'Gang Requis' : 'Indépendant'}</span>
                                            </div>
                                        </div>

                                        <div class="text-center md:text-right">
                                            <div class="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Gain Estimé</div>
                                            <div class="text-2xl font-mono font-bold text-emerald-400">$${h.min/1000}k - $${h.max/1000}k</div>
                                        </div>

                                        <button onclick="actions.createLobby('${h.id}')" ${isLocked ? 'disabled' : ''} class="glass-btn-secondary px-6 py-3 rounded-xl font-bold text-sm hover:bg-white/10 ${isLocked ? 'cursor-not-allowed' : 'hover:text-orange-400 border-orange-500/30'}">
                                            ${isLocked ? 'Verrouillé' : 'Préparer'}
                                        </button>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }
    }

    // 6. DROGUE (LABO)
    else if (state.activeIllicitTab === 'drugs') {
         if (!hasGang || state.activeGang.myStatus !== 'accepted') {
             content = `<div class="p-10 text-center text-gray-500">Accès refusé. Vous devez appartenir à un gang (Membre validé).</div>`;
         } else {
             const lab = state.drugLab;
             const inProgress = lab.current_batch; 
             
             // Production View
             if (inProgress && inProgress.end_time > Date.now()) {
                const typeName = DRUG_DATA[inProgress.type].name;
                const stageLabels = { harvest: 'Récolte', process: 'Traitement', sell: 'Vente' };
                
                content = `
                    <div class="flex flex-col items-center justify-center h-full text-center p-8">
                        <div class="w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6 relative">
                             <div class="absolute inset-0 border-4 border-emerald-500/30 rounded-full border-t-emerald-500 animate-spin"></div>
                             <i data-lucide="flask-conical" class="w-10 h-10 text-emerald-500"></i>
                        </div>
                        <h2 class="text-2xl font-bold text-white mb-2">${stageLabels[inProgress.stage]} en cours</h2>
                        <p class="text-gray-400 mb-6">${inProgress.amount}g de ${typeName}</p>
                        <div class="text-5xl font-mono font-bold text-white mb-4" id="drug-timer-display">00:00</div>
                        <p class="text-xs text-gray-500">Veuillez patienter...</p>
                    </div>
                `;
             } else {
                 // Management View
                 const stocks = [
                     { id: 'coke', label: 'Cocaïne', raw: lab.stock_coke_raw, pure: lab.stock_coke_pure, color: 'text-white' },
                     { id: 'weed', label: 'Cannabis', raw: lab.stock_weed_raw, pure: lab.stock_weed_pure, color: 'text-emerald-400' }
                 ];

                 content = `
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <!-- STOCKS -->
                        <div class="glass-panel p-6 rounded-2xl">
                            <h3 class="font-bold text-white mb-4 flex items-center gap-2"><i data-lucide="package" class="w-5 h-5 text-gray-400"></i> Stocks Labo</h3>
                            <div class="space-y-4">
                                ${stocks.map(s => `
                                    <div class="bg-white/5 p-4 rounded-xl border border-white/5">
                                        <div class="flex justify-between items-center mb-2">
                                            <span class="font-bold ${s.color}">${s.label}</span>
                                            <i data-lucide="${s.id === 'coke' ? 'wind' : 'leaf'}" class="w-4 h-4 ${s.color}"></i>
                                        </div>
                                        <div class="grid grid-cols-2 gap-2 text-sm">
                                            <div class="bg-black/20 p-2 rounded">
                                                <div class="text-[10px] text-gray-500 uppercase">Brut</div>
                                                <div class="font-mono font-bold text-gray-300">${s.raw}g</div>
                                            </div>
                                            <div class="bg-black/20 p-2 rounded">
                                                <div class="text-[10px] text-gray-500 uppercase">Pure</div>
                                                <div class="font-mono font-bold text-white">${s.pure}g</div>
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <!-- UPGRADES -->
                        <div class="glass-panel p-6 rounded-2xl">
                             <h3 class="font-bold text-white mb-4 flex items-center gap-2"><i data-lucide="zap" class="w-5 h-5 text-yellow-400"></i> Améliorations</h3>
                             <div class="space-y-3">
                                <div class="flex justify-between items-center p-3 bg-white/5 rounded-lg ${lab.has_building ? 'border-emerald-500/30' : ''}">
                                    <div>
                                        <div class="font-bold text-white text-sm">Local Sécurisé</div>
                                        <div class="text-xs text-gray-500">Réduit risque police</div>
                                    </div>
                                    ${lab.has_building ? '<i data-lucide="check" class="w-5 h-5 text-emerald-500"></i>' : '<button onclick="actions.buyLabComponent(\'building\', 50000)" class="text-xs bg-white/10 hover:bg-white/20 px-2 py-1 rounded text-white">$50k</button>'}
                                </div>
                                <div class="flex justify-between items-center p-3 bg-white/5 rounded-lg ${lab.has_equipment ? 'border-emerald-500/30' : ''}">
                                    <div>
                                        <div class="font-bold text-white text-sm">Matériel Pro</div>
                                        <div class="text-xs text-gray-500">Vitesse +25%</div>
                                    </div>
                                    ${lab.has_equipment ? '<i data-lucide="check" class="w-5 h-5 text-emerald-500"></i>' : '<button onclick="actions.buyLabComponent(\'equipment\', 25000)" class="text-xs bg-white/10 hover:bg-white/20 px-2 py-1 rounded text-white">$25k</button>'}
                                </div>
                             </div>
                        </div>

                        <!-- ACTIONS PANEL -->
                        <div class="glass-panel p-6 rounded-2xl lg:col-span-2">
                             <h3 class="font-bold text-white mb-6">Lancer une Opération</h3>
                             
                             <form onsubmit="actions.startDrugAction('harvest', event)" class="mb-6 pb-6 border-b border-white/5 flex flex-col md:flex-row gap-4 items-end">
                                <div class="flex-1 w-full">
                                    <label class="text-xs text-gray-500 uppercase font-bold ml-1 mb-1 block">Récolte (Matière Première)</label>
                                    <select name="drug_type" class="glass-input w-full p-2 rounded-lg text-sm mb-2">
                                        <option value="weed">Cannabis (Weed)</option>
                                        <option value="coke">Cocaïne (Feuille)</option>
                                    </select>
                                    <select name="amount" class="glass-input w-full p-2 rounded-lg text-sm">
                                        <option value="100">Petite qté (100g)</option>
                                        <option value="500">Moyenne qté (500g)</option>
                                        <option value="1000">Grosse qté (1kg)</option>
                                    </select>
                                </div>
                                <button type="submit" class="glass-btn w-full md:w-auto px-6 py-2 rounded-lg font-bold text-sm bg-emerald-600 hover:bg-emerald-500">
                                    Lancer Récolte
                                </button>
                             </form>

                             <form onsubmit="actions.startDrugAction('process', event)" class="flex flex-col md:flex-row gap-4 items-end">
                                <div class="flex-1 w-full">
                                    <label class="text-xs text-gray-500 uppercase font-bold ml-1 mb-1 block">Traitement (Transformation)</label>
                                    <select name="drug_type" class="glass-input w-full p-2 rounded-lg text-sm mb-2">
                                        <option value="weed">Séchage Weed</option>
                                        <option value="coke">Coupe Cocaïne</option>
                                    </select>
                                    <select name="amount" class="glass-input w-full p-2 rounded-lg text-sm">
                                        <option value="100">100g</option>
                                        <option value="500">500g</option>
                                        <option value="1000">1kg</option>
                                    </select>
                                </div>
                                <button type="submit" class="glass-btn w-full md:w-auto px-6 py-2 rounded-lg font-bold text-sm bg-blue-600 hover:bg-blue-500">
                                    Lancer Traitement
                                </button>
                             </form>
                        </div>
                    </div>
                 `;
             }
         }
    }

    return `
        <div class="animate-fade-in max-w-7xl mx-auto h-full flex flex-col">
            <!-- HEADER NAV -->
            <div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div>
                    <h2 class="text-2xl font-bold text-white flex items-center gap-2">
                        <i data-lucide="skull" class="w-6 h-6 text-red-500"></i>
                        Réseau Criminel
                    </h2>
                    <p class="text-gray-400 text-sm">Darknet Access • <span class="text-red-400 font-bold uppercase">Connexion Sécurisée</span></p>
                </div>
                <div class="flex gap-2 bg-white/5 p-1 rounded-xl overflow-x-auto max-w-full">
                    ${tabs.map(t => `
                        <button onclick="actions.setIllicitTab('${t.id}')" 
                            class="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all whitespace-nowrap ${currentTab === t.id ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}">
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