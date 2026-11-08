# Initialisation du Champ `state` (PocketBase Hooks)

## 1. Contexte & Problématique

Lors de la création d'un compte enseignant dans la collection **`profs`** de PocketBase (que ce soit via l'API, l'extension Chrome ou directement depuis l'interface d'administration PocketBase), le champ **`state`** (de type JSON) doit être initialisé avec une configuration par défaut :
- Grille de critères active (`grille_officielle.json`)
- Liste des critères sélectionnés par défaut (`01_Ensemble`, `02_travail`, etc.)
- État initial du panneau d'affichage (`open: true`, `fullscreen: false`)
- Prompts actifs (`prompt_officiel.json`, `prompt_college.json`)

---

## 2. Pourquoi un Hook et pas une Valeur par Défaut native ?

Dans PocketBase, les champs de type **JSON** ne disposent **pas** de paramètre « Valeur par défaut » dans l'interface d'administration (contrairement aux booléens ou aux champs de type sélection). Le schéma ne propose que `Required` et `Max Size`.

C'est pourquoi l'initialisation automatique est gérée par un **Hook JavaScript côté serveur** exécuté par le moteur PocketBase.

---

## 3. Emplacement & Infrastructure

- **Serveur hébergeant PocketBase :** VPS Scaleway (`apprecIAtion`)
- **Dossier d'installation PocketBase :** `/opt/pocketbase/`
- **Processus actif :** `/opt/pocketbase/pocketbase serve --http=0.0.0.0:8090` (utilisateur `antoine`)
- **Dossier des hooks :** `/opt/pocketbase/pb_hooks/`
- **Fichier de hook actif :** `/opt/pocketbase/pb_hooks/sync_mistral.pb.js`

---

## 4. Code Source du Hook (`sync_mistral.pb.js`)

```javascript
// /opt/pocketbase/pb_hooks/sync_mistral.pb.js

onRecordCreateRequest((e) => {
    try {
        let record = e.record;

        let rawState = record.get("state");
        let state = null;

        if (typeof rawState === "string" && rawState.trim() !== "") {
            try {
                state = JSON.parse(rawState);
            } catch (err) {
                state = null;
            }
        } else if (rawState && typeof rawState === "object") {
            try {
                state = JSON.parse(JSON.stringify(rawState));
            } catch (err) {
                state = null;
            }
        }

        // Si state vide ou inexistant, on génère la structure complète par défaut
        if (!state || Object.keys(state).length === 0) {
            state = {
                "items": {
                    "active": "grille_officielle.json",
                    "selected": [
                        "01_Ensemble",
                        "02_travail",
                        "05_compréhension",
                        "06_participation",
                        "03_progression",
                        "07_bavardages",
                        "08_points forts",
                        "09_points a travailler",
                        "04_motivation",
                        "10_Conclusion"
                    ]
                },
                "panel": {
                    "fullscreen": false,
                    "open": true
                },
                "prompts": {
                    "active": "prompt_officiel.json"
                },
                "prompts_synthese": {
                    "active": "prompt_college.json"
                }
            };
        }

        record.set("state", state);
    } catch (err) {
        console.log("[HOOK ERROR CREATE]", err);
    }

    e.next();
}, "profs");
```

---

## 5. Procédure pour Modifier la Configuration par Défaut

Pour changer la grille, les critères ou les prompts par défaut attribués aux nouveaux professeurs :

1. **Se connecter en SSH au serveur Scaleway :**
   ```bash
   ssh root@<IP_SERVEUR_SCALEWAY>
   ```

2. **Éditer le fichier avec un éditeur de texte (ex. `nano`) :**
   ```bash
   nano /opt/pocketbase/pb_hooks/sync_mistral.pb.js
   ```

3. **Modifier l'objet `state` :**
   Adapter les valeurs (fichiers de grille `.json`, liste des `selected`, prompts actifs).

4. **Sauvegarder et quitter :**
   - Touches `Ctrl + O` puis `Entrée` pour enregistrer.
   - Touches `Ctrl + X` pour quitter.

5. **Prise en compte :**
   **Aucun redémarrage du service PocketBase n'est requis.** PocketBase surveille le dossier `pb_hooks/` et recharge les scripts automatiquement à chaque modification de fichier.
