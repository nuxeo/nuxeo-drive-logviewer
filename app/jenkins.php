<?php
$url = "http://qa.nuxeo.org/jenkins/view/Drive/job/master/job/FT-nuxeo-drive-master-";

$build = "lastFailedBuild";
if (isset($_GET["build"]) && $_GET["build"] > 0) {
  $build = $_GET["build"];
}
$_GET["os"]=strtolower($_GET["os"]);
if (!in_array($_GET["os"], array("windows", "osx", "linux"))) {
  die();
}

$url .= $_GET["os"] . "/".$build."/consoleText";
echo(file_get_contents($url));
?>

