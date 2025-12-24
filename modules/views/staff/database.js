
import { state } from '../../state.js';
import { hasPermission } from '../../utils.js';

export const StaffDatabaseView = () => {
    const canDelete = hasPermission('can_manage_characters');
    const canInventory = hasPermission('can_manage_inventory');
    const canChangeTeam = hasPermission('can_change_team');
    const canManageJobs = hasPermission('can_manage_jobs');
    
    let allChars = state.allCharactersAdmin || [];
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

    return `
        <div class="flex flex-col h-full animate-fade-in">
            <div class="flex flex-col md:flex-row gap-4 mb-8 shrink-0">
                <div class="relative flex-1 group">
                    <i data-lucide="search" class="w-5 h-5 absolute left-4 top-3.5 text-gray-500 group-focus-within:text-purple-400 transition-colors"></i>
                    <input type="text" oninput="actions.staffSearch(this.value)" value="${state.staffSearchQuery}" 
                        placeholder="Rechercher un citoyen..." 
                        class="glass-input pl-12 pr-4 py-3.5 rounded-2xl w-full text-sm bg-black/40 border-white/10 focus:border-purple-500/30">
                </div>
                <div class="flex gap-2">
                    <select onchange="actions.setAdminSort(this.value)" class="glass-input px-4 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-black/40 border-white/10 text-gray-400 focus:text-white">
                        <option value="name" ${sortField === 'name' ? 'selected' : ''}>Trier par Nom</option>
                        <option value="job" ${sortField === 'job' ? 'selected' : ''}>Trier par Métier</option>
                        <option value="alignment" ${sortField === 'alignment' ? 'selected' : ''}>Trier par Team</option>
                    </select>
                    <button onclick="actions.toggleAdminSortDir()" class="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-gray-500 hover:text-white transition-all">
                        <i data-lucide="${sortDir === 1 ? 'sort-asc' : 'sort-desc'}" class="w-5 h-5"></i>
                    </button>
                    ${canDelete ? `
                        <button onclick="actions.openAdminCreateChar()" class="px-6 py-3.5 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-purple-900/20 flex items-center gap-3">
                            <i data-lucide="user-plus" class="w-4 h-4"></i> Créer
                        </button>
                    ` : ''}
                </div>
            </div>

            <div class="flex-1 glass-panel rounded-[32px] border border-white/5 bg-[#0a0a0a] overflow-hidden flex flex-col shadow-2xl">
                <div class="overflow-y-auto custom-scrollbar flex-1">
                    <table class="w-full text-left border-separate border-spacing-0">
                        <thead class="bg-black/40 text-[10px] uppercase text-gray-500 font-black tracking-widest sticky top-0 z-10 backdrop-blur-md">
                            <tr>
                                <th class="p-5 border-b border-white/5">Dossier Citoyen</th>
                                <th class="p-5 border-b border-white/5">Affectation Sociale</th>
                                <th class="p-5 border-b border-white/5">Status</th>
                                <th class="p-5 border-b border-white/5 text-right">Registre</th>
                            </tr>
                        </thead>
                        <tbody class="text-sm divide-y divide-white/5">
                            ${allChars.map(c => {
                                const isEnterpriseOwner = state.enterprises?.some(e => e.leader_id === c.id);
                                const displayJob = (c.job === 'unemployed' && isEnterpriseOwner) ? 'PDG' : (c.job || 'unemployed');
                                
                                return `
                                <tr class="hover:bg-white/[0.03] transition-colors group">
                                    <td class="p-5">
                                        <div class="font-black text-white text-base uppercase italic tracking-tight group-hover:text-purple-400 transition-colors">${c.first_name} ${c.last_name}</div>
                                        <div class="text-[10px] text-blue-400 font-bold mt-0.5">@${c.discord_username}</div>
                                    </td>
                                    <td class="p-5">
                                        <div class="flex flex-col gap-2">
                                            <span class="text-[9px] uppercase px-2 py-0.5 rounded-lg w-fit font-black tracking-widest border ${c.alignment === 'illegal' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}">${c.alignment || 'CIVIL'}</span>
                                            ${canManageJobs && c.status === 'accepted' ? `
                                                <select onchange="actions.assignJob('${c.id}', this.value)" class="text-[10px] font-black uppercase tracking-widest bg-black/40 border border-white/5 rounded-lg px-2 py-1 text-gray-500 focus:text-white focus:border-purple-500/50 outline-none w-fit">
                                                    <option value="unemployed" ${c.job === 'unemployed' ? 'selected' : ''}>Sans emploi</option>
                                                    <optgroup label="Gouvernement" class="bg-[#151515]">
                                                        <option value="maire" ${c.job === 'maire' ? 'selected' : ''}>Maire</option>
                                                        <option value="adjoint" ${c.job === 'adjoint' ? 'selected' : ''}>Adjoint</option>
                                                        <option value="juge" ${c.job === 'juge' ? 'selected' : ''}>Juge</option>
                                                        <option value="procureur" ${c.job === 'procureur' ? 'selected' : ''}>Procureur</option>
                                                    </optgroup>
                                                    <optgroup label="Services" class="bg-[#151515]">
                                                        <option value="leo" ${c.job === 'leo' ? 'selected' : ''}>Police</option>
                                                        <option value="lafd" ${c.job === 'lafd' ? 'selected' : ''}>Urgence</option>
                                                        <option value="ladot" ${c.job === 'ladot' ? 'selected' : ''}>Transport</option>
                                                        <option value="lawyer" ${c.job === 'lawyer' ? 'selected' : ''}>Avocat</option>
                                                    </optgroup>
                                                    <option value="pdg" ${c.job === 'pdg' ? 'selected' : ''}>PDG Privé</option>
                                                </select>
                                            ` : `<span class="text-[10px] text-gray-600 font-black uppercase tracking-widest">${displayJob.toUpperCase()}</span>`}
                                        </div>
                                    </td>
                                    <td class="p-5">
                                        <span class="px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border ${c.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'} italic">${c.status}</span>
                                    </td>
                                    <td class="p-5 text-right">
                                        <div class="flex justify-end gap-2">
                                            ${canDelete ? `<button onclick="actions.openAdminEditChar('${c.id}')" class="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl hover:bg-blue-600 hover:text-white transition-all border border-blue-500/10 shadow-lg"><i data-lucide="edit-3" class="w-4 h-4"></i></button>` : ''}
                                            ${canChangeTeam ? `<button onclick="actions.adminSwitchTeam('${c.id}', '${c.alignment}')" class="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl hover:bg-purple-600 hover:text-white transition-all border border-purple-500/10 shadow-lg"><i data-lucide="refresh-cw" class="w-4 h-4"></i></button>` : ''}
                                            ${canInventory && c.status === 'accepted' ? `<button onclick="actions.openInventoryModal('${c.id}', '${c.first_name} ${c.last_name}')" class="p-2.5 bg-orange-500/10 text-orange-400 rounded-xl hover:bg-orange-600 hover:text-white transition-all border border-orange-500/10 shadow-lg"><i data-lucide="backpack" class="w-4 h-4"></i></button>` : ''}
                                            ${canDelete ? `<button onclick="actions.adminDeleteCharacter('${c.id}', '${c.first_name} ${c.last_name}')" class="p-2.5 text-gray-700 hover:text-red-500 transition-all"><i data-lucide="trash-2" class="w-4 h-4"></i></button>` : ''}
                                        </div>
                                    </td>
                                </tr>
                            `}).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
};
