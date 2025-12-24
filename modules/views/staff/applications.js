
import { state } from '../../state.js';
import { hasPermission } from '../../utils.js';

export const StaffApplicationsView = () => {
    let pending = state.pendingApplications || [];
    if (state.staffSearchQuery) {
        const q = state.staffSearchQuery.toLowerCase();
        pending = pending.filter(p => 
            p.first_name.toLowerCase().includes(q) || 
            p.last_name.toLowerCase().includes(q) || 
            p.discord_username.toLowerCase().includes(q)
        );
    }

    return `
        <div class="space-y-8 animate-fade-in">
            <div class="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
                <div class="relative flex-1 w-full md:max-w-md group">
                    <i data-lucide="search" class="w-5 h-5 absolute left-4 top-3.5 text-gray-500 group-focus-within:text-purple-400 transition-colors"></i>
                    <input type="text" oninput="actions.staffSearch(this.value)" value="${state.staffSearchQuery}" 
                        placeholder="Filtrer les dossiers d'immigration..." 
                        class="glass-input pl-12 pr-4 py-4 rounded-[20px] w-full text-sm bg-black/40 border-white/5 focus:border-purple-500/30">
                </div>
                <div class="px-6 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-[10px] font-black text-purple-400 uppercase tracking-widest italic">
                    ${pending.length} Dossier(s) en attente
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                ${pending.length === 0 ? `
                    <div class="col-span-full py-40 text-center opacity-30 flex flex-col items-center border-2 border-dashed border-white/5 rounded-[40px]">
                        <i data-lucide="inbox" class="w-16 h-16 mb-4"></i>
                        <p class="text-sm font-black uppercase tracking-[0.4em]">File d'attente vide</p>
                    </div>
                ` : pending.map(p => `
                    <div class="glass-panel p-8 rounded-[40px] border border-white/5 hover:border-purple-500/30 transition-all group relative overflow-hidden flex flex-col shadow-xl">
                        <div class="absolute -right-10 -top-10 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl group-hover:bg-purple-500/10 transition-all"></div>
                        
                        <div class="flex justify-between items-start mb-8 relative z-10">
                            <div class="relative w-16 h-16 shrink-0">
                                <div class="w-full h-full rounded-[24px] bg-gray-800 border border-white/10 overflow-hidden shadow-2xl group-hover:scale-105 transition-transform">
                                    ${p.discord_avatar ? `<img src="${p.discord_avatar}" class="w-full h-full object-cover">` : `<div class="w-full h-full flex items-center justify-center text-xl font-black text-gray-500">${p.first_name[0]}</div>`}
                                </div>
                            </div>
                            <div class="text-right">
                                <div class="text-[9px] text-purple-400 font-black uppercase tracking-widest bg-purple-500/10 px-3 py-1 rounded-lg border border-purple-500/20">Immigration</div>
                                <div class="text-[8px] text-gray-600 font-mono mt-1 uppercase tracking-tighter">UID: ${p.id.substring(0,8)}</div>
                            </div>
                        </div>

                        <div class="mb-8 relative z-10">
                            <h4 class="text-2xl font-black text-white uppercase italic tracking-tight group-hover:text-purple-400 transition-colors leading-none mb-1">${p.first_name}<br>${p.last_name}</h4>
                            <p class="text-xs text-blue-400 font-bold uppercase tracking-widest mt-2">@${p.discord_username || 'Inconnu'}</p>
                        </div>

                        <div class="grid grid-cols-2 gap-3 mb-8 relative z-10">
                            <div class="bg-white/5 p-3 rounded-2xl border border-white/5 text-center">
                                <div class="text-[8px] text-gray-600 font-black uppercase tracking-widest mb-1">Âge</div>
                                <div class="text-sm font-black text-gray-300">${p.age} Ans</div>
                            </div>
                            <div class="bg-white/5 p-3 rounded-2xl border border-white/5 text-center">
                                <div class="text-[8px] text-gray-600 font-black uppercase tracking-widest mb-1">Profil</div>
                                <div class="text-sm font-black ${p.alignment === 'illegal' ? 'text-red-400' : 'text-blue-400'} uppercase">${p.alignment || '?'}</div>
                            </div>
                        </div>

                        <div class="mt-auto flex gap-3 relative z-10">
                            <button onclick="actions.decideApplication('${p.id}', 'accepted')" class="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2">
                                <i data-lucide="check" class="w-4 h-4"></i> ACCEPTER
                            </button>
                            <button onclick="actions.decideApplication('${p.id}', 'rejected')" class="p-4 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-2xl border border-red-500/20 transition-all flex items-center justify-center">
                                <i data-lucide="x" class="w-5 h-5"></i>
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
};
