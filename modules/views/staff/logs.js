
import { state } from '../../state.js';
import { hasPermission } from '../../utils.js';

export const StaffLogsView = () => {
    const subTab = state.activeStaffLogTab || 'commands';
    const q = state.erlcLogSearch ? state.erlcLogSearch.toLowerCase() : '';
    
    let tableContent = '';
    let headers = '';

    if (subTab === 'commands') {
        headers = '<tr><th class="p-5 border-b border-white/5">Opérateur</th><th class="p-5 border-b border-white/5">Script Commande</th><th class="p-5 border-b border-white/5 text-right">Horodatage</th></tr>';
        let logs = state.erlcData.commandLogs || [];
        if (q) logs = logs.filter(l => l.Command.toLowerCase().includes(q) || l.Player.toLowerCase().includes(q));
        tableContent = logs.map(l => `
            <tr class="hover:bg-white/[0.03] transition-colors group font-mono text-[11px]">
                <td class="p-5 text-blue-400 font-black uppercase italic">${l.Player}</td>
                <td class="p-5 text-gray-300 bg-white/5 rounded-lg border border-white/5 my-2 inline-block">${l.Command}</td>
                <td class="p-5 text-right text-gray-600">${new Date(l.Timestamp * 1000).toLocaleTimeString()}</td>
            </tr>
        `).join('');
    } else if (subTab === 'kills') {
        headers = '<tr><th class="p-5 border-b border-white/5">Agresseur</th><th class="p-5 border-b border-white/5">Victime</th><th class="p-5 border-b border-white/5">Vecteur Dégâts</th><th class="p-5 border-b border-white/5 text-right">Horodatage</th></tr>';
        let logs = state.erlcData.killLogs || [];
        if (q) logs = logs.filter(l => l.Killer.toLowerCase().includes(q) || l.Victim.toLowerCase().includes(q));
        tableContent = logs.map(l => `
            <tr class="hover:bg-white/[0.03] transition-colors group font-mono text-[11px]">
                <td class="p-5 text-red-500 font-black uppercase italic">${l.Killer}</td>
                <td class="p-5 text-white font-bold uppercase">${l.Victim}</td>
                <td class="p-5 text-gray-500">${l.Weapon || 'Dégâts Environnementaux'}</td>
                <td class="p-5 text-right text-gray-600">${new Date(l.Timestamp * 1000).toLocaleTimeString()}</td>
            </tr>
        `).join('');
    } else if (subTab === 'players') {
        headers = '<tr><th class="p-5 border-b border-white/5">Citoyen Identifié</th><th class="p-5 border-b border-white/5">Affectation Team</th><th class="p-5 border-b border-white/5 text-right">Niveau Accréditation</th></tr>';
        let list = state.erlcData.players || [];
        if (q) list = list.filter(p => p.Name.toLowerCase().includes(q));
        tableContent = list.map(p => `
            <tr class="hover:bg-white/[0.03] transition-colors group font-mono text-[11px]">
                <td class="p-5 text-white font-black uppercase italic">${p.Name}</td>
                <td class="p-5 text-gray-400 uppercase font-bold">${p.Team}</td>
                <td class="p-5 text-right text-purple-400 font-black uppercase tracking-widest">${p.Permission}</td>
            </tr>
        `).join('');
    } else if (subTab === 'vehicles') {
        headers = '<tr><th class="p-5 border-b border-white/5">Propriétaire</th><th class="p-5 border-b border-white/5">Désignation</th><th class="p-5 border-b border-white/5 text-right">Configuration Apparence</th></tr>';
        let list = state.erlcData.vehicles || [];
        if (q) list = list.filter(v => v.Owner.toLowerCase().includes(q) || v.Name.toLowerCase().includes(q));
        tableContent = list.map(v => `
            <tr class="hover:bg-white/[0.03] transition-colors group font-mono text-[11px]">
                <td class="p-5 text-blue-400 font-black uppercase italic">${v.Owner}</td>
                <td class="p-5 text-white font-bold uppercase">${v.Name}</td>
                <td class="p-5 text-right text-gray-600 italic">"${v.Texture || 'Série'}"</td>
            </tr>
        `).join('');
    }

    return `
        <div class="flex flex-col h-full overflow-hidden animate-fade-in gap-6">
            
            <div class="flex gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/5 w-fit shrink-0 overflow-x-auto no-scrollbar">
                ${['commands', 'kills', 'modcalls', 'players', 'vehicles'].map(tab => `
                    <button onclick="actions.setStaffLogTab('${tab}')" class="px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${subTab === tab ? 'bg-purple-600 text-white shadow-xl shadow-purple-900/20' : 'text-gray-500 hover:text-gray-300'}">
                        ${tab.replace('modcalls', 'Appels Mod').toUpperCase()}
                    </button>
                `).join('')}
            </div>

            <div class="flex flex-col md:flex-row gap-4 shrink-0">
                <div class="relative flex-1 group">
                    <i data-lucide="search" class="w-4 h-4 absolute left-4 top-3.5 text-gray-500 group-focus-within:text-purple-400 transition-colors"></i>
                    <input type="text" oninput="actions.searchCommandLogs(this.value)" value="${state.erlcLogSearch}" 
                        placeholder="Filtrer les entrées du registre..." 
                        class="glass-input pl-12 pr-4 py-3 rounded-2xl w-full text-sm bg-black/40 border-white/10 focus:border-purple-500/30">
                </div>
                ${subTab === 'commands' && hasPermission('can_execute_commands') ? `
                    <form onsubmit="actions.executeCommand(event)" class="flex gap-2 w-full md:w-[450px]">
                        <input type="text" name="command" placeholder="Script Console (ex: :m Message)" class="glass-input flex-1 px-4 rounded-2xl text-xs font-mono border-purple-500/30 bg-purple-900/10 focus:bg-purple-900/20" required>
                        <button type="submit" class="p-3.5 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl shadow-xl transition-all"><i data-lucide="terminal" class="w-4 h-4"></i></button>
                    </form>
                ` : ''}
            </div>

            <div class="flex-1 overflow-hidden rounded-[32px] border border-white/5 bg-[#0a0a0a] flex flex-col shadow-2xl">
                <div class="overflow-y-auto custom-scrollbar flex-1">
                    <table class="w-full text-left border-separate border-spacing-0">
                        <thead class="bg-black/40 text-[9px] uppercase text-gray-600 font-black tracking-widest sticky top-0 z-10 backdrop-blur-md">
                            ${headers}
                        </thead>
                        <tbody class="divide-y divide-white/5">
                            ${tableContent || `<tr><td colspan="5" class="p-20 text-center text-gray-600 italic uppercase font-black tracking-widest text-[10px] opacity-30">Aucun signal détecté</td></tr>`}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
};
