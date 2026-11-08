<?php
// Configuration des en-têtes CORS
header("Content-Type: application/json; charset=UTF-8");
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '*';
header("Access-Control-Allow-Origin: " . $origin);
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

if (!function_exists('get_admin_config_var')) {
    function get_admin_config_var($varName, $default = '') {
        $aliases = [
            $varName,
            strtoupper($varName),
            strtolower($varName),
            str_replace('_', '', strtolower($varName)),
            str_replace('_', '', strtoupper($varName)),
        ];

        foreach ($aliases as $v) {
            $val = getenv($v);
            if ($val !== false && trim((string)$val) !== '') return trim((string)$val);
            if (isset($_ENV[$v]) && trim((string)$_ENV[$v]) !== '') return trim((string)$_ENV[$v]);
            if (isset($_SERVER[$v]) && trim((string)$_SERVER[$v]) !== '') return trim((string)$_SERVER[$v]);
        }

        $pbEnv = pb_get_env();
        foreach ($pbEnv as $k => $val) {
            foreach ($aliases as $v) {
                if (strcasecmp($k, $v) === 0 && trim((string)$val) !== '') {
                    return trim((string)$val);
                }
            }
        }

        return $default;
    }
}

// 1. Lecture des variables d'environnement
$env = pb_get_env();

$stripe_secret_key = get_admin_config_var('STRIPE_SECRET_KEY', '');

if (empty($stripe_secret_key)) {
    // Clé test par défaut fournie par l'utilisateur
    $stripe_secret_key = 'sk_test_51TqffsC1Rw1T3tl8KQHgpkm7IDgIIKBp6X9eVmHuFEB93RL1kR1GuAoFnlxMaNF43B8pWusjjHy6e1ygn3iTi5ef00dZdu5U5P';
}

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
$plan_name = isset($data['plan_name']) ? trim($data['plan_name']) : null;
$email = isset($data['email']) ? trim($data['email']) : '';
$prenom = isset($data['prenom']) ? trim($data['prenom']) : '';
$nom = isset($data['nom']) ? trim($data['nom']) : '';
$systeme_exploitation = isset($data['systeme_exploitation']) ? trim($data['systeme_exploitation']) : '';
$ent = isset($data['ent']) ? trim($data['ent']) : '';
$etablissement = isset($data['etablissement']) ? trim($data['etablissement']) : '';
$identifiant_prof = isset($data['identifiant_prof']) ? trim($data['identifiant_prof']) : '';
$mdp = isset($data['mdp']) ? trim($data['mdp']) : '';

if (empty($id_unique) || empty($plan_name)) {
    http_response_code(400);
    echo json_encode(["error" => "L'identifiant unique et le nom du plan sont requis."]);
    exit;
}

if (!empty($email)) {
    $emailKey = strtolower(trim($email));
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
}

// Détermination du montant en centimes d'euros depuis pack1 et pack2 dans le .env
$p1Val = str_replace(',', '.', get_admin_config_var('pack1', '19.90'));
$p2Val = str_replace(',', '.', get_admin_config_var('pack2', '29.90'));

$pack1Cents = (int) round(((float) $p1Val) * 100);
$pack2Cents = (int) round(((float) $p2Val) * 100);

if ($pack1Cents <= 0) $pack1Cents = 1990;
if ($pack2Cents <= 0) $pack2Cents = 2990;

$amount = $pack1Cents;
if (strpos(strtolower($plan_name), 'principal') !== false || strpos(strtolower($plan_name), 'pp') !== false) {
    $amount = $pack2Cents;
}

// Récupération dynamique de l'origine de la page pour construire les liens de retour
$protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || $_SERVER['SERVER_PORT'] == 443) ? "https://" : "http://";
$domainName = $_SERVER['HTTP_HOST'];
$origin = $protocol . $domainName;

// Création de la session Stripe Checkout via l'API REST de Stripe
$ch = curl_init();

curl_setopt($ch, CURLOPT_URL, 'https://api.stripe.com/v1/checkout/sessions');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_POST, 1);

$packva = (strpos(strtolower($plan_name), 'principal') !== false || strpos(strtolower($plan_name), 'pp') !== false) ? 2 : 1;
$success_url = $origin . '/?status=success&id_unique=' . $id_unique . '&plan=' . urlencode($plan_name) . '&pack=' . $packva . '&packva=' . $packva . '&email=' . urlencode($email) . '&prenom=' . urlencode($prenom) . '&nom=' . urlencode($nom) . '&os=' . urlencode($systeme_exploitation) . '&ent=' . urlencode($ent) . '&school=' . urlencode($etablissement) . '&identifiant_prof=' . urlencode($identifiant_prof) . '&mdp=' . urlencode($mdp);
$cancel_url = $origin . '/?status=cancel';

$post_fields = [
    'mode' => 'payment',
    'client_reference_id' => $id_unique,
    'success_url' => $success_url,
    'cancel_url' => $cancel_url,
    'line_items[0][price_data][currency]' => 'eur',
    'line_items[0][price_data][product_data][name]' => $plan_name,
    'line_items[0][price_data][product_data][description]' => "Licence d'utilisation d'1 an pour le logiciel apprecIAtion",
    'line_items[0][price_data][unit_amount]' => $amount,
    'line_items[0][quantity]' => 1,
    'metadata[id_unique]' => $id_unique,
    'metadata[plan_name]' => $plan_name,
    'metadata[email]' => $email,
    'metadata[prenom]' => $prenom,
    'metadata[nom]' => $nom,
    'metadata[systeme_exploitation]' => $systeme_exploitation,
    'metadata[ent]' => $ent,
    'metadata[etablissement]' => $etablissement,
    'metadata[identifiant_prof]' => $identifiant_prof,
    'metadata[mdp]' => $mdp,
];

if (!empty($email)) {
    $post_fields['customer_email'] = $email;
}

curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($post_fields));
curl_setopt($ch, CURLOPT_USERPWD, $stripe_secret_key . ':');

$headers = [];
$headers[] = 'Content-Type: application/x-www-form-urlencoded';
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

$result = curl_exec($ch);

if (curl_errno($ch)) {
    http_response_code(500);
    echo json_encode(["error" => "Erreur de communication Stripe (cURL) : " . curl_error($ch)]);
    curl_close($ch);
    exit;
}

$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$response_data = json_decode($result, true);

if ($http_code !== 200) {
    http_response_code($http_code);
    echo json_encode([
        "error" => isset($response_data['error']['message']) ? $response_data['error']['message'] : "Erreur lors de l'appel à l'API Stripe.",
        "stripe_response" => $response_data
    ]);
    exit;
}

echo json_encode([
    "id" => $response_data['id'],
    "url" => $response_data['url']
]);
