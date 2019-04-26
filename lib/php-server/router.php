<?php
// FIXME: arquivos com espaços não são renderizados
// o que é:
// Atividade%201/Minha%20Primeira%20Pagina%20HTML.html
// sai como:
// Atividade+1%2FMinha+Primeira+Pagina+HTML.html
// E mesmo correto, não renderiza com o `router`

$URI = urldecode($_SERVER['REQUEST_URI']);

$f = preg_replace('/\/$/', '', $_SERVER['DOCUMENT_ROOT'] . "{$URI}");
if (!is_dir($f)) return false;

/**
* Builds a file path with the appropriate directory separator.
* @param string $segments,... unlimited number of path segments
* @return string Path
*/
function file_build_path(...$segments) {
  return join(DIRECTORY_SEPARATOR, $segments);
}

$bootstrap_files = [
  file_build_path($f, 'index.html'),
  file_build_path($f, 'index.php'),
];

foreach ($bootstrap_files as $bf) {
  if (is_readable($bf)) {
    return false;
  }
}


if ($URI != '/' && $URI != '//')
  echo "<a href='" . urlencode(dirname($URI)) . "'>..</a><br>";

$abf = preg_replace('/^\/+|\/$/', '', $URI);
$fs = glob("$f/*");
foreach ($fs as $one) {
  $one = str_replace($f.'/', '', $one);
  $encoded_path = preg_replace('/^\/+/', '', "$abf/$one");

  echo "<a href='" . urlencode($encoded_path) . "'>$one</a><br/>";
}

return true;

?>
