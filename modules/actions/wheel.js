
import { state } from '../state.js';
import { render, router } from '../utils.js';
import { ui } from '../ui.js';
import { fetchBankData } from '../services.js';

export const WHEEL_REWARDS = [
    // ARGENT (83.5%)
    { label: '1 000 $', weight: 12, type: 'money', value: 1000, color: '#10b981' },
    { label: '5 000 $', weight: 10, type: 'money', value: 5000, color: '#059669' },
    { label: '7 500 $', weight: 8, type: 'money', value: 7500, color: '#10b981' },
    { label: '10 000 $', weight: 8, type: 'money', value: 10000, color: '#059669' },
    { label: '12 500 $', weight: 6, type: 'money', value: 12500, color: '#10b981' },
    { label: '15 000 $', weight: 6, type: 'money', value: 15000, color: '#059669' },
    { label: '20 000 $', weight: 6, type: 'money', value: 20000, color: '#10b981' },
    { label: '25 000 $', weight: 5, type: 'money', value: 25000, color: '#059669' },
    { label: '30 000 $', weight: 5, type: 'money', value: 30000, color: '#10b981' },
    { label: '40 000 $', weight: 4, type: 'money', value: 40000, color: '#059669' },
    { label: '50 000 $', weight: 4, type: 'money', value: 50000, color: '#10b981' },
    { label: '60 000 $', weight: 3, type: 'money', value: 60000, color: '#059669' },
    { label: '75 000 $', weight: 3, type: 'money', value: 75000, color: '#10b981' },
    { label: '100 000 $', weight: 3, type: 'money', value: 100000, color: '#059669' },
    { label: '150 000 $', weight: 2, type: 'money', value: 150000, color: '#047857' },
    { label: '200 000 $', weight: 2, type: 'money', value: 200000, color: '#064e3b' },
    { label: '300 000 $', weight: 1, type: 'money', value: 300000, color: '#065f46' },
    { label: '500 000 $', weight: 0.5, type: 'money', value: 500000, color: '#fbbf24' },
    
    // ROLES (15%)
    { label: 'VIP Bronze', weight: 5, type: 'role', color: '#cd7f32' },
    { label: 'VIP Argent', weight: 4, type: 'role', color: '#c0c0c0' },
    { label: 'VIP Or', weight: 3, type: 'role', color: '#ffd700' },
    { label: 'VIP Platine', weight: 2, type: 'role', color: '#e5e4e2' },
    { label: 'Rôle Légende', weight: 1, type: 'role', color: '#8b5cf6' },
    
    // AUTRE (1.5%)
    { label: '???', weight: 1.5, type: 'special', color: '#ef4444' }
];

export const spinWheel = async () => {
    if (state.isSpinning || state.user.whell_turn <= 0) return;
    
    state.isSpinning = true;
    render();

    // 1. Calcul du gagnant via tirage pondéré
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
    
    // 2. Animation de la roue
    const wheelElement = document.getElementById('fortune-wheel-inner');
    if (wheelElement) {
        const segments = WHEEL_REWARDS.length;
        const segmentAngle = 360 / segments;
        const baseSpins = 5; // Nombre de tours complets minimum
        const targetRotation = (baseSpins * 360) + (360 - (winnerIndex * segmentAngle));
        
        wheelElement.style.transition = 'transform 5s cubic-bezier(0.15, 0, 0.15, 1)';
        wheelElement.style.transform = `rotate(${targetRotation}deg)`;
    }

    // 3. Traitement du gain après l'animation
    setTimeout(async () => {
        // Déduction du tour
        const newTurns = state.user.whell_turn - 1;
        await state.supabase.from('profiles').update({ whell_turn: newTurns }).eq('id', state.user.id);
        state.user.whell_turn = newTurns;

        // Application des gains
        if (winner.type === 'money') {
            // On cherche un personnage pour créditer l'argent (priorité à l'actif)
            const targetCharId = state.activeCharacter?.id || state.characters?.[0]?.id;
            if (targetCharId) {
                const { data: bank } = await state.supabase.from('bank_accounts').select('bank_balance').eq('character_id', targetCharId).single();
                if (bank) {
                    await state.supabase.from('bank_accounts').update({ bank_balance: bank.bank_balance + winner.value }).eq('character_id', targetCharId);
                    await state.supabase.from('transactions').insert({
                        receiver_id: targetCharId,
                        amount: winner.value,
                        type: 'admin_adjustment',
                        description: 'Gain Roue de la Fortune'
                    });
                }
            }
            ui.showModal({
                title: "INCROYABLE !",
                content: `<div class="text-center"><div class="text-5xl mb-4">💰</div><p class="text-xl font-black text-emerald-400">+$ ${winner.value.toLocaleString()}</p><p class="text-gray-400 mt-2">L'argent a été transféré sur votre compte bancaire.</p></div>`,
                type: 'success'
            });
        } else {
            ui.showModal({
                title: "RÉCOMPENSE RARE !",
                content: `<div class="text-center"><div class="text-5xl mb-4">👑</div><p class="text-xl font-black text-purple-400">${winner.label}</p><p class="text-gray-400 mt-2">Félicitations ! Prenez un screenshot et contactez un administrateur sur Discord pour réclamer votre lot.</p></div>`,
                type: 'warning'
            });
        }

        state.isSpinning = false;
        render();
    }, 5500);
};

export const openWheel = () => {
    state.currentView = 'wheel';
    render();
};

export const closeWheel = () => {
    if (state.isSpinning) return;
    state.currentView = 'select';
    render();
};
