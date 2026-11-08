import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import Logo from "./components/Logo";
import Pricing from "./components/Pricing";
import Footer from "./components/Footer";
import MyAccount from "./components/MyAccount";
import { FAQS, TESTIMONIALS } from "./data";
import { getSession, saveSession, clearSession, touchSession } from "./utils/session";
import { 
  ShieldCheck, 
  Sparkles, 
  Copy, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle, 
  Sliders, 
  Clock, 
  Cpu, 
  FileText, 
  Award, 
  Lock, 
  Globe, 
  Eye, 
  HelpCircle,
  Download,
  Video,
  User
} from "lucide-react";

export default function App() {
  // Accordion state for FAQs
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Logo loading fallback state
  const [logoImgError, setLogoImgError] = useState(false);

  // Mon Compte space states (sessionStorage & expiration automatique 30 min)
  const [currentUser, setCurrentUser] = useState<any>(() => getSession());
  const [showAccountSpace, setShowAccountSpace] = useState(false);

  // Surveillance active de l'inactivité (30 minutes)
  useEffect(() => {
    if (!currentUser) return;

    // Détection des interactions utilisateur pour actualiser le timestamp
    const handleActivity = () => {
      touchSession();
    };

    window.addEventListener("mousemove", handleActivity, { passive: true });
    window.addEventListener("keydown", handleActivity, { passive: true });
    window.addEventListener("click", handleActivity, { passive: true });
    window.addEventListener("scroll", handleActivity, { passive: true });

    // Contrôle régulier pour déclencher la déconnexion automatique en direct
    const interval = setInterval(() => {
      const activeUser = getSession();
      if (!activeUser) {
        setCurrentUser(null);
      }
    }, 15000);

    return () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("click", handleActivity);
      window.removeEventListener("scroll", handleActivity);
      clearInterval(interval);
    };
  }, [currentUser]);

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans selection:bg-blue-600/30 selection:text-white">
      
      {/* 1. Glassy Navigation Header */}
      <Header 
        user={currentUser}
        onOpenAccount={() => setShowAccountSpace(true)}
        showAccountSpace={showAccountSpace}
        onCloseAccount={() => setShowAccountSpace(false)}
      />

      {/* Main Content Sections */}
      <main className="flex-1">

        {showAccountSpace ? (
          <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative overflow-hidden">
            {/* Ambient glows behind dashboard */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-blue-600/10 blur-[130px] rounded-full pointer-events-none" />
            <MyAccount 
              user={currentUser} 
              onLogin={(u) => {
                saveSession(u);
                setCurrentUser(u);
              }} 
              onLogout={() => {
                clearSession();
                setCurrentUser(null);
              }} 
              onClose={() => setShowAccountSpace(false)} 
            />
          </div>
        ) : (
          <>

        {/* =========================================================================
            SECTION 1: HERO SECTION - Sovereign and High-end presentation
            ========================================================================= */}
        <section id="accueil" className="relative pt-24 pb-20 md:pt-32 md:pb-28 overflow-hidden border-b border-slate-900 bg-radial-[at_top_center] from-blue-950/20 via-slate-950 to-slate-950">
          
          {/* Ambient background glow & grid vector */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              {/* Left Column: Core Value Proposition */}
              <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                
                {/* French sovereign tag */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider mb-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Conforme RGPD & Mistral AI
                </div>

                {/* Main Heading */}
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-bold tracking-tight text-white leading-tight">
                  Gagnez du temps sur vos appréciations,{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400">
                    gardez le contrôle pédagogique
                  </span>
                </h1>

                {/* Subtitle */}
                <p className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto lg:mx-0 leading-relaxed font-light">
                  apprecIAtion est le premier assistant logiciel souverain conçu pour les enseignants. Rédigez des appréciations de matières et des synthèses de professeur principal personnalisées, variées et impeccables grâce à l'IA française Mistral.
                </p>

                {/* Key features checklist */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-sm text-slate-300 max-w-md mx-auto lg:mx-0">
                  <div className="flex items-center gap-2 justify-center lg:justify-start">
                    <CheckCircle className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
                    <span>Conformité RGPD absolue</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center lg:justify-start">
                    <CheckCircle className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
                    <span>Copier-coller intelligent Pronote</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center lg:justify-start">
                    <CheckCircle className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
                    <span>Propulsé par Mistral AI (France)</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center lg:justify-start">
                    <CheckCircle className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
                    <span>Intégration macOS, Win & Linux</span>
                  </div>
                </div>

                {/* Call-to-actions */}
                <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start pt-4">
                  <a 
                    href="#demo-video"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm px-8 py-3.5 rounded-xl transition-all duration-300 shadow-xl shadow-blue-500/10 hover:shadow-blue-500/20 hover:-translate-y-0.5 cursor-pointer"
                  >
                    <Video className="w-4.5 h-4.5 text-blue-300" />
                    Voir la Démo Vidéo
                  </a>
                  <button 
                    onClick={() => setShowAccountSpace(true)}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white font-semibold text-sm px-8 py-3.5 rounded-xl transition-all border border-slate-800 hover:border-slate-700 cursor-pointer"
                  >
                    <User className="w-4.5 h-4.5 text-blue-400" />
                    Accéder à Mon Compte
                  </button>
                </div>

              </div>

              {/* Right Column: High-fidelity Styled UI Representation */}
              <div className="lg:col-span-5 relative flex justify-center">
                
                {/* Abstract Neon Glow Circle under Mock */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none" />

                {/* Framed Graphic containing the requested logo image and layout mock */}
                <div className="relative w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-xl">
                  
                  {/* Outer Window Chrome Dot representation */}
                  <div className="flex gap-1.5 mb-6 border-b border-slate-800/80 pb-4">
                    <div className="w-3 h-3 rounded-full bg-red-500/60" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                    <div className="w-3 h-3 rounded-full bg-green-500/60" />
                    <span className="text-[10px] text-slate-500 font-mono ml-2 mt-0.5">apprecIAtion - Enseignant Copilot</span>
                  </div>

                  {/* Elegant Integration of the Logo apprecIAtion.png */}
                  <div className="bg-slate-950 rounded-xl p-6 border border-slate-850 flex flex-col items-center justify-center shadow-inner mb-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-2xl rounded-full" />
                    
                    {!logoImgError ? (
                      <div className="text-center">
                        <img 
                          src="/assets/apprecIAtion.png" 
                          alt="apprecIAtion" 
                          referrerPolicy="no-referrer"
                          onError={() => setLogoImgError(true)}
                          className="max-h-24 w-auto object-contain mx-auto filter drop-shadow-[0_0_8px_rgba(99,102,241,0.25)] hover:scale-105 transition-transform duration-300"
                        />
                        <p className="text-[10px] text-slate-400 font-display uppercase tracking-widest mt-3 border-t border-slate-800/80 pt-2">
                          L'Assistant IA Souverain des Enseignants
                        </p>
                      </div>
                    ) : (
                      // High-fidelity responsive fallback vector logo in case of error
                      <Logo size="md" />
                    )}
                  </div>

                  {/* Small dynamic mock status widgets */}
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between items-center bg-slate-950/60 p-3 rounded-lg border border-slate-850">
                      <span className="text-slate-400 font-medium">Liaison Pronote / ÉcoleDirecte</span>
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-bold font-mono">
                        PRÊTE
                      </span>
                    </div>

                    <div className="flex justify-between items-center bg-slate-950/60 p-3 rounded-lg border border-slate-850">
                      <span className="text-slate-400 font-medium">Hébergement Souverain (France)</span>
                      <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 font-bold font-mono">
                        ACTIF
                      </span>
                    </div>

                    <div className="flex justify-between items-center bg-slate-950/60 p-3 rounded-lg border border-slate-850">
                      <span className="text-slate-400 font-medium">Anonymisation des Noms</span>
                      <span className="text-[10px] bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded border border-purple-500/20 font-bold font-mono">
                        CONFORME RGPD
                      </span>
                    </div>
                  </div>

                </div>

              </div>

            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 2B: VIDEO DEMONSTRATION - Elegant YouTube Integration
            ========================================================================= */}
        <section id="demo-video" className="py-20 bg-slate-900 border-b border-slate-850 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />
          
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              {/* Left Column: Video Frame (span 7) */}
              <div className="lg:col-span-7 space-y-4">
                <div className="relative group rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl shadow-indigo-500/10 hover:border-slate-700/80 transition-all duration-300">
                  <video
                    src="/assets/apprecIAtion_demo.mp4"
                    controls
                    preload="metadata"
                    playsInline
                    className="w-full h-full aspect-video rounded-2xl object-cover bg-slate-950"
                  >
                    Votre navigateur ne prend pas en charge la lecture de vidéos HTML5. Veuillez placer votre vidéo dans <code>/assets/apprecIAtion_demo.mp4</code>.
                  </video>
                  
                  {/* Subtle decorative glow overlay on hover */}
                  <div className="absolute inset-0 rounded-2xl border border-blue-500/0 group-hover:border-blue-500/20 pointer-events-none transition-all duration-300" />
                </div>
                <div className="flex justify-between items-center px-2 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    Tutoriel Vidéo Complet
                  </span>
                  <span>Durée : ~3 minutes</span>
                </div>
              </div>

              {/* Right Column: Features & Explanations (span 5) */}
              <div className="lg:col-span-5 space-y-6">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider">
                  <Video className="w-3.5 h-3.5 text-blue-400" />
                  Présentation en Images
                </span>

                <h2 className="text-3xl font-display font-bold text-white tracking-tight">
                  Découvrez apprecIAtion en action
                </h2>

                <p className="text-slate-400 text-sm leading-relaxed font-light">
                  Regardez cette courte vidéo de démonstration pour comprendre comment l'assistant s'intègre naturellement à votre flux de travail, et comment générer des appréciations adaptées et impeccables en quelques clics.
                </p>

                <div className="space-y-4 pt-2">
                  <div className="flex gap-3 items-start">
                    <span className="w-6 h-6 rounded-full bg-slate-850 border border-slate-800 text-slate-300 flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5">
                      1
                    </span>
                    <div>
                      <h4 className="text-white font-bold text-sm">Prise en main simplifiée</h4>
                      <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                        Visualisez l'interface pas-à-pas et la configuration des critères d'évaluation de vos élèves.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 items-start">
                    <span className="w-6 h-6 rounded-full bg-slate-850 border border-slate-800 text-slate-300 flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5">
                      2
                    </span>
                    <div>
                      <h4 className="text-white font-bold text-sm">Génération de propositions variées</h4>
                      <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                        Découvrez comment l'IA française Mistral formule instantanément 3 alternatives personnalisables par élève.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 items-start">
                    <span className="w-6 h-6 rounded-full bg-slate-850 border border-slate-800 text-slate-300 flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5">
                      3
                    </span>
                    <div>
                      <h4 className="text-white font-bold text-sm">Copier-coller Pronote fluide</h4>
                      <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                        Admirez la vitesse d'intégration directe pour remplir vos bulletins scolaires trimestriels sans effort.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex gap-4">
                  <button
                    onClick={() => setShowAccountSpace(true)}
                    className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-5 py-2.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <User className="w-4 h-4" />
                    Accéder à Mon Compte
                  </button>
                  <a
                    href="#fonctionnalites"
                    className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold text-xs px-5 py-2.5 rounded-lg transition-colors border border-slate-700/50 cursor-pointer"
                  >
                    Découvrir les fonctionnalités
                  </a>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 3: BENTO GRID FEATURES SECTION
            ========================================================================= */}
        <section id="fonctionnalites" className="py-20 bg-slate-950 border-b border-slate-900">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            
            {/* Section Header */}
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider mb-3">
                <Sliders className="w-3.5 h-3.5" />
                Des outils sur-mesure
              </span>
              <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-white mb-4">
                Une interface conçue par et pour les enseignants
              </h2>
              <p className="text-slate-400 text-base">
                Fini le syndrome de la page blanche et les appréciations répétitives. apprecIAtion vous aide à formuler un feedback précis qui valorise chaque élève.
              </p>
            </div>

            {/* Bento Grid layout */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
              
              {/* Feature 1: Appréciations matières (span 3) */}
              <div className="md:col-span-3 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 hover:border-slate-700/80 transition-all flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h3 className="text-white font-display font-bold text-lg mb-2">Appréciations Matières</h3>
                  <p className="text-slate-400 text-xs leading-relaxed font-light">
                    Saisissez vos critères (travail, participation, comportement) et obtenez instantanément des propositions calibrées. Gagnez en moyenne 15 heures par fin de trimestre tout en conservant une évaluation fine et unique.
                  </p>
                </div>
                <div className="mt-4 border-t border-slate-850 pt-4 flex justify-between items-center text-[10px] text-slate-500 font-mono">
                  <span>Gain de temps moyen</span>
                  <span className="text-emerald-400 font-bold">-65% de temps passé</span>
                </div>
              </div>

              {/* Feature 2: Synthèses de professeur principal (span 3) */}
              <div className="md:col-span-3 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 hover:border-slate-700/80 transition-all flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
                    <Award className="w-5 h-5" />
                  </div>
                  <h3 className="text-white font-display font-bold text-lg mb-2">Synthèses de Professeur Principal</h3>
                  <p className="text-slate-400 text-xs leading-relaxed font-light">
                    Aggregez automatiquement le profil de l'élève pour rédiger la synthèse générale du trimestre. L'outil croise harmonieusement les forces, les faiblesses et le comportement global pour donner un cap de progrès clair.
                  </p>
                </div>
                <div className="mt-4 border-t border-slate-850 pt-4 flex justify-between items-center text-[10px] text-slate-500 font-mono">
                  <span>Orientation</span>
                  <span className="text-blue-400 font-bold">Conseils de progrès ciblés</span>
                </div>
              </div>

              {/* Feature 3: Alternative drafts / Versioning (span 2) */}
              <div className="md:col-span-2 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 hover:border-slate-700/80 transition-all">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
                  <Clock className="w-5 h-5" />
                </div>
                <h3 className="text-white font-display font-bold text-base mb-2">Alternatives & Nuances</h3>
                <p className="text-slate-400 text-xs leading-relaxed font-light">
                  Chaque clic produit 3 formulations distinctes : équilibrée, exigeante ou concise. Idéal pour s'ajuster au tempérament de l'élève et aux contraintes d'espace.
                </p>
              </div>

              {/* Feature 4: Grilles d'items (span 2) */}
              <div className="md:col-span-2 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 hover:border-slate-700/80 transition-all">
                <div className="w-10 h-10 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400 mb-4">
                  <Sliders className="w-5 h-5" />
                </div>
                <h3 className="text-white font-display font-bold text-base mb-2">Grilles Personnalisables</h3>
                <p className="text-slate-400 text-xs leading-relaxed font-light">
                  Importez ou modifiez directement vos critères thématiques (Méthodologie, Devoirs, Bavardages) pour concevoir un logiciel à l'image de vos exigences pédagogiques.
                </p>
              </div>

              {/* Feature 5: Liaison Pronote (span 2) */}
              <div className="md:col-span-2 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 hover:border-slate-700/80 transition-all">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4">
                  <Cpu className="w-5 h-5" />
                </div>
                <h3 className="text-white font-display font-bold text-base mb-2">Liaison Pronote / ÉcoleDirecte</h3>
                <p className="text-slate-400 text-xs leading-relaxed font-light">
                  Conçu sous forme de volet flottant très léger, le programme se superpose à votre navigateur pour coller l'appréciation d'un seul clic d'élève en élève.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 4: SOUVEREIGNTY & GDPR / RGPD DEDICATED BLOCK
            ========================================================================= */}
        <section id="rgpd" className="py-20 bg-slate-900 border-b border-slate-800 relative overflow-hidden">
          {/* Subtle neon gradient bar at top */}
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-emerald-500 via-blue-500 to-indigo-500" />
          
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              {/* Left text column (span 7) */}
              <div className="lg:col-span-7 space-y-6">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                  <Lock className="w-3.5 h-3.5" />
                  Souveraineté des données scolaires
                </span>
                
                <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-white">
                  Respect absolu du RGPD et du secret professionnel
                </h2>
                
                <p className="text-slate-400 text-sm md:text-base leading-relaxed font-light">
                  Contrairement aux assistants génériques d'IA américains, apprecIAtion a été conçu spécifiquement pour le cadre de l'Éducation Nationale. Les données d'identité des élèves ne quittent jamais votre machine : elles sont floutées, nettoyées et remplacées avant tout envoi.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                  
                  {/* Pillar 1 */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2">
                    <div className="flex items-center gap-2 text-white font-bold text-sm">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                      <span>Mistral AI (Souveraineté)</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Traitement opéré via l'IA générative française Mistral AI, hébergée sur des infrastructures situées exclusivement en Europe, en dehors du champ d'application du Cloud Act américain.
                    </p>
                  </div>

                  {/* Pillar 2 */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2">
                    <div className="flex items-center gap-2 text-white font-bold text-sm">
                      <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse shrink-0" />
                      <span>Anonymisation de bout en bout</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Seuls les prénoms de vos élèves sont fournis pour assurer la contextualisation du genre et de la grammaire. Les noms de famille ne sont jamais requis.
                    </p>
                  </div>

                  {/* Pillar 3 */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2">
                    <div className="flex items-center gap-2 text-white font-bold text-sm">
                      <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse shrink-0" />
                      <span>Garder le contrôle</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Le logiciel n'automatise rien de manière aveugle. L'enseignant reste l'unique rédacteur et valideur de son analyse pédagogique, de la forme et du style, conformément à sa mission d'enseignant.
                    </p>
                  </div>

                  {/* Pillar 4 */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2">
                    <div className="flex items-center gap-2 text-white font-bold text-sm">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                      <span>Zéro stockage persistant</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Vos listes d'élèves, vos classes et vos historiques d'appréciations sont cryptés et stockés en toute sécurité de manière locale sur votre disque dur. Rien n'est conservé sur des serveurs externes.
                    </p>
                  </div>

                </div>

              </div>

              {/* Right graphical infographic column (span 5) */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 shadow-2xl relative w-full max-w-sm">
                  <h3 className="text-white font-display font-bold text-sm border-b border-slate-800 pb-3 mb-4 flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-blue-400 animate-spin" style={{ animationDuration: "12s" }} />
                    Cartographie du flux de données
                  </h3>

                  {/* Workflow infographic flow */}
                  <div className="space-y-4 text-xs font-mono">
                    <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-slate-400">
                      <div className="flex justify-between items-center mb-1 text-[10px] text-blue-400 font-bold">
                        <span>Étape 1 : Saisie locale</span>
                        <span>Poste Enseignant</span>
                      </div>
                      <p className="text-[11px]">Données brutes, items cochés et prénoms restants locaux.</p>
                    </div>

                    <div className="flex justify-center text-slate-600 font-bold text-sm">
                      ⬇ [Chiffrement SSL 256 bits]
                    </div>

                    <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-slate-400">
                      <div className="flex justify-between items-center mb-1 text-[10px] text-purple-400 font-bold">
                        <span>Étape 2 : Nettoyage & Filtre</span>
                        <span>Passerelle apprecIAtion</span>
                      </div>
                      <p className="text-[11px]">Ajustement automatique du genre et retrait de tout élément sensible ou identifiant scolaire.</p>
                    </div>

                    <div className="flex justify-center text-slate-600 font-bold text-sm">
                      ⬇ [Hébergement Souverain]
                    </div>

                    <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-slate-450 text-white">
                      <div className="flex justify-between items-center mb-1 text-[10px] text-emerald-400 font-bold">
                        <span>Étape 3 : Génération IA</span>
                        <span>Mistral AI (SaaS / Europe)</span>
                      </div>
                      <p className="text-[11px]">Rapports de bulletin rédigés et envoyés de manière sécurisée en Europe.</p>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 5: TEACHER TESTIMONIALS
            ========================================================================= */}
        <section className="py-20 bg-slate-950 border-b border-slate-900 relative">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider mb-3">
                <CheckCircle className="w-3.5 h-3.5 text-blue-400" />
                Retours d'expérience
              </span>
              <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-white mb-4">
                Adopté par des centaines de professeurs
              </h2>
              <p className="text-slate-400 text-base">
                Découvrez comment vos collègues tirent parti d'apprecIAtion pour simplifier la clôture des trimestres.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {TESTIMONIALS.map((t) => (
                <div key={t.id} className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-700/85 transition-all">
                  <p className="text-slate-300 text-xs leading-relaxed font-light italic mb-6">
                    "{t.content}"
                  </p>
                  <div className="flex items-center gap-3">
                    <img 
                      src={t.avatarUrl} 
                      alt={t.author}
                      className="w-10 h-10 rounded-full object-cover border border-slate-800"
                    />
                    <div>
                      <h4 className="text-white font-semibold text-xs">{t.author}</h4>
                      <p className="text-slate-500 text-[10px]">{t.role} • <span className="text-blue-400">{t.school}</span></p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* =========================================================================
            SECTION 6: PRICING & DOWNLOAD PLANS (Merchant Section)
            ========================================================================= */}
        <Pricing 
          onLogin={(user) => setCurrentUser(user)}
          onOpenAccount={() => setShowAccountSpace(true)}
        />

        {/* =========================================================================
            SECTION 7: DETAILED FAQ ACCORDION
            ========================================================================= */}
        <section id="faq" className="py-20 bg-slate-900 border-b border-slate-900">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            
            <div className="text-center mb-14">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider mb-3">
                <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
                Vos questions fréquentes
              </span>
              <h2 className="text-3xl font-display font-bold text-white mb-4">
                Foire Aux Questions
              </h2>
              <p className="text-slate-400 text-xs">
                Vous avez des interrogations concernant la licence ou l'intégration ? Voici nos réponses.
              </p>
            </div>

            {/* Accordion List */}
            <div className="space-y-4">
              {FAQS.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div 
                    key={idx} 
                    className="bg-slate-950/80 border border-slate-800 rounded-xl overflow-hidden transition-colors"
                  >
                    <button
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 font-semibold text-white text-xs sm:text-sm hover:text-blue-400 transition-colors cursor-pointer"
                    >
                      <span>{faq.question}</span>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-blue-400 shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                      )}
                    </button>
                    
                    {isOpen && (
                      <div className="px-5 pb-5 pt-1 text-slate-400 text-xs sm:text-sm leading-relaxed font-light border-t border-slate-850/50 animate-in fade-in duration-300">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          </div>
        </section>

          </>
        )}

      </main>

      {/* 8. Elegant Footer */}
      <Footer />

    </div>
  );
}
