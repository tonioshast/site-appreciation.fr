<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

if (file_exists(__DIR__ . '/pocketbase.php')) {
    require_once __DIR__ . '/pocketbase.php';
} elseif (file_exists(__DIR__ . '/includes/pocketbase.php')) {
    require_once __DIR__ . '/includes/pocketbase.php';
} elseif (file_exists(__DIR__ . '/../includes/pocketbase.php')) {
    require_once __DIR__ . '/../includes/pocketbase.php';
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

echo json_encode([
    'expiration' => get_admin_config_var('expiration', ''),
    'pack1' => get_admin_config_var('pack1', '19.90'),
    'pack2' => get_admin_config_var('pack2', '29.90'),
], JSON_UNESCAPED_UNICODE);
