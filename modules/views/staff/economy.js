
import { state } from '../../state.js';
import { hasPermission } from '../../utils.js';

export const StaffEconomyView = () => {
    const { totalMoney, totalCash, totalBank, totalGang, totalEnterprise } = state.serverStats;
    const totalMoneyVal = (totalMoney || 0);
    const subTab = state.activeEconomySubTab || 'players';

    const bankPercent = totalMoneyVal > 0 ? (totalBank / totalMoneyVal) * 100 : 0;
    const cashPercent = totalMoneyVal > 0 ? (totalCash / totalMoneyVal) * 100 : 0;
    const gangPercent = totalMoneyVal > 0 ? (totalGang / totalMoneyVal) * 100 : 0;
    const entPercent = totalMoneyVal > 0 ? (totalEnterprise / totalMoneyVal) * 100 : 0;

    let subContent = '';
    if (subTab === 'players') {
        if (!hasPermission('can_manage_economy')) {
            subContent = `<div class="p-20 text-center text-gray-600 italic uppercase font-black tracking-widest text-xs opacity-50">Accès restreint aux gestionnaires de fonds</div>`;
        } else {
            let allChars = state.allCharactersAdmin || [];
            if (state.staffSearchQuery) {
                const q = state.staffSearchQuery.toLowerCase();
                allChars = allChars.filter(c => c.first_name.toLowerCase().includes(q) || c.last_name.toLowerCase().includes(q) || c.discord_username.toLowerCase().includes(q));
            }
            subContent = `
                <div class="mb-8 flex flex-col md:flex-row justify-between items-center gap-6 bg-emerald-500/[0.03] p-8 rounded-[32px] border border-emerald-500/20 shadow-2xl relative overflow-hidden">
                    <div class="absolute -right-20 -top-20 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl"></div>
                    <div class="relative z-10">
                        <h3 class="font-black text-white text-xl uppercase italic tracking-tighter">Injection de Capital</h3>
                        <p class="text-xs text-emerald-400 font-bold uppercase tracking-widest mt-1">Affecte l'intégralité du réseau financier</p>
                    </div>
                    <button onclick="actions.openEconomyModal('ALL')" class="glass-btn px-10 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase tracking-[0.3em] shadow-xl shadow-emerald-900/20 transition-all flex items-center gap-3 relative z-10">
                        <i data-lucide="globe" class="w-4 h-4"></i> RÉGULARISATION GLOBALE
                    </button>
                </div>
                
                <div class="mb-6 relative group">
                    <i data-lucide="search" class="w-5 h-5 absolute left-4 top-3.5 text-gray-500 group-focus-within:text-emerald-400 transition-colors"></i>
                    <input type="text" oninput="actions.staffSearch(this.value)" value="${state.staffSearchQuery}" 
                        placeholder="Rechercher un citoyen éligible..." 
                        class="glass-input pl-12 pr-4 py-3.5 rounded-2xl w-full text-sm bg-black/40 border-white/10 focus:border-emerald-500/30">
                </div>

                <div class="glass-panel overflow-hidden rounded-[32px] border border-white/5 bg-[#0a0a0a] shadow-2xl flex flex-col">
                     <table class="w-full text-left border-separate border-spacing-0">
                        <thead class="bg-black/40 text-[9px] uppercase text-gray-600 font-black tracking-widest sticky top-0 z-10">
                            <tr>
                                <th class="p-5 border-b border-white/5">Titulaire du Compte</th>
                                <th class="p-5 border-b border-white/5 text-right text-emerald-400">Fonds Bancaires</th>
                                <th class="p-5 border-b border-white/5 text-right text-blue-400">Espèces Physiques</th>
                                <th class="p-5 border-b border-white/5 text-right">Flux</th>
                            </tr>
                        </thead>
                        <tbody class="text-sm divide-y divide-white/5">
                            ${allChars.filter(c => c.status === 'accepted').map(c => `
                                <tr class="hover:bg-white/[0.03] transition-colors group">
                                    <td class="p-5">
                                        <div class="font-black text-white text-base uppercase italic tracking-tight group-hover:text-emerald-400 transition-colors">${c.first_name} ${c.last_name}</div>
                                        <div class="text-[9px] text-gray-600">@${c.discord_username}</div>
                                    </td>
                                    <td class="p-5 text-right font-mono font-bold text-white tracking-tighter text-lg">$${(c.bank_balance||0).toLocaleString()}</td>
                                    <td class="p-5 text-right font-mono font-bold text-gray-400 tracking-tighter">$${(c.cash_balance||0).toLocaleString()}</td>
                                    <td class="p-5 text-right">
                                        <button onclick="actions.openEconomyModal('${c.id}', '${c.first_name} ${c.last_name}')" class="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase text-gray-500 hover:text-white hover:bg-emerald-600 hover:border-emerald-500 transition-all tracking-widest shadow-lg">GÉRER</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }
    } else if (subTab === 'gangs') {
        subContent = `
            <div class="glass-panel overflow-hidden rounded-[32px] border border-white/5 bg-[#0a0a0a] shadow-2xl flex flex-col">
                <table class="w-full text-left border-separate border-spacing-0">
                    <thead class="bg-black/40 text-[9px] uppercase text-gray-600 font-black tracking-widest sticky top-0 z-10">
                        <tr>
                            <th class="p-5 border-b border-white/5">Syndicat du Crime</th>
                            <th class="p-5 border-b border-white/5">Commandement</th>
                            <th class="p-5 border-b border-white/5 text-right">Coffre Fort</th>
                            <th class="p-5 border-b border-white/5 text-right">Opérations</th>
                        </tr>
                    </thead>
                    <tbody class="text-sm divide-y divide-white/5">
                        ${state.gangs.map(g => `
                            <tr class="hover:bg-white/[0.03] transition-colors group">
                                <td class="p-5">
                                    <div class="font-black text-white text-base uppercase italic tracking-tight group-hover:text-purple-400 transition-colors">${g.name}</div>
                                    <div class="text-[9px] text-gray-600 uppercase font-black tracking-widest mt-1">Enregistrement Criminel</div>
                                </td>
                                <td class="p-5">
                                    <div class="text-[10px] font-black text-gray-400 uppercase tracking-widest">${g.leader ? g.leader.first_name + ' ' + g.leader.last_name : 'N/A'}</div>
                                </td>
                                <td class="p-5 text-right font-mono font-bold text-emerald-400 tracking-tighter text-lg">$${(g.balance || 0).toLocaleString()}</td>
                                <td class="p-5 text-right flex justify-end gap-2">
                                    <button onclick="actions.adminManageGangBalance('${g.id}', 'add')" class="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl hover:bg-emerald-600 hover:text-white transition-all border border-emerald-500/10 shadow-lg"><i data-lucide="plus" class="w-4 h-4"></i></button>
                                    <button onclick="actions.adminManageGangBalance('${g.id}', 'remove')" class="p-2.5 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-600 hover:text-white transition-all border border-red-500/10 shadow-lg"><i data-lucide="minus" class="w-4 h-4"></i></button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    return `
        <div class="flex flex-col h-full animate-fade-in gap-8">
            <!-- GRAPHS SECTION -->
            <div class="glass-panel p-10 rounded-[48px] border border-white/5 bg-gradient-to-br from-[#0c0c0e] to-black shadow-2xl relative overflow-hidden shrink-0">
                <div class="absolute -right-20 -top-20 w-96 h-96 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none"></div>
                <div class="flex flex-col md:flex-row justify-between items-end gap-6 mb-10 relative z-10">
                    <div>
                        <div class="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-[0.3em] border border-emerald-500/20 mb-3 rounded-lg">
                            <i data-lucide="pie-chart" class="w-3.5 h-3.5"></i> Masse Monétaire Consolidée
                        </div>
                        <h3 class="text-5xl font-black text-white italic uppercase tracking-tighter">$${totalMoneyVal.toLocaleString()}</h3>
                    </div>
                    <div class="flex gap-4">
                        <div class="bg-white/5 backdrop-blur-xl px-4 py-2 rounded-xl border border-white/5 text-center">
                            <div class="text-[8px] text-gray-500 uppercase font-black tracking-widest mb-0.5">Ratio Banque</div>
                            <div class="text-sm font-mono font-black text-emerald-400">${bankPercent.toFixed(1)}%</div>
                        </div>
                        <div class="bg-white/5 backdrop-blur-xl px-4 py-2 rounded-xl border border-white/5 text-center">
                            <div class="text-[8px] text-gray-500 uppercase font-black tracking-widest mb-0.5">Ratio Espèces</div>
                            <div class="text-sm font-mono font-black text-blue-400">${cashPercent.toFixed(1)}%</div>
                        </div>
                    </div>
                </div>

                <div class="h-4 w-full bg-white/5 rounded-full overflow-hidden flex shadow-inner relative z-10">
                    <div style="width: ${bankPercent}%" class="h-full bg-emerald-500 transition-all duration-1000 shadow-[0_0_20px_rgba(16,185,129,0.3)]"></div>
                    <div style="width: ${cashPercent}%" class="h-full bg-blue-500 transition-all duration-1000 shadow-[0_0_20px_rgba(59,130,246,0.3)]"></div>
                    <div style="width: ${gangPercent}%" class="h-full bg-purple-500 transition-all duration-1000"></div>
                    <div style="width: ${entPercent}%" class="h-full bg-indigo-600 transition-all duration-1000"></div>
                </div>

                <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8 relative z-10">
                    <div class="flex items-center gap-3"><div class="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-lg"></div><span class="text-[10px] text-gray-500 font-black uppercase tracking-widest">Compte Courant</span></div>
                    <div class="flex items-center gap-3"><div class="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-lg"></div><span class="text-[10px] text-gray-500 font-black uppercase tracking-widest">Liquidité Civile</span></div>
                    <div class="flex items-center gap-3"><div class="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-lg"></div><span class="text-[10px] text-gray-500 font-black uppercase tracking-widest">Coffres de Gang</span></div>
                    <div class="flex items-center gap-3"><div class="w-2.5 h-2.5 rounded-full bg-indigo-600 shadow-lg"></div><span class="text-[10px] text-gray-500 font-black uppercase tracking-widest">Actifs Corporatifs</span></div>
                </div>
            </div>

            <!-- SUB NAVIGATION -->
            <div class="flex gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/5 w-fit shrink-0">
                <button onclick="actions.setEconomySubTab('players')" class="px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${subTab === 'players' ? 'bg-white text-black shadow-xl shadow-white/10' : 'text-gray-500 hover:text-gray-300'}">Flux Citoyens</button>
                <button onclick="actions.setEconomySubTab('gangs')" class="px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${subTab === 'gangs' ? 'bg-purple-600 text-white shadow-xl shadow-purple-900/20' : 'text-gray-500 hover:text-gray-300'}">Flux Syndicats</button>
                <button onclick="actions.setEconomySubTab('enterprises')" class="px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${subTab === 'enterprises' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-900/20' : 'text-gray-500 hover:text-gray-300'}">Flux Entreprises</button>
                <button onclick="actions.setEconomySubTab('stats')" class="px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${subTab === 'stats' ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-900/20' : 'text-gray-500 hover:text-gray-300'}">Analytique</button>
            </div>

            <div class="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-2 pb-10">
                ${subContent}
            </div>
        </div>
    `;
};
