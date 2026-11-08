# Optimisation de la Délivrabilité & Résolution des Courriers Indésirables (Spam)

## 1. Contexte & Problématique

Les courriels transactionnels envoyés par la plateforme (notamment les codes de vérification à 6 chiffres via `/api/send-code` et les e-mails de bienvenue/confirmation après inscription via `/api/register-prof`) arrivaient fréquemment dans le dossier **Courrier indésirable / Spam** des destinataires (particulièrement sur Gmail, Outlook/Hotmail, et les académies scolaires).

---

## 2. Analyse des Facteurs de Blocage

Les filtres anti-spam modernes (Google Workspace, Microsoft Defender, filtres académiques) analysent plusieurs niveaux :

1. **Authentification DNS du Domaine :**
   - **SPF (Sender Policy Framework) :** Vérifie que le serveur émetteur (IP o2switch) a le droit d'émettre des e-mails pour le domaine.
   - **DKIM (DomainKeys Identified Mail) :** Signature cryptographique assurant que le message n'a pas été altéré en transit.
   - **DMARC (Domain-based Message Authentication, Reporting, and Conformance) :** Politique indiquant aux serveurs de réception le comportement à adopter en cas d'échec SPF/DKIM.

2. **Cohérence des En-têtes SMTP (PHPMailer) :**
   - Désalignement fréquent entre le `From` affiché, le compte SMTP authentifié, et le `Return-Path` (envelope sender).
   - Absence d'en-tête `Message-ID` conforme ou d'en-tête `Date` standardisé.

3. **Format du Contenu (MIME Multipart) :**
   - E-mails envoyés uniquement en HTML sans alternative en texte brut (`AltBody`), pénalisés par les filtres Bayes.
   - Ratios texte/HTML déséquilibrés.

---

## 3. Actions Techniques Mises en Œuvre

### A. Configuration PHPMailer Côté Application (`send-code.php`, `register-prof.php`)

1. **Connexion SMTP Authentifiée Sécurisée :**
   - Utilisation du serveur SMTP dédié o2switch avec chiffrement `SMTPS` (Port 465) ou `STARTTLS` (Port 587).
   - Authentification explicite (`$mail->SMTPAuth = true`).

2. **Alignement Strict des Adresses d'Expédition :**
   - Définition stricte du `From`, `FromName`, et du `Sender` (Return-Path) pointant vers une boîte mail réelle et existante du domaine :
     ```php
     $mail->setFrom('contact@appreciation.fr', 'ApprécIAtion');
     $mail->Sender = 'contact@appreciation.fr'; // Garantit un Return-Path aligné
     ```

3. **Format Multipart Obligatoire (HTML + Texte Brut) :**
   - Intégration systématique de la version texte brut (`AltBody`) indispensable pour satisfaire les analyseurs de spam :
     ```php
     $mail->isHTML(true);
     $mail->Subject = 'Votre code de confirmation - ApprécIAtion';
     $mail->Body    = $htmlTemplate;
     $mail->AltBody = "Bonjour,\n\nVoici votre code de confirmation : " . $code . "\n\nCe code est valable 15 minutes.\nL'équipe ApprécIAtion";
     ```

4. **Nettoyage du Gabarit HTML :**
   - Structure HTML simple, balises fermées, CSS en ligne (inline styles) compatible clients lourds et webmails.
   - Suppression des mots-clés typiques déclencheurs de faux-positifs ("GRATUIT", "URGENT", majuscules excessives).

---

### B. Configuration DNS Recommandée (o2switch / Gestionnaire DNS)

| Type | Nom / Hôte | Valeur Recommandée | Rôle |
| :--- | :--- | :--- | :--- |
| **TXT** | `@` | `v=spf1 include:_spf.o2switch.net ~all` | Autorise les serveurs de messagerie o2switch |
| **TXT** | `default._domainkey` | Clé publique DKIM générée par cPanel o2switch | Authentifie l'origine du mail par clé asymétrique |
| **TXT** | `_dmarc` | `v=DMARC1; p=none; sp=none; rua=mailto:dmarc@appreciation.fr` | Sécurise et monitore la politique de distribution |

---

## 4. Résultats & Bonnes Pratiques
- **Score de réputation :** Les courriels atteignent désormais directement la **Boîte de réception principale**.
- **Surveillance :** Vérifier régulièrement les rapports DMARC ou tester un envoi via des outils comme `mail-tester.com` pour maintenir une note supérieure à 9/10.
