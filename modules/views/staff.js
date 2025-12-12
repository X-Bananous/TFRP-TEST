
import { state } from '../state.js';
import { CONFIG } from '../config.js';
import { hasPermission } from '../utils.js';
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

export const StaffView = () => {
    // GUILD CHECK
    if (!state.user.guilds || !state.user.guilds.includes(CONFIG.GUILD_STAFF)) {
         return `
            <div class="h-full flex flex-col items-center justify-center p-8 text-center animate-fade-in">
                <div class="glass-panel max-w-md w-full p-8 rounded-2xl border-purple-500/30 shadow-[0_0_50px_rgba(168,85,247,0.1)]">
                    <div class="w-20 h-20 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-purple-500">
                        <i data-lucide="shield-alert" class="w-10 h-10"></i>
                    </div>
                    <h2 class="text-2xl font-bold text-white mb-2">Accès Restreint</h2>
                    <p class="text-gray-400 mb-8">Cet espace est réservé à l'administration membre du Discord Staff.</p>
                    <a href="${CONFIG.INVITE_STAFF}" target="_blank" class="glass-btn w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                        <i data-lucide="external-link" class="w-4 h-4"></i>
                        Rejoindre le Discord
                    </a>
                </div>
            </div>
         `;
    }

    // Basic check: Must have at least ONE permission or be founder
    const hasAnyPerm = Object.keys(state.user.permissions || {}).length > 0 || state.user.isFounder;
    if (!hasAnyPerm) return `<div class="p-8 text-red-500">Accès interdit.</div>`;

    // Duty Check
    const isOnDuty = state.onDutyStaff?.some(s => s.username === state.user.username); // Simple check based on loaded list

    let content = '';

    // TABS NAVIGATION
    const tabsHtml = `
        <div class="flex gap-2 mb-8 border-b border-white/10 pb-1 overflow-x-auto custom-scrollbar">
            ${hasPermission('can_approve_characters') ? `
                <button onclick="actions.setStaffTab('applications')" class="px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${state.activeStaffTab === 'applications' ? 'bg-white/10 text-white border-b-2 border-blue-500' : 'text-gray-400 hover:text-white'}">
                    Candidatures
                </button>
            ` : ''}
            
            <button onclick="actions.setStaffTab('database')" class="px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${state.activeStaffTab === 'database' ? 'bg-white/10 text-white border-b-2 border-orange-500' : 'text-gray-400 hover:text-white'}">
                Base de Données
            </button>
            
            ${hasPermission('can_manage_economy') || hasPermission('can_manage_illegal') ? `
                <button onclick="actions.setStaffTab('economy')" class="px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${state.activeStaffTab === 'economy' ? 'bg-white/10 text-white border-b-2 border-emerald-500' : 'text-gray-400 hover:text-white'}">
                    Économie
                </button>
            ` : ''}
            ${hasPermission('can_manage_illegal') ? `
                <button onclick="actions.setStaffTab('illegal')" class="px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${state.activeStaffTab === 'illegal' ? 'bg-white/10 text-white border-b-2 border-red-500' : 'text-gray-400 hover:text-white'}">
                    Illégal & Gangs
                </button>
            ` : ''}
            ${hasPermission('can_manage_enterprises') ? `
                <button onclick="actions.setStaffTab('enterprise')" class="px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${state.activeStaffTab === 'enterprise' ? 'bg-white/10 text-white border-b-2 border-blue-600' : 'text-gray-400 hover:text-white'}">
                    Entreprises
                </button>
            ` : ''}
            ${hasPermission('can_manage_staff') ? `
                <button onclick="actions.setStaffTab('permissions')" class="px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${state.activeStaffTab === 'permissions' ? 'bg-white/10 text-white border-b-2 border-purple-500' : 'text-gray-400 hover:text-white'}">
                    Permissions
                </button>
            ` : ''}
            
             <button onclick="actions.setStaffTab('sessions')" class="px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${state.activeStaffTab === 'sessions' ? 'bg-white/10 text-white border-b-2 border-blue-300' : 'text-gray-400 hover:text-white'}">
                Sessions
            </button>
            
             <button onclick="actions.setStaffTab('logs')" class="px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${state.activeStaffTab === 'logs' ? 'bg-white/10 text-white border-b-2 border-gray-400' : 'text-gray-400 hover:text-white'}">
                Logs & ERLC
            </button>
        </div>
    `;

    // ... (Economy and Inventory Modals omitted for brevity, assume they exist) ...
    // --- MODALS ---
    let economyModalHtml = '';
    if (state.economyModal.isOpen && (hasPermission('can_manage_economy') || hasPermission('can_manage_illegal'))) {
        // ... (Same modal code) ...
        economyModalHtml = `
            <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" onclick="actions.closeEconomyModal()"></div>
                <div class="glass-panel w-full max-w-md p-6 rounded-2xl relative z-10 animate-slide-up shadow-2xl shadow-emerald-500/10">
                    <h3 class="text-xl font-bold text-white mb-1">Gestion Économique</h3>
                    <p class="text-xs text-emerald-400 uppercase tracking-widest mb-6">
                        ${state.economyModal.targetId === 'ALL' ? 'Action Globale (Tous les joueurs)' : state.economyModal.targetName}
                    </p>
                    <form onsubmit="actions.executeEconomyAction(event)" class="space-y-4">
                        <div class="bg-white/5 p-2 rounded-xl mb-4">
                            <label class="text-xs text-gray-500 uppercase font-bold mb-2 block">Type de Fonds</label>
                            <div class="flex gap-2">
                                <label class="flex-1 cursor-pointer">
                                    <input type="radio" name="balance_type" value="bank" checked class="peer sr-only">
                                    <div class="py-2 text-center rounded-lg bg-black/20 text-gray-400 peer-checked:bg-emerald-500/20 peer-checked:text-emerald-400 peer-checked:border peer-checked:border-emerald-500/50 transition-all border border-transparent">
                                        <i data-lucide="landmark" class="w-4 h-4 mx-auto mb-1"></i>
                                        <span class="text-xs font-bold">Compte Bancaire</span>
                                    </div>
                                </label>
                                <label class="flex-1 cursor-pointer">
                                    <input type="radio" name="balance_type" value="cash" class="peer sr-only">
                                    <div class="py-2 text-center rounded-lg bg-black/20 text-gray-400 peer-checked:bg-blue-500/20 peer-checked:text-blue-400 peer-checked:border peer-checked:border-blue-500/50 transition-all border border-transparent">
                                        <i data-lucide="wallet" class="w-4 h-4 mx-auto mb-1"></i>
                                        <span class="text-xs font-bold">Espèces (Cash)</span>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <div class="flex bg-white/5 p-1 rounded-lg">
                            <label class="flex-1 text-center cursor-pointer">
                                <input type="radio" name="mode" value="fixed" checked class="peer sr-only">
                                <span class="block py-2 text-sm font-medium rounded-md text-gray-400 peer-checked:bg-emerald-600 peer-checked:text-white transition-all">Montant Fixe</span>
                            </label>
                            <label class="flex-1 text-center cursor-pointer">
                                <input type="radio" name="mode" value="percent" class="peer sr-only">
                                <span class="block py-2 text-sm font-medium rounded-md text-gray-400 peer-checked:bg-blue-600 peer-checked:text-white transition-all">Pourcentage %</span>
                            </label>
                        </div>
                        <input type="number" name="amount" placeholder="Valeur" min="1" class="glass-input w-full p-3 rounded-xl" required>
                        <textarea name="description" rows="2" placeholder="Motif / Description pour les logs (Optionnel)" class="glass-input w-full p-3 rounded-xl text-sm"></textarea>
                        
                        <div class="grid grid-cols-2 gap-4 pt-2">
                            <button type="submit" name="action" value="add" class="glass-btn bg-emerald-600 hover:bg-emerald-500 py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                                <i data-lucide="plus" class="w-4 h-4"></i> Ajouter
                            </button>
                            <button type="submit" name="action" value="remove" class="glass-btn bg-red-600 hover:bg-red-500 py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                                <i data-lucide="minus" class="w-4 h-4"></i> Retirer
                            </button>
                        </div>
                    </form>
                    <button onclick="actions.closeEconomyModal()" class="absolute top-4 right-4 text-gray-500 hover:text-white"><i data-lucide="x" class="w-5 h-5"></i></button>
                </div>
            </div>
        `;
    }

    let inventoryModalHtml = '';
    if (state.inventoryModal.isOpen && hasPermission('can_manage_inventory')) {
         inventoryModalHtml = `
             <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" onclick="actions.closeInventoryModal()"></div>
                <div class="glass-panel w-full max-w-2xl p-6 rounded-2xl relative z-10 animate-slide-up flex flex-col max-h-[85vh]">
                    <div class="flex justify-between items-start mb-6">
                        <div>
                            <h3 class="text-xl font-bold text-white">Inventaire Admin</h3>
                            <p class="text-xs text-orange-400 uppercase tracking-widest">${state.inventoryModal.targetName}</p>
                        </div>
                        <button onclick="actions.closeInventoryModal()" class="text-gray-500 hover:text-white"><i data-lucide="x" class="w-6 h-6"></i></button>
                    </div>
                    <div class="flex-1 overflow-y-auto custom-scrollbar mb-6 bg-white/5 rounded-xl border border-white/5">
                        ${state.inventoryModal.items.length > 0 ? `
                            <table class="w-full text-left text-sm">
                                <thead class="bg-white/5 text-xs uppercase text-gray-500 sticky top-0"><tr><th class="p-3">Objet</th><th class="p-3">Qté</th><th class="p-3 text-right">Action</th></tr></thead>
                                <tbody class="divide-y divide-white/5">
                                    ${state.inventoryModal.items.map(item => `
                                        <tr>
                                            <td class="p-3 font-medium text-white">${item.name}</td>
                                            <td class="p-3 text-gray-400">${item.quantity}</td>
                                            <td class="p-3 text-right">
                                                <button onclick="actions.manageInventoryItem('remove', '${item.id}', '${item.name}')" class="text-red-400 hover:text-red-300 p-1 bg-red-500/10 rounded"><i data-lucide="trash" class="w-4 h-4"></i></button>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        ` : `<div class="p-8 text-center text-gray-500 italic">Inventaire vide.</div>`}
                    </div>
                    <form onsubmit="actions.manageInventoryItem('add', null, null, event)" class="pt-4 border-t border-white/10">
                        <h4 class="text-sm font-bold text-white mb-3">Ajouter un objet</h4>
                        <div class="flex gap-2">
                            <input type="text" name="item_name" placeholder="Nom de l'objet (ex: Montre)" class="glass-input flex-1 p-2 rounded-lg" required>
                            <input type="number" name="quantity" value="1" min="1" class="glass-input w-20 p-2 rounded-lg" required>
                            <input type="number" name="value" placeholder="Valeur $" class="glass-input w-24 p-2 rounded-lg" required>
                            <button type="submit" class="glass-btn px-4 rounded-lg bg-blue-600 hover:bg-blue-500"><i data-lucide="plus" class="w-4 h-4"></i></button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    // --- CONTENT VIEWS ---
    if (state.activeStaffTab === 'applications' && hasPermission('can_approve_characters')) {
        let pending = state.pendingApplications || [];
        if (state.staffSearchQuery) {
            const q = state.staffSearchQuery.toLowerCase();
            pending = pending.filter(p => p.first_name.toLowerCase().includes(q) || p.last_name.toLowerCase().includes(q) || p.discord_username.toLowerCase().includes(q));
        }
        content = `
            ${refreshBanner}
            <div class="mb-4">
                <div class="relative">
                    <i data-lucide="search" class="w-4 h-4 absolute left-3 top-3 text-gray-500"></i>
                    <input type="text" oninput="actions.staffSearch(this.value)" value="${state.staffSearchQuery}" placeholder="Rechercher une candidature..." class="glass-input pl-10 pr-4 py-2.5 rounded-xl w-full text-sm">
                </div>
            </div>
            <div class="space-y-3">
                ${pending.length === 0 ? `<div class="p-6 text-center text-gray-500 bg-white/5 rounded-xl border border-dashed border-white/10 text-sm">Aucune demande trouvée.</div>` : ''}
                ${pending.map(p => `
                    <div class="glass-card p-4 rounded-xl flex items-center justify-between border-l-4 border-l-amber-500/50">
                        <div class="flex items-center gap-4">
                            <div class="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center font-bold text-gray-400 border border-white/10 overflow-hidden">
                                ${p.discord_avatar ? `<img src="${p.discord_avatar}" class="w-full h-full object-cover">` : p.first_name[0]}
                            </div>
                            <div>
                                <div class="font-bold text-white">${p.first_name} ${p.last_name}</div>
                                <div class="text-xs text-gray-400 flex items-center gap-2"><span class="text-blue-300">@${p.discord_username || 'Inconnu'}</span><span>${p.age} ans</span><span class="text-gray-500 border border-gray-700 px-1 rounded uppercase text-[9px]">${p.alignment || '?'}</span></div>
                            </div>
                        </div>
                        <div class="flex gap-2">
                            <button onclick="actions.decideApplication('${p.id}', 'accepted')" class="bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-400 p-2 rounded-lg transition-colors cursor-pointer"><i data-lucide="check" class="w-4 h-4"></i></button>
                            <button onclick="actions.decideApplication('${p.id}', 'rejected')" class="bg-red-500/20 hover:bg-red-500/40 text-red-400 p-2 rounded-lg transition-colors cursor-pointer"><i data-lucide="x" class="w-4 h-4"></i></button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

    } else if (state.activeStaffTab === 'database') {
        // ... (Database view logic same as before) ...
        const canDelete = hasPermission('can_manage_characters');
        const canInventory = hasPermission('can_manage_inventory');
        const canChangeTeam = hasPermission('can_change_team');
        const canManageJobs = hasPermission('can_manage_jobs');
        
        let allChars = state.allCharactersAdmin || [];
        
        // Sorting Logic
        const sortField = state.adminDbSort.field;
        const sortDir = state.adminDbSort.direction === 'asc' ? 1 : -1;
        
        allChars.sort((a, b) => {
             let valA = a[sortField] || '';
             let valB = b[sortField] || '';
             if (sortField === 'name') {
                 valA = a.last_name + a.first_name;
                 valB = b.last_name + b.first_name;
             }
             if (valA < valB) return -1 * sortDir;
             if (valA > valB) return 1 * sortDir;
             return 0;
        });

        if (state.staffSearchQuery) {
            const q = state.staffSearchQuery.toLowerCase();
            allChars = allChars.filter(c => c.first_name.toLowerCase().includes(q) || c.last_name.toLowerCase().includes(q) || c.discord_username.toLowerCase().includes(q));
        }
        
        content = `
            ${refreshBanner}
            <div class="flex flex-col md:flex-row gap-4 mb-4">
                <div class="relative flex-1">
                    <i data-lucide="search" class="w-4 h-4 absolute left-3 top-3 text-gray-500"></i>
                    <input type="text" oninput="actions.staffSearch(this.value)" value="${state.staffSearchQuery}" placeholder="Rechercher un citoyen..." class="glass-input pl-10 pr-4 py-2.5 rounded-xl w-full text-sm">
                </div>
                <div class="flex gap-2">
                     <select onchange="actions.setAdminSort(this.value)" class="glass-input px-3 py-2.5 rounded-xl text-sm bg-black/40">
                        <option value="name" ${sortField === 'name' ? 'selected' : ''}>Nom</option>
                        <option value="job" ${sortField === 'job' ? 'selected' : ''}>Métier</option>
                        <option value="alignment" ${sortField === 'alignment' ? 'selected' : ''}>Alignement</option>
                        <option value="status" ${sortField === 'status' ? 'selected' : ''}>Statut</option>
                    </select>
                     <button onclick="actions.toggleAdminSortDir()" class="glass-btn-secondary px-3 rounded-xl"><i data-lucide="${sortDir === 1 ? 'arrow-down-az' : 'arrow-up-az'}" class="w-4 h-4"></i></button>
                </div>
            </div>
            <div class="glass-panel overflow-hidden rounded-xl">
                <table class="w-full text-left border-collapse">
                    <thead class="bg-white/5 text-xs uppercase text-gray-400 font-semibold tracking-wider">
                        <tr>
                            <th class="p-4 border-b border-white/10">Citoyen</th>
                            <th class="p-4 border-b border-white/10">Métier & Team</th>
                            <th class="p-4 border-b border-white/10">Statut</th>
                            <th class="p-4 border-b border-white/10 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="text-sm divide-y divide-white/5">
                        ${allChars.map(c => `
                            <tr class="hover:bg-white/5 transition-colors">
                                <td class="p-4 font-medium text-white">
                                    ${c.first_name} ${c.last_name}
                                    <div class="text-xs text-blue-300 font-normal">@${c.discord_username}</div>
                                </td>
                                <td class="p-4">
                                    <div class="flex flex-col gap-1">
                                        <span class="text-xs uppercase px-1.5 py-0.5 rounded w-fit font-bold ${c.alignment === 'illegal' ? 'bg-red-500/20 text-red-300' : 'bg-blue-500/20 text-blue-300'}">${c.alignment || 'N/A'}</span>
                                        ${canManageJobs && c.status === 'accepted' ? `
                                            <select onchange="actions.assignJob('${c.id}', this.value)" class="text-xs bg-black/30 border border-white/10 rounded px-1 py-0.5 text-gray-300 focus:text-white mt-1" ${c.alignment === 'illegal' ? 'disabled' : ''}>
                                                <option value="unemployed" ${c.job === 'unemployed' ? 'selected' : ''}>Chômeur/Civil</option>
                                                ${c.alignment === 'legal' ? `
                                                <option value="leo" ${c.job === 'leo' ? 'selected' : ''}>Police (LEO)</option>
                                                <option value="lafd" ${c.job === 'lafd' ? 'selected' : ''}>Pompier (LAFD)</option>
                                                <option value="ladot" ${c.job === 'ladot' ? 'selected' : ''}>DOT (Dépanneur)</option>
                                                ` : ''}
                                            </select>
                                        ` : `<span class="text-xs text-gray-500 font-mono">${c.job || 'unemployed'}</span>`}
                                    </div>
                                </td>
                                <td class="p-4"><span class="px-2 py-0.5 rounded text-[10px] uppercase font-bold ${c.status === 'accepted' ? 'bg-emerald-500/20 text-emerald-400' : c.status === 'rejected' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}">${c.status}</span></td>
                                <td class="p-4 text-right flex justify-end gap-2">
                                    ${canChangeTeam ? `
                                        <button onclick="actions.adminSwitchTeam('${c.id}', '${c.alignment}')" class="text-purple-400 hover:text-purple-300 p-1 bg-purple-500/10 rounded mr-1" title="Changer Équipe"><i data-lucide="refresh-cw" class="w-4 h-4"></i></button>
                                    `: ''}
                                    ${canInventory && c.status === 'accepted' ? `
                                        <button onclick="actions.openInventoryModal('${c.id}', '${c.first_name} ${c.last_name}')" class="text-orange-400 hover:text-orange-300 p-1 bg-orange-500/10 rounded mr-1" title="Gérer Inventaire"><i data-lucide="backpack" class="w-4 h-4"></i></button>
                                    ` : ''}
                                    ${canDelete ? `
                                        <button onclick="actions.adminDeleteCharacter('${c.id}', '${c.first_name} ${c.last_name}')" class="text-gray-500 hover:text-red-400 p-1" title="Supprimer définitivement"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                                    ` : `<span class="text-gray-700 text-xs">Lecture Seule</span>`}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } else if (state.activeStaffTab === 'economy' && (hasPermission('can_manage_economy') || hasPermission('can_manage_illegal'))) {
         // ... (Economy content logic) ...
         const { totalMoney, totalCash, totalBank, totalGang, totalEnterprise } = state.serverStats;
         const bankPercent = totalMoney > 0 ? (totalBank / totalMoney) * 100 : 0;
         const cashPercent = totalMoney > 0 ? (totalCash / totalMoney) * 100 : 0;
         const gangPercent = totalMoney > 0 ? (totalGang / totalMoney) * 100 : 0;
         const entPercent = totalMoney > 0 ? (totalEnterprise / totalMoney) * 100 : 0;
         
         const subTab = state.activeEconomySubTab || 'players';
         let subContent = '';
         
         if (subTab === 'players') {
             if (!hasPermission('can_manage_economy')) {
                 subContent = `<div class="p-8 text-center text-gray-500">Accès restreint. Seuls les gestionnaires économiques peuvent voir les comptes individuels.</div>`;
             } else {
                 let allChars = state.allCharactersAdmin || [];
                 if (state.staffSearchQuery) {
                    const q = state.staffSearchQuery.toLowerCase();
                    allChars = allChars.filter(c => c.first_name.toLowerCase().includes(q) || c.last_name.toLowerCase().includes(q) || c.discord_username.toLowerCase().includes(q));
                 }
                 subContent = `
                    <div class="mb-6 flex justify-between items-center bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/10">
                        <div><h3 class="font-bold text-white">Actions Globales</h3><p class="text-xs text-gray-400">Affecte l'intégralité des comptes bancaires du serveur.</p></div>
                        <button onclick="actions.openEconomyModal('ALL')" class="glass-btn-secondary px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 cursor-pointer"><i data-lucide="globe" class="w-4 h-4"></i> Gérer tout le monde</button>
                    </div>
                    <div class="mb-4">
                        <div class="relative"><i data-lucide="search" class="w-4 h-4 absolute left-3 top-3 text-gray-500"></i><input type="text" oninput="actions.staffSearch(this.value)" value="${state.staffSearchQuery}" placeholder="Rechercher un joueur..." class="glass-input pl-10 pr-4 py-2.5 rounded-xl w-full text-sm"></div>
                    </div>
                    <div class="glass-panel overflow-hidden rounded-xl">
                         <table class="w-full text-left border-collapse">
                            <thead class="text-xs uppercase text-gray-500 tracking-wider">
                                <tr>
                                    <th class="p-4 border-b border-white/5">Citoyen</th>
                                    <th class="p-4 border-b border-white/5 text-right text-emerald-400">Banque</th>
                                    <th class="p-4 border-b border-white/5 text-right text-blue-400">Espèces</th>
                                    <th class="p-4 border-b border-white/5 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody class="text-sm divide-y divide-white/5">
                                ${allChars.filter(c => c.status === 'accepted').map(c => `
                                    <tr class="hover:bg-white/5">
                                        <td class="p-4"><div class="font-medium text-white">${c.first_name} ${c.last_name}</div><div class="text-xs text-blue-300">@${c.discord_username}</div></td>
                                        <td class="p-4 text-right font-mono">$${(c.bank_balance||0).toLocaleString()}</td>
                                        <td class="p-4 text-right font-mono">$${(c.cash_balance||0).toLocaleString()}</td>
                                        <td class="p-4 text-right"><button onclick="actions.openEconomyModal('${c.id}', '${c.first_name} ${c.last_name}')" class="glass-btn-secondary px-3 py-1 rounded text-xs hover:text-emerald-400 border-white/10"><i data-lucide="coins" class="w-3 h-3 mr-1"></i> Gérer</button></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                 `;
             }
         } else if (subTab === 'gangs') {
             subContent = `
                <div class="glass-panel overflow-hidden rounded-xl">
                    <table class="w-full text-left border-collapse">
                        <thead class="bg-white/5 text-xs uppercase text-gray-500">
                            <tr>
                                <th class="p-4">Nom du Gang</th>
                                <th class="p-4">Chef</th>
                                <th class="p-4 text-right">Coffre Fort</th>
                                <th class="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-white/5 text-sm">
                            ${state.gangs.map(g => `
                                <tr class="hover:bg-white/5">
                                    <td class="p-4 font-bold text-white">${g.name}</td>
                                    <td class="p-4 text-gray-400">${g.leader ? g.leader.first_name + ' ' + g.leader.last_name : 'N/A'}</td>
                                    <td class="p-4 text-right font-mono text-emerald-400">$${(g.balance || 0).toLocaleString()}</td>
                                    <td class="p-4 text-right flex justify-end gap-2">
                                        <button onclick="actions.adminManageGangBalance('${g.id}', 'add')" class="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded hover:bg-emerald-500/30" title="Ajouter"><i data-lucide="plus" class="w-4 h-4"></i></button>
                                        <button onclick="actions.adminManageGangBalance('${g.id}', 'remove')" class="px-2 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30" title="Retirer"><i data-lucide="minus" class="w-4 h-4"></i></button>
                                    </td>
                                </tr>
                            `).join('')}
                            ${state.gangs.length === 0 ? '<tr><td colspan="4" class="p-6 text-center text-gray-500">Aucun gang.</td></tr>' : ''}
                        </tbody>
                    </table>
                </div>
             `;
         } else if (subTab === 'enterprises') {
             subContent = `
                <div class="glass-panel overflow-hidden rounded-xl">
                    <table class="w-full text-left border-collapse">
                        <thead class="bg-white/5 text-xs uppercase text-gray-500">
                            <tr>
                                <th class="p-4">Entreprise</th>
                                <th class="p-4 text-right">Coffre</th>
                                <th class="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-white/5 text-sm">
                            ${state.enterprises.map(e => `
                                <tr class="hover:bg-white/5">
                                    <td class="p-4 font-bold text-white">${e.name}</td>
                                    <td class="p-4 text-right font-mono text-blue-400">$${(e.balance || 0).toLocaleString()}</td>
                                    <td class="p-4 text-right flex justify-end gap-2">
                                        <button onclick="actions.adminManageEnterpriseBalance('${e.id}', 'add')" class="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded hover:bg-emerald-500/30" title="Ajouter"><i data-lucide="plus" class="w-4 h-4"></i></button>
                                        <button onclick="actions.adminManageEnterpriseBalance('${e.id}', 'remove')" class="px-2 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30" title="Retirer"><i data-lucide="minus" class="w-4 h-4"></i></button>
                                    </td>
                                </tr>
                            `).join('')}
                            ${state.enterprises.length === 0 ? '<tr><td colspan="3" class="p-6 text-center text-gray-500">Aucune entreprise.</td></tr>' : ''}
                        </tbody>
                    </table>
                </div>
             `;
         } else if (subTab === 'stats') {
             // ... stats view ...
             if (!hasPermission('can_manage_economy')) {
                 subContent = `<div class="p-8 text-center text-gray-500">Accès restreint aux gestionnaires économiques.</div>`;
             } else {
                 subContent = `
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div class="glass-panel p-6 rounded-2xl lg:col-span-2">
                            <h3 class="font-bold text-white mb-4">Dernières Transactions (50)</h3>
                            <div class="overflow-y-auto max-h-[500px] custom-scrollbar">
                                <table class="w-full text-left text-xs">
                                    <thead class="text-gray-500 uppercase sticky top-0 bg-[#1e1e23] z-10">
                                        <tr>
                                            <th class="py-2">Date</th>
                                            <th class="py-2">De</th>
                                            <th class="py-2">Vers</th>
                                            <th class="py-2 text-right">Montant</th>
                                            <th class="py-2">Type</th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-white/5">
                                        ${state.globalTransactions.map(t => `
                                            <tr>
                                                <td class="py-2 text-gray-500">${new Date(t.created_at).toLocaleDateString()}</td>
                                                <td class="py-2 text-white">${t.sender ? t.sender.first_name + ' ' + t.sender.last_name : 'Système'}</td>
                                                <td class="py-2 text-white">${t.receiver ? t.receiver.first_name + ' ' + t.receiver.last_name : 'Système'}</td>
                                                <td class="py-2 text-right font-mono text-emerald-400">$${Math.abs(t.amount).toLocaleString()}</td>
                                                <td class="py-2"><span class="px-1.5 py-0.5 rounded bg-white/5 text-gray-400 uppercase text-[9px]">${t.type}</span></td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div class="glass-panel p-6 rounded-2xl h-fit">
                            <h3 class="font-bold text-white mb-4">Argent Circulé (Journalier)</h3>
                            <div class="space-y-2">
                                ${state.dailyEconomyStats.slice(0, 10).map(d => `
                                    <div class="flex justify-between items-center p-2 bg-white/5 rounded-lg border border-white/5">
                                        <span class="text-gray-400 text-xs">${d.date}</span>
                                        <span class="text-emerald-400 font-mono font-bold text-sm">$${d.amount.toLocaleString()}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                 `;
             }
         }
         content = `
            ${refreshBanner}
            <!-- Graphs Section -->
            <div class="mb-8 glass-panel p-6 rounded-2xl">
                <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2"><i data-lucide="pie-chart" class="w-5 h-5 text-emerald-400"></i> Masse Monétaire Totale: $${totalMoney.toLocaleString()}</h3>
                <div class="h-6 w-full bg-gray-800 rounded-full overflow-hidden flex mb-2">
                    <div style="width: ${bankPercent}%" class="h-full bg-emerald-500 transition-all duration-500 hover:bg-emerald-400" title="Banque: $${totalBank.toLocaleString()}"></div>
                    <div style="width: ${cashPercent}%" class="h-full bg-blue-500 transition-all duration-500 hover:bg-blue-400" title="Espèces: $${totalCash.toLocaleString()}"></div>
                    <div style="width: ${gangPercent}%" class="h-full bg-purple-500 transition-all duration-500 hover:bg-purple-400" title="Coffres Gang: $${totalGang.toLocaleString()}"></div>
                    <div style="width: ${entPercent}%" class="h-full bg-orange-500 transition-all duration-500 hover:bg-orange-400" title="Entreprises: $${(totalEnterprise || 0).toLocaleString()}"></div>
                </div>
                <div class="flex flex-wrap justify-between text-xs text-gray-400 gap-2">
                    <div class="flex items-center gap-2"><div class="w-3 h-3 bg-emerald-500 rounded-full"></div> Banque ($${totalBank.toLocaleString()})</div>
                    <div class="flex items-center gap-2"><div class="w-3 h-3 bg-blue-500 rounded-full"></div> Espèces ($${totalCash.toLocaleString()})</div>
                    <div class="flex items-center gap-2"><div class="w-3 h-3 bg-purple-500 rounded-full"></div> Gangs ($${totalGang.toLocaleString()})</div>
                    <div class="flex items-center gap-2"><div class="w-3 h-3 bg-orange-500 rounded-full"></div> Entreprises ($${(totalEnterprise || 0).toLocaleString()})</div>
                </div>
            </div>
            <!-- SUB TABS -->
            <div class="flex gap-2 mb-6 border-b border-white/10 pb-1 overflow-x-auto">
                ${hasPermission('can_manage_economy') ? `<button onclick="actions.setEconomySubTab('players')" class="px-4 py-2 text-sm font-medium transition-colors ${subTab === 'players' ? 'text-white border-b-2 border-emerald-500' : 'text-gray-500 hover:text-white'}">Joueurs</button>` : ''}
                <button onclick="actions.setEconomySubTab('gangs')" class="px-4 py-2 text-sm font-medium transition-colors ${subTab === 'gangs' ? 'text-white border-b-2 border-purple-500' : 'text-gray-500 hover:text-white'}">Gangs</button>
                <button onclick="actions.setEconomySubTab('enterprises')" class="px-4 py-2 text-sm font-medium transition-colors ${subTab === 'enterprises' ? 'text-white border-b-2 border-blue-600' : 'text-gray-500 hover:text-white'}">Entreprises</button>
                ${hasPermission('can_manage_economy') ? `<button onclick="actions.setEconomySubTab('stats')" class="px-4 py-2 text-sm font-medium transition-colors ${subTab === 'stats' ? 'text-white border-b-2 border-blue-500' : 'text-gray-500 hover:text-white'}">Transactions & Stats</button>` : ''}
            </div>
            ${subContent}
        `;
    } else if (state.activeStaffTab === 'illegal' && hasPermission('can_manage_illegal')) {
// ... rest of the file
