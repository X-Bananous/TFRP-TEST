import { state } from '../../state.js';

export const StaffSanctionsView = () => {
    const results = state.staffSanctionResults || [];
    const target = state.activeSanctionTarget;

    return `
        <div class="h-full flex flex-col gap-8 animate-fade-in">
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-0">
                
                <!-- LEFT: SEARCH & TARGET -->
                <div class="lg:col-span-5 flex flex-col gap-6">
                    <div class="glass-panel p-8 rounded-[40px] border border-white/5 bg-[#0a0a0a] shadow-2xl relative overflow-hidden">
                        <h3 class="font-black text-white text-lg uppercase italic tracking-tighter mb-6 flex items-center gap-3">
                            <i data-lucide="search" class="w-5 h-5 text-purple-400"></i> Rechercher Cible
                        </h3>
                        <div class="relative z-20">
                            <input type="text" oninput="actions.searchUserForSanction(this.value)" value="${state.staffSanctionSearchQuery}" placeholder="Discord ID ou Pseudo..." class="glass-input w-full p-4 pl-12 rounded-2xl text-sm font-bold bg-black/40 border-white/10 uppercase">
                            <i data-lucide="user" class="w-5 h-5 absolute left-4 top-4 text-gray-600"></i>
                            
                            ${results.length > 0 ? `
                                <div class="absolute top-full left-0 right-0 bg-[#151515] border border-white/10 rounded-2xl mt-2 max-h-56 overflow-y-auto z-50 shadow-2xl custom-scrollbar animate-fade-in">
                                    ${results.map(r => `
                                        <div onclick="actions.selectUserForSanction(${JSON.stringify(r).replace(/"/g, '&quot;')})" class="p-4 hover:bg-white/10 cursor-pointer flex items-center gap-4 border-b border-white/5 last:border-0">
                                            <img src="${r.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png'}" class="w-10 h-10 rounded-xl object-cover border border-white/10">
                                            <div>
                                                <div class="font-bold text-white text-sm uppercase">${r.username}</div>
                                                <div class="text-[9px] text-gray-500 font-mono">UID: ${r.id}</div>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : ''}
                        </div>
                    </div>

                    ${target ? `
                        <div class="glass-panel p-8 rounded-[40px] border border-purple-500/30 bg-purple-950/[0.02] shadow-xl animate-slide-up">
                            <div class="flex items-center gap-6 mb-8">
                                <img src="${target.avatar_url}" class="w-16 h-16 rounded-2xl border-2 border-purple-500/50 shadow-2xl">
                                <div>
                                    <div class="font-black text-white text-xl uppercase italic tracking-tighter">${target.username}</div>
                                    <div class="text-[9px] text-purple-400 font-black uppercase tracking-widest">Cible Identifiée</div>
                                </div>
                            </div>
                            <form onsubmit="actions.applySanctionStaff(event)" class="space-y-6">
                                <div class="space-y-2">
                                    <label class="text-[9px] text-gray-600 font-black uppercase tracking-widest ml-1">Nature de la Sanction</label>
                                    <div class="grid grid-cols-3 gap-2">
                                        <label class="cursor-pointer">
                                            <input type="radio" name="type" value="warn" checked class="peer sr-only">
                                            <div class="py-3 text-center rounded-xl bg-white/5 text-gray-500 peer-checked:bg-yellow-600/20 peer-checked:text-yellow-400 peer-checked:border peer-checked:border-yellow-500/50 transition-all font-black text-[10px] uppercase">WARN</div>
                                        </label>
                                        <label class="cursor-pointer">
                                            <input type="radio" name="type" value="mute" class="peer sr-only">
                                            <div class="py-3 text-center rounded-xl bg-white/5 text-gray-500 peer-checked:bg-orange-600/20 peer-checked:text-orange-400 peer-checked:border peer-checked:border-orange-500/50 transition-all font-black text-[10px] uppercase">MUTE</div>
                                        </label>
                                        <label class="cursor-pointer">
                                            <input type="radio" name="type" value="ban" class="peer sr-only">
                                            <div class="py-3 text-center rounded-xl bg-white/5 text-gray-500 peer-checked:bg-red-600/20 peer-checked:text-red-400 peer-checked:border peer-checked:border-red-500/50 transition-all font-black text-[10px] uppercase">BAN</div>
                                        </label>
                                    </div>
                                </div>

                                <div class="space-y-2">
                                    <label class="text-[9px] text-gray-600 font-black uppercase tracking-widest ml-1">Raison (Narration Administrative)</label>
                                    <textarea name="reason" rows="3" placeholder="Description précise de l'infraction..." class="glass-input w-full p-4 rounded-2xl text-xs italic bg-black/40 border-white/10 focus:bg-black/60" required></textarea>
                                </div>

                                <div class="space-y-2">
                                    <label class="text-[9px] text-gray-600 font-black uppercase tracking-widest ml-1">Durée (minutes - 0 pour permanent)</label>
                                    <input type="number" name="duration" value="0" min="0" class="glass-input w-full p-3 rounded-2xl text-sm font-mono font-bold bg-black/40 border-white/10 text-white">
                                </div>

                                <button type="submit" class="glass-btn w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.3em] bg-red-600 hover:bg-red-500 shadow-xl shadow-red-900/30 transition-all transform active:scale-95">
                                    APPLIQUER LA PUNITION
                                </button>
                            </form>
                        </div>
                    ` : `
                        <div class="glass-panel p-12 rounded-[40px] border border-white/5 bg-white/[0.01] flex flex-col items-center justify-center text-center opacity-40">
                            <i data-lucide="user-plus" class="w-16 h-16 text-gray-700 mb-4"></i>
                            <p class="text-xs font-black uppercase tracking-widest">En attente de cible</p>
                        </div>
                    `}
                </div>

                <!-- RIGHT: INFOS & RULES -->
                <div class="lg:col-span-7 space-y-6">
                    <div class="glass-panel p-8 rounded-[40px] border border-white/5 bg-[#0a0a0a] shadow-2xl">
                        <h3 class="font-black text-white text-sm uppercase tracking-widest mb-6 flex items-center gap-3">
                            <i data-lucide="shield-check" class="w-5 h-5 text-emerald-400"></i> Protocole Disciplinaire TFRP
                        </h3>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div class="bg-yellow-500/5 p-4 rounded-2xl border border-yellow-500/20">
                                <div class="font-black text-yellow-500 text-xs uppercase mb-2">WARNS</div>
                                <p class="text-[10px] text-gray-500 leading-relaxed font-medium">Avertissement formel. 3 warns = Ban automatique (configurable).</p>
                            </div>
                            <div class="bg-orange-500/5 p-4 rounded-2xl border border-orange-500/20">
                                <div class="font-black text-orange-500 text-xs uppercase mb-2">MUTES</div>
                                <p class="text-[10px] text-gray-500 leading-relaxed font-medium">Coupure des communications Discord. Durée recommandée : 30m à 24h.</p>
                            </div>
                            <div class="bg-red-500/5 p-4 rounded-2xl border border-red-500/20">
                                <div class="font-black text-red-500 text-xs uppercase mb-2">BANS</div>
                                <p class="text-[10px] text-gray-500 leading-relaxed font-medium">Expulsion totale. Bloque l'accès en jeu, sur Discord et sur le panel.</p>
                            </div>
                        </div>
                    </div>

                    <div class="glass-panel p-8 rounded-[40px] border border-white/5 bg-[#0a0a0a] flex-1 flex flex-col min-h-0">
                         <h3 class="font-black text-white text-sm uppercase tracking-widest mb-6 shrink-0 flex items-center gap-3">
                            <i data-lucide="history" class="w-5 h-5 text-blue-400"></i> Dernières Interventions Mondiales
                        </h3>
                        <div class="flex-1 overflow-y-auto custom-scrollbar pr-2 italic text-center py-20 text-gray-700 uppercase font-black text-[10px] tracking-[0.4em] opacity-30">
                            Flux en attente de données temps réel...
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
};