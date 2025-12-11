
import { state } from '../state.js';
import { render } from '../utils.js';
import { ui, toggleBtnLoading } from '../ui.js';
import * as services from '../services.js';
import { CONFIG } from '../config.js';

export const setEnterpriseTab = async (tab) => {
    state.activeEnterpriseTab = tab;
    state.isPanelLoading = true;
    render();
    try {
        if (tab === 'market') {
            await services.fetchEnterpriseMarket();
        } else if (tab === 'my_companies') {
            await services.fetchMyEnterprises(state.activeCharacter.id);
        } else if (tab === 'create') {
            // No fetch needed
        }
    } finally {
        state.isPanelLoading = false;
        render();
    }
};

export const createNewEnterprise = async (e) => {
    e.preventDefault();
    const btn = e.submitter;
    toggleBtnLoading(btn, true);

    const data = new FormData(e.target);
    const name = data.get('name');

    if (state.myEnterprises.length >= CONFIG.MAX_ENTERPRISES) {
        ui.showToast(`Limite atteinte (${CONFIG.MAX_ENTERPRISES} entreprises max).`, 'error');
        toggleBtnLoading(btn, false);
        return;
    }

    await services.createEnterprise(name, state.activeCharacter.id);
    
    // Refresh
    await services.fetchMyEnterprises(state.activeCharacter.id);
    state.activeEnterpriseTab = 'my_companies';
    render();
    toggleBtnLoading(btn, false);
};

export const openEnterpriseManagement = async (entId) => {
    state.isPanelLoading = true;
    render();
    await services.fetchEnterpriseDetails(entId);
    state.activeEnterpriseTab = 'manage'; // Special internal tab state
    state.isPanelLoading = false;
    render();
};

export const addItemToMarket = async (e) => {
    e.preventDefault();
    const btn = e.submitter;
    
    // Check permissions (Employee, Leader, Co-Leader)
    const rank = state.activeEnterpriseManagement?.myRank;
    if (!rank || rank === 'pending') return ui.showToast("Accès refusé.", 'error');

    toggleBtnLoading(btn, true);
    const data = new FormData(e.target);
    const name = data.get('name');
    const price = parseInt(data.get('price'));
    const quantity = parseInt(data.get('quantity'));
    const payment = data.get('payment_type');
    const description = data.get('description');

    await services.createEnterpriseItem(state.activeEnterpriseManagement.id, name, price, quantity, payment, description);
    
    // Refresh Details
    await services.fetchEnterpriseDetails(state.activeEnterpriseManagement.id);
    toggleBtnLoading(btn, false);
    render();
};

export const buyItem = async (itemId, price) => {
    ui.showModal({
        title: "Confirmer Achat",
        content: `Acheter cet article pour $${price.toLocaleString()} ?`,
        confirmText: "Payer",
        onConfirm: async () => {
            await services.buyEnterpriseItem(itemId);
        }
    });
};

export const quitEnterprise = async (entId) => {
    ui.showModal({
        title: "Démissionner",
        content: "Quitter cette entreprise ?",
        confirmText: "Quitter",
        type: "danger",
        onConfirm: async () => {
            await state.supabase.from('enterprise_members').delete()
                .eq('enterprise_id', entId)
                .eq('character_id', state.activeCharacter.id);
            
            ui.showToast("Vous avez quitté l'entreprise.", 'info');
            await services.fetchMyEnterprises(state.activeCharacter.id);
            state.activeEnterpriseTab = 'my_companies';
            render();
        }
    });
};

export const entDeposit = async (e) => {
    e.preventDefault();
    const amt = parseInt(new FormData(e.target).get('amount'));
    const ent = state.activeEnterpriseManagement;
    
    const { data: bank } = await state.supabase.from('bank_accounts').select('cash_balance').eq('character_id', state.activeCharacter.id).single();
    if(bank.cash_balance < amt) return ui.showToast("Liquide insuffisant.", 'error');

    // Transfer
    await state.supabase.from('bank_accounts').update({ cash_balance: bank.cash_balance - amt }).eq('character_id', state.activeCharacter.id);
    await state.supabase.from('enterprises').update({ balance: (ent.balance || 0) + amt }).eq('id', ent.id);
    
    ui.showToast(`Dépôt de $${amt} effectué.`, 'success');
    await services.fetchEnterpriseDetails(ent.id);
    render();
};

export const entWithdraw = async (e) => {
    e.preventDefault();
    const amt = parseInt(new FormData(e.target).get('amount'));
    const ent = state.activeEnterpriseManagement;
    
    // Only leaders
    if (ent.myRank !== 'leader') return ui.showToast("Réservé au patron.", 'error');
    if ((ent.balance || 0) < amt) return ui.showToast("Fonds insuffisants.", 'error');

    const { data: bank } = await state.supabase.from('bank_accounts').select('cash_balance').eq('character_id', state.activeCharacter.id).single();
    
    await state.supabase.from('enterprises').update({ balance: ent.balance - amt }).eq('id', ent.id);
    await state.supabase.from('bank_accounts').update({ cash_balance: bank.cash_balance + amt }).eq('character_id', state.activeCharacter.id);
    
    ui.showToast(`Retrait de $${amt} effectué.`, 'success');
    await services.fetchEnterpriseDetails(ent.id);
    render();
};
