<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\SMTP;

mb_internal_encoding('UTF-8');

$phpmailerDir = null;
if (file_exists(__DIR__ . '/PHPMailer/PHPMailer.php')) {
    $phpmailerDir = __DIR__ . '/PHPMailer';
} elseif (file_exists(__DIR__ . '/includes/PHPMailer/PHPMailer.php')) {
    $phpmailerDir = __DIR__ . '/includes/PHPMailer';
} elseif (file_exists(__DIR__ . '/../includes/PHPMailer/PHPMailer.php')) {
    $phpmailerDir = __DIR__ . '/../includes/PHPMailer';
}

if ($phpmailerDir) {
    require_once $phpmailerDir . '/Exception.php';
    require_once $phpmailerDir . '/PHPMailer.php';
    require_once $phpmailerDir . '/SMTP.php';
}
if (file_exists(__DIR__ . '/pocketbase.php')) {
    require_once __DIR__ . '/pocketbase.php';
} elseif (file_exists(__DIR__ . '/includes/pocketbase.php')) {
    require_once __DIR__ . '/includes/pocketbase.php';
} elseif (file_exists(__DIR__ . '/../includes/pocketbase.php')) {
    require_once __DIR__ . '/../includes/pocketbase.php';
}

if (file_exists(__DIR__ . '/crypto.php')) {
    require_once __DIR__ . '/crypto.php';
} elseif (file_exists(__DIR__ . '/includes/crypto.php')) {
    require_once __DIR__ . '/includes/crypto.php';
} elseif (file_exists(__DIR__ . '/../includes/crypto.php')) {
    require_once __DIR__ . '/../includes/crypto.php';
}

/**
 * Script de liaison de base de données o2switch pour l'inscription des professeurs.
 * Ce script est copié automatiquement dans le dossier de build (dist/) et fonctionne
 * directement sur un hébergement o2switch standard.
 */

// Configuration des en-têtes CORS pour autoriser l'accès depuis l'extérieur si nécessaire
header("Content-Type: application/json; charset=UTF-8");
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '*';
header("Access-Control-Allow-Origin: " . $origin);
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Gestion de la requête de pré-vérification OPTIONS (CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// 1. Lecture des variables d'environnement via pb_get_env()
$env = pb_get_env();

// 2. Variables de connexion (soit depuis le .env s'il est téléversé, soit configuré en dur ici)
$db_host = isset($env['DB_HOST']) ? $env['DB_HOST'] : 'localhost';
$db_port = isset($env['DB_PORT']) ? $env['DB_PORT'] : '3306';
$db_user = isset($env['DB_USER']) ? $env['DB_USER'] : 'nite9442_tonioshast';
$db_password = isset($env['DB_PASSWORD']) ? $env['DB_PASSWORD'] : 'Furets1979#!?';
$db_name = isset($env['DB_NAME']) ? $env['DB_NAME'] : 'nite9442_apprecIAtion';

/**
 * Envoie un email récapitulatif professionnel en HTML au professeur inscrit.
 */
function envoyerEmailRecapitulatif($prenom, $nom, $email, $systeme_exploitation, $ent, $identifiant_prof, $etablissement, $id_unique, $version, $expiration = '', $is_update = false) {
    global $env;

    if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return false;
    }

    $sujet = $is_update 
        ? "Mise à jour de votre licence apprecIAtion" 
        : "Confirmation de votre licence apprecIAtion";

    $domain = 'appreciation.fr'; // Domaine de messagerie officiel
    if (!empty($_SERVER['HTTP_HOST'])) {
        $host = strtolower($_SERVER['HTTP_HOST']);
        if (!preg_match('/localhost|127\.0\.0\.1|run\.app/i', $host)) {
            $domain = preg_replace('/^www\./i', '', $host);
        }
    }

    $smtp_host = isset($env['SMTP_HOST']) ? $env['SMTP_HOST'] : 'mail.' . $domain;
    $smtp_port = isset($env['SMTP_PORT']) ? intval($env['SMTP_PORT']) : 465;
    $smtp_secure = isset($env['SMTP_SECURE']) ? $env['SMTP_SECURE'] : 'ssl'; // 'ssl' ou 'tls'
    $smtp_user = isset($env['SMTP_USER']) ? $env['SMTP_USER'] : 'contact@' . $domain;
    $smtp_password = isset($env['SMTP_PASSWORD']) ? $env['SMTP_PASSWORD'] : 'Furets1979#!?';
    $smtp_from = !empty($env['SMTP_FROM']) ? $env['SMTP_FROM'] : (!empty($env['SMTP_USER']) && filter_var($env['SMTP_USER'], FILTER_VALIDATE_EMAIL) ? $env['SMTP_USER'] : 'contact@' . $domain);

    $ent_label = $ent === 'pronote' ? 'PRONOTE' : ($ent === 'ecole_directe' ? 'EcoleDirecte' : htmlspecialchars($ent));
    $os_label = ucfirst(htmlspecialchars($systeme_exploitation));
    $displayExpDate = format_date_fr($expiration);

    $intro_text = $is_update
        ? "Nous vous confirmons que les informations de votre licence pour le logiciel <strong>apprecIAtion (Version " . htmlspecialchars($version) . ")</strong> ont bien été mises à jour dans notre système."
        : "Nous avons le plaisir de vous confirmer que votre demande d'acquisition de licence pour le logiciel <strong>apprecIAtion (Version " . htmlspecialchars($version) . ")</strong> a bien été enregistrée et transmise à notre équipe pour validation.";

    // Version texte brut (Alternative Text)
    $text_intro = $is_update
        ? "Nous vous confirmons que les informations de votre licence pour le logiciel apprecIAtion (Version " . $version . ") ont bien été mises à jour dans notre système."
        : "Nous avons le plaisir de vous confirmer que votre demande d'acquisition de licence pour le logiciel apprecIAtion (Version " . $version . ") a bien été enregistrée et transmise à notre équipe pour validation.";

    $text = "Bonjour " . $prenom . " " . $nom . ",\n\n";
    $text .= $text_intro . "\n\n";
    $text .= "RÉCAPITULATIF DE VOTRE LICENCE :\n";
    $text .= "----------------------------------------\n";
    $text .= "- Titulaire : " . $prenom . " " . $nom . "\n";
    $text .= "- E-mail de contact : " . $email . "\n";
    $text .= "- Date d'expiration : " . $displayExpDate . "\n";
    $text .= "- Système d'exploitation : " . $os_label . "\n";
    $text .= "- Établissement : " . $etablissement . "\n";
    $text .= "- Interface scolaire (ENT) : " . $ent_label . "\n";
    $text .= "- Identifiant de liaison exact : " . $identifiant_prof . "\n";
    $text .= "- Statut de la licence : En attente de validation\n";
    $text .= "- Votre Clé d'Activation Unique : " . $id_unique . "\n\n";
    $text .= "⚠️ Rappel de liaison de l'extension :\n";
    $text .= "Pour que la liaison automatique fonctionne, l'identifiant enseignant renseigné ci-dessus (" . $identifiant_prof . ") doit correspondre parfaitement au nom du compte connecté s'affichant dans votre espace " . $ent_label . " (majuscules, minuscules, accents et espaces compris).\n\n";
    $text .= "Que se passe-t-il maintenant ?\n";
    $text .= "Notre équipe valide actuellement votre accès (statut : en attente). Dès sa validation sous 24 heures, vous recevrez un second e-mail d'activation et l'application sera immédiatement fonctionnelle pour l'ensemble de vos classes.\n\n";
    $text .= "apprecIAtion - Les commentaires scolaires réinventés intelligemment.\n";
    $text .= "Cet e-mail automatique a été envoyé suite à votre saisie sur l'application. Merci de ne pas y répondre directement.";

    $html = '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>' . htmlspecialchars($sujet) . '</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #334155; margin: 0; padding: 0; }
    .wrapper { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background: linear-gradient(135deg, #1e3a8a, #3b82f6); padding: 32px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.025em; }
    .header p { margin: 8px 0 0; font-size: 14px; opacity: 0.9; }
    .content { padding: 32px; line-height: 1.6; }
    .greeting { font-size: 18px; font-weight: 700; color: #1e293b; margin-bottom: 16px; }
    .intro { font-size: 14px; color: #475569; margin-bottom: 24px; }
    .card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 24px; }
    .card-title { font-weight: 700; font-size: 14px; color: #1e3a8a; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 16px; }
    .info-table { width: 100%; border-collapse: collapse; }
    .info-table td { padding: 8px 0; font-size: 13px; border-bottom: 1px solid #f1f5f9; }
    .info-label { font-weight: 600; color: #64748b; width: 40%; }
    .info-value { color: #0f172a; }
    .id-box { background-color: #eff6ff; border: 1px dashed #bfdbfe; color: #1e40af; padding: 12px; border-radius: 8px; font-family: monospace; font-size: 15px; font-weight: 700; text-align: center; margin: 16px 0; letter-spacing: 0.05em; }
    .status-badge { display: inline-block; background-color: #fef3c7; color: #d97706; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.05em; }
    .warning-box { background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 8px; margin-bottom: 24px; }
    .warning-box p { margin: 0; font-size: 12px; color: #b45309; line-height: 1.5; }
    .footer { background-color: #f8fafc; padding: 24px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #64748b; }
    .footer p { margin: 4px 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>apprecIAtion</h1>
      <p>Votre outil d\'aide à la rédaction des appréciations scolaires</p>
    </div>
    <div class="content">
      <div class="greeting">Bonjour ' . htmlspecialchars($prenom) . ' ' . htmlspecialchars($nom) . ',</div>
      <p class="intro">' . $intro_text . '</p>
      
      <div class="card">
        <div class="card-title">Récapitulatif de votre licence</div>
        <table class="info-table">
          <tr>
            <td class="info-label">Titulaire</td>
            <td class="info-value"><strong>' . htmlspecialchars($prenom) . ' ' . htmlspecialchars($nom) . '</strong></td>
          </tr>
          <tr>
            <td class="info-label">E-mail de contact</td>
            <td class="info-value">' . htmlspecialchars($email) . '</td>
          </tr>
          <tr>
            <td class="info-label">Date d\'expiration</td>
            <td class="info-value"><strong>' . htmlspecialchars($displayExpDate) . '</strong></td>
          </tr>
          <tr>
            <td class="info-label">Système d\'exploitation</td>
            <td class="info-value">' . $os_label . '</td>
          </tr>
          <tr>
            <td class="info-label">Établissement</td>
            <td class="info-value">' . htmlspecialchars($etablissement) . '</td>
          </tr>
          <tr>
            <td class="info-label">Interface scolaire (ENT)</td>
            <td class="info-value">' . $ent_label . '</td>
          </tr>
          <tr>
            <td class="info-label">Identifiant de liaison exact</td>
            <td class="info-value" style="color: #1e3a8a; font-weight: bold;">' . htmlspecialchars($identifiant_prof) . '</td>
          </tr>
          <tr>
            <td class="info-label">Statut de la licence</td>
            <td class="info-value"><span class="status-badge">En attente de validation</span></td>
          </tr>
        </table>
        
        <p style="font-size: 13px; margin: 16px 0 8px; font-weight: 600; color: #334155;">Votre Clé d\'Activation Unique :</p>
        <div class="id-box">' . htmlspecialchars($id_unique) . '</div>
      </div>
 
      <div class="warning-box">
        <p><strong>⚠️ Rappel de liaison de l\'extension :</strong> Pour que la liaison automatique fonctionne, l\'identifiant enseignant renseigné ci-dessus (<code>' . htmlspecialchars($identifiant_prof) . '</code>) doit correspondre <strong>parfaitement</strong> au nom du compte connecté s\'affichant dans votre espace ' . $ent_label . ' (majuscules, minuscules, accents et espaces compris).</p>
      </div>
 
      <p class="intro" style="margin-bottom: 0;"><strong>Que se passe-t-il maintenant ?</strong><br>
      Notre équipe valide actuellement votre accès (statut : en attente). Dès sa validation sous 24 heures, vous recevrez un second e-mail d\'activation et l\'application sera immédiatement fonctionnelle pour l\'ensemble de vos classes.</p>
    </div>
    <div class="footer">
      <p><strong>apprecIAtion</strong> - Les commentaires scolaires réinventés intelligemment.</p>
      <p>Cet e-mail automatique a été envoyé suite à votre saisie sur l\'application. Merci de ne pas y répondre directement.</p>
    </div>
  </div>
</body>
</html>';

    $mail = new PHPMailer(true);

    try {
        $mail->isSMTP();
        $mail->Host       = $smtp_host;
        $mail->SMTPAuth   = true;
        $mail->Username   = $smtp_user;
        $mail->Password   = $smtp_password;
        
        if ($smtp_secure === 'ssl') {
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
        } elseif ($smtp_secure === 'tls') {
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        } else {
            $mail->SMTPAutoTLS = false;
            $mail->SMTPSecure = '';
        }
        
        $mail->Port       = $smtp_port;
        $mail->CharSet    = 'UTF-8';
        $mail->Encoding   = 'base64';

        // Options SSL pour garantir l'envoi même sur les serveurs locaux ou mutualisés stricts
        $mail->SMTPOptions = [
            'ssl' => [
                'verify_peer' => false,
                'verify_peer_name' => false,
                'allow_self_signed' => true
            ]
        ];

        // Expéditeur & Destinataire
        $mail->setFrom($smtp_from, 'apprecIAtion');
        $mail->addAddress($email, $prenom . ' ' . $nom);
        $mail->addReplyTo($smtp_from, 'apprecIAtion');

        // Contenu
        $mail->isHTML(true);
        $mail->Subject = $sujet;
        $mail->Body    = $html;
        $mail->AltBody = $text;

        $mail->send();
        return true;
    } catch (Exception $e) {
        error_log("Erreur PHPMailer : " . $mail->ErrorInfo);
        return false;
    }
}

// Sécurité supplémentaire : S'assurer que la méthode est bien du POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => "Méthode non autorisée. Seule la méthode POST est acceptée."]);
    exit;
}

// 3. Récupération des données envoyées en JSON
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(["error" => "Données JSON invalides ou vides."]);
    exit;
}

$nom = isset($data['nom']) ? trim($data['nom']) : null;
$prenom = isset($data['prenom']) ? trim($data['prenom']) : null;
$email = isset($data['email']) ? trim($data['email']) : null;
$systeme_exploitation = isset($data['systeme_exploitation']) ? trim($data['systeme_exploitation']) : null;
$ent = isset($data['ent']) ? trim($data['ent']) : null;
$identifiant_prof = isset($data['identifiant_prof']) ? trim($data['identifiant_prof']) : null;
$etablissement = isset($data['etablissement']) ? trim($data['etablissement']) : null;
$id_unique = isset($data['id_unique']) ? trim($data['id_unique']) : null;
$expiration = isset($data['expiration']) ? trim($data['expiration']) : null;
$version = isset($data['version']) ? trim($data['version']) : 'V1.1';
$mdp = isset($data['mdp']) ? trim($data['mdp']) : null;
$packva = isset($data['packva']) ? intval($data['packva']) : (isset($data['pack']) ? intval($data['pack']) : 1);

// Vérification des champs requis d'après la nouvelle structure SQL
if (empty($nom) || empty($prenom) || empty($identifiant_prof) || empty($etablissement)) {
    http_response_code(400);
    echo json_encode(["error" => "Le nom, le prénom, l'identifiant enseignant et l'établissement scolaire sont obligatoires."]);
    exit;
}

// Générer un ID unique s'il n'est pas fourni
if (empty($id_unique)) {
    $id_unique = 'id_' . bin2hex(random_bytes(10));
}

if (!function_exists('get_admin_expiration_config')) {
    function get_admin_expiration_config() {
        $exp = get_admin_config_var('expiration', '');
        return !empty($exp) ? $exp : null;
    }
}

function format_date_fr($inputDate = '') {
    if (empty($inputDate)) {
        $inputDate = get_admin_expiration_config();
    }
    if (!empty($inputDate)) {
        $inputDate = trim($inputDate);
        if (preg_match('/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/', $inputDate, $matches)) {
            $day = str_pad($matches[1], 2, '0', STR_PAD_LEFT);
            $month = str_pad($matches[2], 2, '0', STR_PAD_LEFT);
            $year = $matches[3];
            return "{$day}/{$month}/{$year}";
        }
        if (preg_match('/^(\d{4})-(\d{2})-(\d{2})/', $inputDate, $matches)) {
            $year = $matches[1];
            $month = $matches[2];
            $day = $matches[3];
            return "{$day}/{$month}/{$year}";
        }
        return $inputDate;
    }
    $cfg = get_admin_expiration_config();
    return !empty($cfg) ? $cfg : "";
}

function toPocketBaseIsoDate($inputDate = '') {
    if (empty($inputDate)) {
        $inputDate = get_admin_expiration_config();
    }
    if (!empty($inputDate)) {
        $inputDate = trim($inputDate);
        if (preg_match('/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/', $inputDate, $matches)) {
            $day = str_pad($matches[1], 2, '0', STR_PAD_LEFT);
            $month = str_pad($matches[2], 2, '0', STR_PAD_LEFT);
            $year = $matches[3];
            return "{$year}-{$month}-{$day} 00:00:00.000Z";
        }
        if (preg_match('/^\d{4}-\d{2}-\d{2}/', $inputDate)) {
            if (strpos($inputDate, 'Z') !== false || strpos($inputDate, ' ') !== false) {
                return $inputDate;
            }
            return "{$inputDate} 00:00:00.000Z";
        }
        return $inputDate;
    }
    $cfg = get_admin_expiration_config();
    if (!empty($cfg)) {
        return toPocketBaseIsoDate($cfg);
    }
    return "";
}

try {
    // Étape A : Rechercher professeur existant dans PocketBase
    $filter = 'identifiant_prof="' . addslashes($identifiant_prof) . '" && etablissement="' . addslashes($etablissement) . '"';
    $search = pb_request('GET', '/api/collections/profs/records?filter=' . rawurlencode($filter));
    
    $existing = null;
    if (isset($search['body']['items']) && count($search['body']['items']) > 0) {
        $existing = $search['body']['items'][0];
    }

    $formattedExpDate = toPocketBaseIsoDate(!empty($expiration) ? $expiration : (!empty($date) ? $date : ''));
    
    $rawMdp = !empty($mdp) ? trim((string)$mdp) : '';
    $pbPassword = strlen($rawMdp) >= 6 ? $rawMdp : 'ApprecIAtion2026!';
    $cleanEmail = !empty($email) ? trim($email) : (preg_replace('/[^a-zA-Z0-9]/', '', strtolower($identifiant_prof ?: $id_unique)) . '@appreciation.fr');

    $profData = [
        'nom' => $nom,
        'prenom' => $prenom,
        'email' => $cleanEmail,
        'systeme_exploitation' => !empty($systeme_exploitation) ? $systeme_exploitation : '',
        'ent' => !empty($ent) ? $ent : '',
        'identifiant_prof' => $identifiant_prof,
        'etablissement' => $etablissement,
        'id_unique' => $id_unique,
        'compte_valide' => 'nok',
        'version' => $version,
        'expiration' => $formattedExpDate,
        'nb_licence' => 1,
        'pack' => $packva
    ];

    if ($existing) {
        // Étape B : Mettre à jour l'enregistrement existant
        $finalIdUnique = !empty($existing['id_unique']) ? $existing['id_unique'] : $id_unique;
        $profData['id_unique'] = $finalIdUnique;
        if (!empty($rawMdp) && strlen($rawMdp) >= 6) {
            $profData['password'] = $rawMdp;
            $profData['passwordConfirm'] = $rawMdp;
        }
        
        $up = pb_request('PATCH', '/api/collections/profs/records/' . $existing['id'], $profData);
        $email_envoye = envoyerEmailRecapitulatif($prenom, $nom, $email, $systeme_exploitation, $ent, $identifiant_prof, $etablissement, $finalIdUnique, $version, $formattedExpDate, true);
        
        echo json_encode([
            "success" => true,
            "id" => $existing['id'],
            "id_unique" => $finalIdUnique,
            "email_sent" => $email_envoye,
            "message" => "Professeur mis à jour avec succès dans PocketBase."
        ]);
    } else {
        // Étape C : Insérer un nouvel enregistrement
        $profData['password'] = $pbPassword;
        $profData['passwordConfirm'] = $pbPassword;
        $profData['emailVisibility'] = true;
        $profData['verified'] = true;

        $created = pb_request('POST', '/api/collections/profs/records', $profData);
        $recordId = isset($created['body']['id']) ? $created['body']['id'] : $id_unique;
        
        $email_envoye = envoyerEmailRecapitulatif($prenom, $nom, $email, $systeme_exploitation, $ent, $identifiant_prof, $etablissement, $id_unique, $version, $formattedExpDate, false);
        
        echo json_encode([
            "success" => true,
            "id" => $recordId,
            "id_unique" => $id_unique,
            "email_sent" => $email_envoye,
            "message" => "Professeur enregistré avec succès dans PocketBase (compte en attente de validation 'nok')."
        ]);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "error" => "Erreur PocketBase PHP : " . $e->getMessage()
    ]);
}
