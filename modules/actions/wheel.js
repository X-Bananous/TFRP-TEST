import { state } from '../state.js';
import { render, router } from '../utils.js';
import { ui } from '../ui.js';

export const SLOT_WIDTH = 160; // 150px + 10px gap

export const WHEEL_REWARDS = [
    // 💰 Argent (Total 83.5%)
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

    // 👑 Rôles (Total 15%)
    { label: 'VIP Bronze', weight: 5, type: 'role', color: '#cd7f32', rarity: 'Premium' },
    { label: 'VIP Argent', weight: 4, type: 'role', color: '#c0c0c0', rarity: 'Premium' },
    { label: 'VIP Or', weight: 3, type: 'role', color: '#ffd700', rarity: 'Premium' },
    { label: 'VIP Platine', weight: 2, type: 'role', color: '#e5e4e2', rarity: 'Elite' },
    { label: 'Rôle Légende', weight: 1, type: 'role', color: '#a855f7', rarity: 'Divin' },

    // ❓ Autre (Total 1.5%)
    { label: '???', weight: 1.5, type: 'special', color: '#f472b6', rarity: 'Unique' }
];

export const spinWheel = async () => {
    if (state.isSpinning || (state.user.whell_turn || 0) <= 0) return;
    
    if (state.characters.length === 0) {
        ui.showToast("Vous devez posséder un personnage.", "error");
        return;
    }

    state.isSpinning = true;

    // 1. Calcul du gagnant
    const totalWeight = WHEEL_REWARDS.reduce((acc, r) => acc + r.weight, 0);
    let randomVal = Math.random() * totalWeight;
    let winner = WHEEL_REWARDS[0];
    for (const reward of WHEEL_REWARDS) {
        randomVal -= reward.weight;
        if (randomVal <= 0) { winner = reward; break; }
    }

    // 2. Préparation du ruban (100 items)
    const stripItems = [];
    for (let i = 0; i < 100; i++) {
        if (i === 80) stripItems.push(winner);
        else stripItems.push(WHEEL_REWARDS[Math.floor(Math.random() * WHEEL_REWARDS.length)]);
    }
    state.currentWheelItems = stripItems;
    render();

    // 3. Lancer l'animation
    setTimeout(() => {
        const strip = document.getElementById('case-strip');
        if (strip) {
            strip.classList.remove('animate-lootbox-idle');
            // Offset pour centrer l'item 80 au pointeur
            const randomInCaseOffset = Math.floor(Math.random() * 80) - 40; 
            const targetX = (80 * SLOT_WIDTH) + randomInCaseOffset;
            strip.style.transition = 'transform 7s cubic-bezier(0.1, 0, 0.05, 1)';
            strip.style.transform = `translateX(-${targetX}px)`;
        }
    }, 100);

    // 4. Traitement du résultat
    setTimeout(async () => {
        const newTurns = (state.user.whell_turn || 0) - 1;
        await state.supabase.from('profiles').update({ whell_turn: newTurns }).eq('id', state.user.id);
        state.user.whell_turn = newTurns;

        if (winner.type === 'money') {
            showCharacterChoiceModal(winner);
        } else {
            showSecureScreenshotModal(winner);
        }

        state.isSpinning = false;
        render();
    }, 7600);
};

const showCharacterChoiceModal = (reward) => {
    const charsHtml = state.characters.map(c => `
        <button onclick="actions.claimMoneyReward(${reward.value}, '${c.id}')" 
            class="w-full p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-emerald-600/20 hover:border-emerald-500/50 transition-all text-left flex items-center justify-between group">
            <div>
                <div class="font-black text-white uppercase italic group-hover:text-emerald-400">${c.first_name} ${c.last_name}</div>
                <div class="text-[9px] text-gray-500 uppercase font-bold tracking-widest mt-1">Solde actuel : $${(c.bank_balance || 0).toLocaleString()}</div>
            </div>
            <i data-lucide="chevron-right" class="w-5 h-5 text-gray-700 group-hover:text-emerald-500"></i>
        </button>
    `).join('');

    ui.showModal({
        title: "CRÉDITER LE GAIN",
        content: `
            <div class="text-center mb-6">
                <div class="text-5xl mb-4">💰</div>
                <div class="text-2xl font-black text-emerald-400">+$ ${reward.value.toLocaleString()}</div>
                <p class="text-gray-400 text-xs mt-2 italic font-medium">Choisissez le bénéficiaire du virement immédiat :</p>
            </div>
            <div class="space-y-3 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                ${charsHtml}
            </div>
        `,
        confirmText: null
    });
};

export const claimMoneyReward = async (value, charId) => {
    const char = state.characters.find(c => c.id === charId);
    if (!char) return;

    try {
        const { data: bank } = await state.supabase.from('bank_accounts').select('bank_balance').eq('character_id', charId).single();
        if (bank) {
            await state.supabase.from('bank_accounts').update({ bank_balance: bank.bank_balance + value }).eq('character_id', charId);
            await state.supabase.from('transactions').insert({
                receiver_id: charId, amount: value, type: 'admin_adjustment', description: 'Gain Lootbox National'
            });
            ui.showToast(`$${value.toLocaleString()} crédités à ${char.first_name}.`, "success");
        }
    } catch(e) {
        ui.showToast("Erreur lors du virement bancaire.", "error");
    }
    ui.closeModal();
    render();
};

const showSecureScreenshotModal = (reward) => {
    let timeLeft = 15;
    
    ui.showModal({
        title: "LOT EXCEPTIONNEL DÉBLOQUÉ",
        content: `
            <div class="text-center">
                <div class="text-6xl mb-6 animate-bounce">🏆</div>
                <div class="text-3xl font-black uppercase italic tracking-tighter" style="color: ${reward.color}">${reward.label}</div>
                <div class="bg-red-500/10 border border-red-500/20 p-5 rounded-2xl mt-8">
                    <p class="text-[11px] text-red-400 font-bold uppercase leading-relaxed">
                        ACTION REQUISE : Prenez une capture d'écran complète incluant ce modal et votre identité Discord.<br>
                        Ouvrez un ticket "Lootbox" pour réclamer votre récompense.
                    </p>
                </div>
                <div class="mt-6 text-[10px] text-gray-600 font-mono uppercase tracking-widest flex items-center justify-center gap-2">
                    <i data-lucide="shield-alert" class="w-3 h-3"></i> Sécurité anti-fraude activée
                </div>
            </div>
        `,
        confirmText: `Attente (${timeLeft}s)`,
        onConfirm: null,
        type: 'warning'
    });

    const btn = document.getElementById('modal-confirm');
    if (btn) {
        btn.disabled = true;
        btn.classList.add('opacity-50', 'cursor-wait');
        
        const timer = setInterval(() => {
            timeLeft--;
            btn.textContent = `Attente (${timeLeft}s)`;
            
            if (timeLeft <= 0) {
                clearInterval(timer);
                btn.disabled = false;
                btn.textContent = "COMPRIS, J'AI SCREENSHOT";
                btn.classList.remove('opacity-50', 'cursor-wait');
            }
        }, 1000);
    }
};

export const openWheel = () => {
    state.currentView = 'wheel';
    // Pré-remplissage pour l'esthétique du défilement idle
    state.currentWheelItems = Array(20).fill(0).map(() => WHEEL_REWARDS[Math.floor(Math.random() * WHEEL_REWARDS.length)]);
    render();
};

export const closeWheel = () => {
    if (state.isSpinning) return;
    state.currentView = 'select';
    render();
};

export const showProbabilities = () => {
    const totalWeight = WHEEL_REWARDS.reduce((acc, r) => acc + r.weight, 0);
    const sorted = [...WHEEL_REWARDS].sort((a,b) => b.weight - a.weight);
    
    ui.showModal({
        title: "Tableau des Probabilités",
        content: `
            <div class="bg-black/40 rounded-2xl border border-white/10 overflow-hidden max-h-96 overflow-y-auto custom-scrollbar">
                <div class="p-3 bg-white/5 border-b border-white/10 flex justify-between text-[9px] font-black text-gray-500 uppercase tracking-widest">
                    <span>Récompense</span>
                    <span>Fréquence</span>
                </div>
                ${sorted.map(r => `
                    <div class="flex justify-between items-center p-3 border-b border-white/5 hover:bg-white/5 transition-colors">
                        <div class="flex items-center gap-3">
                            <div class="w-2 h-2 rounded-full" style="background-color: ${r.color}"></div>
                            <span class="text-xs font-bold text-white uppercase">${r.label}</span>
                        </div>
                        <div class="text-right">
                            <div class="text-[10px] font-mono text-blue-400 font-black">${((r.weight/totalWeight)*100).toFixed(1)}%</div>
                            <div class="text-[7px] text-gray-600 uppercase font-black tracking-widest">${r.rarity}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
            <p class="mt-4 text-[9px] text-gray-500 italic text-center uppercase tracking-widest font-bold">Algorithme de tirage pondéré certifié TFRP</p>
        `
    });
};