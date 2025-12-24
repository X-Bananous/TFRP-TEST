
import { state } from '../../state.js';
import { hasPermission } from '../../utils.js';

export const StaffPermissionsView = () => {
    return `
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full animate-fade-in overflow-hidden">
            
            <!-- LEFT: USER SEARCH & EDITOR -->
            <div class="lg:col-span-8 flex flex-col min-h-0">
                <div class="glass-panel p-10 rounded-[48px] border border-white/5 bg-[#0a0a0c] shadow-2xl relative overflow-hidden flex flex-col h-full">
                    <div class="absolute -right-20 -top-20 w-96 h-96 bg-purple-500/5 rounded-full blur-[100px] pointer-events-none"></div>
                    
                    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 shrink-0 relative z-10">
                        <div>
                            <div class="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/10 text-purple-400 text-[10px] font-black uppercase tracking-[0.3em] border border-purple-500/20 mb-3 rounded-lg">
                                <i data-lucide="lock" class="w-3.5 h-3.5"></i> Sécurité des Accès
                            </div>
                            <h2 class="text-4xl font-black text-white italic uppercase tracking-tighter">Contrôleur de Privilèges</h2>
                        </div>
                        <div class="relative w-full md:w-80 group">
                            <i data-lucide="search" class="w-4 h-4 absolute left-4 top-3.5 text-gray-500 group-focus-within:text-purple-400 transition-colors"></i>
                            <input type="text" placeholder="Pseudo Discord ou ID..." oninput="actions.searchProfilesForPerms(this.value)" 
                                class="glass-input p-3.5 pl-12 rounded-[20px] w-full text-sm bg-black/40 border-white/5 focus:border-purple-500/30">
                            <div id="perm-search-dropdown" class="absolute top-full left-0 right-0 bg-[#151515] border border-white/10 rounded-[24px] mt-2 max-h-64 overflow-y-auto z-50 shadow-2xl custom-scrollbar hidden animate-fade-in"></div>
                        </div>
                    </div>

                    <div id="perm-editor-container" class="flex-1 overflow-y-auto custom-scrollbar pr-2 relative z-10">
                        <div class="h-full flex flex-col items-center justify-center opacity-20 text-center py-20">
                            <i data-lucide="shield-check" class="w-24 h-24 mb-6"></i>
                            <p class="text-sm font-black uppercase tracking-[0.4em]">Sélectionnez un profil pour modifier ses accès</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- RIGHT: STAFF ROSTER -->
            <div class="lg:col-span-4 flex flex-col h-full overflow-hidden">
                <div class="glass-panel p-0 rounded-[48px] border border-white/5 bg-[#0a0a0a] shadow-2xl flex flex-col overflow-hidden h-full">
                    <div class="p-8 border-b border-white/5 bg-black/40 shrink-0">
                        <h3 class="font-black text-white uppercase italic tracking-widest text-sm flex items-center gap-3">
                            <i data-lucide="shield" class="w-5 h-5 text-purple-400"></i>
                            Équipe Accréditée (${state.staffMembers.length})
                        </h3>
                    </div>
                    <div class="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-3">
                        ${state.staffMembers.map(m => {
                            const perms = m.permissions || {};
                            const permKeys = Object.keys(perms).filter(k => perms[k] === true);
                            const isFounder = state.adminIds.includes(m.id);

                            return `
                                <button onclick="actions.selectUserForPerms('${m.id}')" class="w-full text-left p-5 rounded-[28px] bg-white/[0.02] hover:bg-purple-600/10 border border-white/5 hover:border-purple-500/30 flex items-center gap-4 transition-all group">
                                    <div class="relative w-12 h-12 shrink-0">
                                        <img src="${m.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png'}" class="w-full h-full rounded-[18px] border border-white/10 group-hover:scale-105 transition-transform object-cover">
                                        ${isFounder ? `<div class="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg border-2 border-black"><i data-lucide="crown" class="w-2 h-2 text-black"></i></div>` : ''}
                                    </div>
                                    <div class="flex-1 min-w-0">
                                        <div class="font-black text-white text-sm truncate uppercase tracking-tight italic group-hover:text-purple-400 transition-colors">${m.username}</div>
                                        <div class="flex flex-wrap gap-1 mt-1.5">
                                            ${isFounder ? `<span class="text-[7px] px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-500 font-black uppercase border border-yellow-500/30">Fondateur</span>` : 
                                              permKeys.length > 0 ? `<span class="text-[7px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-black uppercase border border-purple-500/30">${permKeys.length} Perms</span>` : 
                                              '<span class="text-[7px] text-gray-700 uppercase font-black">Niveau 0</span>'}
                                        </div>
                                    </div>
                                    <i data-lucide="chevron-right" class="w-4 h-4 text-gray-700 group-hover:text-purple-400 transition-all"></i>
                                </button>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
};
