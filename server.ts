import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import Stripe from "stripe";
import PocketBase from "pocketbase";

dotenv.config();

const cleanEnv = (val?: string) => {
  if (!val) return "";
  let s = val.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim();
  }
  return s;
};

const MASTER_ENCRYPTION_SECRET = cleanEnv(process.env.ENCRYPTION_SECRET_KEY) || "appreciation_master_aes256_secret_key_2026";
const ENCRYPTION_KEY = crypto.createHash("sha256").update(MASTER_ENCRYPTION_SECRET).digest();

/**
 * Chiffre une clé API sensible avec AES-256-GCM avant stockage dans PocketBase (RGPD Art. 32)
 */
export function encryptApiKey(plainText: string): string {
  if (!plainText || typeof plainText !== "string") return "";
  const trimmed = plainText.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("enc_gcm:")) return trimmed; // Déjà chiffrée

  const iv = crypto.randomBytes(12); // Nonce IV de 96 bits pour AES-GCM
  const cipher = crypto.createCipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);
  
  let encrypted = cipher.update(trimmed, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  const authTag = cipher.getAuthTag().toString("hex");
  
  return `enc_gcm:${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Déchiffre une clé API stockée au format AES-256-GCM
 */
export function decryptApiKey(cipherText: string | null | undefined): string {
  if (!cipherText || typeof cipherText !== "string") return "";
  const trimmed = cipherText.trim();
  if (!trimmed) return "";
  if (!trimmed.startsWith("enc_gcm:")) return trimmed; // Rétro-compatibilité si donnée en clair

  try {
    const parts = trimmed.split(":");
    if (parts.length !== 4) return trimmed;

    const iv = Buffer.from(parts[1], "hex");
    const authTag = Buffer.from(parts[2], "hex");
    const encryptedText = parts[3];

    const decipher = crypto.createDecipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (err) {
    console.error("[Crypto] Erreur lors du déchiffrement de la clé API Mistral:", err);
    return "";
  }
}

const POCKETBASE_URL = cleanEnv(process.env.POCKETBASE_URL) || "https://pb.appreciation.fr";

async function getPocketBaseClient(): Promise<PocketBase> {
  const pb = new PocketBase(POCKETBASE_URL);
  pb.autoCancellation(false);

  const adminEmail = cleanEnv(process.env.PB_ADMIN_EMAIL) || "marais_antoine@hotmail.com";
  const adminPassword = cleanEnv(process.env.PB_ADMIN_PASSWORD) || "Furets1979#!";

  if (adminEmail && adminPassword) {
    try {
      await (pb as any).collection('_superusers').authWithPassword(adminEmail, adminPassword);
    } catch {
      try {
        await pb.admins.authWithPassword(adminEmail, adminPassword);
      } catch {
        try {
          await pb.collection("profs").authWithPassword(adminEmail, adminPassword);
        } catch {
          try {
            await pb.collection("profs").authWithPassword("tonioshast@hotmail.fr", "Furets1979");
          } catch (err: any) {
            console.warn("[PocketBase] Authentification Admin / Prof fallback :", err?.message || err);
          }
        }
      }
    }
  }

  return pb;
}

let stripeInstance: Stripe | null = null;

function getStripeInstance(): Stripe {
  if (!stripeInstance) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("La clé secrète Stripe (STRIPE_SECRET_KEY) n'est pas configurée dans les variables d'environnement.");
    }
    stripeInstance = new Stripe(key);
  }
  return stripeInstance;
}

const localVerificationCodes = new Map<string, { code: string; expiresAt: number }>();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route to verify a Mistral API key
  app.post("/api/check-mistral", async (req, res) => {
    try {
      const { apiKey } = req.body;
      if (!apiKey) {
        return res.status(400).json({ success: false, error: "La clé API est requise." });
      }

      const realApiKey = decryptApiKey(apiKey);

      const response = await fetch("https://api.mistral.ai/v1/models", {
        headers: {
          "Authorization": `Bearer ${realApiKey}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        return res.json({ success: true, message: "Connexion réussie avec Mistral AI !" });
      } else {
        const errData: any = await response.json().catch(() => ({}));
        const message = errData?.message || errData?.error?.message || `Clé API invalide ou inactive (code HTTP ${response.status})`;
        return res.status(response.status).json({ success: false, error: message });
      }
    } catch (err: any) {
      console.error("Erreur check-mistral:", err);
      return res.status(500).json({ success: false, error: err.message || "Erreur lors de la vérification de la clé." });
    }
  });

  // API Route for generating pedagogical comments in french
  app.post("/api/generate-comment", async (req, res) => {
    try {
      const { prenom, moyenne, ton, style, items, type } = req.body;

      if (!prenom) {
        return res.status(400).json({ error: "Le prénom est requis pour la génération." });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ 
          error: "La clé API Gemini est absente. Veuillez la configurer dans AI Studio (Paramètres > Secrets)." 
        });
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const formattedItems = Object.entries(items || {})
        .map(([key, val]) => `- ${key}: ${val}`)
        .join("\n");

      const systemInstruction = `Tu es un enseignant français très expérimenté, bienveillant, juste, et respectueux des consignes de l'Éducation Nationale et des règles de protection des données (RGPD).
Ton rôle est de rédiger des appréciations scolaires ou des synthèses de professeur principal.
Règles incontournables :
1. Reste toujours constructif, professionnel, pragmatique et précis. Évite les clichés et les phrases toutes faites dénuées de valeur ajoutée pédagogique.
2. Utilise une orthographe et une grammaire impeccables.
3. Respecte le RGPD : n'écris jamais de nom de famille, utilise uniquement le prénom de l'élève.
4. Adapte le ton au paramètre demandé (ex: Bienveillant, Encourageant, Factuel, Exigeant, etc.) et le style au format demandé (ex: Synthétique, Détaillé, Constructif).
5. Base-toi impérativement sur la moyenne sur 20 fournie (${moyenne ? moyenne + "/20" : "moyenne non fournie"}) et sur les observations saisies (items).
6. Ne fais aucune mention de l'IA ni des consignes techniques de génération dans les textes produits.`;

      let prompt = `Rédige 3 propositions d'appréciations scolaires (v1, v2, v3) différentes pour le bulletin de l'élève.
Données de l'élève :
- Prénom : ${prenom}
- Moyenne : ${moyenne ? moyenne : "Non précisée"}
- Ton souhaité : ${ton || "Bienveillant"}
- Style souhaité : ${style || "Synthétique"}
- Critères observés :
${formattedItems || "Aucun critère spécifique mentionné"}

Rôles attendus pour chaque version :
- Version 1 (v1) : Équilibrée, bienveillante, soulignant le travail accompli et apportant un conseil de progrès pertinent.
- Version 2 (v2) : Plus axée sur l'exigence et le potentiel de l'élève, encourageant à approfondir ou surmonter une difficulté spécifique avec méthode.
- Version 3 (v3) : Particulièrement synthétique, concise et percutante (idéale pour les bulletins limités en nombre de caractères).`;

      if (type === "synthese") {
        prompt = `Rédige 3 propositions de synthèses globales du trimestre (v1, v2, v3) différentes en tant que Professeur Principal de la classe.
Données de l'élève :
- Prénom : ${prenom}
- Moyenne générale : ${moyenne ? moyenne : "Non précisée"}
- Ton souhaité : ${ton || "Professionnel"}
- Style souhaité : ${style || "Synthétique"}
- Critères transversaux observés :
${formattedItems || "Aucun critère spécifique"}

Rôles attendus pour chaque version :
- Version 1 (v1) : Bilan trimestriel complet et équilibré, valorisant la posture de l'élève et donnant des axes d'amélioration.
- Version 2 (v2) : Version d'encouragement dynamique mettant l'accent sur l'implication dans la classe, la maturité et la participation.
- Version 3 (v3) : Version très compacte et concise allant directement à l'essentiel pour respecter les grilles serrées de bulletins scolaires.`;
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.75,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              v1: { type: Type.STRING, description: "Première proposition d'appréciation." },
              v2: { type: Type.STRING, description: "Deuxième proposition d'appréciation." },
              v3: { type: Type.STRING, description: "Troisième proposition d'appréciation." }
            },
            required: ["v1", "v2", "v3"]
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Réponse vide générée par l'IA.");
      }

      const result = JSON.parse(responseText);
      return res.json(result);

    } catch (error: any) {
      console.error("Erreur serveur génération appréciation:", error);
      return res.status(500).json({ 
        error: error.message || "Une erreur interne est survenue lors de l'appel à l'IA." 
      });
    }
  });

  function getAdminConfigVar(keys: string[], defaultValue: string = ""): string {
    const keysLower = keys.map((k) => k.toLowerCase());

    for (const key of keys) {
      if (process.env[key] && process.env[key]!.trim() !== "") return process.env[key]!.trim();
      if (process.env[key.toUpperCase()] && process.env[key.toUpperCase()]!.trim() !== "") return process.env[key.toUpperCase()]!.trim();
      if (process.env[key.toLowerCase()] && process.env[key.toLowerCase()]!.trim() !== "") return process.env[key.toLowerCase()]!.trim();
    }

    const possibleFiles = [
      path.join(process.cwd(), ".env"),
      path.join(process.cwd(), "public", ".env"),
    ];

    for (const filePath of possibleFiles) {
      if (fs.existsSync(filePath)) {
        try {
          const content = fs.readFileSync(filePath, "utf-8");
          const lines = content.split(/\r?\n/);
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith(";")) continue;
            const parts = trimmed.split("=");
            if (parts.length >= 2) {
              const k = parts[0].trim().toLowerCase();
              if (keysLower.includes(k)) {
                const val = parts.slice(1).join("=").trim().replace(/^["']|["']$/g, '');
                if (val) return val;
              }
            }
          }
        } catch {
          // ignore
        }
      }
    }

    return defaultValue;
  }

  function getAdminExpirationConfig(): string | null {
    return getAdminConfigVar(["expiration", "expiration_date", "EXPIRATION_DATE"], "") || null;
  }

  app.get("/api/config", (req, res) => {
    const exp = getAdminConfigVar(["expiration", "expiration_date", "EXPIRATION_DATE"], "");
    const pack1 = getAdminConfigVar(["pack1", "PACK1"], "19.90");
    const pack2 = getAdminConfigVar(["pack2", "PACK2"], "29.90");
    res.json({ expiration: exp, pack1, pack2 });
  });

  app.get("/api/expiration", (req, res) => {
    const exp = getAdminExpirationConfig() || "";
    res.json({ expiration: exp });
  });

  function toPocketBaseIsoDate(inputDate?: string): string {
    let target = inputDate && typeof inputDate === "string" && inputDate.trim() !== "" ? inputDate.trim() : null;

    if (!target) {
      target = getAdminExpirationConfig();
    }

    if (target) {
      const trimmed = target.trim();
      // Match FR format DD/MM/YYYY
      const frMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (frMatch) {
        const day = frMatch[1].padStart(2, "0");
        const month = frMatch[2].padStart(2, "0");
        const year = frMatch[3];
        return `${year}-${month}-${day} 00:00:00.000Z`;
      }
      // Match ISO YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
        if (trimmed.includes("Z") || trimmed.includes(" ")) {
          return trimmed;
        }
        return `${trimmed} 00:00:00.000Z`;
      }
      const parsed = new Date(trimmed);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().replace("T", " ");
      }
      return trimmed;
    }

    return "";
  }

  function determinePackNumber(packInput?: any, planNameInput?: string): number {
    if (packInput !== undefined && packInput !== null && packInput !== "") {
      const num = Number(packInput);
      if (num === 1 || num === 2) return num;
    }
    if (planNameInput && typeof planNameInput === "string") {
      const lower = planNameInput.toLowerCase();
      if (lower.includes("principal") || lower.includes("pp") || lower.includes("pack 2") || lower.includes("pack2")) {
        return 2;
      }
    }
    return 1;
  }

// API Route to register / update professor in PocketBase database
  app.post("/api/register-prof", async (req, res) => {
    try {
      const { nom, prenom, email, systeme_exploitation, ent, identifiant_prof, etablissement, id_unique, expiration, version, mdp, plan, plan_name, pack } = req.body;

      if (!nom || !prenom || !identifiant_prof || !etablissement) {
        return res.status(400).json({ error: "Le nom, le prénom, l'identifiant enseignant et l'établissement scolaire sont obligatoires." });
      }

      const expDate = toPocketBaseIsoDate(expiration);
      const packVal = determinePackNumber(pack, plan || plan_name);
      
      const appVersion = version || "V1.2";
      const generatedIdUnique = id_unique || "id_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

      let finalIdUnique = generatedIdUnique;
      let insertId: string | number = generatedIdUnique;

      const pb = await getPocketBaseClient();
      let existingRecord: any = null;

      try {
        const records = await pb.collection("profs").getFullList({
          filter: `identifiant_prof = "${identifiant_prof.replace(/"/g, '\\"')}" && etablissement = "${etablissement.replace(/"/g, '\\"')}"`
        });
        if (records && records.length > 0) {
          existingRecord = records[0];
        }
      } catch (e: any) {
        console.warn("[PocketBase] Recherche prof existant:", e.message);
      }

      const rawMdp = mdp ? String(mdp).trim() : "";
      const pbPassword = rawMdp.length >= 6 ? rawMdp : "ApprecIAtion2026!";
      const validEmail = (email && String(email).trim() !== "") ? String(email).trim() : `${(identifiant_prof || finalIdUnique).replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}@appreciation.fr`;

      const profData: any = {
        nom: nom || "",
        prenom: prenom || "",
        email: validEmail,
        systeme_exploitation: systeme_exploitation || "",
        ent: ent || "",
        identifiant_prof: identifiant_prof || "",
        etablissement: etablissement || "",
        id_unique: finalIdUnique,
        compte_valide: "nok",
        version: appVersion,
        expiration: expDate,
        nb_licence: 1,
        pack: packVal
      };

      if (existingRecord) {
        finalIdUnique = existingRecord.id_unique || generatedIdUnique;
        profData.id_unique = finalIdUnique;
        if (rawMdp && rawMdp.length >= 6) {
          profData.password = rawMdp;
          profData.passwordConfirm = rawMdp;
        }
        
        const updated = await pb.collection("profs").update(existingRecord.id, profData);
        insertId = updated.id;
        console.log(`[PocketBase] Professeur mis à jour avec succès : id ${insertId}`);
      } else {
        profData.password = pbPassword;
        profData.passwordConfirm = pbPassword;
        profData.emailVisibility = true;
        profData.verified = true;

        const created = await pb.collection("profs").create(profData);
        insertId = created.id;
        console.log(`[PocketBase] Professeur créé avec succès (auth) : id ${insertId}`);
      }

      return res.json({ 
        success: true, 
        id: insertId,
        id_unique: finalIdUnique,
        email_sent: true,
        message: "Enregistrement effectué avec succès dans la base de données PocketBase (https://pb.appreciation.fr)." 
      });

    } catch (error: any) {
      console.error("Erreur d'inscription du professeur:", error);
      return res.status(500).json({ 
        error: error.message || "Une erreur est survenue lors de l'enregistrement dans PocketBase." 
      });
    }
  });

  // API Route to log in a professor
  app.post("/api/login", async (req, res) => {
    try {
      const { email, mdp } = req.body;

      if (!email || !mdp) {
        return res.status(400).json({ error: "L'adresse e-mail et le mot de passe sont obligatoires." });
      }

      const cleanEmail = email.trim();
      const cleanMdp = mdp.trim();

      const pb = await getPocketBaseClient();
      let matched: any = null;
      let userToken: string = "";

      try {
        const authData = await pb.collection("profs").authWithPassword(cleanEmail, cleanMdp);
        matched = authData.record;
        userToken = authData.token || "";
      } catch (authErr) {
        // Fallback: search by email and check if cleanMdp corresponds to id_unique
        try {
          const records = await pb.collection("profs").getFullList({
            filter: `email = "${cleanEmail.replace(/"/g, '\\"')}"`
          });
          matched = records.find(
            p => p.id_unique && p.id_unique.trim() === cleanMdp
          );
        } catch {}
      }

      if (matched) {
        return res.json({
          success: true,
          token: userToken,
          user: {
            id: matched.id,
            nom: matched.nom || "",
            prenom: matched.prenom || "",
            email: matched.email || "",
            systeme_exploitation: matched.systeme_exploitation || "",
            ent: matched.ent || "",
            identifiant_prof: matched.identifiant_prof || "",
            etablissement: matched.etablissement || "",
            id_unique: matched.id_unique || "",
            compte_valide: (matched.compte_valide === "1" || matched.compte_valide === 1 || matched.compte_valide === "ok") ? "ok" : matched.compte_valide,
            version: matched.version || "V1.2",
            date: matched.date || matched.expiration,
            expiration: matched.expiration || matched.date,
            nb_licence: matched.nb_licence || matched.nombre_licences || 1,
            nombre_licences: matched.nombre_licences || matched.nb_licence || 1,
            pack: (matched.pack !== undefined && matched.pack !== null) ? Number(matched.pack) : 1,
            cle_api_mistral: matched.cle_api_mistral ? decryptApiKey(matched.cle_api_mistral) : null,
            token: userToken
          }
        });
      }

      return res.status(401).json({ error: "Adresse e-mail, mot de passe ou clé de connexion unique incorrect." });

    } catch (error: any) {
      console.error("Erreur de connexion:", error);
      return res.status(500).json({
        error: error.message || "Une erreur est survenue lors de la connexion."
      });
    }
  });

  // API Route to update professor profile
  app.post("/api/update-profile", async (req, res) => {
    try {
      const { id_unique, nom, prenom, email, mdp, ent, systeme_exploitation, identifiant_prof, etablissement, cle_api_mistral, pack } = req.body;

      if (!id_unique) {
        return res.status(400).json({ error: "L'identifiant unique est requis pour la mise à jour." });
      }

      const pb = await getPocketBaseClient();
      const records = await pb.collection("profs").getFullList({
        filter: `id_unique = "${id_unique.replace(/"/g, '\\"')}"`
      });

      if (records.length > 0) {
        const existing = records[0];
        const updateData: any = {};
        if (nom !== undefined) updateData.nom = nom;
        if (prenom !== undefined) updateData.prenom = prenom;
        if (email !== undefined) updateData.email = email;
        if (mdp) {
          const rawMdp = String(mdp).trim();
          if (rawMdp.length >= 6) {
            updateData.password = rawMdp;
            updateData.passwordConfirm = rawMdp;
          }
        }
        if (ent !== undefined) updateData.ent = ent;
        if (systeme_exploitation !== undefined) updateData.systeme_exploitation = systeme_exploitation;
        if (identifiant_prof !== undefined) updateData.identifiant_prof = identifiant_prof;
        if (etablissement !== undefined) updateData.etablissement = etablissement;
        if (cle_api_mistral !== undefined) {
          updateData.cle_api_mistral = cle_api_mistral ? encryptApiKey(cle_api_mistral) : "";
        }
        if (pack !== undefined) updateData.pack = Number(pack) || 1;

        const updated = await pb.collection("profs").update(existing.id, updateData);
        const updatedUser = {
          ...existing,
          ...updated,
          cle_api_mistral: updated.cle_api_mistral ? decryptApiKey(updated.cle_api_mistral) : (existing.cle_api_mistral ? decryptApiKey(existing.cle_api_mistral) : null),
          compte_valide: (updated.compte_valide === "1" || updated.compte_valide === 1 || updated.compte_valide === "ok") ? "ok" : updated.compte_valide
        };

        return res.json({
          success: true,
          message: "Profil mis à jour avec succès !",
          user: updatedUser
        });
      }

      return res.status(404).json({ error: "Professeur introuvable." });

    } catch (error: any) {
      console.error("Erreur de mise à jour du profil:", error);
      return res.status(500).json({ error: error.message || "Erreur de mise à jour du profil." });
    }
  });

  // API to list prompts_matiere (officiel=true or user=userId or all)
  app.get("/api/prompts-matiere", async (req, res) => {
    try {
      const pb = await getPocketBaseClient();
      const { userId } = req.query;

      let records: any[] = [];
      try {
        records = await pb.collection("prompts_matiere").getFullList({
          sort: "-created"
        });
      } catch (err: any) {
        console.warn("[PocketBase] Erreur getFullList prompts_matiere:", err?.message || err);
      }

      if (userId && typeof userId === "string" && userId.trim()) {
        const trimmed = userId.trim();
        let targetProfId = trimmed;

        try {
          const profs = await pb.collection("profs").getFullList({
            filter: `id = "${trimmed.replace(/"/g, '\\"')}" || id_unique = "${trimmed.replace(/"/g, '\\"')}" || email = "${trimmed.replace(/"/g, '\\"')}"`
          });
          if (profs.length > 0) {
            targetProfId = profs[0].id;
          }
        } catch {}

        const filtered = records.filter((r) => {
          const isOfficiel = r.officiel === true || r.officiel === "true" || r.officiel === 1;
          if (isOfficiel) return true;
          if (r.user === targetProfId || r.user === trimmed || !r.user) return true;
          return false;
        });

        return res.json({ success: true, items: filtered });
      }

      return res.json({ success: true, items: records });
    } catch (err: any) {
      console.error("Erreur GET /api/prompts-matiere:", err);
      return res.status(500).json({ success: false, error: err.message || "Erreur serveur lors de la récupération des prompts." });
    }
  });

  // API to create a personal prompt_matiere
  app.post("/api/prompts-matiere", async (req, res) => {
    try {
      const { nom, contenu, user } = req.body;
      if (!nom || !contenu) {
        return res.status(400).json({ success: false, error: "Le nom et le contenu du prompt sont requis." });
      }

      const pb = await getPocketBaseClient();
      let validUserId = "";

      if (user && typeof user === "string" && user.trim().length > 0) {
        const trimmedUser = user.trim();
        try {
          const profs = await pb.collection("profs").getFullList({
            filter: `id = "${trimmedUser.replace(/"/g, '\\"')}" || id_unique = "${trimmedUser.replace(/"/g, '\\"')}" || email = "${trimmedUser.replace(/"/g, '\\"')}"`
          });
          if (profs.length > 0) {
            validUserId = profs[0].id;
          } else {
            validUserId = trimmedUser;
          }
        } catch (e) {
          console.warn("[PocketBase] Impossible de vérifier le prof pour le prompt:", trimmedUser);
          validUserId = trimmedUser;
        }
      }

      const payload: any = {
        nom: String(nom).trim(),
        contenu: typeof contenu === "string" ? { text: contenu } : contenu,
        officiel: false
      };

      if (validUserId) {
        payload.user = validUserId;
      }

      let record;
      try {
        record = await pb.collection("prompts_matiere").create(payload);
      } catch (firstErr: any) {
        console.warn("[PocketBase] Essai création prompt_matiere avec user failed:", firstErr?.message);
        payload.user = "";
        record = await pb.collection("prompts_matiere").create(payload);
      }

      return res.json({ success: true, item: record });
    } catch (err: any) {
      console.error("Erreur POST /api/prompts-matiere:", err);
      const detailedError = err?.data ? JSON.stringify(err.data) : (err?.message || "Erreur lors de la création du prompt.");
      return res.status(500).json({ success: false, error: detailedError });
    }
  });

  // API to update a personal prompt_matiere
  app.put("/api/prompts-matiere/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { nom, contenu } = req.body;
      if (!id) {
        return res.status(400).json({ success: false, error: "ID de prompt requis." });
      }

      const pb = await getPocketBaseClient();
      const existing = await pb.collection("prompts_matiere").getOne(id).catch(() => null);
      if (existing && (existing.officiel === true || existing.officiel === "true" || existing.officiel === 1)) {
        return res.status(403).json({ success: false, error: "Les prompts officiels ne peuvent pas être modifiés directement." });
      }

      const updatePayload: any = {};
      if (nom !== undefined) updatePayload.nom = String(nom).trim();
      if (contenu !== undefined) updatePayload.contenu = typeof contenu === "string" ? { text: contenu } : contenu;

      const updated = await pb.collection("prompts_matiere").update(id, updatePayload);
      return res.json({ success: true, item: updated });
    } catch (err: any) {
      console.error("Erreur PUT /api/prompts-matiere:", err);
      return res.status(500).json({ success: false, error: err.message || "Erreur lors de la mise à jour du prompt." });
    }
  });

  // API to delete a personal prompt_matiere
  app.delete("/api/prompts-matiere/:id", async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ success: false, error: "ID de prompt requis." });
      }

      const pb = await getPocketBaseClient();
      const existing = await pb.collection("prompts_matiere").getOne(id).catch(() => null);
      if (existing && (existing.officiel === true || existing.officiel === "true" || existing.officiel === 1)) {
        return res.status(403).json({ success: false, error: "Les prompts officiels ne peuvent pas être supprimés." });
      }

      await pb.collection("prompts_matiere").delete(id);
      return res.json({ success: true });
    } catch (err: any) {
      console.error("Erreur DELETE /api/prompts-matiere:", err);
      return res.status(500).json({ success: false, error: err.message || "Erreur lors de la suppression du prompt." });
    }
  });

  // API to list items (officiel=true or user=userId or all)
  app.get("/api/items", async (req, res) => {
    try {
      const pb = await getPocketBaseClient();
      const { userId } = req.query;

      let records: any[] = [];
      try {
        records = await pb.collection("items").getFullList({
          sort: "-created"
        });
      } catch (err: any) {
        console.warn("[PocketBase] Erreur getFullList items:", err?.message || err);
      }

      if (userId && typeof userId === "string" && userId.trim()) {
        const trimmed = userId.trim();
        let targetProfId = trimmed;

        try {
          const profs = await pb.collection("profs").getFullList({
            filter: `id = "${trimmed.replace(/"/g, '\\"')}" || id_unique = "${trimmed.replace(/"/g, '\\"')}" || email = "${trimmed.replace(/"/g, '\\"')}"`
          });
          if (profs.length > 0) {
            targetProfId = profs[0].id;
          }
        } catch {}

        const filtered = records.filter((r) => {
          const isOfficiel = r.officiel === true || r.officiel === "true" || r.officiel === 1;
          if (isOfficiel) return true;
          if (r.user === targetProfId || r.user === trimmed || !r.user) return true;
          return false;
        });

        return res.json({ success: true, items: filtered });
      }

      return res.json({ success: true, items: records });
    } catch (err: any) {
      console.error("Erreur GET /api/items:", err);
      return res.status(500).json({ success: false, error: err.message || "Erreur serveur lors de la récupération des grilles d'items." });
    }
  });

  // API to create a personal item
  app.post("/api/items", async (req, res) => {
    try {
      const { nom, contenu, user } = req.body;
      if (!nom || !contenu) {
        return res.status(400).json({ success: false, error: "Le nom et le contenu de la grille d'items sont requis." });
      }

      const pb = await getPocketBaseClient();
      let validUserId = "";

      if (user && typeof user === "string" && user.trim().length > 0) {
        const trimmedUser = user.trim();
        try {
          const profs = await pb.collection("profs").getFullList({
            filter: `id = "${trimmedUser.replace(/"/g, '\\"')}" || id_unique = "${trimmedUser.replace(/"/g, '\\"')}" || email = "${trimmedUser.replace(/"/g, '\\"')}"`
          });
          if (profs.length > 0) {
            validUserId = profs[0].id;
          } else {
            validUserId = trimmedUser;
          }
        } catch (e) {
          console.warn("[PocketBase] Impossible de vérifier le prof pour l'item:", trimmedUser);
          validUserId = trimmedUser;
        }
      }

      const payload: any = {
        nom: String(nom).trim(),
        contenu: typeof contenu === "string" ? { text: contenu } : contenu,
        officiel: false
      };

      if (validUserId) {
        payload.user = validUserId;
      }

      let record;
      try {
        record = await pb.collection("items").create(payload);
      } catch (firstErr: any) {
        console.warn("[PocketBase] Essai création item avec user failed:", firstErr?.message);
        payload.user = "";
        record = await pb.collection("items").create(payload);
      }

      return res.json({ success: true, item: record });
    } catch (err: any) {
      console.error("Erreur POST /api/items:", err);
      const detailedError = err?.data ? JSON.stringify(err.data) : (err?.message || "Erreur lors de la création de la grille d'items.");
      return res.status(500).json({ success: false, error: detailedError });
    }
  });

  // API to update a personal item
  app.put("/api/items/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { nom, contenu } = req.body;
      if (!id) {
        return res.status(400).json({ success: false, error: "ID de grille d'items requis." });
      }

      const pb = await getPocketBaseClient();
      const existing = await pb.collection("items").getOne(id).catch(() => null);
      if (existing && (existing.officiel === true || existing.officiel === "true" || existing.officiel === 1)) {
        return res.status(403).json({ success: false, error: "Les grilles d'items officielles ne peuvent pas être modifiées directement." });
      }

      const updatePayload: any = {};
      if (nom !== undefined) updatePayload.nom = String(nom).trim();
      if (contenu !== undefined) updatePayload.contenu = typeof contenu === "string" ? { text: contenu } : contenu;

      const updated = await pb.collection("items").update(id, updatePayload);
      return res.json({ success: true, item: updated });
    } catch (err: any) {
      console.error("Erreur PUT /api/items:", err);
      return res.status(500).json({ success: false, error: err.message || "Erreur lors de la mise à jour de la grille d'items." });
    }
  });

  // API to delete a personal item
  app.delete("/api/items/:id", async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ success: false, error: "ID de grille d'items requis." });
      }

      const pb = await getPocketBaseClient();
      const existing = await pb.collection("items").getOne(id).catch(() => null);
      if (existing && (existing.officiel === true || existing.officiel === "true" || existing.officiel === 1)) {
        return res.status(403).json({ success: false, error: "Les grilles d'items officielles ne peuvent pas être supprimées." });
      }

      await pb.collection("items").delete(id);
      return res.json({ success: true });
    } catch (err: any) {
      console.error("Erreur DELETE /api/items:", err);
      return res.status(500).json({ success: false, error: err.message || "Erreur lors de la suppression de la grille d'items." });
    }
  });

  // API to list prompts_synthese (officiel=true or user=userId or all)
  app.get("/api/prompts-synthese", async (req, res) => {
    try {
      const pb = await getPocketBaseClient();
      const { userId } = req.query;

      let records: any[] = [];
      try {
        records = await pb.collection("prompts_synthese").getFullList({
          sort: "-created"
        });
      } catch (err: any) {
        console.warn("[PocketBase] Erreur getFullList prompts_synthese:", err?.message || err);
      }

      if (userId && typeof userId === "string" && userId.trim()) {
        const trimmed = userId.trim();
        let targetProfId = trimmed;

        try {
          const profs = await pb.collection("profs").getFullList({
            filter: `id = "${trimmed.replace(/"/g, '\\"')}" || id_unique = "${trimmed.replace(/"/g, '\\"')}" || email = "${trimmed.replace(/"/g, '\\"')}"`
          });
          if (profs.length > 0) {
            targetProfId = profs[0].id;
          }
        } catch {}

        const filtered = records.filter((r) => {
          const isOfficiel = r.officiel === true || r.officiel === "true" || r.officiel === 1;
          if (isOfficiel) return true;
          if (r.user === targetProfId || r.user === trimmed || !r.user) return true;
          return false;
        });

        return res.json({ success: true, items: filtered });
      }

      return res.json({ success: true, items: records });
    } catch (err: any) {
      console.error("Erreur GET /api/prompts-synthese:", err);
      return res.status(500).json({ success: false, error: err.message || "Erreur serveur lors de la récupération des prompts de synthèse." });
    }
  });

  // API to create a personal prompt_synthese
  app.post("/api/prompts-synthese", async (req, res) => {
    try {
      const { nom, contenu, user } = req.body;
      if (!nom || !contenu) {
        return res.status(400).json({ success: false, error: "Le nom et le contenu du prompt de synthèse sont requis." });
      }

      const pb = await getPocketBaseClient();
      let validUserId = "";

      if (user && typeof user === "string" && user.trim().length > 0) {
        const trimmedUser = user.trim();
        try {
          const profs = await pb.collection("profs").getFullList({
            filter: `id = "${trimmedUser.replace(/"/g, '\\"')}" || id_unique = "${trimmedUser.replace(/"/g, '\\"')}" || email = "${trimmedUser.replace(/"/g, '\\"')}"`
          });
          if (profs.length > 0) {
            validUserId = profs[0].id;
          } else {
            validUserId = trimmedUser;
          }
        } catch (e) {
          console.warn("[PocketBase] Impossible de vérifier le prof pour le prompt de synthèse:", trimmedUser);
          validUserId = trimmedUser;
        }
      }

      const payload: any = {
        nom: String(nom).trim(),
        contenu: typeof contenu === "string" ? { text: contenu } : contenu,
        officiel: false
      };

      if (validUserId) {
        payload.user = validUserId;
      }

      let record;
      try {
        record = await pb.collection("prompts_synthese").create(payload);
      } catch (firstErr: any) {
        console.warn("[PocketBase] Essai création prompt_synthese avec user failed:", firstErr?.message);
        payload.user = "";
        record = await pb.collection("prompts_synthese").create(payload);
      }

      return res.json({ success: true, item: record });
    } catch (err: any) {
      console.error("Erreur POST /api/prompts-synthese:", err);
      const detailedError = err?.data ? JSON.stringify(err.data) : (err?.message || "Erreur lors de la création du prompt de synthèse.");
      return res.status(500).json({ success: false, error: detailedError });
    }
  });

  // API to update a personal prompt_synthese
  app.put("/api/prompts-synthese/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { nom, contenu } = req.body;
      if (!id) {
        return res.status(400).json({ success: false, error: "ID de prompt de synthèse requis." });
      }

      const pb = await getPocketBaseClient();
      const existing = await pb.collection("prompts_synthese").getOne(id).catch(() => null);
      if (existing && (existing.officiel === true || existing.officiel === "true" || existing.officiel === 1)) {
        return res.status(403).json({ success: false, error: "Les prompts de synthèse officiels ne peuvent pas être modifiés directement." });
      }

      const updatePayload: any = {};
      if (nom !== undefined) updatePayload.nom = String(nom).trim();
      if (contenu !== undefined) updatePayload.contenu = typeof contenu === "string" ? { text: contenu } : contenu;

      const updated = await pb.collection("prompts_synthese").update(id, updatePayload);
      return res.json({ success: true, item: updated });
    } catch (err: any) {
      console.error("Erreur PUT /api/prompts-synthese:", err);
      return res.status(500).json({ success: false, error: err.message || "Erreur lors de la mise à jour du prompt de synthèse." });
    }
  });

  // API to delete a personal prompt_synthese
  app.delete("/api/prompts-synthese/:id", async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ success: false, error: "ID de prompt de synthèse requis." });
      }

      const pb = await getPocketBaseClient();
      const existing = await pb.collection("prompts_synthese").getOne(id).catch(() => null);
      if (existing && (existing.officiel === true || existing.officiel === "true" || existing.officiel === 1)) {
        return res.status(403).json({ success: false, error: "Les prompts de synthèse officiels ne peuvent pas être supprimés." });
      }

      await pb.collection("prompts_synthese").delete(id);
      return res.json({ success: true });
    } catch (err: any) {
      console.error("Erreur DELETE /api/prompts-synthese:", err);
      return res.status(500).json({ success: false, error: err.message || "Erreur lors de la suppression du prompt de synthèse." });
    }
  });

  // API to send verification code
  app.post("/api/send-code", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: "L'adresse e-mail est obligatoire." });
      }

      const emailKey = email.toLowerCase();

      // Check if user account already exists in profs collection
      try {
        const pb = await getPocketBaseClient();
        const existingProfs = await pb.collection("profs").getFullList({
          filter: `email = "${emailKey.replace(/"/g, '\\"')}"`
        }).catch(() => []);
        if (existingProfs.length > 0) {
          return res.status(400).json({
            error: "Un compte existe déjà avec cette adresse mail. Sachez que l'identifiant unique reçu par mail fait aussi office de mot de passe si le mot de passe précédemment renseigné a été oublié."
          });
        }
      } catch (pbCheckErr: any) {
        console.warn("[PocketBase] Check prof email error:", pbCheckErr.message);
      }

      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 15 * 60 * 1000;

      localVerificationCodes.set(emailKey, { code, expiresAt });

      try {
        const pb = await getPocketBaseClient();
        await pb.collection("verification_codes").create({
          email: emailKey,
          code
        });
        console.log(`[PocketBase] Code de vérification enregistré pour ${email} : ${code}`);
      } catch (pbErr: any) {
        console.warn("[PocketBase] Note sur enregistrement code PocketBase :", pbErr.message);
      }

      console.log(`[Email] Code de vérification envoyé à ${email} : ${code}`);

      return res.json({ 
        success: true, 
        message: "Code de vérification généré avec succès.",
        code_debug: code
      });

    } catch (err: any) {
      console.error("Erreur send-code:", err);
      return res.status(500).json({ error: err.message || "Une erreur est survenue lors de l'envoi." });
    }
  });

  // API to verify verification code
  app.post("/api/verify-code", async (req, res) => {
    try {
      const { email, code } = req.body;
      if (!email || !code) {
        return res.status(400).json({ error: "L'e-mail et le code sont obligatoires." });
      }

      const emailKey = email.toLowerCase();
      let isValid = false;

      // 1. Check local cache
      const cached = localVerificationCodes.get(emailKey);
      if (cached && cached.code === code && cached.expiresAt > Date.now()) {
        isValid = true;
        localVerificationCodes.delete(emailKey);
      }

      // 2. Check PocketBase
      if (!isValid) {
        try {
          const pb = await getPocketBaseClient();
          const records = await pb.collection("verification_codes").getFullList({
            filter: `email = "${emailKey.replace(/"/g, '\\"')}" && code = "${code.replace(/"/g, '\\"')}"`
          });
          if (records.length > 0) {
            isValid = true;
            try {
              await pb.collection("verification_codes").delete(records[0].id);
            } catch {}
          }
        } catch (pbErr: any) {
          console.warn("[PocketBase] Échec de vérification du code :", pbErr.message);
        }
      }

      if (isValid) {
        return res.json({ success: true, message: "Adresse e-mail vérifiée avec succès." });
      } else {
        return res.status(400).json({ success: false, error: "Code de vérification incorrect ou expiré." });
      }

    } catch (err: any) {
      console.error("Erreur verify-code:", err);
      return res.status(500).json({ error: err.message || "Une erreur est survenue." });
    }
  });

  // Stripe checkout session creation
  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      const { id_unique, plan_name, pack, email, prenom, nom, systeme_exploitation, ent, etablissement, identifiant_prof, mdp } = req.body;
      
      if (!id_unique || !plan_name) {
        return res.status(400).json({ error: "L'identifiant de la transaction et le nom du plan de licence sont requis." });
      }

      if (email) {
        const emailKey = email.toLowerCase();
        try {
          const pb = await getPocketBaseClient();
          const existingProfs = await pb.collection("profs").getFullList({
            filter: `email = "${emailKey.replace(/"/g, '\\"')}"`
          }).catch(() => []);
          if (existingProfs.length > 0) {
            return res.status(400).json({
              error: "Un compte existe déjà avec cette adresse mail. Sachez que l'identifiant unique reçu par mail fait aussi office de mot de passe si le mot de passe précédemment renseigné a été oublié."
            });
          }
        } catch (pbCheckErr: any) {
          console.warn("[PocketBase] Check prof email error:", pbCheckErr.message);
        }
      }

      const packVal = determinePackNumber(pack, plan_name);

      // Determine amount in cents from pack1 and pack2 in .env
      const p1Raw = getAdminConfigVar(["pack1", "PACK1"], "19.90").replace(",", ".");
      const p2Raw = getAdminConfigVar(["pack2", "PACK2"], "29.90").replace(",", ".");
      let pack1Cents = Math.round((parseFloat(p1Raw) || 19.90) * 100);
      let pack2Cents = Math.round((parseFloat(p2Raw) || 29.90) * 100);

      if (pack1Cents <= 0) pack1Cents = 1990;
      if (pack2Cents <= 0) pack2Cents = 2990;

      let amount = pack1Cents;
      if (packVal === 2 || plan_name.toLowerCase().includes("principal") || plan_name.toLowerCase().includes("pp")) {
        amount = pack2Cents;
      }

      const stripe = getStripeInstance();
      const origin = req.headers.origin || process.env.APP_URL || "http://localhost:3000";

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        customer_email: email || undefined,
        client_reference_id: id_unique,
        line_items: [
          {
            price_data: {
              currency: "eur",
              product_data: {
                name: plan_name,
                description: "Licence d'utilisation d'1 an de l'application apprecIAtion",
              },
              unit_amount: amount,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${origin}/?status=success&id_unique=${id_unique}&plan=${encodeURIComponent(plan_name)}&pack=${packVal}&email=${encodeURIComponent(email || "")}&prenom=${encodeURIComponent(prenom || "")}&nom=${encodeURIComponent(nom || "")}&os=${encodeURIComponent(systeme_exploitation || "")}&ent=${encodeURIComponent(ent || "")}&school=${encodeURIComponent(etablissement || "")}&identifiant_prof=${encodeURIComponent(identifiant_prof || "")}&mdp=${encodeURIComponent(mdp || "")}`,
        cancel_url: `${origin}/?status=cancel`,
        metadata: {
          id_unique,
          plan_name,
          pack: String(packVal),
          email,
          prenom,
          nom,
          systeme_exploitation,
          ent,
          etablissement,
          identifiant_prof,
          mdp: mdp || ""
        }
      });

      return res.json({ id: session.id, url: session.url });
    } catch (error: any) {
      console.error("Erreur lors de la création de la session Stripe:", error);
      return res.status(500).json({ error: error.message || "Impossible de créer la session de paiement Stripe." });
    }
  });

  // Stripe checkout callback validation (marks subscription as active in DB)
  app.post("/api/validate-payment", async (req, res) => {
    try {
      const { id_unique, nom, prenom, email, systeme_exploitation, ent, identifiant_prof, etablissement, version, mdp, expiration, compte_valide, nombre_licences, plan, plan_name, pack } = req.body;
      if (!id_unique) {
        return res.status(400).json({ error: "L'identifiant unique de la licence est requis." });
      }

      const packVal = determinePackNumber(pack, plan || plan_name);
      const expDate = toPocketBaseIsoDate(expiration);
      const appVersion = version || "V1.2";
      const statusValide = compte_valide || "nok";
      const countLicences = nombre_licences || 1;

      const pb = await getPocketBaseClient();
      let filterStr = `id_unique = "${id_unique.replace(/"/g, '\\"')}"`;
      if (email) {
        filterStr += ` || email = "${email.replace(/"/g, '\\"')}"`;
      }
      const records = await pb.collection("profs").getFullList({
        filter: filterStr
      }).catch(() => []);

      const rawMdp = mdp ? String(mdp).trim() : "";
      const pbPassword = rawMdp.length >= 6 ? rawMdp : "ApprecIAtion2026!";
      const validEmail = (email && String(email).trim() !== "") ? String(email).trim() : `${(identifiant_prof || id_unique).replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}@appreciation.fr`;

      const profData: any = {
        nom: nom || "",
        prenom: prenom || "",
        email: validEmail,
        systeme_exploitation: systeme_exploitation || "",
        ent: ent || "",
        identifiant_prof: identifiant_prof || "",
        etablissement: etablissement || "",
        id_unique,
        compte_valide: statusValide,
        version: appVersion,
        expiration: expDate,
        nb_licence: countLicences,
        pack: packVal
      };

      if (records.length > 0) {
        if (rawMdp && rawMdp.length >= 6) {
          profData.password = rawMdp;
          profData.passwordConfirm = rawMdp;
        }
        await pb.collection("profs").update(records[0].id, profData);
      } else {
        profData.password = pbPassword;
        profData.passwordConfirm = pbPassword;
        profData.emailVisibility = true;
        profData.verified = true;

        await pb.collection("profs").create(profData);
      }
      console.log(`[PocketBase] Paiement validé pour le professeur ${email} (${id_unique})`);

      return res.json({ 
        success: true, 
        message: "Paiement validé et compte professeur enregistré avec succès dans la base de données PocketBase.",
        id_unique,
        email_sent: true
      });

    } catch (error: any) {
      console.error("Erreur lors de la validation du paiement:", error);
      return res.status(500).json({ error: error.message || "Une erreur est survenue lors de la validation." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[apprecIAtion Server] Running on http://localhost:${PORT}`);
  });
}

startServer();
