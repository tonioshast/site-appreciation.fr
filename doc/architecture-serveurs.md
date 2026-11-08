# Architecture et Cartographie des Serveurs

Ce document décrit la topologie d'infrastructure du projet **ApprécIAtion**, répartie entre l'hébergeur web o2switch et une instance VPS chez Scaleway.

---

## 1. Vue d'Ensemble de l'Infrastructure

```text
[ Enseignant / Navigateur Web ]
               │
               ├──► HTTPS (Web / API PHP) ──────► Serveur Web o2switch (Apache / PHP 8)
               │                                      │
               │                                      ├─► PHPMailer / SMTP o2switch
               │                                      └─► Appels REST API
               │                                             │
               └──► HTTPS (Appels PocketBase) ───────────────┼────────► VPS Scaleway (PocketBase)
                                                             │           - Port interne 8090
                                                             │           - Reverse-proxy HTTPS
                                                             │           - Hooks JS (/opt/pocketbase/pb_hooks)
                                                             │
                                                             ▼
                                                    APIs Externes Tierces
                                                    - Mistral AI (Génération IA)
                                                    - Stripe (Paiements & Abonnements)
```

---

## 2. Détail des Serveurs & Rôles

### A. Hébergement Web : o2switch
- **Environnement :** Hébergement mutualisé Apache sous Linux (cPanel).
- **Rôle principal :**
  - Distribution des fichiers statiques du frontend (React SPA compilée dans `public/`).
  - Endpoints backend en PHP (`/api/*` routés via `.htaccess`).
  - Passerelle de paiement Stripe (`create-checkout-session.php`, `validate-payment.php`).
  - Service d'envoi d'e-mails transactionnels (PHPMailer avec serveur SMTP local o2switch).
- **Sécurité :**
  - Fichier `.htaccess` avec en-têtes stricts (HSTS, CSP, X-Frame-Options).
  - Blocage de l'accès direct aux fichiers `.php` (accès autorisé uniquement via les routes `/api/`).
  - Chiffrement symétrique **AES-256-GCM** des clés sensibles dans `crypto.php`.

---

### B. Base de Données & Authentification : VPS Scaleway (`apprecIAtion`)
- **Environnement :** Instance Linux (Ubuntu/Debian) chez Scaleway.
- **Rôle principal :**
  - Hébergement de l'instance **PocketBase** (Base SQLite embarquée, gestion des comptes utilisateurs, API REST temps réel).
  - URL publique d'accès : `https://pb.appreciation.fr/`
- **Répertoire d'installation :** `/opt/pocketbase/`
  - Binaire PocketBase : `/opt/pocketbase/pocketbase`
  - Base de données : `/opt/pocketbase/pb_data/`
  - Hooks serveur : `/opt/pocketbase/pb_hooks/` (ex. `sync_mistral.pb.js`)
  - Sauvegardes : `/opt/pocketbase/backup.sh` et `/opt/pocketbase/backups/`
- **Exécution :**
  - Exécuté sous l'utilisateur système `antoine`
  - Commande : `/opt/pocketbase/pocketbase serve --http=0.0.0.0:8090`
  - Reverse-proxy Web assurant la terminaison SSL / HTTPS sur le port 443 pour `pb.appreciation.fr`.

---

## 3. Services Externes & Clés d'API

| Service | Fonction | Configuration / Accès |
| :--- | :--- | :--- |
| **Mistral AI** | Modèle de langage pour la rédaction d'appréciations scolaires | Clé API stockée de manière chiffrée (AES-256-GCM) dans le profil enseignant PocketBase |
| **Stripe** | Gestion des abonnements et encaissement sécurisé | Clés `STRIPE_SECRET_KEY` et `STRIPE_PUBLIC_KEY` définies dans l'environnement serveur |
| **SMTP o2switch** | Distribution des e-mails transactionnels (codes de vérification) | Ports 465 (SMTPS) / 587 (STARTTLS) authentifiés |

---

## 4. Commandes Utiles d'Exploitation (Scaleway)

| Action | Commande |
| :--- | :--- |
| **Vérifier le statut de PocketBase** | `ps aux \| grep pocketbase` |
| **Consulter les logs récents** | `journalctl -u pocketbase -n 50` (si géré par systemd) |
| **Éditer le hook d'inscription** | `nano /opt/pocketbase/pb_hooks/sync_mistral.pb.js` |
| **Lister les sauvegardes** | `ls -la /opt/pocketbase/backups/` |
| **Rechercher un dossier PocketBase** | `find / -type d -name "pb_hooks" 2>/dev/null` |
