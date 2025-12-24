
import { state } from '../../state.js';
import { hasPermission } from '../../utils.js';

export const StaffSessionsView = () => {
    const isSessionActive = !!state.activeGameSession;

    return `
        <div class="max-w-5xl mx-auto h-full flex flex-col animate-fade-in gap-8 overflow-y-auto custom-scrollbar pr-2 pb-10">
            
            <!-- MASTER CONTROL CARD -->
            <div class="glass-panel p-12 rounded-[48px] border border-white/5 bg-gradient-to-br from-[#0c0c0e] via-black to-black shadow-2xl relative overflow-hidden shrink-0">
                <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(16,185,129,0.05),transparent_70%)] pointer-events-none"></div>
                <div class="absolute -right-20 -top-20 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none"></div>
                
                <div class="flex flex-col md:flex-row justify-between items-center gap-10 relative z-10">
                    <div class="text-center md:text-left flex-1">
                        <div class="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-[0.3em] border border-blue-500/20 mb-6 rounded-lg">
                            <i data-lucide="server" class="w-3.5 h-3.5"></i> État du Cluster ERLC
                        </div>
                        <h2 class="text-5xl font-black text-white mb-2 italic uppercase tracking-tighter">Gestion des Flocons</h2>
                        <p class="text-gray-500 text-sm font-bold uppercase tracking-widest max-w-md leading-relaxed">Activez ce module pour synchroniser le marché noir, la justice et les terminaux de police en jeu.</p>
                    </div>
                    
                    <div class="shrink-0">
                        <button onclick="actions.toggleSession()" class="group relative w-64 h-64 rounded-full border-8 transition-all duration-500 p-4 active:scale-95 shadow-2xl
                            ${isSessionActive ? 'border-red-600/30 bg-red-950/20 hover:border-red-600/50' : 'border-emerald-600/30 bg-emerald-950/20 hover:border-emerald-600/50'}">
                            <div class="w-full h-full rounded-full flex flex-col items-center justify-center transition-all duration-500
                                ${isSessionActive ? 'bg-red-600 shadow-[0_0_50px_rgba(220,38,38,0.4)]' : 'bg-emerald-600 shadow-[0_0_50px_rgba(16,185,129,0.4)]'}">
                                <i data-lucide="power" class="w-16 h-16 text-white mb-2 group-hover:scale-110 transition-transform"></i>
                                <span class="text-white font-black text-sm uppercase tracking-[0.3em]">${isSessionActive ? 'ARRÊTER' : 'LANCER'}</span>
                            </div>
                            <div class="absolute inset-0 rounded-full border-2 border-dashed border-white/5 animate-spin-slow pointer-events-none"></div>
                        </button>
                    </div>
                </div>
            </div>

            ${isSessionActive ? `
                <div class="grid grid-cols-1 md:grid-cols-4 gap-6 shrink-0">
                    <div class="glass-panel p-6 rounded-[32px] border border-white/5 bg-[#0a0a0a] text-center group">
                        <div class="text-[9px] text-gray-600 font-black uppercase tracking-widest mb-1">Durée Live</div>
                        <div class="text-2xl font-mono font-black text-white tracking-tighter">${Math.floor((Date.now() - new Date(state.activeGameSession.start_time).getTime())/60000)}<span class="text-xs ml-1 opacity-40">MIN</span></div>
                    </div>
                    <div class="glass-panel p-6 rounded-[32px] border border-white/5 bg-[#0a0a0a] text-center group">
                        <div class="text-[9px] text-gray-600 font-black uppercase tracking-widest mb-1">Affluence</div>
                        <div class="text-2xl font-mono font-black text-blue-400 tracking-tighter">${state.erlcData.currentPlayers}<span class="text-xs ml-1 opacity-40">/ ${state.erlcData.maxPlayers}</span></div>
                    </div>
                    <div class="glass-panel p-6 rounded-[32px] border border-white/5 bg-[#0a0a0a] text-center group">
                        <div class="text-[9px] text-gray-600 font-black uppercase tracking-widest mb-1">Staff Actif</div>
                        <div class="text-2xl font-mono font-black text-purple-400 tracking-tighter">${state.onDutyStaff.length}</div>
                    </div>
                    <div class="glass-panel p-6 rounded-[32px] border border-white/5 bg-[#0a0a0a] text-center group">
                        <div class="text-[9px] text-gray-600 font-black uppercase tracking-widest mb-1">Code Système</div>
                        <div class="text-2xl font-mono font-black text-emerald-400 tracking-widest select-all">${state.erlcData.joinKey}</div>
                    </div>
                </div>
            ` : ''}

            <div class="glass-panel rounded-[40px] border border-white/5 bg-[#0a0a0a] overflow-hidden flex flex-col shadow-2xl flex-1">
                <div class="p-8 border-b border-white/5 flex justify-between items-center bg-black/40 shrink-0">
                    <h3 class="font-black text-white uppercase italic tracking-widest text-sm flex items-center gap-3">
                        <i data-lucide="history" class="w-5 h-5 text-gray-500"></i> Historique de Connexion du Cluster
                    </h3>
                </div>
                <div class="overflow-y-auto custom-scrollbar flex-1 max-h-[400px]">
                    <table class="w-full text-left border-separate border-spacing-0">
                        <thead class="bg-black/40 text-[9px] uppercase text-gray-600 font-black tracking-widest sticky top-0 z-10 backdrop-blur-md">
                            <tr>
                                <th class="p-5 border-b border-white/5">Opérateur Système</th>
                                <th class="p-5 border-b border-white/5">Horodatage</th>
                                <th class="p-5 border-b border-white/5">Durée Session</th>
                                <th class="p-5 border-b border-white/5 text-right">Statut</th>
                            </tr>
                        </thead>
                        <tbody class="text-sm divide-y divide-white/5">
                            ${state.sessionHistory.map(s => `
                                <tr class="hover:bg-white/[0.03] transition-colors group">
                                    <td class="p-5">
                                        <div class="font-black text-white text-sm uppercase italic tracking-tight group-hover:text-blue-400 transition-colors">${s.host?.username || 'Système'}</div>
                                    </td>
                                    <td class="p-5">
                                        <div class="text-[10px] text-gray-500 font-mono">${new Date(s.start_time).toLocaleDateString()} ${new Date(s.start_time).toLocaleTimeString()}</div>
                                    </td>
                                    <td class="p-5">
                                        <div class="text-[10px] text-gray-400 font-bold uppercase">${s.end_time ? Math.floor((new Date(s.end_time) - new Date(s.start_time)) / 60000) + ' minutes' : 'En cours...'}</div>
                                    </td>
                                    <td class="p-5 text-right">
                                        <span class="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${s.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-white/5 text-gray-600 border-white/5'}">
                                            ${s.status}
                                        </span>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
};
