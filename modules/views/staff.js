
import { state } from '../state.js';
import { CONFIG } from '../config.js';
import { hasPermission } from '../utils.js';

// Sous-vues segmentées
import { StaffCitizensView } from './staff/citizens.js';
import { StaffEconomyView } from './staff/economy.js';
import { StaffIllegalView } from './staff/illegal.js';
import { StaffEnterpriseView } from './staff/enterprise.js';
import { StaffPermissionsView } from './staff/permissions.js';
import { StaffSessionsView } from './staff/sessions.js';
import { StaffLogsView } from './staff/logs.js';

const refreshBanner = `
    <div class="flex flex-col md:flex-row items-center justify-between px-6 py-3 bg-purple-900/10 border-b border-purple-500/10 gap-3 shrink-0 z-20 relative">
        <div class="text-[10px] text-purple-200 flex items-center gap-2 font-black uppercase tracking-[0.2em]">
             <div class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </div>
            <span><span class="font-bold">Protocol Terminal</span> • Unified Control v4.6</span>
        </div>
        <button onclick="actions.refreshCurrentView()" id="refresh-data-btn" class="text-[10px] font-black uppercase tracking-widest text-purple-400 hover:text-white flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap">
            <i data-lucide="refresh-cw" class="w-3 h-3"></i> Synchroniser Monde
        </button>
    </div>
`;

export const StaffView = () => {
    // GUILD CHECK
    if (!state.user.guilds || !state.user.guilds.includes(CONFIG.GUILD_STAFF)) {
         return `
            <div class="h-full flex flex-col items-center justify-center p-8 text-center animate-fade-in bg-[#050505]">
                <div class="glass-panel max-w-md w-full p-10 rounded-[48px] border-purple-500/30 shadow-[0_0_80px_rgba(168,85,247,0.1)] relative overflow-hidden">
                    <div class="absolute inset-0 bg-gradient-to-b from-purple-500/10 to-transparent"></div>
                    <div class="w-24 h-24 bg-purple-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 text-purple-500 border border-purple-500/20 shadow-2xl relative">
                        <i data-lucide="shield-alert" class="w-12 h-12"></i>
                    </div>
                    <h2 class="text-3xl font-black text-white mb-4 italic uppercase tracking-tighter">Secteur Verrouillé</h2>
                    <p class="text-gray-400 mb-10 leading-relaxed font-medium">L'accès à la console de commandement nécessite une accréditation staff de niveau 4.</p>
                    <a href="${CONFIG.INVITE_STAFF}" target="_blank" class="glass-btn w-full py-5 rounded-2xl font-black flex items-center justify-center gap-3 bg-purple-600 hover:bg-purple-500 shadow-xl shadow-purple-900/40 uppercase tracking-widest italic">
                        <i data-lucide="external-link" class="w-5 h-5"></i>
                        Rejoindre le Réseau Staff
                    </a>
                </div>
            </div>
         `;
    }

    const hasAnyPerm = Object.keys(state.user.permissions || {}).length > 0 || state.user.isFounder;
    if (!hasAnyPerm) return `<div class="p-20 text-center text-red-500 font-black uppercase tracking-widest italic animate-pulse">Accès refusé • Violation du protocole d'accréditation</div>`;

    const isOnDuty = state.onDutyStaff?.some(s => s.id === state.user.id);
    const activeTabId = state.activeStaffTab || 'citizens';
    let content = '';

    // --- MODALS ---
    let economyModalHtml = '';
    if (state.economyModal.isOpen && (hasPermission('can_manage_economy') || hasPermission('can_manage_illegal'))) {
        const isGlobal = state.economyModal.targetId === 'ALL';
        economyModalHtml = `
            <div class="fixed inset-0 z-[160] flex items-center justify-center p-4">
                <div class="absolute inset-0 bg-black/90 backdrop-blur-md" onclick="actions.closeEconomyModal()"></div>
                <div class="glass-panel w-full max-w-4xl p-8 rounded-[40px] relative z-10 animate-slide-up shadow-2xl border border-emerald-500/30 flex flex-col md:flex-row gap-8 max-h-[90vh] overflow-hidden">
                    <div class="flex-1 md:max-w-md">
                        <div class="flex items-center gap-4 mb-8">
                            <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 shadow-lg"><i data-lucide="landmark" class="w-6 h-6"></i></div>
                            <div>
                                <h3 class="text-2xl font-black text-white uppercase italic tracking-tighter">Flux Économique</h3>
                                <div class="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">${isGlobal ? 'Cible : Population Globale' : state.economyModal.targetName}</div>
                            </div>
                        </div>
                        <form onsubmit="actions.executeEconomyAction(event)" class="space-y-6">
                            <div class="bg-black/40 p-3 rounded-2xl border border-white/5">
                                <label class="text-[9px] text-gray-600 uppercase font-black tracking-widest mb-3 block ml-1">Vecteur Monétaire</label>
                                <div class="flex gap-2">
                                    <label class="flex-1 cursor-pointer">
                                        <input type="radio" name="balance_type" value="bank" checked class="peer sr-only">
                                        <div class="py-3 text-center rounded-xl bg-white/5 text-gray-500 peer-checked:bg-emerald-600/20 peer-checked:text-emerald-400 peer-checked:border peer-checked:border-emerald-500/50 transition-all border border-transparent font-black text-[10px] uppercase tracking-widest">BANQUE</div>
                                    </label>
                                    <label class="flex-1 cursor-pointer">
                                        <input type="radio" name="balance_type" value="cash" class="peer sr-only">
                                        <div class="py-3 text-center rounded-xl bg-white/5 text-gray-500 peer-checked:bg-blue-600/20 peer-checked:text-blue-400 peer-checked:border peer-checked:border-blue-500/50 transition-all border border-transparent font-black text-[10px] uppercase tracking-widest">LIQUIDE</div>
                                    </label>
                                </div>
                            </div>
                            <div class="flex bg-black/40 p-1 rounded-xl border border-white/5">
                                <label class="flex-1 text-center cursor-pointer">
                                    <input type="radio" name="mode" value="fixed" checked class="peer sr-only">
                                    <span class="block py-2 text-[10px] font-black uppercase tracking-widest rounded-lg text-gray-500 peer-checked:bg-white/10 peer-checked:text-white transition-all">Montant Fixe</span>
                                </label>
                                <label class="flex-1 text-center cursor-pointer">
                                    <input type="radio" name="mode" value="percent" class="peer sr-only">
                                    <span class="block py-2 text-[10px] font-black uppercase tracking-widest rounded-lg text-gray-500 peer-checked:bg-white/10 peer-checked:text-white transition-all">Inflation %</span>
                                </label>
                            </div>
                            <input type="number" name="amount" placeholder="Valeur de l'ajustement..." min="1" class="glass-input w-full p-4 rounded-2xl text-xl font-mono font-black bg-black/40 border-white/10 focus:border-emerald-500/50" required>
                            <textarea name="description" rows="3" placeholder="Narration de l'action (Logs)..." class="glass-input w-full p-4 rounded-2xl text-xs italic bg-black/40 border-white/10 focus:bg-black/60" required></textarea>
                            <div class="grid grid-cols-2 gap-4">
                                <button type="submit" name="action" value="add" class="glass-btn bg-emerald-600 hover:bg-emerald-500 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-900/30 flex items-center justify-center gap-2"><i data-lucide="plus" class="w-4 h-4"></i> Créditer</button>
                                <button type="submit" name="action" value="remove" class="glass-btn bg-red-600 hover:bg-red-500 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-red-900/30 flex items-center justify-center gap-2"><i data-lucide="minus" class="w-4 h-4"></i> Débiter</button>
                            </div>
                        </form>
                    </div>
                    ${!isGlobal ? `
                        <div class="flex-1 border-l border-white/5 pl-8 flex flex-col min-h-0">
                            <h4 class="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] mb-6 flex items-center gap-3"><i data-lucide="history" class="w-4 h-4"></i> Dernières Interventions</h4>
                            <div class="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                                ${state.economyModal.transactions.length > 0 ? state.economyModal.transactions.map(t => {
                                    const isReceiver = t.receiver_id === state.economyModal.targetId;
                                    const color = isReceiver ? 'text-emerald-400' : 'text-red-400';
                                    return `
                                        <div class="bg-white/5 p-4 rounded-2xl border border-white/5 relative overflow-hidden group">
                                            <div class="absolute top-0 left-0 h-full w-1 ${isReceiver ? 'bg-emerald-500/50' : 'bg-red-500/50'}"></div>
                                            <div class="flex justify-between font-black mb-1 text-[10px] uppercase tracking-tight">
                                                <span class="text-gray-500">${t.type}</span>
                                                <span class="${color}">${isReceiver ? '+' : '-'} $${Math.abs(t.amount).toLocaleString()}</span>
                                            </div>
                                            <div class="text-[11px] text-gray-400 italic truncate group-hover:whitespace-normal transition-all">"${t.description || 'Sans motif'}"</div>
                                            <div class="text-[8px] text-gray-700 font-mono mt-2 uppercase">${new Date(t.created_at).toLocaleString()}</div>
                                        </div>
                                    `;
                                }).join('') : '<div class="h-full flex items-center justify-center text-gray-700 italic text-[10px] uppercase font-black tracking-widest opacity-30">Registre vierge</div>'}
                            </div>
                        </div>
                    ` : ''}
                    <button onclick="actions.closeEconomyModal()" class="absolute top-6 right-6 text-gray-600 hover:text-white transition-all"><i data-lucide="x-circle" class="w-8 h-8"></i></button>
                </div>
            </div>
        `;
    }

    let inventoryModalHtml = '';
    if (state.inventoryModal.isOpen && hasPermission('can_manage_inventory')) {
         inventoryModalHtml = `
             <div class="fixed inset-0 z-[160] flex items-center justify-center p-4">
                <div class="absolute inset-0 bg-black/95 backdrop-blur-sm" onclick="actions.closeInventoryModal()"></div>
                <div class="glass-panel w-full max-w-2xl p-10 rounded-[48px] relative z-10 animate-slide-up flex flex-col max-h-[85vh] border border-orange-500/30 shadow-2xl">
                    <div class="flex justify-between items-start mb-8 border-b border-white/5 pb-6">
                        <div>
                            <h3 class="text-3xl font-black text-white uppercase italic tracking-tighter">Registre d'Inventaire</h3>
                            <div class="flex items-center gap-3 mt-1">
                                <span class="text-[10px] text-orange-400 font-black uppercase tracking-widest">Inspection Administrative</span>
                                <span class="w-1 h-1 bg-gray-800 rounded-full"></span>
                                <span class="text-[10px] text-gray-500 font-black uppercase tracking-widest">Cible: ${state.inventoryModal.targetName}</span>
                            </div>
                        </div>
                        <button onclick="actions.closeInventoryModal()" class="text-gray-500 hover:text-white transition-all"><i data-lucide="x" class="w-8 h-8"></i></button>
                    </div>
                    <div class="flex-1 overflow-y-auto custom-scrollbar mb-8 bg-black/40 rounded-[32px] border border-white/5 p-4 shadow-inner">
                        ${state.inventoryModal.items.length > 0 ? `
                            <table class="w-full text-left text-sm border-separate border-spacing-0">
                                <thead class="text-[9px] uppercase text-gray-600 font-black tracking-widest sticky top-0 bg-[#0d0d0e] z-20"><tr><th class="p-4 border-b border-white/5">Objet / Type</th><th class="p-4 border-b border-white/5 text-center">Quantité</th><th class="p-4 border-b border-white/5 text-right">Sanction</th></tr></thead>
                                <tbody class="divide-y divide-white/5">
                                    ${state.inventoryModal.items.map(item => `
                                        <tr class="hover:bg-white/[0.03] transition-colors group">
                                            <td class="p-4">
                                                <div class="font-black text-white uppercase italic text-sm group-hover:text-orange-400 transition-colors">${item.name}</div>
                                                <div class="text-[8px] text-gray-600 uppercase font-black mt-0.5">Dossier Certifié</div>
                                            </td>
                                            <td class="p-4 text-center font-mono font-black text-white bg-white/5 rounded-xl border border-white/10 my-2 inline-block">x${item.quantity}</td>
                                            <td class="p-4 text-right">
                                                <button onclick="actions.manageInventoryItem('remove', '${item.id}', '${item.name}')" class="text-red-500 hover:bg-red-600 hover:text-white p-2.5 rounded-xl transition-all border border-red-500/20 shadow-lg group-hover:scale-110"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        ` : `<div class="p-20 text-center flex flex-col items-center opacity-30 italic font-black uppercase tracking-[0.4em] text-gray-600"><i data-lucide="package-open" class="w-16 h-16 mb-4"></i>Sac Vidé ou Purge Totale</div>`}
                    </div>
                    <form onsubmit="actions.manageInventoryItem('add', null, null, event)" class="pt-6 border-t border-white/10 bg-black/20 p-6 rounded-[32px]">
                        <h4 class="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-3"><i data-lucide="plus" class="w-4 h-4 text-blue-500"></i> Injection d'Objet</h4>
                        <div class="flex gap-3">
                            <input type="text" name="item_name" placeholder="Nom de l'objet (ex: Glock 17)" class="glass-input flex-1 p-3.5 rounded-xl text-sm font-bold bg-black/40 border-white/10 uppercase tracking-tight" required>
                            <input type="number" name="quantity" value="1" min="1" class="glass-input w-24 p-3.5 rounded-xl text-sm font-mono font-bold bg-black/40 border-white/10" required>
                            <input type="hidden" name="value" value="0">
                            <button type="submit" class="glass-btn px-6 rounded-xl bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-900/30 transition-all active:scale-95"><i data-lucide="save" class="w-5 h-5"></i></button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    // --- TAB ROUTING ---
    const tabMap = {
        citizens: StaffCitizensView,
        economy: StaffEconomyView,
        illegal: StaffIllegalView,
        enterprise: StaffEnterpriseView,
        permissions: StaffPermissionsView,
        sessions: StaffSessionsView,
        logs: StaffLogsView
    };

    content = (tabMap[activeTabId] || StaffCitizensView)();

    const tabs = [
        { id: 'citizens', label: 'Citoyens', icon: 'users', perm: 'can_manage_characters' },
        { id: 'economy', label: 'Éco', icon: 'coins', perm: 'can_manage_economy' },
        { id: 'illegal', label: 'Illégal', icon: 'skull', perm: 'can_manage_illegal' },
        { id: 'enterprise', label: 'Corp', icon: 'building-2', perm: 'can_manage_enterprises' },
        { id: 'permissions', label: 'Perms', icon: 'lock', perm: 'can_manage_staff' },
        { id: 'sessions', label: 'Sessions', icon: 'server', perm: 'can_launch_session' },
        { id: 'logs', label: 'Logs', icon: 'scroll-text', perm: 'can_execute_commands' }
    ].filter(t => hasPermission(t.perm) || state.user.isFounder || t.id === 'citizens');

    return `
        ${economyModalHtml}
        ${inventoryModalHtml}
        <div class="h-full flex flex-col bg-[#050505] overflow-hidden animate-fade-in relative">
            ${refreshBanner}
            
            <div class="px-8 pb-4 pt-6 flex flex-col md:flex-row justify-between items-end gap-6 border-b border-white/5 bg-[#050505] shrink-0 relative z-30">
                <div>
                    <h2 class="text-3xl font-black text-white flex items-center gap-4 uppercase italic tracking-tighter">
                        <i data-lucide="shield-alert" class="w-8 h-8 text-purple-500"></i>
                        Console Staff
                    </h2>
                    <div class="flex items-center gap-3 mt-1">
                         <span class="text-[10px] text-purple-500/60 font-black uppercase tracking-widest">Protocol OS v4.6.1</span>
                         <span class="w-1.5 h-1.5 bg-gray-800 rounded-full"></span>
                         <span class="text-[10px] text-gray-600 font-black uppercase tracking-widest">${isOnDuty ? 'En Service Actif' : 'Mode Consultation'}</span>
                    </div>
                </div>
                <div class="flex flex-nowrap gap-2 bg-white/5 p-1.5 rounded-2xl overflow-x-auto max-w-full no-scrollbar border border-white/5 shadow-inner">
                    ${tabs.map(t => `
                        <button onclick="actions.setStaffTab('${t.id}')" 
                            class="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 transition-all whitespace-nowrap shrink-0 ${activeTabId === t.id ? 'bg-purple-600 text-white shadow-xl shadow-purple-900/30 border-purple-500/30 border' : 'text-gray-500 hover:text-white hover:bg-white/5'}">
                            <i data-lucide="${t.icon}" class="w-4 h-4"></i> ${t.label}
                        </button>
                    `).join('')}
                    
                    <div class="w-px h-6 bg-white/10 mx-2 self-center"></div>
                    
                    ${isOnDuty ? 
                        `<button onclick="actions.confirmToggleDuty(true)" class="px-6 py-2.5 rounded-xl text-[10px] font-black bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-3 uppercase tracking-widest italic shadow-xl"><i data-lucide="user-check" class="w-4 h-4"></i> Live</button>` : 
                        `<button onclick="actions.confirmToggleDuty(false)" class="px-6 py-2.5 rounded-xl text-[10px] font-black bg-white/5 text-gray-500 border border-white/10 hover:bg-white/10 hover:text-white transition-all flex items-center gap-3 uppercase tracking-widest italic"><i data-lucide="user-x" class="w-4 h-4"></i> Offline</button>`
                    }
                </div>
            </div>

            <div class="flex-1 p-8 overflow-hidden relative min-h-0">
                <div class="h-full overflow-hidden">
                    ${content}
                </div>
            </div>
        </div>
    `;
};
