
/**
 * TFRP Core Application
 * Entry Point & Aggregator
 */

import { CONFIG } from './modules/config.js';
import { state } from './modules/state.js';
import { router, render } from './modules/utils.js';
import { ui } from './modules/ui.js'; 
import { initSecurity } from './modules/security.js'; // Import Security

// Import Actions - FIXED SYNTAX
import * as AuthActions from './modules/actions/auth.js';
import * as NavActions from './modules/actions/navigation.js';
import * as CharacterActions from './modules/actions/character.js';
import * as EconomyActions from './modules/actions/economy.js';
import * as IllicitActions from './modules/actions/illicit.js';
import * * as ServicesActions from './modules/actions/services.js';
import * as EnterpriseActions from './modules/actions/enterprise.js'; 
import * * as StaffActions from './modules/actions/staff.js';
import * * as ProfileActions from './modules/actions/profile.js';

import { setupRealtimeListener, fetchERLCData, fetchActiveHeistLobby, fetchDrugLab, fetchGlobalHeists, fetchOnDutyStaff, loadCharacters, fetchPublicLandingData, fetchActiveSession, fetchSecureConfig, fetchActiveGang, checkAndCompleteDrugBatch, fetchBankData } from './modules/services.js';

// Views
import { LoginView, AccessDeniedView } from './modules/views/login.js';
import { CharacterSelectView } from './modules/views/select.js';
import { CharacterCreateView } from './modules/views/create.js';
import { HubView } from './modules/views/hub.js';
import { TermsView, PrivacyView } from './modules/views/legal.js';

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
    ...ProfileActions
};

window.router = router;

/**
 * Cinematic Intro Sequence
 */
const startIntro = async () => {
    if (sessionStorage.getItem('tfrp_intro_played')) return;

    const intro = document.getElementById('intro-screen');
    const phases = [
        document.getElementById('intro-phase-1'),
        document.getElementById('intro-phase-2'),
        document.getElementById('intro-phase-3'),
        document.getElementById('intro-phase-4')
    ];

    if (!intro) return;

    const wait = (ms) => new Promise(res => setTimeout(res, ms));

    const appEl = document.getElementById('app');
    appEl.classList.add('opacity-0', 'pointer-events-none');
    
    intro.classList.remove('opacity-0', 'pointer-events-none');
    intro.style.opacity = '1';
    intro.style.pointerEvents = 'auto';

    await wait(500);

    for (let i = 0; i < phases.length; i++) {
        if (!phases[i]) continue;
        
        phases[i].classList.add('active');
        await wait(3500);
        phases[i].classList.remove('active');
        await wait(600);
    }

    intro.style.opacity = '0';
    sessionStorage.setItem('tfrp_intro_played', 'true');
    await wait(1000);
    intro.remove();
};

/**
 * Update Loading Screen Status
 */
const updateLoadStatus = (msg) => {
    state.loadingStatus = msg;
    const el = document.getElementById('loading-status');
    if (el) el.textContent = msg;
    console.log(`[Boot] ${msg}`);
};

// --- Core Renderer ---
const appRenderer = () => {
    const app = document.getElementById('app');
    if (!app) return;

    let htmlContent = '';
    
    switch (state.currentView) {
        case 'login': htmlContent = LoginView(); break;
        case 'access_denied': htmlContent = AccessDeniedView(); break;
        case 'select': htmlContent = CharacterSelectView(); break;
        case 'create': htmlContent = CharacterCreateView(); break;
        case 'hub': htmlContent = HubView(); break;
        case 'terms': htmlContent = TermsView(); break;
        case 'privacy': htmlContent = PrivacyView(); break;
        default: htmlContent = LoginView();
    }

    app.innerHTML = htmlContent;
    
    if (state.currentView === 'select' && state.user && state.adminIds.includes(state.user.id)) {
        const header = app.querySelector('.flex.items-center.gap-4');
        if (header) {
             const btn = document.createElement('button');
             btn.onclick = window.actions.openFoundationModal;
             btn.className = 'w-8 h-8 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 hover:bg-purple-500/20 hover:scale-110 transition-all';
             btn.innerHTML = '<i data-lucide="key" class="w-4 h-4"></i>';
             btn.title = "Accès Fondation";
             header.prepend(btn);
        }
    }

    if (window.lucide) setTimeout(() => lucide.createIcons(), 50);
};

// --- AUTO REFRESH LOOP ---
const startPolling = () => {
    setInterval(() => {
        updateActiveTimers();
    }, 1000); 

    setInterval(async () => {
        if (!state.user) return;
        
        const prevSessionId = state.activeGameSession ? state.activeGameSession.id : null;
        await fetchActiveSession();
        const newSessionId = state.activeGameSession ? state.activeGameSession.id : null;
        
        if (prevSessionId !== newSessionId) {
            render();
        }

        await fetchERLCData();
        
        if (state.activeHubPanel === 'main' || state.activeHubPanel === 'services' || state.activeHubPanel === 'staff') {
             await fetchGlobalHeists();
             await fetchOnDutyStaff();
        }
        
        if (state.activeHubPanel === 'illicit' && state.activeCharacter) {
             await fetchActiveHeistLobby(state.activeCharacter.id);
             await fetchActiveGang(state.activeCharacter.id);
             if (state.activeGang) {
                 await checkAndCompleteDrugBatch(state.activeGang.id); 
                 await fetchDrugLab(state.activeGang.id);
             }
        }
        
    }, 15000);
};

const updateActiveTimers = () => {
    if (!state.user || !state.activeCharacter) return;

    const heistDisplay = document.getElementById('heist-timer-display');
    if (heistDisplay && state.activeHeistLobby && state.activeHeistLobby.status === 'active') {
        const now = Date.now();
        const remaining = Math.max(0, Math.ceil((state.activeHeistLobby.end_time - now) / 1000));
        if (remaining <= 0) {
             if(heistDisplay.textContent !== "00:00") heistDisplay.textContent = "00:00";
        } else {
            heistDisplay.textContent = `${Math.floor(remaining / 60)}:${(remaining % 60).toString().padStart(2, '0')}`;
        }
    }

    const drugDisplay = document.getElementById('drug-timer-display');
    if (drugDisplay && state.drugLab && state.drugLab.current_batch) {
        const now = Date.now();
        const remaining = Math.max(0, Math.ceil((state.drugLab.current_batch.end_time - now) / 1000));
        if (remaining <= 0) {
             if(drugDisplay.textContent !== "00:00") drugDisplay.textContent = "00:00";
        } else {
             drugDisplay.textContent = `${Math.floor(remaining / 60)}:${(remaining % 60).toString().padStart(2, '0')}`;
        }
    }

    const savingsTimer = document.getElementById('bank-savings-timer');
    if (savingsTimer && state.bankAccount) {
        if (!state.bankAccount.taux_int_delivery) {
            savingsTimer.textContent = "Calcul...";
            return;
        }
        const now = new Date();
        const delivery = new Date(state.bankAccount.taux_int_delivery);
        const diff = delivery - now;
        if (diff <= 0) {
            savingsTimer.textContent = "PRÊT !";
            savingsTimer.classList.add('text-emerald-400', 'animate-pulse');
        } else {
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            savingsTimer.textContent = `${days}j ${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
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
        
        if (window.location.hash && window.location.hash.includes('access_token')) {
            updateLoadStatus("Validation jeton Discord...");
            const params = new URLSearchParams(window.location.hash.substring(1));
            const legacyToken = params.get('access_token');
            if (legacyToken) {
                await handleLegacySession(legacyToken);
                startPolling();
                return;
            }
        }
        
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
            }
        });
        
        if (session) { 
            await handleAuthenticatedSession(session); 
        } else {
            const appEl = document.getElementById('app');
            appEl.classList.remove('opacity-0', 'pointer-events-none');
            router('login');
        }
        startPolling();
    }
};

const handleLegacySession = async (token) => {
    const appEl = document.getElementById('app');
    const loadingScreen = document.getElementById('loading-screen');
    try {
        state.accessToken = token;
        const userRes = await fetch('https://discord.com/api/users/@me', { headers: { Authorization: `Bearer ${token}` } });
        if (!userRes.ok) throw new Error('Discord User Fetch Failed (Legacy)');
        const discordUser = await userRes.json();
        
        updateLoadStatus(`Bienvenue ${discordUser.global_name || discordUser.username}...`);
        
        const guildsRes = await fetch('https://discord.com/api/users/@me/guilds', { headers: { Authorization: `Bearer ${token}` } });
        const guilds = await guildsRes.json();
        if (!Array.isArray(guilds) || !guilds.some(g => g.id === CONFIG.REQUIRED_GUILD_ID)) { router('access_denied'); return; }
        
        let isFounder = state.adminIds.includes(discordUser.id);
        await state.supabase.from('profiles').upsert({ id: discordUser.id, username: discordUser.username, avatar_url: `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`, updated_at: new Date() });
        const { data: profile } = await state.supabase.from('profiles').select('permissions, deletion_requested_at').eq('id', discordUser.id).maybeSingle();
        state.user = { id: discordUser.id, username: discordUser.global_name || discordUser.username, avatar: `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`, avatar_decoration: discordUser.avatar_decoration_data ? `https://cdn.discordapp.com/avatar-decoration-presets/${discordUser.avatar_decoration_data.asset}.png?size=160` : null, permissions: profile?.permissions || {}, deletion_requested_at: profile?.deletion_requested_at || null, isFounder: isFounder, guilds: guilds.map(g => g.id) };
        window.history.replaceState({}, document.title, window.location.pathname);
        
        appEl.classList.add('opacity-0'); 
        await startIntro();
        
        loadingScreen.classList.remove('pointer-events-none');
        loadingScreen.style.opacity = '1';
        await finalizeLoginLogic();
        loadingScreen.style.opacity = '0';
        appEl.classList.remove('opacity-0', 'pointer-events-none');
    } catch(e) { console.error("Legacy Auth Error", e); router('login'); }
};

const handleAuthenticatedSession = async (session) => {
    const appEl = document.getElementById('app');
    const loadingScreen = document.getElementById('loading-screen');
    try {
        const token = session.provider_token;
        if (!token) { await state.supabase.auth.signOut(); return; }
        state.accessToken = token;
        const userRes = await fetch('https://discord.com/api/users/@me', { headers: { Authorization: `Bearer ${token}` } });
        if (!userRes.ok) throw new Error('Discord User Fetch Failed');
        const discordUser = await userRes.json();
        
        updateLoadStatus(`Vérification des droits de ${discordUser.username}...`);
        
        const guildsRes = await fetch('https://discord.com/api/users/@me/guilds', { headers: { Authorization: `Bearer ${token}` } });
        const guilds = await guildsRes.json();
        if (!Array.isArray(guilds) || !guilds.some(g => g.id === CONFIG.REQUIRED_GUILD_ID)) {
            router('access_denied');
            return;
        }
        let isFounder = state.adminIds.includes(discordUser.id);
        await state.supabase.from('profiles').upsert({ id: discordUser.id, username: discordUser.username, avatar_url: `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`, updated_at: new Date() });
        const { data: profile } = await state.supabase.from('profiles').select('permissions, deletion_requested_at').eq('id', discordUser.id).maybeSingle();
        state.user = { id: discordUser.id, username: discordUser.global_name || discordUser.username, avatar: `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`, avatar_decoration: discordUser.avatar_decoration_data ? `https://cdn.discordapp.com/avatar-decoration-presets/${discordUser.avatar_decoration_data.asset}.png?size=160` : null, permissions: profile?.permissions || {}, deletion_requested_at: profile?.deletion_requested_at || null, isFounder: isFounder, guilds: guilds.map(g => g.id) };
        
        appEl.classList.add('opacity-0', 'pointer-events-none');
        await startIntro();
        
        loadingScreen.classList.remove('pointer-events-none');
        loadingScreen.style.opacity = '1';
        await finalizeLoginLogic();
        loadingScreen.style.opacity = '0';
        appEl.classList.remove('opacity-0', 'pointer-events-none');
    } catch (e) { console.error("Auth Error:", e); await window.actions.logout(); }
};

const finalizeLoginLogic = async () => {
    updateLoadStatus("Lecture des dossiers citoyens...");
    await loadCharacters();
    await fetchActiveSession();
    const savedView = sessionStorage.getItem('tfrp_current_view');
    const savedCharId = sessionStorage.getItem('tfrp_active_char');
    const savedPanel = sessionStorage.getItem('tfrp_hub_panel');
    if (savedView === 'hub' && savedCharId) {
        const char = state.characters.find(c => c.id === savedCharId);
        if (char) {
            state.activeCharacter = char;
            state.alignmentModalShown = true; 
            if (savedPanel) await window.actions.setHubPanel(savedPanel); else router('hub');
        } else { router(state.characters.length > 0 ? 'select' : 'create'); }
    } else { router(state.characters.length > 0 ? 'select' : 'create'); }
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initApp); else initApp();
