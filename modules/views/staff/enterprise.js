
import { state } from '../../state.js';

export const StaffEnterpriseView = () => {
    const isEditing = !!state.editingEnterprise;
    
    const searchUI = (role) => `
        <div class="relative">
            <label class="text-[9px] text-gray-500 uppercase font-black tracking-widest ml-1 mb-2 block">${role === 'Leader' ? 'Directeur Général (PDG)' : 'Directeur Adjoint (Co-PDG)'}</label>
            <div class="relative group">
                <i data-lucide="user" class="w-3.5 h-3.5 absolute left-3.5 top-3.5 text-gray-600 group-focus-within:text-blue-400 transition-colors"></i>
                <input type="text" id="ent-${role.toLowerCase()}-search" 
                    placeholder="Chercher profil..." 
                    value="${role === 'Leader' ? state.enterpriseCreation.leaderQuery : state.enterpriseCreation.coLeaderQuery}"
                    oninput="actions.searchEnterpriseLeader('${role}', this.value)"
                    class="glass-input w-full p-3 pl-10 rounded-2xl text-xs bg-black/40 border-white/10 ${role === 'Leader' && state.enterpriseCreation.leaderResult ? 'border-blue-500/50 text-blue-400' : ''}" 
                    autocomplete="off">
            </div>
            <div id="ent-${role.toLowerCase()}-dropdown" class="absolute top-full left-0 right-0 bg-[#151515] border border-white/10 rounded-2xl mt-1 max-h-40 overflow-y-auto z-50 shadow-2xl hidden"></div>
        </div>
    `;

    return `
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full min-h-0 animate-fade-in">
            <div class="flex flex-col gap-8 overflow-y-auto custom-scrollbar pr-2">
                <!-- CREATION FORM -->
                <div class="glass-panel p-8 rounded-[40px] border ${isEditing ? 'border-blue-500/50 shadow-blue-900/10' : 'border-white/5'} bg-[#0a0a0a] relative overflow-hidden">
                    <h3 class="font-black text-white text-xl uppercase italic tracking-tighter mb-8 flex items-center gap-4">
                        <i data-lucide="${isEditing ? 'edit-3' : 'building-2'}" class="w-6 h-6 text-blue-500"></i> 
                        ${isEditing ? 'Modification de Statuts' : 'Enregistrement Commercial'}
                    </h3>
                    <form onsubmit="actions.adminCreateEnterprise(event)" class="space-y-6">
                        <div>
                            <label class="text-[9px] text-gray-500 uppercase font-black tracking-widest ml-1 mb-2 block">Dénomination Sociale</label>
                            <input type="text" name="name" 
                                value="${state.enterpriseCreation.draftName}"
                                oninput="actions.updateEnterpriseDraftName(this.value)"
                                placeholder="Nom de l'enseigne..." class="glass-input w-full p-4 rounded-2xl bg-black/40 border-white/10 text-sm font-bold uppercase tracking-tight" required>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            ${searchUI('Leader')}
                            ${searchUI('Co-Leader')}
                        </div>

                        <div class="flex gap-3 pt-4 border-t border-white/5">
                            ${isEditing ? `<button type="button" onclick="actions.cancelEditEnterprise()" class="glass-btn-secondary px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest">Avorter</button>` : ''}
                            <button type="submit" class="glass-btn flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-900/30 transition-all">
                                ${isEditing ? 'RATIFIER LES STATUTS' : 'PUBLIER LE DÉCRET'}
                            </button>
                        </div>
                    </form>
                </div>

                <!-- ENTERPRISE LIST -->
                <div class="glass-panel p-8 rounded-[40px] border border-white/5 bg-[#0a0a0a] shadow-2xl">
                    <h3 class="font-black text-white text-sm uppercase tracking-widest mb-6">Registre des Corporations</h3>
                    <div class="space-y-3">
                        ${state.enterprises.map(e => `
                            <div class="bg-white/5 p-5 rounded-3xl flex justify-between items-center border border-white/5 group hover:bg-white/10 transition-all">
                                <div class="min-w-0">
                                    <div class="font-black text-white uppercase italic text-base truncate">${e.name}</div>
                                    <div class="flex items-center gap-3 text-[8px] text-gray-500 font-black uppercase tracking-widest mt-1">
                                        <span>PDG: <span class="text-blue-400">${e.leader ? e.leader.first_name : 'N/A'}</span></span>
                                        <span class="w-1 h-1 bg-gray-800 rounded-full"></span>
                                        <span>Capital: <span class="text-emerald-400 font-mono">$${(e.balance||0).toLocaleString()}</span></span>
                                    </div>
                                </div>
                                <div class="flex gap-1.5 shrink-0 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onclick="actions.openAdminEditEnterprise('${e.id}')" class="p-2.5 text-blue-400 hover:bg-blue-600/10 rounded-xl border border-white/10"><i data-lucide="edit-3" class="w-4 h-4"></i></button>
                                    <button onclick="actions.adminDeleteEnterprise('${e.id}')" class="p-2.5 text-red-500 hover:bg-red-600/10 rounded-xl border border-white/10"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>

            <!-- MODERATION COLUMN -->
            <div class="flex flex-col h-full min-h-0">
                <div class="glass-panel p-8 rounded-[40px] flex flex-col h-full border border-white/5 bg-[#080808] overflow-hidden shadow-2xl">
                    <div class="flex justify-between items-center mb-8 shrink-0">
                        <h3 class="font-black text-white text-xl uppercase italic tracking-tighter flex items-center gap-4">
                            <i data-lucide="check-square" class="w-6 h-6 text-orange-400"></i> 
                            Audit de Mise en Rayon (${state.pendingEnterpriseItems.length})
                        </h3>
                        <div class="px-3 py-1 bg-orange-500/10 text-orange-400 rounded-full text-[9px] font-black border border-orange-500/20 uppercase tracking-widest animate-pulse">Flux Modération</div>
                    </div>
                    <div class="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
                        ${state.pendingEnterpriseItems.length === 0 ? `
                            <div class="h-full flex flex-col items-center justify-center opacity-20 text-center py-20 italic font-black uppercase tracking-[0.4em] text-gray-500">
                                <i data-lucide="package-search" class="w-16 h-16 mb-4"></i>
                                Aucun produit suspect
                            </div>
                        ` : 
                            state.pendingEnterpriseItems.map(item => `
                                <div class="bg-white/5 p-6 rounded-[32px] border border-white/5 hover:border-orange-500/30 transition-all relative group">
                                    <div class="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
                                    <div class="flex justify-between items-start mb-3">
                                        <div class="font-black text-white text-xl uppercase italic tracking-tight">${item.name}</div>
                                        <div class="text-[9px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-lg border border-blue-500/20 font-black uppercase tracking-widest">${item.enterprises?.name}</div>
                                    </div>
                                    <div class="text-xs text-gray-500 mb-6 italic bg-black/40 p-3 rounded-xl border border-white/5">"${item.description || 'Aucun slogan fourni'}"</div>
                                    <div class="flex justify-between items-center text-[10px] mb-6 font-mono bg-black/20 p-3 rounded-xl border border-white/5">
                                        <div class="flex flex-col"><span class="text-gray-600 font-black uppercase mb-0.5">Tarif HT</span><span class="text-emerald-400 font-black text-lg">$${item.price.toLocaleString()}</span></div>
                                        <div class="flex flex-col text-right"><span class="text-gray-600 font-black uppercase mb-0.5">Stock</span><span class="text-white font-black text-lg">${item.quantity}</span></div>
                                    </div>
                                    <div class="grid grid-cols-2 gap-3">
                                        <button onclick="actions.adminModerateItem('${item.id}', 'approve')" class="bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-900/20 transition-all">APPROUVER</button>
                                        <button onclick="actions.adminModerateItem('${item.id}', 'reject')" class="bg-red-600 hover:bg-red-500 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-900/20 transition-all">REJETER</button>
                                    </div>
                                </div>
                            `).join('')
                        }
                    </div>
                </div>
            </div>
        </div>
    `;
};
