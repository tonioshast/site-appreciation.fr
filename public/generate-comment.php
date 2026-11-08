<?php
/**
 * Script PHP de liaison pour l'appel à l'API Gemini.
 * Ce script permet de s'affranchir complètement de Node.js sur l'hébergement o2switch.
 * Il est copié dans le dossier de build (dist/) et s'exécute directement via Apache + PHP.
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if (file_exists(__DIR__ . '/pocketbase.php')) {
    require_once __DIR__ . '/pocketbase.php';
} elseif (file_exists(__DIR__ . '/includes/pocketbase.php')) {
    require_once __DIR__ . '/includes/pocketbase.php';
} elseif (file_exists(__DIR__ . '/../includes/pocketbase.php')) {
    require_once __DIR__ . '/../includes/pocketbase.php';
}

// 1. Récupération des variables d'environnement via pb_get_env()
$env = pb_get_env();
$apiKey = get_admin_config_var('GEMINI_API_KEY', '');

if (!$apiKey) {
    http_response_code(500);
    echo json_encode([
        "error" => "La clé API Gemini est manquante. Veuillez ajouter GEMINI_API_KEY dans votre fichier .env"
    ]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => "Seules les requêtes POST sont autorisées."]);
    exit;
}

// 2. Lecture des données d'entrée
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data || !isset($data['prenom'])) {
    http_response_code(400);
    echo json_encode(["error" => "Le prénom de l'élève est requis."]);
    exit;
}

$prenom = trim($data['prenom']);
$moyenne = isset($data['moyenne']) ? trim($data['moyenne']) : null;
$ton = isset($data['ton']) ? trim($data['ton']) : 'Bienveillant';
$style = isset($data['style']) ? trim($data['style']) : 'Synthétique';
$items = isset($data['items']) ? $data['items'] : [];
$type = isset($data['type']) ? trim($data['type']) : 'appreciation';

// Formater les critères
$formattedItems = "";
if (is_array($items)) {
    foreach ($items as $key => $val) {
        $formattedItems .= "- " . $key . ": " . $val . "\n";
    }
}

// 3. Définition des instructions système et du prompt
$systemInstruction = "Tu es un enseignant français très expérimenté, bienveillant, juste, et respectueux des consignes de l'Éducation Nationale et des règles de protection des données (RGPD).
Ton rôle est de rédiger des appréciations scolaires ou des synthèses de professeur principal.
Règles incontournables :
1. Reste toujours constructif, professionnel, pragmatique et précis. Évite les clichés et les phrases toutes faites dénuées de valeur ajoutée pédagogique.
2. Utilise une orthographe et une grammaire impeccables.
3. Respecte le RGPD : n'écris jamais de nom de famille, utilise uniquement le prénom de l'élève.
4. Adapte le ton au paramètre demandé et le style au format demandé.
5. Base-toi impérativement sur la moyenne sur 20 fournie (" . ($moyenne ? $moyenne . "/20" : "moyenne non fournie") . ") et sur les observations saisies (items).
6. Ne fais aucune mention de l'IA ni des consignes techniques de génération dans les textes produits.";

if ($type === "synthese") {
    $prompt = "Rédige 3 propositions de synthèses globales du trimestre (v1, v2, v3) différentes en tant que Professeur Principal de la classe.
Données de l'élève :
- Prénom : $prenom
- Moyenne générale : " . ($moyenne ? $moyenne : "Non précisée") . "
- Ton souhaité : $ton
- Style souhaité : $style
- Critères transversaux observés :
" . ($formattedItems ?: "Aucun critère spécifique") . "

Rôles attendus pour chaque version :
- Version 1 (v1) : Bilan trimestriel complet et équilibré, valorisant la posture de l'élève et donnant des axes d'amélioration.
- Version 2 (v2) : Version d'encouragement dynamique mettant l'accent sur l'implication dans la classe, la maturité et la participation.
- Version 3 (v3) : Version très compacte et concise allant directement à l'essentiel pour respecter les grilles serrées de bulletins scolaires.";
} else {
    $prompt = "Rédige 3 propositions d'appréciations scolaires (v1, v2, v3) différentes pour le bulletin de l'élève.
Données de l'élève :
- Prénom : $prenom
- Moyenne : " . ($moyenne ? $moyenne : "Non précisée") . "
- Ton souhaité : $ton
- Style souhaité : $style
- Critères observés :
" . ($formattedItems ?: "Aucun critère spécifique mentionné") . "

Rôles attendus pour chaque version :
- Version 1 (v1) : Équilibrée, bienveillante, soulignant le travail accompli et apportant un conseil de progrès pertinent.
- Version 2 (v2) : Plus axée sur l'exigence et le potentiel de l'élève, encourageant à approfondir ou surmonter une difficulté spécifique avec méthode.
- Version 3 (v3) : Particulièrement synthétique, concise et percutante (idéale pour les bulletins limités en nombre de caractères).";
}

// 4. Construction du corps de la requête pour Gemini API
$requestBody = [
    "contents" => [
        [
            "parts" => [
                ["text" => $prompt]
            ]
        ]
    ],
    "systemInstruction" => [
        "parts" => [
            ["text" => $systemInstruction]
        ]
    ],
    "generationConfig" => [
        "temperature" => 0.75,
        "responseMimeType" => "application/json",
        "responseSchema" => [
            "type" => "OBJECT",
            "properties" => [
                "v1" => ["type" => "STRING", "description" => "Première proposition d'appréciation."],
                "v2" => ["type" => "STRING", "description" => "Deuxième proposition d'appréciation."],
                "v3" => ["type" => "STRING", "description" => "Troisième proposition d'appréciation."]
            ],
            "required" => ["v1", "v2", "v3"]
        ]
    ]
];

// 5. Appel cURL à l'API Gemini
// Nous utilisons gemini-2.5-flash qui est le modèle recommandé, rapide et économique.
$url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" . urlencode($apiKey);

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($requestBody));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Content-Type: application/json"
]);

// Désactiver la vérification SSL si le serveur de l'hébergeur a des soucis de certificats CA locaux
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

if (curl_errno($ch)) {
    $error_msg = curl_error($ch);
    http_response_code(500);
    echo json_encode([
        "error" => "Erreur cURL lors de l'appel à l'API Gemini : " . $error_msg
    ]);
    curl_close($ch);
    exit;
}

curl_close($ch);

if ($httpCode !== 200) {
    http_response_code($httpCode);
    $errorData = json_decode($response, true);
    echo json_encode([
        "error" => "L'API Gemini a retourné une erreur (Code $httpCode)",
        "details" => $errorData
    ]);
    exit;
}

// 6. Extraction et renvoi de la réponse JSON structurée
$responseDecoded = json_decode($response, true);
if (isset($responseDecoded['candidates'][0]['content']['parts'][0]['text'])) {
    $geminiJsonText = $responseDecoded['candidates'][0]['content']['parts'][0]['text'];
    // Renvoyer directement le JSON retourné par Gemini
    echo $geminiJsonText;
} else {
    http_response_code(500);
    echo json_encode([
        "error" => "Format de réponse inattendu de l'API Gemini.",
        "raw_response" => $responseDecoded
    ]);
}
