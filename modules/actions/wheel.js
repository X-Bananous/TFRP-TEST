
import { state } from '../state.js';
import { render, router } from '../utils.js';
import { ui } from '../ui.js';

export const SLOT_WIDTH = 160; // 150px + 10px gap

// RÉCOMPENSES OFFICIELLES TFRP
export const WHEEL_REWARDS = [
    // 💰 Argent (Total 83.5%)
    { label: '1 000 $', weight: 12, type: 'money', value: 1000, color: '#10b981', rarity: 'Commun' },
    { label: '5 000 $', weight: 10, type: 'money', value: 5000, color: '#10b981', rarity: 'Commun' },
    { label: '7 500 $', weight: 8, type: 'money', value: 7500, color: '#10b981', rarity: 'Commun' },
    { label: '10 000 $', weight: 8, type: 'money', value: 10000, color: '#10b981', rarity: 'Commun' },
    { label: '12 500 $', weight: 6, type: 'money', value: 12500, color: '#10b981', rarity: 'Peu Commun' },
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
    // Sécurité: Pas de tour ou déjà en cours
    if (state.isSpinning || (state.user.whell_turn || 0) <= 0) {
        if (!state.isSpinning) ui.showToast("Aucun tour disponible.", "error");
        return;
    }

    state.isSpinning = true;

    // 1. Calcul du gagnant via Tirage Pondéré
    const totalWeight = WHEEL_REWARDS.reduce((acc, r) => acc + r.weight, 0);
    let randomVal = Math.random() * totalWeight;
    let winner = WHEEL_REWARDS[0];
    
    for (const reward of WHEEL_REWARDS) {
        randomVal -= reward.weight;
        if (randomVal <= 0) {
            winner = reward;
            break;
        }
    }

    // 2. Générer le ruban (80 items)
    const stripItems = [];
    for (let i = 0; i < 80; i++) {
        if (i === 70) {
            stripItems.push(winner);
        } else {
            stripItems.push(WHEEL_REWARDS[Math.floor(Math.random() * WHEEL_REWARDS.length)]);
        }
    }
    state.currentWheelItems = stripItems;
    render();

    // 3. Animation du ruban
    setTimeout(() => {
        const strip = document.getElementById('case-strip');
        if (strip) {
            // Positionnement précis : Index 70 * 160px
            // On ajoute un décalage pour s'arrêter aléatoirement dans la case (pas pile au centre)
            const randomInCaseOffset = Math.floor(Math.random() * 80) - 40; 
            const targetX = (70 * SLOT_WIDTH) + randomInCaseOffset;

            strip.style.transition = 'transform 7s cubic-bezier(0.1, 0, 0.05, 1)';
            strip.style.transform = `translateX(-${targetX}px)`;
        }
    }, 100);

    // 4. Traitement du gain après l'animation (7.5s pour laisser finir)
    setTimeout(async () => {
        const newTurns = (state.user.whell_turn || 0) - 1;
        
        // Mise à jour DB
        await state.supabase.from('profiles').update({ whell_turn: newTurns }).eq('id', state.user.id);
        state.user.whell_turn = newTurns;

        // Application des récompenses
        if (winner.type === 'money') {
            const targetCharId = state.activeCharacter?.id || state.characters?.[0]?.id;
            if (targetCharId) {
                const { data: bank } = await state.supabase.from('bank_accounts').select('bank_balance').eq('character_id', targetCharId).single();
                if (bank) {
                    const newBal = (bank.bank_balance || 0) + winner.value;
                    await state.supabase.from('bank_accounts').update({ bank_balance: newBal }).eq('character_id', targetCharId);
                    await state.supabase.from('transactions').insert({
                        receiver_id: targetCharId, amount: winner.value, type: 'admin_adjustment', description: 'Gain Lootbox National'
                    });
                }
            }
            ui.showModal({
                title: "DÉPÔT EFFECTUÉ",
                content: `<div class="text-center"><div class="text-6xl mb-6">💰</div><p class="text-2xl font-black text-emerald-400">+$ ${winner.value.toLocaleString()}</p><p class="text-gray-400 mt-2 italic font-medium">Virement reçu sur votre compte bancaire.</p></div>`,
                type: 'success'
            });
        } else {
            ui.showModal({
                title: "RÉCOMPENSE DÉBLOQUÉE",
                content: `<div class="text-center"><div class="text-6xl mb-6">🏆</div><p class="text-2xl font-black text-purple-400">${winner.label}</p><p class="text-gray-400 mt-2 italic">Félicitations ! Prenez une capture d'écran et contactez un administrateur.</p></div>`,
                type: 'warning'
            });
        }

        state.isSpinning = false;
        // On ne reset pas immédiatement stripItems pour laisser l'item gagnant visible
        render();
    }, 7500);
};

export const openWheel = () => {
    state.currentView = 'wheel';
    // Pré-remplissage pour l'esthétique à l'ouverture
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
    const sortedRewards = [...WHEEL_REWARDS].sort((a, b) => b.weight - a.weight);

    const rows = sortedRewards.map(r => `
        <div class="flex justify-between items-center p-3 border-b border-white/5 hover:bg-white/5 transition-colors">
            <div class="flex items-center gap-3">
                <div class="w-2 h-2 rounded-full" style="background-color: ${r.color}"></div>
                <span class="text-xs font-bold text-white uppercase">${r.label}</span>
            </div>
            <div class="text-right">
                <div class="text-[10px] font-mono font-black text-blue-400">${((r.weight / totalWeight) * 100).toFixed(1)}%</div>
                <div class="text-[7px] text-gray-600 uppercase font-black tracking-widest">${r.rarity}</div>
            </div>
        </div>
    `).join('');

    ui.showModal({
        title: "Table des Probabilités",
        content: `
            <div class="bg-black/40 rounded-2xl border border-white/10 overflow-hidden max-h-80 overflow-y-auto custom-scrollbar">
                <div class="p-3 bg-white/5 border-b border-white/10 flex justify-between text-[9px] font-black text-gray-500 uppercase tracking-widest">
                    <span>Récompense</span>
                    <span>Fréquence</span>
                </div>
                ${rows}
            </div>
            <p class="mt-4 text-[9px] text-gray-500 italic text-center uppercase tracking-widest">Calculateur de probabilités certifié v4.6</p>
        `
    });
};
