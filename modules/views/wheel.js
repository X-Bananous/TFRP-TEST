
import { state } from '../state.js';
import { WHEEL_REWARDS } from '../actions/wheel.js';

export const WheelView = () => {
    const turns = state.user.whell_turn || 0;
    const segments = WHEEL_REWARDS.length;
    const angleStep = 360 / segments;

    const renderSegments = () => {
        return WHEEL_REWARDS.map((r, i) => {
            const rotation = i * angleStep;
            return `
                <div class="wheel-segment absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1/2 origin-bottom flex flex-col items-center justify-start pt-4" style="transform: rotate(${rotation}deg); z-index: ${200-i};">
                    <div class="text-[8px] font-black text-white uppercase whitespace-nowrap tracking-tighter" style="text-shadow: 0 0 5px rgba(0,0,0,0.8); transform: rotate(90deg) translate(-20px, 0);">${r.label}</div>
                    <div class="w-8 h-8 rounded-full border-2 border-white/20 mt-1 shadow-2xl" style="background-color: ${r.color}"></div>
                </div>
            `;
        }).join('');
    };

    return `
    <div class="fixed inset-0 z-[500] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-8 animate-fade-in overflow-hidden">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(59,130,246,0.1),transparent_70%)]"></div>
        
        <div class="relative flex flex-col items-center max-w-2xl w-full">
            <div class="mb-12 text-center relative z-10">
                <div class="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-yellow-500/10 text-yellow-500 text-[10px] font-black uppercase tracking-[0.4em] border border-yellow-500/20 mb-4 animate-pulse">
                    Premium Roulette
                </div>
                <h2 class="text-6xl font-black text-white uppercase italic tracking-tighter drop-shadow-2xl">Roue de la <span class="text-blue-500">Fortune</span></h2>
                <div class="mt-4 flex items-center justify-center gap-4">
                    <div class="bg-white/5 border border-white/10 px-6 py-2 rounded-2xl">
                        <div class="text-[8px] text-gray-500 font-black uppercase tracking-widest mb-1">Tours Disponibles</div>
                        <div class="text-2xl font-mono font-black text-yellow-400">${turns}</div>
                    </div>
                </div>
            </div>

            <!-- WHEEL CONTAINER -->
            <div class="relative w-[450px] h-[450px] md:w-[600px] md:h-[600px] flex items-center justify-center group">
                <!-- Outer Ring Decor -->
                <div class="absolute inset-0 rounded-full border-8 border-white/5 shadow-[0_0_100px_rgba(59,130,246,0.2)]"></div>
                <div class="absolute inset-[-20px] rounded-full border border-white/5 animate-spin-slow opacity-20"></div>

                <!-- THE WHEEL -->
                <div id="fortune-wheel-inner" class="relative w-full h-full rounded-full bg-[#0c0c0e] border-[12px] border-[#1a1a1c] overflow-hidden shadow-2xl">
                    <div class="absolute inset-0 flex items-center justify-center">
                        ${renderSegments()}
                    </div>
                    <!-- Center Decor -->
                    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-black border-4 border-blue-500 shadow-[0_0_40px_rgba(59,130,246,0.5)] z-[300] flex items-center justify-center">
                        <div class="font-black text-white text-xl uppercase tracking-tighter">TFRP</div>
                    </div>
                </div>

                <!-- INDICATOR -->
                <div class="absolute -top-4 left-1/2 -translate-x-1/2 w-12 h-12 z-[400] drop-shadow-2xl">
                    <div class="w-full h-full bg-blue-500 clip-triangle shadow-2xl" style="clip-path: polygon(0% 0%, 100% 0%, 50% 100%);"></div>
                </div>
            </div>

            <div class="mt-16 flex flex-col items-center gap-6 relative z-10">
                <button onclick="actions.spinWheel()" 
                    ${state.isSpinning || turns <= 0 ? 'disabled' : ''}
                    class="h-20 px-20 rounded-[32px] font-black text-2xl uppercase italic tracking-widest transition-all transform active:scale-95 shadow-2xl
                    ${state.isSpinning || turns <= 0 ? 'bg-white/5 text-gray-600 cursor-not-allowed border border-white/10' : 'bg-white text-black hover:bg-blue-600 hover:text-white shadow-blue-900/30'}">
                    ${state.isSpinning ? 'LANCEMENT...' : 'TENTER SA CHANCE'}
                </button>
                
                <button onclick="actions.closeWheel()" 
                    ${state.isSpinning ? 'style="display:none"' : ''}
                    class="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] hover:text-white transition-colors">
                    Retour au Terminal
                </button>
            </div>
        </div>

        <div class="fixed bottom-10 left-10 opacity-30">
            <div class="text-[9px] text-gray-500 font-mono uppercase tracking-widest leading-relaxed">
                Algorithme de probabilités pondérées v1.0<br>
                Système certifié équitable par TFRP
            </div>
        </div>
    </div>
    <style>
        .clip-triangle { clip-path: polygon(50% 0%, 0% 100%, 100% 100%); }
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 20s linear infinite; }
    </style>
    `;
};
