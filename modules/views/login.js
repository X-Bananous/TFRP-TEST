import { CONFIG } from '../config.js';
import { state } from '../state.js';
import { router } from '../utils.js';
import { HEIST_DATA } from './illicit.js';

export const LoginView = () => {
    const EXCLUDED_ID = '1449442051904245812';
    const validStaff = (state.landingStaff || []).filter(s => s.id !== EXCLUDED_ID);
    const founders = validStaff.filter(s => state.adminIds.includes(s.id));
    const others = validStaff.filter(s => !state.adminIds.includes(s.id));
    const staffCarouselItems = others.length > 0 ? [...others, ...others] : [];

    // Live Data Extraction
    const majorHeists = state.globalActiveHeists?.filter(h => !['house', 'gas', 'atm'].includes(h.heist_type)) || [];
    const tva = state.economyConfig?.tva_tax || 0;
    const itemTax = state.economyConfig?.create_item_ent_tax || 0;

    const renderFounderCard = (s) => {
        const status = state.discordStatuses[s.id] || 'offline';
        const color = { online: 'bg-emerald-500', idle: 'bg-amber-500', dnd: 'bg-red-500', offline: 'bg-zinc-600' }[status];
        return `
            <div class="gov-card p-6 flex flex-col items-center w-64 text-center">
                <div class="relative mb-4">
                    <img src="${s.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png'}" class="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md">
                    <div class="absolute bottom-0 right-0 w-6 h-6 rounded-full ${color} border-4 border-white" title="Discord: ${status}"></div>
                </div>
                <div class="font-bold text-lg uppercase tracking-tight text-[#000091]">${s.username}</div>
                <div class="text-[10px] font-black uppercase text-gray-500 tracking-widest mt-1">Cabinet de Direction</div>
            </div>
        `;
    };

    return `
    <div class="flex-1 flex flex-col h-full w-full bg-white dark:bg-[#161616] text-[#161616] dark:text-[#eee] overflow-x-hidden">
        
        <!-- HEADER INSTITUTIONNEL -->
        <header class="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#161616] z-50">
            <div class="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                <div class="flex items-center gap-6">
                    <!-- Pseudo Marianne Logo -->
                    <div class="marianne-block flex flex-col border-l-2 border-[#000091] pl-4">
                        <span class="marianne-devise font-bold text-[8px] text-[#000091] dark:text-blue-400">Réalisme / Immersion / Communauté</span>
                        <span class="text-xl font-black tracking-tighter text-gray-900 dark:text-white uppercase leading-none">TFRP<br><span class="text-sm font-bold opacity-70">Los Angeles</span></span>
                    </div>
                    <div class="hidden lg:block w-px h-12 bg-gray-200 mx-4"></div>
                    <div class="hidden lg:block">
                        <h1 class="text-sm font-black uppercase tracking-tight">Portail de l'administration<br><span class="font-normal text-xs text-gray-500 italic">Plateforme officielle des citoyens</span></h1>
                    </div>
                </div>

                <div class="flex items-center gap-4">
                    ${state.user ? `
                        <div class="flex items-center gap-3 pr-4 border-r border-gray-200 dark:border-gray-800 hidden sm:flex">
                            <img src="${state.user.avatar}" class="w-8 h-8 rounded-full">
                            <span class="text-xs font-bold uppercase">${state.user.username}</span>
                        </div>
                        <button onclick="actions.logout()" class="text-xs font-bold uppercase text-[#000091] dark:text-blue-400 hover:underline">Déconnexion</button>
                    ` : `
                        <button onclick="actions.login()" class="gov-button text-xs uppercase tracking-widest flex items-center gap-2">
                            <i data-lucide="log-in" class="w-4 h-4"></i> Se connecter
                        </button>
                    `}
                </div>
            </div>
        </header>

        <!-- FLASH INFO BANNER -->
        <div class="flash-info-banner py-2 overflow-hidden bg-gray-50 dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800">
            <div class="max-w-7xl mx-auto px-6 flex items-center gap-4">
                <span class="bg-[#e1000f] text-white text-[9px] font-black uppercase px-2 py-0.5 rounded shrink-0 animate-pulse">DIRECT</span>
                <div class="flex-1 overflow-hidden whitespace-nowrap italic text-xs font-medium">
                    <span class="inline-block animate-marquee">
                        ${majorHeists.length > 0 
                            ? `⚠️ ALERTES DE SÉCURITÉ : ${majorHeists.map(h => HEIST_DATA.find(d => d.id === h.heist_type)?.name).join(' • ')} EN COURS ` 
                            : '🟢 SITUATION CALME À LOS ANGELES • AUCUN INCIDENT MAJEUR SIGNALÉ '}
                        — 📊 INDICATEURS ÉCONOMIQUES : TVA Municipale à ${tva}% • Taxe de mise en rayon à ${itemTax}% • Taux d\'épargne Livret A : ${state.savingsRate}%
                    </span>
                </div>
            </div>
        </div>

        <!-- MAIN CONTENT -->
        <main class="flex-1 overflow-y-auto custom-scrollbar">
            
            <!-- HERO SECTION -->
            <section class="relative py-24 bg-white dark:bg-[#161616] overflow-hidden border-b border-gray-100 dark:border-zinc-800">
                <div class="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-blue-50 dark:from-blue-900/10 to-transparent pointer-events-none"></div>
                <div class="max-w-7xl mx-auto px-6 relative z-10">
                    <div class="max-w-2xl">
                        <h2 class="text-5xl md:text-6xl font-black tracking-tighter text-[#161616] dark:text-white mb-6 uppercase italic">
                            Prenez part à l'histoire de <span class="text-[#000091] dark:text-blue-500">Los Angeles</span>
                        </h2>
                        <p class="text-xl text-gray-600 dark:text-gray-400 mb-10 leading-relaxed">
                            Accédez à vos documents officiels, gérez votre patrimoine bancaire et suivez l'activité des services publics en temps réel sur le portail TFRP.
                        </p>
                        
                        <div class="flex flex-wrap gap-4">
                            ${state.user ? `
                                <button onclick="router('select')" class="gov-button px-10 py-5 text-lg shadow-xl shadow-blue-900/20 flex items-center gap-3">
                                    Accéder au Terminal Citoyen <i data-lucide="arrow-right" class="w-6 h-6"></i>
                                </button>
                            ` : `
                                <button onclick="actions.login()" class="gov-button px-10 py-5 text-lg shadow-xl shadow-blue-900/20 flex items-center gap-3">
                                    Commencer les démarches <i data-lucide="arrow-right" class="w-6 h-6"></i>
                                </button>
                            `}
                        </div>
                    </div>
                </div>
            </section>

            <!-- DEUXIEME SECTION : DÉMARCHES -->
            <section class="py-20 bg-gray-50 dark:bg-[#1e1e1e]">
                <div class="max-w-7xl mx-auto px-6">
                    <h3 class="text-xs font-black text-gray-500 uppercase tracking-[0.3em] mb-12 flex items-center gap-4">
                        <span class="w-12 h-px bg-gray-300"></span> Vos démarches essentielles
                    </h3>
                    
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <a href="https://discord.com/channels/1279455759414857759/1445853905144516" target="_blank" class="gov-card group p-8 rounded-none border-b-4 border-b-[#000091] flex flex-col h-full">
                            <div class="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center text-[#000091] dark:text-blue-400 mb-6">
                                <i data-lucide="file-text" class="w-7 h-7"></i>
                            </div>
                            <h4 class="text-xl font-bold mb-3 group-hover:underline">Immigrer / Recensement</h4>
                            <p class="text-sm text-gray-500 flex-1">Déposez votre demande de visa et faites-vous recenser auprès des autorités municipales pour devenir citoyen.</p>
                            <span class="mt-6 text-xs font-bold text-[#000091] uppercase tracking-widest flex items-center gap-2">Accéder au service <i data-lucide="external-link" class="w-3 h-3"></i></span>
                        </a>

                        <a href="https://discord.com/channels/1279455759414857759/1445853998774226964" target="_blank" class="gov-card group p-8 rounded-none border-b-4 border-b-[#000091] flex flex-col h-full">
                            <div class="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center text-[#000091] dark:text-blue-400 mb-6">
                                <i data-lucide="book-open" class="w-7 h-7"></i>
                            </div>
                            <h4 class="text-xl font-bold mb-3 group-hover:underline">Code du Roleplay</h4>
                            <p class="text-sm text-gray-500 flex-1">Consultez les lois fondamentales et les règles de conduite en vigueur au sein de la communauté TFRP.</p>
                            <span class="mt-6 text-xs font-bold text-[#000091] uppercase tracking-widest flex items-center gap-2">Lire le règlement <i data-lucide="external-link" class="w-3 h-3"></i></span>
                        </a>

                        <a href="https://discord.com/channels/1279455759414857759/1280129294412021813" target="_blank" class="gov-card group p-8 rounded-none border-b-4 border-b-[#000091] flex flex-col h-full">
                            <div class="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center text-[#000091] dark:text-blue-400 mb-6">
                                <i data-lucide="message-square" class="w-7 h-7"></i>
                            </div>
                            <h4 class="text-xl font-bold mb-3 group-hover:underline">Charte Communautaire</h4>
                            <p class="text-sm text-gray-500 flex-1">Règles de vie sur nos plateformes de communication (Discord) pour assurer le respect de chacun.</p>
                            <span class="mt-6 text-xs font-bold text-[#000091] uppercase tracking-widest flex items-center gap-2">Consulter la charte <i data-lucide="external-link" class="w-3 h-3"></i></span>
                        </a>
                    </div>
                </div>
            </section>

            <!-- SECTION DIRECTION / STAFF -->
            <section class="py-24 bg-white dark:bg-[#161616]">
                <div class="max-w-7xl mx-auto px-6 text-center">
                    <h3 class="text-3xl font-black uppercase italic tracking-tighter mb-12">La Direction de l'Administration</h3>
                    
                    <div class="flex flex-wrap justify-center gap-8 mb-20">
                        ${founders.map(f => renderFounderCard(f)).join('')}
                    </div>

                    ${others.length > 0 ? `
                        <div class="border-t border-gray-100 dark:border-zinc-800 pt-16">
                            <p class="text-xs font-black uppercase text-gray-400 tracking-[0.4em] mb-10 text-center">Corps Administratif et Modération</p>
                            <div class="relative w-full overflow-hidden py-4">
                                <div class="animate-marquee flex gap-6">
                                    ${staffCarouselItems.map(s => `
                                        <div class="gov-card p-4 flex items-center gap-4 w-64 shrink-0">
                                            <img src="${s.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png'}" class="w-10 h-10 rounded-full border border-gray-200">
                                            <div class="text-left">
                                                <div class="font-bold text-xs uppercase">${s.username}</div>
                                                <div class="text-[8px] text-gray-500 uppercase font-black">Administration</div>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    ` : ''}
                </div>
            </section>

            <!-- FOOTER INSTITUTIONNEL -->
            <footer class="bg-white dark:bg-[#161616] border-t-2 border-[#000091] py-12">
                <div class="max-w-7xl mx-auto px-6">
                    <div class="flex flex-col md:flex-row justify-between items-start gap-12">
                        <div class="marianne-block flex flex-col border-l-2 border-[#000091] pl-4">
                            <span class="marianne-devise font-bold text-[8px] text-[#000091] dark:text-blue-400">Réalisme / Immersion / Communauté</span>
                            <span class="text-xl font-black tracking-tighter text-gray-900 dark:text-white uppercase leading-none">TFRP<br><span class="text-sm font-bold opacity-70">Team French RP</span></span>
                        </div>
                        
                        <div class="grid grid-cols-2 sm:grid-cols-3 gap-8">
                            <div class="flex flex-col gap-2">
                                <span class="text-xs font-black uppercase mb-2">tfrp-panel.fr</span>
                                <button onclick="router('terms')" class="text-[11px] text-gray-500 hover:underline text-left">Mentions Légales</button>
                                <button onclick="router('privacy')" class="text-[11px] text-gray-500 hover:underline text-left">Confidentialité</button>
                                <button class="text-[11px] text-gray-500 hover:underline text-left">Gestion des cookies</button>
                            </div>
                            <div class="flex flex-col gap-2">
                                <span class="text-xs font-black uppercase mb-2">Partenaires</span>
                                <a href="https://roblox.com" target="_blank" class="text-[11px] text-gray-500 hover:underline">Roblox</a>
                                <a href="https://policeroleplay.community/" target="_blank" class="text-[11px] text-gray-500 hover:underline">ER:LC API</a>
                            </div>
                            <div class="flex flex-col gap-2">
                                <span class="text-xs font-black uppercase mb-2">Support</span>
                                <a href="${CONFIG.INVITE_URL}" target="_blank" class="text-[11px] text-[#000091] font-bold hover:underline">Ouvrir un Ticket</a>
                            </div>
                        </div>
                    </div>
                    <div class="mt-12 pt-8 border-t border-gray-100 dark:border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div class="text-[10px] text-gray-400 font-medium">Sauf mention contraire, tous les contenus de ce site sont strictement fictifs et destinés au Roleplay.</div>
                        <div class="text-[10px] text-gray-500 font-bold uppercase tracking-widest">© 2025 Team French RolePlay • MatMat System v5</div>
                    </div>
                </div>
            </footer>
        </main>
    </div>
    `;
};

export const AccessDeniedView = () => `
    <div class="flex-1 flex items-center justify-center p-8 bg-gray-50 text-center animate-fade-in h-full">
        <div class="gov-card max-w-lg p-12 border-t-8 border-t-[#e1000f]">
            <div class="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-[#e1000f]">
                <i data-lucide="shield-alert" class="w-10 h-10"></i>
            </div>
            <h2 class="text-2xl font-black mb-4 uppercase">Accès refusé par le système</h2>
            <p class="text-gray-600 mb-8 text-sm">Votre identité n'est pas reconnue par le protocole de sécurité TFRP. Vous devez impérativement être membre du serveur Discord officiel pour accéder aux services administratifs.</p>
            <div class="flex flex-col gap-3">
                <a href="${CONFIG.INVITE_URL}" target="_blank" class="gov-button w-full bg-[#e1000f] hover:bg-red-700">Rejoindre le serveur officiel</a>
                <button onclick="actions.logout()" class="text-xs font-bold text-gray-500 uppercase tracking-widest mt-4">Déconnexion</button>
            </div>
        </div>
    </div>
`;

export const DeletionPendingView = () => {
    const u = state.user;
    const deletionDate = u.deletion_requested_at ? new Date(u.deletion_requested_at) : null;
    let timeRemainingStr = "Calcul en cours...";
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
    <div class="flex-1 flex items-center justify-center p-8 bg-white text-center animate-fade-in h-full">
        <div class="gov-card max-w-lg p-12 border-t-8 border-t-orange-500">
            <h2 class="text-2xl font-black mb-2 uppercase">Purge des données en cours</h2>
            <p class="text-orange-600 text-[10px] font-black uppercase tracking-widest mb-8">Droit à l'oubli • Article 17 RGPD</p>
            <p class="text-gray-600 mb-10 text-sm italic">"Votre demande de suppression totale a été enregistrée. L'intégralité de vos dossiers sera effacée de nos serveurs dans :"</p>
            <div class="bg-gray-100 p-8 rounded-none border border-gray-200 mb-10">
                <div class="text-5xl font-mono font-black text-gray-900 tracking-tighter">${timeRemainingStr}</div>
            </div>
            <div class="flex flex-col gap-4">
                <button onclick="actions.cancelDataDeletion()" class="gov-button w-full">Annuler la procédure</button>
                <button onclick="actions.logout()" class="text-xs font-bold text-gray-400 uppercase tracking-widest">Quitter la session</button>
            </div>
        </div>
    </div>
    `;
};