
import { state } from '../state.js';
import { CONFIG } from '../config.js';

const refreshBanner = `
    <div class="flex flex-col md:flex-row items-center justify-between px-4 py-3 mb-4 bg-blue-500/5 border-y border-blue-500/10 gap-3 shrink-0">
        <div class="text-xs text-blue-200 flex items-center gap-2">
             <div class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </div>
            <span><span class="font-bold">Registre du Commerce</span> • Terminal de Gestion</span>
        </div>
        <button onclick="actions.refreshCurrentView()" id="refresh-data-btn" class="text-xs text-blue-400 hover:text-white flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap">
            <i data-lucide="refresh-cw" class="w-3 h-3"></i> Actualiser
        </button>
    </div>
`;

export const EnterpriseView = () => {
    const tabs = [
        { id: 'market', label: 'Marché Public', icon: 'shopping-cart' },
        { id: 'my_companies', label: 'Mes Entreprises', icon: 'briefcase' }
    ];

    // Safe access to wallet
    const currentCash = state.bankAccount ? state.bankAccount.cash_balance : 0;
    const currentBank = state.bankAccount ? state.bankAccount.bank_balance : 0;

    let content = '';

    // --- MARKET TAB ---
    if (state.activeEnterpriseTab === 'market') {
        // CHECK SESSION CLOSED
        if (!state.activeGameSession) {
            content = `
                <div class="flex flex-col items-center justify-center h-full p-10 text-center animate-fade-in text-gray-500">
                    <i data-lucide="store" class="w-16 h-16 mb-4 opacity-20"></i>
                    <h2 class="text-xl font-bold text-white mb-2">Marché Fermé</h2>
                    <p class="text-sm">Les transactions commerciales sont suspendues hors session.</p>
                </div>
            `;
        } else {
            const items = state.enterpriseMarket || [];
            
            content = `
                <div class="flex flex-col h-full overflow-hidden animate-fade-in">
                    <!-- TOOLBAR -->
                    <div class="flex flex-col md:flex-row gap-4 mb-4 shrink-0">
                        <div class="relative flex-1">
                            <i data-lucide="search" class="w-4 h-4 absolute left-3 top-3 text-gray-500"></i>
                            <input type="text" placeholder="Rechercher produit..." class="glass-input pl-10 w-full p-2.5 rounded-xl text-sm bg-black/20 focus:bg-black/40">
                        </div>
                        <div class="flex items-center gap-4 px-4 py-2 bg-white/5 rounded-xl border border-white/5">
                            <div class="text-right">
                                <div class="text-[9px] text-gray-500 uppercase font-bold">Portefeuille</div>
                                <div class="text-sm font-mono font-bold text-emerald-400">$${currentCash.toLocaleString()}</div>
                            </div>
                            <div class="text-right pl-4 border-l border-white/10">
                                <div class="text-[9px] text-gray-500 uppercase font-bold">Banque</div>
                                <div class="text-sm font-mono font-bold text-blue-400">$${currentBank.toLocaleString()}</div>
                            </div>
                        </div>
                    </div>

                    <!-- GRID -->
                    <div class="flex-1 overflow-y-auto custom-scrollbar pr-2">
                        ${items.length === 0 ? '<div class="text-center text-gray-500 py-10 italic border border-dashed border-white/10 rounded-xl">Aucune offre sur le marché.</div>' : `
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                ${items.map(item => {
                                    // Payment Logic Check
                                    let canAfford = false;
                                    let paymentMethod = '';
                                    
                                    if (item.payment_type === 'cash_only' && currentCash >= item.price) { canAfford = true; paymentMethod = 'Espèces'; }
                                    else if (item.payment_type === 'bank_only' && currentBank >= item.price) { canAfford = true; paymentMethod = 'Banque'; }
                                    else if (item.payment_type === 'both') {
                                        if (currentCash >= item.price) { canAfford = true; paymentMethod = 'Espèces'; }
                                        else if (currentBank >= item.price) { canAfford = true; paymentMethod = 'Banque'; }
                                    }

                                    return `
                                    <div class="bg-white/5 rounded-xl border border-white/5 p-4 hover:border-blue-500/30 transition-all group flex flex-col relative overflow-hidden">
                                        <div class="flex justify-between items-start mb-2">
                                            <div class="w-10 h-10 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center text-gray-400">
                                                <i data-lucide="package" class="w-5 h-5"></i>
                                            </div>
                                            <div class="text-right">
                                                <div class="font-mono font-bold text-white text-lg">$${item.price.toLocaleString()}</div>
                                                <div class="text-[10px] text-gray-500 uppercase">Stock: ${item.quantity}</div>
                                            </div>
                                        </div>
                                        
                                        <div class="mb-3">
                                            <h4 class="font-bold text-white text-sm truncate" title="${item.name}">${item.name}</h4>
                                            <div class="text-xs text-blue-400 flex items-center gap-1 truncate">
                                                <i data-lucide="building-2" class="w-3 h-3"></i> ${item.enterprises?.name || 'Entreprise'}
                                            </div>
                                        </div>
                                        
                                        ${item.description ? `<div class="text-xs text-gray-500 bg-black/20 p-2 rounded mb-3 line-clamp-2 min-h-[2.5em]">"${item.description}"</div>` : ''}
                                        
                                        <div class="mt-auto pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                                            <div class="text-[9px] uppercase font-bold text-gray-500 bg-white/5 px-2 py-1 rounded border border-white/5">
                                                ${item.payment_type === 'both' ? 'Mixte' : item.payment_type === 'cash_only' ? 'Cash' : 'Banque'}
                                            </div>
                                            <button onclick="actions.buyItem('${item.id}', ${item.price})" ${!canAfford ? 'disabled' : ''} class="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${canAfford ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-white/5 text-gray-600 cursor-not-allowed'}">
                                                Acheter
                                            </button>
                                        </div>
                                    </div>
                                    `;
                                }).join('')}
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
            <div class="flex flex-col h-full overflow-hidden animate-fade-in">
                <div class="mb-4 flex justify-between items-center shrink-0">
                    <h3 class="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-wide">
                        <i data-lucide="briefcase" class="w-4 h-4 text-blue-400"></i> Vos Affiliations
                    </h3>
                </div>

                <div class="flex-1 overflow-y-auto custom-scrollbar pr-2">
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        ${state.myEnterprises.length === 0 ? '<div class="col-span-full text-center text-gray-500 py-10 italic border border-dashed border-white/10 rounded-xl">Vous n\'êtes employé d\'aucune entreprise.</div>' : ''}
                        ${state.myEnterprises.map(ent => `
                            <div class="bg-white/5 p-5 rounded-xl border border-white/5 hover:border-white/10 transition-all flex flex-col">
                                <div class="flex justify-between items-start mb-4">
                                    <div class="flex items-center gap-3">
                                        <div class="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold border border-blue-500/20">
                                            ${ent.name[0]}
                                        </div>
                                        <div>
                                            <h4 class="font-bold text-white text-base">${ent.name}</h4>
                                            <div class="text-xs text-gray-400 uppercase font-bold tracking-wider">${ent.myRank === 'leader' ? 'PDG' : ent.myRank === 'co_leader' ? 'Directeur' : 'Employé'}</div>
                                        </div>
                                    </div>
                                    <span class="px-2 py-0.5 rounded text-[10px] uppercase font-bold ${ent.myStatus === 'accepted' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'}">
                                        ${ent.myStatus === 'accepted' ? 'Actif' : 'En Attente'}
                                    </span>
                                </div>
                                
                                <div class="grid grid-cols-2 gap-2 text-xs mb-4">
                                    <div class="bg-black/30 p-2 rounded border border-white/5 text-center">
                                        <div class="text-gray-500 mb-0.5">Articles</div>
                                        <div class="text-white font-bold">${ent.items?.[0]?.count || 0}</div>
                                    </div>
                                    <div class="bg-black/30 p-2 rounded border border-white/5 text-center">
                                        <div class="text-gray-500 mb-0.5">Solde</div>
                                        <div class="text-emerald-400 font-mono font-bold">${ent.myRank === 'leader' ? '$' + (ent.balance||0).toLocaleString() : 'Masqué'}</div>
                                    </div>
                                </div>

                                <div class="mt-auto flex gap-2">
                                    ${ent.myStatus === 'accepted' ? `
                                        <button onclick="actions.openEnterpriseManagement('${ent.id}')" class="flex-1 glass-btn py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500">
                                            <i data-lucide="settings" class="w-3 h-3"></i> Gestion
                                        </button>
                                    ` : `
                                        <button disabled class="flex-1 bg-white/5 py-2 rounded-lg text-xs text-gray-500 cursor-not-allowed border border-white/5">En Attente</button>
                                    `}
                                    <button onclick="actions.quitEnterprise('${ent.id}')" class="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20 transition-colors" title="Démissionner">
                                        <i data-lucide="log-out" class="w-4 h-4"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    // --- MANAGEMENT VIEW (Dashboard) ---
    else if (state.activeEnterpriseTab === 'manage' && state.activeEnterpriseManagement) {
        const ent = state.activeEnterpriseManagement;
        const isLeader = ent.myRank === 'leader';
        const circulation = ent.circulation || [];

        return `
            <div class="h-full flex flex-col animate-fade-in">
                <!-- HEADER -->
                <div class="flex items-center justify-between mb-4 shrink-0 border-b border-white/5 pb-4">
                    <div class="flex items-center gap-4">
                        <button onclick="actions.setEnterpriseTab('my_companies')" class="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors border border-white/5">
                            <i data-lucide="arrow-left" class="w-5 h-5"></i>
                        </button>
                        <div>
                            <h2 class="text-xl font-bold text-white flex items-center gap-2">
                                ${ent.name}
                                <span class="text-xs bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded border border-blue-500/20 uppercase font-bold tracking-wider">Panel Gestion</span>
                            </h2>
                        </div>
                    </div>
                    <div class="text-right hidden md:block">
                        <div class="text-[10px] text-gray-500 uppercase font-bold">Trésorerie</div>
                        <div class="text-lg font-mono font-bold text-emerald-400">$ ${(ent.balance || 0).toLocaleString()}</div>
                    </div>
                </div>

                <!-- DASHBOARD GRID -->
                <div class="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                    
                    <!-- LEFT COL: FINANCE & RH -->
                    <div class="flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-1">
                        <!-- BANQUE -->
                        <div class="bg-white/5 border border-white/5 rounded-xl p-4">
                            <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <i data-lucide="landmark" class="w-4 h-4 text-emerald-500"></i> Opérations Bancaires
                            </h3>
                            <div class="grid grid-cols-2 gap-4">
                                <form onsubmit="actions.entDeposit(event)" class="flex gap-2">
                                    <div class="relative flex-1">
                                        <span class="absolute left-2 top-2 text-gray-500 text-xs">$</span>
                                        <input type="number" name="amount" placeholder="Dépôt" class="glass-input w-full py-1.5 pl-5 pr-2 rounded-lg text-xs font-mono bg-black/30" required min="1">
                                    </div>
                                    <button class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 p-1.5 rounded-lg transition-colors"><i data-lucide="arrow-down" class="w-4 h-4"></i></button>
                                </form>
                                ${isLeader ? `
                                    <form onsubmit="actions.entWithdraw(event)" class="flex gap-2">
                                        <div class="relative flex-1">
                                            <span class="absolute left-2 top-2 text-gray-500 text-xs">$</span>
                                            <input type="number" name="amount" placeholder="Retrait" class="glass-input w-full py-1.5 pl-5 pr-2 rounded-lg text-xs font-mono bg-black/30" required min="1">
                                        </div>
                                        <button class="bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 p-1.5 rounded-lg transition-colors"><i data-lucide="arrow-up" class="w-4 h-4"></i></button>
                                    </form>
                                ` : ''}
                            </div>
                        </div>

                        <!-- LISTE EMPLOYÉS -->
                        <div class="bg-white/5 border border-white/5 rounded-xl flex-1 flex flex-col min-h-[300px]">
                            <div class="p-4 border-b border-white/5 flex justify-between items-center">
                                <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                    <i data-lucide="users" class="w-4 h-4 text-blue-400"></i> Personnel (${ent.members.length})
                                </h3>
                            </div>
                            <div class="flex-1 overflow-y-auto custom-scrollbar p-0">
                                <table class="w-full text-left text-xs">
                                    <thead class="bg-black/20 text-gray-500 uppercase sticky top-0">
                                        <tr>
                                            <th class="p-3">Nom</th>
                                            <th class="p-3">Rang</th>
                                            <th class="p-3 text-right">Statut</th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-white/5">
                                        ${ent.members.map(m => `
                                            <tr class="hover:bg-white/5 transition-colors">
                                                <td class="p-3 font-medium text-white">${m.characters?.first_name} ${m.characters?.last_name}</td>
                                                <td class="p-3"><span class="bg-white/10 px-1.5 py-0.5 rounded text-[10px] uppercase text-gray-300">${m.rank}</span></td>
                                                <td class="p-3 text-right">
                                                    <span class="text-[10px] font-bold ${m.status === 'accepted' ? 'text-emerald-400' : 'text-orange-400'}">${m.status === 'accepted' ? 'Actif' : 'Attente'}</span>
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <!-- RIGHT COL: LOGISTICS -->
                    <div class="flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-1">
                        <!-- AJOUT ITEM -->
                        <div class="bg-white/5 border border-white/5 rounded-xl p-4">
                            <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <i data-lucide="package-plus" class="w-4 h-4 text-orange-400"></i> Mise en Vente
                            </h3>
                            <form onsubmit="actions.addItemToMarket(event)" class="space-y-3">
                                <div class="grid grid-cols-2 gap-3">
                                    <input type="text" name="name" placeholder="Nom Produit" class="glass-input p-2 rounded-lg text-xs w-full" required>
                                    <div class="relative">
                                        <span class="absolute left-2 top-2 text-gray-500 text-xs">$</span>
                                        <input type="number" name="price" placeholder="Prix Unitaire" class="glass-input p-2 pl-5 rounded-lg text-xs w-full font-mono" required>
                                    </div>
                                </div>
                                <div class="grid grid-cols-2 gap-3">
                                    <input type="number" name="quantity" placeholder="Quantité" class="glass-input p-2 rounded-lg text-xs w-full" required min="1">
                                    <select name="payment_type" class="glass-input p-2 rounded-lg text-xs w-full bg-black/40">
                                        <option value="both">Mixte</option>
                                        <option value="cash_only">Espèces</option>
                                        <option value="bank_only">Banque</option>
                                    </select>
                                </div>
                                <input type="text" name="description" placeholder="Description courte (Optionnel)" class="glass-input p-2 rounded-lg text-xs w-full">
                                <button type="submit" class="glass-btn w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500">
                                    <i data-lucide="plus" class="w-3 h-3"></i> Ajouter au Catalogue
                                </button>
                            </form>
                        </div>

                        <!-- LISTE STOCK -->
                        <div class="bg-white/5 border border-white/5 rounded-xl flex-1 flex flex-col min-h-[300px]">
                            <div class="p-4 border-b border-white/5 flex justify-between items-center">
                                <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                    <i data-lucide="list" class="w-4 h-4 text-purple-400"></i> Stock Actuel
                                </h3>
                            </div>
                            <div class="flex-1 overflow-y-auto custom-scrollbar p-0">
                                <table class="w-full text-left text-xs">
                                    <thead class="bg-black/20 text-gray-500 uppercase sticky top-0">
                                        <tr>
                                            <th class="p-3">Produit</th>
                                            <th class="p-3 text-right">Prix</th>
                                            <th class="p-3 text-center">Stock</th>
                                            <th class="p-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-white/5">
                                        ${ent.items.map(i => `
                                            <tr class="hover:bg-white/5 transition-colors group">
                                                <td class="p-3">
                                                    <div class="font-medium text-white ${i.is_hidden ? 'opacity-50' : ''}">${i.name}</div>
                                                    ${i.status === 'pending' ? '<span class="text-[9px] text-orange-400 uppercase font-bold">Validation</span>' : ''}
                                                </td>
                                                <td class="p-3 text-right font-mono text-emerald-400">$${i.price.toLocaleString()}</td>
                                                <td class="p-3 text-center text-white">${i.quantity}</td>
                                                <td class="p-3 text-right flex justify-end gap-1">
                                                    <button onclick="actions.restockItem('${i.id}')" class="p-1.5 bg-blue-500/10 text-blue-400 rounded hover:bg-blue-500/20"><i data-lucide="plus" class="w-3 h-3"></i></button>
                                                    <button onclick="actions.toggleItemVisibility('${i.id}', ${i.is_hidden})" class="p-1.5 bg-white/10 text-gray-400 rounded hover:bg-white/20"><i data-lucide="${i.is_hidden ? 'eye-off' : 'eye'}" class="w-3 h-3"></i></button>
                                                    <button onclick="actions.deleteItem('${i.id}')" class="p-1.5 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20"><i data-lucide="trash" class="w-3 h-3"></i></button>
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        `;
    }

    return `
        <div class="animate-fade-in max-w-7xl mx-auto h-full flex flex-col">
            ${refreshBanner}
            
            ${!state.activeEnterpriseManagement ? `
                <div class="flex gap-2 bg-white/5 p-1 rounded-xl overflow-x-auto max-w-full mb-4 shrink-0 border border-white/5">
                    ${tabs.map(t => `
                        <button onclick="actions.setEnterpriseTab('${t.id}')" 
                            class="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all whitespace-nowrap ${state.activeEnterpriseTab === t.id ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}">
                            <i data-lucide="${t.icon}" class="w-4 h-4"></i> ${t.label}
                        </button>
                    `).join('')}
                </div>
            ` : ''}

            <div class="flex-1 overflow-hidden relative overflow-y-auto custom-scrollbar p-1">
                ${content}
            </div>
        </div>
    `;
};
