# Documentation Technique & Suivi du Projet ApprécIAtion

Ce dossier regroupe les fiches techniques, les choix d'architecture validés et les procédures d'administration et de maintenance du projet **ApprécIAtion**.  
Ces documents doivent être **systématiquement tenus à jour** lors de chaque modification validée.

---

## 📁 Sommaire de la Documentation

| Fichier | Sujet | Dernière mise à jour |
| :--- | :--- | :--- |
| [**`architecture-serveurs.md`**](./architecture-serveurs.md) | Cartographie de l'infrastructure (Hébergement hybride o2switch & VPS Scaleway) | Novembre 2026 |
| [**`pocketbase-hooks-state.md`**](./pocketbase-hooks-state.md) | Initialisation du champ `state` (JSON critères/prompts) via les hooks PocketBase (`sync_mistral.pb.js`) | Novembre 2026 |
| [**`delivrabilite-emails-smtp.md`**](./delivrabilite-emails-smtp.md) | Résolution des spams / délivrabilité des emails transactionnels (PHPMailer, SPF, DKIM, DMARC) | Novembre 2026 |
| [**`securite-sessions-inactivite.md`**](./securite-sessions-inactivite.md) | Sécurité des sessions : expiration après 30 min et fermeture du navigateur | Novembre 2026 |
| [**`journal-modifications.md`**](./journal-modifications.md) | Journal chronologique des modifications et nettoyages validés | Novembre 2026 |

---

## 📋 Règles de mise à jour de la documentation
1. **Validation préalable** : Tout changement technique appliqué et validé en production (serveur Scaleway, hébergement o2switch, base de données PocketBase ou code source) doit être consigné dans sa fiche respective.
2. **Précision des chemins** : Indiquer systématiquement les chemins absolus (`/opt/pocketbase/...`), les commandes bash testées et les fichiers sources concernés.
3. **Sécurité & Confidentialité** : Aucun mot de passe en clair, clé API privée ou secret de production ne doit figurer dans ces fiches.
