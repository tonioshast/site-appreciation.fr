<?php
/**
 * Script de vérification de clé API Mistral.
 * Fonctionne directement sur hébergement o2switch.
 */

error_reporting(E_ALL);
ini_set('display_errors', 0); // Disable display errors to avoid outputting HTML in JSON response

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if (file_exists(__DIR__ . '/crypto.php')) {
    require_once __DIR__ . '/crypto.php';
} elseif (file_exists(__DIR__ . '/includes/crypto.php')) {
    require_once __DIR__ . '/includes/crypto.php';
} elseif (file_exists(__DIR__ . '/../includes/crypto.php')) {
    require_once __DIR__ . '/../includes/crypto.php';
}

// Lecture des données d'entrée
$raw_data = file_get_contents("php://input");
$data = json_decode($raw_data, true);

$rawApiKey = isset($data['apiKey']) ? trim($data['apiKey']) : '';
$apiKey = decrypt_api_key($rawApiKey);

if (empty($apiKey)) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "La clé API est requise."]);
    exit();
}

// Appel à l'API Mistral (v1/models) pour vérifier la clé
$ch = curl_init("https://api.mistral.ai/v1/models");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer " . $apiKey,
    "Content-Type: application/json"
]);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);

$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curl_error = curl_error($ch);
curl_close($ch);

if ($curl_error) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => "Erreur de connexion au serveur de test : " . $curl_error
    ]);
    exit();
}

if ($http_code === 200) {
    echo json_encode([
        "success" => true,
        "message" => "Connexion réussie avec Mistral AI !"
    ]);
} else {
    // Essayer de décoder le message d'erreur de Mistral si possible
    $mistral_error = "Clé API invalide ou inactive (code HTTP " . $http_code . ")";
    if ($response) {
        $res_json = json_decode($response, true);
        if (isset($res_json['message'])) {
            $mistral_error = $res_json['message'];
        } elseif (isset($res_json['error']['message'])) {
            $mistral_error = $res_json['error']['message'];
        }
    }
    
    http_response_code(401);
    echo json_encode([
        "success" => false,
        "error" => $mistral_error
    ]);
}
