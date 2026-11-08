import React, { useState } from "react";
import Logo from "./Logo";
import { Menu, X, Shield, User } from "lucide-react";

interface HeaderProps {
  user: any;
  onOpenAccount: () => void;
  showAccountSpace: boolean;
  onCloseAccount: () => void;
}

export default function Header({ user, onOpenAccount, showAccountSpace, onCloseAccount }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Left: Brand Logo */}
        <button 
          onClick={onCloseAccount} 
          className="flex items-center gap-2 hover:opacity-90 transition-opacity bg-transparent border-none outline-none cursor-pointer text-left"
        >
          <Logo showSubtitle={false} size="sm" />
        </button>

        {/* Center: Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <button onClick={onCloseAccount} className="hover:text-blue-400 transition-colors bg-transparent border-none outline-none cursor-pointer">Accueil</button>
          <a href="#demo-video" onClick={onCloseAccount} className="hover:text-blue-400 transition-colors flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Démo Vidéo
          </a>
          <a href="#fonctionnalites" onClick={onCloseAccount} className="hover:text-blue-400 transition-colors">Fonctionnalités</a>
          <a href="#rgpd" onClick={onCloseAccount} className="hover:text-blue-400 transition-colors flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-blue-400" />
            Souveraineté & RGPD
          </a>
          <a href="#tarifs" onClick={onCloseAccount} className="hover:text-blue-400 transition-colors">Achat & Tarifs</a>
          <a href="#faq" onClick={onCloseAccount} className="hover:text-blue-400 transition-colors">FAQ</a>
        </nav>

        {/* Right: Actions */}
        <div className="hidden md:flex items-center gap-3">
          <button 
            onClick={onOpenAccount} 
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs px-4 py-2 rounded-lg transition-all duration-300 shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 hover:-translate-y-0.5 cursor-pointer"
          >
            <User className="w-4 h-4 text-blue-200" />
            Mon Compte
          </button>
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden">
          <button
            type="button"
            className="text-slate-400 hover:text-white"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-b border-slate-800 bg-slate-950 px-4 py-4 space-y-3 animate-in fade-in slide-in-from-top-5 duration-200">
          <button
            className="block w-full text-left text-base font-medium text-slate-300 hover:text-white bg-transparent border-none"
            onClick={() => { setIsOpen(false); onCloseAccount(); }}
          >
            Accueil
          </button>
          <a
            href="#demo-video"
            className="block text-base font-medium text-slate-300 hover:text-white"
            onClick={() => { setIsOpen(false); onCloseAccount(); }}
          >
            Démo Vidéo
          </a>
          <a
            href="#fonctionnalites"
            className="block text-base font-medium text-slate-300 hover:text-white"
            onClick={() => { setIsOpen(false); onCloseAccount(); }}
          >
            Fonctionnalités
          </a>
          <a
            href="#rgpd"
            className="block text-base font-medium text-slate-300 hover:text-white"
            onClick={() => { setIsOpen(false); onCloseAccount(); }}
          >
            Souveraineté & RGPD
          </a>
          <a
            href="#tarifs"
            className="block text-base font-medium text-slate-300 hover:text-white"
            onClick={() => { setIsOpen(false); onCloseAccount(); }}
          >
            Achat & Tarifs
          </a>
          <a
            href="#faq"
            className="block text-base font-medium text-slate-300 hover:text-white"
            onClick={() => { setIsOpen(false); onCloseAccount(); }}
          >
            FAQ
          </a>
          <div className="pt-2">
            <button
              onClick={() => { setIsOpen(false); onOpenAccount(); }}
              className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-2.5 rounded-lg text-sm cursor-pointer"
            >
              <User className="w-4 h-4" />
              Mon Compte
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
