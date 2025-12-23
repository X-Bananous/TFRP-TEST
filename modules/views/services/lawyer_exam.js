
import { state } from '../../state.js';

export const BAR_QUESTIONS = [
    { q: "Qu'est-ce que le 'Miranda Warning' ?", a: ["Le droit de garder le silence", "Une amende pour excès de vitesse", "Un mandat de perquisition", "Une convocation au tribunal"], r: 0 },
    { q: "Un avocat peut-il mentir pour protéger son client ?", a: ["Oui, c'est son rôle", "Non, c'est un parjure", "Seulement en cas de crime grave", "Oui, si le procureur est d'accord"], r: 1 },
    { q: "Quelle est la peine maximale pour un outrage à magistrat ?", a: ["$500", "$5,000", "$25,000", "$50,000"], r: 2 },
    { q: "Qui a le dernier mot sur le scellage d'un dossier ?", a: ["Le Procureur", "Le Juge", "Le Maire", "L'Officier"], r: 1 },
    { q: "Un avocat peut-il assister à une fouille de police ?", a: ["Oui, c'est un droit", "Non, jamais", "Seulement si le suspect est mineur", "Seulement sur mandat"], r: 0 },
    { q: "Qu'est-ce qu'une comparution immédiate ?", a: ["Un jugement sans avocat", "Un jugement rapide après la garde à vue", "Une demande de libération", "Une amende simple"], r: 1 },
    { q: "Le Procureur représente :", a: ["Le suspect", "La victime uniquement", "L'État et l'intérêt public", "La Police"], r: 2 },
    { q: "Un vice de procédure entraîne :", a: ["Une réduction d'amende", "L'annulation des poursuites", "Une peine de prison ferme", "Un changement d'avocat"], r: 1 },
    { q: "Combien d'adjoints au maire maximum sont autorisés ?", a: ["1", "2", "3", "5"], r: 1 },
    { q: "La légitime défense doit être :", a: ["Optionnelle", "Proportionnée à l'attaque", "Toujours armée", "Retardée"], r: 1 },
    { q: "Le secret professionnel est :", a: ["Facultatif", "Absolu", "Vendu au plus offrant", "Limité à 1 an"], r: 1 },
    { q: "Un témoignage anonyme est-il recevable au tribunal ?", a: ["Oui, toujours", "Non, jamais", "Sous conditions strictes", "Seulement pour les vols"], r: 2 },
    { q: "Quelle est la mission principale du LADOT ?", a: ["Arrêter des criminels", "Éteindre des feux", "Gestion du trafic et remorquage", "Vendre des voitures"], r: 2 },
    { q: "Une amende impayée peut mener à :", a: ["Une promotion", "Une saisie bancaire par l'État", "Un bannissement", "Rien"], r: 1 },
    { q: "Le Juge de Siège est :", a: ["Sous les ordres du Maire", "Indépendant", "Un membre du gang", "Le chef de la police"], r: 1 },
    { q: "Un citoyen peut-il refuser une fouille sans mandat ?", a: ["Oui, hors flagrant délit", "Non, jamais", "Seulement s'il est PDG", "S'il a payé ses impôts"], r: 0 },
    { q: "Qu'est-ce qu'un chef d'inculpation ?", a: ["Le nom du policier", "Le crime reproché", "Le numéro de cellule", "Le montant du virement"], r: 1 },
    { q: "Le barreau de L.A. est géré par :", a: ["La Police", "La Justice", "Les Gangs", "Le Staff uniquement"], r: 1 },
    { q: "Une perquisition nécessite :", a: ["Une envie de l'officier", "Un mandat signé d'un magistrat", "Une clé USB", "L'accord du voisin"], r: 1 },
    { q: "Le Procureur peut-il classer une affaire sans suite ?", a: ["Oui", "Non, seul le Juge peut", "Seulement si le suspect est riche", "Si la police le demande"], r: 0 },
    { q: "Une réquisition est :", a: ["Une demande de peine par le Procureur", "Une amende", "Un cadeau", "Une plainte"], r: 0 },
    { q: "La présomption d'innocence signifie :", a: ["Coupable jusqu'à preuve du contraire", "Innocent jusqu'à preuve de la culpabilité", "Pas besoin de procès", "Tout le monde ment"], r: 1 },
    { q: "L'avocat peut-il entrer en zone de garde à vue ?", a: ["Oui", "Non, c'est interdit", "Seulement s'il est armé", "Si le Maire est là"], r: 0 },
    { q: "Une garde à vue (GAV) est limitée par :", a: ["Le temps (RP)", "Le nombre de cafés", "L'humeur du policier", "Rien"], r: 0 },
    { q: "Le juge peut-il réduire une amende de police ?", a: ["Oui", "Non", "Seulement pour les amis", "S'il y a une promo"], r: 0 },
    { q: "Un avocat commis d'office est :", a: ["Payé par l'État", "Bénévole", "Un policier déguisé", "Un stagiaire"], r: 0 },
    { q: "L'outrage à agent est :", a: ["Un droit", "Un délit", "Une blague", "Une récompense"], r: 1 },
    { q: "Un mandat d'amener permet :", a: ["De fouiller un coffre", "De conduire un suspect devant le juge", "De supprimer un compte", "De voler une voiture"], r: 1 },
    { q: "La récidive entraîne :", a: ["Une réduction de peine", "Un alourdissement de la peine", "Un cadeau", "Rien"], r: 1 },
    { q: "Une pièce à conviction est :", a: ["Un vêtement à la mode", "Un objet prouvant le crime", "Un faux témoignage", "Une amende"], r: 1 },
    { q: "La déontologie est :", a: ["La science des dents", "L'ensemble des devoirs d'une profession", "Un type de voiture", "Un gang"], r: 1 },
    { q: "Un témoin oculaire est :", a: ["Quelqu'un qui a vu la scène", "Quelqu'un qui a entendu parler du crime", "Un aveugle", "Un policier"], r: 0 },
    { q: "L'acquittement signifie :", a: ["Reconnu coupable", "Reconnu non-coupable", "Prison à vie", "Amende de 1M$"], r: 1 },
    { q: "L'appel d'un jugement :", a: ["Permet un nouveau procès", "Est interdit", "Coute 50,000$", "Annule le serveur"], r: 0 },
    { q: "Un délit est :", a: ["Plus grave qu'un crime", "Moins grave qu'un crime", "Pareil qu'une amende", "Un métier"], r: 1 },
    { q: "La complicité :", a: ["N'est pas punissable", "Est punissable comme l'auteur", "Est un métier légal", "N'existe pas"], r: 1 },
    { q: "Un vice de forme concerne :", a: ["L'apparence de l'avocat", "La rédaction des actes juridiques", "La taille du suspect", "Le prix du repas"], r: 1 },
    { q: "Une délibération est :", a: ["Le temps de réflexion des juges", "Une fête au tribunal", "Une poursuite en voiture", "Une amende"], r: 0 },
    { q: "L'huissier de justice :", a: ["Est un policier", "Signifie les actes et convocations", "Vole des voitures", "Est un civil"], r: 1 },
    { q: "Le casier judiciaire :", a: ["Est public", "Est confidentiel/administratif", "Est effacé tous les jours", "Est vendu au concessionnaire"], r: 1 },
    { q: "Un suspect peut-il se défendre seul ?", a: ["Oui", "Non, avocat obligatoire", "Seulement s'il est policier", "S'il a plus de 100k$"], r: 0 },
    { q: "L'extorsion est :", a: ["Obtenir de l'argent par la menace", "Un virement bancaire", "Un don", "Un métier"], r: 0 },
    { q: "Le blanchiment d'argent :", a: ["Laver ses billets au savon", "Dissimuler l'origine illégale de fonds", "Un bonus staff", "Une taxe"], r: 1 },
    { q: "La corruption est :", a: ["Légale", "Un délit grave", "Un type de drogue", "Un vêtement"], r: 1 },
    { q: "Le faux témoignage sous serment :", a: ["Est autorisé", "Est un crime (Parjure)", "Est une blague", "N'existe pas"], r: 1 },
    { q: "Un alibi est :", a: ["Une preuve qu'on était ailleurs", "Une arme", "Un vêtement", "Un complice"], r: 0 },
    { q: "La garde à vue commence :", a: ["Au poste", "Dès l'arrestation", "Après le café", "Le lendemain"], r: 1 },
    { q: "L'avocat peut-il parler à la presse ?", a: ["Oui, sous conditions", "Non, jamais", "S'il est payé", "S'il est staff"], r: 0 },
    { q: "Un interrogatoire doit être :", a: ["Violent", "Respectueux des droits", "Secret", "Annulé"], r: 1 },
    { q: "La Justice de TFRP est :", a: ["Optionnelle", "Le pilier du Roleplay sérieux", "Un mini-jeu", "Juste pour les amendes"], r: 1 }
];

export const LawyerExamView = () => {
    const user = state.user;
    const lastAttempt = user.last_bar_attempt ? new Date(user.last_bar_attempt) : null;
    const now = new Date();
    
    // Cooldown de 2 heures
    const cooldownMs = 2 * 60 * 60 * 1000;
    if (lastAttempt && (now - lastAttempt < cooldownMs)) {
        const remaining = cooldownMs - (now - lastAttempt);
        const mins = Math.ceil(remaining / 60000);
        return `
            <div class="h-full flex items-center justify-center p-8 animate-fade-in relative z-50">
                <div class="glass-panel max-w-lg w-full p-10 rounded-[40px] border-orange-500/30 text-center">
                    <div class="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-8 text-orange-500 border border-orange-500/20 shadow-lg">
                        <i data-lucide="clock" class="w-10 h-10 animate-pulse"></i>
                    </div>
                    <h2 class="text-3xl font-bold text-white mb-4 italic uppercase tracking-tighter">Échec au Barreau</h2>
                    <p class="text-gray-400 mb-8 leading-relaxed">
                        Le Conseil de l'Ordre a rejeté votre dernière prestation. Vous devez réviser le Code Judiciaire TFRP avant de retenter votre chance.
                    </p>
                    <div class="bg-black/30 p-6 rounded-2xl border border-white/5 mb-8">
                        <div class="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Temps de suspension restant</div>
                        <div class="text-3xl font-mono font-bold text-orange-400">${mins} minutes</div>
                    </div>
                    <button onclick="actions.refreshCurrentView()" class="glass-btn w-full py-4 rounded-2xl font-bold cursor-pointer relative z-[60]">Actualiser le Statut</button>
                </div>
            </div>
        `;
    }

    if (state.activeExam) {
        const q = state.activeExam.questions[state.activeExam.currentIndex];
        const progress = ((state.activeExam.currentIndex + 1) / state.activeExam.questions.length) * 100;

        return `
            <div class="h-full flex items-center justify-center p-4 animate-fade-in relative z-50">
                <div class="glass-panel max-w-2xl w-full p-8 rounded-[40px] border-blue-500/30 shadow-2xl relative overflow-hidden">
                    <div class="absolute top-0 left-0 h-1 bg-blue-500 transition-all duration-500" style="width: ${progress}%"></div>
                    
                    <div class="flex justify-between items-center mb-8">
                        <div class="text-[10px] text-blue-400 font-black uppercase tracking-[0.3em]">Examen du Barreau • Session Officielle</div>
                        <div class="text-xs font-mono text-gray-500">Question ${state.activeExam.currentIndex + 1} / 15</div>
                    </div>

                    <h3 class="text-2xl font-bold text-white mb-10 leading-tight">"${q.q}"</h3>

                    <div class="grid grid-cols-1 gap-4 mb-10">
                        ${q.a.map((ans, idx) => `
                            <button onclick="actions.answerExamQuestion(${idx})" class="p-5 rounded-2xl bg-white/5 border border-white/5 hover:bg-blue-600/20 hover:border-blue-500/50 text-left transition-all group flex items-center gap-4 cursor-pointer relative z-[60]">
                                <div class="w-8 h-8 rounded-lg bg-black/40 flex items-center justify-center text-xs font-bold text-gray-500 group-hover:text-blue-400 border border-white/5">${String.fromCharCode(65 + idx)}</div>
                                <div class="text-sm font-medium text-gray-300 group-hover:text-white">${ans}</div>
                            </button>
                        `).join('')}
                    </div>

                    <div class="text-[9px] text-gray-600 text-center uppercase font-bold tracking-widest italic">
                        Une erreur de trop et l'accès vous sera refusé pour 2 heures.
                    </div>
                </div>
            </div>
        `;
    }

    return `
        <div class="h-full flex items-center justify-center p-8 animate-fade-in relative z-50">
            <div class="glass-panel max-w-xl w-full p-10 rounded-[40px] border-blue-500/20 text-center relative overflow-hidden">
                <div class="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent"></div>
                <div class="w-24 h-24 bg-blue-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 text-blue-400 border border-blue-500/20 shadow-2xl rotate-3">
                    <i data-lucide="scale" class="w-12 h-12"></i>
                </div>
                <h2 class="text-4xl font-black text-white mb-4 tracking-tighter uppercase italic">Barreau de Los Angeles</h2>
                <p class="text-gray-400 mb-10 leading-relaxed max-w-md mx-auto">
                    Pour exercer en tant qu'Avocat ou Magistrat au sein de la communauté TFRP, vous devez prouver votre connaissance du Code de Procédure et des Droits du Citoyen.
                </p>
                
                <div class="bg-black/30 p-6 rounded-2xl border border-white/5 text-left mb-10 space-y-3">
                    <div class="flex items-center gap-3 text-xs font-bold text-gray-300"><i data-lucide="check-circle" class="w-4 h-4 text-emerald-500"></i> 15 Questions aléatoires</div>
                    <div class="flex items-center gap-3 text-xs font-bold text-gray-300"><i data-lucide="target" class="w-4 h-4 text-blue-500"></i> Score requis : 13 / 15</div>
                    <div class="flex items-center gap-3 text-xs font-bold text-gray-300"><i data-lucide="alert-triangle" class="w-4 h-4 text-orange-500"></i> Échec : 2 heures de suspension</div>
                </div>

                <button onclick="actions.startBarExam()" class="glass-btn w-full py-5 rounded-2xl font-black text-lg uppercase tracking-widest shadow-blue-900/20 cursor-pointer relative z-[100] hover:scale-[1.02] active:scale-95 transition-all">
                    Débuter l'Examen
                </button>
            </div>
        </div>
    `;
};
