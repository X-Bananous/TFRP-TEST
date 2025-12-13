
import { state } from '../state.js';
import { CONFIG } from '../config.js';

const refreshBanner = `
    <div class="flex flex-col md:flex-row items-center justify-between px-4 py-3 mb-4 bg-blue-900/10 border-y border-blue-500/10 gap-3 shrink-0">
        <div class="text-xs text-blue-200 flex items-center gap-2">
             <div class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </div>
            <span><span class="font-bold">Registre Commercial</span> • Place de Marché V3.0</span>
        </div>
        <button onclick="actions.refreshCurrentView()" id="refresh-data-btn" class="text-xs text-blue-400 hover:text-white flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap">
            <i data-lucide="refresh-cw" class="w-3 h-3"></i> Actualiser
        </button>
    </div>
`;

export const EnterpriseView = () => {
    const tabs = [
        { id: 'market', label: 'Marché', icon: 'shopping-cart' },
        { id: 'my_companies', label: 'Mes Entreprises', icon: 'building' }
    ];

    let content = '';

    // --- MARKET TAB ---
    if (state.activeEnterpriseTab === 'market') {
        
        // CHECK SESSION CLOSED
        if (!state.activeGameSession) {
            content = `
                <div class="flex flex-col items-center justify-center h-full p-10 text-center animate-fade-in">
                    <div class="w-24 h-24 bg-blue-900/20 rounded-full flex items-center justify-center text-blue-500 mb-6 border border-blue-500/20">
                        <i data-lucide="store" class="w-12 h-12"></i>
                    </div>
                    <h2 class="text-3xl font-bold text-white mb-4">Marché Fermé</h2>
                    <p class="text-gray-400 max-w-md mx-auto leading-relaxed">
                        Les échanges commerciaux et les achats d'entreprise sont suspendus en dehors des sessions de jeu actives.
                    </p>
                    <div class="mt-8 bg-white/5 px-4 py-2 rounded-lg text-sm text-gray-500 border border-white/5">
                        Statut : <span class="text-red-400 font-bold uppercase">Fermé</span>
                    </div>
                </div>
            `;
        } else {
            const items = state.enterpriseMarket || [];
            
            // Economy Stats Display
            const todayStats = state.dailyEconomyStats?.[0] || { amount: 0 };
            const volumeToday = todayStats.amount;

            content = `
                <div class="space-y-8 animate-fade-in">
                    <!-- Top Stats Card -->
                    <div class="glass-card p-8 rounded-[30px] bg-gradient-to-r from-blue-900/40 via-[#0c0c14] to-black border-blue-500/20 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
                        <div class="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] -mr-20 -mt-20 pointer-events-none"></div>
                        
                        <div class="relative z-10 text-center md:text-left">
                            <div class="flex items-center gap-3 justify-center md:justify-start mb-2">
                                <i data-lucide="bar-chart-3" class="w-6 h-6 text-blue-400"></i>
                                <span class="text-sm font-bold text-blue-300 uppercase tracking-widest">Volume Économique Journalier</span>
                            </div>
                            <div class="text-5xl font-bold text-white tracking-tighter shadow-black drop-shadow-xl">$ ${volumeToday.toLocaleString()}</div>
                            <p class="text-blue-400/60 text-xs font-medium mt-2">Montant total des échanges sur le serveur aujourd'hui.</p>
                        </div>

                        <div class="flex gap-4 relative z-10">
                            <div class="bg-black/40 backdrop-blur px-6 py-4 rounded-2xl border border-white/5 text-center min-w-[140px]">
                                <div class="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Offres</div>
                                <div class="font-mono font-bold text-white text-lg">${items.length}</div>
                            </div>
                            <div class="bg-black/40 backdrop-blur px-6 py-4 rounded-2xl border border-white/5 text-center min-w-[140px]">
                                <div class="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Mon Solde</div>
                                <div class="font-mono font-bold text-emerald-400 text-lg">$ ${state.bankAccount.cash_balance.toLocaleString()}</div>
                            </div>
                        </div>
                    </div>

                    <!-- Market Grid -->
                    <div>
                        <h3 class="font-bold text-white flex items-center gap-2 mb-6 text-lg"><i data-lucide="store" class="w-5 h-5 text-gray-400"></i> Place de Marché</h3>
                        
                        ${items.length === 0 ? '<div class="text-center text-gray-500 py-10 bg-white/5 rounded-2xl border border-dashed border-white/5">Aucune offre disponible actuellement.</div>' : `
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                ${items.map(item => `
                                    <div class="glass-panel p-6 rounded-2xl border border-white/5 hover:border-blue-500/30 transition-all group flex flex-col justify-between h-full relative overflow-hidden">
                                        <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        
                                        <div>
                                            <div class="flex justify-between items-start mb-4">
                                                <div class="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-gray-400 group-hover:text-white transition-colors border border-white/5">
                                                    <i data-lucide="shopping-bag" class="w-6 h-6"></i>
                                                </div>
                                                <span class="text-xs bg-white/10 px-2 py-1 rounded text-gray-300 font-mono">x${item.quantity}</span>
                                            </div>
                                            
                                            <h4 class="font-bold text-white text-lg mb-1 truncate">${item.name}</h4>
                                            <div class="text-xs text-blue-300 mb-4 font-bold uppercase tracking-wider flex items-center gap-1">
                                                <i data-lucide="building-2" class="w-3 h-3"></i>
                                                ${item.enterprises?.name || 'Entreprise'}
                                            </div>
                                            
                                            ${item.description ? `<p class="text-sm text-gray-400 mb-4 bg-black/20 p-3 rounded-lg border border-white/5 italic line-clamp-2">"${item.description}"</p>` : ''}
                                            
                                            <div class="flex flex-wrap gap-2 mb-6">
                                                ${item.payment_type === 'cash_only' || item.payment_type === 'both' ? '<span class="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded uppercase">Espèces</span>' : ''}
                                                ${item.payment_type === 'bank_only' || item.payment_type === 'both' ? '<span class="text-[9px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded uppercase">Banque</span>' : ''}
                                            </div>
                                        </div>
                                        
                                        <div class="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                                            <div class="text-xl font-mono font-bold text-white">$${item.price.toLocaleString()}</div>
                                            <button onclick="actions.buyItem('${item.id}', ${item.price})" class="glass-btn px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:scale-105 transition-transform">
                                                Acheter
                                            </button>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        `}
                    </div>
                </div>
            `;
        }
    }

    // --- MY COMPANIES TAB ---
    else if (state.activeEnterpriseTab === 'my_companies') {
        content = `
            <div class="animate-fade-in space-y-6">
                <div class="text-center mb-8">
                    <h2 class="text-3xl font-bold text-white tracking-tight">Mes Activités</h2>
                    <p class="text-gray-400 text-sm mt-1">Gérez vos sociétés et votre statut d'employé.</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                    ${state.myEnterprises.length === 0 ? '<div class="col-span-full text-center text-gray-500 py-10 bg-white/5 rounded-2xl border border-dashed border-white/10">Vous n\'êtes membre d\'aucune entreprise.</div>' : ''}
                    ${state.myEnterprises.map(ent => `
                        <div class="glass-panel p-6 rounded-2xl border border-blue-500/20 hover:border-blue-500/50 transition-all flex flex-col relative overflow-hidden group">
                            <div class="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110 duration-500"></div>
                            
                            <div class="flex justify-between items-start mb-6 relative z-10">
                                <div class="w-14 h-14 rounded-xl bg-blue-900/20 flex items-center justify-center text-blue-400 font-bold text-2xl border border-blue-500/20 shadow-lg">
                                    ${ent.name[0]}
                                </div>
                                <span class="px-3 py-1 bg-white/10 rounded-full text-xs uppercase font-bold text-gray-300 border border-white/10 backdrop-blur-md">${ent.myRank}</span>
                            </div>
                            
                            <h3 class="text-2xl font-bold text-white mb-2 truncate relative z-10">${ent.name}</h3>
                            <div class="text-xs text-gray-500 mb-8 relative z-10">Statut: ${ent.myStatus === 'accepted' ? '<span class="text-green-400">Actif</span>' : '<span class="text-orange-400">En Attente</span>'}</div>
                            
                            <div class="mt-auto flex gap-3 relative z-10">
                                ${ent.myStatus === 'accepted' ? `
                                    <button onclick="actions.openEnterpriseManagement('${ent.id}')" class="glass-btn flex-1 py-3 rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20">Accéder</button>
                                ` : `
                                    <div class="flex-1 text-center text-sm text-gray-500 py-3 bg-black/20 rounded-xl border border-white/5">En attente...</div>
                                `}
                                <button onclick="actions.quitEnterprise('${ent.id}')" class="p-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20 transition-colors" title="Démissionner"><i data-lucide="log-out" class="w-5 h-5"></i></button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // --- MANAGEMENT VIEW (Sub-view) ---
    else if (state.activeEnterpriseTab === 'manage' && state.activeEnterpriseManagement) {
        const ent = state.activeEnterpriseManagement;
        const isLeader = ent.myRank === 'leader';
        const circulation = ent.circulation || [];

        return `
            <div class="h-full flex flex-col animate-fade-in">
                <div class="flex justify-between items-center mb-6 shrink-0 border-b border-white/5 pb-4">
                    <div class="flex items-center gap-4">
                        <button onclick="actions.setEnterpriseTab('my_companies')" class="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                            <i data-lucide="arrow-left" class="w-5 h-5"></i>
                        </button>
                        <div>
                            <h2 class="text-2xl font-bold text-white">${ent.name}</h2>
                            <p class="text-xs text-gray-400 uppercase tracking-widest">Interface de Gestion</p>
                        </div>
                    </div>
                    <button onclick="actions.refreshCurrentView()" class="glass-btn-secondary px-3 py-1.5 rounded-lg text-xs flex items-center gap-2"><i data-lucide="refresh-cw" class="w-3 h-3"></i></button>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden min-h-0">
                    
                    <!-- LEFT COL: STATS & SAFE -->
                    <div class="space-y-6 flex flex-col overflow-y-auto custom-scrollbar pr-2">
                        <div class="glass-panel p-6 rounded-2xl bg-gradient-to-br from-blue-900/20 to-black border-blue-500/20 shadow-lg relative overflow-hidden shrink-0">
                            <div class="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                            
                            <h3 class="font-bold text-white mb-6 flex items-center gap-2 relative z-10 text-sm uppercase tracking-wider">
                                <i data-lucide="vault" class="w-4 h-4 text-blue-400"></i> Trésorerie
                            </h3>
                            <div class="text-4xl font-mono font-bold text-white mb-8 text-center tracking-tight drop-shadow-md">$ ${(ent.balance || 0).toLocaleString()}</div>
                            
                            <div class="space-y-3 relative z-10">
                                <form onsubmit="actions.entDeposit(event)" class="flex gap-2">
                                    <input type="number" name="amount" placeholder="Montant Dépôt" class="glass-input flex-1 p-3 rounded-xl text-sm bg-black/40 border-white/10 focus:border-blue-500/50" required min="1">
                                    <button class="glass-btn-secondary bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 px-4 rounded-xl border-emerald-500/20 transition-all"><i data-lucide="arrow-down" class="w-5 h-5"></i></button>
                                </form>
                                ${isLeader ? `
                                    <form onsubmit="actions.entWithdraw(event)" class="flex gap-2">
                                        <input type="number" name="amount" placeholder="Montant Retrait" class="glass-input flex-1 p-3 rounded-xl text-sm bg-black/40 border-white/10 focus:border-blue-500/50" required min="1">
                                        <button class="glass-btn-secondary bg-red-500/10 text-red-400 hover:bg-red-500/20 px-4 rounded-xl border-red-500/20 transition-all"><i data-lucide="arrow-up" class="w-5 h-5"></i></button>
                                    </form>
                                ` : ''}
                            </div>
                        </div>

                        <div class="glass-panel p-6 rounded-2xl flex-1 flex flex-col border border-white/5">
                            <h3 class="font-bold text-white mb-4 text-sm uppercase tracking-wider flex items-center justify-between">
                                Personnel
                                <span class="text-xs bg-white/10 px-2 py-0.5 rounded text-gray-400">${ent.members.length}</span>
                            </h3>
                            <div class="space-y-2 flex-1 overflow-y-auto custom-scrollbar">
                                ${ent.members.map(m => `
                                    <div class="flex justify-between items-center text-sm p-3 bg-white/5 rounded-xl border border-white/5">
                                        <div class="flex items-center gap-2">
                                            <div class="w-6 h-6 rounded bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-500">${m.characters?.first_name[0]}</div>
                                            <span class="text-gray-200 font-medium">${m.characters?.first_name} ${m.characters?.last_name}</span>
                                        </div>
                                        <span class="text-[10px] uppercase font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">${m.rank}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>

                    <!-- RIGHT COL: CREATE ITEM & LIST -->
                    <div class="lg:col-span-2 glass-panel p-0 rounded-2xl flex flex-col overflow-hidden border border-white/5">
                        <div class="p-6 border-b border-white/5 bg-[#0a0a0a]">
                            <div class="flex gap-4 mb-6">
                                <h3 class="font-bold text-white flex items-center gap-2 cursor-default text-lg"><i data-lucide="package-plus" class="w-5 h-5 text-blue-400"></i> Gestion des Stocks</h3>
                                ${isLeader ? `<div class="ml-auto text-xs text-gray-500 flex items-center gap-1 bg-white/5 px-3 py-1 rounded-full border border-white/5"><i data-lucide="radar" class="w-3 h-3"></i> ${circulation.length} Items en circulation</div>` : ''}
                            </div>
                            
                            <form onsubmit="actions.addItemToMarket(event)" class="bg-black/20 p-5 rounded-xl border border-white/5">
                                <div class="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label class="text-[10px] text-gray-500 uppercase font-bold mb-1 block ml-1">Nom Article</label>
                                        <input type="text" name="name" class="glass-input w-full p-2.5 rounded-lg text-sm" placeholder="Nom unique..." required>
                                    </div>
                                    <div>
                                        <label class="text-[10px] text-gray-500 uppercase font-bold mb-1 block ml-1">Prix Unitaire</label>
                                        <div class="relative">
                                            <span class="absolute left-3 top-2.5 text-gray-500">$</span>
                                            <input type="number" name="price" class="glass-input w-full p-2.5 pl-6 rounded-lg text-sm font-mono" max="1000000" required>
                                        </div>
                                    </div>
                                </div>
                                <div class="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label class="text-[10px] text-gray-500 uppercase font-bold mb-1 block ml-1">Quantité</label>
                                        <input type="number" name="quantity" class="glass-input w-full p-2.5 rounded-lg text-sm" min="1" required>
                                    </div>
                                    <div>
                                        <label class="text-[10px] text-gray-500 uppercase font-bold mb-1 block ml-1">Type Paiement</label>
                                        <select name="payment_type" class="glass-input w-full p-2.5 rounded-lg text-sm bg-black/40">
                                            <option value="both">Espèces & Banque</option>
                                            <option value="cash_only">Espèces Uniquement</option>
                                            <option value="bank_only">Banque Uniquement</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="mb-4">
                                    <label class="text-[10px] text-gray-500 uppercase font-bold mb-1 block ml-1">Description (Optionnel)</label>
                                    <input type="text" name="description" class="glass-input w-full p-2.5 rounded-lg text-sm" placeholder="Détails...">
                                </div>
                                <button type="submit" class="glass-btn w-full py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2">
                                    <i data-lucide="plus-circle" class="w-4 h-4"></i> Mettre en Vente (Validation Staff)
                                </button>
                            </form>
                        </div>

                        <div class="flex-1 overflow-y-auto custom-scrollbar bg-[#080808] p-6">
                            <table class="w-full text-left text-sm mb-8 border-separate border-spacing-y-2">
                                <thead class="text-gray-500 uppercase text-xs sticky top-0 bg-[#080808] z-10">
                                    <tr>
                                        <th class="pb-2 pl-2">Article</th>
                                        <th class="pb-2">Prix</th>
                                        <th class="pb-2">Stock</th>
                                        <th class="pb-2">Statut</th>
                                        <th class="pb-2 text-right pr-2">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${ent.items.map(i => {
                                        const isHidden = i.is_hidden;
                                        const isPending = i.status === 'pending';
                                        const isApproved = i.status === 'approved';
                                        const isSoldOut = i.quantity === 0;
                                        
                                        return `
                                        <tr class="bg-white/5 hover:bg-white/10 transition-colors group rounded-lg">
                                            <td class="py-3 pl-4 rounded-l-lg text-white font-medium">
                                                <div class="flex items-center gap-2">
                                                    ${i.name}
                                                    ${isHidden ? '<span class="text-[9px] bg-gray-600 px-1.5 py-0.5 rounded text-gray-300">Masqué</span>' : ''}
                                                    ${isSoldOut ? '<span class="text-[9px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-bold uppercase">Rupture</span>' : ''}
                                                </div>
                                            </td>
                                            <td class="py-3 font-mono text-emerald-400 font-bold">$${i.price.toLocaleString()}</td>
                                            <td class="py-3 text-gray-300">${i.quantity}</td>
                                            <td class="py-3">
                                                <span class="text-[9px] uppercase font-bold px-2 py-0.5 rounded ${isPending ? 'bg-orange-500/20 text-orange-400' : isApproved ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}">
                                                    ${isPending ? 'Validation' : isApproved ? 'Actif' : 'Rejeté'}
                                                </span>
                                            </td>
                                            <td class="py-3 pr-4 rounded-r-lg text-right flex justify-end gap-2 items-center h-full">
                                                ${!isPending ? `
                                                    <button onclick="actions.restockItem('${i.id}')" class="p-1.5 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-colors" title="Réapprovisionner">
                                                        <i data-lucide="refresh-cw" class="w-3 h-3"></i>
                                                    </button>
                                                    <button onclick="actions.toggleItemVisibility('${i.id}', ${isHidden})" class="p-1.5 bg-white/10 text-gray-400 rounded-lg hover:bg-white/20 transition-colors" title="${isHidden ? 'Afficher' : 'Masquer'}">
                                                        <i data-lucide="${isHidden ? 'eye' : 'eye-off'}" class="w-3 h-3"></i>
                                                    </button>
                                                ` : ''}
                                                <button onclick="actions.deleteItem('${i.id}')" class="p-1.5 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors" title="Supprimer">
                                                    <i data-lucide="trash" class="w-3 h-3"></i>
                                                </button>
                                            </td>
                                        </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>

                            <!-- CIRCULATION TABLE (Leaders Only) -->
                            ${isLeader && circulation.length > 0 ? `
                                <div class="border-t border-white/10 pt-6">
                                    <h4 class="font-bold text-white mb-4 text-sm flex items-center gap-2 uppercase tracking-wide"><i data-lucide="users" class="w-4 h-4 text-purple-400"></i> Suivi Clientèle</h4>
                                    <div class="bg-black/20 rounded-xl overflow-hidden border border-white/5">
                                        <table class="w-full text-left text-xs">
                                            <thead class="text-gray-500 uppercase bg-black/40">
                                                <tr>
                                                    <th class="p-3">Produit</th>
                                                    <th class="p-3">Propriétaire</th>
                                                    <th class="p-3 text-right">Qté Possédée</th>
                                                </tr>
                                            </thead>
                                            <tbody class="divide-y divide-white/5">
                                                ${circulation.map(c => `
                                                    <tr class="hover:bg-white/5">
                                                        <td class="p-3 text-white font-medium">${c.name}</td>
                                                        <td class="p-3 text-gray-400">${c.characters?.first_name} ${c.characters?.last_name}</td>
                                                        <td class="p-3 text-right font-bold text-white">${c.quantity}</td>
                                                    </tr>
                                                `).join('')}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    </div>

                </div>
            </div>
        `;
    }

    return `
        <div class="animate-fade-in max-w-7xl mx-auto h-full flex flex-col">
            <!-- HEADER NAV -->
            <div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 border-b border-white/5 pb-4">
                <div>
                    ${refreshBanner}
                    <h2 class="text-2xl font-bold text-white flex items-center gap-2 mt-4">
                        <i data-lucide="building-2" class="w-6 h-6 text-blue-500"></i>
                        Espace Entreprises
                    </h2>
                    <p class="text-gray-400 text-sm">Gestion commerciale et services</p>
                </div>
                <div class="flex gap-2 bg-white/5 p-1 rounded-xl overflow-x-auto max-w-full">
                    ${tabs.map(t => `
                        <button onclick="actions.setEnterpriseTab('${t.id}')" 
                            class="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all whitespace-nowrap ${state.activeEnterpriseTab === t.id ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}">
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
