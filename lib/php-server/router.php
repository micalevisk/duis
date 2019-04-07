<?php

$URI = urldecode($_SERVER['REQUEST_URI']);

$f = preg_replace('/\/$/', '', $_SERVER['DOCUMENT_ROOT'] . "{$URI}");
if (!is_dir($f)) return false;

if ($URI != '/' && $URI != '//')
  echo "<a href='" . urlencode(dirname($URI)) . "'>..</a><br>";

$abf = preg_replace('/^\/+|\/$/', '', $URI);
$fs = glob("$f/*");
foreach ($fs as $one) {
  // FIXME: não renderiza o `index`
  // if (preg_match('/^index\./i', basename($one))) {
  //   header('Location: '.$f);
  // }

  $one = str_replace($f.'/', '', $one);
  echo "<a href='" . urlencode("$abf/$one") . "'>$one</a><br/>";
}

return true;

?>
