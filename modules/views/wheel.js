import { state } from '../state.js';
import { WHEEL_REWARDS } from '../actions/wheel.js';

export const WheelView = () => {
    const turns = state.user.whell_turn || 0;
    const items = state.currentWheelItems || [];
    const isSpinning = state.isSpinning;

    const renderItems = () => {
        const displayItems = items.length < 50 ? [...items, ...items, ...items, ...items] : items;
        
        return displayItems.map(item => `
            <div class="w-[140px] md:w-[150px] h-[170px] md:h-[180px] shrink-0 bg-gradient-to-b from-[#1a1a1c] to-black rounded-2xl border-b-4 flex flex-col items-center justify-center p-3 md:p-4 shadow-2xl transition-all" style="border-color: ${item.color}">
                <div class="w-12 h-12 md:w-16 md:h-16 rounded-2xl mb-3 md:mb-4 flex items-center justify-center shadow-inner" style="background-color: ${item.color}20">
                    <i data-lucide="${item.type === 'money' ? 'banknote' : item.type === 'role' ? 'crown' : 'star'}" class="w-6 md:w-8 h-6 md:h-8" style="color: ${item.color}"></i>
                </div>
                <div class="text-[9px] md:text-[10px] font-black text-white uppercase text-center leading-tight tracking-tighter">${item.label}</div>
                <div class="text-[6px] md:text-[7px] text-gray-500 font-bold uppercase mt-2 tracking-widest">${item.rarity}</div>
            </div>
        `).join('');
    };

    const stripStyle = isSpinning 
        ? `transform: translateX(0);` 
        : `margin-left: calc(50% - 70px); transform: translateX(0); transition: none;`;

    return `
    <div class="fixed inset-0 z-[500] bg-[#050505] flex flex-col items-center justify-center p-4 md:p-8 animate-fade-in overflow-hidden">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(59,130,246,0.08),transparent_70%)]"></div>
        <div class="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>

        <div class="relative w-full max-w-6xl flex flex-col items-center scale-90 md:scale-100 transition-transform">
            
            <!-- HEADER -->
            <div class="mb-8 md:mb-12 text-center relative z-10 px-4">
                <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 text-blue-500 text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] border border-blue-500/20 mb-4 animate-pulse">
                    Loterie Nationale Los Angeles
                </div>
                <h2 class="text-4xl md:text-6xl font-black text-white uppercase italic tracking-tighter drop-shadow-2xl">TFRP <span class="text-blue-500">LOOTBOX</span></h2>
                
                <div class="mt-6 md:mt-8 flex items-center justify-center gap-3 md:gap-4">
                    <div class="bg-white/5 border border-white/10 px-6 md:px-8 py-2.5 md:py-3 rounded-[20px] md:rounded-[24px] backdrop-blur-xl flex items-center gap-3 md:gap-4 shadow-2xl">
                        <div class="text-left">
                            <div class="text-[8px] md:text-[9px] text-gray-500 font-black uppercase tracking-widest mb-0.5">Jetons</div>
                            <div class="text-2xl md:text-3xl font-mono font-black text-yellow-400">${turns}</div>
                        </div>
                        <i data-lucide="key" class="w-5 md:w-6 h-5 md:h-6 text-yellow-500/50"></i>
                    </div>
                    <button onclick="actions.showProbabilities()" class="p-3 md:p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all shadow-xl group">
                        <i data-lucide="info" class="w-5 md:w-6 h-5 md:h-6 group-hover:scale-110 transition-transform"></i>
                    </button>
                </div>
            </div>

            <!-- SLIDER CONTAINER -->
            <div class="relative w-full h-[220px] md:h-[250px] flex items-center justify-center mb-10 md:mb-16 overflow-hidden">
                <!-- Pointeur Central -->
                <div class="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 md:w-1 bg-blue-500 z-[100] shadow-[0_0_20px_rgba(59,130,246,0.8)]">
                    <div class="absolute -top-2 left-1/2 -translate-x-1/2 w-4 md:w-6 h-4 md:h-6 bg-blue-500 rotate-45 shadow-lg border-2 border-white/20"></div>
                    <div class="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 md:w-6 h-4 md:h-6 bg-blue-500 rotate-45 shadow-lg border-2 border-white/20"></div>
                </div>

                <div class="absolute inset-y-0 left-0 w-20 md:w-64 bg-gradient-to-r from-[#050505] to-transparent z-20 pointer-events-none"></div>
                <div class="absolute inset-y-0 right-0 w-20 md:w-64 bg-gradient-to-l from-[#050505] to-transparent z-20 pointer-events-none"></div>

                <div class="w-full h-full border-y border-white/5 bg-black/40 flex items-center">
                    <div id="case-strip" 
                         class="flex gap-[8px] md:gap-[10px] ${!isSpinning && items.length < 50 ? 'animate-lootbox-idle' : ''}" 
                         style="${stripStyle}">
                        ${renderItems()}
                    </div>
                </div>
            </div>

            <!-- ACTIONS -->
            <div class="flex flex-col items-center gap-6 md:gap-8 relative z-10 w-full px-6">
                <button onclick="actions.spinWheel()" 
                    ${isSpinning || turns <= 0 ? 'disabled' : ''}
                    class="w-full md:w-auto h-20 md:h-24 px-12 md:px-24 rounded-[28px] md:rounded-[32px] font-black text-xl md:text-2xl uppercase italic tracking-widest transition-all transform active:scale-95 shadow-2xl
                    ${isSpinning || turns <= 0 ? 'bg-white/5 text-gray-700 cursor-not-allowed border border-white/5' : 'bg-white text-black hover:bg-blue-600 hover:text-white shadow-blue-900/40'}">
                    ${isSpinning ? 'DÉCRYPTAGE...' : 'OUVRIR LA CAISSE'}
                </button>
                
                ${!isSpinning ? `
                    <button onclick="actions.closeWheel()" 
                        class="px-8 md:px-10 py-3 rounded-2xl bg-white/5 border border-white/5 text-[9px] md:text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] hover:text-white hover:bg-white/10 transition-all flex items-center gap-3">
                        <i data-lucide="arrow-left" class="w-4 h-4"></i>
                        Retour
                    </button>
                ` : ''}
            </div>
        </div>

        <div class="fixed bottom-6 left-6 md:bottom-10 md:left-10 opacity-30 flex items-center gap-4 hidden sm:flex">
            <i data-lucide="shield-check" class="w-6 h-6 text-blue-500"></i>
            <div class="text-[8px] md:text-[9px] text-gray-500 font-mono uppercase tracking-[0.3em] leading-relaxed">
                Algorithme Certifié v5.2.0<br>
                Protection anti-screenshot active
            </div>
        </div>
    </div>
    `;
};