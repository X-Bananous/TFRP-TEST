
export const EnterpriseView = () => {
    return `
        <div class="h-full w-full flex flex-col items-center justify-center p-8 animate-fade-in relative overflow-hidden">
            <!-- Background Decorative Elements -->
            <div class="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px]"></div>
                <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px]"></div>
            </div>

            <div class="glass-panel max-w-2xl w-full p-12 rounded-[40px] border-blue-500/20 shadow-[0_0_60px_rgba(59,130,246,0.1)] text-center relative z-10">
                <div class="w-32 h-32 mx-auto bg-gradient-to-tr from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center mb-8 border border-white/10 shadow-inner">
                    <i data-lucide="building-2" class="w-16 h-16 text-blue-400"></i>
                </div>
                
                <h2 class="text-4xl font-bold text-white mb-4 tracking-tight">Gestion d'Entreprise</h2>
                
                <div class="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-8">
                    <span class="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
                    <span class="text-xs font-bold text-blue-300 uppercase tracking-widest">Bientôt Disponible</span>
                </div>
                
                <p class="text-gray-400 text-lg leading-relaxed max-w-lg mx-auto mb-10">
                    Le module de gestion d'entreprise est en cours de développement. Vous pourrez bientôt créer votre société, gérer vos employés, vos factures et vos actifs immobiliers.
                </p>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                    <div class="bg-white/5 p-4 rounded-xl border border-white/5">
                        <i data-lucide="users" class="w-6 h-6 text-gray-500 mb-2"></i>
                        <h4 class="font-bold text-white text-sm">Recrutement</h4>
                        <p class="text-xs text-gray-500">Gérez votre équipe</p>
                    </div>
                    <div class="bg-white/5 p-4 rounded-xl border border-white/5">
                        <i data-lucide="receipt" class="w-6 h-6 text-gray-500 mb-2"></i>
                        <h4 class="font-bold text-white text-sm">Facturation</h4>
                        <p class="text-xs text-gray-500">Encaissez vos clients</p>
                    </div>
                    <div class="bg-white/5 p-4 rounded-xl border border-white/5">
                        <i data-lucide="pie-chart" class="w-6 h-6 text-gray-500 mb-2"></i>
                        <h4 class="font-bold text-white text-sm">Comptabilité</h4>
                        <p class="text-xs text-gray-500">Suivi trésorerie</p>
                    </div>
                </div>
                
                <div class="mt-8 pt-8 border-t border-white/5">
                    <button onclick="actions.setHubPanel('main')" class="text-sm text-gray-500 hover:text-white transition-colors flex items-center justify-center gap-2 mx-auto">
                        <i data-lucide="arrow-left" class="w-4 h-4"></i> Retour au tableau de bord
                    </button>
                </div>
            </div>
        </div>
    `;
};
