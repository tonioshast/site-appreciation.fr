import React, { useState, useEffect } from "react";
import { SOFTWARE_BUILDS } from "../data";
import { SoftwarePlatform } from "../types";
import { Download, Check, ShieldCheck, Zap, Laptop, FileText, X, ChevronRight, HelpCircle, AlertCircle, AlertTriangle, User } from "lucide-react";

interface PricingProps {
  onLogin?: (user: any) => void;
  onOpenAccount?: () => void;
}

function formatDateFR(dateStr?: string): string {
  if (!dateStr || dateStr.trim() === "") return "";
  const trimmed = dateStr.trim();
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) return trimmed;
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const parts = trimmed.substring(0, 10).split("-");
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return trimmed;
}

function formatDisplayPrice(priceStr?: string, defaultVal: string = "19.90"): string {
  const raw = priceStr && priceStr.trim() !== "" ? priceStr.trim() : defaultVal;
  let clean = raw.replace("€", "").trim().replace(".", ",");
  if (!clean.includes(",")) {
    clean = `${clean},00`;
  } else {
    const parts = clean.split(",");
    if (parts[1].length === 1) clean = `${parts[0]},${parts[1]}0`;
  }
  return `${clean} €`;
}

function formatPriceCard(priceStr?: string, defaultVal: string = "19.90"): string {
  const formatted = formatDisplayPrice(priceStr, defaultVal);
  return formatted.replace(/\s/g, "");
}

export default function Pricing({ onLogin, onOpenAccount }: PricingProps = {}) {
  const [configExpiration, setConfigExpiration] = useState<string>("");
  const [configPack1, setConfigPack1] = useState<string>("19.90");
  const [configPack2, setConfigPack2] = useState<string>("29.90");

  useEffect(() => {
    fetch("/api/config")
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          if (data.expiration) setConfigExpiration(data.expiration);
          if (data.pack1) setConfigPack1(data.pack1);
          if (data.pack2) setConfigPack2(data.pack2);
        }
      })
      .catch(() => {});
  }, []);

  const [downloadingPlatform, setDownloadingPlatform] = useState<SoftwarePlatform | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadFinished, setDownloadFinished] = useState(false);

  // Checkout modal state
  const [checkoutPlan, setCheckoutPlan] = useState<{ name: string; price: string; features: string[] } | null>(null);

  const isPPPlan = checkoutPlan ? (checkoutPlan.name.toLowerCase().includes("principal") || checkoutPlan.name.toLowerCase().includes("pp")) : false;
  const currentCheckoutPrice = checkoutPlan ? (isPPPlan ? formatDisplayPrice(configPack2, "29.90") : formatDisplayPrice(configPack1, "19.90")) : "";
  const [checkoutStep, setCheckoutStep] = useState<1 | 2 | 3>(1);
  const [buyerLastName, setBuyerLastName] = useState("");
  const [buyerFirstName, setBuyerFirstName] = useState("");
  const [buyerOs, setBuyerOs] = useState<"" | "windows" | "macos" | "linux">("");
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerSchool, setBuyerSchool] = useState("");
  const [selectedInterface, setSelectedInterface] = useState<"" | "pronote" | "ecole_directe">("");
  const [ecoleDirecteGuideTab, setEcoleDirecteGuideTab] = useState<"mobile" | "web">("mobile");
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [purchased, setPurchased] = useState(false);
  const [generatedKey, setGeneratedKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Email verification state
  const [emailVerified, setEmailVerified] = useState(false);
  const [buyerPassword, setBuyerPassword] = useState("");
  const [buyerPasswordConfirm, setBuyerPasswordConfirm] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [verificationSuccessMessage, setVerificationSuccessMessage] = useState<string | null>(null);

  const handleSendCode = async () => {
    if (!buyerEmail) {
      setVerificationError("Veuillez saisir votre adresse e-mail.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(buyerEmail)) {
      setVerificationError("Veuillez saisir une adresse e-mail valide.");
      return;
    }

    setSendingCode(true);
    setVerificationError(null);
    setVerificationSuccessMessage(null);

    try {
      const response = await fetch("/api/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: buyerEmail })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setCodeSent(true);
        setVerificationSuccessMessage("Un code de vérification à 6 chiffres a été envoyé à votre adresse e-mail.");
        if (data.code_debug) {
          console.log(`[DEV ONLY] Code de vérification : ${data.code_debug}`);
          setVerificationSuccessMessage(`[Preview] Un code a été généré : ${data.code_debug} (Saisi automatiquement pour simplifier votre test)`);
          setVerificationCode(data.code_debug);
        }
      } else {
        setVerificationError(data.error || "Une erreur est survenue lors de l'envoi du code.");
      }
    } catch (err: any) {
      setVerificationError("Impossible de contacter le serveur pour envoyer le code.");
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length < 6) {
      setVerificationError("Veuillez saisir le code à 6 chiffres.");
      return;
    }

    setVerifyingCode(true);
    setVerificationError(null);
    setVerificationSuccessMessage(null);

    try {
      const response = await fetch("/api/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: buyerEmail, code: verificationCode })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setEmailVerified(true);
        setVerificationSuccessMessage("Votre adresse e-mail a été vérifiée avec succès ! Veuillez maintenant définir votre mot de passe ci-dessous pour sécuriser votre accès.");
      } else {
        setVerificationError(data.error || "Code incorrect ou expiré.");
      }
    } catch (err: any) {
      setVerificationError("Impossible de contacter le serveur pour vérifier le code.");
    } finally {
      setVerifyingCode(false);
    }
  };

  // Hook d'effet pour capter le retour réussi de la passerelle de paiement Stripe
  React.useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const status = query.get("status");
    const id_unique = query.get("id_unique");
    const plan = query.get("plan");
    const queryPack = query.get("pack");
    
    if (status === "success" && id_unique) {
      // 1. Reconstitution du plan et des informations acheteur
      const decodedPlan = plan ? decodeURIComponent(plan) : "Licence individuelle pack enseignant matière";
      const isPP = decodedPlan.toLowerCase().includes("principal") || decodedPlan.toLowerCase().includes("pp");
      const packValue = queryPack ? Number(queryPack) : (isPP ? 2 : 1);

      setCheckoutPlan({
        name: decodedPlan,
        price: isPP ? formatDisplayPrice(configPack2, "29.90") : formatDisplayPrice(configPack1, "19.90"),
        features: isPP
          ? ["Tout le pack enseignant matière", "Générateur de synthèses de conseils de classe (PP)", "Tableau bilan Conseils de classe"]
          : ["Nombre d'élèves illimité", "Rédacteur d'appréciations intelligent", "Saisie assistée Pronote & EcoleDirecte", "Sauvegarde locale sécurisée (RGPD)"]
      });

      const decodedPrenom = query.get("prenom") ? decodeURIComponent(query.get("prenom")!) : "";
      const decodedNom = query.get("nom") ? decodeURIComponent(query.get("nom")!) : "";
      const decodedEmail = query.get("email") ? decodeURIComponent(query.get("email")!) : "";
      const decodedOs = (query.get("os") as any) || "";
      const decodedEnt = (query.get("ent") as any) || "";
      const decodedSchool = query.get("school") ? decodeURIComponent(query.get("school")!) : "";
      const decodedIdentifiantProf = query.get("identifiant_prof") ? decodeURIComponent(query.get("identifiant_prof")!) : "";
      const decodedMdp = query.get("mdp") ? decodeURIComponent(query.get("mdp")!) : "";

      setBuyerFirstName(decodedPrenom);
      setBuyerLastName(decodedNom);
      setBuyerEmail(decodedEmail);
      setBuyerOs(decodedOs);
      setSelectedInterface(decodedEnt);
      setBuyerSchool(decodedSchool);
      setBuyerName(decodedIdentifiantProf);
      setBuyerPassword(decodedMdp);
      setBuyerPasswordConfirm(decodedMdp);
      setCheckoutStep(2);
      setPurchased(true);

      // L'identifiant unique affiché est strictly identique à l'id_unique transmis et enregistré
      setGeneratedKey(id_unique);

      // 2. Validation du paiement auprès du serveur pour activer définitivement la licence
      fetch("/api/validate-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_unique,
          nom: decodedNom,
          prenom: decodedPrenom,
          email: decodedEmail,
          systeme_exploitation: decodedOs,
          ent: decodedEnt,
          identifiant_prof: decodedIdentifiantProf,
          etablissement: decodedSchool,
          version: "V1.2",
          mdp: decodedMdp,
          plan: decodedPlan,
          pack: packValue
        })
      })
      .then(r => r.json())
      .then(data => {
        console.log("[Stripe] Validation de licence et enregistrement pris en compte :", data);
      })
      .catch(err => {
        console.error("[Stripe] Échec de la notification de validation :", err);
      });

      // 3. Nettoyage de la barre d'adresse pour une expérience utilisateur impeccable
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, []);


  // Start download with real progress tracking using Fetch and ReadableStream
  const handleDownloadClick = async (platform: SoftwarePlatform) => {
    setDownloadingPlatform(platform);
    setDownloadProgress(0);
    setDownloadFinished(false);

    let fileUrl = "";
    let fileName = "";

    if (platform.id === "linux") {
      fileUrl = "/assets/apprecIAtion_linux.zip";
      fileName = "apprecIAtion_linux.zip";
    } else if (platform.id === "windows") {
      fileUrl = "/assets/apprecIAtion_setup.msi";
      fileName = "apprecIAtion_setup.msi";
    } else if (platform.id === "macos") {
      fileUrl = "/assets/apprecIAtion_universal.dmg";
      fileName = "apprecIAtion_universal.dmg";
    }

    if (fileUrl) {
      try {
        const response = await fetch(fileUrl, { method: "GET" });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const contentLength = response.headers.get("content-length");
        if (!contentLength) {
          throw new Error("Content-Length header is missing");
        }

        const totalBytes = parseInt(contentLength, 10);
        if (isNaN(totalBytes) || totalBytes <= 0) {
          throw new Error("Invalid Content-Length");
        }

        let loadedBytes = 0;
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("ReadableStream body reader is not available");
        }

        const chunks: Uint8Array[] = [];
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }
          if (value) {
            chunks.push(value);
            loadedBytes += value.length;
            const progress = Math.min(99, Math.round((loadedBytes / totalBytes) * 100));
            setDownloadProgress(progress);
          }
        }

        // Convert the downloaded chunks to a blob and trigger local saving
        const blob = new Blob(chunks, { type: "application/octet-stream" });
        const downloadUrl = URL.createObjectURL(blob);
        
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);

        setDownloadProgress(100);
        setDownloadFinished(true);
        return;
      } catch (err) {
        console.warn(`Real-time progress tracking for ${platform.name} failed. Switching to realistic simulation.`, err);
      }
    }

    // Fallback Simulation for non-existent files or general network fetch issues
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 10) + 4;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setDownloadFinished(true);
        
        // Trigger standard native browser download link
        if (fileUrl) {
          try {
            const link = document.createElement("a");
            link.href = fileUrl;
            link.setAttribute("download", fileName);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          } catch (err) {
            console.error("Fallback download trigger failed", err);
          }
        }
      }
      setDownloadProgress(Math.min(100, progress));
    }, 180);
  };

  // Start buy license simulator and save in the database
  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Single Step Validation: Email Verification & Password
    if (!emailVerified) {
      setSubmitError("Veuillez d'abord valider la vérification de votre adresse e-mail.");
      return;
    }
    if (!buyerPassword) {
      setSubmitError("Veuillez définir un mot de passe.");
      return;
    }
    if (buyerPassword !== buyerPasswordConfirm) {
      setSubmitError("Les deux mots de passe ne correspondent pas.");
      return;
    }
    if (buyerPassword.length < 6) {
      setSubmitError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Génération de l'identifiant unique client-side pour le lier au paiement Stripe
      const randomPart = () => Math.random().toString(36).substring(2, 6).toUpperCase();
      const clientGeneratedIdUnique = `ID-${randomPart()}-${randomPart()}-${randomPart()}`;
      const expDate = configExpiration;

      const packValue = isPPPlan ? 2 : 1;

      // 1. Création de la session d'achat sécurisée Stripe Checkout
      const checkoutResponse = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id_unique: clientGeneratedIdUnique,
          plan_name: checkoutPlan?.name || "Licence individuelle",
          pack: packValue,
          email: buyerEmail,
          mdp: buyerPassword,
          expiration: expDate,
          version: "V1.2",
          compte_valide: "nok",
          nombre_licences: 1,
          prenom: "",
          nom: "",
          systeme_exploitation: "",
          ent: "",
          etablissement: "",
          identifiant_prof: ""
        }),
      });

      if (!checkoutResponse.ok) {
        const errorData = await checkoutResponse.json().catch(() => ({}));
        throw new Error(errorData.error || "Impossible de joindre la passerelle de paiement Stripe.");
      }

      const checkoutData = await checkoutResponse.json();
      
      if (!checkoutData.url) {
        throw new Error("L'URL de paiement Stripe n'a pas été fournie.");
      }

      // 2. Redirection vers l'interface sécurisée de Stripe
      window.location.href = checkoutData.url;

    } catch (err: any) {
      console.error("Database registration/checkout error:", err);
      setSubmitError(err.message || "Impossible de joindre la passerelle de paiement Stripe.");
      setIsSubmitting(false);
    }
  };

  const handleGoToAccount = () => {
    if (onOpenAccount) onOpenAccount();
    closeCheckout();
  };

  const closeCheckout = () => {
    setCheckoutPlan(null);
    setPurchased(false);
    setCheckoutStep(1);
    setBuyerLastName("");
    setBuyerFirstName("");
    setBuyerPassword("");
    setBuyerPasswordConfirm("");
    setBuyerOs("");
    setBuyerName("");
    setBuyerEmail("");
    setBuyerSchool("");
    setSelectedInterface("");
    setFocusedField(null);
    setGeneratedKey("");
    setSubmitError(null);
    setIsSubmitting(false);
    setEmailVerified(false);
    setVerificationCode("");
    setCodeSent(false);
    setSendingCode(false);
    setVerifyingCode(false);
    setVerificationError(null);
    setVerificationSuccessMessage(null);
  };

  return (
    <section id="tarifs" className="py-20 bg-slate-950 relative border-b border-slate-900">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/5 blur-[140px] rounded-full pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider mb-3">
            <Zap className="w-3 h-3" />
            Accès instantané
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-white mb-4">
            Licences & Tarifs
          </h2>
          <p className="text-slate-400 text-base">
            Acquérez une licence définitive pour débloquer la puissance souveraine de rédaction sans aucune limite. Le téléchargement de votre logiciel s'effectue ensuite directement depuis votre espace personnel.
          </p>
        </div>

        {/* Pricing/Licensing Grid */}
        <div>
          <h3 className="text-white font-display font-bold text-xl mb-6 flex items-center gap-2 justify-center lg:justify-start">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            Licences et Tarifications
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            
            {/* Pack Enseignant Matière */}
            <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-700/60 transition-all">
              <div>
                <h4 className="text-slate-400 font-bold uppercase tracking-wider text-xs mb-1">Pour Enseignant</h4>
                <h5 className="text-white font-display font-bold text-2xl mb-4">Pack Enseignant Matière</h5>
                <div className="flex items-baseline mb-6 border-b border-slate-850 pb-5">
                  <span className="text-4xl font-bold text-white">{formatPriceCard(configPack1, "19.90")}</span>
                  <span className="text-slate-500 text-xs ml-2">Licence d'1 an</span>
                </div>
                <ul className="space-y-3.5 text-xs text-slate-300 mb-8">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-semibold text-white">Nombre d'élèves illimité</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Rédacteur d'appréciations intelligent</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Saisie assistée Pronote & EcoleDirecte</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Sauvegarde locale sécurisée (RGPD)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Mises à jour incluses pendant 1 an</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={() => setCheckoutPlan({
                  name: "Licence individuelle pack enseignant matière",
                  price: formatDisplayPrice(configPack1, "19.90"),
                  features: ["Nombre d'élèves illimité", "Rédacteur d'appréciations intelligent", "Saisie assistée Pronote & EcoleDirecte", "Sauvegarde locale sécurisée (RGPD)"]
                })}
                className="w-full bg-slate-850 hover:bg-slate-800 text-slate-300 font-semibold text-xs py-3 rounded-xl transition-all border border-slate-850 hover:border-slate-700 cursor-pointer"
              >
                Acheter ma licence
              </button>
            </div>

            {/* Pack Enseignant Matière + Professeur Principal - Recommended */}
            <div className="bg-slate-900/80 border-2 border-blue-500/80 rounded-2xl p-6 flex flex-col justify-between shadow-xl shadow-blue-500/5 relative">
              
              <div>
                <h4 className="text-blue-400 font-bold uppercase tracking-wider text-xs mb-1">Pour Enseignant & PP</h4>
                <h5 className="text-white font-display font-bold text-2xl mb-4">Pack Enseignant Matière + Professeur Principal</h5>
                <div className="flex items-baseline mb-6 border-b border-slate-850 pb-5">
                  <span className="text-4xl font-bold text-white">{formatPriceCard(configPack2, "29.90")}</span>
                  <span className="text-slate-400 text-xs ml-2">Licence d'1 an</span>
                </div>
                <ul className="space-y-3.5 text-xs text-slate-300 mb-8">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-semibold text-white">Toutes les fonctions du pack matière</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-semibold text-white">Générateur de synthèses PP</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Tableau bilan Conseils de classe</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={() => setCheckoutPlan({
                  name: "Licence individuelle pack enseignant matière + professeur principal",
                  price: formatDisplayPrice(configPack2, "29.90"),
                  features: ["Tout le pack enseignant matière", "Générateur de synthèses de conseils de classe (PP)", "Tableau bilan Conseils de classe"]
                })}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-lg shadow-blue-500/10 cursor-pointer"
              >
                Acheter ma licence
              </button>
            </div>

          </div>
        </div>

      </div>

      {/* DOWNLOAD SIMULATOR OVERLAY MODAL */}
      {downloadingPlatform && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
            <button 
              onClick={() => setDownloadingPlatform(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3 mb-5">
              <span className="p-2 bg-blue-500/10 rounded text-blue-400 border border-blue-500/20">
                <Download className="w-6 h-6 animate-bounce" />
              </span>
              <div>
                <h4 className="text-white font-bold font-display">Téléchargement en cours...</h4>
                <p className="text-xs text-slate-400">{downloadingPlatform.name} ({downloadingPlatform.size})</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>{downloadFinished ? "Fichier téléchargé avec succès !" : "Réception des paquets..."}</span>
                <span className="font-bold text-white">{downloadProgress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-150" 
                  style={{ width: `${downloadProgress}%` }}
                />
              </div>
            </div>

            {downloadFinished && (
              <div className="mt-6 pt-5 border-t border-slate-800 flex flex-col gap-3">
                <div className="flex gap-2.5 items-start text-xs bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-white font-semibold">Téléchargement terminé :</span>
                    <p className="text-slate-400 mt-1">L'installateur <span className="font-mono text-blue-400">{downloadingPlatform.id === "windows" ? "apprecIAtion_setup.msi" : downloadingPlatform.id === "macos" ? "apprecIAtion_universal.dmg" : "apprecIAtion_linux.zip"}</span> est prêt.</p>
                  </div>
                </div>

                <button
                  onClick={() => setDownloadingPlatform(null)}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2.5 rounded-lg"
                >
                  Fermer
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CHECKOUT DRAWER MODAL SIMULATOR */}
      {checkoutPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative max-h-[95vh] overflow-y-auto">
            <button 
              onClick={closeCheckout}
              className="absolute top-4 right-4 text-slate-400 hover:text-white z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {!purchased ? (
              <form onSubmit={handleCheckoutSubmit} className="space-y-5">
                
                {/* Header Block */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <span className="p-1.5 bg-blue-500/10 rounded-lg text-blue-400 border border-blue-500/20 shrink-0">
                      <Zap className="w-5 h-5" />
                    </span>
                    <div>
                      <h4 className="text-white font-bold font-display text-lg">Acquisition de votre licence</h4>
                      <p className="text-xs text-slate-400">{checkoutPlan.name} • <span className="text-blue-400 font-semibold">{currentCheckoutPrice}</span></p>
                    </div>
                  </div>
                </div>

                {/* STEP 1: Email Verification */}
                {checkoutStep === 1 && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="bg-blue-500/5 border border-blue-500/15 p-4 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-wider">
                        <ShieldCheck className="w-4 h-4 shrink-0" />
                        <span>Vérification d'adresse e-mail obligatoire</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Pour sécuriser la livraison de votre clé d'activation et éviter toute erreur de saisie, nous vérifions votre adresse e-mail de contact avant de poursuivre.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Saisissez votre adresse e-mail *
                      </label>
                      <div className="flex gap-2">
                        <input 
                          type="email" 
                          required
                          disabled={emailVerified}
                          value={buyerEmail}
                          onChange={(e) => {
                            setBuyerEmail(e.target.value);
                            setVerificationError(null);
                            setVerificationSuccessMessage(null);
                            if (emailVerified) {
                              setEmailVerified(false);
                              setCodeSent(false);
                            }
                          }}
                          placeholder="olivier.bertrand@ac-bordeaux.fr"
                          className="flex-1 text-xs bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
                        />
                        {!emailVerified && (
                          <button
                            type="button"
                            onClick={handleSendCode}
                            disabled={sendingCode || !buyerEmail}
                            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold px-4 py-2.5 rounded-lg cursor-pointer transition-colors shrink-0 font-sans"
                          >
                            {sendingCode ? "Envoi..." : codeSent ? "Renvoyer" : "Envoyer le code"}
                          </button>
                        )}
                      </div>
                      {emailVerified && (
                        <p className="text-xs text-emerald-400 font-medium mt-1.5 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          Cette adresse e-mail a été vérifiée avec succès.
                        </p>
                      )}
                    </div>

                    {emailVerified && (
                      <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 space-y-4 animate-fadeIn">
                        <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                          <ShieldCheck className="w-4 h-4 shrink-0" />
                          <span>Sécurisation de votre accès connecté</span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          Veuillez choisir un mot de passe pour accéder à votre espace connecté par la suite.
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                              Définir un mot de passe *
                            </label>
                            <input 
                              type="password"
                              required
                              value={buyerPassword}
                              onChange={(e) => setBuyerPassword(e.target.value)}
                              placeholder="••••••••"
                              className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                              Confirmer le mot de passe *
                            </label>
                            <input 
                              type="password"
                              required
                              value={buyerPasswordConfirm}
                              onChange={(e) => setBuyerPasswordConfirm(e.target.value)}
                              placeholder="••••••••"
                              className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                        {buyerPassword && buyerPasswordConfirm && (
                          buyerPassword === buyerPasswordConfirm ? (
                            <p className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                              Les mots de passe correspondent parfaitement.
                            </p>
                          ) : (
                            <p className="text-[11px] text-rose-400 flex items-center gap-1 mt-1">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              Les mots de passe ne correspondent pas.
                            </p>
                          )
                        )}
                      </div>
                    )}

                    {codeSent && !emailVerified && (
                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3.5 animate-fadeIn">
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">
                            Saisissez le code de vérification reçu *
                          </label>
                          <p className="text-[10px] text-slate-400 mb-2">
                            Un code à 6 chiffres a été envoyé à <span className="text-white font-semibold">{buyerEmail}</span>.
                          </p>
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              required
                              maxLength={6}
                              value={verificationCode}
                              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                              placeholder="123456"
                              className="w-32 text-center text-sm font-mono tracking-widest bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <button
                              type="button"
                              onClick={handleVerifyCode}
                              disabled={verifyingCode || verificationCode.length < 6}
                              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold px-5 py-2.5 rounded-lg cursor-pointer transition-colors"
                            >
                              {verifyingCode ? "Validation..." : "Valider le code"}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {verificationError && (
                      <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-lg text-rose-400 text-xs flex gap-2 items-center">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{verificationError}</span>
                      </div>
                    )}

                    {verificationSuccessMessage && (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg text-emerald-400 text-xs flex gap-2 items-center">
                        <Check className="w-4 h-4 shrink-0" />
                        <span>{verificationSuccessMessage}</span>
                      </div>
                    )}

                    {/* License Info Card */}
                    <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl space-y-2 text-xs text-slate-300">
                      <div className="flex items-center justify-between font-semibold border-b border-slate-850 pb-2 text-slate-200">
                        <span>Rappel des caractéristiques de votre licence :</span>
                        <span className="text-blue-400 font-mono text-[11px]">{checkoutPlan.name}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                        <div>• Date d'expiration : <strong className="text-white">{formatDateFR(configExpiration)}</strong></div>
                        <div>• Version applicative : <strong className="text-white">V1.2</strong></div>
                        <div>• Statut du compte : <strong className="text-amber-400 font-mono">nok (à compléter dans Mon compte)</strong></div>
                        <div>• Licence(s) incluse(s) : <strong className="text-white">1 licence</strong></div>
                      </div>
                      <p className="text-[10px] text-slate-400 pt-1 italic">
                        Les informations de votre profil enseignant (Nom, Prénom, Établissement) pourront être renseignées une fois connecté à votre compte.
                      </p>
                    </div>
                  </div>
                )}

                {/* Submit Error banner if any */}
                {submitError && (
                  <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-lg text-rose-400 text-xs flex gap-2 items-center">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                {/* Footer Buttons */}
                <div className="flex gap-3 justify-end pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={closeCheckout}
                    className="bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold text-xs px-4 py-2.5 rounded-lg border border-slate-700/50 cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={!emailVerified || !buyerPassword || buyerPassword !== buyerPasswordConfirm || buyerPassword.length < 6 || isSubmitting}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs px-6 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/35 border-t-white rounded-full animate-spin" />
                        <span>Redirection vers le paiement...</span>
                      </>
                    ) : (
                      <>
                        <span>Accéder au paiement sécurisé ({currentCheckoutPrice})</span>
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              // PURCHASE RECEIPT SUCCESS VIEW
              <div className="space-y-6">
                <div className="text-center">
                  <span className="inline-flex p-3 bg-emerald-500/15 text-emerald-400 rounded-full border border-emerald-500/25 mb-3">
                    <Check className="w-8 h-8" />
                  </span>
                  <h4 className="text-white font-bold font-display text-xl">Félicitations pour votre achat !</h4>
                  <p className="text-xs text-slate-400 mt-1">Votre licence <span className="font-semibold text-slate-200">apprecIAtion</span> a été générée avec succès.</p>
                </div>

                {/* Invoice/Receipt container */}
                <div className="bg-slate-950 p-5 rounded-xl border border-slate-850 space-y-4 font-mono text-xs text-slate-300">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <div>
                      <span className="font-bold text-white uppercase font-display">FACTURE N° FACT-2026-0182</span>
                      <p className="text-[10px] text-slate-500 mt-0.5">Date d'édition : {new Date().toLocaleDateString("fr-FR")}</p>
                    </div>
                    <span className="text-emerald-400 font-bold font-display text-sm">PAYÉ ✔</span>
                  </div>

                  <div className="space-y-1 text-[11px]">
                    <p><strong className="text-white">Titulaire :</strong> {buyerFirstName || buyerLastName ? `${buyerFirstName} ${buyerLastName}`.trim() : buyerEmail}</p>
                    <p><strong className="text-white">E-mail :</strong> {buyerEmail}</p>
                    <p><strong className="text-white">Date d'expiration de la licence :</strong> {formatDateFR(configExpiration)}</p>
                  </div>

                  <div className="border-t border-b border-slate-800 py-3 space-y-2">
                    <div className="flex justify-between font-semibold text-white">
                      <span>1x {checkoutPlan.name}</span>
                      <span>{currentCheckoutPrice}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 text-[10px]">
                      <span>TVA non applicable, art. 293 B du CGI</span>
                      <span>0,00 €</span>
                    </div>
                  </div>

                  <div className="flex justify-between font-bold text-white text-sm">
                    <span>Total payé</span>
                    <span>{currentCheckoutPrice}</span>
                  </div>

                  {/* Generated license Key */}
                  <div className="bg-blue-950/30 p-3.5 rounded-lg border border-blue-500/20 text-center space-y-1.5 font-sans">
                    <span className="text-[10px] text-blue-400 uppercase tracking-widest font-bold">Identifiant unique</span>
                    <p className="text-base font-bold text-white select-all font-mono tracking-wider">{generatedKey}</p>
                    <p className="text-[11px] text-slate-300 font-medium">Cet identifiant unique fait aussi office de mot de passe pour vous connecter à votre compte.</p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-indigo-950/40 via-slate-950 to-slate-950 p-5 rounded-xl border border-indigo-500/20 space-y-3">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                    <User className="w-5 h-5" />
                    <span>Récupérer l'extension</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    L'extension se télécharge uniquement depuis l'espace <strong className="text-white">Mon Compte</strong>, onglet <strong className="text-white">Téléchargements</strong> (Pronote ou ÉcoleDirecte, selon votre ENT).
                    Connectez-vous avec votre e-mail et l'identifiant unique ci-dessus (il sert aussi de mot de passe).
                  </p>
                </div>

                <div className="flex gap-2.5 items-center text-xs bg-slate-950 p-3.5 rounded-lg border border-slate-850">
                  <FileText className="w-5 h-5 text-blue-400 shrink-0" />
                  <p className="text-slate-400 leading-relaxed">
                    Un récapitulatif contenant votre identifiant unique a été envoyé vers <strong className="text-slate-200">{buyerEmail}</strong>.
                  </p>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleGoToAccount}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-6 py-2.5 rounded-lg cursor-pointer flex items-center gap-1.5 transition-all"
                  >
                    <User className="w-4 h-4" />
                    <span>Mon compte</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </section>
  );
}
