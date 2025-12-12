
// ... (Previous code remains unchanged until claimAdventReward) ...

// ... (Rest of file including advent calendar etc.) ...
export const claimAdventReward = async (targetDay) => {
    // FORCE FRENCH TIME
    const parisTime = new Date().toLocaleString("en-US", {timeZone: "Europe/Paris"});
    const today = new Date(parisTime);
    const currentDay = today.getDate();
    
    // For testing/demo purposes, we allow forcing date, but normal logic applies
    // To strictly follow logic:
    // const month = today.getMonth() + 1; // Dec = 12
    // if (month !== 12) return showToast("Ce n'est pas Noël !", 'error');
    
    // START DATE CHANGED TO 12
    if (targetDay < 12 || targetDay > 25) {
        showToast("Date invalide (12-25 Décembre).", 'error');
        return;
    }

    // Cooldown/Date check
    // If targetDay > currentDay, it means it's in the future
    if (targetDay > currentDay) {
        showToast("Patience ! Cette case est verrouillée.", 'error');
        return;
    }

    // Check if already claimed
    const claimedDays = state.user.advent_calendar || [];
    if (claimedDays.includes(targetDay)) {
        showToast("Vous avez déjà ouvert cette case.", 'warning');
        return;
    }

    // Calculate Reward
    // 12th -> 1000, 13th -> 2000 ... 
    const reward = (targetDay - 11) * 1000; 
    let extraItemMessage = "";
    const charId = state.activeCharacter.id;

    // EXTRA ITEMS LOGIC
    if (targetDay === 16) {
        await state.supabase.from('inventory').insert({
            character_id: charId,
            name: "Traineau de 2025",
            quantity: 1,
            estimated_value: 1000
        });
        extraItemMessage = `<br><span class="text-yellow-400 font-bold text-sm">+ Objet Spécial: Traineau de 2025</span>`;
    }

    // Update DB
    const newClaimed = [...claimedDays, targetDay];
    const { error } = await state.supabase.from('profiles').update({ advent_calendar: newClaimed }).eq('id', state.user.id);
    
    if (error) {
        showToast("Erreur de sauvegarde.", 'error');
        return;
    }

    // Give Money (Bank)
    const { data: bank } = await state.supabase.from('bank_accounts').select('bank_balance').eq('character_id', charId).single();
    await state.supabase.from('bank_accounts').update({ bank_balance: (bank.bank_balance || 0) + reward }).eq('character_id', charId);
    await state.supabase.from('transactions').insert({ sender_id: null, receiver_id: charId, amount: reward, type: 'deposit', description: `Calendrier Avent (Jour ${targetDay})` });

    // Update State
    state.user.advent_calendar = newClaimed;
    await fetchBankData(charId); // Refresh UI
    
    showModal({
        title: `🎁 Case du ${targetDay} Décembre`,
        content: `
            <div class="text-center">
                <div class="text-4xl mb-4">🎄</div>
                <div class="text-xl font-bold text-white mb-2">Joyeux Noël !</div>
                <p class="text-gray-300">Vous avez reçu un virement de <span class="text-emerald-400 font-bold">$${reward.toLocaleString()}</span>.${extraItemMessage}</p>
            </div>
        `,
        confirmText: "Merci !"
    });
    
    render();
};

// ... (Rest of functions fetchBankData, fetchInventory, etc. remain unchanged) ...
export const fetchBankData = async (charId) => {
    let { data: bank, error } = await state.supabase
        .from('bank_accounts')
        .select('*')
        .eq('character_id', charId)
        .maybeSingle(); 
    
    if (!bank) {
        const { data: newBank } = await state.supabase.from('bank_accounts').insert([{ character_id: charId, bank_balance: 5000, cash_balance: 500 }]).select().single();
        bank = newBank;
    }
    state.bankAccount = bank;

    const { data: txs } = await state.supabase
        .from('transactions')
        .select('*')
        .or(`sender_id.eq.${charId},receiver_id.eq.${charId}`)
        .order('created_at', { ascending: false })
        .limit(20);
    state.transactions = txs || [];

    const { data: recipients } = await state.supabase
        .from('characters')
        .select('id, first_name, last_name')
        .eq('status', 'accepted')
        .neq('id', charId);
    state.recipientList = recipients || [];
};

export const fetchInventory = async (charId) => {
    if (!state.supabase) return;
    await fetchBankData(charId);
    const { data: items, error } = await state.supabase
        .from('inventory')
        .select('*')
        .eq('character_id', charId);
    state.inventory = items || [];

    // Check for required virtual items and inject them if missing
    const requiredVirtualItems = [
        { id: 'virtual-id-card', name: "Carte d'Identité", icon: 'id-card' },
        { id: 'virtual-credit-card', name: "Carte Bancaire", icon: 'credit-card' },
        { id: 'virtual-license', name: "Permis de Conduire", icon: 'car' }
    ];

    requiredVirtualItems.forEach(vItem => {
        const exists = state.inventory.some(i => i.name === vItem.name);
        if (!exists) {
            state.inventory.unshift({ 
                id: vItem.id, 
                name: vItem.name, 
                quantity: 1, 
                estimated_value: 0, 
                is_virtual: true,
                icon: vItem.icon 
            });
        }
    });

    let total = (state.bankAccount.bank_balance || 0) + (state.bankAccount.cash_balance || 0);
    state.inventory.forEach(item => { total += (item.quantity * item.estimated_value); });
    state.patrimonyTotal = total;
};

export const fetchDrugLab = async (charId) => {
    let { data: lab } = await state.supabase.from('drug_labs').select('*').eq('character_id', charId).maybeSingle();
    
    if (!lab) {
        const { data: newLab } = await state.supabase.from('drug_labs').insert([{ character_id: charId }]).select().single();
        lab = newLab;
    }
    state.drugLab = lab;
};

export const updateDrugLab = async (updates) => {
    if(!state.activeCharacter) return;
    await state.supabase.from('drug_labs').update(updates).eq('character_id', state.activeCharacter.id);
    await fetchDrugLab(state.activeCharacter.id);
};

export const fetchActiveHeistLobby = async (charId) => {
    const { data: membership } = await state.supabase.from('heist_members').select('lobby_id').eq('character_id', charId).maybeSingle();
    let lobbyId = membership ? membership.lobby_id : null;
    if (!lobbyId) {
        const { data: hosted } = await state.supabase.from('heist_lobbies').select('id').eq('host_id', charId).neq('status', 'finished').neq('status', 'failed').maybeSingle();
        if(hosted) lobbyId = hosted.id;
    }
    if (lobbyId) {
        const { data: lobby } = await state.supabase.from('heist_lobbies').select('*, characters(first_name, last_name)').eq('id', lobbyId).maybeSingle();
        if (!lobby) { state.activeHeistLobby = null; state.heistMembers = []; await fetchAvailableLobbies(charId); return; }
        if (lobby.characters) { const host = Array.isArray(lobby.characters) ? lobby.characters[0] : lobby.characters; lobby.host_name = host ? `${host.first_name} ${host.last_name}` : 'Inconnu'; } else { lobby.host_name = 'Inconnu'; }
        const { data: members } = await state.supabase.from('heist_members').select('*, characters(first_name, last_name)').eq('lobby_id', lobbyId);
        state.activeHeistLobby = lobby; state.heistMembers = members;
    } else { state.activeHeistLobby = null; state.heistMembers = []; await fetchAvailableLobbies(charId); }
};

export const fetchAvailableLobbies = async (charId) => {
    const { data: lobbies } = await state.supabase.from('heist_lobbies').select('*, characters(first_name, last_name)').in('status', ['setup', 'active']).neq('host_id', charId);
    state.availableHeistLobbies = (lobbies || []).map(l => { const host = Array.isArray(l.characters) ? l.characters[0] : l.characters; return { ...l, host_name: host ? `${host.first_name} ${host.last_name}` : 'Inconnu' }; });
};

export const createHeistLobby = async (heistId, location = null, accessType = 'private') => {
    const { data, error } = await state.supabase.from('heist_lobbies').insert({ host_id: state.activeCharacter.id, heist_type: heistId, status: 'setup', location: location, access_type: accessType }).select().single();
    if(error) { showToast("Erreur création lobby: " + error.message, 'error'); return; }
    await state.supabase.from('heist_members').insert({ lobby_id: data.id, character_id: state.activeCharacter.id, status: 'accepted' });
    await fetchActiveHeistLobby(state.activeCharacter.id);
};

export const inviteToLobby = async (targetId) => {
    if(!state.activeHeistLobby) return;
    const existing = state.heistMembers.find(m => m.character_id === targetId);
    if(existing) return showToast("Déjà dans l'équipe", 'warning');
    await state.supabase.from('heist_members').insert({ lobby_id: state.activeHeistLobby.id, character_id: targetId, status: 'pending' });
};

export const joinLobbyRequest = async (lobbyId) => {
    const charId = state.activeCharacter.id;
    const { data: existing } = await state.supabase.from('heist_members').select('*').eq('character_id', charId).eq('lobby_id', lobbyId).maybeSingle();
    if (existing) { showToast("Vous avez déjà demandé à rejoindre.", 'warning'); return; }
    const { data: lobby } = await state.supabase.from('heist_lobbies').select('access_type').eq('id', lobbyId).single();
    const status = (lobby && lobby.access_type === 'open') ? 'accepted' : 'pending';
    await state.supabase.from('heist_members').insert({ lobby_id: lobbyId, character_id: charId, status: status });
    if (status === 'accepted') { showToast("Vous avez rejoint l'équipe (Accès Libre).", 'success'); } else { showToast("Demande envoyée au chef d'équipe.", 'info'); }
    await fetchActiveHeistLobby(charId);
};

export const acceptLobbyMember = async (targetCharId) => {
    if(!state.activeHeistLobby) return;
    await state.supabase.from('heist_members').update({ status: 'accepted' }).eq('lobby_id', state.activeHeistLobby.id).eq('character_id', targetCharId);
    await fetchActiveHeistLobby(state.activeCharacter.id);
};

export const startHeistSync = async (durationSeconds) => {
    if(!state.activeHeistLobby) return;
    const now = Date.now();
    const endTime = now + (durationSeconds * 1000);
    const { error } = await state.supabase.from('heist_lobbies').update({ status: 'active', start_time: now, end_time: endTime }).eq('id', state.activeHeistLobby.id);
    if(error) showToast("Erreur lancement", 'error');
    await fetchActiveHeistLobby(state.activeCharacter.id);
};
