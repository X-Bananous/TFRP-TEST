
export const TermsView = () => `
    <div class="flex flex-col h-full bg-[#050505] overflow-hidden">
        <div class="p-6 flex justify-between items-center border-b border-white/10">
            <h1 class="text-2xl font-bold text-white">Conditions d'Utilisation</h1>
            <button onclick="actions.backToLanding()" class="glass-btn-secondary px-4 py-2 rounded-lg text-sm">Retour</button>
        </div>
        <div class="flex-1 overflow-y-auto custom-scrollbar p-8 max-w-4xl mx-auto text-gray-300 space-y-6">
            <section>
                <h2 class="text-xl font-bold text-white mb-2">1. Acceptation</h2>
                <p>En accédant au panel TFRP, vous acceptez les présentes conditions. Ce service est lié au serveur de jeu Roblox et Discord TFRP.</p>
            </section>
            <section>
                <h2 class="text-xl font-bold text-white mb-2">2. Fairplay et Règles</h2>
                <p>Tout utilisateur s'engage à respecter les règles du Roleplay définies sur le Discord. L'utilisation de ce panel pour tricher ou abuser des mécaniques entraînera un bannissement.</p>
            </section>
            <section>
                <h2 class="text-xl font-bold text-white mb-2">3. Responsabilité</h2>
                <p>TFRP n'est pas affilié à Roblox Corporation. Nous ne sommes pas responsables des pertes de données liées à des interruptions de service.</p>
            </section>
        </div>
    </div>
`;

export const PrivacyView = () => `
    <div class="flex flex-col h-full bg-[#050505] overflow-hidden">
        <div class="p-6 flex justify-between items-center border-b border-white/10">
            <h1 class="text-2xl font-bold text-white">Politique de Confidentialité</h1>
            <button onclick="actions.backToLanding()" class="glass-btn-secondary px-4 py-2 rounded-lg text-sm">Retour</button>
        </div>
        <div class="flex-1 overflow-y-auto custom-scrollbar p-8 max-w-4xl mx-auto text-gray-300 space-y-6">
            <section>
                <h2 class="text-xl font-bold text-white mb-2">1. Données Collectées</h2>
                <p>Nous collectons votre ID Discord, votre pseudo et votre avatar pour l'authentification. Les données de jeu (inventaire, banque) sont stockées dans notre base de données sécurisée.</p>
            </section>
            <section>
                <h2 class="text-xl font-bold text-white mb-2">2. Utilisation</h2>
                <p>Ces données servent uniquement au fonctionnement du Roleplay sur le serveur TFRP. Aucune donnée n'est revendue à des tiers.</p>
            </section>
            <section>
                <h2 class="text-xl font-bold text-white mb-2">3. Droit à l'oubli</h2>
                <p>Vous pouvez demander la suppression complète de vos données (personnages et compte) en contactant un administrateur via Discord.</p>
            </section>
        </div>
    </div>
`;
