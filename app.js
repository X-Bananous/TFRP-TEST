/**
 * TFRP Core Application
 * Entry Point & Aggregator
 */

import { CONFIG } from './modules/config.js';
import { state } from './modules/state.js';
import { router, render } from './modules/utils.js';
import { ui } from './modules/ui.js'; 
import { initSecurity } from './modules/security.js'; // Import Security

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

/**
 * Cinematic Intro Sequence Improved
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

    await wait(800);

    // Sequence
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

    // Sortie de l'intro
    intro.style.transition = 'opacity 1.5s ease-out, filter 2s ease-out';
    intro.style.opacity = '0';
    intro.style.filter = 'blur(50px)';
    sessionStorage.setItem('tfrp_intro_played', 'true');
    await wait(1500);
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
    
    // FORCE DELETION VIEW IF ACCOUNT IS MARKED FOR DELETION
    let effectiveView = state.currentView;
    if (state.user?.deletion_requested_at && effectiveView !== 'login') {
        effectiveView = 'deletion_pending';
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
        default: htmlContent = LoginView();
    }

    app.innerHTML = htmlContent;
    
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
        
        const qEl = document.querySelector('.erlc-queue-count');
        if(qEl && state.erlcData.queue) qEl.textContent = state.erlcData.queue.length;
        
    }, 15000);
};

const updateActiveTimers = () => {
    if (!state.user || !state.activeCharacter) return;

    // --- BRAQUAGES ---
    const heistDisplay = document.getElementById('heist-timer-display');
    if (heistDisplay && state.activeHeistLobby && state.activeHeistLobby.status === 'active') {
        const now = Date.now();
        const remaining = Math.max(0, Math.ceil((state.activeHeistLobby.end_time - now) / 1000));
        
        if (remaining <= 0) {
             if(heistDisplay.textContent !== "00:00") {
                 heistDisplay.textContent = "00:00";
             }
        } else {
            heistDisplay.textContent = `${Math.floor(remaining / 60)}:${(remaining % 60).toString().padStart(2, '0')}`;
        }
    }

    // --- DROGUES (UI ONLY) ---
    const drugDisplay = document.getElementById('drug-timer-display');
    if (drugDisplay && state.drugLab && state.drugLab.current_batch) {
        const now = Date.now();
        const remaining = Math.max(0, Math.ceil((state.drugLab.current_batch.end_time - now) / 1000));
        if (remaining <= 0) {
             if(drugDisplay.textContent !== "00:00") {
                 drugDisplay.textContent = "00:00";
             }
        } else {
             drugDisplay.textContent = `${Math.floor(remaining / 60)}:${(remaining % 60).toString().padStart(2, '0')}`;
        }
    }

    // --- ÉPARGNE BANCAIRE ---
    const savingsTimer = document.getElementById('bank-savings-timer');
    if (savingsTimer && state.bankAccount) {
        if (!state.bankAccount.taux_int_delivery) {
            savingsTimer.textContent = "Calcul...";
            if (!state._fetchingBank) {
                state._fetchingBank = true;
                fetchBankData(state.activeCharacter.id).finally(() => state._fetchingBank = false);
            }
            return;
        }

        const now = new Date();
        const delivery = new Date(state.bankAccount.taux_int_delivery);
        const diff = delivery - now;

        if (diff <= 0) {
            savingsTimer.textContent = "PRET !";
            savingsTimer.classList.remove('text-blue-400');
            savingsTimer.classList.add('text-emerald-400', 'animate-pulse');
            
            if (!state._autoClaiming) {
                state._autoClaiming = true;
                fetchBankData(state.activeCharacter.id).finally(() => {
                    setTimeout(() => state._autoClaiming = false, 5000); 
                });
            }
        } else {
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            
            savingsTimer.textContent = `${days}j ${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
            savingsTimer.classList.add('text-blue-400');
            savingsTimer.classList.remove('text-emerald-400', 'animate-pulse');
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

    const hasDevAccess = sessionStorage.getItem('tfrp_dev_access') === 'true';

    if (window.location.href.includes("x-bananous.github.io/TFRP-TEST/") && !hasDevAccess) {
        const checkDevCode = () => {
            const input = document.getElementById('dev-code-input');
            if (input && input.value === state.devKey) {
                sessionStorage.setItem('tfrp_dev_access', 'true');
                document.getElementById('dev-protection-layer').remove();
                proceedInit();
            } else {
                if(input) { input.classList.add('border-red-500', 'text-red-500'); input.value = ''; input.placeholder = 'Code Invalide'; }
            }
        };

        const protectionHtml = `
            <div id="dev-protection-layer" class="fixed inset-0 z-[9999] bg-[#050505] flex items-center justify-center">
                <div class="glass-panel p-8 rounded-2xl max-w-sm w-full text-center border-yellow-500/20 shadow-2xl">
                    <div class="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-yellow-500 animate-pulse">
                        <i data-lucide="flask-conical" class="w-8 h-8"></i>
                    </div>
                    <h2 class="text-2xl font-bold text-white mb-2">Version Développeur</h2>
                    <p class="text-gray-400 text-sm mb-6">Environnement de test restreint.</p>
                    <input type="password" id="dev-code-input" class="glass-input w-full p-3 rounded-xl text-center tracking-widest mb-4 font-mono text-lg" placeholder="ACCESS CODE" autofocus>
                    <button id="dev-submit-btn" class="glass-btn w-full py-3 rounded-xl font-bold text-sm">Valider</button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', protectionHtml);
        if(window.lucide) lucide.createIcons();
        document.getElementById('dev-submit-btn').onclick = checkDevCode;
        document.getElementById('dev-code-input').onkeydown = (e) => { if(e.key === 'Enter') checkDevCode(); };
        return; 
    } else { proceedInit(); }

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
                 const appEl = document.getElementById('app');
                 appEl.classList.remove('opacity-0');
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
        if (!Array.isArray(guilds) || !guilds.some(g => g.id === CONFIG.REQUIRED_GUILD_ID)) { router('access_denied'); appEl.classList.remove('opacity-0'); return; }
        
        let isFounder = state.adminIds.includes(discordUser.id);
        await state.supabase.from('profiles').upsert({ id: discordUser.id, username: discordUser.username, avatar_url: `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`, updated_at: new Date() });
        const { data: profile } = await state.supabase.from('profiles').select('permissions, advent_calendar, deletion_requested_at, whell_turn, isnotified_wheel').eq('id', discordUser.id).maybeSingle();
        state.user = { 
            id: discordUser.id, 
            username: discordUser.global_name || discordUser.username, 
            avatar: `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`, 
            avatar_decoration: discordUser.avatar_decoration_data ? `https://cdn.discordapp.com/avatar-decoration-presets/${discordUser.avatar_decoration_data.asset}.png?size=160` : null, 
            permissions: profile?.permissions || {}, 
            advent_calendar: profile?.advent_calendar || [], 
            deletion_requested_at: profile?.deletion_requested_at || null, 
            whell_turn: profile?.whell_turn || 0,
            isnotified_wheel: profile?.isnotified_wheel ?? true,
            isFounder: isFounder, 
            guilds: guilds.map(g => g.id) 
        };
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // SEQUENCE : Intro -> Loading -> Character Select
        appEl.classList.add('opacity-0'); 
        await startIntro();
        
        loadingScreen.classList.remove('pointer-events-none');
        loadingScreen.style.opacity = '1';
        await finalizeLoginLogic();
        loadingScreen.style.opacity = '0';
        appEl.classList.remove('opacity-0', 'pointer-events-none');
        setTimeout(() => loadingScreen.remove(), 700);
    } catch(e) { console.error("Legacy Auth Error", e); ui.showToast("Erreur connexion Legacy.", 'error'); router('login'); appEl.classList.remove('opacity-0'); }
};

const handleAuthenticatedSession = async (session) => {
    const appEl = document.getElementById('app');
    const loadingScreen = document.getElementById('loading-screen');
    try {
        const token = session.provider_token;
        if (!token) { await state.supabase.auth.signOut(); return; }
        state.accessToken = token;
        const userRes = await fetch('https://discord.com/api/users/@me', { headers: { Authorization: `Bearer ${token}` } });
        if (userRes.status === 401) { throw new Error("Token expired"); }
        if (!userRes.ok) throw new Error('Discord User Fetch Failed');
        const discordUser = await userRes.json();
        
        updateLoadStatus(`Vérification des droits de ${discordUser.username}...`);
        
        const guildsRes = await fetch('https://discord.com/api/users/@me/guilds', { headers: { Authorization: `Bearer ${token}` } });
        const guilds = await guildsRes.json();
        if (!Array.isArray(guilds) || !guilds.some(g => g.id === CONFIG.REQUIRED_GUILD_ID)) {
            router('access_denied');
            appEl.classList.remove('opacity-0');
            return;
        }
        let isFounder = state.adminIds.includes(discordUser.id);
        await state.supabase.from('profiles').upsert({ id: discordUser.id, username: discordUser.username, avatar_url: `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`, updated_at: new Date() });
        const { data: profile } = await state.supabase.from('profiles').select('permissions, advent_calendar, deletion_requested_at, whell_turn, isnotified_wheel').eq('id', discordUser.id).maybeSingle();
        state.user = { 
            id: discordUser.id, 
            username: discordUser.global_name || discordUser.username, 
            avatar: `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`, 
            avatar_decoration: discordUser.avatar_decoration_data ? `https://cdn.discordapp.com/avatar-decoration-presets/${discordUser.avatar_decoration_data.asset}.png?size=160` : null, 
            permissions: profile?.permissions || {}, 
            advent_calendar: profile?.advent_calendar || [], 
            deletion_requested_at: profile?.deletion_requested_at || null, 
            whell_turn: profile?.whell_turn || 0,
            isnotified_wheel: profile?.isnotified_wheel ?? true,
            isFounder: isFounder, 
            guilds: guilds.map(g => g.id) 
        };
        
        // SEQUENCE : Intro -> Loading -> Character Select
        appEl.classList.add('opacity-0', 'pointer-events-none');
        await startIntro();
        
        loadingScreen.classList.remove('pointer-events-none');
        loadingScreen.style.opacity = '1';
        await finalizeLoginLogic();
        loadingScreen.style.opacity = '0';
        appEl.classList.remove('opacity-0', 'pointer-events-none');
        appEl.classList.remove('scale-[0.98]');
        setTimeout(() => loadingScreen.remove(), 700);
    } catch (e) { console.error("Auth Error:", e); await window.actions.logout(); }
};

const finalizeLoginLogic = async () => {
    updateLoadStatus("Lecture des dossiers citoyens...");
    await loadCharacters();
    await fetchActiveSession();
    
    // ACCOUNT DELETION BLOCKER
    if (state.user.deletion_requested_at) {
        state.currentView = 'deletion_pending';
        render();
        return;
    }

    const savedView = sessionStorage.getItem('tfrp_current_view');
    const savedCharId = sessionStorage.getItem('tfrp_active_char');
    const savedPanel = sessionStorage.getItem('tfrp_hub_panel');
    if (savedView === 'hub' && savedCharId) {
        const char = state.characters.find(c => c.id === savedCharId);
        if (char && !char.deletion_requested_at) {
            state.activeCharacter = char;
            state.alignmentModalShown = true; 
            if (savedPanel) { await window.actions.setHubPanel(savedPanel); } else { router('hub'); }
        } else { router(state.characters.length > 0 ? 'select' : 'create'); }
    } else { router(state.characters.length > 0 ? 'select' : 'create'); }
};

if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', initApp); } else { initApp(); }