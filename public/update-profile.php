<?php
/**
 * Script de mise à jour du profil enseignant.
 * Fonctionne directement avec PocketBase.
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

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => "Méthode non autorisée. Seules les requêtes POST sont acceptées."]);
    exit();
}

// Chargement flexible des dépendances
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

$raw_data = file_get_contents("php://input");
$data = json_decode($raw_data, true);

$id_unique = isset($data['id_unique']) ? trim($data['id_unique']) : '';

if (empty($id_unique)) {
    http_response_code(400);
    echo json_encode(["error" => "L'identifiant unique est requis pour la mise à jour."]);
    exit();
}

try {
    // 1. Rechercher l'utilisateur existant
    $cleanIdUnique = str_replace('"', '\"', $id_unique);
    $filter = 'id_unique="' . $cleanIdUnique . '"';
    $res = pb_request('GET', '/api/collections/profs/records?filter=' . rawurlencode($filter));

    $existing = null;
    if (isset($res['body']['items']) && count($res['body']['items']) > 0) {
        $existing = $res['body']['items'][0];
    }

    if (!$existing) {
        http_response_code(404);
        echo json_encode(["error" => "Professeur introuvable dans PocketBase."]);
        exit();
    }

    // 2. Préparer les nouvelles données
    $updateData = [];
    if (isset($data['nom'])) $updateData['nom'] = trim($data['nom']);
    if (isset($data['prenom'])) $updateData['prenom'] = trim($data['prenom']);
    if (isset($data['email'])) $updateData['email'] = trim($data['email']);
    if (isset($data['mdp'])) {
        $rawMdp = trim($data['mdp']);
        if (strlen($rawMdp) >= 6) {
            $updateData['password'] = $rawMdp;
            $updateData['passwordConfirm'] = $rawMdp;
        }
    }
    if (isset($data['ent'])) $updateData['ent'] = trim($data['ent']);
    if (isset($data['systeme_exploitation'])) $updateData['systeme_exploitation'] = trim($data['systeme_exploitation']);
    if (isset($data['identifiant_prof'])) $updateData['identifiant_prof'] = trim($data['identifiant_prof']);
    if (isset($data['etablissement'])) $updateData['etablissement'] = trim($data['etablissement']);
    if (isset($data['pack'])) $updateData['pack'] = intval($data['pack']);
    if (isset($data['packva'])) $updateData['pack'] = intval($data['packva']);
    if (array_key_exists('cle_api_mistral', $data)) {
        $rawKey = trim((string)$data['cle_api_mistral']);
        $updateData['cle_api_mistral'] = !empty($rawKey) ? encrypt_api_key($rawKey) : "";
    }

    // 3. Mettre à jour dans PocketBase
    $upRes = pb_request('PATCH', '/api/collections/profs/records/' . $existing['id'], $updateData);

    $updatedRecord = isset($upRes['body']['id']) ? $upRes['body'] : array_merge($existing, $updateData);
    $compteValide = (isset($updatedRecord['compte_valide']) && ($updatedRecord['compte_valide'] === '1' || $updatedRecord['compte_valide'] === 1 || $updatedRecord['compte_valide'] === 'ok')) ? 'ok' : (isset($updatedRecord['compte_valide']) ? $updatedRecord['compte_valide'] : 'nok');

    // Déchiffrement de la clé API avant de renvoyer au frontend
    $rawDbKey = isset($updatedRecord['cle_api_mistral']) ? $updatedRecord['cle_api_mistral'] : '';
    $updatedRecord['cle_api_mistral'] = decrypt_api_key($rawDbKey);

    $packVal = isset($updatedRecord['pack']) ? intval($updatedRecord['pack']) : (isset($updatedRecord['packva']) ? intval($updatedRecord['packva']) : 1);
    $updatedRecord['pack'] = $packVal;
    $updatedRecord['packva'] = $packVal;

    echo json_encode([
        "success" => true,
        "message" => "Profil mis à jour avec succès dans PocketBase !",
        "user" => array_merge($updatedRecord, ['compte_valide' => $compteValide])
    ]);

} catch (Exception $e) {
    error_log("Erreur dans update-profile.php : " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        "error" => "Une erreur interne est survenue lors de la mise à jour."
    ]);
}
