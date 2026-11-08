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

// Configuration des en-têtes CORS
header("Content-Type: application/json; charset=UTF-8");
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '*';
header("Access-Control-Allow-Origin: " . $origin);
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// 1. Lecture des variables d'environnement via pb_get_env()
$env = pb_get_env();

$db_host = isset($env['DB_HOST']) ? $env['DB_HOST'] : 'localhost';
$db_port = isset($env['DB_PORT']) ? intval($env['DB_PORT']) : 3306;
$db_user = isset($env['DB_USER']) ? $env['DB_USER'] : 'nite9442_tonioshast';
$db_password = isset($env['DB_PASSWORD']) ? $env['DB_PASSWORD'] : 'Furets1979#!?';
$db_name = isset($env['DB_NAME']) ? $env['DB_NAME'] : 'nite9442_apprecIAtion';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => "Méthode non autorisée. Seule la méthode POST est acceptée."]);
    exit;
}

$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(["error" => "Données JSON invalides ou vides."]);
    exit;
}

$id_unique = isset($data['id_unique']) ? trim($data['id_unique']) : null;
$nom = isset($data['nom']) ? trim($data['nom']) : null;
$prenom = isset($data['prenom']) ? trim($data['prenom']) : null;
$email = isset($data['email']) ? trim($data['email']) : null;
$systeme_exploitation = isset($data['systeme_exploitation']) ? trim($data['systeme_exploitation']) : null;
$ent = isset($data['ent']) ? trim($data['ent']) : null;
$identifiant_prof = isset($data['identifiant_prof']) ? trim($data['identifiant_prof']) : null;
$etablissement = isset($data['etablissement']) ? trim($data['etablissement']) : null;
$version = isset($data['version']) ? trim($data['version']) : 'V1.2';
$expiration = isset($data['expiration']) && !empty($data['expiration']) ? trim($data['expiration']) : null;
$compte_valide = isset($data['compte_valide']) ? trim($data['compte_valide']) : 'nok';
$nombre_licences = isset($data['nombre_licences']) ? intval($data['nombre_licences']) : 1;
$mdp = isset($data['mdp']) ? trim($data['mdp']) : null;
$packva = isset($data['packva']) ? intval($data['packva']) : (isset($data['pack']) ? intval($data['pack']) : 1);

if (empty($id_unique)) {
    http_response_code(400);
    echo json_encode(["error" => "L'identifiant unique de la licence est obligatoire."]);
    exit;
}

/**
 * Envoie un email d'activation professionnel en HTML au professeur inscrit.
 */
function envoyerEmailValidation($prenom, $nom, $email, $systeme_exploitation, $ent, $identifiant_prof, $etablissement, $id_unique, $version, $expiration = '') {
    global $env;

    if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return false;
    }

    $sujet = "Activation de votre licence apprecIAtion";

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

    $intro_text = "Nous avons le plaisir de vous confirmer que votre paiement a bien été reçu. Votre licence définitive pour le logiciel <strong>apprecIAtion (Version " . htmlspecialchars($version) . ")</strong> est désormais entièrement <strong>activée et opérationnelle</strong>.";

    // Version texte brut (Alternative Text)
    $text_intro = "Nous avons le plaisir de vous confirmer que votre paiement a bien été reçu. Votre licence définitive pour le logiciel apprecIAtion (Version " . $version . ") est désormais entièrement activée et opérationnelle.";

    $text = "Bonjour " . $prenom . " " . $nom . ",\n\n";
    $text .= $text_intro . "\n\n";
    $text .= "RÉCAPITULATIF DE VOTRE LICENCE ACTIVÉE :\n";
    $text .= "----------------------------------------\n";
    $text .= "- Titulaire : " . $prenom . " " . $nom . "\n";
    $text .= "- E-mail de contact : " . $email . "\n";
    $text .= "- Date d'expiration : " . $displayExpDate . "\n";
    $text .= "- Système d'exploitation : " . $os_label . "\n";
    $text .= "- Établissement : " . $etablissement . "\n";
    $text .= "- Interface scolaire (ENT) : " . $ent_label . "\n";
    $text .= "- Identifiant de liaison exact : " . $identifiant_prof . "\n";
    $text .= "- Statut de la licence : Validée et Activée\n";
    $text .= "- Votre Clé d'Activation Unique : " . $id_unique . "\n\n";
    $text .= "⚠️ Rappel de liaison de l'extension :\n";
    $text .= "Pour que la liaison automatique fonctionne, l'identifiant enseignant renseigné ci-dessus (" . $identifiant_prof . ") doit correspondre parfaitement au nom du compte connecté s'affichant dans votre espace " . $ent_label . " (majuscules, minuscules, accents et espaces compris).\n\n";
    $text .= "Comment l'utiliser ?\n";
    $text .= "Votre extension Chrome et l'application s'activeront instantanément en saisissant la clé d'activation ci-dessus.\n\n";
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
    .header { background: linear-gradient(135deg, #10b981, #059669); padding: 32px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.025em; }
    .header p { margin: 8px 0 0; font-size: 14px; opacity: 0.9; }
    .content { padding: 32px; line-height: 1.6; }
    .greeting { font-size: 18px; font-weight: 700; color: #1e293b; margin-bottom: 16px; }
    .intro { font-size: 14px; color: #475569; margin-bottom: 24px; }
    .card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 24px; }
    .card-title { font-weight: 700; font-size: 14px; color: #059669; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 16px; }
    .info-table { width: 100%; border-collapse: collapse; }
    .info-table td { padding: 8px 0; font-size: 13px; border-bottom: 1px solid #f1f5f9; }
    .info-label { font-weight: 600; color: #64748b; width: 40%; }
    .info-value { color: #0f172a; }
    .id-box { background-color: #ecfdf5; border: 1px dashed #a7f3d0; color: #065f46; padding: 12px; border-radius: 8px; font-family: monospace; font-size: 15px; font-weight: 700; text-align: center; margin: 16px 0; letter-spacing: 0.05em; }
    .status-badge { display: inline-block; background-color: #dcfce7; color: #15803d; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.05em; }
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
        <div class="card-title">Votre licence activée</div>
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
            <td class="info-value" style="color: #059669; font-weight: bold;">' . htmlspecialchars($identifiant_prof) . '</td>
          </tr>
          <tr>
            <td class="info-label">Statut de la licence</td>
            <td class="info-value"><span class="status-badge">Validée et Activée</span></td>
          </tr>
        </table>
        
        <p style="font-size: 13px; margin: 16px 0 8px; font-weight: 600; color: #334155;">Votre Clé d\'Activation Unique :</p>
        <div class="id-box">' . htmlspecialchars($id_unique) . '</div>
      </div>
 
      <div class="warning-box">
        <p><strong>⚠️ Rappel de liaison de l\'extension :</strong> Pour que la liaison automatique fonctionne, l\'identifiant enseignant renseigné ci-dessus (<code>' . htmlspecialchars($identifiant_prof) . '</code>) doit correspondre <strong>parfaitement</strong> au nom du compte connecté s\'affichant dans votre espace ' . $ent_label . ' (majuscules, minuscules, accents et espaces compris).</p>
      </div>
 
      <p class="intro" style="margin-bottom: 0;"><strong>Comment l\'utiliser ?</strong><br>
      Votre extension Chrome ainsi que l\'application s\'activeront instantanément en saisissant la clé d\'activation ci-dessus.</p>
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

        $mail->SMTPOptions = [
            'ssl' => [
                'verify_peer' => false,
                'verify_peer_name' => false,
                'allow_self_signed' => true
            ]
        ];

        $mail->setFrom($smtp_from, 'apprecIAtion');
        $mail->addAddress($email, $prenom . ' ' . $nom);
        $mail->addReplyTo($smtp_from, 'apprecIAtion');

        $mail->isHTML(true);
        $mail->Subject = $sujet;
        $mail->Body    = $html;
        $mail->AltBody = $text;

        $mail->send();
        return true;
    } catch (Exception $e) {
        error_log("Erreur PHPMailer lors de l'envoi de validation : " . $mail->ErrorInfo);
        return false;
    }
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
    // Étape A : Rechercher si ce professeur existe déjà dans PocketBase (par id_unique ou email)
    $filter = 'id_unique="' . addslashes($id_unique) . '"';
    if (!empty($email)) {
        $filter .= ' || email="' . addslashes(strtolower($email)) . '"';
    }
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
        'nom' => $nom ?: '',
        'prenom' => $prenom ?: '',
        'email' => $cleanEmail,
        'systeme_exploitation' => !empty($systeme_exploitation) ? $systeme_exploitation : '',
        'ent' => !empty($ent) ? $ent : '',
        'identifiant_prof' => $identifiant_prof ?: '',
        'etablissement' => $etablissement ?: '',
        'id_unique' => $id_unique,
        'compte_valide' => $compte_valide ?: 'nok',
        'version' => $version ?: 'V1.2',
        'expiration' => $formattedExpDate,
        'nb_licence' => $nombre_licences ?: 1,
        'pack' => $packva
    ];

    if ($existing) {
        // Étape B : Mettre à jour l'enregistrement existant
        if (!empty($rawMdp) && strlen($rawMdp) >= 6) {
            $profData['password'] = $rawMdp;
            $profData['passwordConfirm'] = $rawMdp;
        }
        $up = pb_request('PATCH', '/api/collections/profs/records/' . $existing['id'], $profData);
        $email_envoye = envoyerEmailValidation($prenom, $nom, $email, $systeme_exploitation, $ent, $identifiant_prof, $etablissement, $id_unique, $version, $formattedExpDate);

        echo json_encode([
            "success" => true,
            "id" => $existing['id'],
            "id_unique" => $id_unique,
            "email_sent" => $email_envoye,
            "message" => "Licence professeur existante mise à jour et enregistrée avec succès dans PocketBase."
        ]);
    } else {
        // Étape C : Insérer un nouvel enregistrement validé
        $profData['password'] = $pbPassword;
        $profData['passwordConfirm'] = $pbPassword;
        $profData['emailVisibility'] = true;
        $profData['verified'] = true;

        $created = pb_request('POST', '/api/collections/profs/records', $profData);
        $recordId = isset($created['body']['id']) ? $created['body']['id'] : $id_unique;

        $email_envoye = envoyerEmailValidation($prenom, $nom, $email, $systeme_exploitation, $ent, $identifiant_prof, $etablissement, $id_unique, $version, $formattedExpDate);

        echo json_encode([
            "success" => true,
            "id" => $recordId,
            "id_unique" => $id_unique,
            "email_sent" => $email_envoye,
            "message" => "Nouveau professeur enregistré et licence créée avec succès dans PocketBase."
        ]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "error" => "Erreur PocketBase PHP : " . $e->getMessage()
    ]);
}
