<?php
// Configuration des en-têtes CORS
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

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => "Méthode non autorisée."]);
    exit;
}

$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data || empty($data['email']) || empty($data['code'])) {
    http_response_code(400);
    echo json_encode(["error" => "L'adresse e-mail et le code de vérification sont obligatoires."]);
    exit;
}

$email = strtolower(trim($data['email']));
$code = trim((string)$data['code']);

try {
    $isValid = false;

    // 1. Vérification dans le fichier JSON local
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
    if (file_exists($jsonFile)) {
        $raw = @file_get_contents($jsonFile);
        if ($raw) {
            $codesData = json_decode($raw, true) ?: [];
            if (isset($codesData[$email])) {
                $info = $codesData[$email];
                if (isset($info['code'], $info['expiresAt'])) {
                    if (trim((string)$info['code']) === $code && time() <= $info['expiresAt']) {
                        $isValid = true;
                        unset($codesData[$email]);
                        @file_put_contents($jsonFile, json_encode($codesData), LOCK_EX);
                    }
                }
            }
        }
    }

    // 2. Si pas trouvé en local, vérifier dans PocketBase
    if (!$isValid) {
        try {
            $filter = 'email="' . addslashes($email) . '" && code="' . addslashes($code) . '"';
            $search = pb_request('GET', '/api/collections/verification_codes/records?filter=' . rawurlencode($filter));

            if (isset($search['body']['items']) && count($search['body']['items']) > 0) {
                foreach ($search['body']['items'] as $item) {
                    if (trim((string)$item['code']) === $code) {
                        $isValid = true;
                        pb_request('DELETE', '/api/collections/verification_codes/records/' . $item['id']);
                        break;
                    }
                }
            }
        } catch (Exception $pbErr) {
            // Ignorer l'erreur PocketBase si la collection n'existe pas encore
        }
    }

    if ($isValid) {
        echo json_encode(["success" => true, "message" => "Adresse e-mail vérifiée avec succès."]);
    } else {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Code de vérification incorrect ou expiré (durée de validité : 15 minutes)."]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => "Erreur PocketBase : " . $e->getMessage()]);
}

