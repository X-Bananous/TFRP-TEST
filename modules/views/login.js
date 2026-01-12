
import { CONFIG } from '../config.js';
import { state } from '../state.js';
import { router } from '../utils.js';

export const LoginView = () => {
    const activeHeists = state.globalActiveHeists || [];
    const tva = state.economyConfig?.tva_tax || 0;
    const rayonTax = state.economyConfig?.create_item_ent_tax || 0;
    const staffList = state.landingStaff || [];

    // Fonctions helper pour la navigation
    const navigateTo = (view, panel = null) => {
        if (!state.user) {
            window.actions.login();
            return;
        }
        if (panel) window.actions.setHubPanel(panel);
        router(view);
    };

    return `
    <div class="flex-1 flex flex-col gov-landing min-h-full font-sans animate-fade-in overflow-y-auto gov-landing-scroll bg-white">
        
        <!-- HEADER GOUVERNEMENTAL RESPONSIVE -->
        <header class="gov-header w-full shadow-sm">
            <!-- Barre de service supérieure -->
            <div class="bg-[#F6F6F6] px-6 py-1.5 flex justify-end gap-6 text-[10px] font-bold uppercase tracking-widest text-gray-500 border-b border-gray-200">
                <div class="flex items-center gap-2"><div class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> Session ERLC : Active</div>
                <div class="hidden md:block">UID : ${state.user ? state.user.id.substring(0,8) : 'Anonyme'}</div>
            </div>

            <div class="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                <div class="flex items-center gap-6">
                    <!-- Bloc Marianne 2025 TFRP -->
                    <div onclick="router('login')" class="marianne-block flex flex-col uppercase font-black tracking-tight text-[#161616] cursor-pointer">
                        <div class="text-[9px] tracking-widest border-b-2 border-red-600 pb-0.5">Liberté • Égalité • Roleplay</div>
                        <div class="text-base leading-none mt-1">2025 TEAM FRENCH<br>ROLEPLAY</div>
                    </div>
                    
                    <!-- Desktop Navigation with Dropdowns -->
                    <nav class="hidden lg:flex items-center gap-2 ml-8">
                        <button onclick="router('login')" class="px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100 rounded-md transition-all uppercase tracking-wide">Accueil</button>
                        
                        <div class="gov-dropdown">
                            <button class="px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100 rounded-md transition-all uppercase tracking-wide flex items-center gap-2">
                                Citoyenneté <i data-lucide="chevron-down" class="w-3 h-3"></i>
                            </button>
                            <div class="gov-dropdown-content rounded-xl shadow-2xl">
                                <a onclick="navigateTo('select')" class="gov-dropdown-item cursor-pointer">
                                    <i data-lucide="user-plus" class="w-4 h-4"></i> Recensement (Profils)
                                </a>
                                <a onclick="navigateTo('hub', 'bank')" class="gov-dropdown-item cursor-pointer">
                                    <i data-lucide="landmark" class="w-4 h-4"></i> Services Bancaires
                                </a>
                                <a onclick="navigateTo('hub', 'jobs')" class="gov-dropdown-item cursor-pointer">
                                    <i data-lucide="briefcase" class="w-4 h-4"></i> Pôle Emploi
                                </a>
                            </div>
                        </div>

                        <div class="gov-dropdown">
                            <button class="px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100 rounded-md transition-all uppercase tracking-wide flex items-center gap-2">
                                Serveur <i data-lucide="chevron-down" class="w-3 h-3"></i>
                            </button>
                            <div class="gov-dropdown-content rounded-xl shadow-2xl">
                                <a href="https://discord.com/channels/1279455759414857759/1445853998774226964" target="_blank" class="gov-dropdown-item">
                                    <i data-lucide="book-open" class="w-4 h-4"></i> Règlement Serious RP
                                </a>
                                <a href="https://discord.com/channels/1279455759414857759/1280129294412021813" target="_blank" class="gov-dropdown-item">
                                    <i data-lucide="hash" class="w-4 h-4"></i> Règlement Discord
                                </a>
                                <a onclick="document.getElementById('staff-section').scrollIntoView({behavior:'smooth'})" class="gov-dropdown-item cursor-pointer">
                                    <i data-lucide="shield" class="w-4 h-4"></i> L'Équipe Administrative
                                </a>
                            </div>
                        </div>
                    </nav>
                </div>

                <div class="flex items-center gap-4">
                    ${state.user ? `
                        <div class="flex items-center gap-3 bg-gray-100 p-1.5 pl-4 rounded-full border border-gray-200">
                            <span class="hidden sm:block text-[10px] font-black text-gray-600 uppercase tracking-widest">${state.user.username}</span>
                            <img src="${state.user.avatar}" class="w-8 h-8 rounded-full border border-white shadow-sm">
                            <button onclick="actions.logout()" class="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"><i data-lucide="log-out" class="w-4 h-4"></i></button>
                        </div>
                    ` : `
                        <button onclick="actions.login()" class="gov-btn-discord px-5 py-2.5 rounded-lg flex items-center gap-3 hover:opacity-90 transition-all font-bold uppercase text-[10px] tracking-widest shadow-lg">
                            <i data-lucide="discord" class="w-5 h-5"></i> S'identifier
                        </button>
                    `}

                    <!-- Mobile Menu Button -->
                    <button onclick="const m = document.getElementById('mobile-menu-overlay'); m.classList.toggle('hidden'); m.classList.toggle('flex');" class="lg:hidden p-2 text-gray-700">
                        <i data-lucide="menu" class="w-6 h-6"></i>
                    </button>
                </div>
            </div>
        </header>

        <!-- MOBILE MENU OVERLAY -->
        <div id="mobile-menu-overlay" class="hidden fixed inset-0 z-[2000] bg-black/50 backdrop-blur-sm animate-fade-in flex-col items-center justify-center p-6">
            <div class="bg-white w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl p-8 flex flex-col gap-6 relative">
                <button onclick="document.getElementById('mobile-menu-overlay').classList.add('hidden')" class="absolute top-6 right-6 text-gray-400 hover:text-black">
                    <i data-lucide="x" class="w-8 h-8"></i>
                </button>
                <div class="marianne-block flex flex-col uppercase font-black tracking-tight text-[#161616] mb-4">
                    <div class="text-[9px] tracking-widest border-b-2 border-red-600 pb-0.5">Liberté • Égalité • Roleplay</div>
                    <div class="text-base leading-none mt-1">MENU MOBILE</div>
                </div>
                <div class="flex flex-col gap-2">
                    <button onclick="router('login'); document.getElementById('mobile-menu-overlay').classList.add('hidden');" class="w-full p-4 text-left font-black uppercase text-xs border-b border-gray-100 flex items-center gap-4"><i data-lucide="home" class="w-5 h-5 text-blue-600"></i> Accueil</button>
                    <button onclick="navigateTo('select'); document.getElementById('mobile-menu-overlay').classList.add('hidden');" class="w-full p-4 text-left font-black uppercase text-xs border-b border-gray-100 flex items-center gap-4"><i data-lucide="user-plus" class="w-5 h-5 text-blue-600"></i> Recensement</button>
                    <button onclick="navigateTo('hub', 'bank'); document.getElementById('mobile-menu-overlay').classList.add('hidden');" class="w-full p-4 text-left font-black uppercase text-xs border-b border-gray-100 flex items-center gap-4"><i data-lucide="landmark" class="w-5 h-5 text-blue-600"></i> Ma Banque</button>
                    <button onclick="navigateTo('hub', 'jobs'); document.getElementById('mobile-menu-overlay').classList.add('hidden');" class="w-full p-4 text-left font-black uppercase text-xs border-b border-gray-100 flex items-center gap-4"><i data-lucide="briefcase" class="w-5 h-5 text-blue-600"></i> Pôle Emploi</button>
                    <a href="${CONFIG.INVITE_URL}" target="_blank" class="w-full p-4 text-left font-black uppercase text-xs border-b border-gray-100 flex items-center gap-4 text-blue-600"><i data-lucide="discord" class="w-5 h-5"></i> Rejoindre Discord</a>
                </div>
            </div>
        </div>

        <!-- MAIN CONTENT -->
        <main class="flex-1">
            
            <!-- HERO SECTION -->
            <section class="bg-[#F6F6F6] py-16 md:py-24 px-6 border-b border-gray-200">
                <div class="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12">
                    <div class="flex-1">
                        <div class="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-[0.3em] border border-blue-200 mb-6 rounded-md">
                            <i data-lucide="info" class="w-3.5 h-3.5"></i> PORTAIL OFFICIEL ERLC
                        </div>
                        <h1 class="text-4xl md:text-6xl font-black text-[#161616] tracking-tighter leading-[1.1] mb-6 uppercase italic">
                            Prenez part à l'histoire de<br><span class="text-[#000091]">Team French RolePlay.</span>
                        </h1>
                        <p class="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl leading-relaxed font-medium">
                            Accédez à vos dossiers administratifs, gérez votre patrimoine financier et suivez les décrets en temps réel sur le serveur Serious RP numéro 1.
                        </p>
                        <div class="flex flex-col sm:flex-row gap-4">
                            <button onclick="navigateTo('select')" class="px-8 py-4 bg-[#000091] text-white font-black uppercase text-xs tracking-widest rounded-lg hover:opacity-90 transition-all shadow-xl shadow-blue-900/10">Accéder aux services</button>
                            <a href="${CONFIG.INVITE_URL}" target="_blank" class="px-8 py-4 bg-white text-gray-900 border border-gray-300 font-black uppercase text-xs tracking-widest rounded-lg hover:bg-gray-50 transition-all text-center">Rejoindre la communauté</a>
                        </div>
                    </div>
                    <div class="hidden xl:block w-[450px] relative">
                         <div class="absolute inset-0 bg-gradient-to-tr from-blue-600/10 to-transparent rounded-[48px] rotate-3"></div>
                         <img src="https://media.discordapp.net/attachments/1279455759414857759/1344426569107931168/tfrp_v5_logo.png" 
                            class="w-full relative z-10 drop-shadow-2xl grayscale hover:grayscale-0 transition-all duration-700 hover:scale-105">
                    </div>
                </div>
            </section>

            <!-- LIVE ALERTS & QUICK ACCESS -->
            <section class="max-w-7xl mx-auto py-16 px-6">
                <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    
                    <!-- Left: News & Features -->
                    <div class="lg:col-span-8 space-y-12">
                        <div class="space-y-6">
                            <h2 class="text-xl font-black uppercase tracking-[0.2em] text-[#161616] flex items-center gap-3">
                                <span class="w-8 h-1 bg-[#000091]"></span> Actualités de la ville
                            </h2>
                            
                            ${activeHeists.length > 0 ? activeHeists.map(h => `
                                <div class="gov-alert p-6 flex items-center gap-6 animate-pulse-slow rounded-r-2xl border border-gray-100 shadow-sm">
                                    <div class="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center text-[#E1000F] shrink-0 border border-red-200">
                                        <i data-lucide="shield-alert" class="w-8 h-8"></i>
                                    </div>
                                    <div>
                                        <div class="text-[9px] font-black text-[#E1000F] uppercase tracking-[0.2em] mb-1">Alerte Prioritaire • Signalement ERLC</div>
                                        <h3 class="text-xl font-bold text-gray-900 uppercase italic tracking-tight">Incident : ${h.heist_type.toUpperCase()} - ${h.location || 'Secteur Inconnu'}</h3>
                                        <p class="text-sm text-gray-600 font-medium">Forces de l'ordre en intervention. Respectez le périmètre de sécurité.</p>
                                    </div>
                                </div>
                            `).join('') : `
                                <div class="bg-blue-50 p-8 flex items-center gap-6 border-l-4 border-[#000091] rounded-r-2xl border border-gray-100">
                                    <div class="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-[#000091] shrink-0 border border-blue-200 shadow-sm">
                                        <i data-lucide="check-circle" class="w-8 h-8"></i>
                                    </div>
                                    <div>
                                        <div class="text-[9px] font-black text-[#000091] uppercase tracking-[0.2em] mb-1">Status Jurisprudence</div>
                                        <h3 class="text-xl font-bold text-gray-900 uppercase italic tracking-tight">Aucun incident majeur répertorié</h3>
                                        <p class="text-sm text-gray-600 font-medium">La stabilité institutionnelle est maintenue sur l'ensemble du territoire.</p>
                                    </div>
                                </div>
                            `}
                        </div>

                        <!-- Tiles -->
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div onclick="navigateTo('select')" class="gov-card p-8 rounded-3xl cursor-pointer group">
                                <div class="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-[#000091] mb-6 group-hover:bg-[#000091] group-hover:text-white transition-all"><i data-lucide="user-plus" class="w-6 h-6"></i></div>
                                <h4 class="text-lg font-black text-gray-900 mb-2 uppercase italic tracking-tight">Recensement</h4>
                                <p class="text-[11px] text-gray-500 font-medium leading-relaxed uppercase">Gérez vos profils citoyens et déposez vos dossiers d'immigration.</p>
                            </div>
                            <div onclick="navigateTo('hub', 'bank')" class="gov-card p-8 rounded-3xl cursor-pointer group">
                                <div class="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-700 mb-6 group-hover:bg-emerald-700 group-hover:text-white transition-all"><i data-lucide="landmark" class="w-6 h-6"></i></div>
                                <h4 class="text-lg font-black text-gray-900 mb-2 uppercase italic tracking-tight">Trésorerie</h4>
                                <p class="text-[11px] text-gray-500 font-medium leading-relaxed uppercase">Accédez à votre compte bancaire et gérez vos flux financiers.</p>
                            </div>
                            <div onclick="navigateTo('hub', 'enterprise')" class="gov-card p-8 rounded-3xl cursor-pointer group">
                                <div class="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-700 mb-6 group-hover:bg-purple-700 group-hover:text-white transition-all"><i data-lucide="building" class="w-6 h-6"></i></div>
                                <h4 class="text-lg font-black text-gray-900 mb-2 uppercase italic tracking-tight">Commerce</h4>
                                <p class="text-[11px] text-gray-500 font-medium leading-relaxed uppercase">Fondez votre entreprise ou gérez votre activité corporatiste.</p>
                            </div>
                        </div>
                    </div>

                    <!-- Right Column: Stats -->
                    <div class="lg:col-span-4 space-y-8">
                        <div class="bg-[#F6F6F6] p-8 rounded-[32px] border border-gray-200 shadow-sm relative overflow-hidden">
                            <div class="absolute -right-6 -top-6 w-24 h-24 bg-[#000091]/5 rounded-full blur-2xl"></div>
                            <h3 class="text-xs font-black text-[#161616] uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                                <i data-lucide="bar-chart-2" class="w-4 h-4 text-[#000091]"></i> Indicateurs de ville
                            </h3>
                            <div class="space-y-6">
                                <div class="flex justify-between items-end border-b border-gray-200 pb-4">
                                    <div><div class="text-[9px] text-gray-500 font-bold uppercase tracking-widest">TVA Municipale</div><div class="text-2xl font-black text-[#161616]">${tva}%</div></div>
                                    <span class="text-[8px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-black uppercase tracking-widest mb-1">Stabilité OK</span>
                                </div>
                                <div class="flex justify-between items-end border-b border-gray-200 pb-4">
                                    <div><div class="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Taxe Corporative</div><div class="text-2xl font-black text-[#161616]">${rayonTax}%</div></div>
                                    <span class="text-[8px] bg-blue-100 text-[#000091] px-2 py-0.5 rounded font-black uppercase tracking-widest mb-1">Actif</span>
                                </div>
                                <div class="flex justify-between items-end">
                                    <div><div class="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Masse Monétaire</div><div class="text-2xl font-black text-[#161616] font-mono">$${(state.serverStats?.totalMoney || 0).toLocaleString()}</div></div>
                                </div>
                            </div>
                        </div>

                        <div class="bg-[#161616] p-8 rounded-[32px] text-white shadow-2xl relative group">
                            <div class="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <h3 class="text-[10px] font-black uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                                <i data-lucide="shield-check" class="w-4 h-4 text-blue-500"></i> Connexion Sécurisée
                            </h3>
                            <p class="text-xs text-gray-400 leading-relaxed mb-8 font-medium">L'accès à l'intégralité des services nécessite une identification Discord certifiée par le Commandement.</p>
                            ${state.user ? `
                                <button onclick="navigateTo('select')" class="w-full py-4 bg-white text-gray-900 font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-blue-50 transition-all flex items-center justify-center gap-3">
                                    Accéder au Panel <i data-lucide="arrow-right" class="w-4 h-4"></i>
                                </button>
                            ` : `
                                <button onclick="actions.login()" class="w-full py-4 bg-[#000091] text-white font-black uppercase tracking-widest text-[10px] rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-3">
                                    S'identifier <i data-lucide="lock" class="w-4 h-4"></i>
                                </button>
                            `}
                        </div>
                    </div>
                </div>
            </section>

            <!-- STAFF TEAM SECTION -->
            <section id="staff-section" class="bg-[#F6F6F6] py-20 px-6 border-t border-gray-200">
                <div class="max-w-7xl mx-auto">
                    <div class="text-center mb-16">
                        <div class="inline-flex items-center gap-2 px-3 py-1 bg-white text-gray-700 text-[10px] font-black uppercase tracking-[0.4em] border border-gray-300 mb-6 rounded-md">
                            <i data-lucide="shield" class="w-3.5 h-3.5"></i> LE COMMANDEMENT
                        </div>
                        <h2 class="text-3xl md:text-4xl font-black text-[#161616] uppercase italic tracking-tighter">L'Équipe Administrative</h2>
                        <p class="text-gray-500 mt-4 text-sm font-medium max-w-2xl mx-auto uppercase tracking-widest">Les garants de l'ordre et du développement de Team French RolePlay 2025.</p>
                    </div>

                    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8">
                        ${staffList.length > 0 ? staffList.map(s => {
                            const isFounder = state.adminIds.includes(s.id);
                            const status = state.discordStatuses[s.id] || 'offline';
                            const statusColor = status === 'online' ? 'bg-emerald-500' : status === 'idle' ? 'bg-yellow-500' : status === 'dnd' ? 'bg-red-500' : 'bg-gray-400';
                            
                            return `
                                <div class="flex flex-col items-center group">
                                    <div class="staff-avatar-container mb-4">
                                        <div class="w-20 h-20 md:w-24 md:h-24 rounded-full p-1.5 border-2 ${isFounder ? 'border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.2)]' : 'border-gray-200 shadow-xl'} bg-white transition-all group-hover:scale-105">
                                            <img src="${s.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png'}" class="w-full h-full rounded-full object-cover grayscale group-hover:grayscale-0 transition-all">
                                        </div>
                                        <div class="status-dot ${statusColor} shadow-sm" title="${status}"></div>
                                    </div>
                                    <div class="text-center">
                                        <div class="text-xs font-black text-[#161616] uppercase tracking-tighter truncate max-w-[120px] mb-0.5">${s.username}</div>
                                        <div class="text-[8px] font-black uppercase tracking-widest ${isFounder ? 'text-yellow-600' : 'text-blue-600'}">
                                            ${isFounder ? 'Fondateur' : 'Administrateur'}
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('') : `
                            <div class="col-span-full py-10 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">
                                Chargement du registre staff...
                            </div>
                        `}
                    </div>
                </div>
            </section>
        </main>

        <!-- FOOTER GOUVERNEMENTAL -->
        <footer class="bg-white border-t-2 border-[#000091] py-16 px-6">
            <div class="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
                <div class="space-y-6">
                    <div class="marianne-block flex flex-col uppercase font-black tracking-tight text-[#161616]">
                        <div class="text-[9px] tracking-widest border-b-2 border-red-600 pb-0.5">Liberté • Égalité • Roleplay</div>
                        <div class="text-lg leading-none mt-1">2025 TEAM FRENCH<br>ROLEPLAY</div>
                    </div>
                    <p class="text-xs text-gray-500 max-w-xs leading-relaxed font-medium uppercase tracking-widest">
                        Panel de gestion centralisé pour le serveur 2025 Team French RolePlay sur ERLC. Tous droits réservés.
                    </p>
                </div>
                
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-12">
                    <div class="space-y-4">
                        <h4 class="text-[10px] font-black uppercase tracking-[0.2em] text-[#161616]">Citoyenneté</h4>
                        <ul class="text-[10px] space-y-3 font-bold text-gray-500 uppercase tracking-widest">
                            <li><a onclick="navigateTo('select')" class="hover:text-blue-700 cursor-pointer transition-colors">Mes Personnages</a></li>
                            <li><a onclick="navigateTo('select')" class="hover:text-blue-700 cursor-pointer transition-colors">Recensement</a></li>
                            <li><a onclick="navigateTo('hub', 'bank')" class="hover:text-blue-700 cursor-pointer transition-colors">Banque Municipale</a></li>
                        </ul>
                    </div>
                    <div class="space-y-4">
                        <h4 class="text-[10px] font-black uppercase tracking-[0.2em] text-[#161616]">Serveur</h4>
                        <ul class="text-[10px] space-y-3 font-bold text-gray-500 uppercase tracking-widest">
                            <li><a href="https://discord.com/channels/1279455759414857759/1445853998774226964" target="_blank" class="hover:text-blue-700 transition-colors">Règlement RP</a></li>
                            <li><a href="${CONFIG.INVITE_URL}" target="_blank" class="hover:text-blue-700 transition-colors">Discord Officiel</a></li>
                            <li><a onclick="router('terms')" class="hover:text-blue-700 cursor-pointer transition-colors">CGU du Panel</a></li>
                        </ul>
                    </div>
                </div>
            </div>
            <div class="max-w-7xl mx-auto mt-16 pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-6">
                <div class="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em]">&copy; 2025 Team French RolePlay • ERLC Serious Community</div>
                <div class="flex gap-6">
                    <a href="${CONFIG.INVITE_URL}" target="_blank" class="text-gray-400 hover:text-[#000091] transition-all hover:scale-110"><i data-lucide="discord" class="w-5 h-5"></i></a>
                </div>
            </div>
        </footer>
    </div>
    `;
};

export const AccessDeniedView = () => `
    <div class="flex-1 flex items-center justify-center p-8 bg-[#f6f6f6] text-center animate-fade-in h-full gov-landing">
        <div class="bg-white max-w-lg p-12 border-t-4 border-[#E1000F] shadow-2xl relative overflow-hidden rounded-b-[32px]">
            <div class="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-8 text-[#E1000F] border border-red-200">
                <i data-lucide="shield-alert" class="w-10 h-10"></i>
            </div>
            <h2 class="text-3xl font-black text-gray-900 mb-4 uppercase italic tracking-tighter">Accès Non Autorisé</h2>
            <p class="text-gray-600 mb-10 leading-relaxed font-medium uppercase text-xs tracking-widest">Votre identité n'est pas répertoriée sur le registre de 2025 Team French RolePlay. L'accès est restreint aux membres du serveur Discord.</p>
            <div class="flex flex-col gap-4">
                <a href="${CONFIG.INVITE_URL}" target="_blank" class="w-full py-4 bg-[#E1000F] text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-xl hover:opacity-90 transition-all shadow-lg shadow-red-900/10">Rejoindre le Discord Officiel</a>
                <button onclick="actions.logout()" class="text-[9px] font-black text-gray-400 uppercase tracking-widest hover:text-[#000091] transition-colors">Retour à l'accueil</button>
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
        <div class="bg-white max-w-lg p-12 border-t-4 border-orange-500 shadow-2xl relative overflow-hidden rounded-b-[32px]">
            <div class="w-20 h-20 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-8 text-orange-600 border border-orange-200">
                <i data-lucide="trash-2" class="w-10 h-10"></i>
            </div>
            <h2 class="text-3xl font-black text-gray-900 mb-2 uppercase italic tracking-tighter">Suppression Programmée</h2>
            <p class="text-orange-600 text-[10px] font-black uppercase tracking-[0.3em] mb-8">Droit à l'oubli numérique activé</p>
            <p class="text-gray-600 mb-10 leading-relaxed font-medium uppercase text-[10px] tracking-widest">Votre compte est actuellement en phase de purge administrative. Toutes vos données seront effacées dans :</p>
            <div class="bg-[#F6F6F6] p-8 border-y border-gray-200 mb-10">
                <div class="text-5xl font-mono font-black text-gray-900 tracking-tighter">${timeRemainingStr}</div>
            </div>
            <div class="flex flex-col gap-4">
                <button onclick="actions.cancelDataDeletion()" class="w-full py-4 bg-gray-900 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-black transition-all shadow-xl">ANNULER LA PROCÉDURE</button>
                <button onclick="actions.logout()" class="text-[9px] font-black text-gray-400 uppercase tracking-widest hover:text-[#000091] transition-colors">Se déconnecter</button>
            </div>
        </div>
    </div>
    `;
};
