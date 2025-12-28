import { state } from '../state.js';
import { render, router } from '../utils.js';
import { ui } from '../ui.js';

export const SLOT_WIDTH = 160; 

const SoundEngine = {
    ctx: null,
    init() { if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)(); },
    tick() {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(); osc.stop(this.ctx.currentTime + 0.1);
    },
    success() {
        if (!this.ctx) return;
        const playNote = (freq, start, duration) => {
            const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime + start);
            gain.gain.setValueAtTime(0.1, this.ctx.currentTime + start);
            osc.connect(gain); gain.connect(this.ctx.destination);
            osc.start(this.ctx.currentTime + start); osc.stop(this.ctx.currentTime + start + duration);
        };
        playNote(440, 0, 0.2); playNote(554, 0.1, 0.2); playNote(659, 0.2, 0.4);
    }
};

export const WHEEL_REWARDS = [
    { label: '1 000 $', weight: 12, type: 'money', value: 1000, color: '#10b981', rarity: 'Commun' },
    { label: '5 000 $', weight: 10, type: 'money', value: 5000, color: '#10b981', rarity: 'Commun' },
    { label: '7 500 $', weight: 8, type: 'money', value: 7500, color: '#10b981', rarity: 'Commun' },
    { label: '10 000 $', weight: 8, type: 'money', value: 10000, color: '#10b981', rarity: 'Commun' },
    { label: '12 500 $', weight: 6, type: 'money', value: 12500, color: '#10b981', rarity: 'Commun' },
    { label: '15 000 $', weight: 6, type: 'money', value: 15000, color: '#059669', rarity: 'Peu Commun' },
    { label: '20 000 $', weight: 6, type: 'money', value: 20000, color: '#059669', rarity: 'Peu Commun' },
    { label: '25 000 $', weight: 5, type: 'money', value: 25000, color: '#3b82f6', rarity: 'Rare' },
    { label: '30 000 $', weight: 5, type: 'money', value: 30000, color: '#3b82f6', rarity: 'Rare' },
    { label: '40 000 $', weight: 4, type: 'money', value: 40000, color: '#3b82f6', rarity: 'Rare' },
    { label: '50 000 $', weight: 4, type: 'money', value: 50000, color: '#3b82f6', rarity: 'Très Rare' },
    { label: '60 000 $', weight: 3, type: 'money', value: 60000, color: '#8b5cf6', rarity: 'Mythique' },
    { label: '75 000 $', weight: 3, type: 'money', value: 75000, color: '#8b5cf6', rarity: 'Mythique' },
    { label: '100 000 $', weight: 3, type: 'money', value: 100000, color: '#8b5cf6', rarity: 'Mythique' },
    { label: '150 000 $', weight: 2, type: 'money', value: 150000, color: '#fbbf24', rarity: 'Légendaire' },
    { label: '200 000 $', weight: 2, type: 'money', value: 200000, color: '#fbbf24', rarity: 'Légendaire' },
    { label: '300 000 $', weight: 1, type: 'money', value: 300000, color: '#ef4444', rarity: 'Relique' },
    { label: '500 000 $', weight: 0.5, type: 'money', value: 500000, color: '#ef4444', rarity: 'Ancestral' },
    { label: 'VIP Bronze', weight: 5, type: 'role', color: '#cd7f32', rarity: 'Premium' },
    { label: 'VIP Argent', weight: 4, type: 'role', color: '#c0c0c0', rarity: 'Premium' },
    { label: 'VIP Or', weight: 3, type: 'role', color: '#ffd700', rarity: 'Premium' },
    { label: 'VIP Platine', weight: 2, type: 'role', color: '#e5e4e2', rarity: 'Elite' },
    { label: 'Rôle Légende', weight: 1, type: 'role', color: '#a855f7', rarity: 'Divin' },
    { label: '???', weight: 1.5, type: 'special', color: '#f472b6', rarity: 'Unique' }
];

export const spinWheel = async () => {
    SoundEngine.init();
    const turns = state.user.whell_turn || 0;
    if (state.isSpinning || turns <= 0) return;
    if (state.characters.length === 0) return ui.showToast("Dossier citoyen requis.", "error");

    const totalWeight = WHEEL_REWARDS.reduce((acc, r) => acc + r.weight, 0);
    let randomVal = Math.random() * totalWeight;
    let winner = WHEEL_REWARDS[0];
    for (const reward of WHEEL_REWARDS) {
        randomVal -= reward.weight;
        if (randomVal <= 0) { winner = reward; break; }
    }

    // CAPTURE FORCÉE DU GAGNANT
    const currentWinner = { ...winner };
    state.lastWheelWinner = currentWinner;

    const stripItems = [];
    for (let i = 0; i < 100; i++) {
        if (i === 80) stripItems.push(currentWinner);
        else stripItems.push(WHEEL_REWARDS[Math.floor(Math.random() * WHEEL_REWARDS.length)]);
    }

    state.currentWheelItems = stripItems;
    state.isSpinning = true;
    render();

    setTimeout(() => {
        const strip = document.getElementById('case-strip');
        if (strip) {
            strip.style.transition = 'none'; strip.style.transform = 'translateX(0)'; strip.offsetHeight;
            const targetX = (80 * SLOT_WIDTH) + Math.floor(Math.random() * 60) - 30;
            strip.style.transition = 'transform 8.5s cubic-bezier(0.12, 0, 0.05, 1)';
            strip.style.transform = `translateX(-${targetX}px)`;
        }
    }, 50);

    setTimeout(async () => {
        SoundEngine.success();
        const newTurns = turns - 1;
        await state.supabase.from('profiles').update({ whell_turn: newTurns }).eq('id', state.user.id);
        state.user.whell_turn = newTurns;

        // DÉCLENCHEMENT MODAL FORCÉE
        if (currentWinner.type === 'money') {
            showCharacterChoiceModal(currentWinner);
        } else {
            showSecureScreenshotModal(currentWinner);
        }
        render();
    }, 9000);
};

const showCharacterChoiceModal = (reward) => {
    const charsHtml = state.characters.map(c => `
        <button onclick="actions.claimMoneyReward(${reward.value}, '${c.id}')" class="w-full p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-emerald-600/20 transition-all text-left flex items-center justify-between group">
            <div><div class="font-black text-white uppercase italic group-hover:text-emerald-400">${c.first_name} ${c.last_name}</div></div>
            <i data-lucide="chevron-right" class="w-5 h-5 text-gray-700"></i>
        </button>`).join('');

    ui.showModal({
        title: "ATTRIBUER LE GAIN",
        isClosable: false, // MODAL NON FERMABLE SANS ACTION
        content: `
            <div class="text-center mb-8">
                <div class="text-6xl mb-4">💰</div>
                <div class="text-3xl font-black text-emerald-400">+$ ${reward.value.toLocaleString()}</div>
                <p class="text-gray-400 text-xs mt-2 italic">Sélectionnez le bénéficiaire de ce gain immédiat :</p>
            </div>
            <div class="space-y-3">${charsHtml}</div>
        `,
        confirmText: null
    });
};

export const claimMoneyReward = async (value, charId) => {
    try {
        const { data: bank } = await state.supabase.from('bank_accounts').select('bank_balance').eq('character_id', charId).single();
        if (bank) {
            await state.supabase.from('bank_accounts').update({ bank_balance: (bank.bank_balance || 0) + value }).eq('character_id', charId);
            await state.supabase.from('transactions').insert({ receiver_id: charId, amount: value, type: 'admin_adjustment', description: 'Gain Loterie TFRP' });
            ui.showToast(`$${value.toLocaleString()} versés.`, "success");
        }
    } catch(e) { ui.showToast("Erreur versement.", "error"); }
    state.isSpinning = false; 
    ui.forceCloseModal(); // Fermeture forcée
    render();
};

const showSecureScreenshotModal = (reward) => {
    ui.showModal({
        title: "RÉCOMPENSE D'EXCEPTION",
        isClosable: false, // MODAL NON FERMABLE SANS VALIDATION
        content: `
            <div class="text-center">
                <div class="text-7xl mb-6">🏆</div>
                <div class="text-3xl font-black uppercase italic" style="color: ${reward.color}">${reward.label}</div>
                <div class="bg-red-500/10 border border-red-500/20 p-5 rounded-2xl mt-8">
                    <p class="text-[11px] text-red-400 font-bold uppercase">PRENEZ UN SCREENSHOT COMPLET ET OUVREZ UN TICKET DISCORD POUR RÉCLAMER.</p>
                </div>
            </div>
        `,
        confirmText: "J'AI SCREENSHOT (FERMER)", 
        onConfirm: () => { state.isSpinning = false; render(); },
        type: 'warning'
    });
};

export const openWheel = () => { state.currentView = 'wheel'; state.isSpinning = false; state.currentWheelItems = Array(20).fill(0).map(() => WHEEL_REWARDS[Math.floor(Math.random() * WHEEL_REWARDS.length)]); render(); };
export const closeWheel = () => { if (state.isSpinning) return; state.currentView = 'select'; render(); };
export const showProbabilities = () => {
    const totalWeight = WHEEL_REWARDS.reduce((acc, r) => acc + r.weight, 0);
    const sorted = [...WHEEL_REWARDS].sort((a,b) => b.weight - a.weight);
    ui.showModal({ title: "Algorithme de Probabilités", content: `<div class="bg-black/40 rounded-2xl border border-white/10 overflow-hidden max-h-96 overflow-y-auto">${sorted.map(r => `<div class="flex justify-between p-3 border-b border-white/5"><span class="text-xs font-bold text-white uppercase">${r.label}</span><span class="text-[10px] font-mono text-blue-400">${((r.weight/totalWeight)*100).toFixed(1)}%</span></div>`).join('')}</div>` });
};