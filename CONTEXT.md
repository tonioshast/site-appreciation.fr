# CONTEXT.md — Document de Contexte et Spécifications du Projet ApprécIAtion

Ce document récapitule l'ensemble de l'architecture, de la configuration technique, des mécanismes de sécurité et de l'état fonctionnel du projet **ApprécIAtion**. Il sert de référence et d'amorce (prompt système / contexte) pour poursuivre le développement ou réinstancier le projet dans un nouvel environnement.

---

## 1. Présentation du Projet ApprécIAtion

### 1.1 Objectifs
**ApprécIAtion** est une application web conçue pour les enseignants, leur permettant de générer facilement et rapidement des appréciations scolaires personnalisées, bienveillantes et pédagogiques pour les bulletins de leurs élèves grâce à l'Intelligence Artificielle.

### 1.2 Stack Technique

- **Frontend (SPA) :**
  - **Framework :** React 18 avec TypeScript (`.tsx`).
  - **Bundler / Dev Server :** Vite.
  - **Styling :** Tailwind CSS (approche utilitaire moderne, design soigné).
  - **Iconographie :** Lucide React (`lucide-react`).
- **Backend (API REST PHP) :**
  - **Langage & Modèle :** PHP 8.x.
  - **Hébergement cible :** o2switch (Serveur Apache sous Linux avec module `mod_rewrite`).
  - **Architecture :** Ensemble de scripts PHP dans `/public` (ou `/public_html` en production), exposés sous forme d'API REST via la réécriture `.htaccess`.
- **Services Externes & Base de Données :**
  - **Base de Données & Authentification :** PocketBase (API REST pour le stockage des profils enseignants, clés et abonnements).
  - **Moteur IA :** Mistral AI (Génération dynamique d'appréciations scolaires).
  - **Gestion des Paiements :** Stripe Checkout (Abonnements Pack 1 "Découverte" & Pack 2 "Principal / Pro").
  - **Envoi d'e-mails :** PHPMailer via serveur SMTP (o2switch).
- **Chiffrement & Sécurité :**
  - Chiffrement symétrique **AES-256-GCM** avec vecteur d'initialisation (IV) et tag d'authentification pour la protection des données sensibles et clés API (conformité RGPD).

---

## 2. Architecture des Fichiers & Composants Clés

### 2.1 Arborescence du Projet

```text
├── public/
│   ├── .htaccess                 # Protection, en-têtes de sécurité HSTS/CSP, blocage PHP et routage /api
│   ├── pocketbase.php            # Helper PocketBase & parseur robuste de fichier .env (multi-dossiers)
│   ├── crypto.php                # Module de chiffrement AES-256-GCM (RGPD)
│   ├── config.php                # Endpoint API public exposant la configuration (tarifs, expiration)
│   ├── login.php                 # Endpoint API d'authentification des enseignants
│   ├── register-prof.php         # Endpoint API d'inscription d'un enseignant
│   ├── update-profile.php        # Endpoint API de mise à jour des informations de profil
│   ├── send-code.php             # Endpoint API d'envoi de code de vérification email (PHPMailer)
│   ├── verify-code.php           # Endpoint API de validation du code à 6 chiffres
│   ├── generate-comment.php      # Endpoint API de génération d'appréciations par Mistral AI
│   ├── create-checkout-session.php# Endpoint API de création de session Stripe Checkout
│   ├── validate-payment.php      # Endpoint API de validation de paiement Stripe
│   ├── check-api.php             # Script de diagnostic global système (PocketBase, PHP, .env, Crypto)
│   ├── check-mistral.php         # Script de diagnostic de connexion à Mistral AI
│   └── PHPMailer/                # Bibliothèque d'envoi d'e-mails (Exception.php, PHPMailer.php, SMTP.php)
├── src/
│   ├── main.tsx                  # Point d'entrée de l'application React
│   ├── App.tsx                   # Composant racine React (gestion de l'état global et de la navigation)
│   ├── index.css                 # Fichier CSS global avec directives Tailwind CSS
│   ├── types.ts                  # Définitions des types et interfaces TypeScript
│   ├── data.ts                   # Données statiques et helpers frontend
│   └── components/
│       ├── Header.tsx            # Barre de navigation supérieure (Logo, menus, profil)
│       ├── Footer.tsx            # Pied de page (liens légaux, copyright)
│       ├── Logo.tsx              # Composant SVG / visuel du logo ApprécIAtion
│       ├── Pricing.tsx           # Grille de tarifs et déclencheur Stripe Checkout (Pack 1 & Pack 2)
│       └── MyAccount.tsx         # Espace membre enseignant (profil, clé Mistral, abonnements)
├── doc/                          # Dossier de documentation technique et fiches de suivi
│   ├── README.md                 # Sommaire général de la documentation
│   ├── architecture-serveurs.md  # Cartographie d'infrastructure (o2switch + VPS Scaleway)
│   ├── pocketbase-hooks-state.md # Initialisation du champ state via sync_mistral.pb.js
│   ├── delivrabilite-emails-smtp.md # Optimisation SMTP, SPF/DKIM/DMARC et lutte contre le spam
│   ├── securite-sessions-inactivite.md # Sécurité des sessions : expiration 30 min et fermeture navigateur
│   └── journal-modifications.md  # Journal chronologique des modifications et nettoyages validés
├── package.json                  # Dépendances npm et scripts de build
├── metadata.json                 # Métadonnées de l'application AI Studio
└── CONTEXT.md                    # Ce document récapitulatif
```

---

## 3. Routes API Backend (Endpoints PHP)

Toutes les routes API sont appelées sous la forme `/api/<nom_route>` et redirigées vers le fichier PHP correspondant :

| Route API | Script PHP Cible | Méthode | Description |
| :--- | :--- | :--- | :--- |
| `/api/config` | `config.php` | GET | Retourne les variables de configuration publiques (tarifs `pack1`, `pack2`, date d'expiration). |
| `/api/register-prof` | `register-prof.php` | POST | Enregistre un nouvel enseignant dans PocketBase et envoie un récapitulatif par e-mail. |
| `/api/login` | `login.php` | POST | Authentifie un enseignant via identifiant / mot de passe. |
| `/api/update-profile` | `update-profile.php` | POST | Met à jour le profil (email, établissement, mot de passe, clé Mistral déchiffrée/chiffrée). |
| `/api/send-code` | `send-code.php` | POST | Génère et envoie un code de vérification à 6 chiffres par e-mail. |
| `/api/verify-code` | `verify-code.php` | POST | Vérifie la validité du code de confirmation à 6 chiffres. |
| `/api/generate-comment`| `generate-comment.php` | POST | Appelle l'API Mistral AI pour générer une appréciation scolaire sur mesure. |
| `/api/create-checkout-session` | `create-checkout-session.php` | POST | Initialise une session de paiement Stripe Checkout (Pack 1 / Pack 2). |
| `/api/validate-payment` | `validate-payment.php` | POST | Valide le paiement Stripe et met à jour les droits d'accès de l'enseignant. |
| `/api/check-mistral` | `check-mistral.php` | GET/POST | Effectue un test de connectivité et de clé API avec l'API Mistral. |
| `/api/check-api` | `check-api.php` | GET | Diagnostic complet des dépendances, de l'état de PocketBase et du chiffrement. |

---

## 4. Configuration Réseau, Sécurité & `.htaccess`

Le fichier `.htaccess` situé à la racine du dossier public assure la protection globale du serveur Apache chez o2switch.

### 4.1 Caractéristiques du fichier `.htaccess`

1. **Protection Globale & Masquage Serveur :**
   - `Options -Indexes -MultiViews` (désactive le listing des dossiers).
   - `ServerSignature Off` (masque les informations de version d'Apache).

2. **En-têtes de Sécurité Rapprochés (HTTP Headers) :**
   - `X-Frame-Options "SAMEORIGIN"` (anti-clickjacking).
   - `X-Content-Type-Options "nosniff"` (anti-MIME-sniffing).
   - `X-XSS-Protection "1; mode=block"` (filtre XSS).
   - `Referrer-Policy "strict-origin-when-cross-origin"`.
   - `Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"` (HSTS forcé 1 an).
   - `Permissions-Policy "geolocation=(), microphone=(), camera=()"`.

3. **Blocage d'Accès aux Fichiers Sensibles :**
   - Bloque le téléchargement direct de `.env`, `.log`, `.ini`, `.conf`, `.bak`, `.sql`, `.sh`, `.yml`, `.git`, `.md`.

4. **Sécurisation des Accès PHP :**
   - **Interdiction de l'accès direct aux fichiers `.php` dans l'URL :**
     ```apache
     RewriteCond %{THE_REQUEST} \s/.*\.php[\s?] [NC]
     RewriteRule ^ - [F,L]
     ```
     Cette règle renvoie un statut **403 Forbidden** si un utilisateur ou bot essaie d'appeler directement un fichier PHP (ex: `https://domaine.com/pocketbase.php` ou `https://domaine.com/login.php`).
   - **Seul l'accès via `/api/<route>` est autorisé** grâce au moteur de réécriture d'URLs.

5. **Redirection HTTPS & Routage SPA :**
   - Redirection automatique du HTTP vers le HTTPS (prise en compte de `X-Forwarded-Proto` sur reverse proxies o2switch).
   - Redirection vers `index.html` pour toutes les routes frontend non-fichiers (Routage Single Page Application).

### 4.2 Système de Résolution Multi-dossiers & Nettoyage du `.env`

Le helper `pocketbase.php` intègre le parseur `pb_get_env()` et le helper `get_admin_config_var()` avec les mécanismes suivants :
- **Ordre de recherche multi-dossiers :**
  1. `./.env`
  2. `./includes/.env`
  3. `../includes/.env`
  4. `../.env`
  5. `../../includes/.env`
  6. Chemins basés sur `DOCUMENT_ROOT`, `SCRIPT_FILENAME` et `getcwd()`.
- **Tolérance et nettoyage du `.env` :**
  - Nettoyage du marqueur BOM UTF-8 (`\xEF\xBB\xBF`) en début de ligne.
  - Suppression des commentaires de fin de ligne (`#`).
  - Nettoyage des caractères non-imprimables dans les clés et valeurs (`preg_replace('/[^a-zA-Z0-9_\-]/', '', $key)`).
  - Résolution d'alias insensible à la casse et insensible aux tirets/underscores (`get_admin_config_var`).

---

## 5. État Actuel des Fonctionnalités

1. **Générateur d'Appréciations Scolaires (IA Mistral) :**
   - Sélection du niveau (Collège, Lycée, etc.), de la matière, de la période/trimestre.
   - Saisie des critères (travail, comportement, participation, progrès).
   - Génération dynamique avec options d'ajustement du ton (bienveillant, exigeant, synthétique, encouragements).

2. **Authentification & Gestion d'Espace Enseignant :**
   - Inscription d'un professeur avec identifiant unique, prénom, nom, établissement, système d'exploitation et version d'application.
   - Connexion sécurisée avec PocketBase.
   - Mise à jour du profil (modification du mot de passe, de l'établissement, de la clé API Mistral personnelle).

3. **Intégration Stripe & Modèle d'Abonnement :**
   - Tarification dynamique basée sur les variables `pack1` (défaut `19.90`) et `pack2` (défaut `29.90`).
   - Génération automatisée de sessions Stripe Checkout via `/api/create-checkout-session`.
   - Validation automatique du statut d'abonnement après confirmation Stripe via `/api/validate-payment`.

4. **Module de Confirmation & Sécurité Email :**
   - Envoi automatisé de codes de confirmation à 6 chiffres via PHPMailer.
   - Validation rapide du code côté backend.

5. **Diagnostic & Monitoring Système :**
   - Outil `/api/check-api` permettant de valider l'état du serveur, la lisibilité des fichiers d'environnement, la connexion PocketBase et le bon fonctionnement du chiffrement AES-256-GCM.
   - Outil `/api/check-mistral` permettant de vérifier en direct la validité d'une clé API Mistral.

---
*Fin du document CONTEXT.md — Ce fichier constitue la référence complète du projet ApprécIAtion.*
