


import { state } from '../state.js';
import { CONFIG } from '../config.js';
import { router, render } from '../utils.js';
import { ui } from '../ui.js';
import { loadCharacters } from '../services.js';

export const login = async () => {
    state.isLoggingIn = true;
    render();

    const scope = encodeURIComponent('identify guilds');
    const url = `https://discord.com/api/oauth2/authorize?client_id=${CONFIG.DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(CONFIG.REDIRECT_URI)}&response_type=token&scope=${scope}`;
    window.open(url, 'DiscordAuth', 'width=500,height=800,left=200,top=200');
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