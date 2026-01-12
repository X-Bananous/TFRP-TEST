import { CONFIG } from '../config.js';
import { state } from '../state.js';
import { router } from '../utils.js';

export const LoginView = () => {
    const validStaff = state.landingStaff.filter(s => s.id !== '1449442051904245812');
    const founders = validStaff.filter(s => state.adminIds.includes(s.id));
    const others = validStaff.filter(s => !state.adminIds.includes(s.id));
    const staffCarouselItems = others.length > 0 ? [...others, ...others, ...others] : [];

    // Live Data
    const tva = state.economyConfig?.tva_tax || 0;
    const activeHeists = state.globalActiveHeists?.length || 0;
    const population = state.erlcData?.currentPlayers || 0;
    const maxPop = state.erlcData?.maxPlayers || 42;

    const renderFounderCard = (s) => {
        const status = state.discordStatuses[s.id] || 'offline';
        const statusColor = { online: 'bg-green-500', idle: 'bg-yellow-500', dnd: 'bg-red-500', offline: 'bg-zinc-600' }[status];
        return `
            <div class="melony-card p-6 md:p-8 rounded-[32px] flex flex-col items-center w-full sm:w-64">
                <div class="relative mb-4">
                    <img src="${s.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png'}" class="w-20 h-20 rounded-[24px] object-cover border border-white/5 shadow-2xl">
                    <div class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full ${statusColor} border-4 border-[#0A0A0A]"></div>
                </div>
                <div class="text-center">
                    <div class="font-bold text-white text-lg uppercase tracking-tight">${s.username}</div>
                    <div class="text-[9px] text-blue-500 font-black uppercase tracking-[0.2em] mt-1 bg-blue-500/10 px-3 py-1 rounded-full">Cabinet Municipal</div>
                </div>
            </div>
        `;
    };

    const renderStaffCard = (s) => (
        `<div class="melony-card p-4 rounded-2xl flex items-center gap-4 shrink-0 w-64">
            <img src="${s.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png'}" class="w-10 h-10 rounded-xl object-cover border border-white/5">
            <div class="min-w-0">
                <div class="font-bold text-white text-xs truncate uppercase tracking-tight">${s.username}</div>
                <div class="text-[8px] text-gray-500 uppercase tracking-widest">Administration</div>
            </div>
        </div>`
    );

    return `
    <div class="min-h-screen flex flex-col bg-black text-white selection:bg-blue-600">
        <!-- Overlay de fond Melony -->
        <div class="fixed inset-0 pointer-events-none overflow-hidden">
            <div class="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-blue-600/5 blur-[120px] rounded-full"></div>
        </div>

        <!-- Header Officiel -->
        <header class="w-full bg-white text-black py-4 px-6 md:px-12 flex justify-between items-center z-[100] border-b-4 border-[#000091]">
            <div class="flex items-center gap-4">
                <div class="gov-logo-block border-l-2 border-black pl-3 py-1">
                    <span class="text-[10px] font-black uppercase tracking-tighter">République de</span>
                    <span class="text-lg font-black uppercase tracking-tighter leading-none">Los Angeles</span>
                </div>
                <div class="hidden md:block w-px h-10 bg-gray-200 mx-2"></div>
                <div class="hidden md:block">
                    <span class="text-[10px] font-black uppercase tracking-widest text-gray-500">Liberté • Égalité • Roleplay</span>
                </div>
            </div>
            <div class="flex items-center gap-4">
                 ${state.user ? `
                    <button onclick="actions.logout()" class="text-[10px] font-black uppercase tracking-widest text-red-600 hover:underline">Déconnexion</button>
                ` : `
                    <button onclick="actions.login()" class="px-5 py-2 rounded-lg bg-[#000091] text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-800 transition-all shadow-lg">Se connecter</button>
                `}
            </div>
        </header>

        <!-- Barre de Statut Live -->
        <div class="w-full bg-[#f6f6f6] dark:bg-[#121212] border-b border-gray-200 dark:border-white/5 py-3 px-6 md:px-12 flex flex-wrap items-center justify-center gap-6 md:gap-12 z-[90]">
            <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span class="text-[10px] font-bold uppercase tracking-widest text-gray-500">Population : <span class="text-black dark:text-white">${population}/${maxPop}</span></span>
            </div>
            <div class="flex items-center gap-2">
                <i data-lucide="percent" class="w-3.5 h-3.5 text-blue-600"></i>
                <span class="text-[10px] font-bold uppercase tracking-widest text-gray-500">TVA Municipale : <span class="text-black dark:text-white">${tva}%</span></span>
            </div>
            <div class="flex items-center gap-2">
                <i data-lucide="shield-alert" class="w-3.5 h-3.5 ${activeHeists > 0 ? 'text-red-500 animate-bounce' : 'text-gray-400'}"></i>
                <span class="text-[10px] font-bold uppercase tracking-widest text-gray-500">Braquages : <span class="text-black dark:text-white">${activeHeists > 0 ? `${activeHeists} EN COURS` : 'RAS'}</span></span>
            </div>
        </div>

        <!-- Main Content -->
        <main class="flex-1 px-6 pb-20 relative z-10 pt-16">
            <div class="max-w-6xl mx-auto flex flex-col items-center text-center">
                
                <!-- Hero Section Officielle -->
                <div class="animate-melony" style="animation-delay: 0.1s">
                    <h1 class="text-5xl md:text-8xl font-black tracking-tighter leading-[0.9] uppercase italic text-gradient mb-8">
                        PORTAIL<br>GOUVERNEMENTAL
                    </h1>
                    <p class="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-12 font-medium leading-relaxed">
                        Bienvenue sur la plateforme officielle de la municipalité de Los Angeles. Gérez votre identité numérique, vos actifs financiers et vos relations administratives.
                    </p>
                    
                    <div class="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16">
                        ${state.isLoggingIn ? `
                            <button disabled class="w-full sm:w-auto h-16 px-12 rounded-2xl melony-glass text-white/50 flex items-center gap-4 cursor-wait">
                                <div class="loader-spinner w-5 h-5 border-2"></div>
                                <span class="text-xs font-black uppercase tracking-widest">Identification...</span>
                            </button>
                        ` : state.user ? `
                            <button onclick="router('select')" class="w-full sm:w-auto h-16 px-12 rounded-2xl btn-melony-primary flex items-center justify-center gap-3 shadow-[0_20px_40px_rgba(255,255,255,0.1)]">
                                <span class="text-xs font-black uppercase tracking-widest">Accéder au Terminal Civil</span>
                                <i data-lucide="arrow-right" class="w-4 h-4"></i>
                            </button>
                        ` : `
                            <button onclick="actions.login()" class="w-full sm:w-auto h-16 px-12 rounded-2xl btn-melony-primary flex items-center justify-center gap-3 shadow-[0_20px_40px_rgba(255,255,255,0.1)]">
                                <i data-lucide="log-in" class="w-5 h-5"></i>
                                <span class="text-xs font-black uppercase tracking-widest">Espace Citoyen</span>
                            </button>
                            <a href="${CONFIG.INVITE_URL}" target="_blank" class="w-full sm:w-auto h-16 px-12 rounded-2xl melony-glass flex items-center justify-center gap-3 text-white border border-white/10 hover:bg-white/5 transition-all">
                                <i data-lucide="discord" class="w-5 h-5"></i>
                                <span class="text-xs font-black uppercase tracking-widest">Rejoindre le Discord</span>
                            </a>
                        `}
                    </div>
                </div>

                <!-- Liens de Règlement / Documents Officiels -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-32 animate-melony" style="animation-delay: 0.2s">
                    <a href="https://discord.com/channels/1279455759414857759/1445853998774226964" target="_blank" class="gov-card p-8 rounded-2xl text-left flex flex-col justify-between h-56 shadow-xl border-l-4 border-l-blue-800">
                        <div>
                            <i data-lucide="scroll" class="w-8 h-8 text-blue-800 mb-4"></i>
                            <h3 class="text-xl font-black uppercase tracking-tight mb-2">Règlement Roleplay</h3>
                            <p class="text-xs opacity-70 font-medium">Consultez la charte de conduite et les lois en vigueur dans la cité de Los Angeles.</p>
                        </div>
                        <div class="text-[10px] font-black uppercase text-blue-800 flex items-center gap-2">Consulter <i data-lucide="external-link" class="w-3 h-3"></i></div>
                    </a>
                    <a href="https://discord.com/channels/1279455759414857759/1280129294412021813" target="_blank" class="gov-card p-8 rounded-2xl text-left flex flex-col justify-between h-56 shadow-xl border-l-4 border-l-gray-400">
                        <div>
                            <i data-lucide="message-square" class="w-8 h-8 text-gray-500 mb-4"></i>
                            <h3 class="text-xl font-black uppercase tracking-tight mb-2">Règlement Discord</h3>
                            <p class="text-xs opacity-70 font-medium">Cadre d'utilisation des services de communication et d'échanges communautaires.</p>
                        </div>
                        <div class="text-[10px] font-black uppercase text-gray-600 flex items-center gap-2">Lire le document <i data-lucide="external-link" class="w-3 h-3"></i></div>
                    </a>
                    <a href="https://discord.com/channels/1279455759414857759/1445853905144516628" target="_blank" class="gov-card p-8 rounded-2xl text-left flex flex-col justify-between h-56 shadow-xl border-l-4 border-l-red-700">
                        <div>
                            <i data-lucide="file-check" class="w-8 h-8 text-red-700 mb-4"></i>
                            <h3 class="text-xl font-black uppercase tracking-tight mb-2">Recensement</h3>
                            <p class="text-xs opacity-70 font-medium">Immigrer en ville : procédure de validation et d'enregistrement des nouveaux citoyens.</p>
                        </div>
                        <div class="text-[10px] font-black uppercase text-red-700 flex items-center gap-2">Débuter l'immigration <i data-lucide="external-link" class="w-3 h-3"></i></div>
                    </a>
                </div>

                <!-- Features Grid -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-12 animate-melony" style="animation-delay: 0.3s">
                    <div class="melony-card p-10 rounded-[40px] text-left">
                        <div class="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 mb-6 border border-blue-500/20">
                            <i data-lucide="database" class="w-6 h-6"></i>
                        </div>
                        <h3 class="text-xl font-black uppercase italic tracking-tight mb-3">Sync Persistante</h3>
                        <p class="text-sm text-gray-500 font-medium leading-relaxed">Vos données bancaires et inventaires sont protégés par le Secret d'État.</p>
                    </div>
                    <div class="melony-card p-10 rounded-[40px] text-left">
                        <div class="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-500 mb-6 border border-purple-500/20">
                            <i data-lucide="building-2" class="w-6 h-6"></i>
                        </div>
                        <h3 class="text-xl font-black uppercase italic tracking-tight mb-3">Libre Entreprise</h3>
                        <p class="text-sm text-gray-500 font-medium leading-relaxed">Déposez vos statuts et dynamisez l'économie locale sous licence officielle.</p>
                    </div>
                    <div class="melony-card p-10 rounded-[40px] text-left">
                        <div class="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 mb-6 border border-emerald-500/20">
                            <i data-lucide="shield-check" class="w-6 h-6"></i>
                        </div>
                        <h3 class="text-xl font-black uppercase italic tracking-tight mb-3">Service Public</h3>
                        <p class="text-sm text-gray-500 font-medium leading-relaxed">Des outils certifiés pour les agents de police, de santé et les magistrats.</p>
                    </div>
                </div>

                <!-- Staff Section -->
                <div class="w-full mt-40 animate-melony" style="animation-delay: 0.5s">
                    <div class="mb-12">
                        <h2 class="text-3xl md:text-5xl font-black uppercase italic tracking-tighter mb-2">Conseil Municipal</h2>
                        <div class="w-12 h-1 bg-[#000091] mx-auto rounded-full"></div>
                    </div>
                    
                    <div class="flex flex-wrap justify-center gap-6 mb-20">
                        ${founders.map(f => renderFounderCard(f)).join('')}
                    </div>
                    
                    ${others.length > 0 ? `
                        <div class="relative w-full overflow-hidden marquee-container py-10">
                            <div class="animate-marquee flex gap-6">
                                ${staffCarouselItems.map(s => renderStaffCard(s)).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>

                <!-- Footer -->
                <footer class="mt-40 pt-10 border-t border-white/5 w-full flex flex-col md:flex-row justify-between items-center gap-8">
                    <div class="text-center md:text-left">
                        <div class="text-[10px] font-black text-gray-600 uppercase tracking-widest">&copy; 2025 TEAM FRENCH ROLEPLAY</div>
                        <div class="text-[9px] text-gray-800 uppercase font-bold tracking-widest mt-1">Design Institutionnel • Plateforme v5.5 Stable</div>
                    </div>
                    <div class="flex gap-8">
                        <button onclick="router('terms')" class="text-[9px] font-black text-gray-600 uppercase tracking-widest hover:text-white transition-colors">Conditions</button>
                        <button onclick="router('privacy')" class="text-[9px] font-black text-gray-600 uppercase tracking-widest hover:text-white transition-colors">Vie Privée</button>
                        <a href="${CONFIG.INVITE_URL}" target="_blank" class="text-[9px] font-black text-blue-500 uppercase tracking-widest hover:text-blue-400 transition-colors">Support</a>
                    </div>
                </footer>
            </div>
        </main>
    </div>
    `;
};

export const AccessDeniedView = () => `
    <div class="min-h-screen flex items-center justify-center p-6 bg-black text-center animate-melony">
        <div class="melony-card max-w-md p-10 rounded-[40px] border-red-500/20 shadow-2xl">
            <div class="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-red-500 border border-red-500/20">
                <i data-lucide="shield-alert" class="w-8 h-8"></i>
            </div>
            <h2 class="text-3xl font-black text-white mb-4 uppercase italic tracking-tighter">Accès Refusé</h2>
            <p class="text-gray-500 mb-10 text-sm leading-relaxed font-medium">Votre identité Discord n'est pas répertoriée sur notre serveur officiel. Rejoignez-nous pour accéder au panel.</p>
            <div class="flex flex-col gap-3">
                <a href="${CONFIG.INVITE_URL}" target="_blank" class="w-full py-4 rounded-2xl bg-red-600 text-white font-black text-[10px] uppercase tracking-[0.2em] hover:bg-red-500 transition-all shadow-xl shadow-red-900/20">Rejoindre Discord</a>
                <button onclick="actions.logout()" class="text-[9px] font-black text-gray-600 uppercase tracking-widest hover:text-white transition-colors py-2">Retour au Terminal</button>
            </div>
        </div>
    </div>
`;

export const DeletionPendingView = () => {
    const u = state.user;
    const deletionDate = u.deletion_requested_at ? new Date(u.deletion_requested_at) : null;
    let timeRemainingStr = "Calcul...";
    if (deletionDate) {
        const expiry = new Date(deletionDate.getTime() + (3 * 24 * 60 * 60 * 1000));
        const diff = expiry - new Date();
        if (diff > 0) {
            const d = Math.floor(diff / (1000 * 60 * 60 * 24));
            const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            timeRemainingStr = `${d}j ${h}h`;
        } else { timeRemainingStr = "Imminente"; }
    }

    return `
    <div class="min-h-screen flex items-center justify-center p-6 bg-black text-center animate-melony">
        <div class="melony-card max-w-md p-10 rounded-[40px] border-orange-500/20 shadow-2xl">
            <div class="w-16 h-16 bg-orange-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-orange-500 border border-orange-500/20">
                <i data-lucide="trash-2" class="w-8 h-8"></i>
            </div>
            <h2 class="text-3xl font-black text-white mb-2 uppercase italic tracking-tighter">Purge en Cours</h2>
            <p class="text-gray-500 mb-10 text-sm leading-relaxed font-medium">Votre compte est marqué pour suppression définitive dans :</p>
            <div class="bg-white/5 p-8 rounded-3xl border border-white/5 mb-10">
                <div class="text-4xl font-mono font-black text-white tracking-tighter">${timeRemainingStr}</div>
            </div>
            <div class="flex flex-col gap-3">
                <button onclick="actions.cancelDataDeletion()" class="w-full py-4 rounded-2xl bg-white text-black font-black text-[10px] uppercase tracking-[0.2em] shadow-xl">ANNULER LA PROCÉDURE</button>
                <button onclick="actions.logout()" class="text-[9px] font-black text-gray-600 uppercase tracking-widest hover:text-white transition-colors py-2">Déconnexion temporaire</button>
            </div>
        </div>
    </div>
    `;
};
