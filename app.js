/**
 * TFRP Core Application
 * Entry Point & Aggregator
 */

import { CONFIG } from './modules/config.js';
import { state } from './modules/state.js';
import { router, render } from './modules/utils.js';
import { ui } from './modules/ui.js'; 
import { initSecurity } from './modules/security.js';

// Import Actions
import * as AuthActions from './modules/actions/auth.js';
import * as NavActions from './modules/actions/navigation.js';
import * as CharacterActions from './modules/actions/character.js';
import * as EconomyActions from './modules/actions/economy.js';
import * as IllicitActions from './modules/actions/illicit.js';
import * as ServicesActions from './modules/actions/services.js';
import * as EnterpriseActions from './modules/actions/enterprise.js'; 
import * as StaffActions from './modules/actions/staff.js';
import * as ProfileActions from './modules/actions/profile.js';
import * as WheelActions from './modules/actions/wheel.js';

import { setupRealtimeListener, fetchERLCData, fetchActiveHeistLobby, fetchDrugLab, fetchGlobalHeists, fetchOnDutyStaff, loadCharacters, fetchPublicLandingData, fetchActiveSession, fetchSecureConfig, fetchActiveGang, checkAndCompleteDrugBatch, fetchBankData } from './modules/services.js';

// Views
import { LoginView, AccessDeniedView, DeletionPendingView } from './modules/views/login.js';
import { CharacterSelectView } from './modules/views/select.js';
import { CharacterCreateView } from './modules/views/create.js';
import { HubView } from './modules/views/hub.js';
import { TermsView, PrivacyView } from './modules/views/legal.js';
import { WheelView } from './modules/views/wheel.js';

// --- Combine Actions into Window ---
window.actions = {
    ...AuthActions,
    ...NavActions,
    ...CharacterActions,
    ...EconomyActions,
    ...IllicitActions,
    ...ServicesActions,
    ...StaffActions,
    ...EnterpriseActions,
    ...ProfileActions,
    ...WheelActions
};

window.router = router;

const startIntro = async () => {
    if (sessionStorage.getItem('tfrp_intro_played')) return;
    const intro = document.getElementById('intro-screen');
    if (!intro) return;

    const phases = [
        document.getElementById('intro-phase-1'),
        document.getElementById('intro-phase-2'),
        document.getElementById('intro-phase-3'),
        document.getElementById('intro-phase-4')
    ];

    const wait = (ms) => new Promise(res => setTimeout(res, ms));
    const appEl = document.getElementById('app');

    appEl.classList.add('opacity-0', 'pointer-events-none');
    intro.classList.remove('opacity-0', 'pointer-events-none');
    intro.style.opacity = '1';
    intro.style.pointerEvents = 'auto';

    await wait(800);
    for (let i = 0; i < phases.length; i++) {
        if (!phases[i]) continue;
        phases[i].classList.add('active');
        await wait(3000); 
        phases[i].classList.remove('active');
        phases[i].style.opacity = '0';
        phases[i].style.filter = 'blur(20px)';
        phases[i].style.transform = 'scale(1.1)';
        await wait(800); 
    }
    
    intro.style.transition = 'opacity 1s ease-out, filter 1.5s ease-out';
    intro.style.opacity = '0';
    intro.style.filter = 'blur(50px)';
    sessionStorage.setItem('tfrp_intro_played', 'true');
    await wait(1000);
    intro.remove();
};

const updateLoadStatus = (msg) => {
    state.loadingStatus = msg;
    const el = document.getElementById('loading-status');
    if (el) el.textContent = msg;
    console.log(`[Boot] ${msg}`);
};

const appRenderer = () => {
    const app = document.getElementById('app');
    if (!app) return;
    let htmlContent = '';
    
    let effectiveView = state.currentView;
    if (state.user?.deletion_requested_at && effectiveView !== 'login') {
        effectiveView = 'deletion_pending';
    }

    if (state.user?.isBanned && effectiveView !== 'login') {
        effectiveView = 'banned';
    }

    switch (effectiveView) {
        case 'login': htmlContent = LoginView(); break;
        case 'deletion_pending': htmlContent = DeletionPendingView(); break;
        case 'access_denied': htmlContent = AccessDeniedView(); break;
        case 'select': htmlContent = CharacterSelectView(); break;
        case 'create': htmlContent = CharacterCreateView(); break;
        case 'hub': htmlContent = HubView(); break;
        case 'terms': htmlContent = TermsView(); break;
        case 'privacy': htmlContent = PrivacyView(); break;
        case 'wheel': htmlContent = WheelView(); break;
        case 'banned': htmlContent = `
            <div class="flex-1 flex items-center justify-center bg-black p-10 text-center h-full">
                <div class="glass-panel p-12 rounded-[48px] border-red-500/30 max-w-lg shadow-2xl animate-fade-in">
                    <div class="w-24 h-24 bg-red-600/20 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-red-500/30">
                        <i data-lucide="shield-off" class="w-12 h-12"></i>
                    </div>
                    <h2 class="text-4xl font-black text-white uppercase italic tracking-tighter mb-4">Accès Bloqué</h2>
                    <p class="text-gray-400 mb-8 font-medium">Votre accès à la plateforme a été suspendu par le Commandement pour violation grave des règles communautaires.</p>
                    <button onclick="actions.logout()" class="glass-btn-secondary px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-red-400 border-red-500/20 hover:bg-red-500/10 transition-all">Quitter le Terminal</button>
                </div>
            </div>
        `; break;
        default: htmlContent = LoginView();
    }

    app.innerHTML = htmlContent;
    if (window.lucide) setTimeout(() => lucide.createIcons(), 50);
};

const startPolling = () => {
    setInterval(() => { updateActiveTimers(); }, 1000); 
    setInterval(async () => {
        if (!state.user) return;
        try {
            await fetchActiveSession();
            await fetchERLCData();
            if (state.activeHubPanel === 'main' || state.activeHubPanel === 'services' || state.activeHubPanel === 'staff') {
                 await fetchGlobalHeists();
                 await fetchOnDutyStaff();
            }
        } catch(e) { console.warn("Polling error:", e); }
    }, 15000);
};

const updateActiveTimers = () => {
    if (!state.user || !state.activeCharacter) return;
    const heistDisplay = document.getElementById('heist-timer-display');
    if (heistDisplay && state.activeHeistLobby && state.activeHeistLobby.status === 'active') {
        const now = Date.now();
        const remaining = Math.max(0, Math.ceil((state.activeHeistLobby.end_time - now) / 1000));
        heistDisplay.textContent = `${Math.floor(remaining / 60)}:${(remaining % 60).toString().padStart(2, '0')}`;
    }
    const savingsTimer = document.getElementById('bank-savings-timer');
    if (savingsTimer && state.bankAccount && state.bankAccount.taux_int_delivery) {
        const now = new Date();
        const delivery = new Date(state.bankAccount.taux_int_delivery);
        const diff = delivery - now;
        if (diff <= 0) {
            savingsTimer.textContent = "PRET !";
        } else {
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            savingsTimer.textContent = `${days}j ${hours}h`;
        }
    }
};

document.addEventListener('render-view', appRenderer);

const initApp = async () => {
    updateLoadStatus("Protocoles de sécurité...");
    initSecurity();
    if (window.supabase) {
        updateLoadStatus("Liaison base de données...");
        state.supabase = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
        await fetchSecureConfig();
        setupRealtimeListener();
    }
    proceedInit();

    async function proceedInit() {
        updateLoadStatus("Synchronisation monde...");
        await fetchPublicLandingData();
        
        let session = null;
        try { 
            const result = await state.supabase.auth.getSession(); 
            session = result.data.session; 
        } catch(err) { console.error("Session check failed", err); }

        state.supabase.auth.onAuthStateChange(async (event, currentSession) => {
            if (event === 'SIGNED_IN' && currentSession && !state.user) {
                await handleAuthenticatedSession(currentSession);
            } else if (event === 'SIGNED_OUT') {
                state.user = null;
                router('login');
                document.getElementById('app').classList.remove('opacity-0', 'pointer-events-none');
            }
        });

        if (session) {
            await handleAuthenticatedSession(session); 
        } else {
            router('login');
            document.getElementById('app').classList.remove('opacity-0', 'pointer-events-none');
        }
        startPolling();
    }
};

const handleAuthenticatedSession = async (session) => {
    const appEl = document.getElementById('app');
    const loadingScreen = document.getElementById('loading-screen');
    
    try {
        const token = session.provider_token || session.access_token;
        if (!token) throw new Error("No token found");
        
        state.accessToken = token;
        const { data: { user: discordUser }, error: userErr } = await state.supabase.auth.getUser();
        if (userErr || !discordUser) throw new Error("Discord user fetch failed");

        updateLoadStatus(`Validation des accès pour ${discordUser.user_metadata.full_name || discordUser.email}...`);
        
        // Profiles upsert
        const avatarUrl = discordUser.user_metadata.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png';
        await state.supabase.from('profiles').upsert({ 
            id: discordUser.id, 
            username: discordUser.user_metadata.full_name || discordUser.email.split('@')[0], 
            avatar_url: avatarUrl, 
            updated_at: new Date() 
        });

        const { data: profile } = await state.supabase.from('profiles').select('*').eq('id', discordUser.id).maybeSingle();
        
        // Check Bans (Safe check)
        let isBanned = false;
        try {
            const { data: bans } = await state.supabase.from('sanctions')
                .select('id')
                .eq('user_id', discordUser.id)
                .eq('type', 'ban')
                .or('expires_at.is.null,expires_at.gt.now()');
            isBanned = bans && bans.length > 0;
        } catch(e) { console.warn("Sanctions table might not exist yet."); }

        state.user = { 
            id: discordUser.id, 
            username: discordUser.user_metadata.full_name || discordUser.email.split('@')[0], 
            avatar: avatarUrl, 
            permissions: profile?.permissions || {}, 
            deletion_requested_at: profile?.deletion_requested_at || null, 
            whell_turn: profile?.whell_turn || 0,
            isFounder: state.adminIds.includes(discordUser.id), 
            isBanned: isBanned,
            guilds: [] // Will be populated if needed by extra fetch
        };

        // Transition logic
        appEl.classList.add('opacity-0');
        if (!sessionStorage.getItem('tfrp_intro_played')) {
            await startIntro();
        }
        
        loadingScreen.style.opacity = '1';
        await finalizeLoginLogic();
        
        loadingScreen.style.opacity = '0';
        appEl.classList.remove('opacity-0', 'pointer-events-none');
        appEl.style.opacity = '1';
        setTimeout(() => loadingScreen.classList.add('pointer-events-none'), 500);

    } catch (e) { 
        console.error("Auth Error:", e); 
        router('login');
        appEl.classList.remove('opacity-0', 'pointer-events-none');
        appEl.style.opacity = '1';
    }
};

const finalizeLoginLogic = async () => {
    updateLoadStatus("Lecture des dossiers citoyens...");
    await loadCharacters();
    await fetchActiveSession();
    
    // Charge les sanctions pour l'onglet profil (système d'appel)
    if (window.actions.loadUserSanctions) {
        try { await window.actions.loadUserSanctions(); } catch(e) {}
    }
    
    if (state.user.isBanned) {
        state.currentView = 'banned';
    } else if (state.user.deletion_requested_at) {
        state.currentView = 'deletion_pending';
    } else {
        state.currentView = state.characters.length > 0 ? 'select' : 'create';
    }
    render();
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}