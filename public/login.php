<?php
/**
 * Script de connexion pour l'espace Mon Compte.
 * Connexion sécurisée via la base de données PocketBase.
 */

// 1. Masquer les erreurs brutes sur le client et activer le logging serveur
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);

// 2. En-têtes de sécurité et CORS dynamiques/sécurisés
header("Content-Type: application/json; charset=UTF-8");
header("X-Content-Type-Options: nosniff");
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '*';
header("Access-Control-Allow-Origin: " . $origin);
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// Gestion du Preflight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 3. Restriction absolue à la méthode POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => "Méthode non autorisée. Seules les requêtes POST sont acceptées."]);
    exit();
}

// 4. Chargement flexible des dépendances (supporte la racine ou un dossier 'includes' dédié)
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

// 5. Lecture et nettoyage des entrées JSON
$raw_data = file_get_contents("php://input");
$data = json_decode($raw_data, true);

$email = filter_var(trim($data['email'] ?? ''), FILTER_VALIDATE_EMAIL);
$mdp = trim($data['mdp'] ?? '');

if (!$email || empty($mdp)) {
    http_response_code(400);
    echo json_encode(["error" => "Adresse e-mail valide et mot de passe obligatoires."]);
    exit();
}

try {
    $matched = null;

    // Tentative 1 : Connexion native PocketBase (auth-with-password)
    $authRes = pb_request('POST', '/api/collections/profs/auth-with-password', [
        'identity' => $email,
        'password' => $mdp
    ]);

    if (isset($authRes['body']['record']['id'])) {
        $matched = $authRes['body']['record'];
    } else {
        // Fallback : recherche par email propre et vérification du champ id_unique
        $cleanEmail = str_replace('"', '\"', $email);
        $filter = 'email="' . $cleanEmail . '"';
        
        $res = pb_request('GET', '/api/collections/profs/records?filter=' . rawurlencode($filter));

        if (isset($res['body']['items']) && is_array($res['body']['items'])) {
            foreach ($res['body']['items'] as $item) {
                $itemUnique = isset($item['id_unique']) ? trim((string)$item['id_unique']) : '';
                
                // Comparaison sécurisée en temps constant
                if ($itemUnique !== '' && hash_equals($itemUnique, $mdp)) {
                    $matched = $item;
                    break;
                }
            }
        }
    }

    if (!$matched) {
        http_response_code(401);
        echo json_encode(["error" => "Adresse e-mail, mot de passe ou clé de connexion unique incorrect."]);
        exit();
    }

    // Normalisation des champs de réponse
    $compteValide = (isset($matched['compte_valide']) && in_array($matched['compte_valide'], ['1', 1, 'ok'], true)) ? 'ok' : ($matched['compte_valide'] ?? 'nok');
    $token = $authRes['body']['token'] ?? 'pb_token_authenticated';
    $packVal = intval($matched['pack'] ?? $matched['packva'] ?? 1);
    $licenceCount = intval($matched['nb_licence'] ?? $matched['nombre_licences'] ?? 1);
    $expDate = $matched['expiration'] ?? $matched['date'] ?? '';

    // Réponse JSON
    echo json_encode([
        "success" => true,
        "token" => $token,
        "user" => [
            "id" => $matched['id'],
            "nom" => $matched['nom'] ?? '',
            "prenom" => $matched['prenom'] ?? '',
            "email" => $matched['email'] ?? '',
            "systeme_exploitation" => $matched['systeme_exploitation'] ?? '',
            "ent" => $matched['ent'] ?? '',
            "identifiant_prof" => $matched['identifiant_prof'] ?? '',
            "etablissement" => $matched['etablissement'] ?? '',
            "id_unique" => $matched['id_unique'] ?? '',
            "compte_valide" => $compteValide,
            "version" => $matched['version'] ?? 'V1.2',
            "expiration" => $expDate,
            "date" => $expDate,
            "nb_licence" => $licenceCount,
            "nombre_licences" => $licenceCount,
            "pack" => $packVal,
            "packva" => $packVal,
            "token" => $token
        ]
    ]);

} catch (Exception $e) {
    // Journalisation de l'erreur côté serveur
    error_log("Erreur d'authentification sur login.php : " . $e->getMessage());

    // Réponse générique côté client
    http_response_code(500);
    echo json_encode([
        "error" => "Une erreur interne est survenue lors de la connexion."
    ]);
}
