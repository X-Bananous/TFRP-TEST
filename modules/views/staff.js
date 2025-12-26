
import { state } from '../state.js';
import { CONFIG } from '../config.js';
import { hasPermission } from '../utils.js';
import { HEIST_DATA } from './illicit.js';

const refreshBanner = `
    <div class="flex flex-col md:flex-row items-center justify-between px-6 py-3 bg-purple-900/10 border-b border-purple-500/10 gap-3 shrink-0 z-20 relative">
        <div class="text-xs text-purple-200 flex items-center gap-2">
             <div class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </div>
            <span><span class="font-bold">Administration</span> • Panel de Gestion V4.2</span>
        </div>
        <button onclick="actions.refreshCurrentView()" id="refresh-data-btn" class="text-xs text-purple-400 hover:text-white flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap">
            <i data-lucide="refresh-cw" class="w-3 h-3"></i> Actualiser
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
                    <h2 class="text-2xl font-bold text-white mb-2">Accès Refusé</h2>
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

    // --- MODALS ---
    let economyModalHtml = '';
    if (state.economyModal.isOpen && (hasPermission('can_manage_economy') || hasPermission('can_manage_illegal'))) {
        const isGlobal = state.economyModal.targetId === 'ALL';
        economyModalHtml = `
            <div class="fixed inset-0 z-[60] flex items-center justify-center p-4">
                <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" onclick="actions.closeEconomyModal()"></div>
                <div class="glass-panel w-full max-w-4xl p-6 rounded-2xl relative z-10 animate-slide-up shadow-2xl shadow-emerald-500/10 flex flex-col md:flex-row gap-6 max-h-[90vh] overflow-hidden">
                    
                    <!-- ACTION FORM -->
                    <div class="flex-1 md:max-w-md">
                        <h3 class="text-xl font-bold text-white mb-1">Gestion Économique</h3>
                        <p class="text-xs text-emerald-400 uppercase tracking-widest mb-6">
                            ${isGlobal ? 'Action Globale (Tous les joueurs)' : state.economyModal.targetName}
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
                    </div>

                    <!-- TRANSACTION HISTORY -->
                    ${!isGlobal ? `
                        <div class="flex-1 border-l border-white/10 pl-6 flex flex-col min-h-0">
                            <h4 class="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <i data-lucide="history" class="w-4 h-4"></i> Historique (20 derniers)
                            </h4>
                            <div class="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                                ${state.economyModal.transactions.length > 0 ? state.economyModal.transactions.map(t => {
                                    const isReceiver = t.receiver_id === state.economyModal.targetId;
                                    const color = isReceiver ? 'text-emerald-400' : 'text-red-400';
                                    const sign = isReceiver ? '+' : '-';
                                    return `
                                        <div class="bg-white/5 p-3 rounded-xl border border-white/5 text-[10px]">
                                            <div class="flex justify-between font-bold mb-1">
                                                <span class="text-gray-400">${t.type.toUpperCase()}</span>
                                                <span class="${color}">${sign} $${Math.abs(t.amount).toLocaleString()}</span>
                                            </div>
                                            <div class="text-gray-500 truncate">${t.description || 'Sans motif'}</div>
                                            <div class="text-[8px] text-gray-600 mt-1">${new Date(t.created_at).toLocaleString()}</div>
                                        </div>
                                    `;
                                }).join('') : '<div class="text-center text-gray-600 py-20 italic">Aucune transaction trouvée.</div>'}
                            </div>
                        </div>
                    ` : ''}

                    <button onclick="actions.closeEconomyModal()" class="absolute top-4 right-4 text-gray-500 hover:text-white"><i data-lucide="x" class="w-5 h-5"></i></button>
                </div>
            </div>
        `;
    }

    let inventoryModalHtml = '';
    if (state.inventoryModal.isOpen && hasPermission('can_manage_inventory')) {
         inventoryModalHtml = `
             <div class="fixed inset-0 z-[60] flex items-center justify-center p-4">
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
            <div class="mb-4">
                <div class="relative">
                    <i data-lucide="search" class="w-4 h-4 absolute left-3 top-3 text-gray-500"></i>
                    <input type="text" oninput="actions.staffSearch(this.value)" value="${state.staffSearchQuery}" placeholder="Rechercher une candidature..." class="glass-input pl-10 pr-4 py-2.5 rounded-xl w-full text-sm bg-white/5 border-white/10">
                </div>
            </div>
            <div class="space-y-3">
                ${pending.length === 0 ? `<div class="p-10 text-center text-gray-500 bg-white/5 rounded-xl border border-dashed border-white/10 text-sm">Aucune demande trouvée.</div>` : ''}
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
            <div class="flex flex-col md:flex-row gap-4 mb-4">
                <div class="relative flex-1">
                    <i data-lucide="search" class="w-4 h-4 absolute left-3 top-3 text-gray-500"></i>
                    <input type="text" oninput="actions.staffSearch(this.value)" value="${state.staffSearchQuery}" placeholder="Rechercher un citoyen..." class="glass-input pl-10 pr-4 py-2.5 rounded-xl w-full text-sm bg-white/5 border-white/10">
                </div>
                <div class="flex gap-2">
                     <select onchange="actions.setAdminSort(this.value)" class="glass-input px-3 py-2.5 rounded-xl text-sm bg-black/40 border-white/10 text-gray-300">
                        <option value="name" ${sortField === 'name' ? 'selected' : ''}>Nom</option>
                        <option value="job" ${sortField === 'job' ? 'selected' : ''}>Métier</option>
                        <option value="alignment" ${sortField === 'alignment' ? 'selected' : ''}>Alignement</option>
                        <option value="status" ${sortField === 'status' ? 'selected' : ''}>Statut</option>
                    </select>
                     <button onclick="actions.toggleAdminSortDir()" class="glass-btn-secondary px-3 rounded-xl border-white/10"><i data-lucide="${sortDir === 1 ? 'arrow-down-az' : 'arrow-up-az'}" class="w-4 h-4"></i></button>
                     ${canDelete ? `
                        <button onclick="actions.openAdminCreateChar()" class="glass-btn px-4 rounded-xl text-sm font-bold bg-purple-600 hover:bg-purple-500 flex items-center gap-2 whitespace-nowrap">
                            <i data-lucide="user-plus" class="w-4 h-4"></i> Créer
                        </button>
                     ` : ''}
                </div>
            </div>
            <div class="glass-panel overflow-hidden rounded-xl border border-white/5">
                <table class="w-full text-left border-collapse">
                    <thead class="bg-white/5 text-[10px] uppercase text-gray-400 font-semibold tracking-wider">
                        <tr>
                            <th class="p-4 border-b border-white/10">Citoyen</th>
                            <th class="p-4 border-b border-white/10">Métier / Barreau</th>
                            <th class="p-4 border-b border-white/10">Permis</th>
                            <th class="p-4 border-b border-white/10">Vérifié par</th>
                            <th class="p-4 border-b border-white/10">Statut</th>
                            <th class="p-4 border-b border-white/10 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="text-sm divide-y divide-white/5">
                        ${allChars.map(c => {
                            const isEnterpriseOwner = state.enterprises?.some(e => e.leader_id === c.id);
                            const displayJob = (c.job === 'unemployed' && isEnterpriseOwner) ? 'PDG' : (c.job || 'unemployed');
                            const jobLabel = displayJob.toUpperCase();
                            const pts = (c.driver_license_points !== null && c.driver_license_points !== undefined) ? c.driver_license_points : 12;

                            return `
                            <tr class="hover:bg-white/5 transition-colors">
                                <td class="p-4 font-medium text-white">
                                    ${c.first_name} ${c.last_name}
                                    <div class="text-[10px] text-blue-300 font-normal">@${c.discord_username}</div>
                                </td>
                                <td class="p-4">
                                    <div class="flex flex-col gap-2">
                                        ${canManageJobs && c.status === 'accepted' ? `
                                            <select onchange="actions.assignJob('${c.id}', this.value)" class="text-[10px] bg-black/30 border border-white/10 rounded px-1 py-1 text-gray-300 focus:text-white uppercase font-bold">
                                                <option value="unemployed" ${c.job === 'unemployed' ? 'selected' : ''}>Chômeur / Civil</option>
                                                <optgroup label="Gouvernement">
                                                    <option value="maire" ${c.job === 'maire' ? 'selected' : ''}>Maire (Max 1)</option>
                                                    <option value="adjoint" ${c.job === 'adjoint' ? 'selected' : ''}>Adjoint (Max 2)</option>
                                                    <option value="juge" ${c.job === 'juge' ? 'selected' : ''}>Juge</option>
                                                    <option value="procureur" ${c.job === 'procureur' ? 'selected' : ''}>Procureur</option>
                                                </optgroup>
                                                <optgroup label="Services Publics">
                                                    <option value="leo" ${c.job === 'leo' ? 'selected' : ''}>Police (LEO)</option>
                                                    <option value="lafd" ${c.job === 'lafd' ? 'selected' : ''}>Pompier (LAFD)</option>
                                                    <option value="ladot" ${c.job === 'ladot' ? 'selected' : ''}>DOT (Dépanneur)</option>
                                                    <option value="lawyer" ${c.job === 'lawyer' ? 'selected' : ''}>Avocat (Barreau)</option>
                                                </optgroup>
                                                <optgroup label="Privé">
                                                    <option value="pdg" ${c.job === 'pdg' ? 'selected' : ''}>PDG</option>
                                                </optgroup>
                                            </select>
                                        ` : `<span class="text-[10px] text-gray-500 font-mono font-bold uppercase">${jobLabel}</span>`}
                                        
                                        <button onclick="actions.adminToggleBar('${c.id}', ${!!c.bar_passed})" class="w-fit text-[9px] px-2 py-0.5 rounded border transition-colors ${c.bar_passed ? 'bg-purple-600/20 text-purple-400 border-purple-500/30' : 'bg-gray-800 text-gray-500 border-white/5'} font-black uppercase tracking-widest">
                                            <i data-lucide="scale" class="w-3 h-3 inline mr-1"></i> Barreau: ${c.bar_passed ? 'OUI' : 'NON'}
                                        </button>
                                    </div>
                                </td>
                                <td class="p-4">
                                    <div class="flex items-center gap-2">
                                        <input type="number" value="${pts}" min="0" max="12" 
                                            onchange="actions.adminUpdateLicensePoints('${c.id}', this.value)"
                                            class="w-12 bg-black/40 border border-white/10 rounded px-1.5 py-1 text-center font-mono font-bold text-xs text-white">
                                        <span class="text-gray-500 font-mono text-[10px]">/ 12</span>
                                    </div>
                                </td>
                                <td class="p-4">
                                    ${c.verified_by_name ? `
                                        <div class="flex items-center gap-2 text-[10px] text-gray-400">
                                            <div class="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                                            <span class="font-bold">${c.verified_by_name}</span>
                                        </div>
                                    ` : '<span class="text-gray-600 text-[10px] italic">Système</span>'}
                                </td>
                                <td class="p-4"><span class="px-2 py-0.5 rounded text-[10px] uppercase font-bold ${c.status === 'accepted' ? 'bg-emerald-500/20 text-emerald-400' : c.status === 'rejected' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}">${c.status}</span></td>
                                <td class="p-4 text-right flex justify-end gap-2">
                                    ${canDelete ? `
                                        <button onclick="actions.openAdminEditChar('${c.id}')" class="text-blue-400 hover:text-blue-300 p-1.5 bg-blue-500/10 rounded-lg transition-colors" title="Modifier"><i data-lucide="edit" class="w-4 h-4"></i></button>
                                    ` : ''}
                                    ${canChangeTeam ? `
                                        <button onclick="actions.adminSwitchTeam('${c.id}', '${c.alignment}')" class="text-purple-400 hover:text-purple-300 p-1.5 bg-purple-500/10 rounded-lg transition-colors" title="Changer Équipe"><i data-lucide="refresh-cw" class="w-4 h-4"></i></button>
                                    `: ''}
                                    ${canInventory && c.status === 'accepted' ? `
                                        <button onclick="actions.openInventoryModal('${c.id}', '${c.first_name} ${c.last_name}')" class="text-orange-400 hover:text-orange-300 p-1.5 bg-orange-500/10 rounded-lg transition-colors" title="Gérer Inventaire"><i data-lucide="backpack" class="w-4 h-4"></i></button>
                                    ` : ''}
                                    ${canDelete ? `
                                        <button onclick="actions.adminDeleteCharacter('${c.id}', '${c.first_name} ${c.last_name}')" class="text-gray-600 hover:text-red-400 p-1.5 transition-colors" title="Supprimer"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                                    ` : ''}
                                </td>
                            </tr>
                        `}).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } else if (state.activeStaffTab === 'economy' && (hasPermission('can_manage_economy') || hasPermission('can_manage_illegal'))) {
         const { totalMoney, totalCash, totalBank, totalBank: tBankValue, totalCash: tCashValue, totalGang, totalEnterprise } = state.serverStats;
         const totalBankVal = totalBank || 0;
         const totalCashVal = totalCash || 0;
         const totalGangVal = totalGang || 0;
         const totalEnterpriseVal = totalEnterprise || 0;
         const totalMoneyVal = totalBankVal + totalCashVal + totalGangVal + totalEnterpriseVal;

         const bankPercent = totalMoneyVal > 0 ? (totalBankVal / totalMoneyVal) * 100 : 0;
         const cashPercent = totalMoneyVal > 0 ? (totalCashVal / totalMoneyVal) * 100 : 0;
         const gangPercent = totalMoneyVal > 0 ? (totalGangVal / totalMoneyVal) * 100 : 0;
         const entPercent = totalMoneyVal > 0 ? (totalEnterpriseVal / totalMoneyVal) * 100 : 0;

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
                        <div class="relative"><i data-lucide="search" class="w-4 h-4 absolute left-3 top-3 text-gray-500"></i><input type="text" oninput="actions.staffSearch(this.value)" value="${state.staffSearchQuery}" placeholder="Rechercher un joueur..." class="glass-input pl-10 pr-4 py-2.5 rounded-xl w-full text-sm bg-white/5 border-white/10"></div>
                    </div>
                    <div class="glass-panel overflow-hidden rounded-xl border border-white/5">
                         <table class="w-full text-left border-collapse">
                            <thead class="text-xs uppercase text-gray-500 tracking-wider bg-white/5">
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
                <div class="glass-panel overflow-hidden rounded-xl border border-white/5">
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
                <div class="glass-panel overflow-hidden rounded-xl border border-white/5">
                    <table class="w-full text-left border-collapse">
                        <thead class="bg-white/5 text-xs uppercase text-gray-500">
                            <tr>
                                <th class="p-4">Nom de l'Entreprise</th>
                                <th class="p-4">PDG</th>
                                <th class="p-4 text-right">Coffre Fort</th>
                                <th class="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-white/5 text-sm">
                            ${state.enterprises.map(e => `
                                <tr class="hover:bg-white/5">
                                    <td class="p-4 font-bold text-white">${e.name}</td>
                                    <td class="p-4 text-gray-400">${e.leader ? e.leader.first_name + ' ' + e.leader.last_name : 'N/A'}</td>
                                    <td class="p-4 text-right font-mono text-blue-400">$${(e.balance || 0).toLocaleString()}</td>
                                    <td class="p-4 text-right flex justify-end gap-2">
                                        <button onclick="actions.adminManageEnterpriseBalance('${e.id}', 'add')" class="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded hover:bg-emerald-500/30" title="Ajouter"><i data-lucide="plus" class="w-4 h-4"></i></button>
                                        <button onclick="actions.adminManageEnterpriseBalance('${e.id}', 'remove')" class="px-2 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30" title="Retirer"><i data-lucide="minus" class="w-4 h-4"></i></button>
                                    </td>
                                </tr>
                            `).join('')}
                            ${state.enterprises.length === 0 ? '<tr><td colspan="4" class="p-6 text-center text-gray-500">Aucune entreprise.</td></tr>' : ''}
                        </tbody>
                    </table>
                </div>
             `;
         } else if (subTab === 'stats') {
             if (!hasPermission('can_manage_economy')) {
                 subContent = `<div class="p-8 text-center text-gray-500">Accès restreint aux gestionnaires économiques.</div>`;
             } else {
                 subContent = `
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div class="glass-panel p-6 rounded-2xl lg:col-span-2 border border-white/5">
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
                        <div class="glass-panel p-6 rounded-2xl h-fit border border-white/5">
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
            <!-- Graphs Section -->
            <div class="mb-8 glass-panel p-6 rounded-2xl border border-white/5">
                <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2"><i data-lucide="pie-chart" class="w-5 h-5 text-emerald-400"></i> Masse Monétaire Totale: $${totalMoneyVal.toLocaleString()}</h3>
                <div class="h-6 w-full bg-gray-800 rounded-full overflow-hidden flex mb-2">
                    <div style="width: ${bankPercent}%" class="h-full bg-emerald-500 transition-all duration-500 hover:bg-emerald-400" title="Banque: $${totalBankVal.toLocaleString()}"></div>
                    <div style="width: ${cashPercent}%" class="h-full bg-blue-500 transition-all duration-500 hover:bg-blue-400" title="Espèces: $${totalCashVal.toLocaleString()}"></div>
                    <div style="width: ${gangPercent}%" class="h-full bg-purple-500 transition-all duration-500 hover:bg-purple-400" title="Coffres Gang: $${totalGangVal.toLocaleString()}"></div>
                    <div style="width: ${entPercent}%" class="h-full bg-indigo-600 transition-all duration-500 hover:bg-indigo-500" title="Entreprises: $${totalEnterpriseVal.toLocaleString()}"></div>
                </div>
                <div class="flex justify-between text-xs text-gray-400 flex-wrap gap-2">
                    <div class="flex items-center gap-2"><div class="w-3 h-3 bg-emerald-500 rounded-full"></div> Banque ($${totalBankVal.toLocaleString()})</div>
                    <div class="flex items-center gap-2"><div class="w-3 h-3 bg-blue-500 rounded-full"></div> Espèces ($${totalCashVal.toLocaleString()})</div>
                    <div class="flex items-center gap-2"><div class="w-3 h-3 bg-purple-500 rounded-full"></div> Gangs ($${totalGangVal.toLocaleString()})</div>
                    <div class="flex items-center gap-2"><div class="w-3 h-3 bg-indigo-600 rounded-full"></div> Entreprises ($${totalEnterpriseVal.toLocaleString()})</div>
                </div>
            </div>
            <!-- SUB TABS -->
            <div class="flex gap-2 mb-6 border-b border-white/10 pb-1 overflow-x-auto">
                ${hasPermission('can_manage_economy') ? `<button onclick="actions.setEconomySubTab('players')" class="px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${subTab === 'players' ? 'text-white border-b-2 border-emerald-500' : 'text-gray-500 hover:text-white'}">Joueurs</button>` : ''}
                <button onclick="actions.setEconomySubTab('gangs')" class="px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${subTab === 'gangs' ? 'text-white border-b-2 border-purple-500' : 'text-gray-500 hover:text-white'}">Gangs</button>
                <button onclick="actions.setEconomySubTab('enterprises')" class="px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${subTab === 'enterprises' ? 'text-white border-b-2 border-indigo-500' : 'text-gray-500 hover:text-white'}">Entreprises</button>
                ${hasPermission('can_manage_economy') ? `<button onclick="actions.setEconomySubTab('stats')" class="px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${subTab === 'stats' ? 'text-white border-b-2 border-blue-500' : 'text-gray-500 hover:text-white'}">Transactions & Stats</button>` : ''}
            </div>
            ${subContent}
        `;
    } else if (state.activeStaffTab === 'illegal' && hasPermission('can_manage_illegal')) {
        const { totalCoke, totalWeed } = state.serverStats;
        const totalDrugs = (totalCoke || 0) + (totalWeed || 0);
        const cokePercent = totalDrugs > 0 ? ((totalCoke || 0) / totalDrugs) * 100 : 0;
        const weedPercent = totalDrugs > 0 ? ((totalWeed || 0) / totalDrugs) * 100 : 0;
        const pendingHeists = state.pendingHeistReviews || [];

        const searchUI = (role) => `
            <div class="relative">
                <input type="text" placeholder="Rechercher ${role}..." 
                    id="gang-${role === 'Leader' ? 'leader' : 'coleader'}-search"
                    value="${role === 'Leader' ? (state.gangCreation.leaderResult ? state.gangCreation.leaderResult.name : state.gangCreation.leaderQuery) : (state.gangCreation.coLeaderResult ? state.gangCreation.coLeaderResult.name : state.gangCreation.coLeaderQuery)}"
                    oninput="actions.searchGangSearch('${role}', this.value)"
                    class="glass-input w-full p-2 pl-8 rounded-lg text-sm bg-black/40 ${role === 'Leader' && state.gangCreation.leaderResult ? 'border-green-500 text-green-400' : ''}" required autocomplete="off">
                <i data-lucide="search" class="w-3 h-3 absolute left-3 top-3 text-gray-500"></i>
                
                <div id="gang-${role === 'Leader' ? 'leader' : 'coleader'}-dropdown" class="absolute top-full left-0 right-0 bg-[#151515] border border-white/10 rounded-lg mt-1 z-50 max-h-32 overflow-y-auto shadow-xl hidden">
                </div>
            </div>
        `;
        
        const gangForm = `
             <div class="glass-panel p-6 rounded-2xl mb-8 border ${state.editingGang ? 'border-purple-500/50' : 'border-white/5'}">
                <h3 class="text-lg font-bold text-white mb-2 flex items-center gap-2">
                    <i data-lucide="${state.editingGang ? 'edit' : 'users'}" class="w-5 h-5 text-purple-400"></i> 
                    ${state.editingGang ? 'Modifier Gang: ' + state.editingGang.name : 'Création de Gang'}
                </h3>
                <form onsubmit="${state.editingGang ? 'actions.submitEditGang(event)' : 'actions.createGangAdmin(event)'}" class="space-y-3">
                    <input type="text" name="name" 
                        value="${state.editingGang ? state.editingGang.name : state.gangCreation.draftName}" 
                        oninput="actions.updateGangDraftName(this.value)"
                        placeholder="Nom du Gang" class="glass-input w-full p-2 rounded-lg text-sm bg-black/40" required>
                    <div class="grid grid-cols-2 gap-2">
                         ${searchUI('Leader')}
                         ${searchUI('Co-Leader')}
                    </div>
                    <div class="flex gap-2">
                        ${state.editingGang ? `<button type="button" onclick="actions.cancelEditGang()" class="glass-btn-secondary px-4 py-2 rounded-lg text-sm">Annuler</button>` : ''}
                        <button type="submit" class="glass-btn flex-1 py-2 rounded-lg font-bold text-sm bg-purple-600 hover:bg-purple-500">
                            ${state.editingGang ? 'Enregistrer Modifications' : 'Créer Gang'}
                        </button>
                    </div>
                </form>
             </div>
        `;

        content = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                 <div class="glass-panel p-6 rounded-2xl border border-white/5">
                    <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2"><i data-lucide="flask-conical" class="w-5 h-5 text-indigo-400"></i> Drogue en Circulation: ${totalDrugs}g</h3>
                    <div class="h-6 w-full bg-gray-800 rounded-full overflow-hidden flex mb-2">
                        <div style="width: ${cokePercent}%" class="h-full bg-white transition-all duration-500" title="Coke: ${totalCoke}g"></div>
                        <div style="width: ${weedPercent}%" class="h-full bg-emerald-500 transition-all duration-500" title="Weed: ${totalWeed}g"></div>
                    </div>
                    <div class="flex justify-between text-xs text-gray-400">
                        <div class="flex items-center gap-2"><div class="w-3 h-3 bg-white rounded-full"></div> Cocaïne (${totalCoke}g)</div>
                        <div class="flex items-center gap-2"><div class="w-3 h-3 bg-emerald-500 rounded-full"></div> Cannabis (${totalWeed}g)</div>
                    </div>
                 </div>
                 ${gangForm}
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div class="glass-panel rounded-2xl p-6 h-[300px] flex flex-col border border-white/5">
                    <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2"><i data-lucide="list" class="w-5 h-5 text-gray-400"></i> Gangs Actifs</h3>
                    <div class="flex-1 overflow-y-auto custom-scrollbar space-y-2">
                        ${state.gangs.map(g => `
                            <div class="bg-white/5 p-3 rounded-lg border border-white/5 flex justify-between items-center">
                                <div>
                                    <div class="font-bold text-white text-sm">${g.name}</div>
                                    <div class="text-xs text-gray-500">Chef: ${g.leader?.first_name} ${g.leader?.last_name}</div>
                                </div>
                                <div class="flex gap-1">
                                    <button onclick="actions.openEditGang('${g.id}')" class="text-blue-400 hover:text-white p-1 bg-blue-500/10 rounded"><i data-lucide="edit-2" class="w-4 h-4"></i></button>
                                    <button onclick="actions.deleteGang('${g.id}')" class="text-red-400 hover:text-white p-1 bg-red-500/10 rounded"><i data-lucide="trash" class="w-4 h-4"></i></button>
                                </div>
                            </div>
                        `).join('')}
                        ${state.gangs.length === 0 ? '<div class="text-gray-500 text-xs text-center py-4">Aucun gang.</div>' : ''}
                    </div>
                </div>

                <div class="glass-panel rounded-2xl p-6 h-[300px] flex flex-col border border-white/5">
                    <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2"><i data-lucide="shield-alert" class="w-5 h-5 text-red-400"></i> Braquages (Validation)</h3>
                    <div class="flex-1 overflow-y-auto custom-scrollbar">
                        ${pendingHeists.length === 0 ? '<div class="text-center text-gray-500 py-6 italic text-sm">Aucune opération en attente.</div>' : `
                            <div class="space-y-4">
                                ${pendingHeists.map(lobby => {
                                    const hInfo = HEIST_DATA.find(h => h.id === lobby.heist_type);
                                    const heistName = hInfo ? hInfo.name : lobby.heist_type;

                                    return `
                                        <div class="bg-white/5 p-3 rounded-xl border border-white/5">
                                            <div class="font-bold text-white text-sm flex items-center justify-between">
                                                ${heistName}
                                                <span class="text-[9px] ${lobby.status === 'active' ? 'bg-orange-500/20 text-orange-400' : 'bg-purple-500/20 text-purple-400'} px-2 py-0.5 rounded uppercase">${lobby.status === 'active' ? 'En Cours' : 'Terminé'}</span>
                                            </div>
                                            <div class="text-xs text-gray-400 mt-1">Chef: <span class="text-white">${lobby.characters?.first_name} ${lobby.characters?.last_name}</span></div>
                                            ${lobby.location ? `<div class="text-xs text-orange-300 mt-1 flex items-center gap-1"><i data-lucide="map-pin" class="w-3 h-3"></i> ${lobby.location}</div>` : ''}
                                            
                                            <div class="flex gap-2 mt-3">
                                                ${lobby.status === 'active' ? `
                                                     <div class="w-full text-center text-xs text-gray-500 py-1 bg-black/20 rounded">En Cours...</div>
                                                ` : `
                                                    <button onclick="actions.validateHeist('${lobby.id}', true)" class="flex-1 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 py-1 rounded text-xs font-bold border border-emerald-600/30">Succès</button>
                                                    <button onclick="actions.validateHeist('${lobby.id}', false)" class="flex-1 bg-red-600/20 hover:bg-red-600/40 text-red-400 py-1 rounded text-xs font-bold border border-red-600/30">Échec</button>
                                                `}
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        `}
                    </div>
                </div>
            </div>
        `;

    } else if (state.activeStaffTab === 'enterprise' && hasPermission('can_manage_enterprises')) {
        const isEditing = !!state.editingEnterprise;
        const entForm = `
            <div class="glass-panel p-6 rounded-2xl border ${isEditing ? 'border-blue-500/50 shadow-blue-500/10' : 'border-white/5'}">
                <h3 class="font-bold text-white mb-4 flex items-center gap-2">
                    <i data-lucide="${isEditing ? 'edit' : 'building-2'}" class="w-5 h-5 text-blue-400"></i> 
                    ${isEditing ? 'Éditer Entreprise' : 'Créer Entreprise'}
                </h3>
                <form onsubmit="actions.adminCreateEnterprise(event)" class="space-y-4">
                    <input type="text" name="name" 
                        value="${state.enterpriseCreation.draftName}"
                        oninput="actions.updateEnterpriseDraftName(this.value)"
                        placeholder="Nom de l'entreprise" class="glass-input w-full p-2 rounded-lg bg-black/40" required>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="relative">
                            <label class="text-[10px] text-gray-500 uppercase font-bold ml-1 mb-1 block">PDG / Leader</label>
                            <input type="text" id="ent-leader-search" 
                                placeholder="Rechercher leader..." 
                                value="${state.enterpriseCreation.leaderQuery}"
                                oninput="actions.searchEnterpriseLeader('Leader', this.value)"
                                class="glass-input w-full p-2 pl-8 rounded-lg text-sm bg-black/40 ${state.enterpriseCreation.leaderResult ? 'border-blue-500/50 text-blue-400' : ''}" 
                                autocomplete="off">
                            <i data-lucide="user" class="w-3 h-3 absolute left-3 top-8.5 text-gray-500"></i>
                            <div id="ent-leader-dropdown" class="absolute top-full left-0 right-0 bg-[#151515] border border-white/10 rounded-lg mt-1 max-h-32 overflow-y-auto z-50 shadow-xl hidden"></div>
                        </div>
                        
                        <div class="relative">
                            <label class="text-[10px] text-gray-500 uppercase font-bold ml-1 mb-1 block">Co-PDG / Co-Leader</label>
                            <input type="text" id="ent-coleader-search" 
                                placeholder="Optionnel..." 
                                value="${state.enterpriseCreation.coLeaderQuery}"
                                oninput="actions.searchEnterpriseLeader('Co-Leader', this.value)"
                                class="glass-input w-full p-2 pl-8 rounded-lg text-sm bg-black/40 ${state.enterpriseCreation.coLeaderResult ? 'border-purple-500/50 text-purple-400' : ''}" 
                                autocomplete="off">
                            <i data-lucide="users" class="w-3 h-3 absolute left-3 top-8.5 text-gray-500"></i>
                            <div id="ent-coleader-dropdown" class="absolute top-full left-0 right-0 bg-[#151515] border border-white/10 rounded-lg mt-1 max-h-32 overflow-y-auto z-50 shadow-xl hidden"></div>
                        </div>
                    </div>

                    <div class="flex gap-2">
                        ${isEditing ? `<button type="button" onclick="actions.cancelEditEnterprise()" class="glass-btn-secondary px-4 py-2 rounded-lg text-xs">Annuler</button>` : ''}
                        <button type="submit" class="glass-btn flex-1 py-2 rounded-lg font-bold bg-blue-600 hover:bg-blue-500 text-xs shadow-lg shadow-blue-900/20">
                            ${isEditing ? 'Enregistrer les modifications' : 'Créer Entreprise'}
                        </button>
                    </div>
                </form>
            </div>
        `;

        content = `
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full min-h-0">
                <div class="flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2">
                    ${entForm}

                    <div class="glass-panel p-6 rounded-2xl border border-white/5">
                        <h3 class="font-bold text-white mb-4">Liste des Entreprises</h3>
                        <div class="space-y-2">
                            ${state.enterprises.map(e => `
                                <div class="bg-white/5 p-4 rounded-xl flex justify-between items-center border border-white/5 group hover:bg-white/10 transition-all">
                                    <div class="min-w-0">
                                        <div class="font-bold text-white mb-0.5 truncate">${e.name}</div>
                                        <div class="flex items-center gap-2 text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                                            <span>PDG: <span class="text-blue-400">${e.leader ? e.leader.first_name : 'N/A'}</span></span>
                                            ${e.coleader ? `<span>•</span> <span>CO: <span class="text-purple-400">${e.coleader.first_name}</span></span>` : ''}
                                        </div>
                                    </div>
                                    <div class="flex gap-1 shrink-0 ml-4">
                                        <button onclick="actions.openAdminEditEnterprise('${e.id}')" class="text-blue-400 hover:text-white p-2 bg-blue-500/10 rounded-lg border border-blue-500/20 transition-all" title="Modifier"><i data-lucide="edit" class="w-4 h-4"></i></button>
                                        <button onclick="actions.adminDeleteEnterprise('${e.id}')" class="text-red-400 hover:text-white p-2 bg-red-500/10 rounded-lg border border-red-500/20 transition-all" title="Dissoudre"><i data-lucide="trash" class="w-4 h-4"></i></button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <div class="flex flex-col h-full min-h-0">
                    <div class="glass-panel p-6 rounded-2xl flex flex-col h-full border border-white/5 overflow-hidden">
                        <h3 class="font-bold text-white mb-4 flex items-center gap-2">
                            <i data-lucide="check-square" class="w-5 h-5 text-orange-400"></i> 
                            Modération Articles (${state.pendingEnterpriseItems.length})
                        </h3>
                        <div class="flex-1 overflow-y-auto custom-scrollbar space-y-3">
                            ${state.pendingEnterpriseItems.length === 0 ? '<div class="text-center text-gray-500 italic py-10">Aucun article en attente.</div>' : 
                                state.pendingEnterpriseItems.map(item => `
                                    <div class="bg-white/5 p-4 rounded-xl border border-white/5">
                                        <div class="flex justify-between items-start mb-2">
                                            <div class="font-bold text-white text-lg">${item.name}</div>
                                            <div class="text-xs text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">${item.enterprises?.name}</div>
                                        </div>
                                        <div class="text-sm text-gray-400 mb-3">${item.description || 'Aucune description'}</div>
                                        <div class="flex justify-between items-center text-xs mb-4 font-mono">
                                            <span class="text-emerald-400 font-bold">$${item.price.toLocaleString()}</span>
                                            <span class="text-gray-500">Qté: ${item.quantity}</span>
                                        </div>
                                        <div class="flex gap-2">
                                            <button onclick="actions.adminModerateItem('${item.id}', 'approve')" class="flex-1 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 py-2 rounded-xl font-bold border border-emerald-600/30">Approuver</button>
                                            <button onclick="actions.adminModerateItem('${item.id}', 'reject')" class="flex-1 bg-red-600/20 hover:bg-red-600/40 text-red-400 py-2 rounded-xl font-bold border border-red-600/30">Refuser</button>
                                        </div>
                                    </div>
                                `).join('')
                            }
                        </div>
                    </div>
                </div>
            </div>
        `;

    } else if (state.activeStaffTab === 'permissions' && hasPermission('can_manage_staff')) {
        content = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                <div class="space-y-4">
                    <div class="glass-panel p-6 rounded-xl relative min-h-[300px] border border-white/5">
                        <h3 class="font-bold text-white mb-4">Gérer les permissions</h3>
                        <p class="text-xs text-gray-400 mb-4">Recherchez un utilisateur Discord pour lui attribuer des droits.</p>
                        <div class="relative mb-4">
                            <i data-lucide="search" class="w-4 h-4 absolute left-3 top-3.5 text-gray-500"></i>
                            <input type="text" placeholder="Pseudo Discord ou ID..." oninput="actions.searchProfilesForPerms(this.value)" class="glass-input p-3 pl-10 rounded-lg w-full text-sm placeholder-gray-500 bg-black/40" autocomplete="off">
                            <div id="perm-search-dropdown" class="absolute top-full left-0 right-0 bg-[#151515] border border-white/10 rounded-xl mt-1 max-h-48 overflow-y-auto z-50 shadow-2xl custom-scrollbar hidden"></div>
                        </div>
                        <div id="perm-editor-container">
                            <div class="text-center text-gray-600 py-10 text-sm">Sélectionnez un utilisateur pour modifier ses droits.</div>
                        </div>
                    </div>
                </div>
                <div class="glass-panel p-6 rounded-xl h-fit border border-white/5">
                    <h3 class="font-bold text-white mb-4 flex items-center gap-2"><i data-lucide="shield" class="w-4 h-4 text-purple-400"></i> Équipe Staff Actuelle</h3>
                    <div class="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar">
                        ${state.staffMembers.map(m => {
                            const perms = m.permissions || {};
                            const permKeys = Object.keys(perms).filter(k => perms[k] === true);
                            const permMap = {
                                can_approve_characters: 'WL',
                                can_manage_characters: 'Joueurs',
                                can_manage_economy: 'Éco',
                                can_manage_illegal: 'Illégal',
                                can_manage_enterprises: 'Ent.',
                                can_manage_staff: 'Staff',
                                can_manage_inventory: 'Inv.',
                                can_change_team: 'Team',
                                can_go_onduty: 'Service',
                                can_manage_jobs: 'Jobs',
                                can_bypass_login: 'Bypass',
                                can_launch_session: 'Sess',
                                can_execute_commands: 'Cmds'
                            };

                            return `
                                <button onclick="actions.selectUserForPerms('${m.id}')" class="w-full text-left p-3 rounded-lg bg-white/5 hover:bg-white/10 flex items-center gap-3 transition-colors border border-white/5 group">
                                    <img src="${m.avatar_url || ''}" class="w-10 h-10 rounded-full border border-white/10 group-hover:border-purple-500/50 transition-colors">
                                    <div class="flex-1 min-w-0">
                                        <div class="font-bold text-white text-sm truncate">${m.username}</div>
                                        <div class="flex flex-wrap gap-1 mt-1">
                                            ${permKeys.length > 0 ? permKeys.map(pk => `
                                                <span class="text-[8px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold uppercase border border-purple-500/30">${permMap[pk] || pk}</span>
                                            `).join('') : '<span class="text-[8px] text-gray-600 italic">Aucune perm</span>'}
                                        </div>
                                    </div>
                                </button>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;
        setTimeout(() => {
             if(state.activePermissionUserId) {
                 actions.selectUserForPerms(state.activePermissionUserId);
             }
        }, 0);

    } else if (state.activeStaffTab === 'sessions') {
        content = `
            <div class="glass-panel p-6 rounded-2xl mb-6 border border-white/5">
                <div class="flex justify-between items-center mb-6">
                    <div>
                        <h3 class="font-bold text-white flex items-center gap-2">
                            <i data-lucide="server" class="w-5 h-5 text-blue-400"></i>
                            État de la Session
                        </h3>
                        <p class="text-xs text-gray-400">Contrôle l'accès aux services publics et au marché noir.</p>
                    </div>
                    <button onclick="actions.toggleSession()" class="glass-btn px-6 py-3 rounded-xl font-bold flex items-center gap-2 ${state.activeGameSession ? 'bg-red-600 hover:bg-red-500' : 'bg-green-600 hover:bg-green-500'}">
                        <i data-lucide="${state.activeGameSession ? 'stop-circle' : 'play-circle'}" class="w-5 h-5"></i>
                        ${state.activeGameSession ? 'Arrêter Session' : 'Lancer Session'}
                    </button>
                </div>

                ${state.activeGameSession ? `
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div class="bg-white/5 p-4 rounded-xl border border-white/5">
                            <div class="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Durée</div>
                            <div class="text-xl font-mono font-bold text-white">${Math.floor((Date.now() - new Date(state.activeGameSession.start_time).getTime())/60000)} min</div>
                        </div>
                        <div class="bg-white/5 p-4 rounded-xl border border-white/5">
                            <div class="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Joueurs ERLC</div>
                            <div class="text-xl font-mono font-bold text-blue-400">${state.erlcData.currentPlayers}/${state.erlcData.maxPlayers}</div>
                        </div>
                        <div class="bg-white/5 p-4 rounded-xl border border-white/5">
                            <div class="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Staff en Service</div>
                            <div class="text-xl font-mono font-bold text-purple-400">${state.onDutyStaff.length}</div>
                        </div>
                        <div class="bg-white/5 p-4 rounded-xl border border-white/5">
                            <div class="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Code Serveur</div>
                            <div class="text-xl font-mono font-bold text-emerald-400 select-all">${state.erlcData.joinKey}</div>
                        </div>
                    </div>
                ` : ''}

                <h4 class="font-bold text-white mb-4 text-sm uppercase tracking-wide opacity-80">Historique Récent</h4>
                <div class="overflow-x-auto">
                    <table class="w-full text-left text-sm border-collapse">
                        <thead class="bg-white/5 text-gray-500 uppercase text-xs">
                            <tr>
                                <th class="p-3">Hôte</th>
                                <th class="p-3">Date</th>
                                <th class="p-3">Durée</th>
                                <th class="p-3 text-center">Pic Joueurs</th>
                                <th class="p-3 text-right">Statut</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-white/5">
                            ${state.sessionHistory.map(s => {
                                const duration = s.end_time ? Math.floor((new Date(s.end_time) - new Date(s.start_time)) / 60000) + ' min' : 'En cours';
                                return `
                                    <tr class="hover:bg-white/5">
                                        <td class="p-3 font-medium text-white">${s.host?.username || 'Système'}</td>
                                        <td class="p-3 text-gray-400">${new Date(s.start_time).toLocaleDateString()}</td>
                                        <td class="p-3 font-mono text-gray-300">${duration}</td>
                                        <td class="p-3 text-center">${s.peak_player_count || '-'}</td>
                                        <td class="p-3 text-right"><span class="px-2 py-0.5 rounded text-[10px] uppercase font-bold ${s.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'}">${s.status}</span></td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    } else if (state.activeStaffTab === 'logs' && hasPermission('can_execute_commands')) {
        const subTab = state.activeStaffLogTab || 'commands';
        const q = state.erlcLogSearch ? state.erlcLogSearch.toLowerCase() : '';
        
        let tableContent = '';
        let headers = '';

        if (subTab === 'commands') {
            headers = '<tr><th class="p-4">Staff</th><th class="p-4">Commande</th><th class="p-4 text-right">Heure</th></tr>';
            let logs = state.erlcData.commandLogs || [];
            if (q) logs = logs.filter(l => l.Command.toLowerCase().includes(q) || l.Player.toLowerCase().includes(q));
            
            tableContent = logs.length > 0 ? logs.map(l => `
                <tr class="hover:bg-white/5 transition-colors font-mono text-xs">
                    <td class="p-4 text-blue-300 font-bold">${l.Player}</td>
                    <td class="p-4 text-gray-300">${l.Command}</td>
                    <td class="p-4 text-right text-gray-500">${new Date(l.Timestamp * 1000).toLocaleTimeString()}</td>
                </tr>
            `).join('') : '<tr><td colspan="3" class="p-10 text-center text-gray-500 italic">Aucun log.</td></tr>';
        
        } else if (subTab === 'kills') {
            headers = '<tr><th class="p-4">Tueur</th><th class="p-4">Victime</th><th class="p-4">Arme</th><th class="p-4 text-right">Heure</th></tr>';
            let logs = state.erlcData.killLogs || [];
            if (q) logs = logs.filter(l => l.Killer.toLowerCase().includes(q) || l.Victim.toLowerCase().includes(q));
            
            tableContent = logs.length > 0 ? logs.map(l => `
                <tr class="hover:bg-white/5 transition-colors font-mono text-xs">
                    <td class="p-4 text-red-400 font-bold">${l.Killer}</td>
                    <td class="p-4 text-gray-300">${l.Victim}</td>
                    <td class="p-4 text-gray-400">${l.Weapon || 'Inconnu'}</td>
                    <td class="p-4 text-right text-gray-500">${new Date(l.Timestamp * 1000).toLocaleTimeString()}</td>
                </tr>
            `).join('') : '<tr><td colspan="4" class="p-10 text-center text-gray-500 italic">Aucun kill récent.</td></tr>';

        } else if (subTab === 'modcalls') {
            headers = '<tr><th class="p-4">Joueur</th><th class="p-4">Raison</th><th class="p-4 text-right">Heure</th></tr>';
            let logs = state.erlcData.modCalls || [];
            if (q) logs = logs.filter(l => l.Caller.toLowerCase().includes(q));
            
            tableContent = logs.length > 0 ? logs.map(l => `
                <tr class="hover:bg-white/5 transition-colors font-mono text-xs">
                    <td class="p-4 text-orange-300 font-bold">${l.Caller}</td>
                    <td class="p-4 text-gray-300">${l.Reason}</td>
                    <td class="p-4 text-right text-gray-500">${new Date(l.Timestamp * 1000).toLocaleTimeString()}</td>
                </tr>
            `).join('') : '<tr><td colspan="3" class="p-10 text-center text-gray-500 italic">Aucun appel modérateur.</td></tr>';

        } else if (subTab === 'players') {
            headers = '<tr><th class="p-4">Pseudo</th><th class="p-4">Team</th><th class="p-4 text-right">Permission</th></tr>';
            let list = state.erlcData.players || [];
            if (q) list = list.filter(p => p.Name.toLowerCase().includes(q));
            
            tableContent = list.length > 0 ? list.map(p => `
                <tr class="hover:bg-white/5 transition-colors font-mono text-xs">
                    <td class="p-4 text-white font-bold">${p.Name}</td>
                    <td class="p-4 text-gray-300">${p.Team}</td>
                    <td class="p-4 text-right text-gray-500">${p.Permission}</td>
                </tr>
            `).join('') : '<tr><td colspan="3" class="p-10 text-center text-gray-500 italic">Aucun joueur en ligne.</td></tr>';

        } else if (subTab === 'vehicles') {
            headers = '<tr><th class="p-4">Propriétaire</th><th class="p-4">Véhicule</th><th class="p-4 text-right">Texture</th></tr>';
            let list = state.erlcData.vehicles || [];
            if (q) list = list.filter(v => v.Owner.toLowerCase().includes(q) || v.Name.toLowerCase().includes(q));
            
            tableContent = list.length > 0 ? list.map(v => `
                <tr class="hover:bg-white/5 transition-colors font-mono text-xs">
                    <td class="p-4 text-blue-300 font-bold">${v.Owner}</td>
                    <td class="p-4 text-gray-300">${v.Name}</td>
                    <td class="p-4 text-right text-gray-500">${v.Texture}</td>
                </tr>
            `).join('') : '<tr><td colspan="3" class="p-10 text-center text-gray-500 italic">Aucun véhicule.</td></tr>';
        }

        content = `
            <div class="flex flex-col h-full overflow-hidden">
                <div class="flex gap-2 mb-4 overflow-x-auto custom-scrollbar pb-2 shrink-0">
                    <button onclick="actions.setStaffLogTab('commands')" class="px-4 py-2 rounded-xl text-xs font-bold transition-all border whitespace-nowrap ${subTab === 'commands' ? 'bg-purple-600 text-white border-purple-500' : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10'}">Commandes</button>
                    <button onclick="actions.setStaffLogTab('kills')" class="px-4 py-2 rounded-xl text-xs font-bold transition-all border whitespace-nowrap ${subTab === 'kills' ? 'bg-red-600 text-white border-red-500' : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10'}">Kill Logs</button>
                    <button onclick="actions.setStaffLogTab('modcalls')" class="px-4 py-2 rounded-xl text-xs font-bold transition-all border whitespace-nowrap ${subTab === 'modcalls' ? 'bg-orange-600 text-white border-orange-500' : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10'}">Mod Calls</button>
                    <button onclick="actions.setStaffLogTab('players')" class="px-4 py-2 rounded-xl text-xs font-bold transition-all border whitespace-nowrap ${subTab === 'players' ? 'bg-blue-600 text-white border-blue-500' : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10'}">Joueurs</button>
                    <button onclick="actions.setStaffLogTab('vehicles')" class="px-4 py-2 rounded-xl text-xs font-bold transition-all border whitespace-nowrap ${subTab === 'vehicles' ? 'bg-green-600 text-white border-green-500' : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10'}">Véhicules</button>
                </div>

                <div class="flex gap-4 mb-4 shrink-0">
                    <div class="relative flex-1">
                        <i data-lucide="search" class="w-4 h-4 absolute left-3 top-3 text-gray-500"></i>
                        <input type="text" oninput="actions.searchCommandLogs(this.value)" value="${state.erlcLogSearch}" placeholder="Filtrer ${subTab}..." class="glass-input pl-10 pr-4 py-2.5 rounded-xl w-full text-sm bg-white/5 border-white/10">
                    </div>
                    ${subTab === 'commands' && hasPermission('can_execute_commands') ? `
                        <form onsubmit="actions.executeCommand(event)" class="flex gap-2 w-1/2">
                            <input type="text" name="command" placeholder="Commande Serveur (ex: :m Message)" class="glass-input flex-1 px-3 rounded-xl text-sm font-mono border-purple-500/30 bg-purple-900/10 focus:bg-purple-900/20" required>
                            <button type="submit" class="glass-btn px-4 rounded-xl bg-purple-600 hover:bg-purple-500"><i data-lucide="terminal" class="w-4 h-4"></i></button>
                        </form>
                    ` : ''}
                </div>

                <div class="flex-1 overflow-hidden rounded-xl border border-white/5 bg-white/5 flex flex-col">
                    <div class="overflow-y-auto custom-scrollbar flex-1">
                        <table class="w-full text-left text-sm border-collapse">
                            <thead class="bg-[#151515] text-xs uppercase text-gray-500 font-bold sticky top-0 z-10 shadow-sm">
                                ${headers}
                            </thead>
                            <tbody class="divide-y divide-white/5">
                                ${tableContent}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }

    return `
        ${economyModalHtml}
        ${inventoryModalHtml}
        <div class="h-full flex flex-col bg-[#050505] overflow-hidden animate-fade-in relative">
            ${refreshBanner}
            
            <div class="px-6 pb-4 pt-4 flex flex-col md:flex-row justify-between items-center gap-4 border-b border-white/5 shrink-0 relative z-10 bg-[#050505]">
                <div>
                    <h2 class="text-2xl font-bold text-white flex items-center gap-2">
                        <i data-lucide="shield-alert" class="w-6 h-6 text-purple-500"></i>
                        Administration
                    </h2>
                    <p class="text-gray-400 text-sm">Gestion du serveur et modération</p>
                </div>
                <div class="flex gap-2 bg-white/5 p-1 rounded-xl overflow-x-auto max-w-full no-scrollbar">
                    ${hasPermission('can_approve_characters') ? `<button onclick="actions.setStaffTab('applications')" class="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all whitespace-nowrap ${state.activeStaffTab === 'applications' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}"><i data-lucide="file-check" class="w-4 h-4"></i> WL</button>` : ''}
                    <button onclick="actions.setStaffTab('database')" class="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all whitespace-nowrap ${state.activeStaffTab === 'database' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}"><i data-lucide="database" class="w-4 h-4"></i> Citoyens</button>
                    ${hasPermission('can_manage_economy') ? `<button onclick="actions.setStaffTab('economy')" class="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all whitespace-nowrap ${state.activeStaffTab === 'economy' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}"><i data-lucide="coins" class="w-4 h-4"></i> Éco</button>` : ''}
                    ${hasPermission('can_manage_illegal') ? `<button onclick="actions.setStaffTab('illegal')" class="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all whitespace-nowrap ${state.activeStaffTab === 'illegal' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}"><i data-lucide="skull" class="w-4 h-4"></i> Illégal</button>` : ''}
                    ${hasPermission('can_manage_enterprises') ? `<button onclick="actions.setStaffTab('enterprise')" class="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all whitespace-nowrap ${state.activeStaffTab === 'enterprise' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}"><i data-lucide="building-2" class="w-4 h-4"></i> Ent.</button>` : ''}
                    ${hasPermission('can_manage_staff') ? `<button onclick="actions.setStaffTab('permissions')" class="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all whitespace-nowrap ${state.activeStaffTab === 'permissions' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}"><i data-lucide="lock" class="w-4 h-4"></i> Perms</button>` : ''}
                    ${hasPermission('can_launch_session') ? `<button onclick="actions.setStaffTab('sessions')" class="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all whitespace-nowrap ${state.activeStaffTab === 'sessions' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}"><i data-lucide="server" class="w-4 h-4"></i> Sessions</button>` : ''}
                    ${hasPermission('can_execute_commands') ? `<button onclick="actions.setStaffTab('logs')" class="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all whitespace-nowrap ${state.activeStaffTab === 'logs' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}"><i data-lucide="scroll-text" class="w-4 h-4"></i> Logs</button>` : ''}
                    
                    ${isOnDuty ? 
                        `<button onclick="actions.confirmToggleDuty(true)" class="px-4 py-2 rounded-lg text-sm font-bold bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 flex items-center gap-2 whitespace-nowrap ml-4"><i data-lucide="user-check" class="w-4 h-4"></i> En Service</button>` : 
                        `<button onclick="actions.confirmToggleDuty(false)" class="px-4 py-2 rounded-lg text-sm font-bold bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 flex items-center gap-2 whitespace-nowrap ml-4"><i data-lucide="user-x" class="w-4 h-4"></i> Hors Service</button>`
                    }
                </div>
            </div>

            <div class="flex-1 p-6 overflow-hidden relative min-h-0">
                <div class="h-full overflow-y-auto custom-scrollbar pr-2">
                    ${content}
                </div>
            </div>
        </div>
    `;
};
