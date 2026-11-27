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

    $displayExpDate = format_date_fr($expiration);
    $siteUrl = 'https://appreciation.fr';
    $prenomNom = trim(($prenom ?: '') . ' ' . ($nom ?: ''));
    $bonjour = $prenomNom !== '' ? ('Bonjour ' . $prenomNom . ',') : 'Bonjour,';

    $text = $bonjour . "\n\n";
    $text .= "Votre paiement a bien été reçu. Votre licence apprecIAtion est activée.\n\n";
    $text .= "Date d'expiration : " . $displayExpDate . "\n";
    $text .= "Clé d'activation : " . $id_unique . "\n\n";
    $text .= "Pour installer l'extension, connectez-vous à Mon compte sur " . $siteUrl . ", onglet Installation.\n";
    $text .= "La clé ci-dessus sert aussi de mot de passe si vous n'en avez pas défini un autre.\n\n";
    $text .= "apprecIAtion\n";
    $text .= "Cet e-mail est automatique. Merci de ne pas y répondre.\n";
    $text .= "Contact : contact@appreciation.fr";

    $html = '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>' . htmlspecialchars($sujet) . '</title>
</head>
<body style="margin:0;padding:0;background-color:#e2e8f0;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#e2e8f0;padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #cbd5e1;">
          <tr>
            <td style="background-color:#0b0f19;padding:28px 32px;text-align:center;">
              <div style="font-size:28px;font-weight:800;letter-spacing:-0.03em;line-height:1.2;">
                <span style="color:#ffffff;">apprec</span><span style="color:#fbbf24;">IA</span><span style="color:#ffffff;">tion</span>
              </div>
              <p style="margin:8px 0 0;font-size:12px;color:#94a3b8;letter-spacing:0.08em;text-transform:uppercase;">Licence activée</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;color:#334155;font-size:15px;line-height:1.6;">
              <p style="margin:0 0 16px;font-size:18px;font-weight:700;color:#0f172a;">' . htmlspecialchars($bonjour) . '</p>
              <p style="margin:0 0 24px;">Votre paiement a bien été reçu. Votre licence <strong>apprecIAtion</strong> est activée.</p>
              <p style="margin:0 0 8px;font-size:13px;color:#64748b;">Date d\'expiration</p>
              <p style="margin:0 0 20px;font-size:16px;font-weight:700;color:#0f172a;">' . htmlspecialchars($displayExpDate) . '</p>
              <p style="margin:0 0 8px;font-size:13px;color:#64748b;">Clé d\'activation</p>
              <p style="margin:0 0 24px;padding:14px;text-align:center;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:16px;font-weight:700;letter-spacing:0.04em;color:#065f46;background:#ecfdf5;border:1px dashed #6ee7b7;border-radius:10px;">' . htmlspecialchars($id_unique) . '</p>
              <p style="margin:0 0 8px;"><strong>Installer l\'extension</strong></p>
              <p style="margin:0;">Connectez-vous à <a href="' . htmlspecialchars($siteUrl) . '" style="color:#2563eb;font-weight:600;">Mon compte</a> sur appreciation.fr, onglet <strong>Installation</strong>.</p>
              <p style="margin:12px 0 0;font-size:13px;color:#64748b;">La clé ci-dessus sert aussi de mot de passe si vous n\'en avez pas défini un autre.</p>
            </td>
          </tr>
          <tr>
            <td style="background:#f8fafc;padding:20px 32px;text-align:center;font-size:12px;color:#64748b;border-top:1px solid #e2e8f0;">
              <p style="margin:0 0 4px;"><strong style="color:#0f172a;">apprecIAtion</strong></p>
              <p style="margin:0;">E-mail automatique — merci de ne pas y répondre. Contact : contact@appreciation.fr</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
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
