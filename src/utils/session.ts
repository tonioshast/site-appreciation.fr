/**
 * Gestionnaire de session sécurisée pour ApprécIAtion.
 * 
 * Règles de sécurité :
 * 1. Déconnexion automatique dès fermeture du navigateur ou de l'onglet (via sessionStorage).
 * 2. Déconnexion automatique après 30 minutes d'inactivité (1 800 000 ms).
 * 3. Nettoyage préventif des anciens résidus de localStorage pour empêcher toute session permanente.
 */

export const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

const SESSION_USER_KEY = "pb_session_user";
const SESSION_TOKEN_KEY = "pb_session_token";
const SESSION_LAST_ACTIVE_KEY = "pb_session_last_active";

// Anciennes clés du localStorage à nettoyer
const LEGACY_STORAGE_KEYS = [
  "pb_user",
  "pb_token",
  "pb_auth_token",
  "pocketbase_auth",
  "token",
  "auth_token"
];

/**
 * Nettoie les anciens tokens persistants du localStorage
 */
export function purgeLegacyStorage(): void {
  try {
    for (const key of LEGACY_STORAGE_KEYS) {
      localStorage.removeItem(key);
    }
  } catch {
    // Ignorer si les cookies/storage sont restreints
  }
}

/**
 * Enregistre la session utilisateur en mémoire de session (détruite à la fermeture de l'onglet)
 */
export function saveSession(user: any, token?: string): void {
  try {
    // Purge préventive de l'ancien stockage persistant
    purgeLegacyStorage();

    const tokenToSave = token || user?.token || user?.auth_token || user?.session_token || "";

    const userObj = { ...user };
    if (tokenToSave) {
      userObj.token = tokenToSave;
      sessionStorage.setItem(SESSION_TOKEN_KEY, tokenToSave);
    }

    sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(userObj));
    sessionStorage.setItem(SESSION_LAST_ACTIVE_KEY, Date.now().toString());
  } catch (err) {
    console.error("[Session] Erreur lors de l'enregistrement de la session :", err);
  }
}

/**
 * Récupère la session utilisateur si elle est active et non expirée (< 30 minutes)
 */
export function getSession(): any | null {
  try {
    // Supprime tout reste de persistance indéfinie
    purgeLegacyStorage();

    const rawUser = sessionStorage.getItem(SESSION_USER_KEY);
    const rawLastActive = sessionStorage.getItem(SESSION_LAST_ACTIVE_KEY);

    if (!rawUser || !rawLastActive) {
      return null;
    }

    const lastActive = parseInt(rawLastActive, 10);
    const now = Date.now();

    // Vérification du délai d'inactivité de 30 minutes
    if (isNaN(lastActive) || now - lastActive > INACTIVITY_TIMEOUT_MS) {
      console.warn("[Session] Session expirée après 30 minutes d'inactivité.");
      clearSession();
      return null;
    }

    // Mise à jour de l'horodatage d'activité
    sessionStorage.setItem(SESSION_LAST_ACTIVE_KEY, now.toString());

    return JSON.parse(rawUser);
  } catch (err) {
    console.error("[Session] Erreur lors de la lecture de la session :", err);
    clearSession();
    return null;
  }
}

/**
 * Récupère le jeton d'authentification courant
 */
export function getSessionToken(): string {
  try {
    const directToken = sessionStorage.getItem(SESSION_TOKEN_KEY);
    if (directToken) return directToken;

    const user = getSession();
    return user?.token || user?.auth_token || user?.session_token || "";
  } catch {
    return "";
  }
}

/**
 * Renouvelle l'horodatage de dernière activité de l'utilisateur
 */
let lastTouch = 0;
export function touchSession(): void {
  const now = Date.now();
  // Limitation à une écriture toutes les 5 secondes pour économiser les I/O
  if (now - lastTouch < 5000) return;
  lastTouch = now;

  try {
    if (sessionStorage.getItem(SESSION_USER_KEY)) {
      sessionStorage.setItem(SESSION_LAST_ACTIVE_KEY, now.toString());
    }
  } catch {
    // Ignorer
  }
}

/**
 * Détruit entièrement la session
 */
export function clearSession(): void {
  try {
    sessionStorage.removeItem(SESSION_USER_KEY);
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
    sessionStorage.removeItem(SESSION_LAST_ACTIVE_KEY);
  } catch {
    // Ignorer
  }
  purgeLegacyStorage();
}
