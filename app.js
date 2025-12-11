
/**
 * TFRP Core Application
 * Entry Point & Aggregator
 */

import { CONFIG } from './modules/config.js';
import { state } from './modules/state.js';
import { router, render } from './modules/utils.js';
import { ui } from './modules/ui.js'; 

// Import Actions
import * as AuthActions from './modules/actions/auth.js';
import * as NavActions from './modules/actions/navigation.js';
import * as CharacterActions from './modules/actions/character.js';
import * as EconomyActions from './modules/actions/economy.js';
import * as IllicitActions from './modules/actions/illicit.js';
import * as ServicesActions from './modules/actions/services.js';
import * as EnterpriseActions from './modules/actions/enterprise.js'; // NEW
import * as StaffActions from './modules/actions/staff.js';

import { setupRealtimeListener, fetchERLCData, fetchActiveHeistLobby, fetchDrugLab, fetchGlobalHeists, fetchOnDutyStaff, loadCharacters, fetchPublicLandingData, fetchActiveSession } from './modules/services.js';

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
    ...EnterpriseActions
};

// --- FIX: Expose router globally for HTML onclick events ---
window.router = router;

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
    
    // Inject Bypass Trigger for Admins (Icon only)
    if (state.currentView === 'select' && state.user && CONFIG.ADMIN_IDS.includes(state.user.id)) {
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

// --- AUTO REFRESH LOOP (Polling) ---
const startPolling = () => {
    // 1. FAST LOOP (Timers) - 1s
    setInterval(() => {
        if (!state.user || !state.activeCharacter) return;
        updateActiveTimers();
    }, 1000); 

    // 2. DATA SYNC LOOP (ERLC / Heists) - 15s (Faster to seem responsive)
    setInterval(async () => {
        if (!state.user) return;
        
        // Sync Session Status Globally and Check for Changes
        const prevSessionId = state.activeGameSession ? state.activeGameSession.id : null;
        await fetchActiveSession();
        const newSessionId = state.activeGameSession ? state.activeGameSession.id : null;
        
        // Force render if session state changed (e.g. Started/Stopped externally)
        if (prevSessionId !== newSessionId) {
            render();
        }

        // Always sync ERLC Data
        await fetchERLCData();
        
        // Sync Hub Data (if active)
        if (state.activeHubPanel === 'main' || state.activeHubPanel === 'services' || state.activeHubPanel === 'staff') {
             await fetchGlobalHeists();
             await fetchOnDutyStaff();
        }
        
        // Sync Illicit Status (if active)
        if (state.activeHubPanel === 'illicit' && state.activeCharacter) {
             await fetchActiveHeistLobby(state.activeCharacter.id);
             await fetchDrugLab(state.activeCharacter.id);
        }
        
        // Only trigger render if strictly necessary or for Queue updates
        const qEl = document.querySelector('.erlc-queue-count');
        if(qEl && state.erlcData.queue) qEl.textContent = state.erlcData.queue.length;
        
    }, 15000);
};

// DOM Timer Updater (No Re-render)
const updateActiveTimers = () => {
    // Heist
    const heistDisplay = document.getElementById('heist-timer-display');
    if (heistDisplay && state.activeHeistLobby && state.activeHeistLobby.status === 'active') {
        const now = Date.now();
        const remaining = Math.max(0, Math.ceil((state.activeHeistLobby.end_time - now) / 1000));
        
        if (remaining <= 0) {
             if(heistDisplay.textContent !== "00:00") {
                 heistDisplay.textContent = "00:00";
                 // removed render() to avoid infinite loop
             }
        } else {
            heistDisplay.textContent = `${Math.floor(remaining / 60)}:${(remaining % 60).toString().padStart(2, '0')}`;
        }
    }

    // Drug
    const drugDisplay = document.getElementById('drug-timer-display');
    if (drugDisplay && state.drugLab && state.drugLab.current_batch) {
        const now = Date.now();
        const remaining = Math.max(0, Math.ceil((state.drugLab.current_batch.end_time - now) / 1000));
        if (remaining <= 0) {
             if(drugDisplay.textContent !== "00:00") {
                 drugDisplay.textContent = "00:00";
                 render(); // Keep render here as drug UI changes significantly on finish
             }
        } else {
             drugDisplay.textContent = `${Math.floor(remaining / 60)}:${(remaining % 60).toString().padStart(2, '0')}`;
        }
    }
};

document.addEventListener('render-view', appRenderer);

// --- INIT ---
const initApp = async () => {
    const appEl = document.getElementById('app');
    const loadingScreen = document.getElementById('loading-screen');
    
    if (window.supabase) {
        state.supabase = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
        setupRealtimeListener();
    }

    // Fetch Public Data for Landing Page (before auth)
    await fetchPublicLandingData();
    // Re-render LoginView if that's where we are
    if(state.currentView === 'login') render();

    // Auth Handling
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const popupToken = fragment.get('access_token');
    const tokenType = fragment.get('token_type');
    const expiresIn = fragment.get('expires_in');

    // 1. Popup Callback Flow
    if (popupToken && window.opener) {
        window.opener.postMessage({ 
            type: 'DISCORD_AUTH_SUCCESS', 
            token: popupToken, 
            tokenType: tokenType, 
            expiresIn: expiresIn
        }, window.location.origin);
        window.close();
        return;
    }

    // 2. Direct Redirect Callback Flow (FIX for Landing Page issue)
    if (popupToken) {
        const expiryTime = new Date().getTime() + (parseInt(expiresIn) * 1000);
        localStorage.setItem('tfrp_access_token', popupToken);
        localStorage.setItem('tfrp_token_type', tokenType);
        localStorage.setItem('tfrp_token_expiry', expiryTime.toString());
        state.accessToken = popupToken;
        
        // Clean URL to remove token from address bar
        window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
        
        await handleDiscordCallback(popupToken, tokenType);
        return; // Stop here, handled
    }

    // 3. Stored Token Flow
    const storedToken = localStorage.getItem('tfrp_access_token');
    const storedType = localStorage.getItem('tfrp_token_type');
    const storedExpiry = localStorage.getItem('tfrp_token_expiry');

    if (storedToken && storedExpiry && new Date().getTime() < parseInt(storedExpiry)) {
        state.accessToken = storedToken;
        await handleDiscordCallback(storedToken, storedType);
    } else {
        router('login');
        setTimeout(() => {
            if(loadingScreen) loadingScreen.style.opacity = '0';
            appEl.classList.remove('opacity-0');
            setTimeout(() => loadingScreen?.remove(), 700);
        }, 800);
    }

    // Listener for popup messages (if popup is used)
    window.addEventListener('message', async (event) => {
        if (event.origin !== window.location.origin) return;
        if (event.data.type === 'DISCORD_AUTH_SUCCESS') {
            const { token, tokenType, expiresIn } = event.data;
            const expiryTime = new Date().getTime() + (parseInt(expiresIn) * 1000);
            localStorage.setItem('tfrp_access_token', token);
            localStorage.setItem('tfrp_token_type', tokenType);
            localStorage.setItem('tfrp_token_expiry', expiryTime.toString());
            state.accessToken = token;
            state.isLoggingIn = false;
            await handleDiscordCallback(token, tokenType);
        }
    });

    startPolling();
};

const handleDiscordCallback = async (token, type) => {
    const appEl = document.getElementById('app');
    const loadingScreen = document.getElementById('loading-screen');
    
    try {
        const userRes = await fetch('https://discord.com/api/users/@me', {
            headers: { Authorization: `${type} ${token}` }
        });
        if (!userRes.ok) throw new Error('Discord User Fetch Failed');
        const discordUser = await userRes.json();
        
        // Fetch Guilds
        const guildsRes = await fetch('https://discord.com/api/users/@me/guilds', {
             headers: { Authorization: `${type} ${token}` }
        });
        const guilds = await guildsRes.json();
        
        if (!guilds.some(g => g.id === CONFIG.REQUIRED_GUILD_ID)) {
            router('access_denied');
            if(loadingScreen) loadingScreen.style.opacity = '0';
            appEl.classList.remove('opacity-0');
            setTimeout(() => loadingScreen?.remove(), 700);
            return;
        }

        let isFounder = CONFIG.ADMIN_IDS.includes(discordUser.id);
        
        const { error: upsertError } = await state.supabase.from('profiles').upsert({
            id: discordUser.id,
            username: discordUser.username,
            avatar_url: `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`,
            updated_at: new Date(),
        });

        const { data: profile } = await state.supabase.from('profiles').select('permissions').eq('id', discordUser.id).maybeSingle();

        state.user = {
            id: discordUser.id,
            username: discordUser.global_name || discordUser.username,
            avatar: `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`,
            avatar_decoration: discordUser.avatar_decoration_data ? `https://cdn.discordapp.com/avatar-decoration-presets/${discordUser.avatar_decoration_data.asset}.png?size=160` : null,
            permissions: profile?.permissions || {},
            isFounder: isFounder,
            guilds: guilds.map(g => g.id) // Store guild IDs for permission checks
        };

        await loadCharacters();
        // Init fetch of session
        await fetchActiveSession();

        // --- SESSION RESTORATION LOGIC ---
        const savedView = sessionStorage.getItem('tfrp_current_view');
        const savedCharId = sessionStorage.getItem('tfrp_active_char');
        const savedPanel = sessionStorage.getItem('tfrp_hub_panel');

        if (savedView === 'hub' && savedCharId) {
            // Restore Character
            const char = state.characters.find(c => c.id === savedCharId);
            if (char) {
                // Manually set state without triggering router yet
                state.activeCharacter = char;
                state.alignmentModalShown = true; // Assume done if restored
                
                // Restore Panel
                if (savedPanel) {
                    await window.actions.setHubPanel(savedPanel); 
                } else {
                    router('hub');
                }
            } else {
                router(state.characters.length > 0 ? 'select' : 'create');
            }
        } else {
            router(state.characters.length > 0 ? 'select' : 'create');
        }

    } catch (e) {
        console.error("Auth Error:", e);
        window.actions.logout();
    }
    
    // Remove loading screen if still present
    if(loadingScreen && loadingScreen.parentNode) {
        loadingScreen.style.opacity = '0';
        appEl.classList.remove('opacity-0');
        setTimeout(() => loadingScreen.remove(), 700);
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
