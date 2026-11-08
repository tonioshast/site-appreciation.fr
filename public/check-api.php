<?php
/**
 * Script d'autodiagnostic pas-à-pas pour l'application apprecIAtion sur o2switch.
 * Permet de vérifier les réglages PHP, la connexion base de données et l'API Gemini.
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

// Configuration des en-têtes pour affichage propre
header("Content-Type: text/html; charset=UTF-8");

if (file_exists(__DIR__ . '/pocketbase.php')) {
    require_once __DIR__ . '/pocketbase.php';
} elseif (file_exists(__DIR__ . '/includes/pocketbase.php')) {
    require_once __DIR__ . '/includes/pocketbase.php';
} elseif (file_exists(__DIR__ . '/../includes/pocketbase.php')) {
    require_once __DIR__ . '/../includes/pocketbase.php';
}

// 1. Lecture du fichier .env
$env = pb_get_env();
$envLoadedFrom = "Clés chargées (recherche multi-dossiers)";
$docRoot = isset($_SERVER['DOCUMENT_ROOT']) ? $_SERVER['DOCUMENT_ROOT'] : '';
$scriptDir = isset($_SERVER['SCRIPT_FILENAME']) ? dirname($_SERVER['SCRIPT_FILENAME']) : '';
$parentDocRoot = !empty($docRoot) ? dirname($docRoot) : '';
$parentScriptDir = !empty($scriptDir) ? dirname($scriptDir) : '';
$cwd = getcwd();
$parentCwd = !empty($cwd) ? dirname($cwd) : '';

$envFiles = array_unique(array_filter([
    __DIR__ . '/.env',
    __DIR__ . '/../.env',
    __DIR__ . '/includes/.env',
    __DIR__ . '/../includes/.env',
    __DIR__ . '/../../includes/.env',
    $docRoot . '/.env',
    $docRoot . '/../.env',
    $docRoot . '/includes/.env',
    $docRoot . '/../includes/.env',
    $parentDocRoot . '/includes/.env',
    $parentDocRoot . '/.env',
    $scriptDir . '/.env',
    $scriptDir . '/../.env',
    $scriptDir . '/includes/.env',
    $scriptDir . '/../includes/.env',
    $parentScriptDir . '/includes/.env',
    $parentScriptDir . '/.env',
    $cwd . '/.env',
    $cwd . '/../.env',
    $cwd . '/includes/.env',
    $cwd . '/../includes/.env',
    $parentCwd . '/includes/.env',
    $parentCwd . '/.env',
]));

foreach ($envFiles as $file) {
    if (file_exists($file) && is_readable($file)) {
        $envLoadedFrom = realpath($file);
        break;
    }
}

// Variables de configuration
$pb_url = isset($env['POCKETBASE_URL']) ? $env['POCKETBASE_URL'] : 'https://pb.appreciation.fr';
$gemini_key = isset($env['GEMINI_API_KEY']) ? $env['GEMINI_API_KEY'] : '';

// Diagnostics
$checks = [];

// Check A: Version PHP
$phpVersion = PHP_VERSION;
$checks['php_version'] = [
    'title' => "Version de PHP",
    'status' => version_compare($phpVersion, '7.4.0', '>=') ? 'success' : 'warning',
    'message' => "Votre serveur tourne sous PHP " . $phpVersion . ". (Recommandé >= 7.4)"
];

// Check B: Extensions requises
$hasCurl = function_exists('curl_init');
$hasJson = function_exists('json_decode');

if ($hasCurl && $hasJson) {
    $checks['extensions_db'] = [
        'title' => "Client HTTP cURL & JSON (PocketBase)",
        'status' => 'success',
        'message' => "cURL et JSON sont installés et actifs pour la communication avec PocketBase."
    ];
} else {
    $checks['extensions_db'] = [
        'title' => "Client HTTP cURL & JSON (PocketBase)",
        'status' => 'danger',
        'message' => "Erreur : cURL ou JSON est manquant dans votre configuration PHP."
    ];
}

if ($hasCurl) {
    $checks['extensions_curl'] = [
        'title' => "Extension cURL (pour l'IA Gemini)",
        'status' => 'success',
        'message' => "L'extension cURL est active. Requis pour communiquer avec Google Gemini API."
    ];
} else {
    $checks['extensions_curl'] = [
        'title' => "Extension cURL (pour l'IA Gemini)",
        'status' => 'danger',
        'message' => "Erreur : L'extension cURL est manquante. Requis pour appeler l'API Gemini."
    ];
}

// Check C: Fichier .env
if ($envLoadedFrom !== "Aucun fichier trouvé") {
    $checks['env_file'] = [
        'title' => "Fichier de configuration .env",
        'status' => 'success',
        'message' => "Fichier .env chargé avec succès depuis : <code>" . htmlspecialchars($envLoadedFrom) . "</code>"
    ];
} else {
    $checks['env_file'] = [
        'title' => "Fichier de configuration .env",
        'status' => 'danger',
        'message' => "Fichier <code>.env</code> introuvable dans le dossier ! Veuillez téléverser votre fichier .env contenant vos identifiants."
    ];
}

// Check D: Connexion PocketBase
if (file_exists(__DIR__ . '/pocketbase.php')) {
    require_once __DIR__ . '/pocketbase.php';
} elseif (file_exists(__DIR__ . '/includes/pocketbase.php')) {
    require_once __DIR__ . '/includes/pocketbase.php';
} elseif (file_exists(__DIR__ . '/../includes/pocketbase.php')) {
    require_once __DIR__ . '/../includes/pocketbase.php';
}
try {
    $pbHealth = pb_request('GET', '/api/health');
    if ($pbHealth['status'] >= 200 && $pbHealth['status'] < 300) {
        $checks['db_conn'] = [
            'title' => "Connexion PocketBase",
            'status' => 'success',
            'message' => "Connexion PocketBase établie avec succès (Serveur de base de données actif et opérationnel) !"
        ];
    } else {
        $checks['db_conn'] = [
            'title' => "Connexion PocketBase",
            'status' => 'warning',
            'message' => "PocketBase a répondu avec le statut HTTP " . $pbHealth['status']
        ];
    }
} catch (Exception $e) {
    $checks['db_conn'] = [
        'title' => "Connexion PocketBase",
        'status' => 'danger',
        'message' => "<strong>Échec de la connexion PocketBase :</strong> " . htmlspecialchars($e->getMessage())
    ];
}

// Check E: Clé API Gemini
if (!empty($gemini_key)) {
    $maskedKey = substr($gemini_key, 0, 8) . '...' . substr($gemini_key, -4);
    $checks['gemini_api'] = [
        'title' => "Clé API Gemini",
        'status' => 'success',
        'message' => "Clé API détectée dans le fichier .env (Masquée : <code>" . htmlspecialchars($maskedKey) . "</code>)."
    ];
} else {
    $checks['gemini_api'] = [
        'title' => "Clé API Gemini",
        'status' => 'warning',
        'message' => "Aucune clé <code>GEMINI_API_KEY</code> trouvée dans le fichier .env. Le générateur d'appréciations par IA ne fonctionnera pas sans cette clé."
    ];
}

// Check F: Vérification de l'URL rewriting / .htaccess (via une redirection d'en-tête ou de chemin)
$checks['htaccess'] = [
    'title' => "Redirection d'API (Fichier .htaccess)",
    'status' => file_exists(__DIR__ . '/.htaccess') ? 'success' : 'danger',
    'message' => file_exists(__DIR__ . '/.htaccess') 
        ? "Le fichier <code>.htaccess</code> est bien présent dans votre dossier." 
        : "<strong>Erreur :</strong> Le fichier <code>.htaccess</code> est MANQUANT dans votre dossier de build. Sans ce fichier, vos requêtes vers <code>/api/*</code> renverront une erreur 404. Assurez-vous de copier le fichier <code>.htaccess</code> depuis l'archive de build."
];

// Check G: Test du chiffrement AES-256-GCM (RGPD)
if (file_exists(__DIR__ . '/crypto.php')) {
    require_once __DIR__ . '/crypto.php';
} elseif (file_exists(__DIR__ . '/includes/crypto.php')) {
    require_once __DIR__ . '/includes/crypto.php';
} elseif (file_exists(__DIR__ . '/../includes/crypto.php')) {
    require_once __DIR__ . '/../includes/crypto.php';
}
try {
    $testKey = "test_mistral_key_123456";
    $encryptedTest = encrypt_api_key($testKey);
    $decryptedTest = decrypt_api_key($encryptedTest);
    if ($decryptedTest === $testKey && strpos($encryptedTest, 'enc_gcm:') === 0) {
        $checks['crypto'] = [
            'title' => "Module de Chiffrement AES-256-GCM (OpenSSL)",
            'status' => 'success',
            'message' => "Chiffrement et déchiffrement AES-256-GCM opérationnels sur votre hébergement o2switch !"
        ];
    } else {
        $checks['crypto'] = [
            'title' => "Module de Chiffrement AES-256-GCM (OpenSSL)",
            'status' => 'danger',
            'message' => "Échec du test de déchiffrement. Vérifiez l'extension PHP OpenSSL."
        ];
    }
} catch (Exception $e) {
    $checks['crypto'] = [
        'title' => "Module de Chiffrement AES-256-GCM (OpenSSL)",
        'status' => 'danger',
        'message' => "Erreur de chiffrement : " . htmlspecialchars($e->getMessage())
    ];
}
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Centre de Diagnostic Pas-à-Pas - apprecIAtion</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background-color: #0b0f19;
            color: #f1f5f9;
            margin: 0;
            padding: 40px 20px;
            line-height: 1.6;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 1px solid #1e293b;
            padding-bottom: 20px;
        }
        .logo-text {
            font-size: 28px;
            font-weight: 700;
            letter-spacing: -0.05em;
            background: linear-gradient(to right, #60a5fa, #a5b4fc, #34d399);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin: 0 0 10px 0;
        }
        h1 {
            font-size: 22px;
            font-weight: 600;
            margin: 0;
            color: #ffffff;
        }
        .subtitle {
            color: #94a3b8;
            font-size: 14px;
            margin-top: 5px;
        }
        .card {
            background-color: #0f172a;
            border: 1px solid #1e293b;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 24px;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
        }
        .card h2 {
            font-size: 16px;
            font-weight: 600;
            color: #ffffff;
            margin-top: 0;
            margin-bottom: 20px;
            border-bottom: 1px solid #1e293b;
            padding-bottom: 10px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .step {
            display: flex;
            align-items: flex-start;
            gap: 16px;
            padding: 16px;
            border-radius: 8px;
            background-color: #1e293b30;
            border: 1px solid #1e293b80;
            margin-bottom: 16px;
        }
        .step-icon {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 12px;
            shrink: 0;
        }
        .status-success {
            border-color: #10b98150;
            background-color: #064e3b20;
        }
        .status-success .step-icon {
            background-color: #10b981;
            color: #064e3b;
        }
        .status-warning {
            border-color: #f59e0b50;
            background-color: #78350f20;
        }
        .status-warning .step-icon {
            background-color: #f59e0b;
            color: #78350f;
        }
        .status-danger {
            border-color: #ef444450;
            background-color: #7f1d1d20;
        }
        .status-danger .step-icon {
            background-color: #ef4444;
            color: #ffffff;
        }
        .step-content {
            flex-grow: 1;
        }
        .step-title {
            font-weight: 600;
            font-size: 14px;
            color: #ffffff;
            margin-bottom: 4px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .step-desc {
            font-size: 13px;
            color: #94a3b8;
        }
        .badge {
            font-size: 10px;
            padding: 2px 8px;
            border-radius: 4px;
            text-transform: uppercase;
            font-weight: 700;
        }
        .badge-success { background-color: #10b98120; color: #34d399; border: 1px solid #10b98130; }
        .badge-warning { background-color: #f59e0b20; color: #fbbf24; border: 1px solid #f59e0b30; }
        .badge-danger { background-color: #ef444420; color: #f87171; border: 1px solid #ef444430; }
        
        code {
            font-family: 'JetBrains Mono', monospace;
            background-color: #020617;
            padding: 2px 6px;
            border-radius: 4px;
            color: #38bdf8;
            font-size: 12px;
        }
        .action-box {
            background-color: #1e1b4b30;
            border: 1px solid #312e8150;
            border-radius: 8px;
            padding: 16px;
            margin-top: 20px;
        }
        .action-box h3 {
            font-size: 14px;
            color: #a5b4fc;
            margin-top: 0;
            margin-bottom: 10px;
        }
        ol {
            margin: 0;
            padding-left: 20px;
            font-size: 13px;
            color: #cbd5e1;
        }
        li {
            margin-bottom: 8px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo-text">apprecIAtion</div>
            <h1>Diagnostic d'Hébergement o2switch</h1>
            <p class="subtitle">Analyse de la configuration de votre site et liaison de base de données PHP</p>
        </div>

        <div class="card">
            <h2>
                <span>Résultats des tests d'environnement</span>
                <span style="font-size: 12px; color: #94a3b8; font-weight: normal;">Exécuté le <?php echo date('d/m/Y à H:i:s'); ?></span>
            </h2>

            <?php $stepNum = 1; foreach ($checks as $key => $check): ?>
                <div class="step status-<?php echo $check['status']; ?>">
                    <div class="step-icon">
                        <?php 
                            if ($check['status'] === 'success') echo '✓';
                            elseif ($check['status'] === 'warning') echo '⚠';
                            else echo '✗';
                        ?>
                    </div>
                    <div class="step-content">
                        <div class="step-title">
                            <span>Étape <?php echo $stepNum++; ?> : <?php echo $check['title']; ?></span>
                            <span class="badge badge-<?php echo $check['status']; ?>"><?php echo $check['status'] === 'success' ? 'ok' : ($check['status'] === 'warning' ? 'alerte' : 'erreur'); ?></span>
                        </div>
                        <div class="step-desc">
                            <?php echo $check['message']; ?>
                        </div>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>

        <div class="card">
            <h2>Actions correctives recommandées</h2>
            
            <div class="action-box">
                <h3>1. Si le test PocketBase est en ÉCHEC :</h3>
                <ol>
                    <li>Vérifiez l'URL PocketBase configurée : <code><?php echo htmlspecialchars($pb_url); ?></code>.</li>
                    <li>S'assurer que le serveur PocketBase est démarré et qu'il accepte les requêtes réseau.</li>
                    <li>Vérifier que les identifiants d'administrateur PB_ADMIN_EMAIL et PB_ADMIN_PASSWORD dans votre fichier .env sont corrects si vous y restreignez les accès.</li>
                </ol>
            </div>

            <div class="action-box" style="margin-top: 15px;">
                <h3>2. Si le test ".htaccess" est en ÉCHEC :</h3>
                <ol>
                    <li>Vous devez absolument vérifier que le fichier nommé exactement <code>.htaccess</code> est téléversé à la racine de votre dossier o2switch (au même endroit que <code>index.html</code>).</li>
                    <li>Parfois, les fichiers commençant par un point (comme <code>.htaccess</code> ou <code>.env</code>) ne sont pas copiés par votre logiciel FTP si l'option "Afficher les fichiers cachés" n'est pas activée. Activez-la dans FileZilla ou utilisez le Gestionnaire de Fichiers du cPanel o2switch pour téléverser ou créer ce fichier.</li>
                </ol>
            </div>

            <div class="action-box" style="margin-top: 15px;">
                <h3>3. Comment tester manuellement l'enregistrement (Liaison API) :</h3>
                <p style="font-size: 13px; color: #cbd5e1; margin-top: 5px;">
                    Essayez d'accéder directement à cette URL depuis votre navigateur : <br>
                    <code style="display: block; margin: 10px 0; padding: 10px; background: #020617; border-radius: 6px; text-align: center;">https://<?php echo $_SERVER['HTTP_HOST'] . dirname($_SERVER['REQUEST_URI']); ?>/register-prof.php</code>
                    Si vous obtenez un message JSON indiquant : <br>
                    <code>{"error":"Méthode non autorisée. Seule la méthode POST est acceptée."}</code><br>
                    <strong>Alors tout fonctionne parfaitement !</strong> Le script PHP est accessible et prêt à recevoir les données d'inscription de votre application React.
                </p>
            </div>
        </div>
        
        <p style="text-align: center; font-size: 11px; color: #475569;">
            Script de diagnostic fourni par apprecIAtion. Supprimez ce fichier (<code>check-api.php</code>) de votre serveur une fois le débogage terminé pour des raisons de sécurité.
        </p>
    </div>
</body>
</html>
