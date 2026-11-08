import React from "react";
import Logo from "./Logo";
import { Shield, Sparkles, Heart } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* Logo Column */}
          <div className="md:col-span-2 space-y-4">
            <Logo showSubtitle={true} size="sm" className="!items-start" />
            <p className="text-xs text-slate-500 max-w-sm mt-3 leading-relaxed">
              L'assistant IA de rédaction souverain qui redonne du temps aux enseignants, tout en garantissant un respect absolu de la vie privée des élèves et de la législation française.
            </p>
          </div>

          {/* Quick Links Column */}
          <div>
            <h4 className="text-white font-display font-semibold text-xs uppercase tracking-wider mb-3">Navigation</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#accueil" className="hover:text-blue-400 transition-colors">Accueil</a></li>
              <li><a href="#demo-video" className="hover:text-blue-400 transition-colors">Démo Vidéo</a></li>
              <li><a href="#fonctionnalites" className="hover:text-blue-400 transition-colors">Fonctionnalités</a></li>
              <li><a href="#rgpd" className="hover:text-blue-400 transition-colors">Souveraineté & RGPD</a></li>
              <li><a href="#tarifs" className="hover:text-blue-400 transition-colors">Tarifs & Licences</a></li>
            </ul>
          </div>

          {/* Compliance Column */}
          <div className="space-y-3">
            <h4 className="text-white font-display font-semibold text-xs uppercase tracking-wider mb-1">Garanties</h4>
            <div className="flex gap-2 items-start text-xs bg-slate-900/40 p-3 rounded-lg border border-slate-850">
              <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Conforme au RGPD. Hébergement souverain européen. Zéro stockage permanent d'identité.
              </p>
            </div>
            <div className="flex gap-2 items-start text-xs bg-slate-900/40 p-3 rounded-lg border border-slate-850">
              <Sparkles className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Propulsé par l'IA française Mistral AI, certifiée conforme pour l'Éducation Nationale.
              </p>
            </div>
          </div>

        </div>

        {/* Lower row */}
        <div className="border-t border-slate-900 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {currentYear} apprecIAtion. Tous droits réservés.</p>
          <div className="flex gap-6">
            <a href="#tarifs" className="hover:text-slate-300 transition-colors">Mentions Légales</a>
            <a href="#rgpd" className="hover:text-slate-300 transition-colors">Politique RGPD</a>
            <a href="#tarifs" className="hover:text-slate-300 transition-colors">CGV / CGU</a>
          </div>
          <p className="flex items-center gap-1">
            Conçu avec <Heart className="w-3 h-3 text-red-500 fill-red-500" /> pour les enseignants français.
          </p>
        </div>

      </div>
    </footer>
  );
}
