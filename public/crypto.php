<?php
/**
 * Module PHP de Chiffrement / Déchiffrement AES-256-GCM
 * Conforme au RGPD Art. 32 et 100% compatible avec Node.js (crypto aes-256-gcm).
 */

function get_master_encryption_key() {
    $secret = null;

    if (function_exists('get_admin_config_var')) {
        $secret = get_admin_config_var('ENCRYPTION_SECRET_KEY', '');
    }

    // Fallback direct env search
    if (empty($secret)) {
        if (getenv('ENCRYPTION_SECRET_KEY')) {
            $secret = getenv('ENCRYPTION_SECRET_KEY');
        } elseif (isset($_ENV['ENCRYPTION_SECRET_KEY']) && $_ENV['ENCRYPTION_SECRET_KEY']) {
            $secret = $_ENV['ENCRYPTION_SECRET_KEY'];
        } elseif (isset($_SERVER['ENCRYPTION_SECRET_KEY']) && $_SERVER['ENCRYPTION_SECRET_KEY']) {
            $secret = $_SERVER['ENCRYPTION_SECRET_KEY'];
        }
    }

    // 2. Recherche dans les fichiers .env (dossier courant, parent, includes)
    if (empty($secret)) {
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
                $lines = file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
                foreach ($lines as $line) {
                    $line = trim($line);
                    if (empty($line) || strpos($line, '#') === 0 || strpos($line, ';') === 0) continue;
                    $parts = explode('=', $line, 2);
                    if (count($parts) === 2 && strcasecmp(trim($parts[0]), 'ENCRYPTION_SECRET_KEY') === 0) {
                        $secret = trim(trim($parts[1]), '"\'');
                        if (!empty($secret)) break 2;
                    }
                }
            }
        }
    }

    // 3. Clé secrète de secours si non définie
    if (!$secret) {
        $secret = "appreciation_master_aes256_secret_key_2026";
    }

    // Hachage SHA-256 pour garantir une clé binaire exacte de 256 bits (32 octets)
    return hash('sha256', trim($secret), true);
}

/**
 * Chiffre une chaîne en AES-256-GCM.
 * Format retourné : enc_gcm:{iv_hex}:{authTag_hex}:{ciphertext_hex}
 */
function encrypt_api_key($plainText) {
    if (empty($plainText) || !is_string($plainText)) return "";
    $trimmed = trim($plainText);
    if (empty($trimmed)) return "";
    if (strpos($trimmed, "enc_gcm:") === 0) return $trimmed; // Déjà chiffré

    $key = get_master_encryption_key();
    $iv = openssl_random_pseudo_bytes(12); // 96 bits pour AES-256-GCM
    $tag = "";

    $ciphertext = openssl_encrypt(
        $trimmed,
        'aes-256-gcm',
        $key,
        OPENSSL_RAW_DATA,
        $iv,
        $tag,
        "",
        16 // Longueur du tag d'authentification : 16 octets
    );

    if ($ciphertext === false) return "";

    return "enc_gcm:" . bin2hex($iv) . ":" . bin2hex($tag) . ":" . bin2hex($ciphertext);
}

/**
 * Déchiffre une chaîne chiffrée au format enc_gcm:{iv_hex}:{authTag_hex}:{ciphertext_hex}.
 */
function decrypt_api_key($cipherText) {
    if (empty($cipherText) || !is_string($cipherText)) return "";
    $trimmed = trim($cipherText);
    if (empty($trimmed)) return "";
    if (strpos($trimmed, "enc_gcm:") !== 0) return $trimmed; // Clé en clair (rétro-compatibilité)

    $parts = explode(":", $trimmed);
    if (count($parts) !== 4) return $trimmed;

    $iv = @hex2bin($parts[1]);
    $tag = @hex2bin($parts[2]);
    $ciphertext = @hex2bin($parts[3]);

    if ($iv === false || $tag === false || $ciphertext === false) return "";

    $key = get_master_encryption_key();

    $decrypted = openssl_decrypt(
        $ciphertext,
        'aes-256-gcm',
        $key,
        OPENSSL_RAW_DATA,
        $iv,
        $tag
    );

    if ($decrypted === false) return "";

    return $decrypted;
}
