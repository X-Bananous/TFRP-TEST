
import { ui } from './ui.js';

export const initSecurity = async () => {
    // 1. DISABLE INSPECT ELEMENT & RIGHT CLICK
    document.addEventListener('contextmenu', (e) => e.preventDefault());
    
    document.addEventListener('keydown', (e) => {
        // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
        if (
            e.key === 'F12' || 
            (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) || 
            (e.ctrlKey && e.key === 'U')
        ) {
            e.preventDefault();
            return false;
        }
    });

    // Debugger Loop Trick
    setInterval(() => {
        const start = performance.now();
        debugger;
        const end = performance.now();
        if (end - start > 100) {
            document.body.innerHTML = `
                <div style="background:#050505; color:white; height:100vh; display:flex; flex-direction:column; justify-content:center; align-items:center; font-family:sans-serif; text-align:center; padding:20px;">
                    <div style="font-size:5rem; margin-bottom:2rem; filter:drop-shadow(0 0 20px rgba(59,130,246,0.5));">🤔</div>
                    <h1 style="font-size:2.5rem; font-weight:900; letter-spacing:-0.05em; margin-bottom:1rem; text-transform:uppercase; italic">EH Petit Malin...</h1>
                    <p style="font-size:1.2rem; color:#94a3b8; max-width:500px; line-height:1.6;">...tu essayes de faire quoi au juste ? L'inspection du terminal est strictement réservée au commandement technique.</p>
                    <div style="margin-top:3rem; padding:15px 30px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); rounded:15px; font-family:monospace; font-size:0.8rem; color:#475569;">
                        SIGNAL_DÉTECTÉ: INSPECTOR_OPEN_ATTEMPT
                    </div>
                    <button onclick="window.location.reload()" style="margin-top:2rem; padding:12px 24px; background:#2563eb; color:white; border:none; border-radius:12px; font-weight:bold; cursor:pointer;">Relancer le terminal</button>
                </div>
            `;
        }
    }, 1000);

    // 2. VPN DETECTION
    try {
        const res = await fetch('https://ipapi.co/json/');
        if (res.ok) {
            const data = await res.json();
            if (data.hosting === true || data.proxy === true) {
                blockAccess("EH Petit Malin tu essayes de faire quoi ? (VPN/Proxy détecté)");
            }
        }
    } catch (e) {
        console.warn("Security check skipped (Network Error)");
    }
};

const blockAccess = (reason) => {
    document.body.innerHTML = `
        <div style="background-color:#050505; color:white; height:100vh; width:100vw; display:flex; flex-direction:column; align-items:center; justify-content:center; font-family:sans-serif; z-index:9999; position:fixed; top:0; left:0; text-align:center;">
            <div style="font-size:3rem; margin-bottom:1rem;">🛡️</div>
            <h1 style="font-size:1.8rem; font-weight:900; margin-bottom:0.5rem; uppercase italic">${reason}</h1>
            <p style="color:#6b7280; font-size:0.9rem; margin-top:1rem; max-width:400px;">Veuillez désactiver vos outils de masquage IP pour accéder aux services gouvernementaux TFRP.</p>
        </div>
    `;
    throw new Error("Security Block");
};
