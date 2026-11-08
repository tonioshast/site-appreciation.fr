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
    echo json_encode(["error" => "Méthode non autorisée."]);
    exit;
}

$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data || empty($data['email'])) {
    http_response_code(400);
    echo json_encode(["error" => "L'adresse e-mail est obligatoire."]);
    exit;
}

$email = trim($data['email']);
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(["error" => "L'adresse e-mail fournie est invalide."]);
    exit;
}

$emailKey = strtolower(trim($email));

// Vérifier si un compte existe déjà dans la base de données
try {
    $filterProf = 'email="' . addslashes($emailKey) . '"';
    $searchProf = pb_request('GET', '/api/collections/profs/records?filter=' . rawurlencode($filterProf));
    if (isset($searchProf['body']['items']) && is_array($searchProf['body']['items']) && count($searchProf['body']['items']) > 0) {
        http_response_code(400);
        echo json_encode([
            "error" => "Un compte existe déjà avec cette adresse mail. Sachez que l'identifiant unique reçu par mail fait aussi office de mot de passe si le mot de passe précédemment renseigné a été oublié."
        ]);
        exit;
    }
} catch (Exception $eProf) {}

// Générer un code à 6 chiffres
$code = sprintf("%06d", mt_rand(100000, 999999));

try {
    $emailKey = strtolower(trim($email));

    // Stockage local de secours dans un fichier JSON
    $jsonFiles = [
        __DIR__ . '/verification_codes.json',
        __DIR__ . '/includes/verification_codes.json',
        __DIR__ . '/../includes/verification_codes.json'
    ];
    $jsonFile = __DIR__ . '/verification_codes.json';
    foreach ($jsonFiles as $f) {
        if (file_exists($f)) {
            $jsonFile = $f;
            break;
        }
    }
    if (!file_exists($jsonFile)) {
        if (is_dir(__DIR__ . '/../includes') && is_writable(__DIR__ . '/../includes')) {
            $jsonFile = __DIR__ . '/../includes/verification_codes.json';
        } elseif (is_dir(__DIR__ . '/includes') && is_writable(__DIR__ . '/includes')) {
            $jsonFile = __DIR__ . '/includes/verification_codes.json';
        }
    }
    $codesData = [];
    if (file_exists($jsonFile)) {
        $raw = @file_get_contents($jsonFile);
        if ($raw) {
            $codesData = json_decode($raw, true) ?: [];
        }
    }
    // Nettoyer les codes expirés (> 15 minutes)
    $now = time();
    foreach ($codesData as $eKey => $info) {
        if (!isset($info['expiresAt']) || $info['expiresAt'] < $now) {
            unset($codesData[$eKey]);
        }
    }
    $codesData[$emailKey] = [
        'code' => (string)$code,
        'expiresAt' => $now + 900 // Validité 15 minutes
    ];
    @file_put_contents($jsonFile, json_encode($codesData), LOCK_EX);

    // Tenter également l'enregistrement dans PocketBase
    try {
        $filter = 'email="' . addslashes($emailKey) . '"';
        $search = pb_request('GET', '/api/collections/verification_codes/records?filter=' . rawurlencode($filter));
        if (isset($search['body']['items']) && is_array($search['body']['items'])) {
            foreach ($search['body']['items'] as $oldCode) {
                pb_request('DELETE', '/api/collections/verification_codes/records/' . $oldCode['id']);
            }
        }

        pb_request('POST', '/api/collections/verification_codes/records', [
            'email' => $emailKey,
            'code' => (string)$code
        ]);
    } catch (Exception $pbErr) {
        // Enregistrement PocketBase optionnel, géré en secours par le fichier local JSON
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => "Erreur PocketBase : " . $e->getMessage()]);
    exit;
}

// Envoyer l'e-mail avec le code de vérification
$sujet = "Votre code de vérification apprecIAtion";

$domain = 'appreciation.fr';
if (!empty($_SERVER['HTTP_HOST'])) {
    $host = strtolower($_SERVER['HTTP_HOST']);
    if (!preg_match('/localhost|127\.0\.0\.1|run\.app/i', $host)) {
        $domain = preg_replace('/^www\./i', '', $host);
    }
}

$smtp_host = isset($env['SMTP_HOST']) ? $env['SMTP_HOST'] : 'mail.' . $domain;
$smtp_port = isset($env['SMTP_PORT']) ? intval($env['SMTP_PORT']) : 465;
$smtp_secure = isset($env['SMTP_SECURE']) ? $env['SMTP_SECURE'] : 'ssl';
$smtp_user = isset($env['SMTP_USER']) ? $env['SMTP_USER'] : 'contact@' . $domain;
$smtp_password = isset($env['SMTP_PASSWORD']) ? $env['SMTP_PASSWORD'] : 'Furets1979#!?';
$smtp_from = !empty($env['SMTP_FROM']) ? $env['SMTP_FROM'] : (!empty($env['SMTP_USER']) && filter_var($env['SMTP_USER'], FILTER_VALIDATE_EMAIL) ? $env['SMTP_USER'] : 'contact@' . $domain);

$html = '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Validation de votre adresse e-mail</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #334155; margin: 0; padding: 0; }
    .wrapper { max-width: 560px; margin: 30px auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04); }
    .header { background: #1e3a8a; padding: 28px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.02em; }
    .header p { margin: 6px 0 0; font-size: 13px; color: #93c5fd; }
    .content { padding: 30px 28px; line-height: 1.6; color: #334155; }
    .code-box { background-color: #eff6ff; border: 2px dashed #3b82f6; color: #1e40af; padding: 14px; border-radius: 10px; font-family: monospace; font-size: 32px; font-weight: 800; text-align: center; margin: 20px auto; width: 220px; letter-spacing: 0.18em; }
    .notice-box { background-color: #f1f5f9; border-left: 4px solid #64748b; padding: 12px 16px; margin: 22px 0; border-radius: 0 8px 8px 0; font-size: 13px; color: #475569; }
    .footer { background-color: #f8fafc; padding: 20px 28px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #64748b; line-height: 1.5; }
    .footer a { color: #2563eb; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>apprecIAtion</h1>
      <p>L\'assistant pédagogique dédié à la rédaction des commentaires scolaires</p>
    </div>
    <div class="content">
      <p style="font-size: 15px; font-weight: 600; color: #0f172a; margin-top: 0;">Bonjour,</p>
      <p style="font-size: 14px; margin-bottom: 16px;">Vous avez initié une demande d\'inscription ou de vérification d\'adresse e-mail pour accéder à votre espace enseignant sur la plateforme <strong>apprecIAtion</strong>.</p>
      
      <p style="font-size: 14px; margin-bottom: 8px;">Voici votre code de confirmation temporaire à renseigner dans l\'application :</p>
      <div class="code-box">' . $code . '</div>
      
      <div class="notice-box">
        <strong>Information de sécurité :</strong> Ce code de vérification à 6 chiffres est strictement personnel. Il est valable pendant une durée de <strong>15 minutes</strong> et expire automatiquement après sa première utilisation.
      </div>

      <p style="font-size: 13px; color: #64748b; margin-top: 20px;">Si vous n\'êtes pas à l\'origine de cette demande, vous pouvez ignorer cet e-mail en toute tranquillité. Aucune modification ne sera apportée sans la saisie de ce code de validation.</p>
    </div>
    <div class="footer">
      <p style="margin: 0 0 6px;"><strong>apprecIAtion</strong> &mdash; Outil sécurisé d\'aide aux enseignants</p>
      <p style="margin: 0 0 6px;">Plateforme conforme aux exigences de protection des données scolaires (RGPD).</p>
      <p style="margin: 0;">Une question ou besoin d\'aide ? Contactez notre équipe à <a href="mailto:contact@appreciation.fr">contact@appreciation.fr</a></p>
    </div>
  </div>
</body>
</html>';

$text = "Bonjour,\n\n"
      . "Vous avez initié une demande de vérification sur la plateforme apprecIAtion (assistant d'aide à la rédaction des appréciations scolaires).\n\n"
      . "Voici votre code de vérification temporaire : " . $code . "\n\n"
      . "Ce code est valable pendant 15 minutes et ne peut être utilisé qu'une seule fois.\n\n"
      . "Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet e-mail.\n\n"
      . "--\n"
      . "L'équipe apprecIAtion\n"
      . "Support enseignant : contact@appreciation.fr\n"
      . "https://www.appreciation.fr";

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
    $mail->addAddress($email);
    $mail->addReplyTo($smtp_from, 'apprecIAtion');

    $mail->isHTML(true);
    $mail->Subject = $sujet;
    $mail->Body    = $html;
    $mail->AltBody = $text;

    $mail->send();
    echo json_encode(["success" => true, "message" => "Code de vérification envoyé avec succès."]);
} catch (Exception $e) {
    error_log("Erreur PHPMailer lors de l'envoi du code : " . $mail->ErrorInfo);
    // En mode de secours / développement, on simule l'envoi
    echo json_encode([
        "success" => true,
        "simulated" => true,
        "message" => "Code envoyé (simulation, vérifier les logs du serveur de messagerie : " . $mail->ErrorInfo . ")",
        "code_debug" => $code // Fournit le code en cas d'erreur de messagerie locale
    ]);
}
