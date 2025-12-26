
import { state } from '../state.js';
import { render, router } from '../utils.js';
import { ui } from '../ui.js';

export const WHEEL_REWARDS = [
    // ARGENT (83.5%) - Rareté Basse (Vert)
    { label: '1 000 $', weight: 12, type: 'money', value: 1000, color: '#10b981', rarity: 'common' },
    { label: '5 000 $', weight: 10, type: 'money', value: 5000, color: '#10b981', rarity: 'common' },
    { label: '7 500 $', weight: 8, type: 'money', value: 7500, color: '#10b981', rarity: 'common' },
    { label: '10 000 $', weight: 8, type: 'money', value: 10000, color: '#10b981', rarity: 'common' },
    { label: '15 000 $', weight: 6, type: 'money', value: 15000, color: '#059669', rarity: 'uncommon' },
    { label: '25 000 $', weight: 5, type: 'money', value: 25000, color: '#059669', rarity: 'uncommon' },
    { label: '50 000 $', weight: 4, type: 'money', value: 50000, color: '#3b82f6', rarity: 'rare' },
    { label: '100 000 $', weight: 3, type: 'money', value: 100000, color: '#3b82f6', rarity: 'rare' },
    { label: '250 000 $', weight: 2, type: 'money', value: 250000, color: '#8b5cf6', rarity: 'mythical' },
    { label: '500 000 $', weight: 0.5, type: 'money', value: 500000, color: '#fbbf24', rarity: 'legendary' },
    
    // ROLES (15%) - Rareté Haute (Violet/Jaune)
    { label: 'VIP Bronze', weight: 5, type: 'role', color: '#cd7f32', rarity: 'rare' },
    { label: 'VIP Argent', weight: 4, type: 'role', color: '#c0c0c0', rarity: 'mythical' },
    { label: 'VIP Or', weight: 3, type: 'role', color: '#ffd700', rarity: 'legendary' },
    { label: 'Rôle Légende', weight: 1, type: 'role', color: '#ef4444', rarity: 'ancient' },
    
    // SPECIAL (1.5%)
    { label: 'VÉHICULE UNIQUE', weight: 1.5, type: 'special', color: '#f472b6', rarity: 'immortal' }
];

export const spinWheel = async () => {
    if (state.isSpinning || state.user.whell_turn <= 0) return;
    
    state.isSpinning = true;

    // 1. Déterminer le gagnant
    const totalWeight = WHEEL_REWARDS.reduce((acc, r) => acc + r.weight, 0);
    let random = Math.random() * totalWeight;
    let winnerIndex = 0;
    for (let i = 0; i < WHEEL_REWARDS.length; i++) {
        random -= WHEEL_REWARDS[i].weight;
        if (random <= 0) {
            winnerIndex = i;
            break;
        }
    }
    const winner = WHEEL_REWARDS[winnerIndex];

    // 2. Générer la liste d'items pour le défilement (80 items)
    const stripItems = [];
    for (let i = 0; i < 80; i++) {
        if (i === 75) {
            stripItems.push(winner); // Le 76ème item est le gagnant
        } else {
            stripItems.push(WHEEL_REWARDS[Math.floor(Math.random() * WHEEL_REWARDS.length)]);
        }
    }
    state.currentWheelItems = stripItems;
    render();

    // 3. Déclencher l'animation
    setTimeout(() => {
        const strip = document.getElementById('case-strip');
        if (strip) {
            const itemWidth = 160; // 150px + 10px gap
            const containerWidth = strip.parentElement.offsetWidth;
            const winningPosition = (75 * itemWidth) + (itemWidth / 2);
            const centerOffset = containerWidth / 2;
            
            // Randomisation légère de l'arrêt dans la case pour plus de réalisme
            const subOffset = (Math.random() * 100) - 50; 
            const finalX = winningPosition - centerOffset + subOffset;

            strip.style.transition = 'transform 7s cubic-bezier(0.15, 0, 0.05, 1)';
            strip.style.transform = `translateX(-${finalX}px)`;
        }
    }, 50);

    // 4. Finalisation
    setTimeout(async () => {
        // Déduction du tour
        const newTurns = state.user.whell_turn - 1;
        await state.supabase.from('profiles').update({ whell_turn: newTurns }).eq('id', state.user.id);
        state.user.whell_turn = newTurns;

        // Gains financiers automatiques
        if (winner.type === 'money') {
            const targetCharId = state.activeCharacter?.id || state.characters?.[0]?.id;
            if (targetCharId) {
                const { data: bank } = await state.supabase.from('bank_accounts').select('bank_balance').eq('character_id', targetCharId).single();
                if (bank) {
                    await state.supabase.from('bank_accounts').update({ bank_balance: bank.bank_balance + winner.value }).eq('character_id', targetCharId);
                    await state.supabase.from('transactions').insert({
                        receiver_id: targetCharId, amount: winner.value, type: 'admin_adjustment', description: 'Gain Caisse TFRP'
                    });
                }
            }
            ui.showModal({
                title: "RÉCOMPENSE DÉBLOQUÉE",
                content: `<div class="text-center"><div class="text-6xl mb-4">💵</div><p class="text-2xl font-black text-emerald-400">+$ ${winner.value.toLocaleString()}</p><p class="text-gray-400 mt-2 italic">Fonds transférés sur votre compte bancaire.</p></div>`,
                type: 'success'
            });
        } else {
            ui.showModal({
                title: "ITEM EXCEPTIONNEL !",
                content: `<div class="text-center"><div class="text-6xl mb-4">🎁</div><p class="text-2xl font-black text-purple-400">${winner.label}</p><p class="text-gray-400 mt-2">Félicitations ! Contactez un administrateur avec un screenshot pour réclamer votre lot.</p></div>`,
                type: 'warning'
            });
        }

        state.isSpinning = false;
        render();
    }, 7500);
};

export const openWheel = () => {
    state.currentView = 'wheel';
    state.currentWheelItems = []; // Reset
    render();
};

export const closeWheel = () => {
    if (state.isSpinning) return;
    state.currentView = 'select';
    render();
};
