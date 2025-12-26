import { state } from '../state.js';
import { render, router } from '../utils.js';
import { ui } from '../ui.js';

export const SLOT_WIDTH = 160; // 150px item + 10px gap

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
    if (state.isSpinning || (state.user.wheel_turn || 0) <= 0) return;
    
    if (state.characters.length === 0) {
        ui.showToast("Vous devez posséder au moins un personnage pour recevoir vos gains.", "error");
        return;
    }

    state.isSpinning = true;

    // 1. Calcul du gagnant via poids
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

    // 2. Préparation du ruban (100 items pour une longue rotation)
    const stripItems = [];
    for (let i = 0; i < 100; i++) {
        if (i === 80) stripItems.push(winner);
        else stripItems.push(WHEEL_REWARDS[Math.floor(Math.random() * WHEEL_REWARDS.length)]);
    }
    state.currentWheelItems = stripItems;
    render();

    // 3. Lancer l'animation précise
    setTimeout(() => {
        const strip = document.getElementById('case-strip');
        if (strip) {
            // Désactiver l'animation idle
            strip.classList.remove('animate-lootbox-idle');
            // Offset aléatoire pour ne pas tomber pile au milieu de la case à chaque fois
            const randomInCaseOffset = Math.floor(Math.random() * 60) - 30; 
            const targetX = (80 * SLOT_WIDTH) + randomInCaseOffset;
            strip.style.transition = 'transform 8s cubic-bezier(0.15, 0, 0.05, 1)';
            strip.style.transform = `translateX(-${targetX}px)`;
        }
    }, 50);

    // 4. Traitement du résultat après l'animation
    setTimeout(async () => {
        // Décompte du tour
        const newTurns = (state.user.wheel_turn || 0) - 1;
        await state.supabase.from('profiles').update({ wheel_turn: newTurns }).eq('id', state.user.id);
        state.user.wheel_turn = newTurns;

        // Dispatch selon le type de récompense
        if (winner.type === 'money') {
            showCharacterChoiceModal(winner);
        } else {
            showSecureScreenshotModal(winner);
        }

        state.isSpinning = false;
        render();
    }, 8500);
};

/**
 * Affiche le modal pour choisir sur quel personnage créditer l'argent
 */
const showCharacterChoiceModal = (reward) => {
    const charsHtml = state.characters.map(c => `
        <button onclick="actions.claimMoneyReward(${reward.value}, '${c.id}')" 
            class="w-full p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-emerald-600/20 hover:border-emerald-500/50 transition-all text-left flex items-center justify-between group">
            <div>
                <div class="font-black text-white uppercase italic group-hover:text-emerald-400">${c.first_name} ${c.last_name}</div>
                <div class="text-[9px] text-gray-500 uppercase font-bold tracking-widest mt-1">ID Citoyen : #${c.id.substring(0,8).toUpperCase()}</div>
            </div>
            <i data-lucide="chevron-right" class="w-5 h-5 text-gray-700 group-hover:text-emerald-500"></i>
        </button>
    `).join('');

    ui.showModal({
        title: "ATTRIBUER LE GAIN",
        content: `
            <div class="text-center mb-8">
                <div class="text-6xl mb-4">💰</div>
                <div class="text-3xl font-black text-emerald-400">+$ ${reward.value.toLocaleString()}</div>
                <p class="text-gray-400 text-xs mt-2 italic font-medium">Sélectionnez le bénéficiaire de ce virement immédiat :</p>
            </div>
            <div class="space-y-3 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                ${charsHtml}
            </div>
        `,
        confirmText: null // On force le clic sur un personnage
    });
};

/**
 * Action finale de crédit de l'argent en base de données
 */
export const claimMoneyReward = async (value, charId) => {
    const char = state.characters.find(c => c.id === charId);
    if (!char) return;

    try {
        const { data: bank } = await state.supabase.from('bank_accounts').select('bank_balance').eq('character_id', charId).single();
        if (bank) {
            // Mise à jour solde
            const newBalance = (bank.bank_balance || 0) + value;
            await state.supabase.from('bank_accounts').update({ bank_balance: newBalance }).eq('character_id', charId);
            
            // Enregistrement transaction
            await state.supabase.from('transactions').insert({
                receiver_id: charId, 
                amount: value, 
                type: 'admin_adjustment', 
                description: 'Gain Loterie Nationale TFRP'
            });

            ui.showToast(`$${value.toLocaleString()} ont été versés à ${char.first_name}.`, "success");
        }
    } catch(e) {
        console.error("Reward claim error:", e);
        ui.showToast("Erreur lors du virement bancaire.", "error");
    }
    ui.closeModal();
    render();
};

/**
 * Affiche le modal pour les lots spéciaux avec verrouillage de 15 secondes
 */
const showSecureScreenshotModal = (reward) => {
    let timeLeft = 15;
    
    ui.showModal({
        title: "RÉCOMPENSE D'EXCEPTION",
        content: `
            <div class="text-center">
                <div class="text-7xl mb-6 animate-bounce">🏆</div>
                <div class="text-3xl font-black uppercase italic tracking-tighter" style="color: ${reward.color}">${reward.label}</div>
                <div class="bg-red-500/10 border border-red-500/20 p-5 rounded-2xl mt-8">
                    <p class="text-[11px] text-red-400 font-bold uppercase leading-relaxed">
                        ACTION REQUISE : Prenez une capture d'écran complète incluant ce message et votre identité Discord.<br>
                        Ouvrez un ticket sur le serveur Discord pour réclamer votre lot.
                    </p>
                </div>
                <div class="mt-6 text-[10px] text-gray-600 font-mono uppercase tracking-widest flex items-center justify-center gap-2">
                    <i data-lucide="shield-alert" class="w-3 h-3"></i> Protection Anti-Fraude Active
                </div>
            </div>
        `,
        confirmText: `Attente de validation (${timeLeft}s)`,
        onConfirm: null,
        type: 'warning'
    });

    // On récupère le bouton de confirmation manuellement pour le gérer
    const btn = document.getElementById('modal-confirm');
    if (btn) {
        btn.disabled = true;
        btn.classList.add('opacity-50', 'cursor-wait');
        
        const timer = setInterval(() => {
            timeLeft--;
            btn.textContent = `Attente de validation (${timeLeft}s)`;
            
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
    // Remplissage initial pour l'effet de défilement "idle"
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
        title: "Algorithme de Probabilités",
        content: `
            <div class="bg-black/40 rounded-2xl border border-white/10 overflow-hidden max-h-96 overflow-y-auto custom-scrollbar">
                <div class="p-3 bg-white/5 border-b border-white/10 flex justify-between text-[9px] font-black text-gray-500 uppercase tracking-widest">
                    <span>Récompense potentielle</span>
                    <span>Taux de drop</span>
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
            <p class="mt-4 text-[9px] text-gray-500 italic text-center uppercase tracking-widest font-bold">Certification Système v4.6 • Tirage Aléatoire Pondéré</p>
        `
    });
};
