
import { CONFIG } from '../config.js';
import { state } from '../state.js';
import { router } from '../utils.js';

export const LoginView = () => {
    // 1. SORT STAFF: Founders First
    const sortedStaff = [...state.landingStaff].sort((a, b) => {
        const aIsFounder = CONFIG.ADMIN_IDS.includes(a.id);
        const bIsFounder = CONFIG.ADMIN_IDS.includes(b.id);
        if (aIsFounder && !bIsFounder) return -1;
        if (!aIsFounder && bIsFounder) return 1;
        return 0; // Keep original order otherwise
    });

    // 2. GENERATE STAFF HTML
    const staffHtml = sortedStaff.length > 0 ? sortedStaff.map(s => {
        const isFounder = CONFIG.ADMIN_IDS.includes(s.id);
        // Get Discord Status from widget data
        const discordStatus = state.discordStatuses[s.id] || 'offline';
        const discordColor = {
            online: 'bg-green-500',
            idle: 'bg-yellow-500',
            dnd: 'bg-red-500',
            offline: 'bg-gray-500'
        }[discordStatus] || 'bg-gray-500';

        return `
        <div class="snap-start shrink-0 w-36 glass-card p-3 rounded-2xl flex flex-col items-center justify-center border ${isFounder ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-white/5'} hover:bg-white/5 transition-colors group relative">
            <div class="w-12 h-12 rounded-full border-2 ${s.is_on_duty ? 'border-green-500' : 'border-white/10'} p-0.5 mb-2 relative">
                <img src="${s.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png'}" class="w-full h-full rounded-full object-cover">
                <!-- Panel Status Dot (Left) -->
                ${s.is_on_duty ? '<div class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border border-black animate-pulse" title="En Service Panel"></div>' : ''}
            </div>
            
            <div class="text-xs font-bold text-white truncate w-full text-center flex flex-col items-center">
                ${s.username}
                ${isFounder ? '<span class="text-[9px] text-yellow-400 font-bold uppercase mt-1 tracking-wider">👑 Fondateur</span>' : ''}
            </div>
            
            <div class="flex items-center gap-3 mt-2 w-full justify-center bg-black/20 rounded py-1">
                 <div class="flex flex-col items-center gap-0.5" title="Panel Status">
                     <div class="w-2 h-2 rounded-full ${s.is_on_duty ? 'bg-green-400' : 'bg-gray-600'}"></div>
                     <span class="text-[8px] text-gray-500 uppercase">Panel</span>
                 </div>
                 <div class="w-[1px] h-4 bg-white/10"></div>
                 <div class="flex flex-col items-center gap-0.5" title="Discord Status">
                     <div class="w-2 h-2 rounded-full ${discordColor}"></div>
                     <span class="text-[8px] text-gray-500 uppercase">Discord</span>
                 </div>
            </div>
        </div>
    `}).join('') : '<div class="text-gray-500 text-xs text-center w-full py-4">Aucun membre du staff listé.</div>';

    return `
    <div class="flex-1 flex flex-col relative overflow-hidden h-full w-full bg-[#050505]">
        <div class="landing-gradient-bg"></div>
        
        <nav class="relative z-10 w-full p-6 flex justify-between items-center animate-fade-in shrink-0">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <i data-lucide="shield-check" class="w-5 h-5 text-white"></i>
                </div>
                <span class="font-bold text-xl tracking-tight text-white">TFRP</span>
            </div>
            <a href="${CONFIG.INVITE_URL}" target="_blank" class="glass-btn-secondary px-5 py-2.5 rounded-full text-sm font-medium flex items-center gap-2 hover:bg-white/10 transition-all cursor-pointer">
                <i data-lucide="users" class="w-4 h-4"></i>
                Rejoindre Discord
            </a>
        </nav>

        <div class="flex-1 overflow-y-auto custom-scrollbar relative z-10">
            <div class="min-h-full flex flex-col">
                <!-- Hero Section -->
                <div class="flex-1 flex flex-col items-center justify-center text-center px-6 py-10 animate-slide-up w-full max-w-7xl mx-auto">
                    <div class="mb-6 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md inline-flex items-center gap-2">
                        <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        <span class="text-xs font-medium text-gray-300 tracking-wide uppercase">Serveur Ouvert • ERLC Roblox</span>
                    </div>
                    
                    <h1 class="landing-hero-text mb-6">
                        Team French<br>RolePlay
                    </h1>
                    
                    <p class="text-lg text-gray-400 max-w-2xl mb-10 leading-relaxed">
                        Bienvenue à <b>Los Angeles</b>, Global City et cœur de la Mégalopole de Californie.
                        <br>Ici, écrivez votre propre histoire sans aucune limite.
                    </p>

                    <div class="flex flex-col md:flex-row gap-4 w-full max-w-md md:max-w-none justify-center mb-16">
                        ${state.isLoggingIn ? `
                            <button disabled class="glass-btn h-14 px-8 rounded-full font-bold text-lg flex items-center justify-center gap-3 w-64">
                                <div class="loader-spinner w-5 h-5 border-2"></div>
                                Connexion...
                            </button>
                        ` : `
                            <button onclick="actions.login()" class="glass-btn h-14 px-8 rounded-full font-bold text-lg flex items-center justify-center gap-3 transition-transform hover:scale-105 cursor-pointer shadow-[0_0_40px_rgba(10,132,255,0.3)]">
                                <i data-lucide="gamepad-2" class="w-6 h-6"></i>
                                Connexion Citoyen
                            </button>
                        `}
                        <a href="${CONFIG.INVITE_URL}" target="_blank" class="glass-btn-secondary h-14 px-8 rounded-full font-bold text-lg flex items-center justify-center gap-3 transition-transform hover:scale-105 cursor-pointer bg-white/5 hover:bg-white/10">
                            <i data-lucide="message-circle" class="w-6 h-6"></i>
                            Communauté
                        </a>
                    </div>

                    <!-- Info Bubbles Grid -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full mx-auto px-4 mb-12">
                        <!-- Bubble 1: Context -->
                        <div class="glass-panel p-6 rounded-2xl text-left border border-blue-500/20 hover:border-blue-500/40 transition-colors">
                            <div class="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center mb-4 text-blue-400">
                                <i data-lucide="globe-2" class="w-5 h-5"></i>
                            </div>
                            <h3 class="font-bold text-white text-lg mb-2">Global City</h3>
                            <p class="text-sm text-gray-400 leading-relaxed">
                                Plongez au cœur de la Mégalopole Californienne. Une immersion réaliste dans une ville qui ne dort jamais.
                            </p>
                        </div>

                        <!-- Bubble 2: Gameplay -->
                        <div class="glass-panel p-6 rounded-2xl text-left border border-purple-500/20 hover:border-purple-500/40 transition-colors">
                            <div class="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center mb-4 text-purple-400">
                                <i data-lucide="users" class="w-5 h-5"></i>
                            </div>
                            <h3 class="font-bold text-white text-lg mb-2">Liberté Totale</h3>
                            <p class="text-sm text-gray-400 leading-relaxed">
                                RP Légal, Illégal, Gérant d'entreprise ou simple Fermier. Tout est possible, votre imagination est la seule limite.
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Stats & Staff (Footer) -->
                <div class="shrink-0 relative z-10 py-12 border-t border-white/5 bg-[#050505]/90 backdrop-blur-md mt-auto w-full">
                    <div class="max-w-6xl mx-auto px-6">
                        
                        <!-- Staff Carousel -->
                        <div>
                            <h3 class="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <i data-lucide="shield" class="w-5 h-5 text-purple-400"></i> Équipe Staff
                            </h3>
                            <div class="flex gap-3 overflow-x-auto snap-x custom-scrollbar pb-4">
                                ${staffHtml}
                            </div>
                        </div>

                        <!-- Legal Links -->
                        <div class="mt-8 pt-8 border-t border-white/5 flex justify-center gap-6 text-xs text-gray-500">
                            <button onclick="router('terms')" class="hover:text-white transition-colors">Conditions d'utilisation</button>
                            <button onclick="router('privacy')" class="hover:text-white transition-colors">Politique de confidentialité</button>
                            <span>&copy; 2024 TFRP</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;
};

export const AccessDeniedView = () => `
    <div class="flex-1 flex items-center justify-center p-6 animate-fade-in relative overflow-hidden h-full">
        <div class="glass-panel border-red-500/30 w-full max-w-md p-10 rounded-[40px] flex flex-col items-center text-center relative z-10 shadow-[0_0_50px_rgba(239,68,68,0.2)]">
            <div class="mb-6 relative">
                <div class="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center shadow-lg shadow-red-500/20 mb-4 mx-auto animate-pulse">
                    <i data-lucide="lock" class="w-10 h-10 text-red-500"></i>
                </div>
                <h1 class="text-2xl font-bold text-white mb-2">Accès Refusé</h1>
                <p class="text-gray-400 text-sm">Vous n'êtes pas membre du serveur Discord TFRP.</p>
            </div>
            <div class="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-xs text-red-200 mb-8 w-full">
                Pour accéder au panel et créer votre personnage, vous devez rejoindre notre communauté Discord.
            </div>
            <a href="${CONFIG.INVITE_URL}" target="_blank" class="w-full bg-white text-black hover:bg-gray-200 p-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] cursor-pointer mb-3">
                <i data-lucide="user-plus" class="w-5 h-5"></i>
                Rejoindre le Discord
            </a>
            <button onclick="actions.logout()" class="text-gray-500 text-xs hover:text-white transition-colors mt-4">
                Retour à l'accueil
            </button>
        </div>
    </div>
`;
