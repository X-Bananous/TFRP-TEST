
import { state } from '../state.js';
import { CONFIG } from '../config.js';

const refreshBanner = `
    <div class="flex flex-col md:flex-row items-center justify-between p-4 mb-6 bg-blue-500/5 border border-blue-500/10 rounded-xl gap-3">
        <div class="text-xs text-blue-200 flex items-center gap-2">
             <i data-lucide="info" class="w-4 h-4 text-blue-400"></i>
            <span><span class="font-bold">Besoin d'actualiser ?</span> Vous ne trouvez pas ce que vous cherchez ?</span>
        </div>
        <button onclick="actions.refreshCurrentView()" id="refresh-data-btn" class="glass-btn-secondary px-3 py-1.5 rounded-lg text-xs hover:bg-blue-500/10 hover:text-blue-300 flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap w-full md:w-auto justify-center">
            <i data-lucide="refresh-cw" class="w-3 h-3"></i> Recharger les données
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
                ${refreshBanner}
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
            content = `
                <div class="space-y-6">
                    ${refreshBanner}
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="font-bold text-white flex items-center gap-2"><i data-lucide="store" class="w-5 h-5 text-blue-400"></i> Place de Marché</h3>
                        <div class="text-xs text-gray-400">Achats disponibles.</div>
                    </div>
                    
                    ${items.length === 0 ? '<div class="text-center text-gray-500 py-10 bg-white/5 rounded-xl border border-white/5">Aucune offre disponible.</div>' : `
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            ${items.map(item => `
                                <div class="glass-panel p-5 rounded-2xl border border-white/5 hover:border-blue-500/30 transition-all flex flex-col justify-between h-full">
                                    <div>
                                        <div class="flex justify-between items-start mb-2">
                                            <h4 class="font-bold text-white text-lg">${item.name}</h4>
                                            <span class="text-xs bg-white/10 px-2 py-1 rounded text-gray-300">x${item.quantity}</span>
                                        </div>
                                        <div class="text-xs text-blue-300 mb-4 font-bold uppercase tracking-wider">${item.enterprises?.name || 'Entreprise'}</div>
                                        ${item.description ? `<p class="text-sm text-gray-400 mb-4 bg-black/20 p-2 rounded italic">"${item.description}"</p>` : ''}
                                        
                                        <div class="flex gap-2 mb-4 text-[10px] text-gray-500 uppercase font-bold">
                                            ${item.payment_type === 'cash_only' ? '<span class="text-green-400 border border-green-500/30 px-1.5 rounded">Espèces</span>' : ''}
                                            ${item.payment_type === 'bank_only' ? '<span class="text-blue-400 border border-blue-500/30 px-1.5 rounded">Banque</span>' : ''}
                                            ${item.payment_type === 'both' ? '<span class="text-purple-400 border border-purple-500/30 px-1.5 rounded">Tout Paiement</span>' : ''}
                                        </div>
                                    </div>
                                    
                                    <div class="mt-auto">
                                        <div class="text-2xl font-mono font-bold text-white mb-2">$${item.price.toLocaleString()}</div>
                                        <button onclick="actions.buyItem('${item.id}', ${item.price})" class="glass-btn w-full py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                                            <i data-lucide="shopping-bag" class="w-4 h-4"></i> Acheter
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>
            `;
        }
    }

    // --- MY COMPANIES TAB ---
    else if (state.activeEnterpriseTab === 'my_companies') {
        content = `
            <div class="flex justify-between items-center mb-6">
                <h3 class="font-bold text-white">Vos Organisations</h3>
                <button onclick="actions.setEnterpriseTab('my_companies')" class="glass-btn-secondary px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 hover:bg-white/10">
                    <i data-lucide="refresh-cw" class="w-3 h-3"></i> Actualiser
                </button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                ${state.myEnterprises.length === 0 ? '<div class="col-span-2 text-center text-gray-500 py-10">Vous n\'êtes dans aucune entreprise.</div>' : ''}
                ${state.myEnterprises.map(ent => `
                    <div class="glass-panel p-6 rounded-2xl border border-blue-500/20 hover:border-blue-500/50 transition-all">
                        <div class="flex justify-between items-start mb-4">
                            <div class="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold text-xl">
                                ${ent.name[0]}
                            </div>
                            <span class="px-3 py-1 bg-white/5 rounded-full text-xs uppercase font-bold text-gray-300 border border-white/10">${ent.myRank}</span>
                        </div>
                        <h3 class="text-2xl font-bold text-white mb-6">${ent.name}</h3>
                        
                        <div class="flex gap-2">
                            ${ent.myStatus === 'accepted' ? `
                                <button onclick="actions.openEnterpriseManagement('${ent.id}')" class="glass-btn flex-1 py-2 rounded-xl font-bold text-sm">Gérer</button>
                            ` : `
                                <div class="flex-1 text-center text-sm text-gray-500 py-2 bg-black/20 rounded-xl">En attente...</div>
                            `}
                            <button onclick="actions.quitEnterprise('${ent.id}')" class="glass-btn-secondary px-3 rounded-xl text-red-400 hover:bg-red-500/10 border-red-500/20"><i data-lucide="log-out" class="w-4 h-4"></i></button>
                        </div>
                    </div>
                `).join('')}
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
                <div class="flex justify-between items-center mb-6">
                    <button onclick="actions.setEnterpriseTab('my_companies')" class="text-gray-400 hover:text-white flex items-center gap-2 text-sm"><i data-lucide="arrow-left" class="w-4 h-4"></i> Retour</button>
                    <div class="flex gap-3 items-center">
                        <h2 class="text-2xl font-bold text-white">${ent.name}</h2>
                        <button onclick="actions.openEnterpriseManagement('${ent.id}')" class="glass-btn-secondary p-2 rounded-lg text-gray-400 hover:text-white" title="Actualiser"><i data-lucide="refresh-cw" class="w-4 h-4"></i></button>
                    </div>
                    <div class="text-xs text-gray-500 uppercase font-bold tracking-widest hidden md:block">Interface de Gestion</div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
                    
                    <!-- LEFT COL: STATS & SAFE -->
                    <div class="space-y-6 flex flex-col">
                        <div class="glass-panel p-6 rounded-2xl bg-gradient-to-br from-blue-900/20 to-black border-blue-500/20">
                            <h3 class="font-bold text-white mb-4 flex items-center gap-2"><i data-lucide="vault" class="w-5 h-5 text-blue-400"></i> Coffre Entreprise</h3>
                            <div class="text-3xl font-mono font-bold text-white mb-6 text-center">$ ${(ent.balance || 0).toLocaleString()}</div>
                            
                            <div class="space-y-3">
                                <form onsubmit="actions.entDeposit(event)" class="flex gap-2">
                                    <input type="number" name="amount" placeholder="Dépôt" class="glass-input flex-1 p-2 rounded-lg text-sm" min="1" required>
                                    <button class="glass-btn-secondary px-3 rounded-lg text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"><i data-lucide="arrow-down" class="w-4 h-4"></i></button>
                                </form>
                                ${isLeader ? `
                                    <form onsubmit="actions.entWithdraw(event)" class="flex gap-2">
                                        <input type="number" name="amount" placeholder="Retrait (Max 100k)" class="glass-input flex-1 p-2 rounded-lg text-sm" min="1" required>
                                        <button class="glass-btn-secondary px-3 rounded-lg text-red-400 border-red-500/30 hover:bg-red-500/10"><i data-lucide="arrow-up" class="w-4 h-4"></i></button>
                                    </form>
                                ` : ''}
                            </div>
                        </div>

                        <div class="glass-panel p-6 rounded-2xl flex-1 flex flex-col min-h-0">
                            <h3 class="font-bold text-white mb-4">Employés (${ent.members.length})</h3>
                            <div class="space-y-2 flex-1 overflow-y-auto custom-scrollbar">
                                ${ent.members.map(m => `
                                    <div class="flex justify-between items-center text-sm p-2 bg-white/5 rounded-lg">
                                        <span class="text-gray-300">${m.characters?.first_name} ${m.characters?.last_name}</span>
                                        <span class="text-[10px] uppercase font-bold text-blue-300">${m.rank}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>

                    <!-- RIGHT COL: CREATE ITEM & LIST -->
                    <div class="lg:col-span-2 glass-panel p-6 rounded-2xl flex flex-col overflow-hidden">
                        
                        <!-- TABS INTERNAL -->
                        <div class="flex gap-4 mb-4 border-b border-white/5 pb-2">
                            <h3 class="font-bold text-white flex items-center gap-2 cursor-default"><i data-lucide="package-plus" class="w-5 h-5 text-blue-400"></i> Ventes & Stock</h3>
                            ${isLeader ? `<div class="ml-auto text-xs text-gray-500 flex items-center gap-1"><i data-lucide="radar" class="w-3 h-3"></i> ${circulation.length} Items en circulation</div>` : ''}
                        </div>
                        
                        <form onsubmit="actions.addItemToMarket(event)" class="bg-white/5 p-4 rounded-xl border border-white/5 mb-6">
                            <div class="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label class="text-[10px] text-gray-500 uppercase font-bold">Nom Article</label>
                                    <input type="text" name="name" class="glass-input w-full p-2 rounded-lg text-sm" placeholder="Unique" required>
                                </div>
                                <div>
                                    <label class="text-[10px] text-gray-500 uppercase font-bold">Prix Unitaire ($)</label>
                                    <input type="number" name="price" class="glass-input w-full p-2 rounded-lg text-sm" max="1000000" required>
                                </div>
                            </div>
                            <div class="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label class="text-[10px] text-gray-500 uppercase font-bold">Quantité</label>
                                    <input type="number" name="quantity" class="glass-input w-full p-2 rounded-lg text-sm" min="1" required>
                                </div>
                                <div>
                                    <label class="text-[10px] text-gray-500 uppercase font-bold">Type Paiement</label>
                                    <select name="payment_type" class="glass-input w-full p-2 rounded-lg text-sm bg-black/40">
                                        <option value="both">Espèces & Banque</option>
                                        <option value="cash_only">Espèces Uniquement</option>
                                        <option value="bank_only">Banque Uniquement</option>
                                    </select>
                                </div>
                            </div>
                            <div class="mb-4">
                                <label class="text-[10px] text-gray-500 uppercase font-bold">Description (Optionnel)</label>
                                <input type="text" name="description" class="glass-input w-full p-2 rounded-lg text-sm">
                            </div>
                            <button type="submit" class="glass-btn w-full py-2 rounded-lg text-sm font-bold">Mettre en Vente (Validation Staff Requise)</button>
                        </form>

                        <div class="flex-1 overflow-y-auto custom-scrollbar">
                            <!-- ITEM LIST -->
                            <table class="w-full text-left text-sm mb-8">
                                <thead class="text-gray-500 uppercase text-xs sticky top-0 bg-[#151515]">
                                    <tr>
                                        <th class="pb-2">Article</th>
                                        <th class="pb-2">Prix</th>
                                        <th class="pb-2">Stock</th>
                                        <th class="pb-2">Statut</th>
                                        <th class="pb-2 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-white/5">
                                    ${ent.items.map(i => {
                                        const isHidden = i.is_hidden;
                                        const isPending = i.status === 'pending';
                                        const isApproved = i.status === 'approved';
                                        const isSoldOut = i.quantity === 0;
                                        
                                        return `
                                        <tr class="${isSoldOut ? 'bg-red-500/5' : ''}">
                                            <td class="py-3 text-white">
                                                ${i.name}
                                                ${isHidden ? '<span class="text-[9px] bg-gray-600 px-1 rounded ml-2">Masqué</span>' : ''}
                                                ${isSoldOut ? '<span class="text-[9px] bg-red-500 text-white px-1 rounded ml-2 font-bold uppercase">Rupture</span>' : ''}
                                            </td>
                                            <td class="py-3 font-mono text-emerald-400">$${i.price.toLocaleString()}</td>
                                            <td class="py-3 text-gray-300 font-bold">${i.quantity}</td>
                                            <td class="py-3">
                                                <span class="text-[9px] uppercase font-bold px-2 py-0.5 rounded ${isPending ? 'bg-orange-500/20 text-orange-400' : isApproved ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}">
                                                    ${isPending ? 'En Attente' : isApproved ? 'Approuvé' : 'Rejeté'}
                                                </span>
                                            </td>
                                            <td class="py-3 text-right flex justify-end gap-2">
                                                ${!isPending ? `
                                                    <button onclick="actions.restockItem('${i.id}')" class="text-xs p-1 bg-blue-500/10 text-blue-400 rounded hover:bg-blue-500/20" title="Réapprovisionner">
                                                        <i data-lucide="refresh-cw" class="w-4 h-4"></i>
                                                    </button>
                                                    <button onclick="actions.toggleItemVisibility('${i.id}', ${isHidden})" class="text-xs p-1 bg-white/10 rounded hover:bg-white/20" title="${isHidden ? 'Afficher' : 'Masquer'}">
                                                        <i data-lucide="${isHidden ? 'eye' : 'eye-off'}" class="w-4 h-4"></i>
                                                    </button>
                                                ` : ''}
                                                <button onclick="actions.deleteItem('${i.id}')" class="text-xs p-1 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20" title="Supprimer">
                                                    <i data-lucide="trash" class="w-4 h-4"></i>
                                                </button>
                                            </td>
                                        </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>

                            <!-- CIRCULATION TABLE (Leaders Only) -->
                            ${isLeader && circulation.length > 0 ? `
                                <div class="border-t border-white/10 pt-4">
                                    <h4 class="font-bold text-white mb-2 text-sm flex items-center gap-2"><i data-lucide="users" class="w-4 h-4 text-purple-400"></i> Suivi des produits (Inventaires Citoyens)</h4>
                                    <table class="w-full text-left text-xs bg-black/20 rounded-lg overflow-hidden">
                                        <thead class="text-gray-500 uppercase bg-black/40">
                                            <tr>
                                                <th class="p-2">Produit</th>
                                                <th class="p-2">Propriétaire</th>
                                                <th class="p-2 text-right">Qté Possédée</th>
                                            </tr>
                                        </thead>
                                        <tbody class="divide-y divide-white/5">
                                            ${circulation.map(c => `
                                                <tr>
                                                    <td class="p-2 text-white font-medium">${c.name}</td>
                                                    <td class="p-2 text-gray-400">${c.characters?.first_name} ${c.characters?.last_name}</td>
                                                    <td class="p-2 text-right font-bold text-white">${c.quantity}</td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
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
            <div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div>
                    <h2 class="text-2xl font-bold text-white flex items-center gap-2">
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
