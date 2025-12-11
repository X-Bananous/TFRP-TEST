
import { state } from '../state.js';
import { CONFIG } from '../config.js';
import { router, render } from '../utils.js';
import { ui } from '../ui.js';
import { loadCharacters } from '../services.js';

export const login = async () => {
    state.isLoggingIn = true;
    render();

    const scope = encodeURIComponent('identify guilds');
    const redirect = encodeURIComponent(CONFIG.REDIRECT_URI);
    const url = `https://discord.com/api/oauth2/authorize?client_id=${CONFIG.DISCORD_CLIENT_ID}&redirect_uri=${redirect}&response_type=token&scope=${scope}`;
    
    // Use direct redirect instead of popup to ensure hash is preserved on mobile/free hosts
    window.location.href = url;
};

export const openFoundationModal = () => {
    if (!state.user || !CONFIG.ADMIN_IDS.includes(state.user.id)) return;

    ui.showModal({
        title: "Accès Fondation",
        content: `
            <div class="text-center">
                <div class="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-purple-400">
                    <i data-lucide="shield-alert" class="w-8 h-8"></i>
                </div>
                <p class="mb-4">Vous êtes sur le point d'utiliser un accès administrateur critique.</p>
                <p class="text-xs text-gray-500 mb-2">Cela chargera le profil 'Fondation'.</p>
            </div>
        `,
        confirmText: "Confirmer l'accès",
        onConfirm: () => bypassLogin()
    });
};

export const bypassLogin = async () => {
    if (!state.user || !CONFIG.ADMIN_IDS.includes(state.user.id)) return;
    
    state.activeCharacter = {
        id: 'STAFF_BYPASS',
        user_id: state.user.id,
        first_name: 'Administrateur',
        last_name: 'Fondation',
        status: 'accepted',
        alignment: 'legal',
        job: 'leo'
    };
    // Naviguer via l'objet window.actions une fois initialisé
    if(window.actions && window.actions.setHubPanel) {
        window.actions.setHubPanel('staff');
    }
    router('hub');
};

export const backToLanding = () => {
    // Clear session state but keep auth
    state.activeCharacter = null;
    state.activeHubPanel = 'main';
    state.currentView = 'login';
    
    // Clear persistence
    sessionStorage.removeItem('tfrp_active_char');
    sessionStorage.removeItem('tfrp_hub_panel');
    sessionStorage.setItem('tfrp_current_view', 'login');
    
    render();
};

export const confirmLogout = () => {
    ui.showModal({
        title: "Retour à l'accueil",
        content: "Voulez-vous retourner à la page d'accueil ou vous déconnecter complètement ?",
        confirmText: "Accueil",
        cancelText: "Déconnexion Totale",
        onConfirm: () => backToLanding(),
        onCancel: () => logout()
    });
};

export const logout = async () => {
    state.user = null;
    state.accessToken = null;
    state.characters = [];
    localStorage.removeItem('tfrp_access_token');
    localStorage.removeItem('tfrp_token_type');
    localStorage.removeItem('tfrp_token_expiry');
    
    // Clear Session
    sessionStorage.clear();
    
    window.location.hash = '';
    router('login');
};
