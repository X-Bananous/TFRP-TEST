
import { CONFIG } from '../config.js';
import { state } from '../state.js';
import { router } from '../utils.js';

export const LoginView = () => {
    const activeHeists = state.globalActiveHeists || [];
    const tva = state.economyConfig?.tva_tax || 0;
    const rayonTax = state.economyConfig?.create_item_ent_tax || 0;

    const handleRecensement = () => {
        if (state.user) {
            router('select');
        } else {
            window.actions.login();
        }
    };

    return `
    <div class="flex-1 flex flex-col gov-landing min-h-full font-sans animate-fade-in">
        
        <!-- HEADER GOUVERNEMENTAL -->
        <header class="gov-header w-full px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-6">
            <div class="flex items-center gap-8">
                <!-- Bloc Marianne 2025 TFRP -->
                <div class="marianne-block flex flex-col uppercase font-black tracking-tight text-[#161616]">
                    <div class="text-[10px] tracking-widest border-b-2 border-red-600 pb-0.5">Liberté • Égalité • Roleplay</div>
                    <div class="text-lg leading-none mt-1">2025 TEAM FRENCH<br>ROLEPLAY</div>
                </div>
                <div class="hidden lg:block w-px h-12 bg-gray-200"></div>
                <div class="hidden lg:block">
                    <div class="font-black text-xl italic tracking-tighter text-[#161616]">TFRP <span class="text-[#000091]">V5</span></div>
                </div>
            </div>

            <nav class="flex items-center gap-6">
                <a href="https://discord.com/channels/1279455759414857759/1445853998774226964" target="_blank" class="text-sm font-bold text-gray-700 hover:text-[#000091] transition-colors uppercase tracking-wide">Règlement RP</a>
                <button onclick="router('select')" class="text-sm font-bold text-gray-700 hover:text-[#000091] transition-colors uppercase tracking-wide">Recensement</button>
                
                ${state.user ? `
                    <div class="flex items-center gap-3 bg-gray-100 p-1.5 pl-4 rounded-full border border-gray-200">
                        <span class="text-xs font-bold text-gray-600 uppercase tracking-widest">${state.user.username}</span>
                        <img src="${state.user.avatar}" class="w-8 h-8 rounded-full border border-white">
                        <button onclick="actions.logout()" class="p-2 text-red-600 hover:bg-red-50 rounded-full"><i data-lucide="log-out" class="w-4 h-4"></i></button>
                    </div>
                ` : `
                    <button onclick="actions.login()" class="gov-btn-discord px-6 py-2.5 rounded-md flex items-center gap-3 hover:opacity-90 transition-all font-bold uppercase text-xs tracking-[0.1em]">
                        <i data-lucide="discord" class="w-5 h-5"></i> S'identifier avec Discord
                    </button>
                `}
            </nav>
        </header>

        <!-- MAIN CONTENT -->
        <main class="flex-1">
            
            <!-- HERO SECTION -->
            <section class="bg-[#F6F6F6] py-20 px-6 border-b border-gray-200">
                <div class="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12">
                    <div class="flex-1">
                        <h1 class="text-5xl md:text-6xl font-black text-[#161616] tracking-tighter leading-tight mb-6">
                            Le portail officiel de 2025 Team French RolePlay.
                        </h1>
                        <p class="text-xl text-gray-600 mb-10 max-w-2xl leading-relaxed">
                            Vivez l'expérience Serious RP ultime sur ERLC. Accédez à vos dossiers citoyens, gérez votre économie et suivez les décrets municipaux.
                        </p>
                        <div class="relative max-w-xl group">
                            <input type="text" placeholder="Rechercher un citoyen, un décret, une information..." 
                                class="w-full p-4 pr-16 bg-white border-b-2 border-gray-300 focus:border-[#000091] outline-none text-gray-900 transition-all font-medium text-lg">
                            <button class="absolute right-4 top-4 text-[#000091] group-hover:scale-110 transition-transform">
                                <i data-lucide="search" class="w-6 h-6"></i>
                            </button>
                        </div>
                    </div>
                    <div class="hidden xl:block w-96 h-96 relative">
                        <div class="absolute inset-0 bg-[#000091] rounded-3xl opacity-5 -rotate-6"></div>
                        <img src="https://media.discordapp.net/attachments/1279455759414857759/1344426569107931168/tfrp_v5_logo.png" 
                            class="w-full h-full object-contain drop-shadow-2xl grayscale hover:grayscale-0 transition-all duration-700">
                    </div>
                </div>
            </section>

            <!-- LIVE ALERTS & STATS -->
            <section class="max-w-6xl mx-auto py-16 px-6">
                <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    
                    <!-- Left: Live Alerts -->
                    <div class="lg:col-span-8 space-y-8">
                        <h2 class="text-2xl font-black uppercase tracking-widest text-[#161616] border-l-4 border-[#000091] pl-4">Actualités ERLC</h2>
                        
                        ${activeHeists.length > 0 ? activeHeists.map(h => `
                            <div class="gov-alert p-6 flex items-center gap-6 animate-pulse-slow">
                                <div class="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center text-[#E1000F] shrink-0 border border-red-200 shadow-sm">
                                    <i data-lucide="shield-alert" class="w-7 h-7"></i>
                                </div>
                                <div>
                                    <div class="text-[10px] font-black text-[#E1000F] uppercase tracking-[0.2em] mb-1">Alerte de Sécurité en cours</div>
                                    <h3 class="text-xl font-bold text-gray-900 uppercase italic tracking-tight">Incident ERLC : ${h.heist_type.toUpperCase()} - ${h.location || 'Secteur Inconnu'}</h3>
                                    <p class="text-sm text-gray-600 font-medium">Les forces de l'ordre sont mobilisées sur zone. Évitez le périmètre.</p>
                                </div>
                            </div>
                        `).join('') : `
                            <div class="bg-blue-50 p-6 flex items-center gap-6 border-l-4 border-[#000091]">
                                <div class="w-14 h-14 bg-white rounded-full flex items-center justify-center text-[#000091] shrink-0 border border-blue-200">
                                    <i data-lucide="sun" class="w-7 h-7"></i>
                                </div>
                                <div>
                                    <div class="text-[10px] font-black text-[#000091] uppercase tracking-[0.2em] mb-1">Situation Calme</div>
                                    <h3 class="text-xl font-bold text-gray-900 uppercase italic tracking-tight">Aucun incident majeur sur le serveur</h3>
                                    <p class="text-sm text-gray-600 font-medium">La ville est sous contrôle administratif.</p>
                                </div>
                            </div>
                        `}

                        <!-- Quick Access Cards -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
                            <a href="https://discord.com/channels/1279455759414857759/1445853998774226964" target="_blank" class="gov-card p-8 flex flex-col h-full group">
                                <i data-lucide="book-open" class="w-10 h-10 text-[#000091] mb-6 group-hover:scale-110 transition-transform"></i>
                                <h4 class="text-xl font-black text-gray-900 mb-3 uppercase italic tracking-tight">Lois & Règlements</h4>
                                <p class="text-sm text-gray-500 leading-relaxed font-medium mb-6">Consultez le cadre législatif de 2025 Team French RolePlay.</p>
                                <div class="mt-auto text-[#000091] text-xs font-black uppercase tracking-widest flex items-center gap-2">Consulter le Code RP <i data-lucide="arrow-right" class="w-4 h-4"></i></div>
                            </a>
                            <div onclick="router('select')" class="gov-card p-8 flex flex-col h-full group cursor-pointer">
                                <i data-lucide="user-plus" class="w-10 h-10 text-[#000091] mb-6 group-hover:scale-110 transition-transform"></i>
                                <h4 class="text-xl font-black text-gray-900 mb-3 uppercase italic tracking-tight">Recensement Citoyen</h4>
                                <p class="text-sm text-gray-500 leading-relaxed font-medium mb-6">Accédez au panel des profils pour créer ou modifier votre citoyen.</p>
                                <div class="mt-auto text-[#000091] text-xs font-black uppercase tracking-widest flex items-center gap-2">Gérer mes profils <i data-lucide="arrow-right" class="w-4 h-4"></i></div>
                            </div>
                        </div>
                    </div>

                    <!-- Right: Stats & Key Indicators -->
                    <div class="lg:col-span-4 space-y-6">
                        <div class="bg-[#F6F6F6] p-8 rounded-sm border-t-4 border-[#000091]">
                            <h3 class="text-sm font-black text-[#161616] uppercase tracking-widest mb-6">Indicateurs 2025</h3>
                            <div class="space-y-6">
                                <div class="flex justify-between items-end border-b border-gray-200 pb-4">
                                    <div>
                                        <div class="text-[10px] text-gray-500 font-bold uppercase">TVA Municipale</div>
                                        <div class="text-2xl font-black text-[#161616]">${tva}%</div>
                                    </div>
                                    <span class="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-black uppercase tracking-widest mb-1">Stable</span>
                                </div>
                                <div class="flex justify-between items-end border-b border-gray-200 pb-4">
                                    <div>
                                        <div class="text-[10px] text-gray-500 font-bold uppercase">Taxe ERLC Corp.</div>
                                        <div class="text-2xl font-black text-[#161616]">${rayonTax}%</div>
                                    </div>
                                    <span class="text-[10px] bg-[#000091] text-white px-2 py-0.5 rounded font-black uppercase tracking-widest mb-1">Actif</span>
                                </div>
                                <div class="flex justify-between items-end">
                                    <div>
                                        <div class="text-[10px] text-gray-500 font-bold uppercase">Masse Monétaire</div>
                                        <div class="text-2xl font-black text-[#161616]">$${(state.serverStats?.totalMoney || 0).toLocaleString()}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="bg-gray-900 p-8 rounded-sm text-white">
                            <h3 class="text-sm font-black uppercase tracking-widest mb-6">Authentification</h3>
                            <p class="text-xs text-gray-400 leading-relaxed mb-6 font-medium">L'accès aux services de 2025 Team French RolePlay nécessite une liaison Discord sécurisée.</p>
                            ${state.user ? `
                                <button onclick="router('select')" class="w-full py-4 bg-white text-gray-900 font-black uppercase tracking-[0.2em] text-xs hover:bg-gray-100 transition-all flex items-center justify-center gap-3">
                                    Entrer dans le Panel <i data-lucide="layout" class="w-4 h-4"></i>
                                </button>
                            ` : `
                                <button onclick="actions.login()" class="w-full py-4 bg-[#000091] text-white font-black uppercase tracking-[0.2em] text-xs hover:opacity-90 transition-all">
                                    Se connecter via Discord
                                </button>
                            `}
                        </div>
                        
                        <div class="p-6 border border-gray-200 flex flex-col items-center text-center">
                            <i data-lucide="info" class="w-8 h-8 text-gray-400 mb-4"></i>
                            <h5 class="text-xs font-black uppercase tracking-widest mb-2">Notice Serious RP</h5>
                            <p class="text-[10px] text-gray-500 leading-relaxed italic">
                                TFRP est un serveur ERLC (Roblox) privé. Les données affichées ici sont virtuelles et servent le cadre du jeu de rôle.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </main>

        <!-- FOOTER GOUVERNEMENTAL -->
        <footer class="bg-white border-t-2 border-[#000091] py-16 px-6">
            <div class="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
                <div class="space-y-6">
                    <div class="marianne-block flex flex-col uppercase font-black tracking-tight text-[#161616]">
                        <div class="text-[10px] tracking-widest border-b-2 border-red-600 pb-0.5">Liberté • Égalité • Roleplay</div>
                        <div class="text-lg leading-none mt-1">2025 TEAM FRENCH<br>ROLEPLAY</div>
                    </div>
                    <p class="text-xs text-gray-500 max-w-xs leading-relaxed font-medium">
                        L'outil de gestion centralisé pour le serveur 2025 Team French RolePlay sur ERLC.
                    </p>
                </div>
                
                <div class="grid grid-cols-2 gap-12">
                    <div class="space-y-4">
                        <h4 class="text-sm font-black uppercase tracking-widest text-[#161616]">Navigation</h4>
                        <ul class="text-xs space-y-3 font-bold text-gray-600">
                            <li><a onclick="router('select')" class="hover:underline cursor-pointer">Profils Citoyens</a></li>
                            <li><a onclick="router('login')" class="hover:underline cursor-pointer">Accueil Portail</a></li>
                            <li><a href="${CONFIG.INVITE_URL}" target="_blank" class="hover:underline">Discord Officiel</a></li>
                        </ul>
                    </div>
                    <div class="space-y-4">
                        <h4 class="text-sm font-black uppercase tracking-widest text-[#161616]">Documents</h4>
                        <ul class="text-xs space-y-3 font-bold text-gray-600">
                            <li><a href="https://discord.com/channels/1279455759414857759/1280129294412021813" target="_blank" class="hover:underline">Règlement Discord</a></li>
                            <li><a href="https://discord.com/channels/1279455759414857759/1445853998774226964" target="_blank" class="hover:underline">Règlement Serious RP</a></li>
                            <li><a onclick="router('terms')" class="hover:underline cursor-pointer">CGU Panel</a></li>
                        </ul>
                    </div>
                </div>
            </div>
            <div class="max-w-6xl mx-auto mt-16 pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-6">
                <div class="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">&copy; 2025 Team French RolePlay • ERLC Community</div>
                <div class="flex gap-6">
                    <a href="${CONFIG.INVITE_URL}" target="_blank" class="text-gray-400 hover:text-[#000091] transition-colors"><i data-lucide="discord" class="w-5 h-5"></i></a>
                </div>
            </div>
        </footer>
    </div>
    `;
};

export const AccessDeniedView = () => `
    <div class="flex-1 flex items-center justify-center p-8 bg-[#f6f6f6] text-center animate-fade-in h-full gov-landing">
        <div class="bg-white max-w-lg p-12 border-t-4 border-[#E1000F] shadow-2xl relative overflow-hidden">
            <div class="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-8 text-[#E1000F] border border-red-200">
                <i data-lucide="shield-alert" class="w-10 h-10"></i>
            </div>
            <h2 class="text-3xl font-black text-gray-900 mb-4 uppercase italic tracking-tighter">Accès Non Autorisé</h2>
            <p class="text-gray-600 mb-10 leading-relaxed font-medium">Votre identité n'est pas répertoriée sur le registre de 2025 Team French RolePlay. L'accès est restreint aux membres du serveur Discord.</p>
            <div class="flex flex-col gap-4">
                <a href="${CONFIG.INVITE_URL}" target="_blank" class="w-full py-4 bg-[#E1000F] text-white font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-red-900/10">Rejoindre le Discord Officiel</a>
                <button onclick="actions.logout()" class="text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-[#000091] transition-colors">Retour à l'accueil</button>
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
    <div class="flex-1 flex items-center justify-center p-8 bg-[#f6f6f6] text-center animate-fade-in h-full gov-landing">
        <div class="bg-white max-w-lg p-12 border-t-4 border-orange-500 shadow-2xl relative overflow-hidden">
            <div class="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-8 text-orange-600 border border-orange-200">
                <i data-lucide="trash-2" class="w-10 h-10"></i>
            </div>
            <h2 class="text-3xl font-black text-gray-900 mb-2 uppercase italic tracking-tighter">Suppression Programmée</h2>
            <p class="text-orange-600 text-xs font-black uppercase tracking-widest mb-8">Droit à l'oubli numérique activé</p>
            <p class="text-gray-600 mb-10 leading-relaxed font-medium">Votre compte est actuellement en phase de purge administrative. Toutes vos données seront effacées dans :</p>
            <div class="bg-[#F6F6F6] p-8 border-y border-gray-200 mb-10">
                <div class="text-5xl font-mono font-black text-gray-900 tracking-tighter">${timeRemainingStr}</div>
            </div>
            <div class="flex flex-col gap-4">
                <button onclick="actions.cancelDataDeletion()" class="w-full py-4 bg-gray-900 text-white font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl">ANNULER LA PROCÉDURE</button>
                <button onclick="actions.logout()" class="text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-[#000091] transition-colors">Se déconnecter</button>
            </div>
        </div>
    </div>
    `;
};
