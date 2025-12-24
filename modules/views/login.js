
import { CONFIG } from '../config.js';
import { state } from '../state.js';
import { router } from '../utils.js';

export const LoginView = () => {
    const EXCLUDED_ID = '1449442051904245812';
    const validStaff = state.landingStaff.filter(s => s.id !== EXCLUDED_ID);
    const founders = validStaff.filter(s => state.adminIds.includes(s.id));
    const others = validStaff.filter(s => !state.adminIds.includes(s.id));
    const staffCarouselItems = others.length > 0 ? [...others, ...others, ...others] : [];

    const renderFounderCard = (s) => {
        const status = state.discordStatuses[s.id] || 'offline';
        const color = { online: 'bg-emerald-500', idle: 'bg-amber-500', dnd: 'bg-red-500', offline: 'bg-zinc-600' }[status];
        return `
            <div class="glass-panel p-8 rounded-[40px] flex flex-col items-center border border-amber-500/20 bg-amber-500/[0.03] relative overflow-hidden group w-64 hover:border-amber-500/40 transition-all duration-500 shadow-2xl">
                <div class="absolute inset-0 bg-gradient-to-b from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <div class="w-24 h-24 rounded-[32px] border-2 border-amber-500/30 p-1.5 mb-6 relative z-10 shadow-[0_0_40px_rgba(245,158,11,0.15)] group-hover:scale-105 transition-transform duration-500">
                    <img src="${s.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png'}" class="w-full h-full rounded-[26px] object-cover">
                    <div class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full ${color} border-4 border-[#050505]" title="Discord Status"></div>
                </div>
                <div class="text-center w-full relative z-10">
                    <div class="font-black text-white text-xl truncate tracking-tight uppercase italic">${s.username}</div>
                    <div class="text-[9px] text-amber-400 font-black uppercase tracking-[0.2em] mt-2 bg-amber-500/10 px-4 py-1.5 rounded-full border border-amber-500/20 inline-block">Directoire</div>
                </div>
            </div>
        `;
    };

    const renderStaffCard = (s) => {
        const status = state.discordStatuses[s.id] || 'offline';
        const color = { online: 'bg-emerald-500', idle: 'bg-amber-500', dnd: 'bg-red-500', offline: 'bg-zinc-600' }[status];
        return `
            <div class="glass-panel w-72 p-4 rounded-3xl flex items-center gap-5 border border-white/5 bg-white/[0.01] shrink-0 hover:border-blue-500/20 transition-all">
                <div class="relative w-14 h-14 shrink-0">
                    <img src="${s.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png'}" class="w-full h-full rounded-2xl object-cover border border-white/10 shadow-lg">
                    <div class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full ${color} border-2 border-black"></div>
                </div>
                <div class="min-w-0">
                    <div class="font-black text-white text-sm truncate uppercase italic tracking-tight">${s.username}</div>
                    <div class="text-[9px] text-gray-500 uppercase tracking-[0.2em] font-black mt-0.5">Administration</div>
                </div>
            </div>
        `;
    };

    return `
    <div class="flex-1 flex flex-col relative overflow-hidden h-full w-full bg-[#030303] text-white">
        <!-- Background FX -->
        <div class="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,_rgba(59,130,246,0.12),transparent_70%)] pointer-events-none"></div>
        <div class="absolute -top-40 -right-40 w-[800px] h-[800px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none"></div>
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-indigo-500/5 rounded-full blur-[150px] pointer-events-none"></div>

        <!-- Navigation Bar -->
        <nav class="relative z-20 w-full px-10 py-8 flex justify-between items-center animate-fade-in">
            <div class="flex items-center gap-4">
                <span class="font-black text-2xl tracking-tighter text-white uppercase italic">TFRP <span class="text-blue-500">Panel</span></span>
            </div>
            
            <div class="hidden md:flex items-center gap-8">
                <div class="flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/5 border border-white/5 shadow-inner">
                    <div class="relative flex h-2 w-2">
                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </div>
                    <span class="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">Système de Persistance Actif</span>
                </div>
                <a href="${CONFIG.INVITE_URL}" target="_blank" class="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-[10px] font-black uppercase tracking-[0.3em] transition-all shadow-xl shadow-indigo-900/20 flex items-center gap-2">
                    Communauté <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
                </a>
            </div>
        </nav>

        <!-- Main Scrollable Content -->
        <div class="flex-1 overflow-y-auto custom-scrollbar relative z-10 px-6">
            <div class="flex flex-col items-center pt-16 pb-32">
                
                <!-- Hero Section -->
                <div class="text-center max-w-5xl mx-auto mb-32 animate-slide-up">
                    <div class="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 backdrop-blur-xl mb-10 shadow-2xl">
                        <i data-lucide="globe" class="w-4 h-4 text-blue-400"></i>
                        <span class="text-[10px] font-black text-blue-100 tracking-[0.4em] uppercase">Los Angeles • California State</span>
                    </div>
                    
                    <h1 class="text-7xl md:text-9xl font-black tracking-tighter text-white mb-8 leading-[0.85] uppercase italic">
                        TEAM FRENCH<br>
                        <span class="text-transparent bg-clip-text bg-gradient-to-b from-blue-400 via-blue-600 to-indigo-800 drop-shadow-2xl">ROLEPLAY</span>
                    </h1>
                    
                    <p class="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-16 leading-relaxed font-medium italic opacity-80">
                        L'expérience roleplay ultime sur ERLC. Une économie interconnectée, une administration d'élite et une immersion sans compromis.
                    </p>
                    
                    <div class="flex flex-col items-center gap-10">
                        ${state.isLoggingIn ? `
                            <button disabled class="h-20 px-16 rounded-[28px] bg-white/5 border border-white/10 flex items-center gap-6 text-white/50 cursor-wait">
                                <div class="loader-spinner w-6 h-6 border-2"></div>
                                <span class="font-black uppercase tracking-[0.3em]">Protocole en cours...</span>
                            </button>
                        ` : state.user ? `
                            <div class="flex flex-col items-center gap-6">
                                <div class="flex items-center gap-4 bg-blue-500/10 border border-blue-500/20 p-2 pr-8 rounded-full backdrop-blur-2xl shadow-2xl">
                                    <img src="${state.user.avatar}" class="w-10 h-10 rounded-full border border-blue-400/30">
                                    <div class="text-left">
                                        <div class="text-[9px] text-blue-400 font-black uppercase tracking-widest">Identifié en tant que</div>
                                        <div class="text-sm font-black text-white uppercase italic tracking-tight">${state.user.username}</div>
                                    </div>
                                </div>
                                <button onclick="router('select')" class="group relative h-20 px-16 rounded-[28px] bg-white text-black font-black text-xl flex items-center gap-4 hover:scale-105 transition-all shadow-[0_0_60px_rgba(255,255,255,0.15)] uppercase italic tracking-tighter">
                                    Réintégrer le Terminal
                                    <i data-lucide="arrow-right" class="w-6 h-6 group-hover:translate-x-2 transition-transform"></i>
                                </button>
                            </div>
                        ` : `
                            <button onclick="actions.login()" class="group relative h-24 px-16 rounded-[32px] bg-white text-black font-black text-2xl flex items-center gap-6 hover:scale-105 transition-all shadow-[0_0_80px_rgba(255,255,255,0.2)] uppercase italic tracking-tighter">
                                <i data-lucide="log-in" class="w-8 h-8"></i>
                                Initialiser Connexion
                            </button>
                        `}
                    </div>
                </div>

                <!-- Features Grid -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl w-full mb-40">
                    <div class="glass-panel p-10 rounded-[40px] border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] hover:border-blue-500/30 transition-all text-left shadow-2xl group">
                        <div class="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 mb-8 border border-blue-500/10 group-hover:scale-110 transition-transform shadow-xl">
                            <i data-lucide="database" class="w-8 h-8"></i>
                        </div>
                        <h3 class="text-2xl font-black text-white mb-4 uppercase italic tracking-tight">Persistance Totale</h3>
                        <p class="text-sm text-gray-500 leading-relaxed font-medium uppercase tracking-wide">Vos actifs bancaires, votre patrimoine immobilier et votre casier judiciaire sont synchronisés en temps réel via notre cluster sécurisé.</p>
                    </div>
                    <div class="glass-panel p-10 rounded-[40px] border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] hover:border-purple-500/30 transition-all text-left shadow-2xl group">
                        <div class="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-400 mb-8 border border-purple-500/10 group-hover:scale-110 transition-transform shadow-xl">
                            <i data-lucide="building-2" class="w-8 h-8"></i>
                        </div>
                        <h3 class="text-2xl font-black text-white mb-4 uppercase italic tracking-tight">Économie de Marché</h3>
                        <p class="text-sm text-gray-500 leading-relaxed font-medium uppercase tracking-wide">Fondez votre empire industriel ou gérez des services publics. De la TVA aux salaires étatiques, chaque dollar a un impact.</p>
                    </div>
                    <div class="glass-panel p-10 rounded-[40px] border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] hover:border-red-500/30 transition-all text-left shadow-2xl group">
                        <div class="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-400 mb-8 border border-red-500/10 group-hover:scale-110 transition-transform shadow-xl">
                            <i data-lucide="skull" class="w-8 h-8"></i>
                        </div>
                        <h3 class="text-2xl font-black text-white mb-4 uppercase italic tracking-tight">Ombre & Lumière</h3>
                        <p class="text-sm text-gray-500 leading-relaxed font-medium uppercase tracking-wide">Intégrez les forces de l'ordre accréditées ou rejoignez les syndicats du crime pour dominer le marché noir clandestin.</p>
                    </div>
                </div>

                <!-- Staff & Direction -->
                <div class="w-full max-w-7xl mx-auto px-4">
                    <div class="text-center mb-20">
                        <div class="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] mb-4">Gouvernance Territoriale</div>
                        <h3 class="text-4xl font-black text-white uppercase italic tracking-tighter">Direction & Haut Commandement</h3>
                    </div>
                    
                    <div class="flex flex-wrap justify-center gap-10 mb-24">
                        ${founders.map(f => renderFounderCard(f)).join('')}
                    </div>
                    
                    ${others.length > 0 ? `
                        <div class="relative w-full overflow-hidden py-10">
                            <!-- Gradient Fades for Marquee -->
                            <div class="absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none"></div>
                            <div class="absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none"></div>
                            
                            <div class="animate-marquee flex gap-8">
                                ${staffCarouselItems.map(s => renderStaffCard(s)).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>

                <!-- Footer -->
                <div class="mt-40 pt-16 border-t border-white/5 w-full max-w-6xl flex flex-col md:flex-row justify-between items-center gap-8">
                    <div class="text-center md:text-left">
                        <div class="text-xs font-black text-gray-400 uppercase tracking-widest">&copy; 2024 Team French RolePlay</div>
                        <div class="text-[9px] text-gray-700 uppercase font-bold tracking-[0.2em] mt-1">Unified Management Portal • Los Angeles Division</div>
                    </div>
                    <div class="flex gap-8">
                        <button onclick="router('terms')" class="text-[10px] font-black text-gray-600 uppercase tracking-widest hover:text-white transition-colors">Conditions Générales</button>
                        <button onclick="router('privacy')" class="text-[10px] font-black text-gray-600 uppercase tracking-widest hover:text-white transition-colors">Confidentialité</button>
                        <a href="${CONFIG.INVITE_URL}" target="_blank" class="text-[10px] font-black text-blue-500 uppercase tracking-widest hover:text-blue-400 transition-colors">Support Discord</a>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;
};

export const DeletionPendingView = () => {
    const deletionDate = state.user.deletion_requested_at ? new Date(state.user.deletion_requested_at) : null;
    let timeRemainingStr = "Calcul...";
    if (deletionDate) {
        const expiry = new Date(deletionDate.getTime() + (3 * 24 * 60 * 60 * 1000));
        const diff = expiry - new Date();
        if (diff > 0) {
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            timeRemainingStr = `${days}j ${hours}h`;
        } else {
            timeRemainingStr = "Imminente";
        }
    }

    return `
    <div class="flex-1 flex items-center justify-center p-8 bg-[#050505] text-center animate-fade-in relative overflow-hidden">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(239,68,68,0.15),transparent_70%)] pointer-events-none"></div>
        <div class="glass-panel max-w-lg w-full p-12 rounded-[48px] border-red-500/30 relative z-10 shadow-2xl">
            <div class="w-24 h-24 bg-red-500/10 rounded-[32px] flex items-center justify-center mx-auto mb-10 text-red-500 border border-red-500/20 shadow-xl animate-pulse">
                <i data-lucide="shield-alert" class="w-12 h-12"></i>
            </div>
            <h2 class="text-3xl font-black text-white mb-4 tracking-tighter uppercase italic">Compte en cours de purge</h2>
            <p class="text-gray-400 mb-10 leading-relaxed font-medium">
                Conformément à votre demande RGPD, vos données sont marquées pour destruction.<br><br>
                L'accès aux services est <span class="text-red-500 font-black">verrouillé</span> durant cette période de réflexion.
            </p>
            
            <div class="bg-black/40 p-8 rounded-3xl border border-white/5 mb-10">
                <div class="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-2">Destruction programmée dans</div>
                <div class="text-4xl font-mono font-black text-white tracking-tighter">${timeRemainingStr}</div>
            </div>

            <div class="space-y-4">
                <button onclick="actions.cancelDataDeletion()" class="glass-btn w-full py-5 rounded-2xl font-black flex items-center justify-center gap-4 bg-white text-black hover:bg-gray-200 transition-all shadow-xl uppercase tracking-widest">
                    <i data-lucide="shield-check" class="w-6 h-6"></i>
                    Annuler la suppression
                </button>
                <button onclick="actions.logout()" class="w-full py-4 rounded-2xl text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] hover:text-white transition-colors">
                    Déconnexion
                </button>
            </div>
        </div>
    </div>
    `;
}

export const AccessDeniedView = () => `
    <div class="flex-1 flex flex-col items-center justify-center p-8 bg-[#050505] text-center animate-fade-in relative overflow-hidden">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(239,68,68,0.1),transparent_70%)] pointer-events-none"></div>
        <div class="glass-panel max-w-md w-full p-12 rounded-[48px] border-red-500/30 relative z-10 shadow-2xl">
            <div class="w-24 h-24 bg-red-500/10 rounded-[32px] flex items-center justify-center mx-auto mb-10 text-red-500 border border-red-500/20 shadow-xl">
                <i data-lucide="shield-alert" class="w-12 h-12"></i>
            </div>
            <h2 class="text-3xl font-black text-white mb-6 tracking-tighter uppercase italic">Vérification Échouée</h2>
            <p class="text-gray-400 mb-12 leading-relaxed font-medium">
                Votre profil Discord a été authentifié, mais vous n'êtes pas membre du serveur <b>Team French RolePlay</b>.<br><br>L'accès au terminal gouvernemental nécessite une affiliation communautaire valide.
            </p>
            <div class="space-y-6">
                <a href="${CONFIG.INVITE_URL}" target="_blank" class="glass-btn w-full py-5 rounded-2xl font-black flex items-center justify-center gap-4 bg-white text-black hover:bg-gray-200 transition-all shadow-xl uppercase tracking-widest">
                    <i data-lucide="external-link" class="w-6 h-6"></i>
                    Rejoindre le Réseau
                </a>
                <button onclick="actions.logout()" class="w-full py-4 rounded-2xl text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] hover:text-white transition-colors">
                    Relancer l'identification
                </button>
            </div>
        </div>
    </div>
`;
