# Sécurité des Sessions : Expiration après 30 min & Fermeture du Navigateur

## 1. Contexte & Objectif de Sécurité

Dans le cadre scolaire et professionnel, les enseignants utilisent fréquemment des ordinateurs partagés (en salle des professeurs, en salle de classe reliée au vidéoprojecteur, ou sur des postes administratifs).

Auparavant, la connexion était stockée de manière permanente dans le `localStorage` du navigateur sans date limite, maintenant le compte ouvert indéfiniment même après extinction du poste.

**Objectif atteint :**
1. **Déconnexion automatique dès fermeture du navigateur ou de l'onglet** (stockage éphémère en mémoire de session).
2. **Déconnexion automatique après 30 minutes d'inactivité** (si l'ordinateur est laissé allumé sans surveillance).
3. **Poursuite du travail transparente tant que l'enseignant est actif** (les clics, frappes au clavier et défilements réinitialisent le compteur de 30 minutes).

---

## 2. Architecture Technique (`src/utils/session.ts`)

Le module `src/utils/session.ts` centralise la politique de sécurité des sessions :

```typescript
export const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes (1 800 000 ms)
```

### Mécanismes clés :

1. **Utilisation de `sessionStorage` :**
   - Les clés `pb_session_user`, `pb_session_token` et `pb_session_last_active` sont écrites exclusivement dans `sessionStorage`.
   - La spécification HTML5 garantit que `sessionStorage` est physiquement détruit par le navigateur dès que l'onglet ou la fenêtre est fermée.

2. **Purge préventive des résidus (`purgeLegacyStorage`) :**
   - À chaque lecture ou écriture de session, toute trace résiduelle de session permanente issue de l'ancienne version (`pb_user`, `pb_token` dans `localStorage`) est automatiquement nettoyée.

3. **Horodatage d'inactivité et renouvellement intelligent (`touchSession`) :**
   - L'horodatage `pb_session_last_active` enregistre l'heure exacte de la dernière action de l'utilisateur.
   - Les événements utilisateurs (`mousemove`, `keydown`, `click`, `scroll`) appellent `touchSession()`.
   - Une temporisation (throttle de 5 secondes) évite les écritures excessives en mémoire tout en garantissant un suivi précis.

4. **Déconnexion proactive en arrière-plan (`App.tsx`) :**
   - Un intervalle régulier vérifie l'état de la session.
   - Si les 30 minutes d'inactivité sont atteintes sans action de l'enseignant, la session est invalidée immédiatement en direct à l'écran, ramenant l'application à l'état déconnecté.

---

## 3. Fichiers Concernés

| Fichier | Rôle dans le dispositif |
| :--- | :--- |
| **`src/utils/session.ts`** | Module central de gestion de session, calcul du délai de 30 min et purge du stockage. |
| **`src/App.tsx`** | Initialisation de l'état utilisateur via `getSession()`, écouteurs d'activité utilisateur et timer de vérification. |
| **`src/components/MyAccount.tsx`** | Remplacement des écritures directes `localStorage` par `saveSession()` (connexion) et `clearSession()` (déconnexion). |

---

## 4. Résultats & Conformité RGPD

- **Protection contre le vol de session physique :** Si un enseignant s'éloigne de son bureau sans verrouiller sa session, celle-ci s'éteint automatiquement au bout de 30 minutes.
- **Protection sur poste partagé :** Fermer la fenêtre du navigateur garantit qu'aucun collègue ou élève ne pourra accéder au compte après lui.
- **Conformité avec les standards de l'Éducation Nationale :** Aligné avec les politiques de session de Pronote, ÉcoleDirecte et des ENT académiques.
