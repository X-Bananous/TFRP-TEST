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
    intro.style.transition = 'opacity 1.5s ease-out, filter 2s ease-out';
    intro.style.opacity = '0';
    intro.style.filter = 'blur(50px)';
    sessionStorage.setItem('tfrp_intro_played', 'true');
    await wait(1500);
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

    // CHECK FOR BAN
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
            <div class="flex-1 flex items-center justify-center bg-black p-10 text-center">
                <div class="glass-panel p-12 rounded-[48px] border-red-500/30 max-w-lg shadow-2xl">
                    <div class="w-24 h-24 bg-red-600/20 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-red-500/30">
                        <i data-lucide="shield-off" class="w-12 h-12"></i>
                    </div>
                    <h2 class="text-4xl font-black text-white uppercase italic tracking-tighter mb-4">Accès Bloqué</h2>
                    <p class="text-gray-400 mb-8 font-medium">Votre accès à la plateforme a été suspendu par le Commandement pour violation grave des règles communautaires.</p>
                    <button onclick="actions.logout()" class="glass-btn-secondary px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-red-400 border-red-500/20 hover:bg-red-500/10">Quitter le Terminal</button>
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
        const prevSessionId = state.activeGameSession ? state.activeGameSession.id : null;
        await fetchActiveSession();
        const newSessionId = state.activeGameSession ? state.activeGameSession.id : null;
        if (prevSessionId !== newSessionId) render();
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
        if (remaining <= 0) { if(heistDisplay.textContent !== "00:00") heistDisplay.textContent = "00:00"; } 
        else heistDisplay.textContent = `${Math.floor(remaining / 60)}:${(remaining % 60).toString().padStart(2, '0')}`;
    }
    const drugDisplay = document.getElementById('drug-timer-display');
    if (drugDisplay && state.drugLab && state.drugLab.current_batch) {
        const now = Date.now();
        const remaining = Math.max(0, Math.ceil((state.drugLab.current_batch.end_time - now) / 1000));
        if (remaining <= 0) { if(drugDisplay.textContent !== "00:00") drugDisplay.textContent = "00:00"; } 
        else drugDisplay.textContent = `${Math.floor(remaining / 60)}:${(remaining % 60).toString().padStart(2, '0')}`;
    }
    const savingsTimer = document.getElementById('bank-savings-timer');
    if (savingsTimer && state.bankAccount) {
        if (!state.bankAccount.taux_int_delivery) {
            savingsTimer.textContent = "Calcul...";
            if (!state._fetchingBank) { state._fetchingBank = true; fetchBankData(state.activeCharacter.id).finally(() => state._fetchingBank = false); }
            return;
        }
        const now = new Date();
        const delivery = new Date(state.bankAccount.taux_int_delivery);
        const diff = delivery - now;
        if (diff <= 0) {
            savingsTimer.textContent = "PRET !";
            savingsTimer.classList.remove('text-blue-400');
            savingsTimer.classList.add('text-emerald-400', 'animate-pulse');
            if (!state._autoClaiming) { state._autoClaiming = true; fetchBankData(state.activeCharacter.id).finally(() => { setTimeout(() => state._autoClaiming = false, 5000); }); }
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
    proceedInit();

    async function proceedInit() {
        updateLoadStatus("Synchronisation monde...");
        await fetchPublicLandingData();
        if (window.location.hash && window.location.hash.includes('access_token')) {
            updateLoadStatus("Validation jeton Discord...");
            const params = new URLSearchParams(window.location.hash.substring(1));
            const legacyToken = params.get('access_token');
            if (legacyToken) { await handleLegacySession(legacyToken); startPolling(); return; }
        }
        let session = null;
        try { const result = await state.supabase.auth.getSession(); session = result.data.session; } catch(err) { console.error("Session check failed", err); }
        state.supabase.auth.onAuthStateChange(async (event, currentSession) => {
            if (event === 'SIGNED_IN' && currentSession && !state.user) await handleAuthenticatedSession(currentSession);
            else if (event === 'SIGNED_OUT') { state.user = null; router('login'); const appEl = document.getElementById('app'); appEl.classList.remove('opacity-0'); }
        });
        if (session) await handleAuthenticatedSession(session); 
        else { const appEl = document.getElementById('app'); appEl.classList.remove('opacity-0', 'pointer-events-none'); router('login'); }
        startPolling();
    }
};

const handleAuthenticatedSession = async (session) => {
    const appEl = document.getElementById('app');
    const loadingScreen = document.getElementById('loading-screen');
    try {
        const token = session.provider_token;
        if (!token) { await state.supabase.auth.signOut(); return; }
        state.accessToken = token;
        const userRes = await fetch('https://discord.com/api/users/@me', { headers: { Authorization: `Bearer ${token}` } });
        if (userRes.status === 401) throw new Error("Token expired");
        const discordUser = await userRes.json();
        updateLoadStatus(`Vérification des droits de ${discordUser.username}...`);
        const guildsRes = await fetch('https://discord.com/api/users/@me/guilds', { headers: { Authorization: `Bearer ${token}` } });
        const guilds = await guildsRes.json();
        if (!Array.isArray(guilds) || !guilds.some(g => g.id === CONFIG.REQUIRED_GUILD_ID)) { router('access_denied'); appEl.classList.remove('opacity-0'); return; }
        
        await state.supabase.from('profiles').upsert({ id: discordUser.id, username: discordUser.username, avatar_url: `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`, updated_at: new Date() });
        const { data: profile } = await state.supabase.from('profiles').select('*').eq('id', discordUser.id).maybeSingle();
        
        // CHECK BANS
        const { data: bans } = await state.supabase.from('sanctions').select('*').eq('user_id', discordUser.id).eq('type', 'ban').or('expires_at.is.null,expires_at.gt.now()');
        const isBanned = bans && bans.length > 0;

        state.user = { 
            id: discordUser.id, 
            username: discordUser.global_name || discordUser.username, 
            avatar: `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`, 
            permissions: profile?.permissions || {}, 
            deletion_requested_at: profile?.deletion_requested_at || null, 
            whell_turn: profile?.whell_turn || 0,
            isnotified_wheel: profile?.isnotified_wheel ?? true,
            isFounder: state.adminIds.includes(discordUser.id), 
            isBanned: isBanned,
            guilds: guilds.map(g => g.id) 
        };
        
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
    await window.actions.loadUserSanctions(); // Load sanctions for appeal system
    
    if (state.user.isBanned) {
        state.currentView = 'banned';
        render();
        return;
    }
    if (state.user.deletion_requested_at) {
        state.currentView = 'deletion_pending';
        render();
        return;
    }
    router(state.characters.length > 0 ? 'select' : 'create');
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initApp); else initApp();