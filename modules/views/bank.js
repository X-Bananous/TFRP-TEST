

import { state } from '../state.js';

export const BankView = () => {
    if (!state.bankAccount) return '<div class="p-8 text-center text-gray-500 flex flex-col items-center justify-center h-full"><div class="loader-spinner mb-4"></div>Chargement de la banque...</div>';
    
    // TAB NAVIGATION
    const tabs = [
        { id: 'overview', label: 'Aperçu', icon: 'layout-grid' },
        { id: 'operations', label: 'Opérations', icon: 'arrow-left-right' },
        { id: 'history', label: 'Relevé Bancaire', icon: 'history' }
    ];

    let content = '';

    // --- TAB: OVERVIEW ---
    if (state.activeBankTab === 'overview') {
        content = `
            <div class="space-y-6">
                 <!-- Cards Grid -->
                 <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="glass-card p-6 rounded-[30px] bg-gradient-to-br from-emerald-900/40 to-black border-emerald-500/20 relative overflow-hidden">
                        <div class="absolute -right-6 -top-6 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl"></div>
                        <div class="flex items-center gap-3 mb-2">
                            <i data-lucide="landmark" class="w-5 h-5 text-emerald-400"></i>
                            <span class="text-sm font-bold text-emerald-400 uppercase tracking-wider">Compte Courant</span>
                        </div>
                        <div class="text-4xl font-bold text-white tracking-tight">$ ${state.bankAccount.bank_balance.toLocaleString()}</div>
                        <p class="text-emerald-500/60 text-xs mt-2 font-mono">IBAN: TFRP-${state.activeCharacter.id.substring(0,6).toUpperCase()}</p>
                    </div>

                    <div class="glass-card p-6 rounded-[30px] border-white/10 relative overflow-hidden">
                        <div class="absolute -right-6 -top-6 w-32 h-32 bg-gray-500/10 rounded-full blur-3xl"></div>
                        <div class="flex items-center gap-3 mb-2">
                            <i data-lucide="wallet" class="w-5 h-5 text-gray-400"></i>
                            <span class="text-sm font-bold text-gray-400 uppercase tracking-wider">Portefeuille</span>
                        </div>
                        <div class="text-4xl font-bold text-white tracking-tight">$ ${state.bankAccount.cash_balance.toLocaleString()}</div>
                        <p class="text-gray-600 text-xs mt-2">Argent liquide disponible</p>
                    </div>
                </div>

                <!-- Quick Actions (Deposit/Withdraw) -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Deposit -->
                    <form onsubmit="actions.bankDeposit(event)" class="glass-panel p-6 rounded-2xl flex flex-col gap-4">
                        <div class="flex items-center gap-2 text-white font-bold">
                            <i data-lucide="arrow-down-left" class="w-5 h-5 text-emerald-400"></i> Dépôt
                        </div>
                        <p class="text-xs text-gray-400">Déposer du liquide sur votre compte.</p>
                        <div class="flex gap-2">
                            <input type="number" name="amount" placeholder="Montant" min="1" max="${state.bankAccount.cash_balance}" class="glass-input p-3 rounded-lg w-full" required>
                            <button type="submit" class="glass-btn-secondary bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20 px-4 rounded-lg font-semibold text-sm cursor-pointer transition-colors"><i data-lucide="check" class="w-4 h-4"></i></button>
                        </div>
                    </form>

                    <!-- Withdraw -->
                    <form onsubmit="actions.bankWithdraw(event)" class="glass-panel p-6 rounded-2xl flex flex-col gap-4">
                        <div class="flex items-center gap-2 text-white font-bold">
                            <i data-lucide="arrow-up-right" class="w-5 h-5 text-white"></i> Retrait
                        </div>
                        <p class="text-xs text-gray-400">Retirer de l'argent au distributeur.</p>
                        <div class="flex gap-2">
                            <input type="number" name="amount" placeholder="Montant" min="1" max="${state.bankAccount.bank_balance}" class="glass-input p-3 rounded-lg w-full" required>
                            <button type="submit" class="glass-btn-secondary bg-white/5 hover:bg-white/10 px-4 rounded-lg font-semibold text-sm cursor-pointer transition-colors"><i data-lucide="check" class="w-4 h-4"></i></button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    // --- TAB: OPERATIONS (TRANSFER) ---
    else if (state.activeBankTab === 'operations') {
        const filteredList = state.filteredRecipients;
        const showResults = state.selectedRecipient === null && filteredList.length > 0;
        
        content = `
             <div class="glass-panel p-8 rounded-2xl max-w-2xl mx-auto">
                <div class="mb-6 pb-6 border-b border-white/5">
                    <h3 class="text-xl font-bold text-white flex items-center gap-2">
                        <i data-lucide="send" class="w-6 h-6 text-blue-400"></i>
                        Virement Bancaire
                    </h3>
                    <p class="text-gray-400 text-sm mt-1">Transférez de l'argent instantanément à un autre citoyen.</p>
                </div>

                <form onsubmit="actions.bankTransfer(event)" class="space-y-6" autocomplete="off">
                    <div class="relative z-20">
                        <label class="text-xs text-gray-500 uppercase font-bold ml-1 mb-1 block">Bénéficiaire</label>
                        <input type="hidden" name="target_id" value="${state.selectedRecipient ? state.selectedRecipient.id : ''}" required>
                        <div class="relative">
                            <i data-lucide="search" class="w-4 h-4 absolute left-3 top-3.5 text-gray-500"></i>
                            <input type="text" 
                                    id="recipient_search"
                                    placeholder="Rechercher nom..." 
                                    value="${state.selectedRecipient ? state.selectedRecipient.name : ''}"
                                    oninput="actions.searchRecipients(this.value)"
                                    class="glass-input p-3 pl-10 rounded-xl w-full text-sm placeholder-gray-500 ${state.selectedRecipient ? 'text-blue-400 font-bold border-blue-500/50' : ''}" 
                                    autocomplete="off"
                                    ${state.selectedRecipient ? 'readonly' : ''}
                            >
                            ${state.selectedRecipient ? `
                                <button type="button" onclick="actions.clearRecipient()" class="absolute right-3 top-3 text-gray-500 hover:text-white p-1"><i data-lucide="x" class="w-4 h-4"></i></button>
                            ` : ''}
                        </div>
                        
                        <!-- Dropdown Results -->
                        <div id="search-results-container" class="absolute top-full left-0 right-0 bg-[#151515] border border-white/10 rounded-xl mt-1 max-h-48 overflow-y-auto shadow-2xl custom-scrollbar hidden">
                            <!-- JS inserts content here -->
                        </div>
                    </div>

                    <div>
                        <label class="text-xs text-gray-500 uppercase font-bold ml-1 mb-1 block">Montant ($)</label>
                        <input type="number" name="amount" placeholder="0.00" min="1" max="${state.bankAccount.bank_balance}" class="glass-input p-3 rounded-xl w-full font-mono text-lg" required>
                        <div class="text-right text-xs text-gray-500 mt-1">Solde dispo: $${state.bankAccount.bank_balance.toLocaleString()}</div>
                    </div>

                    <div>
                        <label class="text-xs text-gray-500 uppercase font-bold ml-1 mb-1 block">Motif (Optionnel)</label>
                        <input type="text" name="description" placeholder="Ex: Achat Véhicule" maxlength="50" class="glass-input p-3 rounded-xl w-full text-sm">
                    </div>

                    <button type="submit" class="glass-btn w-full py-4 rounded-xl font-bold text-lg bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2">
                        <i data-lucide="send" class="w-5 h-5"></i> Envoyer les fonds
                    </button>
                </form>
             </div>
        `;
    }

    // --- TAB: HISTORY ---
    else if (state.activeBankTab === 'history') {
        const historyHtml = state.transactions.length > 0 
        ? state.transactions.map(t => {
            let icon, color, label, sign;
            const desc = t.description ? `<div class="text-[10px] text-gray-500 italic mt-0.5">"${t.description}"</div>` : '';

            if (t.type === 'deposit') {
                icon = 'arrow-down-left';
                color = 'text-emerald-400';
                label = 'Dépôt d\'espèces';
                sign = '+';
            } else if (t.type === 'withdraw') {
                icon = 'arrow-up-right';
                color = 'text-white';
                label = 'Retrait d\'espèces';
                sign = '-';
            } else if (t.type === 'transfer') {
                if (t.receiver_id === state.activeCharacter.id) {
                    icon = 'arrow-down-left';
                    color = 'text-emerald-400';
                    label = 'Virement Reçu';
                    sign = '+';
                } else {
                    icon = 'send';
                    color = 'text-red-400';
                    label = 'Virement Envoyé';
                    sign = '-';
                }
            } else if (t.type === 'admin_adjustment') {
                icon = 'shield-alert';
                label = 'Ajustement Admin';
                if (t.amount >= 0) {
                    color = 'text-emerald-400';
                    sign = '+';
                } else {
                    color = 'text-red-400';
                    sign = '-';
                }
            }

            return `
                <div class="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                    <div class="flex items-center gap-4">
                        <div class="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400">
                            <i data-lucide="${icon}" class="w-4 h-4"></i>
                        </div>
                        <div>
                            <div class="font-medium text-white">${label}</div>
                            <div class="text-xs text-gray-500">${new Date(t.created_at).toLocaleString()}</div>
                            ${desc}
                        </div>
                    </div>
                    <div class="font-mono font-bold ${color}">
                        ${sign} $${Math.abs(t.amount).toLocaleString()}
                    </div>
                </div>
            `;
        }).join('') 
        : '<div class="text-center text-gray-500 py-10 italic">Aucune transaction récente.</div>';

        content = `
            <div class="glass-panel rounded-2xl p-6 h-full flex flex-col">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="font-bold text-white flex items-center gap-2">
                        <i data-lucide="history" class="w-5 h-5 text-gray-400"></i> Historique
                    </h3>
                    <div class="text-xs text-gray-500">20 dernières transactions</div>
                </div>
                <div class="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-2">
                    ${historyHtml}
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
                        <i data-lucide="landmark" class="w-6 h-6 text-emerald-500"></i>
                        Banque Nationale
                    </h2>
                    <p class="text-gray-400 text-sm">Services financiers sécurisés</p>
                </div>
                <div class="flex gap-2 bg-white/5 p-1 rounded-xl overflow-x-auto max-w-full">
                    ${tabs.map(t => `
                        <button onclick="actions.setBankTab('${t.id}')" 
                            class="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all whitespace-nowrap ${state.activeBankTab === t.id ? 'bg-emerald-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}">
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