<?php
/**
 * Client Helper PocketBase pour l'application apprecIAtion
 */

function pb_get_env() {
    static $env = null;
    if ($env !== null) {
        return $env;
    }

    $env = [];

    $docRoot = isset($_SERVER['DOCUMENT_ROOT']) ? $_SERVER['DOCUMENT_ROOT'] : '';
    $scriptDir = isset($_SERVER['SCRIPT_FILENAME']) ? dirname($_SERVER['SCRIPT_FILENAME']) : '';
    $parentDocRoot = !empty($docRoot) ? dirname($docRoot) : '';
    $parentScriptDir = !empty($scriptDir) ? dirname($scriptDir) : '';
    $cwd = getcwd();
    $parentCwd = !empty($cwd) ? dirname($cwd) : '';

    $envFiles = array_unique(array_filter([
        __DIR__ . '/.env',
        __DIR__ . '/includes/.env',
        __DIR__ . '/../includes/.env',
        __DIR__ . '/../.env',
        __DIR__ . '/../../includes/.env',
        $parentDocRoot . '/includes/.env',
        $parentDocRoot . '/.env',
        $parentScriptDir . '/includes/.env',
        $parentScriptDir . '/.env',
        $parentCwd . '/includes/.env',
        $parentCwd . '/.env',
        $docRoot . '/includes/.env',
        $docRoot . '/.env',
        $docRoot . '/../includes/.env',
        $scriptDir . '/includes/.env',
        $scriptDir . '/.env',
        $cwd . '/includes/.env',
        $cwd . '/.env',
    ]));

    foreach ($envFiles as $file) {
        if (file_exists($file) && is_readable($file)) {
            $lines = file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                // Suppression du BOM UTF-8 (\xEF\xBB\xBF) s'il existe
                $line = preg_replace('/^\xEF\xBB\xBF/', '', trim($line));
                if (empty($line) || strpos($line, '#') === 0 || strpos($line, ';') === 0) continue;
                
                // Supprimer les commentaires en fin de ligne
                if (($hashPos = strpos($line, ' #')) !== false) {
                    $line = trim(substr($line, 0, $hashPos));
                }

                $parts = explode('=', $line, 2);
                if (count($parts) === 2) {
                    $key = trim($parts[0]);
                    // Nettoyage strict du nom de la clé (BOM ou caractères non imprimables)
                    $key = preg_replace('/[^a-zA-Z0-9_\-]/', '', $key);
                    $val = trim($parts[1], "\"' \t\r\n\0\x0B");
                    if (!empty($key) && (!isset($env[$key]) || $env[$key] === '')) {
                        $env[$key] = $val;
                    }
                }
            }
        }
    }
    return $env;
}

if (!function_exists('get_admin_config_var')) {
    function get_admin_config_var($varName, $default = '') {
        $cleanTarget = preg_replace('/[^a-zA-Z0-9]/', '', strtolower($varName));

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
            $cleanK = preg_replace('/[^a-zA-Z0-9]/', '', strtolower($k));
            if ($cleanK === $cleanTarget && trim((string)$val) !== '') {
                return trim((string)$val);
            }
        }

        return $default;
    }
}

if (!function_exists('get_admin_expiration_config')) {
    function get_admin_expiration_config() {
        return get_admin_config_var('expiration', '');
    }
}

function pb_request($method, $path, $data = null) {
    $env = pb_get_env();
    $baseUrl = isset($env['POCKETBASE_URL']) && !empty($env['POCKETBASE_URL']) 
        ? rtrim($env['POCKETBASE_URL'], '/') 
        : 'https://pb.appreciation.fr';
    
    $url = $baseUrl . $path;

    static $adminToken = null;

    if ($adminToken === null && !empty($env['PB_ADMIN_EMAIL']) && !empty($env['PB_ADMIN_PASSWORD'])) {
        $authBody = json_encode(['identity' => $env['PB_ADMIN_EMAIL'], 'password' => $env['PB_ADMIN_PASSWORD']]);
        
        // Try PB v0.22+ superusers
        $ch = curl_init($baseUrl . '/api/collections/_superusers/auth-with-password');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $authBody);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_TIMEOUT, 5);
        $res = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($code >= 200 && $code < 300) {
            $json = json_decode($res, true);
            $adminToken = isset($json['token']) ? $json['token'] : null;
        } else {
            // Try PB v0.8-0.21 admins
            $ch = curl_init($baseUrl . '/api/admins/auth-with-password');
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $authBody);
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
            curl_setopt($ch, CURLOPT_TIMEOUT, 5);
            $res = curl_exec($ch);
            $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            if ($code >= 200 && $code < 300) {
                $json = json_decode($res, true);
                $adminToken = isset($json['token']) ? $json['token'] : null;
            }
        }
    }

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, strtoupper($method));
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);

    $headers = ['Content-Type: application/json'];
    if ($adminToken) {
        $headers[] = 'Authorization: ' . $adminToken;
    }

    if ($data !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    }

    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlErr = curl_error($ch);
    curl_close($ch);

    if ($response === false) {
        return [
            'status' => 500,
            'body' => ['error' => 'Erreur cURL : ' . $curlErr]
        ];
    }

    return [
        'status' => $httpCode,
        'body' => json_decode($response, true)
    ];
}
