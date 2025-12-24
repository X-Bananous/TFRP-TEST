
import { state } from '../../state.js';
import { HEIST_DATA } from '../illicit.js';

export const StaffIllegalView = () => {
    const { totalCoke, totalWeed } = state.serverStats;
    const totalDrugs = (totalCoke || 0) + (totalWeed || 0);
    const cokePercent = totalDrugs > 0 ? ((totalCoke || 0) / totalDrugs) * 100 : 0;
    const weedPercent = totalDrugs > 0 ? ((totalWeed || 0) / totalDrugs) * 100 : 0;
    const pendingHeists = state.pendingHeistReviews || [];

    const searchUI = (role) => `
        <div class="relative group">
            <i data-lucide="user" class="w-3 h-3 absolute left-3 top-3 text-gray-600 group-focus-within:text-purple-400 transition-colors"></i>
            <input type="text" placeholder="Rechercher ${role}..." 
                id="gang-${role === 'Leader' ? 'leader' : 'coleader'}-search"
                value="${role === 'Leader' ? (state.gangCreation.leaderResult ? state.gangCreation.leaderResult.name : state.gangCreation.leaderQuery) : (state.gangCreation.coLeaderResult ? state.gangCreation.coLeaderResult.name : state.gangCreation.coLeaderQuery)}"
                oninput="actions.searchGangSearch('${role}', this.value)"
                class="glass-input w-full p-2.5 pl-8 rounded-xl text-[10px] font-black uppercase tracking-widest bg-black/40 border-white/5 focus:border-purple-500/30 ${role === 'Leader' && state.gangCreation.leaderResult ? 'text-purple-400' : ''}" required autocomplete="off">
            <div id="gang-${role === 'Leader' ? 'leader' : 'coleader'}-dropdown" class="absolute top-full left-0 right-0 bg-[#151515] border border-white/10 rounded-xl mt-1 z-50 max-h-32 overflow-y-auto shadow-2xl hidden"></div>
        </div>
    `;

    return `
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full animate-fade-in overflow-y-auto custom-scrollbar pr-2 pb-10">
            
            <!-- SURVEILLANCE STUPÉFIANTS -->
            <div class="lg:col-span-12 glass-panel p-10 rounded-[48px] border border-white/5 bg-gradient-to-br from-indigo-900/10 to-black shadow-2xl relative overflow-hidden shrink-0">
                <div class="absolute -right-20 -top-20 w-96 h-96 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none"></div>
                <div class="flex items-center gap-6 mb-10 relative z-10">
                    <div class="w-16 h-16 rounded-[24px] bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 shadow-xl"><i data-lucide="flask-conical" class="w-8 h-8"></i></div>
                    <div>
                        <div class="text-[10px] text-indigo-400 font-black uppercase tracking-[0.4em] mb-1">Registre des Saisies</div>
                        <h3 class="text-4xl font-black text-white italic uppercase tracking-tighter">Volume des Stupéfiants : ${totalDrugs}g</h3>
                    </div>
                </div>

                <div class="h-4 w-full bg-white/5 rounded-full overflow-hidden flex shadow-inner mb-6 relative z-10">
                    <div style="width: ${cokePercent}%" class="h-full bg-white shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all duration-1000"></div>
                    <div style="width: ${weedPercent}%" class="h-full bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all duration-1000"></div>
                </div>

                <div class="flex gap-8 relative z-10">
                    <div class="flex items-center gap-3"><div class="w-2.5 h-2.5 rounded-full bg-white shadow-lg"></div><span class="text-[10px] text-gray-500 font-black uppercase tracking-widest">Cocaïne (${totalCoke}g)</span></div>
                    <div class="flex items-center gap-3"><div class="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-lg"></div><span class="text-[10px] text-gray-500 font-black uppercase tracking-widest">Cannabis (${totalWeed}g)</span></div>
                </div>
            </div>

            <!-- GESTION DES GANGS -->
            <div class="lg:col-span-8 flex flex-col gap-8">
                <div class="glass-panel p-8 rounded-[40px] border border-white/5 bg-[#0a0a0a] shadow-2xl relative overflow-hidden group">
                    <div class="absolute -right-20 -top-20 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl group-hover:bg-purple-500/10 transition-all"></div>
                    <h3 class="font-black text-white uppercase italic tracking-tighter text-2xl mb-8 flex items-center gap-3">
                        <i data-lucide="${state.editingGang ? 'edit' : 'users'}" class="w-7 h-7 text-purple-400"></i>
                        ${state.editingGang ? 'Réviser Statuts : ' + state.editingGang.name : 'Éditer un Nouveau Syndicat'}
                    </h3>
                    <form onsubmit="${state.editingGang ? 'actions.submitEditGang(event)' : 'actions.createGangAdmin(event)'}" class="space-y-6 relative z-10">
                        <div class="space-y-4">
                            <label class="text-[9px] text-gray-600 font-black uppercase tracking-widest ml-1">Désignation du Groupement</label>
                            <input type="text" name="name" value="${state.editingGang ? state.editingGang.name : state.gangCreation.draftName}" oninput="actions.updateGangDraftName(this.value)" placeholder="Nom du Gang" class="glass-input w-full p-4 rounded-2xl text-base font-black bg-black/40 border-white/10 uppercase tracking-tight" required>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="space-y-2"><label class="text-[9px] text-gray-600 font-black uppercase tracking-widest ml-1">Leader Principal</label>${searchUI('Leader')}</div>
                            <div class="space-y-2"><label class="text-[9px] text-gray-600 font-black uppercase tracking-widest ml-1">Commandant en Second</label>${searchUI('Co-Leader')}</div>
                        </div>
                        <div class="flex gap-4 pt-4">
                            ${state.editingGang ? `<button type="button" onclick="actions.cancelEditGang()" class="px-8 py-4 rounded-2xl bg-white/5 text-gray-500 font-black text-[10px] uppercase tracking-widest border border-white/10 hover:text-white transition-all">Annuler</button>` : ''}
                            <button type="submit" class="flex-1 py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl shadow-purple-900/30 transition-all">
                                ${state.editingGang ? 'RATIFIER LES MODIFICATIONS' : 'ENREGISTRER LE SYNDICAT'}
                            </button>
                        </div>
                    </form>
                </div>

                <div class="glass-panel p-0 rounded-[40px] border border-white/5 bg-[#0a0a0a] shadow-2xl flex flex-col overflow-hidden">
                    <div class="p-8 border-b border-white/5 flex justify-between items-center bg-black/40">
                        <h3 class="font-black text-white uppercase italic tracking-tighter text-xl">Syndicats Répertoriés</h3>
                    </div>
                    <div class="overflow-y-auto custom-scrollbar flex-1 max-h-[400px]">
                        <table class="w-full text-left border-separate border-spacing-0">
                            <thead class="bg-black/40 text-[9px] uppercase text-gray-500 font-black tracking-widest sticky top-0 z-10 backdrop-blur-md">
                                <tr>
                                    <th class="p-5 border-b border-white/5">Désignation</th>
                                    <th class="p-5 border-b border-white/5">Haut Commandement</th>
                                    <th class="p-5 border-b border-white/5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody class="text-sm divide-y divide-white/5">
                                ${state.gangs.map(g => `
                                    <tr class="hover:bg-white/[0.03] transition-colors group">
                                        <td class="p-5">
                                            <div class="font-black text-white text-base uppercase italic tracking-tight group-hover:text-purple-400 transition-colors">${g.name}</div>
                                            <div class="text-[9px] text-gray-600 font-mono mt-0.5">REF: #${g.id.substring(0,8).toUpperCase()}</div>
                                        </td>
                                        <td class="p-5">
                                            <div class="text-[10px] font-black text-gray-400 uppercase tracking-widest">${g.leader ? g.leader.first_name + ' ' + g.leader.last_name : 'Inconnu'}</div>
                                        </td>
                                        <td class="p-5 text-right">
                                            <div class="flex justify-end gap-2">
                                                <button onclick="actions.openEditGang('${g.id}')" class="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/10 shadow-lg hover:bg-blue-600 hover:text-white transition-all"><i data-lucide="edit-2" class="w-4 h-4"></i></button>
                                                <button onclick="actions.deleteGang('${g.id}')" class="p-2.5 text-gray-700 hover:text-red-500 transition-all"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                                            </div>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- VALIDATION BRAQUAGES -->
            <div class="lg:col-span-4 flex flex-col gap-8">
                <div class="glass-panel p-8 rounded-[40px] border border-red-500/10 bg-red-500/[0.01] shadow-2xl flex flex-col min-h-[500px]">
                    <h3 class="font-black text-red-500 uppercase italic tracking-tighter text-xl mb-8 flex items-center gap-3 shrink-0">
                        <i data-lucide="shield-alert" class="w-6 h-6 animate-pulse"></i> Contrôle Opérationnel
                    </h3>
                    <div class="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
                        ${pendingHeists.length === 0 ? `
                            <div class="h-full flex flex-col items-center justify-center opacity-20 text-center">
                                <i data-lucide="radio" class="w-16 h-16 mb-4"></i>
                                <p class="text-[10px] font-black uppercase tracking-[0.4em]">Signal Inactif</p>
                            </div>
                        ` : pendingHeists.map(lobby => {
                            const hInfo = HEIST_DATA.find(h => h.id === lobby.heist_type);
                            const heistName = hInfo ? hInfo.name : lobby.heist_type;
                            return `
                                <div class="p-6 bg-black/40 rounded-[32px] border border-white/5 group hover:border-red-500/30 transition-all shadow-xl">
                                    <div class="flex justify-between items-start mb-4">
                                        <div class="min-w-0">
                                            <div class="font-black text-white text-lg uppercase italic truncate tracking-tight group-hover:text-red-400 transition-colors">${heistName}</div>
                                            <div class="text-[9px] text-gray-600 font-bold uppercase tracking-widest mt-1">Chef: <span class="text-white">${lobby.characters?.first_name}</span></div>
                                        </div>
                                        <span class="text-[8px] ${lobby.status === 'active' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'} px-2.5 py-1 rounded-lg border border-white/5 font-black uppercase tracking-widest">${lobby.status === 'active' ? 'En Cours' : 'Clôture'}</span>
                                    </div>
                                    ${lobby.location ? `<div class="text-[10px] text-red-300/60 mb-6 flex items-center gap-2 font-mono"><i data-lucide="map-pin" class="w-3.5 h-3.5"></i> ${lobby.location}</div>` : ''}
                                    
                                    <div class="flex gap-2">
                                        ${lobby.status === 'active' ? `<div class="w-full text-center text-[9px] font-black uppercase tracking-widest text-gray-700 py-3 bg-white/5 rounded-2xl border border-dashed border-white/10">Surveillance active...</div>` : `
                                            <button onclick="actions.validateHeist('${lobby.id}', true)" class="flex-1 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest border border-emerald-600/30 transition-all shadow-lg">SUCCÈS</button>
                                            <button onclick="actions.validateHeist('${lobby.id}', false)" class="flex-1 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest border border-red-600/30 transition-all shadow-lg">ÉCHEC</button>
                                        `}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
};
