# Contexte produit — vitrine commerciale apprecIAtion

Document issu de l’audit du dépôt `tonioshast/site-appreciation.fr` (commit initial `c40e20f`) et de l’interview fondateur (novembre 2026).  
À utiliser comme prompt / cadre pour toute évolution du site.  
Le fichier `CONTEXT.md` (racine) reste la référence **technique** (PHP, PocketBase, Stripe, sessions). Celui-ci est la référence **produit / commerciale**.

---

## 1. Intention

**apprecIAtion** est un assistant de rédaction d’appréciations scolaires, souverain (Mistral, Europe), conforme RGPD, destiné aux enseignants du secondaire.

Le dépôt GitHub n’est **pas** le produit métier. C’est la **vitrine commerciale professionnelle** associée à **l’extension de navigateur** :

- présenter le produit, la démo, le RGPD, les tarifs ;
- vendre deux licences à achat unique ;
- créer le compte enseignant, vérifier l’e-mail, encaisser Stripe ;
- livrer l’extension en **sideload** (zip) depuis Mon Compte ;
- héberger mentions légales, CGV, confidentialité, contact.

Le produit d’usage (grilles, élèves, génération, overlay ENT) **vit uniquement dans l’extension**. Le site ne doit plus exposer de générateur web.

---

## 2. Décisions validées (interview)

| Sujet | Décision |
| :--- | :--- |
| Forme du produit | **Extension de navigateur uniquement** (pas d’apps desktop Win/Mac/Linux) |
| Navigateurs | **Chrome, Edge, Firefox** |
| Distribution | **Zip / sideload depuis Mon Compte** (pas Chrome Web Store payant pour l’instant) |
| ENT réel | **ÉcoleDirecte effectif** ; **Pronote à venir** (le site ne doit plus afficher Pronote comme « prêt ») |
| Modèle | **Deux licences à achat unique** : Pack 1 matières (~19,90 €) / Pack 2 professeur principal (~29,90 €) |
| Différence packs | **Fonctionnelle** : Pack 2 débloque les **synthèses professeur principal** |
| Durée de licence | Jusqu’à la date **`expiration`** déjà servie par `/api/config` |
| Marque | **Marque produit uniquement** (pas de vitrine perso Antoine) |
| Clé Mistral | **Proxy opérateur** : l’enseignant n’entre pas sa propre clé |
| Générateur site | **À retirer** (`/api/generate-comment` + dashboard grilles/élèves) |
| Mon Compte cible | Profil, licence, téléchargement zip, statut d’abonnement — **sans générateur** |
| Vérité marketing | **Honnête sur le produit** ; marketing léger OK **sauf** faux témoignages / faux volumes |
| Preuve sociale | **Vidéo réelle** ; **retirer** témoignages Unsplash, « centaines de profs », hashes / stats de téléchargement fictifs |
| Domaine public | **appreciation.fr** |
| Contact | **Formulaire + e-mail professionnel** (à créer) |
| Pages juridiques | **Réelles, maintenant** (mentions, RGPD, CGV/CGU) |
| Éditeur | **Pas encore de structure** (SIRET / forme juridique à cadrer) |

---

## 3. Ce que le dépôt est aujourd’hui (audit)

### 3.1 Stack réelle

- Frontend : React 19 + TypeScript + Vite + Tailwind 4 + Lucide, SPA unique (`src/App.tsx`).
- Dev local : `tsx server.ts` (Express) ; prod cible : Apache o2switch + PHP 8, `.htaccess` `/api/*`.
- Données / auth : PocketBase sur VPS Scaleway (`https://pb.appreciation.fr/`).
- Paiement : Stripe Checkout (Pack 1 / Pack 2).
- Mail : PHPMailer SMTP o2switch, codes à 6 chiffres.
- IA : Mistral (aujourd’hui clé **par enseignant**, chiffrée AES-256-GCM) — **à inverser** vers proxy.
- Session front : `sessionStorage`, 30 min d’inactivité, purge `localStorage` héritée.

### 3.2 Parcours vitrine (sections `App.tsx`)

1. Hero (promesse RGPD / Mistral / Pronote / desktop).
2. Démo vidéo (`/assets/apprecIAtion_demo.mp4`).
3. Bento fonctionnalités (matières, PP, 3 formulations, grilles, overlay ENT).
4. Bloc souveraineté / cartographie des flux.
5. Témoignages (2 profils Unsplash — **à retirer**).
6. Tarifs + checkout multi-étapes (`Pricing.tsx`) : OS, ENT, e-mail, code, mot de passe, Stripe.
7. FAQ (dont licence établissement et desktop — **à aligner**).
8. Footer (liens juridiques = ancres marketing, **pas des pages**).

### 3.3 Mon Compte (`MyAccount.tsx`, ~4800 lignes)

Espace très large (login, profil, clé Mistral, tests API, guides ENT, téléchargements, éventuellement grilles). **Hors cible** pour une vitrine + sideload. À réduire.

### 3.4 API PHP (`public/*.php`)

| Route | Rôle | Statut vis-à-vis de la vitrine |
| :--- | :--- | :--- |
| `/api/config` | tarifs + expiration | **conserver** |
| `/api/register-prof` | inscription | **conserver** |
| `/api/login` | auth | **conserver** |
| `/api/update-profile` | profil | **conserver** (sans clé Mistral utilisateur) |
| `/api/send-code` / `verify-code` | e-mail | **conserver** |
| `/api/create-checkout-session` / `validate-payment` | Stripe | **conserver** |
| `/api/generate-comment` | génération web | **retirer de la vitrine** |
| `/api/check-mistral` | test clé perso | **obsolète** si proxy |
| `/api/check-api` | diagnostic ops | interne, pas public |

### 3.5 Incohérences à corriger (code vs décisions)

- Builds desktop Windows/macOS/Linux, hashes SHA, versions « LTS », compteurs de DL.
- « Liaison Pronote / ÉcoleDirecte — PRÊTE » alors que Pronote est **à venir**.
- FAQ : abonnement **ou** achat unique, licences établissement, install multi-PC.
- README npm encore « AI Studio / GEMINI_API_KEY » (héritage, pas le produit).
- Mentions / CGV / RGPD : href `#tarifs` / `#rgpd`.
- Témoignages et « Adopté par des centaines de professeurs ».
- Champ clé API Mistral dans le checkout / profil.

---

## 4. Cible d’architecture produit (après alignement)

```text
Enseignant
  │
  ├─► appreciation.fr (SPA vitrine + compte)
  │       PHP o2switch  ─► Stripe, SMTP, PocketBase
  │       Mon Compte    ─► zip extension (Chrome / Edge / Firefox)
  │
  └─► Extension (sideload)
          Overlay ÉcoleDirecte (Pronote plus tard)
          Génération via proxy Mistral (clé opérateur, jamais côté user)
          Données élèves locales / anonymisées (prénom + critères)
```

---

## 5. Contenu vitrine cible (ordre)

1. Accueil / promesse (temps, contrôle pédagogique, IA française, RGPD).
2. Démo vidéo réelle (~3 min si le fichier existe).
3. Fonctionnalités **vraies** : matières ; 3 formulations ; grilles ; overlay ED ; synthèses PP = Pack 2.
4. RGPD / souveraineté (anonymisation, Europe, enseignant valideur, pas de stockage identité élève côté serveur).
5. **Pas** de faux avis.
6. Tarifs Pack 1 / Pack 2, achat unique, validité jusqu’à `expiration`.
7. FAQ alignée (sideload, navigateurs, ENT, licence, proxy Mistral).
8. Mentions, confidentialité, CGV, contact (formulaire + e-mail).

---

## 6. Ouvert / à fournir plus tard

- Forme juridique, SIRET, nom d’éditeur, adresse, e-mail pro, TVA.
- Textes CGV (rétractation 14 j. logiciel / exception numérique, remboursement).
- Politique de mises à jour de l’extension après `expiration`.
- Quotas Mistral (fair use) une fois le proxy en place.
- Calendrier Pronote.
- Nom exact des artefacts zip (Chrome vs Firefox / manifest v3).
- Hébergement des zips (o2switch `public/assets/` vs lien signé).

---

## 7. Règles pour les prochains travaux

1. Ne pas réintroduire d’app desktop ni de générateur web.
2. Ne pas afficher Pronote comme disponible.
3. Ne pas demander de clé Mistral à l’enseignant.
4. Ne pas inventer de preuve sociale.
5. Toute page juridique doit être une vraie route, pas une ancre marketing.
6. Mettre à jour `CONTEXT.md` technique **après** les changements de code, pas avant.
7. Domaine canonique : **appreciation.fr** (repo GitHub : `site-appreciation.fr`).

---

*Fin — contexte vitrine produit, novembre 2026.*
