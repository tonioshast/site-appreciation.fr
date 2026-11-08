import React, { useState, useEffect } from "react";
import { 
  User, 
  Lock, 
  Mail, 
  Download, 
  Database, 
  Save, 
  Check, 
  AlertCircle, 
  AlertTriangle,
  Shield, 
  Globe, 
  LogOut, 
  Copy, 
  ChevronRight, 
  Laptop, 
  FileText, 
  CheckCircle,
  ExternalLink,
  BookOpen,
  Plus,
  RefreshCw,
  Monitor,
  Terminal,
  Edit3,
  Trash2,
  Eye,
  Search,
  X,
  Sparkles,
  Tag,
  Filter
} from "lucide-react";
import { saveSession, clearSession, getSessionToken } from "../utils/session";

interface MyAccountProps {
  user: any;
  onLogin: (userData: any) => void;
  onLogout: () => void;
  onClose: () => void;
}

function formatDateFR(dateStr?: string, fallback: string = ""): string {
  if (!dateStr || dateStr.trim() === "") return fallback;
  const trimmed = dateStr.trim();

  // Match FR format DD/MM/YYYY
  const frMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (frMatch) {
    const day = frMatch[1].padStart(2, "0");
    const month = frMatch[2].padStart(2, "0");
    const year = frMatch[3];
    return `${day}/${month}/${year}`;
  }

  // Match ISO YYYY-MM-DD
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const year = isoMatch[1];
    const month = isoMatch[2];
    const day = isoMatch[3];
    return `${day}/${month}/${year}`;
  }

  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    const day = String(parsed.getDate()).padStart(2, "0");
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    const year = parsed.getFullYear();
    return `${day}/${month}/${year}`;
  }

  return trimmed;
}

export default function MyAccount({ user, onLogin, onLogout, onClose }: MyAccountProps) {
  const [configExpiration, setConfigExpiration] = useState<string>("");

  useEffect(() => {
    fetch("/api/config")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.expiration) {
          setConfigExpiration(data.expiration);
        }
      })
      .catch(() => {});
  }, []);

  // Login form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Edit profile states
  const [editNom, setEditNom] = useState(user?.nom || "");
  const [editPrenom, setEditPrenom] = useState(user?.prenom || "");
  const [editEmail, setEditEmail] = useState(user?.email || "");
  const [editMdp, setEditMdp] = useState("");
  const [editEnt, setEditEnt] = useState(user?.ent || "");
  const [editOs, setEditOs] = useState(user?.systeme_exploitation || "");
  const [editIdentifiantProf, setEditIdentifiantProf] = useState(user?.identifiant_prof || "");
  const [editEtablissement, setEditEtablissement] = useState(user?.etablissement || "");
  const [ecoleDirecteGuideTab, setEcoleDirecteGuideTab] = useState<"mobile" | "web">("mobile");
  const [focusedField, setFocusedField] = useState<string | null>(null);
  
  const [updateMessage, setUpdateMessage] = useState("");
  const [updateError, setUpdateError] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Email verification states for contact email change
  const [isEmailVerified, setIsEmailVerified] = useState(true);
  const [verificationCode, setVerificationCode] = useState("");
  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState("");
  const [verificationError, setVerificationError] = useState("");
  const [codeSent, setCodeSent] = useState(false);

  // Active dashboard tab state
  const [activeTab, setActiveTab] = useState<"profile" | "entLink" | "downloads" | "installation" | "database">("profile");

  // Active installation tab OS state
  const [installOsTab, setInstallOsTab] = useState<"windows" | "macos" | "linux">("windows");

  // Sync installOsTab when user's OS is loaded/changed
  React.useEffect(() => {
    if (user && user.systeme_exploitation) {
      const os = user.systeme_exploitation.toLowerCase();
      if (os === "windows" || os === "macos" || os === "linux") {
        setInstallOsTab(os as "windows" | "macos" | "linux");
      }
    }
  }, [user]);

  // Sync state if user changes
  React.useEffect(() => {
    if (user) {
      setEditNom(user.nom || "");
      setEditPrenom(user.prenom || "");
      setEditEmail(user.email || "");
      setEditMdp("");
      setEditEnt(user.ent || "");
      setEditOs(user.systeme_exploitation || "");
      setEditIdentifiantProf(user.identifiant_prof || "");
      setEditEtablissement(user.etablissement || "");
    }
  }, [user]);

  // Reset or set email verification state based on editEmail input
  React.useEffect(() => {
    if (user) {
      const currentEmail = (user.email || "").trim().toLowerCase();
      const inputEmail = (editEmail || "").trim().toLowerCase();
      if (inputEmail === currentEmail) {
        setIsEmailVerified(true);
        setCodeSent(false);
        setVerificationCode("");
        setVerificationMessage("");
        setVerificationError("");
      } else {
        setIsEmailVerified(false);
      }
    }
  }, [editEmail, user]);

  const handleSendCode = async () => {
    setVerificationMessage("");
    setVerificationError("");
    setSendingCode(true);
    try {
      const res = await fetch("/api/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: editEmail.trim() })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de l'envoi du code");
      }
      setCodeSent(true);
      setVerificationMessage(`Un code de vérification à 6 chiffres a été envoyé à ${editEmail}.`);
      if (data.code_debug) {
        setVerificationMessage(prev => `${prev} (Code de test local : ${data.code_debug})`);
      }
    } catch (err: any) {
      setVerificationError(err.message || "Erreur de connexion.");
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    setVerificationMessage("");
    setVerificationError("");
    setVerifyingCode(true);
    try {
      const res = await fetch("/api/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: editEmail.trim(), code: verificationCode.trim() })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Code incorrect ou expiré.");
      }
      setIsEmailVerified(true);
      setVerificationMessage("✓ Adresse e-mail de contact vérifiée avec succès ! Vous pouvez enregistrer vos modifications.");
    } catch (err: any) {
      setVerificationError(err.message || "Code incorrect ou expiré.");
    } finally {
      setVerifyingCode(false);
    }
  };

  // =========================================================================
  // PROMPTS MATIERE (POCKETBASE COLLECTION) STATES & LOGIC
  // =========================================================================
  const [promptsMatiereList, setPromptsMatiereList] = useState<any[]>([]);
  const [loadingPromptsMatiere, setLoadingPromptsMatiere] = useState<boolean>(false);
  const [promptsMatiereError, setPromptsMatiereError] = useState<string | null>(null);
  const [activePromptFilter, setActivePromptFilter] = useState<"all" | "officiel" | "personnel">("all");
  const [searchPromptQuery, setSearchPromptQuery] = useState<string>("");

  // Prompt Modal States
  const [showPromptModal, setShowPromptModal] = useState<boolean>(false);
  const [editingPrompt, setEditingPrompt] = useState<any | null>(null);
  const [promptNom, setPromptNom] = useState<string>("");
  const [promptDescription, setPromptDescription] = useState<string>("");
  const [promptTags, setPromptTags] = useState<string>("");
  const [promptText, setPromptText] = useState<string>("");
  const [promptJsonMode, setPromptJsonMode] = useState<boolean>(false);
  const [promptRawJsonText, setPromptRawJsonText] = useState<string>("");
  const [savingPrompt, setSavingPrompt] = useState<boolean>(false);
  const [promptModalError, setPromptModalError] = useState<string | null>(null);

  const [deletingPromptId, setDeletingPromptId] = useState<string | null>(null);
  const [viewingPrompt, setViewingPrompt] = useState<any | null>(null);
  const [copiedPromptStringId, setCopiedPromptStringId] = useState<string | number | null>(null);

  const getAuthToken = (): string => {
    if (user?.token) return user.token;
    if (user?.auth_token) return user.auth_token;
    if (user?.session_token) return user.session_token;

    const sessionTok = getSessionToken();
    if (sessionTok) return sessionTok;

    return "";
  };

  const fetchPromptsMatiere = async () => {
    setLoadingPromptsMatiere(true);
    setPromptsMatiereError(null);
    try {
      const token = getAuthToken();
      const userId = user?.id || user?.id_unique || "";
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      let records: any[] = [];

      // 1. Direct fetch to PocketBase (Primary for static hosting like o2switch)
      const pbUrl = "https://pb.appreciation.fr/api/collections/prompts_matiere/records?perPage=500&sort=-created";
      console.log("[MyAccount] Fetching direct PocketBase prompts_matiere with token:", token ? "YES" : "NO");

      try {
        const directRes = await fetch(pbUrl, { headers });
        if (directRes.ok) {
          const contentType = directRes.headers.get("content-type") || "";
          if (contentType.includes("application/json")) {
            const data = await directRes.json();
            if (Array.isArray(data.items)) {
              records = data.items;
              console.log("[MyAccount] Loaded", records.length, "prompts directly from PocketBase");
            }
          }
        } else {
          console.warn("[MyAccount] Direct PocketBase fetch non-ok status:", directRes.status);
        }
      } catch (directErr) {
        console.warn("[MyAccount] Direct PocketBase fetch failed:", directErr);
      }

      // 2. Secondary fallback: Express backend proxy if available AND returning JSON (e.g. dev mode)
      if (records.length === 0) {
        try {
          const proxyRes = await fetch(`/api/prompts-matiere?userId=${encodeURIComponent(userId)}`, { headers });
          const contentType = proxyRes.headers.get("content-type") || "";
          if (proxyRes.ok && contentType.includes("application/json")) {
            const data = await proxyRes.json();
            if (data.success && Array.isArray(data.items)) {
              records = data.items;
              console.log("[MyAccount] Loaded", records.length, "prompts via Express proxy");
            }
          }
        } catch (proxyErr) {
          console.warn("[MyAccount] Proxy /api/prompts-matiere failed:", proxyErr);
        }
      }

      setPromptsMatiereList(records);

      if (records.length === 0 && !token) {
        setPromptsMatiereError("Session non authentifiée : aucun jeton trouvé. Veuillez vous déconnecter et vous reconnecter à votre compte.");
      }
    } catch (err: any) {
      console.error("[MyAccount] fetchPromptsMatiere error:", err);
      setPromptsMatiereError(err.message || "Erreur de connexion lors du chargement des prompts.");
    } finally {
      setLoadingPromptsMatiere(false);
    }
  };

  React.useEffect(() => {
    if (activeTab === "database") {
      fetchPromptsMatiere();
      fetchItems();
      fetchPromptsSynthese();
    }
  }, [user, activeTab]);

  const parsePromptItem = (item: any) => {
    if (!item) {
      return { id: "unknown", nom: "Prompt sans nom", isOfficiel: false, user: "", text: "", description: "", tags: [], contenuObj: {}, rawItem: {} };
    }

    const isOfficiel = item.officiel === true || item.officiel === "true" || item.officiel === 1 || String(item.officiel) === "true";
    let text = "";
    let description = item.description || "";
    let tags: string[] = Array.isArray(item.tags) ? item.tags : [];

    let raw = item.contenu;
    if (typeof raw === "string") {
      const trimmed = raw.trim();
      if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === "object") {
            raw = parsed;
          } else {
            text = raw;
          }
        } catch {
          text = raw;
        }
      } else {
        text = raw;
      }
    }

    if (raw && typeof raw === "object") {
      description = raw.description || item.description || description;
      if (Array.isArray(raw.tags)) {
        tags = raw.tags.map((t: any) => String(t));
      } else if (typeof raw.tags === "string") {
        tags = raw.tags.split(",").map((t: string) => t.trim()).filter(Boolean);
      }

      if (typeof raw.template === "string" && raw.template.trim()) {
        text = raw.template;
      } else if (typeof raw.text === "string" && raw.text.trim()) {
        text = raw.text;
      } else if (typeof raw.content === "string" && raw.content.trim()) {
        text = raw.content;
      } else if (typeof raw.prompt === "string" && raw.prompt.trim()) {
        text = raw.prompt;
      } else if (typeof raw.consigne === "string" && raw.consigne.trim()) {
        text = raw.consigne;
      } else if (typeof raw.body === "string" && raw.body.trim()) {
        text = raw.body;
      } else if (typeof raw.prompt_text === "string" && raw.prompt_text.trim()) {
        text = raw.prompt_text;
      } else {
        try {
          text = JSON.stringify(raw, null, 2);
        } catch {
          text = String(raw);
        }
      }
    }

    if (!text && typeof item.content === "string") {
      text = item.content;
    }

    return {
      id: item.id || Math.random().toString(),
      nom: item.nom || item.title || item.name || "prompt_matiere.json",
      isOfficiel,
      user: item.user || "",
      text: text || "(Contenu du prompt)",
      description: description,
      tags: tags,
      contenuObj: typeof raw === "object" && raw !== null ? raw : { text: text || raw },
      rawItem: item
    };
  };

  const openCreatePromptModal = () => {
    setEditingPrompt(null);
    setPromptNom("nouveau_prompt.json");
    setPromptDescription("");
    setPromptTags("");
    setPromptText("");
    setPromptJsonMode(false);
    setPromptRawJsonText(JSON.stringify({ text: "", description: "", tags: [] }, null, 2));
    setPromptModalError(null);
    setShowPromptModal(true);
  };

  const openEditPromptModal = (item: any) => {
    const parsed = parsePromptItem(item);
    if (parsed.isOfficiel) {
      alert("Les prompts officiels sont en lecture seule.");
      return;
    }

    setEditingPrompt(item);
    setPromptNom(parsed.nom);
    setPromptDescription(parsed.description);
    setPromptTags(parsed.tags.join(", "));
    setPromptText(parsed.text);
    setPromptJsonMode(false);
    setPromptRawJsonText(JSON.stringify(parsed.contenuObj, null, 2));
    setPromptModalError(null);
    setShowPromptModal(true);
  };

  const duplicatePromptToPersonal = (item: any) => {
    const parsed = parsePromptItem(item);
    setEditingPrompt(null);
    setPromptNom(`${parsed.nom.replace(/\.json$/i, "")}_copie.json`);
    setPromptDescription(parsed.description);
    setPromptTags(parsed.tags.join(", "));
    setPromptText(parsed.text);
    setPromptJsonMode(false);
    setPromptRawJsonText(JSON.stringify(parsed.contenuObj, null, 2));
    setPromptModalError(null);
    setShowPromptModal(true);
  };

  const handleSavePrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptNom.trim()) {
      setPromptModalError("Le nom du prompt est obligatoire.");
      return;
    }

    setSavingPrompt(true);
    setPromptModalError(null);

    let finalContenu: any = {};
    if (promptJsonMode) {
      try {
        finalContenu = JSON.parse(promptRawJsonText);
      } catch {
        setPromptModalError("Le format du JSON est invalide. Veuillez vérifier les guillemets et virgules.");
        setSavingPrompt(false);
        return;
      }
    } else {
      if (!promptText.trim()) {
        setPromptModalError("Le contenu du prompt est obligatoire.");
        setSavingPrompt(false);
        return;
      }
      const tagArray = promptTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      finalContenu = {
        text: promptText.trim(),
        description: promptDescription.trim(),
        tags: tagArray
      };
    }

    const token = getAuthToken();
    const userId = user?.id || user?.id_unique || "";

    const headers: Record<string, string> = {
      "Content-Type": "application/json"
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      if (editingPrompt) {
        // Enforce rule: officiel prompts cannot be updated
        const parsedEditing = parsePromptItem(editingPrompt);
        if (parsedEditing.isOfficiel) {
          throw new Error("Action interdite : Les prompts officiels sont strictement en lecture seule.");
        }

        // PATCH https://pb.appreciation.fr/api/collections/prompts_matiere/records/:id
        const patchUrl = `https://pb.appreciation.fr/api/collections/prompts_matiere/records/${editingPrompt.id}`;
        const payload = {
          nom: promptNom.trim(),
          contenu: finalContenu
        };

        let patchRes = await fetch(patchUrl, {
          method: "PATCH",
          headers,
          body: JSON.stringify(payload)
        }).catch(() => null);

        if (!patchRes || !patchRes.ok) {
          const proxyRes = await fetch(`/api/prompts-matiere/${editingPrompt.id}`, {
            method: "PUT",
            headers,
            body: JSON.stringify(payload)
          });
          const data = await proxyRes.json();
          if (!proxyRes.ok || !data.success) {
            throw new Error(data.error || "Erreur lors de la modification du prompt.");
          }
        }
      } else {
        // Create prompt: try direct PocketBase POST first for static environments (o2switch)
        const postUrl = "https://pb.appreciation.fr/api/collections/prompts_matiere/records";
        const payload: any = {
          nom: promptNom.trim(),
          contenu: finalContenu,
          officiel: false
        };
        if (userId) payload.user = userId;

        let created = false;
        let directErrMsg = "";

        try {
          const postRes = await fetch(postUrl, {
            method: "POST",
            headers,
            body: JSON.stringify(payload)
          });
          if (postRes.ok) {
            created = true;
          } else {
            const directData = await postRes.json().catch(() => null);
            directErrMsg = directData?.message || directData?.error || "";
            console.warn("[MyAccount] Direct PB POST non-ok:", directData);
          }
        } catch (postErr) {
          console.warn("[MyAccount] Direct PB POST failed:", postErr);
        }

        if (!created) {
          // Fallback to Express backend proxy if available AND returning JSON (e.g. dev mode)
          const proxyRes = await fetch("/api/prompts-matiere", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              nom: promptNom.trim(),
              contenu: finalContenu,
              user: userId
            })
          }).catch(() => null);

          const contentType = proxyRes?.headers.get("content-type") || "";
          if (proxyRes && proxyRes.ok && contentType.includes("application/json")) {
            const data = await proxyRes.json().catch(() => null);
            if (!data?.success) {
              throw new Error(data?.error || directErrMsg || "Erreur lors de la création du prompt.");
            }
          } else if (directErrMsg) {
            throw new Error(directErrMsg);
          } else if (!proxyRes?.ok) {
            throw new Error("Erreur lors de la création du prompt dans la base de données.");
          }
        }
      }

      setShowPromptModal(false);
      await fetchPromptsMatiere();
    } catch (err: any) {
      setPromptModalError(err.message || "Une erreur est survenue lors de l'enregistrement.");
    } finally {
      setSavingPrompt(false);
    }
  };

  const handleDeletePrompt = async (item: any) => {
    const parsed = parsePromptItem(item);
    if (parsed.isOfficiel) {
      alert("Les prompts officiels sont en lecture seule et ne peuvent pas être supprimés.");
      return;
    }

    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer le prompt "${parsed.nom}" ?`)) {
      return;
    }

    setDeletingPromptId(parsed.id);
    const token = getAuthToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      // DELETE https://pb.appreciation.fr/api/collections/prompts_matiere/records/:id
      const deleteUrl = `https://pb.appreciation.fr/api/collections/prompts_matiere/records/${parsed.id}`;
      let res = await fetch(deleteUrl, {
        method: "DELETE",
        headers
      }).catch(() => null);

      if (!res || !res.ok) {
        const proxyRes = await fetch(`/api/prompts-matiere/${parsed.id}`, {
          method: "DELETE",
          headers
        }).catch(() => null);
        const contentType = proxyRes?.headers.get("content-type") || "";
        if (proxyRes && proxyRes.ok && contentType.includes("application/json")) {
          const data = await proxyRes.json().catch(() => null);
          if (!data?.success) {
            throw new Error(data?.error || "Erreur lors de la suppression.");
          }
        } else if (!res?.ok) {
          throw new Error("Erreur lors de la suppression du prompt.");
        }
      }

      await fetchPromptsMatiere();
    } catch (err: any) {
      alert(err.message || "Erreur lors de la suppression du prompt.");
    } finally {
      setDeletingPromptId(null);
    }
  };

  const handleCopyPromptText = (text: string, id: string | number) => {
    navigator.clipboard.writeText(text);
    setCopiedPromptStringId(id);
    setTimeout(() => setCopiedPromptStringId(null), 2000);
  };

  // =========================================================================
  // ITEMS / GRILLES D'ITEMS (POCKETBASE COLLECTION) STATES & LOGIC
  // =========================================================================
  const [dbCategory, setDbCategory] = useState<"prompts" | "items" | "synthese">("prompts");
  const [itemsList, setItemsList] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState<boolean>(false);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [activeItemFilter, setActiveItemFilter] = useState<"all" | "officiel" | "personnel">("all");
  const [searchItemQuery, setSearchItemQuery] = useState<string>("");

  // Item Modal States
  const [showItemModal, setShowItemModal] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [itemNom, setItemNom] = useState<string>("");
  const [itemDescription, setItemDescription] = useState<string>("");
  const [itemTags, setItemTags] = useState<string>("");
  const [itemText, setItemText] = useState<string>("");
  const [itemJsonMode, setItemJsonMode] = useState<boolean>(false);
  const [itemRawJsonText, setItemRawJsonText] = useState<string>("");
  const [savingItem, setSavingItem] = useState<boolean>(false);
  const [itemModalError, setItemModalError] = useState<string | null>(null);

  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [viewingItem, setViewingItem] = useState<any | null>(null);
  const [copiedItemStringId, setCopiedItemStringId] = useState<string | number | null>(null);

  const fetchItems = async () => {
    setLoadingItems(true);
    setItemsError(null);
    try {
      const token = getAuthToken();
      const userId = user?.id || user?.id_unique || "";
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      let records: any[] = [];

      // 1. Direct fetch to PocketBase (Primary for static hosting like o2switch)
      const pbUrl = "https://pb.appreciation.fr/api/collections/items/records?perPage=500&sort=-created";
      console.log("[MyAccount] Fetching direct PocketBase items with token:", token ? "YES" : "NO");

      try {
        const directRes = await fetch(pbUrl, { headers });
        if (directRes.ok) {
          const contentType = directRes.headers.get("content-type") || "";
          if (contentType.includes("application/json")) {
            const data = await directRes.json();
            if (Array.isArray(data.items)) {
              records = data.items;
              console.log("[MyAccount] Loaded", records.length, "items directly from PocketBase");
            }
          }
        } else {
          console.warn("[MyAccount] Direct PocketBase items fetch non-ok status:", directRes.status);
        }
      } catch (directErr) {
        console.warn("[MyAccount] Direct PocketBase items fetch failed:", directErr);
      }

      // 2. Secondary fallback: Express backend proxy if available
      if (records.length === 0) {
        try {
          const proxyRes = await fetch(`/api/items?userId=${encodeURIComponent(userId)}`, { headers });
          const contentType = proxyRes.headers.get("content-type") || "";
          if (proxyRes.ok && contentType.includes("application/json")) {
            const data = await proxyRes.json();
            if (data.success && Array.isArray(data.items)) {
              records = data.items;
              console.log("[MyAccount] Loaded", records.length, "items via Express proxy");
            }
          }
        } catch (proxyErr) {
          console.warn("[MyAccount] Proxy /api/items failed:", proxyErr);
        }
      }

      setItemsList(records);

      if (records.length === 0 && !token) {
        setItemsError("Session non authentifiée : aucun jeton trouvé. Veuillez vous déconnecter et vous reconnecter à votre compte.");
      }
    } catch (err: any) {
      console.error("[MyAccount] fetchItems error:", err);
      setItemsError(err.message || "Erreur de connexion lors du chargement des grilles d'items.");
    } finally {
      setLoadingItems(false);
    }
  };

  const parseItemRecord = (item: any) => {
    if (!item) {
      return { id: "unknown", nom: "Grille d'items sans nom", isOfficiel: false, user: "", text: "", description: "", tags: [], contenuObj: {}, rawItem: {} };
    }

    const isOfficiel = item.officiel === true || item.officiel === "true" || item.officiel === 1 || String(item.officiel) === "true";
    let text = "";
    let description = item.description || "";
    let tags: string[] = Array.isArray(item.tags) ? item.tags : [];

    let raw = item.contenu;
    if (typeof raw === "string") {
      const trimmed = raw.trim();
      if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === "object") {
            raw = parsed;
          } else {
            text = raw;
          }
        } catch {
          text = raw;
        }
      } else {
        text = raw;
      }
    }

    if (raw && typeof raw === "object") {
      description = raw.description || item.description || description;
      if (Array.isArray(raw.tags)) {
        tags = raw.tags.map((t: any) => String(t));
      } else if (typeof raw.tags === "string") {
        tags = raw.tags.split(",").map((t: string) => t.trim()).filter(Boolean);
      }

      if (typeof raw.template === "string" && raw.template.trim()) {
        text = raw.template;
      } else if (typeof raw.text === "string" && raw.text.trim()) {
        text = raw.text;
      } else if (typeof raw.content === "string" && raw.content.trim()) {
        text = raw.content;
      } else if (typeof raw.grille === "string" && raw.grille.trim()) {
        text = raw.grille;
      } else if (typeof raw.body === "string" && raw.body.trim()) {
        text = raw.body;
      } else {
        try {
          text = JSON.stringify(raw, null, 2);
        } catch {
          text = String(raw);
        }
      }
    }

    if (!text && typeof item.content === "string") {
      text = item.content;
    }

    return {
      id: item.id || Math.random().toString(),
      nom: item.nom || item.title || item.name || "grille_item.json",
      isOfficiel,
      user: item.user || "",
      text: text || "(Contenu de la grille d'items)",
      description: description,
      tags: tags,
      contenuObj: typeof raw === "object" && raw !== null ? raw : { text: text || raw },
      rawItem: item
    };
  };

  const openCreateItemModal = () => {
    setEditingItem(null);
    setItemNom("nouvelle_grille_items.json");
    setItemDescription("");
    setItemTags("");
    setItemText("");
    setItemJsonMode(false);
    setItemRawJsonText(JSON.stringify({ text: "", description: "", tags: [] }, null, 2));
    setItemModalError(null);
    setShowItemModal(true);
  };

  const openEditItemModal = (item: any) => {
    const parsed = parseItemRecord(item);
    if (parsed.isOfficiel) {
      alert("Les grilles d'items officielles sont en lecture seule.");
      return;
    }

    setEditingItem(item);
    setItemNom(parsed.nom);
    setItemDescription(parsed.description);
    setItemTags(parsed.tags.join(", "));
    setItemText(parsed.text);
    setItemJsonMode(false);
    setItemRawJsonText(JSON.stringify(parsed.contenuObj, null, 2));
    setItemModalError(null);
    setShowItemModal(true);
  };

  const duplicateItemToPersonal = (item: any) => {
    const parsed = parseItemRecord(item);
    setEditingItem(null);
    setItemNom(`${parsed.nom.replace(/\.json$/i, "")}_copie.json`);
    setItemDescription(parsed.description);
    setItemTags(parsed.tags.join(", "));
    setItemText(parsed.text);
    setItemJsonMode(false);
    setItemRawJsonText(JSON.stringify(parsed.contenuObj, null, 2));
    setItemModalError(null);
    setShowItemModal(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemNom.trim()) {
      setItemModalError("Le nom de la grille d'items est obligatoire.");
      return;
    }

    setSavingItem(true);
    setItemModalError(null);

    let finalContenu: any = {};
    if (itemJsonMode) {
      try {
        finalContenu = JSON.parse(itemRawJsonText);
      } catch {
        setItemModalError("Le format du JSON est invalide. Veuillez vérifier les guillemets et virgules.");
        setSavingItem(false);
        return;
      }
    } else {
      if (!itemText.trim()) {
        setItemModalError("Le contenu de la grille d'items est obligatoire.");
        setSavingItem(false);
        return;
      }
      const tagArray = itemTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      finalContenu = {
        text: itemText.trim(),
        description: itemDescription.trim(),
        tags: tagArray
      };
    }

    const token = getAuthToken();
    const userId = user?.id || user?.id_unique || "";

    const headers: Record<string, string> = {
      "Content-Type": "application/json"
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      if (editingItem) {
        const parsedEditing = parseItemRecord(editingItem);
        if (parsedEditing.isOfficiel) {
          throw new Error("Action interdite : Les grilles d'items officielles sont strictement en lecture seule.");
        }

        const patchUrl = `https://pb.appreciation.fr/api/collections/items/records/${editingItem.id}`;
        const payload = {
          nom: itemNom.trim(),
          contenu: finalContenu
        };

        let patchRes = await fetch(patchUrl, {
          method: "PATCH",
          headers,
          body: JSON.stringify(payload)
        }).catch(() => null);

        if (!patchRes || !patchRes.ok) {
          const proxyRes = await fetch(`/api/items/${editingItem.id}`, {
            method: "PUT",
            headers,
            body: JSON.stringify(payload)
          });
          const data = await proxyRes.json();
          if (!proxyRes.ok || !data.success) {
            throw new Error(data.error || "Erreur lors de la modification de la grille d'items.");
          }
        }
      } else {
        const postUrl = "https://pb.appreciation.fr/api/collections/items/records";
        const payload: any = {
          nom: itemNom.trim(),
          contenu: finalContenu,
          officiel: false
        };
        if (userId) payload.user = userId;

        let created = false;
        let directErrMsg = "";

        try {
          const postRes = await fetch(postUrl, {
            method: "POST",
            headers,
            body: JSON.stringify(payload)
          });
          if (postRes.ok) {
            created = true;
          } else {
            const directData = await postRes.json().catch(() => null);
            directErrMsg = directData?.message || directData?.error || "";
            console.warn("[MyAccount] Direct PB POST items non-ok:", directData);
          }
        } catch (postErr) {
          console.warn("[MyAccount] Direct PB POST items failed:", postErr);
        }

        if (!created) {
          const proxyRes = await fetch("/api/items", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              nom: itemNom.trim(),
              contenu: finalContenu,
              user: userId
            })
          }).catch(() => null);

          const contentType = proxyRes?.headers.get("content-type") || "";
          if (proxyRes && proxyRes.ok && contentType.includes("application/json")) {
            const data = await proxyRes.json().catch(() => null);
            if (!data?.success) {
              throw new Error(data?.error || directErrMsg || "Erreur lors de la création de la grille d'items.");
            }
          } else if (directErrMsg) {
            throw new Error(directErrMsg);
          } else if (!proxyRes?.ok) {
            throw new Error("Erreur lors de la création de la grille d'items dans la base de données.");
          }
        }
      }

      setShowItemModal(false);
      await fetchItems();
    } catch (err: any) {
      setItemModalError(err.message || "Une erreur est survenue lors de l'enregistrement.");
    } finally {
      setSavingItem(false);
    }
  };

  const handleDeleteItem = async (item: any) => {
    const parsed = parseItemRecord(item);
    if (parsed.isOfficiel) {
      alert("Les grilles d'items officielles sont en lecture seule et ne peuvent pas être supprimées.");
      return;
    }

    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer la grille d'items "${parsed.nom}" ?`)) {
      return;
    }

    setDeletingItemId(parsed.id);
    const token = getAuthToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const deleteUrl = `https://pb.appreciation.fr/api/collections/items/records/${parsed.id}`;
      let res = await fetch(deleteUrl, {
        method: "DELETE",
        headers
      }).catch(() => null);

      if (!res || !res.ok) {
        const proxyRes = await fetch(`/api/items/${parsed.id}`, {
          method: "DELETE",
          headers
        }).catch(() => null);
        const contentType = proxyRes?.headers.get("content-type") || "";
        if (proxyRes && proxyRes.ok && contentType.includes("application/json")) {
          const data = await proxyRes.json().catch(() => null);
          if (!data?.success) {
            throw new Error(data?.error || "Erreur lors de la suppression.");
          }
        } else if (!res?.ok) {
          throw new Error("Erreur lors de la suppression de la grille d'items.");
        }
      }

      await fetchItems();
    } catch (err: any) {
      alert(err.message || "Erreur lors de la suppression de la grille d'items.");
    } finally {
      setDeletingItemId(null);
    }
  };

  const handleCopyItemText = (text: string, id: string | number) => {
    navigator.clipboard.writeText(text);
    setCopiedItemStringId(id);
    setTimeout(() => setCopiedItemStringId(null), 2000);
  };

  // =========================================================================
  // PROMPTS SYNTHESE (POCKETBASE COLLECTION) STATES & LOGIC
  // =========================================================================
  const [promptsSyntheseList, setPromptsSyntheseList] = useState<any[]>([]);
  const [loadingPromptsSynthese, setLoadingPromptsSynthese] = useState<boolean>(false);
  const [promptsSyntheseError, setPromptsSyntheseError] = useState<string | null>(null);
  const [activeSyntheseFilter, setActiveSyntheseFilter] = useState<"all" | "officiel" | "personnel">("all");
  const [searchSyntheseQuery, setSearchSyntheseQuery] = useState<string>("");

  // Prompts Synthese Modal States
  const [showSyntheseModal, setShowSyntheseModal] = useState<boolean>(false);
  const [editingSynthese, setEditingSynthese] = useState<any | null>(null);
  const [syntheseNom, setSyntheseNom] = useState<string>("");
  const [syntheseDescription, setSyntheseDescription] = useState<string>("");
  const [syntheseTags, setSyntheseTags] = useState<string>("");
  const [syntheseText, setSyntheseText] = useState<string>("");
  const [syntheseJsonMode, setSyntheseJsonMode] = useState<boolean>(false);
  const [syntheseRawJsonText, setSyntheseRawJsonText] = useState<string>("");
  const [savingSynthese, setSavingSynthese] = useState<boolean>(false);
  const [syntheseModalError, setSyntheseModalError] = useState<string | null>(null);

  const [deletingSyntheseId, setDeletingSyntheseId] = useState<string | null>(null);
  const [viewingSynthese, setViewingSynthese] = useState<any | null>(null);
  const [copiedSyntheseStringId, setCopiedSyntheseStringId] = useState<string | number | null>(null);

  const fetchPromptsSynthese = async () => {
    setLoadingPromptsSynthese(true);
    setPromptsSyntheseError(null);
    try {
      const token = getAuthToken();
      const userId = user?.id || user?.id_unique || "";
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      let records: any[] = [];

      // 1. Direct fetch to PocketBase
      const pbUrl = "https://pb.appreciation.fr/api/collections/prompts_synthese/records?perPage=500&sort=-created";
      console.log("[MyAccount] Fetching direct PocketBase prompts_synthese with token:", token ? "YES" : "NO");

      try {
        const directRes = await fetch(pbUrl, { headers });
        if (directRes.ok) {
          const contentType = directRes.headers.get("content-type") || "";
          if (contentType.includes("application/json")) {
            const data = await directRes.json();
            if (Array.isArray(data.items)) {
              records = data.items;
              console.log("[MyAccount] Loaded", records.length, "prompts_synthese directly from PocketBase");
            }
          }
        } else {
          console.warn("[MyAccount] Direct PocketBase prompts_synthese fetch status:", directRes.status);
        }
      } catch (directErr) {
        console.warn("[MyAccount] Direct PocketBase prompts_synthese fetch failed:", directErr);
      }

      // 2. Secondary fallback: Express proxy
      if (records.length === 0) {
        try {
          const proxyRes = await fetch(`/api/prompts-synthese?userId=${encodeURIComponent(userId)}`, { headers });
          const contentType = proxyRes.headers.get("content-type") || "";
          if (proxyRes.ok && contentType.includes("application/json")) {
            const data = await proxyRes.json();
            if (data.success && Array.isArray(data.items)) {
              records = data.items;
              console.log("[MyAccount] Loaded", records.length, "prompts_synthese via Express proxy");
            }
          }
        } catch (proxyErr) {
          console.warn("[MyAccount] Proxy /api/prompts-synthese failed:", proxyErr);
        }
      }

      setPromptsSyntheseList(records);

      if (records.length === 0 && !token) {
        setPromptsSyntheseError("Session non authentifiée : aucun jeton trouvé. Veuillez vous déconnecter et vous reconnecter à votre compte.");
      }
    } catch (err: any) {
      console.error("[MyAccount] fetchPromptsSynthese error:", err);
      setPromptsSyntheseError(err.message || "Erreur de connexion lors du chargement des prompts de synthèse.");
    } finally {
      setLoadingPromptsSynthese(false);
    }
  };

  const parseSyntheseItem = (item: any) => {
    if (!item) {
      return { id: "unknown", nom: "Prompt de synthèse sans nom", isOfficiel: false, user: "", text: "", description: "", tags: [], contenuObj: {}, rawItem: {} };
    }

    const isOfficiel = item.officiel === true || item.officiel === "true" || item.officiel === 1 || String(item.officiel) === "true";
    let text = "";
    let description = item.description || "";
    let tags: string[] = Array.isArray(item.tags) ? item.tags : [];

    let raw = item.contenu;
    if (typeof raw === "string") {
      const trimmed = raw.trim();
      if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === "object") {
            raw = parsed;
          } else {
            text = raw;
          }
        } catch {
          text = raw;
        }
      } else {
        text = raw;
      }
    }

    if (raw && typeof raw === "object") {
      description = raw.description || item.description || description;
      if (Array.isArray(raw.tags)) {
        tags = raw.tags.map((t: any) => String(t));
      } else if (typeof raw.tags === "string") {
        tags = raw.tags.split(",").map((t: string) => t.trim()).filter(Boolean);
      }

      if (typeof raw.template === "string" && raw.template.trim()) {
        text = raw.template;
      } else if (typeof raw.text === "string" && raw.text.trim()) {
        text = raw.text;
      } else if (typeof raw.content === "string" && raw.content.trim()) {
        text = raw.content;
      } else if (typeof raw.prompt === "string" && raw.prompt.trim()) {
        text = raw.prompt;
      } else if (typeof raw.body === "string" && raw.body.trim()) {
        text = raw.body;
      } else {
        try {
          text = JSON.stringify(raw, null, 2);
        } catch {
          text = String(raw);
        }
      }
    }

    if (!text && typeof item.content === "string") {
      text = item.content;
    }

    return {
      id: item.id || Math.random().toString(),
      nom: item.nom || item.title || item.name || "appréciation_PP.json",
      isOfficiel,
      user: item.user || "",
      text: text || "(Contenu du prompt de synthèse)",
      description: description,
      tags: tags,
      contenuObj: typeof raw === "object" && raw !== null ? raw : { text: text || raw },
      rawItem: item
    };
  };

  const openCreateSyntheseModal = () => {
    setEditingSynthese(null);
    setSyntheseNom("nouveau_prompt_synthese.json");
    setSyntheseDescription("");
    setSyntheseTags("");
    setSyntheseText("");
    setSyntheseJsonMode(false);
    setSyntheseRawJsonText(JSON.stringify({ text: "", description: "", tags: [] }, null, 2));
    setSyntheseModalError(null);
    setShowSyntheseModal(true);
  };

  const openEditSyntheseModal = (item: any) => {
    const parsed = parseSyntheseItem(item);
    if (parsed.isOfficiel) {
      alert("Les prompts officiels sont en lecture seule.");
      return;
    }

    setEditingSynthese(item);
    setSyntheseNom(parsed.nom);
    setSyntheseDescription(parsed.description);
    setSyntheseTags(parsed.tags.join(", "));
    setSyntheseText(parsed.text);
    setSyntheseJsonMode(false);
    setSyntheseRawJsonText(JSON.stringify(parsed.contenuObj, null, 2));
    setSyntheseModalError(null);
    setShowSyntheseModal(true);
  };

  const duplicateSyntheseToPersonal = (item: any) => {
    const parsed = parseSyntheseItem(item);
    setEditingSynthese(null);
    setSyntheseNom(`${parsed.nom.replace(/\.json$/i, "")}_copie.json`);
    setSyntheseDescription(parsed.description);
    setSyntheseTags(parsed.tags.join(", "));
    setSyntheseText(parsed.text);
    setSyntheseJsonMode(false);
    setSyntheseRawJsonText(JSON.stringify(parsed.contenuObj, null, 2));
    setSyntheseModalError(null);
    setShowSyntheseModal(true);
  };

  const handleSaveSynthese = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!syntheseNom.trim()) {
      setSyntheseModalError("Le nom du prompt de synthèse est obligatoire.");
      return;
    }

    setSavingSynthese(true);
    setSyntheseModalError(null);

    let finalContenu: any = {};
    if (syntheseJsonMode) {
      try {
        finalContenu = JSON.parse(syntheseRawJsonText);
      } catch {
        setSyntheseModalError("Le format du JSON est invalide. Veuillez vérifier les guillemets et virgules.");
        setSavingSynthese(false);
        return;
      }
    } else {
      if (!syntheseText.trim()) {
        setSyntheseModalError("Le contenu du prompt de synthèse est obligatoire.");
        setSavingSynthese(false);
        return;
      }
      const tagArray = syntheseTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      finalContenu = {
        text: syntheseText.trim(),
        description: syntheseDescription.trim(),
        tags: tagArray
      };
    }

    const token = getAuthToken();
    const userId = user?.id || user?.id_unique || "";

    const headers: Record<string, string> = {
      "Content-Type": "application/json"
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      if (editingSynthese) {
        const parsedEditing = parseSyntheseItem(editingSynthese);
        if (parsedEditing.isOfficiel) {
          throw new Error("Action interdite : Les prompts officiels sont strictement en lecture seule.");
        }

        const patchUrl = `https://pb.appreciation.fr/api/collections/prompts_synthese/records/${editingSynthese.id}`;
        const payload = {
          nom: syntheseNom.trim(),
          contenu: finalContenu
        };

        let patchRes = await fetch(patchUrl, {
          method: "PATCH",
          headers,
          body: JSON.stringify(payload)
        }).catch(() => null);

        if (!patchRes || !patchRes.ok) {
          const proxyRes = await fetch(`/api/prompts-synthese/${editingSynthese.id}`, {
            method: "PUT",
            headers,
            body: JSON.stringify(payload)
          });
          const data = await proxyRes.json();
          if (!proxyRes.ok || !data.success) {
            throw new Error(data.error || "Erreur lors de la modification du prompt de synthèse.");
          }
        }
      } else {
        const postUrl = "https://pb.appreciation.fr/api/collections/prompts_synthese/records";
        const payload: any = {
          nom: syntheseNom.trim(),
          contenu: finalContenu,
          officiel: false
        };
        if (userId) payload.user = userId;

        let created = false;
        let directErrMsg = "";

        try {
          const postRes = await fetch(postUrl, {
            method: "POST",
            headers,
            body: JSON.stringify(payload)
          });
          if (postRes.ok) {
            created = true;
          } else {
            const directData = await postRes.json().catch(() => null);
            directErrMsg = directData?.message || directData?.error || "";
            console.warn("[MyAccount] Direct PB POST prompts_synthese non-ok:", directData);
          }
        } catch (postErr) {
          console.warn("[MyAccount] Direct PB POST prompts_synthese failed:", postErr);
        }

        if (!created) {
          const proxyRes = await fetch("/api/prompts-synthese", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              nom: syntheseNom.trim(),
              contenu: finalContenu,
              user: userId
            })
          }).catch(() => null);

          const contentType = proxyRes?.headers.get("content-type") || "";
          if (proxyRes && proxyRes.ok && contentType.includes("application/json")) {
            const data = await proxyRes.json().catch(() => null);
            if (!data?.success) {
              throw new Error(data?.error || directErrMsg || "Erreur lors de la création du prompt de synthèse.");
            }
          } else if (directErrMsg) {
            throw new Error(directErrMsg);
          } else if (!proxyRes?.ok) {
            throw new Error("Erreur lors de la création du prompt de synthèse dans la base de données.");
          }
        }
      }

      setShowSyntheseModal(false);
      await fetchPromptsSynthese();
    } catch (err: any) {
      setSyntheseModalError(err.message || "Une erreur est survenue lors de l'enregistrement.");
    } finally {
      setSavingSynthese(false);
    }
  };

  const handleDeleteSynthese = async (item: any) => {
    const parsed = parseSyntheseItem(item);
    if (parsed.isOfficiel) {
      alert("Les prompts officiels sont en lecture seule et ne peuvent pas être supprimés.");
      return;
    }

    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer le prompt de synthèse "${parsed.nom}" ?`)) {
      return;
    }

    setDeletingSyntheseId(parsed.id);
    const token = getAuthToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const deleteUrl = `https://pb.appreciation.fr/api/collections/prompts_synthese/records/${parsed.id}`;
      let res = await fetch(deleteUrl, {
        method: "DELETE",
        headers
      }).catch(() => null);

      if (!res || !res.ok) {
        const proxyRes = await fetch(`/api/prompts-synthese/${parsed.id}`, {
          method: "DELETE",
          headers
        }).catch(() => null);
        const contentType = proxyRes?.headers.get("content-type") || "";
        if (proxyRes && proxyRes.ok && contentType.includes("application/json")) {
          const data = await proxyRes.json().catch(() => null);
          if (!data?.success) {
            throw new Error(data?.error || "Erreur lors de la suppression.");
          }
        } else if (!res?.ok) {
          throw new Error("Erreur lors de la suppression du prompt de synthèse.");
        }
      }

      await fetchPromptsSynthese();
    } catch (err: any) {
      alert(err.message || "Erreur lors de la suppression du prompt de synthèse.");
    } finally {
      setDeletingSyntheseId(null);
    }
  };

  const handleCopySyntheseText = (text: string, id: string | number) => {
    navigator.clipboard.writeText(text);
    setCopiedSyntheseStringId(id);
    setTimeout(() => setCopiedSyntheseStringId(null), 2000);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setIsLoggingIn(true);

    try {
      let token = "";
      let userObj: any = null;

      // 1. Primary: Express / PHP proxy /api/login
      try {
        const res = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), mdp: password.trim() })
        });

        const contentType = res.headers.get("content-type") || "";
        if (res.ok && contentType.includes("application/json")) {
          const data = await res.json();
          userObj = data.user || data.record || {};
          token = data.token || userObj.token || data.auth_token || "";
        }
      } catch (proxyErr) {
        console.warn("[MyAccount] Proxy /api/login failed:", proxyErr);
      }

      // 2. Direct PocketBase auth fallback (for environments without Express backend)
      if (!userObj || !token) {
        try {
          const pbAuthRes = await fetch("https://pb.appreciation.fr/api/collections/profs/auth-with-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ identity: email.trim(), password: password.trim() })
          });

          if (pbAuthRes.ok) {
            const pbData = await pbAuthRes.json();
            token = pbData.token || "";
            userObj = pbData.record || pbData.user || {};
          }
        } catch (pbErr) {
          console.warn("[MyAccount] Direct PocketBase auth failed:", pbErr);
        }
      }

      if (!userObj) {
        throw new Error("Impossible de se connecter : e-mail ou mot de passe incorrect.");
      }

      delete userObj.cle_api_mistral;

      // Enregistrement sécurisé en session (sessionStorage avec auto-expiration à 30 min)
      saveSession(userObj, token);

      onLogin(userObj);
    } catch (err: any) {
      setLoginError(err.message || "Impossible de se connecter à la base de données.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleUpdateProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateMessage("");
    setUpdateError("");

    setIsUpdating(true);

    try {
      const res = await fetch("/api/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_unique: user.id_unique,
          nom: editNom,
          prenom: editPrenom,
          email: editEmail,
          mdp: editMdp,
          ent: editEnt,
          systeme_exploitation: editOs,
          identifiant_prof: editIdentifiantProf,
          etablissement: editEtablissement
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Une erreur est survenue lors de la mise à jour");
      }

      setUpdateMessage("Votre compte a été mis à jour avec succès dans notre base de données !");
      const nextUser = { ...(data.user || {}) };
      delete nextUser.cle_api_mistral;
      onLogin(nextUser);
    } catch (err: any) {
      setUpdateError(err.message || "Erreur lors de la synchronisation de vos modifications.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative w-full max-w-7xl mx-auto">
      {/* Absolute Header with close button */}
      <div className="bg-slate-950/90 border-b border-slate-850 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-400 border border-blue-500/20">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Espace connecté Enseignant</h2>
            <p className="text-[10px] text-slate-400">Gérez votre licence, vos outils et votre configuration d'appréciations</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 p-2 rounded-lg text-xs font-semibold border border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
        >
          Retour au site
        </button>
      </div>

      {!user ? (
        /* =========================================================================
           LOGIN FORM PANEL
           ========================================================================= */
        <div className="p-8 max-w-lg mx-auto my-12 space-y-6">
          <div className="text-center space-y-2">
            <h3 className="text-xl font-bold text-white font-display">Connexion à votre espace</h3>
            <p className="text-xs text-slate-400">
              Veuillez renseigner votre adresse e-mail ainsi que votre mot de passe ou votre clé de connexion unique reçue par e-mail lors de l'acquisition de votre licence.
            </p>
          </div>

          {loginError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-xs flex items-start gap-2.5 leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Adresse e-mail académique *</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nom.prenom@ac-academie.fr"
                  className="w-full text-xs pl-10 bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Mot de passe OU Clé de connexion unique *</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Saisissez votre mot de passe ou votre clé unique id_..."
                  className="w-full text-xs pl-10 bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                La clé de connexion unique est la clé de format <code className="text-blue-300 font-mono">id_...</code> reçue lors de votre commande de licence.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs py-3 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoggingIn ? "Connexion en cours..." : "Se connecter"}
              <ChevronRight className="w-4 h-4" />
            </button>
          </form>

          <div className="text-center pt-2">
            <p className="text-[11px] text-slate-500">
              Pas encore inscrit ? <a href="#tarifs" onClick={onClose} className="text-blue-400 hover:underline">Découvrez nos plans et tarifs d'acquisition</a>.
            </p>
          </div>
        </div>
      ) : (
        /* =========================================================================
           CONNECTED PROFILE DASHBOARD
           ========================================================================= */
        <div className="grid grid-cols-1 md:grid-cols-12 min-h-[600px]">
          
          {/* Dashboard Sidebar Menu */}
          <div className="md:col-span-3 bg-slate-950 border-r border-slate-850 p-4 space-y-2 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-850 mb-4">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono font-bold">Enseignant connecté</p>
                <p className="text-xs font-bold text-white mt-1 truncate">{user.prenom} {user.nom}</p>
                <p className="text-[10px] text-blue-400 font-mono truncate">{user.email}</p>
              </div>

              <button
                onClick={() => setActiveTab("profile")}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium text-left transition-colors cursor-pointer ${
                  activeTab === "profile" 
                    ? "bg-blue-500/10 text-blue-400 border border-blue-500/25 font-semibold" 
                    : "text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent"
                }`}
              >
                <User className="w-4 h-4 shrink-0" />
                <span>Mes Informations</span>
              </button>

              <button
                onClick={() => setActiveTab("entLink")}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium text-left transition-colors cursor-pointer ${
                  activeTab === "entLink" 
                    ? "bg-blue-500/10 text-blue-400 border border-blue-500/25 font-semibold" 
                    : "text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent"
                }`}
              >
                <ExternalLink className="w-4 h-4 shrink-0" />
                <span>Lien avec ENT</span>
              </button>

              <button
                onClick={() => setActiveTab("downloads")}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium text-left transition-colors cursor-pointer ${
                  activeTab === "downloads" 
                    ? "bg-blue-500/10 text-blue-400 border border-blue-500/25 font-semibold" 
                    : "text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent"
                }`}
              >
                <Download className="w-4 h-4 shrink-0" />
                <span>Téléchargements</span>
              </button>

              <button
                onClick={() => setActiveTab("installation")}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium text-left transition-colors cursor-pointer ${
                  activeTab === "installation" 
                    ? "bg-blue-500/10 text-blue-400 border border-blue-500/25 font-semibold" 
                    : "text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent"
                }`}
              >
                <Monitor className="w-4 h-4 shrink-0" />
                <span>Installation du logiciel</span>
              </button>

              <button
                onClick={() => setActiveTab("database")}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium text-left transition-colors cursor-pointer ${
                  activeTab === "database" 
                    ? "bg-blue-500/10 text-blue-400 border border-blue-500/25 font-semibold" 
                    : "text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent"
                }`}
              >
                <Database className="w-4 h-4 shrink-0" />
                <span>Banque de Prompts & Grilles</span>
              </button>
            </div>

            <button
              onClick={() => {
                clearSession();
                onLogout();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/10 hover:border-rose-500/25 text-rose-400 rounded-lg text-xs font-semibold transition-all text-left cursor-pointer mt-4"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Se déconnecter</span>
            </button>
          </div>

          {/* Tab Content Panel */}
          <div className="md:col-span-9 p-8 overflow-y-auto min-h-[700px] max-h-[950px] bg-slate-950/30">
            
            {/* =========================================================================
               TAB 1: USER DATA SUMMARY & MODIFICATION
               ========================================================================= */}
            {activeTab === "profile" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-white font-display">Récapitulatif & Edition de votre compte</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Retrouvez l'intégralité des informations stockées dans notre base de données sécurisée. Certains champs requis sont modifiables pour s'adapter à votre carrière.
                  </p>
                </div>

                {/* DB Info Display */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-850">
                    <p className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">Identifiant Unique</p>
                    <p className="text-xs font-bold text-slate-300 mt-1 font-mono select-all">{user.id_unique}</p>
                  </div>
                  <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-850">
                    <p className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">Statut du Compte</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`w-2 h-2 rounded-full ${user.compte_valide === "ok" ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                      <p className="text-xs font-bold text-slate-300">
                        {user.compte_valide === "ok" ? "Validé" : "Non validé"}
                      </p>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-850">
                    <p className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">Fin d'engagement / Expiration</p>
                    <p className="text-xs font-bold text-slate-300 mt-1">{formatDateFR(user.expiration, configExpiration)}</p>
                  </div>
                  <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-850">
                    <p className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">Pack Licence</p>
                    <p className="text-xs font-bold text-slate-300 mt-1">
                      {user.pack === "2" || user.pack === 2 ? "Pack 2 - Enseignant + PP" : "Pack 1 - Enseignant Matière"}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-850">
                    <p className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">Version Logiciel</p>
                    <p className="text-xs font-bold text-slate-300 mt-1">Version {user.version || "V1.2"}</p>
                  </div>
                </div>

                <div className="border-t border-slate-900 pt-5">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-1.5 text-blue-400">
                    <Save className="w-4 h-4" />
                    <span>Modifier vos informations d'accès</span>
                  </h4>

                  {updateMessage && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs flex items-start gap-2.5 mb-4 animate-fadeIn">
                      <Check className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{updateMessage}</span>
                    </div>
                  )}

                  {updateError && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-xs flex items-start gap-2.5 mb-4 animate-fadeIn">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{updateError}</span>
                    </div>
                  )}

                  <form onSubmit={handleUpdateProfileSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Prénom</label>
                        <input
                          type="text"
                          required
                          value={editPrenom}
                          onChange={(e) => setEditPrenom(e.target.value)}
                          className="w-full text-xs bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-white focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Nom</label>
                        <input
                          type="text"
                          required
                          value={editNom}
                          onChange={(e) => setEditNom(e.target.value)}
                          className="w-full text-xs bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-white focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">E-mail de contact (non académique)</label>
                        <input
                          type="email"
                          required
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          className="w-full text-xs bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-white focus:border-blue-500 focus:outline-none"
                        />
                        {editEmail.trim().toLowerCase() !== (user?.email || "").trim().toLowerCase() && (
                          <div className="mt-2.5 p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                            <p className="text-[11px] font-medium text-amber-400 flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5" />
                              Changement d'adresse e-mail : vérification requise
                            </p>
                            {!isEmailVerified ? (
                              <div className="space-y-2 pt-1">
                                <p className="text-[10px] text-slate-400 leading-normal">
                                  Pour valider votre nouvelle adresse de contact, vous devez recevoir et valider un code de sécurité à 6 chiffres.
                                </p>
                                {verificationMessage && (
                                  <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded text-[11px]">
                                    {verificationMessage}
                                  </div>
                                )}
                                {verificationError && (
                                  <div className="p-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded text-[11px]">
                                    {verificationError}
                                  </div>
                                )}
                                {!codeSent ? (
                                  <button
                                    type="button"
                                    onClick={handleSendCode}
                                    disabled={sendingCode}
                                    className="w-full bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 hover:text-white border border-blue-500/30 font-semibold text-[10px] py-1.5 rounded-lg transition-all cursor-pointer disabled:opacity-40"
                                  >
                                    {sendingCode ? "Envoi du code..." : "Envoyer un code de vérification"}
                                  </button>
                                ) : (
                                  <div className="space-y-2">
                                    <div className="flex gap-2">
                                      <input
                                        type="text"
                                        placeholder="Code à 6 chiffres"
                                        value={verificationCode}
                                        onChange={(e) => setVerificationCode(e.target.value)}
                                        className="w-full text-xs text-center bg-slate-950 border border-slate-850 rounded-lg p-1.5 text-white focus:border-blue-500 focus:outline-none font-mono"
                                      />
                                      <button
                                        type="button"
                                        onClick={handleVerifyCode}
                                        disabled={verifyingCode || !verificationCode}
                                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[10px] px-3 py-1.5 rounded-lg transition-all cursor-pointer disabled:opacity-40 shrink-0"
                                      >
                                        {verifyingCode ? "Validation..." : "Valider"}
                                      </button>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={handleSendCode}
                                      disabled={sendingCode}
                                      className="text-[10px] text-slate-500 hover:text-slate-300 underline"
                                    >
                                      Renvoyer le code
                                    </button>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded text-[11px] font-medium flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" />
                                Adresse e-mail de contact vérifiée avec succès.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Changer le mot de passe (optionnel)</label>
                        <input
                          type="password"
                          placeholder="Conserver le mot de passe actuel ou entrer un nouveau (min 6 car.)"
                          value={editMdp}
                          onChange={(e) => setEditMdp(e.target.value)}
                          className="w-full text-xs bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-white focus:border-blue-500 focus:outline-none placeholder:text-slate-600"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Système d'exploitation principal</label>
                        <select
                          value={editOs}
                          onChange={(e) => setEditOs(e.target.value as any)}
                          className="w-full text-xs bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-white focus:border-blue-500 focus:outline-none"
                        >
                          <option value="">-- Non spécifié --</option>
                          <option value="windows">Windows (PC)</option>
                          <option value="macos">macOS (Apple)</option>
                          <option value="linux">Linux</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Logiciel scolaire principal (ENT)</label>
                        <select
                          value={editEnt}
                          onChange={(e) => setEditEnt(e.target.value)}
                          className="w-full text-xs bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-white focus:border-blue-500 focus:outline-none"
                        >
                          <option value="">-- Non spécifié --</option>
                          <option value="pronote">PRONOTE</option>
                          <option value="ecole_directe">ÉcoleDirecte</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={isUpdating || !isEmailVerified}
                        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold text-xs px-6 py-2.5 rounded-lg flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-600/15"
                      >
                        <Save className="w-4 h-4" />
                        <span>
                          {!isEmailVerified 
                            ? "Veuillez vérifier votre nouvel e-mail" 
                            : isUpdating 
                              ? "Mise à jour en cours..." 
                              : "Enregistrer les modifications"
                          }
                        </span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* =========================================================================
               TAB 2: ENT LINKAGE (STEP 3 ADAPTED GUIDE & INPUTS)
               ========================================================================= */}
            {activeTab === "entLink" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-white font-display">Liaison avec votre espace scolaire (ENT)</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Configurez votre nom d'enseignant et votre établissement scolaire tels qu'ils s'affichent dans votre interface scolaire pour garantir la liaison automatique avec l'extension Chrome apprecIAtion.
                  </p>
                </div>

                {updateMessage && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs flex items-start gap-2.5 animate-fadeIn">
                    <Check className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{updateMessage}</span>
                  </div>
                )}

                {updateError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-xs flex items-start gap-2.5 animate-fadeIn">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{updateError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left Column: Form Inputs & Warning (7 cols) */}
                  <div className="lg:col-span-7 space-y-4">
                    
                    {/* Crucial Identification Warning */}
                    <div className="bg-amber-500/5 border border-amber-500/20 p-3.5 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>Informations de liaison cruciales</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        Ces informations sont indispensables pour l'utilisation du logiciel apprecIAtion.
                      </p>
                      <p className="text-[11px] text-amber-400 font-medium leading-relaxed">
                        ⚠️ Respectez rigoureusement les majuscules, les minuscules, les espaces et les accents (comme indiqué sur le guide visuel). En cas d'erreur de saisie, l'accès à l'interface pourra vous être refusé.
                      </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleUpdateProfileSubmit} className="space-y-4">
                      
                      {/* ENT Selector */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          Interface de scolarité (ENT) utilisée *
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setEditEnt("pronote")}
                            className={`p-2.5 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
                              editEnt === "pronote"
                                ? "bg-emerald-500/10 border-emerald-500/40 text-white"
                                : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                            }`}
                          >
                            <div className="flex flex-col">
                              <span className="text-xs font-bold font-display">PRONOTE</span>
                              <span className="text-[9px] text-slate-500">Interface classique</span>
                            </div>
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${editEnt === "pronote" ? "border-emerald-500 bg-emerald-500 text-slate-950" : "border-slate-700"}`}>
                              {editEnt === "pronote" && <Check className="w-2.5 h-2.5 stroke-[4]" />}
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => setEditEnt("ecole_directe")}
                            className={`p-2.5 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
                              editEnt === "ecole_directe" || editEnt === "ecoledirecte"
                                ? "bg-emerald-500/10 border-emerald-500/40 text-white"
                                : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                            }`}
                          >
                            <div className="flex flex-col">
                              <span className="text-xs font-bold font-display">EcoleDirecte</span>
                              <span className="text-[9px] text-slate-500">Charte bleue</span>
                            </div>
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${editEnt === "ecole_directe" || editEnt === "ecoledirecte" ? "border-emerald-500 bg-emerald-500 text-slate-950" : "border-slate-700"}`}>
                              {(editEnt === "ecole_directe" || editEnt === "ecoledirecte") && <Check className="w-2.5 h-2.5 stroke-[4]" />}
                            </div>
                          </button>
                        </div>
                        {editEnt === "" && (
                          <p className="text-[10px] text-amber-400 font-medium mt-1">
                            ⚠️ Veuillez choisir l'interface scolaire que vous utilisez (PRONOTE ou EcoleDirecte).
                          </p>
                        )}
                      </div>

                      {/* Field 1: Teacher Identifier */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Identifiant exact de l'enseignant dans {editEnt === "ecole_directe" || editEnt === "ecoledirecte" ? "EcoleDirecte" : editEnt === "pronote" ? "PRONOTE" : "votre ENT"} *
                        </label>
                        <input 
                          type="text" 
                          required
                          value={editIdentifiantProf}
                          onChange={(e) => setEditIdentifiantProf(e.target.value)}
                          placeholder={editEnt === "ecole_directe" || editEnt === "ecoledirecte" ? "M. Antoine MARAIS" : editEnt === "pronote" ? "M. Olivier BERTRAND" : "Ex: M. Antoine MARAIS"}
                          onFocus={() => setFocusedField("editIdentifiantProf")}
                          onBlur={() => setFocusedField(null)}
                          className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <p className="text-[10px] text-slate-500 mt-1">
                          Trouvez-le en haut à gauche de votre espace personnel ou sur votre profil (voir l'aide visuelle ci-contre).
                        </p>
                      </div>

                      {/* Field 2: School Name */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Nom complet de l'établissement scolaire dans {editEnt === "ecole_directe" || editEnt === "ecoledirecte" ? "EcoleDirecte" : editEnt === "pronote" ? "PRONOTE" : "votre ENT"} *
                        </label>
                        <input 
                          type="text" 
                          required
                          value={editEtablissement}
                          onChange={(e) => setEditEtablissement(e.target.value)}
                          placeholder={editEnt === "ecole_directe" || editEnt === "ecoledirecte" ? "Collège St Vincent" : editEnt === "pronote" ? "Lycée Léonard de Vinci" : "Ex: Collège St Vincent"}
                          onFocus={() => setFocusedField("editEtablissement")}
                          onBlur={() => setFocusedField(null)}
                          className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <p className="text-[10px] text-slate-500 mt-1">
                          Saisissez le nom de votre collège/lycée rigoureusement à l'identique.
                        </p>
                      </div>

                      <button
                        type="submit"
                        disabled={isUpdating}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs py-2.5 rounded-lg shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        {isUpdating ? (
                          <>
                            <span className="w-3.5 h-3.5 border-2 border-white/35 border-t-white rounded-full animate-spin" />
                            <span>Enregistrement en cours...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            <span>Enregistrer la liaison ENT</span>
                          </>
                        )}
                      </button>
                    </form>

                  </div>

                  {/* Right Column: Interactive Graphic Guide (5 cols) */}
                  <div className="lg:col-span-5 space-y-3.5">
                    <div className="bg-slate-950 rounded-xl p-4 border border-slate-850 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="text-center space-y-1">
                          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block">
                            Aide Visuelle • Où trouver vos infos ?
                          </span>
                          {(editEnt === "ecole_directe" || editEnt === "ecoledirecte") && (
                            <p className="text-[11px] text-slate-300 font-medium leading-snug">
                              Ces informations sont directement disponibles :
                            </p>
                          )}
                        </div>

                        {/* LIVE RENDER OF SELECT PLATFORM SIDEBAR */}
                        {(editEnt === "ecole_directe" || editEnt === "ecoledirecte") ? (
                          <div className="space-y-3">
                            {/* Tabs for Image 1 (Mobile) and Image 2 (Web) */}
                            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-900 rounded-lg border border-slate-800 text-[11px] font-semibold">
                              <button
                                type="button"
                                onClick={() => setEcoleDirecteGuideTab("mobile")}
                                className={`px-2 py-1.5 rounded-md flex flex-col items-center justify-center transition-all cursor-pointer ${
                                  ecoleDirecteGuideTab === "mobile"
                                    ? "bg-blue-600 text-white shadow-md font-bold"
                                    : "text-slate-400 hover:text-slate-200"
                                }`}
                              >
                                <span>1. App Mobile</span>
                                <span className="text-[9px] opacity-80">(Image 1)</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setEcoleDirecteGuideTab("web")}
                                className={`px-2 py-1.5 rounded-md flex flex-col items-center justify-center transition-all cursor-pointer ${
                                  ecoleDirecteGuideTab === "web"
                                    ? "bg-blue-600 text-white shadow-md font-bold"
                                    : "text-slate-400 hover:text-slate-200"
                                }`}
                              >
                                <span>2. Site Web</span>
                                <span className="text-[9px] opacity-80">(Image 2)</span>
                              </button>
                            </div>

                            {/* Explanation banner */}
                            <div className="bg-blue-950/50 border border-blue-800/30 p-2 rounded-lg text-[10px] text-blue-200 leading-snug">
                              {ecoleDirecteGuideTab === "mobile" ? (
                                <p>
                                  <strong className="text-white">1. En ouvrant l'application mobile EcoleDirecte sur le téléphone :</strong> Votre profil enseignant et votre établissement apparaissent dans le menu supérieur.
                                </p>
                              ) : (
                                <p>
                                  <strong className="text-white">2. Sur le site web EcoleDirecte, une fois connecté :</strong> Votre établissement s'affiche en haut sous le logo et votre nom d'enseignant dans le bouton en haut à droite.
                                </p>
                              )}
                            </div>

                            {ecoleDirecteGuideTab === "mobile" ? (
                              /* IMAGE 1: Mobile App Drawer Mockup */
                              <div className="bg-[#0c4890] rounded-xl overflow-hidden shadow-2xl text-white font-sans text-xs max-w-xs mx-auto border border-blue-500/20">
                                <div className="bg-[#08366e] px-3 py-1 flex justify-between items-center text-[9px] text-blue-200/80 font-mono">
                                  <span>14:10</span>
                                  <div className="flex items-center gap-1.5 text-[8px]">
                                    <span>📶 5G</span>
                                    <span>🔋 84%</span>
                                  </div>
                                </div>

                                <div className="p-3.5 pb-4 space-y-2.5 relative bg-[#0c4890]">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center p-1 text-[8px] font-bold text-[#0c4890] shrink-0 border border-blue-100 shadow">
                                      <div className="text-center leading-none">
                                        <span className="text-[#0c4890] font-extrabold block text-[6px]">t.Vin</span>
                                        <span className="text-amber-500 text-[5px]">école</span>
                                      </div>
                                    </div>

                                    <div className="min-w-0 flex-1">
                                      <p className="text-[9px] text-blue-200 uppercase tracking-wider font-semibold opacity-90 leading-none mb-1">
                                        Mon espace Enseignant
                                      </p>

                                      <div className={`relative transition-all duration-300 rounded px-1.5 py-0.5 -mx-1.5 ${
                                        focusedField === "editIdentifiantProf"
                                          ? "ring-2 ring-amber-500 bg-amber-500/20 animate-pulse"
                                          : "hover:bg-blue-800/40"
                                      }`}>
                                        <p className="text-[12px] font-bold truncate">
                                          {editIdentifiantProf || "M. Antoine MARAIS"}
                                        </p>
                                        <span className="absolute -top-3.5 -right-1 bg-amber-500 text-slate-950 font-bold text-[7px] px-1 rounded shadow pointer-events-none">
                                          Identifiant
                                        </span>
                                      </div>

                                      <div className={`relative transition-all duration-300 rounded px-1.5 py-0.5 -mx-1.5 mt-0.5 ${
                                        focusedField === "editEtablissement"
                                          ? "ring-2 ring-amber-500 bg-amber-500/20 animate-pulse"
                                          : "hover:bg-blue-800/40"
                                      }`}>
                                        <p className="text-[10px] text-blue-100/90 truncate">
                                          {editEtablissement || "Collège St Vincent"}
                                        </p>
                                        <span className="absolute -bottom-3.5 -right-1 bg-amber-500 text-slate-950 font-bold text-[7px] px-1 rounded shadow pointer-events-none">
                                          Établissement
                                        </span>
                                      </div>

                                    </div>
                                  </div>
                                </div>

                                <div className="bg-[#104b93] p-2 space-y-1 text-[10px]">
                                  <div className="bg-white text-[#0c4890] font-bold px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-sm">
                                    <span>🏠</span>
                                    <span>Accueil</span>
                                  </div>
                                  <div className="px-3 py-1 flex items-center gap-2 text-blue-100">
                                    <span>✉️</span>
                                    <span>Messagerie</span>
                                  </div>
                                  <div className="px-3 py-1 flex items-center gap-2 text-blue-100">
                                    <span>📋</span>
                                    <span>Feuille d'appel</span>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              /* IMAGE 2: Web Site Mockup */
                              <div className="bg-slate-900 rounded-xl overflow-hidden shadow-2xl text-white font-sans text-xs max-w-xs mx-auto border border-blue-500/30">
                                <div className="bg-[#0c4890] p-2 px-3 border-b border-blue-800 flex justify-between items-center">
                                  <div>
                                    <span className="text-[8px] font-extrabold uppercase tracking-wider text-blue-200 block leading-tight">
                                      MON ESPACE ENSEIGNANT
                                    </span>
                                    <div className={`relative transition-all duration-300 rounded px-1 py-0.5 inline-block ${
                                      focusedField === "editEtablissement"
                                        ? "ring-2 ring-amber-500 bg-amber-500/20 animate-pulse"
                                        : "hover:bg-blue-800/40"
                                    }`}>
                                      <span className="text-[10px] font-bold text-white">
                                        {editEtablissement || "Collège St Vincent"}
                                      </span>
                                      <span className="absolute -bottom-3 left-0 bg-amber-500 text-slate-950 font-bold text-[7px] px-1 rounded shadow pointer-events-none whitespace-nowrap">
                                        Établissement
                                      </span>
                                    </div>
                                  </div>

                                  <div className={`relative transition-all duration-300 rounded px-2 py-1 flex items-center gap-1.5 bg-[#082a56] border border-blue-400/30 ${
                                    focusedField === "editIdentifiantProf"
                                      ? "ring-2 ring-amber-500 bg-amber-500/20 animate-pulse"
                                      : ""
                                  }`}>
                                    <div className="w-3.5 h-3.5 rounded-full bg-blue-300 text-blue-950 flex items-center justify-center text-[7px] font-bold">
                                      👤
                                    </div>
                                    <span className="text-[10px] font-bold text-white truncate max-w-[90px]">
                                      {editIdentifiantProf || "M. Antoine MARAIS"}
                                    </span>
                                    <span className="absolute -bottom-3 right-0 bg-amber-500 text-slate-950 font-bold text-[7px] px-1 rounded shadow pointer-events-none whitespace-nowrap">
                                      Identifiant exact
                                    </span>
                                  </div>
                                </div>

                                <div className="p-3 bg-slate-950 text-center space-y-2">
                                  <div className="bg-slate-900/90 border border-slate-850 p-2 rounded text-[9px] text-slate-300">
                                    <p className="font-semibold text-slate-200">BOÎTE DE RÉCEPTION</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          /* PRONOTE STYLE PREVIEW */
                          <div className="bg-[#2a3035] rounded-xl overflow-hidden shadow-2xl text-slate-100 font-sans text-xs max-w-xs mx-auto border border-slate-800">
                            <div className="bg-[#202528] border-b-4 border-[#2ecc71] px-3.5 py-2 flex justify-between items-center text-[9px] font-bold text-slate-300">
                              <span>PRONOTE</span>
                              <span className="text-[#2ecc71]">ESPACE ENSEIGNANTS</span>
                            </div>

                            <div className="p-3 bg-slate-950 space-y-2.5">
                              <span className="text-[9px] text-[#2ecc71] font-bold uppercase tracking-widest">Identité du compte</span>
                              
                              <div className={`relative transition-all duration-300 rounded px-2 py-1 ${
                                focusedField === "editIdentifiantProf"
                                  ? "ring-2 ring-amber-500 bg-amber-500/20 animate-pulse"
                                  : "bg-slate-900 border border-slate-850"
                              }`}>
                                <p className="text-[11px] font-bold text-white">
                                  {editIdentifiantProf || "M. Olivier BERTRAND"}
                                </p>
                                <span className="absolute -top-3 -right-1 bg-amber-500 text-slate-950 font-bold text-[7px] px-1 rounded shadow pointer-events-none scale-90">
                                  Identifiant
                                </span>
                              </div>

                              <div className={`relative transition-all duration-300 rounded px-2 py-1 ${
                                focusedField === "editEtablissement"
                                  ? "ring-2 ring-amber-500 bg-amber-500/20 animate-pulse"
                                  : "bg-slate-900 border border-slate-850"
                              }`}>
                                <p className="text-[10px] text-slate-400">
                                  {editEtablissement || "Lycée Léonard de Vinci"}
                                </p>
                                <span className="absolute -bottom-3 -right-1 bg-amber-500 text-slate-950 font-bold text-[7px] px-1 rounded shadow pointer-events-none scale-90">
                                  Établissement
                                </span>
                              </div>
                            </div>

                            <div className="bg-slate-900 p-2 grid grid-cols-2 gap-1.5 text-[9px] text-center text-slate-400">
                              <div className="bg-slate-950 p-2 rounded border border-slate-800 flex flex-col items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#2ecc71]" />
                                <span>Cahier de textes</span>
                              </div>
                              <div className="bg-slate-950 p-2 rounded border border-slate-850 flex flex-col items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#2ecc71]" />
                                <span>Saisie des notes</span>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="text-center bg-slate-900/50 p-2 rounded-lg border border-slate-850 mt-2">
                          <p className="text-[10px] text-slate-400">
                            L'identifiant exact de l'utilisateur correspond au nom de votre compte enseignant connecté. Respectez bien les accents et majuscules.
                          </p>
                        </div>

                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* =========================================================================
               TAB 3: EXCLUSIVE DOWNLOAD LINKS
               ========================================================================= */}
            {activeTab === "downloads" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-white font-display">Téléchargement des applications apprecIAtion</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Récupérez l'installeur ou le binaire de bureau d'apprecIAtion prêt à l'emploi. Pour rappel, votre système d'exploitation par défaut configuré est <span className="capitalize text-blue-400 font-bold">{user.systeme_exploitation}</span>.
                  </p>
                </div>

                {/* Main recommended package card */}
                <div className="p-5 bg-slate-900/80 rounded-2xl border border-indigo-500/20 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-2xl rounded-full" />
                  
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/20">
                      <Laptop className="w-8 h-8" />
                    </div>
                    <div className="text-left space-y-1">
                      <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20 font-bold uppercase tracking-wider">
                        Recommandé pour vous
                      </span>
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                        Version {user.systeme_exploitation === "windows" ? "Windows (Binaire .zip)" : user.systeme_exploitation === "macos" ? "macOS (Mac App .zip)" : "Linux (.zip)"}
                      </h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Fichier : <span className="font-mono text-blue-300">{user.systeme_exploitation === "windows" ? "apprecIAtion_win.zip" : user.systeme_exploitation === "macos" ? "apprecIAtion_mac.zip" : "apprecIAtion_linux.zip"}</span>
                      </p>
                    </div>
                  </div>

                  <a
                    href={user.systeme_exploitation === "windows" ? "/assets/apprecIAtion_win.zip" : user.systeme_exploitation === "macos" ? "/assets/apprecIAtion_mac.zip" : "/assets/apprecIAtion_linux.zip"}
                    download={user.systeme_exploitation === "windows" ? "apprecIAtion_win.zip" : user.systeme_exploitation === "macos" ? "apprecIAtion_mac.zip" : "apprecIAtion_linux.zip"}
                    className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4 shrink-0" />
                    <span>Télécharger ({user.systeme_exploitation === "windows" ? "Windows" : user.systeme_exploitation === "macos" ? "macOS" : "Linux"})</span>
                  </a>
                </div>

                {/* Other systems downloads */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Tous nos installeurs disponibles</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    
                    {/* Windows package */}
                    <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-850 flex flex-col justify-between items-start space-y-3">
                      <div>
                        <p className="text-xs font-bold text-white">Windows (10 / 11)</p>
                        <p className="text-[10px] text-slate-500 font-mono mt-1">apprecIAtion_win.zip</p>
                      </div>
                      <a
                        href="/assets/apprecIAtion_win.zip"
                        download="apprecIAtion_win.zip"
                        className="w-full bg-slate-950 hover:bg-slate-900 text-slate-300 hover:text-white border border-slate-850 hover:border-slate-800 p-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Télécharger .zip</span>
                      </a>
                    </div>

                    {/* macOS package */}
                    <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-850 flex flex-col justify-between items-start space-y-3">
                      <div>
                        <p className="text-xs font-bold text-white">macOS (Intel & Silicon)</p>
                        <p className="text-[10px] text-slate-500 font-mono mt-1">apprecIAtion_mac.zip</p>
                      </div>
                      <a
                        href="/assets/apprecIAtion_mac.zip"
                        download="apprecIAtion_mac.zip"
                        className="w-full bg-slate-950 hover:bg-slate-900 text-slate-300 hover:text-white border border-slate-850 hover:border-slate-800 p-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Télécharger .zip</span>
                      </a>
                    </div>

                    {/* Linux package */}
                    <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-850 flex flex-col justify-between items-start space-y-3">
                      <div>
                        <p className="text-xs font-bold text-white">Linux (Debian / Ubuntu)</p>
                        <p className="text-[10px] text-slate-500 font-mono mt-1">apprecIAtion_linux.zip</p>
                      </div>
                      <a
                        href="/assets/apprecIAtion_linux.zip"
                        download="apprecIAtion_linux.zip"
                        className="w-full bg-slate-950 hover:bg-slate-900 text-slate-300 hover:text-white border border-slate-850 hover:border-slate-800 p-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Télécharger .zip</span>
                      </a>
                    </div>

                  </div>
                </div>
              </div>
            )}

            {/* =========================================================================
               TAB 3.5: INSTALLATION INSTRUCTIONS (PORTABLE VERSION GUIDE)
               ========================================================================= */}
            {activeTab === "installation" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-white font-display">Guide d'installation et de portabilité</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    apprecIAtion est un logiciel autonome et entièrement portable. Apprenez comment le configurer pour travailler directement depuis une clé USB sur n'importe quel ordinateur, sans aucune installation locale requise.
                  </p>
                </div>

                {/* OS Switcher */}
                <div className="flex bg-slate-900/60 p-1 rounded-xl border border-slate-850 gap-1 w-full max-w-md">
                  <button
                    type="button"
                    onClick={() => setInstallOsTab("windows")}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      installOsTab === "windows"
                        ? "bg-blue-600 text-white shadow-md"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Windows
                  </button>
                  <button
                    type="button"
                    onClick={() => setInstallOsTab("macos")}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      installOsTab === "macos"
                        ? "bg-blue-600 text-white shadow-md"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    macOS
                  </button>
                  <button
                    type="button"
                    onClick={() => setInstallOsTab("linux")}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      installOsTab === "linux"
                        ? "bg-blue-600 text-white shadow-md"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Linux
                  </button>
                </div>

                {/* Main installation card for Windows */}
                {installOsTab === "windows" && (
                  <div className="space-y-5 animate-fadeIn">
                    <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl text-xs text-slate-300 flex items-start gap-3">
                      <Terminal className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-white block mb-0.5">Pourquoi utiliser la version portable ?</span>
                        Cette méthode garantit que <strong className="text-white">rien n'est installé ou écrit sur le disque dur de l'ordinateur de l'école ou de votre bureau</strong>. Toutes vos bases de données et vos préférences restent en sécurité sur votre clé USB portable.
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider text-slate-300">Étapes d'installation sur Windows</h4>
                      
                      <div className="space-y-3">
                        {/* Step 1 */}
                        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-850 flex items-start gap-3.5">
                          <span className="w-6 h-6 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 flex items-center justify-center font-mono font-bold shrink-0 text-xs">
                            1
                          </span>
                          <div className="space-y-1">
                            <p className="text-white font-bold text-xs">Préparation de la clé USB</p>
                            <p className="text-xs text-slate-400 leading-relaxed">
                              Copiez le fichier téléchargé <code className="text-blue-300 font-mono text-[11px] bg-slate-950 px-1 py-0.5 rounded">apprecIAtion_win.zip</code> sur une clé USB ou un support amovible performant (norme USB 2.0 ou idéalement USB 3.0/3.1). 
                              <span className="block mt-1 text-[11px] text-amber-400/90 font-medium font-sans">
                                💡 Note : L'espace disque requis est minime, mais la vitesse de transfert des données de votre clé est essentielle au parfait fonctionnement et à la rapidité du logiciel.
                              </span>
                            </p>
                          </div>
                        </div>

                        {/* Step 2 */}
                        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-850 flex items-start gap-3.5">
                          <span className="w-6 h-6 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 flex items-center justify-center font-mono font-bold shrink-0 text-xs">
                            2
                          </span>
                          <div className="space-y-1">
                            <p className="text-white font-bold text-xs">Décompression des fichiers</p>
                            <p className="text-xs text-slate-400 leading-relaxed">
                              Faites un clic droit sur le fichier <code className="text-blue-300 font-mono text-[11px] bg-slate-950 px-1 py-0.5 rounded">apprecIAtion_win.zip</code> et sélectionnez <strong>"Extraire tout..."</strong> (ou utilisez un utilitaire comme 7-Zip/WinRAR) pour décompresser le dossier directement à la racine ou dans un dossier dédié de votre support amovible.
                            </p>
                          </div>
                        </div>

                        {/* Step 3 */}
                        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-850 flex items-start gap-3.5">
                          <span className="w-6 h-6 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 flex items-center justify-center font-mono font-bold shrink-0 text-xs">
                            3
                          </span>
                          <div className="space-y-1">
                            <p className="text-white font-bold text-xs">Vérification de la structure du dossier</p>
                            <p className="text-xs text-slate-400 leading-relaxed">
                              Ouvrez le dossier extrait sur votre support amovible et vérifiez qu'il contient bien les deux éléments indispensables :
                            </p>
                            <div className="mt-2 bg-slate-950/80 p-3 rounded-lg border border-slate-900 font-mono text-[11px] text-slate-300 space-y-1">
                              <p className="flex items-center gap-1.5"><span className="text-amber-500">📁 I3A_data</span> <span className="text-slate-500 font-sans text-xs">(Dossier contenant votre base de données locale)</span></p>
                              <p className="flex items-center gap-1.5"><span className="text-emerald-500">⚙️ apprecIAtion.exe</span> <span className="text-slate-500 font-sans text-xs">(Le programme principal exécutable)</span></p>
                            </div>
                          </div>
                        </div>

                        {/* Step 4 */}
                        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-850 flex items-start gap-3.5">
                          <span className="w-6 h-6 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 flex items-center justify-center font-mono font-bold shrink-0 text-xs">
                            4
                          </span>
                          <div className="space-y-1">
                            <p className="text-white font-bold text-xs">Premier lancement</p>
                            <p className="text-xs text-slate-400 leading-relaxed">
                              Double-cliquez sur le fichier <code className="text-emerald-400 font-mono text-[11px] bg-slate-950 px-1 py-0.5 rounded">apprecIAtion.exe</code>. 
                              <span className="block mt-1 text-slate-400">
                                ⏳ Patientez environ <strong>10 secondes</strong> pendant le premier lancement du logiciel, le temps d'initialiser l'environnement sécurisé et les services locaux.
                              </span>
                            </p>
                          </div>
                        </div>

                        {/* Step 5 */}
                        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-850 flex items-start gap-3.5">
                          <span className="w-6 h-6 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 flex items-center justify-center font-mono font-bold shrink-0 text-xs">
                            5
                          </span>
                          <div className="space-y-1">
                            <p className="text-white font-bold text-xs">Utilisation 100% autonome et portable</p>
                            <p className="text-xs text-slate-400 leading-relaxed font-light">
                              Le logiciel est désormais totalement opérationnel et portable. Vous pouvez débrancher votre clé USB et la connecter sur n'importe quel autre poste Windows : votre espace de travail s'ouvrira instantanément avec toutes vos données intactes embarquées directement dans le dossier <code className="font-mono text-[11px] bg-slate-950 px-1 py-0.5 rounded text-blue-300">I3A_data</code>. <strong className="text-slate-300">Rien n'est écrit ou installé sur l'ordinateur hôte.</strong>
                            </p>
                          </div>
                        </div>

                        {/* Step 6 */}
                        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-850 flex items-start gap-3.5">
                          <span className="w-6 h-6 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 flex items-center justify-center font-mono font-bold shrink-0 text-xs">
                            6
                          </span>
                          <div className="space-y-1">
                            <p className="text-white font-bold text-xs">Nettoyage final</p>
                            <p className="text-xs text-slate-400 leading-relaxed">
                              Pour libérer de l'espace sur votre clé USB, vous pouvez supprimer définitivement le fichier d'archive compressé <code className="text-slate-400 font-mono text-[11px] bg-slate-950 px-1 py-0.5 rounded">apprecIAtion_win.zip</code>.
                            </p>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                )}

                {/* macOS Guide */}
                {installOsTab === "macos" && (
                  <div className="space-y-5 animate-fadeIn">
                    <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl text-xs text-slate-300 flex items-start gap-3">
                      <Terminal className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-white block mb-0.5">Compatibilité macOS</span>
                        L'application macOS fonctionne à la fois sur les Mac équipés de processeurs Intel et Apple Silicon (M1/M2/M3).
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider text-slate-300">Étapes d'installation sur macOS</h4>
                      
                      <div className="space-y-3 text-xs">
                        {/* Step 1 */}
                        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-850 flex items-start gap-3.5">
                          <span className="w-6 h-6 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 flex items-center justify-center font-mono font-bold shrink-0 text-xs">
                            1
                          </span>
                          <div className="space-y-1">
                            <p className="text-white font-bold">Transfert sur clé USB</p>
                            <p className="text-slate-400 leading-relaxed">
                              Copiez l'archive <code className="text-blue-300 font-mono text-[11px] bg-slate-950 px-1 py-0.5 rounded">apprecIAtion_mac.zip</code> sur votre clé USB rapide (formatée en ExFAT pour être lisible sur Mac et Windows).
                            </p>
                          </div>
                        </div>

                        {/* Step 2 */}
                        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-850 flex items-start gap-3.5">
                          <span className="w-6 h-6 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 flex items-center justify-center font-mono font-bold shrink-0 text-xs">
                            2
                          </span>
                          <div className="space-y-1">
                            <p className="text-white font-bold">Extraction de l'application</p>
                            <p className="text-slate-400 leading-relaxed">
                              Double-cliquez sur le fichier <code className="text-blue-300 font-mono text-[11px] bg-slate-950 px-1 py-0.5 rounded">apprecIAtion_mac.zip</code> sur votre clé. L'utilitaire d'archive natif de macOS va extraire l'application.
                            </p>
                          </div>
                        </div>

                        {/* Step 3 */}
                        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-850 flex items-start gap-3.5">
                          <span className="w-6 h-6 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 flex items-center justify-center font-mono font-bold shrink-0 text-xs">
                            3
                          </span>
                          <div className="space-y-1">
                            <p className="text-white font-bold">Vérification de la structure</p>
                            <p className="text-slate-400 leading-relaxed font-light">
                              Assurez-vous d'avoir les éléments suivants présents au même niveau :
                            </p>
                            <div className="mt-2 bg-slate-950/80 p-3 rounded-lg border border-slate-900 font-mono text-[11px] text-slate-300 space-y-1">
                              <p className="flex items-center gap-1.5"><span className="text-amber-500">📁 I3A_data</span> <span className="text-slate-500 font-sans text-xs">(Dossier de base de données locales)</span></p>
                              <p className="flex items-center gap-1.5"><span className="text-emerald-500">🖥️ apprecIAtion.app</span> <span className="text-slate-500 font-sans text-xs">(Le package d'application macOS)</span></p>
                            </div>
                          </div>
                        </div>

                        {/* Step 4 */}
                        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-850 flex items-start gap-3.5">
                          <span className="w-6 h-6 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 flex items-center justify-center font-mono font-bold shrink-0 text-xs">
                            4
                          </span>
                          <div className="space-y-1">
                            <p className="text-white font-bold">Premier lancement & Autorisation macOS</p>
                            <p className="text-slate-400 leading-relaxed font-light">
                              Double-cliquez sur l'application. 
                              <span className="block mt-1 text-amber-400/95 font-medium font-sans">
                                🔒 Sécurité Gatekeeper : Si macOS affiche un message indiquant que le développeur n'est pas identifié, faites un clic droit (ou Ctrl+clic) sur l'application, sélectionnez "Ouvrir", puis cliquez sur "Ouvrir" dans la fenêtre de dialogue pour confirmer l'autorisation. Cette étape n'est requise qu'au premier lancement.
                              </span>
                            </p>
                          </div>
                        </div>

                        {/* Step 5 */}
                        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-850 flex items-start gap-3.5">
                          <span className="w-6 h-6 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 flex items-center justify-center font-mono font-bold shrink-0 text-xs">
                            5
                          </span>
                          <div className="space-y-1">
                            <p className="text-white font-bold">Portabilité Apple</p>
                            <p className="text-slate-400 leading-relaxed">
                              L'application fonctionne en autonomie complète depuis le support amovible et écrit ses sauvegardes directement dans le dossier <code className="font-mono text-[11px] bg-slate-950 px-1 py-0.5 rounded text-blue-300">I3A_data</code> sur votre clé USB.
                            </p>
                          </div>
                        </div>

                        {/* Step 6 */}
                        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-850 flex items-start gap-3.5">
                          <span className="w-6 h-6 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 flex items-center justify-center font-mono font-bold shrink-0 text-xs">
                            6
                          </span>
                          <div className="space-y-1">
                            <p className="text-white font-bold">Nettoyage</p>
                            <p className="text-slate-400 leading-relaxed">
                              Une fois extrait, vous pouvez supprimer le fichier <code className="text-slate-400 font-mono text-[11px] bg-slate-950 px-1 py-0.5 rounded">apprecIAtion_mac.zip</code>.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Linux Guide */}
                {installOsTab === "linux" && (
                  <div className="space-y-5 animate-fadeIn">
                    <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl text-xs text-slate-300 flex items-start gap-3">
                      <Terminal className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-white block mb-0.5">Compatibilité Linux</span>
                        Fonctionne de manière portable sur les distributions majeures (Ubuntu, Debian, Fedora, Mint, etc.).
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider text-slate-300">Étapes d'installation sur Linux</h4>
                      
                      <div className="space-y-3 text-xs">
                        {/* Step 1 */}
                        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-850 flex items-start gap-3.5">
                          <span className="w-6 h-6 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 flex items-center justify-center font-mono font-bold shrink-0 text-xs">
                            1
                          </span>
                          <div className="space-y-1">
                            <p className="text-white font-bold">Transfert sur clé USB</p>
                            <p className="text-slate-400 leading-relaxed font-light">
                              Copiez le package <code className="text-blue-300 font-mono text-[11px] bg-slate-950 px-1 py-0.5 rounded">apprecIAtion_linux.zip</code> sur votre clé USB.
                            </p>
                          </div>
                        </div>

                        {/* Step 2 */}
                        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-850 flex items-start gap-3.5">
                          <span className="w-6 h-6 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 flex items-center justify-center font-mono font-bold shrink-0 text-xs">
                            2
                          </span>
                          <div className="space-y-1">
                            <p className="text-white font-bold">Extraction</p>
                            <p className="text-slate-400 leading-relaxed font-light">
                              Décompressez l'archive à l'aide de votre gestionnaire d'archives ou en ligne de commande : <code className="font-mono text-[11px] bg-slate-950 px-1.5 py-0.5 rounded text-blue-300">unzip apprecIAtion_linux.zip</code>.
                            </p>
                          </div>
                        </div>

                        {/* Step 3 */}
                        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-850 flex items-start gap-3.5">
                          <span className="w-6 h-6 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 flex items-center justify-center font-mono font-bold shrink-0 text-xs">
                            3
                          </span>
                          <div className="space-y-1">
                            <p className="text-white font-bold">Vérification des éléments</p>
                            <p className="text-slate-400 leading-relaxed font-light">
                              Assurez-vous de la présence du dossier de base de données locale <code className="font-mono text-amber-500 text-[11px]">I3A_data</code> et du binaire <code className="font-mono text-emerald-500 text-[11px]">apprecIAtion</code>.
                            </p>
                          </div>
                        </div>

                        {/* Step 4 */}
                        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-850 flex items-start gap-3.5">
                          <span className="w-6 h-6 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 flex items-center justify-center font-mono font-bold shrink-0 text-xs">
                            4
                          </span>
                          <div className="space-y-1">
                            <p className="text-white font-bold">Attribution des droits d'exécution & Lancement</p>
                            <p className="text-slate-400 leading-relaxed font-light font-sans">
                              Par défaut, le fichier binaire extrait peut ne pas avoir l'autorisation d'être exécuté. Ouvrez un terminal dans le dossier et tapez :
                            </p>
                            <div className="mt-2 bg-slate-950/80 p-3 rounded-lg border border-slate-900 font-mono text-[11px] text-blue-300 space-y-1">
                              <p className="text-slate-500"># Rendre le programme exécutable</p>
                              <p>chmod +x apprecIAtion</p>
                              <p className="text-slate-500 mt-2"># Lancer l'application</p>
                              <p>./apprecIAtion</p>
                            </div>
                          </div>
                        </div>

                        {/* Step 5 */}
                        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-850 flex items-start gap-3.5">
                          <span className="w-6 h-6 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 flex items-center justify-center font-mono font-bold shrink-0 text-xs">
                            5
                          </span>
                          <div className="space-y-1">
                            <p className="text-white font-bold">Portabilité Linux</p>
                            <p className="text-slate-400 leading-relaxed font-light">
                              Toutes vos modifications de profils et clés d'API sont conservées dans le dossier local <code className="font-mono text-[11px] bg-slate-950 px-1 py-0.5 rounded text-blue-300">I3A_data</code> sans polluer le répertoire `/home` ou `/etc` de votre machine Linux hôte.
                            </p>
                          </div>
                        </div>

                        {/* Step 6 */}
                        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-850 flex items-start gap-3.5">
                          <span className="w-6 h-6 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 flex items-center justify-center font-mono font-bold shrink-0 text-xs">
                            6
                          </span>
                          <div className="space-y-1">
                            <p className="text-white font-bold">Nettoyage</p>
                            <p className="text-slate-400 leading-relaxed">
                              Vous pouvez effacer le fichier d'archive <code className="text-slate-400 font-mono text-[11px] bg-slate-950 px-1 py-0.5 rounded">apprecIAtion_linux.zip</code> pour gagner de l'espace sur la clé USB.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* =========================================================================
               TAB 4: RESOURCE BANK (PROMPTS MATIERE & ITEMS - POCKETBASE DIRECT)
               ========================================================================= */}
            {activeTab === "database" && (() => {
              const rawPromptsList = promptsMatiereList;
              const rawItemsList = itemsList;
              const rawSyntheseList = promptsSyntheseList;

              const isPack2 = Number(user?.pack) === 2 || user?.pack === "2" || user?.pack === 2;

              // Filtered Prompts
              const filteredPrompts = rawPromptsList.filter((item) => {
                const parsed = parsePromptItem(item);
                if (activePromptFilter === "officiel" && !parsed.isOfficiel) return false;
                if (activePromptFilter === "personnel" && parsed.isOfficiel) return false;

                if (searchPromptQuery.trim()) {
                  const q = searchPromptQuery.toLowerCase();
                  const matchNom = parsed.nom.toLowerCase().includes(q);
                  const matchDesc = parsed.description.toLowerCase().includes(q);
                  const matchText = parsed.text.toLowerCase().includes(q);
                  const matchTags = parsed.tags.some((t: string) => t.toLowerCase().includes(q));
                  return matchNom || matchDesc || matchText || matchTags;
                }
                return true;
              });

              // Filtered Items
              const filteredItems = rawItemsList.filter((item) => {
                const parsed = parseItemRecord(item);
                if (activeItemFilter === "officiel" && !parsed.isOfficiel) return false;
                if (activeItemFilter === "personnel" && parsed.isOfficiel) return false;

                if (searchItemQuery.trim()) {
                  const q = searchItemQuery.toLowerCase();
                  const matchNom = parsed.nom.toLowerCase().includes(q);
                  const matchDesc = parsed.description.toLowerCase().includes(q);
                  const matchText = parsed.text.toLowerCase().includes(q);
                  const matchTags = parsed.tags.some((t: string) => t.toLowerCase().includes(q));
                  return matchNom || matchDesc || matchText || matchTags;
                }
                return true;
              });

              // Filtered Synthese
              const filteredSynthese = rawSyntheseList.filter((item) => {
                const parsed = parseSyntheseItem(item);
                if (activeSyntheseFilter === "officiel" && !parsed.isOfficiel) return false;
                if (activeSyntheseFilter === "personnel" && parsed.isOfficiel) return false;

                if (searchSyntheseQuery.trim()) {
                  const q = searchSyntheseQuery.toLowerCase();
                  const matchNom = parsed.nom.toLowerCase().includes(q);
                  const matchDesc = parsed.description.toLowerCase().includes(q);
                  const matchText = parsed.text.toLowerCase().includes(q);
                  const matchTags = parsed.tags.some((t: string) => t.toLowerCase().includes(q));
                  return matchNom || matchDesc || matchText || matchTags;
                }
                return true;
              });

              const promptOfficielCount = rawPromptsList.filter(item => parsePromptItem(item).isOfficiel).length;
              const promptPersonnelCount = rawPromptsList.filter(item => !parsePromptItem(item).isOfficiel).length;

              const itemOfficielCount = rawItemsList.filter(item => parseItemRecord(item).isOfficiel).length;
              const itemPersonnelCount = rawItemsList.filter(item => !parseItemRecord(item).isOfficiel).length;

              const syntheseOfficielCount = rawSyntheseList.filter(item => parseSyntheseItem(item).isOfficiel).length;
              const synthesePersonnelCount = rawSyntheseList.filter(item => !parseSyntheseItem(item).isOfficiel).length;

              return (
                <div className="space-y-6">
                  {/* Category Toggle Bar: Prompts de matière vs Grilles d'items vs Prompts de synthèse (if pack 2) */}
                  <div className="flex items-center gap-2 p-1.5 bg-slate-900/90 rounded-2xl border border-slate-850 shadow-inner">
                    <button
                      onClick={() => setDbCategory("prompts")}
                      className={`flex-1 py-3 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        dbCategory === "prompts"
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/25"
                          : "text-slate-400 hover:text-white hover:bg-slate-850"
                      }`}
                    >
                      <BookOpen className="w-4 h-4 shrink-0" />
                      <span className="truncate">Prompts de matière ({rawPromptsList.length})</span>
                    </button>
                    <button
                      onClick={() => setDbCategory("items")}
                      className={`flex-1 py-3 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        dbCategory === "items"
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/25"
                          : "text-slate-400 hover:text-white hover:bg-slate-850"
                      }`}
                    >
                      <FileText className="w-4 h-4 shrink-0" />
                      <span className="truncate">Grilles d'items ({rawItemsList.length})</span>
                    </button>
                    {isPack2 && (
                      <button
                        onClick={() => setDbCategory("synthese")}
                        className={`flex-1 py-3 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          dbCategory === "synthese"
                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/25"
                            : "text-slate-400 hover:text-white hover:bg-slate-850"
                        }`}
                      >
                        <Sparkles className="w-4 h-4 shrink-0" />
                        <span className="truncate">Prompts de synthèse ({rawSyntheseList.length})</span>
                      </button>
                    )}
                  </div>

                  {/* SECTION 1: PROMPTS DE MATIERE */}
                  {dbCategory === "prompts" && (
                    <div className="space-y-6">
                      {/* Top Header Prompts */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-850">
                        <div>
                          <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
                            <span>Prompts de matière</span>
                            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-mono font-semibold">
                              {rawPromptsList.length} prompt(s)
                            </span>
                          </h3>
                          <p className="text-xs text-slate-400 mt-1">
                            Consultez la bibliothèque officielle de <strong className="text-slate-200">prompts_matiere</strong> ({promptOfficielCount}) et vos <strong className="text-indigo-400">prompts personnels</strong> ({promptPersonnelCount}).
                          </p>
                        </div>

                        <button
                          onClick={openCreatePromptModal}
                          className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-blue-500/20 transition-all cursor-pointer shrink-0"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Créer un prompt</span>
                        </button>
                      </div>

                      {/* Filter tabs and search bar for prompts */}
                      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-slate-900/80 p-3 rounded-xl border border-slate-850">
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                          <button
                            onClick={() => setActivePromptFilter("all")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                              activePromptFilter === "all"
                                ? "bg-blue-600 text-white font-semibold shadow-md"
                                : "bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-850"
                            }`}
                          >
                            Tous ({rawPromptsList.length})
                          </button>
                          <button
                            onClick={() => setActivePromptFilter("officiel")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                              activePromptFilter === "officiel"
                                ? "bg-emerald-600 text-white font-semibold shadow-md"
                                : "bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-850"
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Officiels ({promptOfficielCount})
                          </button>
                          <button
                            onClick={() => setActivePromptFilter("personnel")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                              activePromptFilter === "personnel"
                                ? "bg-indigo-600 text-white font-semibold shadow-md"
                                : "bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-850"
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                            Mes prompts personnels ({promptPersonnelCount})
                          </button>
                        </div>

                        <div className="relative flex-1 max-w-xs">
                          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="Rechercher par titre ou tag..."
                            value={searchPromptQuery}
                            onChange={(e) => setSearchPromptQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-850 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                          />
                          {searchPromptQuery && (
                            <button
                              onClick={() => setSearchPromptQuery("")}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Loading State */}
                      {loadingPromptsMatiere && (
                        <div className="p-8 text-center bg-slate-900/40 rounded-xl border border-slate-850 flex items-center justify-center gap-3 text-slate-400 text-xs">
                          <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                          <span>Chargement des prompts_matiere...</span>
                        </div>
                      )}

                      {/* Prompts Grid */}
                      {!loadingPromptsMatiere && (
                        <div className="space-y-3.5">
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-emerald-400" />
                            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                              {activePromptFilter === "officiel"
                                ? "Prompts Officiels"
                                : activePromptFilter === "personnel"
                                ? "Mes Prompts Personnels"
                                : "Tous les Prompts de matière"}
                            </h4>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {filteredPrompts.map((item) => {
                              const parsed = parsePromptItem(item);
                              const isCopied = copiedPromptStringId === parsed.id;

                              return (
                                <div
                                  key={parsed.id}
                                  className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 transition-all ${
                                    parsed.isOfficiel
                                      ? "bg-slate-900/60 border-slate-850 hover:border-slate-800"
                                      : "bg-indigo-950/20 border-indigo-500/30 hover:border-indigo-500/50 shadow-sm"
                                  }`}
                                >
                                  <div className="space-y-2.5">
                                    <div className="flex items-center justify-between gap-2">
                                      <span
                                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                                          parsed.isOfficiel
                                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                            : "bg-indigo-500/10 text-indigo-300 border-indigo-500/30"
                                        }`}
                                      >
                                        {parsed.isOfficiel ? "Officiel" : "Personnel"}
                                      </span>

                                      {!parsed.isOfficiel && (
                                        <div className="flex items-center gap-1">
                                          <button
                                            onClick={() => openEditPromptModal(item)}
                                            title="Modifier ce prompt"
                                            className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all cursor-pointer"
                                          >
                                            <Edit3 className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            onClick={() => handleDeletePrompt(parsed.id)}
                                            title="Supprimer ce prompt"
                                            disabled={deletingPromptId === parsed.id}
                                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer disabled:opacity-50"
                                          >
                                            {deletingPromptId === parsed.id ? (
                                              <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-400" />
                                            ) : (
                                              <Trash2 className="w-3.5 h-3.5" />
                                            )}
                                          </button>
                                        </div>
                                      )}

                                      {parsed.isOfficiel && (
                                        <button
                                          onClick={() => duplicatePromptToPersonal(item)}
                                          title="Créer une copie personnalisée dans mes prompts"
                                          className="text-[10px] text-slate-400 hover:text-blue-400 flex items-center gap-1 hover:underline cursor-pointer"
                                        >
                                          <Copy className="w-3 h-3" />
                                          <span>Dupliquer</span>
                                        </button>
                                      )}
                                    </div>

                                    <h5 className="text-xs font-bold text-white leading-relaxed">{parsed.nom}</h5>

                                    {parsed.tags.length > 0 && (
                                      <div className="flex flex-wrap gap-1">
                                        {parsed.tags.map((tag: string, idx: number) => (
                                          <span key={idx} className="text-[9px] bg-slate-950 text-slate-400 border border-slate-850 px-1.5 py-0.5 rounded">
                                            {tag}
                                          </span>
                                        ))}
                                      </div>
                                    )}

                                    {parsed.description && (
                                      <p className="text-[11px] text-slate-400 leading-relaxed font-light line-clamp-2">
                                        {parsed.description}
                                      </p>
                                    )}

                                    <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-900 text-[10px] text-slate-300 font-mono line-clamp-3">
                                      {parsed.text}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 pt-2 border-t border-slate-850/60">
                                    <button
                                      onClick={() => setViewingPrompt(item)}
                                      className="flex-1 bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-300 hover:text-white p-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                                    >
                                      <Eye className="w-3.5 h-3.5 text-slate-400" />
                                      <span>Consulter</span>
                                    </button>

                                    <button
                                      onClick={() => handleCopyPromptText(parsed.text, parsed.id)}
                                      className="flex-1 bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-300 hover:text-white p-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                                    >
                                      {isCopied ? (
                                        <>
                                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                                          <span className="text-emerald-400">Copié !</span>
                                        </>
                                      ) : (
                                        <>
                                          <Copy className="w-3.5 h-3.5" />
                                          <span>Copier</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {filteredPrompts.length === 0 && (
                            <div className="p-8 text-center bg-slate-900/30 rounded-xl border border-slate-850 space-y-2">
                              <BookOpen className="w-8 h-8 text-slate-600 mx-auto" />
                              <p className="text-xs text-slate-400 font-medium">Aucun prompt trouvé dans PocketBase.</p>
                              <button
                                onClick={openCreatePromptModal}
                                className="text-xs text-indigo-400 hover:text-indigo-300 underline font-semibold cursor-pointer"
                              >
                                Créer un prompt personnel dans PocketBase
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* SECTION 2: GRILLES D'ITEMS */}
                  {dbCategory === "items" && (
                    <div className="space-y-6">
                      {/* Top Header Items */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-850">
                        <div>
                          <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
                            <span>Grilles d'items</span>
                            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-mono font-semibold">
                              {rawItemsList.length} grille(s)
                            </span>
                          </h3>
                          <p className="text-xs text-slate-400 mt-1">
                            Consultez les grilles officielles d'<strong className="text-slate-200">items</strong> ({itemOfficielCount}) et vos <strong className="text-indigo-400">grilles d'items personnelles</strong> ({itemPersonnelCount}).
                          </p>
                        </div>

                        <button
                          onClick={openCreateItemModal}
                          className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-blue-500/20 transition-all cursor-pointer shrink-0"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Créer une grille d'items</span>
                        </button>
                      </div>

                      {/* Filter tabs and search bar for items */}
                      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-slate-900/80 p-3 rounded-xl border border-slate-850">
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                          <button
                            onClick={() => setActiveItemFilter("all")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                              activeItemFilter === "all"
                                ? "bg-blue-600 text-white font-semibold shadow-md"
                                : "bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-850"
                            }`}
                          >
                            Toutes ({rawItemsList.length})
                          </button>
                          <button
                            onClick={() => setActiveItemFilter("officiel")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                              activeItemFilter === "officiel"
                                ? "bg-emerald-600 text-white font-semibold shadow-md"
                                : "bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-850"
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Officielles ({itemOfficielCount})
                          </button>
                          <button
                            onClick={() => setActiveItemFilter("personnel")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                              activeItemFilter === "personnel"
                                ? "bg-indigo-600 text-white font-semibold shadow-md"
                                : "bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-850"
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                            Mes grilles personnelles ({itemPersonnelCount})
                          </button>
                        </div>

                        <div className="relative flex-1 max-w-xs">
                          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="Rechercher une grille d'items..."
                            value={searchItemQuery}
                            onChange={(e) => setSearchItemQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-850 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                          />
                          {searchItemQuery && (
                            <button
                              onClick={() => setSearchItemQuery("")}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Loading State for items */}
                      {loadingItems && (
                        <div className="p-8 text-center bg-slate-900/40 rounded-xl border border-slate-850 flex items-center justify-center gap-3 text-slate-400 text-xs">
                          <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                          <span>Chargement des grilles d'items...</span>
                        </div>
                      )}

                      {itemsError && (
                        <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl text-rose-400 text-xs flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{itemsError}</span>
                        </div>
                      )}

                      {/* Items Grid */}
                      {!loadingItems && (
                        <div className="space-y-3.5">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-emerald-400" />
                            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                              {activeItemFilter === "officiel"
                                ? "Grilles d'items Officielles"
                                : activeItemFilter === "personnel"
                                ? "Mes Grilles d'items Personnelles"
                                : "Toutes les Grilles d'items"}
                            </h4>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {filteredItems.map((item) => {
                              const parsed = parseItemRecord(item);
                              const isCopied = copiedItemStringId === parsed.id;

                              return (
                                <div
                                  key={parsed.id}
                                  className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 transition-all ${
                                    parsed.isOfficiel
                                      ? "bg-slate-900/60 border-slate-850 hover:border-slate-800"
                                      : "bg-indigo-950/20 border-indigo-500/30 hover:border-indigo-500/50 shadow-sm"
                                  }`}
                                >
                                  <div className="space-y-2.5">
                                    <div className="flex items-center justify-between gap-2">
                                      <span
                                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                                          parsed.isOfficiel
                                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                            : "bg-indigo-500/10 text-indigo-300 border-indigo-500/30"
                                        }`}
                                      >
                                        {parsed.isOfficiel ? "Officiel" : "Personnel"}
                                      </span>

                                      {!parsed.isOfficiel && (
                                        <div className="flex items-center gap-1">
                                          <button
                                            onClick={() => openEditItemModal(item)}
                                            title="Modifier cette grille"
                                            className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all cursor-pointer"
                                          >
                                            <Edit3 className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            onClick={() => handleDeleteItem(item)}
                                            title="Supprimer cette grille"
                                            disabled={deletingItemId === parsed.id}
                                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer disabled:opacity-50"
                                          >
                                            {deletingItemId === parsed.id ? (
                                              <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-400" />
                                            ) : (
                                              <Trash2 className="w-3.5 h-3.5" />
                                            )}
                                          </button>
                                        </div>
                                      )}

                                      {parsed.isOfficiel && (
                                        <button
                                          onClick={() => duplicateItemToPersonal(item)}
                                          title="Créer une copie personnalisée dans mes grilles"
                                          className="text-[10px] text-slate-400 hover:text-blue-400 flex items-center gap-1 hover:underline cursor-pointer"
                                        >
                                          <Copy className="w-3 h-3" />
                                          <span>Dupliquer</span>
                                        </button>
                                      )}
                                    </div>

                                    <h5 className="text-xs font-bold text-white leading-relaxed">{parsed.nom}</h5>

                                    {parsed.tags.length > 0 && (
                                      <div className="flex flex-wrap gap-1">
                                        {parsed.tags.map((tag: string, idx: number) => (
                                          <span key={idx} className="text-[9px] bg-slate-950 text-slate-400 border border-slate-850 px-1.5 py-0.5 rounded">
                                            {tag}
                                          </span>
                                        ))}
                                      </div>
                                    )}

                                    {parsed.description && (
                                      <p className="text-[11px] text-slate-400 leading-relaxed font-light line-clamp-2">
                                        {parsed.description}
                                      </p>
                                    )}

                                    <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-900 text-[10px] text-slate-300 font-mono line-clamp-3">
                                      {parsed.text}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 pt-2 border-t border-slate-850/60">
                                    <button
                                      onClick={() => setViewingItem(item)}
                                      className="flex-1 bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-300 hover:text-white p-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                                    >
                                      <Eye className="w-3.5 h-3.5 text-slate-400" />
                                      <span>Consulter</span>
                                    </button>

                                    <button
                                      onClick={() => handleCopyItemText(parsed.text, parsed.id)}
                                      className="flex-1 bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-300 hover:text-white p-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                                    >
                                      {isCopied ? (
                                        <>
                                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                                          <span className="text-emerald-400">Copié !</span>
                                        </>
                                      ) : (
                                        <>
                                          <Copy className="w-3.5 h-3.5" />
                                          <span>Copier</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {filteredItems.length === 0 && (
                            <div className="p-8 text-center bg-slate-900/30 rounded-xl border border-slate-850 space-y-2">
                              <FileText className="w-8 h-8 text-slate-600 mx-auto" />
                              <p className="text-xs text-slate-400 font-medium">Aucune grille d'items trouvée dans PocketBase.</p>
                              <button
                                onClick={openCreateItemModal}
                                className="text-xs text-indigo-400 hover:text-indigo-300 underline font-semibold cursor-pointer"
                              >
                                Créer une grille d'items personnelle dans PocketBase
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* SECTION 3: PROMPTS DE SYNTHESE */}
                  {dbCategory === "synthese" && isPack2 && (
                    <div className="space-y-6">
                      {/* Top Header Synthese */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-850">
                        <div>
                          <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
                            <span>Prompts de synthèse</span>
                            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-mono font-semibold">
                              {rawSyntheseList.length} prompt(s)
                            </span>
                          </h3>
                          <p className="text-xs text-slate-400 mt-1">
                            Consultez la bibliothèque officielle de <strong className="text-slate-200">prompts_synthese</strong> ({syntheseOfficielCount}) et vos <strong className="text-indigo-400">prompts personnels</strong> ({synthesePersonnelCount}).
                          </p>
                        </div>

                        <button
                          onClick={openCreateSyntheseModal}
                          className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-blue-500/20 transition-all cursor-pointer shrink-0"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Créer un prompt de synthèse</span>
                        </button>
                      </div>

                      {/* Filter tabs and search bar for synthese */}
                      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-slate-900/80 p-3 rounded-xl border border-slate-850">
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                          <button
                            onClick={() => setActiveSyntheseFilter("all")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                              activeSyntheseFilter === "all"
                                ? "bg-blue-600 text-white font-semibold shadow-md"
                                : "bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-850"
                            }`}
                          >
                            Tous ({rawSyntheseList.length})
                          </button>
                          <button
                            onClick={() => setActiveSyntheseFilter("officiel")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                              activeSyntheseFilter === "officiel"
                                ? "bg-emerald-600 text-white font-semibold shadow-md"
                                : "bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-850"
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Officiels ({syntheseOfficielCount})
                          </button>
                          <button
                            onClick={() => setActiveSyntheseFilter("personnel")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                              activeSyntheseFilter === "personnel"
                                ? "bg-indigo-600 text-white font-semibold shadow-md"
                                : "bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-850"
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                            Mes prompts personnels ({synthesePersonnelCount})
                          </button>
                        </div>

                        <div className="relative flex-1 max-w-xs">
                          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="Rechercher par titre ou tag..."
                            value={searchSyntheseQuery}
                            onChange={(e) => setSearchSyntheseQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-850 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                          />
                          {searchSyntheseQuery && (
                            <button
                              onClick={() => setSearchSyntheseQuery("")}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Loading State */}
                      {loadingPromptsSynthese && (
                        <div className="p-8 text-center bg-slate-900/40 rounded-xl border border-slate-850 flex items-center justify-center gap-3 text-slate-400 text-xs">
                          <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                          <span>Chargement des prompts_synthese...</span>
                        </div>
                      )}

                      {promptsSyntheseError && (
                        <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl text-rose-400 text-xs flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{promptsSyntheseError}</span>
                        </div>
                      )}

                      {/* Synthese Grid */}
                      {!loadingPromptsSynthese && (
                        <div className="space-y-3.5">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-emerald-400" />
                            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                              {activeSyntheseFilter === "officiel"
                                ? "Prompts Officiels"
                                : activeSyntheseFilter === "personnel"
                                ? "Mes Prompts Personnels"
                                : "Tous les Prompts de synthèse"}
                            </h4>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {filteredSynthese.map((item) => {
                              const parsed = parseSyntheseItem(item);
                              const isCopied = copiedSyntheseStringId === parsed.id;
                              const isDeleting = deletingSyntheseId === parsed.id;

                              return (
                                <div
                                  key={parsed.id}
                                  className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 transition-all ${
                                    parsed.isOfficiel
                                      ? "bg-slate-900/60 border-slate-850 hover:border-slate-800"
                                      : "bg-indigo-950/20 border-indigo-500/30 hover:border-indigo-500/50 shadow-sm"
                                  }`}
                                >
                                  <div className="space-y-2.5">
                                    <div className="flex items-center justify-between gap-2">
                                      <span
                                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                                          parsed.isOfficiel
                                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                            : "bg-indigo-500/10 text-indigo-300 border-indigo-500/30"
                                        }`}
                                      >
                                        {parsed.isOfficiel ? "Officiel" : "Personnel"}
                                      </span>

                                      {!parsed.isOfficiel && (
                                        <div className="flex items-center gap-1">
                                          <button
                                            onClick={() => openEditSyntheseModal(item)}
                                            title="Modifier ce prompt"
                                            className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all cursor-pointer"
                                          >
                                            <Edit3 className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            onClick={() => handleDeleteSynthese(item)}
                                            title="Supprimer ce prompt"
                                            disabled={isDeleting}
                                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer disabled:opacity-50"
                                          >
                                            {isDeleting ? (
                                              <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-400" />
                                            ) : (
                                              <Trash2 className="w-3.5 h-3.5" />
                                            )}
                                          </button>
                                        </div>
                                      )}

                                      {parsed.isOfficiel && (
                                        <button
                                          onClick={() => duplicateSyntheseToPersonal(item)}
                                          title="Créer une copie personnalisée dans mes prompts de synthèse"
                                          className="text-[10px] text-slate-400 hover:text-blue-400 flex items-center gap-1 hover:underline cursor-pointer"
                                        >
                                          <Copy className="w-3 h-3" />
                                          <span>Dupliquer</span>
                                        </button>
                                      )}
                                    </div>

                                    <h5 className="text-xs font-bold text-white leading-relaxed">{parsed.nom}</h5>

                                    {parsed.tags.length > 0 && (
                                      <div className="flex flex-wrap gap-1">
                                        {parsed.tags.map((tag: string, idx: number) => (
                                          <span key={idx} className="text-[9px] bg-slate-950 text-slate-400 border border-slate-850 px-1.5 py-0.5 rounded">
                                            {tag}
                                          </span>
                                        ))}
                                      </div>
                                    )}

                                    {parsed.description && (
                                      <p className="text-[11px] text-slate-400 leading-relaxed font-light line-clamp-2">
                                        {parsed.description}
                                      </p>
                                    )}

                                    <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-900 text-[10px] text-slate-300 font-mono line-clamp-3">
                                      {parsed.text}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 pt-2 border-t border-slate-850/60">
                                    <button
                                      onClick={() => setViewingSynthese(item)}
                                      className="flex-1 bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-300 hover:text-white p-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                                    >
                                      <Eye className="w-3.5 h-3.5 text-slate-400" />
                                      <span>Consulter</span>
                                    </button>

                                    <button
                                      onClick={() => handleCopySyntheseText(parsed.text, parsed.id)}
                                      className="flex-1 bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-300 hover:text-white p-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                                    >
                                      {isCopied ? (
                                        <>
                                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                                          <span className="text-emerald-400">Copié !</span>
                                        </>
                                      ) : (
                                        <>
                                          <Copy className="w-3.5 h-3.5" />
                                          <span>Copier</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {filteredSynthese.length === 0 && (
                            <div className="p-8 text-center bg-slate-900/30 rounded-xl border border-slate-850 space-y-2">
                              <Sparkles className="w-8 h-8 text-slate-600 mx-auto" />
                              <p className="text-xs text-slate-400 font-medium">Aucun prompt de synthèse trouvé dans PocketBase.</p>
                              <button
                                onClick={openCreateSyntheseModal}
                                className="text-xs text-indigo-400 hover:text-indigo-300 underline font-semibold cursor-pointer"
                              >
                                Créer un prompt de synthèse personnel dans PocketBase
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* CREATE / EDIT PROMPT MODAL */}
                  {showPromptModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative animate-in fade-in zoom-in-95">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-indigo-400" />
                            <h4 className="text-sm font-bold text-white font-display">
                              {editingPrompt ? "Modifier mon prompt" : "Créer un prompt personnel"}
                            </h4>
                          </div>
                          <button
                            onClick={() => setShowPromptModal(false)}
                            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <form onSubmit={handleSavePrompt} className="space-y-4">
                          {promptModalError && (
                            <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl text-rose-400 text-xs flex items-center gap-2">
                              <AlertCircle className="w-4 h-4 shrink-0" />
                              <span>{promptModalError}</span>
                            </div>
                          )}

                          <div className="flex items-center justify-between bg-slate-950/80 p-2 rounded-xl border border-slate-800">
                            <span className="text-[11px] text-slate-400 font-medium pl-1">
                              Format du contenu (contenu)
                            </span>
                            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                              <button
                                type="button"
                                onClick={() => setPromptJsonMode(false)}
                                className={`px-2.5 py-1 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                                  !promptJsonMode
                                    ? "bg-indigo-600 text-white shadow"
                                    : "text-slate-400 hover:text-white"
                                }`}
                              >
                                Formulaire
                              </button>
                              <button
                                type="button"
                                onClick={() => setPromptJsonMode(true)}
                                className={`px-2.5 py-1 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                                  promptJsonMode
                                    ? "bg-indigo-600 text-white shadow"
                                    : "text-slate-400 hover:text-white"
                                }`}
                              >
                                JSON Brut
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1">
                              Nom du fichier / Intitulé <span className="text-rose-400">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="Ex: prompt_francais.json"
                              value={promptNom}
                              onChange={(e) => setPromptNom(e.target.value)}
                              className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono focus:border-indigo-500 focus:outline-none"
                            />
                          </div>

                          {!promptJsonMode ? (
                            <>
                              <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">
                                  Description / Objectif pédagogique
                                </label>
                                <input
                                  type="text"
                                  placeholder="Ex: Utilisé pour commenter la rigueur d'argumentation..."
                                  value={promptDescription}
                                  onChange={(e) => setPromptDescription(e.target.value)}
                                  className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-indigo-500 focus:outline-none"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">
                                  Tags / Mots-clés (séparés par des virgules)
                                </label>
                                <input
                                  type="text"
                                  placeholder="Ex: Français, Lycée, Méthode, Dissertation"
                                  value={promptTags}
                                  onChange={(e) => setPromptTags(e.target.value)}
                                  className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-indigo-500 focus:outline-none"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">
                                  Contenu du prompt <span className="text-rose-400">*</span>
                                </label>
                                <textarea
                                  required
                                  rows={5}
                                  placeholder="Rédigez ici les instructions..."
                                  value={promptText}
                                  onChange={(e) => setPromptText(e.target.value)}
                                  className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono focus:border-indigo-500 focus:outline-none"
                                />
                              </div>
                            </>
                          ) : (
                            <div>
                              <label className="block text-xs font-semibold text-slate-300 mb-1">
                                Objet JSON du contenu (contenu) <span className="text-rose-400">*</span>
                              </label>
                              <textarea
                                required
                                rows={8}
                                placeholder='{\n  "text": "...",\n  "description": "...",\n  "tags": ["Maths"]\n}'
                                value={promptRawJsonText}
                                onChange={(e) => setPromptRawJsonText(e.target.value)}
                                className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-emerald-400 font-mono focus:border-indigo-500 focus:outline-none"
                              />
                            </div>
                          )}

                          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                            <button
                              type="button"
                              onClick={() => setShowPromptModal(false)}
                              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-all cursor-pointer"
                            >
                              Annuler
                            </button>
                            <button
                              type="submit"
                              disabled={savingPrompt}
                              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
                            >
                              {savingPrompt ? (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  <span>Enregistrement...</span>
                                </>
                              ) : (
                                <>
                                  <Save className="w-3.5 h-3.5" />
                                  <span>Enregistrer le prompt</span>
                                </>
                              )}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* VIEW PROMPT MODAL */}
                  {viewingPrompt && (() => {
                    const parsed = parsePromptItem(viewingPrompt);
                    const isCopied = copiedPromptStringId === parsed.id;

                    return (
                      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative animate-in fade-in zoom-in-95">
                          <div className="flex items-start justify-between pb-3 border-b border-slate-800 gap-3">
                            <div className="space-y-1">
                              <span
                                className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider inline-block ${
                                  parsed.isOfficiel
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                    : "bg-indigo-500/10 text-indigo-300 border-indigo-500/30"
                                }`}
                              >
                                {parsed.isOfficiel ? "Prompt Officiel" : "Prompt Personnel"}
                              </span>
                              <h4 className="text-sm font-bold text-white font-display">{parsed.nom}</h4>
                            </div>
                            <button
                              onClick={() => setViewingPrompt(null)}
                              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          {parsed.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {parsed.tags.map((tag: string, idx: number) => (
                                <span key={idx} className="text-[10px] bg-slate-950 text-slate-300 border border-slate-800 px-2 py-0.5 rounded-md font-medium">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}

                          {parsed.description && (
                            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/50 p-3 rounded-lg border border-slate-850">
                              {parsed.description}
                            </p>
                          )}

                          <div>
                            <label className="block text-[10px] uppercase font-mono tracking-wider font-bold text-slate-400 mb-1.5">
                              Contenu complet du prompt :
                            </label>
                            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-200 font-mono leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap">
                              {parsed.text}
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                            {!parsed.isOfficiel ? (
                              <button
                                onClick={() => {
                                  const target = viewingPrompt;
                                  setViewingPrompt(null);
                                  openEditPromptModal(target);
                                }}
                                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1.5 cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Modifier ce prompt</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  const target = viewingPrompt;
                                  setViewingPrompt(null);
                                  duplicatePromptToPersonal(target);
                                }}
                                className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1.5 cursor-pointer"
                              >
                                <Copy className="w-3.5 h-3.5" />
                                <span>Créer une copie personnalisée</span>
                              </button>
                            )}

                            <button
                              onClick={() => handleCopyPromptText(parsed.text, parsed.id)}
                              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                            >
                              {isCopied ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                                  <span>Copié !</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copier le prompt</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* CREATE / EDIT ITEM MODAL */}
                  {showItemModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative animate-in fade-in zoom-in-95">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                          <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-indigo-400" />
                            <h4 className="text-sm font-bold text-white font-display">
                              {editingItem ? "Modifier ma grille d'items" : "Créer une grille d'items"}
                            </h4>
                          </div>
                          <button
                            onClick={() => setShowItemModal(false)}
                            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <form onSubmit={handleSaveItem} className="space-y-4">
                          {itemModalError && (
                            <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl text-rose-400 text-xs flex items-center gap-2">
                              <AlertCircle className="w-4 h-4 shrink-0" />
                              <span>{itemModalError}</span>
                            </div>
                          )}

                          <div className="flex items-center justify-between bg-slate-950/80 p-2 rounded-xl border border-slate-800">
                            <span className="text-[11px] text-slate-400 font-medium pl-1">
                              Format du contenu (contenu)
                            </span>
                            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                              <button
                                type="button"
                                onClick={() => setItemJsonMode(false)}
                                className={`px-2.5 py-1 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                                  !itemJsonMode
                                    ? "bg-indigo-600 text-white shadow"
                                    : "text-slate-400 hover:text-white"
                                }`}
                              >
                                Formulaire
                              </button>
                              <button
                                type="button"
                                onClick={() => setItemJsonMode(true)}
                                className={`px-2.5 py-1 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                                  itemJsonMode
                                    ? "bg-indigo-600 text-white shadow"
                                    : "text-slate-400 hover:text-white"
                                }`}
                              >
                                JSON Brut
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1">
                              Nom du fichier / Intitulé <span className="text-rose-400">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="Ex: grille_evaluation_maths.json"
                              value={itemNom}
                              onChange={(e) => setItemNom(e.target.value)}
                              className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono focus:border-indigo-500 focus:outline-none"
                            />
                          </div>

                          {!itemJsonMode ? (
                            <>
                              <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">
                                  Description / Objectif
                                </label>
                                <input
                                  type="text"
                                  placeholder="Ex: Grille d'évaluation par compétences..."
                                  value={itemDescription}
                                  onChange={(e) => setItemDescription(e.target.value)}
                                  className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-indigo-500 focus:outline-none"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">
                                  Tags / Mots-clés (séparés par des virgules)
                                </label>
                                <input
                                  type="text"
                                  placeholder="Ex: Mathématiques, Grille, Seconde"
                                  value={itemTags}
                                  onChange={(e) => setItemTags(e.target.value)}
                                  className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-indigo-500 focus:outline-none"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">
                                  Contenu de la grille d'items <span className="text-rose-400">*</span>
                                </label>
                                <textarea
                                  required
                                  rows={5}
                                  placeholder="Rédigez ou collez ici la grille d'items..."
                                  value={itemText}
                                  onChange={(e) => setItemText(e.target.value)}
                                  className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono focus:border-indigo-500 focus:outline-none"
                                />
                              </div>
                            </>
                          ) : (
                            <div>
                              <label className="block text-xs font-semibold text-slate-300 mb-1">
                                Objet JSON du contenu (contenu) <span className="text-rose-400">*</span>
                              </label>
                              <textarea
                                required
                                rows={8}
                                placeholder='{\n  "text": "...",\n  "description": "...",\n  "tags": ["Item1"]\n}'
                                value={itemRawJsonText}
                                onChange={(e) => setItemRawJsonText(e.target.value)}
                                className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-emerald-400 font-mono focus:border-indigo-500 focus:outline-none"
                              />
                            </div>
                          )}

                          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                            <button
                              type="button"
                              onClick={() => setShowItemModal(false)}
                              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-all cursor-pointer"
                            >
                              Annuler
                            </button>
                            <button
                              type="submit"
                              disabled={savingItem}
                              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
                            >
                              {savingItem ? (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  <span>Enregistrement...</span>
                                </>
                              ) : (
                                <>
                                  <Save className="w-3.5 h-3.5" />
                                  <span>Enregistrer la grille</span>
                                </>
                              )}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* VIEW ITEM MODAL */}
                  {viewingItem && (() => {
                    const parsed = parseItemRecord(viewingItem);
                    const isCopied = copiedItemStringId === parsed.id;

                    return (
                      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative animate-in fade-in zoom-in-95">
                          <div className="flex items-start justify-between pb-3 border-b border-slate-800 gap-3">
                            <div className="space-y-1">
                              <span
                                className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider inline-block ${
                                  parsed.isOfficiel
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                    : "bg-indigo-500/10 text-indigo-300 border-indigo-500/30"
                                }`}
                              >
                                {parsed.isOfficiel ? "Grille Officielle" : "Grille Personnelle"}
                              </span>
                              <h4 className="text-sm font-bold text-white font-display">{parsed.nom}</h4>
                            </div>
                            <button
                              onClick={() => setViewingItem(null)}
                              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          {parsed.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {parsed.tags.map((tag: string, idx: number) => (
                                <span key={idx} className="text-[10px] bg-slate-950 text-slate-300 border border-slate-800 px-2 py-0.5 rounded-md font-medium">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}

                          {parsed.description && (
                            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/50 p-3 rounded-lg border border-slate-850">
                              {parsed.description}
                            </p>
                          )}

                          <div>
                            <label className="block text-[10px] uppercase font-mono tracking-wider font-bold text-slate-400 mb-1.5">
                              Contenu complet de la grille :
                            </label>
                            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-200 font-mono leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap">
                              {parsed.text}
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                            {!parsed.isOfficiel ? (
                              <button
                                onClick={() => {
                                  const target = viewingItem;
                                  setViewingItem(null);
                                  openEditItemModal(target);
                                }}
                                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1.5 cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Modifier cette grille</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  const target = viewingItem;
                                  setViewingItem(null);
                                  duplicateItemToPersonal(target);
                                }}
                                className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1.5 cursor-pointer"
                              >
                                <Copy className="w-3.5 h-3.5" />
                                <span>Créer une copie personnalisée</span>
                              </button>
                            )}

                            <button
                              onClick={() => handleCopyItemText(parsed.text, parsed.id)}
                              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                            >
                              {isCopied ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                                  <span>Copiée !</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copier la grille</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* CREATE / EDIT SYNTHESE MODAL */}
                  {showSyntheseModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative animate-in fade-in zoom-in-95">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-indigo-400" />
                            <h4 className="text-sm font-bold text-white font-display">
                              {editingSynthese ? "Modifier mon prompt de synthèse" : "Créer un prompt de synthèse"}
                            </h4>
                          </div>
                          <button
                            onClick={() => setShowSyntheseModal(false)}
                            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <form onSubmit={handleSaveSynthese} className="space-y-4">
                          {syntheseModalError && (
                            <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl text-rose-400 text-xs flex items-center gap-2">
                              <AlertCircle className="w-4 h-4 shrink-0" />
                              <span>{syntheseModalError}</span>
                            </div>
                          )}

                          <div className="flex items-center justify-between bg-slate-950/80 p-2 rounded-xl border border-slate-880">
                            <span className="text-[11px] text-slate-400 font-medium pl-1">
                              Format du contenu (contenu)
                            </span>
                            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                              <button
                                type="button"
                                onClick={() => setSyntheseJsonMode(false)}
                                className={`px-2.5 py-1 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                                  !syntheseJsonMode
                                    ? "bg-indigo-600 text-white shadow"
                                    : "text-slate-400 hover:text-white"
                                }`}
                              >
                                Formulaire
                              </button>
                              <button
                                type="button"
                                onClick={() => setSyntheseJsonMode(true)}
                                className={`px-2.5 py-1 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                                  syntheseJsonMode
                                    ? "bg-indigo-600 text-white shadow"
                                    : "text-slate-400 hover:text-white"
                                }`}
                              >
                                JSON Brut
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1">
                              Nom du fichier / Intitulé <span className="text-rose-400">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="Ex: appréciation_PP.json"
                              value={syntheseNom}
                              onChange={(e) => setSyntheseNom(e.target.value)}
                              className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono focus:border-indigo-500 focus:outline-none"
                            />
                          </div>

                          {!syntheseJsonMode ? (
                            <>
                              <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">
                                  Description / Objectif
                                </label>
                                <input
                                  type="text"
                                  placeholder="Ex: Prompt de synthèse pour appréciations générales..."
                                  value={syntheseDescription}
                                  onChange={(e) => setSyntheseDescription(e.target.value)}
                                  className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-indigo-500 focus:outline-none"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">
                                  Tags / Mots-clés (séparés par des virgules)
                                </label>
                                <input
                                  type="text"
                                  placeholder="Ex: Synthèse, Bilan, Trimestre"
                                  value={syntheseTags}
                                  onChange={(e) => setSyntheseTags(e.target.value)}
                                  className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-indigo-500 focus:outline-none"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">
                                  Contenu du prompt de synthèse <span className="text-rose-400">*</span>
                                </label>
                                <textarea
                                  required
                                  rows={5}
                                  placeholder="Rédigez ou collez ici les instructions du prompt..."
                                  value={syntheseText}
                                  onChange={(e) => setSyntheseText(e.target.value)}
                                  className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono focus:border-indigo-500 focus:outline-none"
                                />
                              </div>
                            </>
                          ) : (
                            <div>
                              <label className="block text-xs font-semibold text-slate-300 mb-1">
                                Objet JSON du contenu (contenu) <span className="text-rose-400">*</span>
                              </label>
                              <textarea
                                required
                                rows={8}
                                placeholder='{\n  "text": "...",\n  "description": "...",\n  "tags": ["Synthèse"]\n}'
                                value={syntheseRawJsonText}
                                onChange={(e) => setSyntheseRawJsonText(e.target.value)}
                                className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-emerald-400 font-mono focus:border-indigo-500 focus:outline-none"
                              />
                            </div>
                          )}

                          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                            <button
                              type="button"
                              onClick={() => setShowSyntheseModal(false)}
                              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-all cursor-pointer"
                            >
                              Annuler
                            </button>
                            <button
                              type="submit"
                              disabled={savingSynthese}
                              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
                            >
                              {savingSynthese ? (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  <span>Enregistrement...</span>
                                </>
                              ) : (
                                <>
                                  <Save className="w-3.5 h-3.5" />
                                  <span>Enregistrer le prompt</span>
                                </>
                              )}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* VIEW SYNTHESE MODAL */}
                  {viewingSynthese && (() => {
                    const parsed = parseSyntheseItem(viewingSynthese);
                    const isCopied = copiedSyntheseStringId === parsed.id;

                    return (
                      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative animate-in fade-in zoom-in-95">
                          <div className="flex items-start justify-between pb-3 border-b border-slate-800 gap-3">
                            <div className="space-y-1">
                              <span
                                className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider inline-block ${
                                  parsed.isOfficiel
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                    : "bg-indigo-500/10 text-indigo-300 border-indigo-500/30"
                                }`}
                              >
                                {parsed.isOfficiel ? "Officiel" : "Personnel"}
                              </span>
                              <h4 className="text-sm font-bold text-white font-display">{parsed.nom}</h4>
                            </div>
                            <button
                              onClick={() => setViewingSynthese(null)}
                              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          {parsed.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {parsed.tags.map((tag: string, idx: number) => (
                                <span key={idx} className="text-[10px] bg-slate-950 text-slate-300 border border-slate-850 px-2 py-0.5 rounded-md font-medium">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}

                          {parsed.description && (
                            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/50 p-3 rounded-lg border border-slate-850">
                              {parsed.description}
                            </p>
                          )}

                          <div>
                            <label className="block text-[10px] uppercase font-mono tracking-wider font-bold text-slate-400 mb-1.5">
                              Contenu complet du prompt de synthèse :
                            </label>
                            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-200 font-mono leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap">
                              {parsed.text}
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                            {!parsed.isOfficiel ? (
                              <button
                                onClick={() => {
                                  const target = viewingSynthese;
                                  setViewingSynthese(null);
                                  openEditSyntheseModal(target);
                                }}
                                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1.5 cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Modifier ce prompt</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  const target = viewingSynthese;
                                  setViewingSynthese(null);
                                  duplicateSyntheseToPersonal(target);
                                }}
                                className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1.5 cursor-pointer"
                              >
                                <Copy className="w-3.5 h-3.5" />
                                <span>Créer une copie personnalisée</span>
                              </button>
                            )}

                            <button
                              onClick={() => handleCopySyntheseText(parsed.text, parsed.id)}
                              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                            >
                              {isCopied ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                                  <span>Copié !</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copier le prompt</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                </div>
              );
            })()}

          </div>

        </div>
      )}
    </div>
  );
}
