import { CONFIG } from '../config.js';
import { state } from '../state.js';
import { router } from '../utils.js';

export const LoginView = () => {
    const validStaff = state.landingStaff.filter(s => s.id !== '1449442051904245812');
    const founders = validStaff.filter(s => state.adminIds.includes(s.id));
    const others = validStaff.filter(s => !state.adminIds.includes(s.id));
    const staffCarouselItems = others.length > 0 ? [...others, ...others, ...others] : [];

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
                    <div class="text-[9px] text-blue-500 font-black uppercase tracking-[0.2em] mt-1 bg-blue-500/10 px-3 py-1 rounded-full">Direction</div>
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
            <div class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full"></div>
            <div class="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-blue-900/10 blur-[100px] rounded-full"></div>
        </div>

        <!-- Navigation Flottante -->
        <nav class="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-5xl px-6 py-4 melony-glass rounded-[24px] flex justify-between items-center animate-melony shadow-2xl">
            <div class="font-black text-xl tracking-tighter italic uppercase">TFRP</div>
            <div class="flex items-center gap-4 md:gap-8">
                <a href="${CONFIG.INVITE_URL}" target="_blank" class="hidden sm:block text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white transition-colors">Discord</a>
                ${state.user ? `
                    <button onclick="actions.logout()" class="px-5 py-2.5 rounded-xl bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest border border-red-500/20 hover:bg-red-500 hover:text-white transition-all">Déconnexion</button>
                ` : `
                    <button onclick="actions.login()" class="px-6 py-2.5 rounded-xl bg-white text-black text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl">Connexion</button>
                `}
            </div>
        </nav>

        <!-- Main Content -->
        <main class="flex-1 pt-40 px-6 pb-20 relative z-10">
            <div class="max-w-6xl mx-auto flex flex-col items-center text-center">
                
                <!-- Hero -->
                <div class="animate-melony" style="animation-delay: 0.1s">
                    <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8">
                        <span class="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
                        <span class="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-300">Statut: En Ligne</span>
                    </div>
                    <h1 class="text-5xl md:text-8xl font-black tracking-tighter leading-[0.9] uppercase italic text-gradient mb-8">
                        TEAM FRENCH<br>ROLEPLAY
                    </h1>
                    <p class="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-12 font-medium leading-relaxed">
                        L'expérience Roleplay ultime. Sécurisée, persistante et pilotée par la communauté.
                    </p>
                    
                    <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
                        ${state.isLoggingIn ? `
                            <button disabled class="w-full sm:w-auto h-16 px-12 rounded-2xl melony-glass text-white/50 flex items-center gap-4 cursor-wait">
                                <div class="loader-spinner w-5 h-5 border-2"></div>
                                <span class="text-xs font-black uppercase tracking-widest">Initialisation...</span>
                            </button>
                        ` : state.user ? `
                            <button onclick="router('select')" class="w-full sm:w-auto h-16 px-12 rounded-2xl btn-melony-primary flex items-center justify-center gap-3 shadow-[0_20px_40px_rgba(255,255,255,0.1)]">
                                <span class="text-xs font-black uppercase tracking-widest">Ouvrir le Terminal</span>
                                <i data-lucide="arrow-right" class="w-4 h-4"></i>
                            </button>
                        ` : `
                            <button onclick="actions.login()" class="w-full sm:w-auto h-16 px-12 rounded-2xl btn-melony-primary flex items-center justify-center gap-3 shadow-[0_20px_40px_rgba(255,255,255,0.1)]">
                                <i data-lucide="log-in" class="w-5 h-5"></i>
                                <span class="text-xs font-black uppercase tracking-widest">S'identifier</span>
                            </button>
                            <a href="${CONFIG.INVITE_URL}" target="_blank" class="w-full sm:w-auto h-16 px-12 rounded-2xl melony-glass flex items-center justify-center gap-3 text-white border border-white/10 hover:bg-white/5 transition-all">
                                <i data-lucide="discord" class="w-5 h-5"></i>
                                <span class="text-xs font-black uppercase tracking-widest">Rejoindre Discord</span>
                            </a>
                        `}
                    </div>
                </div>

                <!-- Features Grid -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-32 animate-melony" style="animation-delay: 0.3s">
                    <div class="melony-card p-10 rounded-[40px] text-left">
                        <div class="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 mb-6 border border-blue-500/20">
                            <i data-lucide="database" class="w-6 h-6"></i>
                        </div>
                        <h3 class="text-xl font-black uppercase italic tracking-tight mb-3">Sync Persistante</h3>
                        <p class="text-sm text-gray-500 font-medium leading-relaxed">Vos données, inventaires et comptes sont sauvegardés en temps réel sur notre cluster.</p>
                    </div>
                    <div class="melony-card p-10 rounded-[40px] text-left">
                        <div class="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-500 mb-6 border border-purple-500/20">
                            <i data-lucide="building-2" class="w-6 h-6"></i>
                        </div>
                        <h3 class="text-xl font-black uppercase italic tracking-tight mb-3">Économie Libre</h3>
                        <p class="text-sm text-gray-500 font-medium leading-relaxed">Créez votre entreprise, gérez vos employés et dominez le marché local.</p>
                    </div>
                    <div class="melony-card p-10 rounded-[40px] text-left">
                        <div class="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 mb-6 border border-emerald-500/20">
                            <i data-lucide="shield-check" class="w-6 h-6"></i>
                        </div>
                        <h3 class="text-xl font-black uppercase italic tracking-tight mb-3">CAD Intégré</h3>
                        <p class="text-sm text-gray-500 font-medium leading-relaxed">Outils professionnels pour la police, les secours et la justice directement via le panel.</p>
                    </div>
                </div>

                <!-- Staff Section -->
                <div class="w-full mt-40 animate-melony" style="animation-delay: 0.5s">
                    <div class="mb-12">
                        <h2 class="text-3xl md:text-5xl font-black uppercase italic tracking-tighter mb-2">Direction</h2>
                        <div class="w-12 h-1 bg-blue-600 mx-auto rounded-full"></div>
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
                        <div class="text-[9px] text-gray-800 uppercase font-bold tracking-widest mt-1">Design & Dev par MatMat • v5.2 Stable</div>
                    </div>
                    <div class="flex gap-8">
                        <button onclick="router('terms')" class="text-[9px] font-black text-gray-600 uppercase tracking-widest hover:text-white transition-colors">CGU</button>
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