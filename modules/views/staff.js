
import { state } from '../state.js';
import { CONFIG } from '../config.js';
import { hasPermission } from '../utils.js';

// Import Modular Sub-Views
import { StaffApplicationsView } from './staff/applications.js';
import { StaffDatabaseView } from './staff/database.js';
import { StaffEconomyView } from './staff/economy.js';
import { StaffIllegalView } from './staff/illegal.js';
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
            <span><span class="font-bold">Protocol Terminal v4.6</span> • Transmission Cryptée</span>
        </div>
        <button onclick="actions.refreshCurrentView()" id="refresh-data-btn" class="text-[10px] font-black uppercase tracking-widest text-purple-400 hover:text-white flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap">
            <i data-lucide="refresh-cw" class="w-3 h-3"></i> Synchroniser Données
        </button>
    </div>
`;

export const StaffView = () => {
    // GUILD CHECK
    if (!state.user.guilds || !state.user.guilds.includes(CONFIG.GUILD_STAFF)) {
         return `
            <div class="h-full flex flex-col items-center justify-center p-8 text-center animate-fade-in bg-[#050505]">
                <div class="glass-panel max-w-md w-full p-10 rounded-[40px] border border-purple-500/30 shadow-[0_0_80px_rgba(168,85,247,0.1)] relative overflow-hidden">
                    <div class="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent"></div>
                    <div class="w-24 h-24 bg-purple-500/10 rounded-[32px] flex items-center justify-center mx-auto mb-8 text-purple-500 border border-purple-500/20 shadow-xl">
                        <i data-lucide="shield-alert" class="w-12 h-12"></i>
                    </div>
                    <h2 class="text-3xl font-black text-white mb-4 italic uppercase tracking-tighter">Accès Restreint</h2>
                    <p class="text-gray-400 mb-10 leading-relaxed font-medium">L'accès au commandement suprême nécessite une accréditation membre du <span class="text-purple-400 font-bold">Discord Staff</span>.</p>
                    <a href="${CONFIG.INVITE_STAFF}" target="_blank" class="glass-btn w-full py-5 rounded-2xl font-black flex items-center justify-center gap-4 bg-purple-600 hover:bg-purple-500 shadow-xl shadow-purple-900/30 uppercase tracking-widest italic transition-all transform hover:scale-[1.02]">
                        <i data-lucide="external-link" class="w-6 h-6"></i>
                        Rejoindre le Quartier Général
                    </a>
                </div>
            </div>
         `;
    }

    const hasAnyPerm = Object.keys(state.user.permissions || {}).length > 0 || state.user.isFounder;
    if (!hasAnyPerm) return `<div class="h-full flex items-center justify-center text-red-500 font-black uppercase tracking-widest bg-black">SIGNAL BLOQUÉ : AUCUNE PERMISSION DÉTECTÉE</div>`;

    const isOnDuty = state.onDutyStaff?.some(s => s.id === state.user.id);
    const tab = state.activeStaffTab;
    let mainContent = '';

    // Routeur de modules
    switch(tab) {
        case 'applications': mainContent = StaffApplicationsView(); break;
        case 'database': mainContent = StaffDatabaseView(); break;
        case 'economy': mainContent = StaffEconomyView(); break;
        case 'illegal': mainContent = StaffIllegalView(); break;
        case 'permissions': mainContent = StaffPermissionsView(); break;
        case 'sessions': mainContent = StaffSessionsView(); break;
        case 'logs': mainContent = StaffLogsView(); break;
        case 'enterprise': mainContent = StaffDatabaseView(); break; // Temporaire, à raffiner si besoin
        default: mainContent = StaffApplicationsView();
    }

    const navTabs = [
        { id: 'applications', label: 'Whitelist', icon: 'file-check', perm: 'can_approve_characters' },
        { id: 'database', label: 'Citoyens', icon: 'database', perm: null },
        { id: 'economy', label: 'Économie', icon: 'coins', perm: 'can_manage_economy' },
        { id: 'illegal', label: 'Syndicats', icon: 'skull', perm: 'can_manage_illegal' },
        { id: 'enterprise', label: 'Entreprises', icon: 'building-2', perm: 'can_manage_enterprises' },
        { id: 'permissions', label: 'Habilitations', icon: 'lock', perm: 'can_manage_staff' },
        { id: 'sessions', label: 'Sessions', icon: 'server', perm: 'can_launch_session' },
        { id: 'logs', label: 'Logs', icon: 'scroll-text', perm: 'can_execute_commands' }
    ];

    return `
        <div class="h-full flex flex-col bg-[#050505] overflow-hidden animate-fade-in relative">
            ${refreshBanner}
            
            <div class="px-8 pb-4 pt-6 flex flex-col md:flex-row justify-between items-end gap-6 border-b border-white/5 bg-[#050505] relative z-10 shrink-0">
                <div>
                    <h2 class="text-3xl font-black text-white flex items-center gap-3 uppercase italic tracking-tighter">
                        <i data-lucide="shield-alert" class="w-8 h-8 text-purple-500"></i>
                        Console Staff
                    </h2>
                    <div class="flex items-center gap-3 mt-1">
                         <span class="text-[10px] text-purple-500/60 font-black uppercase tracking-widest">Haut Commandement TFRP</span>
                         <span class="w-1.5 h-1.5 bg-gray-800 rounded-full"></span>
                         <span class="text-[10px] text-gray-600 font-black uppercase tracking-widest">Opérateur: ${state.user.username}</span>
                    </div>
                </div>
                
                <div class="flex gap-2 bg-white/5 p-1.5 rounded-2xl overflow-x-auto max-w-full no-scrollbar border border-white/5">
                    ${navTabs.filter(t => !t.perm || hasPermission(t.perm)).map(t => `
                        <button onclick="actions.setStaffTab('${t.id}')" 
                            class="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 transition-all whitespace-nowrap ${tab === t.id ? 'bg-purple-600 text-white shadow-xl shadow-purple-900/20' : 'text-gray-500 hover:text-white hover:bg-white/5'}">
                            <i data-lucide="${t.icon}" class="w-4 h-4"></i> ${t.label}
                        </button>
                    `).join('')}

                    <div class="w-px h-6 bg-white/10 mx-2 my-auto"></div>

                    <button onclick="actions.confirmToggleDuty(${isOnDuty})" class="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all whitespace-nowrap ${isOnDuty ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white shadow-xl shadow-emerald-900/20' : 'bg-white/5 text-gray-500 border border-white/10 hover:text-white'}">
                        <i data-lucide="${isOnDuty ? 'user-check' : 'user-x'}" class="w-4 h-4"></i> ${isOnDuty ? 'EN SERVICE' : 'HORS SERVICE'}
                    </button>
                </div>
            </div>

            <div class="flex-1 p-8 overflow-hidden relative min-h-0">
                <div class="h-full overflow-hidden">
                    ${mainContent}
                </div>
            </div>
        </div>
    `;
};
