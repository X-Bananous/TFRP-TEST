
import { state } from '../state.js';
import { render, router } from '../utils.js';
import { ui } from '../ui.js';

export const SLOT_WIDTH = 160; // 150px item + 10px gap

export const WHEEL_REWARDS = [
    { label: '1 000 $', weight: 12, type: 'money', value: 1000, color: '#10b981', rarity: 'Commun' },
    { label: '5 000 $', weight: 10, type: 'money', value: 5000, color: '#10b981', rarity: 'Commun' },
    { label: '7 500 $', weight: 8, type: 'money', value: 7500, color: '#10b981', rarity: 'Commun' },
    { label: '10 000 $', weight: 8, type: 'money', value: 10000, color: '#10b981', rarity: 'Commun' },
    { label: '15 000 $', weight: 6, type: 'money', value: 15000, color: '#059669', rarity: 'Peu Commun' },
    { label: '25 000 $', weight: 5, type: 'money', value: 25000, color: '#059669', rarity: 'Peu Commun' },
    { label: '50 000 $', weight: 4, type: 'money', value: 50000, color: '#3b82f6', rarity: 'Rare' },
    { label: '100 000 $', weight: 3, type: 'money', value: 100000, color: '#3b82f6', rarity: 'Rare' },
    { label: '250 000 $', weight: 2, type: 'money', value: 250000, color: '#8b5cf6', rarity: 'Mythique' },
    { label: '500 000 $', weight: 0.5, type: 'money', value: 500000, color: '#fbbf24', rarity: 'Légendaire' },
    { label: 'VIP Bronze', weight: 5, type: 'role', color: '#cd7f32', rarity: 'Rare' },
    { label: 'VIP Argent', weight: 4, type: 'role', color: '#c0c0c0', rarity: 'Mythique' },
    { label: 'VIP Or', weight: 3, type: 'role', color: '#ffd700', rarity: 'Légendaire' },
    { label: 'Rôle Légende', weight: 1, type: 'role', color: '#ef4444', rarity: 'Ancien' },
    { label: 'VÉHICULE UNIQUE', weight: 1.5, type: 'special', color: '#f472b6', rarity: 'Immortel' }
];

export const spinWheel = async () => {
    if (state.isSpinning || (state.user.whell_turn || 0) <= 0) return;
    
    state.isSpinning = true;
    
    // 1. Calcul du gagnant (Weighted Random)
    const totalWeight = WHEEL_REWARDS.reduce((acc, r) => acc + r.weight, 0);
    let random = Math.random() * totalWeight;
    let winner = WHEEL_REWARDS[0];
    for (const reward of WHEEL_REWARDS) {
        random -= reward.weight;
        if (random <= 0) {
            winner = reward;
            break;
        }
    }

    // 2. Préparer le ruban (80 items)
    const stripItems = [];
    for (let i = 0; i < 80; i++) {
        if (i === 70) stripItems.push(winner); // On place le gagnant à l'index 70
        else stripItems.push(WHEEL_REWARDS[Math.floor(Math.random() * WHEEL_REWARDS.length)]);
    }
    state.currentWheelItems = stripItems;
    
    // Forcer le rendu avant l'animation
    render();

    // Attendre que le DOM soit prêt
    requestAnimationFrame(() => {
        setTimeout(() => {
            const strip = document.getElementById('case-strip');
            if (strip) {
                // Calcul de la position : index * 160 (largeur slot) 
                // Le conteneur fait pointer au milieu, donc on décale de (70 * 160)
                // On ajoute un petit offset aléatoire pour ne pas tomber pile au milieu de la case
                const randomOffset = Math.floor(Math.random() * 100) - 50; 
                const targetX = (70 * SLOT_WIDTH) + randomOffset;
                
                strip.style.transition = 'transform 7s cubic-bezier(0.1, 0, 0.05, 1)';
                strip.style.transform = `translateX(-${targetX}px)`;
            }
        }, 100);
    });

    // 3. Finalisation après 7.5s
    setTimeout(async () => {
        const newTurns = (state.user.whell_turn || 0) - 1;
        await state.supabase.from('profiles').update({ whell_turn: newTurns }).eq('id', state.user.id);
        state.user.whell_turn = newTurns;

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
                content: `<div class="text-center"><div class="text-6xl mb-4">💵</div><p class="text-2xl font-black text-emerald-400">+$ ${winner.value.toLocaleString()}</p><p class="text-gray-400 mt-2 italic">Fonds transférés sur votre compte.</p></div>`,
                type: 'success'
            });
        } else {
            ui.showModal({
                title: "ITEM EXCEPTIONNEL !",
                content: `<div class="text-center"><div class="text-6xl mb-4">🎁</div><p class="text-2xl font-black text-purple-400">${winner.label}</p><p class="text-gray-400 mt-2 italic">Félicitations ! Contactez un administrateur avec un screenshot.</p></div>`,
                type: 'warning'
            });
        }

        state.isSpinning = false;
        // On réinitialise la position du ruban pour le prochain tour
        state.currentWheelItems = [];
        render();
    }, 7800);
};

export const openWheel = () => {
    state.currentView = 'wheel';
    // On pré-remplit avec des items aléatoires pour l'esthétique initiale
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
    const sorted = [...WHEEL_REWARDS].sort((a, b) => b.weight - a.weight);
    
    const rows = sorted.map(r => {
        const prob = ((r.weight / totalWeight) * 100).toFixed(2);
        return `
            <div class="flex justify-between items-center p-3 border-b border-white/5 hover:bg-white/5 transition-colors">
                <div class="flex items-center gap-3">
                    <div class="w-2 h-2 rounded-full" style="background-color: ${r.color}"></div>
                    <span class="text-xs font-bold text-white uppercase">${r.label}</span>
                </div>
                <div class="text-right">
                    <div class="text-[10px] font-mono font-black text-blue-400">${prob}%</div>
                    <div class="text-[7px] text-gray-600 uppercase font-black tracking-widest">${r.rarity}</div>
                </div>
            </div>
        `;
    }).join('');

    ui.showModal({
        title: "Table des Probabilités",
        content: `
            <div class="bg-black/40 rounded-2xl border border-white/10 overflow-hidden max-h-96 overflow-y-auto custom-scrollbar">
                <div class="p-3 bg-white/5 border-b border-white/10 flex justify-between text-[9px] font-black text-gray-500 uppercase tracking-widest">
                    <span>Récompense</span>
                    <span>Chances de gain</span>
                </div>
                ${rows}
            </div>
            <p class="mt-4 text-[9px] text-gray-500 italic text-center uppercase tracking-widest">Algorithme de tirage pondéré certifié v4.6</p>
        `
    });
};
