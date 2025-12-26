
export const state = {
    user: null, 
    accessToken: null,
    
    // LOADING STATUS
    loadingStatus: 'Initialisation...',

    // SECURE CONFIG FROM DB
    adminIds: [], // Populated from DB keys_data
    erlcKey: null, // Populated from DB keys_data
    devKey: null, // Populated from DB keys_data (Dev Access Code)
    gouvBank: 0,   // Trésorerie de l'État (Clé: gouv_bank)
    lastSalaryPayment: null, // Date du dernier versement (Clé: last_salary_payment)
    
    // SAVINGS SYSTEM
    savingsRate: 1.5, // Taux par défaut (Clé: savings_rate)
    lastInterestPayment: null, // Date du dernier versement d'intérêts (Clé: last_interest_payment)

    // DYNAMIC ECONOMY CONFIG (Will be overwritten by keys_data)
    economyConfig: {
        tva_tax: 0,
        driver_stage_price: 0,
        driver_license_price: 0,
        create_item_ent_tax: 0
    },

    // UI Loading States
    isLoggingIn: false,
    isPanelLoading: false, 
    _completingDrugBatch: false, // VERROU SÉCURITÉ DROGUE
    
    // Configuration de l'assistant
    advisorMode: 'moderate', // 'liberal', 'moderate', 'strict'
    activeGovTab: 'dashboard', // 'dashboard', 'economy'

    // Notifications
    notifications: [],
    
    // Character Data
    characters: [],
    activeCharacter: null, 
    editingCharacter: null, 
    
    // Staff Data
    pendingApplications: [],
    allCharactersAdmin: [],
    staffMembers: [], 
    onDutyStaff: [], 
    lawyers: [], // Added for lawyers list
    discordStatuses: {}, // Map of Discord ID -> Status (online, idle, dnd, offline)
    
    // Game Session Data
    activeGameSession: null,
    sessionHistory: [],

    // Landing Page Data
    landingStaff: [],
    landingStats: {},
    
    // Stats & Monitoring
    serverStats: {
        totalMoney: 0,
        totalCash: 0,
        totalBank: 0,
        totalCoke: 0,
        totalWeed: 0,
        heistWinRate: 100
    },
    globalTransactions: [], // Staff Economy Log
    dailyEconomyStats: [], // Aggregated stats
    pendingHeistReviews: [], 
    
    // ERLC Server Data
    erlcData: {
        players: [],
        queue: [],
        maxPlayers: 42,
        currentPlayers: 0,
        joinKey: '?????',
        bans: [], 
        modCalls: [], 
        vehicles: [], 
        killLogs: [], 
        commandLogs: [] 
    },
    emergencyCalls: [], 
    policeReports: [], 
    
    // Search States
    staffSearchQuery: '', 
    staffPermissionSearchResults: [], 
    activePermissionUserId: null, 
    adminDbSort: { field: 'name', direction: 'asc' }, 
    erlcLogSearch: '', 
    vehicleSearchQuery: '', 
    activeStaffLogTab: 'commands', // commands, kills, modcalls, players, vehicles
    
    // Gangs & Bounties
    gangCreation: {
        leaderQuery: '',
        coLeaderQuery: '',
        leaderResult: null, 
        coLeaderResult: null, 
        searchResults: [],
        draftName: '' 
    },
    editingGang: null, 

    // Enterprises Staff Management
    enterpriseCreation: {
        draftName: '',
        leaderQuery: '',
        coLeaderQuery: '',
        leaderResult: null,
        coLeaderResult: null,
        searchResults: []
    },
    editingEnterprise: null,

    // Modals & UI
    ui: {
        modal: { isOpen: false, type: null, data: null }, 
        toasts: [],
        sidebarOpen: false, // Mobile Sidebar State
        sidebarCollapsedSections: [] // Sections rétractées
    },

    economyModal: { 
        isOpen: false,
        targetId: null, 
        targetName: null,
        transactions: [] 
    },

    inventoryModal: {
        isOpen: false,
        targetId: null, 
        targetName: null,
        items: []
    },
    
    // Economy
    bankAccount: null,
    transactions: [],
    recipientList: [], 
    filteredRecipients: [], 
    selectedRecipient: null,
    activeBankTab: 'overview', 
    
    // Assets
    inventory: [],
    patrimonyTotal: 0,
    inventoryFilter: '', 
    idCardModalOpen: false, 
    activeDocumentType: 'id_card', // id_card, driver_license, credit_card
    idCardTarget: null,
    activeAssetsTab: 'overview', 
    invoices: [], // Player invoices
    
    // Illicit
    activeIllicitTab: 'dashboard', 
    activeHeistLobby: null, 
    heistMembers: [], 
    availableHeistLobbies: [], 
    blackMarketSearch: '', 
    drugLab: null, 
    
    // Gangs & Bounties
    gangs: [], 
    activeGang: null, 
    bounties: [],
    bountySearchQuery: '',
    bountyTarget: null,
    bountyWinnerSearch: {
        query: '',
        results: [],
        selected: null,
        bountyId: null
    },
    
    // Enterprises
    activeEnterpriseTab: 'market', // market, my_companies, manage, appointments
    activeEnterpriseManageTab: 'dashboard', // dashboard, staff, stock, appointments
    enterprises: [],
    myEnterprises: [], // Companies I am part of
    enterpriseMarket: [], // Items for sale (public)
    topSellers: [], // Best selling items
    pendingEnterpriseItems: [], // Staff moderation
    activeEnterpriseManagement: null, // The specific company being managed in UI
    marketEnterpriseFilter: 'all', // Filter for market view
    clientAppointments: [], // Appointments where I am the client
    
    // Enterprise Item Creation
    iconPickerOpen: false,
    selectedCreateIcon: 'package',
    iconSearchQuery: '',

    // Services Publics
    activeServicesTab: 'directory', 
    filteredStreets: [], 
    servicesSearchQuery: '', 
    reportsSearchQuery: '', 
    reportSuspects: [],
    editingReport: null, 
    criminalRecordTarget: null, 
    criminalRecordReports: [],
    policeSearchTarget: null,
    dossierTarget: null, 
    
    // Global News
    globalActiveHeists: [], 
    
    // App Navigation
    currentView: 'login', 
    activeHubPanel: 'main', 
    activeStaffTab: 'citizens', 
    activeEconomySubTab: 'players', 
    alignmentModalShown: false, 
    
    supabase: null,
    queueCount: 0
};
